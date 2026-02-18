from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from app.core.database import db
from app.core.security import get_current_user
from app.services.ai_service import analyze_resume_and_jd
from app.core.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/interviews", tags=["Interview AI"])

@router.post("/{interview_id}/setup-ai")
async def setup_ai(
    interview_id: str,
    current_user=Depends(get_current_user)
):
    print("[Backend 🎤] Interview AI: Setup-ai pe aaye – interview_id =", interview_id)
    logger.info("Starting AI setup for interview_id=%s", interview_id)

    session = await db.interview_sessions.find_one({
        "_id": ObjectId(interview_id),
        "user_id": str(current_user["_id"])
    })

    if not session:
        print("[Backend 🎤] Interview AI: Session nahi mila – 404!")
        logger.warning("Interview not found or unauthorized")
        raise HTTPException(status_code=404, detail="Interview not found")

    if session["status"] == "questions_generated":
        print("[Backend 🎤] Interview AI: Pehle hi ho chuka hai – dobara mat bulao!")
        logger.warning("AI setup already completed for interview_id=%s", interview_id)
        raise HTTPException(status_code=400, detail="AI setup already completed")

    try:
        resume_text = session["resume"]["extracted_text"]
        print("[Backend 🎤] Interview AI: Resume + JD AI ko bhej rahe hain – questions maang rahe hain!")

        ai_result = analyze_resume_and_jd(
            resume_text,
            session["job_description"]
        )
        print("[Backend 🎤] Interview AI: AI ne jawab de diya – match_score, strengths, gaps, questions aaye!")

        await db.interview_sessions.update_one(
            {"_id": ObjectId(interview_id)},
            {"$set": {
                "ai_context": {
                    "match_score": ai_result["match_score"],
                    "strengths": ai_result["strengths"],
                    "gaps": ai_result["gaps"]
                },
                "status": "questions_generated"
            }}
        )
        print("[Backend 🎤] Interview AI: Session update – status = questions_generated")

        await db.interview_questions.delete_many({"session_id": interview_id})
        print("[Backend 🎤] Interview AI: Purane questions hata ke naye daal rahe hain...")

        for idx, q in enumerate(ai_result["questions"]):
            await db.interview_questions.insert_one({
                "session_id": interview_id,
                "order": idx + 1,
                "question_text": q,
                "kind": "base",
                "parent_question_id": None,
                "depth": 0,
                "created_by": "ai"
            })
        print("[Backend 🎤] Interview AI: Saare questions DB mein save – count =", len(ai_result["questions"]))

        logger.info("AI setup completed successfully for interview_id=%s", interview_id)
        print("[Backend 🎤] Interview AI: Setup-ai complete – frontend ko bhejo!")
        return {
            "message": "AI setup completed",
            "questions_count": len(ai_result["questions"])
        }

    except Exception:
        print("[Backend 🎤] Interview AI: AI setup fail – kuch toot gaya!")
        logger.exception("AI setup failed for interview_id=%s", interview_id)
        raise HTTPException(status_code=500, detail="AI setup failed")
