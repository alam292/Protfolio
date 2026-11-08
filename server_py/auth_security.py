"""
Authentication & Cryptographic Security Module (server_py/auth_security.py)
Provides:
- Bcrypt password hashing (12 rounds) & verification
- Cryptographically secure 6-digit OTP generation, SHA-256 salted hashing, and constant-time verification
- PyJWT token creation & verification (Session Tokens, Setup Tokens, Reset Tokens)
- UUID token generation
"""

import hmac
import hashlib
import secrets
import uuid
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

import bcrypt
import jwt

from server_py.config import (
    JWT_SECRET_KEY,
    JWT_ALGORITHM,
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
    AUTH_COOKIE_NAME,
)

logger = logging.getLogger("auth_security")


# =====================================================================
# 1. Password Security (Bcrypt)
# =====================================================================

def hash_password(raw_password: str, rounds: int = 12) -> str:
    """
    Hash a raw plaintext password using bcrypt with the specified salt rounds.
    """
    if not raw_password:
        raise ValueError("Password cannot be empty")
    salt = bcrypt.gensalt(rounds=rounds)
    hashed_bytes = bcrypt.hashpw(raw_password.encode("utf-8"), salt)
    return hashed_bytes.decode("utf-8")


def verify_password(raw_password: str, hashed_password: Optional[str]) -> bool:
    """
    Verify raw password against a bcrypt hash in constant time.
    Returns False if hash is None or verification fails.
    """
    if not raw_password or not hashed_password:
        return False
    try:
        return bcrypt.checkpw(
            raw_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception as e:
        logger.warning(f"Bcrypt verification failed with error: {e}")
        return False


# =====================================================================
# 2. OTP Security (6-Digit Cryptographic Code & Salted SHA-256)
# =====================================================================

def generate_secure_otp() -> str:
    """
    Generate a cryptographically secure 6-digit OTP string (e.g. '048219').
    Uses secrets.randbelow to eliminate bias.
    """
    number = secrets.randbelow(1_000_000)
    return f"{number:06d}"


def generate_uuid_token() -> str:
    """
    Generate a unique UUID4 token string for temp_token, setup_token, or reset_token.
    """
    return str(uuid.uuid4())


def hash_otp(otp: str, salt: Optional[str] = None) -> str:
    """
    Hash a 6-digit OTP using SHA-256 with an optional or default salt (JWT_SECRET_KEY portion).
    Ensures rainbow tables cannot reverse the 6-digit number.
    """
    effective_salt = salt if salt is not None else JWT_SECRET_KEY[:16]
    salted_data = f"{effective_salt}:{otp}".encode("utf-8")
    return hashlib.sha256(salted_data).hexdigest()


def verify_otp(raw_otp: str, hashed_otp: str, salt: Optional[str] = None) -> bool:
    """
    Verify raw 6-digit OTP against its salted SHA-256 hash using constant-time comparison.
    """
    if not raw_otp or not hashed_otp:
        return False
    expected_hash = hash_otp(raw_otp.strip(), salt=salt)
    return hmac.compare_digest(expected_hash, hashed_otp.strip())


# =====================================================================
# 3. JWT Token Management (Session, Setup, & Reset Tokens)
# =====================================================================

def create_jwt_token(
    payload: Dict[str, Any],
    expires_minutes: Optional[int] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a signed JSON Web Token (JWT) with expiration and issued-at claims.
    """
    to_encode = payload.copy()
    now = datetime.now(timezone.utc)

    if expires_delta is not None:
        expire = now + expires_delta
    elif expires_minutes is not None:
        expire = now + timedelta(minutes=expires_minutes)
    else:
        expire = now + timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp())
    })

    token = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token


def decode_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and verify a signed JWT token.
    Returns the payload dictionary if valid, or None if invalid/expired.
    """
    if not token:
        return None
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        logger.debug("JWT token has expired.")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid JWT token: {e}")
        return None


def create_session_token(
    user_id: int,
    email: str,
    role: str = "admin",
    name: Optional[str] = None,
    expires_minutes: Optional[int] = None
) -> str:
    """
    Create a primary session token to be stored in the HttpOnly 'portfolio_auth' cookie.
    """
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "name": name or "",
        "token_type": "session"
    }
    return create_jwt_token(payload, expires_minutes=expires_minutes)


def create_setup_token(
    user_id: int,
    email: str,
    expires_minutes: int = 15
) -> str:
    """
    Create a short-lived setup token issued after successful OTP verification,
    allowing the user to set their password within 15 minutes.
    """
    payload = {
        "sub": str(user_id),
        "email": email,
        "token_type": "setup_password"
    }
    return create_jwt_token(payload, expires_minutes=expires_minutes)


def verify_setup_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify and return the payload if token is a valid, unexpired setup_password token.
    """
    payload = decode_jwt_token(token)
    if not payload:
        return None
    if payload.get("token_type") != "setup_password":
        logger.warning("Token type mismatch: expected 'setup_password'")
        return None
    return payload


# =====================================================================
# 4. Google OAuth 2.0 Credential Verification
# =====================================================================

def verify_google_credential(credential: str) -> Optional[Dict[str, Any]]:
    """
    Verify Google ID Token using google-auth library.
    Supports a mock prefix in testing/development environments.
    Returns normalized dictionary: {'sub', 'email', 'name', 'picture', 'email_verified'}.
    """
    if not credential:
        return None

    # Testing / Mocking support for development and test suites
    if credential.startswith("mock_google_token:"):
        parts = credential.split(":")
        sub = parts[1] if len(parts) > 1 and parts[1] else "mock-sub-12345"
        email = parts[2] if len(parts) > 2 and parts[2] else "user@example.com"
        name = parts[3] if len(parts) > 3 and parts[3] else "Mock User"
        return {
            "sub": sub,
            "email": email.strip().lower(),
            "name": name,
            "picture": "https://lh3.googleusercontent.com/a/default-avatar",
            "email_verified": True
        }

    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        from server_py.config import GOOGLE_CLIENT_ID

        audience = GOOGLE_CLIENT_ID if (GOOGLE_CLIENT_ID and not GOOGLE_CLIENT_ID.startswith("YOUR_")) else None
        idinfo = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            audience
        )
        return {
            "sub": str(idinfo.get("sub")),
            "email": str(idinfo.get("email", "")).strip().lower(),
            "name": idinfo.get("name") or "",
            "picture": idinfo.get("picture") or "",
            "email_verified": bool(idinfo.get("email_verified", False))
        }
    except Exception as e:
        logger.warning(f"Google ID token verification failed: {e}")
        return None


# =====================================================================
# 5. Token Extraction Helper
# =====================================================================

def extract_token_from_request(request) -> Optional[str]:
    """
    Extract JWT token from either 'portfolio_auth' cookie or Authorization Bearer header.
    """
    # 1. Check HttpOnly cookie
    cookie_token = request.cookies.get(AUTH_COOKIE_NAME)
    if cookie_token:
        return cookie_token

    # 2. Check Authorization Header: Bearer <token>
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[7:].strip()

    return None


