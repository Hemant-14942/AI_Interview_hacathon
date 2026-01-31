from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from app.core.database import db
from app.core.security import get_current_user
from app.services.report_service import generate_final_report
from app.core.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/interviews", tags=["Interview Report"])


@router.get("/{interview_id}/report")
async def get_interview_report(
    interview_id: str,
    current_user=Depends(get_current_user)
):
    print("[Backend 🎤] Report: Report maang aaya – interview_id =", interview_id)
    logger.info("Fetching interview report | interview_id=%s", interview_id)

    session = await db.interview_sessions.find_one({
        "_id": ObjectId(interview_id),
        "user_id": str(current_user["_id"])
    })

    if not session:
        print("[Backend 🎤] Report: Session nahi mila – 404!")
        raise HTTPException(status_code=404, detail="Interview not found")

    answers = await db.interview_answers.find({
        "session_id": interview_id
    }).to_list(length=100)

    questions = await db.interview_questions.find(
        {"session_id": interview_id}
    ).sort("order", 1).to_list(length=100)
    print("[Backend 🎤] Report: Session + answers + questions mil gaye – answers =", len(answers), "questions =", len(questions), "– ab report banayenge!")

    report = generate_final_report(session, answers, questions)
    print("[Backend 🎤] Report: Report ready – decision/scores/summary – frontend ko bhej rahe hain!")
    return report
