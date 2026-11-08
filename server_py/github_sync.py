"""
server_py/github_sync.py - Cloud Ephemeral Storage Persistence Engine
Automatically commits portfolio.json and uploaded resume assets to GitHub repository
via the GitHub REST API, ensuring zero data loss on free cloud tiers (e.g. Render.com).
"""

import os
import json
import base64
import logging
from pathlib import Path
from typing import Optional, Dict, Any
import requests

logger = logging.getLogger("folioblox.github_sync")

def is_github_sync_configured() -> bool:
    """Checks whether GitHub token and repository credentials are configured in environment."""
    token = os.getenv("GITHUB_TOKEN", "").strip()
    repo = os.getenv("GITHUB_REPO", "").strip()
    return bool(token and repo)


def get_sync_config() -> Dict[str, str]:
    """Retrieves normalized GitHub synchronization credentials."""
    return {
        "token": os.getenv("GITHUB_TOKEN", "").strip(),
        "repo": os.getenv("GITHUB_REPO", "").strip(),
        "branch": os.getenv("GITHUB_BRANCH", "main").strip() or "main"
    }


def get_github_file_sha(file_path: str, config: Optional[Dict[str, str]] = None) -> Optional[str]:
    """
    Fetches the latest Git SHA blob hash of a file in the remote repository.
    Returns None if file does not exist (new file) or on error.
    """
    cfg = config or get_sync_config()
    if not cfg["token"] or not cfg["repo"]:
        return None

    # Normalize file path (forward slashes)
    clean_path = file_path.replace("\\", "/").lstrip("/")
    url = f"https://api.github.com/repos/{cfg['repo']}/contents/{clean_path}"
    headers = {
        "Authorization": f"Bearer {cfg['token']}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Folioblox-AI-Portfolio-Engine"
    }
    params = {"ref": cfg["branch"]}

    try:
        res = requests.get(url, headers=headers, params=params, timeout=10)
        if res.status_code == 200:
            return res.json().get("sha")
        elif res.status_code == 404:
            return None
        else:
            logger.warning(f"[GitHub SHA Fetch Warning] Status {res.status_code}: {res.text}")
            return None
    except Exception as e:
        logger.error(f"[GitHub SHA Fetch Error] {e}")
        return None


def commit_file_to_github(
    file_path: str,
    content_bytes: bytes,
    commit_message: str,
    config: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """
    Commits or updates a file directly in the remote GitHub repository using the contents API.
    """
    cfg = config or get_sync_config()
    if not cfg["token"] or not cfg["repo"]:
        return {
            "success": False,
            "error": "GITHUB_TOKEN or GITHUB_REPO is not configured."
        }

    clean_path = file_path.replace("\\", "/").lstrip("/")
    url = f"https://api.github.com/repos/{cfg['repo']}/contents/{clean_path}"
    headers = {
        "Authorization": f"Bearer {cfg['token']}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Folioblox-AI-Portfolio-Engine"
    }

    # Fetch existing SHA if file already exists in repository
    existing_sha = get_github_file_sha(clean_path, cfg)

    b64_content = base64.b64encode(content_bytes).decode("utf-8")
    payload = {
        "message": commit_message,
        "content": b64_content,
        "branch": cfg["branch"]
    }
    if existing_sha:
        payload["sha"] = existing_sha

    try:
        res = requests.put(url, headers=headers, json=payload, timeout=15)
        if res.status_code in (200, 201):
            data = res.json()
            return {
                "success": True,
                "path": clean_path,
                "sha": data.get("content", {}).get("sha"),
                "commit": data.get("commit", {}).get("sha"),
                "html_url": data.get("content", {}).get("html_url")
            }
        else:
            err_msg = f"GitHub API rejected commit with HTTP {res.status_code}: {res.text}"
            logger.error(err_msg)
            return {"success": False, "error": err_msg, "status_code": res.status_code}
    except Exception as e:
        err_msg = f"Failed to commit {clean_path} to GitHub: {str(e)}"
        logger.error(err_msg)
        return {"success": False, "error": err_msg}


def sync_portfolio_to_github(
    portfolio_data: Dict[str, Any],
    resume_asset_path: Optional[Path] = None,
    commit_message: Optional[str] = None
) -> Dict[str, Any]:
    """
    High-level orchestrator: commits updated data/portfolio.json and any accompanying
    resume asset to the configured GitHub repository.
    Never raises an uncaught exception (fails safely with warning).
    """
    if not is_github_sync_configured():
        return {
            "synced": False,
            "configured": False,
            "message": "GitHub cloud sync is disabled (GITHUB_TOKEN or GITHUB_REPO not configured). Changes saved to local disk."
        }

    cfg = get_sync_config()
    results = []

    # 1. Sync data/portfolio.json
    try:
        json_content = json.dumps(portfolio_data, indent=2, ensure_ascii=False).encode("utf-8")
        msg = commit_message or "chore(portfolio): auto-sync dynamic portfolio data via AI resume engine"
        json_res = commit_file_to_github("data/portfolio.json", json_content, msg, cfg)
        results.append({"file": "data/portfolio.json", "result": json_res})
    except Exception as e:
        results.append({"file": "data/portfolio.json", "result": {"success": False, "error": str(e)}})

    # 2. Sync resume asset if provided
    if resume_asset_path and Path(resume_asset_path).exists():
        try:
            with open(resume_asset_path, "rb") as f:
                asset_bytes = f.read()
            asset_filename = Path(resume_asset_path).name
            asset_res = commit_file_to_github(
                f"assets/{asset_filename}",
                asset_bytes,
                f"chore(resume): update download asset {asset_filename}",
                cfg
            )
            results.append({"file": f"assets/{asset_filename}", "result": asset_res})
        except Exception as e:
            results.append({"file": str(resume_asset_path), "result": {"success": False, "error": str(e)}})

    all_successful = all(item.get("result", {}).get("success") for item in results)

    return {
        "synced": all_successful,
        "configured": True,
        "repo": cfg["repo"],
        "branch": cfg["branch"],
        "items": results
    }
