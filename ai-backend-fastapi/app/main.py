from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.core import cloudinary_config  # Ensure Cloudinary is configured at startup
from app.routers.auth import router as auth_router
from app.routers.interview import router as interview_router
from app.routers.interview_ai import router as interview_ai_router
from app.routers.interview_execution import router as interview_execution_router
from app.routers.interview_video import router as interview_video_router
from app.routers.interview_analysis import router as interview_analysis_router
from app.routers.interview_scoring import router as interview_scoring_router
from app.routers.tts import router as tts_router
from app.routers.interview_report import router as interview_report_router


app = FastAPI(title=settings.APP_NAME)

# CORS – allow frontend from any localhost/127.0.0.1 port (no CORS errors on any request)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:4173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:4173",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",  # any port on localhost
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Serve uploaded files (TTS audio, etc.) so frontend can play them
UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
if os.path.isdir(UPLOADS_DIR):
    app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

app.include_router(auth_router)
app.include_router(interview_router)
app.include_router(interview_ai_router)
app.include_router(interview_execution_router)
app.include_router(interview_video_router)
app.include_router(interview_analysis_router)
app.include_router(interview_scoring_router)
app.include_router(tts_router)
app.include_router(interview_report_router)


@app.on_event("startup")
async def startup():
    print("[Backend 🎤] Main: Server uth raha hai – sab routes load ho gaye, CORS + uploads ready! 🚀")


@app.get("/")
async def root():
    print("[Backend 🎤] Main: Koi / pe aaya – health check?")
    return {"message": "AI Interview Backend running"}
