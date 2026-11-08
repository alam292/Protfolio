/**
 * Folioblox CMS Split-Screen Dashboard Controller (js/dashboard.js)
 * Coordinates live form editing, real-time iframe preview synchronization,
 * dirty state tracking, and cloud publishing.
 */

(function () {
  'use strict';

  let currentPortfolio = null;
  let isDirty = false;

  // DOM Elements
  const previewIframe = document.getElementById('previewIframe');
  const dirtyBadge = document.getElementById('dirtyBadge');
  const btnPublishLive = document.getElementById('btnPublishLive');
  const dashboardUserBadge = document.getElementById('dashboardUserBadge');

  async function init() {
    await checkAuth();
    setupTabs();
    setupViewportSwitcher();
    await loadPortfolioData();
    bindFormInputs();
    bindPublishAction();
  }

  /**
   * Check Auth Guard
   */
  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (!data.authenticated || !data.user) {
        window.location.href = '/?login=required';
        return;
      }
      renderUserBadge(data.user);
    } catch (err) {
      window.location.href = '/?login=required';
    }
  }

  function renderUserBadge(user) {
    if (!dashboardUserBadge) return;
    dashboardUserBadge.innerHTML = `
      <img src="${user.avatarUrl || 'https://lh3.googleusercontent.com/a/default-avatar'}" 
           style="width: 28px; height: 28px; border-radius: 50%; border: 1px solid #00f0ff;" />
      <span style="font-size: 12px; font-weight: 600; color: #e2e8f0;">${user.name || user.email}</span>
    `;
  }

  /**
   * Tab Switching Logic
   */
  function setupTabs() {
    const tabBtns = document.querySelectorAll('.editor-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.editor-tab-content').forEach(c => c.style.display = 'none');
        const targetId = btn.getAttribute('data-tab');
        const targetContent = document.getElementById(targetId);
        if (targetContent) targetContent.style.display = 'block';
      });
    });
  }

  /**
   * Viewport Switcher (Desktop / Tablet / Mobile)
   */
  function setupViewportSwitcher() {
    const btns = document.querySelectorAll('.viewport-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const width = btn.getAttribute('data-width');
        if (previewIframe) {
          previewIframe.style.width = width;
        }
      });
    });
  }

  /**
   * Fetch Live Portfolio Data
   */
  async function loadPortfolioData() {
    try {
      const res = await fetch('/api/portfolio');
      currentPortfolio = await res.json();
      populateFormFields(currentPortfolio);
    } catch (err) {
      console.error('Failed to load portfolio data:', err);
    }
  }

  function populateFormFields(data) {
    if (!data) return;

    // Profile
    const profile = data.profile || {};
    setVal('fieldProfileName', profile.name);
    setVal('fieldProfileTitle', profile.title);
    setVal('fieldProfileSubtitle', profile.subtitle);
    setVal('fieldProfileBio', profile.bio);
    setVal('fieldProfileLocation', profile.location);
    setVal('fieldProfileEmail', profile.email);

    // Socials
    const socials = profile.socials || {};
    setVal('fieldSocialGithub', socials.github);
    setVal('fieldSocialLinkedin', socials.linkedin);

    // Skills
    const skillsList = [];
    if (Array.isArray(data.skills)) {
      data.skills.forEach(category => {
        if (category && Array.isArray(category.items)) {
          skillsList.push(...category.items);
        }
      });
    }
    setVal('fieldSkillsRaw', skillsList.join(', '));

    // Projects
    if (Array.isArray(data.projects)) {
      setVal('fieldProjectsJson', JSON.stringify(data.projects, null, 2));
    }
  }

  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  }

  /**
   * Bind Form Inputs for Real-Time Sync
   */
  function bindFormInputs() {
    const inputs = document.querySelectorAll('.editor-input, .editor-textarea');
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        markDirty();
        syncFormDataToMemory();
        sendLivePreviewMessage();
      });
    });
  }

  function markDirty() {
    if (!isDirty) {
      isDirty = true;
      if (dirtyBadge) dirtyBadge.classList.add('active');
    }
  }

  function markClean() {
    isDirty = false;
    if (dirtyBadge) dirtyBadge.classList.remove('active');
  }

  function syncFormDataToMemory() {
    if (!currentPortfolio) currentPortfolio = {};
    if (!currentPortfolio.profile) currentPortfolio.profile = {};
    if (!currentPortfolio.profile.socials) currentPortfolio.profile.socials = {};

    currentPortfolio.profile.name = getVal('fieldProfileName');
    currentPortfolio.profile.title = getVal('fieldProfileTitle');
    currentPortfolio.profile.subtitle = getVal('fieldProfileSubtitle');
    currentPortfolio.profile.bio = getVal('fieldProfileBio');
    currentPortfolio.profile.location = getVal('fieldProfileLocation');
    currentPortfolio.profile.email = getVal('fieldProfileEmail');

    currentPortfolio.profile.socials.github = getVal('fieldSocialGithub');
    currentPortfolio.profile.socials.linkedin = getVal('fieldSocialLinkedin');
  }

  function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function sendLivePreviewMessage() {
    if (previewIframe && previewIframe.contentWindow) {
      previewIframe.contentWindow.postMessage({
        type: 'PORTFOLIO_LIVE_SYNC',
        payload: currentPortfolio
      }, '*');
    }
  }

  /**
   * Publish Live Action
   */
  function bindPublishAction() {
    if (!btnPublishLive) return;

    btnPublishLive.addEventListener('click', async () => {
      syncFormDataToMemory();
      const originalText = btnPublishLive.innerHTML;
      btnPublishLive.disabled = true;
      btnPublishLive.innerHTML = `<span>Publishing...</span>`;

      try {
        const res = await fetch('/api/publish-portfolio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: currentPortfolio })
        });

        const result = await res.json();
        if (res.ok && result.success) {
          markClean();
          btnPublishLive.innerHTML = `<span>✅ Published!</span>`;
          setTimeout(() => {
            btnPublishLive.innerHTML = originalText;
            btnPublishLive.disabled = false;
          }, 2000);
          sendLivePreviewMessage();
        } else {
          alert('Publish failed: ' + (result.error || 'Server error'));
          btnPublishLive.innerHTML = originalText;
          btnPublishLive.disabled = false;
        }
      } catch (err) {
        alert('Failed to publish: ' + err.message);
        btnPublishLive.innerHTML = originalText;
        btnPublishLive.disabled = false;
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

