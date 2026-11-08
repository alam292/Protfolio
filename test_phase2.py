"""
test_phase2.py - Automated Verification Suite for Phase 2
Tests Python Resume Parsing, Staged Diff Engine, File Upload, Staged Preview, and Live Publishing.
"""

import os
import io
import json
from pathlib import Path
from starlette.testclient import TestClient

from app import app
from server_py.resume_parser import extract_raw_text, fallback_rule_based_parser, validate_and_merge_portfolio
from server_py.diff_engine import compute_portfolio_diff

client = TestClient(app)

def run_phase2_tests():
    total_checks = 0
    passed_checks = 0

    def assert_check(name, condition, details=""):
        nonlocal total_checks, passed_checks
        total_checks += 1
        if condition:
            passed_checks += 1
            print(f"  [PASS] {name}")
        else:
            print(f"  [FAIL] {name} - {details}")

    print("\n=== PHASE 2 TEST SUITE 1: TEXT EXTRACTION & DETERMINISTIC PARSING ===")

    # 1. Text extraction from sample PDF
    sample_pdf_path = Path("assets/Md_Matloob_Alam_Software_Developer_Resume.pdf")
    assert_check("Sample Dev PDF exists", sample_pdf_path.exists())
    if sample_pdf_path.exists():
        with open(sample_pdf_path, "rb") as f:
            pdf_bytes = f.read()
        raw_text = extract_raw_text(pdf_bytes, ".pdf")
        assert_check("Extract raw text returns non-empty string", len(raw_text) > 500, f"Got {len(raw_text)} chars")
        assert_check("Extracted text contains developer name", "MATLOOB" in raw_text.upper())

        # 2. Parsing dev resume
        parsed_dev = fallback_rule_based_parser(raw_text)
        assert_check("Parsed profile.name is 'MD MATLOOB ALAM'", parsed_dev.get("profile", {}).get("name") == "MD MATLOOB ALAM")
        assert_check("Parsed skills has 6 official categories", len(parsed_dev.get("skills", {}).get("categories", [])) == 6)
        assert_check("Parsed about has 4 highlights", len(parsed_dev.get("about", {}).get("highlights", [])) == 4)

    # 3. Data analyst PDF test
    da_pdf_path = Path("assets/MD_MATLOOB_ALAM_Data_Analyst_Resume.pdf")
    if da_pdf_path.exists():
        with open(da_pdf_path, "rb") as f:
            da_bytes = f.read()
        da_text = extract_raw_text(da_bytes, ".pdf")
        parsed_da = fallback_rule_based_parser(da_text)
        assert_check("DA resume identifies Data Analyst title", "Data Analyst" in parsed_da.get("profile", {}).get("title", ""))
        assert_check("DA resume sets BI category in skills", any("BI" in c.get("name", "") for c in parsed_da.get("skills", {}).get("categories", [])))

    print("\n=== PHASE 2 TEST SUITE 2: STAGED DIFF ENGINE ===")

    # 4. Diff between empty and parsed
    diff = compute_portfolio_diff({}, parsed_dev)
    assert_check("Diff detects hasChanges=True for new portfolio", diff.get("hasChanges") is True)
    assert_check("Diff calculates added skills", len(diff.get("skills", {}).get("added", [])) > 0)
    assert_check("Diff tracks category count", diff.get("skills", {}).get("categoriesCount") == 6)

    # 5. Diff between identical
    diff_same = compute_portfolio_diff(parsed_dev, parsed_dev)
    assert_check("Diff detects hasChanges=False for identical data", diff_same.get("hasChanges") is False)
    assert_check("Diff shows 0 added skills for identical data", len(diff_same.get("skills", {}).get("added", [])) == 0)

    print("\n=== PHASE 2 TEST SUITE 3: POST /api/upload-resume (PREVIEW MODE) ===")

    # 6. Upload invalid file extension
    res = client.post(
        "/api/upload-resume",
        files={"resume": ("virus.exe", b"executable code", "application/octet-stream")}
    )
    assert_check("Invalid file type rejected with 400", res.status_code == 400)

    # 7. Upload PDF in preview mode (?preview=true)
    if sample_pdf_path.exists():
        # Read current portfolio to verify it remains unchanged in preview mode
        with open("data/portfolio.json", "r", encoding="utf-8") as f:
            portfolio_before = f.read()

        with open(sample_pdf_path, "rb") as f:
            res = client.post(
                "/api/upload-resume?preview=true",
                files={"resume": ("preview_test_resume.pdf", f.read(), "application/pdf")}
            )

        assert_check("POST /api/upload-resume?preview=true returns 200 OK", res.status_code == 200, f"Got {res.status_code}")
        data = res.json()
        assert_check("Response contains preview=True", data.get("preview") is True)
        assert_check("Response contains diff summary", "diff" in data and "hasChanges" in data["diff"])
        assert_check("Response contains parsed data", "data" in data and "profile" in data["data"])
        assert_check("Response contains resumeFilename", "resumeFilename" in data)

        # Check that data/portfolio.json was NOT modified during preview mode
        with open("data/portfolio.json", "r", encoding="utf-8") as f:
            portfolio_after = f.read()
        assert_check("Preview mode does NOT overwrite portfolio.json (zero side-effects)", portfolio_before == portfolio_after)

    print("\n=== PHASE 2 TEST SUITE 4: POST /api/publish-portfolio (LIVE PUBLISH) ===")

    # 8. Publish without PIN when PIN configured
    res = client.post(
        "/api/publish-portfolio",
        json={"data": {"profile": {"name": "Test Name"}}, "pin": "wrong_pin"}
    )
    assert_check("Publish with wrong PIN rejected with 401", res.status_code == 401)

    # 9. Publish with valid PIN
    test_staged_payload = {
        "profile": {
            "name": "MD MATLOOB ALAM",
            "title": "Data Analyst Trainee & Power BI Developer",
            "email": "mdmatloobalam292@gmail.com"
        }
    }
    res = client.post(
        "/api/publish-portfolio",
        headers={"x-admin-pin": "1234"},
        json={"data": test_staged_payload, "resumeFilename": "MD_MATLOOB_ALAM_Data_Analyst_Resume.pdf"}
    )
    assert_check("Publish with valid PIN returns 200 OK", res.status_code == 200, f"Got {res.status_code}")
    publish_res = res.json()
    assert_check("Publish response indicates success", publish_res.get("success") is True)
    assert_check("Publish creates backup snapshot", bool(publish_res.get("backup")))

    # 10. Check that backup file was actually written to data/backups/
    if publish_res.get("backup"):
        backup_file = Path(publish_res["backup"])
        assert_check("Backup snapshot file physically exists on disk", backup_file.exists())

    print("\n=== PHASE 2 TEST SUITE 5: POST /api/restore-backup (ROLLBACK) ===")

    # 11. Restore with path traversal attempt
    res = client.post(
        "/api/restore-backup",
        headers={"x-admin-pin": "1234"},
        json={"filename": "../../etc/passwd.json"}
    )
    assert_check("Path traversal attempt in restore rejected with 400", res.status_code == 400)

    # 12. Restore using the freshly created backup
    if publish_res.get("backup"):
        backup_name = Path(publish_res["backup"]).name
        res = client.post(
            "/api/restore-backup",
            headers={"x-admin-pin": "1234"},
            json={"filename": backup_name}
        )
        assert_check("Restore from valid backup returns 200 OK", res.status_code == 200, f"Got {res.status_code}")
        assert_check("Restore response has safetyBackup", bool(res.json().get("safetyBackup")))

    print(f"\n==========================================")
    print(f"PHASE 2 SUMMARY: {passed_checks}/{total_checks} CHECKS PASSED")
    print(f"==========================================")
    return passed_checks == total_checks

if __name__ == "__main__":
    success = run_phase2_tests()
    if not success:
        exit(1)

