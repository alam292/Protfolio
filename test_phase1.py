"""
test_phase1.py - Automated Verification Suite for Phase 1 (Python FastAPI Core Migration)
"""

import sys
from starlette.testclient import TestClient
from app import app

client = TestClient(app)

def run_tests():
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

    print("\n=== PHASE 1 TEST SUITE 1: STATIC ASSETS & ROOT DELIVERABILITY ===")
    
    # 1. Root route
    res = client.get("/")
    assert_check("GET / returns 200 OK", res.status_code == 200, f"Got {res.status_code}")
    assert_check("GET / content-type is text/html", "text/html" in res.headers.get("content-type", ""))
    assert_check("GET / contains portfolio HTML", "MD MATLOOB ALAM" in res.text)

    # 2. Index.html route
    res = client.get("/index.html")
    assert_check("GET /index.html returns 200 OK", res.status_code == 200)

    # 3. CSS mount
    res = client.get("/css/main.css")
    assert_check("GET /css/main.css returns 200 OK", res.status_code == 200)
    assert_check("GET /css/main.css MIME is CSS", "text/css" in res.headers.get("content-type", ""))

    # 4. JS mount
    res = client.get("/js/render.js")
    assert_check("GET /js/render.js returns 200 OK", res.status_code == 200)
    assert_check("GET /js/render.js MIME is JavaScript", "javascript" in res.headers.get("content-type", ""))

    # 5. Data mount
    res = client.get("/data/portfolio.json")
    assert_check("GET /data/portfolio.json returns 200 OK", res.status_code == 200)
    assert_check("GET /data/portfolio.json MIME is JSON", "application/json" in res.headers.get("content-type", ""))

    print("\n=== PHASE 1 TEST SUITE 2: CORE API ENDPOINTS ===")

    # 6. GET /api/health
    res = client.get("/api/health")
    assert_check("GET /api/health returns 200 OK", res.status_code == 200)
    data = res.json()
    assert_check("GET /api/health status is 'ok'", data.get("status") == "ok")
    assert_check("GET /api/health runtime is 'Python FastAPI'", data.get("runtime") == "Python FastAPI")
    assert_check("GET /api/health includes timestamp", "timestamp" in data)

    # 7. GET /api/portfolio
    res = client.get("/api/portfolio")
    assert_check("GET /api/portfolio returns 200 OK", res.status_code == 200)
    portfolio = res.json()
    assert_check("GET /api/portfolio returns profile.name", portfolio.get("profile", {}).get("name", "").upper() == "MD MATLOOB ALAM")
    skills_cats = portfolio.get("skills", {}).get("categories", [])
    assert_check("GET /api/portfolio returns skills categories", len(skills_cats) >= 6, f"Got {len(skills_cats)} categories")

    # 8. GET /api/backups
    res = client.get("/api/backups")
    assert_check("GET /api/backups returns 200 OK", res.status_code == 200)
    backups_data = res.json()
    assert_check("GET /api/backups success is True", backups_data.get("success") is True)
    assert_check("GET /api/backups returns list", isinstance(backups_data.get("backups"), list))
    if backups_data.get("backups"):
        first = backups_data["backups"][0]
        assert_check("Backup item has filename", "filename" in first)
        assert_check("Backup item has formattedDate", "formattedDate" in first)
        assert_check("Backup item has sizeFormatted", "sizeFormatted" in first)

    print("\n=== PHASE 1 TEST SUITE 3: ADMIN SECURITY & PIN VERIFICATION ===")

    # 9. POST /api/verify-pin with wrong pin
    res = client.post("/api/verify-pin", json={"pin": "wrong_pin"})
    assert_check("POST /api/verify-pin returns 200", res.status_code == 200)
    assert_check("Wrong PIN rejected (valid=False)", res.json().get("valid") is False)

    # 10. POST /api/verify-pin with correct pin in JSON
    res = client.post("/api/verify-pin", json={"pin": "1234"})
    assert_check("Correct PIN accepted via body (valid=True)", res.json().get("valid") is True)

    # 11. POST /api/verify-pin with header x-admin-pin
    res = client.post("/api/verify-pin", headers={"x-admin-pin": "1234"})
    assert_check("Correct PIN accepted via header (valid=True)", res.json().get("valid") is True)

    # 12. CORS Preflight Check
    res = client.options("/api/portfolio", headers={
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "GET"
    })
    assert_check("CORS preflight status is 200", res.status_code == 200)
    assert_check("CORS allow-origin is configured", "access-control-allow-origin" in res.headers)

    print("\n======================================================")
    print(f"TOTAL CHECKS: {total_checks} | PASSED: {passed_checks} | FAILED: {total_checks - passed_checks}")
    if passed_checks == total_checks:
        print(">>> ALL PHASE 1 AUTOMATED CHECKS PASSED WITH 100% SUCCESS! <<<")
        return 0
    else:
        print(">>> SOME CHECKS FAILED <<<")
        return 1

if __name__ == "__main__":
    sys.exit(run_tests())
