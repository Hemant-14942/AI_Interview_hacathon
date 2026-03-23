from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from bson import ObjectId
import os
import uuid
from datetime import datetime
import cloudinary
import cloudinary.uploader

from app.core.database import db
from app.core.security import get_current_user
from app.core.logger import get_logger
from app.services.background_jobs import process_answer_pipeline

logger = get_logger(__name__)

router = APIRouter(prefix="/interviews", tags=["Interview Video"])

BASE_VIDEO_DIR = "uploads/videos"
os.makedirs(BASE_VIDEO_DIR, exist_ok=True)


@router.post("/{interview_id}/questions/{question_id}/upload-video")
async def upload_video(
    background_tasks: BackgroundTasks,
    interview_id: str,
    question_id: str,
    video: UploadFile = File(...),
    current_user=Depends(get_current_user)
):
    print("[Backend 🎤] Video: Upload aaya – interview =", interview_id, "question =", question_id)
    logger.info(
        "VIDEO UPLOAD | interview=%s | question=%s",
        interview_id, question_id
    )

    # 1️⃣ Validate interview ownership
    session = await db.interview_sessions.find_one({
        "_id": ObjectId(interview_id),
        "user_id": str(current_user["_id"])
    })
    if not session:
        print("[Backend 🎤] Video: Session nahi mila – 404!")
        raise HTTPException(status_code=404, detail="Interview not found")
    print("[Backend 🎤] Video: Session mil gaya – ab question check!")

    # 2️⃣ Validate question
    question = await db.interview_questions.find_one({
        "_id": ObjectId(question_id),
        "session_id": interview_id
    })
    if not question:
        print("[Backend 🎤] Video: Question nahi mila – 404!")
        raise HTTPException(status_code=404, detail="Question not found")
    print("[Backend 🎤] Video: Question bhi sahi – ab video file save karenge!")

    # 3️⃣ Upload directly to Cloudinary
    result = cloudinary.uploader.upload(
        video.file,
        resource_type="video",
        folder=f"ai-interview/interviews/{interview_id}"
    )

    video_url = result["secure_url"]
    public_id = result["public_id"]

    print("[Backend 🎤] Video: File disk pe save ho gaya –", video_url)
    logger.info("Video saved: %s", video_url)

    # 4️⃣ Create/update answer record (idempotent for retries)
    await db.interview_answers.update_one(
        {"session_id": interview_id, "question_id": question_id},
        {"$set": {
            "video_path": video_url,
            "video_public_id": public_id,
            "status": "uploaded",
            "created_at": datetime.utcnow()
        }},
        upsert=True
    )
    print("[Backend 🎤] Video: Answer record DB mein daal diya – status = uploaded")

    # 5️⃣ 🔥 BACKGROUND TASK
    background_tasks.add_task(
        process_answer_pipeline,
        interview_id,
        question_id,
        video_url,
    )
    print("[Backend 🎤] Video: Background pipeline queue mein daal diya – transcript + emotion + score hoga!")
    print("[Backend 🎤] Video: Report tab milega jab ye pipeline complete ho jayega – terminal mein BackgroundJob prints dekh lo!")

    logger.info("Background processing scheduled")
    return {
        "message": "Video uploaded successfully. Processing started."
    }
