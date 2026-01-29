from pydantic import BaseModel

class InterviewCreate(BaseModel):
    job_description: str
