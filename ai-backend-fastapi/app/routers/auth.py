from fastapi import APIRouter, HTTPException
from app.core.database import db
from app.schemas.user import Role, UserCreate, UserLogin
from app.core.security import hash_password, verify_password, create_access_token
from fastapi import Depends
from app.core.security import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register")
async def register(user: UserCreate):

    print("[Backend 🎤] Auth: Koi naya banda register karne aaya hai –", user.email)

    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 🔐 Role validation
    if user.role == Role.recruiter and not user.recruiter_info:
        raise HTTPException(
            status_code=400,
            detail="Recruiter information is required"
        )

    if user.role == Role.candidate and user.recruiter_info:
        raise HTTPException(
            status_code=400,
            detail="Candidate should not send recruiter info"
        )

    print("[Backend 🎤] Auth: Password hash karke DB mein save kar rahe hain...")

    user_data = {
        "name": user.name,
        "email": user.email,
        "hashed_password": hash_password(user.password),
        "role": user.role.value,
        "recruiter_info": user.recruiter_info.dict() if user.recruiter_info else None
    }

    result = await db.users.insert_one(user_data)

    token = create_access_token({"sub": str(result.inserted_id)})

    return {"access_token": token}


 

@router.post("/login")
async def login(user: UserLogin):
    print("[Backend 🎤] Auth: Login attempt – email check kar rahe hain", user.email)
    db_user = await db.users.find_one({"email": user.email})
    if not db_user:
        print("[Backend 🎤] Auth: Ye email kahin dikha hi nahi – invalid credentials!")
        raise HTTPException(status_code=400, detail="Invalid credentials")

    print("[Backend 🎤] Auth: User mila, ab password verify – bcrypt se match!")
    if not verify_password(user.password, db_user["hashed_password"]):
        print("[Backend 🎤] Auth: Password galat hai bhai – reject!")
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token({"sub": str(db_user["_id"])})
    print("[Backend 🎤] Auth: Password sahi – token bana ke bhej rahe hain, login success!")
    return {"access_token": token}



@router.get("/me")
async def get_me(current_user = Depends(get_current_user)):
    print("[Backend 🎤] Auth: /me – token se user nikaal ke bhej rahe hain", current_user.get("email"))
    return {
        "id": str(current_user["_id"]),
        "name": current_user["name"],
        "email": current_user["email"],
        "role": current_user["role"]
    }
  
