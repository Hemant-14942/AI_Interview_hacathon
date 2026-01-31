import os
import cv2
import whisper
import ffmpeg
from deepface import DeepFace

from app.core.logger import get_logger

logger = get_logger(__name__)

# Load Whisper model once (important for performance)
whisper_model = whisper.load_model("base")


def extract_audio(video_path: str, audio_path: str):
    print("[Backend 🎤] VideoAnalysis: Video se audio nikal rahe hain – ffmpeg chal raha hai!", video_path[:80])
    logger.info("Extracting audio from video: %s", video_path)

    if not os.path.isfile(video_path):
        msg = f"Video file not found: {video_path}"
        logger.error(msg)
        raise FileNotFoundError(msg)
    if os.path.getsize(video_path) == 0:
        msg = f"Video file is empty: {video_path}"
        logger.error(msg)
        raise ValueError(msg)

    try:
        (
            ffmpeg
            .input(video_path)
            .output(audio_path, ac=1, ar=16000)
            .overwrite_output()
            .run(capture_stdout=True, capture_stderr=True)
        )
        print("[Backend 🎤] VideoAnalysis: Audio nikal liya – WAV save ho gaya!")
        logger.info("Audio extracted successfully")
    except Exception as e:
        stderr = ""
        if getattr(e, "stderr", None):
            stderr = (e.stderr if isinstance(e.stderr, str) else (e.stderr or b"").decode("utf-8", errors="replace")).strip()
        msg = f"ffmpeg error: {stderr or str(e)}"
        print("[Backend 🎤] VideoAnalysis: FFmpeg ne fail kiya –", msg[:200])
        logger.exception("Audio extraction failed: %s", msg[:500])
        raise RuntimeError(msg) from e


def transcribe_audio(audio_path: str) -> str:
    print("[Backend 🎤] VideoAnalysis: Whisper se bol sun rahe hain – transcript banayenge!")
    logger.info("Transcribing audio with Whisper")
    try:
        result = whisper_model.transcribe(audio_path)
        text = result.get("text", "").strip()
        print("[Backend 🎤] VideoAnalysis: Transcript aa gaya –", len(text), "characters!")
        logger.info("Transcription complete (%d chars)", len(text))
        return text
    except Exception:
        print("[Backend 🎤] VideoAnalysis: Whisper ne fail kiya – transcript nahi bana!")
        logger.exception("Whisper transcription failed")
        raise


def analyze_emotion(video_path: str):
    print("[Backend 🎤] VideoAnalysis: Video frames se emotion dekh rahe hain – DeepFace chal raha hai!")
    logger.info("Analyzing emotion from video frames")

    cap = cv2.VideoCapture(video_path)
    emotions = []
    frame_count = 0

    try:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            frame_count += 1

            # Analyze every 15th frame (performance)
            if frame_count % 15 == 0:
                try:
                    result = DeepFace.analyze(
                        frame,
                        actions=["emotion"],
                        enforce_detection=False,
                        silent=True
                    )
                    emotions.append(result[0]["dominant_emotion"])
                except Exception:
                    continue

        cap.release()

        if not emotions:
            print("[Backend 🎤] VideoAnalysis: Koi emotion nahi mila – neutral/low de rahe hain!")
            logger.warning("No emotions detected")
            return "neutral", "low"

        dominant = max(set(emotions), key=emotions.count)
        confidence = "high" if dominant in ["happy", "neutral"] else "low"
        print("[Backend 🎤] VideoAnalysis: Emotion mil gaya –", dominant, "confidence =", confidence)
        logger.info(
            "Emotion analysis complete | emotion=%s | confidence=%s",
            dominant, confidence
        )

        return dominant, confidence

    except Exception:
        cap.release()
        print("[Backend 🎤] VideoAnalysis: Emotion analysis fail – kuch toot gaya!")
        logger.exception("Emotion analysis failed")
        raise
