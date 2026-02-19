import os
import fitz  # PyMuPDF
from docx import Document
from app.core.logger import get_logger

logger = get_logger(__name__)

def extract_text_from_resume(file_path: str) -> str:
    print("[Backend 🎤] ResumeParser: Resume padh rahe hain –", file_path)
    logger.info("Parsing resume file: %s", file_path)
    text = ""
    try:
        if file_path.endswith(".pdf"):
            doc = fitz.open(file_path)
            text = "".join(page.get_text() for page in doc)
            print("[Backend 🎤] ResumeParser: PDF se text nikal liya –", len(text), "characters!")
            logger.info("PDF parsed successfully (%d characters)", len(text))
            

        elif file_path.endswith(".docx"):
            doc = Document(file_path)
            text = "\n".join(p.text for p in doc.paragraphs)
            print("[Backend 🎤] ResumeParser: DOCX se text nikal liya –", len(text), "characters!")
            logger.info("DOCX parsed successfully (%d characters)", len(text))

        else:
             raise ValueError("Unsupported file format. Only PDF and DOCX are supported.")
            
        resume_url = cloudinary.uploader.upload(
            file_path,
            resource_type="raw",
            folder="ai-interview/resumes",
        )
        
        if os.path.exists(file_path):
            os.remove(file_path)  # clean up unsupported file
            print("[Backend 🎤] ResumeParser: Unsupported format tha, file delete kar diya – ",file_path)

        print("[Backend 🎤] ResumeParser: Ye format samajh nahi aaya – PDF/DOCX bhejo!")
        logger.warning("Unsupported resume format: %s", file_path)
        return text

    except Exception as e:
        print("[Backend 🎤] ResumeParser: Parse karte waqt toot gaya –", str(e))
        logger.exception("Resume parsing failed")
        return {
            "error": str(e)
        }
