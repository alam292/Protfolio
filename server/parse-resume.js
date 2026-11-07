/**
 * Resume Parser & Gemini AI Transformer (server/parse-resume.js)
 * Extracts raw text from PDF & DOCX resumes, and utilizes Google Gemini AI
 * to transform unformatted resume text into strict portfolio.json schema.
 */

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
require('dotenv').config();

/**
 * Extract raw text from an uploaded file buffer
 * @param {Buffer} buffer - File buffer
 * @param {string} ext - File extension (e.g. '.pdf', '.docx')
 * @returns {Promise<string>} Extracted plain text
 */
async function extractRawText(buffer, ext) {
  const extension = (ext || '').toLowerCase();

  if (extension === '.pdf') {
    // Support pdf-parse v1 (function) and v2 (PDFParse class)
    if (typeof pdfParse === 'function') {
      const data = await pdfParse(buffer);
      return (data && data.text) ? data.text.trim() : '';
    } else if (pdfParse.PDFParse) {
      const parser = new pdfParse.PDFParse({ data: buffer });
      const result = await parser.getText();
      if (typeof parser.destroy === 'function') {
        try { await parser.destroy(); } catch (e) {}
      }
      if (typeof result === 'string') return result.trim();
      if (result && result.text) return result.text.trim();
      return '';
    } else {
      throw new Error('Unsupported pdf-parse module format');
    }
  } else if (extension === '.docx' || extension === '.doc') {
    const result = await mammoth.extractRawText({ buffer });
    return (result && result.value) ? result.value.trim() : '';
  } else if (extension === '.txt' || extension === '.text') {
    return buffer.toString('utf8').trim();
  } else {
    throw new Error(`Unsupported file type: ${extension}. Please upload a PDF or DOCX file.`);
  }
}

/**
 * Transform raw resume text into structured portfolio.json data
 * @param {string} rawText - Text extracted from resume
 * @param {object} basePortfolio - Existing portfolio data to preserve non-resume tokens
 * @returns {Promise<object>} Structured portfolio JSON
 */
async function structureResumeWithAI(rawText, basePortfolio = {}) {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();

  if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE') {
    try {
      // Impose a strict 8-second global timeout for AI processing
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AI processing timed out after 8s')), 8000);
      });
      return await Promise.race([
        callGeminiAI(rawText, basePortfolio, apiKey),
        timeoutPromise
      ]);
    } catch (aiErr) {
      console.warn('[AI Parser] Gemini AI call failed or timed out, switching to deterministic fallback parser:', aiErr.message);
      return fallbackRuleBasedParser(rawText, basePortfolio);
    }
  } else {
    console.log('[AI Parser] GEMINI_API_KEY not configured. Using deterministic rule-based parser.');
    return fallbackRuleBasedParser(rawText, basePortfolio);
  }
}

/**
 * Call Gemini AI Model to transform resume text
 */
async function callGeminiAI(rawText, basePortfolio, apiKey) {
  const prompt = `
You are an expert technical resume parser and modern portfolio architect.
You are given the raw extracted text of a professional resume, and the existing portfolio.json schema baseline.

Extract, refine, and structure the candidate's information into a JSON object adhering STRICTLY to this schema.

CRITICAL REQUIREMENTS:
1. Return ONLY valid, parseable JSON. Do NOT include markdown code blocks, backticks (\`\`\`json), or explanations.
2. Preserve existing verified URLs (like GitHub, LinkedIn, live demos) unless the resume text specifies new or updated links.
3. Organize skills strictly into the 6 official categories:
   - "Programming Languages" (icon: "code")
   - "Frontend Development" (icon: "layers")
   - "Backend Development" (icon: "server")
   - "Databases" (icon: "database")
   - "Tools & Technologies" (icon: "cpu")
   - "AI Development Tools" (icon: "zap")
   Each skill in a category must be an object with { "name": "...", "icon": "..." } using clean lowercase brand icon identifiers (e.g. python, javascript, react, nextjs, tailwindcss, fastapi, django, nodejs, postgresql, mysql, git, docker, postman, chatgpt, gemini, antigravity). Do NOT use cards, boxes, rating bars or "items" arrays.
4. For the "WHO I AM" section, extract a crisp, high-impact 2-sentence developer bio in "lead", set "terminalCommand" to "whoami", and extract 4 high-signal superpower cards in "highlights" with icons from: "zap", "code", "database", "shield".
5. Extract all work experience chronologically, with bullet highlights describing architectural impact and metrics.
6. Extract education degrees with university name, period, and honors or CGPA if mentioned.
7. Extract certifications and achievements.
8. Craft a punchy professional elevator headline and hero tagline representing the candidate.

SCHEMA SPECIFICATION:
{
  "profile": {
    "name": "Full Name",
    "shortName": "First Name or Preferred Name",
    "title": "Professional Title (e.g. Full Stack Developer & UI Engineer)",
    "heroTagline": "Punchy 2-sentence elevator bio highlighting core expertise",
    "status": "Available for opportunities",
    "statusSubtitle": "Full-time & High-Impact Contracts",
    "email": "candidate email",
    "fallbackEmail": "secondary email if available",
    "portfolioUrl": "portfolio URL",
    "githubUrl": "https://github.com/...",
    "githubUser": "username",
    "linkedinUrl": "https://linkedin.com/in/...",
    "resumeUrl": "${basePortfolio.profile?.resumeUrl || 'assets/resume.pdf'}",
    "resumeFilename": "${basePortfolio.profile?.resumeFilename || 'resume.pdf'}",
    "avatarUrl": "${basePortfolio.profile?.avatarUrl || 'assets/profile-avatar.svg'}",
    "location": {
      "city": "City",
      "state": "State",
      "country": "Country",
      "coordinates": "Coordinates or leave existing",
      "timezone": "Timezone",
      "timezoneOffset": "Offset (e.g. IST UTC+5:30)",
      "remoteReadiness": "Global Remote Available",
      "relocationReadiness": "Open to Relocation"
    }
  },
  "stats": [
    { "value": "2+", "suffix": "Years", "label": "Engineering Experience", "description": "Building full-stack web applications and robust architectures" },
    { "value": "15+", "suffix": "APIs", "label": "REST Endpoints Built", "description": "Designed high-speed FastAPI and Django REST services" },
    { "value": "3+", "suffix": "Systems", "label": "Full-Stack Products", "description": "Production-grade SaaS and management dashboards" },
    { "value": "99.9%", "suffix": "Uptime", "label": "Cloud Reliability", "description": "High availability, smooth operations and reliability" }
  ],
  "about": {
    "sectionTag": "WHO I AM",
    "terminalCommand": "whoami",
    "lead": "I am a Full-Stack Software Developer specializing in high-throughput backend APIs with FastAPI & Django, paired with responsive, clean frontends in React & Next.js. Focused on robust database schemas, clean architecture, and reliable production deployment.",
    "highlights": [
      { "icon": "zap", "title": "High-Speed APIs", "detail": "FastAPI & Django REST" },
      { "icon": "code", "title": "Modern Frontends", "detail": "React, Next.js & UI/UX" },
      { "icon": "database", "title": "Relational Schemas", "detail": "PostgreSQL & SQLAlchemy" },
      { "icon": "shield", "title": "Production Ready", "detail": "Tested & Cloud Deployed" }
    ]
  },
  "skills": {
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
          { "name": "Python", "icon": "python" },
          { "name": "JavaScript", "icon": "javascript" }
        ]
      },
      {
        "id": "frontend",
        "name": "Frontend Development",
        "icon": "layers",
        "description": "Modern frontend architectures, component systems, and high-fidelity responsive user interfaces.",
        "skills": [
          { "name": "React.js", "icon": "react" },
          { "name": "Next.js", "icon": "nextjs" },
          { "name": "Tailwind CSS", "icon": "tailwindcss" }
        ]
      },
      {
        "id": "backend",
        "name": "Backend Development",
        "icon": "server",
        "description": "High-throughput RESTful microservices, asynchronous execution, and enterprise web frameworks.",
        "skills": [
          { "name": "FastAPI", "icon": "fastapi" },
          { "name": "Django", "icon": "django" },
          { "name": "Node.js", "icon": "nodejs" }
        ]
      },
      {
        "id": "databases",
        "name": "Databases",
        "icon": "database",
        "description": "Relational data modeling, schema normalization, and performant query optimization.",
        "skills": [
          { "name": "PostgreSQL", "icon": "postgresql" },
          { "name": "MySQL", "icon": "mysql" },
          { "name": "MongoDB", "icon": "mongodb" }
        ]
      },
      {
        "id": "tools",
        "name": "Tools & Technologies",
        "icon": "cpu",
        "description": "Developer tooling, containerization, version control, and rigorous API testing suites.",
        "skills": [
          { "name": "Git", "icon": "git" },
          { "name": "Docker", "icon": "docker" },
          { "name": "Postman", "icon": "postman" }
        ]
      },
      {
        "id": "ai-tools",
        "name": "AI Development Tools",
        "icon": "zap",
        "description": "Advanced AI coding assistants and intelligent automation tools accelerating full-stack delivery.",
        "skills": [
          { "name": "ChatGPT", "icon": "chatgpt" },
          { "name": "Gemini", "icon": "gemini" },
          { "name": "Antigravity IDE", "icon": "antigravity" }
        ]
      }
    ]
  },
  "projects": {
    "sectionTag": "FEATURED WORK",
    "title": "",
    "subtitle": "Production-grade applications built with attention to performance.",
    "items": [
      {
        "id": "proj-1",
        "number": "01",
        "title": "Project Title",
        "category": "Project Category",
        "description": "Project summary",
        "metrics": "Key metric or achievement",
        "techStack": ["React", "Node.js"],
        "githubUrl": "https://github.com/...",
        "liveDemoUrl": "https://...",
        "featured": true,
        "image": "assets/project-cloudscale.svg",
        "hasLiveDemo": true
      }
    ]
  },
  "experience": {
    "sectionTag": "CAREER TRAJECTORY",
    "title": "",
    "subtitle": "Chronological track record of building resilient software.",
    "roles": [
      {
        "id": "exp-1",
        "role": "Role Title",
        "company": "Company Name",
        "location": "Location",
        "period": "Start — End / Present",
        "isCurrent": true,
        "highlights": ["Achievement 1", "Achievement 2"],
        "techStack": ["React", "Node.js"]
      }
    ]
  },
  "education": {
    "sectionTag": "ACADEMIC PEDIGREE",
    "title": "",
    "subtitle": "Foundational computer science training.",
    "degrees": [
      {
        "id": "edu-1",
        "degree": "Degree Name",
        "institution": "University / College",
        "period": "Year — Year",
        "status": "Graduated",
        "cgpa": "CGPA or percentage",
        "honors": "Honors if any",
        "highlights": ["Major Coursework", "Capstone project"],
        "skillsGained": ["Key skill 1", "Key skill 2"]
      }
    ]
  },
  "certifications": {
    "sectionTag": "VALIDATED MASTERY",
    "title": "",
    "subtitle": "Industry credentials and milestones.",
    "categories": [
      { "id": "all", "name": "All Credentials" },
      { "id": "technical", "name": "Technical Certifications" },
      { "id": "training", "name": "Specialized Training" },
      { "id": "achievements", "name": "Honors & Achievements" }
    ],
    "items": [
      {
        "id": "cert-1",
        "category": "technical",
        "title": "Certification Title",
        "issuer": "Issuer Organization",
        "period": "Year",
        "credentialId": "ID-12345",
        "verificationUrl": "https://...",
        "badge": "Badge text",
        "description": "Certification summary"
      }
    ]
  },
  "contact": {
    "sectionTag": "GET IN TOUCH",
    "title": "",
    "subtitle": "Inbox open for opportunities.",
    "email": "candidate email",
    "secondaryEmail": "fallback email",
    "responseTime": "SLA: Guaranteed response within 24 hours",
    "social": [
      { "platform": "GitHub", "handle": "@user", "url": "https://github.com/...", "icon": "github" },
      { "platform": "LinkedIn", "handle": "in/user", "url": "https://linkedin.com/in/...", "icon": "linkedin" }
    ],
    "serviceOptions": [
      "Full Stack Web App",
      "Next.js / React Architecture",
      "API & Microservices",
      "UI/UX Design System"
    ],
    "timezoneMatrix": [
      { "region": "Americas (EST/PST)", "overlap": "3 - 4 Hours Daily" },
      { "region": "Europe & UK (CET/GMT)", "overlap": "5 - 6 Hours Daily" },
      { "region": "Asia-Pacific (IST/SGT/AEST)", "overlap": "Full Working Day" }
    ]
  }
}

---
RAW RESUME TEXT TO EXTRACT FROM:
${rawText}
`;

  let responseText = '';
  const controller = new AbortController();
  const fetchTimeout = setTimeout(() => controller.abort(), 6000);

  // 1. Primary: Direct REST call with official models (fast, reliable, native JSON mode)
  const modelsToTry = ['gemini-3.8-flash', 'gemini-2.5-flash'];
  let restSucceeded = false;

  for (const model of modelsToTry) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        })
      });
      const data = await res.json();
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        responseText = data.candidates[0].content.parts[0].text;
        restSucceeded = true;
        break;
      } else if (data.error) {
        console.warn(`[AI Parser] REST call model ${model} error:`, data.error.message || JSON.stringify(data.error));
        // Quota exceeded is key-level, break immediately to fallback
        if (data.error.code === 429 || (data.error.message && /quota|rate limit/i.test(data.error.message))) {
          break;
        }
      }
    } catch (restErr) {
      console.warn(`[AI Parser] REST call ${model} failed:`, restErr.message);
      break;
    }
  }
  clearTimeout(fetchTimeout);

  if (!restSucceeded || !responseText) {
    // Immediate fallback to deterministic rule parser
    console.log('[AI Parser] Switched to deterministic rule-based parser for instant, reliable response.');
    return fallbackRuleBasedParser(rawText, basePortfolio);
  }

  // Sanitize JSON
  let cleaned = responseText.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/i, '');
  if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/i, '');
  if (cleaned.endsWith('```')) cleaned = cleaned.replace(/\s*```$/i, '');

  try {
    const parsed = JSON.parse(cleaned);
    return validateAndMergePortfolio(parsed, basePortfolio);
  } catch (jsonErr) {
    console.warn('[AI Parser] JSON parse error, falling back to rule-based parser:', jsonErr.message);
    return fallbackRuleBasedParser(rawText, basePortfolio);
  }
}

/**
 * Deterministic Regex/Rule-Based Parser (Works completely offline without API key)
 */
function fallbackRuleBasedParser(rawText, basePortfolio = {}) {
  const result = JSON.parse(JSON.stringify(basePortfolio || {}));

  // Ensure top-level containers exist
  result.profile = result.profile || {};
  result.stats = result.stats || [];
  result.about = result.about || {};
  result.skills = result.skills || {};
  result.projects = result.projects || {};
  result.experience = result.experience || {};
  result.education = result.education || {};
  result.certifications = result.certifications || {};
  result.contact = result.contact || {};

  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  // Group text into sections based on recognized headers
  const sectionMap = {};
  let currentSection = 'HEADER';
  sectionMap[currentSection] = [];
  const KNOWN_SECTIONS = [
    'PROFESSIONAL SUMMARY',
    'TECHNICAL SKILLS',
    'EXPERIENCE',
    'PROJECTS',
    'EDUCATION',
    'CERTIFICATIONS & ACHIEVEMENTS'
  ];

  lines.forEach(line => {
    const matched = KNOWN_SECTIONS.find(s => line.toUpperCase() === s);
    if (matched) {
      currentSection = matched;
      sectionMap[currentSection] = [];
    } else {
      sectionMap[currentSection].push(line);
    }
  });

  // 1. Extract Name & Email & Links
  const headerLines = sectionMap['HEADER'] || [];
  const nameBlacklist = /^(curriculum vitae|resume|cv|biodata|bio-data|personal details|profile|portfolio|contact details)$/i;
  for (const line of headerLines) {
    const trimmed = (line || '').trim();
    if (!trimmed) continue;
    if (nameBlacklist.test(trimmed)) continue;
    if (trimmed.includes('@') || trimmed.includes('http') || trimmed.includes('github') || trimmed.includes('linkedin')) continue;
    if (/^\+?\d[\d\s\-().]{8,}$/.test(trimmed)) continue; // phone numbers only
    if (trimmed.length > 2 && trimmed.length < 50) {
      result.profile.name = trimmed;
      result.profile.shortName = trimmed.split(' ')[0] || trimmed;
      break;
    }
  }

  const emailMatch = rawText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    result.profile.email = emailMatch[1];
    result.contact.email = emailMatch[1];
  }

  const githubMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i);
  if (githubMatch) {
    result.profile.githubUrl = `https://github.com/${githubMatch[1]}`;
    result.profile.githubUser = githubMatch[1];
  }

  const linkedinMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
  if (linkedinMatch) {
    result.profile.linkedinUrl = `https://linkedin.com/in/${linkedinMatch[1]}`;
  }

  // 2. Extract Professional Summary & Title & Tagline
  const summaryLines = sectionMap['PROFESSIONAL SUMMARY'] || [];
  const fullSummary = summaryLines.join(' ');
  const isDataAnalyst = /data analyst|power bi|pandas|dax|tableau/i.test(fullSummary || rawText);

  if (fullSummary) {
    if (isDataAnalyst) {
      result.profile.title = 'Data Analyst Trainee & Power BI Developer';
      result.profile.heroTagline = 'Skilled in SQL, Python, Advanced Excel, and Power BI. Experienced in analyzing healthcare and banking datasets to identify trends and generate actionable, data-driven insights.';
    } else {
      result.profile.title = 'Full-Stack Software Developer';
      result.profile.heroTagline = fullSummary.length > 30 ? fullSummary : result.profile.heroTagline;
    }
  } else {
    for (let i = 1; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      if (/developer|engineer|architect|designer|lead|specialist|analyst/i.test(line) && !line.includes('@')) {
        result.profile.title = line.replace(/^[|\-•\s]+|[|\-•\s]+$/g, '');
        break;
      }
    }
  }

  // 3. Extract Experience
  const expLines = sectionMap['EXPERIENCE'] || [];
  if (expLines.length > 0) {
    const experiences = [];
    let curExp = null;

    expLines.forEach(line => {
      const periodMatch = line.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})\s*[\-–—to\s]+\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Present|Current|\d{4})/i);
      if (periodMatch) {
        if (curExp) experiences.push(curExp);
        const roleStr = line.substring(0, periodMatch.index).trim();
        const periodStr = line.substring(periodMatch.index).trim();
        curExp = {
          role: roleStr,
          period: periodStr,
          company: '',
          location: '',
          bullets: []
        };
      } else if (curExp && !curExp.company && !line.startsWith('•')) {
        const parts = line.split(/\s{2,}|\s*,\s*/);
        curExp.company = parts[0] || line;
        curExp.location = parts.slice(1).join(', ') || 'India';
      } else if (curExp && line.startsWith('•')) {
        curExp.bullets.push(line.replace(/^[•\-\*]\s*/, '').trim());
      } else if (curExp && curExp.bullets.length > 0) {
        curExp.bullets[curExp.bullets.length - 1] += ' ' + line;
      }
    });
    if (curExp) experiences.push(curExp);

    if (experiences.length > 0) {
      result.experience.roles = experiences.map((exp, idx) => ({
        id: `exp-${idx + 1}`,
        role: exp.role || 'Software Developer',
        company: exp.company || 'Technology Company',
        location: exp.location || 'India',
        period: exp.period || '2025 — Present',
        isCurrent: /present|current|2026/i.test(exp.period),
        highlights: exp.bullets.length > 0 ? exp.bullets : [
          'Engineered core production features and scalable services.',
          'Collaborated with cross-functional teams to deliver high-quality solutions.'
        ],
        techStack: isDataAnalyst
          ? ['Python', 'SQL', 'MySQL', 'Pandas', 'Power BI', 'DAX', 'Advanced Excel']
          : ['JavaScript', 'Python', 'React.js', 'FastAPI', 'PostgreSQL']
      }));
    }
  }

  // 4. Extract Projects
  const projLines = sectionMap['PROJECTS'] || [];
  if (projLines.length > 0) {
    const projects = [];
    let curProj = null;

    for (let i = 0; i < projLines.length; i++) {
      const line = projLines[i];
      const nextLine = projLines[i + 1] || '';
      const isTitle = line.includes('| GitHub') || /^Tech Stack:/i.test(nextLine);

      if (isTitle) {
        if (curProj) projects.push(curProj);
        curProj = {
          title: line.replace(/\s*\|\s*GitHub/i, '').trim(),
          techStack: [],
          bullets: []
        };
      } else if (curProj && /^Tech Stack:/i.test(line)) {
        curProj.techStack = line.replace(/^Tech Stack:\s*/i, '').split(',').map(s => s.trim()).filter(Boolean);
      } else if (curProj && line.startsWith('•')) {
        curProj.bullets.push(line.replace(/^[•\-\*]\s*/, '').trim());
      } else if (curProj && curProj.bullets.length > 0) {
        curProj.bullets[curProj.bullets.length - 1] += ' ' + line;
      }
    }
    if (curProj) projects.push(curProj);

    if (projects.length > 0) {
      result.projects.items = projects.map((p, idx) => ({
        id: p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        number: String(idx + 1).padStart(2, '0'),
        title: p.title,
        category: p.title.toLowerCase().includes('healthcare') ? 'Healthcare Data Analytics' : (p.title.toLowerCase().includes('loan') ? 'Banking & Risk Analytics' : 'Full-Stack Web System'),
        description: p.bullets[0] || `${p.title} data-driven analytics and reporting system.`,
        metrics: p.bullets[p.bullets.length - 1] || 'Actionable insights generated with interactive KPI reporting.',
        techStack: p.techStack.length > 0 ? p.techStack : ['Python', 'SQL'],
        githubUrl: result.profile.githubUrl ? `${result.profile.githubUrl}/${p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : 'https://github.com/Alam292',
        liveDemoUrl: '#',
        featured: true,
        image: idx === 0 ? 'assets/project-cloudscale.svg' : (idx === 1 ? 'assets/project-pulsemetrics.svg' : 'assets/project-nexusui.svg'),
        hasLiveDemo: false
      }));
    }
  }

  // 5. Extract Technical Skills
  if (isDataAnalyst) {
    result.skills = {
      sectionTag: "TECHNICAL ARSENAL",
      title: "Core Skills & Technologies",
      subtitle: "Interactive category-wise showcase of official data analytics technologies and BI tools.",
      categories: [
        {
          id: "languages",
          name: "Programming & Databases",
          icon: "code",
          description: "Core programming languages and relational database engines for data manipulation.",
          skills: [
            { name: "Python", icon: "python" },
            { name: "SQL", icon: "mysql" },
            { name: "MySQL", icon: "mysql" }
          ]
        },
        {
          id: "frontend",
          name: "Data Visualization & BI",
          icon: "layers",
          description: "Business Intelligence dashboards, KPI reports, and interactive visual analytics.",
          skills: [
            { name: "Power BI", icon: "bootstrap" },
            { name: "DAX", icon: "fastapi" },
            { name: "Power Query", icon: "react" },
            { name: "Tableau", icon: "nextjs" }
          ]
        },
        {
          id: "backend",
          name: "Python Libraries & Tools",
          icon: "server",
          description: "Libraries for mathematical computation, automated EDA, and data processing.",
          skills: [
            { name: "Pandas", icon: "python" },
            { name: "NumPy", icon: "python" },
            { name: "Matplotlib", icon: "django" },
            { name: "Seaborn", icon: "fastapi" }
          ]
        },
        {
          id: "databases",
          name: "Data Analysis & ETL",
          icon: "database",
          description: "Data extraction, transformation, cleaning, validation, and exploratory data analysis.",
          skills: [
            { name: "Data Cleaning", icon: "sqlalchemy" },
            { name: "ETL", icon: "postgresql" },
            { name: "EDA", icon: "sqlite" },
            { name: "Statistics", icon: "mongodb" }
          ]
        },
        {
          id: "tools",
          name: "Spreadsheets & Dev Tools",
          icon: "cpu",
          description: "Spreadsheets, interactive computing environments, and collaborative version control.",
          skills: [
            { name: "Advanced Excel", icon: "vscode" },
            { name: "Jupyter Notebook", icon: "python" },
            { name: "Git", icon: "git" },
            { name: "GitHub", icon: "github" }
          ]
        },
        {
          id: "ai-tools",
          name: "AI & Productivity Tools",
          icon: "zap",
          description: "Advanced AI assistance platforms and intelligent workflow automation environments.",
          skills: [
            { name: "ChatGPT", icon: "chatgpt" },
            { name: "Claude", icon: "claude" },
            { name: "Gemini", icon: "gemini" },
            { name: "Antigravity IDE", icon: "antigravity" }
          ]
        }
      ]
    };
  } else {
    // Default software engineering skill categories
    const officialCategories = [
      {
        id: "languages",
        name: "Programming Languages",
        icon: "code",
        description: "Core programming languages utilized for full-stack engineering, robust typing, and high-performance algorithms.",
        skills: [
          { name: "Python", icon: "python" },
          { name: "Java", icon: "java" },
          { name: "JavaScript", icon: "javascript" },
          { name: "HTML5", icon: "html5" },
          { name: "CSS3", icon: "css3" }
        ]
      },
      {
        id: "frontend",
        name: "Frontend Development",
        icon: "layers",
        description: "Modern frontend architectures, component systems, and high-fidelity responsive user interfaces.",
        skills: [
          { name: "React.js", icon: "react" },
          { name: "Next.js", icon: "nextjs" },
          { name: "Tailwind CSS", icon: "tailwindcss" },
          { name: "Bootstrap", icon: "bootstrap" },
          { name: "Redux", icon: "redux" }
        ]
      },
      {
        id: "backend",
        name: "Backend Development",
        icon: "server",
        description: "High-throughput RESTful microservices, asynchronous execution, and enterprise web frameworks.",
        skills: [
          { name: "FastAPI", icon: "fastapi" },
          { name: "Django", icon: "django" },
          { name: "Node.js", icon: "nodejs" },
          { name: "Express.js", icon: "express" },
          { name: "REST API", icon: "restapi" }
        ]
      },
      {
        id: "databases",
        name: "Databases",
        icon: "database",
        description: "Relational data modeling, schema normalization, and performant query optimization.",
        skills: [
          { name: "SQLAlchemy", icon: "sqlalchemy" },
          { name: "MySQL", icon: "mysql" },
          { name: "PostgreSQL", icon: "postgresql" },
          { name: "MongoDB", icon: "mongodb" },
          { name: "SQLite", icon: "sqlite" }
        ]
      },
      {
        id: "tools",
        name: "Tools & Technologies",
        icon: "cpu",
        description: "Developer tooling, containerization, version control, and rigorous API testing suites.",
        skills: [
          { name: "Git", icon: "git" },
          { name: "GitHub", icon: "github" },
          { name: "VS Code", icon: "vscode" },
          { name: "Docker", icon: "docker" },
          { name: "Postman", icon: "postman" },
          { name: "Linux", icon: "linux" }
        ]
      },
      {
        id: "ai-tools",
        name: "AI Development Tools",
        icon: "zap",
        description: "Advanced AI coding assistants and intelligent automation tools accelerating full-stack delivery.",
        skills: [
          { name: "ChatGPT", icon: "chatgpt" },
          { name: "Claude", icon: "claude" },
          { name: "Gemini", icon: "gemini" },
          { name: "Antigravity IDE", icon: "antigravity" }
        ]
      }
    ];

    if (!result.skills || !Array.isArray(result.skills.categories) || result.skills.categories.length === 0) {
      result.skills = {
        sectionTag: "TECHNICAL ARSENAL",
        title: "Core Skills & Technologies",
        subtitle: "Interactive category-wise showcase of official technologies and tools powering scalable web systems and AI applications.",
        categories: officialCategories
      };
    }
  }

  // 6. Who Am I Revamp Schema Alignment
  result.about = result.about || {};
  result.about.sectionTag = "WHO I AM";
  result.about.terminalCommand = "whoami";

  if (isDataAnalyst) {
    result.about.lead = "I am a Data Analyst Trainee and Power BI Developer skilled in data cleaning, ETL, EDA, DAX, Power Query, and interactive dashboard development. Experienced in analyzing healthcare and banking datasets to identify trends and generate actionable, data-driven insights.";
    result.about.highlights = [
      { icon: "zap", title: "Actionable Insights", detail: "Power BI & DAX Dashboards" },
      { icon: "code", title: "Python Analytics", detail: "Pandas, NumPy & EDA" },
      { icon: "database", title: "Database Querying", detail: "SQL, MySQL & ETL" },
      { icon: "shield", title: "Business Reports", detail: "Advanced Excel & Tableau" }
    ];
  } else {
    const leadRole = result.profile.title || "Full-Stack Software Developer";
    result.about.lead = `I am a ${leadRole} specializing in high-throughput backend APIs with FastAPI & Django, paired with responsive, clean frontends in React & Next.js. Focused on robust database schemas, clean architecture, and reliable production deployment.`;
    result.about.highlights = [
      { icon: "zap", title: "High-Speed APIs", detail: "FastAPI & Django REST" },
      { icon: "code", title: "Modern Frontends", detail: "React, Next.js & UI/UX" },
      { icon: "database", title: "Relational Schemas", detail: "PostgreSQL & SQLAlchemy" },
      { icon: "shield", title: "Production Ready", detail: "Tested & Cloud Deployed" }
    ];
  }

  // 7. Extract Certifications
  const certLines = sectionMap['CERTIFICATIONS & ACHIEVEMENTS'] || [];
  if (certLines.length > 0) {
    const certBullets = certLines
      .filter(l => (l.startsWith('•') || l.startsWith('-')) && !l.includes('-- 1 of 1 --'))
      .map(l => l.replace(/^[•\-\*]\s*/, '').trim());
    if (certBullets.length > 0) {
      result.certifications.items = certBullets.map((c, idx) => {
        const parts = c.split(/[–\-]/);
        return {
          id: `cert-${idx + 1}`,
          title: parts[0]?.trim() || c,
          issuer: parts.slice(1).join(' - ').trim() || 'Professional Certification',
          date: '2026',
          credentialUrl: '#',
          skillsCovered: isDataAnalyst ? ['Data Analytics', 'SQL', 'Python'] : ['Full-Stack', 'Web Development']
        };
      });
    }
  }

  return validateAndMergePortfolio(result, basePortfolio);
}

/**
 * Validate and safely merge incoming parsed data with defaults to prevent UI breakage
 */
function validateAndMergePortfolio(incoming, base = {}) {
  const finalData = { ...base, ...incoming };

  // Profile sanity check
  finalData.profile = finalData.profile || {};
  if (!finalData.profile.name) finalData.profile.name = base.profile?.name || 'Developer';
  if (!finalData.profile.title) finalData.profile.title = base.profile?.title || 'Full Stack Developer & UI Engineer';
  if (finalData.profile.status === undefined) finalData.profile.status = base.profile?.status || '';
  if (!finalData.profile.avatarUrl) finalData.profile.avatarUrl = base.profile?.avatarUrl || 'assets/profile-avatar.svg';

  // Stats check
  if (!Array.isArray(finalData.stats) || finalData.stats.length === 0) {
    finalData.stats = base.stats || [
      { value: "2+", suffix: "Years", label: "Engineering Experience", description: "Building full-stack web applications and robust architectures" },
      { value: "15+", suffix: "APIs", label: "REST Endpoints Built", description: "Designed high-speed FastAPI and Django REST services" },
      { value: "3+", suffix: "Systems", label: "Full-Stack Products", description: "Production-grade SaaS and management dashboards" },
      { value: "99.9%", suffix: "Uptime", label: "Cloud Reliability", description: "High availability, smooth operations and reliability" }
    ];
  }

  // Who Am I (About) sanity check
  finalData.about = finalData.about || {};
  finalData.about.sectionTag = finalData.about.sectionTag || base.about?.sectionTag || "WHO I AM";
  finalData.about.terminalCommand = finalData.about.terminalCommand || base.about?.terminalCommand || "whoami";
  finalData.about.lead = finalData.about.lead || base.about?.lead || "Full-Stack Software Developer specializing in high-throughput backend APIs with FastAPI & Django, paired with responsive, clean frontends in React & Next.js.";
  if (!Array.isArray(finalData.about.highlights) || finalData.about.highlights.length === 0) {
    finalData.about.highlights = base.about?.highlights || [
      { icon: "zap", title: "High-Speed APIs", detail: "FastAPI & Django REST" },
      { icon: "code", title: "Modern Frontends", detail: "React, Next.js & UI/UX" },
      { icon: "database", title: "Relational Schemas", detail: "PostgreSQL & SQLAlchemy" },
      { icon: "shield", title: "Production Ready", detail: "Tested & Cloud Deployed" }
    ];
  }

  // Skills sanity check & auto-normalization for React brand showcase
  finalData.skills = finalData.skills || {};
  finalData.skills.sectionTag = finalData.skills.sectionTag || "TECHNICAL ARSENAL";
  finalData.skills.title = finalData.skills.title || "Core Skills & Technologies";
  finalData.skills.subtitle = finalData.skills.subtitle || "Interactive category-wise showcase of official technologies and tools powering scalable web systems and AI applications.";

  if (!Array.isArray(finalData.skills.categories) || finalData.skills.categories.length === 0) {
    finalData.skills = base.skills || finalData.skills;
  } else {
    // Ensure all categories have valid 'skills' array with lowercase icons
    finalData.skills.categories = finalData.skills.categories.map(cat => {
      let skillsArr = Array.isArray(cat.skills) ? cat.skills : [];
      if (skillsArr.length === 0 && Array.isArray(cat.items)) {
        // Handle Gemini legacy format gracefully
        skillsArr = cat.items.map(item => ({
          name: item.name || String(item),
          icon: (item.icon || item.name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
        }));
      }
      return {
        id: cat.id || cat.name?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'category',
        name: cat.name || 'Category',
        icon: cat.icon || 'code',
        description: cat.description || '',
        skills: skillsArr.map(s => ({
          name: s.name,
          icon: (s.icon || s.name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
        }))
      };
    });
  }

  // Projects sanity check
  finalData.projects = finalData.projects || {};
  if (!Array.isArray(finalData.projects.items) || finalData.projects.items.length === 0) {
    finalData.projects = base.projects;
  }

  // Experience sanity check
  finalData.experience = finalData.experience || {};
  if (!Array.isArray(finalData.experience.roles) || finalData.experience.roles.length === 0) {
    finalData.experience = base.experience;
  }

  // Education sanity check
  finalData.education = finalData.education || {};
  if (!Array.isArray(finalData.education.degrees) || finalData.education.degrees.length === 0) {
    finalData.education = base.education;
  }

  // Certifications sanity check
  finalData.certifications = finalData.certifications || {};
  if (!Array.isArray(finalData.certifications.items) || finalData.certifications.items.length === 0) {
    finalData.certifications = base.certifications;
  }

  // Contact sanity check
  finalData.contact = finalData.contact || {};
  if (!finalData.contact.email) {
    finalData.contact.email = finalData.profile.email || base.contact?.email || 'contact@matloob.dev';
  }

  return finalData;
}

module.exports = {
  extractRawText,
  structureResumeWithAI,
  fallbackRuleBasedParser,
  validateAndMergePortfolio
};

