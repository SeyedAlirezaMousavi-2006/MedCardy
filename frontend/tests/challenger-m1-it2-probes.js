/**
 * Challenger M1 Iteration 2 Adversarial Stress Probes
 * Authored by challenger_m1_it2_1 (Empirical Challenger)
 * 
 * Verifies all 4 Gate 1 defect fixes under hostile and boundary conditions:
 * 1. renderPlatformCourses DOM rendering, empty array tolerance & restoration
 * 2. startCustomSession type validation & graceful rejection of non-arrays
 * 3. rateCard strict isolation, Rating 1 due non-drain invariant, clamp at 0, stability sync
 * 4. Results screen dynamic metric computation & session replay mechanics
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

const toLatin = str => String(str).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));

console.log('========================================================================');
console.log('  🔬 CHALLENGER M1 ITERATION 2 ADVERSARIAL STRESS PROBES');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// SECTION 1: renderPlatformCourses DOM RENDERING, EMPTY ARRAY & RESTORATION
// -----------------------------------------------------------------------------
console.log('▶ Section 1: renderPlatformCourses DOM Rendering & Boundary Tolerance');

probe('Probe 1.1: renderPlatformCourses([]) renders empty state placeholder without error', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  sb.app.renderPlatformCourses([]);
  
  const container = sb.dom.getElementById('platformCoursesContainer');
  assert.ok(container, 'platformCoursesContainer must exist');
  assert.ok(container.textContent.includes('هیچ دوره‌ای در پلتفرم فعال نیست'),
    'Should display empty state text');
  const cards = sb.dom.querySelectorAll('#platformCoursesContainer .platform-course-card');
  assert.strictEqual(cards.length, 0, 'No course cards should be rendered for empty array');
});

probe('Probe 1.2: renderPlatformCourses() cleanly restores all 4 course cards after empty state', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  // Blank it first
  sb.app.renderPlatformCourses([]);
  assert.strictEqual(sb.dom.querySelectorAll('#platformCoursesContainer .platform-course-card').length, 0);

  // Restore with default arguments
  sb.app.renderPlatformCourses();
  const cards = sb.dom.querySelectorAll('#platformCoursesContainer .platform-course-card');
  assert.strictEqual(cards.length, 4, 'Must restore exactly 4 course cards');

  // Verify all 4 expected courses are represented
  const courseIds = Array.from(cards).map(c => c.getAttribute('data-course-id'));
  assert.deepStrictEqual(courseIds.sort(), ['cardiology', 'pediatrics', 'pharmacology', 'pulmonology'].sort());
});

probe('Probe 1.3: renderPlatformCourses tolerates non-array & hostile inputs without throwing', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);

  // Non-array and falsy hostile inputs (except undefined which invokes ES6 default)
  const hostileInputs = [null, 0, 12345, 'not-an-array', {}, false, true, { length: 4 }];

  for (const input of hostileInputs) {
    assert.doesNotThrow(() => {
      sb.app.renderPlatformCourses(input);
    }, `renderPlatformCourses threw on hostile input: ${String(input)}`);

    const container = sb.dom.getElementById('platformCoursesContainer');
    assert.ok(container.textContent.includes('هیچ دوره‌ای در پلتفرم فعال نیست'),
      `Hostile input ${String(input)} must render safe fallback message`);
  }

  // Calling with undefined triggers ES6 default argument and safely renders 4 courses
  assert.doesNotThrow(() => {
    sb.app.renderPlatformCourses(undefined);
  });
  const restoredCards = sb.dom.querySelectorAll('#platformCoursesContainer .platform-course-card');
  assert.strictEqual(restoredCards.length, 4, 'Undefined must trigger default parameter and render 4 courses');
});

probe('Probe 1.4: renderPlatformCourses reflects live study metrics across multiple courses', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);

  // Study in Cardiology
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');
  sb.app.rateCard(3); // due decrements by 1
  sb.app.rateCard(3); // due decrements by 1

  // Study in Pharmacology
  sb.app.startDeckStudy('pharmacology', 'pharma-ans');
  sb.app.rateCard(3); // due decrements by 1

  // Navigate back to Platform Hub
  sb.app.backToPlatform();

  const cardioCard = sb.dom.querySelector('.platform-course-card[data-course-id="cardiology"]');
  const pharmaCard = sb.dom.querySelector('.platform-course-card[data-course-id="pharmacology"]');

  assert.ok(cardioCard, 'Cardiology card must exist in Hub');
  assert.ok(pharmaCard, 'Pharmacology card must exist in Hub');

  const cardioDueEl = cardioCard.querySelector('.p-metric-val.text-danger');
  const pharmaDueEl = pharmaCard.querySelector('.p-metric-val.text-danger');

  const cardioDue = parseInt(toLatin(cardioDueEl.textContent.trim()), 10);
  const pharmaDue = parseInt(toLatin(pharmaDueEl.textContent.trim()), 10);

  const cardioModel = sb.purchasedCourses.find(c => c.id === 'cardiology');
  const pharmaModel = sb.purchasedCourses.find(c => c.id === 'pharmacology');

  assert.strictEqual(cardioDue, cardioModel.due, 'Hub DOM Cardio due matches live data model');
  assert.strictEqual(pharmaDue, pharmaModel.due, 'Hub DOM Pharma due matches live data model');
});

probe('Probe 1.5: Course cards in Platform Hub render functional action buttons targeting courseId', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  sb.app.renderPlatformCourses();

  const courses = ['cardiology', 'pharmacology', 'pulmonology', 'pediatrics'];
  for (const cid of courses) {
    const card = sb.dom.querySelector(`.platform-course-card[data-course-id="${cid}"]`);
    assert.ok(card, `Card for ${cid} must exist`);
    const btn = card.querySelector('button');
    assert.ok(btn, `Action button for ${cid} must exist`);
    const onclickStr = btn.getAttribute('onclick') || '';
    assert.ok(onclickStr.includes(cid), `onclick attribute must contain courseId '${cid}', got: ${onclickStr}`);
  }
});

// -----------------------------------------------------------------------------
// SECTION 2: startCustomSession TYPE VALIDATION & DEFENSIVE ISOLATION
// -----------------------------------------------------------------------------
console.log('\n▶ Section 2: startCustomSession Type Safety & Defensive Rejection');

probe('Probe 2.1: startCustomSession gracefully rejects all non-array types without throwing', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  const invalidTypes = [
    12345,
    -1,
    0,
    NaN,
    Infinity,
    'cards-string',
    '',
    true,
    false,
    undefined,
    null,
    {},
    { length: 5 },
    { length: 0 },
    Symbol('cards'),
    () => [{ question: 'q', answer: 'a' }]
  ];

  for (const invalid of invalidTypes) {
    sb.appState.activeSession = null;
    assert.doesNotThrow(() => {
      sb.app.startCustomSession(invalid);
    }, `startCustomSession crashed on type: ${typeof invalid}`);

    assert.strictEqual(sb.appState.activeSession, null,
      `activeSession should remain null when startCustomSession is given: ${String(invalid)}`);
  }
});

probe('Probe 2.2: startCustomSession([]) gracefully rejects empty array without creating session', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  sb.appState.activeSession = null;

  assert.doesNotThrow(() => {
    sb.app.startCustomSession([]);
  });

  assert.strictEqual(sb.appState.activeSession, null, 'activeSession must not be initialized for empty array');
});

probe('Probe 2.3: startCustomSession creates valid custom session on valid card array', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  const customCards = [
    { question: 'Custom Q1', answer: 'Custom A1' },
    { question: 'Custom Q2', answer: 'Custom A2' }
  ];

  sb.app.startCustomSession(customCards);

  assert.ok(sb.appState.activeSession, 'activeSession must be created');
  assert.strictEqual(sb.appState.activeSession.courseId, 'custom');
  assert.strictEqual(sb.appState.activeSession.deckId, 'custom');
  assert.strictEqual(sb.appState.activeSession.queue.length, 2);
  assert.strictEqual(sb.appState.activeSession.currentIndex, 0);
  assert.strictEqual(sb.appState.activeScreen, 'study');
});

probe('Probe 2.4: Rating cards in custom session does NOT leak into ANY of the 4 courses', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  const snapshotBefore = JSON.stringify(sb.purchasedCourses);

  sb.app.startCustomSession([
    { question: 'Custom Q1', answer: 'Custom A1' },
    { question: 'Custom Q2', answer: 'Custom A2' }
  ]);

  sb.app.rateCard(3);
  sb.app.rateCard(4);

  const snapshotAfter = JSON.stringify(sb.purchasedCourses);
  assert.strictEqual(snapshotAfter, snapshotBefore,
    'Custom session rating must leave all 4 purchased courses completely unmodified!');
});

// -----------------------------------------------------------------------------
// SECTION 3: rateCard ISOLATION, RATING 1 INVARIANTS & FSRS SYNC
// -----------------------------------------------------------------------------
console.log('\n▶ Section 3: rateCard Isolation, Rating Invariants & FSRS Sync');

probe('Probe 3.1: rateCard with activeSession === null does not mutate state or throw', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  sb.appState.activeSession = null;
  const snapshotBefore = JSON.stringify(sb.purchasedCourses);

  for (const rating of [1, 2, 3, 4, 999, 'bad']) {
    assert.doesNotThrow(() => {
      sb.app.rateCard(rating);
    });
  }

  const snapshotAfter = JSON.stringify(sb.purchasedCourses);
  assert.strictEqual(snapshotAfter, snapshotBefore,
    'rateCard without activeSession must not mutate any course data!');
});

probe('Probe 3.2: rateCard with invalid courseId or deckId does not leak into Cardiology', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  const cardioBefore = JSON.stringify(sb.purchasedCourses.find(c => c.id === 'cardiology'));

  sb.appState.activeSession = {
    courseId: 'non-existent-course-xyz',
    deckId: 'non-existent-deck-abc',
    queue: [{ id: 'fake-1', question: 'q', answer: 'a' }],
    currentIndex: 0,
    reviewsCount: 0,
    correctCount: 0
  };

  assert.doesNotThrow(() => {
    sb.app.rateCard(3);
  });

  const cardioAfter = JSON.stringify(sb.purchasedCourses.find(c => c.id === 'cardiology'));
  assert.strictEqual(cardioAfter, cardioBefore,
    'Unmatched session courseId must never leak into or mutate Cardiology!');
});

probe('Probe 3.3: rateCard(1) ("Again") does NOT decrement deck.due count', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');

  const deck = sb.purchasedCourses[0].decks[0];
  const initialDue = deck.due;

  // Rate first card as "Again" (rating 1)
  sb.app.rateCard(1);

  assert.strictEqual(deck.due, initialDue,
    `deck.due should NOT decrement on rating 1! Was ${initialDue}, got ${deck.due}`);
});

probe('Probe 3.4: 50 consecutive rateCard(1) ("Again") calls do NOT drain deck.due', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');

  const deck = sb.purchasedCourses[0].decks[0];
  const initialDue = deck.due;

  for (let i = 0; i < 50; i++) {
    sb.app.rateCard(1);
  }

  assert.strictEqual(deck.due, initialDue,
    `50 failed (Again) ratings must preserve deck.due unchanged (expected ${initialDue}, got ${deck.due})`);
});

probe('Probe 3.5: Ratings 2, 3, 4 decrement deck.due and clamp at zero without going negative', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');

  const deck = sb.purchasedCourses[0].decks[0];
  const initialDue = deck.due; // 12

  // Rate 5 cards as Hard (2), 5 as Good (3), 5 as Easy (4)
  for (let i = 0; i < 5; i++) sb.app.rateCard(2);
  assert.strictEqual(deck.due, initialDue - 5);

  for (let i = 0; i < 5; i++) sb.app.rateCard(3);
  assert.strictEqual(deck.due, initialDue - 10);

  // Remaining due is 2; rating 10 more times should clamp cleanly at 0
  for (let i = 0; i < 10; i++) sb.app.rateCard(4);
  assert.strictEqual(deck.due, 0, 'deck.due must be clamped at 0');
});

probe('Probe 3.6: Recycled card stability synchronizes back to source deck.cardsList', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');

  const deck = sb.purchasedCourses[0].decks[0];
  const srcCard0 = deck.cardsList[0];

  // Card 0 fails with rating 1 (Again) -> recycled to end of queue
  sb.app.rateCard(1);
  assert.strictEqual(srcCard0.lastRating, 1, 'Source card lastRating must be 1');
  assert.strictEqual(srcCard0.stability, 0.4, 'Source card stability must be 0.4');

  // Card 1 succeeds with rating 3 (Good)
  sb.app.rateCard(3);

  // Recycled Card 0 is re-tested and passes with rating 3 (Good)
  sb.app.rateCard(3);

  assert.strictEqual(srcCard0.lastRating, 3, 'Source card lastRating should update to 3 after repeat');
  assert.strictEqual(srcCard0.stability, 2.5, 'Source card stability should update to 2.5 after repeat');
});

probe('Probe 3.7: Queue exhaustion transitions cleanly to results screen without exception', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');

  // cardio-ecg deck has 2 cards in mock
  sb.app.rateCard(3); // Card 1
  assert.strictEqual(sb.appState.activeScreen, 'study');
  
  sb.app.rateCard(3); // Card 2 -> session ends
  assert.strictEqual(sb.appState.activeScreen, 'results');
});

// -----------------------------------------------------------------------------
// SECTION 4: RESULTS SCREEN METRICS & SESSION REPLAY MECHANICS
// -----------------------------------------------------------------------------
console.log('\n▶ Section 4: Results Screen Dynamic Metrics & Session Replay');

probe('Probe 4.1: Results screen metrics dynamically compute 100% accuracy', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');

  // Rate all 2 cards as Good (3)
  sb.app.rateCard(3);
  sb.app.rateCard(3);

  assert.strictEqual(sb.appState.activeScreen, 'results');
  const reviewedText = sb.dom.getElementById('resCardsReviewed').textContent.trim();
  const accuracyText = sb.dom.getElementById('resAccuracy').textContent.trim();

  const reviewedNum = parseInt(toLatin(reviewedText), 10);
  assert.strictEqual(reviewedNum, 2, `Cards reviewed must be 2, got: ${reviewedText}`);
  assert.ok(toLatin(accuracyText).includes('100') || accuracyText.includes('۱۰۰'), `Accuracy must include 100%, got: ${accuracyText}`);
});

probe('Probe 4.2: Results screen metrics dynamically compute partial accuracy (67%) on recycled cards', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');

  // 1 failed (Again), 1 Good, then recycled card Good -> 3 reviews, 2 correct = 67%
  sb.app.rateCard(1); // incorrect
  sb.app.rateCard(3); // correct
  sb.app.rateCard(3); // correct

  assert.strictEqual(sb.appState.activeScreen, 'results');
  const reviewedText = sb.dom.getElementById('resCardsReviewed').textContent.trim();
  const accuracyText = sb.dom.getElementById('resAccuracy').textContent.trim();

  const reviewedNum = parseInt(toLatin(reviewedText), 10);
  assert.strictEqual(reviewedNum, 3, `Cards reviewed must be 3, got: ${reviewedText}`);
  assert.ok(toLatin(accuracyText).includes('67') || accuracyText.includes('۶۷'), `Accuracy must be 67%, got: ${accuracyText}`);
});

probe('Probe 4.3: renderResults handles 0 reviews gracefully without producing NaN', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  sb.appState.activeSession = {
    reviewsCount: 0,
    correctCount: 0,
    startTime: Date.now()
  };

  assert.doesNotThrow(() => {
    sb.app.renderResults();
  });

  const accuracyText = sb.dom.getElementById('resAccuracy').textContent.trim();
  assert.ok(!accuracyText.includes('NaN'), `Accuracy must not be NaN, got: ${accuracyText}`);
  assert.ok(accuracyText.includes('0') || accuracyText.includes('۰'), `Accuracy for 0 reviews should be 0%, got: ${accuracyText}`);
});

probe('Probe 4.4: restartCurrentSession() re-queues cards and re-enters study room', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');

  // Complete session
  sb.app.rateCard(3);
  sb.app.rateCard(3);
  assert.strictEqual(sb.appState.activeScreen, 'results');

  // Click restart button
  sb.app.restartCurrentSession();

  assert.strictEqual(sb.appState.activeScreen, 'study', 'Screen must return to study');
  assert.strictEqual(sb.appState.activeSession.currentIndex, 0, 'currentIndex must be reset to 0');
  assert.strictEqual(sb.appState.activeSession.reviewsCount, 0, 'reviewsCount must be reset to 0');
  assert.strictEqual(sb.appState.activeSession.queue.length, 2, 'queue must contain fresh deck cards');

  // Can rate card 0 without prematurely returning to results
  sb.app.rateCard(3);
  assert.strictEqual(sb.appState.activeScreen, 'study', 'Screen must still be study on first card of restarted session');
  assert.strictEqual(sb.appState.activeSession.currentIndex, 1, 'currentIndex must advance to 1');
});

probe('Probe 4.5: showScreen("study") on exhausted session resets currentIndex to 0', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');

  sb.app.rateCard(3);
  sb.app.rateCard(3);
  assert.strictEqual(sb.appState.activeScreen, 'results');

  // Directly navigate to study screen
  sb.app.showScreen('study');

  assert.strictEqual(sb.appState.activeScreen, 'study');
  assert.strictEqual(sb.appState.activeSession.currentIndex, 0, 'currentIndex should be reset to 0');

  // Rating first card advances to 1 rather than ejecting to results
  sb.app.rateCard(3);
  assert.strictEqual(sb.appState.activeScreen, 'study');
  assert.strictEqual(sb.appState.activeSession.currentIndex, 1);
});

// -----------------------------------------------------------------------------
// SECTION 5: FULL E2E CLINICAL LIFECYCLE STRESS RUN
// -----------------------------------------------------------------------------
console.log('\n▶ Section 5: Full E2E Clinical Workflow Lifecycle Stress Run');

probe('Probe 5.1: Complete End-to-End Medical Student Lifecycle with Live Sync', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);

  // 1. Initial State: User starts at Platform Hub
  sb.app.backToPlatform();
  assert.strictEqual(sb.appState.activeScreen, 'platform-hub');
  const hubCardsInitial = sb.dom.querySelectorAll('#platformCoursesContainer .platform-course-card');
  assert.strictEqual(hubCardsInitial.length, 4);

  // 2. Open Pulmonology module from Platform Hub
  sb.app.openCardsModule('pulmonology');
  assert.strictEqual(sb.appState.activeModule, 'flashcards');
  assert.strictEqual(sb.appState.activeScreen, 'dashboard');
  assert.strictEqual(sb.appState.activeCourseFilter, 'pulmonology');

  // 3. Start Pulmonology COPD Deck Study
  sb.app.startDeckStudy('pulmonology', 'pulmo-copd');
  assert.strictEqual(sb.appState.activeScreen, 'study');
  assert.strictEqual(sb.appState.activeSession.deckTitle, 'بیماری‌های انسدادی ریه (COPD و آسم)');

  // 4. Rate cards: First fails (Again), second passes (Good), repeated passes (Easy)
  sb.app.rateCard(1); // Fail card 0 -> queue expands
  sb.app.rateCard(3); // Pass card 1
  sb.app.rateCard(4); // Pass card 0 repeat -> session finishes

  // 5. Results Screen Verification
  assert.strictEqual(sb.appState.activeScreen, 'results');
  const rev = parseInt(toLatin(sb.dom.getElementById('resCardsReviewed').textContent), 10);
  assert.strictEqual(rev, 3, 'Reviewed count must be 3');

  // 6. Return to Platform Hub
  sb.app.backToPlatform();
  assert.strictEqual(sb.appState.activeScreen, 'platform-hub');
  assert.strictEqual(sb.appState.activeModule, 'platform-hub');

  // 7. Verify Pulmonology Card reflects updated live metrics in Hub DOM
  const pulmoCard = sb.dom.querySelector('.platform-course-card[data-course-id="pulmonology"]');
  assert.ok(pulmoCard);
  const dueEl = pulmoCard.querySelector('.p-metric-val.text-danger');
  const liveDue = parseInt(toLatin(dueEl.textContent), 10);
  const pulmoModel = sb.purchasedCourses.find(c => c.id === 'pulmonology');
  assert.strictEqual(liveDue, pulmoModel.due, 'Hub DOM live due must match data model');

  // 8. Verify other courses remained isolated
  const cardioModel = sb.purchasedCourses.find(c => c.id === 'cardiology');
  assert.strictEqual(cardioModel.due, 30, 'Cardiology due should remain intact at 30');
});

// -----------------------------------------------------------------------------
// SECTION 6: PROTOTYPE POLLUTION, DEEP INVARIANTS & NUMERIC INTEGRITY
// -----------------------------------------------------------------------------
console.log('\n▶ Section 6: Prototype Pollution, Deep Invariants & Numeric Integrity');

probe('Probe 6.1: Prototype pollution attacks do not alter Object.prototype', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  
  sb.app.recalculateCourseStats('__proto__');
  sb.app.startCustomSession([{ __proto__: { injected: 'malicious' } }]);
  sb.app.rateCard(3);

  assert.strictEqual(Object.prototype.injected, undefined, 'Object.prototype must not be polluted');
  assert.strictEqual({}.injected, undefined, 'Empty object must not have injected prototype property');
});

probe('Probe 6.2: 250 Rapid interleaved ratings preserve course mathematical invariants', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  const courses = ['cardiology', 'pharmacology', 'pulmonology', 'pediatrics'];

  for (let step = 0; step < 250; step++) {
    const cId = courses[step % 4];
    sb.app.startDeckStudy(cId);
    sb.app.rateCard((step % 4) + 1);
  }

  for (const c of sb.purchasedCourses) {
    const sumDue = c.decks.reduce((s, d) => s + (d.due || 0), 0);
    const sumOverdue = c.decks.reduce((s, d) => s + (d.overdue || 0), 0);
    const sumCards = c.decks.reduce((s, d) => s + (d.cards || 0), 0);
    const avgProg = Math.round(c.decks.reduce((s, d) => s + (d.progress || 0), 0) / c.decks.length);

    assert.strictEqual(c.due, sumDue, `Course ${c.id} due must equal sum of decks`);
    assert.strictEqual(c.overdue, sumOverdue, `Course ${c.id} overdue must equal sum of decks`);
    assert.strictEqual(c.totalCards, sumCards, `Course ${c.id} totalCards must equal sum of decks`);
    assert.strictEqual(c.progress, avgProg, `Course ${c.id} progress must equal avg of decks`);
    assert.ok(c.due >= 0, `Course ${c.id} due must be >= 0`);
    assert.ok(c.progress >= 0 && c.progress <= 100, `Course ${c.id} progress must be within [0, 100]`);
  }
});

probe('Probe 6.3: Malformed card objects inside custom session do not throw on flip or rate', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);
  const malformedCards = [
    {},
    { id: null },
    { question: '', answer: '' },
    { scenario: 12345 },
    { pearl: null, badge: undefined }
  ];

  sb.app.startCustomSession(malformedCards);
  assert.strictEqual(sb.appState.activeScreen, 'study');

  for (let i = 0; i < malformedCards.length; i++) {
    assert.doesNotThrow(() => {
      sb.app.toggleCardFlip();
      sb.app.toggleCardFlip();
      sb.app.rateCard(3);
    }, `Failed processing malformed card at index ${i}`);
  }

  assert.strictEqual(sb.appState.activeScreen, 'results');
});

probe('Probe 6.4: toPersianDigits handles all numeric forms, boundaries, and types', () => {
  const sb = createSandbox(HTML_PATH, APP_JS_PATH);

  assert.strictEqual(sb.app.toPersianDigits(null), '');
  assert.strictEqual(sb.app.toPersianDigits(undefined), '');
  assert.strictEqual(sb.app.toPersianDigits(0), '۰');
  assert.strictEqual(sb.app.toPersianDigits(1234567890), '۱۲۳۴۵۶۷۸۹۰');
  assert.strictEqual(sb.app.toPersianDigits(-18), '-۱۸');
  assert.strictEqual(sb.app.toPersianDigits('Card 42'), 'Card ۴۲');
});

// -----------------------------------------------------------------------------
// SUMMARY & VERDICT
// -----------------------------------------------------------------------------
console.log('\n========================================================================');
console.log(`  📊 CHALLENGER M1 ITERATION 2 RESULTS: ${passedTests}/${totalTests} PASSED`);
if (failedTests > 0) {
  console.log(`  ❌ FAILURES ENCOUNTERED: ${failedTests}`);
  for (const f of failures) {
    console.log(`    - ${f.title}: ${f.error.message}`);
  }
} else {
  console.log('  ✅ ALL ADVERSARIAL STRESS PROBES PASSED WITH ZERO FAILURES');
}
console.log('========================================================================');

process.exit(failedTests > 0 ? 1 : 0);

