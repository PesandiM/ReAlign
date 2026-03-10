from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from datetime import timedelta
from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta

from app.core.config import settings
from app.core.database import db

router = APIRouter(prefix="/auth")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class PatientRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str
    age: int
    gender: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    userId: str
    name: str
    email: str
    role: str
    patient_id: Optional[str] = None   # ← added
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
    role: str

class AdminUserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    user = await db.db.users.find_one({"userId": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def get_current_admin(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user


async def _get_patient_id(email: str) -> Optional[str]:
    """Look up patient_id from patients collection by email."""
    patient = await db.db.patients.find_one({"email": email}, {"patient_id": 1})
    return patient["patient_id"] if patient else None


# ── Register ─────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse)
async def register_patient(user_data: PatientRegister):
    existing = await db.db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user_data.password)
    user_id = str(uuid.uuid4())
    patient_id = str(uuid.uuid4())

    user_dict = {
        "userId":    user_id,
        "name":      user_data.name,
        "email":     user_data.email,
        "password":  hashed_password,
        "role":      "patient",
        "phone":     user_data.phone,
        "age":       user_data.age,
        "gender":    user_data.gender,
        "patient_id": patient_id,          # ← store patient_id on user too
        "createdAt": datetime.utcnow(),
        "lastLogin": None,
    }
    await db.db.users.insert_one(user_dict)

    # Create matching patient record
    patient_dict = {
        "patient_id": patient_id,
        "user_id":    user_id,
        "name":       user_data.name,
        "email":      user_data.email,
        "contact_no": user_data.phone,
        "age":        user_data.age,
        "gender":     user_data.gender,
        "created_at": datetime.utcnow(),
    }
    await db.db.patients.insert_one(patient_dict)

    access_token = create_access_token(
        data={"sub": user_id, "role": "patient", "email": user_data.email}
    )

    return {
        "access_token": access_token,
        "token_type":   "bearer",
        "role":         "patient",
        "user": UserResponse(
            userId=user_id,
            name=user_data.name,
            email=user_data.email,
            role="patient",
            patient_id=patient_id,
            phone=user_data.phone,
            age=user_data.age,
            gender=user_data.gender,
        ),
    }


# ── Login ─────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLogin):
    user = await db.db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    await db.db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"lastLogin": datetime.utcnow()}}
    )

    # Get patient_id — first from user record, fallback to patients collection
    patient_id: Optional[str] = user.get("patient_id")
    if not patient_id and user["role"] == "patient":
        patient_id = await _get_patient_id(user["email"])
        if patient_id:
            # Backfill patient_id onto user record for next time
            await db.db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"patient_id": patient_id}}
            )

    access_token = create_access_token(
        data={"sub": user["userId"], "role": user["role"], "email": user["email"]}
    )

    return {
        "access_token": access_token,
        "token_type":   "bearer",
        "role":         user["role"],
        "user": UserResponse(
            userId=user["userId"],
            name=user["name"],
            email=user["email"],
            role=user["role"],
            patient_id=patient_id,
            phone=user.get("phone"),
            age=user.get("age"),
            gender=user.get("gender"),
        ),
    }


# ── Admin: create user ────────────────────────────────────────────────────────

@router.post("/admin/create-user")
async def create_user_by_admin(
    user_data: AdminUserCreate,
    current_user: dict = Depends(get_current_admin)
):
    existing = await db.db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_dict = {
        "userId":    str(uuid.uuid4()),
        "name":      user_data.name,
        "email":     user_data.email,
        "password":  get_password_hash(user_data.password),
        "role":      user_data.role,
        "createdAt": datetime.utcnow(),
        "createdBy": current_user["userId"],
    }
    await db.db.users.insert_one(user_dict)
    return {"message": f"User created successfully with role: {user_data.role}"}


# ── Profile ───────────────────────────────────────────────────────────────────

@router.get("/users/profile", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    patient_id = current_user.get("patient_id")
    if not patient_id and current_user["role"] == "patient":
        patient_id = await _get_patient_id(current_user["email"])

    return UserResponse(
        userId=current_user["userId"],
        name=current_user["name"],
        email=current_user["email"],
        role=current_user["role"],
        patient_id=patient_id,
        phone=current_user.get("phone"),
        age=current_user.get("age"),
        gender=current_user.get("gender"),
    )


# ── Forgot Password / OTP Reset ───────────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    """Generate 6-digit OTP, store it, and send to email."""
    import random
    user = await db.db.users.find_one({"email": data.email})
    # Always return same message to prevent email enumeration
    if not user:
        return {"message": "If this email is registered, an OTP has been sent."}

    otp        = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    await db.db.password_resets.update_one(
        {"email": data.email},
        {"$set": {"otp": otp, "expires_at": expires_at, "used": False}},
        upsert=True
    )

    # Fire email in thread executor — sync SMTP must not block async event loop
    try:
        import asyncio
        from app.api.services.email_service import send_otp_email
        loop = asyncio.get_event_loop()
        loop.run_in_executor(
            None,
            lambda: send_otp_email(data.email, user.get("name", "User"), otp)
        )
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"[OTP] Email send failed: {e}")

    return {"message": "If this email is registered, an OTP has been sent."}


@router.post("/reset-password")
async def reset_password(data: VerifyOTPRequest):
    """Verify OTP and update password."""
    record = await db.db.password_resets.find_one({"email": data.email})

    if not record:
        raise HTTPException(status_code=400, detail="No OTP request found for this email.")
    if record.get("used"):
        raise HTTPException(status_code=400, detail="This OTP has already been used.")
    if datetime.utcnow() > record["expires_at"]:
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
    if record["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP.")

    # Mark used before updating password (prevents race conditions)
    await db.db.password_resets.update_one(
        {"email": data.email},
        {"$set": {"used": True}}
    )

    hashed = get_password_hash(data.new_password)
    await db.db.users.update_one(
        {"email": data.email},
        {"$set": {"password": hashed}}
    )

    return {"message": "Password reset successfully."}