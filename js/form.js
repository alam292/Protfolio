/**
 * Form Controller & Contact Module
 * Handles contact form validation, simulated submission, floating toast notifications,
 * one-click clipboard copy utility for direct email, interactive service chips,
 * and dynamic real-time IST clock for the Location Plan.
 */

class FormController {
  constructor() {
    this.form = document.getElementById('contactForm');
    this.toast = document.getElementById('toastNotification');
    this.toastMessage = document.getElementById('toastMessage');
    this.toastTimeout = null;
    this.clockInterval = null;

    // Dynamic Cloud API Base URL configuration
    const isLocal = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === ''
    );
    this.apiBaseUrl = isLocal ? '' : (window.PORTFOLIO_API_URL || 'https://matloob-portfolio.onrender.com').replace(/\/+$/, '');

    this.init();
    this.initCharCounter();
    this.initClipboardCopy();
    this.initServiceChips();
    this.initLiveClock();

    window.addEventListener('portfolio:rendered', () => {
      this.init();
      this.initClipboardCopy();
      this.initLiveClock();
    });
  }

  init() {
    this.form = document.getElementById('contactForm');
    if (!this.form) return;

    // Remove any previously bound listeners by cloning
    const newForm = this.form.cloneNode(true);
    this.form.parentNode.replaceChild(newForm, this.form);
    this.form = newForm;

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // Real-time input validation clear & focus handling
    const fields = ['name', 'email', 'subject', 'message'];
    fields.forEach((fieldName) => {
      const fieldContainer = this.form.querySelector(`.animated-field[data-field="${fieldName}"]`);
      if (!fieldContainer) return;

      const input = fieldContainer.querySelector('.form-input, .form-textarea');
      if (!input) return;

      input.addEventListener('input', () => {
        this.clearFieldError(fieldName);
      });
    });
  }

  /**
   * Live Character Counter for the Message textarea
   */
  initCharCounter() {
    const messageInput = document.getElementById('userMessage');
    const counterEl = document.getElementById('charCounter');
    if (!messageInput || !counterEl) return;

    const updateCounter = () => {
      const len = messageInput.value.length;
      const max = 1000;
      counterEl.textContent = `${len} / ${max}`;

      if (len >= 950) {
        counterEl.className = 'char-counter limit-max';
      } else if (len >= 800) {
        counterEl.className = 'char-counter limit-near';
      } else {
        counterEl.className = 'char-counter';
      }
    };

    messageInput.addEventListener('input', updateCounter);
    updateCounter();
  }

  showFieldError(fieldName, message) {
    const fieldContainer = document.querySelector(`.animated-field[data-field="${fieldName}"]`);
    if (!fieldContainer) return;

    fieldContainer.classList.remove('has-error');
    // Trigger reflow for shake animation
    void fieldContainer.offsetWidth;
    fieldContainer.classList.add('has-error');

    const input = fieldContainer.querySelector('.form-input, .form-textarea');
    if (input) input.classList.add('input-error');

    const errorMsgEl = document.getElementById(`${fieldName}ErrorMsg`);
    if (errorMsgEl) {
      errorMsgEl.textContent = message;
      errorMsgEl.classList.add('visible');
    }
  }

  clearFieldError(fieldName) {
    const fieldContainer = document.querySelector(`.animated-field[data-field="${fieldName}"]`);
    if (!fieldContainer) return;

    fieldContainer.classList.remove('has-error');
    const input = fieldContainer.querySelector('.form-input, .form-textarea');
    if (input) input.classList.remove('input-error');

    const errorMsgEl = document.getElementById(`${fieldName}ErrorMsg`);
    if (errorMsgEl) {
      errorMsgEl.textContent = '';
      errorMsgEl.classList.remove('visible');
    }
  }

  /**
   * One-click clipboard copy utility for direct email
   */
  initClipboardCopy() {
    const copyBtn = document.getElementById('copyEmailBtn');
    if (!copyBtn) return;

    copyBtn.addEventListener('click', async () => {
      const emailToCopy = copyBtn.getAttribute('data-copy') || 'mdmatloobgaya@gmail.com';
      const copyTextEl = copyBtn.querySelector('.copy-text');
      const originalText = copyTextEl ? copyTextEl.textContent : 'Copy';

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(emailToCopy);
        } else {
          const tempInput = document.createElement('input');
          tempInput.value = emailToCopy;
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          document.body.removeChild(tempInput);
        }

        copyBtn.classList.add('copied');
        if (copyTextEl) copyTextEl.textContent = 'Copied!';
        this.showToast(`Email copied: ${emailToCopy}`);

        setTimeout(() => {
          copyBtn.classList.remove('copied');
          if (copyTextEl) copyTextEl.textContent = originalText;
        }, 2200);
      } catch (err) {
        this.showToast(`Email: ${emailToCopy}`);
      }
    });
  }

  /**
   * Interactive service filter chips that synchronize with hidden input & subject field
   */
  initServiceChips() {
    const chips = document.querySelectorAll('.service-chip');
    const serviceInput = document.getElementById('selectedServiceInput');
    const subjectInput = document.getElementById('userSubject');

    if (chips.length === 0) return;

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');

        const serviceName = chip.getAttribute('data-service') || chip.textContent.trim();
        if (serviceInput) {
          serviceInput.value = serviceName;
        }

        if (subjectInput && (!subjectInput.value || subjectInput.value.startsWith('Scope: ') || subjectInput.value.startsWith('Inquiry: '))) {
          subjectInput.value = `Scope: ${serviceName}`;
          this.clearFieldError('subject');
        }
      });
    });
  }

  /**
   * Real-time ticking clock for Location Plan (Indian Standard Time - Asia/Kolkata)
   */
  initLiveClock() {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }

    const clockEl = document.getElementById('liveLocalClock');
    if (!clockEl) return;

    const updateClock = () => {
      try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
        clockEl.textContent = `${formatter.format(now)} IST`;
      } catch (e) {
        const now = new Date();
        clockEl.textContent = `${now.toLocaleTimeString()} IST`;
      }
    };

    updateClock();
    this.clockInterval = setInterval(updateClock, 1000);
  }

  async handleSubmit() {
    const nameInput = document.getElementById('userName');
    const emailInput = document.getElementById('userEmail');
    const subjectInput = document.getElementById('userSubject');
    const messageInput = document.getElementById('userMessage');
    const serviceInput = document.getElementById('selectedServiceInput');
    const submitBtn = document.getElementById('contactSubmitBtn');
    const submitTextEl = document.getElementById('submitBtnText');

    let isValid = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Validate Name
    if (!nameInput || !nameInput.value.trim()) {
      this.showFieldError('name', 'Please enter your full name.');
      isValid = false;
    } else {
      this.clearFieldError('name');
    }

    // Validate Email
    if (!emailInput || !emailRegex.test(emailInput.value.trim())) {
      this.showFieldError('email', 'Please enter a valid email address.');
      isValid = false;
    } else {
      this.clearFieldError('email');
    }

    // Validate Subject
    if (!subjectInput || !subjectInput.value.trim()) {
      this.showFieldError('subject', 'Please specify a project scope or subject.');
      isValid = false;
    } else {
      this.clearFieldError('subject');
    }

    // Validate Message
    if (!messageInput || messageInput.value.trim().length < 8) {
      this.showFieldError('message', 'Message details must be at least 8 characters.');
      isValid = false;
    } else {
      this.clearFieldError('message');
    }

    if (!isValid) {
      this.showToast('Please complete all required fields.', true);
      return;
    }

    const payload = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      subject: subjectInput.value.trim(),
      message: messageInput.value.trim(),
      serviceType: serviceInput ? serviceInput.value.trim() : 'General Inquiry'
    };

    // Begin Submission Animation
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.remove('success');
      submitBtn.classList.add('submitting');
      if (submitTextEl) submitTextEl.textContent = 'Transmitting...';
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok && result.success) {
        if (submitBtn) {
          submitBtn.classList.remove('submitting');
          submitBtn.classList.add('success');
          if (submitTextEl) submitTextEl.textContent = 'Transmission Dispatched!';
        }

        this.showToast(result.message || `Thank you, ${payload.name}! Your transmission has been dispatched.`);

        // Reset form after short pause
        setTimeout(() => {
          this.form.reset();

          // Reset service chips
          const chips = document.querySelectorAll('.service-chip');
          chips.forEach((c, index) => {
            if (index === 0) c.classList.add('active');
            else c.classList.remove('active');
          });
          if (serviceInput && chips[0]) {
            serviceInput.value = chips[0].getAttribute('data-service') || 'Full-Stack Web App';
          }

          // Reset character counter
          const counterEl = document.getElementById('charCounter');
          if (counterEl) {
            counterEl.textContent = '0 / 1000';
            counterEl.className = 'char-counter';
          }

          // Reset submit button state
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('success');
            if (submitTextEl) submitTextEl.textContent = 'Transmit Message';
          }
        }, 2500);
      } else {
        throw new Error(result.error || 'Transmission failed. Server returned error.');
      }
    } catch (err) {
      console.error('[Contact Form Transmission Error]', err);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('submitting');
        if (submitTextEl) submitTextEl.textContent = 'Transmit Message';
      }
      this.showToast(err.message || 'Transmission failed. Please try again or email directly.', true);
    }
  }


  showToast(message, isError = false) {
    if (!this.toast) {
      this.toast = document.getElementById('toastNotification');
      this.toastMessage = document.getElementById('toastMessage');
    }
    if (!this.toast) return;

    if (this.toastMessage) {
      this.toastMessage.textContent = message;
    }

    if (isError) {
      this.toast.style.borderColor = 'rgba(239, 68, 68, 0.6)';
    } else {
      this.toast.style.borderColor = 'rgba(0, 230, 118, 0.5)';
    }

    this.toast.classList.add('active');

    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    this.toastTimeout = setTimeout(() => {
      this.toast.classList.remove('active');
    }, 4500);
  }
}

window.FormController = FormController;
