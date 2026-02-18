import json
import re
from typing import Any, Dict, Optional

from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)


def _extract_json_object(text: str) -> Dict[str, Any]:
    raw = (text or "").strip()
    if not raw:
        raise ValueError("Empty model response")

    # Direct parse
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass

    # Strip markdown fences if present
    raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.IGNORECASE).strip()
    raw = re.sub(r"\s*```$", "", raw).strip()
    
    # Find first {...} block
    m = re.search(r"\{[\s\S]*\}", raw)
    if not m:
        raise ValueError(f"Could not find JSON object in response: {raw[:200]}")

    parsed = json.loads(m.group(0))
    if not isinstance(parsed, dict):
        raise ValueError("Expected a JSON object")
    return parsed


def _require(v: Optional[str], name: str) -> str:
    if not v:
        raise RuntimeError(f"Missing required setting: {name}")
    return v


def _call_groq_json(system_prompt: str, user_prompt: str, temperature: float) -> Dict[str, Any]:
    """
    Groq Cloud is OpenAI-compatible.
    Docs base_url: https://api.groq.com/openai/v1
    """
    from openai import OpenAI

    client = OpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=_require(settings.GROQ_API_KEY, "GROQ_API_KEY"),
    )

    model = (settings.GROQ_MODEL or "llama-3.1-8b-instant").strip()

    # Try structured JSON output; fall back if not supported by model.
    try:
        resp = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=temperature,
            response_format={"type": "json_object"},
        )
    except Exception as e:
        logger.warning("Groq response_format failed, retrying prompt-only. err=%s", str(e))
        resp = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": user_prompt + "\n\nReturn STRICT JSON only. No markdown. No extra text.",
                },
            ],
            temperature=temperature,
        )

    return _extract_json_object(resp.choices[0].message.content)


def _call_azure_json(system_prompt: str, user_prompt: str, temperature: float) -> Dict[str, Any]:
    from openai import AzureOpenAI

    client = AzureOpenAI(
        azure_endpoint=_require(settings.AZURE_OPENAI_ENDPOINT, "AZURE_OPENAI_ENDPOINT"),
        api_key=_require(settings.AZURE_OPENAI_KEY, "AZURE_OPENAI_KEY"),
        api_version=_require(settings.AZURE_OPENAI_API_VERSION, "AZURE_OPENAI_API_VERSION"),
    )

    resp = client.chat.completions.create(
        model=_require(settings.AZURE_OPENAI_DEPLOYMENT, "AZURE_OPENAI_DEPLOYMENT"),
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=temperature,
        response_format={"type": "json_object"},
    )
    return _extract_json_object(resp.choices[0].message.content)


def _call_gemini_json(system_prompt: str, user_prompt: str, temperature: float) -> Dict[str, Any]:
    import google.generativeai as genai

    genai.configure(api_key=_require(settings.GEMINI_API_KEY, "GEMINI_API_KEY"))
    model_name = (settings.GEMINI_MODEL or "gemini-2.0-flash").strip()
    # list_models() returns names like "models/gemini-2.0-flash" but GenerativeModel
    # typically accepts "gemini-2.0-flash". Normalize for safety.
    if model_name.startswith("models/"):
        model_name = model_name[len("models/") :]

    model = genai.GenerativeModel(model_name=model_name, system_instruction=system_prompt)

    # Try strict JSON output if supported
    try:
        resp = model.generate_content(
            user_prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=temperature,
                response_mime_type="application/json",
            ),
        )
        return _extract_json_object(getattr(resp, "text", "") or "")
    except Exception as e:
        logger.warning("Gemini JSON mime failed, retrying prompt-only. err=%s", str(e))
        resp = model.generate_content(
            user_prompt + "\n\nReturn STRICT JSON only. No markdown. No extra text.",
            generation_config=genai.types.GenerationConfig(temperature=temperature),
        )
        return _extract_json_object(getattr(resp, "text", "") or "")


def generate_json(system_prompt: str, user_prompt: str, temperature: float = 0.2) -> Dict[str, Any]:
    """
    Provider-agnostic JSON generator with fallback.
    Default order: groq -> gemini -> azure
    """
    preferred = (settings.AI_PROVIDER or "").strip().lower()
    order_raw = (getattr(settings, "AI_PROVIDER_ORDER", "") or "").strip()

    default_order = ["groq", "gemini", "azure"]
    if order_raw:
        order = [p.strip().lower() for p in order_raw.split(",") if p.strip()]
    else:
        order = default_order[:]

    # If user set a preferred provider, move it to the front (but keep others as fallback).
    if preferred and preferred in order:
        order = [preferred] + [p for p in order if p != preferred]
    elif preferred and preferred not in order:
        order = [preferred] + order

    def try_provider(p: str) -> Dict[str, Any]:
        if p == "groq":
            return _call_groq_json(system_prompt, user_prompt, temperature)
        if p == "gemini":
            return _call_gemini_json(system_prompt, user_prompt, temperature)
        if p == "azure":
            return _call_azure_json(system_prompt, user_prompt, temperature)
        raise RuntimeError(f"Unsupported provider: {p}")

    last_err: Optional[Exception] = None
    for p in order:
        try:
            return try_provider(p)
        except Exception as e:
            last_err = e
            logger.exception("LLM provider failed: %s", p)
            continue

    assert last_err is not None
    raise last_err