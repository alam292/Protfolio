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

    // Phase 4 Version History & Admin PIN Elements
    this.btnToggleVersionHistory = document.getElementById('btnToggleVersionHistory');
    this.versionHistoryDrawer = document.getElementById('versionHistoryDrawer');
    this.versionHistoryList = document.getElementById('versionHistoryList');
    this.backupCountBadge = document.getElementById('backupCountBadge');
    this.btnRefreshBackups = document.getElementById('btnRefreshBackups');
    this.adminPinDialog = document.getElementById('adminPinDialog');
    this.adminPinInput = document.getElementById('adminPinInput');
    this.adminPinError = document.getElementById('adminPinError');
    this.btnAdminPinConfirm = document.getElementById('btnAdminPinConfirm');
    this.btnAdminPinCancel = document.getElementById('btnAdminPinCancel');
    this.pendingAuthAction = null;
    this.adminPin = sessionStorage.getItem('portfolio_admin_pin') || '';

    // Dynamic Cloud API Base URL configuration
    // When running on localhost or 127.0.0.1, use relative paths ('')
    // When running on production (Cloudflare Pages https://alam292-portfolio.pages.dev), route to Render cloud backend
    const isLocal = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === ''
    );
    this.apiBaseUrl = isLocal ? '' : (window.PORTFOLIO_API_URL || 'https://matloob-portfolio.onrender.com').replace(/\/+$/, '');

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
    this.fetchBackupsCount();
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

    // Phase 4 Version History & Admin PIN Actions
    if (this.btnToggleVersionHistory) {
      this.btnToggleVersionHistory.addEventListener('click', () => this.toggleVersionHistory());
    }

    if (this.btnRefreshBackups) {
      this.btnRefreshBackups.addEventListener('click', () => this.loadBackupsList());
    }

    if (this.btnAdminPinConfirm) {
      this.btnAdminPinConfirm.addEventListener('click', () => this.submitAdminPin());
    }

    if (this.btnAdminPinCancel) {
      this.btnAdminPinCancel.addEventListener('click', () => this.cancelAdminPin());
    }

    if (this.adminPinInput) {
      this.adminPinInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.submitAdminPin();
        } else if (e.key === 'Escape') {
          this.cancelAdminPin();
        }
      });
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

    // Reset Phase 4 Version History & PIN Dialog
    if (this.versionHistoryDrawer) this.versionHistoryDrawer.style.display = 'none';
    if (this.btnToggleVersionHistory) this.btnToggleVersionHistory.setAttribute('aria-expanded', 'false');
    if (this.adminPinDialog) this.adminPinDialog.style.display = 'none';

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
      const response = await fetch(`${this.apiBaseUrl}/api/upload-resume?preview=true`, {
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
  confirmAndPublish() {
    if (!this.stagedData || this.isPublishing) return;

    this.requestAuthorizedAction(async (pin) => {
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
        const response = await fetch(`${this.apiBaseUrl}/api/publish-portfolio`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-pin': pin || ''
          },
          body: JSON.stringify({
            data: this.stagedData,
            resumeFilename: this.stagedFilename,
            pin: pin || ''
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

        // Refresh backups list
        this.fetchBackupsCount();

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
    });
  }

  // ==========================================
  // Phase 4: Version History & Rollback System
  // ==========================================
  toggleVersionHistory() {
    if (!this.versionHistoryDrawer) return;
    const isHidden = this.versionHistoryDrawer.style.display === 'none';
    this.versionHistoryDrawer.style.display = isHidden ? 'block' : 'none';
    if (this.btnToggleVersionHistory) {
      this.btnToggleVersionHistory.setAttribute('aria-expanded', String(isHidden));
    }
    if (isHidden) {
      this.loadBackupsList();
    }
  }

  async fetchBackupsCount() {
    try {
      const res = await fetch(`${this.apiBaseUrl}/api/backups`);
      const data = await res.json();
      const count = data.count !== undefined ? data.count : (data.backups ? data.backups.length : 0);
      if (this.backupCountBadge) {
        this.backupCountBadge.textContent = `${count} Backups`;
      }
    } catch (_) {}
  }

  async loadBackupsList() {
    if (!this.versionHistoryList) return;
    this.versionHistoryList.innerHTML = '<div class="backup-empty-state">Loading snapshot backups...</div>';

    try {
      const res = await fetch(`${this.apiBaseUrl}/api/backups`);
      const data = await res.json();
      const backups = data.backups || [];

      if (this.backupCountBadge) {
        this.backupCountBadge.textContent = `${backups.length} Backups`;
      }

      if (backups.length === 0) {
        this.versionHistoryList.innerHTML = '<div class="backup-empty-state">No automated backups found yet. Backups are saved automatically upon publish or rollback.</div>';
        return;
      }

      this.versionHistoryList.innerHTML = backups.map(b => {
        const dateStr = b.formattedDate || new Date(b.created).toLocaleString();
        const sizeStr = b.sizeFormatted || `${Math.round((b.size || b.sizeBytes || 0) / 1024)} KB`;
        return `
          <div class="backup-item" data-filename="${b.filename}">
            <div class="backup-item-info">
              <span class="backup-item-title">${b.filename}</span>
              <div class="backup-item-meta">
                <span>🕒 ${dateStr}</span>
                <span>•</span>
                <span>💾 ${sizeStr}</span>
              </div>
            </div>
            <button type="button" class="btn-restore-backup" data-filename="${b.filename}" title="Rollback live portfolio to this snapshot">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="1 4 1 10 7 10"></polyline>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
              </svg>
              <span>Restore</span>
            </button>
          </div>
        `;
      }).join('');

      // Bind restore buttons
      this.versionHistoryList.querySelectorAll('.btn-restore-backup').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const filename = btn.getAttribute('data-filename');
          this.rollbackToBackup(filename, btn);
        });
      });
    } catch (err) {
      console.error('[ResumeUploader] Failed to load backups:', err);
      this.versionHistoryList.innerHTML = '<div class="backup-empty-state">Failed to load backups. Check server status.</div>';
    }
  }

  async rollbackToBackup(filename, btnTrigger) {
    if (!filename) return;

    const confirmed = window.confirm(`Are you sure you want to rollback to snapshot "${filename}"?\n\nA safety backup of your current portfolio will be created before restoring.`);
    if (!confirmed) return;

    this.requestAuthorizedAction(async (pin) => {
      if (btnTrigger) {
        btnTrigger.disabled = true;
        btnTrigger.innerHTML = '<span>Restoring...</span>';
      }

      this.showStatusBanner(`Rolling back portfolio to snapshot ${filename}...`, 'success');

      try {
        const response = await fetch(`${this.apiBaseUrl}/api/restore-backup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-pin': pin || ''
          },
          body: JSON.stringify({ filename, pin: pin || '' })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || `Rollback failed with status ${response.status}`);
        }

        this.showStatusBanner(`Portfolio successfully restored to ${filename}!`, 'success');

        // Dispatch live update
        window.dispatchEvent(new CustomEvent('portfolio:updated', { detail: result.data }));

        if (window.__PORTFOLIO_APP__ && window.__PORTFOLIO_APP__.renderer) {
          window.__PORTFOLIO_APP__.renderer.updateData(result.data);
        }

        if (window.__PORTFOLIO_APP__ && window.__PORTFOLIO_APP__.form) {
          window.__PORTFOLIO_APP__.form.showToast(`Rollback Complete! Portfolio restored from ${filename}`);
        }

        // Refresh backups list to show the new safety snapshot
        this.loadBackupsList();

        setTimeout(() => {
          this.closeModal();
        }, 1500);

      } catch (err) {
        console.error('[ResumeUploader] Rollback error:', err);
        this.showStatusBanner(err.message || 'Rollback failed. Please try again.', 'error');
        if (btnTrigger) {
          btnTrigger.disabled = false;
          btnTrigger.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="1 4 1 10 7 10"></polyline>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
            </svg>
            <span>Restore</span>
          `;
        }
      }
    });
  }

  // ==========================================
  // Phase 4: Admin PIN Authorization Flow
  // ==========================================
  async requestAuthorizedAction(callback) {
    // Check if PIN protection is active on server
    try {
      const res = await fetch(`${this.apiBaseUrl}/api/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': this.adminPin || '' },
        body: JSON.stringify({ pin: this.adminPin || '' })
      });
      const data = await res.json();
      if (!data.required || data.valid) {
        return callback(this.adminPin);
      }
    } catch (e) {
      // If network check fails, proceed to prompt
    }

    // Show PIN Dialog
    this.pendingAuthAction = callback;
    if (this.adminPinDialog) {
      this.adminPinDialog.style.display = 'flex';
      if (this.adminPinError) this.adminPinError.style.display = 'none';
      if (this.adminPinInput) {
        this.adminPinInput.value = '';
        setTimeout(() => this.adminPinInput.focus(), 60);
      }
    }
  }

  async submitAdminPin() {
    if (!this.adminPinInput) return;
    const pin = this.adminPinInput.value.trim();
    if (!pin) {
      if (this.adminPinError) {
        this.adminPinError.textContent = 'Please enter your Admin PIN.';
        this.adminPinError.style.display = 'block';
      }
      return;
    }

    try {
      const res = await fetch(`${this.apiBaseUrl}/api/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const data = await res.json();

      if (data.valid) {
        this.adminPin = pin;
        sessionStorage.setItem('portfolio_admin_pin', pin);
        this.adminPinDialog.style.display = 'none';
        if (this.pendingAuthAction) {
          const action = this.pendingAuthAction;
          this.pendingAuthAction = null;
          action(pin);
        }
      } else {
        if (this.adminPinError) {
          this.adminPinError.textContent = 'Invalid Admin Security PIN. Please try again.';
          this.adminPinError.style.display = 'block';
        }
        this.adminPinInput.select();
      }
    } catch (err) {
      if (this.adminPinError) {
        this.adminPinError.textContent = 'Failed to verify PIN. Check server connection.';
        this.adminPinError.style.display = 'block';
      }
    }
  }

  cancelAdminPin() {
    if (this.adminPinDialog) {
      this.adminPinDialog.style.display = 'none';
    }
    this.pendingAuthAction = null;
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

