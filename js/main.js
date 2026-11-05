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

  // Expose on window for debugging/inspection if needed
  window.__FOLIOBLOX__ = {
    canvasStream,
    navigation,
    animations,
    form
  };
});

