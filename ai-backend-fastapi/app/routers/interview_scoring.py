from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from app.core.database import db
from app.core.security import get_current_user
from app.services.scoring_service import score_answer
from app.core.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/interviews", tags=["Interview Scoring"])


@router.post("/{interview_id}/questions/{question_id}/score")
async def score_question(
    interview_id: str,
    question_id: str,
    current_user=Depends(get_current_user)
):
    print("[Backend 🎤] Scoring: Score maang aaya – interview =", interview_id, "question =", question_id)
    logger.info("Scoring question | interview_id=%s", interview_id)

    answer = await db.interview_answers.find_one({
        "session_id": interview_id,
        "question_id": question_id
    })

    if not answer or not answer.get("transcript"):
        print("[Backend 🎤] Scoring: Answer/transcript nahi hai – pehle analyze karo! 400!")
        raise HTTPException(status_code=400, detail="Answer not ready for scoring")

    question = await db.interview_questions.find_one({
        "_id": ObjectId(question_id)
    })
    print("[Backend 🎤] Scoring: Question + answer mil gaya – GPT ko bhej ke score maang rahe hain!")

    result = score_answer(
        question["question_text"],
        answer["transcript"],
        answer["emotion"],
        answer["confidence"]
    )
    print("[Backend 🎤] Scoring: GPT ne score de diya – accuracy, communication, behavior, feedback!")

    await db.interview_answers.update_one(
        {"_id": answer["_id"]},
        {"$set": {
            "score": {
                "accuracy": result["accuracy"],
                "communication": result["communication"],
                "behavior": result["behavior"]
            },
            "feedback": result["feedback"]
        }}
    )
    print("[Backend 🎤] Scoring: Score DB mein save – scoring complete!")
    return {
        "message": "Scoring completed",
        "score": result
    }
