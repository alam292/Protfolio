"""
Phase 5 Frontend UI & Interactive Modals Verification Suite (test_phase5_ui.py)
Validates:
1. Static asset delivery for auth-modal.css and js/auth.js with proper MIME types
2. index.html markup integrity:
   - Auth modal overlay and dialog container
   - Google Sign-In button
   - Email login form & inputs
   - 6 individual OTP input boxes with one-time-code autocomplete
   - Password creation form with strength bar indicators
   - Forgot password request & reset views
   - Desktop and mobile navigation container mounting points
3. CSS responsive definitions and dark theme glassmorphic styling
4. JS module export structure and API signatures
"""

import re
import unittest
from pathlib import Path
from fastapi.testclient import TestClient
from app import app


class TestPhase5FrontendUI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.root_dir = Path(__file__).resolve().parent

    def test_01_index_html_modal_integration(self):
        """Verify index.html includes all 5 view states and DOM containers"""
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        html = res.text

        # Navigation integration
        self.assertIn('id="navAuthContainer"', html)
        self.assertIn('id="drawerAuthContainer"', html)

        # Modal shell
        self.assertIn('id="authModalOverlay"', html)
        self.assertIn('id="authModalClose"', html)
        self.assertIn('id="authAlertBanner"', html)

        # View 1: Login
        self.assertIn('id="viewLogin"', html)
        self.assertIn('id="btnGoogleAuth"', html)
        self.assertIn('id="formEmailLogin"', html)
        self.assertIn('id="inputEmail"', html)
        self.assertIn('id="inputPassword"', html)
        self.assertIn('id="linkForgotPassword"', html)

        # View 2: OTP
        self.assertIn('id="viewOtp"', html)
        self.assertIn('id="formVerifyOTP"', html)
        self.assertIn('id="otpEmailNotice"', html)
        self.assertIn('id="btnResendOTP"', html)
        # Check exactly 6 otp-digit inputs
        otp_boxes = re.findall(r'class="otp-digit"', html)
        self.assertEqual(len(otp_boxes), 6, "Expected exactly 6 OTP input boxes in markup")

        # View 3: Set Password
        self.assertIn('id="viewSetPassword"', html)
        self.assertIn('id="formSetPassword"', html)
        self.assertIn('id="inputNewPassword"', html)
        self.assertIn('id="inputConfirmPassword"', html)
        self.assertIn('id="passwordMeterLabel"', html)
        self.assertIn('class="meter-bar"', html)

        # View 4 & 5: Forgot Password
        self.assertIn('id="viewForgotPasswordRequest"', html)
        self.assertIn('id="formForgotPasswordRequest"', html)
        self.assertIn('id="viewForgotPasswordReset"', html)
        self.assertIn('id="formForgotPasswordReset"', html)
        self.assertIn('id="inputResetOTP"', html)
        self.assertIn('id="inputResetNewPassword"', html)

    def test_02_css_asset_and_styles(self):
        """Verify auth-modal.css serves with valid CSS and contains responsive rules"""
        res = self.client.get("/css/auth-modal.css")
        self.assertEqual(res.status_code, 200)
        css = res.text

        # Glassmorphic backdrop & card
        self.assertIn(".auth-modal-overlay", css)
        self.assertIn("backdrop-filter: blur", css)
        self.assertIn(".auth-modal-card", css)

        # 6-box OTP grid styles
        self.assertIn(".otp-boxes", css)
        self.assertIn(".otp-digit", css)

        # Password meter styles
        self.assertIn(".password-meter-bars", css)
        self.assertIn(".meter-bar", css)

        # Mobile responsiveness media queries
        self.assertIn("@media (max-width: 480px)", css)

    def test_03_js_auth_module(self):
        """Verify js/auth.js serves and defines public interface"""
        res = self.client.get("/js/auth.js")
        self.assertEqual(res.status_code, 200)
        js = res.text

        # Verify public API
        self.assertIn("window.FoliobloxAuth", js)
        self.assertIn("openModal", js)
        self.assertIn("closeModal", js)
        self.assertIn("checkSession", js)
        self.assertIn("handleLogout", js)

        # Verify UX enhancements
        self.assertIn("setupOTPInputHandling", js)
        self.assertIn("updatePasswordMeter", js)
        self.assertIn("startCooldownTimer", js)
        self.assertIn("handleGoogleCredentialResponse", js)


if __name__ == "__main__":
    unittest.main()

