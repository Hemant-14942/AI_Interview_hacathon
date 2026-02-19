from datetime import datetime

from bson import ObjectId

import requests
import os


from app.core.database_sync import get_sync_db
from app.core.logger import get_logger
from app.services.ai_service import generate_followup_question
from app.services.scoring_service import score_answer
from app.services.video_analysis_service import analyze_emotion, extract_audio, transcribe_audio

logger = get_logger(__name__)

# Simple gates (tune later)
MIN_TRANSCRIPT_WORDS = 30
ACCURACY_FOLLOWUP_BELOW = 60
COMM_FOLLOWUP_BELOW = 55


def _should_attempt_followup(transcript: str, score: dict) -> bool:
    words = len((transcript or "").strip().split())
    accuracy = float(score.get("accuracy", 0) or 0)
    communication = float(score.get("communication", 0) or 0)

    if words < MIN_TRANSCRIPT_WORDS:
        return True
    if accuracy < ACCURACY_FOLLOWUP_BELOW:
        return True
    if communication < COMM_FOLLOWUP_BELOW:
        return True
    return False


def process_answer_pipeline(interview_id: str, question_id: str, video_url: str):
    """
    FULL BACKGROUND PIPELINE
    video -> audio -> transcript -> emotion -> scoring -> (optional follow-up insert)
    """
    print("[Backend 🎤] BackgroundJob: Pipeline shuru – interview =", interview_id, "question =", question_id)
    logger.info("BG JOB STARTED | interview=%s | question=%s", interview_id, question_id)

    db = get_sync_db()

    # Mark as processing immediately so frontend polling doesn't advance too early.
    # IMPORTANT: We only set status="completed" AFTER follow-up insertion attempt finishes.
    db.interview_answers.update_one(
        {"session_id": interview_id, "question_id": question_id},
        {"$set": {"status": "processing", "processing_started_at": datetime.utcnow()}},
    )

    # 🔽 Step 0: Download video from Cloudinary temporarily
    temp_video_path = f"uploads/temp_{question_id}.mp4"

    try:
        response = requests.get(video_url)
        with open(temp_video_path, "wb") as f:
            f.write(response.content)
    except Exception as e:
        raise Exception(f"Failed to download video from Cloudinary: {str(e)}")
    
    try:
        # 1️⃣ Extract audio
        audio_path = f"uploads/audio/{question_id}.wav"
        print("[Backend 🎤] BackgroundJob: Step 1 – video se audio nikal rahe hain!")
        extract_audio(temp_video_path, audio_path)

        # 2️⃣ Transcribe audio
        print("[Backend 🎤] BackgroundJob: Step 2 – Whisper se transcript!")
        transcript = transcribe_audio(audio_path)

        if os.path.exists(audio_path):
            os.remove(audio_path)  # clean up audio file

        # 3️⃣ Emotion analysis
        print("[Backend 🎤] BackgroundJob: Step 3 – DeepFace se emotion!")
        emotion, confidence = analyze_emotion(temp_video_path)

        # 4️⃣ Fetch question
        question = db.interview_questions.find_one({"_id": ObjectId(question_id)})
        if not question:
            print("[Backend 🎤] BackgroundJob: Question nahi mila – toot gaya!")
            raise Exception("Question not found")

        print("[Backend 🎤] BackgroundJob: Step 4 – question mil gaya, ab score maangenge!")

        # 5️⃣ Score answer
        score = score_answer(
            question["question_text"],
            transcript,
            emotion,
            confidence,
        )
        print("[Backend 🎤] BackgroundJob: Step 5 – GPT ne score de diya!")

        # 6️⃣ Save transcript/emotion/score (keep status=processing for now)
        db.interview_answers.update_one(
            {"session_id": interview_id, "question_id": question_id},
            {
                "$set": {
                    "transcript": transcript,
                    "emotion": emotion,
                    "confidence": confidence,
                    "score": {
                        "accuracy": score["accuracy"],
                        "communication": score["communication"],
                        "behavior": score["behavior"],
                    },
                    "feedback": score["feedback"],
                    "processed_at": datetime.utcnow(),
                }
            },
        )

        # 7️⃣ OPTIONAL: Generate + insert ONE follow-up (Option A)
        try:
            q_kind = question.get("kind", "base")
            q_depth = int(question.get("depth", 0) or 0)

            # never follow-up a follow-up
            if q_kind == "followup" or q_depth >= 1:
                raise RuntimeError("Skip follow-up: current question already followup/depth>=1")

            # enforce max 1 follow-up per base question
            existing_fu = db.interview_questions.find_one(
                {
                    "session_id": interview_id,
                    "kind": "followup",
                    "parent_question_id": question_id,
                }
            )
            if existing_fu:
                raise RuntimeError("Skip follow-up: already exists for parent")

            # only attempt follow-up when needed (cost control)
            if not _should_attempt_followup(transcript, score):
                raise RuntimeError("Skip follow-up: gate says not needed")

            session = db.interview_sessions.find_one({"_id": ObjectId(interview_id)})
            jd_text = (session or {}).get("job_description", "") if session else ""
            gaps = []
            if session and session.get("ai_context") and isinstance(session["ai_context"], dict):
                gaps = session["ai_context"].get("gaps") or []

            fu = generate_followup_question(
                original_question=question["question_text"],
                transcript=transcript,
                score={
                    "accuracy": score["accuracy"],
                    "communication": score["communication"],
                    "behavior": score["behavior"],
                },
                feedback=score.get("feedback", "") or "",
                job_description=jd_text,
                gaps=gaps,
            )

            if not fu.get("should_follow_up"):
                raise RuntimeError("Skip follow-up: model said no")

            follow_up_text = (fu.get("follow_up_question") or "").strip()
            if not follow_up_text:
                raise RuntimeError("Skip follow-up: empty question")

            parent_order = int(question.get("order", 0) or 0)
            if parent_order <= 0:
                raise RuntimeError("Skip follow-up: parent order missing/invalid")

            # Shift later questions down by +1 (insert right after parent)
            db.interview_questions.update_many(
                {"session_id": interview_id, "order": {"$gt": parent_order}},
                {"$inc": {"order": 1}},
            )

            db.interview_questions.insert_one(
                {
                    "session_id": interview_id,
                    "order": parent_order + 1,
                    "question_text": follow_up_text,
                    "kind": "followup",
                    "parent_question_id": question_id,
                    "depth": 1,
                    "created_by": "ai",
                    "created_at": datetime.utcnow(),
                }
            )

            print("[Backend 🎤] BackgroundJob: Follow-up inserted after order", parent_order)
            logger.info("Follow-up inserted | interview=%s | parent_q=%s", interview_id, question_id)

        except Exception as fe:
            # best-effort; do not fail pipeline
            logger.info("Follow-up skipped: %s", str(fe))

        # 8️⃣ Mark answer fully completed only after follow-up step
        db.interview_answers.update_one(
            {"session_id": interview_id, "question_id": question_id},
            {"$set": {"status": "completed", "completed_at": datetime.utcnow()}},
        )

        # 🧹 Clean up temporary file
        if os.path.exists(temp_video_path):
            os.remove(temp_video_path)


        print("[Backend 🎤] BackgroundJob: Pipeline complete! 🎉")
        logger.info("BG JOB COMPLETED | interview=%s | question=%s", interview_id, question_id)

    except Exception as e:
        print("[Backend 🎤] BackgroundJob: Pipeline fail –", str(e), "– answer status = failed!")
        logger.exception("BG JOB FAILED")

        db.interview_answers.update_one(
            {"session_id": interview_id, "question_id": question_id},
            {"$set": {"status": "failed", "error": str(e)}},
        )