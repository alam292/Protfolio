"""
Database Models (server_py/models.py)
Defines schema tables for Portfolio content, version rollbacks, contact inquiries, and audit logs.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON
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
