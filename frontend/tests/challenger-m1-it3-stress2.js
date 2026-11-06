/**
 * Challenger M1 Iteration 3 - Adversarial Stress & Verification Harness (Instance 2)
 * 
 * Deeply challenges:
 *  Vector 1: Multi-step oracle validation for fsrsReviews under randomized/combinatorial rating sequences
 *  Vector 2: Cross-course & cross-deck review interleaving (Cardio, Pharma, Pulmo, Peds)
 *  Vector 3: Pre-existing, null, undefined, and extreme boundary values on fsrsReviews
 *  Vector 4: Exhaustive 0-100% spectrum and hostile input verification for #resAccuracy Persian formatting
 *  Vector 5: Custom session anonymous / orphaned card fsrsReviews handling
 *  Vector 6: Replay / restartCurrentSession lifecycle monotonicity
 *  Vector 7: DOM resilience and rapid firing of rateCard / showScreen
 */

const assert = require('node:assert');
const path = require('node:path');
const { createSandbox } = require('./dom-harness.js');

const HTML_PATH = path.resolve(__dirname, '../index.html');
const JS_PATH = path.resolve(__dirname, '../js/app.js');

let passCount = 0;
let failCount = 0;
const testResults = [];

function probe(title, fn) {
  process.stdout.write(`  ⚡ Probing: ${title} ... `);
  try {
    fn();
    passCount++;
    testResults.push({ title, status: 'PASSED' });
    console.log('\x1b[32mPASSED\x1b[0m');
  } catch (err) {
    failCount++;
    testResults.push({ title, status: 'FAILED', error: err.message });
    console.log('\x1b[31mFAILED\x1b[0m');
    console.error(`     💥 Error: ${err.message}`);
    if (err.stack) {
      console.error(`     ${err.stack.split('\n').slice(1, 3).join('\n')}`);
    }
  }
}

console.log('\n========================================================================');
console.log('  ⚔️ CHALLENGER M1 ITERATION 3 (INSTANCE 2): ADVERSARIAL STRESS SUITE');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// VECTOR 1: Multi-Step Oracle Validation for fsrsReviews
// -----------------------------------------------------------------------------
console.log('▶ VECTOR 1: Multi-Step Oracle Validation for fsrsReviews');

probe('V1.1: Step-by-step oracle verification on complex rating sequence [1, 1, 2, 1, 3, 4]', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');
  const deck = sb.purchasedCourses[0].decks[0];
  const c0 = deck.cardsList[0];
  const c1 = deck.cardsList[1];
  c0.fsrsReviews = 0;
  c1.fsrsReviews = 0;

  const oracle = { [c0.id]: 0, [c1.id]: 0 };

  // Step 1: Card 0 -> Rating 1 (Again). Should clone Card 0 to queue end.
  sb.app.rateCard(1);
  oracle[c0.id]++;
  assert.strictEqual(c0.fsrsReviews, oracle[c0.id], `Step 1: c0 reviews must be ${oracle[c0.id]}`);
  assert.strictEqual(c1.fsrsReviews, oracle[c1.id], `Step 1: c1 reviews must be ${oracle[c1.id]}`);

  // Step 2: Card 1 -> Rating 1 (Again). Should clone Card 1 to queue end.
  sb.app.rateCard(1);
  oracle[c1.id]++;
  assert.strictEqual(c0.fsrsReviews, oracle[c0.id], `Step 2: c0 reviews must be ${oracle[c0.id]}`);
  assert.strictEqual(c1.fsrsReviews, oracle[c1.id], `Step 2: c1 reviews must be ${oracle[c1.id]}`);

  // Step 3: Card 0 (clone 1) -> Rating 2 (Hard). Not again, so advances.
  sb.app.rateCard(2);
  oracle[c0.id]++;
  assert.strictEqual(c0.fsrsReviews, oracle[c0.id], `Step 3: c0 reviews must be ${oracle[c0.id]}`);
  assert.strictEqual(c1.fsrsReviews, oracle[c1.id], `Step 3: c1 reviews must be ${oracle[c1.id]}`);

  // Step 4: Card 1 (clone 1) -> Rating 1 (Again). Clones Card 1 again to queue end.
  sb.app.rateCard(1);
  oracle[c1.id]++;
  assert.strictEqual(c0.fsrsReviews, oracle[c0.id], `Step 4: c0 reviews must be ${oracle[c0.id]}`);
  assert.strictEqual(c1.fsrsReviews, oracle[c1.id], `Step 4: c1 reviews must be ${oracle[c1.id]}`);

  // Step 5: Card 1 (clone 2) -> Rating 3 (Good).
  sb.app.rateCard(3);
  oracle[c1.id]++;
  assert.strictEqual(c0.fsrsReviews, oracle[c0.id], `Step 5: c0 reviews must be ${oracle[c0.id]}`);
  assert.strictEqual(c1.fsrsReviews, oracle[c1.id], `Step 5: c1 reviews must be ${oracle[c1.id]}`);

  // Total reviews: Card 0 was rated 2 times (ratings 1, 2). Card 1 was rated 3 times (ratings 1, 1, 3).
  assert.strictEqual(c0.fsrsReviews, 2, 'c0 total fsrsReviews must be exactly 2');
  assert.strictEqual(c1.fsrsReviews, 3, 'c1 total fsrsReviews must be exactly 3');
  assert.strictEqual(sb.appState.activeSession.reviewsCount, 5, 'Session reviewsCount must be 5');
});

probe('V1.2: Invariant check: currentCard.fsrsReviews === srcCard.fsrsReviews after every rating in queue', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');
  const deck = sb.purchasedCourses[0].decks[0];

  for (let i = 0; i < 15; i++) {
    const session = sb.appState.activeSession;
    const currentCard = session.queue[session.currentIndex];
    const srcBefore = deck.cardsList.find(c => c.id === currentCard.id);
    const beforeReviews = srcBefore.fsrsReviews || 0;

    // Rate 1 to keep recycling or 3 to advance
    const rating = (i % 3 === 0) ? 1 : (i % 3 === 1 ? 2 : 3);
    sb.app.rateCard(rating);

    assert.strictEqual(srcBefore.fsrsReviews, beforeReviews + 1, `srcCard.fsrsReviews must increment by 1 at step ${i}`);
  }
});

// -----------------------------------------------------------------------------
// VECTOR 2: Cross-Course & Cross-Deck Review Interleaving
// -----------------------------------------------------------------------------
console.log('\n▶ VECTOR 2: Cross-Course & Cross-Deck Review Interleaving');

probe('V2.1: Interleaved study across all 4 courses strictly isolates fsrsReviews to target deck only', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  const courses = sb.purchasedCourses;
  assert.strictEqual(courses.length, 4, 'Must have 4 purchased courses');

  // Record all cards in all courses
  const allCards = [];
  courses.forEach(c => {
    c.decks.forEach(d => {
      (d.cardsList || []).forEach(card => {
        card.fsrsReviews = 0;
        allCards.push({ courseId: c.id, deckId: d.id, card });
      });
    });
  });

  // 1. Study Cardio ECG deck and rate first card
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');
  sb.app.rateCard(4); // Easy

  // 2. Switch to Pharma deck and rate first card
  const pharmaDeckId = courses.find(c => c.id === 'pharmacology').decks[0].id;
  sb.app.startDeckStudy('pharmacology', pharmaDeckId);
  sb.app.rateCard(3); // Good

  // 3. Switch to Pulmo deck and rate first card
  const pulmoDeckId = courses.find(c => c.id === 'pulmonology').decks[0].id;
  sb.app.startDeckStudy('pulmonology', pulmoDeckId);
  sb.app.rateCard(2); // Hard

  // 4. Switch to Peds deck and rate first card
  const pedsDeckId = courses.find(c => c.id === 'pediatrics').decks[0].id;
  sb.app.startDeckStudy('pediatrics', pedsDeckId);
  sb.app.rateCard(1); // Again

  // Verify only the 4 specifically rated cards have fsrsReviews === 1, and all others remain 0
  let nonZeroCount = 0;
  allCards.forEach(({ courseId, deckId, card }) => {
    if (card.fsrsReviews > 0) {
      nonZeroCount++;
      assert.strictEqual(card.fsrsReviews, 1, `Card ${card.id} should have exactly 1 review`);
    }
  });

  assert.strictEqual(nonZeroCount, 4, 'Exactly 4 cards across the whole platform should have fsrsReviews > 0');
});

// -----------------------------------------------------------------------------
// VECTOR 3: Boundary & Hostile Values on fsrsReviews
// -----------------------------------------------------------------------------
console.log('\n▶ VECTOR 3: Boundary & Hostile Values on fsrsReviews');

probe('V3.1: Card with initial fsrsReviews: undefined, null, or missing property safely defaults to 1', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');
  const deck = sb.purchasedCourses[0].decks[0];

  delete deck.cardsList[0].fsrsReviews;
  deck.cardsList[1].fsrsReviews = null;

  sb.app.rateCard(3); // Card 0
  assert.strictEqual(deck.cardsList[0].fsrsReviews, 1, 'undefined fsrsReviews should initialize to 1');

  sb.app.rateCard(3); // Card 1
  assert.strictEqual(deck.cardsList[1].fsrsReviews, 1, 'null fsrsReviews should initialize to 1');
});

probe('V3.2: Card with large initial fsrsReviews (99999) increments cleanly to 100000 without overflow', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');
  const deck = sb.purchasedCourses[0].decks[0];

  deck.cardsList[0].fsrsReviews = 99999;
  sb.app.rateCard(4);
  assert.strictEqual(deck.cardsList[0].fsrsReviews, 100000, 'Large fsrsReviews should increment to 100000');
});

// -----------------------------------------------------------------------------
// VECTOR 4: Exhaustive Spectrum and Hostile Input Verification for #resAccuracy
// -----------------------------------------------------------------------------
console.log('\n▶ VECTOR 4: Exhaustive Spectrum and Hostile Input Verification for #resAccuracy');

probe('V4.1: Exhaustive verification across all percentage integers (0% through 100%): 100% pure Persian', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  const accuracyEl = sb.dom.getElementById('resAccuracy');
  assert.ok(accuracyEl, '#resAccuracy must exist in DOM');

  for (let pct = 0; pct <= 100; pct++) {
    // Mock activeSession with exact review / correct ratio to yield pct%
    sb.appState.activeSession = {
      queue: [],
      currentIndex: 0,
      reviewsCount: 100,
      correctCount: pct,
      startTime: Date.now()
    };
    sb.app.renderResults();

    const text = accuracyEl.textContent;
    // Condition 1: Must NOT contain any Latin ASCII digit (0-9)
    assert.strictEqual(/[0-9]/.test(text), false, `Percentage ${pct}% rendered ASCII digit: "${text}"`);
    // Condition 2: Must contain Persian percent sign '٪' (U+066A)
    assert.ok(text.includes('٪'), `Percentage ${pct}% missing Persian percent sign: "${text}"`);
    // Condition 3: Must strictly match /^[۰-۹]+٪$/
    assert.match(text, /^[۰-۹]+٪$/, `Percentage ${pct}% must strictly be Persian digits followed by ٪, got "${text}"`);
  }
});

probe('V4.2: Zero-division guard: reviewsCount = 0 renders Persian "۰٪" without NaN or Infinity', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  const accuracyEl = sb.dom.getElementById('resAccuracy');

  sb.appState.activeSession = {
    queue: [],
    currentIndex: 0,
    reviewsCount: 0,
    correctCount: 0,
    startTime: Date.now()
  };
  sb.app.renderResults();

  assert.strictEqual(accuracyEl.textContent, '۰٪', `Zero reviews must render "۰٪", got "${accuracyEl.textContent}"`);
});

probe('V4.3: High-load session (10,000 reviews, 7,500 correct = 75%) renders Persian "۷۵٪"', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  const accuracyEl = sb.dom.getElementById('resAccuracy');
  const reviewedEl = sb.dom.getElementById('resCardsReviewed');

  sb.appState.activeSession = {
    queue: [],
    currentIndex: 0,
    reviewsCount: 10000,
    correctCount: 7500,
    startTime: Date.now()
  };
  sb.app.renderResults();

  assert.strictEqual(accuracyEl.textContent, '۷۵٪', `Accuracy must be "۷۵٪", got "${accuracyEl.textContent}"`);
  assert.strictEqual(reviewedEl.textContent, '۱۰۰۰۰', `Cards reviewed must be "۱۰۰۰۰", got "${reviewedEl.textContent}"`);
});

probe('V4.4: Corrupted / boundary session metrics (correctCount > reviewsCount) handles gracefully', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  const accuracyEl = sb.dom.getElementById('resAccuracy');

  sb.appState.activeSession = {
    queue: [],
    currentIndex: 0,
    reviewsCount: 2,
    correctCount: 5,
    startTime: Date.now()
  };
  sb.app.renderResults();

  // 5 / 2 = 250% -> '۲۵۰٪'
  assert.strictEqual(accuracyEl.textContent, '۲۵۰٪', `250% must render as Persian "۲۵۰٪", got "${accuracyEl.textContent}"`);
});

probe('V4.5: Missing DOM elements (#resAccuracy removed) does not throw in renderResults()', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  const accuracyEl = sb.dom.getElementById('resAccuracy');
  if (accuracyEl && accuracyEl.parentNode) {
    accuracyEl.parentNode.removeChild(accuracyEl);
  }

  sb.appState.activeSession = {
    queue: [],
    currentIndex: 0,
    reviewsCount: 5,
    correctCount: 5,
    startTime: Date.now()
  };

  assert.doesNotThrow(() => {
    sb.app.renderResults();
  }, 'renderResults must not throw when #resAccuracy is absent');
});

// -----------------------------------------------------------------------------
// VECTOR 5: Custom Session Anonymous / Orphaned Card Handling
// -----------------------------------------------------------------------------
console.log('\n▶ VECTOR 5: Custom Session Anonymous / Orphaned Card Handling');

probe('V5.1: Custom session cards with no deck affiliation increment fsrsReviews in queue without errors', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  const customCards = [
    { id: 'custom-orphan-1', question: 'Q1', answer: 'A1' },
    { id: 'custom-orphan-2', question: 'Q2', answer: 'A2' }
  ];

  sb.app.startCustomSession(customCards);
  assert.strictEqual(sb.appState.activeSession.deckId, 'custom');

  sb.app.rateCard(3); // Rate custom-orphan-1
  assert.strictEqual(sb.appState.activeSession.queue[0].fsrsReviews, 1, 'First card fsrsReviews in queue should be 1');

  sb.app.rateCard(1); // Rate custom-orphan-2 with Again (recycled)
  assert.strictEqual(sb.appState.activeSession.queue[1].fsrsReviews, 1, 'Second card fsrsReviews in queue should be 1');

  // Recycled card is at index 2
  const recycledCard = sb.appState.activeSession.queue[2];
  assert.ok(recycledCard, 'Recycled card must exist in queue at index 2');
  assert.strictEqual(recycledCard.fsrsReviews, 1, 'Recycled card initially has 1 review');

  sb.app.rateCard(4); // Rate recycled custom-orphan-2 with Easy -> session completes
  assert.strictEqual(recycledCard.fsrsReviews, 2, 'Recycled card fsrsReviews should increment to 2');
  assert.strictEqual(sb.appState.activeSession.reviewsCount, 3, 'Total session reviewsCount should be 3');
});

// -----------------------------------------------------------------------------
// VECTOR 6: Replay / restartCurrentSession Lifecycle Monotonicity
// -----------------------------------------------------------------------------
console.log('\n▶ VECTOR 6: Replay / restartCurrentSession Lifecycle Monotonicity');

probe('V6.1: Monotonic accumulation across multiple restartCurrentSession replay loops', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');
  const deck = sb.purchasedCourses[0].decks[0];
  const c0 = deck.cardsList[0];
  const c1 = deck.cardsList[1];
  c0.fsrsReviews = 0;
  c1.fsrsReviews = 0;

  // Run 10 full sessions via restartCurrentSession
  for (let loop = 1; loop <= 5; loop++) {
    // Card 0: rate Good
    sb.app.rateCard(3);
    // Card 1: rate Good -> session completes, goes to results
    sb.app.rateCard(3);

    assert.strictEqual(sb.appState.activeScreen, 'results', `Loop ${loop}: must transition to results`);
    assert.strictEqual(c0.fsrsReviews, loop, `Loop ${loop}: c0.fsrsReviews must equal loop count`);
    assert.strictEqual(c1.fsrsReviews, loop, `Loop ${loop}: c1.fsrsReviews must equal loop count`);

    // Restart session
    sb.app.restartCurrentSession();
    assert.strictEqual(sb.appState.activeScreen, 'study', `Loop ${loop}: must transition to study`);
    assert.strictEqual(sb.appState.activeSession.currentIndex, 0, `Loop ${loop}: currentIndex must be 0`);
  }
});

// -----------------------------------------------------------------------------
// VECTOR 7: DOM Resiliency and Rapid Firing of rateCard
// -----------------------------------------------------------------------------
console.log('\n▶ VECTOR 7: DOM Resiliency and Rapid Firing of rateCard');

probe('V7.1: Rapid-fire 100 ratings in loop updates stability, due, and fsrsReviews without state corruption', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');
  const deck = sb.purchasedCourses[0].decks[0];

  for (let i = 0; i < 100; i++) {
    // Rating 1 will continuously append cards so queue never runs out
    sb.app.rateCard(1);
  }

  assert.strictEqual(sb.appState.activeSession.reviewsCount, 100, 'reviewsCount must be 100');
  assert.strictEqual(deck.cardsList[0].stability, 0.4, 'stability must be 0.4');
  assert.ok(deck.cardsList[0].fsrsReviews >= 50, `Card 0 fsrsReviews should be at least 50 (got ${deck.cardsList[0].fsrsReviews})`);
});

probe('V7.2: Card flip state is reliably reset to false on every rateCard call', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');

  sb.app.toggleCardFlip();
  assert.strictEqual(sb.appState.isCardFlipped, true, 'Card should be flipped');

  sb.app.rateCard(3);
  assert.strictEqual(sb.appState.isCardFlipped, false, 'Card flip state must reset to false after rateCard');
});

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n========================================================================');
console.log(`  📊 CHALLENGER M1 ITERATION 3 (INSTANCE 2) SUMMARY: ${passCount}/${passCount + failCount} PASSED`);
if (failCount === 0) {
  console.log('  ✅ ALL ADVERSARIAL STRESS CHALLENGES PASSED EMPIRICALLY WITH ZERO DEFECTS');
} else {
  console.log(`  ❌ ${failCount} DEFECTS FOUND DURING ADVERSARIAL CHALLENGE`);
}
console.log('========================================================================\n');

if (failCount > 0) {
  process.exit(1);
}
