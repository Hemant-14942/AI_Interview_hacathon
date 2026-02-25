from pydantic import BaseModel
from typing import Optional
from enum import Enum
from datetime import datetime
from pydantic import Field

class Mode(str, Enum):
    remote = "remote"
    onsite = "onsite"
    hybrid = "hybrid"

class JobCreate(BaseModel):
    title: str
    description: str
    location: str
    salary: int
    mode: Mode

class JobResponse(JobCreate):
    id: str

class CreateJobResponse(BaseModel):
    message: str
    data: JobResponse


class JobInDB(JobCreate):
    recruiter_id: str
    created_at:datetime = Field(default_factory=datetime.utcnow)
    updated_at:datetime = Field(default_factory=datetime.utcnow)
    
