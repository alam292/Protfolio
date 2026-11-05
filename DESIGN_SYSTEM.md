# Folioblox Design System & UI/UX Architecture

A premium, fully responsive design system for high-performance creative portfolios, interactive applications, and modern web experiences.

---

## 1. Design Tokens & Foundations

### 1.1 Color Palette
| Token Name | Value | Purpose |
| :--- | :--- | :--- |
| `--bg-dark` | `#030608` | Primary cinematic backdrop |
| `--bg-deep` | `#070b10` | Secondary surface backdrop |
| `--bg-surface` | `#0c1117` | Card base layer |
| `--accent-orange` | `#ff5722` | Core brand focal accent |
| `--accent-orange-hover` | `#ff6e3d` | Button & link hover states |
| `--accent-orange-light` | `#ff8a65` | Glow highlight tint |
| `--accent-orange-subtle` | `rgba(255, 87, 34, 0.12)` | Badge & icon wrap backgrounds |
| `--accent-orange-glow` | `rgba(255, 87, 34, 0.35)` | Atmospheric box-shadow |
| `--text-primary` | `#ffffff` | High contrast headlines & emphasis |
| `--text-secondary` | `#9ea3b0` | Body copy & secondary labels |
| `--text-muted` | `#646a78` | Captions, dates, and placeholders |
| `--color-success` | `#10b981` | Live availability radar indicator |

### 1.2 Glassmorphism System
- **Background**: `rgba(14, 18, 24, 0.55)`
- **Hover Background**: `rgba(20, 26, 36, 0.75)`
- **Border**: `1px solid rgba(255, 255, 255, 0.08)`
- **Hover Border**: `1px solid rgba(255, 87, 34, 0.40)`
- **Backdrop Blur**: `20px` (`backdrop-filter: blur(20px)`)
- **Card Shadow**: `0 16px 40px rgba(0, 0, 0, 0.4)`
- **Interactive Lift**: `translateY(-4px)` with spring easing

### 1.3 Fluid Typography Scale
Built using CSS `clamp()` to scale fluidly without abrupt jumping:
- **Hero Title**: `clamp(3.2rem, 7.5vw, 6.8rem)` (`font-weight: 800`)
- **Section Title**: `clamp(2.2rem, 4.2vw, 3.8rem)` (`font-weight: 800`)
- **Subheading**: `clamp(1.4rem, 2.2vw, 1.85rem)` (`font-weight: 700`)
- **Card Title**: `clamp(1.15rem, 1.6vw, 1.35rem)` (`font-weight: 700`)
- **Body Large / Lead**: `clamp(1.05rem, 1.4vw, 1.35rem)` (`font-weight: 500`)
- **Body Text**: `0.98rem` (`line-height: 1.68`)
- **Small / Meta**: `0.88rem` (`font-weight: 600`)
- **Micro Badges**: `0.78rem` (`letter-spacing: 0.08em`)

### 1.4 Spacing Scale
- 4px / 8px scale: `--space-1` (4px), `--space-2` (8px), `--space-3` (12px), `--space-4` (16px), `--space-5` (20px), `--space-6` (24px), `--space-8` (32px), `--space-10` (40px), `--space-12` (48px), `--space-16` (64px).
- Horizontal Gutters: `clamp(18px, 4vw, 56px)`
- Vertical Section Rhythm: `clamp(70px, 9vh, 120px)`

---

## 2. Responsive Breakpoint Standards

| Device Tier | Viewport Width | Layout Adaptations |
| :--- | :--- | :--- |
| **Desktop / Ultrawide** | `> 1440px` | 1360px container containment, 3-column project grid, 4-column pillars, generous negative space. |
| **Laptop** | `1025px - 1440px` | Balanced 3-column project showcase, full desktop navbar with sticky blur. |
| **Tablet** | `768px - 1024px` | Hamburger drawer navigation, 2-column pillars grid, 1-column about story, 2-column project showcase. |
| **Phablet / Landscape** | `481px - 767px` | 1-column pillars, single-column showcase with 4:3 aspect ratio, stacked form inputs. |
| **Mobile Portrait** | `< 480px` | High-contrast compact headers, 1:1 project ratio, 44px+ touch targets, hidden long CTA in navbar to prevent clipping. |

---

## 3. Modular Architecture & Code Organization

```
portfolio/
├── assets/                       # Static imagery & brand media
│   ├── bottle.jpg
│   ├── headphones.jpg
│   └── jacket.jpg
├── ezgif-8638738b594a7204-jpg/   # 300-frame scroll-scrub sequence
├── css/
│   ├── variables.css             # Design tokens (colors, type, spacing, radii)
│   ├── reset.css                 # Modern CSS reset & accessibility base
│   ├── layout.css                # Fixed canvas, overlays, sections, headers
│   ├── animations.css            # Radar pulse, keyframes & reduced-motion
│   ├── responsive.css            # Breakpoint queries for mobile/tablet/laptop/desktop
│   ├── main.css                  # Master CSS bundle
│   └── components/
│       ├── navbar.css            # Frosted sticky header & logo
│       ├── drawer.css            # Accessible full-screen mobile menu
│       ├── buttons.css           # Tactile button system & icon accents
│       ├── cards.css             # Glassmorphism cards & hover physics
│       ├── hero.css              # Hero typography & 4 service pillars
│       ├── brands.css            # Brand client ticker ribbon
│       ├── about.css             # Story card, live status badge & metrics
│       ├── skills.css            # Tech capability cards & pill tags
│       ├── projects.css          # Editorial showcase & image cards
│       ├── experience.css        # Interactive career timeline
│       ├── education.css         # Academic qualifications & honors
│       ├── certificates.css      # Verified certifications & badge links
│       ├── contact.css           # Details, social circles & responsive form
│       └── footer.css            # Footer bar & back-to-top button
├── js/
│   ├── canvas-stream.js          # 300-frame canvas kinematics & DPR loader
│   ├── navigation.js             # Sticky header, drawer ARIA & scrollspy
│   ├── animations.js             # GSAP ScrollTrigger timeline orchestrator
│   ├── form.js                   # Interactive validation & feedback toast
│   └── main.js                   # Application bootstrap orchestrator
├── server.js                     # Local streaming HTTP server
├── package.json
└── index.html                    # Semantic, modular HTML5 template
```

---

## 4. Key Interactive Components

1. **Kinematic Canvas Stream**
   - 300 individual JPG frames synchronized with page scroll depth.
   - Kinematic interpolation with smooth dampening (`lerp factor = 0.085`).
   - Bidirectional search algorithm for closest loaded frame fallback during fast scrolls.
   - Native DPR scaling (up to `2x`) for retina sharpness without excessive memory overhead.
   - Multi-axis mouse parallax with smooth spring dampening.

2. **Accessible Navigation & Drawer**
   - Sticky navbar with blur backdrop filter activated after `40px` scroll.
   - Full ARIA compliance: `aria-expanded`, `aria-controls`, `aria-label`, `role="dialog"`, `aria-modal="true"`.
   - Focus trapping & Escape key listener for keyboard navigation.
   - Real-time ScrollSpy highlighting the active section in both desktop and mobile views.

3. **Form with Live Toast Feedback**
   - HTML5 validation with interactive error handling.
   - Animated floating toast feedback (`#toastNotification`) with auto-dismiss timer.
   - Double-submit prevention with visual loading states.

4. **Accessibility (a11y)**
   - Hidden skip-to-content navigation link for screen readers.
   - Dedicated `@media (prefers-reduced-motion: reduce)` rules disabling heavy animations.
   - Distinct, accessible `:focus-visible` outline rings with 3px offset.

