/**
 * Folioblox Authentication Manager (js/auth.js)
 * High-performance, reactive authentication controller providing:
 * - Google Identity Services & 1-Click login
 * - 6-Digit OTP verification with auto-focus & clipboard paste support
 * - Password creation with real-time strength analysis
 * - Standard Email/Password login & password recovery
 * - Session state synchronization with /api/auth/me
 */

(function () {
  'use strict';

  // Master State
  const state = {
    currentUser: null,
    tempToken: null,
    setupToken: null,
    resetToken: null,
    activeEmail: '',
    cooldownInterval: null,
    cooldownSeconds: 0
  };

  // DOM Elements cache
  let modalOverlay = null;
  let alertBanner = null;
  let otpInputs = [];

  // API Base
  const API_BASE = '';

  /**
   * Initialize Authentication System
   */
  async function init() {
    cacheDOMElements();
    bindEvents();
    initGoogleIdentity();
    await checkSession();

    // Check if redirected from /admin with ?login=required
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('login') === 'required' || urlParams.get('auth') === 'required') {
      openModal('login');
      showAlert('Please sign in to access the portfolio editor.', 'error');
    }
  }

  function cacheDOMElements() {
    modalOverlay = document.getElementById('authModalOverlay');
    alertBanner = document.getElementById('authAlertBanner');
    otpInputs = Array.from(document.querySelectorAll('.otp-digit'));
  }

  function bindEvents() {
    // Open modal triggers
    document.querySelectorAll('[data-action="open-auth-modal"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal('login');
      });
    });

    // Close modal triggers
    const closeBtn = document.getElementById('authModalClose');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
      });
    }

    // View Switching Links
    const forgotPwLink = document.getElementById('linkForgotPassword');
    if (forgotPwLink) {
      forgotPwLink.addEventListener('click', (e) => {
        e.preventDefault();
        openModal('forgot-password-request');
      });
    }

    const backToLoginLinks = document.querySelectorAll('[data-action="back-to-login"]');
    backToLoginLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        openModal('login');
      });
    });

    // Password Visibility Toggles
    document.querySelectorAll('.auth-password-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (input) {
          const isPassword = input.type === 'password';
          input.type = isPassword ? 'text' : 'password';
          btn.innerHTML = isPassword
            ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
            : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
        }
      });
    });

    // Form Submissions
    const loginForm = document.getElementById('formEmailLogin');
    if (loginForm) loginForm.addEventListener('submit', handleEmailLogin);

    const otpForm = document.getElementById('formVerifyOTP');
    if (otpForm) otpForm.addEventListener('submit', handleVerifyOTP);

    const setPwForm = document.getElementById('formSetPassword');
    if (setPwForm) setPwForm.addEventListener('submit', handleSetPassword);

    const forgotReqForm = document.getElementById('formForgotPasswordRequest');
    if (forgotReqForm) forgotReqForm.addEventListener('submit', handleForgotPasswordRequest);

    const forgotResetForm = document.getElementById('formForgotPasswordReset');
    if (forgotResetForm) forgotResetForm.addEventListener('submit', handleForgotPasswordReset);

    // Setup OTP 6-Box Auto-advance & Paste
    setupOTPInputHandling();

    // Setup Password Strength Meter
    const setPwInput = document.getElementById('inputNewPassword');
    if (setPwInput) {
      setPwInput.addEventListener('input', () => updatePasswordMeter(setPwInput.value));
    }

    // Google Sign-In Button
    const googleBtn = document.getElementById('btnGoogleAuth');
    if (googleBtn) {
      googleBtn.addEventListener('click', triggerGoogleFlow);
    }
  }

  /**
   * Set up 6-digit OTP input auto-advance, backspace retreat, and clipboard paste
   */
  function setupOTPInputHandling() {
    otpInputs.forEach((input, index) => {
      // Input event: auto advance
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/\D/g, '');
        e.target.value = val ? val[0] : '';

        if (e.target.value) {
          input.classList.add('filled');
          if (index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
          }
        } else {
          input.classList.remove('filled');
        }

        // Auto submit if all 6 digits entered
        const code = getEnteredOTP();
        if (code.length === 6) {
          const activeView = document.querySelector('.auth-view.active');
          if (activeView && activeView.id === 'viewOTP') {
            handleVerifyOTP(new Event('submit'));
          }
        }
      });

      // Keydown: backspace retreat
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value && index > 0) {
          otpInputs[index - 1].focus();
          otpInputs[index - 1].value = '';
          otpInputs[index - 1].classList.remove('filled');
        }
      });

      // Paste event: split 6 digits
      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const pastedData = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
        if (pastedData) {
          const chars = pastedData.slice(0, 6).split('');
          chars.forEach((char, i) => {
            if (otpInputs[i]) {
              otpInputs[i].value = char;
              otpInputs[i].classList.add('filled');
            }
          });
          const focusIndex = Math.min(chars.length, otpInputs.length - 1);
          otpInputs[focusIndex].focus();

          if (chars.length === 6) {
            const activeView = document.querySelector('.auth-view.active');
            if (activeView && activeView.id === 'viewOTP') {
              handleVerifyOTP(new Event('submit'));
            }
          }
        }
      });
    });
  }

  function getEnteredOTP() {
    return otpInputs.map(input => input.value).join('');
  }

  function clearOTPInputs() {
    otpInputs.forEach(input => {
      input.value = '';
      input.classList.remove('filled');
    });
    if (otpInputs[0]) otpInputs[0].focus();
  }

  /**
   * Password Strength Calculator
   */
  function updatePasswordMeter(password) {
    const bars = document.querySelectorAll('.meter-bar');
    const label = document.getElementById('passwordMeterLabel');
    if (!bars.length || !label) return;

    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    bars.forEach((bar, idx) => {
      bar.className = 'meter-bar';
      if (idx < score) {
        if (score === 1) bar.classList.add('active-weak');
        else if (score === 2) bar.classList.add('active-medium');
        else if (score === 3) bar.classList.add('active-strong');
        else if (score >= 4) bar.classList.add('active-ultra');
      }
    });

    const labels = ['Too Short', 'Weak', 'Fair', 'Strong', 'Ultra Secure 🔥'];
    label.textContent = `Strength: ${labels[score] || 'Too Short'}`;
  }

  /**
   * Alert Banner helper inside Modal
   */
  function showAlert(message, type = 'error') {
    if (!alertBanner) return;
    alertBanner.textContent = message;
    alertBanner.className = `auth-alert ${type}`;
    alertBanner.style.display = 'flex';
  }

  function hideAlert() {
    if (!alertBanner) return;
    alertBanner.style.display = 'none';
    alertBanner.textContent = '';
  }

  /**
   * View Navigation
   */
  function openModal(view = 'login') {
    hideAlert();
    if (modalOverlay) {
      modalOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    switchView(view);
  }

  function closeModal() {
    if (modalOverlay) {
      modalOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
    hideAlert();
    stopCooldownTimer();
  }

  function switchView(viewName) {
    document.querySelectorAll('.auth-view').forEach(v => v.classList.remove('active'));
    hideAlert();

    const target = document.getElementById(`view${capitalize(viewName)}`);
    if (target) {
      target.classList.add('active');
    }

    if (viewName === 'otp') {
      clearOTPInputs();
      startCooldownTimer(60);
    }
  }

  function capitalize(str) {
    return str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  }

  /**
   * OTP Resend Cooldown Timer
   */
  function startCooldownTimer(seconds = 60) {
    stopCooldownTimer();
    state.cooldownSeconds = seconds;
    const resendBtn = document.getElementById('btnResendOTP');
    const timerSpan = document.getElementById('otpTimerSpan');

    if (resendBtn) resendBtn.disabled = true;

    updateTimerDisplay();
    state.cooldownInterval = setInterval(() => {
      state.cooldownSeconds--;
      if (state.cooldownSeconds <= 0) {
        stopCooldownTimer();
        if (resendBtn) resendBtn.disabled = false;
        if (timerSpan) timerSpan.textContent = 'Resend Code';
      } else {
        updateTimerDisplay();
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const timerSpan = document.getElementById('otpTimerSpan');
    if (!timerSpan) return;
    const mins = Math.floor(state.cooldownSeconds / 60);
    const secs = state.cooldownSeconds % 60;
    timerSpan.textContent = `Resend in ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function stopCooldownTimer() {
    if (state.cooldownInterval) {
      clearInterval(state.cooldownInterval);
      state.cooldownInterval = null;
    }
  }

  /**
   * Google Identity Services (GIS) Flow
   */
  function initGoogleIdentity() {
    // If GSI library is loaded, prepare client
    if (window.google && window.google.accounts && window.google.accounts.id) {
      // Can be initialized when Client ID is configured in DOM
      const clientIdMeta = document.querySelector('meta[name="google-signin-client_id"]');
      if (clientIdMeta && clientIdMeta.content && !clientIdMeta.content.startsWith('YOUR_')) {
        window.google.accounts.id.initialize({
          client_id: clientIdMeta.content,
          callback: handleGoogleCredentialResponse
        });
      }
    }
  }

  function triggerGoogleFlow() {
    // Check if Google GSI is available and configured
    const clientIdMeta = document.querySelector('meta[name="google-signin-client_id"]');
    const hasRealKey = clientIdMeta && clientIdMeta.content && !clientIdMeta.content.startsWith('YOUR_');

    if (window.google && window.google.accounts && hasRealKey) {
      window.google.accounts.id.prompt();
    } else {
      // Development / Quick Sign-In fallback
      const devEmail = prompt("Enter Google Email to authenticate (Local Dev Mode):", state.activeEmail || "admin@folioblox.dev");
      if (!devEmail) return;

      const mockToken = `mock_google_token:sub-${Date.now()}:${devEmail.trim()}:Creator`;
      handleGoogleCredentialResponse({ credential: mockToken });
    }
  }

  async function handleGoogleCredentialResponse(response) {
    if (!response || !response.credential) return;

    showAlert('Connecting to Google identity...', 'success');

    // 1. Try 1-Click Login for existing user first
    try {
      const loginRes = await fetch(`${API_BASE}/api/auth/google/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
      });

      if (loginRes.ok) {
        const loginData = await loginRes.json();
        onLoginSuccess(loginData.user);
        return;
      }
    } catch (e) {
      // Proceed to initiate signup
    }

    // 2. Not existing user: Initiate Google Signup + OTP
    try {
      const initRes = await fetch(`${API_BASE}/api/auth/google/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
      });

      const initData = await initRes.json();
      if (!initRes.ok) {
        showAlert(initData.detail || 'Google sign-up failed.');
        return;
      }

      if (initData.status === 'already_registered') {
        showAlert('Account already registered! Please sign in with your password.');
        switchView('login');
        const emailInput = document.getElementById('inputEmail');
        if (emailInput) emailInput.value = initData.email;
        return;
      }

      if (initData.status === 'set_password_required') {
        state.setupToken = initData.setup_token;
        state.activeEmail = initData.email;
        switchView('set-password');
        return;
      }

      if (initData.status === 'otp_required') {
        state.tempToken = initData.temp_token;
        state.activeEmail = initData.email;

        const emailNotice = document.getElementById('otpEmailNotice');
        if (emailNotice) emailNotice.textContent = initData.email;

        showAlert('6-digit verification code sent to your email!', 'success');
        switchView('otp');
      }
    } catch (err) {
      showAlert('Failed to connect to authentication server.');
    }
  }

  /**
   * Verify OTP Handler
   */
  async function handleVerifyOTP(e) {
    if (e && e.preventDefault) e.preventDefault();
    hideAlert();

    const otp = getEnteredOTP();
    if (otp.length !== 6) {
      showAlert('Please enter all 6 digits of the verification code.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/google/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temp_token: state.tempToken,
          otp: otp
        })
      });

      const data = await res.json();
      if (!res.ok) {
        showAlert(data.detail || 'Invalid verification code.');
        return;
      }

      state.setupToken = data.setup_token;
      state.activeEmail = data.email;

      const verifiedEmailBadge = document.getElementById('setupEmailBadge');
      if (verifiedEmailBadge) verifiedEmailBadge.textContent = data.email;

      showAlert('Email verified! Now create your account password.', 'success');
      switchView('set-password');
    } catch (err) {
      showAlert('Server error during OTP verification.');
    }
  }

  /**
   * Set Password Handler
   */
  async function handleSetPassword(e) {
    e.preventDefault();
    hideAlert();

    const password = document.getElementById('inputNewPassword').value;
    const confirm = document.getElementById('inputConfirmPassword').value;

    if (password.length < 6) {
      showAlert('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirm) {
      showAlert('Passwords do not match.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setup_token: state.setupToken,
          password: password
        })
      });

      const data = await res.json();
      if (!res.ok) {
        showAlert(data.detail || 'Failed to save password.');
        return;
      }

      onLoginSuccess(data.user);
    } catch (err) {
      showAlert('Server error saving password.');
    }
  }

  /**
   * Standard Email + Password Login
   */
  async function handleEmailLogin(e) {
    e.preventDefault();
    hideAlert();

    const email = document.getElementById('inputEmail').value.trim();
    const password = document.getElementById('inputPassword').value;

    if (!email || !password) {
      showAlert('Please enter both email and password.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        showAlert(data.detail || 'Invalid email or password.');
        return;
      }

      onLoginSuccess(data.user);
    } catch (err) {
      showAlert('Server error during login.');
    }
  }

  /**
   * Forgot Password Request (Sends OTP)
   */
  async function handleForgotPasswordRequest(e) {
    e.preventDefault();
    hideAlert();

    const email = document.getElementById('inputForgotEmail').value.trim();
    if (!email) {
      showAlert('Please enter your registered email address.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) {
        showAlert(data.detail || 'Could not find an account with that email.');
        return;
      }

      state.resetToken = data.reset_token;
      state.activeEmail = email;

      const resetEmailNotice = document.getElementById('resetEmailNotice');
      if (resetEmailNotice) resetEmailNotice.textContent = email;

      showAlert('Reset code sent! Check your email inbox.', 'success');
      switchView('forgot-password-reset');
    } catch (err) {
      showAlert('Server error requesting password reset.');
    }
  }

  /**
   * Forgot Password Reset (Submits OTP + New Password)
   */
  async function handleForgotPasswordReset(e) {
    e.preventDefault();
    hideAlert();

    const otp = document.getElementById('inputResetOTP').value.trim();
    const newPassword = document.getElementById('inputResetNewPassword').value;

    if (otp.length !== 6) {
      showAlert('Please enter the 6-digit reset code.');
      return;
    }

    if (newPassword.length < 6) {
      showAlert('New password must be at least 6 characters long.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reset_token: state.resetToken,
          otp: otp,
          new_password: newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        showAlert(data.detail || 'Failed to reset password.');
        return;
      }

      showAlert('Password reset successful! You can now log in.', 'success');
      setTimeout(() => {
        switchView('login');
        const emailField = document.getElementById('inputEmail');
        if (emailField) emailField.value = state.activeEmail;
      }, 1500);
    } catch (err) {
      showAlert('Server error during password reset.');
    }
  }

  /**
   * Check Session /api/auth/me
   */
  async function checkSession() {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`);
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          state.currentUser = data.user;
          updateNavigationUI(data.user);
          return;
        }
      }
    } catch (e) {
      console.warn('Session check warning:', e);
    }
    state.currentUser = null;
    updateNavigationUI(null);
  }

  /**
   * Update Navigation Bar with Auth State
   */
  function updateNavigationUI(user) {
    const navAuthContainer = document.getElementById('navAuthContainer');
    const drawerAuthContainer = document.getElementById('drawerAuthContainer');

    const markup = user ? `
      <div class="nav-auth-user" id="btnNavUserMenu" title="Signed in as ${user.name || user.email}">
        <img class="nav-auth-avatar" src="${user.avatarUrl || 'https://lh3.googleusercontent.com/a/default-avatar'}" alt="Avatar" />
        <span class="nav-auth-name">${user.name || user.email.split('@')[0]}</span>
        <a href="/admin" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 12px; background: rgba(0, 240, 255, 0.15); border: 1px solid rgba(0, 240, 255, 0.4); color: #00f0ff; text-decoration: none; font-size: 11px; font-weight: 700; margin-left: 4px;" title="Open Split-Screen CMS">
          CMS
        </a>
        <button type="button" class="btn-resend-otp" id="btnLogoutTrigger" style="margin-left: 6px;" title="Logout">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        </button>
      </div>
    ` : `
      <button type="button" class="btn-touch" data-action="open-auth-modal" style="height: 38px; padding: 0 16px;">
        <span class="btn-icon-circle" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </span>
        <span style="font-size: 13px;">Sign In</span>
      </button>
    `;

    if (navAuthContainer) {
      navAuthContainer.innerHTML = markup;
      attachNavEvents(navAuthContainer);
    }
    if (drawerAuthContainer) {
      drawerAuthContainer.innerHTML = markup;
      attachNavEvents(drawerAuthContainer);
    }
  }

  function attachNavEvents(container) {
    const openBtn = container.querySelector('[data-action="open-auth-modal"]');
    if (openBtn) {
      openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal('login');
      });
    }

    const logoutBtn = container.querySelector('#btnLogoutTrigger');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }
  }

  /**
   * Success Login Callback
   */
  function onLoginSuccess(user) {
    state.currentUser = user;
    updateNavigationUI(user);
    showAlert(`Welcome back, ${user.name || 'Creator'}!`, 'success');
    setTimeout(() => {
      closeModal();
    }, 1000);
  }

  /**
   * Logout Handler
   */
  async function handleLogout(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    try {
      await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST' });
    } catch (e) {
      console.warn('Logout fetch warning:', e);
    }
    state.currentUser = null;
    updateNavigationUI(null);
    closeModal();
  }

  // Export public API to window
  window.FoliobloxAuth = {
    init,
    openModal,
    closeModal,
    checkSession,
    handleLogout,
    getState: () => ({ ...state })
  };

  // Auto initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
