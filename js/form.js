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

    this.init();
    this.initClipboardCopy();
    this.initServiceChips();
    this.initLiveClock();
  }

  init() {
    if (!this.form) return;

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
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
      const originalText = copyTextEl ? copyTextEl.textContent : 'Copy Email';

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(emailToCopy);
        } else {
          // Fallback execCommand
          const tempInput = document.createElement('input');
          tempInput.value = emailToCopy;
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          document.body.removeChild(tempInput);
        }

        // Visual feedback on button
        copyBtn.classList.add('copied');
        if (copyTextEl) copyTextEl.textContent = 'Copied!';

        this.showToast(`Email copied: ${emailToCopy}`);

        setTimeout(() => {
          copyBtn.classList.remove('copied');
          if (copyTextEl) copyTextEl.textContent = originalText;
        }, 2200);
      } catch (err) {
        this.showToast(`Email address: ${emailToCopy}`);
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

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        const serviceName = chip.getAttribute('data-service');
        if (serviceInput && serviceName) {
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
        clockEl.textContent = formatter.format(now);
      } catch (e) {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString();
      }
    };

    updateClock();
    setInterval(updateClock, 1000);
  }

  handleSubmit() {
    const nameInput = document.getElementById('userName');
    const emailInput = document.getElementById('userEmail');
    const subjectInput = document.getElementById('userSubject');
    const messageInput = document.getElementById('userMessage');
    const submitBtn = this.form.querySelector('button[type="submit"]');

    if (!this.form.checkValidity()) {
      this.form.reportValidity();
      return;
    }

    // Interactive button loading state
    const submitTextEl = submitBtn ? submitBtn.querySelector('.btn-submit-text') || submitBtn.querySelector('span:first-child') : null;
    const originalText = submitTextEl ? submitTextEl.textContent : 'Send Message';

    if (submitBtn) {
      submitBtn.disabled = true;
      if (submitTextEl) submitTextEl.textContent = 'Transmitting...';
    }

    setTimeout(() => {
      const senderName = nameInput ? nameInput.value.trim() : 'there';
      this.showToast(`Thank you, ${senderName}! Your message has been received.`);

      // Reset form
      this.form.reset();

      // Reset service chips to default
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
    }, 700);
  }

  showToast(message) {
    if (!this.toast) return;

    if (this.toastMessage) {
      this.toastMessage.textContent = message;
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
