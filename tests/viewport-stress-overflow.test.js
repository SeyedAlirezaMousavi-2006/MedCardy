/**
 * MedCardy - Viewport Boundary Stress & Horizontal Overflow Test Suite
 *
 * Authored by: challenger_m3_2 (teamwork_challenger)
 * Executed against: Headless Chrome CDP (Blink Layout Engine)
 *
 * Scope:
 * 1. Viewport boundary matrix (375px, 390px, 412px, 430px, 768px, 1024px, 1440px)
 * 2. Zero horizontal overflow invariant (scrollWidth <= innerWidth across all screens & layouts)
 * 3. Breadcrumb navigation, stacking at 375px, and active leaf ellipsis truncation
 * 4. Extreme Persian text strings injection (natural long titles vs zero-space strings)
 * 5. Touch target dimensions (WCAG 2.5.5 44x44px minimums at 375px/430px)
 * 6. Desktop multi-column grid containment at 1024px+
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testResults = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

async function runTestSuite() {
  console.log('========================================================================');
  console.log('  📱 MEDCARDY VIEWPORT BOUNDARY & HORIZONTAL OVERFLOW STRESS SUITE');
  console.log('  Engine: Headless Chrome / Blink (Real DOM & Computed Layout)');
  console.log('========================================================================\n');

  // 1. Static HTTP Server with robust 404 guards
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(PROJECT_ROOT, reqPath);
    if (!fs.existsSync(filePath)) {
      res.statusCode = 404;
      return res.end('Not found');
    }
    const ext = path.extname(filePath);
    const mimeMap = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon'
    };
    res.setHeader('Content-Type', mimeMap[ext] || 'text/plain');
    res.end(fs.readFileSync(filePath));
  });

  const serverPort = await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve(server.address().port);
    });
  });

  const tempUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-stress-m3-'));
  const cdpPort = 9556;

  // 2. Launch Headless Chrome
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${cdpPort}`,
    '--disable-gpu',
    '--no-first-run',
    '--disable-extensions',
    `--user-data-dir=${tempUserDataDir}`,
    'about:blank'
  ]);

  await new Promise((r) => setTimeout(r, 1200));

  let ws = null;
  let id = 1;
  const pendingRequests = new Map();
  let loadEventFired = null;

  function sendCDP(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      pendingRequests.set(msgId, (response) => {
        if (response.error) {
          reject(new Error(`CDP Error (${method}): ${JSON.stringify(response.error)}`));
        } else {
          resolve(response.result);
        }
      });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async function evalInBrowser(code) {
    const res = await sendCDP('Runtime.evaluate', {
      expression: `(() => { ${code} })()`,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      const desc = res.exceptionDetails.exception?.description || res.exceptionDetails.text;
      throw new Error(`Browser Eval Exception: ${desc}`);
    }
    return res.result.value;
  }

  async function setViewport(width, height, isMobile = true) {
    await sendCDP('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: isMobile
    });
    await new Promise((r) => setTimeout(r, 80));
  }

  async function runProbe(title, fn) {
    totalTests++;
    process.stdout.write(`  ⚡ [Test ${totalTests}] ${title} ... `);
    try {
      await fn();
      passedTests++;
      testResults.push({ id: totalTests, title, status: 'PASSED' });
      console.log('\x1b[32mPASSED\x1b[0m');
    } catch (err) {
      failedTests++;
      testResults.push({ id: totalTests, title, status: 'FAILED', error: err.message });
      console.log('\x1b[31mFAILED\x1b[0m');
      console.error(`     💥 Error: ${err.message}`);
    }
  }

  try {
    const listRes = await fetch(`http://127.0.0.1:${cdpPort}/json/list`);
    const targets = await listRes.json();
    const pageTarget = targets.find((t) => t.type === 'page');
    assert(pageTarget, 'Headless Chrome page target must exist');

    ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Page.loadEventFired' && loadEventFired) {
        loadEventFired();
      }
      if (msg.id && pendingRequests.has(msg.id)) {
        pendingRequests.get(msg.id)(msg);
        pendingRequests.delete(msg.id);
      }
    };

    await new Promise((r) => (ws.onopen = r));
    await sendCDP('Page.enable');
    await sendCDP('Runtime.enable');

    const loadPromise = new Promise((r) => (loadEventFired = r));
    await sendCDP('Page.navigate', { url: `http://127.0.0.1:${serverPort}/index.html` });
    await loadPromise;
    await new Promise((r) => setTimeout(r, 800));

    // Shared layout overflow verification snippet
    const checkOverflowCode = `
      const innerW = window.innerWidth;
      const scrollW = document.documentElement.scrollWidth;
      const bodyScrollW = document.body.scrollWidth;
      return {
        innerW,
        scrollW,
        bodyScrollW,
        overflow: scrollW > innerW || bodyScrollW > innerW
      };
    `;

    // =========================================================================
    // GROUP 1: VIEWPORT BOUNDARY MATRIX & ZERO HORIZONTAL OVERFLOW
    // =========================================================================
    console.log('▶ GROUP 1: Viewport Boundary Matrix & Zero Horizontal Overflow');

    const viewports = [
      { name: 'iPhone SE (375px)', width: 375, height: 667, mobile: true },
      { name: 'iPhone 12/13/14 (390px)', width: 390, height: 844, mobile: true },
      { name: 'Galaxy S20 / Pixel 7 (412px)', width: 412, height: 915, mobile: true },
      { name: 'iPhone 15 Pro Max (430px)', width: 430, height: 932, mobile: true },
      { name: 'Tablet Portrait (768px)', width: 768, height: 1024, mobile: true },
      { name: 'Desktop Baseline (1024px)', width: 1024, height: 768, mobile: false },
      { name: 'Desktop Wide (1440px)', width: 1440, height: 900, mobile: false }
    ];

    for (const vp of viewports) {
      await runProbe(`Platform Hub Screen at ${vp.name}: zero horizontal overflow`, async () => {
        await setViewport(vp.width, vp.height, vp.mobile);
        await evalInBrowser(`app.showScreen('platform-hub');`);
        const res = await evalInBrowser(checkOverflowCode);
        assert(!res.overflow, `Overflow on Platform Hub (${vp.name}): scrollW=${res.scrollW}, innerW=${res.innerW}`);
      });
    }

    const layouts = [
      { id: 'quizlet', name: 'Quizlet Modern' },
      { id: 'duolingo', name: 'Duolingo Pulse' },
      { id: 'anki', name: 'Anki FSRS' },
      { id: 'shift', name: 'Clinical Shift' }
    ];

    for (const vp of viewports) {
      for (const layout of layouts) {
        await runProbe(`Cards Dashboard [${layout.name}] at ${vp.name}: zero horizontal overflow`, async () => {
          await setViewport(vp.width, vp.height, vp.mobile);
          await evalInBrowser(`
            app.showScreen('dashboard');
            app.setLayout('${layout.id}');
          `);
          const res = await evalInBrowser(checkOverflowCode);
          assert(!res.overflow, `Overflow in ${layout.name} (${vp.name}): scrollW=${res.scrollW}, innerW=${res.innerW}`);
        });
      }
    }

    for (const vp of [viewports[0], viewports[3], viewports[5]]) {
      await runProbe(`Course Decks Catalog View at ${vp.name}: zero horizontal overflow`, async () => {
        await setViewport(vp.width, vp.height, vp.mobile);
        await evalInBrowser(`app.showScreen('courses');`);
        const res = await evalInBrowser(checkOverflowCode);
        assert(!res.overflow, `Overflow on courses view (${vp.name}): scrollW=${res.scrollW}, innerW=${res.innerW}`);
      });

      await runProbe(`Active Flashcard Study Room at ${vp.name}: zero horizontal overflow`, async () => {
        await setViewport(vp.width, vp.height, vp.mobile);
        await evalInBrowser(`app.startDeckStudy('cardiology', 'cardio-ecg');`);
        const res = await evalInBrowser(checkOverflowCode);
        assert(!res.overflow, `Overflow in study room (${vp.name}): scrollW=${res.scrollW}, innerW=${res.innerW}`);
      });

      await runProbe(`Smart Recovery Slider Screen at ${vp.name}: zero horizontal overflow`, async () => {
        await setViewport(vp.width, vp.height, vp.mobile);
        await evalInBrowser(`app.showScreen('recovery');`);
        const res = await evalInBrowser(checkOverflowCode);
        assert(!res.overflow, `Overflow on recovery screen (${vp.name}): scrollW=${res.scrollW}, innerW=${res.innerW}`);
      });

      await runProbe(`Session Results Screen at ${vp.name}: zero horizontal overflow`, async () => {
        await setViewport(vp.width, vp.height, vp.mobile);
        await evalInBrowser(`app.showScreen('results');`);
        const res = await evalInBrowser(checkOverflowCode);
        assert(!res.overflow, `Overflow on results screen (${vp.name}): scrollW=${res.scrollW}, innerW=${res.innerW}`);
      });
    }

    // =========================================================================
    // GROUP 2: BREADCRUMBS RESPONSIVE BEHAVIOR & TRUNCATION INVARIANTS
    // =========================================================================
    console.log('\n▶ GROUP 2: Breadcrumbs Responsive Behavior & Truncation Invariants');

    await runProbe('Breadcrumbs hidden on Platform Hub and visible in Cards module', async () => {
      await setViewport(375, 667, true);
      await evalInBrowser(`app.showScreen('platform-hub');`);
      const hubDisplay = await evalInBrowser(`
        const el = document.getElementById('moduleBreadcrumbs');
        return { display: window.getComputedStyle(el).display, hasHidden: el.classList.contains('hidden') };
      `);
      assert(hubDisplay.display === 'none' || hubDisplay.hasHidden, 'Breadcrumb bar must be hidden on Platform Hub');

      await evalInBrowser(`app.showScreen('dashboard');`);
      const mainDisplay = await evalInBrowser(`
        const el = document.getElementById('moduleBreadcrumbs');
        return { display: window.getComputedStyle(el).display, hasHidden: el.classList.contains('hidden') };
      `);
      assert(mainDisplay.display !== 'none' && !mainDisplay.hasHidden, 'Breadcrumb bar must be visible on Cards module');
    });

    await runProbe('Breadcrumbs at 375px: stacks vertically (flex-direction: column) with full-width back button', async () => {
      await setViewport(375, 667, true);
      await evalInBrowser(`app.showScreen('dashboard');`);
      const styles = await evalInBrowser(`
        const bar = document.getElementById('moduleBreadcrumbs');
        const btn = bar.querySelector('.back-to-platform-btn');
        const barCS = window.getComputedStyle(bar);
        const btnRect = btn.getBoundingClientRect();
        return {
          flexDirection: barCS.flexDirection,
          btnHeight: btnRect.height
        };
      `);
      assert(styles.flexDirection === 'column', `Expected column flex-direction at 375px, got ${styles.flexDirection}`);
      assert(styles.btnHeight >= 43.5, `Back button height must be >= 44px, got ${styles.btnHeight}`);
    });

    await runProbe('Active breadcrumb leaf has text-overflow: ellipsis and max-width truncation at <= 430px', async () => {
      await setViewport(430, 932, true);
      await evalInBrowser(`app.startDeckStudy('cardiology', 'cardio-ecg');`);
      const leafStyle = await evalInBrowser(`
        const leaf = document.getElementById('activeBreadcrumbLeaf');
        const cs = window.getComputedStyle(leaf);
        return {
          overflow: cs.overflow,
          textOverflow: cs.textOverflow,
          whiteSpace: cs.whiteSpace,
          maxWidth: cs.maxWidth
        };
      `);
      assert(leafStyle.overflow === 'hidden', `Expected overflow: hidden, got ${leafStyle.overflow}`);
      assert(leafStyle.textOverflow === 'ellipsis', `Expected text-overflow: ellipsis, got ${leafStyle.textOverflow}`);
      assert(leafStyle.whiteSpace === 'nowrap', `Expected white-space: nowrap, got ${leafStyle.whiteSpace}`);
      assert(parseInt(leafStyle.maxWidth, 10) <= 120, `Expected maxWidth <= 120px at 430px, got ${leafStyle.maxWidth}`);
    });

    // =========================================================================
    // GROUP 3: EXTREME PERSIAN TEXT INJECTION STRESS
    // =========================================================================
    console.log('\n▶ GROUP 3: Extreme Persian Text Injection Stress');

    await runProbe('Stress 3.1: Ultra-long Persian breadcrumb leaf (160 chars) does NOT cause horizontal overflow at 375px', async () => {
      await setViewport(375, 667, true);
      await evalInBrowser(`
        app.showScreen('dashboard');
        const leaf = document.getElementById('activeBreadcrumbLeaf');
        leaf.textContent = 'تشخیص و درمان اورژانسی سندرم کرونری حاد همراه با صعود قطعه ST و آریتمی‌های کشنده بطنی در بخش فوریت‌های پزشکی';
      `);
      const res = await evalInBrowser(checkOverflowCode);
      assert(!res.overflow, `Horizontal overflow triggered by extreme breadcrumb leaf at 375px (scrollW=${res.scrollW}, innerW=${res.innerW})`);
    });

    await runProbe('Stress 3.2: Ultra-long Persian course title (180 chars) wraps cleanly without horizontal overflow at 375px', async () => {
      await setViewport(375, 667, true);
      await evalInBrowser(`
        purchasedCourses[0].title = 'دوره جامع و فوق تخصصی بیماری‌های مادرزادی قلب و عروق و ناهنجاری‌های دریچه‌ای پیشرفته در طب اورژانس و مراقبت‌های ویژه کودکان و بزرگسالان ایران';
        app.renderPlatformCourses();
        app.renderCourses();
        app.renderDashboard();
        app.showScreen('platform-hub');
      `);
      const resHub = await evalInBrowser(checkOverflowCode);
      assert(!resHub.overflow, `Platform Hub overflowed with extreme course title: scrollW=${resHub.scrollW}, innerW=${resHub.innerW}`);

      await evalInBrowser(`app.showScreen('dashboard');`);
      const resCards = await evalInBrowser(checkOverflowCode);
      assert(!resCards.overflow, `Cards module overflowed with extreme course title: scrollW=${resCards.scrollW}, innerW=${resCards.innerW}`);
    });

    await runProbe('Stress 3.3: Ultra-long Persian deck titles (140 chars) wrap cleanly in Quizlet tray pills at 375px', async () => {
      await setViewport(375, 667, true);
      await evalInBrowser(`
        purchasedCourses[0].decks[0].title = 'آریتمی‌های کمپلکس دهلیزی-بطنی همراه با بلوک هدایتی دوطرفه و سندروم ولف پارکینسون وایت تیپ بی مقاوم به درمان';
        app.setLayout('quizlet');
        app.showScreen('dashboard');
      `);
      const res = await evalInBrowser(checkOverflowCode);
      assert(!res.overflow, `Deck tray overflowed with extreme deck title: scrollW=${res.scrollW}, innerW=${res.innerW}`);
    });

    await runProbe('Stress 3.4: Extreme Persian text in Clinical Shift ward cards preserves mobile layout at 375px', async () => {
      await setViewport(375, 667, true);
      await evalInBrowser(`
        purchasedCourses[0].title = 'بخش مراقبت‌های فوق‌تخصصی عروق کرونر و آنژیوپلاستی اورژانس بیمارستان رسول اکرم';
        app.setLayout('shift');
        app.showScreen('dashboard');
      `);
      const res = await evalInBrowser(checkOverflowCode);
      assert(!res.overflow, `Clinical shift overflowed with long ward title: scrollW=${res.scrollW}, innerW=${res.innerW}`);
    });

    await runProbe('Stress 3.5: Extreme Persian text in Duolingo quests & Anki stream preserves mobile layout at 375px', async () => {
      await setViewport(375, 667, true);
      await evalInBrowser(`
        app.setLayout('duolingo');
      `);
      const resDuo = await evalInBrowser(checkOverflowCode);
      assert(!resDuo.overflow, `Duolingo layout overflowed with long titles: scrollW=${resDuo.scrollW}, innerW=${resDuo.innerW}`);

      await evalInBrowser(`
        app.setLayout('anki');
      `);
      const resAnki = await evalInBrowser(checkOverflowCode);
      assert(!resAnki.overflow, `Anki layout overflowed with long titles: scrollW=${resAnki.scrollW}, innerW=${resAnki.innerW}`);
    });

    // =========================================================================
    // GROUP 4: INTERACTIVE MODALS & 3D TRANSITIONS AT 375PX
    // =========================================================================
    console.log('\n▶ GROUP 4: Interactive Modals & 3D Transitions at 375px');

    await runProbe('Platform Modules Modal opens cleanly without horizontal overflow at 375px', async () => {
      await setViewport(375, 667, true);
      await evalInBrowser(`app.toggleModuleModal(true);`);
      const res = await evalInBrowser(checkOverflowCode);
      assert(!res.overflow, `Platform modal caused overflow: scrollW=${res.scrollW}, innerW=${res.innerW}`);
      await evalInBrowser(`app.toggleModuleModal(false);`);
    });

    await runProbe('Design Customizer Sheet opens cleanly without horizontal overflow at 375px', async () => {
      await setViewport(375, 667, true);
      await evalInBrowser(`app.toggleVariantSheet(true);`);
      const res = await evalInBrowser(checkOverflowCode);
      assert(!res.overflow, `Design sheet caused overflow: scrollW=${res.scrollW}, innerW=${res.innerW}`);
      await evalInBrowser(`app.toggleVariantSheet(false);`);
    });

    await runProbe('Study Session 3D Card Flip retains bounding constraints and produces zero horizontal scroll at 375px', async () => {
      await setViewport(375, 667, true);
      await evalInBrowser(`app.startDeckStudy('cardiology', 'cardio-ecg');`);
      await evalInBrowser(`app.toggleCardFlip();`);
      await new Promise((r) => setTimeout(r, 150));
      const resFlipped = await evalInBrowser(checkOverflowCode);
      assert(!resFlipped.overflow, `Card 3D flip caused horizontal overflow: scrollW=${resFlipped.scrollW}, innerW=${resFlipped.innerW}`);

      await evalInBrowser(`app.toggleCardFlip();`);
      await new Promise((r) => setTimeout(r, 150));
      const resFlippedBack = await evalInBrowser(checkOverflowCode);
      assert(!resFlippedBack.overflow, `Card flip back caused horizontal overflow: scrollW=${resFlippedBack.scrollW}, innerW=${resFlippedBack.innerW}`);
    });

    await runProbe('Rapid 20x Layout Switching at 375px preserves zero cumulative layout overflow', async () => {
      await setViewport(375, 667, true);
      await evalInBrowser(`
        // Reset course titles to normal
        purchasedCourses[0].title = 'بیماری‌های قلب و عروق';
        purchasedCourses[0].decks[0].title = 'الکتروکاردیوگرام (ECG) و آریتمی‌ها';
        app.showScreen('dashboard');
        const layoutNames = ['quizlet', 'duolingo', 'anki', 'shift'];
        for (let i = 0; i < 20; i++) {
          app.setLayout(layoutNames[i % 4]);
        }
      `);
      const res = await evalInBrowser(checkOverflowCode);
      assert(!res.overflow, `Rapid layout switching caused horizontal overflow: scrollW=${res.scrollW}, innerW=${res.innerW}`);
    });

    // =========================================================================
    // GROUP 5: TOUCH TARGET DIMENSIONS & WCAG 2.5.5 COMPLIANCE
    // =========================================================================
    console.log('\n▶ GROUP 5: Touch Target Dimensions & WCAG 2.5.5 Compliance');

    await runProbe('Header icon action buttons are at least 44x44px at 375px and 430px', async () => {
      for (const w of [375, 430]) {
        await setViewport(w, 700, true);
        const dimensions = await evalInBrowser(`
          const btns = document.querySelectorAll('.icon-action-btn');
          return Array.from(btns).map(b => {
            const rect = b.getBoundingClientRect();
            return { width: rect.width, height: rect.height };
          });
        `);
        for (const d of dimensions) {
          assert(d.width >= 43.5, `Icon button width < 44px (got ${d.width} at ${w}px)`);
          assert(d.height >= 43.5, `Icon button height < 44px (got ${d.height} at ${w}px)`);
        }
      }
    });

    await runProbe('Layout switcher pills (.v-pill) maintain min-height >= 44px at 375px and 430px', async () => {
      for (const w of [375, 430]) {
        await setViewport(w, 700, true);
        const heights = await evalInBrowser(`
          const pills = document.querySelectorAll('.v-pill');
          return Array.from(pills).map(p => p.getBoundingClientRect().height);
        `);
        for (const h of heights) {
          assert(h >= 43.5, `Layout pill height < 44px (got ${h} at ${w}px)`);
        }
      }
    });

    await runProbe('FSRS Rating buttons in study room maintain min-height >= 44px at 375px', async () => {
      await setViewport(375, 667, true);
      await evalInBrowser(`app.startDeckStudy('cardiology', 'cardio-ecg');`);
      const btnHeights = await evalInBrowser(`
        const btns = document.querySelectorAll('.thumb-fsrs-btn');
        return Array.from(btns).map(b => b.getBoundingClientRect().height);
      `);
      assert(btnHeights.length === 4, 'Must have 4 rating buttons');
      for (const h of btnHeights) {
        assert(h >= 43.5, `FSRS rating button height < 44px (got ${h})`);
      }
    });

    await runProbe('Bottom navigation items maintain min-height >= 44px across mobile viewports', async () => {
      await setViewport(375, 667, true);
      const navHeights = await evalInBrowser(`
        const items = document.querySelectorAll('.b-nav-item');
        return Array.from(items).map(i => i.getBoundingClientRect().height);
      `);
      for (const h of navHeights) {
        assert(h >= 43.5, `Bottom nav item height < 44px (got ${h})`);
      }
    });

    // =========================================================================
    // GROUP 6: DESKTOP MULTI-COLUMN STRUCTURE & CONTAINER CONTAINMENT
    // =========================================================================
    console.log('\n▶ GROUP 6: Desktop Multi-Column Structure & Container Containment');

    await runProbe('Desktop container max-width containment at 1024px & 1440px (<= 1180px)', async () => {
      for (const w of [1024, 1440]) {
        await setViewport(w, 900, false);
        const wrapperW = await evalInBrowser(`
          return document.querySelector('.app-wrapper').getBoundingClientRect().width;
        `);
        assert(wrapperW <= 1182, `app-wrapper width exceeded 1180px max-width on ${w}px viewport (got ${wrapperW})`);
      }
    });

    await runProbe('Study, Recovery, and Results screens are constrained to <= 720px on desktop', async () => {
      await setViewport(1440, 900, false);

      await evalInBrowser(`app.startDeckStudy('cardiology', 'cardio-ecg');`);
      const studyW = await evalInBrowser(`
        return document.querySelector('.study-mobile-view').getBoundingClientRect().width;
      `);
      assert(studyW <= 722, `study-mobile-view width > 720px on desktop (got ${studyW})`);

      await evalInBrowser(`app.showScreen('recovery');`);
      const recoveryW = await evalInBrowser(`
        return document.querySelector('.recovery-mobile-view').getBoundingClientRect().width;
      `);
      assert(recoveryW <= 722, `recovery-mobile-view width > 720px on desktop (got ${recoveryW})`);

      await evalInBrowser(`app.showScreen('results');`);
      const resultsW = await evalInBrowser(`
        return document.querySelector('.results-mobile-card').getBoundingClientRect().width;
      `);
      assert(resultsW <= 722, `results-mobile-card width > 720px on desktop (got ${resultsW})`);
    });

    await runProbe('Platform Hub courses render as 2-column grid at 1024px+ desktop', async () => {
      await setViewport(1024, 768, false);
      await evalInBrowser(`app.showScreen('platform-hub');`);
      const gridColumns = await evalInBrowser(`
        const grid = document.querySelector('.platform-courses-grid');
        return window.getComputedStyle(grid).gridTemplateColumns;
      `);
      const cols = gridColumns.trim().split(/\s+/);
      assert(cols.length === 2, `Expected 2 grid columns on desktop, got ${cols.length} ("${gridColumns}")`);
    });

    await runProbe('Clinical Shift wards render as 2-column grid at 1024px+ desktop', async () => {
      await setViewport(1024, 768, false);
      await evalInBrowser(`
        app.showScreen('dashboard');
        app.setLayout('shift');
      `);
      const gridColumns = await evalInBrowser(`
        const grid = document.querySelector('.shift-wards-grid');
        return window.getComputedStyle(grid).gridTemplateColumns;
      `);
      const cols = gridColumns.trim().split(/\s+/);
      assert(cols.length === 2, `Expected 2 grid columns for shift wards on desktop, got ${cols.length} ("${gridColumns}")`);
    });

  } finally {
    if (ws) {
      try {
        ws.close();
      } catch (_) {}
    }
    chromeProcess.kill();
    server.close();
    try {
      fs.rmSync(tempUserDataDir, { recursive: true, force: true });
    } catch (_) {}
  }

  // Final Summary Report
  console.log('\n========================================================================');
  console.log('  📊 VIEWPORT STRESS & OVERFLOW TEST SUITE SUMMARY');
  console.log('========================================================================');
  console.log(`  Total Probes Executed : ${totalTests}`);
  console.log(`  Passed                : ${passedTests}`);
  console.log(`  Failed                : ${failedTests}`);
  console.log('========================================================================\n');

  if (failedTests > 0) {
    console.error(`💥 SUITE FAILED with ${failedTests} failure(s).`);
    process.exit(1);
  } else {
    console.log('🎉 ALL VIEWPORT STRESS & HORIZONTAL OVERFLOW PROBES PASSED EMPIRICALLY!');
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
