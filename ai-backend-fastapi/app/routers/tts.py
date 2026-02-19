from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.services.tts_service import generate_tts
from app.core.security import get_current_user
from app.core.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/tts", tags=["Text To Speech"])


class TTSRequest(BaseModel):
    text: str
    voice: str   # male | female


@router.post("/generate")
async def generate_voice(
    payload: TTSRequest,
    current_user=Depends(get_current_user)
):
    print("[Backend 🎤] TTS: Aawaz banao request aaya – voice =", payload.voice, "text length =", len(payload.text or ""))
    logger.info("TTS request received")

    try:
        result = await generate_tts(
            payload.text,
            payload.voice
        )
        print("[Backend 🎤] TTS: Audio file ban gaya –", result, "– frontend ko path bhej rahe hain!")
        return {
            "audio_url": result["audio_url"],
            "public_id": result["public_id"]
        }
    except Exception:
        print("[Backend 🎤] TTS: TTS fail – kuch toot gaya!")
        raise HTTPException(
            status_code=500,
            detail="TTS generation failed"
        )
