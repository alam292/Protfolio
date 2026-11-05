/**
 * Form Controller
 * Contact form validation, submission simulation, and floating toast notification.
 */

class FormController {
  constructor() {
    this.form = document.getElementById('contactForm');
    this.toast = document.getElementById('toastNotification');
    this.toastMessage = document.getElementById('toastMessage');
    this.toastTimeout = null;

    this.init();
  }

  init() {
    if (!this.form) return;

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
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
    const originalText = submitBtn ? submitBtn.querySelector('span:first-child').textContent : 'Send Message';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.querySelector('span:first-child').textContent = 'Sending...';
    }

    setTimeout(() => {
      // Show confirmation toast
      const senderName = nameInput ? nameInput.value.trim() : 'there';
      this.showToast(`Thank you, ${senderName}! Your message has been received.`);

      // Reset form
      this.form.reset();

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.querySelector('span:first-child').textContent = originalText;
      }
    }, 600);
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

