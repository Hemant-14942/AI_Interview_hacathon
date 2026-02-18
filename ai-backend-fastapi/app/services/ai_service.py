from typing import Any, Dict, List, Optional

from app.core.logger import get_logger
from app.services.llm_json import generate_json

logger = get_logger(__name__)


def analyze_resume_and_jd(resume_text: str, jd_text: str) -> dict:
    print("[Backend 🎤] AIService: Resume + JD AI ko bhej rahe hain – questions maang rahe hain!")
    logger.info("Starting AI resume-JD analysis")

    try:
        prompt = f"""
Analyze this candidate for the given job description.

RESUME:
{resume_text[:3000]}

JOB DESCRIPTION:
{jd_text[:1500]}

Return STRICT JSON ONLY in this format:
{{
  "match_score": 0-100,
  "strengths": ["3 matched strengths"],
  "gaps": ["2 weak areas"],
  "questions": [
    "Intro question",
    "Technical strength question",
    "Technical strength question",
    "Gap probing question",
    "Behavioral question"
  ]
}}
"""

        print("[Backend 🎤] AIService: AI provider ko prompt bhej rahe hain – wait karo!")
        result = generate_json(
            system_prompt="You are a JSON-only API. Do not return markdown.",
            user_prompt=prompt,
            temperature=0.2,
        )
        print("[Backend 🎤] AIService: AI ne JSON de diya – ab keys check karte hain!")

        required_keys = ["match_score", "strengths", "gaps", "questions"]
        if not all(k in result for k in required_keys):
            print("[Backend 🎤] AIService: Arre AI ne saari keys nahi bheji –", list(result.keys()))
            logger.error("AI response missing keys: %s", result.keys())
            raise ValueError("Malformed AI response")

        print(
            "[Backend 🎤] AIService: Sab sahi – match_score =",
            result["match_score"],
            "questions =",
            len(result["questions"]),
        )
        logger.info(
            "AI analysis complete | match_score=%s | questions=%d",
            result["match_score"],
            len(result["questions"]),
        )
        return result

    except Exception as e:
        print("[Backend 🎤] AIService: AI call fail –", str(e))
        logger.exception("AI analysis failed")
        raise


def generate_followup_question(
    *,
    original_question: str,
    transcript: str,
    score: Dict[str, Any],
    feedback: str = "",
    job_description: str = "",
    gaps: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Returns STRICT JSON:
    {
      "should_follow_up": true/false,
      "follow_up_question": "ONE single question only (no multi-part)",
      "reason": "short"
    }
    """
    gaps = gaps or []

    # Keep prompt small + stable
    transcript_snip = (transcript or "")[:2000]
    jd_snip = (job_description or "")[:800]
    feedback_snip = (feedback or "")[:600]

    prompt = f"""
You are an interviewer. Decide if a single follow-up question is needed based on the candidate's answer.

RULES:
- Ask at most ONE follow-up question.
- The follow-up MUST be a SINGLE question (no multi-part, no "and also", no numbered lists).
- Ask a follow-up ONLY if the answer is vague, missing key details, has low confidence/accuracy, or lacks evidence/metrics/examples.
- If the answer is complete, set should_follow_up=false and follow_up_question="".
- Do NOT ask anything personal/sensitive. Keep it job-related.

JOB DESCRIPTION (optional):
{jd_snip}

ROLE GAPS (optional):
{gaps}

ORIGINAL QUESTION:
{original_question}

CANDIDATE TRANSCRIPT:
{transcript_snip}

RUBRIC SCORE (0-100):
{score}

FEEDBACK (optional):
{feedback_snip}

Return STRICT JSON ONLY:
{{
  "should_follow_up": true,
  "follow_up_question": "string",
  "reason": "string"
}}
"""

    try:
        result = generate_json(
            system_prompt="You are a JSON-only API. Do not return markdown.",
            user_prompt=prompt,
            temperature=0.2,
        )

        if "should_follow_up" not in result:
            raise ValueError("Missing should_follow_up")
        if "follow_up_question" not in result:
            result["follow_up_question"] = ""
        if "reason" not in result:
            result["reason"] = ""

        # Hard safety: ensure single string output
        if not isinstance(result["follow_up_question"], str):
            result["follow_up_question"] = str(result["follow_up_question"])

        result["follow_up_question"] = result["follow_up_question"].strip()

        # If model says no follow-up, force empty question
        if not bool(result["should_follow_up"]):
            result["follow_up_question"] = ""

        return result

    except Exception:
        logger.exception("Follow-up generation failed")
        # Best-effort: on failure, do NOT block pipeline
        return {"should_follow_up": False, "follow_up_question": "", "reason": "follow-up generation error"}