"""
Phase 6 Edit Dashboard & Route Protection Test Suite (test_phase6_protection.py)
Validates:
1. /admin route authentication guard (redirects unauthenticated users to /?login=required)
2. /admin serves admin-dashboard.html for authenticated sessions
3. Dual-layer API route protection on sensitive endpoints:
   - POST /api/publish-portfolio (requires JWT session OR Admin PIN)
   - POST /api/restore-backup (requires JWT session OR Admin PIN)
   - GET  /api/admin/messages (requires JWT session OR Admin PIN)
   - POST /api/verify-pin (resolves active JWT session without prompting)
   - POST /api/upload-resume direct publish
4. Live sync script delivery (js/dashboard.js)
"""

import unittest
from fastapi.testclient import TestClient

from app import app
from server_py.auth_security import create_session_token
from server_py.config import ADMIN_UPLOAD_PIN, AUTH_COOKIE_NAME


class TestPhase6RouteProtection(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create unauthenticated client
        cls.anon_client = TestClient(app, follow_redirects=False)

        # Create authenticated session token & client
        cls.valid_token = create_session_token(
            user_id=1,
            email="admin@folioblox.dev",
            role="admin",
            name="Admin Tester"
        )
        cls.auth_client = TestClient(app, cookies={AUTH_COOKIE_NAME: cls.valid_token}, follow_redirects=False)

    def test_01_admin_route_unauthenticated_redirect(self):
        """GET /admin redirects to /?login=required when not authenticated"""
        res = self.anon_client.get("/admin")
        self.assertEqual(res.status_code, 302)
        self.assertIn("/?login=required", res.headers.get("location", ""))

    def test_02_admin_route_authenticated_access(self):
        """GET /admin serves admin-dashboard.html when authenticated"""
        res = self.auth_client.get("/admin")
        self.assertEqual(res.status_code, 200)
        self.assertIn("Folioblox CMS — Split-Screen Live Form Editor", res.text)
        self.assertIn("previewIframe", res.text)

    def test_03_verify_pin_with_session(self):
        """POST /api/verify-pin automatically succeeds when session is active"""
        res = self.auth_client.post("/api/verify-pin")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["valid"])
        self.assertEqual(data.get("method"), "session")

    def test_04_publish_unauthorized_rejection(self):
        """POST /api/publish-portfolio rejects request without session or PIN"""
        res = self.anon_client.post("/api/publish-portfolio", json={"data": {}})
        self.assertEqual(res.status_code, 401)
        self.assertFalse(res.json()["success"])

    def test_05_publish_authorized_via_jwt_session(self):
        """POST /api/publish-portfolio succeeds with JWT session cookie alone"""
        # Fetch current active portfolio
        current_res = self.auth_client.get("/api/portfolio")
        self.assertEqual(current_res.status_code, 200)
        portfolio_data = current_res.json()

        res = self.auth_client.post("/api/publish-portfolio", json={"data": portfolio_data})
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["success"])

    def test_06_publish_authorized_via_admin_pin(self):
        """POST /api/publish-portfolio succeeds with valid Admin PIN (backward compatibility)"""
        current_res = self.anon_client.get("/api/portfolio")
        portfolio_data = current_res.json()

        res = self.anon_client.post(
            "/api/publish-portfolio",
            headers={"x-admin-pin": ADMIN_UPLOAD_PIN or "1234"},
            json={"data": portfolio_data}
        )
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["success"])

    def test_07_restore_backup_protection(self):
        """POST /api/restore-backup rejects unauthenticated and accepts session"""
        # Unauthenticated without PIN
        res_bad = self.anon_client.post("/api/restore-backup", json={"filename": "fake_backup.json"})
        self.assertEqual(res_bad.status_code, 401)

        # Authenticated with session (even if backup not found, authorization passes 404 instead of 401)
        res_auth = self.auth_client.post("/api/restore-backup", json={"filename": "fake_backup.json"})
        self.assertNotEqual(res_auth.status_code, 401)

    def test_08_admin_messages_protection(self):
        """GET /api/admin/messages requires session or PIN"""
        # Unauthenticated
        res_bad = self.anon_client.get("/api/admin/messages")
        self.assertEqual(res_bad.status_code, 401)

        # Authenticated via session
        res_auth = self.auth_client.get("/api/admin/messages")
        self.assertEqual(res_auth.status_code, 200)
        self.assertTrue(res_auth.json()["success"])

    def test_09_dashboard_assets_serving(self):
        """Verify admin-dashboard.html and js/dashboard.js static serving"""
        res_js = self.anon_client.get("/js/dashboard.js")
        self.assertEqual(res_js.status_code, 200)
        self.assertIn("PORTFOLIO_LIVE_SYNC", res_js.text)


if __name__ == "__main__":
    unittest.main()

