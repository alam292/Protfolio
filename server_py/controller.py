"""
Resume Upload & Persistence Controller (server_py/controller.py)
Handles diff computation, automated backup snapshots, Admin PIN authentication,
atomic JSON writes, and rollback recovery.
"""

import os
import json
import shutil
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, Tuple

from .config import (
    PORTFOLIO_PATH,
    BACKUPS_DIR,
    UPLOADS_DIR,
    ASSETS_DIR,
    ADMIN_UPLOAD_PIN
)
from .resume_parser import validate_and_merge_portfolio
from .github_sync import sync_portfolio_to_github


def verify_admin_pin(provided_pin: Optional[str]) -> bool:
    """
    Verify if the provided Admin PIN matches the configured secret.
    If no PIN is configured, returns True.
    """
    if not ADMIN_UPLOAD_PIN:
        return True
    return str(provided_pin or "").strip() == str(ADMIN_UPLOAD_PIN).strip()


def create_portfolio_backup() -> Optional[str]:
    """
    Create a timestamped backup snapshot of data/portfolio.json.
    Returns relative path (e.g. 'data/backups/portfolio-TIMESTAMP.json').
    """
    if not PORTFOLIO_PATH.exists():
        return None

    timestamp = datetime.utcnow().strftime("%Y-%m-%dT%H-%M-%S-%fZ")
    backup_filename = f"portfolio-{timestamp}.json"
    backup_file_path = BACKUPS_DIR / backup_filename

    shutil.copyfile(PORTFOLIO_PATH, backup_file_path)
    print(f"[Backup Engine] Created automated snapshot: {backup_filename}")
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


def list_backups() -> list:
    """
    List all timestamped backup snapshots in descending chronological order.
    """
    if not BACKUPS_DIR.exists():
        return []

    backups = []
    for f in BACKUPS_DIR.glob("*.json"):
        stats = f.stat()
        mtime = datetime.fromtimestamp(stats.st_mtime)
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
    sync_portfolio_to_github(serialized)


def restore_backup(filename: str, pin: Optional[str]) -> Tuple[bool, int, Dict[str, Any]]:
    """
    Rollback portfolio.json to a specific backup snapshot.
    Returns (success, status_code, response_dict).
    """
    if not verify_admin_pin(pin):
        return False, 401, {"success": False, "error": "Unauthorized: Invalid or missing Admin Security PIN."}

    if not filename or not isinstance(filename, str):
        return False, 400, {"success": False, "error": "Backup filename is required."}

    if ".." in filename or "/" in filename or "\\" in filename or not filename.endswith(".json"):
        return False, 400, {"success": False, "error": "Invalid backup filename format."}

    backup_file_path = BACKUPS_DIR / Path(filename).name
    if not backup_file_path.exists():
        return False, 404, {"success": False, "error": f"Selected backup '{filename}' does not exist."}

    try:
        with open(backup_file_path, "r", encoding="utf-8") as f:
            parsed_backup = json.load(f)
        if not isinstance(parsed_backup, dict):
            raise ValueError("Backup content is not a valid JSON dictionary.")
    except Exception as e:
        return False, 422, {"success": False, "error": f"Backup file contains corrupted JSON: {e}"}

    # Pre-rollback safety snapshot
    safety_snapshot = create_portfolio_backup()
    print(f"[Rollback Engine] Created pre-rollback safety snapshot: {safety_snapshot}")

    # Atomic restore
    atomic_write_portfolio(parsed_backup)
    print(f"[Rollback Engine] Successfully restored portfolio from backup: {filename}")

    return True, 200, {
        "success": True,
        "message": f"Portfolio successfully rolled back to snapshot: {filename}",
        "restoredFilename": filename,
        "safetyBackup": safety_snapshot,
        "data": parsed_backup
    }


def publish_portfolio(data: Dict[str, Any], resume_filename: Optional[str], pin: Optional[str]) -> Tuple[bool, int, Dict[str, Any]]:
    """
    Commit user-approved staged portfolio data and persist to disk.
    Returns (success, status_code, response_dict).
    """
    if not verify_admin_pin(pin):
        return False, 401, {"success": False, "error": "Unauthorized: Invalid or missing Admin Security PIN."}

    if not data or not isinstance(data, dict):
        return False, 400, {"success": False, "error": "Invalid portfolio data payload provided."}

    base_portfolio = {}
    if PORTFOLIO_PATH.exists():
        try:
            with open(PORTFOLIO_PATH, "r", encoding="utf-8") as f:
                base_portfolio = json.load(f)
        except Exception as e:
            print(f"[Publish Engine Warning] Read baseline failed: {e}")

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
                print(f"[Publish Engine] Copied uploaded asset to: assets/{sanitized_name}")

        finalized_data["profile"] = finalized_data.get("profile", {})
        finalized_data["profile"]["resumeUrl"] = f"assets/{sanitized_name}"
        finalized_data["profile"]["resumeFilename"] = sanitized_name

    backup_path = create_portfolio_backup()
    atomic_write_portfolio(finalized_data)
    print(f"[Publish Engine] Successfully published portfolio live! Backup: {backup_path}")

    return True, 200, {
        "success": True,
        "message": "Portfolio updated and published live successfully!",
        "backup": backup_path,
        "data": finalized_data
    }
