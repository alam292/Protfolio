# 🌌 Folioblox — AI-Powered Dynamic Portfolio & Kinematics Engine

[![Live Portfolio](https://img.shields.io/badge/Live_Site-alam292--portfolio.pages.dev-00C7B7.svg?style=for-the-badge&logo=cloudflare&logoColor=white)](https://alam292-portfolio.pages.dev)
[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg?style=for-the-badge&logo=semver)](package.json)
[![Dual-Engine Backend](https://img.shields.io/badge/backend-FastAPI%20%7C%20Node.js-3776AB.svg?style=for-the-badge&logo=fastapi)](app.py)
[![Database](https://img.shields.io/badge/database-SQLAlchemy%20%7C%20PostgreSQL%20%7C%20SQLite-4169E1.svg?style=for-the-badge&logo=postgresql)](server_py/models.py)
[![AI Engine](https://img.shields.io/badge/AI_Engine-Google_Gemini_Flash-8E75C2.svg?style=for-the-badge&logo=google)](server_py/resume_parser.py)
[![Auth & Security](https://img.shields.io/badge/security-GIS_OAuth_2.0_%7C_Bcrypt_%7C_JWT-4285F4.svg?style=for-the-badge&logo=google)](server_py/config.py)
[![Test Suite](https://img.shields.io/badge/tests-237%2F237%20PASSING-success.svg?style=for-the-badge&logo=pytest)](test_database_suite.py)
[![Edge CDN](https://img.shields.io/badge/Edge_Hosting-Cloudflare_Pages-F38020.svg?style=for-the-badge&logo=cloudflare)](https://alam292-portfolio.pages.dev)
[![License](https://img.shields.io/badge/license-MIT-green.svg?style=for-the-badge)](LICENSE)

> A production-grade, cinematic portfolio and dynamic resume content engine engineered with a **dual-engine backend (Python FastAPI + Node.js)**, **SQLAlchemy 2.0 ORM (PostgreSQL & SQLite)**, **Google Identity Services (OAuth 2.0 GIS)**, **Bcrypt & Email OTP security**, a **300-frame hardware-accelerated HTML5 Canvas stream**, **GSAP ScrollTrigger kinematics**, and an enterprise **Glassmorphism Design System**.

---

<p align="center">
  <img src="assets/profile-avatar.svg" alt="Md MatlooB Alam - Profile Avatar" width="180" height="180" style="border-radius: 50%; box-shadow: 0 0 40px rgba(255, 87, 34, 0.35);" />
</p>
<p align="center">
  <strong>Md MatlooB Alam</strong><br>
  <em>Full Stack Developer &amp; UI Systems Engineer</em><br>
  <span>Bokaro Steel City, Jharkhand, India &bull; IST (UTC+5:30)</span>
</p>

---

## 📑 Table of Contents

- [✨ Project Overview](#-project-overview)
- [🏗️ System Architecture](#️-system-architecture)
- [🛠️ Tech Stack](#️-tech-stack)
- [🗄️ Relational Database & Models](#️-relational-database--models)
- [🔐 Authentication & Security Protocol](#-authentication--security-protocol)
- [🤖 AI Resume Auto-Sync & Safe Publishing Engine](#-ai-resume-auto-sync--safe-publishing-engine)
- [🔄 Core Workflows & Kinematics](#-core-workflows--kinematics)
  - [1. 300-Frame Canvas Stream Workflow](#1-300-frame-canvas-stream-workflow)
  - [2. Navigation & ScrollSpy Workflow](#2-navigation--scrollspy-workflow)
  - [3. Staged Resume Diff & 2-Step Publish Flow](#3-staged-resume-diff--2-step-publish-flow)
  - [4. Dual-Engine HTTP Streaming & API Service](#4-dual-engine-http-streaming--api-service)
  - [5. Contact Inquiry Relational Persistence](#5-contact-inquiry-relational-persistence)
- [📡 REST API Specification](#-rest-api-specification)
- [📂 Directory & Module Structure](#-directory--module-structure)
- [🚀 Quick Start & Installation](#-quick-start--installation)
  - [Environment Configuration](#environment-configuration)
  - [Option A: Python FastAPI Server (Recommended)](#option-a-python-fastapi-server-recommended)
  - [Option B: Node.js Streaming Server](#option-b-nodejs-streaming-server)
  - [Production Cloud Deployment](#production-cloud-deployment)
- [🧪 Automated Testing & Verification](#-automated-testing--verification)
- [📌 Versioning & Release History](#-versioning--release-history)
- [🎨 Design Tokens & UI Architecture](#-design-tokens--ui-architecture)
- [👨‍💻 Author & Contact](#-author--contact)

---

## ✨ Project Overview

Folioblox serves as both an interactive personal brand showcase and an enterprise-grade dynamic content management platform. Built with zero frontend framework overhead, it pairs instant Time-to-Interactive (TTI) and fluid 60 FPS scroll kinematics with a resilient full-stack cloud backend.

### 🌟 Key Highlights

- **Hardware-Accelerated Canvas Stream**: Preloads and renders 300 sequential high-resolution frames mapped seamlessly to viewport scroll kinematics via double-buffered 2D canvas interpolation (`desynchronized: true`).
- **Dual-Engine Full-Stack Backend**:
  - **Python FastAPI Core (`app.py`, `server_py/`)**: High-throughput async REST API, SQLAlchemy 2.0 ORM, Pydantic request models, and automated health monitoring.
  - **Node.js HTTP Server (`server.js`)**: Lightweight, zero-dependency streaming runtime supporting HTTP Range requests, dynamic MIME resolution, and immutable caching.
- **Dual-Database Parity**: Zero-configuration embedded SQLite (`data/portfolio.db`) for local development, seamlessly upgradeable to Cloud PostgreSQL (Render, Supabase, Neon) with schema auto-creation and connection pooling.
- **Multi-Provider Authentication & Security**:
  - Google Identity Services (GIS OAuth 2.0 ID token verification via `google-auth`).
  - Salted Bcrypt password hashing (12 rounds).
  - Cryptographic 6-digit Email OTP tokens with foreign key cascade deletion, max 3-attempt brute-force protection, and 5-minute expiration.
  - Signed PyJWT session tokens with HttpOnly / SameSite security cookies.
- **AI Resume Auto-Sync & Staged Diff Preview**: Drag-and-drop PDF/DOCX ingestion parsed via Google Gemini Flash API (`@google/genai`) or deterministic offline regex, staged through a visual diff review before committing.
- **1-Click Rollback & Version Snapshots**: Automated snapshot backups (`data/backups/`) and relational version records (`portfolio_versions`) protected by a 4-digit Admin PIN.
- **Dynamic Section Auto-Disabler**: Empty sections automatically hide both their DOM elements and corresponding navigation links across desktop header and mobile drawer.
- **Accessible & SEO Optimized**: 100% WCAG 2.1 AA compliant color contrast, ARIA landmarks, mobile drawer focus traps, and embedded JSON-LD schema.

---

## 🏗️ System Architecture

```mermaid
flowchart TB
    subgraph ClientLayer ["Client Browser Runtime (Edge & DOM)"]
        direction TB
        DOM["DOM UI Structure<br/>(#hero, #about, #skills, #projects, etc.)"]
        CanvasBg["Fixed HTML5 Canvas<br/>(#canvas 60fps Kinematics Stream)"]
        
        subgraph Controllers ["ES6+ Controller Architecture"]
            Main["js/main.js (Bootstrap Orchestrator)"]
            CS["js/canvas-stream.js (CanvasStream Engine)"]
            Nav["js/navigation.js (NavigationController)"]
            Anim["js/animations.js (GSAP ScrollTrigger)"]
            Render["js/render.js (Dynamic Data Mount)"]
            Uploader["js/resume-uploader.js (Upload & Diff Review)"]
            FormCtrl["js/form.js (Contact Form & Toasts)"]
        end

        Main --> CS
        Main --> Nav
        Main --> Anim
        Main --> Render
        Main --> Uploader
        Main --> FormCtrl

        CS --> CanvasBg
        Nav --> DOM
        Anim --> DOM
        Render --> DOM
        Uploader --> DOM
        FormCtrl --> DOM
    end

    subgraph DualBackend ["Dual-Engine Server Runtime"]
        direction TB
        subgraph PythonFastAPI ["Primary Backend (Python FastAPI :8000)"]
            FastAPIApp["app.py<br/>(FastAPI Lifespan & Static Mount)"]
            PyController["server_py/controller.py<br/>(Portfolio & Diff Logic)"]
            PyParser["server_py/resume_parser.py<br/>(Gemini Flash + Offline Parser)"]
            PyAuth["server_py/auth_security.py<br/>(OAuth, Bcrypt, JWT, OTP)"]
            PyDatabase["server_py/database.py<br/>(SQLAlchemy Engine Pool)"]
        end

        subgraph NodeRuntime ["Fallback Backend (Node.js :3000)"]
            NodeServer["server.js (Zero-Dependency HTTP Server)"]
            NodeController["server/resume-controller.js"]
            NodeParser["server/parse-resume.js"]
        end
    end

    subgraph DataStorage ["Persistent Database & Storage Layer"]
        SQLiteDB[("SQLite Database<br/>(data/portfolio.db)")]
        PostgresDB[("Cloud PostgreSQL<br/>(Render / Supabase / Neon)")]
        FileSnapshots[("Automated File Snapshots<br/>(data/backups/*.json)")]
        UploadsStorage[("Uploaded Resumes<br/>(uploads/*.pdf)")]
    end

    subgraph CloudHosting ["Production Cloud Deployments"]
        CloudflarePages["Cloudflare Pages Edge CDN<br/>(Static Assets & 300 Frames)"]
        RenderHosting["Render Web Service<br/>(FastAPI Uvicorn Backend)"]
    end

    ClientLayer <-->|Fetch / REST API| DualBackend
    FastAPIApp --> PyController
    FastAPIApp --> PyAuth
    PyController --> PyParser
    PyController --> PyDatabase
    PyDatabase --> SQLiteDB
    PyDatabase --> PostgresDB
    PyController --> FileSnapshots
    FastAPIApp --> UploadsStorage

    CloudflarePages -.->|Proxies API| RenderHosting
    RenderHosting --> FastAPIApp
```

---

## 🛠️ Tech Stack

```mermaid
mindmap
  root((Folioblox Stack))
    Frontend Runtime
      HTML5 Semantic Engine
      Vanilla ES6+ Controllers
      Double-Buffered Canvas 2D
      GSAP 3.12.5 & ScrollTrigger
      Glassmorphism CSS3 Tokens
    Backend & Services
      Python 3.10+ & FastAPI
      Uvicorn ASGI Engine
      Node.js v18+ Fallback Server
      Native HTTP Range Streaming
    Database & ORM
      SQLAlchemy 2.0 ORM
      SQLite3 local engine
      PostgreSQL cloud adapter
      Pydantic v2 Schema
    AI & Parser Engine
      Google Gemini Flash API
      PyPDF & PDF-Parse
      Python-Docx & Mammoth
      Deterministic Fallback Regex
    Security & Authentication
      Google OAuth GIS 2.0
      Bcrypt 12 Salt Rounds
      Signed PyJWT Tokens
      Secure 6-Digit Email OTP
      aiosmtplib Async Dispatcher
    DevOps & Cloud
      Cloudflare Pages Edge CDN
      Render Web Service
      GitHub Actions CI/CD
```

### Detailed Layer Breakdown

| Category | Technology | Version | Purpose & Usage |
| :--- | :--- | :--- | :--- |
| **Primary Backend** | **FastAPI** | `>= 0.110.0` | High-throughput asynchronous REST API server (`app.py`). |
| **ASGI Server** | **Uvicorn** | `>= 0.28.0` | Production ASGI web server running FastAPI with uvloop. |
| **Fallback Backend** | **Node.js** | `>= 18.0.0` | Zero-dependency HTTP static streaming and legacy API fallback (`server.js`). |
| **ORM & Database** | **SQLAlchemy** | `>= 2.0.0` | Enterprise declarative ORM with dual-engine pooling (`server_py/models.py`). |
| **Database Drivers** | **SQLite3 / psycopg2** | Modern Spec | Local embedded zero-setup DB or Cloud PostgreSQL connectivity. |
| **AI Intelligence** | **Google Gemini Flash** | `gemini-3.5-flash-lite` | Structured schema extraction from unformatted resume plain text. |
| **Text Extraction** | **PyPDF & PDF-Parse** | `4.1.0 / 2.4.5` | In-memory stream extraction for PDF documents without temporary disk leaks. |
| **Document Parsing** | **Python-Docx & Mammoth** | `1.1.0 / 1.13.0` | In-memory DOCX paragraph and table parsing. |
| **Authentication** | **Google Auth & PyJWT** | `2.28.0 / 2.8.0` | GIS ID token verification, JWT access tokens, and HttpOnly cookies. |
| **Password Hashing** | **Bcrypt & Passlib** | `4.1.2 / 1.7.4` | 12-round salted password hashing for credential storage. |
| **Email Dispatcher** | **aiosmtplib** | `>= 3.0.1` | Asynchronous SMTP delivery for OTP verification codes. |
| **Kinematics Engine** | **HTML5 2D Canvas** | W3C Standard | 300-frame sequential animation scrubbing with device pixel ratio scaling. |
| **Motion Orchestration**| **GSAP & ScrollTrigger**| `3.12.5` | Smooth scrubbing timelines, card reveals, and hardware-accelerated transforms. |
| **Styling & Design** | **Modular CSS3** | Modern Spec | Glassmorphism, CSS Custom Properties, fluid `clamp()` responsive scaling. |
| **Edge Deployment** | **Cloudflare Pages** | Production | Global Edge CDN caching with immutable headers for 300 animation frames. |

---

## 🗄️ Relational Database & Models

Folioblox implements a clean, relational schema using **SQLAlchemy 2.0** declarative models (`server_py/models.py`). The schema supports both SQLite and PostgreSQL without code changes.

```mermaid
erDiagram
    USERS ||--o{ EMAIL_OTPS : "has many (cascade delete)"
    USERS ||--o{ AUDIT_LOGS : "triggers"
    PORTFOLIO_DATA ||--o{ PORTFOLIO_VERSIONS : "tracks history"

    USERS {
        int id PK
        string google_sub UK "Nullable, indexed"
        string email UK "Indexed"
        string password_hash "Nullable"
        string name
        string avatar_url
        string role "default: user"
        boolean is_verified "default: false"
        datetime created_at
        datetime last_login
    }

    EMAIL_OTPS {
        int id PK
        int user_id FK "Cascade on delete"
        string otp_hash
        string token UK "UUID4 session token"
        string purpose "signup | password_reset"
        int attempts_count "Max 3 attempts"
        boolean is_used "default: false"
        datetime expires_at "5 minute expiry"
        datetime created_at
    }

    PORTFOLIO_DATA {
        int id PK
        string key UK "e.g. active"
        json content "8-section portfolio JSON"
        string version
        datetime updated_at
    }

    PORTFOLIO_VERSIONS {
        int id PK
        string version_tag UK "Timestamped snapshot ID"
        json content "Full snapshot backup"
        json diff_summary "Fields modified"
        string created_by
        datetime created_at
    }

    AUDIT_LOGS {
        int id PK
        string action "UPLOAD | PUBLISH | ROLLBACK | LOGIN"
        string actor_ip
        string status "SUCCESS | FAILED"
        json details
        datetime created_at
    }

    CONTACT_MESSAGES {
        int id PK
        string name
        string email
        string subject
        text message
        string client_ip
        boolean is_read "default: false"
        datetime created_at
    }
```

### Table Definitions

1. **`users`**: Multi-provider identity repository supporting passwordless Google OAuth, traditional password authentication, role segregation (`user`, `admin`), and profile attributes.
2. **`email_otps`**: Cryptographic OTP tokens linked to `users.id` via cascading foreign keys. Enforces an expiration threshold of 5 minutes and an attempt limit of 3 tries.
3. **`portfolio_data`**: Stores the active production portfolio schema in a relational JSON column, indexed by key (`active`).
4. **`portfolio_versions`**: Immutable historical archive of portfolio snapshots with JSON diff summaries, supporting 1-click rollbacks.
5. **`audit_logs`**: Security telemetry capturing all system mutations (file uploads, rollbacks, authentication attempts, publish events) with IP tracking.
6. **`contact_messages`**: Secure inbox capturing visitor inquiries submitted through the contact section with server-validated email strings and read markers.

---

## 🔐 Authentication & Security Protocol

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Admin
    participant UI as Auth Modal / Split-Screen
    participant API as FastAPI Backend (/api/auth)
    participant Google as Google Identity Services
    participant DB as Relational Database
    participant SMTP as aiosmtplib Dispatcher

    rect rgb(20, 25, 35)
        note over User, Google: Flow A: Google OAuth 2.0 (GIS One-Tap / Button)
        User->>UI: Click "Sign in with Google"
        UI->>Google: Retrieve GIS credential (ID Token JWT)
        Google-->>UI: Returns signed ID Token
        UI->>API: POST /api/auth/google { credential }
        API->>Google: Verify token signature via google-auth
        API->>DB: Query or Create User by google_sub / email
        API-->>UI: Set HttpOnly JWT Cookie (portfolio_auth) + Return Profile
    end

    rect rgb(25, 30, 40)
        note over User, SMTP: Flow B: Secure 6-Digit Email OTP
        User->>UI: Enter Email for Signup / Login
        UI->>API: POST /api/auth/otp/send { email, purpose }
        API->>API: Generate cryptographic 6-digit OTP & UUID4 token
        API->>DB: Store hashed OTP & token with 5m expiry
        API->>SMTP: Dispatch async HTML verification email
        SMTP-->>User: Delivers 6-digit OTP code to inbox
        User->>UI: Enters 6-digit OTP in UI boxes
        UI->>API: POST /api/auth/otp/verify { token, otp }
        API->>DB: Validate OTP hash, attempt count (< 3), expiry
        API-->>UI: Mark user verified & Issue JWT Cookie
    end
```

### Security Measures Implemented

- **Password Protection**: Salted Bcrypt hashing with 12 rounds. Raw passwords never touch the database.
- **OTP Hardening**: Only the SHA-256 salted hash of the OTP is stored in `email_otps`. Tokens automatically expire in 300 seconds (5 minutes) and lock out after 3 invalid attempts.
- **Session Tokens**: JWT sessions signed with 256-bit entropy (`JWT_SECRET_KEY`), transmitted via `HttpOnly`, `SameSite=Lax`, and `Secure` cookies.
- **Path Traversal Shield**: All file resolution logic in both Node.js and FastAPI enforces boundary checks against `PUBLIC_DIR` and `BACKUPS_DIR`, rejecting traversal sequences (`../`, `..\`) with HTTP 400/403.
- **Privileged Actions**: Portfolio publishing, snapshot restoration, and message inbox queries require valid authentication or 4-digit Admin PIN verification.

---

## 🤖 AI Resume Auto-Sync & Safe Publishing Engine

Folioblox includes an intelligent resume parsing engine that updates the live portfolio without touching codebase files:

```mermaid
flowchart TD
    Upload["User drops PDF/DOCX in Modal"] --> Ingest["Extract in-memory text (PyPDF / PDF-Parse)"]
    Ingest --> AI{"Google Gemini API Available?"}
    AI -- Yes --> Gemini["Transform text via Gemini 3.5 Flash"]
    AI -- No / Timeout --> Fallback["Deterministic Regex & Rule-Based Parser"]
    Gemini --> Normalize["Validate & Normalize 8-Section Schema"]
    Fallback --> Normalize
    Normalize --> Stage["Stage JSON Schema in Memory (Draft)"]
    Stage --> DiffEngine["Compute Structured JSON Diff vs Active Portfolio"]
    DiffEngine --> ReviewModal["Display Split-Screen Diff Preview to User"]
    
    ReviewModal --> Choice{"User Confirms Changes?"}
    Choice -- Discard --> Abort["Erase draft & preserve current site"]
    Choice -- Confirm --> PIN["Verify 4-Digit Admin PIN"]
    PIN --> Backup["Generate Timestamped Backup Snapshot"]
    Backup --> SaveDB["Persist to Database & Atomic Write portfolio.json"]
    SaveDB --> LiveDispatch["Trigger portfolio:updated DOM Re-render"]
```

### Staged 2-Step Publishing Flow
1. **Upload & Diff (`POST /api/upload-resume?preview=true`)**: The resume is parsed and analyzed against the active database state. A structured diff summary (`name`, `title`, `added_skills`, `modified_highlights`, `delta_experience`) is returned. The active website is **not modified**.
2. **Review & Confirm**: The split-screen diff modal displays current vs incoming data.
3. **Safe Publish (`POST /api/publish-portfolio`)**: Upon valid Admin PIN verification, a timestamped snapshot is archived to `data/backups/` and `portfolio_versions`. The active portfolio is committed to the database and `data/portfolio.json`.

---

## 🔄 Core Workflows & Kinematics

### 1. 300-Frame Canvas Stream Workflow

The background animation is driven by 300 high-resolution sequential frames rendered on a hardware-accelerated HTML5 Canvas:
- **Normalized Scroll Coordinates**: Viewport scroll position `Y` is normalized from `0.0` (hero top) to `1.0` (footer bottom).
- **Sub-Pixel Lerp Interpolation**: A linear interpolation equation (`currentFrame += (targetFrame - currentFrame) * 0.15`) smooths rapid scrubbing, eliminating jagged jumps.
- **Aspect-Ratio Cover Calculation**: Calculates canvas scaling dynamically to cover the viewport without stretching or distortion.
- **Dynamic Device Pixel Ratio (DPR)**: Scales to `window.devicePixelRatio` capped at `2.0` to balance crisp retina fidelity with GPU memory efficiency.

### 2. Navigation & ScrollSpy Workflow

- **Frosted Sticky Header**: Detects scroll offsets `> 20px` to apply `backdrop-filter: blur(16px)` and elevate the navigation bar.
- **IntersectionObserver ScrollSpy**: Actively monitors all 8 section landmarks (`#hero`, `#about`, `#skills`, `#projects`, `#experience`, `#education`, `#certificates`, `#contact`), highlighting active navigation links in real time.
- **Dynamic Section Auto-Disabler (`checkSectionEnabled`)**: If an uploaded resume lacks certifications or experience, the renderer hides the section and eliminates its link from the desktop navbar and mobile drawer.

### 3. Staged Resume Diff & 2-Step Publish Flow

- **Safe Staging**: Uploading a resume in preview mode generates an in-memory draft without altering the active website.
- **Automated Safety Backups**: Every publish or rollback action automatically generates a safety snapshot in `data/backups/`.
- **Version History Drawer**: The slide-out Version History panel allows 1-click rollbacks to any prior version.

### 4. Dual-Engine HTTP Streaming & API Service

- **FastAPI Core (`app.py`)**: Asynchronous, non-blocking REST endpoints with full JSON schema validation.
- **Node.js Fallback (`server.js`)**: Static streaming using `fs.createReadStream().pipe(res)` with immutable caching for frames (`Cache-Control: public, max-age=31536000, immutable`).

### 5. Contact Inquiry Relational Persistence

- Visitors submitting the contact form trigger `POST /api/contact`.
- Inputs undergo email regex validation and length enforcement before being written to the `contact_messages` table.
- Admins can query incoming messages securely via `GET /api/admin/messages?pin=1234`.

---

## 📡 REST API Specification

| Endpoint | Method | Auth / Protection | Purpose |
| :--- | :---: | :---: | :--- |
| `/api/health` | `GET` | Public | Returns system health, active database engine (`sqlite` / `postgresql`), and table status. |
| `/api/portfolio` | `GET` | Public | Fetches the active 8-section portfolio JSON schema. |
| `/api/upload-resume` | `POST` | Public / Preview | Uploads PDF/DOCX. With `?preview=true`, parses and returns staged diff without publishing. |
| `/api/publish-portfolio` | `POST` | Admin PIN | Commits staged portfolio draft to database and disk, creating an automated backup. |
| `/api/backups` | `GET` | Public | Lists all saved portfolio version snapshots with timestamps and file sizes. |
| `/api/restore-backup` | `POST` | Admin PIN | Restores a selected snapshot, creating a pre-rollback safety backup first. |
| `/api/verify-pin` | `POST` | Public | Validates a 4-digit Admin PIN without executing sensitive operations. |
| `/api/contact` | `POST` | Public (Validated) | Validates and stores incoming visitor inquiry into `contact_messages` table. |
| `/api/admin/messages` | `GET` | Admin PIN | Retrieves all captured contact messages with timestamps and read states. |
| `/api/auth/google` | `POST` | Google GIS Token | Verifies Google ID token, queries/creates user, issues HttpOnly JWT session cookie. |
| `/api/auth/otp/send` | `POST` | Public | Generates 6-digit OTP, records salted hash in database, dispatches async email. |
| `/api/auth/otp/verify` | `POST` | Session Token | Validates 6-digit OTP, enforces max 3 attempts and 5m expiry, marks user verified. |

---

## 📂 Directory & Module Structure

```text
d:\Project\Protfolio\
├── assets/                               # Static brand media & vector graphics
│   ├── profile-avatar.svg                # Author avatar badge
│   ├── project-cloudscale.svg            # CloudScale AI SaaS mockup
│   ├── project-nexusui.svg               # NexusUI design system mockup
│   ├── project-pulsemetrics.svg          # PulseMetrics telemetry mockup
│   ├── project-devflow.svg               # DevFlow CI/CD mockup
│   ├── Md_MatlooB_Alam_Resume.pdf        # Verified master CV
│   └── resume.pdf                        # Quick download alias
├── css/                                  # Modular Design System Architecture
│   ├── main.css                          # Central stylesheet orchestrator
│   ├── reset.css                         # CSS reset & base box sizing
│   ├── variables.css                     # Global design tokens (colors, fonts, radii)
│   ├── layout.css                        # Canvas container, vignette & layout scaffolding
│   ├── animations.css                    # Keyframe animations & glow pulses
│   ├── responsive.css                    # Fluid breakpoint media queries (320px - 1440px+)
│   └── components/                       # Encapsulated component styling
│       ├── about.css                     # About section narrative & metrics
│       ├── cards.css                     # Glassmorphic card surfaces & hover states
│       ├── certificates.css              # Credential cards & rosette emblems
│       ├── contact.css                   # Contact cards, form inputs & status badge
│       ├── drawer.css                    # Mobile slide-out navigation drawer
│       ├── education.css                 # Academic timeline & coursework cards
│       ├── experience.css                # Career timeline & achievements
│       ├── hero.css                      # Hero headline, badges & quick pillars
│       ├── navbar.css                    # Desktop sticky header & logo styling
│       ├── projects.css                  # Project browser chrome & tags
│       ├── skills.css                    # 6-category technology showcase & animations
│       └── upload-modal.css              # AI upload, diff preview & version history
├── data/                                 # Relational Database & Snapshots
│   ├── portfolio.db                      # SQLite relational database (auto-created)
│   ├── portfolio.json                    # Active production portfolio data
│   └── backups/                          # Timestamped rollback snapshot archive
├── doc/                                  # Architectural specifications & guides
│   ├── ABOUT_ME_PLAN.md                  # Narrative strategy specifications
│   ├── CERTIFICATIONS_ACHIEVEMENTS_PLAN.md
│   ├── CONTACT_SECTION_PLAN.md
│   ├── EDUCATION_PLAN.md
│   ├── EXPERIENCE_PLAN.md
│   ├── FEATURED_PROJECTS_PLAN.md
│   ├── HOME_SECTION_DYNAMIC_PLAN.md
│   ├── TECHNICAL_SKILLS_PLAN.md
│   └── plan.md                           # Master architectural overview
├── ezgif-8638738b594a7204-jpg/           # 300-frame sequential animation stream
│   ├── ezgif-frame-001.jpg               # Hero intro frame
│   ├── ...                               # Frames 002 through 299
│   └── ezgif-frame-300.jpg               # Outro culminating frame
├── js/                                   # Vanilla ES6+ Controllers
│   ├── animations.js                     # GSAP ScrollTrigger timeline orchestrator
│   ├── canvas-stream.js                  # 300-frame canvas kinematics & DPR loader
│   ├── form.js                           # Form validation & floating toast alerts
│   ├── main.js                           # Master bootstrap & initialization
│   ├── navigation.js                     # Sticky navbar, drawer toggle & scrollspy
│   ├── render.js                         # Dynamic 8-section renderer from API
│   ├── resume-uploader.js                # Upload modal, diff preview & rollback UI
│   ├── skills-component.js               # React 18 / SVG skills showcase component
│   └── theme.js                          # Slate & Dark theme controller
├── server/                               # Node.js Fallback Controllers
│   ├── parse-resume.js                   # Node Gemini AI & rule-based parser
│   └── resume-controller.js              # Multer upload & snapshot management
├── server_py/                            # Python FastAPI Backend Architecture
│   ├── __init__.py                       # Package initializer
│   ├── auth_security.py                  # OAuth GIS, Bcrypt, JWT & OTP logic
│   ├── config.py                         # Typed settings & environment loader
│   ├── controller.py                     # Portfolio CRUD, diff engine & backups
│   ├── database.py                       # SQLAlchemy engine & session factory
│   ├── github_sync.py                    # Automated repository synchronization
│   ├── models.py                         # SQLAlchemy declarative ORM models
│   ├── resume_parser.py                  # Python Gemini Flash & PyPDF parser
│   └── seed_db.py                        # Database seeder & schema initialization
├── uploads/                              # Temporary upload staging directory
├── app.py                                # Primary FastAPI application & static mount
├── server.js                             # Zero-dependency Node.js streaming server
├── requirements.txt                      # Python dependencies (FastAPI, SQLAlchemy, etc.)
├── package.json                          # Node.js dependencies & scripts
├── test_database_suite.py                # 24-test Python Database & ORM suite
├── test_python_server.py                 # 31-test Python FastAPI endpoint suite
├── test-runner.js                        # 182-test Node.js architectural verification runner
├── render.yaml                           # Render cloud deployment blueprint
├── Procfile                              # ASGI production startup command
├── _headers                              # Cloudflare Pages edge security headers
├── _redirects                            # Cloudflare Pages SPA fallback redirects
├── start.bat                             # One-click Windows launch script
└── README.md                             # Authoritative technical documentation
```

---

## 🚀 Quick Start & Installation

### Environment Configuration

Create a `.env` file in the project root based on [`.env.example`](.env.example):

```bash
# Copy template to active environment
cp .env.example .env
```

Key environment variables:
```ini
# Server Configuration
PORT=8000
ADMIN_UPLOAD_PIN=1234

# Relational Database (Defaults to SQLite if omitted)
# DATABASE_URL=postgresql://user:password@host:5432/dbname
DATABASE_URL=sqlite:///data/portfolio.db

# AI Resume Engine
GEMINI_API_KEY=your_google_gemini_api_key_here

# Google OAuth 2.0 GIS Authentication
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Cryptographic Session Security
JWT_SECRET_KEY=generate_with_openssl_rand_hex_32
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Asynchronous SMTP Dispatcher (for Email OTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
MAIL_FROM=Folioblox Auth <your_email@gmail.com>
```

---

### Option A: Python FastAPI Server (Recommended)

1. **Create and Activate a Virtual Environment**:
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Initialize Database & Seed Data**:
   ```bash
   python -c "from server_py.seed_db import seed_initial_data; seed_initial_data()"
   ```

4. **Launch the FastAPI Server**:
   ```bash
   uvicorn app.py:app --host 0.0.0.0 --port 8000 --reload
   ```

5. **Visit the Portfolio**:
   Open [http://localhost:8000](http://localhost:8000) in your browser. Interactive API documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).

---

### Option B: Node.js Streaming Server

1. **Install Node Dependencies**:
   ```bash
   npm install
   ```

2. **Launch the Node Server**:
   ```bash
   npm start
   # Or directly: node server.js
   ```

3. **Visit the Portfolio**:
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Production Cloud Deployment

- **Edge Frontend**: Hosted globally on **Cloudflare Pages** connected to repository pushes on branch `main`. Global CDN caching with immutable headers for 300 sequential animation frames.
- **Backend API**: Hosted on **Render** via [`render.yaml`](render.yaml) or Docker container running `uvicorn app:app --host 0.0.0.0 --port $PORT`.
- **Database**: Cloud-hosted **PostgreSQL** (Render PostgreSQL, Supabase, Neon) connected via `DATABASE_URL`.

---

## 🧪 Automated Testing & Verification

The project includes **three automated test suites** guaranteeing architectural integrity, schema validity, ORM relationships, API endpoint health, and accessibility:

```mermaid
flowchart LR
    A["Total Checks: 237"] --> B["Node.js Runner<br/>(test-runner.js)<br/>182 Passed"]
    A --> C["Python API Suite<br/>(test_python_server.py)<br/>31 Passed"]
    A --> D["Python Database Suite<br/>(test_database_suite.py)<br/>24 Passed"]
```

### 1. Execute All Automated Test Suites

```bash
# 1. Run Node.js Architectural & Frontend Verification Suite (182 checks)
node test-runner.js

# 2. Run Python FastAPI Endpoint & Logic Suite (31 checks)
python test_python_server.py

# 3. Run Python Database, ORM & Dual-Engine Suite (24 checks)
python test_database_suite.py
```

### Comprehensive Test Suites Summary

| Suite Runner | Target Domain | Assertions | Status |
| :--- | :--- | :---: | :---: |
| `test-runner.js` | **Frontend, DOM, Schema & Node Server**<br>Validates 8 semantic sections, 30 SVG icons, React skills mount, dropzone DOM, in-memory parser, HTTP endpoints, diff preview, and 1-click rollback. | **182 / 182** | ✅ `PASS` |
| `test_python_server.py` | **FastAPI Python Endpoints & Security**<br>Validates `/api/health`, `/api/portfolio`, `/api/backups`, PIN verification (`/api/verify-pin`), static MIME types, path traversal shields, resume upload & diff staging, and snapshot restoration. | **31 / 31** | ✅ `PASS` |
| `test_database_suite.py` | **SQLAlchemy Database & ORM Models**<br>Validates URL protocol parsing, engine connection pooling, schema auto-creation, `User` and `EmailOTP` models, foreign key cascade deletion, zero-downtime fallback, contact persistence, and snapshot counts. | **24 / 24** | ✅ `PASS` |
| **Combined Quality Gate** | **Enterprise Full-Stack Architecture** | **237 / 237** | 🏆 **100% PRODUCTION READY** |

---

## 📌 Versioning & Release History

| Version | Release Date | Summary of Changes |
| :---: | :---: | :--- |
| **`v2.0.0`** | **November 2026** | **Full-Stack Enterprise Evolution: FastAPI, Dual-Engine Database & Auth Engine**<br>&bull; **Python FastAPI Backend (`app.py`, `server_py/`)**: High-performance async REST backend with Uvicorn, Pydantic validation, and Swagger documentation at `/docs`.<br>&bull; **Dual-Engine SQLAlchemy 2.0 ORM (`server_py/models.py`)**: Seamless parity across embedded SQLite (`data/portfolio.db`) and Cloud PostgreSQL (`psycopg2`) with connection pooling.<br>&bull; **Relational Models**: Added `PortfolioData`, `PortfolioVersion`, `AuditLog`, `ContactMessage`, `User`, and `EmailOTP` with cascade constraints.<br>&bull; **Multi-Provider Auth Protocol (`server_py/auth_security.py`)**: Google Identity Services (GIS OAuth 2.0 token verification), salted Bcrypt password hashing (12 rounds), and 6-digit secure Email OTP.<br>&bull; **Contact Inquiries Engine**: Relational storage for incoming messages via `POST /api/contact` with email RFC validation and PIN-protected admin inbox.<br>&bull; **Expanded Automated Test Coverage**: Added `test_python_server.py` (31 tests) and `test_database_suite.py` (24 tests), bringing total verified checks to **237 passing tests (0 failures)**.<br>&bull; **Cloud Deployment Blueprints**: Added [`render.yaml`](render.yaml) and [`Procfile`](Procfile) for zero-downtime cloud hosting on Render. |
| **`v1.4.0`** | **November 2026** | **Universal Dynamic System, Auto-Disabler & 1-Click Rollback**<br>&bull; **Universal Dynamic Sections**: Overhauled `js/render.js` to ensure 100% of all 8 sections adapt dynamically to any uploaded resume without hardcoded fallbacks.<br>&bull; **Intelligent Section Auto-Disabler (`checkSectionEnabled`)**: Empty or missing sections in resume data automatically hide their DOM containers and navigation menu links.<br>&bull; **Dynamic Branding & Header Logo**: Synchronized browser title and navbar branding dynamically with the parsed profile author.<br>&bull; **Dynamic Certificate Fallback Badges**: Missing certificate images automatically render glassmorphic credential cards with vector rosette emblems.<br>&bull; **1-Click Rollback & Version History**: Automated snapshot engine (`data/backups/`), Version History slide-out drawer, instant rollback restore API, and 4-digit Admin PIN protection.<br>&bull; **182 Automated Checks**: Full suite pass rate across 12 test suites in `test-runner.js`. |
| **`v1.3.0`** | **November 2026** | **Comprehensive Code Audit, Bug Fixes & Mobile Responsiveness Overhaul**<br>&bull; **Backend AI Parser Resilience**: Implemented `AbortController` and 8s timeout in `server/parse-resume.js` for instant fallback to deterministic rule parser.<br>&bull; **Mobile Drawer Full Scrollability**: Overhauled `css/components/drawer.css` with smooth touch scrolling across all viewports.<br>&bull; **Responsive Upload Modal**: Fixed viewport boundary constraints to prevent clipping on mobile devices.<br>&bull; **Responsive Architecture Cleanup**: Optimized mobile layout and touch insets down to 320px screens. |
| **`v1.2.0`** | **November 2026** | **Cloudflare Pages Production Deployment & Edge Optimization**<br>&bull; **Zero-Cost Global Hosting**: Deployed on Cloudflare Pages free tier with global Edge CDN caching across 330+ cities worldwide.<br>&bull; **Automated CI/CD**: Pushes to `main` trigger automated deployment within 30-45 seconds.<br>&bull; **Cinematic Frame Stream Deployment**: All 300 sequential animation frames deployed with 1-year immutable caching (`max-age=31536000, immutable`).<br>&bull; **Production Edge Headers**: Added `_headers` configuring `SAMEORIGIN`, `nosniff`, and `Permissions-Policy`. |
| **`v1.1.0`** | **November 2026** | **Modern Animated Technology Showcase Redesign**<br>&bull; Replaced legacy cards and pills with a minimalist category-wise showcase.<br>&bull; 6 structured categories with 30 authentic brand SVG vectors and zero external network requests.<br>&bull; React 18 component mounting, floating keyframe animations, and radiant brand hover glows. |
| **`v1.0.0`** | **November 2026** | **Initial Production Release**<br>&bull; 300-frame scroll-scrubbed canvas engine.<br>&bull; 8 complete modular sections, glassmorphism design system, and zero-dependency Node.js HTTP server. |

---

## 🎨 Design Tokens & UI Architecture

| Token Variable | Default Value | Role / Purpose |
| :--- | :--- | :--- |
| `--bg-dark` | `#030608` | Primary cinematic backdrop |
| `--bg-deep` | `#070b10` | Secondary surface backdrop |
| `--bg-surface` | `#0c1117` | Card base layer |
| `--accent-orange` | `#ff5722` | Core brand focal accent |
| `--accent-orange-hover` | `#ff6e3d` | Button & link hover states |
| `--accent-orange-glow` | `rgba(255, 87, 34, 0.35)` | Atmospheric box-shadow |
| `--glass-bg` | `rgba(14, 18, 24, 0.55)` | Translucent glass backdrop |
| `--glass-border` | `rgba(255, 255, 255, 0.08)`| Subtle luminescent glass border |

For complete design specifications, refer to [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

---

## 👨‍💻 Author & Contact

**Md MatlooB Alam**  
*Full Stack Developer &amp; UI Systems Engineer*

- **Live Portfolio**: [https://alam292-portfolio.pages.dev](https://alam292-portfolio.pages.dev)
- **GitHub**: [github.com/alam292](https://github.com/alam292)
- **Email**: [mdmatloobgaya@gmail.com](mailto:mdmatloobgaya@gmail.com)
- **Location**: Bokaro Steel City, Jharkhand, India (IST &bull; UTC+5:30)

---

*Crafted with precision, clean code, dual-engine power, and smooth scroll kinematics &bull; &copy; 2026 Md MatlooB Alam.*
