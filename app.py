"""
app.py - High-Performance Python FastAPI Backend for Folioblox Portfolio
Serves static portfolio assets and provides API endpoints for dynamic portfolio data,
health status, admin security PIN verification, and version history.
"""

import os
import re
import json
import shutil
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from fastapi import FastAPI, Request, HTTPException, status, UploadFile, File, Form, Query
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from server_py.resume_parser import extract_raw_text, structure_resume_with_ai, validate_and_merge_portfolio
from server_py.diff_engine import compute_portfolio_diff

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


class PublishPortfolioRequest(BaseModel):
    data: Dict[str, Any]
    resumeFilename: Optional[str] = None
    pin: Optional[str] = None


class RestoreBackupRequest(BaseModel):
    filename: str
    pin: Optional[str] = None


# Helper: Create Timestamped Backup Snapshot
def create_portfolio_backup() -> Optional[str]:
    """Creates a timestamped backup snapshot of data/portfolio.json."""
    if not PORTFOLIO_PATH.exists():
        return None
    timestamp = datetime.now(timezone.utc).isoformat().replace(":", "-").replace(".", "-")
    backup_filename = f"portfolio-{timestamp}.json"
    backup_filepath = BACKUPS_DIR / backup_filename
    try:
        with open(PORTFOLIO_PATH, "r", encoding="utf-8") as src, open(backup_filepath, "w", encoding="utf-8") as dst:
            dst.write(src.read())
        return f"data/backups/{backup_filename}"
    except Exception as e:
        print(f"[Backup Error] {e}")
        return None


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


@app.post("/api/upload-resume")
async def upload_resume(
    request: Request,
    resume: UploadFile = File(...),
    preview: Optional[bool] = Query(None),
    preview_form: Optional[bool] = Form(None, alias="preview")
):
    """
    Handles PDF/DOCX resume file upload.
    In preview mode (?preview=true), extracts text and returns staged diff without saving.
    In direct mode, validates admin PIN, extracts text, creates backup, and atomically publishes.
    """
    if not resume:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": 'No resume file provided. Please attach a PDF or DOCX file under field "resume".'}
        )

    original_name = resume.filename or "Resume.pdf"
    ext = Path(original_name).suffix.lower()
    allowed_exts = [".pdf", ".docx", ".doc", ".txt"]
    if ext not in allowed_exts:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": f"Invalid file type: {ext}. Only PDF and DOCX files are supported."}
        )

    # Read uploaded bytes with size validation (10MB limit)
    file_bytes = await resume.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": "File size exceeds 10MB limit. Please upload a smaller file."}
        )

    sanitized_name = re.sub(r"[^a-zA-Z0-9._-]", "_", original_name)
    timestamp = int(datetime.now().timestamp() * 1000)
    stem = Path(sanitized_name).stem
    saved_filename = f"{stem}_{timestamp}{ext}"

    # 1. Save uploaded file to uploads directory for permanent archive
    upload_dest = UPLOADS_DIR / saved_filename
    with open(upload_dest, "wb") as f:
        f.write(file_bytes)

    # Determine preview flag
    is_preview = (preview is True) or (preview_form is True) or (request.query_params.get("preview", "").lower() == "true")

    # 2. Baseline portfolio
    base_portfolio = {}
    if PORTFOLIO_PATH.exists():
        try:
            with open(PORTFOLIO_PATH, "r", encoding="utf-8") as f:
                base_portfolio = json.load(f)
        except Exception as e:
            print(f"[JSON Warning] {e}")

    # 3. In-memory text extraction
    try:
        raw_text = extract_raw_text(file_bytes, ext)
    except Exception as e:
        return JSONResponse(
            status_code=422,
            content={"success": False, "error": f"Failed to extract text from document: {str(e)}"}
        )

    if not raw_text or len(raw_text.strip()) < 30:
        return JSONResponse(
            status_code=422,
            content={"success": False, "error": "Could not extract meaningful text from the uploaded document. Ensure it is not an image-only scan."}
        )

    # 4. AI / Deterministic Fallback transformation
    structured_data = structure_resume_with_ai(raw_text, base_portfolio)

    # 5. Update resume links in profile
    structured_data.setdefault("profile", {})
    structured_data["profile"]["resumeUrl"] = f"assets/{sanitized_name}"
    structured_data["profile"]["resumeFilename"] = sanitized_name

    # 6. Diff calculation
    diff_summary = compute_portfolio_diff(base_portfolio, structured_data)

    if is_preview:
        return {
            "success": True,
            "preview": True,
            "message": "Resume analyzed successfully. Review changes before publishing.",
            "diff": diff_summary,
            "data": structured_data,
            "extractedCharacters": len(raw_text),
            "resumeFilename": sanitized_name,
            "uploadedFile": saved_filename
        }

    # Non-preview direct publish: Admin PIN check
    if not check_admin_pin(request):
        return JSONResponse(
            status_code=401,
            content={"success": False, "error": "Unauthorized: Invalid or missing Admin Security PIN."}
        )

    # Copy to assets/
    asset_dest = ASSETS_DIR / sanitized_name
    with open(asset_dest, "wb") as f:
        f.write(file_bytes)

    backup_path = create_portfolio_backup()

    # Atomic write to data/portfolio.json
    temp_path = PORTFOLIO_PATH.with_suffix(".tmp")
    with open(temp_path, "w", encoding="utf-8") as f:
        json.dump(structured_data, f, indent=2, ensure_ascii=False)
    temp_path.replace(PORTFOLIO_PATH)

    return {
        "success": True,
        "message": "Resume parsed and portfolio updated successfully!",
        "backup": backup_path,
        "extractedCharacters": len(raw_text),
        "diff": diff_summary,
        "data": structured_data
    }


@app.post("/api/publish-portfolio")
async def publish_portfolio(request: Request, payload: PublishPortfolioRequest):
    """
    Atomically commits and publishes staged portfolio data approved by user.
    Requires Admin PIN if configured.
    """
    if not check_admin_pin(request, payload.pin):
        return JSONResponse(
            status_code=401,
            content={"success": False, "error": "Unauthorized: Invalid or missing Admin Security PIN."}
        )

    if not payload.data or not isinstance(payload.data, dict):
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": "Invalid portfolio data payload provided."}
        )

    base_portfolio = {}
    if PORTFOLIO_PATH.exists():
        try:
            with open(PORTFOLIO_PATH, "r", encoding="utf-8") as f:
                base_portfolio = json.load(f)
        except Exception as e:
            print(f"[JSON Warning] {e}")

    finalized_data = validate_and_merge_portfolio(payload.data, base_portfolio)

    # Synchronize asset if resumeFilename provided
    if payload.resumeFilename:
        sanitized_name = re.sub(r"[^a-zA-Z0-9._-]", "_", payload.resumeFilename)
        asset_dest = ASSETS_DIR / sanitized_name
        stem = Path(sanitized_name).stem

        if not asset_dest.exists() and UPLOADS_DIR.exists():
            matched_files = sorted(
                list(UPLOADS_DIR.glob(f"{stem}_*")),
                key=lambda p: p.stat().st_mtime,
                reverse=True
            )
            if matched_files:
                shutil.copy2(matched_files[0], asset_dest)
                print(f"[Publish Engine] Copied uploaded asset to: assets/{sanitized_name}")

        finalized_data.setdefault("profile", {})
        finalized_data["profile"]["resumeUrl"] = f"assets/{sanitized_name}"
        finalized_data["profile"]["resumeFilename"] = sanitized_name

    # Create safety backup snapshot
    backup_path = create_portfolio_backup()

    # Atomically write to data/portfolio.json
    temp_path = PORTFOLIO_PATH.with_suffix(".tmp")
    with open(temp_path, "w", encoding="utf-8") as f:
        json.dump(finalized_data, f, indent=2, ensure_ascii=False)
    temp_path.replace(PORTFOLIO_PATH)

    return {
        "success": True,
        "message": "Portfolio successfully published live!",
        "backup": backup_path,
        "data": finalized_data
    }


@app.post("/api/restore-backup")
async def restore_backup(request: Request, payload: RestoreBackupRequest):
    """
    Atomically rolls back portfolio.json to a specified historical backup snapshot.
    Requires Admin PIN if configured.
    """
    if not check_admin_pin(request, payload.pin):
        return JSONResponse(
            status_code=401,
            content={"success": False, "error": "Unauthorized: Invalid or missing Admin Security PIN."}
        )

    filename = payload.filename
    if not filename or ".." in filename or "/" in filename or "\\" in filename or not filename.endswith(".json"):
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": "Invalid backup filename format."}
        )

    backup_file = BACKUPS_DIR / Path(filename).name
    if not backup_file.exists():
        return JSONResponse(
            status_code=404,
            content={"success": False, "error": f'Selected backup "{filename}" does not exist.'}
        )

    try:
        with open(backup_file, "r", encoding="utf-8") as f:
            parsed_backup = json.load(f)
    except Exception as e:
        return JSONResponse(
            status_code=422,
            content={"success": False, "error": f"Backup file contains corrupted JSON: {str(e)}"}
        )

    # 1. Create a safety snapshot of current live state BEFORE overwriting
    safety_snapshot = create_portfolio_backup()

    # 2. Atomically write the restored backup into data/portfolio.json
    temp_path = PORTFOLIO_PATH.with_suffix(".tmp")
    with open(temp_path, "w", encoding="utf-8") as f:
        json.dump(parsed_backup, f, indent=2, ensure_ascii=False)
    temp_path.replace(PORTFOLIO_PATH)

    return {
        "success": True,
        "message": f"Portfolio successfully rolled back to snapshot: {backup_file.name}",
        "restoredFilename": backup_file.name,
        "safetyBackup": safety_snapshot,
        "data": parsed_backup
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

