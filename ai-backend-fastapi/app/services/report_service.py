from statistics import mean
from app.core.logger import get_logger

logger = get_logger(__name__)


def generate_final_report(session, answers):
    print("[Backend 🎤] ReportService: Report banane aaye – session + answers check kar rahe hain!")
    logger.info("ReportService: Report bana rahe hain – session + answers le ke!")

    if not answers:
        print("[Backend 🎤] ReportService: Koi answer hi nahi – REPORT NAHI MILEGA abhi, status = incomplete!")
        logger.warning("ReportService: Koi answer hi nahi mila")
        return {
            "status": "incomplete",
            "message": "Interview answers not available yet"
        }

    print("[Backend 🎤] ReportService: Total answers =", len(answers), "– ab dekhenge kin ke paas score hai...")

    accuracy_scores = []
    communication_scores = []
    behavior_scores = []

    question_feedback = []

    for ans in answers:
        score = ans.get("score")

        # 🔐 VERY IMPORTANT GUARD
        if not score:
            print("[Backend 🎤] ReportService: Answer skip – question_id =", ans.get("question_id"), "– score abhi background mein bana raha hoga!")
            logger.warning(
                "ReportService: Answer skip kar rahe hain – score abhi nahi bana | question_id=%s",
                ans.get("question_id")
            )
            continue

        accuracy_scores.append(score.get("accuracy", 0))
        communication_scores.append(score.get("communication", 0))
        behavior_scores.append(score.get("behavior", 0))

        question_feedback.append({
            "question_id": str(ans.get("question_id")),
            "accuracy": score.get("accuracy"),
            "communication": score.get("communication"),
            "behavior": score.get("behavior"),
            "feedback": ans.get("feedback")
        })

    # 🔴 IF NO SCORED ANSWERS YET
    if not accuracy_scores:
        print("[Backend 🎤] ReportService: Koi bhi answer score nahi hua – REPORT ABHI NAHI MILEGA! status = processing. Background jobs complete hone do, phir frontend dobara hit karega!")
        logger.warning("ReportService: Scores abhi ready nahi hain")
        return {
            "status": "processing",
            "message": "Interview analysis is still in progress"
        }

    print("[Backend 🎤] ReportService: Scored answers =", len(accuracy_scores), "– ab decision + scores bana rahe hain, REPORT JALD MILEGA!")

    technical = round(mean(accuracy_scores), 1)
    communication = round(mean(communication_scores), 1)
    behavior = round(mean(behavior_scores), 1)

    # 🎯 FINAL DECISION
    if technical >= 75 and behavior >= 70:
        decision = "HIRE"
    elif technical >= 60:
        decision = "BORDERLINE"
    else:
        decision = "REJECT"

    summary = (
        "Strong technical foundation with confident communication."
        if decision == "HIRE"
        else "Candidate shows partial fit and needs improvement."
        if decision == "BORDERLINE"
        else "Candidate does not currently meet role expectations."
    )

    print("[Backend 🎤] ReportService: REPORT READY! decision =", decision, "| technical =", technical, "| communication =", communication, "| behavior =", behavior, "– frontend ko full report bhej rahe hain!")
    logger.info(
        "ReportService: Report ready | decision=%s | tech=%.1f | beh=%.1f",
        decision, technical, behavior
    )

    return {
        "status": "completed",
        "decision": decision,
        "scores": {
            "technical": technical,
            "communication": communication,
            "behavior": behavior
        },
        "strengths": session.get("ai_context", {}).get("strengths", []),
        "gaps": session.get("ai_context", {}).get("gaps", []),
        "questions": question_feedback,
        "summary": summary
    }
