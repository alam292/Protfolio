/**
 * Folioblox Application Entry Point
 * Orchestrates modules and kicks off execution when DOM is ready.
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // 1. Initialize Canvas Frame Animation
  const canvasStream = new CanvasStream({
    totalFrames: 300,
    frameDir: 'ezgif-8638738b594a7204-jpg',
    canvasId: 'canvas',
    containerId: 'canvas-container'
  });

  // 2. Initialize Navigation (Sticky header, Mobile Drawer, ScrollSpy)
  const navigation = new NavigationController();

  // 3. Initialize GSAP ScrollTrigger Animations
  const animations = new AnimationsController(canvasStream);

  // 4. Initialize Interactive Contact Form & Toast
  const form = new FormController();

  // 5. Dynamic Hero Actions & Resume Download Management
  const heroResumeBtn = document.getElementById('heroResumeBtn');
  if (heroResumeBtn) {
    heroResumeBtn.addEventListener('click', () => {
      if (form && typeof form.showToast === 'function') {
        form.showToast("Downloading Md MatlooB Alam's Resume (PDF)...");
      }
    });
  }

  // Dynamic Portfolio Data Synchronization (supports JSON store or API updates)
  fetch('data/portfolio.json')
    .then(res => (res.ok ? res.json() : null))
    .then(data => {
      if (!data || !data.profile) return;
      const { profile } = data;

      if (profile.name) {
        const nameEl = document.querySelector('.hero-author-name');
        if (nameEl) nameEl.textContent = profile.name;
      }
      if (profile.title) {
        const titleEl = document.querySelector('.hero-main-title');
        if (titleEl) {
          titleEl.innerHTML = `Full Stack<br><span class="hero-title-accent">${profile.title}</span>`;
        }
      }
      if (profile.bio) {
        const introEl = document.querySelector('.hero-intro-text');
        if (introEl) introEl.textContent = profile.bio;
      }
      if (profile.resumeUrl && heroResumeBtn) {
        heroResumeBtn.href = profile.resumeUrl;
        if (profile.resumeFilename) {
          heroResumeBtn.download = profile.resumeFilename;
        }
      }
    })
    .catch(() => {
      // Graceful silent fallback to statically configured HTML values
    });

  // 6. Certifications & Achievements Category Filter Controller
  const certFilterBtns = document.querySelectorAll('.cert-filter-btn');
  const certCards = document.querySelectorAll('.cert-card');

  if (certFilterBtns.length > 0 && certCards.length > 0) {
    certFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');

        // Update active button state & ARIA attributes
        certFilterBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        // Filter cards
        certCards.forEach(card => {
          const category = card.getAttribute('data-category');
          if (filter === 'all' || category === filter) {
            card.classList.remove('is-hidden');
          } else {
            card.classList.add('is-hidden');
          }
        });

        // Refresh ScrollTrigger layout calculations if available
        if (typeof ScrollTrigger !== 'undefined') {
          ScrollTrigger.refresh();
        }
      });
    });
  }

  // Expose on window for debugging/inspection if needed
  window.__FOLIOBLOX__ = {
    canvasStream,
    navigation,
    animations,
    form,
    heroResumeBtn
  };
});

