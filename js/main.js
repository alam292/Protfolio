/**
 * Main Application Orchestrator (js/main.js)
 * Coordinates PortfolioRenderer, ThemeController, CanvasStream, Navigation, Animations, and Form.
 */

document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  // 1. Initialize Theme Controller immediately to prevent visual flash
  const theme = new ThemeController();

  // 2. Initialize Dynamic Portfolio Data & DOM Rendering
  const renderer = new PortfolioRenderer();
  await renderer.init();

  // 3. Initialize 3D Canvas Stream
  const canvasStream = new CanvasStream({
    totalFrames: 300,
    frameDir: 'ezgif-8638738b594a7204-jpg',
    canvasId: 'canvas',
    containerId: 'canvas-container'
  });

  // 4. Initialize Navigation Controller (ScrollSpy, Sticky Navbar, Mobile Drawer)
  const navigation = new NavigationController();

  // 5. Initialize GSAP ScrollTrigger Animations
  const animations = new AnimationsController(canvasStream);

  // 6. Initialize Contact Form & Real-time IST clock
  const form = new FormController();

  // 7. Bind Resume Download Feedback Toast
  const heroResumeBtn = document.getElementById('heroResumeBtn');
  if (heroResumeBtn) {
    heroResumeBtn.addEventListener('click', () => {
      if (form && typeof form.showToast === 'function') {
        form.showToast("Initiating download for Md MatlooB Alam's Resume (PDF)...");
      }
    });
  }

  // Refresh ScrollTrigger after dynamic content renders
  if (typeof ScrollTrigger !== 'undefined') {
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 200);
  }

  // Global handle for diagnostics
  window.__PORTFOLIO_APP__ = {
    theme,
    renderer,
    canvasStream,
    navigation,
    animations,
    form
  };
});
