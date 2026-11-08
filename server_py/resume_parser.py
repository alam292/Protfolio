"""
resume_parser.py - Intelligent Multi-Format Resume Parser for Folioblox Portfolio
Extracts text from PDF/DOCX resumes and structures data into the portfolio.json schema.
Features dual-engine support: Google Gemini AI + 100% Offline Deterministic Rule-Based Fallback.
"""

import io
import os
import re
import json
import logging
from typing import Dict, Any, List, Optional
from pypdf import PdfReader

try:
    import docx
except ImportError:
    docx = None

logger = logging.getLogger("FoliobloxResumeParser")


def extract_raw_text(buffer: bytes, ext: str) -> str:
    """
    Extract raw text from an in-memory document buffer (PDF, DOCX, or TXT).
    """
    extension = (ext or "").lower().strip()
    if not extension.startswith("."):
        extension = f".{extension}"

    if extension == ".pdf":
        reader = PdfReader(io.BytesIO(buffer))
        text_pages = []
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text_pages.append(t)
        return "\n".join(text_pages).strip()

    elif extension in [".docx", ".doc"]:
        if docx is None:
            raise RuntimeError("python-docx is not installed for .docx parsing.")
        doc = docx.Document(io.BytesIO(buffer))
        full_text = []
        for para in doc.paragraphs:
            if para.text:
                full_text.append(para.text)
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    if cell.text:
                        full_text.append(cell.text)
        return "\n".join(full_text).strip()

    elif extension in [".txt", ".text"]:
        return buffer.decode("utf-8", errors="ignore").strip()

    else:
        raise ValueError(f"Unsupported file extension: {extension}. Only PDF, DOCX, and TXT are supported.")


# -------------------------------------------------------------
# Official Categories Template
# -------------------------------------------------------------

OFFICIAL_SKILLS_CATEGORIES_DEV = [
    {
        "id": "languages",
        "name": "Programming Languages",
        "icon": "code",
        "description": "Core programming languages utilized for full-stack engineering, robust typing, and high-performance algorithms.",
        "skills": [
            {"name": "Python", "icon": "python"},
            {"name": "Java", "icon": "java"},
            {"name": "JavaScript", "icon": "javascript"},
            {"name": "HTML5", "icon": "html5"},
            {"name": "CSS3", "icon": "css3"}
        ]
    },
    {
        "id": "frontend",
        "name": "Frontend Development",
        "icon": "layers",
        "description": "Modern frontend architectures, component systems, and high-fidelity responsive user interfaces.",
        "skills": [
            {"name": "React.js", "icon": "react"},
            {"name": "Next.js", "icon": "nextjs"},
            {"name": "Tailwind CSS", "icon": "tailwindcss"},
            {"name": "Bootstrap", "icon": "bootstrap"},
            {"name": "Redux", "icon": "redux"}
        ]
    },
    {
        "id": "backend",
        "name": "Backend Development",
        "icon": "server",
        "description": "High-throughput RESTful microservices, asynchronous execution, and enterprise web frameworks.",
        "skills": [
            {"name": "FastAPI", "icon": "fastapi"},
            {"name": "Django", "icon": "django"},
            {"name": "Node.js", "icon": "nodejs"},
            {"name": "Express.js", "icon": "express"},
            {"name": "REST API", "icon": "restapi"}
        ]
    },
    {
        "id": "databases",
        "name": "Databases",
        "icon": "database",
        "description": "Relational data modeling, schema normalization, and performant query optimization.",
        "skills": [
            {"name": "SQLAlchemy", "icon": "sqlalchemy"},
            {"name": "MySQL", "icon": "mysql"},
            {"name": "PostgreSQL", "icon": "postgresql"},
            {"name": "MongoDB", "icon": "mongodb"},
            {"name": "SQLite", "icon": "sqlite"}
        ]
    },
    {
        "id": "tools",
        "name": "Tools & Technologies",
        "icon": "cpu",
        "description": "Developer tooling, containerization, version control, and rigorous API testing suites.",
        "skills": [
            {"name": "Git", "icon": "git"},
            {"name": "GitHub", "icon": "github"},
            {"name": "VS Code", "icon": "vscode"},
            {"name": "Docker", "icon": "docker"},
            {"name": "Postman", "icon": "postman"},
            {"name": "Linux", "icon": "linux"}
        ]
    },
    {
        "id": "ai-tools",
        "name": "AI Development Tools",
        "icon": "zap",
        "description": "Advanced AI coding assistants and intelligent automation tools accelerating full-stack delivery.",
        "skills": [
            {"name": "ChatGPT", "icon": "chatgpt"},
            {"name": "Claude", "icon": "claude"},
            {"name": "Gemini", "icon": "gemini"},
            {"name": "Antigravity IDE", "icon": "antigravity"}
        ]
    }
]

OFFICIAL_SKILLS_CATEGORIES_DATA = [
    {
        "id": "languages",
        "name": "Programming & Databases",
        "icon": "code",
        "description": "Core programming languages and relational database engines for data manipulation.",
        "skills": [
            {"name": "Python", "icon": "python"},
            {"name": "SQL", "icon": "mysql"},
            {"name": "MySQL", "icon": "mysql"}
        ]
    },
    {
        "id": "frontend",
        "name": "Data Visualization & BI",
        "icon": "layers",
        "description": "Business Intelligence dashboards, KPI reports, and interactive visual analytics.",
        "skills": [
            {"name": "Power BI", "icon": "bootstrap"},
            {"name": "DAX", "icon": "fastapi"},
            {"name": "Power Query", "icon": "react"},
            {"name": "Tableau", "icon": "nextjs"}
        ]
    },
    {
        "id": "backend",
        "name": "Python Libraries & Tools",
        "icon": "server",
        "description": "Libraries for mathematical computation, automated EDA, and data processing.",
        "skills": [
            {"name": "Pandas", "icon": "python"},
            {"name": "NumPy", "icon": "python"},
            {"name": "Matplotlib", "icon": "django"},
            {"name": "Seaborn", "icon": "fastapi"}
        ]
    },
    {
        "id": "databases",
        "name": "Data Analysis & ETL",
        "icon": "database",
        "description": "Data extraction, transformation, cleaning, validation, and exploratory data analysis.",
        "skills": [
            {"name": "Data Cleaning", "icon": "sqlalchemy"},
            {"name": "ETL", "icon": "postgresql"},
            {"name": "EDA", "icon": "sqlite"},
            {"name": "Statistics", "icon": "mongodb"}
        ]
    },
    {
        "id": "tools",
        "name": "Spreadsheets & Dev Tools",
        "icon": "cpu",
        "description": "Spreadsheets, interactive computing environments, and collaborative version control.",
        "skills": [
            {"name": "Advanced Excel", "icon": "vscode"},
            {"name": "Jupyter Notebook", "icon": "python"},
            {"name": "Git", "icon": "git"},
            {"name": "GitHub", "icon": "github"}
        ]
    },
    {
        "id": "ai-tools",
        "name": "AI & Productivity Tools",
        "icon": "zap",
        "description": "Advanced AI assistance platforms and intelligent workflow automation environments.",
        "skills": [
            {"name": "ChatGPT", "icon": "chatgpt"},
            {"name": "Claude", "icon": "claude"},
            {"name": "Gemini", "icon": "gemini"},
            {"name": "Antigravity IDE", "icon": "antigravity"}
        ]
    }
]


# -------------------------------------------------------------
# Offline Deterministic Rule-Based Parser
# -------------------------------------------------------------

def fallback_rule_based_parser(raw_text: str, base_portfolio: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Deterministic rule-based resume parser that works 100% offline without any API keys or network connection.
    """
    result = json.loads(json.dumps(base_portfolio or {}))

    for key in ["profile", "stats", "about", "skills", "projects", "experience", "education", "certifications", "contact"]:
        if key not in result or not isinstance(result[key], (dict, list)):
            result[key] = [] if key == "stats" else {}

    lines = [line.strip() for line in raw_text.split("\n") if line.strip()]

    # Group lines by sections
    section_map: Dict[str, List[str]] = {"HEADER": []}
    current_section = "HEADER"
    known_sections = [
        "PROFESSIONAL SUMMARY",
        "TECHNICAL SKILLS",
        "EXPERIENCE",
        "PROJECTS",
        "EDUCATION",
        "CERTIFICATIONS & ACHIEVEMENTS"
    ]

    for line in lines:
        upper = line.upper()
        matched = next((s for s in known_sections if upper == s or upper.startswith(s)), None)
        if matched:
            current_section = matched
            section_map[current_section] = []
        else:
            section_map[current_section].append(line)

    # 1. Profile Extraction (Name, Email, GitHub, LinkedIn)
    header_lines = section_map.get("HEADER", [])
    if header_lines:
        potential_name = header_lines[0]
        if len(potential_name) < 50 and "@" not in potential_name and "http" not in potential_name.lower():
            result["profile"]["name"] = potential_name
            result["profile"]["shortName"] = potential_name.split()[0] if potential_name.split() else potential_name

    email_match = re.search(r"([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})", raw_text)
    if email_match:
        result["profile"]["email"] = email_match.group(1)
        result["contact"]["email"] = email_match.group(1)

    github_match = re.search(r"(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)", raw_text, re.IGNORECASE)
    if github_match:
        result["profile"]["githubUrl"] = f"https://github.com/{github_match.group(1)}"
        result["profile"]["githubUser"] = github_match.group(1)

    linkedin_match = re.search(r"(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)", raw_text, re.IGNORECASE)
    if linkedin_match:
        result["profile"]["linkedinUrl"] = f"https://linkedin.com/in/{linkedin_match.group(1)}"

    # 2. Professional Summary & Title
    summary_lines = section_map.get("PROFESSIONAL SUMMARY", [])
    full_summary = " ".join(summary_lines)
    is_data_analyst = bool(re.search(r"data analyst|power bi|pandas|dax|tableau", full_summary or raw_text, re.IGNORECASE))

    if full_summary:
        if is_data_analyst:
            result["profile"]["title"] = "Data Analyst Trainee & Power BI Developer"
            result["profile"]["heroTagline"] = "Skilled in SQL, Python, Advanced Excel, and Power BI. Experienced in analyzing healthcare and banking datasets to identify trends and generate actionable, data-driven insights."
        else:
            result["profile"]["title"] = "Full-Stack Software Developer"
            result["profile"]["heroTagline"] = full_summary if len(full_summary) > 30 else result["profile"].get("heroTagline", full_summary)
    else:
        for line in lines[1:6]:
            if re.search(r"developer|engineer|architect|designer|lead|specialist|analyst", line, re.IGNORECASE) and "@" not in line:
                cleaned = line.strip("|-• ")
                if len(cleaned) > 40:
                    role_match = re.search(r"(Full[- ]Stack (?:Software )?(?:Developer|Engineer)|Software (?:Developer|Engineer)|Frontend (?:Developer|Engineer)|Backend (?:Developer|Engineer)|Data Analyst|Data Engineer)", cleaned, re.IGNORECASE)
                    if role_match:
                        result["profile"]["title"] = role_match.group(0).title()
                    else:
                        result["profile"]["title"] = "Full-Stack Software Developer"
                else:
                    result["profile"]["title"] = cleaned
                break

    # 3. Experience Extraction
    exp_lines = section_map.get("EXPERIENCE", [])
    if exp_lines:
        experiences = []
        cur_exp = None
        period_pattern = re.compile(r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})\s*[\-–—to\s]+\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Present|Current|\d{4})", re.IGNORECASE)

        for line in exp_lines:
            period_match = period_pattern.search(line)
            if period_match:
                if cur_exp:
                    experiences.append(cur_exp)
                role_str = line[:period_match.start()].strip()
                period_str = line[period_match.start():].strip()
                cur_exp = {
                    "role": role_str or "Software Developer",
                    "period": period_str,
                    "company": "",
                    "location": "",
                    "bullets": []
                }
            elif cur_exp and not cur_exp["company"] and not line.startswith("•"):
                parts = re.split(r"\s{2,}|\s*,\s*", line)
                cur_exp["company"] = parts[0] or line
                cur_exp["location"] = ", ".join(parts[1:]) if len(parts) > 1 else "India"
            elif cur_exp and (line.startswith("•") or line.startswith("-")):
                cur_exp["bullets"].append(re.sub(r"^[•\-*]\s*", "", line).strip())
            elif cur_exp and cur_exp["bullets"]:
                cur_exp["bullets"][-1] += " " + line

        if cur_exp:
            experiences.append(cur_exp)

        if experiences:
            result["experience"]["roles"] = [
                {
                    "id": f"exp-{idx + 1}",
                    "role": exp.get("role") or "Software Developer",
                    "company": exp.get("company") or "Technology Company",
                    "location": exp.get("location") or "India",
                    "period": exp.get("period") or "2025 — Present",
                    "isCurrent": bool(re.search(r"present|current|2026", exp.get("period", ""), re.IGNORECASE)),
                    "highlights": exp["bullets"] if exp["bullets"] else [
                        "Engineered core production features and scalable services.",
                        "Collaborated with cross-functional teams to deliver high-quality solutions."
                    ],
                    "techStack": ["Python", "SQL", "MySQL", "Pandas", "Power BI", "DAX", "Advanced Excel"] if is_data_analyst else ["JavaScript", "Python", "React.js", "FastAPI", "PostgreSQL"]
                }
                for idx, exp in enumerate(experiences)
            ]

    # 4. Projects Extraction
    proj_lines = section_map.get("PROJECTS", [])
    if proj_lines:
        projects = []
        cur_proj = None

        for i, line in enumerate(proj_lines):
            next_line = proj_lines[i + 1] if i + 1 < len(proj_lines) else ""
            is_title = "| GitHub" in line or re.match(r"^Tech Stack:", next_line, re.IGNORECASE)

            if is_title:
                if cur_proj:
                    projects.append(cur_proj)
                cur_proj = {
                    "title": re.sub(r"\s*\|\s*GitHub", "", line, flags=re.IGNORECASE).strip(),
                    "techStack": [],
                    "bullets": []
                }
            elif cur_proj and re.match(r"^Tech Stack:", line, re.IGNORECASE):
                stack_str = re.sub(r"^Tech Stack:\s*", "", line, flags=re.IGNORECASE)
                cur_proj["techStack"] = [s.strip() for s in stack_str.split(",") if s.strip()]
            elif cur_proj and (line.startswith("•") or line.startswith("-")):
                cur_proj["bullets"].append(re.sub(r"^[•\-*]\s*", "", line).strip())
            elif cur_proj and cur_proj["bullets"]:
                cur_proj["bullets"][-1] += " " + line

        if cur_proj:
            projects.append(cur_proj)

        if projects:
            result["projects"]["items"] = [
                {
                    "id": re.sub(r"[^a-z0-9]+", "-", p["title"].lower()).strip("-"),
                    "number": str(idx + 1).zfill(2),
                    "title": p["title"],
                    "category": "Healthcare Data Analytics" if "healthcare" in p["title"].lower() else ("Banking & Risk Analytics" if "loan" in p["title"].lower() else "Full-Stack Web System"),
                    "description": p["bullets"][0] if p["bullets"] else f"{p['title']} data-driven analytics and reporting system.",
                    "metrics": p["bullets"][-1] if len(p["bullets"]) > 1 else "Actionable insights generated with interactive KPI reporting.",
                    "techStack": p["techStack"] if p["techStack"] else ["Python", "SQL"],
                    "githubUrl": f"{result['profile'].get('githubUrl', 'https://github.com/Alam292')}/{re.sub(r'[^a-z0-9]+', '-', p['title'].lower()).strip('-')}",
                    "liveDemoUrl": "#",
                    "featured": True,
                    "image": "assets/project-cloudscale.svg" if idx == 0 else ("assets/project-pulsemetrics.svg" if idx == 1 else "assets/project-nexusui.svg"),
                    "hasLiveDemo": False
                }
                for idx, p in enumerate(projects)
            ]

    # 5. Technical Skills Assignment
    result["skills"] = {
        "sectionTag": "TECHNICAL ARSENAL",
        "title": "Core Skills & Technologies",
        "subtitle": "Interactive category-wise showcase of official data analytics technologies and BI tools." if is_data_analyst else "Interactive category-wise showcase of official technologies and tools powering scalable web systems and AI applications.",
        "categories": OFFICIAL_SKILLS_CATEGORIES_DATA if is_data_analyst else OFFICIAL_SKILLS_CATEGORIES_DEV
    }

    # 6. Who Am I (About Section)
    result["about"] = result.get("about", {})
    result["about"]["sectionTag"] = "WHO I AM"
    result["about"]["terminalCommand"] = "whoami"

    if is_data_analyst:
        result["about"]["lead"] = "I am a Data Analyst Trainee and Power BI Developer skilled in data cleaning, ETL, EDA, DAX, Power Query, and interactive dashboard development. Experienced in analyzing healthcare and banking datasets to identify trends and generate actionable, data-driven insights."
        result["about"]["highlights"] = [
            {"icon": "zap", "title": "Actionable Insights", "detail": "Power BI & DAX Dashboards"},
            {"icon": "code", "title": "Python Analytics", "detail": "Pandas, NumPy & EDA"},
            {"icon": "database", "title": "Database Querying", "detail": "SQL, MySQL & ETL"},
            {"icon": "shield", "title": "Business Reports", "detail": "Advanced Excel & Tableau"}
        ]
    else:
        lead_role = result["profile"].get("title", "Full-Stack Software Developer")
        result["about"]["lead"] = f"I am a {lead_role} specializing in high-throughput backend APIs with FastAPI & Django, paired with responsive, clean frontends in React & Next.js. Focused on robust database schemas, clean architecture, and reliable production deployment."
        result["about"]["highlights"] = [
            {"icon": "zap", "title": "High-Speed APIs", "detail": "FastAPI & Django REST"},
            {"icon": "code", "title": "Modern Frontends", "detail": "React, Next.js & UI/UX"},
            {"icon": "database", "title": "Relational Schemas", "detail": "PostgreSQL & SQLAlchemy"},
            {"icon": "shield", "title": "Production Ready", "detail": "Tested & Cloud Deployed"}
        ]

    # 7. Certifications
    cert_lines = section_map.get("CERTIFICATIONS & ACHIEVEMENTS", [])
    if cert_lines:
        bullets = [
            re.sub(r"^[•\-*]\s*", "", l).strip()
            for l in cert_lines
            if (l.startswith("•") or l.startswith("-")) and "-- 1 of 1 --" not in l
        ]
        if bullets:
            result["certifications"]["items"] = [
                {
                    "id": f"cert-{idx + 1}",
                    "title": c.split("–")[0].split("-")[0].strip() if ("–" in c or "-" in c) else c,
                    "issuer": c.split("–")[-1].split("-")[-1].strip() if ("–" in c or "-" in c) else "Professional Certification",
                    "date": "2026",
                    "credentialUrl": "#",
                    "skillsCovered": ["Data Analytics", "SQL", "Python"] if is_data_analyst else ["Full-Stack", "Web Development"]
                }
                for idx, c in enumerate(bullets)
            ]

    return validate_and_merge_portfolio(result, base_portfolio)


# -------------------------------------------------------------
# Gemini AI Structuring Engine
# -------------------------------------------------------------

def structure_resume_with_ai(raw_text: str, base_portfolio: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Transforms raw resume text into structured portfolio JSON using Google Gemini AI.
    Falls back gracefully to fallback_rule_based_parser if Gemini is unavailable or errors out.
    """
    base_portfolio = base_portfolio or {}
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()

    if not gemini_key:
        logger.info("[Resume Parser] GEMINI_API_KEY not configured. Using offline deterministic parser.")
        return fallback_rule_based_parser(raw_text, base_portfolio)

    prompt = f"""You are an expert ATS resume extraction engine for Folioblox portfolio.
Extract all relevant developer details from this resume text into strict valid JSON adhering to this exact schema:

{{
  "profile": {{
    "name": "Full Name",
    "shortName": "First Name",
    "title": "Exact Title or Role",
    "heroTagline": "Professional summary or headline",
    "email": "email address",
    "githubUrl": "github link",
    "githubUser": "username",
    "linkedinUrl": "linkedin link"
  }},
  "about": {{
    "sectionTag": "WHO I AM",
    "terminalCommand": "whoami",
    "lead": "Compelling first-person summary describing core engineering capabilities",
    "highlights": [
      {{ "icon": "zap", "title": "Key Skill/Domain 1", "detail": "Brief detail" }},
      {{ "icon": "code", "title": "Key Skill/Domain 2", "detail": "Brief detail" }},
      {{ "icon": "database", "title": "Key Skill/Domain 3", "detail": "Brief detail" }},
      {{ "icon": "shield", "title": "Key Skill/Domain 4", "detail": "Brief detail" }}
    ]
  }},
  "skills": {{
    "sectionTag": "TECHNICAL ARSENAL",
    "title": "Core Skills & Technologies",
    "subtitle": "Interactive showcase of technologies and tools",
    "categories": [
      {{
        "id": "languages",
        "name": "Programming Languages",
        "icon": "code",
        "description": "Core programming languages",
        "skills": [{{ "name": "Python", "icon": "python" }}]
      }},
      {{
        "id": "frontend",
        "name": "Frontend Development",
        "icon": "layers",
        "description": "UI & Frontend tools",
        "skills": [{{ "name": "React.js", "icon": "react" }}]
      }},
      {{
        "id": "backend",
        "name": "Backend Development",
        "icon": "server",
        "description": "APIs and Server frameworks",
        "skills": [{{ "name": "FastAPI", "icon": "fastapi" }}]
      }},
      {{
        "id": "databases",
        "name": "Databases",
        "icon": "database",
        "description": "Databases and ORMs",
        "skills": [{{ "name": "PostgreSQL", "icon": "postgresql" }}]
      }},
      {{
        "id": "tools",
        "name": "Tools & Technologies",
        "icon": "cpu",
        "description": "Developer tooling",
        "skills": [{{ "name": "Git", "icon": "git" }}]
      }},
      {{
        "id": "ai-tools",
        "name": "AI Development Tools",
        "icon": "zap",
        "description": "AI assistants and models",
        "skills": [{{ "name": "Gemini", "icon": "gemini" }}]
      }}
    ]
  }},
  "experience": {{
    "roles": [
      {{
        "id": "exp-1",
        "role": "Title",
        "company": "Company Name",
        "location": "Location",
        "period": "Start — End",
        "isCurrent": false,
        "highlights": ["Bullet 1", "Bullet 2"],
        "techStack": ["Tech1", "Tech2"]
      }}
    ]
  }},
  "projects": {{
    "items": [
      {{
        "id": "project-slug",
        "number": "01",
        "title": "Project Title",
        "category": "Domain Category",
        "description": "Clear project description",
        "metrics": "Impact or metric",
        "techStack": ["Tech1", "Tech2"],
        "githubUrl": "https://github.com/...",
        "liveDemoUrl": "#",
        "featured": true,
        "image": "assets/project-cloudscale.svg",
        "hasLiveDemo": false
      }}
    ]
  }},
  "certifications": {{
    "items": [
      {{
        "id": "cert-1",
        "title": "Certification Title",
        "issuer": "Issuing Body",
        "date": "Year",
        "credentialUrl": "#",
        "skillsCovered": ["Skill1", "Skill2"]
      }}
    ]
  }}
}}

Resume Content:
\"\"\"
{raw_text[:12000]}
\"\"\"

Return ONLY the raw JSON object. Do not wrap in markdown or backticks."""

    # Try Gemini API client
    try:
        from google import genai
        client = genai.Client(api_key=gemini_key)
        
        # Try primary model gemini-3.5-flash, fallback to gemini-3.5-flash-lite if overloaded
        response = None
        for model_name in ["gemini-3.5-flash", "gemini-3.5-flash-lite"]:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                )
                if response and response.text:
                    logger.info(f"[Resume Parser] Successfully parsed resume via Gemini API model '{model_name}'.")
                    break
            except Exception as model_err:
                logger.warning(f"[Resume Parser] Model {model_name} failed: {model_err}")
                continue

        if not response or not response.text:
            raise RuntimeError("All Gemini models failed to generate response text.")

        response_text = response.text.strip()
        # Clean potential markdown fences
        if response_text.startswith("```"):
            response_text = re.sub(r"^```[a-zA-Z]*\n?", "", response_text)
            response_text = re.sub(r"\n?```$", "", response_text)
        parsed_json = json.loads(response_text)
        print(f"[Resume Parser] Google Gemini AI parsed resume successfully!")
        return validate_and_merge_portfolio(parsed_json, base_portfolio)

    except Exception as e:
        logger.warning(f"[Resume Parser] Gemini API call failed or timed out ({e}). Falling back to rule-based parser.")
        return fallback_rule_based_parser(raw_text, base_portfolio)


# -------------------------------------------------------------
# Schema Validation & Merging Logic
# -------------------------------------------------------------

def validate_and_merge_portfolio(incoming: Dict[str, Any], base: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Validates the parsed data against expected schema and safely merges with baseline to preserve UI stability.
    """
    base = base or {}
    final_data = {**base, **incoming}

    # 1. Profile sanity
    final_data["profile"] = final_data.get("profile", {}) or {}
    if not final_data["profile"].get("name"):
        final_data["profile"]["name"] = base.get("profile", {}).get("name", "Developer")
    if not final_data["profile"].get("title"):
        final_data["profile"]["title"] = base.get("profile", {}).get("title", "Full Stack Developer & UI Engineer")
    if "status" not in final_data["profile"]:
        final_data["profile"]["status"] = base.get("profile", {}).get("status", "")
    if not final_data["profile"].get("avatarUrl"):
        final_data["profile"]["avatarUrl"] = base.get("profile", {}).get("avatarUrl", "assets/profile-avatar.svg")

    # 2. Stats
    if not isinstance(final_data.get("stats"), list) or not final_data["stats"]:
        final_data["stats"] = base.get("stats", [
            {"value": "2+", "suffix": "Years", "label": "Engineering Experience", "description": "Building full-stack web applications and robust architectures"},
            {"value": "15+", "suffix": "APIs", "label": "REST Endpoints Built", "description": "Designed high-speed FastAPI and Django REST services"},
            {"value": "3+", "suffix": "Systems", "label": "Full-Stack Products", "description": "Production-grade SaaS and management dashboards"},
            {"value": "99.9%", "suffix": "Uptime", "label": "Cloud Reliability", "description": "High availability, smooth operations and reliability"}
        ])

    # 3. Who Am I (About)
    final_data["about"] = final_data.get("about", {}) or {}
    final_data["about"]["sectionTag"] = final_data["about"].get("sectionTag") or base.get("about", {}).get("sectionTag") or "WHO I AM"
    final_data["about"]["terminalCommand"] = final_data["about"].get("terminalCommand") or base.get("about", {}).get("terminalCommand") or "whoami"
    final_data["about"]["lead"] = final_data["about"].get("lead") or base.get("about", {}).get("lead") or "Full-Stack Software Developer specializing in high-throughput backend APIs with FastAPI & Django."
    if not isinstance(final_data["about"].get("highlights"), list) or not final_data["about"]["highlights"]:
        final_data["about"]["highlights"] = base.get("about", {}).get("highlights", [
            {"icon": "zap", "title": "High-Speed APIs", "detail": "FastAPI & Django REST"},
            {"icon": "code", "title": "Modern Frontends", "detail": "React, Next.js & UI/UX"},
            {"icon": "database", "title": "Relational Schemas", "detail": "PostgreSQL & SQLAlchemy"},
            {"icon": "shield", "title": "Production Ready", "detail": "Tested & Cloud Deployed"}
        ])

    # 4. Skills Categories Normalization
    final_data["skills"] = final_data.get("skills", {}) or {}
    final_data["skills"]["sectionTag"] = final_data["skills"].get("sectionTag", "TECHNICAL ARSENAL")
    final_data["skills"]["title"] = final_data["skills"].get("title", "Core Skills & Technologies")
    final_data["skills"]["subtitle"] = final_data["skills"].get("subtitle", "Interactive category-wise showcase of official technologies and tools.")

    categories = final_data["skills"].get("categories")
    if not isinstance(categories, list) or not categories:
        final_data["skills"]["categories"] = base.get("skills", {}).get("categories", OFFICIAL_SKILLS_CATEGORIES_DEV)
    else:
        normalized_categories = []
        for cat in categories:
            skills_arr = cat.get("skills") or []
            if not skills_arr and cat.get("items"):
                # Handle legacy items array
                skills_arr = [
                    {"name": item.get("name", str(item)), "icon": re.sub(r"[^a-z0-9]", "", (item.get("icon") or item.get("name") or "").lower())}
                    for item in cat["items"]
                ]
            normalized_categories.append({
                "id": cat.get("id") or re.sub(r"[^a-z0-9]+", "-", cat.get("name", "category").lower()).strip("-"),
                "name": cat.get("name", "Category"),
                "icon": cat.get("icon", "code"),
                "description": cat.get("description", ""),
                "skills": [
                    {
                        "name": s.get("name") if isinstance(s, dict) else str(s),
                        "icon": re.sub(r"[^a-z0-9]", "", (s.get("icon") or s.get("name", "")).lower()) if isinstance(s, dict) else re.sub(r"[^a-z0-9]", "", str(s).lower())
                    }
                    for s in skills_arr
                ]
            })
        final_data["skills"]["categories"] = normalized_categories

    # 5. Projects
    final_data["projects"] = final_data.get("projects", {}) or {}
    if not isinstance(final_data["projects"].get("items"), list) or not final_data["projects"]["items"]:
        final_data["projects"] = base.get("projects", final_data["projects"])

    # 6. Experience
    final_data["experience"] = final_data.get("experience", {}) or {}
    if not isinstance(final_data["experience"].get("roles"), list) or not final_data["experience"]["roles"]:
        final_data["experience"] = base.get("experience", final_data["experience"])

    # 7. Education
    final_data["education"] = final_data.get("education", {}) or {}
    if not isinstance(final_data["education"].get("degrees"), list) or not final_data["education"]["degrees"]:
        final_data["education"] = base.get("education", final_data["education"])

    # 8. Certifications
    final_data["certifications"] = final_data.get("certifications", {}) or {}
    if not isinstance(final_data["certifications"].get("items"), list) or not final_data["certifications"]["items"]:
        final_data["certifications"] = base.get("certifications", final_data["certifications"])

    # 9. Contact
    final_data["contact"] = final_data.get("contact", {}) or {}
    if not final_data["contact"].get("email"):
        final_data["contact"]["email"] = final_data["profile"].get("email") or base.get("contact", {}).get("email", "contact@matloob.dev")

    return final_data
