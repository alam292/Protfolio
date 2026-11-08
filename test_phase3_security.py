"""
Phase 3 Verification & Security Test Suite (test_phase3_security.py)
Validates:
1. Bcrypt password hashing & constant-time verification.
2. Cryptographic 6-digit OTP generation, salted SHA-256 hashing, and verification.
3. JWT session token & short-lived setup token encoding/decoding.
4. Glassmorphism HTML email template rendering & mock async dispatch.
5. Error handling on tampered or expired tokens.
"""

import asyncio
import unittest
import time
from datetime import timedelta
import jwt

from server_py.auth_security import (
    hash_password,
    verify_password,
    generate_secure_otp,
    generate_uuid_token,
    hash_otp,
    verify_otp,
    create_jwt_token,
    decode_jwt_token,
    create_session_token,
    create_setup_token,
    verify_setup_token,
)
from server_py.mailer import (
    render_signup_otp_email,
    render_password_reset_email,
    send_signup_otp_email,
    send_password_reset_email,
    send_email_async,
)


class TestPhase3SecuritySuite(unittest.TestCase):

    # -------------------------------------------------------------
    # 1. Password Security Tests (Bcrypt)
    # -------------------------------------------------------------
    def test_01_password_hashing_and_verification(self):
        password = "SuperSecretSecurePassword!2026"
        hashed = hash_password(password)
        
        self.assertTrue(hashed.startswith("$2b$") or hashed.startswith("$2a$"))
        self.assertTrue(verify_password(password, hashed))
        self.assertFalse(verify_password("WrongPassword123", hashed))
        self.assertFalse(verify_password("", hashed))
        self.assertFalse(verify_password(password, None))

    def test_02_password_empty_raises_value_error(self):
        with self.assertRaises(ValueError):
            hash_password("")

    # -------------------------------------------------------------
    # 2. OTP Security Tests
    # -------------------------------------------------------------
    def test_03_generate_secure_otp_format(self):
        otps = [generate_secure_otp() for _ in range(50)]
        for code in otps:
            self.assertEqual(len(code), 6)
            self.assertTrue(code.isdigit())
        # Check entropy (50 OTPs should have at least 45 unique values)
        self.assertGreater(len(set(otps)), 45)

    def test_04_otp_salted_hashing_and_verification(self):
        otp = "048219"
        hashed = hash_otp(otp)
        
        self.assertEqual(len(hashed), 64)  # SHA-256 hex is 64 characters
        self.assertTrue(verify_otp(otp, hashed))
        self.assertFalse(verify_otp("048220", hashed))
        self.assertFalse(verify_otp("", hashed))
        self.assertFalse(verify_otp(otp, ""))

    def test_05_uuid_token_generation(self):
        token1 = generate_uuid_token()
        token2 = generate_uuid_token()
        self.assertEqual(len(token1), 36)
        self.assertNotEqual(token1, token2)

    # -------------------------------------------------------------
    # 3. JWT Token Management Tests
    # -------------------------------------------------------------
    def test_06_session_token_create_and_decode(self):
        token = create_session_token(
            user_id=42,
            email="developer@example.com",
            role="admin",
            name="John Doe",
            expires_minutes=60
        )
        self.assertIsInstance(token, str)
        payload = decode_jwt_token(token)
        
        self.assertIsNotNone(payload)
        self.assertEqual(payload.get("sub"), "42")
        self.assertEqual(payload.get("email"), "developer@example.com")
        self.assertEqual(payload.get("role"), "admin")
        self.assertEqual(payload.get("name"), "John Doe")
        self.assertEqual(payload.get("token_type"), "session")
        self.assertIn("exp", payload)
        self.assertIn("iat", payload)

    def test_07_setup_token_flow(self):
        token = create_setup_token(user_id=10, email="newuser@example.com", expires_minutes=15)
        payload = verify_setup_token(token)
        
        self.assertIsNotNone(payload)
        self.assertEqual(payload.get("sub"), "10")
        self.assertEqual(payload.get("email"), "newuser@example.com")
        self.assertEqual(payload.get("token_type"), "setup_password")

        # Session token should fail verify_setup_token because of token_type mismatch
        session_token = create_session_token(user_id=10, email="newuser@example.com")
        self.assertIsNone(verify_setup_token(session_token))

    def test_08_tampered_and_expired_jwt(self):
        # Tampered token test
        token = create_session_token(user_id=1, email="test@example.com")
        tampered_token = token[:-5] + "ABCDE"
        self.assertIsNone(decode_jwt_token(tampered_token))
        self.assertIsNone(decode_jwt_token("gibberish.token.value"))
        self.assertIsNone(decode_jwt_token(""))

        # Expired token test (expires_delta = negative timedelta)
        expired_token = create_jwt_token(
            {"sub": "1", "email": "test@example.com"},
            expires_delta=timedelta(seconds=-10)
        )
        self.assertIsNone(decode_jwt_token(expired_token))

    # -------------------------------------------------------------
    # 4. HTML Email Templates & Mailer Tests
    # -------------------------------------------------------------
    def test_09_signup_html_template_rendering(self):
        html = render_signup_otp_email("test@example.com", "Alice Smith", "123456")
        self.assertIn("123456", html)
        self.assertIn("Alice Smith", html)
        self.assertIn("test@example.com", html)
        self.assertIn("Folioblox Security", html)
        self.assertIn("#00f0ff", html)  # Glowing cyan accent color

    def test_10_password_reset_html_template_rendering(self):
        html = render_password_reset_email("test@example.com", "Bob Jones", "987654")
        self.assertIn("987654", html)
        self.assertIn("Bob Jones", html)
        self.assertIn("Security Alert", html)
        self.assertIn("Password Reset Request", html)

    def test_11_async_email_dispatch_dev_mode(self):
        async def run_async_tests():
            # In dev mode (SMTP_ENABLED=False by default unless credentials set in .env),
            # this prints the mock email and returns True without failing
            res1 = await send_signup_otp_email("test@example.com", "Alice", "123456")
            res2 = await send_password_reset_email("test@example.com", "Alice", "654321")
            res3 = await send_email_async("", "Test Empty", "body")
            return res1, res2, res3

        r1, r2, r3 = asyncio.run(run_async_tests())
        self.assertTrue(r1)
        self.assertTrue(r2)
        self.assertFalse(r3)  # Empty email must fail gracefully


if __name__ == "__main__":
    unittest.main()

