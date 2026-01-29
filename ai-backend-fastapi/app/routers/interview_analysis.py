from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
import os
from datetime import datetime

from app.core.database import db
from app.core.security import get_current_user
from app.services.video_analysis_service import (
    extract_audio,
    transcribe_audio,
    analyze_emotion
)
from app.core.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/interviews", tags=["Interview Analysis"])

AUDIO_DIR = "uploads/audio"
os.makedirs(AUDIO_DIR, exist_ok=True)


@router.post("/{interview_id}/questions/{question_id}/analyze")
async def analyze_answer(
    interview_id: str,
    question_id: str,
    current_user=Depends(get_current_user)
):
    print("[Backend 🎤] Analysis: Analyze maang aaya – interview =", interview_id, "question =", question_id)
    logger.info(
        "Starting analysis | interview_id=%s | question_id=%s",
        interview_id, question_id
    )

    # 1️⃣ Validate interview
    session = await db.interview_sessions.find_one({
        "_id": ObjectId(interview_id),
        "user_id": str(current_user["_id"])
    })
    if not session:
        print("[Backend 🎤] Analysis: Session nahi mila – 404!")
        raise HTTPException(status_code=404, detail="Interview not found")

    # 2️⃣ Get answer record
    answer = await db.interview_answers.find_one({
        "session_id": interview_id,
        "question_id": question_id
    })
    if not answer:
        print("[Backend 🎤] Analysis: Answer record nahi mila – 404!")
        raise HTTPException(status_code=404, detail="Answer not found")

    video_path = answer["video_path"]
    audio_path = os.path.join(
        AUDIO_DIR, f"{question_id}.wav"
    )
    print("[Backend 🎤] Analysis: Video path mil gaya – ab audio + transcript + emotion nikaalenge!")

    try:
        # 3️⃣ Extract & transcribe
        extract_audio(video_path, audio_path)
        print("[Backend 🎤] Analysis: Audio nikal liya – ab Whisper se bol sunenge!")
        transcript = transcribe_audio(audio_path)
        print("[Backend 🎤] Analysis: Transcript aa gaya – ab emotion dekhenge video se!")

        # 4️⃣ Emotion analysis
        emotion, confidence = analyze_emotion(video_path)
        print("[Backend 🎤] Analysis: Emotion bhi mil gaya –", emotion, confidence)

        # 5️⃣ Store results
        await db.interview_answers.update_one(
            {"_id": answer["_id"]},
            {"$set": {
                "transcript": transcript,
                "emotion": emotion,
                "confidence": confidence,
                "analyzed_at": datetime.utcnow()
            }}
        )
        print("[Backend 🎤] Analysis: Sab kuch DB mein save – analysis complete!")

        logger.info("Analysis completed successfully")
        return {
            "message": "Analysis completed",
            "transcript": transcript,
            "emotion": emotion,
            "confidence": confidence
        }

    except Exception:
        print("[Backend 🎤] Analysis: Kuch toot gaya – analysis fail!")
        logger.exception("Analysis failed")
        raise HTTPException(status_code=500, detail="Analysis failed")
