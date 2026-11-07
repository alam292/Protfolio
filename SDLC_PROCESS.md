# 🛡️ Production-Ready Software Development Lifecycle (SDLC) Specification

**Project:** Md MatlooB Alam — Full Stack & UI Kinematics Portfolio  
**Standard:** Enterprise Production-Ready SDLC Protocol  
**Repository:** `Protfolio`  
**Status:** Active & Enforced  

---

## 📌 Executive Summary

This specification establishes the mandatory **Software Development Lifecycle (SDLC)** for all future features, refactorings, bug fixes, and architectural enhancements within this repository. 

Under this protocol:
- **No stage may be bypassed.**
- **Success must never be assumed**; every change must be verified with concrete automated tests, live endpoint checks, and logs.
- **Major architectural changes require explicit approval** before implementation.

---

## 🔄 Core SDLC Workflow

Every engineering change strictly proceeds through this 10-step execution pipeline:

```mermaid
flowchart LR
    A["1. Plan"] --> B["2. Design"]
    B --> C["3. Architecture"]
    C --> D["4. Develop"]
    D --> E["5. Log & Debug"]
    E --> F["6. Test"]
    F --> G["7. Review & Optimize"]
    G --> H["8. Document"]
    H --> I["9. Commit & Push"]
    I --> J["10. Deploy & Verify"]
```

$$\text{Plan} \longrightarrow \text{Design} \longrightarrow \text{Architecture} \longrightarrow \text{Develop} \longrightarrow \text{Log \& Debug} \longrightarrow \text{Test} \longrightarrow \text{Review \& Optimize} \longrightarrow \text{Document} \longrightarrow \text{Commit \& Push} \longrightarrow \text{Deploy \& Verify}$$

---

## 📋 The 8 Production Lifecycle Stages

### 1. 📌 Requirement Analysis & Planning
*Understand requirements, user roles, pages, workflows, and edge cases.*
- **Scope Definition**: Identify target user roles (Recruiter, Engineering Manager, Client, Public Visitor).
- **Workflow & Flowcharts**: Map out state transitions, data flows, and interactions before modifying code.
- **Edge Case Matrix**:
  - Missing or null JSON attributes.
  - Network timeouts, offline state, or slow 3G connections.
  - Invalid user input, file size overages (>10MB), and unsupported MIME types.
  - Viewport boundary conditions (320px ultra-narrow mobile to 4K ultrawide screens).
- **Exit Gate**: Formal `.md` plan created or updated; design alignment approved before proceeding.

---

### 2. 🎨 UI/UX Design System
*Establish design systems, layouts, typography, colors, spacing, responsiveness, and interactions.*
- **Design Tokens**: Standardized CSS Custom Properties defined in `css/variables.css`:
  - Backgrounds: `--bg-primary` (#0a0a0f), `--bg-secondary` (#12121a), `--bg-tertiary` (#1a1a24).
  - Accents: `--accent-orange` (#ff5722), `--accent-cyan` (#00bcd4), `--accent-green` (#00e676).
  - Spacing & Typography: Modular `rem` and fluid `clamp()` formulas for zero layout shifts.
- **Interaction States**: Every interactive element must provide:
  - Default state.
  - Hover / focus-visible states with accessible outline indicators.
  - Active / pressed micro-transitions.
  - Disabled state with visual opacity dimming.
  - Loading skeleton or spinner.
- **Accessibility (a11y)**:
  - Minimum WCAG 2.1 AA color contrast ratio ($\ge 4.5:1$).
  - Full keyboard accessibility with logical `tabindex` and focus traps in modals.
  - `prefers-reduced-motion` compliance across all animations.
- **Exit Gate**: Layout verified across standard breakpoints (360px, 768px, 1024px, 1440px).

---

### 3. 🏗️ Component Architecture
*Build reusable components, scalable folder structures, and clean, typed code.*
- **Separation of Concerns**:
  - `data/`: Single source of truth (`portfolio.json`).
  - `js/`: Modular ES6 modules (`render.js`, `navigation.js`, `animations.js`, `form.js`, `resume-uploader.js`).
  - `css/`: Modular components (`css/components/*.css`) imported into `main.css`.
  - `server/`: Dedicated backend services (`parse-resume.js`, `resume-controller.js`).
- **Type Safety & Contracts**: Strict schema validation and contracts for data exchange.
- **Modularity**: Zero tightly-coupled monoliths; components expose clean lifecycle hooks (`init()`, `render()`, `destroy()`).
- **Exit Gate**: Scalable architecture verified against circular dependencies and bloated scopes.

---

### 4. 💻 Implementation
*Develop responsive, accessible UI with validation, loading states, and error handling.*
- **Defensive Engineering**:
  - Strict input sanitization against XSS.
  - Fallback defaults for missing JSON keys.
  - Graceful degradation when external scripts or CDN resources fail.
- **Semantic Markup**: Standard HTML5 semantic elements (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`).
- **Controlled Feedback**: Interactive toasts, optimistic UI updates, and non-blocking background tasks.
- **Exit Gate**: Code implemented cleanly without inline style hacks or brittle global mutations.

---

### 5. 🔍 Logging & Debugging
*Track errors, API failures, and user actions securely.*
- **Structured Observability**:
  - Consistent log prefixes: `[File Storage]`, `[Backup Engine]`, `[Text Extraction]`, `[AI Parser]`, `[Persistence]`.
  - Distinguish severity levels: `console.info()`, `console.warn()`, `console.error()`.
- **Security & Secret Scrubbing**:
  - Never log raw API keys, bearer tokens, or sensitive personal data.
  - Environment variables loaded securely via `.env`.
- **Client Error Boundaries**:
  - Safe error handling in DOM event listeners with user-friendly toast notifications.
- **Exit Gate**: Zero silent unhandled rejections; all failure branches produce actionable diagnostic logs.

---

### 6. 🧪 Testing & Verification
*Perform manual and automated tests for functionality, responsiveness, accessibility, and edge cases.*
- **Automated Regression Suite (`test-runner.js`)**:
  - **Suite 1**: Data Store & Resume Schema Integrity.
  - **Suite 2**: Static Asset & PDF Integrity.
  - **Suite 3**: DOM Skeleton & Navigation Mappings.
  - **Suite 4**: AI Resume Modal & Dynamic Mount Elements.
  - **Suite 5**: In-Memory Text Extraction & Rule Parser.
  - **Suite 6**: Local HTTP Server Endpoints & MIME Types.
  - **Suite 7**: Resume Upload API & Backup Verification.
  - **Suite 8**: Form Validation Regex Engine.
  - **Suite 9**: Modern Technology Skills Showcase & SVG Registries.
- **Acceptance Criteria**: **100% test pass rate required.** Zero failing assertions permitted before merge.
- **Exit Gate**: All 147+ tests pass green.

---

### 7. ⚡ Optimization & Code Review
*Improve performance, security, code quality, and remove duplicate or unused code.*
- **Kinematics & Rendering**:
  - Target 60 FPS scrolling with GPU-accelerated properties (`transform: translate3d(...)`, `opacity`).
  - Frame canvas stream caching with zero memory leaks.
- **Bundle & Asset Hygiene**:
  - Purge orphaned CSS rules, obsolete helper scripts, and unused assets.
  - Verify cache-control headers (`max-age=31536000, immutable` for static image frames).
- **Code Review**: Audit for cyclomatic complexity, race conditions, and dead code.
- **Exit Gate**: Clean code audit with zero unused duplicate definitions.

---

### 8. 🚀 Documentation, Commit & Deployment
*Update documentation, verify CI checks, review changes, commit, push, deploy, and validate critical user flows.*
- **Documentation**:
  - Update `README.md` and feature-specific plans in `doc/`.
  - Maintain clear changelog notes in commit descriptions.
- **Git Commit Convention**:
  - Format: `<type>(<scope>): <subject>` (e.g. `feat(parser): upgrade to gemini-3.8-flash model`).
  - Types: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `chore`.
- **Deployment & Smoke Verification**:
  - Push branch to `origin/main`.
  - Verify Cloudflare Pages / deployment pipeline builds green.
  - Perform live smoke tests on critical user flows (homepage loading, resume download, contact validation, upload modal).
- **Exit Gate**: Live URL verified with HTTP 200 and zero runtime console errors.

---

## 🔒 Non-Negotiable Operational Rules

1. **Sequential Progression**: Never skip stages in the pipeline.
2. **Evidence-Based Verification**: Never assume success without running `node test-runner.js` and inspecting output.
3. **Approval First**: Always obtain user confirmation before making breaking architectural changes.

