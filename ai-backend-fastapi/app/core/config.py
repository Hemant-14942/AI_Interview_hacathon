from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str
    DEBUG: bool = False

    JWT_SECRET: str
    JWT_ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    DATABASE_URL: str

    # Preferred provider (used if AI_PROVIDER_ORDER not set)
    AI_PROVIDER: str = "azure"

    # Provider fallback order. Example: "groq,gemini,azure"
    AI_PROVIDER_ORDER: str = "groq,gemini,azure"

    GEMINI_API_KEY: Optional[str] = None
    # NOTE: Gemini 1.5 model names are deprecated/removed for many keys.
    # Use a currently available model (can override via .env GEMINI_MODEL).
    GEMINI_MODEL: str = "gemini-2.0-flash"

    # Groq (OpenAI-compatible)
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "llama-3.1-8b-instant"

    AZURE_OPENAI_ENDPOINT: Optional[str] = None
    AZURE_OPENAI_KEY: Optional[str] = None
    AZURE_OPENAI_DEPLOYMENT: Optional[str] = None
    AZURE_OPENAI_API_VERSION: Optional[str] = None

    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None

    class Config:
        env_file = ".env"

settings = Settings()
