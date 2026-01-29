from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class InterviewQuestionInDB(BaseModel):
    """
    One AI-generated question belonging to an interview session
    """

    id: Optional[str] = Field(None, alias="_id")

    session_id: str

    order: int  # 1 → 5

    question_text: str

    created_at: datetime = Field(default_factory=datetime.utcnow)
