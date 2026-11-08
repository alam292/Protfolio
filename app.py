"""
app.py - High-Performance Python FastAPI Backend for Folioblox Portfolio
Serves static portfolio assets and provides API endpoints for dynamic portfolio data,
health status, admin security PIN verification, and version history.
"""

import os
import json
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment configuration (.env)
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
PORTFOLIO_PATH = DATA_DIR / "portfolio.json"
BACKUPS_DIR = DATA_DIR / "backups"
ASSETS_DIR = BASE_DIR / "assets"
UPLOADS_DIR = BASE_DIR / "uploads"
CSS_DIR = BASE_DIR / "css"
JS_DIR = BASE_DIR / "js"
PROFILE_DIR = BASE_DIR / "profile"

# Ensure essential directories exist
for directory in [DATA_DIR, BACKUPS_DIR, ASSETS_DIR, UPLOADS_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="Folioblox AI Portfolio API",
    description="Python FastAPI backend for Folioblox dynamic portfolio with Gemini AI resume intelligence",
    version="1.0.0"
)

# Global CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# Pydantic Schemas for Request Validation
class VerifyPinRequest(BaseModel):
    pin: Optional[str] = None


# Helper: Admin PIN Validation
def check_admin_pin(request: Request, body_pin: Optional[str] = None) -> bool:
    configured_pin = os.getenv("ADMIN_UPLOAD_PIN", "").strip()
    if not configured_pin:
        # If no PIN configured in environment, allow all operations
        return True

    # Check header, body, or query param
    header_pin = request.headers.get("x-admin-pin")
    query_pin = request.query_params.get("pin")
    provided_pin = body_pin or header_pin or query_pin or ""

    return str(provided_pin).strip() == configured_pin


# -------------------------------------------------------------
# API Endpoints
# -------------------------------------------------------------

@app.get("/api/health")
async def health_check():
    """Health check endpoint to monitor server status and Gemini configuration."""
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "runtime": "Python FastAPI",
        "gemini_configured": bool(gemini_key)
    }


@app.get("/api/portfolio")
async def get_portfolio():
    """Serves the live portfolio data from data/portfolio.json."""
    if not PORTFOLIO_PATH.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": "portfolio.json not found"}
        )
    try:
        with open(PORTFOLIO_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        return JSONResponse(
            content=data,
            headers={"Cache-Control": "no-cache"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "error": str(e)}
        )


@app.get("/api/backups")
async def list_backups():
    """Lists timestamped backup snapshots in data/backups/."""
    try:
        if not BACKUPS_DIR.exists():
            return {"success": True, "count": 0, "backups": []}

        backup_files = []
        for file_path in BACKUPS_DIR.glob("*.json"):
            stats = file_path.stat()
            size_kb = stats.st_size / 1024
            mtime_dt = datetime.fromtimestamp(stats.st_mtime)

            backup_files.append({
                "filename": file_path.name,
                "path": f"data/backups/{file_path.name}",
                "size": stats.st_size,
                "sizeBytes": stats.st_size,
                "sizeFormatted": f"{size_kb:.1f} KB",
                "created": mtime_dt.isoformat(),
                "timestampIso": mtime_dt.isoformat(),
                "formattedDate": mtime_dt.strftime("%b %d, %Y, %I:%M %p")
            })

        # Sort by creation timestamp descending (newest first)
        backup_files.sort(key=lambda x: x["created"], reverse=True)

        return {
            "success": True,
            "count": len(backup_files),
            "backups": backup_files
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "error": str(e)}
        )


@app.post("/api/verify-pin")
async def verify_pin(request: Request, payload: Optional[VerifyPinRequest] = None):
    """Verifies user-provided Admin Security PIN against environment configuration."""
    configured_pin = os.getenv("ADMIN_UPLOAD_PIN", "").strip()
    if not configured_pin:
        return {"success": True, "required": False, "valid": True}

    provided_pin = payload.pin if payload else None
    valid = check_admin_pin(request, provided_pin)

    return {
        "success": True,
        "required": True,
        "valid": valid
    }


# -------------------------------------------------------------
# Static Files & Frontend Mounts
# -------------------------------------------------------------

# Mount component & asset directories
if CSS_DIR.exists():
    app.mount("/css", StaticFiles(directory=str(CSS_DIR)), name="css")

if JS_DIR.exists():
    app.mount("/js", StaticFiles(directory=str(JS_DIR)), name="js")

if ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")

if DATA_DIR.exists():
    app.mount("/data", StaticFiles(directory=str(DATA_DIR)), name="data")

if UPLOADS_DIR.exists():
    app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

if PROFILE_DIR.exists():
    app.mount("/profile", StaticFiles(directory=str(PROFILE_DIR)), name="profile")


# Root and Index Handlers
@app.get("/", response_class=HTMLResponse)
@app.get("/index.html", response_class=HTMLResponse)
async def serve_index():
    index_file = BASE_DIR / "index.html"
    if not index_file.exists():
        raise HTTPException(status_code=404, detail="index.html not found")
    return FileResponse(index_file, media_type="text/html")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print(f"[Python FastAPI] Starting server on http://localhost:{port}")
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)

