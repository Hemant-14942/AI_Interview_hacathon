from datetime import datetime

from bson import ObjectId

import requests
import os


from app.core.database_sync import get_sync_db
from app.core.logger import get_logger
from app.services.scoring_service import score_answer
from app.services.video_analysis_service import analyze_emotion, extract_audio, transcribe_audio

logger = get_logger(__name__)


def process_answer_pipeline(interview_id: str, question_id: str, video_url: str):
    """
    FULL BACKGROUND PIPELINE
    video -> audio -> transcript -> emotion -> scoring
    """
    print("[Backend 🎤] BackgroundJob: Pipeline shuru – interview =", interview_id, "question =", question_id)
    logger.info("BG JOB STARTED | interview=%s | question=%s", interview_id, question_id)

    db = get_sync_db()

    # Mark as processing immediately so downstream status/report APIs can see work started.
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

        # 6️⃣ Save transcript/emotion/score
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

        # 7️⃣ Mark answer fully completed
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