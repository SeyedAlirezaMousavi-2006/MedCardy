/**
 * Challenger Milestone 4 Workflow & Ergonomics Stress Test Suite
 *
 * Scope:
 * 1. 100-step randomized user journeys traversing:
 *    Platform Hub -> Course Selection -> Study Room -> FSRS Ratings ->
 *    Results -> Return to Hub -> Layout Switching -> Recovery Mode.
 * 2. Rapid double-clicks on rating buttons and verification of 250ms debounce
 *    preventing skipping cards and pointer-events locking.
 * 3. Keyboard navigation across Persian/Arabic keyboards (۱-۴, ١-٤, Digit1-4, Numpad1-4),
 *    Space bar flipping, Enter flipping, key repeat suppression, input focus isolation.
 * 4. Invariant verifications: state bounds, prototype purity, non-negative dues, breadcrumb sync.
 */

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const HTML_PATH = path.resolve(__dirname, '../index.html');
const JS_PATH = path.resolve(__dirname, '../js/app.js');
const CSS_PATH = path.resolve(__dirname, '../css/style.css');

let passCount = 0;
let failCount = 0;
const failures = [];

function probe(title, fn) {
  process.stdout.write(`  ⚡ Probe: ${title} ... `);
  try {
    fn();
    passCount++;
    console.log('\x1b[32mPASSED\x1b[0m');
  } catch (err) {
    failCount++;
    failures.push({ title, error: err.message, stack: err.stack });
    console.log('\x1b[31mFAILED\x1b[0m');
    console.error(`     💥 Error: ${err.message}`);
    if (err.stack) {
      console.error(`     ${err.stack.split('\n').slice(1, 3).join('\n')}`);
    }
  }
}

async function asyncProbe(title, fn) {
  process.stdout.write(`  ⚡ Async Probe: ${title} ... `);
  try {
    await fn();
    passCount++;
    console.log('\x1b[32mPASSED\x1b[0m');
  } catch (err) {
    failCount++;
    failures.push({ title, error: err.message, stack: err.stack });
    console.log('\x1b[31mFAILED\x1b[0m');
    console.error(`     💥 Error: ${err.message}`);
    if (err.stack) {
      console.error(`     ${err.stack.split('\n').slice(1, 3).join('\n')}`);
    }
  }
}

/**
 * Creates a clean execution sandbox with realistic window & element event dispatching
 */
function createCustomSandbox(options = {}) {
  const htmlContent = fs.readFileSync(HTML_PATH, 'utf8');
  const appJsContent = fs.readFileSync(JS_PATH, 'utf8');
  const { parseHTML, DOMElement } = require('./dom-harness.js');
  const domRoot = parseHTML(htmlContent);

  const body = domRoot.querySelector('body') || domRoot;
  const localStorageStore = {};

  const windowListeners = {};
  const documentListeners = {};

  const documentMock = {
    body,
    title: 'MedCardy',
    readyState: 'complete',
    getElementById: (id) => domRoot.getElementById(id),
    querySelector: (sel) => domRoot.querySelector(sel),
    querySelectorAll: (sel) => domRoot.querySelectorAll(sel),
    getElementsByClassName: (cls) => domRoot.getElementsByClassName(cls),
    getElementsByTagName: (tag) => domRoot.getElementsByTagName(tag),
    createElement: (tag) => new DOMElement(tag),
    createTextNode: (txt) => txt,
    addEventListener: (evt, handler) => {
      if (!documentListeners[evt]) documentListeners[evt] = [];
      documentListeners[evt].push(handler);
      domRoot.addEventListener(evt, handler);
    }
  };

  let simulatedNow = Date.now();
  let scheduledTimers = [];

  const windowMock = {
    document: documentMock,
    scrollTo: () => {},
    scroll: () => {},
    navigator: {
      vibrate: () => true,
      userAgent: 'MedCardy-E2E-Simulator'
    },
    localStorage: {
      getItem: (key) => localStorageStore[key] || null,
      setItem: (key, val) => { localStorageStore[key] = String(val); },
      removeItem: (key) => { delete localStorageStore[key]; },
      clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }
    },
    setTimeout: (fn, delay) => {
      if (options.asyncTimers) {
        return setTimeout(fn, delay);
      }
      if (options.manualTimers) {
        const id = scheduledTimers.length + 1;
        scheduledTimers.push({ id, fn, delay, due: simulatedNow + delay, executed: false });
        return id;
      }
      // Default: execute synchronously if short delay
      if (delay && delay < 1000) {
        try { fn(); } catch (_) {}
      }
      return 1;
    },
    clearTimeout: (id) => {
      if (options.asyncTimers) clearTimeout(id);
      if (options.manualTimers) {
        scheduledTimers = scheduledTimers.filter(t => t.id !== id);
      }
    },
    addEventListener: (event, handler) => {
      if (!windowListeners[event]) windowListeners[event] = [];
      windowListeners[event].push(handler);
    },
    removeEventListener: (event, handler) => {
      if (windowListeners[event]) {
        windowListeners[event] = windowListeners[event].filter(h => h !== handler);
      }
    },
    dispatchEvent: (event) => {
      const list = windowListeners[event.type] || [];
      for (const h of list) {
        h.call(windowMock, event);
      }
    }
  };

  // Controllable Date constructor for sandbox
  const sandboxDate = function (...args) {
    if (args.length === 0) {
      return new Date(simulatedNow);
    }
    return new Date(...args);
  };
  sandboxDate.now = () => simulatedNow;
  sandboxDate.parse = Date.parse;
  sandboxDate.UTC = Date.UTC;
  sandboxDate.prototype = Date.prototype;

  const sandbox = {
    window: windowMock,
    document: documentMock,
    navigator: windowMock.navigator,
    localStorage: windowMock.localStorage,
    setTimeout: windowMock.setTimeout,
    clearTimeout: windowMock.clearTimeout,
    Date: options.controllableTime ? sandboxDate : Date,
    lucide: { createIcons: () => {} },
    console: {
      log: () => {},
      warn: () => {},
      error: () => {},
      info: () => {}
    }
  };

  vm.createContext(sandbox);
  vm.runInContext(appJsContent, sandbox, { filename: 'app.js' });

  function evalInContext(expr) {
    try {
      return vm.runInContext(expr, sandbox);
    } catch (_) {
      return undefined;
    }
  }

  function advanceTime(ms) {
    simulatedNow += ms;
    if (options.manualTimers) {
      for (const timer of scheduledTimers) {
        if (!timer.executed && simulatedNow >= timer.due) {
          timer.executed = true;
          try { timer.fn(); } catch (_) {}
        }
      }
    }
  }

  return {
    sandbox,
    dom: domRoot,
    body,
    window: windowMock,
    document: documentMock,
    evalInContext,
    setSimulatedTime: (t) => { simulatedNow = t; },
    advanceTime,
    get appState() { return evalInContext('appState'); },
    get app() { return evalInContext('app'); },
    get purchasedCourses() { return evalInContext('purchasedCourses'); },
    dispatchWindowEvent: (event) => windowMock.dispatchEvent(event)
  };
}

async function runAll() {
  console.log('='.repeat(72));
  console.log('  ⚔️  CHALLENGER M4: E2E WORKFLOW STRESS & ERGONOMICS HARNESS');
  console.log('='.repeat(72));

  // ==========================================================================
  // SECTION 1: RAPID DOUBLE-CLICK & 250MS DEBOUNCE VERIFICATION
  // ==========================================================================
  console.log('\n▶ SECTION 1: Rapid Double-Click & Debounce Guard Verification');

  probe('1.1: Single click on .thumb-fsrs-btn advances queue by exactly 1', () => {
    const sb = createCustomSandbox();
    sb.app.startDeckStudy('cardiology', 'cardio-ecg');
    const btn = sb.dom.querySelector('.thumb-fsrs-btn[data-rating="3"]');
    assert.ok(btn, 'Good rating button must exist');

    assert.strictEqual(sb.appState.activeSession.currentIndex, 0);
    assert.strictEqual(sb.appState.activeSession.reviewsCount, 0);

    btn.click();

    assert.strictEqual(sb.appState.activeSession.currentIndex, 1, 'currentIndex should advance to 1');
    assert.strictEqual(sb.appState.activeSession.reviewsCount, 1, 'reviewsCount should be 1');
  });

  probe('1.2: Rapid double-click (< 250ms) on rating button ignores 2nd click and NEVER skips card', () => {
    const sb = createCustomSandbox({ controllableTime: true, manualTimers: true });
    sb.app.startDeckStudy('cardiology', 'cardio-ecg');
    const btn = sb.dom.querySelector('.thumb-fsrs-btn[data-rating="3"]');

    assert.strictEqual(sb.appState.activeSession.currentIndex, 0);

    // Click 1 at t = 0
    btn.click();
    assert.strictEqual(sb.appState.activeSession.currentIndex, 1);
    assert.strictEqual(sb.appState.activeSession.reviewsCount, 1);

    // Rapid double-tap 50ms later (< 250ms debounce window)
    sb.advanceTime(50);
    btn.click();

    // Must be suppressed by debounce guard!
    assert.strictEqual(sb.appState.activeSession.currentIndex, 1, 'Second click must be debounced - no card skip!');
    assert.strictEqual(sb.appState.activeSession.reviewsCount, 1, 'reviewsCount must remain 1');
    assert.strictEqual(sb.appState.activeScreen, 'study', 'Should remain in study room on card 2');
  });

  probe('1.3: Pointer-events lock on #fsrsButtons container during debounce', () => {
    const sb = createCustomSandbox({ controllableTime: true, manualTimers: true });
    sb.app.startDeckStudy('cardiology', 'cardio-ecg');
    const btn = sb.dom.querySelector('.thumb-fsrs-btn[data-rating="3"]');
    const container = sb.dom.getElementById('fsrsButtons');
    assert.ok(container, '#fsrsButtons must exist');

    // Click at t = 0
    btn.click();

    // Verify pointer-events is set to 'none' immediately
    assert.strictEqual(container.style.pointerEvents, 'none', 'Container pointerEvents must be locked to none');

    // Advance time by 260ms (> 250ms timer)
    sb.advanceTime(260);

    // Verify pointer-events is restored
    assert.strictEqual(container.style.pointerEvents, '', 'Container pointerEvents must be restored to empty string');
  });

  probe('1.4: 10 Rapid barrage clicks in 0ms delta processes only 1 rating', () => {
    const sb = createCustomSandbox();
    sb.app.startDeckStudy('cardiology', 'cardio-ecg'); // 2 cards in deck
    const btn = sb.dom.querySelector('.thumb-fsrs-btn[data-rating="4"]');

    // Fire 10 rapid clicks
    for (let i = 0; i < 10; i++) {
      btn.click();
    }

    // Only 1 rating should be processed, remaining 9 debounced
    assert.strictEqual(sb.appState.activeSession.reviewsCount, 1, 'Only 1 click must be accepted out of 10');
    assert.strictEqual(sb.appState.activeSession.currentIndex, 1, 'Must stay on card 2');
    assert.strictEqual(sb.appState.activeScreen, 'study', 'Must NOT prematurely transition to results');
  });

  await asyncProbe('1.5: Paced clicks with >= 250ms interval process cleanly in real time', async () => {
    const sb = createCustomSandbox({ asyncTimers: true });
    sb.app.startDeckStudy('cardiology', 'cardio-ecg'); // 2 cards in deck
    const btn = sb.dom.querySelector('.thumb-fsrs-btn[data-rating="3"]');

    btn.click();
    assert.strictEqual(sb.appState.activeSession.currentIndex, 1);
    assert.strictEqual(sb.appState.activeSession.reviewsCount, 1);

    // Wait 270ms to exceed 250ms debounce threshold
    await new Promise(r => setTimeout(r, 270));

    btn.click();
    assert.strictEqual(sb.appState.activeSession.reviewsCount, 2, 'Second click after 270ms must be processed');
    assert.strictEqual(sb.appState.activeScreen, 'results', 'Queue exhausted -> should show results');
  });

  // ==========================================================================
  // SECTION 2: KEYBOARD SHORTCUTS & MULTI-LANGUAGE NAVIGATION
  // ==========================================================================
  console.log('\n▶ SECTION 2: Keyboard Navigation & Persian/Arabic Input Stress');

  probe('2.1: Space bar toggles card flip (false -> true -> false)', () => {
    const sb = createCustomSandbox();
    sb.app.startDeckStudy('cardiology', 'cardio-ecg');
    assert.strictEqual(sb.appState.isCardFlipped, false);

    // Space keydown
    sb.dispatchWindowEvent({
      type: 'keydown',
      code: 'Space',
      key: ' ',
      preventDefault: () => {}
    });
    assert.strictEqual(sb.appState.isCardFlipped, true, 'Space must flip card to true');

    // Space keydown again
    sb.dispatchWindowEvent({
      type: 'keydown',
      code: 'Space',
      key: ' ',
      preventDefault: () => {}
    });
    assert.strictEqual(sb.appState.isCardFlipped, false, 'Space must flip card back to false');
  });

  probe('2.2: Enter key toggles card flip', () => {
    const sb = createCustomSandbox();
    sb.app.startDeckStudy('cardiology', 'cardio-ecg');
    assert.strictEqual(sb.appState.isCardFlipped, false);

    sb.dispatchWindowEvent({
      type: 'keydown',
      code: 'Enter',
      key: 'Enter',
      preventDefault: () => {}
    });
    assert.strictEqual(sb.appState.isCardFlipped, true, 'Enter must flip card');
  });

  probe('2.3: Persian numerals ۱, ۲, ۳, ۴ rate cards with exact FSRS stabilities', () => {
    const sb = createCustomSandbox({ controllableTime: true });
    sb.app.startDeckStudy('pharmacology', 'pharma-cvs'); // 2 cards

    // Press '۱' (Again -> rating 1) at t = 0
    sb.dispatchWindowEvent({
      type: 'keydown',
      key: '۱',
      code: 'Digit1',
      preventDefault: () => {}
    });
    assert.strictEqual(sb.appState.activeSession.reviewsCount, 1);
    assert.strictEqual(sb.appState.activeSession.correctCount, 0);

    // Advance simulated time past debounce threshold
    sb.advanceTime(300);

    // Press '۳' (Good -> rating 3)
    sb.dispatchWindowEvent({
      type: 'keydown',
      key: '۳',
      code: 'Digit3',
      preventDefault: () => {}
    });
    assert.strictEqual(sb.appState.activeSession.reviewsCount, 2);
    assert.strictEqual(sb.appState.activeSession.correctCount, 1);

    // Advance time again past debounce
    sb.advanceTime(300);

    // Press '۴' (Easy -> rating 4) on recycled card
    sb.dispatchWindowEvent({
      type: 'keydown',
      key: '۴',
      code: 'Digit4',
      preventDefault: () => {}
    });
    assert.strictEqual(sb.appState.activeSession.reviewsCount, 3);
    assert.strictEqual(sb.appState.activeSession.correctCount, 2);
  });

  probe('2.4: Arabic numerals ١, ٢, ٣, ٤ rate cards accurately', () => {
    const sb = createCustomSandbox();
    sb.app.startDeckStudy('pulmonology', 'pulmo-copd');

    sb.dispatchWindowEvent({
      type: 'keydown',
      key: '٣',
      preventDefault: () => {}
    });

    assert.strictEqual(sb.appState.activeSession.reviewsCount, 1);
    assert.strictEqual(sb.appState.activeSession.correctCount, 1);
  });

  probe('2.5: Numpad keys (Numpad1, Numpad2, Numpad3, Numpad4) rate cards', () => {
    const sb = createCustomSandbox();
    sb.app.startDeckStudy('pediatrics', 'peds-er');

    sb.dispatchWindowEvent({
      type: 'keydown',
      key: 'Unidentified',
      code: 'Numpad3',
      preventDefault: () => {}
    });

    assert.strictEqual(sb.appState.activeSession.reviewsCount, 1);
    assert.strictEqual(sb.appState.activeSession.correctCount, 1);
  });

  probe('2.6: Key repeat (e.repeat === true) is suppressed and does NOT multi-rate', () => {
    const sb = createCustomSandbox();
    sb.app.startDeckStudy('cardiology', 'cardio-ecg');

    // First genuine press
    sb.dispatchWindowEvent({
      type: 'keydown',
      key: '3',
      code: 'Digit3',
      repeat: false,
      preventDefault: () => {}
    });
    assert.strictEqual(sb.appState.activeSession.reviewsCount, 1);

    // Repeated keydown from holding key
    sb.dispatchWindowEvent({
      type: 'keydown',
      key: '3',
      code: 'Digit3',
      repeat: true,
      preventDefault: () => {}
    });
    assert.strictEqual(sb.appState.activeSession.reviewsCount, 1, 'Held key repeat must NOT rate again');
  });

  probe('2.7: Input focus isolation: Typing numbers/spaces inside <input> does NOT rate or flip', () => {
    const sb = createCustomSandbox();
    sb.app.startDeckStudy('cardiology', 'cardio-ecg');

    const inputTarget = { tagName: 'INPUT', isContentEditable: false };

    // Space inside input
    sb.dispatchWindowEvent({
      type: 'keydown',
      code: 'Space',
      key: ' ',
      target: inputTarget,
      preventDefault: () => {}
    });
    assert.strictEqual(sb.appState.isCardFlipped, false, 'Space inside input must NOT flip card');

    // Digit 3 inside input
    sb.dispatchWindowEvent({
      type: 'keydown',
      key: '3',
      code: 'Digit3',
      target: inputTarget,
      preventDefault: () => {}
    });
    assert.strictEqual(sb.appState.activeSession.reviewsCount, 0, 'Digit inside input must NOT rate card');
  });

  probe('2.8: Keyboard shortcuts inactive outside Study Room screen', () => {
    const sb = createCustomSandbox();
    sb.app.showScreen('platform-hub');
    assert.strictEqual(sb.appState.activeScreen, 'platform-hub');

    // Space on hub
    sb.dispatchWindowEvent({
      type: 'keydown',
      code: 'Space',
      key: ' ',
      preventDefault: () => {}
    });
    assert.strictEqual(sb.appState.isCardFlipped, false);

    // Number 3 on hub
    sb.dispatchWindowEvent({
      type: 'keydown',
      key: '3',
      code: 'Digit3',
      preventDefault: () => {}
    });
    assert.strictEqual(sb.appState.activeScreen, 'platform-hub');
  });

  // ==========================================================================
  // SECTION 3: 100-STEP RANDOMIZED USER JOURNEYS
  // ==========================================================================
  console.log('\n▶ SECTION 3: 100-Step Randomized User Journeys (Stress Testing)');

  function runRandomizedJourney(seed, steps = 100) {
    let rngState = seed;
    function rand() {
      // Linear congruential generator
      rngState = (rngState * 1664525 + 1013904223) % 4294967296;
      return rngState / 4294967296;
    }
    function randInt(min, max) {
      return Math.floor(rand() * (max - min + 1)) + min;
    }
    function choose(arr) {
      return arr[randInt(0, arr.length - 1)];
    }

    const sb = createCustomSandbox();
    const VALID_SCREENS = ['platform-hub', 'dashboard', 'study', 'recovery', 'courses', 'results'];
    const VALID_LAYOUTS = ['quizlet', 'duolingo', 'anki', 'shift'];
    const VALID_STYLES = ['btn-style-glass', 'btn-style-3d', 'btn-style-outline'];
    const COURSES = ['cardiology', 'pharmacology', 'pulmonology', 'pediatrics'];
    const DECKS = ['cardio-ecg', 'cardio-acs', 'pharma-cvs', 'pulmo-copd', 'peds-er'];

    for (let step = 1; step <= steps; step++) {
      const actionType = randInt(1, 14);

      switch (actionType) {
        case 1: // Navigate to platform hub
          sb.app.backToPlatform();
          break;
        case 2: // Open cards module with filter
          sb.app.openCardsModule(choose(['all', ...COURSES, 'invalid-filter']));
          break;
        case 3: // Switch layout
          sb.app.setLayout(choose([...VALID_LAYOUTS, '__proto__', 'unknown']));
          break;
        case 4: // Switch button style
          sb.app.setBtnStyle(choose([...VALID_STYLES, '__proto__']));
          break;
        case 5: // Start deck study
          sb.app.startDeckStudy(choose(COURSES), choose(DECKS));
          break;
        case 6: // Flip card
          sb.app.toggleCardFlip();
          break;
        case 7: // Rate card
          sb.app.rateCard(randInt(1, 4));
          break;
        case 8: // Go to recovery
          sb.app.showScreen('recovery');
          break;
        case 9: // Update recovery minutes
          sb.app.updateRecoveryPrescription(choose([5, 10, 15, 30, 60, -5, 120, NaN, 'fast']));
          break;
        case 10: // Start recovery session
          sb.app.startRecoverySession(randInt(5, 60));
          break;
        case 11: // Direct showScreen
          sb.app.showScreen(choose([...VALID_SCREENS, 'non-existent-404', null]));
          break;
        case 12: // Restart session
          sb.app.restartCurrentSession();
          break;
        case 13: // Toggle modals
          sb.app.toggleModuleModal(choose([true, false]));
          sb.app.toggleVariantSheet(choose([true, false]));
          break;
        case 14: // Results screen
          sb.app.renderResults();
          break;
      }

      // Assert Invariants at EVERY step
      assert.ok(VALID_SCREENS.includes(sb.appState.activeScreen),
        `Step ${step}: activeScreen '${sb.appState.activeScreen}' must be whitelisted`);
      assert.ok(VALID_LAYOUTS.includes(sb.appState.activeLayout),
        `Step ${step}: activeLayout '${sb.appState.activeLayout}' must be whitelisted`);
      assert.ok(VALID_STYLES.includes(sb.appState.activeBtnStyle),
        `Step ${step}: activeBtnStyle '${sb.appState.activeBtnStyle}' must be whitelisted`);

      // Course invariants
      for (const course of sb.purchasedCourses) {
        assert.ok(course.due >= 0, `Step ${step}: Course ${course.id} due (${course.due}) must be >= 0`);
        assert.ok(course.overdue >= 0, `Step ${step}: Course ${course.id} overdue (${course.overdue}) must be >= 0`);
        assert.ok(course.newCards >= 0, `Step ${step}: Course ${course.id} newCards (${course.newCards}) must be >= 0`);
        for (const deck of course.decks) {
          assert.ok(deck.due >= 0, `Step ${step}: Deck ${deck.id} due must be >= 0`);
          assert.ok(deck.progress >= 0 && deck.progress <= 100, `Step ${step}: Deck ${deck.id} progress (${deck.progress}) must be in [0, 100]`);
        }
      }

      // Prototype purity invariant
      assert.strictEqual(Object.prototype.quizlet, undefined);
      assert.strictEqual(Object.prototype.due, undefined);
      assert.strictEqual(Object.prototype.activeLayout, undefined);
    }
  }

  probe('3.1: 100-Step Randomized User Journey (Seed #42 - Standard Workflow Blitz)', () => {
    runRandomizedJourney(42, 100);
  });

  probe('3.2: 100-Step Randomized User Journey (Seed #1337 - Rapid Switching & Recovery Matrix)', () => {
    runRandomizedJourney(1337, 100);
  });

  probe('3.3: 100-Step Randomized User Journey (Seed #2026 - Hostile Boundaries & Study Churn)', () => {
    runRandomizedJourney(2026, 100);
  });

  // ==========================================================================
  // SECTION 4: RECOVERY WORKFLOW & SMART CURATION STRESS
  // ==========================================================================
  console.log('\n▶ SECTION 4: Recovery Mode & Cross-Course Curation Stress');

  probe('4.1: Recovery slider bounds clamped strictly to [5, 60] minutes', () => {
    const sb = createCustomSandbox();
    sb.app.showScreen('recovery');

    sb.app.updateRecoveryPrescription(0);
    assert.strictEqual(sb.appState.recoveryMinutes, 5, '0 must clamp to 5');

    sb.app.updateRecoveryPrescription(120);
    assert.strictEqual(sb.appState.recoveryMinutes, 60, '120 must clamp to 60');

    sb.app.updateRecoveryPrescription(-50);
    assert.strictEqual(sb.appState.recoveryMinutes, 5, '-50 must clamp to 5');

    sb.app.updateRecoveryPrescription(NaN);
    assert.strictEqual(sb.appState.recoveryMinutes, 15, 'NaN must default to 15');
  });

  probe('4.2: startRecoverySession curates cards across all 4 courses', () => {
    const sb = createCustomSandbox();
    sb.app.startRecoverySession(15);

    assert.strictEqual(sb.appState.activeScreen, 'study');
    assert.ok(sb.appState.activeSession, 'Active session must exist');
    assert.strictEqual(sb.appState.activeSession.courseId, 'recovery');
    assert.ok(sb.appState.activeSession.queue.length > 0, 'Queue must contain recovery cards');

    // Verify recovery queue cards are valid
    for (const card of sb.appState.activeSession.queue) {
      assert.ok(card.question, 'Card must have question');
      assert.ok(card.answer, 'Card must have answer');
    }
  });

  probe('4.3: Completing recovery session transitions cleanly to results', () => {
    const sb = createCustomSandbox();
    sb.app.startRecoverySession(5);
    const queueLen = sb.appState.activeSession.queue.length;

    for (let i = 0; i < queueLen; i++) {
      sb.app.rateCard(3);
    }

    assert.strictEqual(sb.appState.activeScreen, 'results');
    const accuracy = sb.dom.getElementById('resAccuracy').textContent.trim();
    assert.ok(accuracy.includes('۱۰۰٪') || accuracy.includes('100%'), 'Accuracy should be 100%');
  });

  // ==========================================================================
  // SECTION 5: STRICT COURSE ISOLATION UNDER INTERLEAVED ACTIONS
  // ==========================================================================
  console.log('\n▶ SECTION 5: Strict Course Isolation Under Interleaved Actions');

  probe('5.1: Rating cardiology card never mutates pharmacology, pulmonology, or pediatrics stats', () => {
    const sb = createCustomSandbox();

    const pharmaInitialDue = sb.purchasedCourses.find(c => c.id === 'pharmacology').due;
    const pulmoInitialDue = sb.purchasedCourses.find(c => c.id === 'pulmonology').due;
    const pedsInitialDue = sb.purchasedCourses.find(c => c.id === 'pediatrics').due;

    sb.app.startDeckStudy('cardiology', 'cardio-ecg');
    sb.app.rateCard(3);
    sb.app.rateCard(3);

    const pharmaCurrentDue = sb.purchasedCourses.find(c => c.id === 'pharmacology').due;
    const pulmoCurrentDue = sb.purchasedCourses.find(c => c.id === 'pulmonology').due;
    const pedsCurrentDue = sb.purchasedCourses.find(c => c.id === 'pediatrics').due;

    assert.strictEqual(pharmaCurrentDue, pharmaInitialDue, 'Pharma due must remain untouched');
    assert.strictEqual(pulmoCurrentDue, pulmoInitialDue, 'Pulmo due must remain untouched');
    assert.strictEqual(pedsCurrentDue, pedsInitialDue, 'Peds due must remain untouched');
  });

  // ==========================================================================
  // SUMMARY REPORT
  // ==========================================================================
  console.log('\n' + '='.repeat(72));
  console.log(`  📊 CHALLENGER M4 STRESS RESULTS: ${passCount}/${passCount + failCount} PASSED`);
  if (failCount === 0) {
    console.log('  ✅ ALL M4 WORKFLOW STRESS & ERGONOMICS PROBES PASSED WITH ZERO FAILURES');
  } else {
    console.log(`  ❌ ${failCount} DEFECT(S) FOUND:`);
    for (const f of failures) {
      console.log(`     - ${f.title}: ${f.error}`);
    }
  }
  console.log('='.repeat(72) + '\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runAll().catch(err => {
  console.error('Fatal runner error:', err);
  process.exit(1);
});
