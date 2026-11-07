# 🗄️ Database Implementation Plan & Architecture Report

> **Project:** Folioblox AI-Powered Portfolio & Dynamic Backend  
> **Backend Stack:** Python (FastAPI + Uvicorn) + SQLAlchemy ORM  
> **Storage Engines:** SQLite (Local Dev) & PostgreSQL / Supabase / Neon (Production Cloud)  
> **Implementation Status:** 🟢 **100% COMPLETED & VERIFIED (24/24 Tests Passed)**  
> **Last Updated:** 2026-11-08  

---

## 📌 1. Project Background & Transformation

Pehle yeh portfolio system purely **File-Based** disk storage par dependent tha (`data/portfolio.json` aur `data/backups/`). Contact submissions sirf frontend simulation par the aur database persistence nahi tha.

Ab pura system **Dual-Engine SQLAlchemy Architecture** par upgrade ho chuka hai:
- ✅ **Local Development:** Zero-setup **SQLite** (`data/portfolio.db`) - koi external software install karne ki jarurat nahi.
- ✅ **Cloud Production:** Cloud PostgreSQL (Neon / Supabase / Render) - sirf `.env` mein `DATABASE_URL` dene par automatic connect hota hai.
- ✅ **Zero-Downtime Fallback:** Agar DB unreachable ho, toh system automatically `data/portfolio.json` se read karke website ko 100% online rakhta hai.
- ✅ **Real Contact Storage:** Recruiters aur clients ke messages `contact_messages` table mein permanently store hote hain.

---

## 🏗️ 2. Architectural Overview

```mermaid
flowchart TD
    subgraph Client["Frontend Layer (Browser)"]
        UI["Portfolio UI & Real-Time IST Clock"]
        Form["Contact Transmission Form (fetch /api/contact)"]
        AdminUI["AI Resume Upload & PIN Admin Modal"]
    end

    subgraph Backend["FastAPI Backend (app.py)"]
        Lifespan["Startup Lifespan Seeder"]
        HealthRoute["GET /api/health (Database Status)"]
        PortRoute["GET /api/portfolio (DB-first fetch)"]
        ContactRoute["POST /api/contact"]
        AdminRoute["GET /api/admin/messages (PIN Protected)"]
        RollbackRoute["POST /api/restore-backup"]
        PublishRoute["POST /api/publish-portfolio"]
    end

    subgraph ORMLayer["SQLAlchemy ORM Layer (server_py/models.py)"]
        M1["Portfolio (Active schema)"]
        M2["PortfolioVersion (Snapshots)"]
        M3["ContactMessage (Inquiries)"]
        M4["AuditLog (Activity tracking)"]
        FallbackEngine["Graceful JSON Fallback Engine"]
    end

    subgraph StorageLayer["Data Storage Engines"]
        SQLiteDB[("SQLite: data/portfolio.db (Local)")]
        CloudPG[("PostgreSQL: Neon / Supabase (Cloud)")]
        LocalJSON[("data/portfolio.json (File Sync)")]
    end

    UI --> PortRoute & HealthRoute
    Form --> ContactRoute
    AdminUI --> AdminRoute & RollbackRoute & PublishRoute

    Lifespan --> ORMLayer
    PortRoute & ContactRoute & AdminRoute & RollbackRoute & PublishRoute --> ORMLayer

    ORMLayer -.->|"Default (.env unset)"| SQLiteDB
    ORMLayer -.->|"DATABASE_URL provided"| CloudPG
    ORMLayer -.->|"DB Unreachable"| FallbackEngine
    FallbackEngine --> LocalJSON
```

---

## 📊 3. Database Schema Tables

### 1️⃣ `portfolio_data` (Active Profile & Portfolio Schema)
Stores the live structured portfolio content.
| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Indexed | Record identifier |
| `version` | `VARCHAR(64)` | Indexed | Version tag (e.g., `v1.0.0-initial-seed`, `rollback-...`) |
| `content` | `JSON` | Not Null | Complete portfolio JSON schema (Profile, Skills, Projects, Experience, Stats) |
| `is_active` | `BOOLEAN` | Indexed | Status flag (True for live active record) |
| `created_at` | `DATETIME` | Default UTC | Creation timestamp |
| `updated_at` | `DATETIME` | Auto-update UTC | Last modified timestamp |

### 2️⃣ `portfolio_versions` (Historical Snapshots & Rollback)
Automatic snapshots created before publishing AI resume updates or manual changes.
| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Indexed | Version ID |
| `backup_id` | `VARCHAR(128)` | Unique, Indexed | Unique snapshot identifier (e.g. `portfolio-2026-11-08...`) |
| `reason` | `VARCHAR(255)` | Not Null | Reason (e.g. `Pre-publish automated snapshot`, `Migrated from file storage`) |
| `content` | `JSON` | Not Null | Full portfolio snapshot |
| `created_at` | `DATETIME` | Default UTC | Timestamp of snapshot creation |

### 3️⃣ `contact_messages` (Client & Recruiter Inquiries)
Captures real-time form submissions from the website.
| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Indexed | Transmission identifier |
| `name` | `VARCHAR(128)` | Not Null | Sender full name |
| `email` | `VARCHAR(255)` | Indexed, Not Null | Sender email address |
| `subject` | `VARCHAR(255)` | Not Null | Scope or subject |
| `message` | `TEXT` | Not Null | Message details (min 8 chars) |
| `service_type`| `VARCHAR(64)` | Nullable | Selected chip (e.g., `Power BI & SQL`, `Full-Stack Web App`) |
| `status` | `VARCHAR(32)` | Indexed | `unread`, `read`, `replied`, `archived` |
| `created_at` | `DATETIME` | Default UTC | Submission timestamp |

### 4️⃣ `audit_logs` (Security & Administrative Activity)
Tracks critical events for accountability.
| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Indexed | Log ID |
| `action` | `VARCHAR(64)` | Indexed | `publish_portfolio`, `rollback`, `contact_message_received`, etc. |
| `ip_address` | `VARCHAR(64)` | Nullable | Client IP address |
| `details` | `JSON` | Nullable | Operation metadata (version tag, restored backup, sender info) |
| `created_at` | `DATETIME` | Default UTC | Timestamp |

---

## 🚀 4. Phase-by-Phase Execution Audit

| Phase | Description | Key Deliverables | Verification Status |
| :--- | :--- | :--- | :---: |
| **Phase 1** | Dependencies & Database Core Module | • `requirements.txt` updated (`sqlalchemy`, `psycopg2-binary`)<br>• `server_py/config.py` configured with `DATABASE_URL`<br>• `server_py/database.py` created with dual engine & health ping | ✅ **PASSED**<br>`check_db_connection() == connected` |
| **Phase 2** | Schema Models & Auto-Seeder | • `server_py/models.py` (4 Tables defined)<br>• `server_py/seed_db.py` created<br>• Seeded live profile `Md MatlooB Alam`<br>• Migrated **139+ historical backup files** into DB | ✅ **PASSED**<br>Zero Data Loss |
| **Phase 3** | Service & Controller Layer | • `server_py/controller.py` upgraded<br>• `get_active_portfolio()` DB-first with fallback<br>• `publish_portfolio()` dual-sync persistence<br>• `save_contact_message()` & `list_contact_messages()` | ✅ **PASSED**<br>Backwards-Compatible |
| **Phase 4** | API Endpoints & Frontend Hook | • `app.py` lifespan seeder on server boot<br>• `/api/health` includes DB status<br>• `POST /api/contact` live endpoint<br>• `GET /api/admin/messages` (PIN protected)<br>• `js/form.js` real asynchronous `fetch` integration | ✅ **PASSED**<br>Live form dispatches to DB |
| **Phase 5** | Testing & Verification Suite | • `test_database_suite.py` created (24 automated tests)<br>• Tested URL protocol parser, models, fallback resilience, contact API, security bounds, audit logs | ✅ **PASSED**<br>**24/24 DB Tests Passed**<br>**31/31 Server Tests Passed** |

---

## 🧪 5. Automated Verification Results

### Test Suite 1: `test_database_suite.py`
```text
=================================================================
🗄️  DATABASE & DUAL-ENGINE INTEGRATION TEST SUITE
=================================================================

--- SUITE 1: ENGINE & URL PROTOCOL PARSING ---
  [PASS] Valid engine type resolved: 'sqlite'
  [PASS] URL starts with valid dialect protocol
  [PASS] Database connection check returned 'connected'
  [PASS] Health check engine matches active type: sqlite

--- SUITE 2: SCHEMA MODELS & SEEDING INTEGRITY ---
  [PASS] Seeder returned valid stats dictionary
  [PASS] Active Portfolio record exists in database
  [PASS] Portfolio content contains 'profile' object
  [PASS] Profile name matches verified portfolio identity
  [PASS] PortfolioVersion history preserved in DB (Count: 143)

--- SUITE 3: ZERO-DOWNTIME FALLBACK RESILIENCE ---
  [PASS] get_active_portfolio() succeeds with graceful fallback

--- SUITE 4: CONTACT INQUIRIES & VALIDATION ---
  [PASS] POST /api/contact rejects invalid email with HTTP 400
  [PASS] POST /api/contact rejects messages shorter than 8 characters
  [PASS] POST /api/contact saves valid inquiry with HTTP 201 Created
  [PASS] Contact response indicates success = True
  [PASS] Generated transmission ID: 5
  [PASS] GET /api/admin/messages with wrong PIN rejects with HTTP 401
  [PASS] GET /api/admin/messages with valid PIN returns HTTP 200
  [PASS] Admin messages count retrieved: 5

--- SUITE 5: ROLLBACK & AUDIT LOG INTEGRATION ---
  [PASS] list_backups() returns populated snapshot array (Count: 100)
  [PASS] AuditLog table records activity (Count: 9)

--- SUITE 6: FASTAPI ENDPOINT INTEGRATION ---
  [PASS] GET /api/health returned HTTP 200
  [PASS] GET /api/health contains database connectivity payload
  [PASS] GET /api/portfolio returned HTTP 200
  [PASS] GET /api/portfolio returns verified content

=================================================================
🏁 TEST RESULTS: 24 PASSED | 0 FAILED
=================================================================
```

### Test Suite 2: `test_python_server.py`
```text
============================================================
TOTAL TESTS: 31 | PASSED: 31 | FAILED: 0
>>> ALL PYTHON FASTAPI ENDPOINTS & LOGIC VERIFIED! 100% OPERATIONAL. <<<
============================================================
```

---

## 🌐 6. Cloud Production Deployment Guide

Jab aap is application ko **Render.com**, **Railway**, ya **Fly.io** par host karein, aap **Neon.tech** ya **Supabase** ka 100% Free PostgreSQL use kar sakte hain.

### Step-by-Step Setup:
1. **Free PostgreSQL Database Create Karein:**
   - [Neon.tech](https://neon.tech) par sign up karke ek free serverless PostgreSQL database banayein.
   - Database connection string copy karein:  
     `postgresql://username:password@ep-sample-1234.neon.tech/neondb?sslmode=require`
2. **Environment Variable Set Karein:**
   - Hosting provider (Render Dashboard) ke **Environment Variables** section mein add karein:
     ```env
     DATABASE_URL=postgresql://username:password@ep-sample-1234.neon.tech/neondb?sslmode=require
     ADMIN_UPLOAD_PIN=your_secret_pin
     GEMINI_API_KEY=your_gemini_api_key
     ```
3. **Deploy:**
   - Render automatically `pip install -r requirements.txt` chalayega.
   - Boot hote waqt FastAPI lifespan automatic database tables initialize karega aur `portfolio.json` seed karega.
   - Code mein koi bhi change karne ki jarurat nahi hai!
