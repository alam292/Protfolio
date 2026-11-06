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
      return await callGeminiAI(rawText, basePortfolio, apiKey);
    } catch (aiErr) {
      console.warn('[AI Parser] Gemini AI call failed, switching to deterministic fallback parser:', aiErr.message);
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
3. Organize skills into 4-5 logical categories (e.g. Programming Languages, Frontend Technologies, Backend Technologies, Databases & Storage, Developer Tools & DevOps).
4. Extract all work experience chronologically, with bullet highlights describing architectural impact and metrics.
5. Extract education degrees with university name, period, and honors or CGPA if mentioned.
6. Extract certifications and achievements.
7. Craft a punchy professional elevator headline and hero tagline representing the candidate.

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
    { "value": "3+", "suffix": "Years", "label": "Commercial Experience", "description": "Engineering full-stack web applications" },
    { "value": "100K+", "suffix": "MAU", "label": "Users Scaled", "description": "Architected platforms serving large traffic" },
    { "value": "40%", "suffix": "Faster", "label": "Performance Gains", "description": "Reduced bundle sizes and latency" },
    { "value": "20+", "suffix": "Shipped", "label": "Production Projects", "description": "Shipped applications and tools" }
  ],
  "about": {
    "sectionTag": "WHO I AM",
    "title": "Engineering High-Performance Web Systems with Pixel-Perfect Precision",
    "lead": "Compelling summary paragraph",
    "pillars": [
      { "id": "identity", "tag": "01. IDENTITY & CRAFT", "title": "Core craft title", "content": "Craft description", "icon": "terminal" },
      { "id": "journey", "tag": "02. THE JOURNEY", "title": "Journey title", "content": "Journey description", "icon": "git-branch" },
      { "id": "goals", "tag": "03. TRACK RECORD & IMPACT", "title": "Impact title", "content": "Impact description", "icon": "zap" },
      { "id": "philosophy", "tag": "04. PASSION & STANDARDS", "title": "Standards title", "content": "Standards description", "icon": "shield" }
    ]
  },
  "skills": {
    "sectionTag": "TECHNICAL ARSENAL",
    "title": "Core Competencies & Technology Matrix",
    "subtitle": "Carefully selected technologies battle-tested across production systems.",
    "categories": [
      {
        "id": "languages",
        "name": "Programming Languages",
        "icon": "code",
        "description": "Primary languages",
        "items": [
          { "name": "TypeScript", "level": "Advanced", "badge": "Primary" }
        ]
      }
    ]
  },
  "projects": {
    "sectionTag": "FEATURED WORK",
    "title": "Selected Engineering Projects",
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
    "title": "Work Experience & Professional Impact",
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
    "title": "Education & Academic Qualifications",
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
    "title": "Certifications & Professional Achievements",
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
    "title": "Let's Build Something High-Impact Together",
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

  // 1. Primary: Direct REST call with gemini-3.8-flash (fast, reliable, native JSON mode)
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    } else if (data.error) {
      throw new Error(`Gemini API Error: ${data.error.message || JSON.stringify(data.error)}`);
    }
  } catch (restErr) {
    console.warn('[AI Parser] REST call failed, trying SDK fallback:', restErr.message);

    // 2. Secondary fallback: @google/genai SDK
    try {
      const { GoogleGenAI } = require('@google/genai');
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });
      responseText = response.text || (response.candidates && response.candidates[0]?.content?.parts[0]?.text) || '';
    } catch (sdkErr) {
      // 3. Tertiary fallback: @google/generative-ai SDK
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-3.8-flash' });
        const result = await model.generateContent(prompt);
        responseText = result.response.text();
      } catch (genAiErr) {
        console.warn('[AI Parser] Gemini AI call failed, switching to deterministic fallback parser:', genAiErr.message);
        return fallbackRuleBasedParser(rawText, basePortfolio);
      }
    }
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

  // 1. Extract Name (usually in first 3 lines)
  if (lines.length > 0) {
    const potentialName = lines[0];
    if (potentialName.length < 50 && !potentialName.includes('@') && !potentialName.includes('http')) {
      result.profile.name = potentialName;
      result.profile.shortName = potentialName.split(' ')[0] || potentialName;
    }
  }

  // 2. Extract Email
  const emailMatch = rawText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    result.profile.email = emailMatch[1];
    result.contact.email = emailMatch[1];
  }

  // 3. Extract Links
  const githubMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i);
  if (githubMatch) {
    result.profile.githubUrl = `https://github.com/${githubMatch[1]}`;
    result.profile.githubUser = githubMatch[1];
  }

  const linkedinMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
  if (linkedinMatch) {
    result.profile.linkedinUrl = `https://linkedin.com/in/${linkedinMatch[1]}`;
  }

  // 4. Extract Title
  for (let i = 1; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    if (/developer|engineer|architect|designer|lead|specialist/i.test(line) && !line.includes('@')) {
      result.profile.title = line.replace(/^[|\-•\s]+|[|\-•\s]+$/g, '');
      break;
    }
  }

  // 5. Extract Experience & Roles if identifiable
  const expMatch = rawText.match(/(?:EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE)([\s\S]*?)(?:EDUCATION|PROJECTS|SKILLS|CERTIFICATIONS|$)/i);
  if (expMatch && expMatch[1]) {
    const expText = expMatch[1];
    const roleMatches = [...expText.matchAll(/([A-Z][A-Za-z\s]+(?:Developer|Engineer|Architect|Lead|Intern|Specialist)[A-Za-z\s]*)\s*[|–—-]\s*([A-Za-z0-9\s.,]+?)\s*\((\d{4}[^)]*)\)/gi)];
    if (roleMatches.length > 0) {
      result.experience.roles = roleMatches.map((m, idx) => ({
        id: `exp-${idx + 1}`,
        role: m[1].trim(),
        company: m[2].trim(),
        location: 'Full-Time',
        period: m[3].trim(),
        isCurrent: /present|current/i.test(m[3]),
        highlights: [
          'Engineered core production features and scalable services.',
          'Collaborated with cross-functional teams to deliver high-quality web experiences.'
        ],
        techStack: result.experience?.roles?.[idx]?.techStack || ['JavaScript', 'TypeScript', 'Node.js']
      }));
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
      { value: "3+", suffix: "Years", label: "Commercial Experience", description: "Engineering full-stack systems" },
      { value: "100K+", suffix: "MAU", label: "Users Scaled", description: "Architected high-scale web platforms" },
      { value: "40%", suffix: "Faster", label: "Performance Gains", description: "Reduced bundle sizes and latency" },
      { value: "25+", suffix: "Shipped", label: "Production Projects", description: "Delivered applications and systems" }
    ];
  }

  // Skills sanity check
  finalData.skills = finalData.skills || {};
  if (!Array.isArray(finalData.skills.categories) || finalData.skills.categories.length === 0) {
    finalData.skills = base.skills;
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

