/**
 * Adversarial Stress-Test Probes for Milestone 1: Data Architecture & Platform Shell
 * Executed by challenger_m1_1 to empirically probe boundary conditions, edge cases, and integrity invariants.
 */

const assert = require('node:assert/strict');
const path = require('node:path');
const { createSandbox } = require('./dom-harness.js');

const HTML_PATH = path.resolve(__dirname, '../index.html');
const APP_JS_PATH = path.resolve(__dirname, '../js/app.js');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function probe(title, fn) {
  totalTests++;
  process.stdout.write(`  ⚡ Probing: ${title} ... `);
  try {
    fn();
    passedTests++;
    console.log('PASSED');
  } catch (err) {
    failedTests++;
    console.log('FAILED');
    console.error(`     Error: ${err.message}`);
    failures.push({ title, error: err });
  }
}

console.log('========================================================================');
console.log('  🔥 MEDCARDY ADVERSARIAL STRESS TEST HARNESS — MILESTONE 1');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// SECTION 1: STRICT COURSE ISOLATION DEEP STRESS TESTING
// -----------------------------------------------------------------------------
console.log('▶ Section 1: Strict Course Isolation Deep Stress Testing');

probe('Adversarial 1.1: 100 Rapid rating cycles in Cardiology strictly preserves Pharma, Pulmo, Peds state', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  const courses = sb.evalInContext('purchasedCourses');
  
  // Snapshot Courses B, C, D before
  const pharmaBefore = JSON.stringify(courses.find(c => c.id === 'pharmacology'));
  const pulmoBefore = JSON.stringify(courses.find(c => c.id === 'pulmonology'));
  const pedsBefore = JSON.stringify(courses.find(c => c.id === 'pediatrics'));

  sb.app.startDeckStudy('cardiology', 'cardio-ecg');
  for (let i = 0; i < 100; i++) {
    // Interleave rating 1, 2, 3, 4
    sb.app.rateCard((i % 4) + 1);
  }

  const pharmaAfter = JSON.stringify(courses.find(c => c.id === 'pharmacology'));
  const pulmoAfter = JSON.stringify(courses.find(c => c.id === 'pulmonology'));
  const pedsAfter = JSON.stringify(courses.find(c => c.id === 'pediatrics'));

  assert.strictEqual(pharmaAfter, pharmaBefore, 'Pharmacology data altered during Cardiology ratings!');
  assert.strictEqual(pulmoAfter, pulmoBefore, 'Pulmonology data altered during Cardiology ratings!');
  assert.strictEqual(pedsAfter, pedsBefore, 'Pediatrics data altered during Cardiology ratings!');
});

probe('Adversarial 1.2: Round-robin rating across all 4 courses preserves independent isolation', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  const courseIds = ['cardiology', 'pharmacology', 'pulmonology', 'pediatrics'];

  for (let round = 0; round < 20; round++) {
    const targetIdx = round % 4;
    const targetId = courseIds[targetIdx];
    const peerIds = courseIds.filter((_, idx) => idx !== targetIdx);

    const peerSnapshotsBefore = peerIds.map(id => ({
      id,
      data: JSON.stringify(sb.evalInContext(`purchasedCourses.find(c => c.id === "${id}")`))
    }));

    sb.app.startDeckStudy(targetId);
    sb.app.rateCard(3);

    for (const peer of peerSnapshotsBefore) {
      const dataAfter = JSON.stringify(sb.evalInContext(`purchasedCourses.find(c => c.id === "${peer.id}")`));
      assert.strictEqual(dataAfter, peer.data, `Mutating ${targetId} leaked into peer course ${peer.id}!`);
    }
  }
});

probe('Adversarial 1.3: recalculateCourseStats called with invalid/hostile IDs does not crash or corrupt state', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  const hostileIds = [
    null,
    undefined,
    '',
    '__proto__',
    'constructor',
    'non-existent-course-404',
    12345,
    { id: 'fake' },
    ['injection']
  ];

  const snapshotBefore = JSON.stringify(sb.evalInContext('purchasedCourses'));

  for (const hostile of hostileIds) {
    assert.doesNotThrow(() => {
      sb.app.recalculateCourseStats(hostile);
    }, `recalculateCourseStats crashed on hostile input: ${hostile}`);
  }

  const snapshotAfter = JSON.stringify(sb.evalInContext('purchasedCourses'));
  assert.strictEqual(snapshotAfter, snapshotBefore, 'Hostile recalculateCourseStats calls corrupted purchasedCourses!');
});

probe('Adversarial 1.4: Rating custom session cards must NOT leak into Cardiology or any other course', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  const cardioBefore = JSON.stringify(sb.evalInContext('purchasedCourses.find(c => c.id === "cardiology")'));

  // Start custom session with 1 custom card
  sb.app.startCustomSession([{ question: 'Custom Q', answer: 'Custom A' }]);
  sb.app.rateCard(3);

  const cardioAfter = JSON.stringify(sb.evalInContext('purchasedCourses.find(c => c.id === "cardiology")'));
  assert.strictEqual(cardioAfter, cardioBefore, 'Custom session rating leaked into and mutated Cardiology course!');
});

probe('Adversarial 1.5: Calling rateCard when activeSession is null must NOT alter Cardiology or any course data', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  sb.appState.activeSession = null;
  const cardioBefore = JSON.stringify(sb.evalInContext('purchasedCourses.find(c => c.id === "cardiology")'));

  sb.app.rateCard(3);

  const cardioAfter = JSON.stringify(sb.evalInContext('purchasedCourses.find(c => c.id === "cardiology")'));
  assert.strictEqual(cardioAfter, cardioBefore, 'Standalone rateCard without active session mutated Cardiology course!');
});

// -----------------------------------------------------------------------------
// SECTION 2: DATA INTEGRITY & NUMERIC INVARIANTS UNDER PRESSURE
// -----------------------------------------------------------------------------
console.log('\n▶ Section 2: Data Integrity & Numeric Invariants Under Pressure');

probe('Adversarial 2.1: Exhausting all due cards to 0 preserves non-negative invariants', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  const course = sb.evalInContext('purchasedCourses.find(c => c.id === "cardiology")');
  
  // Rate all decks 50 times (well past initial due count of 12, 10, 8)
  for (const deck of course.decks) {
    sb.app.startDeckStudy('cardiology', deck.id);
    for (let i = 0; i < 50; i++) {
      sb.app.rateCard(4);
    }
    assert.strictEqual(deck.due, 0, `Deck ${deck.id} due should be clamped at 0`);
  }

  sb.app.recalculateCourseStats('cardiology');
  assert.strictEqual(course.due, 0, 'Course due must be exactly 0 after all decks exhausted');
  assert.ok(course.due >= 0, 'Course due must never be negative');

  // Verify global stats recalculates correctly
  const globals = sb.app.calculateGlobalStats();
  assert.ok(globals.totalDue >= 0, 'Global totalDue must be non-negative');
  const expectedOtherSum = sb.evalInContext('purchasedCourses.filter(c => c.id !== "cardiology").reduce((s, c) => s + c.due, 0)');
  assert.strictEqual(globals.totalDue, expectedOtherSum, 'Global totalDue must match remaining courses');
});

probe('Adversarial 2.2: Progress percentage never exceeds 100% despite infinite 4-ratings', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  sb.app.startDeckStudy('pharmacology', 'pharma-cns');

  for (let i = 0; i < 200; i++) {
    sb.app.rateCard(4);
  }

  const course = sb.evalInContext('purchasedCourses.find(c => c.id === "pharmacology")');
  const deck = course.decks.find(d => d.id === 'pharma-cns');

  assert.strictEqual(deck.progress, 100, 'Deck progress must cap at 100%');
  assert.ok(course.progress <= 100, 'Course progress must not exceed 100%');
  assert.ok(course.progress >= 0, 'Course progress must not be negative');
});

probe('Adversarial 2.3: Rating 1 ("Again") recycling queue stress test (50 "Again" ratings)', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');
  const initialQueueLen = sb.appState.activeSession.queue.length;

  for (let i = 0; i < 50; i++) {
    const curIdx = sb.appState.activeSession.currentIndex;
    sb.app.rateCard(1); // "Again" recycles card to queue end
    assert.strictEqual(sb.appState.activeSession.currentIndex, curIdx + 1, 'Current index must advance');
    assert.strictEqual(sb.appState.activeSession.queue.length, initialQueueLen + i + 1, 'Queue length must expand by 1 per rating 1');
  }

  // Active screen must still be study because queue has not finished
  assert.strictEqual(sb.appState.activeScreen, 'study', 'Screen must remain study during recycled queue');
});

probe('Adversarial 2.4: Rating card with boundary/corrupted rating inputs', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  sb.app.startDeckStudy('pulmonology', 'pulmo-copd');

  const boundaryRatings = [0, -1, 5, 999, 'NaN', null, undefined, {}, []];
  for (const r of boundaryRatings) {
    assert.doesNotThrow(() => {
      sb.app.rateCard(r);
    }, `rateCard threw on boundary rating: ${r}`);
  }
});

// -----------------------------------------------------------------------------
// SECTION 3: BOUNDARIES, EMPTY QUEUES & MISSING DOM RESILIENCE
// -----------------------------------------------------------------------------
console.log('\n▶ Section 3: Boundaries, Empty Queues & Missing DOM Resilience');

probe('Adversarial 3.1: startDeckStudy with missing, invalid or hostile arguments', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);

  const hostilePairs = [
    [null, null],
    [undefined, undefined],
    ['', ''],
    ['non_existent_course', 'non_existent_deck'],
    ['cardiology', 'non_existent_deck'],
    ['non_existent_course', 'cardio-ecg'],
    [123, 456],
    [{ course: 'bad' }, { deck: 'bad' }]
  ];

  for (const [c, d] of hostilePairs) {
    assert.doesNotThrow(() => {
      sb.app.startDeckStudy(c, d);
    }, `startDeckStudy crashed on pair: [${c}, ${d}]`);

    assert.ok(sb.appState.activeSession, 'activeSession should fall back to a valid session');
    assert.ok(Array.isArray(sb.appState.activeSession.queue), 'queue must be an array');
    assert.ok(sb.appState.activeSession.queue.length > 0, 'queue must have cards');
  }
});

probe('Adversarial 3.2: startCustomSession with empty, non-array or invalid card inputs', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);

  const emptyInputs = [[], null, undefined, 'not-an-array', 123, {}, { length: 5 }];
  for (const inp of emptyInputs) {
    assert.doesNotThrow(() => {
      sb.app.startCustomSession(inp);
    }, `startCustomSession crashed on input: ${JSON.stringify(inp)}`);
  }
});

probe('Adversarial 3.3: Rapid 1000x toggleCardFlip stress test and headless missing element tolerance', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);

  // 1000 rapid flips
  for (let i = 0; i < 1000; i++) {
    sb.app.toggleCardFlip();
  }
  // After 1000 flips, state should be false (even number)
  assert.strictEqual(sb.appState.isCardFlipped, false, 'State should be false after even number of flips');

  // Test when #flashcard element is removed
  const cardElem = sb.dom.getElementById('flashcard');
  if (cardElem && cardElem.parent) {
    cardElem.parent.children = cardElem.parent.children.filter(c => c !== cardElem);
  }
  assert.doesNotThrow(() => {
    sb.app.toggleCardFlip();
    sb.app.resetCardState();
  }, 'toggleCardFlip must not throw if #flashcard is not in DOM');
});

probe('Adversarial 3.4: renderCurrentCard handles cards with missing fields without exception', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  
  // Custom session with sparse / malformed cards
  const sparseCards = [
    {}, // completely empty
    { question: 'Only question' },
    { answer: 'Only answer' },
    { scenario: 'Only scenario' },
    { diagnosis: 'Only diagnosis' },
    { pearl: 'Only pearl' },
    { badge: null }
  ];

  // Bypass startCustomSession array check to test renderCurrentCard directly
  sb.appState.activeSession = {
    courseId: 'test',
    deckId: 'test',
    deckTitle: 'Test',
    queue: sparseCards,
    currentIndex: 0,
    reviewsCount: 0,
    correctCount: 0
  };

  for (let i = 0; i < sparseCards.length; i++) {
    sb.appState.activeSession.currentIndex = i;
    assert.doesNotThrow(() => {
      sb.app.renderCurrentCard();
    }, `renderCurrentCard crashed on sparse card at index ${i}`);
  }
});

// -----------------------------------------------------------------------------
// SECTION 4: NAVIGATION SAFETY, BREADCRUMBS & STATE TRANSITIONS
// -----------------------------------------------------------------------------
console.log('\n▶ Section 4: Navigation Safety, Breadcrumbs & State Transitions');

probe('Adversarial 4.1: app.backToPlatform() called 100 times consecutively is idempotent', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);

  for (let i = 0; i < 100; i++) {
    assert.doesNotThrow(() => {
      sb.app.backToPlatform();
    });
    assert.strictEqual(sb.appState.activeScreen, 'platform-hub');
    assert.strictEqual(sb.appState.activeModule, 'platform-hub');
  }

  const breadcrumbs = sb.dom.getElementById('moduleBreadcrumbs');
  assert.ok(breadcrumbs.classList.contains('hidden'), 'Breadcrumbs must have hidden class on platform-hub');
  assert.strictEqual(breadcrumbs.style.display, 'none', 'Breadcrumbs must be display none on platform-hub');
});

probe('Adversarial 4.2: showScreen with invalid / malicious screen IDs gracefully defaults', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);

  const hostileScreens = [
    null,
    undefined,
    '',
    '<script>alert("XSS")</script>',
    '../../../etc/passwd',
    'constructor',
    '__proto__',
    99999
  ];

  for (const screen of hostileScreens) {
    assert.doesNotThrow(() => {
      sb.app.showScreen(screen);
    }, `showScreen crashed on hostile screen: ${screen}`);
    assert.ok(
      sb.appState.activeScreen === 'platform-hub' || sb.appState.activeScreen === 'dashboard',
      `Active screen should fall back safely, got: ${sb.appState.activeScreen}`
    );
  }
});

probe('Adversarial 4.3: Random 200-step navigation walk preserves breadcrumb synchronization', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  const screens = ['platform-hub', 'dashboard', 'study', 'recovery', 'courses', 'results'];
  const breadcrumbs = sb.dom.getElementById('moduleBreadcrumbs');
  const leaf = sb.dom.getElementById('activeBreadcrumbLeaf');

  // Seed with active study session for study screen title test
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');

  for (let i = 0; i < 200; i++) {
    const s = screens[i % screens.length];
    sb.app.showScreen(s);

    if (s === 'platform-hub') {
      assert.strictEqual(breadcrumbs.style.display, 'none', 'Breadcrumbs must be hidden on platform-hub');
      assert.ok(breadcrumbs.classList.contains('hidden'), 'Breadcrumbs must have hidden class on platform-hub');
    } else {
      assert.strictEqual(breadcrumbs.style.display, 'flex', `Breadcrumbs must be flex on ${s}`);
      assert.ok(!breadcrumbs.classList.contains('hidden'), `Breadcrumbs must not be hidden on ${s}`);
      assert.ok(leaf.textContent.length > 0, `Leaf breadcrumb text must be non-empty on ${s}`);
    }
  }
});

probe('Adversarial 4.4: Switchers stress test (rapid 100x layout & btn-style switching)', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  const layouts = ['quizlet', 'duolingo', 'anki', 'shift', 'invalid_layout'];
  const styles = ['btn-style-glass', 'btn-style-3d', 'btn-style-outline', 'invalid_style'];

  for (let i = 0; i < 100; i++) {
    const l = layouts[i % layouts.length];
    const s = styles[i % styles.length];

    assert.doesNotThrow(() => {
      sb.app.setLayout(l);
      sb.app.setBtnStyle(s);
    }, `Failed switching layout=${l}, style=${s}`);
  }
});

probe('Adversarial 4.5: Platform Hub UI synchronization after card ratings', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);

  // Rate 5 cards in Cardiology
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');
  for (let i = 0; i < 5; i++) {
    sb.app.rateCard(3);
  }

  const cardioData = sb.evalInContext('purchasedCourses.find(c => c.id === "cardiology")');
  // Return to platform hub
  sb.app.backToPlatform();

  // Check if DOM reflects updated data
  const cardioCard = sb.dom.querySelector('.platform-course-card[data-course-id="cardiology"]');
  assert.ok(cardioCard, 'Cardiology card must exist in Platform Hub');
  const dueEl = cardioCard.querySelector('.p-metric-val.text-danger');
  assert.ok(dueEl, 'Due count element must exist in Platform Hub course card');

  // Verify whether DOM is synchronized with data model
  const toLatin = str => String(str).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
  const domDue = parseInt(toLatin(dueEl.textContent.trim()), 10);
  assert.strictEqual(domDue, cardioData.due,
    `Platform Hub DOM due count (${domDue}) is out of sync with data model due count (${cardioData.due})!`);
});

// -----------------------------------------------------------------------------
// SUMMARY & VERDICT
// -----------------------------------------------------------------------------
console.log('\n========================================================================');
console.log(`  📊 ADVERSARIAL STRESS TEST RESULTS: ${passedTests}/${totalTests} PASSED`);
if (failedTests > 0) {
  console.log(`  ❌ FAILURES ENCOUNTERED: ${failedTests}`);
  for (const f of failures) {
    console.log(`    - ${f.title}: ${f.error.message}`);
  }
} else {
  console.log('  ✅ ALL ADVERSARIAL PROBES PASSED WITH ZERO FAILURES');
}
console.log('========================================================================');

process.exit(failedTests > 0 ? 1 : 0);
