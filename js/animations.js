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
      .from('.hero-status-badge', { opacity: 0, y: 18, duration: 0.75 }, '-=0.5');

    // Smooth character-by-character reveal for MD MATLOOB ALAM
    const chars = document.querySelectorAll('.hero-char');
    if (chars.length > 0) {
      tl.from(chars, {
        opacity: 0,
        y: 28,
        stagger: 0.025,
        duration: 0.75,
        ease: 'power3.out'
      }, '-=0.5');
    } else {
      tl.from('.hero-name-title', { opacity: 0, y: 24, duration: 0.75, ease: 'power3.out' }, '-=0.5');
    }

    tl.from('.hero-subheading', { opacity: 0, y: 20, duration: 0.75 }, '-=0.6')
      .from('.hero-intro-text', { opacity: 0, y: 20, duration: 0.75 }, '-=0.6')
      .from('.hero-actions-group', { opacity: 0, y: 20, duration: 0.75 }, '-=0.6')
      .from('.hero-showcase-window', { opacity: 0, scale: 0.92, y: 30, duration: 1.1, ease: 'back.out(1.4)' }, '-=0.8')
      .from('.hero-badge-tag', { opacity: 0, scale: 0.75, stagger: 0.1, duration: 0.6, ease: 'back.out(2)' }, '-=0.5')
      .from('.bento-metric-card', { opacity: 0, y: 25, stagger: 0.08, duration: 0.75 }, '-=0.6');
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

    gsap.to('.hero-bento-metrics', {
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
    if (!this.hasGSAP || this.prefersReducedMotion) return;

    // Stagger categories and skill items smoothly as they enter viewport
    const categories = gsap.utils.toArray('.skill-category');
    if (categories.length > 0) {
      categories.forEach((cat) => {
        const header = cat.querySelector('.skill-category-header');
        const items = cat.querySelectorAll('.skill-item');

        if (header) {
          gsap.from(header, {
            scrollTrigger: {
              trigger: cat,
              start: 'top 88%',
              toggleActions: 'play none none reverse'
            },
            y: 20,
            opacity: 0,
            duration: 0.6,
            ease: 'power2.out'
          });
        }

        if (items.length > 0) {
          gsap.from(items, {
            scrollTrigger: {
              trigger: cat,
              start: 'top 85%',
              toggleActions: 'play none none reverse'
            },
            y: 28,
            opacity: 0,
            scale: 0.92,
            stagger: 0.045,
            duration: 0.7,
            ease: 'back.out(1.2)'
          });
        }
      });
    } else {
      gsap.from('.skill-item', {
        scrollTrigger: {
          trigger: '#skills',
          start: 'top 82%'
        },
        y: 30,
        opacity: 0,
        scale: 0.9,
        stagger: 0.03,
        duration: 0.7,
        ease: 'power3.out'
      });
    }
  }

  initProjectsSection() {
    if (!this.hasGSAP || this.prefersReducedMotion) return;

    const pipeline = document.querySelector('#projects .projects-pipeline');
    if (!pipeline) return;

    // 1. Central vector spine draw animation
    gsap.fromTo(
      '#projects .projects-edge-spine',
      { scaleY: 0, transformOrigin: 'top center' },
      {
        scaleY: 1,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '#projects .projects-pipeline',
          start: 'top 82%'
        }
      }
    );

    // 2. Vertex anchors pop in with bounce
    gsap.from('#projects .project-node-circle', {
      scrollTrigger: {
        trigger: '#projects .projects-pipeline',
        start: 'top 82%'
      },
      scale: 0,
      opacity: 0,
      stagger: 0.2,
      duration: 0.7,
      ease: 'back.out(2)'
    });

    // 3. Bilateral alternating slide reveals for media and content
    const entries = gsap.utils.toArray('#projects .project-entry');
    entries.forEach((entry) => {
      const media = entry.querySelector('.project-media-col');
      const content = entry.querySelector('.project-content-col');
      const isLeftMedia = entry.classList.contains('project-entry--left-media');

      if (media) {
        gsap.from(media, {
          scrollTrigger: {
            trigger: entry,
            start: 'top 86%',
            toggleActions: 'play none none reverse'
          },
          x: isLeftMedia ? -36 : 36,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out'
        });
      }

      if (content) {
        gsap.from(content, {
          scrollTrigger: {
            trigger: entry,
            start: 'top 86%',
            toggleActions: 'play none none reverse'
          },
          x: isLeftMedia ? 36 : -36,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out'
        });
      }
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
    const graph = document.querySelector('#education .academic-graph');
    if (!graph) return;

    // 1. Central Graph Edge Spine draw animation
    gsap.fromTo(
      '#education .graph-edge-spine',
      { scaleY: 0, transformOrigin: 'top center' },
      {
        scaleY: 1,
        duration: 1.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '#education .academic-graph',
          start: 'top 82%'
        }
      }
    );

    // 2. Graph node vertices pop in
    gsap.from('#education .graph-node-circle', {
      scrollTrigger: {
        trigger: '#education .academic-graph',
        start: 'top 82%'
      },
      scale: 0,
      opacity: 0,
      stagger: 0.22,
      duration: 0.7,
      ease: 'back.out(2)'
    });

    // 3. Bilateral payloads slide in from their respective sides (Left from -25px, Right from +25px)
    gsap.from('#education .graph-node-entry--left .graph-node-payload', {
      scrollTrigger: {
        trigger: '#education .academic-graph',
        start: 'top 82%'
      },
      x: -25,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out'
    });

    gsap.from('#education .graph-node-entry--right .graph-node-payload', {
      scrollTrigger: {
        trigger: '#education .academic-graph',
        start: 'top 82%'
      },
      x: 25,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out'
    });

    // 4. Metric plot bar fills
    gsap.fromTo(
      '#education .graph-metric-bar',
      { scaleX: 0, transformOrigin: 'left center' },
      {
        scaleX: 1,
        duration: 1.2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '#education .academic-graph',
          start: 'top 82%'
        }
      }
    );
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

