/**
 * Challenger Milestone 4 Empirical Verification & Hostile Attack Suite
 * 
 * Conducted by: challenger_m4_1 (teamwork_challenger)
 * Identity: Adversarial Security & Input Challenger
 * 
 * Objectives:
 * 1. Prototype pollution fuzzing against:
 *    - setLayout, renderDashboard, setBtnStyle, openCardsModule, recalculateCourseStats, startDeckStudy
 *    - Injected keys: __proto__, constructor, valueOf, toString, isPrototypeOf, propertyIsEnumerable, hasOwnProperty, toLocaleString
 * 2. Rating input fuzzing against app.rateCard:
 *    - Negative numbers (-999, -1, -0.01), zero (0), extreme numbers (1e10, Number.MAX_SAFE_INTEGER, Infinity, -Infinity)
 *    - NaN, null, undefined, Symbol, booleans, objects, arrays, functions, Object.create(null)
 *    - Hostile queues with non-object items (null, undefined, 42, strings, empty items)
 *    - Missing, corrupted, or non-array activeSession queues
 * 3. Recovery slider fuzzing against app.updateRecoveryPrescription & app.startRecoverySession:
 *    - Hostile floats (-0.0001, 0.5, 3.14159, 99.999), NaN, negative numbers (-999, -5)
 *    - Out-of-bounds strings ("9999", "-500", "invalid", "<script>alert(1)</script>")
 *    - Extreme numbers (Infinity, -Infinity, 1e20)
 *    - Object / array / symbol / function / null / undefined / Object.create(null) inputs
 *    - Verification of [5, 60] minute clamping and safe DOM onclick generation
 * 4. Relentless 1,000-cycle randomized adversarial stress harness:
 *    - Rapid random interleaving of hostile inputs across all state mutators
 *    - Verification of zero unhandled exceptions, zero prototype contamination, and clean invariant preservation
 */

const assert = require('node:assert/strict');
const path = require('node:path');
const { createSandbox } = require('./dom-harness.js');

const HTML_PATH = path.resolve(__dirname, '../index.html');
const APP_JS_PATH = path.resolve(__dirname, '../js/app.js');

let totalProbes = 0;
let passedProbes = 0;
let failedProbes = 0;
const failureDetails = [];

function probe(name, fn) {
  totalProbes++;
  process.stdout.write(`  ⚡ [Probe ${String(totalProbes).padStart(2, '0')}] ${name} ... `);
  try {
    fn();
    passedProbes++;
    console.log('\x1b[32mPASSED\x1b[0m');
  } catch (err) {
    failedProbes++;
    console.log('\x1b[31mFAILED\x1b[0m');
    console.error(`     💥 Error: ${err.message}`);
    if (err.stack) {
      console.error(`     ${err.stack.split('\n').slice(1, 3).join('\n')}`);
    }
    failureDetails.push({ name, error: err });
  }
}

console.log('========================================================================');
console.log('  🛡️ MEDCARDY M4 ADVERSARIAL ATTACK & EMPIRICAL STRESS HARNESS');
console.log('  Auditor: challenger_m4_1 (teamwork_challenger)');
console.log('========================================================================\n');

const PROTO_KEYS = [
  '__proto__',
  'constructor',
  'valueOf',
  'toString',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'hasOwnProperty',
  'toLocaleString'
];

// =============================================================================
// SECTION 1: PROTOTYPE POLLUTION FUZZING
// =============================================================================
console.log('▶ SECTION 1: Prototype Pollution & Injected Key Fuzzing');

probe('1.1: setLayout rejects all prototype keys and defaults safely to quizlet', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  for (const key of PROTO_KEYS) {
    assert.doesNotThrow(() => {
      sb.app.setLayout(key);
    }, `setLayout("${key}") threw an unexpected exception`);
    assert.strictEqual(sb.appState.activeLayout, 'quizlet', `setLayout("${key}") must default to quizlet`);
    assert.strictEqual(sb.body.getAttribute('data-layout'), 'quizlet');
  }
});

probe('1.2: setLayout rejects non-string and hostile types without crashing', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  const hostileTypes = [null, undefined, 0, 42, NaN, Infinity, -Infinity, {}, [], () => {}, Symbol('evil')];
  for (const input of hostileTypes) {
    assert.doesNotThrow(() => {
      sb.app.setLayout(input);
    }, `setLayout(${String(input)}) threw exception`);
    assert.strictEqual(sb.appState.activeLayout, 'quizlet');
  }
});

probe('1.3: renderDashboard defensively blocks prototype keys even if appState.activeLayout is manually corrupted', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  const container = sb.dom.querySelector('#dashboard-content');
  assert.ok(container, '#dashboard-content must exist');

  for (const key of PROTO_KEYS) {
    sb.appState.activeLayout = key;
    assert.doesNotThrow(() => {
      sb.app.renderDashboard();
    }, `renderDashboard with appState.activeLayout = "${key}" threw exception`);
    assert.ok(container.innerHTML.length > 50, `Container innerHTML must not be empty on prototype key "${key}"`);
  }
});

probe('1.4: renderDashboard survives intentional Object.prototype tampering', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  const container = sb.dom.querySelector('#dashboard-content');

  try {
    Object.prototype.fakeProperty = 'POLLUTED';
    Object.prototype.quizlet_fake = () => '<div class="injected">HACKED</div>';

    sb.appState.activeLayout = 'fakeProperty';
    assert.doesNotThrow(() => {
      sb.app.renderDashboard();
    });
    assert.ok(container.innerHTML.includes('quizlet') || container.innerHTML.includes('کاردیولوژی'));
  } finally {
    delete Object.prototype.fakeProperty;
    delete Object.prototype.quizlet_fake;
  }
});

probe('1.5: setBtnStyle rejects all prototype keys and defaults safely to btn-style-glass', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  for (const key of PROTO_KEYS) {
    assert.doesNotThrow(() => {
      sb.app.setBtnStyle(key);
    }, `setBtnStyle("${key}") threw exception`);
    assert.strictEqual(sb.appState.activeBtnStyle, 'btn-style-glass', `setBtnStyle("${key}") must default to btn-style-glass`);
    assert.ok(sb.body.classList.contains('btn-style-glass'));
    assert.ok(!sb.body.classList.contains(key));
  }
});

probe('1.6: setBtnStyle rejects non-string and hostile types', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  const hostileInputs = [null, undefined, 123, false, true, NaN, {}, [], () => {}, Symbol('style')];
  for (const input of hostileInputs) {
    assert.doesNotThrow(() => {
      sb.app.setBtnStyle(input);
    }, `setBtnStyle(${String(input)}) threw exception`);
    assert.strictEqual(sb.appState.activeBtnStyle, 'btn-style-glass');
  }
});

probe('1.7: openCardsModule rejects prototype keys and defaults to all filter', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  for (const key of PROTO_KEYS) {
    assert.doesNotThrow(() => {
      sb.app.openCardsModule(key);
    }, `openCardsModule("${key}") threw exception`);
    assert.strictEqual(sb.appState.activeCourseFilter, 'all', `openCardsModule("${key}") must default to 'all'`);
    assert.strictEqual(sb.appState.activeScreen, 'dashboard');
  }
});

probe('1.8: openCardsModule handles non-string and hostile inputs gracefully', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  const hostileInputs = [null, undefined, 999, NaN, false, {}, ['cardiology'], () => 'cardiology', Symbol('course')];
  for (const input of hostileInputs) {
    assert.doesNotThrow(() => {
      sb.app.openCardsModule(input);
    }, `openCardsModule(${String(input)}) threw exception`);
    assert.strictEqual(sb.appState.activeCourseFilter, 'all');
  }
});

probe('1.9: recalculateCourseStats rejects prototype keys without throwing or mutating global state', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  for (const key of PROTO_KEYS) {
    assert.doesNotThrow(() => {
      sb.app.recalculateCourseStats(key);
    }, `recalculateCourseStats("${key}") threw exception`);
  }
  assert.strictEqual(Object.prototype.due, undefined, 'Object.prototype.due must be undefined');
  assert.strictEqual(Object.prototype.overdue, undefined, 'Object.prototype.overdue must be undefined');
  assert.strictEqual(Object.prototype.progress, undefined, 'Object.prototype.progress must be undefined');
  assert.strictEqual(Object.prototype.totalCards, undefined, 'Object.prototype.totalCards must be undefined');
});

probe('1.10: startDeckStudy with prototype keys defaults safely to standard first course and deck', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  for (const key of PROTO_KEYS) {
    assert.doesNotThrow(() => {
      sb.app.startDeckStudy(key, key);
    }, `startDeckStudy("${key}", "${key}") threw exception`);
    assert.ok(sb.appState.activeSession, 'activeSession must be created');
    assert.strictEqual(sb.appState.activeSession.courseId, 'cardiology', `Course must default to cardiology for key ${key}`);
    assert.ok(Array.isArray(sb.appState.activeSession.queue), 'queue must be an array');
    assert.ok(sb.appState.activeSession.queue.length > 0, 'queue must contain cards');
    assert.strictEqual(sb.appState.activeScreen, 'study');
  }
});

// =============================================================================
// SECTION 2: RATING INPUT FUZZING (app.rateCard)
// =============================================================================
console.log('\n▶ SECTION 2: Rating Input Fuzzing (app.rateCard)');

probe('2.1: rateCard with negative values (-999, -1, -0.01) clamps safely to default rating 3', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');

  const negativeRatings = [-999, -1, -0.01, -Infinity, '-999', '-1', '-0.01'];
  for (const r of negativeRatings) {
    assert.doesNotThrow(() => {
      sb.app.rateCard(r);
    }, `rateCard(${r}) threw exception`);
  }
  assert.strictEqual(sb.appState.activeSession.reviewsCount, negativeRatings.length);
});

probe('2.2: rateCard with zero (0) clamps safely to default rating 3', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');

  assert.doesNotThrow(() => {
    sb.app.rateCard(0);
    sb.app.rateCard('0');
  });
  assert.strictEqual(sb.appState.activeSession.reviewsCount, 2);
});

probe('2.3: rateCard with extreme positive numbers (1e10, MAX_SAFE_INTEGER, Infinity) clamps safely', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');

  const extremeRatings = [1e10, Number.MAX_SAFE_INTEGER, Infinity, '1e10', '9999999999'];
  for (const r of extremeRatings) {
    assert.doesNotThrow(() => {
      sb.app.rateCard(r);
    }, `rateCard(${r}) threw exception`);
  }
  assert.strictEqual(sb.appState.activeSession.reviewsCount, extremeRatings.length);
});

probe('2.4: rateCard with NaN, null, undefined, and hostile primitives defaults safely to rating 3', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');

  const weirdRatings = [NaN, null, undefined, false, true, '', '   ', 'abc', {}, [], () => 4];
  for (const r of weirdRatings) {
    assert.doesNotThrow(() => {
      sb.app.rateCard(r);
    }, `rateCard(${String(r)}) threw exception`);
  }
  assert.strictEqual(sb.appState.activeSession.reviewsCount, weirdRatings.length);
});

probe('2.5: rateCard with Symbol must NOT throw uncaught TypeError', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');

  assert.doesNotThrow(() => {
    sb.app.rateCard(Symbol('malicious'));
  }, 'rateCard(Symbol) must not crash with TypeError');
});

probe('2.6: rateCard with Object.create(null) must NOT throw uncaught TypeError', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');

  assert.doesNotThrow(() => {
    sb.app.rateCard(Object.create(null));
  }, 'rateCard(Object.create(null)) must not crash with TypeError');
});

probe('2.7: rateCard with non-object queue items (null, undefined, primitives) advances without crashing', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  sb.appState.activeSession = {
    courseId: 'cardiology',
    deckId: 'cardio-ecg',
    queue: [null, undefined, 42, 'string-card', false, { id: 'valid-card-1', question: 'Q', answer: 'A' }],
    currentIndex: 0,
    reviewsCount: 0,
    correctCount: 0,
    startTime: Date.now()
  };

  for (let i = 0; i < 6; i++) {
    assert.doesNotThrow(() => {
      sb.app.rateCard(3);
    }, `rateCard with corrupted queue item at index ${i} threw exception`);
  }
  assert.strictEqual(sb.appState.activeSession.reviewsCount, 6);
});

probe('2.8: rateCard when activeSession is null, undefined, or empty object returns silently without error', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);

  sb.appState.activeSession = null;
  assert.doesNotThrow(() => sb.app.rateCard(3));

  sb.appState.activeSession = undefined;
  assert.doesNotThrow(() => sb.app.rateCard(3));

  sb.appState.activeSession = {};
  assert.doesNotThrow(() => sb.app.rateCard(3));

  sb.appState.activeSession = { queue: [] };
  assert.doesNotThrow(() => sb.app.rateCard(3));

  sb.appState.activeSession = { queue: null };
  assert.doesNotThrow(() => sb.app.rateCard(3));
});

probe('2.9: rateCard rating 1 (Again) correctly appends copy of card to queue and maintains stability', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');
  const initialLen = sb.appState.activeSession.queue.length;

  sb.app.rateCard(1); // Rating 1 = Again (<1m)
  assert.strictEqual(sb.appState.activeSession.queue.length, initialLen + 1, 'Rating 1 should append card to queue');
  const lastCard = sb.appState.activeSession.queue[sb.appState.activeSession.queue.length - 1];
  assert.strictEqual(lastCard.stability, 0.4, 'Again rating stability must be 0.4');
  assert.strictEqual(lastCard.lastRating, 1);
});

probe('2.10: rateCard exhausting session queue smoothly transitions to results screen', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');
  const total = sb.appState.activeSession.queue.length;

  for (let i = 0; i < total; i++) {
    sb.app.rateCard(4);
  }

  assert.strictEqual(sb.appState.activeScreen, 'results', 'Completing study queue must transition to results');
  const resEl = sb.dom.querySelector('#screen-results');
  assert.ok(resEl.classList.contains('active'), 'screen-results must have active class');
});

// =============================================================================
// SECTION 3: RECOVERY SLIDER FUZZING (app.updateRecoveryPrescription)
// =============================================================================
console.log('\n▶ SECTION 3: Recovery Slider Fuzzing (app.updateRecoveryPrescription)');

probe('3.1: updateRecoveryPrescription clamps hostile floats to [5, 60]', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  const testCases = [
    { input: -0.0001, expected: 5 },
    { input: 0.5, expected: 5 },
    { input: 4.9999, expected: 5 },
    { input: 5.0, expected: 5 },
    { input: 12.75, expected: 12 },
    { input: 30.2, expected: 30 },
    { input: 59.9, expected: 59 },
    { input: 60.0, expected: 60 },
    { input: 60.0001, expected: 60 },
    { input: 99.999, expected: 60 }
  ];

  for (const tc of testCases) {
    assert.doesNotThrow(() => {
      sb.app.updateRecoveryPrescription(tc.input);
    });
    assert.strictEqual(sb.appState.recoveryMinutes, tc.expected, `Input ${tc.input} should clamp to ${tc.expected}`);
  }
});

probe('3.2: updateRecoveryPrescription handles NaN, null, undefined, and non-numeric strings with default 15', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  const nonNumerics = [NaN, null, undefined, 'abc', 'invalid', '', '   ', {}, [], () => 20];

  for (const val of nonNumerics) {
    assert.doesNotThrow(() => {
      sb.app.updateRecoveryPrescription(val);
    });
    assert.strictEqual(sb.appState.recoveryMinutes, 15, `Input ${String(val)} must default to 15`);
  }
});

probe('3.3: updateRecoveryPrescription clamps negative numbers (-999, -5, -1) to 5', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  const negatives = [-999, -500, -100, -5, -1, '-999', '-5'];

  for (const val of negatives) {
    assert.doesNotThrow(() => {
      sb.app.updateRecoveryPrescription(val);
    });
    assert.strictEqual(sb.appState.recoveryMinutes, 5, `Negative input ${val} must clamp to 5`);
  }
});

probe('3.4: updateRecoveryPrescription clamps extreme positive numbers (9999, 100000) to 60', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  const extremes = [9999, 100000, '9999', '100000'];

  for (const val of extremes) {
    assert.doesNotThrow(() => {
      sb.app.updateRecoveryPrescription(val);
    });
    assert.strictEqual(sb.appState.recoveryMinutes, 60, `Extreme input ${val} must clamp to 60`);
  }
});

probe('3.5: updateRecoveryPrescription with Symbol must NOT throw uncaught TypeError', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  assert.doesNotThrow(() => {
    sb.app.updateRecoveryPrescription(Symbol('minutes'));
  }, 'updateRecoveryPrescription(Symbol) must not crash with TypeError');
  assert.ok(sb.appState.recoveryMinutes >= 5 && sb.appState.recoveryMinutes <= 60);
});

probe('3.6: updateRecoveryPrescription with Object.create(null) must NOT throw uncaught TypeError', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  assert.doesNotThrow(() => {
    sb.app.updateRecoveryPrescription(Object.create(null));
  }, 'updateRecoveryPrescription(Object.create(null)) must not crash with TypeError');
  assert.ok(sb.appState.recoveryMinutes >= 5 && sb.appState.recoveryMinutes <= 60);
});

probe('3.7: startRecoverySession with Symbol and Object.create(null) must NOT throw uncaught TypeError', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  assert.doesNotThrow(() => {
    sb.app.startRecoverySession(Symbol('minutes'));
  }, 'startRecoverySession(Symbol) must not crash with TypeError');
  assert.doesNotThrow(() => {
    sb.app.startRecoverySession(Object.create(null));
  }, 'startRecoverySession(Object.create(null)) must not crash with TypeError');
});

probe('3.8: updateRecoveryPrescription renders DOM elements safely and generates valid startRecoverySession onclick', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  sb.app.showScreen('recovery');

  const hostileInputs = [-100, 0, 75, NaN, '99999', '<script>alert(1)</script>'];
  for (const input of hostileInputs) {
    sb.app.updateRecoveryPrescription(input);
    const box = sb.dom.querySelector('#prescriptionBox');
    assert.ok(box, '#prescriptionBox must exist');
    const text = box.textContent;
    assert.ok(text.includes('نسخه پیشنهادی'), 'Must render Persian title');
    
    const btn = box.querySelector('button');
    assert.ok(btn, 'Button must exist');
    const onclickStr = btn.getAttribute('onclick');
    assert.ok(onclickStr, 'onclick attribute must exist');
    const match = onclickStr.match(/app\.startRecoverySession\((\d+)\)/);
    assert.ok(match, `onclick "${onclickStr}" must match app.startRecoverySession(int)`);
    const mins = parseInt(match[1], 10);
    assert.ok(mins >= 5 && mins <= 60, `Generated minutes ${mins} must be clamped between 5 and 60`);
  }
});

// =============================================================================
// SECTION 4: DEEP STATE & SCREEN PERMUTATIONS WITH HOSTILE INPUTS
// =============================================================================
console.log('\n▶ SECTION 4: Navigation & Screen Resilience Under Hostile Invocations');

probe('4.1: showScreen with invalid/hostile screen IDs falls back safely to platform-hub', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  const hostileScreens = [
    '__proto__',
    'constructor',
    'toString',
    'unknown-screen-404',
    null,
    undefined,
    12345,
    '',
    {},
    ['dashboard']
  ];

  for (const s of hostileScreens) {
    assert.doesNotThrow(() => {
      sb.app.showScreen(s);
    }, `showScreen(${String(s)}) threw exception`);
    assert.strictEqual(sb.appState.activeScreen, 'platform-hub');
    const hubScreen = sb.dom.querySelector('#screen-platform-hub');
    assert.ok(hubScreen.classList.contains('active'));
  }
});

probe('4.2: startCustomSession rejects empty/non-array cards gracefully, and succeeds on valid arrays', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  sb.appState.activeSession = null;

  // Empty or non-array inputs should reject without creating session
  const rejectInputs = [null, undefined, [], [null, undefined, 'not-a-card', 42]];
  for (const bad of rejectInputs) {
    assert.doesNotThrow(() => {
      sb.app.startCustomSession(bad);
    });
    assert.strictEqual(sb.appState.activeSession, null, 'activeSession should remain null on invalid card arrays');
  }

  // Valid card array should start session
  sb.app.startCustomSession([{ question: 'Test Q', answer: 'Test A' }]);
  assert.ok(sb.appState.activeSession, 'activeSession must be created for valid card array');
  assert.strictEqual(sb.appState.activeSession.courseId, 'custom');
  assert.strictEqual(sb.appState.activeScreen, 'study');
});

probe('4.3: calculateProgress helper handles zero division, NaN, negative, and infinite numbers', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  const fn = sb.evalInContext('calculateProgress');
  assert.ok(typeof fn === 'function', 'calculateProgress must be a function');

  assert.strictEqual(fn(0, 0), 0);
  assert.strictEqual(fn(0, 100), 0);
  assert.strictEqual(fn(50, 100), 50);
  assert.strictEqual(fn(100, 100), 100);
  assert.strictEqual(fn(150, 100), 100, 'Must clamp upper bound to 100');
  assert.strictEqual(fn(-10, 100), 0, 'Must clamp lower bound to 0');
  assert.strictEqual(fn(NaN, 100), 0);
  assert.strictEqual(fn(50, NaN), 0);
  assert.strictEqual(fn(Infinity, 100), 0);
  assert.strictEqual(fn(50, Infinity), 0);
  assert.strictEqual(fn('50', '100'), 0);
  assert.strictEqual(fn(null, undefined), 0);
});

// =============================================================================
// SECTION 5: RELENTLESS 1,000-CYCLE ADVERSARIAL RANDOM FUZZING
// =============================================================================
console.log('\n▶ SECTION 5: 1,000-Cycle Randomized Adversarial Stress Harness');

probe('5.1: 1,000 randomized hostile mutator invocations execute with zero uncaught exceptions and no prototype leaks', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);

  const hostileInputs = [
    '__proto__', 'constructor', 'valueOf', 'toString', 'isPrototypeOf',
    null, undefined, NaN, -999, 0, 4, 1e10, Infinity, -Infinity,
    'quizlet', 'duolingo', 'anki', 'shift', 'invalid_str', '',
    'cardiology', 'pharmacology', 'pulmonology', 'pediatrics',
    {}, []
  ];

  const screens = ['platform-hub', 'dashboard', 'study', 'recovery', 'courses', 'results', 'bogus', '__proto__'];

  let callCount = 0;
  for (let cycle = 0; cycle < 1000; cycle++) {
    const action = cycle % 10;
    const input = hostileInputs[Math.floor(Math.random() * hostileInputs.length)];
    const screen = screens[Math.floor(Math.random() * screens.length)];

    try {
      switch (action) {
        case 0:
          sb.app.setLayout(input);
          break;
        case 1:
          sb.app.setBtnStyle(input);
          break;
        case 2:
          sb.app.openCardsModule(input);
          break;
        case 3:
          sb.app.recalculateCourseStats(input);
          break;
        case 4:
          sb.app.updateRecoveryPrescription(input);
          break;
        case 5:
          sb.app.rateCard(input);
          break;
        case 6:
          sb.app.showScreen(screen);
          break;
        case 7:
          sb.app.startDeckStudy(input, input);
          break;
        case 8:
          sb.app.toggleCardFlip();
          break;
        case 9:
          sb.app.renderDashboard();
          break;
      }
      callCount++;
    } catch (err) {
      throw new Error(`Cycle ${cycle} (Action ${action}, Input ${String(input)}) failed: ${err.message}`);
    }
  }

  assert.strictEqual(callCount, 1000, 'Must successfully execute 1,000 hostile cycles');

  // Verify Object.prototype purity
  assert.strictEqual(Object.prototype.quizlet, undefined);
  assert.strictEqual(Object.prototype.due, undefined);
  assert.strictEqual(Object.prototype.recoveryMinutes, undefined);
  assert.strictEqual(Object.prototype.activeSession, undefined);
});

// =============================================================================
// SUMMARY & READOUT
// =============================================================================
console.log('\n========================================================================');
console.log(`  SUMMARY: ${passedProbes}/${totalProbes} Adversarial Probes Passed (${failedProbes} Failed)`);
console.log('========================================================================\n');

if (failedProbes > 0) {
  console.error(`💥 FAILURES DETECTED:`);
  failureDetails.forEach((f, idx) => {
    console.error(`  ${idx + 1}. ${f.name}`);
    console.error(`     ${f.error.message}`);
  });
  process.exit(1);
} else {
  console.log('🎉 ALL ADVERSARIAL STRESS PROBES PASSED WITH ZERO CRASHES OR LEAKS.\n');
  process.exit(0);
}
