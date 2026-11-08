"""
Configuration & Environment Settings (server_py/config.py)
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Base paths
ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
PORTFOLIO_PATH = DATA_DIR / "portfolio.json"
BACKUPS_DIR = DATA_DIR / "backups"
UPLOADS_DIR = ROOT_DIR / "uploads"
ASSETS_DIR = ROOT_DIR / "assets"

# Load .env file with override support
load_dotenv(ROOT_DIR / ".env", override=True)


def get_gemini_api_key() -> str:
    """
    Retrieve sanitized Gemini API key from environment with fallback to GOOGLE_API_KEY.
    Strips surrounding quotes and whitespace, and ignores placeholders.
    """
    raw_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or ""
    # Strip quotes, whitespace, and newlines
    cleaned = raw_key.strip(" \t\r\n\"'")
    if not cleaned or cleaned == "YOUR_GEMINI_API_KEY_HERE":
        return ""
    return cleaned


# Environment configurations
ADMIN_UPLOAD_PIN = os.getenv("ADMIN_UPLOAD_PIN", "1234").strip()
GEMINI_API_KEY = get_gemini_api_key()
PORT = int(os.getenv("PORT", 8000))
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
SQLITE_PATH = DATA_DIR / "portfolio.db"

# Ensure runtime directories exist
for directory in (BACKUPS_DIR, UPLOADS_DIR, ASSETS_DIR):
    directory.mkdir(parents=True, exist_ok=True)
