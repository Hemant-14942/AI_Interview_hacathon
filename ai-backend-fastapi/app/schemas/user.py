from enum import Enum
from pydantic import BaseModel, EmailStr


class Role(str, Enum):
    CANDIDATE = "candidate"
    RECRUITER = "recruiter"
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Role

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: Role