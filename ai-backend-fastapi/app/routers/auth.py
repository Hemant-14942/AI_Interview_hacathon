from fastapi import APIRouter, HTTPException
from app.core.database import db
from app.schemas.user import UserCreate, UserLogin
from app.core.security import hash_password, verify_password, create_access_token
from fastapi import Depends
from app.core.security import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register")
async def register(user: UserCreate):
    print("[Backend 🎤] Auth: Koi naya banda register karne aaya hai –", user.email)
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        print("[Backend 🎤] Auth: Arre ye email pehle se hi hai, bhej do reject!")
        raise HTTPException(status_code=400, detail="Email already registered")

    print("[Backend 🎤] Auth: Naya user hai, password hash karke DB mein daal rahe hain...")
    user_data = {
        "name": user.name,
        "email": user.email,
        "hashed_password": hash_password(user.password),
        "role": user.role.value if hasattr(user, "role") else "candidate"  # Default role set to candidate
    }

    result = await db.users.insert_one(user_data)
    print("[Backend 🎤] Auth: User DB mein save ho gaya, ab token bana rahe hain!")

    token = create_access_token({"sub": str(result.inserted_id)})
    print("[Backend 🎤] Auth: Token ready – register success, frontend ko bhejo!")
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
