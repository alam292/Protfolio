/**
 * Animations Controller (js/animations.js)
 * Smooth, fluid, hardware-accelerated scroll-triggered animations and GSAP timelines.
 * Designed for 60fps+ natural motion, zero layout thrashing, and high performance.
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
      // Fallback: preserve accessibility without motion delays
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Global performance optimization: enforce GPU 3D rendering
    gsap.config({
      force3D: true,
      nullTargetWarn: false
    });

    // Wire smooth scroll triggers
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

  // Smooth scrubbing sync with background 3D canvas stream
  bindCanvasScroll() {
    if (!this.canvasStream) return;

    ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.0, // Damped fluid momentum
      onUpdate: (self) => {
        this.canvasStream.setTargetFrame(self.progress * (this.canvasStream.totalFrames - 1));
      }
    });
  }

  // Smooth, fluid entrance sequence for Hero elements on page load
  initHeroEntrance() {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.85 } });

    tl.from('.navbar', {
      y: -24,
      opacity: 0,
      duration: 0.75,
      ease: 'power2.out'
    })
    .from('.hero-status-badge', {
      opacity: 0,
      y: 16,
      duration: 0.65,
      ease: 'power2.out'
    }, '-=0.45');

    // 1. Cinematic Character Reveal for Grand Name: "MD MATLOOB ALAM" (100% Crisp, zero blur)
    const nameChars = document.querySelectorAll('.hero-char');
    if (nameChars.length > 0) {
      tl.from(nameChars, {
        opacity: 0,
        y: 26,
        scale: 0.9,
        stagger: 0.024,
        duration: 0.7,
        ease: 'power3.out',
        clearProps: 'transform,opacity'
      }, '-=0.35');
    } else {
      tl.from('.hero-name-title', {
        opacity: 0,
        y: 20,
        duration: 0.7,
        ease: 'power3.out',
        clearProps: 'transform,opacity'
      }, '-=0.35');
    }

    // 2. Cinematic Character Reveal for Title: "Software Developer" (100% Crisp, zero blur)
    const titleChars = document.querySelectorAll('.hero-title-char');
    if (titleChars.length > 0) {
      tl.from(titleChars, {
        opacity: 0,
        y: 18,
        scale: 0.92,
        stagger: 0.02,
        duration: 0.65,
        ease: 'power3.out',
        clearProps: 'transform,opacity'
      }, '-=0.45');
    } else {
      tl.from('.hero-subheading-main', {
        opacity: 0,
        y: 16,
        duration: 0.6,
        ease: 'power3.out',
        clearProps: 'transform,opacity'
      }, '-=0.45');
    }

    // 3. Cinematic Reveal for Divider and Specialization Badge
    tl.from('.hero-subheading-divider', {
      opacity: 0,
      scale: 0.4,
      duration: 0.4,
      ease: 'back.out(2)',
      clearProps: 'transform,opacity'
    }, '-=0.35')
    .from('.hero-subheading-accent', {
      opacity: 0,
      y: 14,
      scale: 0.95,
      duration: 0.55,
      ease: 'power2.out',
      clearProps: 'transform,opacity'
    }, '-=0.3');

    // 4. Hero introduction text, actions & bento metrics
    tl.from('.hero-intro-text', { opacity: 0, y: 16, duration: 0.65 }, '-=0.35')
      .from('.hero-actions-group', { opacity: 0, y: 16, duration: 0.65 }, '-=0.35')
      .from('.bento-metric-card', {
        opacity: 0,
        y: 18,
        stagger: 0.08,
        duration: 0.65,
        ease: 'power2.out'
      }, '-=0.35');
  }

  // Graceful, fluid scroll parallax exit for Hero content (with 1.0s damping)
  initHeroScrollEffects() {
    gsap.to('.hero-top-row', {
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1.0
      },
      y: -40,
      opacity: 0.45,
      ease: 'none'
    });

    gsap.to('.hero-bento-metrics', {
      scrollTrigger: {
        trigger: '#hero',
        start: '20% top',
        end: 'bottom top',
        scrub: 1.0
      },
      y: -28,
      opacity: 0.3,
      ease: 'none'
    });
  }

  // Smooth reveal for brands / partners strip
  initBrandsReveal() {
    gsap.from('.brands-wrapper', {
      scrollTrigger: {
        trigger: '#brands',
        start: 'top 88%',
        toggleActions: 'play none none reverse'
      },
      y: 28,
      opacity: 0,
      duration: 0.85,
      ease: 'power2.out'
    });
  }

  // Section Headers: Subtle upward glide with smooth stagger
  initSectionHeaders() {
    const sectionHeaders = document.querySelectorAll('.portfolio-section .section-header');
    sectionHeaders.forEach((header) => {
      gsap.from(header.children, {
        scrollTrigger: {
          trigger: header,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        },
        y: 24,
        opacity: 0,
        stagger: 0.08,
        duration: 0.8,
        ease: 'power2.out'
      });
    });
  }

  // About Section: Fluid bilateral entrance
  initAboutSection() {
    gsap.from('.about-story-card', {
      scrollTrigger: {
        trigger: '#about .about-grid',
        start: 'top 84%',
        toggleActions: 'play none none reverse'
      },
      x: -28,
      opacity: 0,
      duration: 0.85,
      ease: 'power2.out'
    });

    gsap.from('.stat-card', {
      scrollTrigger: {
        trigger: '.about-stats-grid',
        start: 'top 84%',
        toggleActions: 'play none none reverse'
      },
      y: 24,
      opacity: 0,
      stagger: 0.08,
      duration: 0.8,
      ease: 'power2.out'
    });
  }

  // Skills Section: Smooth cascade of categories and interactive tech chips
  initSkillsSection() {
    if (!this.hasGSAP || this.prefersReducedMotion) return;

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
            y: 16,
            opacity: 0,
            duration: 0.55,
            ease: 'power2.out'
          });
        }

        if (items.length > 0) {
          gsap.from(items, {
            scrollTrigger: {
              trigger: cat,
              start: 'top 86%',
              toggleActions: 'play none none reverse'
            },
            y: 20,
            opacity: 0,
            scale: 0.95,
            stagger: 0.035,
            duration: 0.6,
            ease: 'power2.out'
          });
        }
      });
    } else {
      gsap.from('.skill-item', {
        scrollTrigger: {
          trigger: '#skills',
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        },
        y: 20,
        opacity: 0,
        scale: 0.94,
        stagger: 0.025,
        duration: 0.6,
        ease: 'power2.out'
      });
    }
  }

  // Featured Projects: Central spine drawing and bilateral fluid slide reveals
  initProjectsSection() {
    if (!this.hasGSAP || this.prefersReducedMotion) return;

    const pipeline = document.querySelector('#projects .projects-pipeline');
    if (!pipeline) return;

    // 1. Central vector spine smooth draw
    gsap.fromTo(
      '#projects .projects-edge-spine',
      { scaleY: 0, transformOrigin: 'top center' },
      {
        scaleY: 1,
        duration: 1.0,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '#projects .projects-pipeline',
          start: 'top 84%'
        }
      }
    );

    // 2. Vertex anchors pop in naturally
    gsap.from('#projects .project-node-circle', {
      scrollTrigger: {
        trigger: '#projects .projects-pipeline',
        start: 'top 84%'
      },
      scale: 0,
      opacity: 0,
      stagger: 0.16,
      duration: 0.6,
      ease: 'back.out(1.6)'
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
          x: isLeftMedia ? -26 : 26,
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out'
        });
      }

      if (content) {
        gsap.from(content, {
          scrollTrigger: {
            trigger: entry,
            start: 'top 86%',
            toggleActions: 'play none none reverse'
          },
          x: isLeftMedia ? 26 : -26,
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out'
        });
      }
    });
  }

  // Work Experience: Seamless staggered timeline slide
  initExperienceSection() {
    gsap.from('.timeline-item', {
      scrollTrigger: {
        trigger: '#experience .experience-timeline',
        start: 'top 82%',
        toggleActions: 'play none none reverse'
      },
      x: -24,
      opacity: 0,
      stagger: 0.15,
      duration: 0.85,
      ease: 'power2.out'
    });
  }

  // Academic Education: Graph spine draw and payload reveals
  initEducationSection() {
    const graph = document.querySelector('#education .academic-graph');
    if (!graph) return;

    // 1. Central Graph Edge Spine draw animation
    gsap.fromTo(
      '#education .graph-edge-spine',
      { scaleY: 0, transformOrigin: 'top center' },
      {
        scaleY: 1,
        duration: 1.0,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '#education .academic-graph',
          start: 'top 84%'
        }
      }
    );

    // 2. Graph node vertices pop in
    gsap.from('#education .graph-node-circle', {
      scrollTrigger: {
        trigger: '#education .academic-graph',
        start: 'top 84%'
      },
      scale: 0,
      opacity: 0,
      stagger: 0.18,
      duration: 0.6,
      ease: 'back.out(1.6)'
    });

    // 3. Bilateral payloads slide in smoothly
    gsap.from('#education .graph-node-entry--left .graph-node-payload', {
      scrollTrigger: {
        trigger: '#education .academic-graph',
        start: 'top 84%',
        toggleActions: 'play none none reverse'
      },
      x: -20,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out'
    });

    gsap.from('#education .graph-node-entry--right .graph-node-payload', {
      scrollTrigger: {
        trigger: '#education .academic-graph',
        start: 'top 84%',
        toggleActions: 'play none none reverse'
      },
      x: 20,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out'
    });

    // 4. Metric plot bar fills smoothly
    gsap.fromTo(
      '#education .graph-metric-bar',
      { scaleX: 0, transformOrigin: 'left center' },
      {
        scaleX: 1,
        duration: 1.0,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '#education .academic-graph',
          start: 'top 84%'
        }
      }
    );
  }

  // Certificates: Staggered grid cards elevation
  initCertificatesSection() {
    gsap.from('.cert-card', {
      scrollTrigger: {
        trigger: '#certificates .certificates-grid',
        start: 'top 84%',
        toggleActions: 'play none none reverse'
      },
      y: 28,
      opacity: 0,
      stagger: 0.08,
      duration: 0.8,
      ease: 'power2.out'
    });
  }

  // Contact Section: Smooth converging cards
  initContactSection() {
    gsap.from('.contact-info-card', {
      scrollTrigger: {
        trigger: '#contact .contact-grid',
        start: 'top 84%',
        toggleActions: 'play none none reverse'
      },
      x: -28,
      opacity: 0,
      duration: 0.85,
      ease: 'power2.out'
    });

    gsap.from('.contact-form-card', {
      scrollTrigger: {
        trigger: '#contact .contact-grid',
        start: 'top 84%',
        toggleActions: 'play none none reverse'
      },
      x: 28,
      opacity: 0,
      duration: 0.85,
      ease: 'power2.out'
    });
  }
}

window.AnimationsController = AnimationsController;
