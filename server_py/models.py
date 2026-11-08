"""
Database Models (server_py/models.py)
Defines schema tables for Portfolio content, version rollbacks, contact inquiries, and audit logs.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from server_py.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Portfolio(Base):
    """
    Active Portfolio Schema Table.
    Stores the full structured portfolio document (profile, skills, projects, etc.)
    """
    __tablename__ = "portfolio_data"

    id = Column(Integer, primary_key=True, index=True)
    version = Column(String(64), default="v1.0.0", nullable=False)
    content = Column(JSON, nullable=False)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    def to_dict(self):
        return {
            "id": self.id,
            "version": self.version,
            "isActive": self.is_active,
            "updatedAt": self.updated_at.isoformat() + "Z" if self.updated_at else None,
            "content": self.content
        }


class PortfolioVersion(Base):
    """
    Historical Version Snapshots Table.
    Preserves rollback points before AI resume publishing or manual changes.
    """
    __tablename__ = "portfolio_versions"

    id = Column(Integer, primary_key=True, index=True)
    backup_id = Column(String(128), unique=True, index=True, nullable=False)
    reason = Column(String(255), default="Automated snapshot before publish")
    content = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=utc_now)

    def to_dict(self):
        return {
            "id": self.id,
            "backupId": self.backup_id,
            "filename": f"{self.backup_id}.json",
            "reason": self.reason,
            "timestamp": self.created_at.isoformat() + "Z" if self.created_at else None,
            "content": self.content
        }


class ContactMessage(Base):
    """
    Contact Messages Table.
    Stores inquiries and project scope transmissions from clients and recruiters.
    """
    __tablename__ = "contact_messages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    subject = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    service_type = Column(String(64), nullable=True)
    status = Column(String(32), default="unread", index=True)  # unread, read, replied, archived
    created_at = Column(DateTime, default=utc_now)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "subject": self.subject,
            "message": self.message,
            "serviceType": self.service_type,
            "status": self.status,
            "createdAt": self.created_at.isoformat() + "Z" if self.created_at else None
        }


class AuditLog(Base):
    """
    Audit Log Table.
    Tracks security events, AI parser calls, and administrative operations.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(64), nullable=False, index=True)
    ip_address = Column(String(64), nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    def to_dict(self):
        return {
            "id": self.id,
            "action": self.action,
            "ipAddress": self.ip_address,
            "details": self.details,
            "createdAt": self.created_at.isoformat() + "Z" if self.created_at else None
        }


class User(Base):
    """
    User Account Table.
    Supports both Google OAuth identification and bcrypt password authentication.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    google_sub = Column(String(255), unique=True, index=True, nullable=True)  # Linked Google Sub ID
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True)                       # Bcrypt hash (NULL until set)
    name = Column(String(255), nullable=True)
    avatar_url = Column(String(1024), nullable=True)
    role = Column(String(50), default="admin")                               # Role: 'admin' / 'user'
    is_verified = Column(Boolean, default=False)                             # Verified via OTP
    created_at = Column(DateTime, default=utc_now)
    last_login = Column(DateTime, nullable=True)

    otps = relationship("EmailOTP", back_populates="user", cascade="all, delete-orphan")

    def has_password(self) -> bool:
        return self.password_hash is not None

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "avatarUrl": self.avatar_url,
            "role": self.role,
            "isVerified": self.is_verified,
            "hasPassword": self.has_password(),
            "createdAt": self.created_at.isoformat() + "Z" if self.created_at else None,
            "lastLogin": self.last_login.isoformat() + "Z" if self.last_login else None
        }


class EmailOTP(Base):
    """
    OTP Verifications Table.
    Handles 'signup' OTP and 'password_reset' OTP securely.
    """
    __tablename__ = "email_otps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    otp_hash = Column(String(255), nullable=False)                            # SHA-256 salted hash
    token = Column(String(255), unique=True, index=True, nullable=False)      # temp_token or reset_token (UUID4)
    purpose = Column(String(32), default="signup")                            # 'signup' or 'password_reset'
    attempts_count = Column(Integer, default=0)                               # Max 3 attempts
    is_used = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=False)                            # 5 minutes validity
    created_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="otps")

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "token": self.token,
            "purpose": self.purpose,
            "attemptsCount": self.attempts_count,
            "isUsed": self.is_used,
            "expiresAt": self.expires_at.isoformat() + "Z" if self.expires_at else None,
            "createdAt": self.created_at.isoformat() + "Z" if self.created_at else None
        }

