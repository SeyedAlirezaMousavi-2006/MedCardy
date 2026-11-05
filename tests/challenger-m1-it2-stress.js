/**
 * Challenger M1 Iteration 2 - Adversarial Stress & Verification Harness
 * Focus areas:
 *  1. Rating 1 ("Again") due count guards & queue recycling
 *  2. Session lifecycle, accuracy calculation & Persian digits
 *  3. Replay functionality, restartCurrentSession & DOM interactions
 *  4. Boundary and hostile stress testing
 */

const assert = require('node:assert');
const path = require('node:path');
const { createSandbox } = require('./dom-harness.js');

const HTML_PATH = path.resolve(__dirname, '../index.html');
const JS_PATH = path.resolve(__dirname, '../js/app.js');

let passCount = 0;
let failCount = 0;
const testResults = [];

function probe(name, fn) {
  process.stdout.write(`  ⚡ Probing: ${name} ... `);
  try {
    fn();
    passCount++;
    testResults.push({ name, status: 'PASSED' });
    console.log('\x1b[32mPASSED\x1b[0m');
  } catch (err) {
    failCount++;
    testResults.push({ name, status: 'FAILED', error: err.message });
    console.log('\x1b[31mFAILED\x1b[0m');
    console.error(`     💥 Error: ${err.message}`);
    if (err.stack) {
      const relevantStack = err.stack.split('\n').slice(1, 3).join('\n');
      console.error(`     ${relevantStack}`);
    }
  }
}

console.log('\n========================================================================');
console.log('  ⚔️  CHALLENGER M1 ITERATION 2: ADVERSARIAL STRESS TEST SUITE');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// SECTION 1: Rating 1 ("Again") Due Count Guards & Queue Recycling
// -----------------------------------------------------------------------------
console.log('▶ SECTION 1: Rating 1 ("Again") Due Count Guards & Queue Recycling');

probe('1.1: 50 consecutive Again ratings on Cardio ECG strictly preserves due count (zero decrements)', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');
  const deck = sb.purchasedCourses[0].decks[0];
  const initialDue = deck.due; // 12
  const initialCourseDue = sb.purchasedCourses[0].due; // 30

  assert.strictEqual(initialDue, 12, 'Cardio ECG initial due should be 12');

  for (let i = 0; i < 50; i++) {
    sb.app.rateCard(1);
    assert.strictEqual(deck.due, 12, `Deck due must remain 12 after ${i + 1} Again ratings`);
    assert.strictEqual(sb.purchasedCourses[0].due, initialCourseDue, `Course due must remain unchanged after ${i + 1} Again ratings`);
  }

  assert.strictEqual(deck.due, initialDue, 'Final deck due must match initial due');
  assert.strictEqual(sb.appState.activeSession.queue.length, 2 + 50, 'Queue must expand by 50 cards');
  assert.strictEqual(sb.appState.activeSession.reviewsCount, 50, 'Reviews count must be 50');
  assert.strictEqual(sb.appState.activeSession.correctCount, 0, 'Correct count must be 0 for rating 1');
});

probe('1.2: Failed card stability is set to 0.4 on currentCard and deck.cardsList source', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');
  const deck = sb.purchasedCourses[0].decks[0];
  const cardId = deck.cardsList[0].id;

  sb.app.rateCard(1); // Rate Card 0 with Again

  const srcCard = deck.cardsList.find(c => c.id === cardId);
  assert.ok(srcCard, 'Source card in deck.cardsList must exist');
  assert.strictEqual(srcCard.lastRating, 1, 'Source card lastRating must be 1');
  assert.strictEqual(srcCard.stability, 0.4, 'Source card stability must be 0.4');
});

probe('1.3: Card fsrsReviews increment invariant (single rating must increment fsrsReviews by exactly 1)', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');
  const deck = sb.purchasedCourses[0].decks[0];
  const cardId = deck.cardsList[0].id;
  const initialReviews = deck.cardsList[0].fsrsReviews || 0;

  sb.app.rateCard(3); // Single Good rating

  const srcCard = deck.cardsList.find(c => c.id === cardId);
  assert.strictEqual(srcCard.fsrsReviews, initialReviews + 1, `fsrsReviews should increment by 1 (was ${initialReviews}, became ${srcCard.fsrsReviews})`);
});

probe('1.4: Passing a previously failed card decrements due by 1 and updates stability to passing value', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');
  const deck = sb.purchasedCourses[0].decks[0];
  const initialDue = deck.due; // 12

  // Queue starts with 2 cards [Card0, Card1]
  sb.app.rateCard(1); // Card0 failed -> queue is [Card0, Card1, Card0_clone] -> due still 12
  assert.strictEqual(deck.due, initialDue);

  sb.app.rateCard(3); // Card1 passed -> due decrements to 11
  assert.strictEqual(deck.due, initialDue - 1);

  sb.app.rateCard(4); // Card0_clone passed -> due decrements to 10
  assert.strictEqual(deck.due, initialDue - 2);

  // Deck cardsList for Card0 should now reflect rating 4 (stability 4.0)
  assert.strictEqual(deck.cardsList[0].lastRating, 4);
  assert.strictEqual(deck.cardsList[0].stability, 4.0);
});

probe('1.5: Deck due underflow guard: due count never decrements below 0 even under excessive passing ratings', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');
  const deck = sb.purchasedCourses[0].decks[0];

  deck.due = 1;
  sb.app.recalculateCourseStats('cardiology');

  // Rate 3 (Good): due becomes 0
  sb.app.rateCard(3);
  assert.strictEqual(deck.due, 0, 'Due should decrement to 0');

  // Now rate 20 more passing ratings on recycled cards or fresh session
  for (let i = 0; i < 20; i++) {
    if (sb.appState.activeScreen === 'results') {
      sb.app.restartCurrentSession();
    }
    sb.app.rateCard(3);
    assert.strictEqual(deck.due, 0, `Due must never be negative (was ${deck.due} at iteration ${i})`);
    assert.ok(deck.due >= 0, 'Due invariant >= 0 strictly preserved');
  }
});

probe('1.6: Rating 2 (Hard) decrements due count but does NOT increment progress', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');
  const deck = sb.purchasedCourses[0].decks[0];
  const initialDue = deck.due;
  const initialProgress = deck.progress;

  sb.app.rateCard(2); // Hard

  assert.strictEqual(deck.due, initialDue - 1, 'Rating 2 must decrement due count');
  assert.strictEqual(deck.progress, initialProgress, 'Rating 2 must NOT increment progress');
});

// -----------------------------------------------------------------------------
// SECTION 2: Accuracy Calculation & Persian Digits Formatting
// -----------------------------------------------------------------------------
console.log('\n▶ SECTION 2: Accuracy Calculation & Persian Digits Formatting');

probe('2.1: toPersianDigits formats all digits 0-9 to Persian digits correctly', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  const fn = sb.app.toPersianDigits.bind(sb.app);

  assert.strictEqual(fn(0), '۰');
  assert.strictEqual(fn(1234567890), '۱۲۳۴۵۶۷۸۹۰');
  assert.strictEqual(fn('Card 4 of 12'), 'Card ۴ of ۱۲');
  assert.strictEqual(fn('14:20'), '۱۴:۲۰');
  assert.strictEqual(fn(null), '');
  assert.strictEqual(fn(undefined), '');
  assert.strictEqual(fn(''), '');
  assert.strictEqual(fn(-18), '-۱۸');
});

probe('2.2: Mixed ratings session [1, 2, 3, 4] correctly calculates correctCount / totalReviews (50%)', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  const customCards = [
    { id: 'c1', question: 'Q1', answer: 'A1' },
    { id: 'c2', question: 'Q2', answer: 'A2' },
    { id: 'c3', question: 'Q3', answer: 'A3' }
  ];
  sb.app.startCustomSession(customCards);

  // Review 1: Card 1 -> Rating 1 (Again, not correct) -> card appended, queue length becomes 4
  sb.app.rateCard(1);
  // Review 2: Card 2 -> Rating 2 (Hard, not correct)
  sb.app.rateCard(2);
  // Review 3: Card 3 -> Rating 3 (Good, correct!)
  sb.app.rateCard(3);
  // Review 4: Card 1 (clone) -> Rating 4 (Easy, correct!) -> Session completes!
  sb.app.rateCard(4);

  assert.strictEqual(sb.appState.activeScreen, 'results', 'Must be on results screen');
  const session = sb.appState.activeSession;
  assert.strictEqual(session.reviewsCount, 4, 'Total reviews must be 4');
  assert.strictEqual(session.correctCount, 2, 'Correct count must be 2 (only ratings 3 and 4)');

  const expectedAccuracy = Math.round((2 / 4) * 100); // 50%
  assert.strictEqual(expectedAccuracy, 50);

  const resReviewed = sb.dom.getElementById('resCardsReviewed');
  assert.ok(resReviewed, '#resCardsReviewed must exist in DOM');
  assert.strictEqual(resReviewed.textContent, '۴', 'resCardsReviewed must display Persian "۴"');
});

probe('2.3: #resAccuracy renders in Persian digits format (e.g. "۵۰٪", not ASCII "50٪")', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  const customCards = [
    { id: 'c1', question: 'Q1', answer: 'A1' },
    { id: 'c2', question: 'Q2', answer: 'A2' }
  ];
  sb.app.startCustomSession(customCards);
  sb.app.rateCard(2); // Hard (incorrect)
  sb.app.rateCard(3); // Good (correct) -> 1/2 = 50%

  const resAccuracy = sb.dom.getElementById('resAccuracy');
  assert.ok(resAccuracy, '#resAccuracy must exist in DOM');
  assert.strictEqual(resAccuracy.textContent, '۵۰٪', `resAccuracy must display Persian "۵۰٪", got "${resAccuracy.textContent}"`);
});

probe('2.4: 100% correct session shows Persian "۱۰۰٪" in #resAccuracy', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');
  sb.app.rateCard(3);
  sb.app.rateCard(4);

  assert.strictEqual(sb.appState.activeScreen, 'results');
  assert.strictEqual(sb.dom.getElementById('resCardsReviewed').textContent, '۲');
  assert.strictEqual(sb.dom.getElementById('resAccuracy').textContent, '۱۰۰٪');
});

probe('2.5: Calling app.showScreen("results") with null session does not throw', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  sb.appState.activeSession = null;
  assert.doesNotThrow(() => {
    sb.app.showScreen('results');
  });
  assert.strictEqual(sb.appState.activeScreen, 'results');
});

probe('2.6: Study time in DOM is formatted in Persian MM:SS', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');
  sb.appState.activeSession.startTime = Date.now() - 125000; // 125 sec -> 02:05
  sb.app.rateCard(3);
  sb.app.rateCard(3);

  const timeEl = sb.dom.getElementById('resStudyTime');
  assert.ok(timeEl, '#resStudyTime must exist');
  assert.strictEqual(timeEl.textContent, '۰۲:۰۵', `Expected ۰۲:۰۵, got ${timeEl.textContent}`);
});

// -----------------------------------------------------------------------------
// SECTION 3: Replay Functionality & Restart Mechanics
// -----------------------------------------------------------------------------
console.log('\n▶ SECTION 3: Replay Functionality & Restart Mechanics');

probe('3.1: restartCurrentSession restarts deck study cleanly without bouncing', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');
  sb.app.rateCard(3);
  sb.app.rateCard(3);

  assert.strictEqual(sb.appState.activeScreen, 'results', 'Precondition: session completed');

  // Trigger restartCurrentSession
  sb.app.restartCurrentSession();

  assert.strictEqual(sb.appState.activeScreen, 'study', 'Screen must transition back to study');
  assert.strictEqual(sb.appState.activeSession.currentIndex, 0, 'Current index must reset to 0');
  assert.strictEqual(sb.appState.activeSession.reviewsCount, 0, 'Reviews count must reset to 0');
  assert.strictEqual(sb.appState.activeSession.correctCount, 0, 'Correct count must reset to 0');
  assert.strictEqual(sb.appState.activeSession.queue.length, 2, 'Queue must be re-populated with original 2 deck cards');

  // Rating the first card in restarted session must advance to Card 1, NOT eject to results!
  sb.app.rateCard(3);
  assert.strictEqual(sb.appState.activeScreen, 'study', 'Rating card 1 must keep user in study screen');
  assert.strictEqual(sb.appState.activeSession.currentIndex, 1, 'Current index must be 1');

  // Rating the second card completes the session
  sb.app.rateCard(3);
  assert.strictEqual(sb.appState.activeScreen, 'results', 'Second card rating completes session');
});

probe('3.2: Replay button in index.html DOM triggers restartCurrentSession cleanly', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  sb.app.startDeckStudy('pharmacology', 'pharma-abx');
  while (sb.appState.activeScreen === 'study') {
    sb.app.rateCard(3);
  }
  assert.strictEqual(sb.appState.activeScreen, 'results');

  const btns = sb.dom.querySelectorAll('#screen-results button');
  const replayBtn = btns.find(b => b.getAttribute('onclick') && b.getAttribute('onclick').includes('restartCurrentSession'));
  assert.ok(replayBtn, 'Replay button with restartCurrentSession must exist in #screen-results');

  // Execute onclick
  const onclickStr = replayBtn.getAttribute('onclick');
  sb.evalInContext(onclickStr);

  assert.strictEqual(sb.appState.activeScreen, 'study', 'Executing button onclick must switch to study screen');
  assert.strictEqual(sb.appState.activeSession.courseId, 'pharmacology', 'Session course must be pharmacology');
  assert.strictEqual(sb.appState.activeSession.deckId, 'pharma-abx', 'Session deck must be pharma-abx');
  assert.strictEqual(sb.appState.activeSession.currentIndex, 0);
});

probe('3.3: Replay on custom study session re-queues custom cards', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  const customCards = [
    { id: 'cust-1', question: 'Q1', answer: 'A1' },
    { id: 'cust-2', question: 'Q2', answer: 'A2' }
  ];
  sb.app.startCustomSession(customCards);
  sb.app.rateCard(4);
  sb.app.rateCard(4);
  assert.strictEqual(sb.appState.activeScreen, 'results');

  sb.app.restartCurrentSession();

  assert.strictEqual(sb.appState.activeScreen, 'study');
  assert.strictEqual(sb.appState.activeSession.courseId, 'custom');
  assert.strictEqual(sb.appState.activeSession.queue.length, 2);
  assert.strictEqual(sb.appState.activeSession.currentIndex, 0);
});

probe('3.4: showScreen("study") resets currentIndex to 0 if queue was exhausted', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');
  sb.app.rateCard(3);
  sb.app.rateCard(3);
  assert.strictEqual(sb.appState.activeScreen, 'results');

  // User manually switches screen to study
  sb.app.showScreen('study');
  assert.strictEqual(sb.appState.activeScreen, 'study');
  assert.strictEqual(sb.appState.activeSession.currentIndex, 0, 'Exhausted queue must reset currentIndex to 0');
});

probe('3.5: 20-cycle consecutive session restart stress test preserves data integrity', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  sb.app.startDeckStudy('pulmonology', 'pulmo-asthma');

  for (let cycle = 0; cycle < 20; cycle++) {
    while (sb.appState.activeScreen === 'study') {
      sb.app.rateCard(cycle % 2 === 0 ? 3 : 4);
    }
    assert.strictEqual(sb.appState.activeScreen, 'results');
    sb.app.restartCurrentSession();
    assert.strictEqual(sb.appState.activeScreen, 'study');
    assert.strictEqual(sb.appState.activeSession.currentIndex, 0);
  }
});

// -----------------------------------------------------------------------------
// SECTION 4: Boundary & Hostile Input Resilience
// -----------------------------------------------------------------------------
console.log('\n▶ SECTION 4: Boundary & Hostile Input Resilience');

probe('4.1: Calling rateCard when activeSession is null does not crash or mutate any deck', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  sb.appState.activeSession = null;
  const originalState = JSON.stringify(sb.purchasedCourses);

  assert.doesNotThrow(() => {
    sb.app.rateCard(3);
    sb.app.rateCard(1);
  });

  assert.strictEqual(JSON.stringify(sb.purchasedCourses), originalState, 'Purchased courses must be unaltered');
});

probe('4.2: Hostile rating arguments (strings, NaN, floats, negative) fall back safely', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');

  assert.doesNotThrow(() => {
    sb.app.rateCard('invalid'); // numericRating defaults to 3
  });
  assert.strictEqual(sb.appState.activeSession.reviewsCount, 1);
  assert.strictEqual(sb.appState.activeSession.correctCount, 1);

  assert.doesNotThrow(() => {
    sb.app.rateCard(-5); // numericRating = -5 (< 2, so due does not decrement)
  });
  assert.strictEqual(sb.appState.activeSession.reviewsCount, 2);
});

probe('4.3: startCustomSession with non-array arguments aborts cleanly without throwing', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);

  assert.doesNotThrow(() => {
    sb.app.startCustomSession(12345);
    sb.app.startCustomSession('string');
    sb.app.startCustomSession({});
    sb.app.startCustomSession(null);
    sb.app.startCustomSession(undefined);
    sb.app.startCustomSession([]);
  });
});

probe('4.4: Cross-course isolation during repeated failure and restart blitz', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  const pharma = sb.purchasedCourses.find(c => c.id === 'pharmacology');
  const pulmo = sb.purchasedCourses.find(c => c.id === 'pulmonology');
  const peds = sb.purchasedCourses.find(c => c.id === 'pediatrics');

  const pharmaSnapshot = JSON.stringify(pharma);
  const pulmoSnapshot = JSON.stringify(pulmo);
  const pedsSnapshot = JSON.stringify(peds);

  sb.app.startDeckStudy('cardiology', 'cardio-ecg');
  for (let i = 0; i < 30; i++) {
    sb.app.rateCard(1);
  }
  sb.app.restartCurrentSession();
  sb.app.rateCard(3);
  sb.app.rateCard(3);

  assert.strictEqual(JSON.stringify(pharma), pharmaSnapshot, 'Pharmacology must remain untouched');
  assert.strictEqual(JSON.stringify(pulmo), pulmoSnapshot, 'Pulmonology must remain untouched');
  assert.strictEqual(JSON.stringify(peds), pedsSnapshot, 'Pediatrics must remain untouched');
});

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n========================================================================');
console.log(`  📊 ADVERSARIAL STRESS TEST SUMMARY: ${passCount}/${passCount + failCount} PASSED`);
if (failCount === 0) {
  console.log('  ✅ ALL ADVERSARIAL CHALLENGES PASSED EMPIRICALLY WITH ZERO DEFECTS');
} else {
  console.log(`  ❌ ${failCount} CHALLENGE(S) FAILED:`);
  testResults.filter(t => t.status === 'FAILED').forEach(t => {
    console.log(`     - ${t.name}: ${t.error}`);
  });
}
console.log('========================================================================\n');

process.exit(failCount > 0 ? 1 : 0);
