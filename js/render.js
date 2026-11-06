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
          <div class="hero-status-badge" role="status" aria-label="Current availability status">
            <span class="status-pulse-dot" aria-hidden="true"></span>
            <span class="status-badge-text">${profile.status}</span>
            <span class="status-badge-sub">${profile.statusSubtitle}</span>
          </div>

          <!-- 2. Monospace Micro Tag -->
          <div class="hero-code-tag" aria-hidden="true">
            <span>//</span> SOFTWARE ARCHITECT &amp; UI ENGINEER
          </div>

          <!-- 3. Primary Grand Name & Job Title -->
          <h1 class="hero-name-title">
            ${profile.name}
          </h1>

          <div class="hero-subheading">
            <span>Full Stack Developer</span>
            <span style="color: #71717a;">&amp;</span>
            <span class="hero-subheading-accent">UI Engineer</span>
          </div>

          <!-- 4. Short Introduction -->
          <p class="hero-intro-text">
            ${profile.heroTagline}
          </p>

          <!-- 5. Hero CTA Actions (Download Resume, Contact Me & Socials) -->
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

            <!-- AI Resume Sync Button -->
            <button 
              type="button" 
              class="hero-btn-contact btn-open-resume-modal" 
              data-action="open-resume-modal"
              aria-label="Upload resume and dynamically sync portfolio using AI"
              title="AI Resume Auto-Sync"
              style="cursor: pointer; background: rgba(255, 87, 34, 0.1); border-color: rgba(255, 87, 34, 0.35); color: #ff8a65;"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <span>AI Sync</span>
            </button>

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

        <!-- Right: Professional Portrait Card with Ambient Glow -->
        <div class="hero-visual-block">
          <div class="hero-photo-wrapper">
            <div class="hero-photo-glow" aria-hidden="true"></div>
            <div class="hero-photo-card">
              <img 
                src="${profile.avatarUrl}" 
                alt="${profile.name} — ${profile.title}" 
                class="hero-photo" 
                width="340" 
                height="340" 
                loading="eager"
                onerror="this.onerror=null; this.src='assets/profile-avatar.svg';"
              />
              <div class="hero-photo-overlay" aria-hidden="true"></div>
              
              <!-- Floating Pill Badges -->
              <div class="hero-photo-badge" aria-hidden="true">
                <span class="badge-dot"></span>
                <span>Open to Work</span>
              </div>
              <div class="hero-photo-badge hero-photo-badge-left" aria-hidden="true">
                <span class="badge-icon">&lt;/&gt;</span>
                <span>Full Stack &amp; UI</span>
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
      <div class="section-tag">${about.sectionTag}</div>
      <h2 class="section-title" id="about-title">${about.title}</h2>

      <div class="about-grid">
        <!-- Biography Story Card -->
        <article class="card about-story-card">
          <div class="status-indicator">
            <span class="status-dot" aria-hidden="true"></span>
            <span class="status-text">${profile.status}</span>
          </div>

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

  // 3. Technical Skills Section
  renderSkills() {
    const mount = document.getElementById('skillsMount');
    if (!mount) return;

    const { skills } = this.data;

    const cardsHtml = skills.categories.map(cat => {
      const pillsHtml = cat.items.map(item => `
        <span class="skill-pill" title="${item.level}">
          <strong>${item.name}</strong> &bull; ${item.badge}
        </span>
      `).join('');

      return `
        <article class="card skill-card">
          <div class="skill-card-top">
            <div class="skill-icon-wrap" aria-hidden="true">
              ${this.getIconSvg(cat.icon)}
            </div>
            <h3 class="skill-category-title">${cat.name}</h3>
            <span class="skill-card-badge">${cat.items.length} Techs</span>
          </div>
          <p class="skill-category-desc">
            ${cat.description}
          </p>
          <div class="skill-pills">
            ${pillsHtml}
          </div>
        </article>
      `;
    }).join('');

    mount.innerHTML = `
      <div class="section-tag">${skills.sectionTag}</div>
      <h2 class="section-title" id="skills-title">${skills.title}</h2>
      <p class="section-subtitle">${skills.subtitle}</p>

      <div class="skills-grid">
        ${cardsHtml}
      </div>
    `;
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
          <div class="behind-tag">${projects.sectionTag}</div>
          <h2 class="behind-main-title" id="projects-title">${projects.title}</h2>
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
      <div class="section-tag">${experience.sectionTag}</div>
      <h2 class="section-title" id="experience-title">${experience.title}</h2>
      <p class="section-subtitle">${experience.subtitle}</p>

      <div class="experience-timeline">
        <div class="timeline-line" aria-hidden="true"></div>
        ${timelineHtml}
      </div>
    `;
  }

  // 6. Education Section
  renderEducation() {
    const mount = document.getElementById('educationMount');
    if (!mount) return;

    const { education } = this.data;

    const cardsHtml = education.degrees.map(deg => {
      const highlightsHtml = deg.highlights.map(h => `
        <li class="edu-highlight-item">${h}</li>
      `).join('');

      const tagsHtml = deg.skillsGained.map(s => `<span class="edu-tag">${s}</span>`).join('');

      return `
        <article class="edu-card">
          <div class="edu-card-top">
            <span class="edu-year-badge">${deg.period}</span>
            <span class="edu-score-badge">${deg.cgpa}</span>
          </div>

          <h3 class="edu-degree-title">${deg.degree}</h3>
          <p class="edu-college-name">${deg.institution}</p>
          <p class="edu-description">${deg.honors}</p>

          <ul class="edu-highlights" aria-label="Key highlights">
            ${highlightsHtml}
          </ul>

          <div class="edu-tags" aria-label="Core competencies">
            ${tagsHtml}
          </div>
        </article>
      `;
    }).join('');

    mount.innerHTML = `
      <div class="section-tag">${education.sectionTag}</div>
      <h2 class="section-title" id="education-title">${education.title}</h2>
      <p class="section-subtitle">${education.subtitle}</p>

      <div class="education-grid">
        ${cardsHtml}
      </div>
    `;
  }

  // 7. Certifications & Achievements Section
  renderCertifications() {
    const mount = document.getElementById('certificatesMount');
    if (!mount) return;

    const { certifications } = this.data;

    const filterButtonsHtml = certifications.categories.map(cat => {
      const count = cat.id === 'all' 
        ? certifications.items.length 
        : certifications.items.filter(i => i.category === cat.id).length;

      return `
        <button 
          type="button" 
          class="cert-filter-btn ${this.activeCertCategory === cat.id ? 'active' : ''}" 
          data-filter="${cat.id}"
        >
          <span class="cert-filter-dot" aria-hidden="true"></span>
          <span>${cat.name}</span>
          <span class="cert-filter-count">${count}</span>
        </button>
      `;
    }).join('');

    const filteredItems = this.activeCertCategory === 'all'
      ? certifications.items
      : certifications.items.filter(i => i.category === this.activeCertCategory);

    const cardsHtml = filteredItems.map(c => `
      <article class="cert-card" data-category="${c.category}">
        <div class="cert-card-top">
          <span class="cert-badge-pill">${c.badge}</span>
          <span class="cert-year-tag">${c.period}</span>
        </div>

        <h3 class="cert-title">${c.title}</h3>
        <div class="cert-issuer-row">
          <span class="cert-issuer">Issued by: <strong>${c.issuer}</strong></span>
        </div>
        <p class="cert-desc">${c.description}</p>

        <div class="cert-card-footer">
          <div class="cert-id-tag">
            <span>ID:</span>
            <code>${c.credentialId}</code>
          </div>

          <a 
            href="${c.verificationUrl}" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="cert-verify-btn" 
            aria-label="Verify ${c.title} credential"
          >
            <span>Verify</span>
            ${this.getIconSvg('external')}
          </a>
        </div>
      </article>
    `).join('');

    mount.innerHTML = `
      <div class="section-tag">${certifications.sectionTag}</div>
      <h2 class="section-title" id="certificates-title">${certifications.title}</h2>
      <p class="section-subtitle">${certifications.subtitle}</p>

      <div class="cert-filter-bar" role="tablist" aria-label="Credential filters">
        ${filterButtonsHtml}
      </div>

      <div class="certs-grid">
        ${cardsHtml}
      </div>
    `;
  }

  bindCertFilters() {
    const mount = document.getElementById('certificatesMount');
    if (!mount || this._certFiltersBound) return;
    this._certFiltersBound = true;

    mount.addEventListener('click', (e) => {
      const btn = e.target.closest('.cert-filter-btn');
      if (!btn) return;

      const filter = btn.getAttribute('data-filter');
      if (filter === this.activeCertCategory) return;

      this.activeCertCategory = filter;
      this.renderCertifications();
    });
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
      <div class="section-tag">${contact.sectionTag}</div>
      <h2 class="section-title" id="contact-title">${contact.title}</h2>
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
