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
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
SQLITE_PATH = DATA_DIR / "portfolio.db"

# Authentication & Google OAuth
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "").strip()
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "folioblox-insecure-dev-secret-key-change-in-prod").strip()
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256").strip()
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", 60 * 24 * 7))  # 7 days
AUTH_COOKIE_NAME = os.getenv("AUTH_COOKIE_NAME", "portfolio_auth").strip()

# Async Email Dispatcher (SMTP)
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com").strip()
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "").strip()
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "").strip()
MAIL_FROM = os.getenv("MAIL_FROM", "Folioblox Security <no-reply@folioblox.dev>").strip()
SMTP_ENABLED = bool(SMTP_USER and SMTP_PASSWORD)

# Ensure runtime directories exist
for directory in (BACKUPS_DIR, UPLOADS_DIR, ASSETS_DIR):
    directory.mkdir(parents=True, exist_ok=True)
