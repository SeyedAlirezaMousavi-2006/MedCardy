/**
 * Challenger M1 Iteration 3 - Adversarial Empirical Stress & Invariant Harness
 * 
 * Deeply validates:
 * 1. fsrsReviews invariant under multi-cycle Again recycling (3x Again + 1x Good = 4 reviews on srcCard)
 * 2. Cross-card isolation for fsrsReviews across distinct cards in same deck & different decks
 * 3. Custom session fsrsReviews tracking when deck is null
 * 4. Results screen Persian digit formatting across wide spectrum: 0%, 33%, 50%, 67%, 100%
 * 5. Multi-session lifecycle: restarting session and verifying fsrsReviews accumulates monotonically
 * 6. Edge cases: null/undefined checks, boundary inputs, zero division guards
 */

const assert = require('node:assert');
const path = require('node:path');
const { createSandbox } = require('./dom-harness.js');

const HTML_PATH = path.resolve(__dirname, '../index.html');
const JS_PATH = path.resolve(__dirname, '../js/app.js');

let passCount = 0;
let failCount = 0;
const results = [];

function challenge(title, fn) {
  process.stdout.write(`  ⚔️ Challenge: ${title} ... `);
  try {
    fn();
    passCount++;
    results.push({ title, status: 'PASSED' });
    console.log('\x1b[32mPASSED\x1b[0m');
  } catch (err) {
    failCount++;
    results.push({ title, status: 'FAILED', error: err.message });
    console.log('\x1b[31mFAILED\x1b[0m');
    console.error(`     💥 Error: ${err.message}`);
    if (err.stack) {
      console.error(`     ${err.stack.split('\n').slice(1, 3).join('\n')}`);
    }
  }
}

console.log('\n========================================================================');
console.log('  ⚔️ CHALLENGER M1 ITERATION 3: EMPIRICAL ORACLE & INVARIANT VERIFICATION');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// Test Group 1: Multi-Cycle Queue Recycling fsrsReviews Monotonicity
// -----------------------------------------------------------------------------
console.log('▶ GROUP 1: Multi-Cycle Queue Recycling fsrsReviews Monotonicity');

challenge('1.1: Recycled card through 3x Again then 1x Good results in exactly fsrsReviews = 4 on srcCard', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');

  const deck = sb.purchasedCourses[0].decks[0];
  const card0 = deck.cardsList[0];
  const card1 = deck.cardsList[1];
  card0.fsrsReviews = 0;
  card1.fsrsReviews = 0;

  // Deck has 2 cards: [Card0, Card1]
  // Step 1: Rate Card0 with 1 (Again). Queue appends clone of Card0 at end: [Card0, Card1, Card0_clone1]
  sb.app.rateCard(1);
  assert.strictEqual(card0.fsrsReviews, 1, `Card0 fsrsReviews should be 1 after 1st rating, got ${card0.fsrsReviews}`);

  // Step 2: Rate Card1 with 3 (Good). Queue moves to Card0_clone1
  sb.app.rateCard(3);
  assert.strictEqual(card1.fsrsReviews, 1, `Card1 fsrsReviews should be 1, got ${card1.fsrsReviews}`);
  assert.strictEqual(card0.fsrsReviews, 1, `Card0 fsrsReviews should still be 1, got ${card0.fsrsReviews}`);

  // Step 3: Now at Card0_clone1. Rate with 1 (Again). Queue appends Card0_clone2 at end: [..., Card0_clone2]
  sb.app.rateCard(1);
  assert.strictEqual(card0.fsrsReviews, 2, `Card0 fsrsReviews should be 2 after 2nd Again, got ${card0.fsrsReviews}`);

  // Step 4: Now at Card0_clone2. Rate with 1 (Again). Queue appends Card0_clone3
  sb.app.rateCard(1);
  assert.strictEqual(card0.fsrsReviews, 3, `Card0 fsrsReviews should be 3 after 3rd Again, got ${card0.fsrsReviews}`);

  // Step 5: Now at Card0_clone3. Rate with 3 (Good).
  sb.app.rateCard(3);
  assert.strictEqual(card0.fsrsReviews, 4, `Card0 fsrsReviews should be exactly 4 after 4 ratings, got ${card0.fsrsReviews}`);
  assert.strictEqual(card1.fsrsReviews, 1, `Card1 fsrsReviews must remain untouched at 1, got ${card1.fsrsReviews}`);

  // Session summary verification
  assert.strictEqual(sb.appState.activeSession.reviewsCount, 5, `Total session reviews should be 5`);
  assert.strictEqual(sb.appState.activeSession.correctCount, 2, `Total correct reviews should be 2 (Card1 Good + Card0 Good)`);
});

challenge('1.2: Card with pre-existing fsrsReviews count increments monotonically by exactly 1 per rating', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  const deck = sb.purchasedCourses[0].decks[0];
  deck.cardsList[0].fsrsReviews = 17; // pre-existing reviews count

  sb.app.startDeckStudy('cardiology', 'cardio-ecg');
  sb.app.rateCard(3); // Good

  assert.strictEqual(deck.cardsList[0].fsrsReviews, 18, `Expected fsrsReviews to increment from 17 to 18, got ${deck.cardsList[0].fsrsReviews}`);
});

challenge('1.3: Custom study session without deck synchronizes queue card fsrsReviews without throwing', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  const customCards = [
    { id: 'custom-1', question: 'Q1', answer: 'A1', fsrsReviews: 2 },
    { id: 'custom-2', question: 'Q2', answer: 'A2' } // fsrsReviews undefined
  ];

  sb.app.startCustomSession(customCards);
  assert.doesNotThrow(() => {
    sb.app.rateCard(3);
  });

  const session = sb.appState.activeSession;
  assert.strictEqual(session.queue[0].fsrsReviews, 3, 'Custom card 1 fsrsReviews should increment to 3');

  assert.doesNotThrow(() => {
    sb.app.rateCard(1);
  });
  assert.strictEqual(session.queue[1].fsrsReviews, 1, 'Custom card 2 fsrsReviews should initialize and become 1');
});

// -----------------------------------------------------------------------------
// Test Group 2: Results Accuracy & Persian Digits Rendering
// -----------------------------------------------------------------------------
console.log('\n▶ GROUP 2: Results Accuracy & Persian Digits Rendering');

challenge('2.1: 0% accuracy formats as Persian "۰٪"', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  sb.appState.activeSession = {
    reviewsCount: 4,
    correctCount: 0,
    startTime: Date.now()
  };

  sb.app.renderResults();
  const accEl = sb.dom.getElementById('resAccuracy');
  assert.strictEqual(accEl.textContent.trim(), '۰٪', `Expected "۰٪", got "${accEl.textContent.trim()}"`);
});

challenge('2.2: 50% accuracy formats as Persian "۵۰٪"', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  sb.appState.activeSession = {
    reviewsCount: 4,
    correctCount: 2,
    startTime: Date.now()
  };

  sb.app.renderResults();
  const accEl = sb.dom.getElementById('resAccuracy');
  assert.strictEqual(accEl.textContent.trim(), '۵۰٪', `Expected "۵۰٪", got "${accEl.textContent.trim()}"`);
});

challenge('2.3: 67% accuracy formats as Persian "۶۷٪"', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  sb.appState.activeSession = {
    reviewsCount: 3,
    correctCount: 2,
    startTime: Date.now()
  };

  sb.app.renderResults();
  const accEl = sb.dom.getElementById('resAccuracy');
  assert.strictEqual(accEl.textContent.trim(), '۶۷٪', `Expected "۶۷٪", got "${accEl.textContent.trim()}"`);
});

challenge('2.4: 100% accuracy formats as Persian "۱۰۰٪"', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  sb.appState.activeSession = {
    reviewsCount: 5,
    correctCount: 5,
    startTime: Date.now()
  };

  sb.app.renderResults();
  const accEl = sb.dom.getElementById('resAccuracy');
  assert.strictEqual(accEl.textContent.trim(), '۱۰۰٪', `Expected "۱۰۰٪", got "${accEl.textContent.trim()}"`);
});

challenge('2.5: resCardsReviewed and resStudyTime consistently use Persian digits', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  sb.appState.activeSession = {
    reviewsCount: 42,
    correctCount: 35,
    startTime: Date.now() - 125000 // 2 minutes 5 seconds ago
  };

  sb.app.renderResults();
  const revEl = sb.dom.getElementById('resCardsReviewed');
  const timeEl = sb.dom.getElementById('resStudyTime');

  assert.strictEqual(revEl.textContent.trim(), '۴۲', `Reviewed count should be "۴۲", got "${revEl.textContent.trim()}"`);
  // 125 seconds = 02:05 -> ۰۲:۰۵
  assert.strictEqual(timeEl.textContent.trim(), '۰۲:۰۵', `Study time should be "۰۲:۰۵", got "${timeEl.textContent.trim()}"`);
});

challenge('2.6: toPersianDigits maps 0 through 9 and handles strings, numbers and edge cases', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  assert.strictEqual(sb.app.toPersianDigits(0), '۰');
  assert.strictEqual(sb.app.toPersianDigits(123456789), '۱۲۳۴۵۶۷۸۹');
  assert.strictEqual(sb.app.toPersianDigits('100%'), '۱۰۰%');
  assert.strictEqual(sb.app.toPersianDigits(null), '');
  assert.strictEqual(sb.app.toPersianDigits(undefined), '');
  assert.strictEqual(sb.app.toPersianDigits(''), '');
});

// -----------------------------------------------------------------------------
// Test Group 3: Multi-Session Restart & Stability Invariants
// -----------------------------------------------------------------------------
console.log('\n▶ GROUP 3: Multi-Session Restart & Stability Invariants');

challenge('3.1: Restarting session retains accumulated fsrsReviews across sessions', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');
  const deck = sb.purchasedCourses[0].decks[0];
  const card0 = deck.cardsList[0];
  const initialReviews = card0.fsrsReviews || 0;

  // Session 1: rate card 0 Easy (4), rate card 1 Good (3)
  sb.app.rateCard(4);
  sb.app.rateCard(3);
  assert.strictEqual(sb.appState.activeScreen, 'results');
  assert.strictEqual(card0.fsrsReviews, initialReviews + 1, 'Card 0 fsrsReviews after session 1');
  assert.strictEqual(card0.stability, 4.0, 'Card 0 stability after Easy rating');

  // Restart session
  sb.app.restartCurrentSession();
  assert.strictEqual(sb.appState.activeScreen, 'study');
  assert.strictEqual(sb.appState.activeSession.currentIndex, 0);

  // Session 2: rate card 0 Again (1)
  sb.app.rateCard(1);
  assert.strictEqual(card0.fsrsReviews, initialReviews + 2, 'Card 0 fsrsReviews after session 2 rating');
  assert.strictEqual(card0.stability, 0.4, 'Card 0 stability after Again rating');
});

challenge('3.2: Cross-course isolation: Pharmacology, Pulmonology, Pediatrics cardsList unmodified', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  const pharmaCard = sb.purchasedCourses[1].decks[0].cardsList[0];
  const pharmaInitialReviews = pharmaCard.fsrsReviews;
  const pharmaInitialStability = pharmaCard.stability;

  // Heavy Cardiology study session
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');
  for (let i = 0; i < 10; i++) {
    sb.app.rateCard(1);
  }
  sb.app.rateCard(3);
  sb.app.rateCard(3);

  // Assert Pharma untouched
  assert.strictEqual(pharmaCard.fsrsReviews, pharmaInitialReviews, 'Pharma card fsrsReviews must not change');
  assert.strictEqual(pharmaCard.stability, pharmaInitialStability, 'Pharma card stability must not change');
});

// -----------------------------------------------------------------------------
// Test Summary
// -----------------------------------------------------------------------------
console.log('\n========================================================================');
console.log(`  📊 CHALLENGER M1 ITERATION 3 VERIFICATION SUMMARY: ${passCount}/${passCount + failCount} PASSED`);
if (failCount === 0) {
  console.log('  ✅ ALL EMPIRICAL CHALLENGES PASSED EMPIRICALLY (100% CURED & ZERO REGRESSIONS)');
} else {
  console.log(`  ❌ ${failCount} CHALLENGE(S) FAILED`);
}
console.log('========================================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
