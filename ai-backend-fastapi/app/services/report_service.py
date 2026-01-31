from app.core.logger import get_logger

logger = get_logger(__name__)


def generate_final_report(session, answers, questions=None):
    print("[Backend 🎤] ReportService: Report banane aaye – session + answers check kar rahe hain!")
    logger.info("ReportService: Report bana rahe hain – session + answers le ke!")

    if not answers and not (questions and len(questions) > 0):
        print("[Backend 🎤] ReportService: Koi answer hi nahi – REPORT NAHI MILEGA abhi, status = incomplete!")
        logger.warning("ReportService: Koi answer hi nahi mila")
        return {
            "status": "incomplete",
            "message": "Interview answers not available yet"
        }

    # Build map: question_id -> answer
    answer_by_qid = {str(a["question_id"]): a for a in answers}

    # Total questions = session ke saare questions (fairness: same denominator for everyone)
    total_questions = len(questions) if (questions and len(questions) > 0) else (len(answers) if answers else 0)
    if total_questions == 0:
        return {
            "status": "incomplete",
            "message": "Interview answers not available yet"
        }

    accuracy_scores = []
    communication_scores = []
    behavior_scores = []
    question_feedback = []

    # If we have questions in order, use them for fairness (each question slot = score or 0 if skipped/no answer)
    if questions and len(questions) > 0:
        for q in questions:
            qid = str(q["_id"])
            ans = answer_by_qid.get(qid)
            if ans is None:
                accuracy_scores.append(0)
                communication_scores.append(0)
                behavior_scores.append(0)
                question_feedback.append({
                    "question_id": qid,
                    "accuracy": 0,
                    "communication": 0,
                    "behavior": 0,
                    "feedback": "No answer"
                })
            elif ans.get("status") == "skipped":
                accuracy_scores.append(0)
                communication_scores.append(0)
                behavior_scores.append(0)
                question_feedback.append({
                    "question_id": qid,
                    "accuracy": 0,
                    "communication": 0,
                    "behavior": 0,
                    "feedback": "Skipped"
                })
            elif not ans.get("score"):
                # Answer exists but score abhi background mein bana raha hoga
                print("[Backend 🎤] ReportService: Answer hai par score nahi – processing | question_id =", qid)
                return {
                    "status": "processing",
                    "message": "Interview analysis is still in progress"
                }
            else:
                score = ans["score"]
                accuracy_scores.append(score.get("accuracy", 0))
                communication_scores.append(score.get("communication", 0))
                behavior_scores.append(score.get("behavior", 0))
                question_feedback.append({
                    "question_id": qid,
                    "accuracy": score.get("accuracy"),
                    "communication": score.get("communication"),
                    "behavior": score.get("behavior"),
                    "feedback": ans.get("feedback")
                })
    else:
        # Fallback: no questions list (legacy) – only scored answers
        for ans in answers:
            score = ans.get("score")
            if not score:
                continue
            if ans.get("status") == "skipped":
                accuracy_scores.append(0)
                communication_scores.append(0)
                behavior_scores.append(0)
            else:
                accuracy_scores.append(score.get("accuracy", 0))
                communication_scores.append(score.get("communication", 0))
                behavior_scores.append(score.get("behavior", 0))
            question_feedback.append({
                "question_id": str(ans.get("question_id")),
                "accuracy": score.get("accuracy"),
                "communication": score.get("communication"),
                "behavior": score.get("behavior"),
                "feedback": ans.get("feedback") if ans.get("status") != "skipped" else "Skipped"
            })
        total_questions = len(accuracy_scores) if accuracy_scores else 0

    if not accuracy_scores:
        print("[Backend 🎤] ReportService: Koi bhi answer score nahi hua – REPORT ABHI NAHI MILEGA! status = processing.")
        return {
            "status": "processing",
            "message": "Interview analysis is still in progress"
        }

    # Overall = sum / total_questions (fairness: skipped = 0)
    technical = round(sum(accuracy_scores) / total_questions, 1)
    communication = round(sum(communication_scores) / total_questions, 1)
    behavior = round(sum(behavior_scores) / total_questions, 1)

    # 🎯 FINAL DECISION (unchanged)
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

    print("[Backend 🎤] ReportService: REPORT READY! decision =", decision, "| technical =", technical, "| communication =", communication, "| behavior =", behavior)
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
