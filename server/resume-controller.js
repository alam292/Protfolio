/**
 * Resume Upload & Persistence Controller (server/resume-controller.js)
 * Coordinates upload validation, automated backup snapshots,
 * in-memory text extraction, AI data transformation, and atomic JSON persistence.
 */

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { extractRawText, structureResumeWithAI, validateAndMergePortfolio } = require('./parse-resume');

const ROOT_DIR = path.resolve(__dirname, '..');
const PORTFOLIO_PATH = path.join(ROOT_DIR, 'data', 'portfolio.json');
const BACKUPS_DIR = path.join(ROOT_DIR, 'data', 'backups');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const ASSETS_DIR = path.join(ROOT_DIR, 'assets');

// Ensure required directories exist
[BACKUPS_DIR, UPLOADS_DIR, ASSETS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure Multer storage (Memory storage for instant buffer parsing)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.pdf', '.docx', '.doc'];
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${ext}. Only PDF and DOCX files are supported.`));
    }
  }
}).single('resume');

/**
 * Create a timestamped backup of data/portfolio.json
 * @returns {string} Relative path of created backup file
 */
function createPortfolioBackup() {
  if (!fs.existsSync(PORTFOLIO_PATH)) {
    return null;
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `portfolio-${timestamp}.json`;
  const backupFilePath = path.join(BACKUPS_DIR, backupFileName);

  const currentContent = fs.readFileSync(PORTFOLIO_PATH, 'utf8');
  fs.writeFileSync(backupFilePath, currentContent, 'utf8');
  console.log(`[Backup Engine] Created automated snapshot: ${backupFileName}`);
  return `data/backups/${backupFileName}`;
}

/**
 * Compute intelligent diff between baseline portfolio and parsed candidate portfolio
 * @param {object} oldData - Baseline portfolio data
 * @param {object} newData - Staged / newly parsed portfolio data
 * @returns {object} Structured changes summary
 */
function computePortfolioDiff(oldData = {}, newData = {}) {
  const diff = {
    hasChanges: false,
    profile: {},
    about: { highlightsChanged: false, highlightsCount: 0, items: [] },
    skills: { added: [], removed: [], totalOld: 0, totalNew: 0, categoriesCount: 0 },
    experience: { oldCount: 0, newCount: 0, roles: [] },
    projects: { oldCount: 0, newCount: 0, titles: [] },
    education: { oldCount: 0, newCount: 0, degrees: [] },
    certifications: { oldCount: 0, newCount: 0 }
  };

  const oldProf = oldData.profile || {};
  const newProf = newData.profile || {};

  if (oldProf.name !== newProf.name && newProf.name) {
    diff.profile.name = { old: oldProf.name, new: newProf.name };
    diff.hasChanges = true;
  }
  if (oldProf.title !== newProf.title && newProf.title) {
    diff.profile.title = { old: oldProf.title, new: newProf.title };
    diff.hasChanges = true;
  }
  if (oldProf.email !== newProf.email && newProf.email) {
    diff.profile.email = { old: oldProf.email, new: newProf.email };
    diff.hasChanges = true;
  }
  if (oldProf.summary !== newProf.summary && newProf.summary) {
    diff.profile.summary = {
      old: oldProf.summary ? (oldProf.summary.slice(0, 100) + (oldProf.summary.length > 100 ? '...' : '')) : '',
      new: newProf.summary ? (newProf.summary.slice(0, 100) + (newProf.summary.length > 100 ? '...' : '')) : ''
    };
    diff.hasChanges = true;
  }

  // Skills diff
  const extractSkills = (data) => {
    if (!data?.skills?.categories) return [];
    return data.skills.categories.flatMap(c => (c.skills || c.items || []).map(s => (typeof s === 'string' ? s : s.name)));
  };
  const oldSkills = extractSkills(oldData);
  const newSkills = extractSkills(newData);

  const addedSkills = newSkills.filter(s => s && !oldSkills.includes(s));
  const removedSkills = oldSkills.filter(s => s && !newSkills.includes(s));

  diff.skills = {
    added: addedSkills,
    removed: removedSkills,
    totalOld: oldSkills.length,
    totalNew: newSkills.length,
    categoriesCount: newData.skills?.categories?.length || 0
  };
  if (addedSkills.length > 0 || removedSkills.length > 0 || oldSkills.length !== newSkills.length) {
    diff.hasChanges = true;
  }

  // Who Am I Highlights
  const oldHl = oldData.about?.highlights || [];
  const newHl = newData.about?.highlights || [];
  const hlChanged = JSON.stringify(oldHl) !== JSON.stringify(newHl);
  diff.about = {
    highlightsChanged: hlChanged,
    highlightsCount: newHl.length,
    items: newHl.map(h => ({ title: h.title, stat: h.stat }))
  };
  if (hlChanged) diff.hasChanges = true;

  // Experience
  const oldRoles = oldData.experience?.roles || [];
  const newRoles = newData.experience?.roles || [];
  diff.experience = {
    oldCount: oldRoles.length,
    newCount: newRoles.length,
    roles: newRoles.map(r => `${r.title || r.role || 'Role'} @ ${r.company || 'Company'}`)
  };
  if (oldRoles.length !== newRoles.length) diff.hasChanges = true;

  // Projects
  const oldProj = oldData.projects?.items || [];
  const newProj = newData.projects?.items || [];
  diff.projects = {
    oldCount: oldProj.length,
    newCount: newProj.length,
    titles: newProj.map(p => p.title || p.name || 'Project')
  };
  if (oldProj.length !== newProj.length) diff.hasChanges = true;

  // Education
  const oldEdu = oldData.education?.degrees || [];
  const newEdu = newData.education?.degrees || [];
  diff.education = {
    oldCount: oldEdu.length,
    newCount: newEdu.length,
    degrees: newEdu.map(d => `${d.degree} - ${d.institution}`)
  };
  if (oldEdu.length !== newEdu.length) diff.hasChanges = true;

  // Certifications
  const oldCert = oldData.certifications?.items || [];
  const newCert = newData.certifications?.items || [];
  diff.certifications = {
    oldCount: oldCert.length,
    newCount: newCert.length
  };
  if (oldCert.length !== newCert.length) diff.hasChanges = true;

  return diff;
}

/**
 * Handle POST /api/upload-resume
 */
async function handleResumeUpload(req, res) {
  upload(req, res, async (err) => {
    if (err) {
      console.error('[Upload Error]', err.message);
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No resume file provided. Please attach a PDF or DOCX file under field "resume".'
      });
    }

    try {
      const file = req.file;
      const originalName = file.originalname || 'Resume.pdf';
      const ext = path.extname(originalName).toLowerCase();
      const sanitizedName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const timestamp = Date.now();
      const savedFileName = `${path.basename(sanitizedName, ext)}_${timestamp}${ext}`;

      // 1. Save uploaded file to uploads directory
      const uploadDest = path.join(UPLOADS_DIR, savedFileName);
      fs.writeFileSync(uploadDest, file.buffer);
      console.log(`[File Storage] Saved uploaded resume to: uploads/${savedFileName}`);

      // Check whether this request is a Preview/Review call (Phase 3)
      const isPreview = (req.query.preview === 'true' || (req.body && req.body.preview === 'true'));

      // 2. Load baseline portfolio JSON
      let basePortfolio = {};
      if (fs.existsSync(PORTFOLIO_PATH)) {
        try {
          basePortfolio = JSON.parse(fs.readFileSync(PORTFOLIO_PATH, 'utf8'));
        } catch (parseErr) {
          console.warn('[JSON Parser] portfolio.json read warning:', parseErr.message);
        }
      }

      // 3. In-Memory Text Extraction
      console.log(`[Text Extraction] Extracting text from ${originalName} (${(file.size / 1024).toFixed(1)} KB)...`);
      const rawText = await extractRawText(file.buffer, ext);

      if (!rawText || rawText.length < 30) {
        return res.status(422).json({
          success: false,
          error: 'Could not extract meaningful text from the uploaded document. Ensure it is not an image-only scan.'
        });
      }

      console.log(`[Text Extraction] Extracted ${rawText.length} characters successfully.`);

      // 4. AI Intelligent Data Transformation (Gemini Flash API or Smart Parser)
      console.log('[AI Transformation] Transforming resume data into structured schema...');
      const structuredData = await structureResumeWithAI(rawText, basePortfolio);

      // 5. Update resume links in profile
      structuredData.profile = structuredData.profile || {};
      structuredData.profile.resumeUrl = `assets/${sanitizedName}`;
      structuredData.profile.resumeFilename = sanitizedName;

      // 6. Compute diff between baseline and new parsed data
      const diffSummary = computePortfolioDiff(basePortfolio, structuredData);

      // In Preview / Review mode: return parsed data and diff WITHOUT saving to portfolio.json
      if (isPreview) {
        console.log('[Preview Mode] Resume parsed & diff computed. Awaiting user confirmation before publishing.');
        return res.status(200).json({
          success: true,
          preview: true,
          message: 'Resume analyzed successfully. Review changes before publishing.',
          diff: diffSummary,
          data: structuredData,
          extractedCharacters: rawText.length,
          resumeFilename: sanitizedName,
          uploadedFile: savedFileName
        });
      }

      // 7. Non-preview direct publish flow: copy asset, create backup, and atomically persist
      const assetDest = path.join(ASSETS_DIR, sanitizedName);
      fs.writeFileSync(assetDest, file.buffer);

      const backupPath = createPortfolioBackup();

      const tempPath = `${PORTFOLIO_PATH}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(structuredData, null, 2), 'utf8');
      try {
        fs.renameSync(tempPath, PORTFOLIO_PATH);
      } catch (renameErr) {
        fs.copyFileSync(tempPath, PORTFOLIO_PATH);
        try { fs.unlinkSync(tempPath); } catch (_) {}
      }
      console.log('[Persistence] Successfully updated data/portfolio.json');

      return res.status(200).json({
        success: true,
        message: 'Resume parsed and portfolio updated successfully!',
        backup: backupPath,
        extractedCharacters: rawText.length,
        diff: diffSummary,
        data: structuredData
      });

    } catch (processError) {
      console.error('[Processing Error]', processError);
      return res.status(500).json({
        success: false,
        error: `Processing failed: ${processError.message}`
      });
    }
  });
}

/**
 * Handle GET /api/portfolio
 */
function handleGetPortfolio(req, res) {
  try {
    if (fs.existsSync(PORTFOLIO_PATH)) {
      const data = fs.readFileSync(PORTFOLIO_PATH, 'utf8');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      return res.end(data);
    } else {
      return res.status(404).json({ success: false, error: 'portfolio.json not found' });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Handle GET /api/backups
 */
function handleListBackups(req, res) {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) {
      return res.json({ success: true, backups: [] });
    }
    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(name => {
        const stats = fs.statSync(path.join(BACKUPS_DIR, name));
        return {
          filename: name,
          path: `data/backups/${name}`,
          size: stats.size,
          created: stats.mtime
        };
      })
      .sort((a, b) => b.created - a.created);

    return res.json({ success: true, count: files.length, backups: files });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Handle POST /api/publish-portfolio (Phase 3)
 * Atomically commits the user-approved staged portfolio data and persists to disk.
 */
async function handlePublishPortfolio(req, res) {
  try {
    const { data, resumeFilename } = req.body || {};

    if (!data || typeof data !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid portfolio data payload provided.'
      });
    }

    // Load current baseline for backup and validation
    let basePortfolio = {};
    if (fs.existsSync(PORTFOLIO_PATH)) {
      try {
        basePortfolio = JSON.parse(fs.readFileSync(PORTFOLIO_PATH, 'utf8'));
      } catch (e) {
        console.warn('[Publish Engine] Read baseline warning:', e.message);
      }
    }

    // 1. Sanitize & merge through validateAndMergePortfolio
    const finalizedData = validateAndMergePortfolio(data, basePortfolio);

    // 2. If resumeFilename specified, copy from uploads to assets if found
    if (resumeFilename) {
      const sanitizedName = resumeFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const assetDest = path.join(ASSETS_DIR, sanitizedName);
      if (!fs.existsSync(assetDest) && fs.existsSync(UPLOADS_DIR)) {
        const uploadFiles = fs.readdirSync(UPLOADS_DIR);
        const baseTarget = path.basename(sanitizedName, path.extname(sanitizedName));
        const matchedUpload = uploadFiles.reverse().find(f => f.startsWith(baseTarget));
        if (matchedUpload) {
          fs.copyFileSync(path.join(UPLOADS_DIR, matchedUpload), assetDest);
          console.log(`[Publish Engine] Copied uploaded asset to: assets/${sanitizedName}`);
        }
      }
      finalizedData.profile = finalizedData.profile || {};
      finalizedData.profile.resumeUrl = `assets/${sanitizedName}`;
      finalizedData.profile.resumeFilename = sanitizedName;
    }

    // 3. Automated timestamped backup before writing
    const backupPath = createPortfolioBackup();

    // 4. Safely write updated JSON atomically to data/portfolio.json
    const tempPath = `${PORTFOLIO_PATH}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(finalizedData, null, 2), 'utf8');
    try {
      fs.renameSync(tempPath, PORTFOLIO_PATH);
    } catch (renameErr) {
      fs.copyFileSync(tempPath, PORTFOLIO_PATH);
      try { fs.unlinkSync(tempPath); } catch (_) {}
    }

    console.log(`[Publish Engine] Successfully published portfolio live! Backup: ${backupPath}`);

    return res.status(200).json({
      success: true,
      message: 'Portfolio updated and published live successfully!',
      backup: backupPath,
      data: finalizedData
    });
  } catch (err) {
    console.error('[Publish Error]', err);
    return res.status(500).json({
      success: false,
      error: `Publishing failed: ${err.message}`
    });
  }
}

module.exports = {
  handleResumeUpload,
  handlePublishPortfolio,
  handleGetPortfolio,
  handleListBackups,
  createPortfolioBackup,
  computePortfolioDiff
};

