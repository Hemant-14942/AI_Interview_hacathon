import edge_tts
import uuid
import os
import asyncio
import cloudinary
import cloudinary.uploader


from app.core.logger import get_logger

logger = get_logger(__name__)

AUDIO_DIR = "uploads/tts"
os.makedirs(AUDIO_DIR, exist_ok=True)

VOICE_MAP = {
    "male": "en-US-ChristopherNeural",
    "female": "en-US-AriaNeural"
}


async def generate_tts(text: str, voice: str) -> str:
    print("[Backend 🎤] TTSService: Aawaz bana rahe hain – voice =", voice, "text length =", len(text or ""))
    logger.info("Generating TTS | voice=%s", voice)

    voice_name = VOICE_MAP.get(voice, VOICE_MAP["female"])
    filename = f"{uuid.uuid4()}.mp3"
    file_path = os.path.join(AUDIO_DIR, filename)
    print("[Backend 🎤] TTSService: Edge TTS se bolwa rahe hain –", voice_name)

    try:
        communicate = edge_tts.Communicate(text, voice_name)
        await communicate.save(file_path)
        print("[Backend 🎤] TTSService: MP3 save ho gaya –", file_path)
        logger.info("TTS generated: %s", file_path)

        # saving in cloudinary 
        result = cloudinary.uploader.upload(
            file_path,
            resource_type="video",
            folder="ai-interview/tts",
            )
        print("[Backend 🎤] TTSService: Cloudinary upload ho gaya –", result)
        os.remove(file_path)  # local file delete kar do, ab cloud mein safe hai
        return {
                "audio_url": result["secure_url"],
                "public_id": result["public_id"]
            }

    except Exception:
        print("[Backend 🎤] TTSService: TTS fail – edge_tts ne reject kiya!")
        logger.exception("TTS generation failed")
        raise
