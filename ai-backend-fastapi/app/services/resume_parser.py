import fitz  # PyMuPDF
from docx import Document
from app.core.logger import get_logger

logger = get_logger(__name__)

def extract_text_from_resume(file_path: str) -> str:
    print("[Backend 🎤] ResumeParser: Resume padh rahe hain –", file_path)
    logger.info("Parsing resume file: %s", file_path)

    try:
        if file_path.endswith(".pdf"):
            doc = fitz.open(file_path)
            text = "".join(page.get_text() for page in doc)
            print("[Backend 🎤] ResumeParser: PDF se text nikal liya –", len(text), "characters!")
            logger.info("PDF parsed successfully (%d characters)", len(text))
            return text

        if file_path.endswith(".docx"):
            doc = Document(file_path)
            text = "\n".join(p.text for p in doc.paragraphs)
            print("[Backend 🎤] ResumeParser: DOCX se text nikal liya –", len(text), "characters!")
            logger.info("DOCX parsed successfully (%d characters)", len(text))
            return text

        print("[Backend 🎤] ResumeParser: Ye format samajh nahi aaya – PDF/DOCX bhejo!")
        logger.warning("Unsupported resume format: %s", file_path)
        return ""

    except Exception as e:
        print("[Backend 🎤] ResumeParser: Parse karte waqt toot gaya –", str(e))
        logger.exception("Resume parsing failed")
        return ""
