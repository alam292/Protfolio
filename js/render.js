/**
 * Dynamic Portfolio Renderer (js/render.js)
 * Fetches data/portfolio.json and dynamically renders all 8 portfolio sections.
 * Perfectly integrates with Folioblox Design System classes.
 */

class PortfolioRenderer {
  constructor() {
    this.dataPath = 'data/portfolio.json';
    this.data = null;
    this.activeCertCategory = 'all';
    this._certFiltersBound = false;

    // Listen for live portfolio updates
    window.addEventListener('portfolio:updated', (e) => {
      if (e.detail) {
        this.updateData(e.detail);
      }
    });
  }

  updateData(newData) {
    if (!newData) return;
    this.data = newData;
    this.renderAll();
    window.dispatchEvent(new CustomEvent('portfolio:rendered', { detail: this.data }));
    if (typeof ScrollTrigger !== 'undefined') {
      setTimeout(() => ScrollTrigger.refresh(), 200);
    }
  }

  async init() {
    try {
      const response = await fetch(this.dataPath);
      if (!response.ok) {
        throw new Error(`Failed to load ${this.dataPath}: status ${response.status}`);
      }
      this.data = await response.json();
      this.renderAll();
      this.bindCertFilters();

      // Dispatch event to announce rendering completion
      window.dispatchEvent(new CustomEvent('portfolio:rendered', { detail: this.data }));
      return this.data;
    } catch (error) {
      console.error('[PortfolioRenderer] Initialization error:', error);
      return null;
    }
  }

  renderAll() {
    if (!this.data) return;

    this.renderHero();
    this.renderAbout();
    this.renderSkills();
    this.renderProjects();
    this.renderExperience();
    this.renderEducation();
    this.renderCertifications();
    this.renderContact();
    this.renderFooter();
  }

  // Visual SVG Icons
  getIconSvg(type) {
    const icons = {
      code: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,
      layers: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`,
      server: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>`,
      database: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>`,
      cpu: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="15" x2="23" y2="15"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="15" x2="4" y2="15"></line></svg>`,
      terminal: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`,
      zap: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
      shield: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
      "git-branch": `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>`,
      github: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>`,
      linkedin: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>`,
      twitter: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>`,
      mail: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`,
      "map-pin": `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
      send: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`,
      user: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
      external: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`
    };
    return icons[type] || icons.code;
  }

  // Helper to render name with character-by-character animation spans
  renderAnimatedName(name) {
    if (!name) return 'MD MATLOOB ALAM';
    const words = name.trim().split(/\s+/);
    let charIdx = 0;
    return words.map(word => {
      const charsHtml = Array.from(word).map(char => {
        const span = `<span class="hero-char" style="--char-idx: ${charIdx};" data-char="${char}">${char}</span>`;
        charIdx++;
        return span;
      }).join('');
      return `<span class="hero-name-word" aria-hidden="true">${charsHtml}</span>`;
    }).join('<span class="hero-char-space" aria-hidden="true">&nbsp;</span>');
  }

  // 1. Hero / Home Section (Vercel / Linear Ultra-Clean Style)
  renderHero() {
    const mount = document.getElementById('heroMount');
    if (!mount) return;

    const { profile, stats } = this.data;

    // Render 4 Bento Metrics dynamically
    const metricsHtml = (stats || []).map(stat => `
      <div class="bento-metric-card">
        <div class="bento-metric-val">
          <span>${stat.value}</span>
          <span class="bento-metric-suffix">${stat.suffix || ''}</span>
        </div>
        <div class="bento-metric-label">${stat.label}</div>
      </div>
    `).join('');

    mount.innerHTML = `
      <div class="hero-top-row">
        <!-- Left: Identity, Headline, Intro & Dynamic CTAs -->
        <div class="hero-headline-block">
          <!-- 1. Live Opportunity Status Badge -->
          ${profile.status ? `
          <div class="hero-status-badge" role="status" aria-label="Current availability status">
            <span class="status-pulse-dot" aria-hidden="true"></span>
            <span class="status-badge-text">${profile.status}</span>
            ${profile.statusSubtitle ? `<span class="status-badge-sub">${profile.statusSubtitle}</span>` : ''}
          </div>` : ''}

          <!-- 2. Primary Grand Name: Character-by-Character Animated Headline -->
          <h1 class="hero-name-title" aria-label="${profile.name}">
            ${this.renderAnimatedName(profile.name)}
          </h1>

          <div class="hero-subheading">
            <span>Full Stack Developer</span>
            <span style="color: #71717a;">&amp;</span>
            <span class="hero-subheading-accent">UI Engineer</span>
          </div>

          <!-- 3. Short Introduction -->
          <p class="hero-intro-text">
            ${profile.heroTagline}
          </p>

          <!-- 4. Hero CTA Actions (Download Resume, Contact Me & Socials) -->
          <div class="hero-actions-group">
            <a 
              href="${profile.resumeUrl}" 
              download="${profile.resumeFilename}" 
              class="hero-btn-resume" 
              id="heroResumeBtn"
              aria-label="Download ${profile.name}'s verified resume (PDF)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Download Resume</span>
            </a>

            <a href="#contact" class="hero-btn-contact" aria-label="Navigate to contact section">
              <span>Let's talk</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>

            <!-- Social Links -->
            <div class="hero-social-links" aria-label="Social Profiles">
              <a href="${profile.githubUrl}" target="_blank" rel="noopener noreferrer" class="hero-social-icon" aria-label="GitHub Profile" title="GitHub">
                ${this.getIconSvg('github')}
              </a>
              <a href="${profile.linkedinUrl}" target="_blank" rel="noopener noreferrer" class="hero-social-icon" aria-label="LinkedIn Profile" title="LinkedIn">
                ${this.getIconSvg('linkedin')}
              </a>
            </div>
          </div>
        </div>

        <!-- Right: 3D Animated Motion Showcase Card with Dynamic Ambient Glow -->
        <div class="hero-visual-block" id="heroVisualBlock">
          <div class="hero-3d-stage" id="hero3DStage">
            <!-- Dynamic Ambient Pulsing Neon Glow -->
            <div class="hero-visual-glow" aria-hidden="true"></div>

            <!-- Master 3D Showcase Card Window (Frameless Clean View) -->
            <div class="hero-showcase-window" id="hero3DCard">
              <!-- Animated Motion Viewport (GIF) -->
              <div class="hero-photo-viewport">
                <img 
                  src="assets/gemini_generated_video_ebe17827.gif" 
                  alt="${profile.name} — Interactive Motion Visual" 
                  class="hero-portrait-image"
                  id="heroPortraitImage"
                  loading="eager"
                  onerror="this.onerror=null; this.src='assets/profile-avatar.svg';"
                />
                <!-- Subtle Cinematic Edge Vignette & Warm Light Reflections -->
                <div class="hero-photo-cinematic-overlay" aria-hidden="true"></div>
              </div>

              <!-- Floating 3D Tech Badges -->
              <div class="hero-badge-tag hero-badge-tag-status" data-depth="35">
                <span class="status-pulse-dot" aria-hidden="true"></span>
                <span>Open for Opportunities</span>
              </div>

              <div class="hero-badge-tag hero-badge-tag-stack" data-depth="45">
                <span class="badge-role-icon">&lt;/&gt;</span>
                <span>Python · React · Cloud</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Hero Bottom Row: Dynamic Bento Metrics Strip -->
      <div class="hero-bento-metrics">
        ${metricsHtml}
      </div>
    `;

    // Initialize 3D Parallax, Media Switcher & Video Controls
    this.initHeroVisual3D();
  }

  // 3D Parallax & Video Playback Controller for Hero Visual
  initHeroVisual3D() {
    const stage = document.getElementById('hero3DStage');
    const card = document.getElementById('hero3DCard');
    const video = document.getElementById('heroVideo');
    if (!stage || !card) return;

    // 1. Optimize video playback with seamless autoplay
    if (video) {
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');

      const playVideo = () => {
        const promise = video.play();
        if (promise !== undefined) {
          promise.catch(() => {
            // Document interaction fallback
            const resumeOnInteraction = () => {
              video.play().catch(() => { });
              window.removeEventListener('click', resumeOnInteraction);
              window.removeEventListener('touchstart', resumeOnInteraction);
            };
            window.addEventListener('click', resumeOnInteraction, { once: true });
            window.addEventListener('touchstart', resumeOnInteraction, { once: true });
          });
        }
      };

      if (video.readyState >= 2) {
        playVideo();
      } else {
        video.addEventListener('loadeddata', playVideo, { once: true });
      }

      // Continuous loop assurance
      video.addEventListener('ended', () => {
        video.currentTime = 0;
        video.play().catch(() => { });
      });
    }

    // 2. 3D Tilt & Optical Depth Parallax Engine
    let rect = card.getBoundingClientRect();
    let isHovering = false;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId = null;

    const parallaxLayers = card.querySelectorAll('[data-depth]');

    const updateRect = () => {
      rect = card.getBoundingClientRect();
    };
    window.addEventListener('resize', updateRect, { passive: true });

    const onMouseMove = (e) => {
      isHovering = true;
      card.classList.remove('is-floating');
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;

      // Gentle, luxury tilt (+/- 10 degrees max)
      targetY = (mouseX / (rect.width / 2)) * 10;
      targetX = -(mouseY / (rect.height / 2)) * 10;
    };

    const onMouseEnter = () => {
      updateRect();
      isHovering = true;
      card.classList.remove('is-floating');
    };

    const onMouseLeave = () => {
      isHovering = false;
      targetX = 0;
      targetY = 0;
      setTimeout(() => {
        if (!isHovering) card.classList.add('is-floating');
      }, 350);
    };

    stage.addEventListener('mousemove', onMouseMove, { passive: true });
    stage.addEventListener('mouseenter', onMouseEnter);
    stage.addEventListener('mouseleave', onMouseLeave);

    // Smooth Lerp Rendering Loop
    const renderLoop = () => {
      currentX += (targetX - currentX) * 0.1;
      currentY += (targetY - currentY) * 0.1;

      if (isHovering || Math.abs(currentX) > 0.04 || Math.abs(currentY) > 0.04) {
        card.style.transform = `perspective(1200px) rotateX(${currentY.toFixed(2)}deg) rotateY(${currentX.toFixed(2)}deg) translateZ(10px)`;

        // Optical parallax on foreground portrait card & tech badges
        parallaxLayers.forEach((layer) => {
          const depth = parseFloat(layer.getAttribute('data-depth')) || 35;
          const px = (currentX * (depth / 35) * 1.2).toFixed(1);
          const py = (-currentY * (depth / 35) * 1.2).toFixed(1);
          layer.style.transform = `translate3d(${px}px, ${py}px, ${depth}px)`;
        });
      }

      rafId = requestAnimationFrame(renderLoop);
    };

    // Start with floating idle animation
    card.classList.add('is-floating');
    renderLoop();
  }

  // 2. About Me Section
  renderAbout() {
    const mount = document.getElementById('aboutMount');
    if (!mount) return;

    const { about, stats, profile } = this.data;

    const statsHtml = stats.map(s => `
      <div class="card stat-card">
        <div class="stat-value-row">
          <span class="stat-number">${s.value}</span>
          <span class="stat-suffix">${s.suffix}</span>
        </div>
        <div class="stat-label">${s.label}</div>
        <div class="stat-sublabel">${s.description}</div>
      </div>
    `).join('');

    mount.innerHTML = `
      <h2 class="section-tag" id="about-title">${about.sectionTag}</h2>

      <div class="about-grid">
        <!-- Biography Story Card -->
        <article class="card about-story-card">
          ${profile.status ? `
          <div class="status-indicator">
            <span class="status-dot" aria-hidden="true"></span>
            <span class="status-text">${profile.status}</span>
          </div>` : ''}

          <h3 class="about-subheading">
            ${about.lead}
          </h3>

          <p class="about-text">
            ${about.pillars[0].content}
          </p>

          <p class="about-text">
            ${about.pillars[1].content}
          </p>

          <div class="about-action-row">
            <a href="#projects" class="btn-touch btn-touch-orange">
              <span>Explore My Work</span>
              <span class="btn-icon-circle" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </span>
            </a>
          </div>
        </article>

        <!-- KPI Metrics Grid -->
        <div class="about-stats-grid">
          ${statsHtml}
        </div>
      </div>
    `;
  }

  // 3. Technical Skills Section (Modern Animated Technology Showcase)
  renderSkills() {
    const mount = document.getElementById('skillsMount');
    if (!mount) return;

    const { skills } = this.data;
    if (!skills) return;

    if (window.SkillsShowcase && typeof window.SkillsShowcase.renderSkillsReact === 'function') {
      window.SkillsShowcase.renderSkillsReact(mount, skills);
    } else if (window.SkillsShowcase && typeof window.SkillsShowcase.renderSkillsHtmlString === 'function') {
      mount.innerHTML = window.SkillsShowcase.renderSkillsHtmlString(skills);
    } else {
      // Fallback simple clean grid if module is loading
      const categoriesHtml = (skills.categories || []).map((cat, idx) => {
        const skillsList = cat.skills || cat.items || [];
        const items = skillsList.map(s => `
          <div class="skill-item" role="listitem" tabindex="0" aria-label="${s.name}">
            <div class="skill-icon-wrapper" aria-hidden="true">${this.getIconSvg(cat.icon || 'code')}</div>
            <span class="skill-name">${s.name}</span>
          </div>
        `).join('');
        return `
          <div class="skill-category" role="region" aria-label="${cat.name}">
            <div class="skill-category-header">
              <span class="skill-category-badge">${String(idx + 1).padStart(2, '0')}</span>
              <h3 class="skill-category-title">${cat.name}</h3>
              <div class="skill-category-divider" aria-hidden="true"></div>
            </div>
            <div class="skills-category-grid" role="list">
              ${items}
            </div>
          </div>
        `;
      }).join('');

      mount.innerHTML = `
        <div class="skills-showcase-container">
          <div class="skills-header">
            <h2 class="section-tag" id="skills-title">${skills.sectionTag || 'TECHNICAL ARSENAL'}</h2>
            ${skills.title ? `<h3 class="section-heading">${skills.title}</h3>` : ''}
            ${skills.subtitle ? `<p class="section-subtitle">${skills.subtitle}</p>` : ''}
          </div>
          <div class="skills-categories-container">
            ${categoriesHtml}
          </div>
        </div>
      `;
    }
  }

  // 4. Featured Projects Section
  renderProjects() {
    const mount = document.getElementById('projectsMount');
    if (!mount) return;

    const { projects } = this.data;

    const cardsHtml = projects.items.map(proj => {
      const techPillsHtml = proj.techStack.map(t => `<span class="tech-pill">${t}</span>`).join('');

      return `
        <article class="project-card">
          <!-- Browser Mockup Chrome Header -->
          <div class="project-browser-bar" aria-hidden="true">
            <div class="project-traffic-lights">
              <span class="traffic-light traffic-red"></span>
              <span class="traffic-light traffic-yellow"></span>
              <span class="traffic-light traffic-green"></span>
            </div>
            <div class="project-address-bar">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="padlock-icon">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span class="project-url">${proj.liveDemoUrl.replace('https://', '')}</span>
            </div>
            <span class="project-status-pill">
              <span class="status-pulse-dot" style="width: 6px; height: 6px;"></span>
              <span>Production</span>
            </span>
          </div>

          <!-- Visual Project Media Viewport -->
          <div class="project-viewport">
            <img 
              src="${proj.image}" 
              alt="${proj.title} architecture and dashboard mockup" 
              class="project-visual-media" 
              loading="lazy" 
              width="600" 
              height="338"
              onerror="this.onerror=null; this.src='assets/project-cloudscale.svg';"
            />
            <div class="project-glow-layer" aria-hidden="true"></div>
          </div>

          <!-- Project Description & Metadata -->
          <div class="project-content">
            <div class="project-eyebrow">
              <span class="project-num">${proj.number}</span>
              <span class="project-badge">${proj.category}</span>
            </div>

            <h3 class="project-heading">${proj.title}</h3>
            <p class="project-desc">${proj.description}</p>

            <div class="project-impact-box">
              <span class="impact-icon" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                  <polyline points="17 6 23 6 23 12"></polyline>
                </svg>
              </span>
              <span class="impact-text">${proj.metrics}</span>
            </div>

            <div class="project-tech-pills" aria-label="Technologies used">
              ${techPillsHtml}
            </div>

            <!-- Footer Action Buttons -->
            <div class="project-footer-actions">
              <a 
                href="${proj.githubUrl}" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="btn-project-code" 
                aria-label="View source code of ${proj.title} on GitHub"
              >
                ${this.getIconSvg('github')}
                <span>Source Code</span>
              </a>

              <a 
                href="${proj.liveDemoUrl}" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="btn-project-demo" 
                aria-label="Launch live demo of ${proj.title}"
              >
                <span>Live Demo</span>
                <span class="btn-icon-circle" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="7" y1="17" x2="17" y2="7"></line>
                    <polyline points="7 7 17 7 17 17"></polyline>
                  </svg>
                </span>
              </a>
            </div>
          </div>
        </article>
      `;
    }).join('');

    mount.innerHTML = `
      <div class="behind-header">
        <div class="behind-header-left">
          <h2 class="behind-tag" id="projects-title">${projects.sectionTag}</h2>
        </div>
        <div class="behind-header-right">
          <p class="behind-lead-text">
            ${projects.subtitle}
          </p>
          <div class="behind-action-row">
            <span class="behind-action-subtext">Verified production code &bull; 100% genuine engineering impact</span>
            <a href="https://github.com/mdmatloob" target="_blank" rel="noopener noreferrer" class="btn-touch btn-touch-orange">
              <span>View GitHub</span>
              <span class="btn-icon-circle" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="7" y1="17" x2="17" y2="7"></line>
                  <polyline points="7 7 17 7 17 17"></polyline>
                </svg>
              </span>
            </a>
          </div>
        </div>
      </div>

      <div class="projects-grid">
        ${cardsHtml}
      </div>
    `;
  }

  // 5. Work Experience Section
  renderExperience() {
    const mount = document.getElementById('experienceMount');
    if (!mount) return;

    const { experience } = this.data;

    const timelineHtml = experience.roles.map(r => {
      const bulletsHtml = r.highlights.map(h => `
        <li class="timeline-bullet">${h}</li>
      `).join('');

      const stackHtml = r.techStack.map(t => `<span class="tech-tag">${t}</span>`).join('');

      return `
        <div class="timeline-item">
          <div class="timeline-dot ${r.isCurrent ? 'is-active' : ''}" aria-hidden="true"></div>
          <article class="card timeline-card">
            <div class="timeline-header">
              <div>
                <h3 class="timeline-role">${r.role}</h3>
                <div class="timeline-company-row">
                  <span class="timeline-company">${r.company}</span>
                  <span class="timeline-divider">&bull;</span>
                  <span class="timeline-duration">${r.location}</span>
                </div>
              </div>
              <div class="timeline-status-badge">${r.period}</div>
            </div>

            <ul class="timeline-bullets" aria-label="Responsibilities and achievements">
              ${bulletsHtml}
            </ul>

            <div class="timeline-tech-tags" aria-label="Technologies used">
              ${stackHtml}
            </div>
          </article>
        </div>
      `;
    }).join('');

    mount.innerHTML = `
      <h2 class="section-tag" id="experience-title">${experience.sectionTag}</h2>
      ${experience.subtitle ? `<p class="section-subtitle">${experience.subtitle}</p>` : ''}

      <div class="experience-timeline">
        <div class="timeline-line" aria-hidden="true"></div>
        ${timelineHtml}
      </div>
    `;
  }

  // 6. Education Section (Academic Graph Pipeline Form)
  renderEducation() {
    const mount = document.getElementById('educationMount');
    if (!mount) return;

    const { education } = this.data;
    if (!education || !Array.isArray(education.degrees)) return;

    const nodesHtml = education.degrees.map((deg, index) => {
      // Coursework / subjects as minimal inline text
      const courseworkList = deg.coursework || deg.skillsGained || [];
      const courseworkLabel = deg.courseworkLabel || (deg.shortDegree === 'Intermediate' ? 'Key Subjects' : 'Core Coursework');

      const courseworkHtml = courseworkList.length > 0 ? `
        <div class="graph-coursework-row">
          <span class="graph-coursework-label">${courseworkLabel}:</span>
          <span class="graph-coursework-inline">${courseworkList.join(' <span class="graph-coursework-sep" aria-hidden="true">&middot;</span> ')}</span>
        </div>
      ` : '';

      // Graph Metric Plot (No card view, graph data plot format)
      let metricPlotHtml = '';
      if (deg.score && deg.score.type === 'cgpa') {
        const val = typeof deg.score.value === 'number' ? deg.score.value.toFixed(2) : deg.score.value;
        const max = deg.score.scale ? deg.score.scale.toFixed(1) : '10.0';
        const pct = deg.score.percentage || (parseFloat(val) / parseFloat(max) * 100);
        metricPlotHtml = `
          <div class="graph-plot-row" aria-label="CGPA Plot: ${deg.score.formatted || deg.cgpa}">
            <div class="graph-plot-metric">
              <span class="graph-metric-label">CGPA PLOT:</span>
              <span class="graph-metric-num">${val}</span>
              <span class="graph-metric-denom">/ ${max}</span>
            </div>
            <div class="graph-metric-track" aria-hidden="true" title="${deg.score.formatted || deg.cgpa}">
              <div class="graph-metric-bar" style="--plot-pct: ${pct}%;">
                <span class="graph-metric-pip"></span>
              </div>
            </div>
          </div>
        `;
      } else if ((deg.score && deg.score.type === 'division') || deg.status === 'First Division' || (deg.cgpa && deg.cgpa.includes('First Division'))) {
        const divisionText = deg.score?.division || deg.score?.formatted || deg.status || deg.cgpa || 'First Division';
        const boardText = deg.board || (deg.score && deg.score.board) || '';
        metricPlotHtml = `
          <div class="graph-plot-row" aria-label="Result Classification: ${divisionText}">
            <div class="graph-plot-metric">
              <span class="graph-metric-label">RESULT:</span>
              <span class="graph-metric-tier">${divisionText}${boardText ? ` &middot; ${boardText}` : ''}</span>
            </div>
          </div>
        `;
      } else if (deg.cgpa) {
        metricPlotHtml = `
          <div class="graph-plot-row">
            <div class="graph-plot-metric">
              <span class="graph-metric-label">EVALUATION:</span>
              <span class="graph-metric-tier">${deg.cgpa}</span>
            </div>
          </div>
        `;
      }

      const isLeft = index % 2 === 0;
      const sideClass = isLeft ? 'graph-node-entry--left' : 'graph-node-entry--right';
      const tagLabel = index === 0 ? 'GRADUATE' : 'HIGHER SECONDARY';

      return `
        <div class="graph-node-entry ${sideClass}" data-node="${isLeft ? 'left' : 'right'}">
          <div class="graph-vertex" aria-hidden="true">
            <div class="graph-node-circle">
              <span class="graph-node-core"></span>
              <span class="graph-node-ping"></span>
            </div>
            <div class="graph-stem-connector"></div>
          </div>

          <div class="graph-node-payload">
            <div class="graph-coord-bar">
              <span class="graph-node-id">${tagLabel}</span>
              <time class="graph-node-time">${deg.period}</time>
            </div>

            <h3 class="graph-node-title">${deg.degree}</h3>

            <div class="graph-node-institution">
              <svg class="graph-inst-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M15 10v11M12 2L2 7h20L12 2z"></path>
              </svg>
              <span>${deg.institution}</span>
            </div>

            ${metricPlotHtml}
            ${courseworkHtml}
          </div>
        </div>
      `;
    }).join('');

    mount.innerHTML = `
      <h2 class="section-tag" id="education-title">${education.sectionTag || 'ACADEMIC GRAPH'}</h2>
      ${education.subtitle ? `<p class="section-subtitle">${education.subtitle}</p>` : ''}

      <div class="academic-graph-wrap">
        <div class="academic-graph" role="region" aria-label="Academic Progression Graph">
          <div class="graph-sys-header" aria-hidden="true">
            <span class="graph-sys-tag">ACADEMIC_GRAPH_PIPELINE</span>
            <span class="graph-sys-coords">AXIS: CHRONOLOGICAL_MILESTONES (2018 — 2024)</span>
          </div>

          <div class="graph-network">
            <div class="graph-edge-spine" aria-hidden="true"></div>
            ${nodesHtml}
          </div>
        </div>
      </div>
    `;
  }

  // 7. Certifications & Achievements Section (Gallery Slider Matching UI Mockup)
  getCertRosetteSvg(emblem) {
    if (emblem === 'hackerrank') {
      return `
        <svg class="cert-rosette-svg" width="88" height="102" viewBox="0 0 92 106" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="rosetteHk" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#34d399" />
              <stop offset="50%" stop-color="#10b981" />
              <stop offset="100%" stop-color="#059669" />
            </linearGradient>
            <linearGradient id="ribbonHk1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#059669" />
              <stop offset="100%" stop-color="#047857" />
            </linearGradient>
            <linearGradient id="ribbonHk2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#10b981" />
              <stop offset="100%" stop-color="#059669" />
            </linearGradient>
            <filter id="rosetteHkShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#10b981" flood-opacity="0.35" />
            </filter>
          </defs>
          <path d="M34 58 L20 102 L34 94 L46 102 L44 60 Z" fill="url(#ribbonHk1)" opacity="0.95" />
          <path d="M58 58 L46 102 L58 94 L72 102 L58 60 Z" fill="url(#ribbonHk2)" />
          <path d="M46 6 L52 9.5 L58 7.5 L63 12.5 L69 12 L72 18 L78 19 L79 26 L85 29 L84 36 L89 40 L86 47 L89 54 L84 58 L85 65 L79 68 L78 75 L72 76 L69 82 L63 81.5 L58 86.5 L52 84.5 L46 88 L40 84.5 L34 86.5 L29 81.5 L23 82 L20 76 L14 75 L13 68 L7 65 L8 58 L3 54 L6 47 L3 40 L8 36 L7 29 L13 26 L14 19 L20 18 L23 12 L29 12.5 L34 7.5 L40 9.5 Z" fill="url(#rosetteHk)" filter="url(#rosetteHkShadow)" stroke="#047857" stroke-width="1.2" />
          <circle cx="46" cy="47" r="33" fill="#065f46" stroke="#a7f3d0" stroke-width="1.5" stroke-dasharray="2 2" />
          <circle cx="46" cy="47" r="28" fill="#064e3b" stroke="#34d399" stroke-width="2" />
          <g transform="translate(30, 31) scale(0.68)">
            <path d="M7 6 L7 42 L16 42 L16 29 L32 29 L32 42 L41 42 L41 6 L32 6 L32 19 L16 19 L16 6 Z" fill="#ffffff" />
            <polygon points="12 4 13.2 7.5 17 7.5 14 9.6 15.2 13 12 11 8.8 13 10 9.6 7 7.5 10.8 7.5" fill="#fbbf24" />
            <polygon points="24 1 25.2 4.5 29 4.5 26 6.6 27.2 10 24 8 20.8 10 22 6.6 19 4.5 22.8 4.5" fill="#fbbf24" />
            <polygon points="36 4 37.2 7.5 41 7.5 38 9.6 39.2 13 36 11 32.8 13 34 9.6 31 7.5 34.8 7.5" fill="#fbbf24" />
          </g>
        </svg>
      `;
    }

    if (emblem === 'google') {
      return `
        <svg class="cert-rosette-svg" width="88" height="102" viewBox="0 0 92 106" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="rosetteGoog" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#60a5fa" />
              <stop offset="50%" stop-color="#3b82f6" />
              <stop offset="100%" stop-color="#1d4ed8" />
            </linearGradient>
            <linearGradient id="ribbonGoog1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#1d4ed8" />
              <stop offset="100%" stop-color="#1e40af" />
            </linearGradient>
            <linearGradient id="ribbonGoog2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#3b82f6" />
              <stop offset="100%" stop-color="#1d4ed8" />
            </linearGradient>
            <filter id="rosetteGoogShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#3b82f6" flood-opacity="0.35" />
            </filter>
          </defs>
          <path d="M34 58 L20 102 L34 94 L46 102 L44 60 Z" fill="url(#ribbonGoog1)" opacity="0.95" />
          <path d="M58 58 L46 102 L58 94 L72 102 L58 60 Z" fill="url(#ribbonGoog2)" />
          <path d="M46 6 L52 9.5 L58 7.5 L63 12.5 L69 12 L72 18 L78 19 L79 26 L85 29 L84 36 L89 40 L86 47 L89 54 L84 58 L85 65 L79 68 L78 75 L72 76 L69 82 L63 81.5 L58 86.5 L52 84.5 L46 88 L40 84.5 L34 86.5 L29 81.5 L23 82 L20 76 L14 75 L13 68 L7 65 L8 58 L3 54 L6 47 L3 40 L8 36 L7 29 L13 26 L14 19 L20 18 L23 12 L29 12.5 L34 7.5 L40 9.5 Z" fill="url(#rosetteGoog)" filter="url(#rosetteGoogShadow)" stroke="#1e40af" stroke-width="1.2" />
          <circle cx="46" cy="47" r="33" fill="#1e3a8a" stroke="#bfdbfe" stroke-width="1.5" stroke-dasharray="2 2" />
          <circle cx="46" cy="47" r="28" fill="#0f172a" stroke="#60a5fa" stroke-width="2" />
          <g transform="translate(31, 32) scale(0.64)">
            <path d="M46.1 24.5 C46.1 22.8 45.9 21.3 45.6 19.8 L23.5 19.8 L23.5 28.7 L36.2 28.7 C35.7 31.6 33.9 34 31.3 35.7 L31.3 41.7 L39 41.7 C43.5 37.5 46.1 31.4 46.1 24.5 Z" fill="#4285F4" />
            <path d="M23.5 47.5 C29.8 47.5 35.1 45.4 39 41.7 L31.3 35.7 C29.2 37.1 26.5 38 23.5 38 C17.4 38 12.2 33.9 10.3 28.4 L2.4 28.4 L2.4 34.5 C6.3 42.2 14.3 47.5 23.5 47.5 Z" fill="#34A853" />
            <path d="M10.3 28.4 C9.8 26.9 9.5 25.2 9.5 23.5 C9.5 21.8 9.8 20.1 10.3 18.6 L10.3 12.5 L2.4 12.5 C0.9 15.5 0 19.4 0 23.5 C0 27.6 0.9 31.5 2.4 34.5 L10.3 28.4 Z" fill="#FBBC05" />
            <path d="M23.5 9 C26.9 9 30 10.2 32.4 12.5 L39.1 5.8 C35.1 2.1 29.8 0 23.5 0 C14.3 0 6.3 5.3 2.4 13 L10.3 19.1 C12.2 13.6 17.4 9 23.5 9 Z" fill="#EA4335" />
          </g>
        </svg>
      `;
    }

    // Default: Golden Orange Python Rosette (Exact match with user's uploaded image)
    return `
      <svg class="cert-rosette-svg" width="88" height="102" viewBox="0 0 92 106" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="rosetteGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fbbf24" />
            <stop offset="45%" stop-color="#f59e0b" />
            <stop offset="100%" stop-color="#d97706" />
          </linearGradient>
          <linearGradient id="ribbonGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ea580c" />
            <stop offset="100%" stop-color="#c2410c" />
          </linearGradient>
          <linearGradient id="ribbonGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f97316" />
            <stop offset="100%" stop-color="#ea580c" />
          </linearGradient>
          <filter id="rosetteShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#ea580c" flood-opacity="0.35" />
          </filter>
        </defs>
        <path d="M34 58 L20 102 L34 94 L46 102 L44 60 Z" fill="url(#ribbonGrad1)" opacity="0.95" />
        <path d="M58 58 L46 102 L58 94 L72 102 L58 60 Z" fill="url(#ribbonGrad2)" />
        <path d="M46 6 L52 9.5 L58 7.5 L63 12.5 L69 12 L72 18 L78 19 L79 26 L85 29 L84 36 L89 40 L86 47 L89 54 L84 58 L85 65 L79 68 L78 75 L72 76 L69 82 L63 81.5 L58 86.5 L52 84.5 L46 88 L40 84.5 L34 86.5 L29 81.5 L23 82 L20 76 L14 75 L13 68 L7 65 L8 58 L3 54 L6 47 L3 40 L8 36 L7 29 L13 26 L14 19 L20 18 L23 12 L29 12.5 L34 7.5 L40 9.5 Z" fill="url(#rosetteGold)" filter="url(#rosetteShadow)" stroke="#d97706" stroke-width="1.2" />
        <circle cx="46" cy="47" r="33" fill="#b45309" stroke="#fef3c7" stroke-width="1.5" stroke-dasharray="2 2" />
        <circle cx="46" cy="47" r="28" fill="#0f172a" stroke="#f59e0b" stroke-width="2" />
        <g transform="translate(32, 33) scale(0.68)">
          <path d="M20.2 0.3 C10.8 0.3 11.4 4.4 11.4 4.4 L11.4 8.7 L20.5 8.7 L20.5 10 L6.8 10 C6.8 10 0 9.2 0 18.6 C0 28 5.9 27.6 5.9 27.6 L9.5 27.6 L9.5 22.8 C9.5 17.3 14 17.5 14 17.5 L23.2 17.5 C27.5 17.5 27.2 13.5 27.2 13.5 L27.2 4.4 C27.2 4.4 28 0.3 20.2 0.3 Z M15.2 3.1 C16.5 3.1 17.5 4.1 17.5 5.4 C17.5 6.7 16.5 7.7 15.2 7.7 C13.9 7.7 12.9 6.7 12.9 5.4 C12.9 4.1 13.9 3.1 15.2 3.1 Z" fill="#38bdf8" />
          <path d="M20.8 41 C30.2 41 29.6 36.9 29.6 36.9 L29.6 32.6 L20.5 32.6 L20.5 31.3 L34.2 31.3 C34.2 31.3 41 32.1 41 22.7 C41 13.3 35.1 13.7 35.1 13.7 L31.5 13.7 L31.5 18.5 C31.5 24 27 23.8 27 23.8 L17.8 23.8 C13.5 23.8 13.8 27.8 13.8 27.8 L13.8 36.9 C13.8 36.9 13 41 20.8 41 Z M25.8 38.2 C24.5 38.2 23.5 37.2 23.5 35.9 C23.5 34.6 24.5 33.6 25.8 33.6 C27.1 33.6 28.1 34.6 28.1 35.9 C28.1 37.2 27.1 38.2 25.8 38.2 Z" fill="#fbbf24" />
        </g>
      </svg>
    `;
  }

  renderCertifications() {
    const mount = document.getElementById('certificatesMount');
    if (!mount) return;

    const { certifications } = this.data;
    const items = certifications.items || [];
    this.certTotalSlides = items.length;
    this.certCurrentSlide = 0;

    const slidesHtml = items.map((c, idx) => `
      <div class="cert-slide-item" data-index="${idx}">
        <div class="cert-image-display" data-full-img="${c.image}" title="Click to view full certificate">
          <img src="${c.image}" alt="${c.title}" class="cert-showcase-img" loading="lazy" />
        </div>
      </div>
    `).join('');

    const dotsHtml = items.map((_, idx) => `
      <button 
        type="button" 
        class="cert-dot-btn ${idx === 0 ? 'active' : ''}" 
        data-slide-index="${idx}"
        aria-label="Go to credential slide ${idx + 1}"
      >
        <span class="dot-shape"></span>
      </button>
    `).join('');

    mount.innerHTML = `
      <div class="cert-gallery-shell">
        <div class="cert-header-block">
          <h2 class="cert-pill-tag" id="certificates-title">
            <span class="cert-pill-dot" aria-hidden="true"></span>
            <span>${certifications.sectionTag}</span>
          </h2>
          ${certifications.subtitle ? `<p class="cert-main-subtitle">${certifications.subtitle}</p>` : ''}
        </div>

        <div class="cert-carousel-row">
          <button type="button" class="cert-nav-arrow cert-nav-prev" id="certPrevBtn" aria-label="Previous credential">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <div class="cert-card-outer" id="certCardOuter">
            <div class="cert-card-inner">
              <div class="cert-track" id="certSlideTrack">
                ${slidesHtml}
              </div>
            </div>
          </div>

          <button type="button" class="cert-nav-arrow cert-nav-next" id="certNextBtn" aria-label="Next credential">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>

        <div class="cert-gallery-footer">
          <div class="cert-dots-capsule" id="certDotsCapsule" role="tablist" aria-label="Slide indicators">
            ${dotsHtml}
          </div>
          <div class="cert-counter-display">
            <span id="certCurrentIndex">01</span> <span class="cert-counter-total">/ ${String(items.length).padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      <!-- Full Certificate Lightbox Modal -->
      <div id="certLightbox" class="cert-lightbox-overlay" aria-hidden="true">
        <div class="cert-lightbox-content">
          <button type="button" class="cert-lightbox-close" id="certLightboxClose" aria-label="Close certificate preview">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <img id="certLightboxImg" src="" alt="Full Certificate View" class="cert-lightbox-img" />
        </div>
      </div>
    `;

    this.bindCertGallerySlider();
  }

  bindCertGallerySlider() {
    const track = document.getElementById('certSlideTrack');
    const prevBtn = document.getElementById('certPrevBtn');
    const nextBtn = document.getElementById('certNextBtn');
    const dots = document.querySelectorAll('.cert-dot-btn');
    const counter = document.getElementById('certCurrentIndex');
    const outer = document.getElementById('certCardOuter');

    if (!track || !this.certTotalSlides) return;

    const goToSlide = (idx) => {
      this.certCurrentSlide = (idx + this.certTotalSlides) % this.certTotalSlides;
      track.style.transform = `translateX(-${this.certCurrentSlide * 100}%)`;

      if (counter) {
        counter.textContent = String(this.certCurrentSlide + 1).padStart(2, '0');
      }

      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === this.certCurrentSlide);
      });
    };

    if (prevBtn) {
      prevBtn.onclick = () => {
        resetAutoSlide();
        goToSlide(this.certCurrentSlide - 1);
      };
    }

    if (nextBtn) {
      nextBtn.onclick = () => {
        resetAutoSlide();
        goToSlide(this.certCurrentSlide + 1);
      };
    }

    dots.forEach((dot) => {
      dot.onclick = () => {
        resetAutoSlide();
        const idx = parseInt(dot.getAttribute('data-slide-index'), 10);
        goToSlide(idx);
      };
    });

    // Auto-slide Timer (5 seconds)
    let autoInterval;
    const startAutoSlide = () => {
      stopAutoSlide();
      autoInterval = setInterval(() => {
        goToSlide(this.certCurrentSlide + 1);
      }, 5000);
    };

    const stopAutoSlide = () => {
      if (autoInterval) clearInterval(autoInterval);
    };

    const resetAutoSlide = () => {
      stopAutoSlide();
      startAutoSlide();
    };

    if (outer) {
      outer.addEventListener('mouseenter', stopAutoSlide);
      outer.addEventListener('mouseleave', startAutoSlide);

      // Touch Swipe Support for Mobile
      let touchStartX = 0;
      let touchEndX = 0;

      outer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoSlide();
      }, { passive: true });

      outer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 40) {
          if (diff > 0) {
            goToSlide(this.certCurrentSlide + 1);
          } else {
            goToSlide(this.certCurrentSlide - 1);
          }
        }
        startAutoSlide();
      }, { passive: true });
    }

    // Lightbox Functionality
    const lightbox = document.getElementById('certLightbox');
    const lightboxImg = document.getElementById('certLightboxImg');
    const lightboxClose = document.getElementById('certLightboxClose');
    const imageFrames = document.querySelectorAll('.cert-image-frame');

    imageFrames.forEach((frame) => {
      frame.addEventListener('click', (e) => {
        e.stopPropagation();
        stopAutoSlide();
        const fullImgSrc = frame.getAttribute('data-full-img');
        if (lightbox && lightboxImg && fullImgSrc) {
          lightboxImg.src = fullImgSrc;
          lightbox.classList.add('active');
          lightbox.setAttribute('aria-hidden', 'false');
        }
      });
    });

    const closeLightbox = () => {
      if (lightbox) {
        lightbox.classList.remove('active');
        lightbox.setAttribute('aria-hidden', 'true');
        startAutoSlide();
      }
    };

    if (lightboxClose) {
      lightboxClose.addEventListener('click', closeLightbox);
    }

    if (lightbox) {
      lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
          closeLightbox();
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox && lightbox.classList.contains('active')) {
        closeLightbox();
      }
    });

    startAutoSlide();
  }

  bindCertFilters() {
    // Retained for backward-compatibility with init()
    this.bindCertGallerySlider();
  }

  // 8. Contact Section (Animated Form & Channels)
  renderContact() {
    const mount = document.getElementById('contactMount');
    if (!mount) return;

    const { contact, profile } = this.data;

    // Social Profiles - Modern Circular Icon Buttons (Ref. Image Style)
    const socialIconsHtml = contact.social.map(s => `
      <a 
        href="${s.url}" 
        target="_blank" 
        rel="noopener noreferrer" 
        class="contact-social-circle-btn" 
        data-platform="${s.platform.toLowerCase()}" 
        aria-label="${profile.name}'s ${s.platform} (${s.handle})"
        title="${s.platform}: ${s.handle}"
      >
        ${this.getIconSvg(s.icon)}
      </a>
    `).join('');

    mount.innerHTML = `
      <h2 class="section-tag" id="contact-title">${contact.sectionTag}</h2>
      ${contact.subtitle ? `<p class="section-subtitle">${contact.subtitle}</p>` : ''}

      <div class="contact-master-container">
        <div class="contact-grid">
          <!-- Left Column: Unified Contact Information Card (Ref. Image Design) -->
          <div class="contact-info-column">
            <div class="contact-info-card animated-card">
              <div class="contact-card-ambient" aria-hidden="true"></div>

              <div class="contact-info-header">
                <h3 class="contact-info-title">${contact.infoCardTitle || 'Contact Information'}</h3>
                <p class="contact-info-description">${contact.infoCardDescription || 'Feel free to reach out via email or through social platforms. I typically respond within 24 hours.'}</p>
              </div>

              <!-- Contact Items List -->
              <div class="contact-items-list">
                <!-- 1. Email -->
                <div class="contact-info-item">
                  <div class="info-icon-circle" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                    </svg>
                  </div>
                  <div class="info-item-content">
                    <span class="info-item-label">EMAIL</span>
                    <div class="info-email-row">
                      <a href="mailto:${contact.email}" class="info-item-value info-item-link" title="Send email to ${contact.email}">${contact.email}</a>
                      <button 
                        type="button" 
                        class="info-copy-email-btn" 
                        id="copyEmailBtn" 
                        data-copy="${contact.email}" 
                        aria-label="Copy email address"
                        title="Copy email to clipboard"
                      >
                        <svg class="copy-icon-idle" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        <span class="copy-text">Copy</span>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- 2. Availability -->
                <div class="contact-info-item">
                  <div class="info-icon-circle" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  </div>
                  <div class="info-item-content">
                    <span class="info-item-label">AVAILABILITY</span>
                    <span class="info-item-value">${contact.availability || 'Full-time • Freelance Projects'}</span>
                  </div>
                </div>

                <!-- 3. Location -->
                <div class="contact-info-item">
                  <div class="info-icon-circle" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                  <div class="info-item-content">
                    <span class="info-item-label">LOCATION</span>
                    <span class="info-item-value">${contact.locationDisplay || 'India • Available Worldwide (Remote)'}</span>
                  </div>
                </div>
              </div>

              <!-- Social Media Icon Buttons (Ref. Image Style) -->
              <div class="contact-social-dock" role="list">
                ${socialIconsHtml}
              </div>
            </div>
          </div>

          <!-- Right Column: Interactive Animated Contact Form -->
          <div class="contact-form-column">
            <div class="card contact-form-card animated-form-wrapper">
              <div class="form-header-clean">
                <h3 class="form-title-clean">Send a Message</h3>
                <span class="form-status-dot-wrap">
                  <span class="pulse-beacon" aria-hidden="true"></span>
                  <span class="form-status-text">Online</span>
                </span>
              </div>

              <form class="contact-form animated-form" id="contactForm" novalidate>
                <!-- Row: Name and Email -->
                <div class="form-row-2">
                  <!-- Name Input -->
                  <div class="form-group animated-field" data-field="name">
                    <label class="form-label" for="userName">
                      <span>Your Name</span>
                      <span class="required-mark" aria-hidden="true">*</span>
                    </label>
                    <div class="input-container">
                      <span class="input-icon" aria-hidden="true">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </span>
                      <input 
                        type="text" 
                        id="userName" 
                        name="name" 
                        class="form-input" 
                        placeholder="e.g. Alex Mercer" 
                        required 
                        autocomplete="name"
                        aria-required="true"
                      >
                      <span class="focus-glow-line" aria-hidden="true"></span>
                    </div>
                    <span class="field-error-msg" id="nameErrorMsg" aria-live="polite"></span>
                  </div>

                  <!-- Email Input -->
                  <div class="form-group animated-field" data-field="email">
                    <label class="form-label" for="userEmail">
                      <span>Email Address</span>
                      <span class="required-mark" aria-hidden="true">*</span>
                    </label>
                    <div class="input-container">
                      <span class="input-icon" aria-hidden="true">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                      </span>
                      <input 
                        type="email" 
                        id="userEmail" 
                        name="email" 
                        class="form-input" 
                        placeholder="e.g. alex@enterprise.com" 
                        required 
                        autocomplete="email"
                        aria-required="true"
                      >
                      <span class="focus-glow-line" aria-hidden="true"></span>
                    </div>
                    <span class="field-error-msg" id="emailErrorMsg" aria-live="polite"></span>
                  </div>
                </div>

                <!-- Subject Input -->
                <div class="form-group animated-field" data-field="subject">
                  <label class="form-label" for="userSubject">
                    <span>Subject</span>
                    <span class="required-mark" aria-hidden="true">*</span>
                  </label>
                  <div class="input-container">
                    <span class="input-icon" aria-hidden="true">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                        <polyline points="2 17 12 22 22 17"></polyline>
                        <polyline points="2 12 12 17 22 12"></polyline>
                      </svg>
                    </span>
                    <input 
                      type="text" 
                      id="userSubject" 
                      name="subject" 
                      class="form-input" 
                      placeholder="e.g. Project Inquiry, Hiring Collaboration" 
                      required
                      aria-required="true"
                    >
                    <span class="focus-glow-line" aria-hidden="true"></span>
                  </div>
                  <span class="field-error-msg" id="subjectErrorMsg" aria-live="polite"></span>
                </div>

                <!-- Message Details -->
                <div class="form-group animated-field" data-field="message">
                  <div class="label-row-between">
                    <label class="form-label" for="userMessage">
                      <span>Message</span>
                      <span class="required-mark" aria-hidden="true">*</span>
                    </label>
                    <span class="char-counter" id="charCounter">0 / 1000</span>
                  </div>
                  <div class="input-container textarea-container">
                    <textarea 
                      id="userMessage" 
                      name="message" 
                      class="form-textarea" 
                      rows="3" 
                      maxlength="1000"
                      placeholder="Briefly describe your objectives, scope, or timeline..." 
                      required
                      aria-required="true"
                    ></textarea>
                    <span class="focus-glow-line" aria-hidden="true"></span>
                  </div>
                  <span class="field-error-msg" id="messageErrorMsg" aria-live="polite"></span>
                </div>

                <!-- Animated Submit Button -->
                <button type="submit" class="btn-touch btn-touch-orange btn-submit animated-submit" id="contactSubmitBtn">
                  <span class="btn-submit-text" id="submitBtnText">Transmit Message</span>
                  <span class="btn-icon-circle submit-icon-circle" aria-hidden="true">
                    <!-- Standard Plane/Arrow SVG -->
                    <svg class="icon-submit-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                    <!-- Spinner SVG (Active on Submit) -->
                    <svg class="icon-submit-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
                      <path d="M12 2a10 10 0 0 1 10 10"></path>
                    </svg>
                    <!-- Checkmark SVG (Active on Success) -->
                    <svg class="icon-submit-check" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Footer Dynamic Copyright
  renderFooter() {
    const footerLeft = document.querySelector('.footer-left');
    if (footerLeft && this.data && this.data.profile) {
      const year = new Date().getFullYear();
      footerLeft.innerHTML = `
        <div>&copy; ${year} ${this.data.profile.name}. All rights reserved.</div>
        <div>Crafted with precision &amp; smooth scroll kinematics.</div>
      `;
    }
  }
}

window.PortfolioRenderer = PortfolioRenderer;
