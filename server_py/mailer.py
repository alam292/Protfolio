"""
Email Dispatcher & HTML Notification Engine (server_py/mailer.py)
Provides:
- Modern dark glassmorphic HTML email templates for OTP verification and password reset
- Async email dispatching via `aiosmtplib`
- Mock / Dev fallback mode when SMTP is disabled or unconfigured
- Plain text fallbacks for minimal email clients
"""

import logging
from email.message import EmailMessage
from typing import Optional
import aiosmtplib

from server_py.config import (
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASSWORD,
    MAIL_FROM,
    SMTP_ENABLED,
)

logger = logging.getLogger("mailer")


# =====================================================================
# 1. HTML Email Template Generators
# =====================================================================

def render_signup_otp_email(to_email: str, user_name: Optional[str], otp_code: str) -> str:
    """
    Renders high-tech, responsive dark glassmorphic HTML email for Google Sign-Up OTP verification.
    """
    display_name = user_name.strip() if user_name and user_name.strip() else "Creator"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Folioblox Account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background: #111827; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);">
          <!-- Top Accent Bar -->
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #00f0ff 0%, #3b82f6 50%, #8b5cf6 100%);"></td>
          </tr>
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 16px 32px; text-align: center;">
              <div style="display: inline-block; padding: 6px 14px; background: rgba(0, 240, 255, 0.08); border: 1px solid rgba(0, 240, 255, 0.25); border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #00f0ff; text-transform: uppercase;">
                Folioblox Security
              </div>
              <h1 style="margin: 20px 0 8px 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                Verify Your Account
              </h1>
              <p style="margin: 0; font-size: 14px; color: #94a3b8; line-height: 1.5;">
                Welcome, <strong style="color: #f1f5f9;">{display_name}</strong>! Use the verification code below to activate your developer portfolio account.
              </p>
            </td>
          </tr>

          <!-- OTP Display Card -->
          <tr>
            <td style="padding: 16px 32px;">
              <div style="background: rgba(0, 240, 255, 0.04); border: 1px solid rgba(0, 240, 255, 0.25); border-radius: 12px; padding: 24px; text-align: center;">
                <span style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 8px;">
                  Your 6-Digit OTP Code
                </span>
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #00f0ff; text-shadow: 0 0 16px rgba(0, 240, 255, 0.4); padding-left: 12px;">
                  {otp_code}
                </div>
                <div style="margin-top: 12px; font-size: 12px; color: #f59e0b; font-weight: 500;">
                  ⏱️ Expires in 5 minutes (One-time use only)
                </div>
              </div>
            </td>
          </tr>

          <!-- Security Notice -->
          <tr>
            <td style="padding: 8px 32px 24px 32px;">
              <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.6; text-align: center;">
                If you did not initiate this sign-up request for <span style="color: #94a3b8;">{to_email}</span>, you can safely disregard this email. Never share this code with anyone.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background: #0c1220; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #475569;">
                &copy; 2026 Folioblox AI Engine. All rights reserved.
              </p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #334155;">
                Automated security transmission • Do not reply to this email
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def render_password_reset_email(to_email: str, user_name: Optional[str], otp_code: str) -> str:
    """
    Renders high-tech responsive dark glassmorphic HTML email for Password Reset OTP verification.
    """
    display_name = user_name.strip() if user_name and user_name.strip() else "Folioblox User"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Folioblox Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background: #111827; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);">
          <!-- Top Accent Bar -->
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #f59e0b 0%, #ef4444 50%, #8b5cf6 100%);"></td>
          </tr>
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 16px 32px; text-align: center;">
              <div style="display: inline-block; padding: 6px 14px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #f59e0b; text-transform: uppercase;">
                Security Alert
              </div>
              <h1 style="margin: 20px 0 8px 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                Password Reset Request
              </h1>
              <p style="margin: 0; font-size: 14px; color: #94a3b8; line-height: 1.5;">
                Hello <strong style="color: #f1f5f9;">{display_name}</strong>, a request was received to reset the password for your account.
              </p>
            </td>
          </tr>

          <!-- OTP Display Card -->
          <tr>
            <td style="padding: 16px 32px;">
              <div style="background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 24px; text-align: center;">
                <span style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 8px;">
                  Your Password Reset Code
                </span>
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #f59e0b; text-shadow: 0 0 16px rgba(245, 158, 11, 0.4); padding-left: 12px;">
                  {otp_code}
                </div>
                <div style="margin-top: 12px; font-size: 12px; color: #ef4444; font-weight: 500;">
                  ⏱️ Expires in 5 minutes (3 max attempts)
                </div>
              </div>
            </td>
          </tr>

          <!-- Security Notice -->
          <tr>
            <td style="padding: 8px 32px 24px 32px;">
              <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.6; text-align: center;">
                If you did not request this password reset, please ignore this email. Your existing password will remain unchanged and your account is completely safe.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background: #0c1220; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #475569;">
                &copy; 2026 Folioblox AI Engine. All rights reserved.
              </p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #334155;">
                Automated security transmission • Do not reply to this email
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


# =====================================================================
# 2. Asynchronous SMTP Dispatcher
# =====================================================================

async def send_email_async(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None
) -> bool:
    """
    Asynchronously dispatch an email via aiosmtplib.
    If SMTP credentials are not configured (SMTP_ENABLED is False),
    logs the email content cleanly to console for local testing without failing.
    """
    to_clean = to_email.strip()
    if not to_clean:
        logger.error("Cannot dispatch email: empty recipient address.")
        return False

    plain_text = text_content or "Please enable HTML viewing to inspect your security verification message."

    # Fallback to dev/mock mode when SMTP is disabled
    if not SMTP_ENABLED:
        logger.warning(
            "\n" + "=" * 65 + "\n"
            f"📨 [DEV MOCK EMAIL DISPATCH - SMTP NOT CONFIGURED]\n"
            f"To      : {to_clean}\n"
            f"Subject : {subject}\n"
            f"Body    :\n{plain_text}\n"
            + "=" * 65
        )
        return True

    # Build standard MIME email
    msg = EmailMessage()
    msg["From"] = MAIL_FROM
    msg["To"] = to_clean
    msg["Subject"] = subject

    msg.set_content(plain_text)
    msg.add_alternative(html_content, subtype="html")

    try:
        use_tls = (SMTP_PORT == 465)
        start_tls = (SMTP_PORT == 587)

        await aiosmtplib.send(
            msg,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
            use_tls=use_tls,
            start_tls=start_tls,
            timeout=15.0
        )
        logger.info(f"✅ Email successfully dispatched to {to_clean} [{subject}]")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send email to {to_clean}: {e}", exc_info=True)
        return False


# =====================================================================
# 3. High-Level Dispatcher Helpers
# =====================================================================

async def send_signup_otp_email(to_email: str, user_name: Optional[str], otp_code: str) -> bool:
    """
    Helper to send Google Sign-up 6-digit OTP email.
    """
    subject = "Verify Your Folioblox Portfolio Account"
    plain_text = (
        f"Welcome to Folioblox!\n\n"
        f"Your verification code is: {otp_code}\n\n"
        f"This code will expire in 5 minutes. If you did not request this, please ignore."
    )
    html_content = render_signup_otp_email(to_email, user_name, otp_code)
    return await send_email_async(to_email, subject, html_content, plain_text)


async def send_password_reset_email(to_email: str, user_name: Optional[str], otp_code: str) -> bool:
    """
    Helper to send Password Reset 6-digit OTP email.
    """
    subject = "Reset Your Folioblox Portfolio Password"
    plain_text = (
        f"Password Reset Request\n\n"
        f"Your reset code is: {otp_code}\n\n"
        f"This code will expire in 5 minutes. If you did not request this, please ignore."
    )
    html_content = render_password_reset_email(to_email, user_name, otp_code)
    return await send_email_async(to_email, subject, html_content, plain_text)

