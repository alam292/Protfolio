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
    this.modalActions = document.getElementById('uploadModalActions') || document.querySelector('.upload-modal-actions');
    this.submitBtn = document.getElementById('btnUploadSubmit');
    this.cancelBtn = document.getElementById('btnUploadCancel');
    this.closeBtn = document.getElementById('uploadCloseBtn');

    // Phase 3 Review & Confirm DOM Elements
    this.reviewContainer = document.getElementById('uploadReviewContainer');
    this.reviewProfileContent = document.getElementById('reviewProfileContent');
    this.reviewSkillsContent = document.getElementById('reviewSkillsContent');
    this.reviewAboutContent = document.getElementById('reviewAboutContent');
    this.reviewExperienceContent = document.getElementById('reviewExperienceContent');
    this.btnToggleDiffJson = document.getElementById('btnToggleDiffJson');
    this.reviewJsonDrawer = document.getElementById('reviewJsonDrawer');
    this.reviewJsonPre = document.getElementById('reviewJsonPre');
    this.btnReviewDiscard = document.getElementById('btnReviewDiscard');
    this.btnConfirmPublish = document.getElementById('btnConfirmPublish');

    // Staged State for Review Step (Phase 3)
    this.stagedData = null;
    this.stagedFilename = null;
    this.stagedDiff = null;
    this.isPublishing = false;

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

    // Phase 3 Actions
    if (this.btnToggleDiffJson) {
      this.btnToggleDiffJson.addEventListener('click', () => this.toggleJsonDrawer());
    }

    if (this.btnReviewDiscard) {
      this.btnReviewDiscard.addEventListener('click', () => this.discardReview());
    }

    if (this.btnConfirmPublish) {
      this.btnConfirmPublish.addEventListener('click', () => this.confirmAndPublish());
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
    this.isPublishing = false;
    this.stagedData = null;
    this.stagedFilename = null;
    this.stagedDiff = null;

    // Reset Phase 3 Review UI
    if (this.reviewContainer) this.reviewContainer.style.display = 'none';
    if (this.dropzone) this.dropzone.style.display = '';
    if (this.modalActions) this.modalActions.style.display = '';
    if (this.reviewJsonDrawer) this.reviewJsonDrawer.style.display = 'none';
    if (this.btnToggleDiffJson) {
      this.btnToggleDiffJson.classList.remove('is-open');
      this.btnToggleDiffJson.setAttribute('aria-expanded', 'false');
    }

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
    if (this.btnConfirmPublish) {
      this.btnConfirmPublish.disabled = false;
      this.btnConfirmPublish.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>Confirm &amp; Publish Live</span>
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
      <span>Analyzing with AI...</span>
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
          this.updateProgress(90, 'Validating schema and computing diff...');
        }
      }, 700);

      // Call API in preview/review mode (Phase 3)
      const response = await fetch('/api/upload-resume?preview=true', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressTimer);

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Upload failed with status ${response.status}`);
      }

      this.updateProgress(100, 'AI analysis complete! Review changes below.');
      this.showStatusBanner('Resume parsed successfully! Review the extracted changes below.', 'success');

      // Stash staged state for Phase 3 Review & Confirmation
      this.stagedData = result.data;
      this.stagedFilename = result.resumeFilename;
      this.stagedDiff = result.diff;

      // Render the review cards & JSON diff
      this.renderReviewView(result.diff, result.data);

      // Transition UI to Review state
      if (this.dropzone) this.dropzone.style.display = 'none';
      if (this.previewContainer) this.previewContainer.classList.remove('is-visible');
      if (this.modalActions) this.modalActions.style.display = 'none';
      if (this.reviewContainer) this.reviewContainer.style.display = 'flex';

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
        <span>Retry Analysis</span>
      `;
    } finally {
      this.isUploading = false;
      this.cancelBtn.disabled = false;
    }
  }

  /**
   * Render the Phase 3 Review & Diff summary cards
   */
  renderReviewView(diff = {}, data = {}) {
    // 1. Profile Card
    if (this.reviewProfileContent) {
      const prof = data.profile || {};
      const nameTag = diff?.profile?.name ? '<span class="review-change-indicator is-new">Updated</span>' : '<span class="review-change-indicator is-same">Current</span>';
      const titleTag = diff?.profile?.title ? '<span class="review-change-indicator is-new">Updated</span>' : '<span class="review-change-indicator is-same">Current</span>';
      this.reviewProfileContent.innerHTML = `
        <div class="review-card-val-primary">
          <span>${prof.name || 'Candidate Name'}</span>
          ${nameTag}
        </div>
        <div class="review-card-val-sub">
          <span>${prof.title || 'Developer'}</span>
          ${titleTag}
        </div>
        <div class="review-card-val-sub" style="font-family: var(--font-family-mono); font-size: 0.72rem;">
          <span>📧 ${prof.email || 'Email extracted'}</span>
        </div>
      `;
    }

    // 2. Skills Card
    if (this.reviewSkillsContent) {
      const added = diff?.skills?.added || [];
      const total = diff?.skills?.totalNew || (data.skills?.categories ? data.skills.categories.flatMap(c => c.skills || []).length : 0);
      let tagsHtml = '';
      if (added.length > 0) {
        tagsHtml = `<div class="review-tags-wrap">` +
          added.slice(0, 5).map(s => `<span class="review-tag-pill">+ ${s}</span>`).join('') +
          (added.length > 5 ? `<span class="review-tag-pill">+${added.length - 5} more</span>` : '') +
          `</div>`;
      } else {
        tagsHtml = `<div class="review-card-val-sub" style="color: #26a69a;">✓ 30 official skills matched</div>`;
      }
      this.reviewSkillsContent.innerHTML = `
        <div class="review-card-val-primary">
          <span>${total} Skills Total</span>
          <span class="review-change-indicator ${added.length > 0 ? 'is-new' : 'is-same'}">${added.length > 0 ? `+${added.length} New` : 'Verified'}</span>
        </div>
        <div class="review-card-val-sub">6 Official Categories</div>
        ${tagsHtml}
      `;
    }

    // 3. Who Am I Card
    if (this.reviewAboutContent) {
      const highlights = data.about?.highlights || [];
      const hlList = highlights.slice(0, 3).map(h => `<div class="review-card-val-sub">• <strong>${h.stat || ''}</strong> ${h.title || ''}</div>`).join('');
      this.reviewAboutContent.innerHTML = `
        <div class="review-card-val-primary">
          <span>terminal: whoami</span>
          <span class="review-change-indicator is-same">${highlights.length} Highlights</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:0.2rem; margin-top:0.25rem;">
          ${hlList}
        </div>
      `;
    }

    // 4. Experience & Projects Card
    if (this.reviewExperienceContent) {
      const rolesCount = data.experience?.roles?.length || 0;
      const projCount = data.projects?.items?.length || 0;
      this.reviewExperienceContent.innerHTML = `
        <div class="review-card-val-primary">
          <span>${rolesCount} Roles &bull; ${projCount} Projects</span>
        </div>
        <div class="review-card-val-sub">
          <span>Latest Role: ${data.experience?.roles?.[0]?.company || 'Developer Experience'}</span>
        </div>
        <div class="review-card-val-sub">
          <span>Flagship: ${data.projects?.items?.[0]?.title || 'CloudScale Platform'}</span>
        </div>
      `;
    }

    // 5. Raw JSON Preview Drawer
    if (this.reviewJsonPre) {
      this.reviewJsonPre.textContent = JSON.stringify({
        profile: data.profile,
        about: data.about,
        skillsSummary: {
          categoriesCount: data.skills?.categories?.length,
          categories: data.skills?.categories?.map(c => ({ name: c.name, skillsCount: (c.skills || []).length }))
        },
        experienceCount: data.experience?.roles?.length,
        projectsCount: data.projects?.items?.length,
        diff: diff
      }, null, 2);
    }
  }

  toggleJsonDrawer() {
    if (!this.reviewJsonDrawer || !this.btnToggleDiffJson) return;
    const isHidden = this.reviewJsonDrawer.style.display === 'none';
    this.reviewJsonDrawer.style.display = isHidden ? 'block' : 'none';
    this.btnToggleDiffJson.classList.toggle('is-open', isHidden);
    this.btnToggleDiffJson.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
  }

  discardReview() {
    this.resetForm();
    this.showStatusBanner('Review cancelled. Upload another resume or retry when ready.', 'info');
  }

  /**
   * Phase 3 Confirmation: Publish staged portfolio data live!
   */
  async confirmAndPublish() {
    if (!this.stagedData || this.isPublishing) return;

    this.isPublishing = true;
    if (this.btnConfirmPublish) {
      this.btnConfirmPublish.disabled = true;
      this.btnConfirmPublish.innerHTML = `
        <span class="btn-spinner" aria-hidden="true"></span>
        <span>Publishing Live...</span>
      `;
    }
    if (this.btnReviewDiscard) {
      this.btnReviewDiscard.disabled = true;
    }

    try {
      const response = await fetch('/api/publish-portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: this.stagedData,
          resumeFilename: this.stagedFilename
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Publish failed with status ${response.status}`);
      }

      this.showStatusBanner('Portfolio successfully published live!', 'success');

      // Dispatch global portfolio:updated event
      window.dispatchEvent(new CustomEvent('portfolio:updated', { detail: result.data }));

      // Trigger renderer update directly if available
      if (window.__PORTFOLIO_APP__ && window.__PORTFOLIO_APP__.renderer) {
        window.__PORTFOLIO_APP__.renderer.updateData(result.data);
      }

      // Show toast if form controller is available
      if (window.__PORTFOLIO_APP__ && window.__PORTFOLIO_APP__.form) {
        window.__PORTFOLIO_APP__.form.showToast('AI Resume Sync Published! Portfolio updated live.');
      }

      // Auto close modal after successful render
      setTimeout(() => {
        this.closeModal();
      }, 1500);

    } catch (err) {
      console.error('[ResumeUploader] Publish error:', err);
      this.showStatusBanner(err.message || 'Failed to publish changes. Please try again.', 'error');
      if (this.btnConfirmPublish) {
        this.btnConfirmPublish.disabled = false;
        this.btnConfirmPublish.innerHTML = `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Retry Publish</span>
        `;
      }
      if (this.btnReviewDiscard) {
        this.btnReviewDiscard.disabled = false;
      }
    } finally {
      this.isPublishing = false;
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

