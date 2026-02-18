from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime

from app.core.database import db
from app.core.security import get_current_user
from app.core.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/interviews", tags=["Interview Execution"])

@router.post("/{interview_id}/start")
async def start_interview(
    interview_id: str,
    voice: str,
    current_user=Depends(get_current_user)
):
    print("[Backend 🎤] Execution: Start interview – voice =", voice, "interview_id =", interview_id)
    logger.info(
        "Starting interview | interview_id=%s | voice=%s",
        interview_id, voice
    )

    if voice not in ["male", "female"]:
        print("[Backend 🎤] Execution: Galat voice bheja – male/female bhejo!")
        raise HTTPException(status_code=400, detail="Invalid voice selection")

    session = await db.interview_sessions.find_one({
        "_id": ObjectId(interview_id),
        "user_id": str(current_user["_id"])
    })

    if not session:
        print("[Backend 🎤] Execution: Session nahi mila – 404!")
        raise HTTPException(status_code=404, detail="Interview not found")

    if session["status"] != "questions_generated":
        print("[Backend 🎤] Execution: Abhi start mat karo – pehle setup-ai karo!")
        raise HTTPException(
            status_code=400,
            detail="Interview not ready to start"
        )

    await db.interview_sessions.update_one(
        {"_id": ObjectId(interview_id)},
        {"$set": {
            "interviewer": {"voice": voice},
            "current_question_index": 0,
            "status": "in_progress",
            "started_at": datetime.utcnow()
        }}
    )
    print("[Backend 🎤] Execution: Session update – in_progress, index=0 – interview shuru!")

    logger.info("Interview started successfully")
    return {
        "message": "Interview started",
        "voice": voice
    }

@router.get("/{interview_id}/next-question")
async def get_next_question(
    interview_id: str,
    current_user=Depends(get_current_user)
):
    print("[Backend 🎤] Execution: Next question maang rahe hain – interview_id =", interview_id)
    logger.info("Fetching next question | interview_id=%s", interview_id)

    session = await db.interview_sessions.find_one({
        "_id": ObjectId(interview_id),
        "user_id": str(current_user["_id"])
    })

    if not session:
        print("[Backend 🎤] Execution: Session nahi mila – 404!")
        raise HTTPException(status_code=404, detail="Interview not found")

    if session["status"] != "in_progress":
        print("[Backend 🎤] Execution: Interview in_progress nahi hai – 400!")
        raise HTTPException(
            status_code=400,
            detail="Interview not in progress"
        )

    index = session.get("current_question_index", 0)
    print("[Backend 🎤] Execution: Current index =", index, "– ab order =", index + 1, "wala question dhoondhenge")

    question = await db.interview_questions.find_one({
        "session_id": interview_id,
        "order": index + 1
    })

    if not question:
        print("[Backend 🎤] Execution: Koi question nahi bacha – interview khatam! Status = completed")
        logger.info("Interview completed | interview_id=%s", interview_id)

        await db.interview_sessions.update_one(
            {"_id": ObjectId(interview_id)},
            {"$set": {"status": "completed"}}
        )

        return {
            "message": "Interview completed"
        }

    print("[Backend 🎤] Execution: Question mil gaya #", index + 1, "– frontend ko bhej rahe hain!")
    return {
        "question_number": index + 1,
        "question_id": str(question["_id"]),
        "question_text": question["question_text"],
        "voice": session["interviewer"]["voice"]
    }


@router.post("/{interview_id}/questions/{question_id}/skip")
async def skip_question(
    interview_id: str,
    question_id: str,
    current_user=Depends(get_current_user)
):
    print("[Backend 🎤] Execution: Skip question – interview_id =", interview_id, "question_id =", question_id)
    logger.info("Skipping question | interview_id=%s | question_id=%s", interview_id, question_id)

    session = await db.interview_sessions.find_one({
        "_id": ObjectId(interview_id),
        "user_id": str(current_user["_id"])
    })
    if not session:
        print("[Backend 🎤] Execution: Session nahi mila – 404!")
        raise HTTPException(status_code=404, detail="Interview not found")

    if session["status"] != "in_progress":
        raise HTTPException(status_code=400, detail="Interview not in progress")

    question = await db.interview_questions.find_one({
        "_id": ObjectId(question_id),
        "session_id": interview_id
    })
    if not question:
        print("[Backend 🎤] Execution: Question nahi mila – 404!")
        raise HTTPException(status_code=404, detail="Question not found")

    await db.interview_answers.insert_one({
        "session_id": interview_id,
        "question_id": question_id,
        "status": "skipped",
        "score": {
            "accuracy": 0,
            "communication": 0,
            "behavior": 0
        }
    })
    print("[Backend 🎤] Execution: Skipped answer record daal diya – ab index +1")

    result = await db.interview_sessions.update_one(
        {
            "_id": ObjectId(interview_id),
            "user_id": str(current_user["_id"]),
            "status": "in_progress"
        },
        {"$inc": {"current_question_index": 1}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Unable to advance question")

    print("[Backend 🎤] Execution: Skip complete – next question ready!")
    return {"message": "Question skipped"}


@router.post("/{interview_id}/answer-complete")
async def mark_answer_complete(
    interview_id: str,
    current_user=Depends(get_current_user)
):
    print("[Backend 🎤] Execution: Answer complete – index +1 karenge, interview_id =", interview_id)
    logger.info("Marking answer complete | interview_id=%s", interview_id)

    result = await db.interview_sessions.update_one(
        {
            "_id": ObjectId(interview_id),
            "user_id": str(current_user["_id"]),
            "status": "in_progress"
        },
        {"$inc": {"current_question_index": 1}}
    )

    if result.modified_count == 0:
        print("[Backend 🎤] Execution: Kuch update nahi hua – shayad already end ho chuka? 400!")
        raise HTTPException(
            status_code=400,
            detail="Unable to advance question"
        )

    print("[Backend 🎤] Execution: Index badha diya – next question ready!")
    return {
        "message": "Answer recorded, moving to next question"
    }


@router.post("/{interview_id}/end")
async def end_interview(
    interview_id: str,
    current_user=Depends(get_current_user)
):
    print("[Backend 🎤] Execution: End interview – user ne beech mein khatam kiya, interview_id =", interview_id)
    result = await db.interview_sessions.update_one(
        {
            "_id": ObjectId(interview_id),
            "user_id": str(current_user["_id"]),
            "status": "in_progress"
        },
        {
            "$set": {
                "status": "completed",
                "completed_at": datetime.utcnow()
            }
        }
    )

    if result.modified_count == 0:
        print("[Backend 🎤] Execution: Session update nahi hua – pehle hi khatam ya galat status? 400!")
        raise HTTPException(
            status_code=400,
            detail="Interview not in progress or already ended"
        )

    print("[Backend 🎤] Execution: Interview end ho gaya – status = completed!")
    return {
        "message": "Interview ended successfully"
    }

@router.get("/{interview_id}/questions/{question_id}/answer-status")
async def answer_status(interview_id: str, question_id: str, current_user=Depends(get_current_user)):
    session = await db.interview_sessions.find_one(
        {"_id": ObjectId(interview_id), "user_id": str(current_user["_id"])}
    )
    if not session:
        raise HTTPException(status_code=404, detail="Interview not found")

    answer = await db.interview_answers.find_one({"session_id": interview_id, "question_id": question_id})
    if not answer:
        return {
            "status": "missing",
            "has_transcript": False,
            "has_score": False,
            "has_feedback": False,
        }

    return {
        "status": answer.get("status", "unknown"),
        "has_transcript": bool(answer.get("transcript")),
        "has_score": bool(answer.get("score")),
        "has_feedback": bool(answer.get("feedback")),
    }