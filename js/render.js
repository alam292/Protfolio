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

  // Real Technology Icon & Brand Resolver for Project Tech Chips
  getProjectTechIcon(techName) {
    if (!techName) {
      return {
        brandColor: '#ff5722',
        glowColor: 'rgba(255, 87, 34, 0.45)',
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`
      };
    }

    // 1. Check if global window.SkillsShowcase provides the official brand SVG
    if (typeof window !== 'undefined' && window.SkillsShowcase && typeof window.SkillsShowcase.getSkillIconEntry === 'function') {
      const entry = window.SkillsShowcase.getSkillIconEntry(null, techName);
      if (entry && entry.svg) return entry;
    }

    const clean = techName.toLowerCase().replace(/[^a-z0-9]/g, '');

    // 2. Comprehensive built-in SVG registry for guaranteed visual fidelity
    const registry = {
      react: {
        brandColor: '#61DAFB',
        glowColor: 'rgba(97, 218, 251, 0.55)',
        svg: `<svg viewBox="-11.5 -10.23174 23 20.46348" width="100%" height="100%" aria-hidden="true"><circle cx="0" cy="0" r="2.05" fill="#61DAFB"/><g stroke="#61DAFB" stroke-width="1" fill="none"><ellipse rx="11" ry="4.2"/><ellipse rx="11" ry="4.2" transform="rotate(60)"/><ellipse rx="11" ry="4.2" transform="rotate(120)"/></g></svg>`
      },
      fastapi: {
        brandColor: '#05998B',
        glowColor: 'rgba(5, 153, 139, 0.55)',
        svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><circle cx="64" cy="64" r="62" fill="#05998B"/><path fill="#FFFFFF" d="M72 16L32 72h28l-8 40 44-60H68l12-36h-8z"/></svg>`
      },
      postgresql: {
        brandColor: '#336791',
        glowColor: 'rgba(51, 103, 145, 0.55)',
        svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><path fill="#336791" d="M64 8.5C33.4 8.5 8.5 33.4 8.5 64s24.9 55.5 55.5 55.5S119.5 94.6 119.5 64 94.6 8.5 64 8.5zm27.8 71.9c-4.1 6.5-11.4 11.2-19.8 12.8 4.2-7.2 4.6-15.6 1.1-23.1-3.6-7.8-10.6-13.4-19-15.5-3.5-.9-7.2-1.2-10.8-.9 1.1-6.1 4.5-11.4 9.6-14.8 6.5-4.3 14.6-5.3 22.3-2.7 7.7 2.6 13.9 8.5 17 16.2 3.1 7.7 2.8 16.4-.4 28zm-37.1-3.2c3.5 7.5 3.1 15.9-1.1 23.1-7.9-1.5-14.9-5.9-19-12-3.8-5.7-4.6-12.8-2.3-19.6 2.3-6.8 7.5-12.1 14.2-14.7.7 7.7 4.1 15.7 8.2 23.2z"/></svg>`
      },
      sqlalchemy: {
        brandColor: '#D71F00',
        glowColor: 'rgba(215, 31, 0, 0.55)',
        svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><path fill="#D71F00" d="M48 20h32v12h-6v16.8l28.6 44.5c4.8 7.4.4 18.7-8.6 18.7H34c-9 0-13.4-11.3-8.6-18.7L54 48.8V32h-6V20z"/><path fill="#FFFFFF" d="M42 96h44c3.3 0 5-3.8 2.8-6.4L74 66H54L39.2 89.6c-2.2 2.6-.5 6.4 2.8 6.4z"/><circle cx="64" cy="82" r="6" fill="#D71F00"/><circle cx="54" cy="74" r="4" fill="#D71F00"/><circle cx="72" cy="76" r="3.5" fill="#D71F00"/></svg>`
      },
      restapi: {
        brandColor: '#6366F1',
        glowColor: 'rgba(99, 102, 241, 0.55)',
        svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><circle cx="64" cy="64" r="56" fill="none" stroke="#6366F1" stroke-width="7" stroke-dasharray="8 6"/><rect x="22" y="44" width="84" height="40" rx="10" fill="#6366F1"/><text x="64" y="69" font-family="monospace" font-size="22" font-weight="900" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">API</text><circle cx="28" cy="64" r="4.5" fill="#A5B4FC"/><circle cx="100" cy="64" r="4.5" fill="#A5B4FC"/><path d="M64 16v18M64 94v18M16 64h18M94 64h18" stroke="#6366F1" stroke-width="5" stroke-linecap="round"/></svg>`
      },
      tailwindcss: {
        brandColor: '#38BDF8',
        glowColor: 'rgba(56, 189, 248, 0.55)',
        svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><path fill="#38BDF8" d="M64 25.6c-21.3 0-34.7 10.7-40 32 8-10.7 17.3-14.7 28-12 6.1 1.5 10.4 5.9 15.3 10.8C75.2 64.3 84.4 73.6 104 73.6c21.3 0 34.7-10.7 40-32-8 10.7-17.3 14.7-28 12-6.1-1.5-10.4-5.9-15.3-10.8C92.8 34.9 83.6 25.6 64 25.6zm-40 48c-21.3 0-34.7 10.7-40 32 8-10.7 17.3-14.7 28-12 6.1 1.5 10.4 5.9 15.3 10.8C35.2 112.3 44.4 121.6 64 121.6c21.3 0 34.7-10.7 40-32-8 10.7-17.3 14.7-28 12-6.1-1.5-10.4-5.9-15.3-10.8C52.8 82.9 43.6 73.6 24 73.6z"/></svg>`
      },
      python: {
        brandColor: '#3776AB',
        glowColor: 'rgba(55, 118, 171, 0.55)',
        svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><path fill="#3776AB" d="M63.7 3.5c-15.5 0-25.2 6.8-25.2 20.3v10.5h25.7v3.5H23.5C9.9 37.8 0 46.8 0 63.6s8.6 25.1 22.2 25.1h8.5v-12c0-15.7 13.4-25.1 28.5-25.1h25.4V38.7c0-14.7-12.7-25.2-27.2-25.2zm-13.8 8.1c3.1 0 5.6 2.5 5.6 5.6s-2.5 5.6-5.6 5.6-5.6-2.5-5.6-5.6 2.5-5.6 5.6-5.6z"/><path fill="#FFD438" d="M64.3 124.5c15.5 0 25.2-6.8 25.2-20.3V93.7H63.8v-3.5h40.7c13.6 0 23.5-9 23.5-25.8s-8.6-25.1-22.2-25.1h-8.5v12c0 15.7-13.4 25.1-28.5 25.1H43.9v12.9c0 14.7 12.7 25.2 27.2 25.2zm13.8-8.1c-3.1 0-5.6-2.5-5.6-5.6s2.5-5.6 5.6-5.6 5.6 2.5 5.6 5.6-2.5 5.6-5.6 5.6z"/></svg>`
      },
      bootstrap: {
        brandColor: '#7952B3',
        glowColor: 'rgba(121, 82, 179, 0.55)',
        svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><path fill="#7952B3" d="M12.9 17.2C10.7 20 9.5 23.9 9.5 28.9v70.2c0 5 1.2 8.9 3.4 11.7 2.2 2.8 5.4 4.2 9.5 4.2h83.2c4.1 0 7.3-1.4 9.5-4.2 2.2-2.8 3.4-6.7 3.4-11.7V28.9c0-5-1.2-8.9-3.4-11.7-2.2-2.8-5.4-4.2-9.5-4.2H22.4c-4.1 0-7.3 1.4-9.5 4.2z"/><path fill="#FFFFFF" d="M42.3 35.8h25.4c6.7 0 11.9 1.4 15.5 4.2 3.6 2.8 5.5 7.1 5.5 12.8 0 3.7-.9 6.8-2.8 9.2-1.9 2.4-4.5 4.1-8 5 4.6.9 8.1 2.8 10.4 5.7 2.3 2.9 3.5 6.7 3.5 11.5 0 6.4-2.1 11.3-6.2 14.7-4.1 3.4-10 5.1-17.5 5.1H42.3V35.8zm14.3 12.2v14.4h10.4c3.2 0 5.6-.6 7.2-1.9 1.6-1.3 2.4-3.2 2.4-5.7 0-2.3-.8-4.1-2.4-5.3-1.6-1.2-4-1.8-7.2-1.8H56.6zm0 25.5v16.7h11.8c3.5 0 6.2-.7 8-2.1 1.8-1.4 2.7-3.6 2.7-6.5 0-2.8-.9-4.9-2.7-6.2-1.8-1.3-4.5-1.9-8-1.9H56.6z"/></svg>`
      },
      javascript: {
        brandColor: '#F7DF1E',
        glowColor: 'rgba(247, 223, 30, 0.55)',
        svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><rect width="128" height="128" rx="18" fill="#F7DF1E"/><path fill="#000000" d="M67.3 102.7c3.1 1.9 7 3.2 10.9 3.2 5.9 0 9.8-2.9 9.8-7.3 0-4.8-4-6.6-10.7-9.5-8.5-3.6-14-8.3-14-17.4 0-8.9 6.8-15.6 17.5-15.6 4.9 0 8.7 1.1 11.7 2.7l-3.3 7.9c-2.4-1.4-5.3-2.3-8.6-2.3-5.2 0-8.5 2.8-8.5 6.6 0 4.3 3.6 6.1 9.9 8.8 9.3 4 14.9 8.5 14.9 18.2 0 10.2-8.1 16.3-19.7 16.3-5.7 0-10.6-1.5-13.6-3.3l3.7-8.3zm-39.7.5c2.7 1.7 6.3 2.7 10 2.7 6.1 0 10.1-3 10.1-11.4V56.6h9.1v37.6c0 14-8 19.9-19.9 19.9-5.4 0-10.4-1.3-13.2-3.1l3.9-7.8z"/></svg>`
      },
      html5: {
        brandColor: '#E34F26',
        glowColor: 'rgba(227, 79, 38, 0.55)',
        svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><path fill="#E34F26" d="M19.1 113.3L8 0h112l-11.1 113.3L64 128l-44.9-14.7z"/><path fill="#EF652A" d="M64 117.8l36.7-12 9.2-94.4H64v106.4z"/><path fill="#EBEBEB" d="M64 53.6H46.1l-1.3-14.3H64V25H30.8l3.7 42.9H64V53.6zm0 35.7l-.2.1-15.4-4.2-1-11H33.1l2 22.2L64 104.5v-15.2z"/><path fill="#FFFFFF" d="M64 53.6h17.9l-1.7 19.2-16.2 4.4v15.2l28.8-8 3.8-45.1H64V25h33.2l-.3 3.6-3.4 39.3H64v-14.3z"/></svg>`
      },
      css3: {
        brandColor: '#1572B6',
        glowColor: 'rgba(21, 114, 182, 0.55)',
        svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><path fill="#1572B6" d="M19.1 113.3L8 0h112l-11.1 113.3L64 128l-44.9-14.7z"/><path fill="#33A9DC" d="M64 117.8l36.7-12 9.2-94.4H64v106.4z"/><path fill="#EBEBEB" d="M64 53.6H46.1l-1.3-14.3H64V25H30.8l3.7 42.9H64V53.6zm0 35.7l-.2.1-15.4-4.2-1-11H33.1l2 22.2L64 104.5v-15.2z"/><path fill="#FFFFFF" d="M64 67.9h16.6l-1.6 17-15 4.1v15.3l27.7-7.7.3-3.6 2.3-25.1.3-3.6.3-3.6H64v-14.3h33.3l-.3 3.6-3.4 39.3H64V67.9zm0-42.9h33.2l.3-3.6.8-9.4H64V25z"/></svg>`
      },
      nodejs: {
        brandColor: '#339933',
        glowColor: 'rgba(51, 153, 51, 0.55)',
        svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><path fill="#339933" d="M64 4.5l55 31.7v63.6L64 123.5 9 99.8V36.2L64 4.5z"/><path fill="#FFFFFF" d="M64 32.5c-15.2 0-23.7 8.5-23.7 18.9 0 17.5 27.2 12.7 27.2 21.6 0 3.7-3.1 5.6-7.8 5.6-5.8 0-11.5-2.8-15.6-6.6l-5.6 7.6c5.5 5.2 13.3 8.3 21.2 8.3 16.4 0 24.3-8.8 24.3-19.5 0-18.4-27.3-13.3-27.3-21.8 0-3.3 2.7-4.9 7.1-4.9 4.8 0 9.7 2.1 13.5 5.2l5.2-7.8c-5-4.2-11.8-6.6-18.5-6.6z"/></svg>`
      },
      docker: {
        brandColor: '#2496ED',
        glowColor: 'rgba(36, 150, 237, 0.55)',
        svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><path fill="#2496ED" d="M124.6 57.5c-2.4-1.7-7.7-2.6-13.8-.7-1.1-6.1-5-11.4-10.8-14.7l-4.1 3.8c4.3 3.9 7 9.5 7.4 15.6-2.4.9-5.1 1.7-8.1 2.3-4.1.8-9.4 1.1-15.2 1.1H12.9c-2.4 0-4.6.6-6.6 1.7-3.9 2.2-6.3 6.3-6.3 10.8 0 18.7 11.2 33.4 29.2 40.5 13.4 5.3 29.2 6.6 44.8 3.8 20.3-3.7 37.6-15.7 45.4-31.8 7.3-1.6 14.1-5.7 18.6-11.7 1.8-2.4 1.4-6.3-3.4-8.8z"/></svg>`
      }
    };

    if (clean.includes('react')) return registry.react;
    if (clean.includes('fastapi')) return registry.fastapi;
    if (clean.includes('postgres')) return registry.postgresql;
    if (clean.includes('sqlalch')) return registry.sqlalchemy;
    if (clean.includes('api') || clean.includes('rest')) return registry.restapi;
    if (clean.includes('tailwind')) return registry.tailwindcss;
    if (clean.includes('python')) return registry.python;
    if (clean.includes('bootstrap')) return registry.bootstrap;
    if (clean.includes('script') || clean.includes('js')) return registry.javascript;
    if (clean.includes('html')) return registry.html5;
    if (clean.includes('css')) return registry.css3;
    if (clean.includes('node')) return registry.nodejs;
    if (clean.includes('docker')) return registry.docker;

    return {
      brandColor: '#ff5722',
      glowColor: 'rgba(255, 87, 34, 0.45)',
      svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`
    };
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

  // Helper to render role subheading with accent styling
  renderSubheading(title) {
    if (!title) {
      return `<span>Full Stack Developer</span> <span style="color: #71717a;">&amp;</span> <span class="hero-subheading-accent">UI Engineer</span>`;
    }
    if (title.includes('|')) {
      const parts = title.split('|').map(s => s.trim());
      return `<span>${parts[0]}</span> <span style="color: #71717a;">·</span> <span class="hero-subheading-accent">${parts.slice(1).join(' · ')}</span>`;
    }
    return `<span>${title}</span>`;
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
            ${this.renderSubheading(profile.title)}
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

        <!-- Right: Pure Transparent Profile Cutout with Smooth Scroll Animation (Zero Extra Elements) -->
        <div class="hero-visual-block" id="heroVisualBlock">
          <div class="hero-image-stage" id="heroImageStage">
            <img 
              src="assets/profile-matloob-transparent.png" 
              alt="${profile.name}" 
              class="hero-transparent-profile-img hero-float-idle"
              id="heroProfileImg"
              loading="eager"
            />
          </div>
        </div>
      </div>

      <!-- Hero Bottom Row: Dynamic Bento Metrics Strip -->
      <div class="hero-bento-metrics">
        ${metricsHtml}
      </div>
    `;

    // Initialize 3D Parallax & Motion Controls
    this.initHeroVisual3D();
  }

  // 3D Parallax & Floating Motion Controller for Hero Transparent Visual
  initHeroVisual3D() {
    const stage = document.getElementById('heroImageStage') || document.getElementById('heroVisualBlock');
    const img = document.getElementById('heroProfileImg');
    if (!stage || !img) return;

    // Smooth Lerp Tilt for Transparent Cutout
    let rect = stage.getBoundingClientRect();
    let isHovering = false;
    let targetRotateX = 0;
    let targetRotateY = 0;
    let currentRotateX = 0;
    let currentRotateY = 0;
    let rafId = null;

    const updateRect = () => {
      rect = stage.getBoundingClientRect();
    };
    window.addEventListener('resize', updateRect, { passive: true });

    const onMouseMove = (e) => {
      isHovering = true;
      img.classList.remove('hero-float-idle');
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;

      // Subtle, refined 3D tilt without clipping
      targetRotateY = (mouseX / (rect.width / 2)) * 6;
      targetRotateX = -(mouseY / (rect.height / 2)) * 6;
    };

    const onMouseEnter = () => {
      updateRect();
      isHovering = true;
      img.classList.remove('hero-float-idle');
    };

    const onMouseLeave = () => {
      isHovering = false;
      targetRotateX = 0;
      targetRotateY = 0;
    };

    // Only attach interactive mouse tracking on pointer-capable devices
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      stage.addEventListener('mousemove', onMouseMove, { passive: true });
      stage.addEventListener('mouseenter', onMouseEnter);
      stage.addEventListener('mouseleave', onMouseLeave);
    }

    // Smooth Lerp Rendering Loop
    const renderLoop = () => {
      currentRotateX += (targetRotateX - currentRotateX) * 0.1;
      currentRotateY += (targetRotateY - currentRotateY) * 0.1;

      if (isHovering || Math.abs(currentRotateX) > 0.04 || Math.abs(currentRotateY) > 0.04) {
        img.style.transform = `perspective(1000px) rotateX(${currentRotateX.toFixed(2)}deg) rotateY(${currentRotateY.toFixed(2)}deg) translateZ(8px)`;
      } else if (!isHovering) {
        if (img.style.transform) {
          img.style.transform = '';
        }
        if (!img.classList.contains('hero-float-idle')) {
          img.classList.add('hero-float-idle');
        }
      }

      rafId = requestAnimationFrame(renderLoop);
    };

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

  // 4. Featured Projects Section (Bilateral Engineering Pipeline Form)
  renderProjects() {
    const mount = document.getElementById('projectsMount');
    if (!mount) return;

    const { projects } = this.data;
    if (!projects || !Array.isArray(projects.items)) return;

    const entriesHtml = projects.items.map((proj, index) => {
      const isEven = index % 2 === 0;
      const sideClass = isEven ? 'project-entry--left-media' : 'project-entry--right-media';
      const hasValidDemo = proj.hasLiveDemo !== false && Boolean(proj.liveDemoUrl) && proj.liveDemoUrl.trim() !== '' && proj.liveDemoUrl !== '#';
      const primaryLink = hasValidDemo ? proj.liveDemoUrl : proj.githubUrl;
      const demoHoverLabel = hasValidDemo ? 'Explore Live System' : 'View Source Code';

      // Tech stack chips with authentic brand SVGs & custom brand glow
      const techChipsHtml = (proj.techStack || []).map(t => {
        const iconEntry = this.getProjectTechIcon(t);
        return `
          <div class="project-tech-chip" style="--brand-color: ${iconEntry.brandColor}; --glow-color: ${iconEntry.glowColor};" title="${t}">
            <span class="project-tech-chip-icon" aria-hidden="true">${iconEntry.svg}</span>
            <span class="project-tech-chip-name">${t}</span>
          </div>
        `;
      }).join('');

      // Media column with large preview, ambient glow, and hover interaction
      const mediaColHtml = `
        <div class="project-media-col">
          <div class="project-preview-stage">
            <div class="project-preview-glow" aria-hidden="true"></div>
            <a href="${primaryLink}" target="_blank" rel="noopener noreferrer" class="project-preview-link" aria-label="Explore ${proj.title}">
              <div class="project-preview-frame">
                <img 
                  src="${proj.image}" 
                  alt="${proj.title} architecture and interface preview" 
                  class="project-preview-img" 
                  loading="lazy" 
                  width="800" 
                  height="500"
                  onerror="this.onerror=null; this.src='assets/project-cloudscale.svg';"
                />
                <div class="project-preview-cinematic-overlay" aria-hidden="true"></div>
                <div class="project-preview-hover-cta" aria-hidden="true">
                  <span class="preview-cta-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="7" y1="17" x2="17" y2="7"></line>
                      <polyline points="7 7 17 7 17 17"></polyline>
                    </svg>
                  </span>
                  <span>${demoHoverLabel}</span>
                </div>
              </div>
            </a>
          </div>
        </div>
      `;

      // Content column with clean typography, animated title, metrics, tech badges & buttons
      const contentColHtml = `
        <div class="project-content-col">
          <div class="project-coord-bar">
            <span class="project-node-id">${proj.number || String(index + 1).padStart(2, '0')}</span>
            <span class="project-coord-sep" aria-hidden="true">&middot;</span>
            <span class="project-category-tag">${proj.category}</span>
            <span class="project-status-indicator">
              <span class="status-pulse-dot" style="width: 6px; height: 6px;" aria-hidden="true"></span>
              <span>Production</span>
            </span>
          </div>

          <h3 class="project-title">
            <a href="${primaryLink}" target="_blank" rel="noopener noreferrer" class="project-title-link">
              <span class="project-title-text">${proj.title}</span>
              <svg class="project-title-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </a>
          </h3>

          <p class="project-desc">${proj.description}</p>

          ${proj.metrics ? `
          <div class="project-metric-row" aria-label="Key Impact: ${proj.metrics}">
            <span class="project-metric-bullet" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
              </svg>
            </span>
            <div class="project-metric-content">
              <span class="project-metric-label">KEY IMPACT:</span>
              <span class="project-metric-text">${proj.metrics}</span>
            </div>
          </div>` : ''}

          <div class="project-tech-row" aria-label="Technologies used">
            <span class="project-tech-header">STACK:</span>
            <div class="project-tech-list">
              ${techChipsHtml}
            </div>
          </div>

          <div class="project-actions-row">
            ${hasValidDemo ? `
            <a href="${proj.liveDemoUrl}" target="_blank" rel="noopener noreferrer" class="btn-touch btn-touch-orange project-btn-demo" aria-label="Launch live demo of ${proj.title}">
              <span>Live Demo</span>
              <span class="btn-icon-circle" aria-hidden="true">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7"></line>
                  <polyline points="7 7 17 7 17 17"></polyline>
                </svg>
              </span>
            </a>` : ''}

            <a href="${proj.githubUrl}" target="_blank" rel="noopener noreferrer" class="btn-project-code" aria-label="View source code of ${proj.title} on GitHub">
              <span class="project-code-icon" aria-hidden="true">${this.getIconSvg('github')}</span>
              <span>Source Code</span>
            </a>
          </div>
        </div>
      `;

      return `
        <article class="project-entry ${sideClass}" data-project-idx="${index}">
          <div class="project-vertex" aria-hidden="true">
            <div class="project-node-circle">
              <span class="project-node-core"></span>
              <span class="project-node-ping"></span>
            </div>
            <div class="project-stem-connector"></div>
          </div>
          ${isEven ? mediaColHtml + contentColHtml : contentColHtml + mediaColHtml}
        </article>
      `;
    }).join('');

    mount.innerHTML = `
      <h2 class="section-tag" id="projects-title">${projects.sectionTag || 'FEATURED WORK'}</h2>
      ${projects.subtitle ? `<p class="section-subtitle">${projects.subtitle}</p>` : ''}

      <div class="projects-pipeline-wrap">
        <div class="projects-pipeline" role="region" aria-label="Featured Engineering Projects Pipeline">
          <div class="projects-sys-header" aria-hidden="true">
            <span class="projects-sys-tag">ENGINEERING_PIPELINE_PROJECTS</span>
            <span class="projects-sys-coords">SYS_AXIS: PRODUCTION_BUILDS (2024 — 2026) <span class="projects-sys-sep">&bull;</span> VERIFIED_CODEBASES</span>
          </div>

          <div class="projects-network">
            <div class="projects-edge-spine" aria-hidden="true"></div>
            ${entriesHtml}
          </div>
        </div>
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
      <div class="cert-slide-item ${idx === 0 ? 'active' : ''}" data-index="${idx}">
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

      const slides = track.querySelectorAll('.cert-slide-item');
      slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === this.certCurrentSlide);
      });

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
