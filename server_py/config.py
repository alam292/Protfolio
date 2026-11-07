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

# Load .env file
load_dotenv(ROOT_DIR / ".env")

# Environment configurations
ADMIN_UPLOAD_PIN = os.getenv("ADMIN_UPLOAD_PIN", "1234").strip()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
PORT = int(os.getenv("PORT", 8000))

# Ensure runtime directories exist
for directory in (BACKUPS_DIR, UPLOADS_DIR, ASSETS_DIR):
    directory.mkdir(parents=True, exist_ok=True)
