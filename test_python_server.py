"""
Comprehensive Automated Verification Test for Python FastAPI Backend (test_python_server.py)
Tests all endpoints, security bounds, diff preview engine, and rollback recovery.
"""

import sys
import json
import shutil
from pathlib import Path
from fastapi.testclient import TestClient

from app import app
from server_py.config import PORTFOLIO_PATH, ROOT_DIR, BACKUPS_DIR

client = TestClient(app)

passed = 0
failed = 0

def assert_test(condition: bool, test_name: str):
    global passed, failed
    if condition:
        print(f"  [PASS] {test_name}")
        passed += 1
    else:
        print(f"  [FAIL] {test_name}")
        failed += 1


def run_tests():
    global passed, failed
    print("\n============================================================")
    print("🐍 FASTAPI PYTHON BACKEND AUTOMATED TEST SUITE")
    print("============================================================")

    # Backup original portfolio.json before tests
    original_portfolio = None
    if PORTFOLIO_PATH.exists():
        with open(PORTFOLIO_PATH, "r", encoding="utf-8") as f:
            original_portfolio = json.load(f)

    try:
        # SUITE 1: HEALTH & CONFIG
        print("\n=== SUITE 1: HEALTH & CONFIG ENDPOINTS ===")
        res = client.get("/api/health")
        assert_test(res.status_code == 200, "GET /api/health returned HTTP 200")
        assert_test(res.json().get("status") == "ok", "GET /api/health payload status is 'ok'")

        res = client.get("/api/portfolio")
        assert_test(res.status_code == 200, "GET /api/portfolio returned HTTP 200")
        data = res.json()
        assert_test("profile" in data and "skills" in data, "GET /api/portfolio contains profile and skills schema")

        res = client.get("/api/backups")
        assert_test(res.status_code == 200, "GET /api/backups returned HTTP 200")
        assert_test("backups" in res.json() and isinstance(res.json()["backups"], list), "GET /api/backups returns array of snapshots")

        # SUITE 2: ADMIN PIN AUTHENTICATION
        print("\n=== SUITE 2: ADMIN PIN VERIFICATION ===")
        res = client.post("/api/verify-pin", json={"pin": "1234"})
        assert_test(res.status_code == 200, "POST /api/verify-pin returned HTTP 200")
        assert_test(res.json().get("valid") is True, "POST /api/verify-pin with '1234' is valid: true")

        res = client.post("/api/verify-pin", json={"pin": "9999"})
        assert_test(res.json().get("valid") is False, "POST /api/verify-pin with '9999' is valid: false")

        # SUITE 3: STATIC ASSETS & SECURITY
        print("\n=== SUITE 3: STATIC ASSET SERVING & MIME TYPES ===")
        res = client.get("/")
        assert_test(res.status_code == 200, "GET / returned HTTP 200")
        assert_test("text/html" in res.headers.get("content-type", ""), "GET / serves text/html")

        res = client.get("/css/main.css")
        assert_test(res.status_code == 200, "GET /css/main.css returned HTTP 200")
        assert_test("text/css" in res.headers.get("content-type", ""), "GET /css/main.css serves text/css")

        res = client.get("/js/render.js")
        assert_test(res.status_code == 200, "GET /js/render.js returned HTTP 200")
        assert_test("javascript" in res.headers.get("content-type", ""), "GET /js/render.js serves javascript")

        res = client.get("/assets/profile-avatar.svg")
        assert_test(res.status_code == 200, "GET /assets/profile-avatar.svg returned HTTP 200")

        # Path traversal security test
        res = client.get("/../windows/system32/cmd.exe")
        assert_test(res.status_code in (403, 404), "Path traversal attack blocked with HTTP 403 or 404")

        # SUITE 4: RESUME UPLOAD & TWO-STEP PREVIEW
        print("\n=== SUITE 4: RESUME PARSE & PREVIEW ENGINE ===")
        sample_pdf = ROOT_DIR / "assets" / "Md_Matloob_Alam_Software_Developer_Resume.pdf"
        assert_test(sample_pdf.exists(), "Sample resume PDF exists for testing")

        with open(sample_pdf, "rb") as f:
            pdf_bytes = f.read()

        # Test preview mode
        files = {"resume": ("Test_Candidate_Resume.pdf", pdf_bytes, "application/pdf")}
        res = client.post("/api/upload-resume?preview=true", files=files)
        assert_test(res.status_code == 200, "POST /api/upload-resume?preview=true returned HTTP 200")
        upload_data = res.json()
        assert_test(upload_data.get("preview") is True, "Preview API returned preview: true")
        assert_test("diff" in upload_data, "Preview API computed structured diff summary")
        assert_test("data" in upload_data, "Preview API returned staged portfolio schema")

        staged_portfolio = upload_data["data"]

        # SUITE 5: PUBLISH & ADMIN PIN SECURITY
        print("\n=== SUITE 5: PUBLISH ENGINE & PIN SECURITY ===")
        # Attempt publish with wrong PIN
        res = client.post(
            "/api/publish-portfolio",
            json={"data": staged_portfolio, "resumeFilename": "Test_Candidate_Resume.pdf", "pin": "wrong-pin"}
        )
        assert_test(res.status_code == 401, "POST /api/publish-portfolio with invalid PIN returned HTTP 401")

        # Attempt publish with correct PIN
        res = client.post(
            "/api/publish-portfolio",
            json={"data": staged_portfolio, "resumeFilename": "Test_Candidate_Resume.pdf", "pin": "1234"}
        )
        assert_test(res.status_code == 200, "POST /api/publish-portfolio with valid PIN returned HTTP 200")
        assert_test(res.json().get("success") is True, "Publish API returned success: true")
        assert_test("backup" in res.json(), "Publish API created automated backup snapshot")

        created_backup = res.json()["backup"]
        backup_filename = Path(created_backup).name

        # SUITE 6: ROLLBACK ENGINE & PATH TRAVERSAL DEFENSE
        print("\n=== SUITE 6: ROLLBACK ENGINE & SECURITY BOUNDS ===")
        # Unauthorized rollback
        res = client.post(
            "/api/restore-backup",
            json={"filename": backup_filename, "pin": "0000"}
        )
        assert_test(res.status_code == 401, "POST /api/restore-backup with invalid PIN returned HTTP 401")

        # Path traversal rollback
        res = client.post(
            "/api/restore-backup",
            json={"filename": "../../../passwords.json", "pin": "1234"}
        )
        assert_test(res.status_code == 400, "POST /api/restore-backup with traversal filename returned HTTP 400")

        # Nonexistent backup
        res = client.post(
            "/api/restore-backup",
            json={"filename": "portfolio-does-not-exist.json", "pin": "1234"}
        )
        assert_test(res.status_code == 404, "POST /api/restore-backup with nonexistent file returned HTTP 404")

        # Legitimate rollback
        res = client.post(
            "/api/restore-backup",
            json={"filename": backup_filename, "pin": "1234"}
        )
        assert_test(res.status_code == 200, "POST /api/restore-backup with valid snapshot returned HTTP 200")
        assert_test(res.json().get("success") is True, "Rollback API returned success: true")

    finally:
        # Restore clean original baseline portfolio
        if original_portfolio:
            with open(PORTFOLIO_PATH, "w", encoding="utf-8") as f:
                json.dump(original_portfolio, f, indent=2, ensure_ascii=False)
            print("\n[Cleanup] Restored original baseline portfolio.json")

    print("\n============================================================")
    print(f"TOTAL TESTS: {passed + failed} | PASSED: {passed} | FAILED: {failed}")
    if failed == 0:
        print(">>> ALL PYTHON FASTAPI ENDPOINTS & LOGIC VERIFIED! 100% OPERATIONAL. <<<")
    print("============================================================\n")

    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
