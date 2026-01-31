from datetime import datetime
from bson import ObjectId

from app.core.database_sync import get_sync_db
from app.core.logger import get_logger
from app.services.video_analysis_service import (
    extract_audio,
    transcribe_audio,
    analyze_emotion
)
from app.services.scoring_service import score_answer

logger = get_logger(__name__)


def process_answer_pipeline(interview_id: str, question_id: str, video_path: str):
    """
    FULL BACKGROUND PIPELINE
    video -> audio -> transcript -> emotion -> scoring
    """
    print("[Backend 🎤] BackgroundJob: Pipeline shuru – interview =", interview_id, "question =", question_id)
    logger.info(
        "BG JOB STARTED | interview=%s | question=%s",
        interview_id, question_id
    )

    try:
        # 1️⃣ Extract audio
        audio_path = f"uploads/audio/{question_id}.wav"
        print("[Backend 🎤] BackgroundJob: Step 1 – video se audio nikal rahe hain!")
        extract_audio(video_path, audio_path)

        # 2️⃣ Transcribe audio
        print("[Backend 🎤] BackgroundJob: Step 2 – Whisper se transcript!")
        transcript = transcribe_audio(audio_path)

        # 3️⃣ Emotion analysis
        print("[Backend 🎤] BackgroundJob: Step 3 – DeepFace se emotion!")
        emotion, confidence = analyze_emotion(video_path)

        # 4️⃣ Fetch question (sync DB – Motor returns Future in sync context)
        db = get_sync_db()
        question = db.interview_questions.find_one(
            {"_id": ObjectId(question_id)}
        )
        if not question:
            print("[Backend 🎤] BackgroundJob: Question nahi mila – toot gaya!")
            raise Exception("Question not found")
        print("[Backend 🎤] BackgroundJob: Step 4 – question mil gaya, ab score maangenge!")

        # 5️⃣ Score answer
        score = score_answer(
            question["question_text"],
            transcript,
            emotion,
            confidence
        )
        print("[Backend 🎤] BackgroundJob: Step 5 – GPT ne score de diya!")

        # 6️⃣ Save everything (sync DB)
        db.interview_answers.update_one(
            {
                "session_id": interview_id,
                "question_id": question_id
            },
            {"$set": {
                "transcript": transcript,
                "emotion": emotion,
                "confidence": confidence,
                "score": {
                    "accuracy": score["accuracy"],
                    "communication": score["communication"],
                    "behavior": score["behavior"]
                },
                "feedback": score["feedback"],
                "status": "completed",
                "processed_at": datetime.utcnow()
            }}
        )
        print("[Backend 🎤] BackgroundJob: Step 6 – sab DB mein save, pipeline complete! 🎉")
        print("[Backend 🎤] BackgroundJob: Is question ka score DB mein aa chuka hai – ab report API hit karo to ye question report mein dikhega! interview_id =", interview_id)
        logger.info(
            "BG JOB COMPLETED | interview=%s | question=%s",
            interview_id, question_id
        )

    except Exception as e:
        print("[Backend 🎤] BackgroundJob: Pipeline fail –", str(e), "– answer status = failed! Report mein ye question nahi aayega.")
        logger.exception("BG JOB FAILED")

        db = get_sync_db()
        db.interview_answers.update_one(
            {
                "session_id": interview_id,
                "question_id": question_id
            },
            {"$set": {
                "status": "failed",
                "error": str(e)
            }}
        )
