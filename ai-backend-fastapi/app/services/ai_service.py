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

        print("[Backend 🎤] AIService: Azure OpenAI ko prompt bhej rahe hain – wait karo!")
        response = client.chat.completions.create(
            model=settings.AZURE_OPENAI_DEPLOYMENT,
            messages=[
                {"role": "system", "content": "You are a JSON-only API. Do not return markdown."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            response_format={"type": "json_object"}
        )

        result = json.loads(response.choices[0].message.content)
        print("[Backend 🎤] AIService: AI ne JSON de diya – ab keys check karte hain!")

        required_keys = ["match_score", "strengths", "gaps", "questions"]
        if not all(k in result for k in required_keys):
            print("[Backend 🎤] AIService: Arre AI ne saari keys nahi bheji –", list(result.keys()))
            logger.error("AI response missing keys: %s", result.keys())
            raise ValueError("Malformed AI response")

        print("[Backend 🎤] AIService: Sab sahi – match_score =", result["match_score"], "questions =", len(result["questions"]))
        logger.info(
            "AI analysis complete | match_score=%s | questions=%d",
            result["match_score"],
            len(result["questions"])
        )

        return result

    except Exception as e:
        print("[Backend 🎤] AIService: AI call fail –", str(e))
        logger.exception("AI analysis failed")
        raise
