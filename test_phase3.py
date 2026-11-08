"""
test_phase3.py - Automated Verification Suite for Phase 3 (Cloud Deployment & Persistence Engine)
Tests Procfile, render.yaml, GitHub sync module, mock cloud commit persistence, and production endpoints.
"""

import os
import io
import json
from pathlib import Path
from unittest.mock import patch, MagicMock
from starlette.testclient import TestClient

from app import app
from server_py.github_sync import (
    is_github_sync_configured,
    get_sync_config,
    get_github_file_sha,
    commit_file_to_github,
    sync_portfolio_to_github
)

client = TestClient(app)

def run_phase3_tests():
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

    print("\n=== PHASE 3 TEST SUITE 1: CLOUD DEPLOYMENT BLUEPRINTS & CONFIGS ===")

    # 1. Procfile check
    procfile_path = Path("Procfile")
    assert_check("Procfile physically exists", procfile_path.exists())
    if procfile_path.exists():
        procfile_content = procfile_path.read_text(encoding="utf-8")
        assert_check("Procfile contains web worker declaration", "web:" in procfile_content)
        assert_check("Procfile runs uvicorn app:app", "uvicorn app:app" in procfile_content)
        assert_check("Procfile uses dynamic $PORT", "$PORT" in procfile_content)

    # 2. render.yaml Blueprint check
    render_yaml_path = Path("render.yaml")
    assert_check("render.yaml physically exists", render_yaml_path.exists())
    if render_yaml_path.exists():
        render_content = render_yaml_path.read_text(encoding="utf-8")
        assert_check("render.yaml specifies web service", "type: web" in render_content)
        assert_check("render.yaml specifies python runtime", "runtime: python" in render_content)
        assert_check("render.yaml has pip install requirements buildCommand", "pip install -r requirements.txt" in render_content)
        assert_check("render.yaml has uvicorn startCommand", "uvicorn app:app" in render_content)
        assert_check("render.yaml specifies free tier plan", "plan: free" in render_content)

    # 3. .env.example configuration keys
    env_example_path = Path(".env.example")
    assert_check(".env.example physically exists", env_example_path.exists())
    if env_example_path.exists():
        env_content = env_example_path.read_text(encoding="utf-8")
        assert_check(".env.example defines PORT", "PORT=" in env_content)
        assert_check(".env.example defines GEMINI_API_KEY", "GEMINI_API_KEY=" in env_content)
        assert_check(".env.example defines ADMIN_UPLOAD_PIN", "ADMIN_UPLOAD_PIN=" in env_content)
        assert_check(".env.example defines GITHUB_TOKEN", "GITHUB_TOKEN=" in env_content)
        assert_check(".env.example defines GITHUB_REPO", "GITHUB_REPO=" in env_content)

    # 4. requirements.txt production packages
    req_path = Path("requirements.txt")
    assert_check("requirements.txt physically exists", req_path.exists())
    if req_path.exists():
        req_content = req_path.read_text(encoding="utf-8").lower()
        assert_check("requirements.txt includes fastapi", "fastapi" in req_content)
        assert_check("requirements.txt includes uvicorn", "uvicorn" in req_content)
        assert_check("requirements.txt includes pypdf", "pypdf" in req_content)
        assert_check("requirements.txt includes requests", "requests" in req_content)
        assert_check("requirements.txt includes python-dotenv", "python-dotenv" in req_content)

    print("\n=== PHASE 3 TEST SUITE 2: GITHUB PERSISTENCE & AUTO-SYNC ENGINE ===")

    # 5. Graceful fallback when GitHub sync is unconfigured
    with patch.dict(os.environ, {"GITHUB_TOKEN": "", "GITHUB_REPO": ""}, clear=False):
        assert_check("is_github_sync_configured returns False when empty", is_github_sync_configured() is False)
        sample_portfolio = {"profile": {"name": "Test User"}}
        fallback_res = sync_portfolio_to_github(sample_portfolio)
        assert_check("sync_portfolio_to_github handles unconfigured safely", fallback_res.get("synced") is False)
        assert_check("Fallback response indicates configured=False", fallback_res.get("configured") is False)

    # 6. Mock GitHub Commit (Happy Path)
    mock_env = {
        "GITHUB_TOKEN": "ghp_mock_token_1234567890abcdef",
        "GITHUB_REPO": "testuser/portfolio-test",
        "GITHUB_BRANCH": "main"
    }
    with patch.dict(os.environ, mock_env, clear=False):
        assert_check("is_github_sync_configured returns True with env vars", is_github_sync_configured() is True)
        cfg = get_sync_config()
        assert_check("get_sync_config extracts repo correctly", cfg["repo"] == "testuser/portfolio-test")
        assert_check("get_sync_config extracts branch correctly", cfg["branch"] == "main")

        # Mock requests.get for SHA and requests.put for Commit
        with patch("server_py.github_sync.requests.get") as mock_get, \
             patch("server_py.github_sync.requests.put") as mock_put:
            
            # Setup SHA fetch response (existing file)
            mock_sha_res = MagicMock()
            mock_sha_res.status_code = 200
            mock_sha_res.json.return_value = {"sha": "blob_sha_existing_123"}
            mock_get.return_value = mock_sha_res

            # Setup Commit response
            mock_commit_res = MagicMock()
            mock_commit_res.status_code = 200
            mock_commit_res.json.return_value = {
                "content": {"sha": "new_blob_sha_456", "html_url": "https://github.com/testuser/portfolio-test/blob/main/data/portfolio.json"},
                "commit": {"sha": "commit_sha_789"}
            }
            mock_put.return_value = mock_commit_res

            # Test SHA fetcher
            sha = get_github_file_sha("data/portfolio.json")
            assert_check("get_github_file_sha returns mocked SHA", sha == "blob_sha_existing_123")

            # Test single file commit
            commit_res = commit_file_to_github("data/portfolio.json", b'{"test": 1}', "test commit")
            assert_check("commit_file_to_github succeeds", commit_res.get("success") is True)
            assert_check("commit_file_to_github returns new blob sha", commit_res.get("sha") == "new_blob_sha_456")
            assert_check("commit_file_to_github returns commit sha", commit_res.get("commit") == "commit_sha_789")

            # Test full portfolio sync orchestrator
            sync_res = sync_portfolio_to_github({"profile": {"name": "Test User"}})
            assert_check("sync_portfolio_to_github returns synced=True", sync_res.get("synced") is True)
            assert_check("sync_portfolio_to_github records repository", sync_res.get("repo") == "testuser/portfolio-test")
            assert_check("sync_portfolio_to_github syncs items list", len(sync_res.get("items", [])) >= 1)

    # 7. Mock GitHub API Error Handling (Graceful degradation)
    with patch.dict(os.environ, mock_env, clear=False):
        with patch("server_py.github_sync.requests.get") as mock_get, \
             patch("server_py.github_sync.requests.put") as mock_put:
            
            mock_sha_res = MagicMock()
            mock_sha_res.status_code = 200
            mock_sha_res.json.return_value = {"sha": "blob_sha_123"}
            mock_get.return_value = mock_sha_res

            # Simulate GitHub 403 Forbidden / Rate limit
            mock_err_res = MagicMock()
            mock_err_res.status_code = 403
            mock_err_res.text = "API rate limit exceeded"
            mock_put.return_value = mock_err_res

            err_commit = commit_file_to_github("data/portfolio.json", b"test", "msg")
            assert_check("API 403 error handled gracefully without raising", err_commit.get("success") is False)
            assert_check("Error response includes status code", err_commit.get("status_code") == 403)

    print("\n=== PHASE 3 TEST SUITE 3: CLOUD HEALTH & PERSISTENCE ENDPOINTS ===")

    # Backup active portfolio.json content before running modifying tests
    original_portfolio_content = None
    portfolio_file = Path("data/portfolio.json")
    if portfolio_file.exists():
        original_portfolio_content = portfolio_file.read_text(encoding="utf-8")

    try:
        # 8. GET /api/health includes github_sync_configured
        health_res = client.get("/api/health")
        assert_check("GET /api/health status is 200", health_res.status_code == 200)
        health_data = health_res.json()
        assert_check("GET /api/health contains 'github_sync_configured' key", "github_sync_configured" in health_data)
        assert_check("GET /api/health confirms runtime is Python FastAPI", health_data.get("runtime") == "Python FastAPI")

        # 9. POST /api/publish-portfolio returns 'sync' status
        admin_pin = os.getenv("ADMIN_UPLOAD_PIN", "1234")
        sample_payload = {
            "data": {
                "profile": {
                    "name": "MD MATLOOB ALAM",
                    "title": "Software Developer",
                    "tagline": "Passionate coder"
                }
            },
            "pin": admin_pin
        }
        publish_res = client.post("/api/publish-portfolio", json=sample_payload)
        assert_check("POST /api/publish-portfolio returns 200 OK", publish_res.status_code == 200)
        publish_data = publish_res.json()
        assert_check("Publish response contains 'sync' persistence report", "sync" in publish_data)
        assert_check("Sync report has 'synced' boolean", isinstance(publish_data.get("sync", {}).get("synced"), bool))

        # 10. POST /api/upload-resume (direct mode) includes 'sync' status
        sample_pdf_path = Path("assets/Md_Matloob_Alam_Software_Developer_Resume.pdf")
        if sample_pdf_path.exists():
            with open(sample_pdf_path, "rb") as f:
                pdf_bytes = f.read()
            files = {"resume": ("Direct_Test.pdf", pdf_bytes, "application/pdf")}
            direct_res = client.post("/api/upload-resume", files=files, headers={"x-admin-pin": admin_pin})
            assert_check("Direct upload returns 200 OK", direct_res.status_code == 200)
            direct_data = direct_res.json()
            assert_check("Direct upload response contains 'sync' object", "sync" in direct_data)
        else:
            assert_check("Sample PDF available for direct upload test", False)
    finally:
        # Restore active portfolio.json to pristine state
        if original_portfolio_content is not None and portfolio_file.exists():
            portfolio_file.write_text(original_portfolio_content, encoding="utf-8")

    print("\n==========================================")
    print(f"PHASE 3 SUMMARY: {passed_checks}/{total_checks} CHECKS PASSED")
    print("==========================================")

    if passed_checks == total_checks:
        print(">>> ALL PHASE 3 CLOUD DEPLOYMENT & PERSISTENCE CHECKS PASSED WITH 100% SUCCESS! <<<\n")
        return True
    else:
        print(f">>> {total_checks - passed_checks} CHECKS FAILED. PLEASE REVIEW ABOVE LOGS. <<<\n")
        return False

if __name__ == "__main__":
    success = run_phase3_tests()
    sys_exit_code = 0 if success else 1
    exit(sys_exit_code)
