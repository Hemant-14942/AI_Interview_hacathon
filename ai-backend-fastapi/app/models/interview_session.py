from datetime import datetime
from typing import Optional, Dict, List
from pydantic import BaseModel, Field


class ResumeData(BaseModel):
    original_name: str
    file_path: str
    extracted_text: str


class AIContext(BaseModel):
    match_score: int
    strengths: List[str]
    gaps: List[str]


class InterviewerConfig(BaseModel):
    voice: str  # "male" | "female"


class InterviewSessionInDB(BaseModel):
    """
    Represents ONE interview attempt by ONE user
    """

    id: Optional[str] = Field(None, alias="_id")

    user_id: str

    # lifecycle: created → questions_generated → in_progress → completed
    status: str = "created"

    resume: Optional[ResumeData] = None

    job_description: Optional[str] = None

    ai_context: Optional[AIContext] = None

    interviewer: Optional[InterviewerConfig] = None

    current_question_index: int = 0

    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
