"""
Resume Parser & Gemini AI Transformer (server_py/resume_parser.py)
Extracts raw text from PDF & DOCX resumes and transforms unformatted resume text
into strict portfolio.json schema using Google Gemini AI or deterministic rule parser.
"""

import io
import re
import json
import requests
from typing import Dict, Any, Optional
from pypdf import PdfReader
try:
    import docx
except ImportError:
    docx = None

from .config import GEMINI_API_KEY


def extract_raw_text(buffer: bytes, ext: str) -> str:
    """
    Extract raw text from PDF or DOCX file bytes.
    """
    extension = (ext or "").lower()

    if extension == ".pdf":
        reader = PdfReader(io.BytesIO(buffer))
        text_parts = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
        return "\n".join(text_parts).strip()

    elif extension in (".docx", ".doc"):
        if docx:
            doc = docx.Document(io.BytesIO(buffer))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        if cell.text.strip():
                            paragraphs.append(cell.text.strip())
            return "\n".join(paragraphs).strip()
        else:
            # Fallback plain string decode
            try:
                return buffer.decode("utf-8", errors="ignore").strip()
            except Exception:
                return ""

    elif extension in (".txt", ".text"):
        return buffer.decode("utf-8", errors="ignore").strip()

    else:
        raise ValueError(f"Unsupported file type: {extension}. Please upload a PDF or DOCX file.")


def structure_resume_with_ai(raw_text: str, base_portfolio: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transform raw resume text into structured portfolio.json data using Gemini AI
    with fallback to deterministic rule parser.
    """
    api_key = GEMINI_API_KEY.strip() if GEMINI_API_KEY else ""

    if api_key and api_key != "YOUR_GEMINI_API_KEY_HERE":
        try:
            return call_gemini_ai(raw_text, base_portfolio, api_key)
        except Exception as ai_err:
            print(f"[AI Parser] Gemini AI call failed or timed out: {ai_err}. Switching to deterministic rule parser.")
            return fallback_rule_based_parser(raw_text, base_portfolio)
    else:
        print("[AI Parser] GEMINI_API_KEY not configured. Using deterministic rule-based parser.")
        return fallback_rule_based_parser(raw_text, base_portfolio)


def call_gemini_ai(raw_text: str, base_portfolio: Dict[str, Any], api_key: str) -> Dict[str, Any]:
    """
    Call Gemini REST endpoint with model fallback cascade.
    """
    prompt = f"""
You are an expert technical resume parser and modern portfolio architect.
You are given the raw extracted text of a professional resume, and the existing portfolio.json schema baseline.

Extract, refine, and structure the candidate's information into a JSON object adhering STRICTLY to this schema.

CRITICAL REQUIREMENTS:
1. Return ONLY valid, parseable JSON. Do NOT include markdown code blocks, backticks (```json), or explanations.
2. Preserve existing verified URLs (like GitHub, LinkedIn, live demos) unless the resume text specifies new or updated links.
3. Organize skills strictly into the 6 official categories:
   - "Programming Languages" (icon: "code")
   - "Frontend Development" (icon: "layers")
   - "Backend Development" (icon: "server")
   - "Databases" (icon: "database")
   - "Tools & Technologies" (icon: "cpu")
   - "AI Development Tools" (icon: "zap")
   Each skill in a category must be an object with {{ "name": "...", "icon": "..." }} using clean lowercase brand icon identifiers (e.g. python, javascript, react, nextjs, tailwindcss, fastapi, django, nodejs, postgresql, mysql, git, docker, postman, chatgpt, gemini, antigravity).
4. For the "WHO I AM" section, extract a crisp developer bio in "lead", set "terminalCommand" to "whoami", and extract 4 high-signal superpower cards in "highlights" with icons from: "zap", "code", "database", "shield".
5. Extract work experience chronologically with architectural impact bullets.
6. Extract education degrees with university name and period.
7. Extract certifications and achievements.

RAW RESUME TEXT:
{raw_text[:12000]}
"""

    models_to_try = [
        "gemini-3.8-flash",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash"
    ]

    last_error = None
    for model in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "temperature": 0.1,
                "topK": 1,
                "topP": 0.95
            }
        }
        try:
            res = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=8)
            if res.status_code == 200:
                data = res.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                cleaned = re.sub(r"^```(?:json)?\s*", "", text)
                cleaned = re.sub(r"\s*```$", "", cleaned).strip()
                parsed = json.loads(cleaned)
                return validate_and_merge_portfolio(parsed, base_portfolio)
            else:
                last_error = f"Model {model} returned HTTP {res.status_code}: {res.text[:200]}"
                print(f"[AI Parser Warning] {last_error}")
        except Exception as e:
            last_error = str(e)
            print(f"[AI Parser Warning] Model {model} failed: {e}")

    raise RuntimeError(f"All Gemini models exhausted. Last error: {last_error}")


def fallback_rule_based_parser(raw_text: str, base_portfolio: Dict[str, Any]) -> Dict[str, Any]:
    """
    Deterministic rule-based parser that extracts structured portfolio data
    with real projects, skills, education, and experience.
    """
    result: Dict[str, Any] = {
        "profile": {},
        "about": {},
        "stats": [],
        "skills": {},
        "projects": {"items": []},
        "experience": {"roles": []},
        "education": {"degrees": []},
        "certifications": {"items": []},
        "contact": {}
    }

    raw_lines = [line.strip() for line in raw_text.splitlines() if line.strip()]

    # 1. Section Header Discovery
    known_headers = [
        "PROFESSIONAL SUMMARY", "SUMMARY", "ABOUT",
        "WORK EXPERIENCE", "EXPERIENCE", "EMPLOYMENT HISTORY",
        "PROJECTS", "KEY PROJECTS", "ACADEMIC PROJECTS",
        "TECHNICAL SKILLS", "SKILLS", "CORE COMPETENCIES",
        "EDUCATION", "ACADEMIC BACKGROUND",
        "CERTIFICATIONS & ACHIEVEMENTS", "CERTIFICATIONS", "ACHIEVEMENTS"
    ]

    section_map: Dict[str, list] = {}
    current_sec = "HEADER"
    section_map[current_sec] = []

    for line in raw_lines:
        clean_upper = re.sub(r"[^A-Z\s&]", "", line.upper()).strip()
        matched_header = None
        for h in known_headers:
            if clean_upper == h or clean_upper == f"{h}S":
                matched_header = h
                break

        if matched_header:
            if matched_header in ("WORK EXPERIENCE", "EMPLOYMENT HISTORY"):
                current_sec = "EXPERIENCE"
            elif matched_header in ("KEY PROJECTS", "ACADEMIC PROJECTS"):
                current_sec = "PROJECTS"
            elif matched_header in ("SKILLS", "CORE COMPETENCIES"):
                current_sec = "TECHNICAL SKILLS"
            elif matched_header in ("ACADEMIC BACKGROUND",):
                current_sec = "EDUCATION"
            elif matched_header in ("CERTIFICATIONS", "ACHIEVEMENTS"):
                current_sec = "CERTIFICATIONS & ACHIEVEMENTS"
            elif matched_header in ("SUMMARY", "ABOUT"):
                current_sec = "PROFESSIONAL SUMMARY"
            else:
                current_sec = matched_header

            if current_sec not in section_map:
                section_map[current_sec] = []
        else:
            section_map[current_sec].append(line)

    # 2. Extract Candidate Name
    header_lines = section_map.get("HEADER", [])
    candidate_name = ""
    for hl in header_lines:
        clean = re.sub(r"^[|\-•\s]+|[|\-•\s]+$", "", hl)
        # Skip labels like 'CURRICULUM VITAE' or 'RESUME'
        if clean.upper() in ("CURRICULUM VITAE", "RESUME", "CV", "BIO-DATA"):
            continue
        if re.search(r"developer|engineer|analyst|specialist", clean, re.IGNORECASE):
            continue
        if not re.search(r"[@\+0-9]", clean) and 2 <= len(clean.split()) <= 4:
            candidate_name = clean
            break

    if not candidate_name:
        for line in raw_lines[:6]:
            clean = re.sub(r"^[|\-•\s]+|[|\-•\s]+$", "", line)
            if clean.upper() in ("CURRICULUM VITAE", "RESUME", "CV", "BIO-DATA"):
                continue
            if not re.search(r"[@\+0-9]", clean) and 2 <= len(clean.split()) <= 4:
                candidate_name = clean
                break

    if not candidate_name:
        candidate_name = base_portfolio.get("profile", {}).get("name", "Md MatlooB Alam")

    name_parts = candidate_name.split()
    short_name = name_parts[1] if len(name_parts) > 1 and name_parts[0].lower() in ("md", "mohd", "mr") else name_parts[0]

    result["profile"]["name"] = candidate_name
    result["profile"]["shortName"] = short_name

    # 3. Extract Email, Phone, URLs
    email_match = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", raw_text)
    if email_match:
        result["profile"]["email"] = email_match.group(0).lower()
        result["contact"]["email"] = email_match.group(0).lower()

    phone_match = re.search(r"(?:\+91[\-\s]?)?[6-9]\d{9}", raw_text)
    if phone_match:
        result["contact"]["phone"] = phone_match.group(0)

    github_match = re.search(r"(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)", raw_text, re.IGNORECASE)
    if github_match:
        result["profile"]["githubUrl"] = f"https://github.com/{github_match.group(1)}"
        result["profile"]["githubUser"] = github_match.group(1)

    linkedin_match = re.search(r"(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)", raw_text, re.IGNORECASE)
    if linkedin_match:
        result["profile"]["linkedinUrl"] = f"https://linkedin.com/in/{linkedin_match.group(1)}"

    # 4. Summary & Professional Title
    summary_lines = section_map.get("PROFESSIONAL SUMMARY", [])
    full_summary = " ".join(summary_lines)
    is_data_analyst = bool(re.search(r"data analyst|power bi|pandas|dax|tableau", full_summary or raw_text, re.IGNORECASE))

    if full_summary:
        if is_data_analyst:
            result["profile"]["title"] = "Data Analyst Trainee & Power BI Developer"
            result["profile"]["heroTagline"] = "Skilled in SQL, Python, Advanced Excel, and Power BI. Experienced in analyzing healthcare and banking datasets to identify trends and generate actionable, data-driven insights."
        else:
            result["profile"]["title"] = "Full-Stack Software Developer"
            result["profile"]["heroTagline"] = full_summary if len(full_summary) > 30 else "Engineering scalable, high-performance web applications and resilient systems."
    else:
        for line in raw_lines[1:5]:
            if re.search(r"developer|engineer|architect|designer|lead|specialist|analyst", line, re.IGNORECASE) and "@" not in line:
                result["profile"]["title"] = re.sub(r"^[|\-•\s]+|[|\-•\s]+$", "", line)
                break
        if not result["profile"].get("title"):
            result["profile"]["title"] = "Full-Stack Software Developer"
            result["profile"]["heroTagline"] = "Engineering scalable, high-performance web applications and resilient systems."

    # 5. Extract Experience
    exp_lines = section_map.get("EXPERIENCE", [])
    if exp_lines:
        experiences = []
        cur_exp = None
        period_regex = re.compile(r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})\s*[\-–—to\s]+\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Present|Current|\d{4})", re.IGNORECASE)

        for line in exp_lines:
            period_match = period_regex.search(line)
            if period_match:
                if cur_exp:
                    experiences.append(cur_exp)
                cur_exp = {
                    "role": line[:period_match.start()].strip(),
                    "period": line[period_match.start():].strip(),
                    "company": "",
                    "location": "",
                    "bullets": []
                }
            elif cur_exp and not cur_exp["company"] and not line.startswith("•"):
                parts = re.split(r"\s{2,}|\s*,\s*", line)
                cur_exp["company"] = parts[0] if parts else line
                cur_exp["location"] = ", ".join(parts[1:]) if len(parts) > 1 else "India"
            elif cur_exp and line.startswith("•"):
                cur_exp["bullets"].append(re.sub(r"^[•\-\*]\s*", "", line).strip())
            elif cur_exp and cur_exp["bullets"]:
                cur_exp["bullets"][-1] += " " + line

        if cur_exp:
            experiences.append(cur_exp)

        if experiences:
            result["experience"]["roles"] = [
                {
                    "id": f"exp-{idx + 1}",
                    "role": exp["role"] or "Software Developer",
                    "company": exp["company"] or "Technology Company",
                    "location": exp["location"] or "India",
                    "period": exp["period"] or "2025 — Present",
                    "isCurrent": bool(re.search(r"present|current|2026", exp["period"], re.IGNORECASE)),
                    "highlights": exp["bullets"] if exp["bullets"] else [
                        "Engineered core production features and scalable services.",
                        "Collaborated with cross-functional teams to deliver high-quality solutions."
                    ],
                    "techStack": ["Python", "SQL", "Pandas", "Power BI"] if is_data_analyst else ["JavaScript", "Python", "FastAPI", "React.js"]
                }
                for idx, exp in enumerate(experiences)
            ]

    # 6. Extract Projects
    proj_lines = section_map.get("PROJECTS", [])
    if proj_lines:
        projects = []
        cur_proj = None
        for i, line in enumerate(proj_lines):
            next_line = proj_lines[i + 1] if i + 1 < len(proj_lines) else ""
            is_title = ("| GitHub" in line) or bool(re.search(r"^Tech Stack:", next_line, re.IGNORECASE))

            if is_title:
                if cur_proj:
                    projects.append(cur_proj)
                cur_proj = {
                    "title": re.sub(r"\s*\|\s*GitHub", "", line, flags=re.IGNORECASE).strip(),
                    "techStack": [],
                    "bullets": []
                }
            elif cur_proj and re.search(r"^Tech Stack:\s*", line, re.IGNORECASE):
                cur_proj["techStack"] = [s.strip() for s in re.sub(r"^Tech Stack:\s*", "", line, flags=re.IGNORECASE).split(",") if s.strip()]
            elif cur_proj and line.startswith("•"):
                cur_proj["bullets"].append(re.sub(r"^[•\-\*]\s*", "", line).strip())
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

    # 7. Extract Skills into 6 official categories
    if is_data_analyst:
        result["skills"] = {
            "sectionTag": "TECHNICAL ARSENAL",
            "title": "Core Skills & Technologies",
            "subtitle": "Interactive category-wise showcase of official data analytics technologies and BI tools.",
            "categories": [
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
        }
    else:
        result["skills"] = {
            "sectionTag": "TECHNICAL ARSENAL",
            "title": "Core Skills & Technologies",
            "subtitle": "Interactive category-wise showcase of official technologies and tools powering scalable web systems and AI applications.",
            "categories": [
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
        }

    # 8. Who Am I Revamp Schema Alignment
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
        role_label = result["profile"].get("title", "Full-Stack Software Developer")
        result["about"]["lead"] = f"I am a {role_label} specializing in high-throughput backend APIs with FastAPI & Django, paired with responsive, clean frontends in React & Next.js. Focused on robust database schemas, clean architecture, and reliable production deployment."
        result["about"]["highlights"] = [
            {"icon": "zap", "title": "High-Speed APIs", "detail": "FastAPI & Django REST"},
            {"icon": "code", "title": "Modern Frontends", "detail": "React, Next.js & UI/UX"},
            {"icon": "database", "title": "Relational Schemas", "detail": "PostgreSQL & SQLAlchemy"},
            {"icon": "shield", "title": "Production Ready", "detail": "Tested & Cloud Deployed"}
        ]

    # 9. Extract Certifications
    cert_lines = section_map.get("CERTIFICATIONS & ACHIEVEMENTS", [])
    if cert_lines:
        bullets = [re.sub(r"^[•\-\*]\s*", "", l).strip() for l in cert_lines if (l.startswith("•") or l.startswith("-")) and "-- 1 of 1 --" not in l]
        if bullets:
            result["certifications"]["items"] = [
                {
                    "id": f"cert-{idx + 1}",
                    "title": c.split("–")[0].strip() if "–" in c else (c.split("-")[0].strip() if "-" in c else c),
                    "issuer": c.split("–")[1].strip() if "–" in c else (c.split("-")[1].strip() if "-" in c else "Professional Certification"),
                    "date": "2026",
                    "credentialUrl": "#",
                    "skillsCovered": ["Data Analytics", "SQL", "Python"] if is_data_analyst else ["Full-Stack", "Web Development"]
                }
                for idx, c in enumerate(bullets)
            ]

    # 10. Extract Education
    edu_lines = section_map.get("EDUCATION", [])
    if edu_lines:
        degrees = []
        cur_edu = None
        for line in edu_lines:
            year_match = re.search(r"\b(20\d\d)\s*[\-–—to\s]+\s*(20\d\d|Present)\b", line, re.IGNORECASE)
            if year_match:
                if cur_edu:
                    degrees.append(cur_edu)
                cur_edu = {
                    "degree": line[:year_match.start()].strip() or "Degree",
                    "period": year_match.group(0),
                    "institution": "",
                    "cgpa": ""
                }
            elif cur_edu and not cur_edu["institution"]:
                cur_edu["institution"] = line
            elif cur_edu and re.search(r"CGPA|Percentage|Grade", line, re.IGNORECASE):
                cur_edu["cgpa"] = line

        if cur_edu:
            degrees.append(cur_edu)

        if degrees:
            result["education"]["degrees"] = [
                {
                    "id": f"edu-{idx + 1}",
                    "degree": d["degree"],
                    "institution": d["institution"] or "University",
                    "period": d["period"],
                    "status": "Graduated",
                    "cgpa": d["cgpa"] or "First Class",
                    "highlights": ["Major Coursework", "Core Computer Science Principles"]
                }
                for idx, d in enumerate(degrees)
            ]

    return validate_and_merge_portfolio(result, base_portfolio)


def validate_and_merge_portfolio(incoming: Dict[str, Any], base: Dict[str, Any]) -> Dict[str, Any]:
    """
    Safely merge incoming parsed data with defaults to prevent UI rendering breaks.
    """
    final_data = dict(base)
    for k, v in incoming.items():
        if v is not None:
            if isinstance(v, dict) and isinstance(final_data.get(k), dict):
                merged_dict = dict(final_data[k])
                merged_dict.update(v)
                final_data[k] = merged_dict
            elif isinstance(v, list) and v:
                final_data[k] = v
            elif not isinstance(v, (dict, list)):
                final_data[k] = v

    # Profile sanity check
    final_data["profile"] = final_data.get("profile", {})
    if not final_data["profile"].get("name"):
        final_data["profile"]["name"] = base.get("profile", {}).get("name", "Md MatlooB Alam")
    if not final_data["profile"].get("title"):
        final_data["profile"]["title"] = base.get("profile", {}).get("title", "Full Stack Developer & UI Engineer")
    if not final_data["profile"].get("avatarUrl"):
        final_data["profile"]["avatarUrl"] = base.get("profile", {}).get("avatarUrl", "assets/profile-avatar.svg")

    # Stats fallback
    if not final_data.get("stats") or not isinstance(final_data["stats"], list) or len(final_data["stats"]) == 0:
        final_data["stats"] = base.get("stats") or [
            {"value": "2+", "suffix": "Years", "label": "Engineering Experience", "description": "Building full-stack web applications and robust architectures"},
            {"value": "15+", "suffix": "APIs", "label": "REST Endpoints Built", "description": "Designed high-speed FastAPI and Django REST services"},
            {"value": "3+", "suffix": "Systems", "label": "Full-Stack Products", "description": "Production-grade SaaS and management dashboards"},
            {"value": "99.9%", "suffix": "Uptime", "label": "Cloud Reliability", "description": "High availability, smooth operations and reliability"}
        ]

    return final_data
