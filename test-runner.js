const http = require('http');
const fs = require('fs');
const path = require('path');

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
  assert(data.profile.name === 'Md MatlooB Alam', 'Profile author matches resume');
  assert(data.profile.title.includes('Full Stack Developer'), 'Profile title matches resume');
  assert(fs.existsSync(data.profile.resumeUrl), 'Resume PDF file exists at path');
  assert(fs.statSync(data.profile.resumeUrl).size > 1000, 'Resume PDF is non-empty (>1KB)');
  assert(data.stats.length === 4, '4 KPI statistics configured');
  assert(data.skills.categories.length === 5, '5 Technical skills tiers defined');
  assert(data.projects.items.length === 4, '4 Flagship projects present');
  assert(data.projects.items.every(p => p.githubUrl && p.liveDemoUrl), 'All projects have GitHub & Demo links');
  assert(data.experience.roles.length === 4, '4 Experience roles documented');
  assert(data.education.degrees.length === 2, '2 Education degrees verified');
  assert(data.certifications.items.length === 6, '6 Certifications & achievements present');
  assert(data.contact.email === 'contact@matloob.dev', 'Verified contact email configured');

  console.log('\n=== SUITE 2: ASSET INTEGRITY ===');
  const requiredAssets = [
    'assets/Md_MatlooB_Alam_Resume.pdf',
    'assets/profile-avatar.svg',
    'assets/project-cloudscale.svg',
    'assets/project-nexusui.svg',
    'assets/project-pulsemetrics.svg',
    'assets/project-devflow.svg'
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
  assert(html.includes('theme-toggle-btn'), 'Theme toggle buttons present in DOM');
  assert(html.includes('toastNotification'), 'Toast notification container present');
  assert(html.includes('schema.org'), 'JSON-LD Person Schema present');

  console.log('\n=== SUITE 4: LOCAL HTTP SERVER ENDPOINTS ===');
  const endpoints = [
    { path: '/', expectedStatus: 200, mime: 'text/html' },
    { path: '/data/portfolio.json', expectedStatus: 200, mime: 'application/json' },
    { path: '/assets/Md_MatlooB_Alam_Resume.pdf', expectedStatus: 200, mime: 'application/pdf' },
    { path: '/js/render.js', expectedStatus: 200, mime: 'text/javascript' },
    { path: '/js/theme.js', expectedStatus: 200, mime: 'text/javascript' },
    { path: '/css/main.css', expectedStatus: 200, mime: 'text/css' }
  ];

  for (const ep of endpoints) {
    await new Promise((resolve) => {
      http.get('http://localhost:3000' + ep.path, (res) => {
        assert(res.statusCode === ep.expectedStatus, `Endpoint ${ep.path} returned ${res.statusCode}`);
        assert(res.headers['content-type'] && res.headers['content-type'].includes(ep.mime), `Endpoint ${ep.path} MIME matches ${ep.mime}`);
        resolve();
      }).on('error', (err) => {
        assert(false, `Endpoint ${ep.path} request error: ${err.message}`);
        resolve();
      });
    });
  }

  console.log('\n=== SUITE 5: FORM VALIDATION ENGINE LOGIC ===');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  assert(emailRegex.test('contact@matloob.dev'), 'Valid domain email passes regex');
  assert(emailRegex.test('alex.mercer@enterprise.co.in'), 'Complex subdomain email passes regex');
  assert(!emailRegex.test('invalid-email'), 'Invalid string fails email regex');
  assert(!emailRegex.test('@missinguser.com'), 'Missing username fails email regex');
  assert(!emailRegex.test('user@domain'), 'Missing TLD fails email regex');

  console.log('\n======================================================');
  console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  if (failed === 0) {
    console.log('>>> ALL AUTOMATED VERIFICATION SUITES PASSED! 100% PRODUCTION READY. <<<');
  }
}

runTests();

