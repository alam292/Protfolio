"""
Main FastAPI Application (app.py)
Serves static portfolio assets and provides AI resume upload, diff preview,
version rollback, and dynamic portfolio sync API endpoints.
"""

import os
import json
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any

from fastapi import FastAPI, Request, Response, UploadFile, File, Query, Form, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse

from server_py.config import (
    ROOT_DIR,
    PORTFOLIO_PATH,
    UPLOADS_DIR,
    ASSETS_DIR,
    BACKUPS_DIR,
    ADMIN_UPLOAD_PIN,
    GEMINI_API_KEY
)
from server_py.database import check_db_connection
from server_py.seed_db import seed_initial_data
from server_py.resume_parser import extract_raw_text, structure_resume_with_ai
from server_py.controller import (
    verify_admin_pin,
    get_active_portfolio,
    create_portfolio_backup,
    compute_portfolio_diff,
    list_backups,
    restore_backup,
    publish_portfolio,
    atomic_write_portfolio,
    save_contact_message,
    list_contact_messages
)
from server_py.auth_routes import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Initializes database schema and ensures baseline portfolio data is seeded on boot.
    """
    try:
        stats = seed_initial_data()
        print(f"[Database Engine] Startup seed verified: {stats}")
    except Exception as exc:
        print(f"[Database Engine Warning] Startup seed encountered error: {exc}")
    yield


app = FastAPI(
    title="Folioblox Dynamic Portfolio & AI Engine",
    description="Python FastAPI backend powering AI resume transformation and dynamic portfolio sync.",
    version="1.6.0",
    lifespan=lifespan
)


# Global CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "x-admin-pin"]
)

# Mount Authentication REST Router
app.include_router(auth_router, prefix="/api/auth")

MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
    ".mp4": "video/mp4",
    ".webm": "video/webm"
}


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/api/health")
async def health_check():
    """Server health status, database connectivity and AI key check."""
    db_health = check_db_connection()
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": db_health,
        "geminiKeyConfigured": bool(GEMINI_API_KEY and GEMINI_API_KEY != "YOUR_GEMINI_API_KEY_HERE")
    }


@app.get("/api/portfolio")
async def get_portfolio():
    """Retrieve current portfolio JSON schema (Database-first with fallback)."""
    data = get_active_portfolio()
    if not data:
        return JSONResponse(status_code=404, content={"success": False, "error": "portfolio schema not found"})
    return JSONResponse(content=data, headers={"Cache-Control": "no-cache"})



@app.get("/api/backups")
async def get_backups():
    """List available automated backup snapshots."""
    backups = list_backups()
    return {
        "success": True,
        "count": len(backups),
        "backups": backups
    }


@app.post("/api/verify-pin")
async def verify_pin(
    request: Request,
    x_admin_pin: Optional[str] = Header(None)
):
    """Verify 4-digit Admin PIN."""
    provided_pin = x_admin_pin
    if not provided_pin:
        try:
            body = await request.json()
            if isinstance(body, dict):
                provided_pin = body.get("pin")
        except Exception:
            pass

    if not provided_pin:
        provided_pin = request.query_params.get("pin")

    if not ADMIN_UPLOAD_PIN:
        return {"success": True, "required": False, "valid": True}

    is_valid = verify_admin_pin(provided_pin)
    return {
        "success": True,
        "required": True,
        "valid": is_valid
    }


@app.post("/api/upload-resume")
async def upload_resume(
    resume: UploadFile = File(...),
    preview: Optional[str] = Query(None),
    x_admin_pin: Optional[str] = Header(None)
):
    """
    Handle resume upload (PDF or DOCX).
    Supports preview=true for staged review without overwriting live portfolio.
    """
    original_name = resume.filename or "Resume.pdf"
    ext = Path(original_name).suffix.lower()

    if ext not in (".pdf", ".docx", ".doc"):
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": f"Invalid file type: {ext}. Only PDF and DOCX files are supported."}
        )

    content = await resume.read()
    if len(content) > 10 * 1024 * 1024:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": "File size exceeds 10MB limit."}
        )

    sanitized_name = "".join(c if c.isalnum() or c in "._-" else "_" for c in original_name)
    timestamp = int(time.time() * 1000)
    saved_file_name = f"{Path(sanitized_name).stem}_{timestamp}{ext}"

    # 1. Save uploaded file to uploads directory
    upload_dest = UPLOADS_DIR / saved_file_name
    with open(upload_dest, "wb") as f:
        f.write(content)
    print(f"[File Storage] Saved uploaded resume to: uploads/{saved_file_name}")

    is_preview = (str(preview).lower() == "true")

    # 2. Baseline portfolio
    base_portfolio = {}
    if PORTFOLIO_PATH.exists():
        try:
            with open(PORTFOLIO_PATH, "r", encoding="utf-8") as f:
                base_portfolio = json.load(f)
        except Exception as e:
            print(f"[JSON Parser Warning] portfolio.json read warning: {e}")

    # 3. Extract text
    print(f"[Text Extraction] Extracting text from {original_name} ({(len(content)/1024):.1f} KB)...")
    try:
        raw_text = extract_raw_text(content, ext)
    except Exception as e:
        return JSONResponse(status_code=422, content={"success": False, "error": f"Text extraction failed: {e}"})

    if not raw_text or len(raw_text) < 30:
        return JSONResponse(
            status_code=422,
            content={"success": False, "error": "Could not extract meaningful text from the uploaded document. Ensure it is not an image-only scan."}
        )

    print(f"[Text Extraction] Extracted {len(raw_text)} characters successfully.")

    # 4. Transform resume via Gemini AI or smart fallback parser
    print("[AI Transformation] Transforming resume data into structured schema...")
    structured_data = structure_resume_with_ai(raw_text, base_portfolio)

    # 5. Link resume asset
    structured_data["profile"] = structured_data.get("profile", {})
    structured_data["profile"]["resumeUrl"] = f"assets/{sanitized_name}"
    structured_data["profile"]["resumeFilename"] = sanitized_name

    # 6. Compute diff
    diff_summary = compute_portfolio_diff(base_portfolio, structured_data)

    # 7. In preview mode, return diff without disk commit
    if is_preview:
        print("[Preview Mode] Resume parsed & diff computed. Awaiting user confirmation before publishing.")
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "preview": True,
                "message": "Resume analyzed successfully. Review changes before publishing.",
                "diff": diff_summary,
                "data": structured_data,
                "extractedCharacters": len(raw_text),
                "resumeFilename": sanitized_name,
                "uploadedFile": saved_file_name
            }
        )

    # Direct publish flow (non-preview)
    pin = x_admin_pin
    if not verify_admin_pin(pin):
        return JSONResponse(
            status_code=401,
            content={"success": False, "error": "Unauthorized: Invalid or missing Admin Security PIN."}
        )

    asset_dest = ASSETS_DIR / sanitized_name
    with open(asset_dest, "wb") as f:
        f.write(content)

    backup_path = create_portfolio_backup()
    atomic_write_portfolio(structured_data)
    print(f"[Persistence] Successfully updated data/portfolio.json with backup: {backup_path}")

    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "message": "Resume parsed and portfolio updated successfully!",
            "backup": backup_path,
            "extractedCharacters": len(raw_text),
            "diff": diff_summary,
            "data": structured_data
        }
    )


@app.post("/api/publish-portfolio")
async def publish_live(
    request: Request,
    x_admin_pin: Optional[str] = Header(None)
):
    """Commit user-approved staged portfolio changes to live portfolio.json."""
    try:
        body = await request.json()
    except Exception:
        body = {}

    pin = x_admin_pin or body.get("pin") or request.query_params.get("pin")
    data = body.get("data")
    resume_filename = body.get("resumeFilename")

    success, status_code, response_data = publish_portfolio(data, resume_filename, pin)
    return JSONResponse(status_code=status_code, content=response_data)


@app.post("/api/restore-backup")
async def restore_snapshot(
    request: Request,
    x_admin_pin: Optional[str] = Header(None)
):
    """Rollback portfolio.json to a specific backup snapshot."""
    try:
        body = await request.json()
    except Exception:
        body = {}

    pin = x_admin_pin or body.get("pin") or request.query_params.get("pin")
    filename = body.get("filename")

    success, status_code, response_data = restore_backup(filename, pin)
    return JSONResponse(status_code=status_code, content=response_data)


@app.post("/api/contact")
async def contact_form_submit(request: Request):
    """
    Persist client / recruiter contact transmission into the database.
    """
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": "Invalid request payload format."}
        )

    name = body.get("name")
    email = body.get("email")
    subject = body.get("subject")
    message = body.get("message")
    service_type = body.get("serviceType")

    success, status_code, response_data = save_contact_message(
        name=name,
        email=email,
        subject=subject,
        message=message,
        service_type=service_type
    )
    return JSONResponse(status_code=status_code, content=response_data)


@app.get("/api/admin/messages")
async def get_admin_contact_messages(
    request: Request,
    x_admin_pin: Optional[str] = Header(None),
    pin: Optional[str] = Query(None)
):
    """
    Retrieve stored contact inquiries (Protected by Admin PIN).
    """
    provided_pin = x_admin_pin or pin
    success, status_code, response_data = list_contact_messages(pin=provided_pin)
    return JSONResponse(status_code=status_code, content=response_data)


# ============================================================================
# STATIC ASSET ROUTING & HEADERS
# ============================================================================


@app.get("/{full_path:path}")
async def serve_static(full_path: str, request: Request):
    """
    Serve static assets (HTML, CSS, JS, Images, 300-frame Canvas Stream)
    with optimal cache headers and security traversal protection.
    """
    if full_path.startswith("api/"):
        return JSONResponse(status_code=404, content={"detail": "Not Found"})

    if ".." in full_path:
        return PlainTextResponse("Forbidden", status_code=403)

    relative_path = "index.html" if not full_path or full_path == "/" else full_path.lstrip("/")
    target_path = (ROOT_DIR / relative_path).resolve()

    # Prevent path traversal
    try:
        target_path.relative_to(ROOT_DIR)
    except ValueError:
        return PlainTextResponse("Forbidden", status_code=403)

    if not target_path.exists() or not target_path.is_file():
        # Only fallback to index.html for root or extensionless paths
        if not target_path.suffix and (ROOT_DIR / "index.html").exists():
            return FileResponse(
                ROOT_DIR / "index.html",
                media_type="text/html; charset=utf-8",
                headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
            )
        return PlainTextResponse("404 Not Found", status_code=404)

    ext = target_path.suffix.lower()
    media_type = MIME_TYPES.get(ext, "application/octet-stream")

    headers = {
        "Accept-Ranges": "bytes"
    }

    if ext in (".jpg", ".png", ".webp", ".svg"):
        headers["Cache-Control"] = "public, max-age=86400, immutable"
    else:
        headers["Cache-Control"] = "no-cache, no-store, must-revalidate"

    return FileResponse(target_path, media_type=media_type, headers=headers)
