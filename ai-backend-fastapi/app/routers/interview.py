from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from app.core.security import get_current_user
from app.core.database import db
from app.services.resume_parser import extract_text_from_resume
from app.core.logger import get_logger
import os
import uuid

logger = get_logger(__name__)

router = APIRouter(prefix="/interviews", tags=["Interviews"])

UPLOAD_DIR = "uploads/resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/create")
async def create_interview(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
    current_user=Depends(get_current_user)
):
    print("[Backend 🎤] Interview: Create pe aaye – resume + JD le rahe hain, user_id =", current_user["_id"])
    logger.info("Creating interview for user_id=%s", current_user["_id"])

    try:
        file_ext = resume.filename.split(".")[-1]
        file_name = f"{uuid.uuid4()}.{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, file_name)

        print("[Backend 🎤] Interview: Resume file save kar rahe hain –", file_path)
        logger.info("Saving resume file: %s", file_path)

        with open(file_path, "wb") as f:
            f.write(await resume.read())
        print("[Backend 🎤] Interview: File disk pe aa gaya – ab text nikaalenge!")

        logger.info("Extracting resume text")
        extracted_text = extract_text_from_resume(file_path)

        if not extracted_text.strip():
            print("[Backend 🎤] Interview: Arre resume se text nahi nikla – empty!")
            logger.warning("Resume text extraction returned empty text")

        session = {
            "user_id": str(current_user["_id"]),
            "status": "created",
            "resume": {
                "original_name": resume.filename,
                "file_path": file_path,
                "extracted_text": extracted_text
            },
            "job_description": job_description,
            "ai_context": None
        }

        print("[Backend 🎤] Interview: Session object bana ke DB mein daal rahe hain...")
        result = await db.interview_sessions.insert_one(session)

        print("[Backend 🎤] Interview: Interview create ho gaya! interview_id =", result.inserted_id)
        logger.info("Interview created successfully: interview_id=%s", result.inserted_id)

        return {
            "interview_id": str(result.inserted_id),
            "status": "created"
        }

    except Exception as e:
        print("[Backend 🎤] Interview: Create mein kuch toot gaya –", str(e))
        logger.exception("Failed to create interview")
        raise HTTPException(status_code=500, detail="Failed to create interview")
