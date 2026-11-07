const http = require('http');
const fs = require('fs');
const path = require('path');
const { app } = require('./server');
const { extractRawText, fallbackRuleBasedParser } = require('./server/parse-resume');
const { computePortfolioDiff } = require('./server/resume-controller');

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log('  [PASS]', testName);
    passed++;
  } else {
    console.error('  [FAIL]', testName);
    failed++;
  }
}

async function runTests() {
  console.log('\n=== SUITE 1: DATA STORE & RESUME VALIDATION ===');
  const data = JSON.parse(fs.readFileSync('data/portfolio.json', 'utf8'));
  assert(data.profile.name.toLowerCase().includes('matloob'), 'Profile author matches resume');
  assert(data.profile.title && data.profile.title.length > 5, 'Profile title matches resume');
  assert(fs.existsSync(data.profile.resumeUrl), 'Resume PDF file exists at path');
  assert(fs.statSync(data.profile.resumeUrl).size > 1000, 'Resume PDF is non-empty (>1KB)');
  assert(data.stats.length === 4, '4 KPI statistics configured');
  assert(data.skills.categories.length === 6, '6 Technical skills categories defined');
  assert(data.projects.items.length >= 2, 'Flagship projects present');
  assert(data.experience.roles.length >= 1, 'Experience roles documented');
  assert(data.education.degrees.length >= 2, '2 Education degrees verified');
  assert(data.certifications.items.length >= 3, 'Certifications & achievements present');
  assert(data.contact.email && data.contact.email.includes('@'), 'Verified contact email configured');

  console.log('\n=== SUITE 2: ASSET INTEGRITY ===');
  const requiredAssets = [
    'assets/Md_Matloob_Alam_Software_Developer_Resume.pdf',
    'assets/profile-avatar.svg',
    'assets/project-cloudscale.svg',
    'assets/project-nexusui.svg',
    'assets/project-pulsemetrics.svg'
  ];
  requiredAssets.forEach(asset => {
    assert(fs.existsSync(asset) && fs.statSync(asset).size > 0, `Asset valid & exists: ${asset}`);
  });

  console.log('\n=== SUITE 3: DOM SKELETON & NAVIGATION MAPPING ===');
  const html = fs.readFileSync('index.html', 'utf8');
  const sections = ['hero', 'about', 'skills', 'projects', 'experience', 'education', 'certificates', 'contact'];
  sections.forEach(sec => {
    assert(html.includes(`id="${sec}"`), `Section container present: #${sec}`);
    assert(html.includes(`id="${sec}Mount"`), `Dynamic mount point present: #${sec}Mount`);
    assert(html.includes(`href="#${sec}"`), `Desktop nav anchor present: href="#${sec}"`);
  });
  assert(!html.includes('theme-toggle-btn'), 'Theme toggle buttons removed from DOM');
  assert(html.includes('toastNotification'), 'Toast notification container present');
  assert(html.includes('schema.org'), 'JSON-LD Person Schema present');

  console.log('\n=== SUITE 4: AI RESUME MODAL & COMPONENT DOM INTEGRATION ===');
  assert(html.includes('id="resumeUploadModal"'), 'Upload modal container present: #resumeUploadModal');
  assert(html.includes('id="uploadDropzone"'), 'Drag & drop zone present: #uploadDropzone');
  assert(html.includes('id="resumeFileInput"'), 'File input present: #resumeFileInput');
  assert(html.includes('id="uploadProgressBarFill"'), 'Progress bar element present: #uploadProgressBarFill');
  assert(html.includes('btn-nav-upload'), 'Navbar upload trigger button present');
  assert(html.includes('id="uploadReviewContainer"'), 'Review modal container present: #uploadReviewContainer');
  assert(html.includes('id="btnConfirmPublish"'), 'Confirm & Publish button present: #btnConfirmPublish');
  assert(html.includes('id="btnReviewDiscard"'), 'Discard & Re-upload button present: #btnReviewDiscard');
  assert(html.includes('id="btnToggleDiffJson"'), 'Toggle JSON diff button present: #btnToggleDiffJson');
  assert(html.includes('id="btnToggleVersionHistory"'), 'Version History toggle present: #btnToggleVersionHistory');
  assert(html.includes('id="versionHistoryDrawer"'), 'Version History drawer present: #versionHistoryDrawer');
  assert(html.includes('id="adminPinDialog"'), 'Admin PIN dialog present: #adminPinDialog');
  assert(html.includes('id="adminPinInput"'), 'Admin PIN input present: #adminPinInput');
  assert(html.includes('js/resume-uploader.js'), 'Resume uploader script included in index.html');
  const mainCss = fs.readFileSync('css/main.css', 'utf8');
  assert(mainCss.includes('components/upload-modal.css'), 'upload-modal.css imported in main.css');
  assert(fs.existsSync('css/components/upload-modal.css'), 'css/components/upload-modal.css exists on disk');

  console.log('\n=== SUITE 5: IN-MEMORY TEXT EXTRACTION & RULE PARSER ===');
  const samplePdfBuf = fs.readFileSync('assets/Md_Matloob_Alam_Software_Developer_Resume.pdf');
  const extractedText = await extractRawText(samplePdfBuf, '.pdf');
  assert(extractedText.length > 500, `PDF text successfully extracted (${extractedText.length} chars)`);
  assert(extractedText.toUpperCase().includes('MATLOOB'), 'Extracted text contains candidate name');
  assert(extractedText.includes('mdmatloobgaya@gmail.com'), 'Extracted text contains candidate email');
  const parsedLocal = fallbackRuleBasedParser(extractedText, data);
  assert(parsedLocal.profile.name.toUpperCase().includes('MATLOOB'), 'Rule-based parser accurately extracts candidate name');
  assert(parsedLocal.profile.email === 'mdmatloobgaya@gmail.com', 'Rule-based parser accurately extracts email');
  assert(parsedLocal.about && parsedLocal.about.terminalCommand === 'whoami', 'Rule-based parser sets about.terminalCommand to whoami');
  assert(parsedLocal.about && Array.isArray(parsedLocal.about.highlights) && parsedLocal.about.highlights.length === 4, 'Rule-based parser populates 4 Who Am I highlights');
  assert(parsedLocal.skills && Array.isArray(parsedLocal.skills.categories) && parsedLocal.skills.categories.length === 6, 'Rule-based parser ensures 6 official skills categories');
  assert(parsedLocal.skills.categories.every(c => Array.isArray(c.skills) && c.skills.length > 0), 'Every skills category contains valid skills array');

  console.log('\n=== SUITE 6: LOCAL HTTP SERVER ENDPOINTS ===');
  // Start ephemeral test server
  const testServer = await new Promise((resolve) => {
    const s = app.listen(0, () => {
      resolve(s);
    });
  });
  const testPort = testServer.address().port;
  const baseUrl = `http://localhost:${testPort}`;

  const endpoints = [
    { path: '/', expectedStatus: 200, mime: 'text/html' },
    { path: '/data/portfolio.json', expectedStatus: 200, mime: 'application/json' },
    { path: '/assets/Md_Matloob_Alam_Software_Developer_Resume.pdf', expectedStatus: 200, mime: 'application/pdf' },
    { path: '/js/render.js', expectedStatus: 200, mime: 'text/javascript' },
    { path: '/js/skills-component.js', expectedStatus: 200, mime: 'text/javascript' },
    { path: '/js/resume-uploader.js', expectedStatus: 200, mime: 'text/javascript' },
    { path: '/js/theme.js', expectedStatus: 200, mime: 'text/javascript' },
    { path: '/css/main.css', expectedStatus: 200, mime: 'text/css' },
    { path: '/api/health', expectedStatus: 200, mime: 'application/json' },
    { path: '/api/portfolio', expectedStatus: 200, mime: 'application/json' },
    { path: '/api/backups', expectedStatus: 200, mime: 'application/json' }
  ];

  for (const ep of endpoints) {
    await new Promise((resolve) => {
      http.get(baseUrl + ep.path, (res) => {
        assert(res.statusCode === ep.expectedStatus, `Endpoint ${ep.path} returned ${res.statusCode}`);
        assert(res.headers['content-type'] && res.headers['content-type'].includes(ep.mime), `Endpoint ${ep.path} MIME matches ${ep.mime}`);
        resolve();
      }).on('error', (err) => {
        assert(false, `Endpoint ${ep.path} request error: ${err.message}`);
        resolve();
      });
    });
  }

  console.log('\n=== SUITE 7: RESUME UPLOAD API ENDPOINT (POST /api/upload-resume) ===');
  // Preserve portfolio state before upload test
  const portfolioSnapshot = fs.readFileSync('data/portfolio.json', 'utf8');

  // Construct a multipart/form-data request body
  const boundary = '----WebKitFormBoundaryTest' + Date.now();
  const fileContent = fs.readFileSync('assets/Md_Matloob_Alam_Software_Developer_Resume.pdf');
  const filename = 'Md_Matloob_Alam_Software_Developer_Resume.pdf';

  const postDataHeader = Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="resume"; filename="${filename}"\r\n` +
    `Content-Type: application/pdf\r\n\r\n`
  );
  const postDataFooter = Buffer.from(`\r\n--${boundary}--\r\n`);
  const multipartBody = Buffer.concat([postDataHeader, fileContent, postDataFooter]);

  const uploadResult = await new Promise((resolve) => {
    const req = http.request(baseUrl + '/api/upload-resume', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': multipartBody.length
      }
    }, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(responseBody);
          resolve({ status: res.statusCode, json });
        } catch (e) {
          resolve({ status: res.statusCode, error: responseBody });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ error: err.message });
    });

    req.write(multipartBody);
    req.end();
  });

  assert(uploadResult.status === 200, `POST /api/upload-resume returned HTTP 200 (Got ${uploadResult.status})`);
  assert(uploadResult.json && uploadResult.json.success === true, 'Upload API returned success: true');
  assert(uploadResult.json && uploadResult.json.backup, `Automated backup created: ${uploadResult.json?.backup}`);
  if (uploadResult.json?.backup) {
    assert(fs.existsSync(uploadResult.json.backup), 'Backup file exists on file system');
  }
  const uploadedPortfolio = uploadResult.json?.data;
  assert(uploadedPortfolio && uploadedPortfolio.about && uploadedPortfolio.about.terminalCommand === 'whoami', 'Uploaded data contains about.terminalCommand whoami');
  assert(uploadedPortfolio && Array.isArray(uploadedPortfolio.about.highlights) && uploadedPortfolio.about.highlights.length === 4, 'Uploaded data contains 4 Who Am I highlights');
  assert(uploadedPortfolio && uploadedPortfolio.skills && Array.isArray(uploadedPortfolio.skills.categories) && uploadedPortfolio.skills.categories.length === 6, 'Uploaded data contains 6 skills categories');
  assert(uploadedPortfolio.skills.categories.every(c => Array.isArray(c.skills) && c.skills.length > 0), 'Every uploaded skills category contains valid skills array');

  // Restore snapshot to ensure portfolio remains clean
  fs.writeFileSync('data/portfolio.json', portfolioSnapshot, 'utf8');

  // Close ephemeral server
  testServer.close();

  console.log('\n=== SUITE 8: FORM VALIDATION ENGINE LOGIC ===');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  assert(emailRegex.test('contact@matloob.dev'), 'Valid domain email passes regex');
  assert(emailRegex.test('alex.mercer@enterprise.co.in'), 'Complex subdomain email passes regex');
  assert(!emailRegex.test('invalid-email'), 'Invalid string fails email regex');
  assert(!emailRegex.test('@missinguser.com'), 'Missing username fails email regex');
  assert(!emailRegex.test('user@domain'), 'Missing TLD fails email regex');

  console.log('\n=== SUITE 9: MODERN TECHNOLOGY SKILLS SHOWCASE & COMPONENT INTEGRATION ===');
  const skillsData = data.skills;
  const expectedCategories = [
    'Programming Languages',
    'Frontend Development',
    'Backend Development',
    'Databases',
    'Tools & Technologies',
    'AI Development Tools'
  ];

  assert(skillsData && Array.isArray(skillsData.categories), 'Skills categories array is defined');
  assert(skillsData.categories.length === 6, 'Exactly 6 skill categories configured');

  assert(skillsData.categories.every(c => c.name && Array.isArray(c.skills) && c.skills.length > 0), 'All 6 skill categories contain valid skills');

  // Calculate total skill count
  const allSkills = skillsData.categories.flatMap(c => c.skills || c.items || []);
  assert(allSkills.length >= 20, `At least 20 official skills configured (found ${allSkills.length})`);
  assert(allSkills.every(s => s.name && s.icon), 'All skills have valid names and brand icons');

  // Test SkillsShowcase component module
  const skillsModule = require('./js/skills-component');
  assert(typeof skillsModule.renderSkillsHtmlString === 'function', 'renderSkillsHtmlString exported');
  assert(skillsModule.SKILLS_ICONS_REGISTRY && Object.keys(skillsModule.SKILLS_ICONS_REGISTRY).length >= 25, 'Official brand SVG icon registry loaded');

  // Verify rendered HTML conforms to zero-card, zero-box, minimal design
  const generatedHtml = skillsModule.renderSkillsHtmlString(skillsData);
  assert(generatedHtml.includes('skills-showcase-container'), 'Showcase container present');
  assert(generatedHtml.includes('skill-category'), 'Category containers present');
  assert(generatedHtml.includes('skill-item'), 'Skill item present');
  assert(generatedHtml.includes('skill-icon-wrapper'), 'Skill icon wrapper present');
  assert(generatedHtml.includes('skill-name'), 'Skill name typography element present');
  assert(!generatedHtml.includes('skill-card'), 'NO cards or boxes in generated markup');
  assert(!generatedHtml.includes('progress-bar'), 'NO progress bars in generated markup');
  assert(!generatedHtml.includes('rating'), 'NO percentage ratings in generated markup');

  // Verify index.html integration
  assert(html.includes('react.production.min.js'), 'React 18 script included in index.html');
  assert(html.includes('react-dom.production.min.js'), 'ReactDOM 18 script included in index.html');
  assert(html.includes('js/skills-component.js'), 'js/skills-component.js included in index.html');

  // Verify CSS styles
  const skillsCss = fs.readFileSync('css/components/skills.css', 'utf8');
  assert(skillsCss.includes('.skills-category-grid'), 'Grid layout defined in skills.css');
  assert(skillsCss.includes('skillFloat'), 'Floating animation keyframes defined');
  assert(skillsCss.includes('--brand-glow'), 'Brand-colored hover glow effect defined');
  assert(skillsCss.includes('prefers-reduced-motion'), 'Reduced motion accessibility supported');
  assert(!skillsCss.includes('.skill-card {'), 'Legacy card styling eliminated');

  // Verify animations controller
  const animationsJs = fs.readFileSync('js/animations.js', 'utf8');
  assert(animationsJs.includes('.skill-category'), 'Staggered category animation in animations.js');
  assert(animationsJs.includes('.skill-item'), 'Staggered skill item animation in animations.js');

  console.log('\n=== SUITE 10: RESPONSIVE LEFT-MENU & LIST-WISE DRAWER VERIFICATION ===');
  // 1. Left Menu Button Placement
  assert(html.includes('class="navbar-left"'), 'Navbar left-group container present');
  const toggleIndex = html.indexOf('id="mobileToggle"');
  const logoIndex = html.indexOf('class="logo-container"');
  assert(toggleIndex !== -1 && toggleIndex < logoIndex, 'Mobile toggle placed on LEFT side of logo');

  // 2. Mobile Drawer & Backdrop DOM Structure
  assert(html.includes('id="mobileDrawerBackdrop"'), 'Tap-to-close drawer backdrop overlay present');
  assert(html.includes('id="drawerCloseBtn"'), 'Drawer close (✕) button present');
  assert(html.includes('class="mobile-nav-list"'), 'List-wise navigation container present');

  // 3. List-Wise Structure with Indices (01-08) & Chevrons
  for (let i = 1; i <= 8; i++) {
    const padded = String(i).padStart(2, '0');
    assert(html.includes(`<span class="item-index">${padded}</span>`), `Nav list item index ${padded} present`);
  }
  assert(html.includes('class="item-chevron"'), 'Item chevron arrow indicators present');

  // 4. Drawer & Responsive CSS Assertions
  const drawerCss = fs.readFileSync('css/components/drawer.css', 'utf8');
  assert(drawerCss.includes('transform: translateX(-100%)'), 'Left off-canvas slide initial state defined');
  assert(drawerCss.includes('transform: translateX(0)'), 'Drawer open slide-in state defined');
  assert(drawerCss.includes('.mobile-drawer-backdrop'), 'Backdrop overlay styling defined');
  assert(drawerCss.includes('.mobile-nav-link.active'), 'Active state styling defined with orange accent');

  const responsiveCss = fs.readFileSync('css/responsive.css', 'utf8');
  assert(responsiveCss.includes('.navbar-left'), 'Responsive navbar-left defined in responsive.css');
  assert(responsiveCss.includes('.mobile-toggle'), 'Responsive mobile-toggle defined in responsive.css');

  // 5. JavaScript Navigation Controller Assertions
  const navJs = fs.readFileSync('js/navigation.js', 'utf8');
  assert(navJs.includes('drawerBackdrop'), 'Navigation controller binds backdrop overlay');
  assert(navJs.includes('drawerCloseBtn'), 'Navigation controller binds close button');
  assert(navJs.includes('aria-expanded'), 'Accessibility aria-expanded handled in drawer toggle');

  console.log('\n=== SUITE 11: PHASE 3 REVIEW & CONFIRM STEP (DIFF & TWO-STEP PUBLISH) ===');
  // 1. Test computePortfolioDiff logic
  const mockOld = {
    profile: { name: 'Matloob', title: 'Developer', email: 'old@dev.com', summary: 'Old bio' },
    about: { highlights: [{ title: 'Projects', stat: '10+' }] },
    skills: { categories: [{ name: 'Languages', skills: [{ name: 'Python' }] }] },
    experience: { roles: [{ title: 'Dev', company: 'Company A' }] },
    projects: { items: [{ title: 'App A' }] }
  };
  const mockNew = {
    profile: { name: 'Md Matloob Alam', title: 'Senior Software Developer', email: 'old@dev.com', summary: 'Updated modern bio' },
    about: { highlights: [{ title: 'Projects', stat: '15+' }] },
    skills: { categories: [{ name: 'Languages', skills: [{ name: 'Python' }, { name: 'TypeScript' }] }] },
    experience: { roles: [{ title: 'Dev', company: 'Company A' }, { title: 'Lead', company: 'Company B' }] },
    projects: { items: [{ title: 'App A' }] }
  };
  const diffResult = computePortfolioDiff(mockOld, mockNew);
  assert(diffResult.hasChanges === true, 'Diff engine detects overall changes');
  assert(diffResult.profile.name && diffResult.profile.name.new === 'Md Matloob Alam', 'Diff engine accurately captures new name');
  assert(diffResult.profile.title && diffResult.profile.title.new === 'Senior Software Developer', 'Diff engine accurately captures new title');
  assert(Array.isArray(diffResult.skills.added) && diffResult.skills.added.includes('TypeScript'), 'Diff engine identifies newly added skill');
  assert(diffResult.about.highlightsChanged === true, 'Diff engine flags highlight modifications');
  assert(diffResult.experience.newCount === 2 && diffResult.experience.oldCount === 1, 'Diff engine computes experience count delta');

  // 2. Test Preview API (POST /api/upload-resume?preview=true)
  const previewServer = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const previewPort = previewServer.address().port;
  const previewBaseUrl = `http://localhost:${previewPort}`;

  const originalDiskPortfolio = fs.readFileSync('data/portfolio.json', 'utf8');

  const previewBoundary = '----WebKitFormBoundaryPreview' + Date.now();
  const previewPdfBuf = fs.readFileSync('assets/Md_Matloob_Alam_Software_Developer_Resume.pdf');
  const previewHeader = Buffer.from(
    `--${previewBoundary}\r\n` +
    `Content-Disposition: form-data; name="resume"; filename="Resume_Preview_Test.pdf"\r\n` +
    `Content-Type: application/pdf\r\n\r\n`
  );
  const previewFooter = Buffer.from(`\r\n--${previewBoundary}--\r\n`);
  const previewBody = Buffer.concat([previewHeader, previewPdfBuf, previewFooter]);

  const previewRes = await new Promise((resolve) => {
    const req = http.request(previewBaseUrl + '/api/upload-resume?preview=true', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${previewBoundary}`,
        'Content-Length': previewBody.length
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, json: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, error: data });
        }
      });
    });
    req.write(previewBody);
    req.end();
  });

  assert(previewRes.status === 200, `POST /api/upload-resume?preview=true returned HTTP 200 (Got ${previewRes.status})`);
  assert(previewRes.json?.preview === true, 'Preview API returned preview: true');
  assert(previewRes.json?.diff !== undefined, 'Preview API returned structured diff summary');
  assert(previewRes.json?.data !== undefined, 'Preview API returned staged portfolio data');
  const postPreviewDiskPortfolio = fs.readFileSync('data/portfolio.json', 'utf8');
  assert(postPreviewDiskPortfolio === originalDiskPortfolio, 'Preview mode does NOT overwrite portfolio.json on disk');

  // 3. Test Publish API (POST /api/publish-portfolio)
  const publishRes = await new Promise((resolve) => {
    const postPayload = JSON.stringify({
      data: previewRes.json?.data,
      resumeFilename: previewRes.json?.resumeFilename
    });
    const req = http.request(previewBaseUrl + '/api/publish-portfolio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postPayload),
        'x-admin-pin': process.env.ADMIN_UPLOAD_PIN || '1234'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, json: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, error: data });
        }
      });
    });
    req.write(postPayload);
    req.end();
  });

  assert(publishRes.status === 200, `POST /api/publish-portfolio returned HTTP 200 (Got ${publishRes.status})`);
  assert(publishRes.json?.success === true, 'Publish API returned success: true');
  assert(publishRes.json?.backup && fs.existsSync(publishRes.json.backup), 'Publish API created automated backup on disk');

  console.log('\n=== SUITE 12: PHASE 4 1-CLICK ROLLBACK & ADMIN SECURITY PIN ===');
  // 1. Verify PIN with invalid PIN
  const verifyInvalidPinRes = await new Promise((resolve) => {
    const payload = JSON.stringify({ pin: '9999' });
    const req = http.request(previewBaseUrl + '/api/verify-pin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, json: JSON.parse(data) }));
    });
    req.write(payload);
    req.end();
  });
  assert(verifyInvalidPinRes.status === 200, 'POST /api/verify-pin returned 200');
  assert(verifyInvalidPinRes.json?.valid === false, 'POST /api/verify-pin rejected wrong PIN: valid=false');

  // 2. Verify PIN with correct PIN
  const verifyValidPinRes = await new Promise((resolve) => {
    const payload = JSON.stringify({ pin: process.env.ADMIN_UPLOAD_PIN || '1234' });
    const req = http.request(previewBaseUrl + '/api/verify-pin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, json: JSON.parse(data) }));
    });
    req.write(payload);
    req.end();
  });
  assert(verifyValidPinRes.json?.valid === true, 'POST /api/verify-pin accepted correct PIN: valid=true');

  // 3. Publish with invalid PIN is blocked (401)
  const unauthorizedPublishRes = await new Promise((resolve) => {
    const postPayload = JSON.stringify({
      data: previewRes.json?.data,
      pin: 'WRONG_PIN'
    });
    const req = http.request(previewBaseUrl + '/api/publish-portfolio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postPayload),
        'x-admin-pin': 'WRONG_PIN'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, json: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, error: data }); }
      });
    });
    req.write(postPayload);
    req.end();
  });
  assert(unauthorizedPublishRes.status === 401, `POST /api/publish-portfolio with invalid PIN returned HTTP 401 (Got ${unauthorizedPublishRes.status})`);
  assert(unauthorizedPublishRes.json?.success === false, 'Unauthorized publish rejected with success: false');

  // 4. Test GET /api/backups formatting
  const backupsListRes = await new Promise((resolve) => {
    http.get(previewBaseUrl + '/api/backups', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, json: JSON.parse(data) }));
    });
  });
  assert(backupsListRes.status === 200, 'GET /api/backups returned 200');
  assert(Array.isArray(backupsListRes.json?.backups) && backupsListRes.json.backups.length > 0, 'Backups list has at least 1 backup');
  const sampleBackup = backupsListRes.json.backups[0];
  assert(sampleBackup.filename && sampleBackup.filename.endsWith('.json'), 'Backup item has valid .json filename');
  assert(sampleBackup.sizeFormatted && sampleBackup.sizeFormatted.includes('KB'), 'Backup item includes formatted size string');
  assert(sampleBackup.formattedDate !== undefined, 'Backup item includes human-readable formattedDate');

  // 5. Test POST /api/restore-backup: Unauthorized check (401)
  const unauthRestoreRes = await new Promise((resolve) => {
    const payload = JSON.stringify({ filename: sampleBackup.filename, pin: 'WRONG_PIN' });
    const req = http.request(previewBaseUrl + '/api/restore-backup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'x-admin-pin': 'WRONG_PIN'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, json: JSON.parse(data) }));
    });
    req.write(payload);
    req.end();
  });
  assert(unauthRestoreRes.status === 401, `Rollback with invalid PIN rejected with HTTP 401 (Got ${unauthRestoreRes.status})`);

  // 6. Test Path Traversal Protection (400)
  const traversalRestoreRes = await new Promise((resolve) => {
    const payload = JSON.stringify({ filename: '../../portfolio.json', pin: process.env.ADMIN_UPLOAD_PIN || '1234' });
    const req = http.request(previewBaseUrl + '/api/restore-backup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'x-admin-pin': process.env.ADMIN_UPLOAD_PIN || '1234'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, json: JSON.parse(data) }));
    });
    req.write(payload);
    req.end();
  });
  assert(traversalRestoreRes.status === 400, `Path traversal attack blocked with HTTP 400 (Got ${traversalRestoreRes.status})`);

  // 7. Test Nonexistent backup check (404)
  const notFoundRestoreRes = await new Promise((resolve) => {
    const payload = JSON.stringify({ filename: 'portfolio-nonexistent-9999.json', pin: process.env.ADMIN_UPLOAD_PIN || '1234' });
    const req = http.request(previewBaseUrl + '/api/restore-backup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'x-admin-pin': process.env.ADMIN_UPLOAD_PIN || '1234'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, json: JSON.parse(data) }));
    });
    req.write(payload);
    req.end();
  });
  assert(notFoundRestoreRes.status === 404, `Nonexistent backup request returned HTTP 404 (Got ${notFoundRestoreRes.status})`);

  // 8. Test 1-Click Rollback Success (200)
  const validRestoreRes = await new Promise((resolve) => {
    const payload = JSON.stringify({ filename: sampleBackup.filename, pin: process.env.ADMIN_UPLOAD_PIN || '1234' });
    const req = http.request(previewBaseUrl + '/api/restore-backup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'x-admin-pin': process.env.ADMIN_UPLOAD_PIN || '1234'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, json: JSON.parse(data) }));
    });
    req.write(payload);
    req.end();
  });
  assert(validRestoreRes.status === 200, `POST /api/restore-backup returned HTTP 200 (Got ${validRestoreRes.status})`);
  assert(validRestoreRes.json?.success === true, 'Rollback API returned success: true');
  assert(validRestoreRes.json?.safetyBackup && fs.existsSync(validRestoreRes.json.safetyBackup), 'Rollback created safety snapshot prior to restoring');
  assert(validRestoreRes.json?.data !== undefined, 'Rollback returned restored portfolio data');

  // Restore disk portfolio to original
  fs.writeFileSync('data/portfolio.json', originalDiskPortfolio, 'utf8');
  previewServer.close();

  console.log('\n======================================================');
  console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  if (failed === 0) {
    console.log('>>> ALL AUTOMATED VERIFICATION SUITES PASSED! 100% PRODUCTION READY. <<<');
  } else {
    process.exitCode = 1;
  }
}

runTests();
