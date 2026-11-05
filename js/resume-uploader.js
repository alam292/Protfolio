/**
 * Resume Uploader & AI Sync Controller (js/resume-uploader.js)
 * Manages drag-and-drop modal UI, file validation, asynchronous upload
 * with live progress indicator, and triggers live DOM re-render upon completion.
 */

class ResumeUploader {
  constructor() {
    this.selectedFile = null;
    this.isUploading = false;

    // DOM Elements
    this.modal = document.getElementById('resumeUploadModal');
    this.dropzone = document.getElementById('uploadDropzone');
    this.fileInput = document.getElementById('resumeFileInput');
    this.previewContainer = document.getElementById('uploadFilePreview');
    this.fileNameEl = document.getElementById('uploadFileName');
    this.fileSizeEl = document.getElementById('uploadFileSize');
    this.fileRemoveBtn = document.getElementById('uploadFileRemove');
    this.progressContainer = document.getElementById('uploadProgressContainer');
    this.progressBarFill = document.getElementById('uploadProgressBarFill');
    this.progressStatusEl = document.getElementById('uploadProgressStatus');
    this.progressPercentEl = document.getElementById('uploadProgressPercent');
    this.statusBanner = document.getElementById('uploadStatusBanner');
    this.submitBtn = document.getElementById('btnUploadSubmit');
    this.cancelBtn = document.getElementById('btnUploadCancel');
    this.closeBtn = document.getElementById('uploadCloseBtn');

    this.init();
  }

  init() {
    if (!this.modal) return;

    this.bindTriggers();
    this.bindDragDrop();
    this.bindFileInput();
    this.bindActions();
    this.bindKeyboard();
  }

  // Bind all buttons that open the modal
  bindTriggers() {
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-action="open-resume-modal"], .btn-open-resume-modal');
      if (trigger) {
        e.preventDefault();
        this.openModal();
      }
    });
  }

  openModal() {
    this.resetForm();
    this.modal.classList.add('is-active');
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    if (this.isUploading) return;
    this.modal.classList.remove('is-active');
    document.body.style.overflow = '';
  }

  bindKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('is-active') && !this.isUploading) {
        this.closeModal();
      }
    });

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal && !this.isUploading) {
        this.closeModal();
      }
    });
  }

  bindDragDrop() {
    if (!this.dropzone) return;

    ['dragenter', 'dragover'].forEach(eventName => {
      this.dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropzone.classList.add('is-dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      this.dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropzone.classList.remove('is-dragover');
      });
    });

    this.dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        this.handleFileSelection(files[0]);
      }
    });
  }

  bindFileInput() {
    if (!this.fileInput) return;

    this.fileInput.addEventListener('change', (e) => {
      if (this.fileInput.files && this.fileInput.files.length > 0) {
        this.handleFileSelection(this.fileInput.files[0]);
      }
    });

    if (this.fileRemoveBtn) {
      this.fileRemoveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.resetFileSelection();
      });
    }
  }

  bindActions() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.closeModal());
    }

    if (this.cancelBtn) {
      this.cancelBtn.addEventListener('click', () => this.closeModal());
    }

    if (this.submitBtn) {
      this.submitBtn.addEventListener('click', () => this.uploadResume());
    }
  }

  handleFileSelection(file) {
    this.hideStatusBanner();

    // Validate extension
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    const validExtensions = ['.pdf', '.docx', '.doc'];
    if (!validExtensions.includes(ext)) {
      this.showStatusBanner('Please upload a valid PDF (.pdf) or Word (.docx) document.', 'error');
      return;
    }

    // Validate size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      this.showStatusBanner('File exceeds 10MB limit. Please upload a smaller document.', 'error');
      return;
    }

    this.selectedFile = file;

    // Update Preview UI
    if (this.fileNameEl) this.fileNameEl.textContent = file.name;
    if (this.fileSizeEl) this.fileSizeEl.textContent = this.formatFileSize(file.size);
    if (this.previewContainer) this.previewContainer.classList.add('is-visible');
    if (this.submitBtn) this.submitBtn.disabled = false;
  }

  resetFileSelection() {
    this.selectedFile = null;
    if (this.fileInput) this.fileInput.value = '';
    if (this.previewContainer) this.previewContainer.classList.remove('is-visible');
    if (this.submitBtn) this.submitBtn.disabled = true;
    this.hideStatusBanner();
  }

  resetForm() {
    this.resetFileSelection();
    this.isUploading = false;
    if (this.progressContainer) this.progressContainer.classList.remove('is-visible');
    if (this.progressBarFill) this.progressBarFill.style.width = '0%';
    if (this.progressPercentEl) this.progressPercentEl.textContent = '0%';
    if (this.submitBtn) {
      this.submitBtn.disabled = true;
      this.submitBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <span>Analyze &amp; Sync Portfolio</span>
      `;
    }
  }

  async uploadResume() {
    if (!this.selectedFile || this.isUploading) return;

    this.isUploading = true;
    this.submitBtn.disabled = true;
    this.cancelBtn.disabled = true;
    this.submitBtn.innerHTML = `
      <span class="btn-spinner" aria-hidden="true"></span>
      <span>Processing...</span>
    `;

    this.progressContainer.classList.add('is-visible');
    this.updateProgress(20, 'Uploading resume document...');

    const formData = new FormData();
    formData.append('resume', this.selectedFile);

    try {
      // Simulate stepped progress during backend AI processing
      const progressTimer = setInterval(() => {
        const current = parseInt(this.progressBarFill.style.width || '20', 10);
        if (current < 45) {
          this.updateProgress(45, 'Extracting text and metadata...');
        } else if (current < 75) {
          this.updateProgress(75, 'Transforming with Google Gemini AI...');
        } else if (current < 90) {
          this.updateProgress(90, 'Validating schema and persisting...');
        }
      }, 700);

      const response = await fetch('/api/upload-resume', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressTimer);

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Upload failed with status ${response.status}`);
      }

      this.updateProgress(100, 'Portfolio successfully updated!');
      this.showStatusBanner('Resume processed & portfolio updated live!', 'success');

      // Dispatch global portfolio:updated event
      window.dispatchEvent(new CustomEvent('portfolio:updated', { detail: result.data }));

      // Trigger renderer update directly if available
      if (window.__PORTFOLIO_APP__ && window.__PORTFOLIO_APP__.renderer) {
        window.__PORTFOLIO_APP__.renderer.updateData(result.data);
      }

      // Show toast if form controller is available
      if (window.__PORTFOLIO_APP__ && window.__PORTFOLIO_APP__.form) {
        window.__PORTFOLIO_APP__.form.showToast('AI Resume Sync complete! Portfolio updated live.');
      }

      // Auto close modal after successful render
      setTimeout(() => {
        this.closeModal();
      }, 1600);

    } catch (err) {
      console.error('[ResumeUploader] Upload error:', err);
      this.showStatusBanner(err.message || 'Failed to process resume. Please try again.', 'error');
      this.updateProgress(0, 'Failed');
      this.submitBtn.disabled = false;
      this.cancelBtn.disabled = false;
      this.submitBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <span>Retry Sync</span>
      `;
    } finally {
      this.isUploading = false;
      this.cancelBtn.disabled = false;
    }
  }

  updateProgress(percent, statusText) {
    if (this.progressBarFill) this.progressBarFill.style.width = `${percent}%`;
    if (this.progressPercentEl) this.progressPercentEl.textContent = `${percent}%`;
    if (this.progressStatusEl) this.progressStatusEl.textContent = statusText;
  }

  showStatusBanner(message, type = 'success') {
    if (!this.statusBanner) return;
    this.statusBanner.className = `upload-status-banner is-visible is-${type}`;
    this.statusBanner.innerHTML = `
      <span class="status-banner-icon" aria-hidden="true">
        ${type === 'success' 
          ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>'
          : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'}
      </span>
      <span>${message}</span>
    `;
  }

  hideStatusBanner() {
    if (!this.statusBanner) return;
    this.statusBanner.className = 'upload-status-banner';
    this.statusBanner.innerHTML = '';
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

window.ResumeUploader = ResumeUploader;

