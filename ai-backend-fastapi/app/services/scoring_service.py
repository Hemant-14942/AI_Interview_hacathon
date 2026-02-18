from app.core.logger import get_logger
from app.services.llm_json import generate_json

logger = get_logger(__name__)


def score_answer(question: str, transcript: str, emotion: str, confidence: str):
    print("[Backend 🎤] ScoringService: GPT ko bhej rahe hain – question + transcript + emotion, score maang rahe hain!")
    logger.info("Scoring answer with GPT")

    prompt = f"""
You are an expert technical interviewer.

QUESTION:
{question}

CANDIDATE ANSWER:
{transcript}

BEHAVIOR:
Emotion: {emotion}
Confidence: {confidence}

Score strictly (0-100) and return JSON ONLY:
{{
  "accuracy": number,
  "communication": number,
  "behavior": number,
  "feedback": "one-line feedback"
}}
"""

    result = generate_json(
        system_prompt="Return STRICT JSON only.",
        user_prompt=prompt,
        temperature=0.2,
    )
    print("[Backend 🎤] ScoringService: GPT ne score de diya – accuracy, communication, behavior, feedback!")
    logger.info("Scoring completed")

    return result
