"""
Resume Upload & Persistence Controller (server_py/controller.py)
Handles diff computation, automated backup snapshots, Admin PIN authentication,
database-first persistence with JSON fallback, and contact inquiries.
"""

import os
import json
import shutil
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional, Tuple, List
from sqlalchemy.orm import Session

from .config import (
    PORTFOLIO_PATH,
    BACKUPS_DIR,
    UPLOADS_DIR,
    ASSETS_DIR,
    ADMIN_UPLOAD_PIN
)
from .database import SessionLocal
from .models import Portfolio, PortfolioVersion, ContactMessage, AuditLog
from .resume_parser import validate_and_merge_portfolio
from .github_sync import sync_portfolio_to_github

logger = logging.getLogger("folioblox.controller")


def get_utc_now():
    return datetime.now(timezone.utc)


def verify_admin_pin(provided_pin: Optional[str]) -> bool:
    """
    Verify if the provided Admin PIN matches the configured secret.
    If no PIN is configured, returns True.
    """
    if not ADMIN_UPLOAD_PIN:
        return True
    return str(provided_pin or "").strip() == str(ADMIN_UPLOAD_PIN).strip()


def get_active_portfolio(db: Optional[Session] = None) -> Dict[str, Any]:
    """
    Retrieve current active portfolio schema.
    Database-first: Queries DB, falls back to data/portfolio.json if DB unavailable.
    """
    close_db = False
    if db is None:
        try:
            db = SessionLocal()
            close_db = True
        except Exception as e:
            logger.warning(f"Failed to obtain DB session: {e}. Falling back to JSON file.")
            db = None

    if db is not None:
        try:
            active_row = db.query(Portfolio).filter(Portfolio.is_active == True).order_by(Portfolio.id.desc()).first()
            if active_row and isinstance(active_row.content, dict):
                return active_row.content
        except Exception as exc:
            logger.warning(f"DB query for active portfolio failed: {exc}. Falling back to file.")
        finally:
            if close_db:
                db.close()

    # Fallback to local JSON file
    if PORTFOLIO_PATH.exists():
        try:
            with open(PORTFOLIO_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as exc:
            logger.error(f"Failed reading portfolio.json: {exc}")

    return {}


def create_portfolio_backup(db: Optional[Session] = None, reason: str = "Automated snapshot") -> Optional[str]:
    """
    Create a timestamped backup snapshot both on disk and in the database.
    Returns relative path (e.g. 'data/backups/portfolio-TIMESTAMP.json').
    """
    current_data = get_active_portfolio(db)
    if not current_data:
        return None

    timestamp = get_utc_now().strftime("%Y-%m-%dT%H-%M-%S-%fZ")
    backup_filename = f"portfolio-{timestamp}.json"
    backup_id = f"portfolio-{timestamp}"
    backup_file_path = BACKUPS_DIR / backup_filename

    # 1. File snapshot
    try:
        with open(backup_file_path, "w", encoding="utf-8") as f:
            json.dump(current_data, f, indent=2, ensure_ascii=False)
        logger.info(f"Created file snapshot: {backup_filename}")
    except Exception as exc:
        logger.error(f"Error saving file snapshot: {exc}")

    # 2. Database snapshot
    close_db = False
    if db is None:
        try:
            db = SessionLocal()
            close_db = True
        except Exception:
            db = None

    if db is not None:
        try:
            version_entry = PortfolioVersion(
                backup_id=backup_id,
                reason=reason,
                content=current_data,
                created_at=get_utc_now()
            )
            db.add(version_entry)
            db.commit()
            logger.info(f"Recorded version snapshot in DB: {backup_id}")
        except Exception as exc:
            db.rollback()
            logger.warning(f"Failed to record version snapshot in DB: {exc}")
        finally:
            if close_db:
                db.close()

    return f"data/backups/{backup_filename}"


def compute_portfolio_diff(old_data: Dict[str, Any] = None, new_data: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Compute structured differences between baseline portfolio and newly parsed candidate portfolio.
    """
    old_data = old_data or {}
    new_data = new_data or {}

    diff: Dict[str, Any] = {
        "hasChanges": False,
        "profile": {},
        "about": {"highlightsChanged": False, "highlightsCount": 0, "items": []},
        "skills": {"added": [], "removed": [], "totalOld": 0, "totalNew": 0, "categoriesCount": 0},
        "experience": {"oldCount": 0, "newCount": 0, "roles": []},
        "projects": {"oldCount": 0, "newCount": 0, "titles": []},
        "education": {"oldCount": 0, "newCount": 0, "degrees": []},
        "certifications": {"oldCount": 0, "newCount": 0}
    }

    old_prof = old_data.get("profile", {})
    new_prof = new_data.get("profile", {})

    for field in ("name", "title", "email"):
        old_val = old_prof.get(field)
        new_val = new_prof.get(field)
        if new_val and old_val != new_val:
            diff["profile"][field] = {"old": old_val, "new": new_val}
            diff["hasChanges"] = True

    # Skills diff
    def extract_skills(data: Dict[str, Any]) -> list:
        skills = []
        for cat in data.get("skills", {}).get("categories", []):
            for s in (cat.get("skills") or cat.get("items") or []):
                name = s.get("name") if isinstance(s, dict) else s
                if name:
                    skills.append(name)
        return skills

    old_skills = extract_skills(old_data)
    new_skills = extract_skills(new_data)

    added_skills = [s for s in new_skills if s not in old_skills]
    removed_skills = [s for s in old_skills if s not in new_skills]

    diff["skills"] = {
        "added": added_skills,
        "removed": removed_skills,
        "totalOld": len(old_skills),
        "totalNew": len(new_skills),
        "categoriesCount": len(new_data.get("skills", {}).get("categories", []))
    }
    if added_skills or removed_skills or len(old_skills) != len(new_skills):
        diff["hasChanges"] = True

    # About highlights
    old_hl = old_data.get("about", {}).get("highlights", [])
    new_hl = new_data.get("about", {}).get("highlights", [])
    hl_changed = json.dumps(old_hl, sort_keys=True) != json.dumps(new_hl, sort_keys=True)
    diff["about"] = {
        "highlightsChanged": hl_changed,
        "highlightsCount": len(new_hl),
        "items": [{"title": h.get("title", ""), "stat": h.get("stat", "")} for h in new_hl]
    }
    if hl_changed:
        diff["hasChanges"] = True

    # Experience
    old_roles = old_data.get("experience", {}).get("roles", [])
    new_roles = new_data.get("experience", {}).get("roles", [])
    diff["experience"] = {
        "oldCount": len(old_roles),
        "newCount": len(new_roles),
        "roles": [f"{r.get('role') or r.get('title') or 'Role'} @ {r.get('company', 'Company')}" for r in new_roles]
    }
    if len(old_roles) != len(new_roles):
        diff["hasChanges"] = True

    # Projects
    old_proj = old_data.get("projects", {}).get("items", [])
    new_proj = new_data.get("projects", {}).get("items", [])
    diff["projects"] = {
        "oldCount": len(old_proj),
        "newCount": len(new_proj),
        "titles": [p.get("title") or p.get("name") or "Project" for p in new_proj]
    }
    if len(old_proj) != len(new_proj):
        diff["hasChanges"] = True

    # Education
    old_edu = old_data.get("education", {}).get("degrees", [])
    new_edu = new_data.get("education", {}).get("degrees", [])
    diff["education"] = {
        "oldCount": len(old_edu),
        "newCount": len(new_edu),
        "degrees": [f"{d.get('degree', 'Degree')} - {d.get('institution', 'Institution')}" for d in new_edu]
    }
    if len(old_edu) != len(new_edu):
        diff["hasChanges"] = True

    # Certifications
    old_cert = old_data.get("certifications", {}).get("items", [])
    new_cert = new_data.get("certifications", {}).get("items", [])
    diff["certifications"] = {
        "oldCount": len(old_cert),
        "newCount": len(new_cert)
    }
    if len(old_cert) != len(new_cert):
        diff["hasChanges"] = True

    return diff


def list_backups(db: Optional[Session] = None) -> list:
    """
    List all timestamped backup snapshots in descending chronological order.
    Queries database portfolio_versions first, falling back to data/backups/ directory.
    """
    close_db = False
    if db is None:
        try:
            db = SessionLocal()
            close_db = True
        except Exception:
            db = None

    if db is not None:
        try:
            db_versions = db.query(PortfolioVersion).order_by(PortfolioVersion.created_at.desc()).limit(100).all()
            if db_versions:
                results = []
                for v in db_versions:
                    results.append({
                        "filename": f"{v.backup_id}.json",
                        "backupId": v.backup_id,
                        "path": f"data/backups/{v.backup_id}.json",
                        "reason": v.reason,
                        "created": v.created_at.timestamp() if v.created_at else 0,
                        "timestampIso": v.created_at.isoformat() + "Z" if v.created_at else None,
                        "formattedDate": v.created_at.strftime("%b %d, %Y, %I:%M %p") if v.created_at else "Unknown"
                    })
                return results
        except Exception as exc:
            logger.warning(f"Querying portfolio_versions failed: {exc}. Reading disk.")
        finally:
            if close_db:
                db.close()

    # Disk fallback
    if not BACKUPS_DIR.exists():
        return []

    backups = []
    for f in BACKUPS_DIR.glob("*.json"):
        stats = f.stat()
        mtime = datetime.fromtimestamp(stats.st_mtime, timezone.utc)
        backups.append({
            "filename": f.name,
            "path": f"data/backups/{f.name}",
            "size": stats.st_size,
            "sizeBytes": stats.st_size,
            "sizeFormatted": f"{(stats.st_size / 1024):.1f} KB",
            "created": stats.st_mtime,
            "timestampIso": mtime.isoformat(),
            "formattedDate": mtime.strftime("%b %d, %Y, %I:%M %p")
        })

    backups.sort(key=lambda x: x["created"], reverse=True)
    return backups


def atomic_write_portfolio(data: Dict[str, Any]) -> None:
    """
    Atomically write JSON data to data/portfolio.json using a temp file.
    """
    temp_path = PORTFOLIO_PATH.with_suffix(".tmp")
    serialized = json.dumps(data, indent=2, ensure_ascii=False)
    with open(temp_path, "w", encoding="utf-8") as f:
        f.write(serialized)
    try:
        temp_path.replace(PORTFOLIO_PATH)
    except Exception:
        shutil.copyfile(temp_path, PORTFOLIO_PATH)
        try:
            temp_path.unlink()
        except Exception:
            pass

    # Optional GitHub Sync for free ephemeral cloud tiers (Render)
    try:
        sync_portfolio_to_github(serialized)
    except Exception as exc:
        logger.warning(f"GitHub Sync optional task skipped: {exc}")


def restore_backup(filename: str, pin: Optional[str], db: Optional[Session] = None) -> Tuple[bool, int, Dict[str, Any]]:
    """
    Rollback portfolio to a specific backup snapshot.
    Restores both Database and Disk.
    Returns (success, status_code, response_dict).
    """
    if not verify_admin_pin(pin):
        return False, 401, {"success": False, "error": "Unauthorized: Invalid or missing Admin Security PIN."}

    if not filename or not isinstance(filename, str):
        return False, 400, {"success": False, "error": "Backup filename is required."}

    clean_backup_id = Path(filename).stem
    parsed_backup = None

    # Check database first
    close_db = False
    if db is None:
        try:
            db = SessionLocal()
            close_db = True
        except Exception:
            db = None

    if db is not None:
        try:
            version_row = db.query(PortfolioVersion).filter(PortfolioVersion.backup_id == clean_backup_id).first()
            if version_row and isinstance(version_row.content, dict):
                parsed_backup = version_row.content
        except Exception as exc:
            logger.warning(f"DB lookup for rollback snapshot failed: {exc}")

    # Fallback to disk if DB didn't have it
    if parsed_backup is None:
        backup_file_path = BACKUPS_DIR / f"{clean_backup_id}.json"
        if not backup_file_path.exists():
            if close_db and db:
                db.close()
            return False, 404, {"success": False, "error": f"Selected backup '{filename}' does not exist."}

        try:
            with open(backup_file_path, "r", encoding="utf-8") as f:
                parsed_backup = json.load(f)
            if not isinstance(parsed_backup, dict):
                raise ValueError("Backup content is not a valid JSON dictionary.")
        except Exception as e:
            if close_db and db:
                db.close()
            return False, 422, {"success": False, "error": f"Backup file contains corrupted JSON: {e}"}

    # Pre-rollback safety snapshot
    safety_snapshot = create_portfolio_backup(db=db, reason="Pre-rollback safety snapshot")

    # Update Database active row
    if db is not None:
        try:
            active_row = db.query(Portfolio).filter(Portfolio.is_active == True).first()
            if active_row:
                active_row.content = parsed_backup
                active_row.version = f"rollback-{clean_backup_id[:16]}"
                active_row.updated_at = get_utc_now()
            else:
                active_row = Portfolio(
                    version=f"rollback-{clean_backup_id[:16]}",
                    content=parsed_backup,
                    is_active=True,
                    created_at=get_utc_now(),
                    updated_at=get_utc_now()
                )
                db.add(active_row)

            # Audit log
            log = AuditLog(
                action="rollback",
                details={"restoredBackupId": clean_backup_id, "safetySnapshot": safety_snapshot},
                created_at=get_utc_now()
            )
            db.add(log)
            db.commit()
        except Exception as exc:
            db.rollback()
            logger.error(f"Error persisting rollback to DB: {exc}")
        finally:
            if close_db:
                db.close()

    # Sync to disk
    atomic_write_portfolio(parsed_backup)
    logger.info(f"Successfully restored portfolio from backup: {filename}")

    return True, 200, {
        "success": True,
        "message": f"Portfolio successfully rolled back to snapshot: {filename}",
        "restoredFilename": filename,
        "safetyBackup": safety_snapshot,
        "data": parsed_backup
    }


def publish_portfolio(
    data: Dict[str, Any],
    resume_filename: Optional[str],
    pin: Optional[str],
    db: Optional[Session] = None
) -> Tuple[bool, int, Dict[str, Any]]:
    """
    Commit user-approved staged portfolio data and persist to Database & Disk.
    Returns (success, status_code, response_dict).
    """
    if not verify_admin_pin(pin):
        return False, 401, {"success": False, "error": "Unauthorized: Invalid or missing Admin Security PIN."}

    if not data or not isinstance(data, dict):
        return False, 400, {"success": False, "error": "Invalid portfolio data payload provided."}

    base_portfolio = get_active_portfolio(db)
    finalized_data = validate_and_merge_portfolio(data, base_portfolio)

    if resume_filename:
        sanitized_name = "".join(c if c.isalnum() or c in "._-" else "_" for c in resume_filename)
        asset_dest = ASSETS_DIR / sanitized_name
        if not asset_dest.exists() and UPLOADS_DIR.exists():
            base_target = Path(sanitized_name).stem
            matched = None
            for uf in sorted(UPLOADS_DIR.glob("*"), reverse=True):
                if uf.name.startswith(base_target):
                    matched = uf
                    break
            if matched:
                shutil.copyfile(matched, asset_dest)
                logger.info(f"Copied uploaded asset to: assets/{sanitized_name}")

        finalized_data["profile"] = finalized_data.get("profile", {})
        finalized_data["profile"]["resumeUrl"] = f"assets/{sanitized_name}"
        finalized_data["profile"]["resumeFilename"] = sanitized_name

    # Create safety backup snapshot in DB & disk before overwrite
    backup_path = create_portfolio_backup(db=db, reason="Pre-publish automated snapshot")

    # Persist to Database
    close_db = False
    if db is None:
        try:
            db = SessionLocal()
            close_db = True
        except Exception:
            db = None

    if db is not None:
        try:
            active_row = db.query(Portfolio).filter(Portfolio.is_active == True).first()
            new_version_tag = f"v1.{int(datetime.utcnow().timestamp())}"
            if active_row:
                active_row.content = finalized_data
                active_row.version = new_version_tag
                active_row.updated_at = get_utc_now()
            else:
                active_row = Portfolio(
                    version=new_version_tag,
                    content=finalized_data,
                    is_active=True,
                    created_at=get_utc_now(),
                    updated_at=get_utc_now()
                )
                db.add(active_row)

            # Audit log
            log = AuditLog(
                action="publish_portfolio",
                details={"version": new_version_tag, "resume": resume_filename, "backup": backup_path},
                created_at=get_utc_now()
            )
            db.add(log)
            db.commit()
            logger.info("Portfolio saved to database successfully.")
        except Exception as exc:
            db.rollback()
            logger.error(f"Error saving portfolio to DB: {exc}")
        finally:
            if close_db:
                db.close()

    # Sync to disk
    atomic_write_portfolio(finalized_data)
    logger.info(f"Successfully published portfolio live! Backup: {backup_path}")

    return True, 200, {
        "success": True,
        "message": "Portfolio updated and published live successfully!",
        "backup": backup_path,
        "data": finalized_data
    }


def save_contact_message(
    name: str,
    email: str,
    subject: str,
    message: str,
    service_type: Optional[str] = None,
    db: Optional[Session] = None
) -> Tuple[bool, int, Dict[str, Any]]:
    """
    Validates and stores a contact message / project scope inquiry in the database.
    """
    clean_name = (name or "").strip()
    clean_email = (email or "").strip().lower()
    clean_subject = (subject or "").strip()
    clean_msg = (message or "").strip()
    clean_service = (service_type or "").strip()

    if not clean_name:
        return False, 400, {"success": False, "error": "Please provide your full name."}

    if not clean_email or "@" not in clean_email or "." not in clean_email:
        return False, 400, {"success": False, "error": "Please provide a valid email address."}

    if not clean_subject:
        return False, 400, {"success": False, "error": "Please specify a project subject or scope."}

    if len(clean_msg) < 8:
        return False, 400, {"success": False, "error": "Message content must be at least 8 characters."}

    close_db = False
    if db is None:
        try:
            db = SessionLocal()
            close_db = True
        except Exception as exc:
            logger.error(f"DB connection failed for saving contact message: {exc}")
            return False, 500, {"success": False, "error": "Database service unavailable."}

    try:
        new_msg = ContactMessage(
            name=clean_name,
            email=clean_email,
            subject=clean_subject,
            message=clean_msg,
            service_type=clean_service or "General Inquiry",
            status="unread",
            created_at=get_utc_now()
        )
        db.add(new_msg)

        # Audit log entry
        audit = AuditLog(
            action="contact_message_received",
            details={"sender": clean_name, "email": clean_email, "subject": clean_subject},
            created_at=get_utc_now()
        )
        db.add(audit)
        db.commit()
        db.refresh(new_msg)

        logger.info(f"Stored contact message ID {new_msg.id} from {clean_email}")
        return True, 201, {
            "success": True,
            "message": f"Thank you, {clean_name}! Your transmission has been recorded successfully.",
            "transmissionId": new_msg.id,
            "data": new_msg.to_dict()
        }
    except Exception as exc:
        db.rollback()
        logger.error(f"Failed to insert contact message: {exc}")
        return False, 500, {"success": False, "error": f"Failed to record message: {exc}"}
    finally:
        if close_db:
            db.close()


def list_contact_messages(
    pin: Optional[str],
    db: Optional[Session] = None,
    limit: int = 50
) -> Tuple[bool, int, Dict[str, Any]]:
    """
    Protected Admin endpoint to view contact transmissions.
    """
    if not verify_admin_pin(pin):
        return False, 401, {"success": False, "error": "Unauthorized: Invalid or missing Admin Security PIN."}

    close_db = False
    if db is None:
        try:
            db = SessionLocal()
            close_db = True
        except Exception as exc:
            return False, 500, {"success": False, "error": f"Database unavailable: {exc}"}

    try:
        messages = db.query(ContactMessage).order_by(ContactMessage.created_at.desc()).limit(limit).all()
        return True, 200, {
            "success": True,
            "count": len(messages),
            "messages": [m.to_dict() for m in messages]
        }
    except Exception as exc:
        logger.error(f"Failed to fetch contact messages: {exc}")
        return False, 500, {"success": False, "error": str(exc)}
    finally:
        if close_db:
            db.close()
