# Folioblox Design System & UI/UX Architecture Specification

A premium, fully responsive design system and modular component architecture for modern, high-performance web portfolios, interactive applications, and digital engineering showcases.

---

## 1. Design Philosophy & Core Principles

The Folioblox Design System is founded on five foundational tenets:

1. **Cinematic Immersion with Purpose**: Rich visuals (such as 3D canvas kinematics and frosted glass surfaces) should serve to elevate content hierarchy, never distract or cause performance degradation.
2. **Fluid Scalability**: Typography and spacing scale fluidly via mathematical `clamp()` functions, eliminating awkward jumping between rigid breakpoints.
3. **Ergonomic Cross-Device Precision**: Touch targets strictly satisfy WCAG 2.1 AA standards (minimum 44×44px on touchscreens), while desktop layouts leverage generous whitespace and multi-column grid containment.
4. **Accessible by Default**: Semantic HTML5 elements, complete ARIA landmark roles, visible focus rings, screen-reader skip links, and comprehensive `prefers-reduced-motion` fallbacks.
5. **Modular, Zero-Bloat Architecture**: Clean separation of concerns with isolated component stylesheets, CSS Custom Properties (Tokens), and a decoupled dynamic rendering engine powered by standard JSON schema.

---

## 2. Design Tokens & Foundations

### 2.1 Color Palette & Theme Tokens

The design system provides two complete theme palettes: **Hacker Dark** (default cinematic dark) and **Clean Slate Light**.

#### Hacker Dark (Default)
| Token Name | Value | Purpose |
| :--- | :--- | :--- |
| `--bg-dark` | `#050507` | Primary cinematic backdrop & canvas underlay |
| `--bg-deep` | `#08090d` | Secondary backdrop & footer surface |
| `--bg-surface` | `#0e1117` | Card base layer & modal surface |
| `--bg-surface-elevated` | `#141822` | Hover state and active card elevation |
| `--accent-orange` | `#ff5722` | Core brand focal accent (Electric Tangerine) |
| `--accent-orange-hover` | `#ff6e3d` | Button & link active hover state |
| `--accent-orange-light` | `#ff8a65` | Glow highlight tint & secondary badges |
| `--accent-orange-subtle` | `rgba(255, 87, 34, 0.12)` | Subtle badge & icon container backdrops |
| `--accent-orange-glow` | `rgba(255, 87, 34, 0.35)` | Atmospheric box-shadow and focal highlights |
| `--text-primary` | `#ededed` | High contrast headlines, titles & primary content |
| `--text-secondary` | `#9ea3b0` | Secondary copy, descriptions & metadata |
| `--text-muted` | `#646a78` | Captions, dates, timestamps, and placeholders |
| `--border-subtle` | `rgba(255, 255, 255, 0.08)`| Clean hairline separators & card borders |
| `--color-success` | `#10b981` | Real-time availability radar indicator |
| `--color-error` | `#ef4444` | Form validation and error states |

#### Clean Slate Light (Theme Switch)
| Token Name | Value | Purpose |
| :--- | :--- | :--- |
| `--bg-dark` | `#0f172a` | Deep slate backdrop |
| `--bg-deep` | `#1e293b` | Elevated navy surface |
| `--bg-surface` | `#1e293b` | Crisp card background |
| `--bg-surface-elevated` | `#334155` | Highlighted card elevation |
| `--text-primary` | `#f8fafc` | Maximum contrast white/slate text |
| `--text-secondary` | `#cbd5e1` | Legible light slate body copy |
| `--text-muted` | `#94a3b8` | Subtle metadata text |
| `--glass-bg` | `rgba(30, 41, 59, 0.75)` | Tinted glassmorphism card fill |

### 2.2 Glassmorphism & Surface Elevation

Folioblox implements a calibrated glassmorphic formula designed to preserve legibility across varied backgrounds:
- **Base Glass Surface**: `rgba(14, 18, 24, 0.65)` backdrop with `backdrop-filter: blur(20px)` and `-webkit-backdrop-filter: blur(20px)`.
- **Card Hairline Border**: `1px solid rgba(255, 255, 255, 0.08)`.
- **Card Hover Border**: `1px solid rgba(255, 87, 34, 0.45)`.
- **Surface Elevation Shadow Hierarchy**:
  - Small (`--shadow-sm`): `0 4px 12px rgba(0, 0, 0, 0.25)`
  - Medium (`--shadow-md`): `0 10px 30px rgba(0, 0, 0, 0.40)`
  - Large (`--shadow-lg`): `0 20px 50px rgba(0, 0, 0, 0.55)`
  - Atmospheric Glow (`--shadow-glow`): `0 0 28px rgba(255, 87, 34, 0.35)`

### 2.3 Fluid Typography Scale

Typography is calculated with CSS `clamp(min, preferred, max)` to guarantee seamless scaling across arbitrary screen widths without discontinuous media query jumps:

```css
--font-family-base: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-family-display: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-family-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

/* Fluid Type Tokens */
--font-size-hero: clamp(3.2rem, 7.5vw, 6.8rem);       /* Primary Hero Grand Title */
--font-size-title: clamp(2.2rem, 4.2vw, 3.8rem);     /* Section Headers */
--font-size-subhead: clamp(1.4rem, 2.2vw, 1.85rem);  /* Subsection / Role Titles */
--font-size-card-title: clamp(1.15rem, 1.6vw, 1.35rem); /* Bento / Project Card Titles */
--font-size-lead: clamp(1.05rem, 1.4vw, 1.35rem);     /* Editorial Lead Paragraphs */
--font-size-body: 0.98rem;                            /* Standard Body Copy (1.68 line-height) */
--font-size-sm: 0.88rem;                              /* Captions, Meta, & Pills */
--font-size-xs: 0.78rem;                              /* Micro-badges & Monospace Tags */
```

### 2.4 Spacing System

A mathematical 4px / 8px incremental scale ensures harmonious visual cadence across margins, padding, and layout gutters:

| Spacing Token | Pixels | Application |
| :--- | :--- | :--- |
| `--space-1` | 4px | Micro padding, indicator gaps, tight pill padding |
| `--space-2` | 8px | Icon-to-text gaps, badge padding, form field inner margins |
| `--space-3` | 12px | Compact item gaps, inline action buttons |
| `--space-4` | 16px | Standard component padding, compact grid gaps |
| `--space-5` | 20px | Card inner padding, list item gaps |
| `--space-6` | 24px | Standard card padding, medium grid gaps |
| `--space-8` | 32px | Section sub-group spacing, column gaps |
| `--space-10` | 40px | Major block spacing, header separation |
| `--space-12` | 48px | Primary section content gap |
| `--space-16` | 64px | Section header-to-grid spacing |
| `--space-24` | 96px | Desktop section vertical padding |
| `--space-32` | 128px | Hero & major transition boundaries |

**Layout Containers**:
- Maximum Container Width: `1360px` (`--container-max-width`)
- Editorial Narrow Width: `880px` (`--container-narrow-width`)
- Fluid Horizontal Gutter: `clamp(18px, 4vw, 56px)` (`--section-padding-x`)
- Fluid Section Vertical Rhythm: `clamp(70px, 9vh, 120px)` (`--section-padding-y`)

### 2.5 Z-Index Stack

Strict stacking context governance to prevent layering collisions:
- `1`: Fixed Canvas 3D Stream (`--z-canvas`)
- `2`: Cinematic Vignette Overlay (`--z-vignette`)
- `10`: Interactive Page Content (`--z-content`)
- `50`: Floating Action Elements (`--z-floating`, e.g., Back-to-Top)
- `90`: Mobile Navigation Drawer (`--z-drawer`)
- `100`: Fixed Navbar Header (`--z-navbar`)
- `200`: Modal Overlays & Dialogs (`--z-modal`, e.g., AI Resume Uploader)
- `300`: Toast Notifications (`--z-toast`)

---

## 3. Responsive Breakpoint & Device Matrix

Folioblox supports 5 distinct viewport tiers with tailored responsive rules:

```
[ < 480px ]       Mobile Portrait (Compact 1-col, 44px+ touch targets)
[ 481px - 767px ] Mobile Landscape / Phablet (Stacked forms, 1-col cards, 4:3 ratios)
[ 768px - 1024px] Tablet (Drawer navigation, 2-col grids, balanced spacing)
[ 1025px - 1440px] Laptop (Full desktop navigation, 2-3 col grids)
[ > 1440px ]      Desktop & Ultrawide (1360px centered containment, generous whitespace)
```

| Viewport Tier | Breakpoint Query | Layout Adaptations | Touch Target Rules |
| :--- | :--- | :--- | :--- |
| **Desktop / Ultrawide** | `> 1440px` | Centered 1360px container, 3-column project showcase, 4-column Bento pillars, generous negative space. | Standard pointer precision |
| **Laptop** | `1025px - 1440px` | Full sticky header with frosted backdrop, 2-column project browser layout, side-by-side about story. | Mouse / trackpad optimized |
| **Tablet** | `768px - 1024px` (`@media (max-width: 1024px)`) | Header nav links collapse into mobile hamburger toggle; 2-column skills grid; about & contact sections collapse to 1 column. | Min 44px touch targets |
| **Phablet / Landscape** | `481px - 767px` (`@media (max-width: 767px)`) | 1-column hero pillars, single-column projects with 4:3 aspect ratio, stacked form inputs, compressed vertical margins. | 44px touch targets; no hover-only disclosures |
| **Mobile Portrait** | `< 480px` (`@media (max-width: 480px)`) | Header contact CTA hides to prevent logo crowding; 1-column project action buttons; full-width modal dialogues; 20px card radius. | Full-bleed buttons, thumb-friendly hit areas |

---

## 4. Modular Component Architecture

Every component in the Folioblox Design System is built as a self-contained module:

### 4.1 Header & Navigation (`navbar.css` & `drawer.css`)
- **Sticky Glassmorphic Header**: Transitions smoothly from transparent to frosted blur (`backdrop-filter: blur(20px)`) once scrolled past 40px.
- **ScrollSpy Indicator**: Highlights active anchor links in real time based on scroll viewport intersection.
- **Accessible Mobile Drawer**: Built with ARIA dialog semantics (`role="dialog"`, `aria-modal="true"`, `aria-controls="mobileDrawer"`), focus trapping, and `Escape` key dismissal.

### 4.2 Hero Section (`hero.css`)
- **Dual-Pane Composition**: Left pane delivers the primary identity hierarchy (Availability Badge, Monospace Micro-Tag, Grand Display Name, Subtitle, and Call-to-Actions). Right pane features a card with an avatar portrait, atmospheric radial glow, and floating metadata badges.
- **Bento Metric Indicators**: 4-card statistics cluster delivering high-impact metrics (Years Experience, Production Deploys, Systems Engineered, Performance Ratings) with spring hover lift.

### 4.3 Tech Skills Matrix (`skills.css`)
- **5-Tier Capability Grid**: Categorized into Frontend Architecture, Backend & Microservices, Database & Caching, DevOps & Cloud, and Tooling & Architecture.
- **Interactive Badges**: Monospace chip tags with subtle hover glow effects and progress indicators.

### 4.4 Projects Showcase Browser (`projects.css`)
- **Simulated Browser Chrome**: Mac-style traffic light window controls (Red, Yellow, Green), SSL security padlock, and monospace URL bar.
- **Dual Action Bar**: Distinct buttons for "View Source on GitHub" and "Launch Live Demo", accompanied by verified tech stack tags.

### 4.5 Experience & Education Timelines (`experience.css` & `education.css`)
- **Vertical Node Kinematics**: Luminous node dots with vertical connectors indicating chronological progression.
- **High-Contrast Typography**: Clear separation between company, role, tenure, key achievements, and technology chips.

### 4.6 Filterable Certifications (`certificates.css`)
- **Category Filter Tabs**: Live interactive filters for All, Cloud & DevOps, Web & Frontend, and AI / Engineering.
- **Credential Verification**: Direct links with verification badges and credential IDs.

### 4.7 Contact & Global Collaboration (`contact.css`)
- **Global Timezone Radar**: Live timezone status chips indicating candidate availability across US, European, and Asian business hours.
- **Live Form Engine**: Comprehensive client-side validation, anti-double-submission state, and floating toast alert feedback (`#toastNotification`).

### 4.8 AI Resume Auto-Sync Modal (`upload-modal.css`)
- **Drag-and-Drop Zone**: Supports PDF and DOCX resume uploads up to 10MB.
- **Live Progress & Backup**: Visual percentage progress bar, automated timestamped JSON backup, and instant in-memory DOM re-rendering.

---

## 5. Directory Structure & File Organization

```
d:/Project/Protfolio/
├── assets/                             # Static brand media & resume documents
│   ├── Md_Matloob_Alam_Software_Developer_Resume.pdf
│   ├── profile-avatar.svg
│   ├── project-cloudscale.svg
│   ├── project-nexusui.svg
│   └── project-pulsemetrics.svg
├── css/
│   ├── variables.css                   # Master Design Tokens (colors, typography, spacing, radii)
│   ├── reset.css                       # High-contrast CSS reset & accessibility base
│   ├── layout.css                      # Container limits, vignettes, canvas underlay
│   ├── animations.css                  # Keyframe animations, radar pulses & reduced-motion
│   ├── responsive.css                  # Cross-device breakpoint rules (mobile to desktop)
│   ├── main.css                        # Master stylesheet bundle orchestrator
│   └── components/                     # 15 modular, reusable component stylesheets
│       ├── navbar.css                  # Frosted sticky header & brand logo
│       ├── drawer.css                  # Accessible mobile dialog drawer
│       ├── buttons.css                 # Tactile button hierarchy & pill links
│       ├── cards.css                   # Glassmorphic card base & hover physics
│       ├── hero.css                    # Hero identity, avatar card & Bento metrics
│       ├── brands.css                  # Tech ribbon ticker
│       ├── about.css                   # Bio narrative & KPI cards
│       ├── skills.css                  # 5-tier technical skill cards
│       ├── projects.css                # Browser mockup project cards
│       ├── experience.css              # Career timeline with luminous nodes
│       ├── education.css               # Academic qualifications & coursework
│       ├── certificates.css            # Filterable certification cards
│       ├── contact.css                 # Interactive form & global availability
│       ├── footer.css                  # Production footer & back-to-top button
│       └── upload-modal.css            # AI Resume upload & auto-sync dialog
├── data/
│   ├── portfolio.json                  # Single source of truth (Decoupled JSON schema)
│   └── backups/                        # Automated snapshots created before any update
├── js/
│   ├── canvas-stream.js                # 300-frame kinematic scroll scrub & DPR scaling
│   ├── render.js                       # Modular DOM rendering engine
│   ├── resume-uploader.js              # Drag-and-drop resume upload & AI sync handler
│   ├── theme.js                        # Theme switcher (Dark / Light) with localStorage
│   ├── navigation.js                   # Sticky navbar, ScrollSpy & mobile drawer
│   ├── animations.js                   # GSAP ScrollTrigger timeline orchestrator
│   ├── form.js                         # Form validation & toast notification engine
│   └── main.js                         # Application bootstrap orchestrator
├── server/
│   ├── api.js                          # Express REST API routes (/api/portfolio, /api/upload-resume)
│   ├── parse-resume.js                 # Gemini AI extractor & deterministic fallback parser
│   └── backup.js                       # Snapshot generator for rollback safety
├── index.html                          # Semantic HTML5 application shell
├── server.js                           # Production HTTP server
├── package.json                        # Node.js dependencies & scripts
├── test-runner.js                      # 86-test automated verification suite
└── DESIGN_SYSTEM.md                    # This authoritative design specification
```

---

## 6. Motion & Micro-Interaction Guidelines

### 6.1 Kinetic Principles
- **Spring-Damped Hover Transitions**: Elements respond to cursor presence using `cubic-bezier(0.2, 0.8, 0.2, 1)` with a subtle negative vertical translation (`translateY(-4px)` to `translateY(-8px)`).
- **Subtle Glow Escalation**: Hovering cards expands atmospheric box-shadows from `0 10px 30px rgba(0, 0, 0, 0.4)` to `0 24px 55px rgba(255, 87, 34, 0.16)`.
- **Canvas Scroll Kinematics**: 300 sequential high-resolution frames mapped to scroll depth with linear interpolation (`lerp = 0.085`) and bidirectional search fallback for instant scrubbing.

### 6.2 Reduced-Motion Compliance
Under `@media (prefers-reduced-motion: reduce)`:
- Canvas parallax and rotations are locked to static defaults.
- CSS transitions and animations collapse to `0.01ms`.
- Smooth scrolling falls back to standard instant jump to ensure users with vestibular sensitivities experience zero nausea.

---

## 7. Accessibility (a11y) Standards

- **WCAG 2.1 AA Conformity**: Text colors achieve a contrast ratio > 4.5:1 against glassmorphic and solid backdrops.
- **Skip-to-Content**: Hidden link at the top of the DOM becomes visible on first tab keypress, jumping directly to `#hero`.
- **Focus Rings**: Distinct, accessible `:focus-visible` styling (`outline: 2px solid var(--accent-orange); outline-offset: 3px`) applies only to keyboard navigators, preserving clean aesthetics for pointer users.
- **ARIA Semantics**:
  - Main Navigation: `<nav aria-label="Primary Navigation">`
  - Mobile Drawer: `role="dialog" aria-modal="true" aria-label="Mobile Navigation"`
  - Availability Badge: `role="status" aria-label="Current availability status"`
  - Toast Messages: `role="alert" aria-live="polite"`
  - File Upload Feedback: `role="alert" aria-live="assertive"`

---

## 8. Automated Quality Verification

The portfolio includes an automated 86-check test harness (`test-runner.js`) verifying:
1. **Data Store & Schema Integrity**: Profile information, resume URLs, 4 KPI stats, 5 skill categories, flagship projects, experience, degrees, and certificates.
2. **Asset Integrity**: Physical existence and byte validity of resume PDFs, SVG avatars, and project mockups.
3. **DOM Skeleton & Navigation Mapping**: All 8 section containers (`#hero` to `#contact`), mount points (`#heroMount` to `#contactMount`), anchor links, and theme toggle buttons.
4. **AI Resume Modal Integration**: Dropzone elements, progress bars, and modal stylesheets.
5. **Text Extraction & Deterministic Parsing**: PDF parsing accuracy, email validation, and candidate extraction.
6. **HTTP Endpoints & MIME Verification**: 200 OK responses and proper content-type headers for HTML, CSS, JavaScript, JSON, and PDF files.
7. **Form Validation Logic**: Regex pattern tests for email verification and required field constraints.
