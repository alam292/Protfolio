/**
 * Dynamic Technology Skills Showcase (js/skills-component.js)
 * Reusable React components for presenting a modern, minimalist, animated
 * technology showcase without cards, boxes, borders, or rating bars.
 */

(function () {
  // Official brand SVGs & radiant brand colors for all 30 technologies
  const SKILLS_ICONS_REGISTRY = {
    // 1. Programming Languages
    python: {
      brandColor: '#3776AB',
      glowColor: 'rgba(55, 118, 171, 0.55)',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><path fill="#3776AB" d="M63.7 3.5c-15.5 0-25.2 6.8-25.2 20.3v10.5h25.7v3.5H23.5C9.9 37.8 0 46.8 0 63.6s8.6 25.1 22.2 25.1h8.5v-12c0-15.7 13.4-25.1 28.5-25.1h25.4V38.7c0-14.7-12.7-25.2-27.2-25.2zm-13.8 8.1c3.1 0 5.6 2.5 5.6 5.6s-2.5 5.6-5.6 5.6-5.6-2.5-5.6-5.6 2.5-5.6 5.6-5.6z"/><path fill="#FFD438" d="M64.3 124.5c15.5 0 25.2-6.8 25.2-20.3V93.7H63.8v-3.5h40.7c13.6 0 23.5-9 23.5-25.8s-8.6-25.1-22.2-25.1h-8.5v12c0 15.7-13.4 25.1-28.5 25.1H43.9v12.9c0 14.7 12.7 25.2 27.2 25.2zm13.8-8.1c-3.1 0-5.6-2.5-5.6-5.6s2.5-5.6 5.6-5.6 5.6 2.5 5.6 5.6-2.5 5.6-5.6 5.6z"/></svg>`
    },
    java: {
      brandColor: '#E76F00',
      glowColor: 'rgba(231, 111, 0, 0.55)',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><path fill="#5382A1" d="M46.7 94.3c-1.3.1-2.5-.3-3.6-.8-1.5-.7-2.6-1.9-3.2-3.4-.6-1.5-.6-3.1 0-4.6 2.3-5.7 7.7-10.2 13.9-12 8.7-2.5 18.2-1.2 26.2 3.3 2.1 1.2 3.9 2.9 5.2 4.9 1 1.6 1.3 3.5 1 5.3-.4 1.8-1.5 3.3-3.1 4.2-2.3 1.3-5 1.7-7.7 1.8-9.5.4-19-.8-28.7 1.3z"/><path fill="#E76F00" d="M72.4 46.2c4.4 4.5 5.1 11.2 1.9 16.5-2.7 4.5-7.4 7.4-12.6 8.3-5.2.9-10.7-.2-15-3.3-1.8-1.3-3.3-3-4.3-5-1.5-3.1-1.6-6.8-.2-9.9 1.4-3.1 4-5.6 7.1-7.1 7.1-3.4 16.6-2.8 23.1.5z"/><path fill="#E76F00" d="M60.1 2.8c-2.4 5.9-2.3 12.7.2 18.4 2.1 4.8 5.6 8.8 10.1 11.6 3.1 1.9 6.5 3.3 10.1 4.1-2.6 2.6-5.8 4.6-9.3 5.8-5.6 1.9-11.8 1.9-17.3 0-5.5-1.9-10.1-5.7-13.1-10.8-2.6-4.5-3.4-9.8-2.5-14.9 1-5.7 4.2-10.8 8.8-14.4 4.2-3.3 8.8-5.7 13-9.8z"/><path fill="#5382A1" d="M28.3 115.4c17.5 4.3 36.1 4.5 53.6.5 7.1-1.6 14.1-4 20.6-7.3-3.7 4.7-8.7 8.3-14.4 10.6-12.8 5.1-27.1 5.7-40.2 1.9-7-2-13.6-5.4-19.6-9.7z"/></svg>`
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

    // 2. Frontend Development
    react: {
      brandColor: '#61DAFB',
      glowColor: 'rgba(97, 218, 251, 0.6)',
      svg: `<svg viewBox="-11.5 -10.23174 23 20.46348" width="100%" height="100%" aria-hidden="true"><circle cx="0" cy="0" r="2.05" fill="#61DAFB"/><g stroke="#61DAFB" stroke-width="1" fill="none"><ellipse rx="11" ry="4.2"/><ellipse rx="11" ry="4.2" transform="rotate(60)"/><ellipse rx="11" ry="4.2" transform="rotate(120)"/></g></svg>`
    },
    nextjs: {
      brandColor: '#FFFFFF',
      glowColor: 'rgba(255, 255, 255, 0.45)',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><circle cx="64" cy="64" r="62" fill="currentColor"/><path fill="#000000" d="M64 4C30.9 4 4 30.9 4 64s26.9 60 60 60 60-26.9 60-60S97.1 4 64 4z"/><path fill="#FFFFFF" d="M85.5 89.5L50.7 45.1H43v37.8h7.2V54.4l30.8 39.3c1.5-1.2 3-2.6 4.5-4.2zm-2.3-44.4h7.2v30.4h-7.2V45.1z"/></svg>`
    },
    tailwindcss: {
      brandColor: '#38BDF8',
      glowColor: 'rgba(56, 189, 248, 0.6)',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><path fill="#38BDF8" d="M64 25.6c-21.3 0-34.7 10.7-40 32 8-10.7 17.3-14.7 28-12 6.1 1.5 10.4 5.9 15.3 10.8C75.2 64.3 84.4 73.6 104 73.6c21.3 0 34.7-10.7 40-32-8 10.7-17.3 14.7-28 12-6.1-1.5-10.4-5.9-15.3-10.8C92.8 34.9 83.6 25.6 64 25.6zm-40 48c-21.3 0-34.7 10.7-40 32 8-10.7 17.3-14.7 28-12 6.1 1.5 10.4 5.9 15.3 10.8C35.2 112.3 44.4 121.6 64 121.6c21.3 0 34.7-10.7 40-32-8 10.7-17.3 14.7-28 12-6.1-1.5-10.4-5.9-15.3-10.8C52.8 82.9 43.6 73.6 24 73.6z"/></svg>`
    },
    bootstrap: {
      brandColor: '#7952B3',
      glowColor: 'rgba(121, 82, 179, 0.55)',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><path fill="#7952B3" d="M12.9 17.2C10.7 20 9.5 23.9 9.5 28.9v70.2c0 5 1.2 8.9 3.4 11.7 2.2 2.8 5.4 4.2 9.5 4.2h83.2c4.1 0 7.3-1.4 9.5-4.2 2.2-2.8 3.4-6.7 3.4-11.7V28.9c0-5-1.2-8.9-3.4-11.7-2.2-2.8-5.4-4.2-9.5-4.2H22.4c-4.1 0-7.3 1.4-9.5 4.2z"/><path fill="#FFFFFF" d="M42.3 35.8h25.4c6.7 0 11.9 1.4 15.5 4.2 3.6 2.8 5.5 7.1 5.5 12.8 0 3.7-.9 6.8-2.8 9.2-1.9 2.4-4.5 4.1-8 5 4.6.9 8.1 2.8 10.4 5.7 2.3 2.9 3.5 6.7 3.5 11.5 0 6.4-2.1 11.3-6.2 14.7-4.1 3.4-10 5.1-17.5 5.1H42.3V35.8zm14.3 12.2v14.4h10.4c3.2 0 5.6-.6 7.2-1.9 1.6-1.3 2.4-3.2 2.4-5.7 0-2.3-.8-4.1-2.4-5.3-1.6-1.2-4-1.8-7.2-1.8H56.6zm0 25.5v16.7h11.8c3.5 0 6.2-.7 8-2.1 1.8-1.4 2.7-3.6 2.7-6.5 0-2.8-.9-4.9-2.7-6.2-1.8-1.3-4.5-1.9-8-1.9H56.6z"/></svg>`
    },
    redux: {
      brandColor: '#764ABC',
      glowColor: 'rgba(118, 74, 188, 0.55)',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><path fill="#764ABC" d="M84.2 15.6c-5.7-3.3-12.8-1.4-16.1 4.3l-2.6 4.5c4.7 1.8 9.1 4.3 13.1 7.4l.2-.3c3.3-5.7 1.4-12.8-4.3-16.1l9.7.2zM21.5 51.8c-3.3 5.7-1.4 12.8 4.3 16.1 5.7 3.3 12.8 1.4 16.1-4.3l.2-.3c-1.8-4.7-2.9-9.7-3.3-14.8l-4.5 2.6c-5.7 3.3-12.8 1.4-16.1-4.3l3.3.7zm22.4 48.6c-3.3-5.7-10.4-7.6-16.1-4.3-5.7 3.3-7.6 10.4-4.3 16.1 3.3 5.7 10.4 7.6 16.1 4.3 5.7-3.3 7.6-10.4 4.3-16.1zm60.3-16.1c-5.7-3.3-12.8-1.4-16.1 4.3l-.2.3c1.8 4.7 2.9 9.7 3.3 14.8l4.5-2.6c5.7-3.3 12.8-1.4 16.1 4.3 3.3-5.7 1.4-12.8-4.3-16.1-3.3-4.7-3.3-4.7-3.3-4.7zm1.6-43.2c3.3 5.7 10.4 7.6 16.1 4.3 5.7-3.3 7.6-10.4 4.3-16.1-3.3-5.7-10.4-7.6-16.1-4.3-5.7 3.3-7.6 10.4-4.3 16.1zm-48-22.3c-5.7 3.3-7.6 10.4-4.3 16.1 3.3 5.7 10.4 7.6 16.1 4.3 5.7-3.3 7.6-10.4 4.3-16.1-3.3-5.7-10.4-7.6-16.1-4.3z"/><path fill="#764ABC" d="M64 45.5c-10.2 0-18.5 8.3-18.5 18.5S53.8 82.5 64 82.5 82.5 74.2 82.5 64 74.2 45.5 64 45.5zm0 29c-5.8 0-10.5-4.7-10.5-10.5S58.2 53.5 64 53.5 74.5 58.2 74.5 64 69.8 74.5 64 74.5z"/></svg>`
    },

    // 3. Backend Development
    fastapi: {
      brandColor: '#05998B',
      glowColor: 'rgba(5, 153, 139, 0.6)',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><circle cx="64" cy="64" r="62" fill="#05998B"/><path fill="#FFFFFF" d="M72 16L32 72h28l-8 40 44-60H68l12-36h-8z"/></svg>`
    },
    django: {
      brandColor: '#44B78B',
      glowColor: 'rgba(68, 183, 139, 0.55)',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><rect width="128" height="128" rx="22" fill="#092E20"/><path fill="#44B78B" d="M68.5 25.5h16.2v49.8c0 14.8-7.7 23.3-21.6 23.3-4.5 0-8.5-.7-11.2-1.9l2.8-13.6c1.8.7 3.8 1.1 6.2 1.1 5.9 0 9.1-3.9 9.1-11.1V25.5h-1.5zM45.6 44.2h16.2v39.1c-2.4 1-5.6 1.6-9.6 1.6-10.9 0-17.7-6.2-17.7-16.2 0-10.3 7.3-16.9 18.2-16.9 3.5 0 6.6.6 8.9 1.5v-9.1zm0 29.8c-4.9 0-7.8 2.8-7.8 7.3 0 4.3 2.9 7 7.7 7 2.8 0 5.4-.5 7.1-1.3V66.8c-1.8-.7-4.1-1.1-7-1.1v8.3z"/><circle cx="76.6" cy="18.5" r="7.5" fill="#44B78B"/></svg>`
    },
    nodejs: {
      brandColor: '#339933',
      glowColor: 'rgba(51, 153, 51, 0.6)',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><path fill="#339933" d="M64 4.5l55 31.7v63.6L64 123.5 9 99.8V36.2L64 4.5z"/><path fill="#FFFFFF" d="M64 32.5c-15.2 0-23.7 8.5-23.7 18.9 0 17.5 27.2 12.7 27.2 21.6 0 3.7-3.1 5.6-7.8 5.6-5.8 0-11.5-2.8-15.6-6.6l-5.6 7.6c5.5 5.2 13.3 8.3 21.2 8.3 16.4 0 24.3-8.8 24.3-19.5 0-18.4-27.3-13.3-27.3-21.8 0-3.3 2.7-4.9 7.1-4.9 4.8 0 9.7 2.1 13.5 5.2l5.2-7.8c-5-4.2-11.8-6.6-18.5-6.6z"/></svg>`
    },
    express: {
      brandColor: '#EEEEEE',
      glowColor: 'rgba(238, 238, 238, 0.45)',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><path fill="currentColor" d="M12.8 38.4h18.2L42.5 61l11.5-22.6h18.2L53.7 73.1l21.2 36.5H56.7L42.5 84.8 28.3 109.6H10.1l20.9-36.5L12.8 38.4zm68.3 22.8c0-13.4 9.8-23.8 23.4-23.8 13.6 0 23.5 10.4 23.5 23.8v4.5H95.4c.8 6.4 5.3 10.5 11.8 10.5 4.5 0 8.1-1.8 10.4-5.1l11 8.3c-4.9 6.8-12.8 11.2-22.1 11.2-14.7 0-25.4-10.7-25.4-25.7v-3.7zm32.8-4.5c-.8-5.7-4.9-9.5-10.4-9.5-5.6 0-9.6 3.8-10.4 9.5h20.8z"/></svg>`
    },
    restapi: {
      brandColor: '#6366F1',
      glowColor: 'rgba(99, 102, 241, 0.6)',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><circle cx="64" cy="64" r="56" fill="none" stroke="#6366F1" stroke-width="7" stroke-dasharray="8 6"/><rect x="22" y="44" width="84" height="40" rx="10" fill="#6366F1"/><text x="64" y="69" font-family="monospace" font-size="22" font-weight="900" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">API</text><circle cx="28" cy="64" r="4.5" fill="#A5B4FC"/><circle cx="100" cy="64" r="4.5" fill="#A5B4FC"/><path d="M64 16v18M64 94v18M16 64h18M94 64h18" stroke="#6366F1" stroke-width="5" stroke-linecap="round"/></svg>`
    },
    sqlalchemy: {
      brandColor: '#D71F00',
      glowColor: 'rgba(215, 31, 0, 0.55)',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><path fill="#D71F00" d="M48 20h32v12h-6v16.8l28.6 44.5c4.8 7.4.4 18.7-8.6 18.7H34c-9 0-13.4-11.3-8.6-18.7L54 48.8V32h-6V20z"/><path fill="#FFFFFF" d="M42 96h44c3.3 0 5-3.8 2.8-6.4L74 66H54L39.2 89.6c-2.2 2.6-.5 6.4 2.8 6.4z"/><circle cx="64" cy="82" r="6" fill="#D71F00"/><circle cx="54" cy="74" r="4" fill="#D71F00"/><circle cx="72" cy="76" r="3.5" fill="#D71F00"/></svg>`
    },

    // 4. Databases
    mysql: {
      brandColor: '#00758F',
      glowColor: 'rgba(0, 117, 143, 0.55)',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><path fill="#00758F" d="M107.5 68.6c-7.9-18.7-27.1-31.9-49.8-31.9-10.7 0-20.7 3-29.1 8.3 4.8 1.8 10.3 3.5 16.3 4.8 18.2 4 33.3 12.8 40.5 24.3 3.5 5.5 5 11.8 4.7 18.2 6.7-6.5 12.5-14.8 17.4-23.7z"/><path fill="#F29111" d="M48.2 41.7C29.6 45.8 15 62.4 15 82.2c0 23.3 19.9 42.1 44.4 42.1 19.3 0 35.7-11.6 41.9-28-5.9 1.7-12.2 2.6-18.7 2.6-21.7 0-40.4-10.3-48.4-25.2-4.5-8.4-4-19.8 1.5-29.3 3.4-5.8 8.1-10.1 14.3-12.7z"/></svg>`
    },
    postgresql: {
      brandColor: '#336791',
      glowColor: 'rgba(51, 103, 145, 0.6)',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><path fill="#336791" d="M64 8.5C33.4 8.5 8.5 33.4 8.5 64s24.9 55.5 55.5 55.5S119.5 94.6 119.5 64 94.6 8.5 64 8.5zm27.8 71.9c-4.1 6.5-11.4 11.2-19.8 12.8 4.2-7.2 4.6-15.6 1.1-23.1-3.6-7.8-10.6-13.4-19-15.5-3.5-.9-7.2-1.2-10.8-.9 1.1-6.1 4.5-11.4 9.6-14.8 6.5-4.3 14.6-5.3 22.3-2.7 7.7 2.6 13.9 8.5 17 16.2 3.1 7.7 2.8 16.4-.4 28zm-37.1-3.2c3.5 7.5 3.1 15.9-1.1 23.1-7.9-1.5-14.9-5.9-19-12-3.8-5.7-4.6-12.8-2.3-19.6 2.3-6.8 7.5-12.1 14.2-14.7.7 7.7 4.1 15.7 8.2 23.2z"/></svg>`
    },
    mongodb: {
      brandColor: '#47A248',
      glowColor: 'rgba(71, 162, 72, 0.6)',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><path fill="#47A248" d="M64 4c0 0-38 34.8-38 72.8 0 25.1 17.5 44.5 38 47.2 20.5-2.7 38-22.1 38-47.2C102 38.8 64 4 64 4z"/><path fill="#499D4A" d="M64 4v120c20.5-2.7 38-22.1 38-47.2C102 38.8 64 4 64 4z"/><path fill="#FFFFFF" d="M64 12c-1.2 5.1-1.8 11.1-1.8 17.3 0 28.5 12.3 50.1 12.3 75.3 0 5.4-.7 10.6-2 15.4 15.8-5.3 27.5-20.4 27.5-38.2C100 45.4 64 12 64 12z" opacity="0.3"/></svg>`
    },
    sqlite: {
      brandColor: '#0078D7',
      glowColor: 'rgba(0, 120, 215, 0.55)',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><path fill="#003B57" d="M109.8 45.2C105.7 23.8 86.8 8 64 8 36.4 8 14 30.4 14 58c0 14.3 6 27.2 15.7 36.3L64 120l34.3-25.7c9.7-9.1 15.7-22 15.7-36.3 0-4.4-.6-8.7-1.9-12.8h-2.3z"/><path fill="#0078D7" d="M64 24c18.8 0 34 15.2 34 34 0 9.8-4.2 18.7-10.9 24.9L64 102 40.9 82.9C34.2 76.7 30 67.8 30 58c0-18.8 15.2-34 34-34z"/><path fill="#FFFFFF" d="M48 54h32v8H48zM48 68h24v8H48z"/></svg>`
    },

    // 5. Tools & Technologies
    git: {
      brandColor: '#F05032',
      glowColor: 'rgba(240, 80, 50, 0.6)',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><path fill="#F05032" d="M125.7 57.5L70.5 2.3c-3.1-3.1-8.1-3.1-11.2 0L44 17.6l14.2 14.2c3.3-1.1 7.1-.4 9.8 2.3 2.7 2.7 3.4 6.5 2.3 9.8l13.7 13.7c3.3-1.1 7.1-.4 9.8 2.3 3.8 3.8 3.8 10 0 13.8s-10 3.8-13.8 0c-2.9-2.9-3.5-7.1-2-10.5L65.4 49.6v29.5c.8.4 1.6 1 2.2 1.6 3.8 3.8 3.8 10 0 13.8s-10 3.8-13.8 0-3.8-10 0-13.8c1-1 2.2-1.7 3.5-2.1V48.7c-1.3-.4-2.5-1.1-3.5-2.1-2.9-2.9-3.5-7.2-1.9-10.6L37.8 21.8 2.3 57.3c-3.1 3.1-3.1 8.1 0 11.2l55.2 55.2c3.1 3.1 8.1 3.1 11.2 0l57-55c3.1-3.1 3.1-8.1 0-11.2z"/></svg>`
    },
    github: {
      brandColor: '#FFFFFF',
      glowColor: 'rgba(255, 255, 255, 0.5)',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M64 5.3c-32.6 0-59 26.4-59 59 0 26.1 16.9 48.2 40.4 56 3 .5 4-1.3 4-2.8v-10.8c-16.4 3.6-19.9-7-19.9-7-2.7-6.8-6.6-8.6-6.6-8.6-5.4-3.7.4-3.6.4-3.6 5.9.4 9 6.1 9 6.1 5.3 9 13.8 6.4 17.2 4.9.5-3.8 2.1-6.4 3.7-7.9-13.1-1.5-26.9-6.5-26.9-29.2 0-6.5 2.3-11.7 6.1-15.9-.6-1.5-2.6-7.5.6-15.7 0 0 5-1.6 16.3 6.1 4.7-1.3 9.8-2 14.9-2s10.1.7 14.9 2c11.3-7.7 16.3-6.1 16.3-6.1 3.2 8.2 1.2 14.2.6 15.7 3.8 4.1 6.1 9.4 6.1 15.9 0 22.7-13.8 27.7-27 29.1 2.1 1.8 4 5.4 4 10.9V117c0 1.6 1.1 3.4 4.1 2.8 23.4-7.8 40.3-30 40.3-56 0-32.6-26.4-58.5-59-58.5z"/></svg>`
    },
    vscode: {
      brandColor: '#007ACC',
      glowColor: 'rgba(0, 122, 204, 0.6)',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><path fill="#0065A9" d="M92.7 122.9l26.6-12.8c5.8-2.8 8.7-8.9 8.7-15.2V33.1c0-6.3-2.9-12.4-8.7-15.2L92.7 5.1c-5.4-2.6-11.8-1.5-16.1 2.7L38.4 41.5 20.9 28.1c-4.2-3.2-10-3-13.9.5L1.8 33.7C-.6 35.8-.6 39.5 1.7 41.7l30.9 28.8-30.9 28.8c-2.3 2.2-2.3 5.9.1 8l5.2 5.1c3.9 3.5 9.7 3.7 13.9.5l17.5-13.4 38.2 33.7c4.3 4.2 10.7 5.3 16.1 2.7z"/><path fill="#007ACC" d="M92.7 5.1L45.4 46.8l29.8 22.7 29.8-22.7V20.3c0-6.3-2.9-12.4-8.7-15.2h-3.6z"/><path fill="#1F9CF0" d="M92.7 122.9L45.4 81.2l29.8-22.7 29.8 22.7v26.5c0 6.3-2.9 12.4-8.7-15.2h-3.6z"/><path fill="#005A9E" d="M119.3 33.1L75.2 64l44.1 30.9c5.8-2.8 8.7-8.9 8.7-15.2V48.3c0-6.3-2.9-12.4-8.7-15.2z"/></svg>`
    },
    docker: {
      brandColor: '#2496ED',
      glowColor: 'rgba(36, 150, 237, 0.6)',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><path fill="#2496ED" d="M124.6 57.5c-2.4-1.7-7.7-2.6-13.8-.7-1.1-6.1-5-11.4-10.8-14.7l-4.1 3.8c4.3 3.9 7 9.5 7.4 15.6-2.4.9-5.1 1.7-8.1 2.3-4.1.8-9.4 1.1-15.2 1.1H12.9c-2.4 0-4.6.6-6.6 1.7-3.9 2.2-6.3 6.3-6.3 10.8 0 18.7 11.2 33.4 29.2 40.5 13.4 5.3 29.2 6.6 44.8 3.8 20.3-3.7 37.6-15.7 45.4-31.8 7.3-1.6 14.1-5.7 18.6-11.7 1.8-2.4 1.4-6.3-3.4-8.8z"/><path fill="#2496ED" d="M21.5 48.7h14.5v14.5H21.5zm19.3 0h14.5v14.5H40.8zm19.4 0h14.5v14.5H60.2zm19.4 0h14.5v14.5H79.6zm-58.1-19.4h14.5v14.5H21.5zm19.3 0h14.5v14.5H40.8zm19.4 0h14.5v14.5H60.2zm19.4 0h14.5v14.5H79.6zm-38.7-19.3h14.5v14.5H40.8zm19.4 0h14.5v14.5H60.2z"/></svg>`
    },
    postman: {
      brandColor: '#FF6C37',
      glowColor: 'rgba(255, 108, 55, 0.6)',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><circle cx="64" cy="64" r="62" fill="#FF6C37"/><path fill="#FFFFFF" d="M98.6 38.8c-.8-1.5-2.2-2.6-3.8-3.1-6.8-2.2-22.9-2.9-38.2 8.7-6.9 5.2-12.7 12-16.7 19.9l-11.4-8.8-5.3 6.9 14.7 11.4c-.9 3.2-1.4 6.6-1.5 10.1l-15.5 1.9 1.1 8.7 15.3-1.9c1.9 6.2 5.6 11.7 10.8 15.7 10.8 8.4 25.8 7.3 36.4-1.9 14.3-12.4 20.1-32.9 17.8-56.1-.2-6.5-2.2-10.7-3.7-11.5zm-33.1 52c-7.9 6.8-19.1 7.7-27.1 1.5-3.8-2.9-6.4-7-7.6-11.6l31.5-24.3c1.7-1.3 2.1-3.7.8-5.4-1.3-1.7-3.7-2.1-5.4-.8L29.6 72.3c.5-4.5 2-8.8 4.5-12.6 3.4-5.3 8.3-9.5 13.9-12.4 12.1-6.3 23.3-3.9 28.5-1.5 1.5 17.5-3 38.3-11 45z"/></svg>`
    },
    linux: {
      brandColor: '#FCC624',
      glowColor: 'rgba(252, 198, 36, 0.55)',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><path fill="#1A1A1A" d="M64 8c-18 0-26 14-26 30 0 10 4 18 8 22-2 5-6 13-10 20-5 9-10 18-10 26 0 9 10 14 26 14h24c16 0 26-5 26-14 0-8-5-17-10-26-4-7-8-15-10-20 4-4 8-12 8-22 0-16-8-30-26-30z"/><ellipse cx="64" cy="88" rx="20" ry="24" fill="#FFFFFF"/><ellipse cx="56" cy="36" rx="4" ry="6" fill="#FFFFFF"/><ellipse cx="72" cy="36" rx="4" ry="6" fill="#FFFFFF"/><circle cx="57" cy="36" r="2.5" fill="#000000"/><circle cx="71" cy="36" r="2.5" fill="#000000"/><polygon points="64,42 54,54 74,54" fill="#FFA500"/><ellipse cx="44" cy="116" rx="14" ry="6" fill="#FFA500"/><ellipse cx="84" cy="116" rx="14" ry="6" fill="#FFA500"/></svg>`
    },

    // 6. AI Development Tools
    chatgpt: {
      brandColor: '#10A37F',
      glowColor: 'rgba(16, 163, 127, 0.6)',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><circle cx="64" cy="64" r="62" fill="#10A37F"/><path fill="#FFFFFF" d="M102.7 54.8c-.8-5.9-4.3-10.9-9.5-13.6-1.5-.8-3.1-1.3-4.8-1.7-1.1-6.7-5.3-12.4-11.4-15.5-4.4-2.2-9.4-2.7-14.2-1.5-3.8-5.3-9.8-8.5-16.4-8.5-4.3 0-8.5 1.4-12 3.9-5.3 3.8-8.7 9.8-9.4 16.3-1.6.4-3.2 1-4.7 1.8-6.1 3.5-10 9.8-10.4 16.9-.3 4.9 1.3 9.7 4.4 13.5-2.6 4.7-3.2 10.3-1.7 15.5 1.5 5.3 5 9.7 9.8 12.1 1.5.8 3.1 1.3 4.8 1.7 1.1 6.7 5.3 12.4 11.4 15.5 4.4 2.2 9.4 2.7 14.2 1.5 3.8 5.3 9.8 8.5 16.4 8.5 4.3 0 8.5-1.4 12-3.9 5.3-3.8 8.7-9.8 9.4-16.3 1.6-.4 3.2-1 4.7-1.8 6.1-3.5 10-9.8 10.4-16.9.3-4.9-1.3-9.7-4.4-13.5 2.6-4.7 3.2-10.3 1.7-15.5-1.5-5.2-5-9.6-9.8-12zm-35.8 53.6c-5.2 0-10.1-2.4-13.3-6.6l1.8-1 14.2-8.2c.8-.5 1.3-1.3 1.3-2.3V66.8l8.3 4.8v19.4c0 9.6-7.8 17.4-12.3 17.4zm-28.7-11.4c-4.1-3-6.6-7.7-6.8-12.8v-2.1l14.2 8.2c.8.5 1.8.5 2.6 0l20.4-11.8v9.6l-16.8 9.7c-4.6 2.7-9.8 1.7-13.6-.8zm-9.3-31.5c.3-5.2 2.7-9.9 6.8-12.9l1.8 1 14.2 8.2c.8.5 1.3 1.3 1.3 2.3v23.5l-8.3-4.8V64.8c-.1-9.6 2.3-14.8-15.8-9.3zm55.4-8.8l-20.4 11.8v-9.6l16.8-9.7c8.3-4.8 18.9-1.9 23.7 6.4.8 1.4 1.4 2.9 1.8 4.5l-1.8-1-14.2-8.2c-.8-.5-1.8-.5-2.6 0l-3.3 5.8zm11.7 27.6c-.3 5.2-2.7 9.9-6.8 12.9l-1.8-1-14.2-8.2c-.8-.5-1.3-1.3-1.3-2.3V63.9l8.3 4.8v19.4c0 9.6-2.3 14.8 15.8 9.3zM64 54.8l8.3 4.8-8.3 4.8-8.3-4.8 8.3-4.8z"/></svg>`
    },
    claude: {
      brandColor: '#D97706',
      glowColor: 'rgba(217, 119, 6, 0.6)',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><rect width="128" height="128" rx="26" fill="#D97706"/><path fill="#FFFFFF" d="M85.4 38.2c-1.8-4.2-6.1-6.8-10.7-6.5-4.4.3-8.2 3.1-9.7 7.2l-1.1 3-3.2-.4c-4.7-.6-9.3 1.7-11.7 5.7-2.4 4-2.2 9.1.5 12.9l2.1 2.9-2.9 2c-3.8 2.6-5.8 7.1-5.1 11.7.7 4.6 3.9 8.3 8.3 9.7l3.4 1.1-.3 3.6c-.4 4.7 1.8 9.2 5.8 11.6 3.9 2.4 9 2.2 12.8-.5l3-2.1 2.8 2.3c3.7 3 8.8 3.7 13.2 1.8s7.3-6.2 7.6-11l.2-3.6 3.5-.8c4.5-1 7.9-4.7 8.8-9.3.9-4.5-.8-9.1-4.5-11.9l-2.9-2.2 2.4-2.7c3.1-3.6 4-8.7 2.3-13.1-1.7-4.4-5.8-7.4-10.5-7.7l-3.6-.2-.3-3.6c-.4-4.5-3.3-8.3-7.5-9.7zM64 50c7.7 0 14 6.3 14 14s-6.3 14-14 14-14-6.3-14-14 6.3-14 14-14z"/></svg>`
    },
    gemini: {
      brandColor: '#4E80EE',
      glowColor: 'rgba(78, 128, 238, 0.65)',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><defs><linearGradient id="geminiGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#4E80EE"/><stop offset="50%" stop-color="#8097FF"/><stop offset="100%" stop-color="#BA98FB"/></linearGradient></defs><path fill="url(#geminiGrad)" d="M64 4c0 33.1 26.9 60 60 60-33.1 0-60 26.9-60 60 0-33.1-26.9-60-60-60 33.1 0 60-26.9 60-60z"/><circle cx="64" cy="64" r="9" fill="#FFFFFF" opacity="0.85"/></svg>`
    },
    antigravity: {
      brandColor: '#FF5722',
      glowColor: 'rgba(255, 87, 34, 0.65)',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><defs><linearGradient id="antiGravGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FF5722"/><stop offset="50%" stop-color="#6366F1"/><stop offset="100%" stop-color="#38BDF8"/></linearGradient></defs><circle cx="64" cy="64" r="54" fill="none" stroke="url(#antiGravGrad)" stroke-width="4.5" stroke-dasharray="14 10"/><ellipse cx="64" cy="64" rx="46" ry="18" fill="none" stroke="#6366F1" stroke-width="3.5" transform="rotate(-30 64 64)"/><ellipse cx="64" cy="64" rx="46" ry="18" fill="none" stroke="#FF5722" stroke-width="3.5" transform="rotate(30 64 64)"/><polygon points="64,26 84,64 64,102 44,64" fill="url(#antiGravGrad)"/><circle cx="64" cy="64" r="8" fill="#FFFFFF"/></svg>`
    },

    // 7. Data Analytics & Business Intelligence
    powerbi: {
      brandColor: '#F2C811',
      glowColor: 'rgba(242, 200, 17, 0.6)',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><rect width="128" height="128" rx="20" fill="#201F1E"/><rect x="22" y="60" width="18" height="46" rx="4" fill="#F2C811" opacity="0.6"/><rect x="46" y="44" width="18" height="62" rx="4" fill="#F2C811" opacity="0.85"/><rect x="70" y="24" width="18" height="82" rx="4" fill="#F2C811"/><rect x="94" y="50" width="18" height="56" rx="4" fill="#F2C811" opacity="0.7"/></svg>`
    },
    tableau: {
      brandColor: '#E97627',
      glowColor: 'rgba(233, 118, 39, 0.6)',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><rect width="128" height="128" rx="20" fill="#1C2128"/><path fill="#E97627" d="M60 14h8v24h-8zm0 76h8v24h-8zm-38-38h24v8H22zm76 0h24v8H98z"/><path fill="#5A88AC" d="M37 32h6v17h-6zm48 0h6v17h-6zM37 79h6v17h-6zm48 0h6v17h-6z"/><path fill="#E97627" d="M62 46h4v36h-4zm-16 16h36v4H46z"/></svg>`
    },
    excel: {
      brandColor: '#107C41',
      glowColor: 'rgba(16, 124, 65, 0.6)',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><rect width="128" height="128" rx="20" fill="#107C41"/><rect x="48" y="24" width="60" height="80" rx="6" fill="#185ABD"/><path fill="#33C481" d="M48 24h60v80H48z"/><path fill="#FFFFFF" d="M60 40h36v8H60zm0 16h36v8H60zm0 16h36v8H60zm0 16h36v8H60z" opacity="0.6"/><rect x="18" y="34" width="48" height="60" rx="8" fill="#107C41" stroke="#33C481" stroke-width="2"/><text x="42" y="74" fill="#FFFFFF" font-size="34" font-weight="900" text-anchor="middle" font-family="sans-serif">X</text></svg>`
    },
    pandas: {
      brandColor: '#150458',
      glowColor: 'rgba(21, 4, 88, 0.7)',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><rect width="128" height="128" rx="20" fill="#0A0E1A"/><rect x="28" y="24" width="16" height="80" rx="8" fill="#150458" stroke="#E70488" stroke-width="3"/><rect x="56" y="38" width="16" height="52" rx="8" fill="#FFD43B"/><rect x="84" y="24" width="16" height="80" rx="8" fill="#4B8BBE"/></svg>`
    },
    numpy: {
      brandColor: '#4DABCF',
      glowColor: 'rgba(77, 171, 207, 0.6)',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><rect width="128" height="128" rx="20" fill="#013243"/><path fill="#4DABCF" d="M32 30h16v68H32zm48 0h16v68H80z"/><path fill="#4DABCF" d="M46 30l36 68h-16L30 30z"/></svg>`
    },
    sql: {
      brandColor: '#00758F',
      glowColor: 'rgba(0, 117, 143, 0.65)',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><rect width="128" height="128" rx="20" fill="#0D1F2D"/><ellipse cx="64" cy="34" rx="38" ry="14" fill="#00758F"/><path fill="#00758F" d="M26 34v26c0 7.7 17 14 38 14s38-6.3 38-14V34z" opacity="0.85"/><path fill="#00758F" d="M26 60v26c0 7.7 17 14 38 14s38-6.3 38-14V60z" opacity="0.7"/><path fill="#00758F" d="M26 86v18c0 7.7 17 14 38 14s38-6.3 38-14V86z" opacity="0.55"/></svg>`
    },
    jupyter: {
      brandColor: '#F37626',
      glowColor: 'rgba(243, 118, 38, 0.6)',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><rect width="128" height="128" rx="20" fill="#1C1E24"/><ellipse cx="64" cy="34" rx="42" ry="14" fill="#F37626"/><ellipse cx="64" cy="94" rx="42" ry="14" fill="#F37626"/><circle cx="98" cy="24" r="6" fill="#9E9E9E"/><circle cx="30" cy="104" r="6" fill="#9E9E9E"/><circle cx="96" cy="102" r="8" fill="#4B8BBE"/></svg>`
    },

    // Generic Elegant Tech Chip Fallback
    fallback: {
      brandColor: '#6366F1',
      glowColor: 'rgba(99, 102, 241, 0.5)',
      svg: `<svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true"><rect x="28" y="28" width="72" height="72" rx="16" fill="none" stroke="#6366F1" stroke-width="6"/><circle cx="64" cy="64" r="16" fill="#6366F1"/><path d="M64 8v20M64 100v20M8 64h20M100 64h20" stroke="#6366F1" stroke-width="6" stroke-linecap="round"/></svg>`
    }
  };

  // Icon lookup resolver
  function getSkillIconEntry(iconKey, skillName) {
    if (iconKey && SKILLS_ICONS_REGISTRY[iconKey.toLowerCase()]) {
      return SKILLS_ICONS_REGISTRY[iconKey.toLowerCase()];
    }
    // Normalize name
    if (skillName) {
      const cleanName = skillName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const keyMap = {
        python: 'python',
        java: 'java',
        javascript: 'javascript',
        js: 'javascript',
        html: 'html5',
        html5: 'html5',
        css: 'css3',
        css3: 'css3',
        react: 'react',
        reactjs: 'react',
        nextjs: 'nextjs',
        next: 'nextjs',
        tailwind: 'tailwindcss',
        tailwindcss: 'tailwindcss',
        bootstrap: 'bootstrap',
        redux: 'redux',
        fastapi: 'fastapi',
        django: 'django',
        node: 'nodejs',
        nodejs: 'nodejs',
        express: 'express',
        expressjs: 'express',
        restapi: 'restapi',
        restfulapis: 'restapi',
        sqlalchemy: 'sqlalchemy',
        mysql: 'mysql',
        postgresql: 'postgresql',
        postgres: 'postgresql',
        mongodb: 'mongodb',
        mongo: 'mongodb',
        sqlite: 'sqlite',
        git: 'git',
        github: 'github',
        vscode: 'vscode',
        docker: 'docker',
        postman: 'postman',
        linux: 'linux',
        chatgpt: 'chatgpt',
        openai: 'chatgpt',
        claude: 'claude',
        anthropic: 'claude',
        gemini: 'gemini',
        antigravity: 'antigravity',
        antigravityide: 'antigravity',
        powerbi: 'powerbi',
        powerquery: 'powerbi',
        dax: 'powerbi',
        tableau: 'tableau',
        excel: 'excel',
        advancedexcel: 'excel',
        pandas: 'pandas',
        numpy: 'numpy',
        matplotlib: 'python',
        seaborn: 'python',
        sql: 'sql',
        etl: 'sql',
        eda: 'pandas',
        statistics: 'numpy',
        jupyter: 'jupyter',
        jupyternotebook: 'jupyter'
      };
      if (keyMap[cleanName] && SKILLS_ICONS_REGISTRY[keyMap[cleanName]]) {
        return SKILLS_ICONS_REGISTRY[keyMap[cleanName]];
      }
    }
    return SKILLS_ICONS_REGISTRY.fallback;
  }

  // Official Google Gemini Sparkle Vector Graphic
  const GEMINI_SPARKLE_SVG = `<svg class="gemini-sparkle-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true"><defs><linearGradient id="geminiSparkleGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#4E80EE"/><stop offset="50%" stop-color="#8097FF"/><stop offset="100%" stop-color="#BA98FB"/></linearGradient></defs><path d="M12 2C12 7.5 7.5 12 2 12C7.5 12 12 16.5 12 22C12 16.5 16.5 12 22 12C16.5 12 12 7.5 12 2Z" fill="url(#geminiSparkleGrad)"/><circle cx="12" cy="12" r="2.5" fill="#FFFFFF"/></svg>`;

  // Mouse Interactive Spotlight Tracker
  function setupGeminiSpotlight() {
    if (typeof window === 'undefined') return;
    const skillsSection = document.getElementById('skills');
    if (!skillsSection || skillsSection._spotlightBound) return;
    skillsSection._spotlightBound = true;

    skillsSection.addEventListener('mousemove', (e) => {
      const rect = skillsSection.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      skillsSection.style.setProperty('--gemini-mouse-x', `${x}px`);
      skillsSection.style.setProperty('--gemini-mouse-y', `${y}px`);
    });
  }

  // Helper to extract clean category display title without numbers or 'NODE_' prefix
  function getCategoryDisplayName(cat) {
    if (!cat || !cat.name) return '';
    let name = cat.name.replace(/node_/i, '').trim();
    return name.toUpperCase();
  }

  // Interactive Category Filter Handler
  function filterSkillsCategory(categoryId) {
    if (typeof document === 'undefined') return;
    const categoryEls = document.querySelectorAll('.circuit-branch-row, .skill-category');
    const filterBtns = document.querySelectorAll('.gemini-filter-pill');

    filterBtns.forEach(btn => {
      const isActive = btn.getAttribute('data-filter') === categoryId;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    categoryEls.forEach(cat => {
      if (categoryId === 'all' || cat.getAttribute('data-category-id') === categoryId) {
        cat.style.display = 'flex';
        cat.style.opacity = '1';
        cat.style.transform = 'translateY(0)';
      } else {
        cat.style.display = 'none';
        cat.style.opacity = '0';
      }
    });

    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh();
    }
  }

  if (typeof window !== 'undefined') {
    window.filterSkillsCategory = filterSkillsCategory;
  }

  // Pure HTML String generator (works in any environment: browser, SSR, or offline test suites)
  function renderSkillsHtmlString(skillsData) {
    if (!skillsData || !Array.isArray(skillsData.categories)) {
      return '';
    }

    const { sectionTag, title, subtitle, categories } = skillsData;

    // Bilateral Circuit Branches Generation (No cards, No numbers, No 'NODE_')
    const categoriesHtml = categories.map((cat, catIdx) => {
      const skillsList = cat.skills || cat.items || [];
      const isLeft = catIdx % 2 === 0;
      const branchClass = isLeft ? 'branch-left' : 'branch-right';
      const cleanName = getCategoryDisplayName(cat);

      const itemsHtml = skillsList.map((skill, itemIdx) => {
        const iconEntry = getSkillIconEntry(skill.icon, skill.name);
        const floatDelay = ((itemIdx % 5) * 0.35).toFixed(2);

        return `
          <div 
            class="skill-item pure-skill-item" 
            role="listitem" 
            tabindex="0"
            aria-label="${skill.name}"
            style="--brand-glow: ${iconEntry.glowColor}; --brand-color: ${iconEntry.brandColor}; --float-delay: ${floatDelay}s;"
          >
            <div class="skill-icon-halo" aria-hidden="true"></div>
            <div class="skill-icon-wrapper pure-skill-icon" aria-hidden="true">
              ${iconEntry.svg}
            </div>
            <span class="skill-name pure-skill-name">${skill.name}</span>
          </div>
        `;
      }).join('');

      return `
        <div class="skill-category circuit-branch-row ${branchClass}" role="region" aria-label="${cat.name}" data-category-id="${cat.id}">
          <div class="spine-pin" aria-hidden="true"></div>
          <div class="branch-trace" aria-hidden="true"></div>
          <div class="branch-content">
            <div class="skill-category-header">
              <h3 class="category-header-title skill-category-title">
                <span class="category-comment-prefix">//</span> ${cleanName}
              </h3>
            </div>
            <div class="skills-category-grid tech-logos-shelf" role="list">
              ${itemsHtml}
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="skills-showcase-container">
        <!-- Gemini Ambient Cosmic Aurora Graphics -->
        <div class="gemini-skills-ambient" aria-hidden="true">
          <div class="gemini-ambient-glow gemini-glow-1"></div>
          <div class="gemini-ambient-glow gemini-glow-2"></div>
          <div class="gemini-ambient-glow gemini-glow-3"></div>
          <div class="gemini-interactive-spotlight"></div>
        </div>

        <div class="skills-header">
          <h2 class="section-tag" id="skills-title">${sectionTag || 'TECHNICAL ARSENAL'}</h2>
          ${title ? `<h3 class="section-heading">${title}</h3>` : ''}
          ${subtitle ? `<p class="section-subtitle">${subtitle}</p>` : ''}
        </div>

        <!-- Central Neon Orange Circuit Bus Architecture -->
        <div class="circuit-bus-container">
          <div class="circuit-bus-spine" aria-hidden="true">
            <div class="circuit-spark spark-1"></div>
            <div class="circuit-spark spark-2"></div>
            <div class="circuit-spark spark-3"></div>
          </div>
          <div class="skills-categories-container">
            ${categoriesHtml}
          </div>
        </div>
      </div>
    `;
  }

  // Reusable React Components Implementation
  // Uses React.createElement to run natively without requiring Babel JSX transpiler
  let ReactComponents = {};

  if (typeof window !== 'undefined' && window.React) {
    const React = window.React;
    const createElement = React.createElement;

    // Component 1: SkillIcon
    const SkillIcon = function (props) {
      const { icon, name } = props;
      const entry = getSkillIconEntry(icon, name);
      return createElement('div', {
        className: 'skill-icon-svg-inner',
        'aria-hidden': 'true',
        dangerouslySetInnerHTML: { __html: entry.svg }
      });
    };

    // Component 2: SkillItem (Zero cards, zero boxes, zero borders, pure icon + name)
    const SkillItem = function (props) {
      const { skill, index } = props;
      const entry = getSkillIconEntry(skill.icon, skill.name);
      const floatDelay = `${((index % 5) * 0.35).toFixed(2)}s`;

      const styleObj = {
        '--brand-glow': entry.glowColor,
        '--brand-color': entry.brandColor,
        '--float-delay': floatDelay
      };

      return createElement(
        'div',
        {
          className: 'skill-item pure-skill-item',
          role: 'listitem',
          tabIndex: 0,
          'aria-label': skill.name,
          style: styleObj
        },
        createElement('div', { className: 'skill-icon-halo', 'aria-hidden': 'true' }),
        createElement(
          'div',
          { className: 'skill-icon-wrapper pure-skill-icon', 'aria-hidden': 'true' },
          createElement(SkillIcon, { icon: skill.icon, name: skill.name })
        ),
        createElement('span', { className: 'skill-name pure-skill-name' }, skill.name)
      );
    };

    // Component 3: SkillCategory (Bilateral Branching Node without numbers or 'NODE_')
    const SkillCategory = function (props) {
      const { category, categoryIndex } = props;
      const skillsList = category.skills || category.items || [];
      const isLeft = (categoryIndex - 1) % 2 === 0;
      const branchClass = isLeft ? 'branch-left' : 'branch-right';
      const cleanName = getCategoryDisplayName(category);

      return createElement(
        'div',
        {
          className: `skill-category circuit-branch-row ${branchClass}`,
          role: 'region',
          'aria-label': category.name,
          'data-category-id': category.id
        },
        createElement('div', { className: 'spine-pin', 'aria-hidden': 'true' }),
        createElement('div', { className: 'branch-trace', 'aria-hidden': 'true' }),
        createElement(
          'div',
          { className: 'branch-content' },
          createElement(
            'div',
            { className: 'skill-category-header' },
            createElement(
              'h3',
              { className: 'category-header-title skill-category-title' },
              createElement('span', { className: 'category-comment-prefix' }, '// '),
              cleanName
            )
          ),
          createElement(
            'div',
            { className: 'skills-category-grid tech-logos-shelf', role: 'list' },
            skillsList.map((skill, idx) =>
              createElement(SkillItem, {
                key: skill.name || idx,
                skill: skill,
                index: idx
              })
            )
          )
        )
      );
    };

    // Component 4: SkillsSection (Root showcase component with glowing central spine)
    const SkillsSection = function (props) {
      const { data } = props;
      if (!data || !Array.isArray(data.categories)) return null;

      const { sectionTag, title, subtitle, categories } = data;

      return createElement(
        'div',
        { className: 'skills-showcase-container' },
        createElement(
          'div',
          { className: 'gemini-skills-ambient', 'aria-hidden': 'true' },
          createElement('div', { className: 'gemini-ambient-glow gemini-glow-1' }),
          createElement('div', { className: 'gemini-ambient-glow gemini-glow-2' }),
          createElement('div', { className: 'gemini-ambient-glow gemini-glow-3' }),
          createElement('div', { className: 'gemini-interactive-spotlight' })
        ),
        createElement(
          'div',
          { className: 'skills-header' },
          createElement('h2', { className: 'section-tag', id: 'skills-title' }, sectionTag || 'TECHNICAL ARSENAL'),
          title ? createElement('h3', { className: 'section-heading' }, title) : null,
          subtitle ? createElement('p', { className: 'section-subtitle' }, subtitle) : null
        ),
        createElement(
          'div',
          { className: 'circuit-bus-container' },
          createElement(
            'div',
            { className: 'circuit-bus-spine', 'aria-hidden': 'true' },
            createElement('div', { className: 'circuit-spark spark-1' }),
            createElement('div', { className: 'circuit-spark spark-2' }),
            createElement('div', { className: 'circuit-spark spark-3' })
          ),
          createElement(
            'div',
            { className: 'skills-categories-container' },
            categories.map((category, idx) =>
              createElement(SkillCategory, {
                key: category.id || category.name || idx,
                category: category,
                categoryIndex: idx + 1
              })
            )
          )
        )
      );
    };

    ReactComponents = {
      SkillIcon,
      SkillItem,
      SkillCategory,
      SkillsSection
    };
  }

  // Mount React Component dynamically
  let reactRootInstance = null;

  function renderSkillsReact(mountEl, skillsData) {
    if (!mountEl) return false;

    if (typeof window !== 'undefined' && window.React && window.ReactDOM && ReactComponents.SkillsSection) {
      const React = window.React;
      const ReactDOM = window.ReactDOM;

      try {
        if (ReactDOM.createRoot) {
          // React 18 createRoot API
          if (!mountEl._reactRootInstance) {
            mountEl._reactRootInstance = ReactDOM.createRoot(mountEl);
          }
          mountEl._reactRootInstance.render(
            React.createElement(ReactComponents.SkillsSection, { data: skillsData })
          );
          setupGeminiSpotlight();
          return true;
        } else if (ReactDOM.render) {
          // React 17 legacy API fallback
          ReactDOM.render(
            React.createElement(ReactComponents.SkillsSection, { data: skillsData }),
            mountEl
          );
          setupGeminiSpotlight();
          return true;
        }
      } catch (err) {
        console.warn('[SkillsShowcase] React mount error, falling back to dynamic HTML string:', err);
      }
    }

    // Direct dynamic HTML fallback
    mountEl.innerHTML = renderSkillsHtmlString(skillsData);
    setupGeminiSpotlight();
    return true;
  }

  // Export module for browser and Node.js test runners
  const SkillsShowcase = {
    SKILLS_ICONS_REGISTRY,
    getSkillIconEntry,
    renderSkillsHtmlString,
    renderSkillsReact,
    ReactComponents
  };

  if (typeof window !== 'undefined') {
    window.SkillsShowcase = SkillsShowcase;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SkillsShowcase;
  }
})();

