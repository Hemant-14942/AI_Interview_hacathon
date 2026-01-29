from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from bson import ObjectId
import os
import uuid
from datetime import datetime

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

    # 3️⃣ Save video file
    interview_dir = os.path.join(BASE_VIDEO_DIR, f"interview_{interview_id}")
    os.makedirs(interview_dir, exist_ok=True)

    ext = video.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(interview_dir, filename)

    with open(file_path, "wb") as f:
        f.write(await video.read())
    print("[Backend 🎤] Video: File disk pe save ho gaya –", file_path)
    logger.info("Video saved: %s", file_path)

    # 4️⃣ Create answer record
    await db.interview_answers.insert_one({
        "session_id": interview_id,
        "question_id": question_id,
        "video_path": file_path,
        "status": "uploaded",
        "created_at": datetime.utcnow()
    })
    print("[Backend 🎤] Video: Answer record DB mein daal diya – status = uploaded")

    # 5️⃣ 🔥 BACKGROUND TASK
    background_tasks.add_task(
        process_answer_pipeline,
        interview_id,
        question_id,
        file_path
    )
    print("[Backend 🎤] Video: Background pipeline queue mein daal diya – transcript + emotion + score hoga!")
    print("[Backend 🎤] Video: Report tab milega jab ye pipeline complete ho jayega – terminal mein BackgroundJob prints dekh lo!")

    logger.info("Background processing scheduled")
    return {
        "message": "Video uploaded successfully. Processing started."
    }
