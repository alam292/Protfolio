/**
 * Animations Controller
 * GSAP ScrollTrigger reveals, timeline staggers, and interactive counter animations.
 */

class AnimationsController {
  constructor(canvasStream) {
    this.canvasStream = canvasStream;
    this.hasGSAP = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.init();
  }

  init() {
    if (!this.hasGSAP || this.prefersReducedMotion) {
      // Fallback: make elements immediately visible without motion
      document.querySelectorAll('.stat-number').forEach(el => {
        // Leave original text intact
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    this.bindCanvasScroll();
    this.initHeroEntrance();
    this.initHeroScrollEffects();
    this.initBrandsReveal();
    this.initSectionHeaders();
    this.initAboutSection();
    this.initSkillsSection();
    this.initProjectsSection();
    this.initExperienceSection();
    this.initEducationSection();
    this.initCertificatesSection();
    this.initContactSection();
  }

  bindCanvasScroll() {
    if (!this.canvasStream) return;

    ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        this.canvasStream.setTargetFrame(self.progress * (this.canvasStream.totalFrames - 1));
      }
    });
  }

  initHeroEntrance() {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1.0 } });
    tl.from('.navbar', { y: -30, opacity: 0, duration: 0.85 })
      .from('.hero-status-badge', { opacity: 0, y: 18, duration: 0.75 }, '-=0.5')
      .from('.hero-author-meta', { opacity: 0, y: 22, duration: 0.75 }, '-=0.6')
      .from('.hero-main-title', { opacity: 0, y: 30, duration: 0.85 }, '-=0.65')
      .from('.hero-intro-text', { opacity: 0, y: 20, duration: 0.75 }, '-=0.6')
      .from('.hero-actions-group', { opacity: 0, y: 20, duration: 0.75 }, '-=0.6')
      .from('.hero-visual-block', { opacity: 0, scale: 0.94, duration: 1.0, ease: 'back.out(1.3)' }, '-=0.8')
      .from('.pillar-card', { opacity: 0, y: 25, stagger: 0.08, duration: 0.75 }, '-=0.6');
  }

  initHeroScrollEffects() {
    gsap.to('.hero-top-row', {
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      },
      y: -100,
      opacity: 0.2,
      ease: 'none'
    });

    gsap.to('.hero-pillars-grid', {
      scrollTrigger: {
        trigger: '#hero',
        start: 'center top',
        end: 'bottom top',
        scrub: true
      },
      y: -70,
      opacity: 0,
      ease: 'none'
    });
  }

  initBrandsReveal() {
    gsap.from('.brands-wrapper', {
      scrollTrigger: {
        trigger: '#brands',
        start: 'top 85%',
        toggleActions: 'play none none reverse'
      },
      y: 45,
      opacity: 0,
      duration: 1.1,
      ease: 'power3.out'
    });
  }

  initSectionHeaders() {
    const sectionHeaders = document.querySelectorAll('.portfolio-section .section-header');
    sectionHeaders.forEach((header) => {
      gsap.from(header.children, {
        scrollTrigger: {
          trigger: header,
          start: 'top 82%'
        },
        y: 40,
        opacity: 0,
        stagger: 0.12,
        duration: 1,
        ease: 'power3.out'
      });
    });
  }

  initAboutSection() {
    gsap.from('.about-story-card', {
      scrollTrigger: {
        trigger: '#about .about-grid',
        start: 'top 80%'
      },
      x: -40,
      opacity: 0,
      duration: 1.1,
      ease: 'power3.out'
    });

    gsap.from('.stat-card', {
      scrollTrigger: {
        trigger: '.about-stats-grid',
        start: 'top 82%'
      },
      y: 40,
      opacity: 0,
      stagger: 0.14,
      duration: 1,
      ease: 'power3.out'
    });
  }

  initSkillsSection() {
    gsap.from('.skill-card', {
      scrollTrigger: {
        trigger: '#skills .skills-grid',
        start: 'top 82%'
      },
      y: 50,
      opacity: 0,
      stagger: 0.14,
      duration: 1,
      ease: 'power3.out'
    });
  }

  initProjectsSection() {
    gsap.from('.behind-header-left, .behind-header-right', {
      scrollTrigger: {
        trigger: '#projects .behind-header',
        start: 'top 80%'
      },
      y: 45,
      opacity: 0,
      stagger: 0.16,
      duration: 1.1,
      ease: 'power3.out'
    });

    gsap.from('.project-card, .showcase-card', {
      scrollTrigger: {
        trigger: '#projects .projects-grid, #projects .showcase-grid',
        start: 'top 82%'
      },
      y: 70,
      opacity: 0,
      stagger: 0.18,
      duration: 1.2,
      ease: 'power3.out'
    });
  }

  initExperienceSection() {
    gsap.from('.timeline-item', {
      scrollTrigger: {
        trigger: '#experience .experience-timeline',
        start: 'top 80%'
      },
      x: -35,
      opacity: 0,
      stagger: 0.2,
      duration: 1.1,
      ease: 'power3.out'
    });
  }

  initEducationSection() {
    gsap.from('.edu-card', {
      scrollTrigger: {
        trigger: '#education .education-grid',
        start: 'top 82%'
      },
      y: 50,
      opacity: 0,
      stagger: 0.18,
      duration: 1.1,
      ease: 'power3.out'
    });
  }

  initCertificatesSection() {
    gsap.from('.cert-card', {
      scrollTrigger: {
        trigger: '#certificates .certificates-grid',
        start: 'top 82%'
      },
      y: 50,
      opacity: 0,
      stagger: 0.15,
      duration: 1.1,
      ease: 'power3.out'
    });
  }

  initContactSection() {
    gsap.from('.contact-info-card', {
      scrollTrigger: {
        trigger: '#contact .contact-grid',
        start: 'top 82%'
      },
      x: -40,
      opacity: 0,
      duration: 1.1,
      ease: 'power3.out'
    });

    gsap.from('.contact-form-card', {
      scrollTrigger: {
        trigger: '#contact .contact-grid',
        start: 'top 82%'
      },
      x: 40,
      opacity: 0,
      duration: 1.1,
      ease: 'power3.out'
    });
  }
}

window.AnimationsController = AnimationsController;

