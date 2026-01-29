from datetime import datetime
from typing import Optional, Dict
from pydantic import BaseModel, Field


class InterviewAnswerInDB(BaseModel):
    """
    Stores user's response to ONE question
    """

    id: Optional[str] = Field(None, alias="_id")

    session_id: str
    question_id: str

    video_path: Optional[str] = None

    transcript: Optional[str] = None

    emotion: Optional[str] = None
    confidence: Optional[str] = None

    score: Optional[Dict[str, int]] = None
    # {
    #   "accuracy": 80,
    #   "communication": 75,
    #   "behavior": 85
    # }

    feedback: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
