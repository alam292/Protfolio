/**
 * Resume Upload & Persistence Controller (server/resume-controller.js)
 * Coordinates upload validation, automated backup snapshots,
 * in-memory text extraction, AI data transformation, and atomic JSON persistence.
 */

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { extractRawText, structureResumeWithAI } = require('./parse-resume');

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

      // 2. Also copy/replace current download resume asset
      const assetDest = path.join(ASSETS_DIR, sanitizedName);
      fs.writeFileSync(assetDest, file.buffer);

      // 3. Automated timestamped backup of portfolio.json
      const backupPath = createPortfolioBackup();

      // 4. Load baseline portfolio JSON
      let basePortfolio = {};
      if (fs.existsSync(PORTFOLIO_PATH)) {
        try {
          basePortfolio = JSON.parse(fs.readFileSync(PORTFOLIO_PATH, 'utf8'));
        } catch (parseErr) {
          console.warn('[JSON Parser] portfolio.json read warning:', parseErr.message);
        }
      }

      // 5. In-Memory Text Extraction
      console.log(`[Text Extraction] Extracting text from ${originalName} (${(file.size / 1024).toFixed(1)} KB)...`);
      const rawText = await extractRawText(file.buffer, ext);

      if (!rawText || rawText.length < 30) {
        return res.status(422).json({
          success: false,
          error: 'Could not extract meaningful text from the uploaded document. Ensure it is not an image-only scan.'
        });
      }

      console.log(`[Text Extraction] Extracted ${rawText.length} characters successfully.`);

      // 6. AI Intelligent Data Transformation (Gemini Flash API or Smart Parser)
      console.log('[AI Transformation] Transforming resume data into structured schema...');
      const structuredData = await structureResumeWithAI(rawText, basePortfolio);

      // 7. Update resume links in profile
      structuredData.profile = structuredData.profile || {};
      structuredData.profile.resumeUrl = `assets/${sanitizedName}`;
      structuredData.profile.resumeFilename = sanitizedName;

      // 8. Atomically write updated JSON to data/portfolio.json
      const tempPath = `${PORTFOLIO_PATH}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(structuredData, null, 2), 'utf8');
      fs.renameSync(tempPath, PORTFOLIO_PATH);
      console.log('[Persistence] Successfully updated data/portfolio.json');

      return res.status(200).json({
        success: true,
        message: 'Resume parsed and portfolio updated successfully!',
        backup: backupPath,
        extractedCharacters: rawText.length,
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

module.exports = {
  handleResumeUpload,
  handleGetPortfolio,
  handleListBackups,
  createPortfolioBackup
};

