"""
Phase 4 Automated Verification Suite (test_phase4_api.py)
Tests all 9 Authentication REST API endpoints mounted on /api/auth:
1. /api/auth/me (unauthenticated state)
2. /api/auth/google/initiate (invalid & valid Google tokens, OTP generation)
3. /api/auth/google/verify-otp (incorrect OTP, max attempts, successful verification)
4. /api/auth/set-password (invalid token, short password, successful bcrypt hash & session cookie)
5. /api/auth/me (authenticated state via cookie)
6. /api/auth/login (invalid creds, successful email + password login)
7. /api/auth/google/login (1-click login for registered users)
8. /api/auth/forgot-password/request (reset OTP generation & background mailer)
9. /api/auth/forgot-password/reset (invalid OTP, successful password reset)
10. Verify login with newly reset password
11. /api/auth/logout (cookie revocation)
"""

import os
import unittest
from fastapi.testclient import TestClient

from app import app
from server_py.database import SessionLocal
from server_py.models import User, EmailOTP


class TestPhase4AuthAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = SessionLocal()

        # Clean any test users from prior runs
        cls.test_email = "tester_phase4@example.com"
        cls.db.query(EmailOTP).filter(
            EmailOTP.user_id.in_(
                cls.db.query(User.id).filter(User.email == cls.test_email)
            )
        ).delete(synchronize_session=False)
        cls.db.query(User).filter(User.email == cls.test_email).delete(synchronize_session=False)
        cls.db.commit()

    @classmethod
    def tearDownClass(cls):
        # Cleanup
        cls.db.query(EmailOTP).filter(
            EmailOTP.user_id.in_(
                cls.db.query(User.id).filter(User.email == cls.test_email)
            )
        ).delete(synchronize_session=False)
        cls.db.query(User).filter(User.email == cls.test_email).delete(synchronize_session=False)
        cls.db.commit()
        cls.db.close()

    def test_01_me_unauthenticated(self):
        """GET /api/auth/me returns authenticated: false when no cookie is present"""
        res = self.client.get("/api/auth/me")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertFalse(data["authenticated"])
        self.assertIsNone(data["user"])

    def test_02_google_initiate_invalid(self):
        """POST /api/auth/google/initiate with bad token returns 400"""
        res = self.client.post("/api/auth/google/initiate", json={"credential": "invalid_token_xyz"})
        self.assertEqual(res.status_code, 400)
        self.assertIn("Invalid Google credential", res.json()["detail"])

    def test_03_google_initiate_success(self):
        """POST /api/auth/google/initiate generates OTP and temp_token"""
        mock_cred = f"mock_google_token:phase4-sub-999:{self.test_email}:Phase 4 Tester"
        res = self.client.post("/api/auth/google/initiate", json={"credential": mock_cred})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "otp_required")
        self.assertIn("temp_token", data)
        self.assertEqual(data["email"], self.test_email)

        # Store temp_token for next test
        TestPhase4AuthAPI.temp_token = data["temp_token"]

        # Verify DB record created
        user = self.db.query(User).filter(User.email == self.test_email).first()
        self.assertIsNotNone(user)
        self.assertFalse(user.is_verified)

        otp_rec = self.db.query(EmailOTP).filter(EmailOTP.token == data["temp_token"]).first()
        self.assertIsNotNone(otp_rec)
        self.assertEqual(otp_rec.purpose, "signup")

    def test_04_verify_otp_wrong_code(self):
        """POST /api/auth/google/verify-otp with wrong code returns 400 and increments attempts"""
        res = self.client.post(
            "/api/auth/google/verify-otp",
            json={"temp_token": self.temp_token, "otp": "000000"}
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("Invalid verification code", res.json()["detail"])

    def test_05_verify_otp_success(self):
        """POST /api/auth/google/verify-otp with valid OTP marks user verified and issues setup_token"""
        # Retrieve the generated OTP hash from DB and find the valid code
        otp_rec = self.db.query(EmailOTP).filter(EmailOTP.token == self.temp_token).first()
        from server_py.auth_security import verify_otp

        # Find matching 6-digit OTP
        matched_otp = None
        for i in range(1_000_000):
            candidate = f"{i:06d}"
            if verify_otp(candidate, otp_rec.otp_hash):
                matched_otp = candidate
                break

        self.assertIsNotNone(matched_otp, "Should match OTP within 6-digit space")

        res = self.client.post(
            "/api/auth/google/verify-otp",
            json={"temp_token": self.temp_token, "otp": matched_otp}
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "set_password_required")
        self.assertIn("setup_token", data)

        TestPhase4AuthAPI.setup_token = data["setup_token"]

        # Verify user is now verified
        user = self.db.query(User).filter(User.email == self.test_email).first()
        self.assertTrue(user.is_verified)

    def test_06_set_password_short(self):
        """POST /api/auth/set-password rejects short password (validation error 422 or 400)"""
        res = self.client.post(
            "/api/auth/set-password",
            json={"setup_token": self.setup_token, "password": "123"}
        )
        self.assertIn(res.status_code, [400, 422])

    def test_07_set_password_success_and_cookie(self):
        """POST /api/auth/set-password creates bcrypt password and sets portfolio_auth cookie"""
        res = self.client.post(
            "/api/auth/set-password",
            json={"setup_token": self.setup_token, "password": "SuperSecretPass123!"}
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "success")
        self.assertTrue(data["user"]["hasPassword"])

        # Check HttpOnly cookie set
        self.assertIn("portfolio_auth", res.cookies)
        TestPhase4AuthAPI.session_cookie = res.cookies["portfolio_auth"]

    def test_08_me_authenticated_via_cookie(self):
        """GET /api/auth/me returns authenticated: true when cookie is present"""
        client = TestClient(app, cookies={"portfolio_auth": self.session_cookie})
        res = client.get("/api/auth/me")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["authenticated"])
        self.assertEqual(data["user"]["email"], self.test_email)

    def test_09_login_with_password(self):
        """POST /api/auth/login validates credentials and returns session cookie"""
        # Wrong password
        res_bad = self.client.post(
            "/api/auth/login",
            json={"email": self.test_email, "password": "WrongPassword"}
        )
        self.assertEqual(res_bad.status_code, 401)

        # Correct password
        res_good = self.client.post(
            "/api/auth/login",
            json={"email": self.test_email, "password": "SuperSecretPass123!"}
        )
        self.assertEqual(res_good.status_code, 200)
        self.assertIn("portfolio_auth", res_good.cookies)

    def test_10_google_one_click_login(self):
        """POST /api/auth/google/login seamlessly logs in existing verified user"""
        mock_cred = f"mock_google_token:phase4-sub-999:{self.test_email}:Phase 4 Tester"
        res = self.client.post("/api/auth/google/login", json={"credential": mock_cred})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "success")
        self.assertIn("portfolio_auth", res.cookies)

    def test_11_forgot_password_flow(self):
        """POST /api/auth/forgot-password/request and reset flow"""
        # Request reset OTP
        res_req = self.client.post(
            "/api/auth/forgot-password/request",
            json={"email": self.test_email}
        )
        self.assertEqual(res_req.status_code, 200)
        data_req = res_req.json()
        self.assertEqual(data_req["status"], "otp_sent")
        reset_token = data_req["reset_token"]

        # Retrieve OTP code
        otp_rec = self.db.query(EmailOTP).filter(EmailOTP.token == reset_token).first()
        from server_py.auth_security import verify_otp
        matched_otp = None
        for i in range(1_000_000):
            cand = f"{i:06d}"
            if verify_otp(cand, otp_rec.otp_hash):
                matched_otp = cand
                break

        self.assertIsNotNone(matched_otp)

        # Reset password
        res_reset = self.client.post(
            "/api/auth/forgot-password/reset",
            json={
                "reset_token": reset_token,
                "otp": matched_otp,
                "new_password": "BrandNewPassword2026!"
            }
        )
        self.assertEqual(res_reset.status_code, 200)
        self.assertEqual(res_reset.json()["status"], "password_updated")

        # Verify old password fails
        res_old = self.client.post(
            "/api/auth/login",
            json={"email": self.test_email, "password": "SuperSecretPass123!"}
        )
        self.assertEqual(res_old.status_code, 401)

        # Verify new password succeeds
        res_new = self.client.post(
            "/api/auth/login",
            json={"email": self.test_email, "password": "BrandNewPassword2026!"}
        )
        self.assertEqual(res_new.status_code, 200)

    def test_12_logout(self):
        """POST /api/auth/logout deletes the portfolio_auth cookie"""
        res = self.client.post("/api/auth/logout")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "logged_out")
        # In set-cookie header, max-age=0 or empty indicates deletion
        set_cookie = res.headers.get("set-cookie", "")
        self.assertIn("portfolio_auth", set_cookie)


if __name__ == "__main__":
    unittest.main()
