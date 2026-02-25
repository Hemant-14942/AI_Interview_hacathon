from enum import Enum
from pydantic import BaseModel, EmailStr
from typing import Optional


class Role(str, Enum):
    candidate = "candidate"
    recruiter = "recruiter"

class RecruiterCreate(BaseModel):
    company_name: str
    website_url: Optional[str] = None
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Role
    recruiter_info: Optional['RecruiterCreate'] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: Role