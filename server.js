/**
 * High-Performance Static & API Server (server.js)
 * Serves portfolio assets and hosts AI resume upload & dynamic portfolio endpoints.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const {
  handleResumeUpload,
  handlePublishPortfolio,
  handleGetPortfolio,
  handleListBackups,
  handleRestoreBackup,
  handleVerifyPin
} = require('./server/resume-controller');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;
const PUBLIC_DIR = __dirname;

// Global Middleware & CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-pin');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.json());

// API Endpoints
app.post('/api/upload-resume', handleResumeUpload);
app.post('/api/publish-portfolio', handlePublishPortfolio);
app.post('/api/restore-backup', handleRestoreBackup);
app.post('/api/verify-pin', handleVerifyPin);
app.get('/api/portfolio', handleGetPortfolio);
app.get('/api/backups', handleListBackups);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE')
  });
});

// Custom Static File Handler to guarantee optimal caching & exact MIME types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm'
};

app.use((req, res, next) => {
  let decodedUrl;
  try {
    decodedUrl = decodeURIComponent(req.path);
  } catch (e) {
    return res.status(400).send('Bad Request');
  }

  // Skip API routes
  if (decodedUrl.startsWith('/api/')) {
    return next();
  }

  const relativePath = decodedUrl === '/' ? 'index.html' : decodedUrl.replace(/^\/+/, '');
  const filePath = path.join(PUBLIC_DIR, relativePath);

  // Security check: prevent path traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    return res.status(403).send('Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      return next();
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Accept-Ranges', 'bytes');

    if (ext === '.jpg' || ext === '.png' || ext === '.webp') {
      res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    } else {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    if (req.method === 'HEAD') {
      return res.status(200).end();
    }

    const stream = fs.createReadStream(filePath);
    stream.on('error', () => {
      try { res.end(); } catch (e) {}
    });
    res.on('close', () => {
      stream.destroy();
    });
    stream.pipe(res);
  });
});

// 404 Fallback
app.use((req, res) => {
  res.status(404).type('text/plain').send('404 Not Found');
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack || err);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

// Process-level error protection
process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err.stack || err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason);
});

// Server Starter with automatic port increment if in use
let currentPort = PORT;

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`[HTTP Server] Portfolio server running at http://localhost:${port}`);
    console.log(`[HTTP Server] AI Resume Upload active at POST http://localhost:${port}/api/upload-resume`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} in use, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });

  return server;
}

if (require.main === module) {
  startServer(currentPort);
}

module.exports = { app, startServer };
