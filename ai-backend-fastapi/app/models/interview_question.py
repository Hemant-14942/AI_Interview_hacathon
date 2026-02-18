from datetime import datetime
from typing import Optional, Literal
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

    kind: Literal["base", "followup"] = "base"

    parent_question_id: Optional[str] = None

    depth: int = 0

    created_by: Literal["ai", "user"] = "ai"

