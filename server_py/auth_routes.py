"""
Authentication REST API Endpoints (server_py/auth_routes.py)
Provides:
1. POST /api/auth/google/initiate        - Verifies Google token, starts OTP verification flow
2. POST /api/auth/google/verify-otp      - Verifies 6-digit OTP code and issues setup token
3. POST /api/auth/set-password           - Bcrypt hashes password and logs in with session cookie
4. POST /api/auth/login                  - Email + Password login with session cookie
5. POST /api/auth/google/login           - 1-Click Google Login for existing verified users
6. POST /api/auth/forgot-password/request- Sends 6-digit Reset OTP to user email
7. POST /api/auth/forgot-password/reset  - Validates Reset OTP and sets new password
8. GET  /api/auth/me                     - Retrieves active user session state
9. POST /api/auth/logout                 - Clears session cookie and invalidates login
"""

import logging
from datetime import timedelta
from typing import Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Request, Response, BackgroundTasks, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func

from server_py.database import get_db
from server_py.models import User, EmailOTP, utc_now
from server_py.config import AUTH_COOKIE_NAME, JWT_ACCESS_TOKEN_EXPIRE_MINUTES
from server_py.auth_security import (
    hash_password,
    verify_password,
    generate_secure_otp,
    generate_uuid_token,
    hash_otp,
    verify_otp,
    create_session_token,
    create_setup_token,
    verify_setup_token,
    decode_jwt_token,
    verify_google_credential,
    extract_token_from_request,
)
from server_py.mailer import send_signup_otp_email, send_password_reset_email

logger = logging.getLogger("auth_routes")

router = APIRouter(tags=["Authentication"])


# =====================================================================
# Pydantic Request Schemas
# =====================================================================

class GoogleInitiateRequest(BaseModel):
    credential: str = Field(..., description="Google OAuth 2.0 ID Token")


class GoogleVerifyOTPRequest(BaseModel):
    temp_token: str = Field(..., description="UUID token returned from initiate")
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")


class SetPasswordRequest(BaseModel):
    setup_token: str = Field(..., description="Setup token returned after OTP verification")
    password: str = Field(..., min_length=6, description="User password (min 6 chars)")


class EmailLoginRequest(BaseModel):
    email: str = Field(..., description="Registered email address")
    password: str = Field(..., description="Account password")


class GoogleLoginRequest(BaseModel):
    credential: str = Field(..., description="Google OAuth 2.0 ID Token")


class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., description="Registered email address")


class ForgotPasswordResetRequest(BaseModel):
    reset_token: str = Field(..., description="Reset token from forgot password request")
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit reset code")
    new_password: str = Field(..., min_length=6, description="New password (min 6 chars)")


# =====================================================================
# Cookie Management Helpers
# =====================================================================

def set_auth_cookie(response: Response, token: str) -> None:
    """
    Sets HttpOnly, SameSite=Lax session cookie.
    """
    max_age_seconds = JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,  # Set True in strict production HTTPS
        max_age=max_age_seconds,
        path="/"
    )


def clear_auth_cookie(response: Response) -> None:
    """
    Clears the primary session cookie.
    """
    response.delete_cookie(
        key=AUTH_COOKIE_NAME,
        path="/"
    )


# =====================================================================
# Dependency: Current User Authentication
# =====================================================================

def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Extracts and validates active user session from cookie or Authorization header.
    Returns User instance or None if unauthenticated.
    """
    token = extract_token_from_request(request)
    if not token:
        return None

    payload = decode_jwt_token(token)
    if not payload:
        return None

    if payload.get("token_type") != "session":
        return None

    user_id_str = payload.get("sub")
    if not user_id_str:
        return None

    try:
        user_id = int(user_id_str)
    except ValueError:
        return None

    user = db.query(User).filter(User.id == user_id).first()
    return user


def require_authenticated_user(
    user: Optional[User] = Depends(get_current_user)
) -> User:
    """
    FastAPI Dependency that enforces active authenticated session.
    Raises HTTP 401 if not logged in.
    """
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return user


# =====================================================================
# 1. Google Sign-Up Initiate (POST /api/auth/google/initiate)
# =====================================================================

@router.post("/google/initiate")
async def google_initiate(
    payload: GoogleInitiateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Step 1 of Google Sign-Up:
    - Verifies Google token
    - Creates or updates unverified User
    - Generates 6-digit OTP code and dispatches email
    - Returns temp_token for OTP verification
    """
    google_data = verify_google_credential(payload.credential)
    if not google_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Google credential token."
        )

    email = google_data["email"].strip().lower()
    google_sub = google_data["sub"]
    name = google_data.get("name")
    picture = google_data.get("picture")

    # Find existing user
    user = db.query(User).filter(
        (User.google_sub == google_sub) | (func.lower(User.email) == email)
    ).first()

    if user and user.is_verified:
        if user.has_password():
            return {
                "status": "already_registered",
                "message": "Account already registered and verified. Please sign in.",
                "email": user.email
            }
        else:
            # Verified but hasn't set password yet (edge case)
            setup_token = create_setup_token(user.id, user.email)
            return {
                "status": "set_password_required",
                "setup_token": setup_token,
                "email": user.email,
                "message": "Account verified. Please set your password."
            }

    if not user:
        user = User(
            email=email,
            name=name,
            avatar_url=picture,
            google_sub=google_sub,
            role="admin",
            is_verified=False
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update details
        user.name = name or user.name
        user.avatar_url = picture or user.avatar_url
        user.google_sub = google_sub or user.google_sub
        db.commit()

    # Invalidate previous unexpired signup OTPs
    db.query(EmailOTP).filter(
        EmailOTP.user_id == user.id,
        EmailOTP.purpose == "signup",
        EmailOTP.is_used == False
    ).update({"is_used": True})

    # Generate 6-digit OTP & UUID session token
    otp = generate_secure_otp()
    otp_hash = hash_otp(otp)
    temp_token = generate_uuid_token()
    expires_at = utc_now() + timedelta(minutes=5)

    otp_record = EmailOTP(
        user_id=user.id,
        otp_hash=otp_hash,
        token=temp_token,
        purpose="signup",
        attempts_count=0,
        is_used=False,
        expires_at=expires_at
    )
    db.add(otp_record)
    db.commit()

    # Background email dispatch
    background_tasks.add_task(send_signup_otp_email, user.email, user.name, otp)

    logger.info(f"Initiated Google signup for {user.email}. OTP dispatched.")
    return {
        "status": "otp_required",
        "temp_token": temp_token,
        "email": user.email,
        "message": "Verification code has been sent to your email address."
    }


# =====================================================================
# 2. Google Verify OTP (POST /api/auth/google/verify-otp)
# =====================================================================

@router.post("/google/verify-otp")
def google_verify_otp(
    payload: GoogleVerifyOTPRequest,
    db: Session = Depends(get_db)
):
    """
    Step 2 of Google Sign-Up:
    - Validates 6-digit OTP code against temp_token
    - Enforces 5-minute expiry and max 3 attempts
    - Marks user as is_verified = True
    - Returns setup_token for password creation
    """
    otp_record = db.query(EmailOTP).filter(
        EmailOTP.token == payload.temp_token,
        EmailOTP.purpose == "signup",
        EmailOTP.is_used == False
    ).first()

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification session."
        )

    # Check expiration (5 minutes)
    now = utc_now()
    record_expires = otp_record.expires_at
    if record_expires.tzinfo is None:
        from datetime import timezone
        record_expires = record_expires.replace(tzinfo=timezone.utc)

    if record_expires < now:
        otp_record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new code."
        )

    # Check maximum attempts (3)
    if otp_record.attempts_count >= 3:
        otp_record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum verification attempts exceeded. Please start over."
        )

    # Constant-time OTP verification
    is_valid = verify_otp(payload.otp, otp_record.otp_hash)
    if not is_valid:
        otp_record.attempts_count += 1
        db.commit()
        remaining = max(0, 3 - otp_record.attempts_count)
        if remaining == 0:
            otp_record.is_used = True
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum verification attempts exceeded. Please start over."
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid verification code. {remaining} attempt(s) remaining."
        )

    # Successful verification
    otp_record.is_used = True
    user = db.query(User).filter(User.id == otp_record.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    user.is_verified = True
    db.commit()

    setup_token = create_setup_token(user.id, user.email, expires_minutes=15)
    logger.info(f"OTP verified successfully for user: {user.email}")

    return {
        "status": "set_password_required",
        "setup_token": setup_token,
        "email": user.email,
        "message": "Email verified successfully. Please create your account password."
    }


# =====================================================================
# 3. Set Account Password (POST /api/auth/set-password)
# =====================================================================

@router.post("/set-password")
def set_password(
    payload: SetPasswordRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Step 3 of Google Sign-Up:
    - Validates setup_token (15 min validity)
    - Hashes password using bcrypt (12 rounds)
    - Issues session JWT and sets HttpOnly 'portfolio_auth' cookie
    """
    setup_data = verify_setup_token(payload.setup_token)
    if not setup_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired password setup token. Please verify email again."
        )

    user_id = int(setup_data["sub"])
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    if len(payload.password.strip()) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )

    # Hash and save password
    user.password_hash = hash_password(payload.password.strip())
    user.is_verified = True
    user.last_login = utc_now()
    db.commit()
    db.refresh(user)

    # Issue primary session JWT
    session_token = create_session_token(
        user_id=user.id,
        email=user.email,
        role=user.role,
        name=user.name
    )
    set_auth_cookie(response, session_token)

    logger.info(f"Password successfully created and session issued for: {user.email}")
    return {
        "status": "success",
        "message": "Password created successfully. You are now logged in.",
        "user": user.to_dict()
    }


# =====================================================================
# 4. Email + Password Login (POST /api/auth/login)
# =====================================================================

@router.post("/login")
def login_with_password(
    payload: EmailLoginRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Standard Email + Password Authentication:
    - Verifies user exists, is verified, and has a password
    - Constant-time bcrypt password verification
    - Issues HttpOnly session cookie
    """
    clean_email = payload.email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == clean_email).first()

    if not user or not user.is_verified or not user.has_password():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    user.last_login = utc_now()
    db.commit()

    session_token = create_session_token(
        user_id=user.id,
        email=user.email,
        role=user.role,
        name=user.name
    )
    set_auth_cookie(response, session_token)

    logger.info(f"User logged in successfully via password: {user.email}")
    return {
        "status": "success",
        "message": "Login successful.",
        "user": user.to_dict()
    }


# =====================================================================
# 5. One-Click Google Login (POST /api/auth/google/login)
# =====================================================================

@router.post("/google/login")
def google_one_click_login(
    payload: GoogleLoginRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    1-Click Google Login for already registered and verified users:
    - Verifies Google token
    - Matches user by google_sub or verified email
    - Issues HttpOnly session cookie
    """
    google_data = verify_google_credential(payload.credential)
    if not google_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Google credential token."
        )

    email = google_data["email"].strip().lower()
    google_sub = google_data["sub"]

    user = db.query(User).filter(
        (User.google_sub == google_sub) | (func.lower(User.email) == email)
    ).first()

    if not user or not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No verified account found with this Google identity. Please sign up first."
        )

    # Link google_sub if not present
    if not user.google_sub:
        user.google_sub = google_sub
    if google_data.get("picture") and not user.avatar_url:
        user.avatar_url = google_data["picture"]

    user.last_login = utc_now()
    db.commit()

    session_token = create_session_token(
        user_id=user.id,
        email=user.email,
        role=user.role,
        name=user.name
    )
    set_auth_cookie(response, session_token)

    logger.info(f"User logged in via 1-click Google auth: {user.email}")
    return {
        "status": "success",
        "message": "Google login successful.",
        "user": user.to_dict()
    }


# =====================================================================
# 6. Forgot Password Request (POST /api/auth/forgot-password/request)
# =====================================================================

@router.post("/forgot-password/request")
async def forgot_password_request(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Initiates Password Reset:
    - Checks registered verified email
    - Generates 6-digit Reset OTP
    - Dispatches password reset security email
    - Returns reset_token
    """
    clean_email = payload.email.strip().lower()
    user = db.query(User).filter(
        func.lower(User.email) == clean_email,
        User.is_verified == True
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No verified account found with this email address."
        )

    # Invalidate previous unused reset OTPs
    db.query(EmailOTP).filter(
        EmailOTP.user_id == user.id,
        EmailOTP.purpose == "password_reset",
        EmailOTP.is_used == False
    ).update({"is_used": True})

    otp = generate_secure_otp()
    otp_hash = hash_otp(otp)
    reset_token = generate_uuid_token()
    expires_at = utc_now() + timedelta(minutes=5)

    otp_record = EmailOTP(
        user_id=user.id,
        otp_hash=otp_hash,
        token=reset_token,
        purpose="password_reset",
        attempts_count=0,
        is_used=False,
        expires_at=expires_at
    )
    db.add(otp_record)
    db.commit()

    # Dispatch email in background
    background_tasks.add_task(send_password_reset_email, user.email, user.name, otp)

    logger.info(f"Password reset OTP dispatched for: {user.email}")
    return {
        "status": "otp_sent",
        "reset_token": reset_token,
        "email": user.email,
        "message": "Password reset code sent to your email address."
    }


# =====================================================================
# 7. Forgot Password Reset (POST /api/auth/forgot-password/reset)
# =====================================================================

@router.post("/forgot-password/reset")
def forgot_password_reset(
    payload: ForgotPasswordResetRequest,
    db: Session = Depends(get_db)
):
    """
    Completes Password Reset:
    - Verifies 6-digit reset OTP code
    - Enforces 5-minute expiry and max 3 attempts
    - Updates user password hash
    """
    otp_record = db.query(EmailOTP).filter(
        EmailOTP.token == payload.reset_token,
        EmailOTP.purpose == "password_reset",
        EmailOTP.is_used == False
    ).first()

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset session. Please request a new code."
        )

    now = utc_now()
    record_expires = otp_record.expires_at
    if record_expires.tzinfo is None:
        from datetime import timezone
        record_expires = record_expires.replace(tzinfo=timezone.utc)

    if record_expires < now:
        otp_record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset code has expired. Please request a new one."
        )

    if otp_record.attempts_count >= 3:
        otp_record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum verification attempts exceeded. Please request a new code."
        )

    if not verify_otp(payload.otp, otp_record.otp_hash):
        otp_record.attempts_count += 1
        db.commit()
        remaining = max(0, 3 - otp_record.attempts_count)
        if remaining == 0:
            otp_record.is_used = True
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum verification attempts exceeded. Please request a new code."
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid reset code. {remaining} attempt(s) remaining."
        )

    if len(payload.new_password.strip()) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long."
        )

    otp_record.is_used = True
    user = db.query(User).filter(User.id == otp_record.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    user.password_hash = hash_password(payload.new_password.strip())
    db.commit()

    logger.info(f"Password reset successfully completed for: {user.email}")
    return {
        "status": "password_updated",
        "message": "Password reset successfully. You can now login with your new password."
    }


# =====================================================================
# 8. Check Current Session (GET /api/auth/me)
# =====================================================================

@router.get("/me")
def get_current_auth_state(
    user: Optional[User] = Depends(get_current_user)
):
    """
    Returns the current session state.
    Returns 200 with authenticated: false if unauthenticated for smooth frontend polling.
    """
    if not user:
        return {
            "authenticated": False,
            "user": None
        }

    return {
        "authenticated": True,
        "user": user.to_dict()
    }


# =====================================================================
# 9. Logout Session (POST /api/auth/logout)
# =====================================================================

@router.post("/logout")
def logout(
    response: Response
):
    """
    Terminates user session by clearing the HttpOnly session cookie.
    """
    clear_auth_cookie(response)
    return {
        "status": "logged_out",
        "message": "Logged out successfully."
    }

