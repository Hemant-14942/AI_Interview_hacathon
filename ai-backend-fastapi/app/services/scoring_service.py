import json
from openai import AzureOpenAI
from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)

client = AzureOpenAI(
    azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
    api_key=settings.AZURE_OPENAI_KEY,
    api_version=settings.AZURE_OPENAI_API_VERSION
)


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

    response = client.chat.completions.create(
        model=settings.AZURE_OPENAI_DEPLOYMENT,
        messages=[
            {"role": "system", "content": "Return STRICT JSON only."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2,
        response_format={"type": "json_object"}
    )

    result = json.loads(response.choices[0].message.content)
    print("[Backend 🎤] ScoringService: GPT ne score de diya – accuracy, communication, behavior, feedback!")
    logger.info("Scoring completed")

    return result
