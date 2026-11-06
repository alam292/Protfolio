const http = require('http');
const fs = require('fs');
const path = require('path');
const { app } = require('./server');
const { extractRawText, fallbackRuleBasedParser } = require('./server/parse-resume');

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
  assert(data.profile.title.includes('Software Developer'), 'Profile title matches resume');
  assert(fs.existsSync(data.profile.resumeUrl), 'Resume PDF file exists at path');
  assert(fs.statSync(data.profile.resumeUrl).size > 1000, 'Resume PDF is non-empty (>1KB)');
  assert(data.stats.length === 4, '4 KPI statistics configured');
  assert(data.skills.categories.length === 6, '6 Technical skills categories defined');
  assert(data.projects.items.length >= 3, 'Flagship projects present');
  assert(data.projects.items.every(p => p.githubUrl && p.liveDemoUrl), 'All projects have GitHub & Demo links');
  assert(data.experience.roles.length >= 1, 'Experience roles documented');
  assert(data.education.degrees.length >= 2, '2 Education degrees verified');
  assert(data.certifications.items.length >= 3, 'Certifications & achievements present');
  assert(data.contact.email === 'mdmatloobgaya@gmail.com', 'Verified contact email configured');

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

  expectedCategories.forEach((catName) => {
    const found = skillsData.categories.some(c => c.name === catName);
    assert(found, `Category defined: "${catName}"`);
  });

  // Calculate total skill count
  const allSkills = skillsData.categories.flatMap(c => c.skills || c.items || []);
  assert(allSkills.length === 30, `Total 30 official skills configured (found ${allSkills.length})`);

  // Verify all 30 skills have names and icons
  const requiredSkillsList = [
    'Python', 'Java', 'JavaScript', 'HTML5', 'CSS3',
    'React.js', 'Next.js', 'Tailwind CSS', 'Bootstrap', 'Redux',
    'FastAPI', 'Django', 'Node.js', 'Express.js', 'REST API', 'SQLAlchemy',
    'MySQL', 'PostgreSQL', 'MongoDB', 'SQLite',
    'Git', 'GitHub', 'VS Code', 'Docker', 'Postman', 'Linux',
    'ChatGPT', 'Claude', 'Gemini', 'Antigravity IDE'
  ];

  requiredSkillsList.forEach(name => {
    const item = allSkills.find(s => s.name === name);
    assert(item !== undefined && item.icon, `Skill present with brand icon: ${name}`);
  });

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

  console.log('\n======================================================');
  console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  if (failed === 0) {
    console.log('>>> ALL AUTOMATED VERIFICATION SUITES PASSED! 100% PRODUCTION READY. <<<');
  } else {
    process.exitCode = 1;
  }
}

runTests();
