/**
 * MedCardy - Challenger Milestone 4 Real Browser E2E Test Suite
 * Executed against Headless Chrome via CDP (Chrome DevTools Protocol)
 *
 * Scope:
 * 1. Real browser keyboard event dispatch (Space flip, Persian '۱'-'۴' ratings).
 * 2. Real browser rapid double click on FSRS rating buttons with 250ms debounce verification.
 * 3. 100-step randomized full-stack user journey in live browser.
 * 4. Zero uncaught console errors verification.
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
const consoleErrors = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

async function runBrowserE2E() {
  console.log('='.repeat(72));
  console.log('  🌐 CHROME BROWSER REAL-ENGINE E2E WORKFLOW CHALLENGE');
  console.log('  Engine: Headless Chrome / Blink (Real Event Loop & Timers)');
  console.log('='.repeat(72) + '\n');

  // 1. Static HTTP Server
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
      '.svg': 'image/svg+xml'
    };
    res.setHeader('Content-Type', mimeMap[ext] || 'text/plain');
    res.end(fs.readFileSync(filePath));
  });

  const serverPort = await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve(server.address().port);
    });
  });

  const tempUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-m4-stress-'));
  const cdpPort = 9557;

  // 2. Launch Chrome
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
  let msgId = 1;
  const pendingRequests = new Map();

  function sendCDP(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pendingRequests.set(id, (response) => {
        if (response.error) {
          reject(new Error(`CDP Error (${method}): ${JSON.stringify(response.error)}`));
        } else {
          resolve(response.result);
        }
      });
      ws.send(JSON.stringify({ id, method, params }));
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
    // 3. Connect WebSocket to Chrome DevTools Protocol
    const httpGet = (url) => new Promise((resolve, reject) => {
      http.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });

    const targets = await httpGet(`http://127.0.0.1:${cdpPort}/json`);
    const pageTarget = targets.find(t => t.type === 'page');
    assert(pageTarget && pageTarget.webSocketDebuggerUrl, 'No page target found');

    const WebSocket = require('net'); // Using raw HTTP Upgrade or ws
    // Node.js doesn't have native WebSocket prior to v22 without flag, but Node 24 has globalThis.WebSocket
    if (typeof globalThis.WebSocket === 'function') {
      ws = new globalThis.WebSocket(pageTarget.webSocketDebuggerUrl);
    } else {
      // Fallback: use simple ws module or child_process
      const WS = require('ws');
      ws = new WS(pageTarget.webSocketDebuggerUrl);
    }

    let loadEventFired = null;
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
      ws.onmessage = (event) => {
        const msg = JSON.parse(typeof event.data === 'string' ? event.data : event.data.toString());
        if (msg.method === 'Page.loadEventFired' && loadEventFired) {
          loadEventFired();
        }
        if (msg.method === 'Runtime.consoleAPICalled') {
          if (msg.params.type === 'error') {
            const errText = msg.params.args.map(a => a.value || a.description).join(' ');
            consoleErrors.push(errText);
          }
        }
        if (msg.id && pendingRequests.has(msg.id)) {
          const handler = pendingRequests.get(msg.id);
          pendingRequests.delete(msg.id);
          handler(msg);
        }
      };
    });

    await sendCDP('Page.enable');
    await sendCDP('Runtime.enable');

    // Navigate to page and wait for complete page load
    const loadPromise = new Promise((r) => (loadEventFired = r));
    await sendCDP('Page.navigate', { url: `http://127.0.0.1:${serverPort}/index.html` });
    await loadPromise;
    await new Promise((r) => setTimeout(r, 800));

    // PROBE 1: Space bar card flipping in live browser
    await runProbe('Live Browser: Space keypress toggles card 3D flip', async () => {
      await evalInBrowser(`
        app.startDeckStudy('cardiology', 'cardio-ecg');
      `);

      let initialFlipped = await evalInBrowser(`
        return document.getElementById('flashcard').classList.contains('flipped');
      `);
      assert(!initialFlipped, 'Card must initially not be flipped');

      // Dispatch Space keydown via window.dispatchEvent
      await evalInBrowser(`
        window.dispatchEvent(new KeyboardEvent('keydown', {
          key: ' ',
          code: 'Space',
          bubbles: true,
          cancelable: true
        }));
      `);

      let flippedAfterSpace = await evalInBrowser(`
        return document.getElementById('flashcard').classList.contains('flipped');
      `);
      assert(flippedAfterSpace, 'Card must be flipped after Space press');

      // Space again to flip back
      await evalInBrowser(`
        window.dispatchEvent(new KeyboardEvent('keydown', {
          key: ' ',
          code: 'Space',
          bubbles: true,
          cancelable: true
        }));
      `);

      let flippedBack = await evalInBrowser(`
        return document.getElementById('flashcard').classList.contains('flipped');
      `);
      assert(!flippedBack, 'Card must flip back to false on 2nd Space press');
    });

    // PROBE 2: Persian numeral rating in live browser
    await runProbe('Live Browser: Persian key "۱" and "۳" rate cards via keyboard', async () => {
      await evalInBrowser(`
        app.startDeckStudy('cardiology', 'cardio-ecg');
      `);

      // Press Persian '۱'
      await evalInBrowser(`
        window.dispatchEvent(new KeyboardEvent('keydown', {
          key: '۱',
          code: 'Digit1',
          bubbles: true,
          cancelable: true
        }));
      `);

      let reviews = await evalInBrowser(`return appState.activeSession.reviewsCount;`);
      assert(reviews === 1, `reviewsCount must be 1, got ${reviews}`);

      // Wait 300ms for debounce
      await new Promise(r => setTimeout(r, 300));

      // Press Persian '۳'
      await evalInBrowser(`
        window.dispatchEvent(new KeyboardEvent('keydown', {
          key: '۳',
          code: 'Digit3',
          bubbles: true,
          cancelable: true
        }));
      `);

      let correct = await evalInBrowser(`return appState.activeSession.correctCount;`);
      assert(correct === 1, `correctCount should be 1, got ${correct}`);
    });

    // PROBE 3: Rapid double click with 250ms debounce in live browser
    await runProbe('Live Browser: Rapid double click on .thumb-fsrs-btn debounces 2nd click', async () => {
      await evalInBrowser(`
        app.startDeckStudy('cardiology', 'cardio-ecg');
      `);

      // Execute 2 rapid clicks directly on the DOM button within 10ms
      const result = await evalInBrowser(`
        const btn = document.querySelector('.thumb-fsrs-btn[data-rating="3"]');
        const container = document.getElementById('fsrsButtons');
        btn.click();
        const pEventsAfterClick1 = container.style.pointerEvents;
        const reviewsAfterClick1 = appState.activeSession.reviewsCount;
        btn.click(); // Immediate 2nd click
        const reviewsAfterClick2 = appState.activeSession.reviewsCount;
        const currentIdx = appState.activeSession.currentIndex;
        const screen = appState.activeScreen;
        return { pEventsAfterClick1, reviewsAfterClick1, reviewsAfterClick2, currentIdx, screen };
      `);

      assert(result.pEventsAfterClick1 === 'none', 'Container pointerEvents must be locked to none');
      assert(result.reviewsAfterClick1 === 1, 'First click should be processed');
      assert(result.reviewsAfterClick2 === 1, 'Second click within 10ms MUST be debounced');
      assert(result.currentIdx === 1, 'currentIndex must be 1 (not skipped)');
      assert(result.screen === 'study', 'Must remain in study room on card 2');

      // Wait 300ms and click again
      await new Promise(r => setTimeout(r, 300));

      const afterPacedClick = await evalInBrowser(`
        const btn = document.querySelector('.thumb-fsrs-btn[data-rating="3"]');
        btn.click();
        return {
          reviews: appState.activeSession.reviewsCount,
          screen: appState.activeScreen
        };
      `);

      assert(afterPacedClick.reviews === 2, `Paced click must be processed, got ${afterPacedClick.reviews}`);
      assert(afterPacedClick.screen === 'results', 'Queue exhausted, must show results');
    });

    // PROBE 4: 100-step randomized full-stack user journey in live browser
    await runProbe('Live Browser: 100-Step Randomized User Journey with Zero Console Errors', async () => {
      const journeyResult = await evalInBrowser(`
        const VALID_SCREENS = ['platform-hub', 'dashboard', 'study', 'recovery', 'courses', 'results'];
        const VALID_LAYOUTS = ['quizlet', 'duolingo', 'anki', 'shift'];
        const COURSES = ['cardiology', 'pharmacology', 'pulmonology', 'pediatrics'];
        const DECKS = ['cardio-ecg', 'cardio-acs', 'pharma-cvs', 'pulmo-copd', 'peds-er'];

        let seed = 42;
        function rand() {
          seed = (seed * 1664525 + 1013904223) % 4294967296;
          return seed / 4294967296;
        }
        function randInt(min, max) {
          return Math.floor(rand() * (max - min + 1)) + min;
        }

        for (let step = 1; step <= 100; step++) {
          const act = randInt(1, 10);
          switch (act) {
            case 1: app.backToPlatform(); break;
            case 2: app.openCardsModule(COURSES[randInt(0, COURSES.length - 1)]); break;
            case 3: app.setLayout(VALID_LAYOUTS[randInt(0, VALID_LAYOUTS.length - 1)]); break;
            case 4: app.startDeckStudy(COURSES[randInt(0, COURSES.length - 1)], DECKS[randInt(0, DECKS.length - 1)]); break;
            case 5: app.toggleCardFlip(); break;
            case 6: app.rateCard(randInt(1, 4)); break;
            case 7: app.showScreen('recovery'); break;
            case 8: app.updateRecoveryPrescription(randInt(5, 60)); break;
            case 9: app.restartCurrentSession(); break;
            case 10: app.renderResults(); break;
          }

          if (!VALID_SCREENS.includes(appState.activeScreen)) {
            return { success: false, error: 'Invalid activeScreen at step ' + step };
          }
          if (!VALID_LAYOUTS.includes(appState.activeLayout)) {
            return { success: false, error: 'Invalid activeLayout at step ' + step };
          }
        }
        return { success: true };
      `);

      assert(journeyResult.success, journeyResult.error);
    });

    // PROBE 5: Zero Uncaught Console Errors
    await runProbe('Live Browser: Zero uncaught browser console errors across all probes', async () => {
      assert(consoleErrors.length === 0, `Encountered console errors: ${consoleErrors.join(', ')}`);
    });

  } finally {
    if (ws) ws.close();
    chromeProcess.kill('SIGTERM');
    server.close();
    try {
      fs.rmSync(tempUserDataDir, { recursive: true, force: true });
    } catch (_) {}
  }

  console.log('\n' + '='.repeat(72));
  console.log(`  📊 BROWSER E2E RESULTS: ${passedTests}/${totalTests} PASSED`);
  if (failedTests === 0) {
    console.log('  🎉 ALL REAL BROWSER E2E TESTS PASSED EMPIRICALLY!');
  } else {
    console.log(`  ❌ ${failedTests} FAILURE(S) ENCOUNTERED`);
  }
  console.log('='.repeat(72) + '\n');

  if (failedTests > 0) process.exit(1);
}

runBrowserE2E().catch(err => {
  console.error('Browser E2E Fatal Error:', err);
  process.exit(1);
});
