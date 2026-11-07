"""
Database & Dual-Engine Integration Test Suite (test_database_suite.py)
Tests database connections, model schemas, seeder, CRUD operations,
contact message pipeline, rollback snapshots, and zero-downtime fallback.
"""

import sys
import json
from pathlib import Path
from datetime import datetime

ROOT_DIR = Path(__file__).resolve().parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app import app
from server_py.database import engine, SessionLocal, check_db_connection, get_connection_url
from server_py.models import Portfolio, PortfolioVersion, ContactMessage, AuditLog
from server_py.seed_db import seed_initial_data
from server_py.controller import (
    get_active_portfolio,
    save_contact_message,
    list_contact_messages,
    publish_portfolio,
    restore_backup,
    list_backups,
    verify_admin_pin
)

client = TestClient(app)

passed = 0
failed = 0


def assert_test(condition: bool, description: str):
    global passed, failed
    if condition:
        print(f"  [PASS] {description}")
        passed += 1
    else:
        print(f"  [FAIL] {description}")
        failed += 1


def run_database_tests():
    global passed, failed
    print("\n" + "=" * 65)
    print("🗄️  DATABASE & DUAL-ENGINE INTEGRATION TEST SUITE")
    print("=" * 65)

    # -------------------------------------------------------------
    # SUITE 1: Engine & Connection Handling
    # -------------------------------------------------------------
    print("\n--- SUITE 1: ENGINE & URL PROTOCOL PARSING ---")
    url, engine_type = get_connection_url()
    assert_test(engine_type in ("sqlite", "postgresql"), f"Valid engine type resolved: '{engine_type}'")
    assert_test(url.startswith("sqlite:///") or url.startswith("postgresql://"), "URL starts with valid dialect protocol")

    health = check_db_connection()
    assert_test(health.get("status") == "connected", "Database connection check returned 'connected'")
    assert_test(health.get("engine") == engine_type, f"Health check engine matches active type: {engine_type}")

    # -------------------------------------------------------------
    # SUITE 2: Schema Models & Seeding
    # -------------------------------------------------------------
    print("\n--- SUITE 2: SCHEMA MODELS & SEEDING INTEGRITY ---")
    stats = seed_initial_data()
    assert_test(isinstance(stats, dict), "Seeder returned valid stats dictionary")

    db: Session = SessionLocal()
    try:
        active_row = db.query(Portfolio).filter(Portfolio.is_active == True).first()
        assert_test(active_row is not None, "Active Portfolio record exists in database")
        assert_test("profile" in active_row.content, "Portfolio content contains 'profile' object")
        assert_test(active_row.content["profile"].get("name") == "Md MatlooB Alam", "Profile name matches verified portfolio identity")

        versions_count = db.query(PortfolioVersion).count()
        assert_test(versions_count > 0, f"PortfolioVersion history preserved in DB (Count: {versions_count})")
    finally:
        db.close()

    # -------------------------------------------------------------
    # SUITE 3: Zero-Downtime Fallback Test
    # -------------------------------------------------------------
    print("\n--- SUITE 3: ZERO-DOWNTIME FALLBACK RESILIENCE ---")
    # Test reading active portfolio when db=None (direct controller call)
    fallback_data = get_active_portfolio(db=None)
    assert_test(isinstance(fallback_data, dict) and "profile" in fallback_data, "get_active_portfolio() succeeds with graceful fallback")

    # -------------------------------------------------------------
    # SUITE 4: Contact Messages API & Validation
    # -------------------------------------------------------------
    print("\n--- SUITE 4: CONTACT INQUIRIES & VALIDATION ---")
    # Test 1: Invalid email rejection
    res_bad_email = client.post("/api/contact", json={
        "name": "Invalid User",
        "email": "not-an-email",
        "subject": "Test",
        "message": "Valid message text"
    })
    assert_test(res_bad_email.status_code == 400, "POST /api/contact rejects invalid email with HTTP 400")

    # Test 2: Short message rejection
    res_short = client.post("/api/contact", json={
        "name": "Short Msg",
        "email": "test@domain.com",
        "subject": "Test",
        "message": "Short"
    })
    assert_test(res_short.status_code == 400, "POST /api/contact rejects messages shorter than 8 characters")

    # Test 3: Successful message insertion
    test_contact_payload = {
        "name": "HR Recruiter",
        "email": "hr@datacorp.com",
        "subject": "Senior Data Analyst Opportunity",
        "message": "We reviewed your portfolio and would love to schedule a screening call.",
        "serviceType": "Power BI & SQL"
    }
    res_success = client.post("/api/contact", json=test_contact_payload)
    assert_test(res_success.status_code == 201, "POST /api/contact saves valid inquiry with HTTP 201 Created")
    data_res = res_success.json()
    assert_test(data_res.get("success") is True, "Contact response indicates success = True")
    assert_test("transmissionId" in data_res, f"Generated transmission ID: {data_res.get('transmissionId')}")

    # Test 4: Protected Admin Messages Endpoint
    res_unauth = client.get("/api/admin/messages?pin=9999")
    assert_test(res_unauth.status_code == 401, "GET /api/admin/messages with wrong PIN rejects with HTTP 401")

    res_auth = client.get("/api/admin/messages?pin=1234")
    assert_test(res_auth.status_code == 200, "GET /api/admin/messages with valid PIN returns HTTP 200")
    admin_payload = res_auth.json()
    assert_test(admin_payload.get("count", 0) >= 1, f"Admin messages count retrieved: {admin_payload.get('count')}")

    # -------------------------------------------------------------
    # SUITE 5: Backup & Rollback DB Integration
    # -------------------------------------------------------------
    print("\n--- SUITE 5: ROLLBACK & AUDIT LOG INTEGRATION ---")
    backups_list = list_backups()
    assert_test(len(backups_list) > 0, f"list_backups() returns populated snapshot array (Count: {len(backups_list)})")

    # Verify AuditLog record exists
    db = SessionLocal()
    try:
        audit_count = db.query(AuditLog).count()
        assert_test(audit_count > 0, f"AuditLog table records activity (Count: {audit_count})")
    finally:
        db.close()

    # -------------------------------------------------------------
    # SUITE 6: Full API Endpoint Suite via FastAPI TestClient
    # -------------------------------------------------------------
    print("\n--- SUITE 6: FASTAPI ENDPOINT INTEGRATION ---")
    h_res = client.get("/api/health")
    assert_test(h_res.status_code == 200, "GET /api/health returned HTTP 200")
    assert_test("database" in h_res.json(), "GET /api/health contains database connectivity payload")

    p_res = client.get("/api/portfolio")
    assert_test(p_res.status_code == 200, "GET /api/portfolio returned HTTP 200")
    assert_test(p_res.json().get("profile", {}).get("shortName") == "Matloob", "GET /api/portfolio returns verified content")

    # -------------------------------------------------------------
    # FINAL SUMMARY
    # -------------------------------------------------------------
    print("\n" + "=" * 65)
    print(f"🏁 TEST RESULTS: {passed} PASSED | {failed} FAILED")
    print("=" * 65)
    return failed == 0


if __name__ == "__main__":
    success = run_database_tests()
    sys.exit(0 if success else 1)

