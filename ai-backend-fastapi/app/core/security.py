from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson import ObjectId

from app.core.config import settings
from app.core.database import db

# ======================
# PASSWORD HASHING
# ======================
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    print("[Backend 🎤] Security: Password ko hash kiya – bcrypt magic!")
    return pwd_context.hash(password[:72])  # bcrypt safety

def verify_password(plain_password: str, hashed_password: str) -> bool:
    ok = pwd_context.verify(plain_password[:72], hashed_password)
    print("[Backend 🎤] Security: Password verify –", "match ho gaya!" if ok else "galat hai!")
    return ok

# ======================
# JWT TOKEN
# ======================
def create_access_token(data: dict):
    print("[Backend 🎤] Security: JWT token bana rahe hain – expiry set kar di")
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire})

    token = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )
    print("[Backend 🎤] Security: Token ready – frontend isko header mein bhejega!")
    return token

def verify_access_token(token: str):
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        print("[Backend 🎤] Security: Token verify – sahi hai, user_id =", payload.get("sub"))
        return payload
    except JWTError:
        print("[Backend 🎤] Security: Token verify – expire ya invalid, reject!")
        return None

# ======================
# AUTH DEPENDENCY
# ======================
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    print("[Backend 🎤] Security: get_current_user – Bearer token aaya, ab decode karenge")

    payload = verify_access_token(token)
    if payload is None:
        print("[Backend 🎤] Security: Token invalid/expire – 401 bhej rahe hain!")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    user_id = payload.get("sub")
    if user_id is None:
        print("[Backend 🎤] Security: Token mein user_id nahi – 401!")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        print("[Backend 🎤] Security: DB mein user nahi mila – 401!")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    print("[Backend 🎤] Security: User mil gaya –", user.get("email"), "– request allowed!")
    return user
