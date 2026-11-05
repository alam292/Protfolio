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

    this.init();
    this.initClipboardCopy();
    this.initServiceChips();
    this.initLiveClock();
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

    // Real-time input validation clear
    const inputs = this.form.querySelectorAll('.form-input, .form-textarea');
    inputs.forEach((input) => {
      input.addEventListener('input', () => {
        input.classList.remove('input-error');
      });
    });
  }

  /**
   * One-click clipboard copy utility for direct email
   */
  initClipboardCopy() {
    const copyBtn = document.getElementById('copyEmailBtn');
    if (!copyBtn) return;

    copyBtn.addEventListener('click', async () => {
      const emailToCopy = copyBtn.getAttribute('data-copy') || 'contact@matloob.dev';
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
        this.showToast(`Email copied to clipboard: ${emailToCopy}`);

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

        if (subjectInput && (!subjectInput.value || subjectInput.value.startsWith('Inquiry: '))) {
          subjectInput.value = `Inquiry: ${serviceName}`;
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

  handleSubmit() {
    const nameInput = document.getElementById('userName');
    const emailInput = document.getElementById('userEmail');
    const subjectInput = document.getElementById('userSubject');
    const messageInput = document.getElementById('userMessage');
    const submitBtn = document.getElementById('contactSubmitBtn') || this.form.querySelector('button[type="submit"]');

    let isValid = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Validate Name
    if (!nameInput || !nameInput.value.trim()) {
      if (nameInput) nameInput.classList.add('input-error');
      this.showToast('Please enter your name.', true);
      isValid = false;
      return;
    }

    // Validate Email
    if (!emailInput || !emailRegex.test(emailInput.value.trim())) {
      if (emailInput) emailInput.classList.add('input-error');
      this.showToast('Please provide a valid email address.', true);
      isValid = false;
      return;
    }

    // Validate Subject
    if (!subjectInput || !subjectInput.value.trim()) {
      if (subjectInput) subjectInput.classList.add('input-error');
      this.showToast('Please enter a project subject or purpose.', true);
      isValid = false;
      return;
    }

    // Validate Message
    if (!messageInput || messageInput.value.trim().length < 8) {
      if (messageInput) messageInput.classList.add('input-error');
      this.showToast('Message must be at least 8 characters long.', true);
      isValid = false;
      return;
    }

    // Submit state animation
    const submitTextEl = submitBtn ? submitBtn.querySelector('.btn-submit-text') : null;
    const originalText = submitTextEl ? submitTextEl.textContent : 'Transmit Message';

    if (submitBtn) {
      submitBtn.disabled = true;
      if (submitTextEl) submitTextEl.textContent = 'Transmitting...';
    }

    setTimeout(() => {
      const senderName = nameInput.value.trim();
      this.showToast(`Thank you, ${senderName}! Your transmission has been dispatched.`);

      this.form.reset();

      // Reset service chips
      const chips = document.querySelectorAll('.service-chip');
      chips.forEach((c, index) => {
        if (index === 0) c.classList.add('active');
        else c.classList.remove('active');
      });
      const serviceInput = document.getElementById('selectedServiceInput');
      if (serviceInput && chips[0]) {
        serviceInput.value = chips[0].getAttribute('data-service') || 'Full Stack Web App';
      }

      if (submitBtn) {
        submitBtn.disabled = false;
        if (submitTextEl) submitTextEl.textContent = originalText;
      }
    }, 750);
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
