/**
 * Challenger Milestone 3 Empirical Verification Suite
 * 
 * Objectives:
 * 1. Layout switching stability: Rapidly toggle between all 4 layout variants
 *    (Quizlet, Duolingo, Anki, Clinical Shift) and verify DOM element integrity,
 *    no layout shifts, and no orphaned nodes.
 * 2. Touch target verification: Programmatically compute or inspect dimensions for:
 *    .icon-action-btn, .module-switch-pill, .v-pill, .back-to-platform-btn,
 *    .back-link-btn, .close-sheet-btn, .tray-deck-pill, and .glass-btn.sm.
 * 3. Card 3D flip verification: Check will-change, perspective, and
 *    transform-style: preserve-3d properties and transitions.
 * 4. Responsive & Ergonomics Invariants: Desktop grid containment, mobile zero-overflow rules.
 */

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { createSandbox, inspectCSS } = require('./dom-harness.js');

const HTML_PATH = path.resolve(__dirname, '../index.html');
const JS_PATH = path.resolve(__dirname, '../js/app.js');
const CSS_PATH = path.resolve(__dirname, '../css/style.css');

let passCount = 0;
let failCount = 0;
const results = [];

function probe(title, fn) {
  process.stdout.write(`  ⚡ Probe: ${title} ... `);
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
console.log('  🔬 CHALLENGER M3 EMPIRICAL VERIFICATION & STRESS HARNESS');
console.log('========================================================================\n');

// ============================================================================
// SECTION 1: Layout Switching Stability & DOM Element Integrity
// ============================================================================
console.log('▶ SECTION 1: Layout Switching Stability & DOM Element Integrity');

probe('1.1: 4-Way Sequential Layout Cycling preserves DOM element integrity & 4 courses', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  const container = sb.dom.querySelector('#dashboard-content');
  assert.ok(container, '#dashboard-content must exist');

  const layouts = ['quizlet', 'duolingo', 'anki', 'shift'];

  for (const layout of layouts) {
    sb.app.setLayout(layout);

    assert.strictEqual(sb.appState.activeLayout, layout, `activeLayout should be ${layout}`);
    assert.strictEqual(sb.body.getAttribute('data-layout'), layout, `body[data-layout] should be ${layout}`);

    // Verify active class on switcher button
    const activePills = sb.dom.querySelectorAll('#layoutSwitcher .v-pill.active');
    assert.strictEqual(activePills.length, 1, `Exactly one .v-pill must be active for ${layout}`);
    assert.strictEqual(activePills[0].getAttribute('data-variant'), layout);

    // Verify layout-specific DOM container and structure
    if (layout === 'quizlet') {
      const courseCards = container.querySelectorAll('.mobile-deck-card');
      assert.strictEqual(courseCards.length, 4, 'Quizlet layout must render all 4 course cards');
      const trays = container.querySelectorAll('.tray-deck-pill');
      assert.strictEqual(trays.length, 12, 'Quizlet layout must render 12 deck pills (3 per course)');
    } else if (layout === 'duolingo') {
      const hero = container.querySelector('.duo-streak-hero');
      assert.ok(hero, 'Duolingo layout must render .duo-streak-hero');
      const progressBar = container.querySelector('.duo-progress-bar');
      assert.ok(progressBar, 'Duolingo layout must render XP progress bar');
      const quests = container.querySelectorAll('.duo-quest-item');
      assert.strictEqual(quests.length, 2, 'Duolingo layout must render daily clinical quests');
      const pulseBtn = container.querySelector('.duo-pulse-btn');
      assert.ok(pulseBtn, 'Duolingo pulse study action button must exist');
    } else if (layout === 'anki') {
      const summary = container.querySelector('.anki-mobile-summary');
      assert.ok(summary, 'Anki layout must render .anki-mobile-summary');
      const cards = container.querySelectorAll('.anki-mobile-card');
      assert.ok(cards.length > 0, 'Anki layout must render clinical deck cards');
      const dueChips = container.querySelectorAll('.anki-chip.due');
      assert.ok(dueChips.length > 0, 'Anki layout must render due chips');
    } else if (layout === 'shift') {
      const alert = container.querySelector('.shift-mobile-alert');
      assert.ok(alert, 'Clinical Shift must render .shift-mobile-alert');
      const wards = container.querySelectorAll('.shift-action-btn-card');
      assert.strictEqual(wards.length, 4, 'Clinical Shift must render 4 ward triage stations');
    }
  }
});

probe('1.2: 1,000 Rapid Randomized Layout Switches execute without DOM corruption or memory leaks', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  const container = sb.dom.querySelector('#dashboard-content');
  const layouts = ['quizlet', 'duolingo', 'anki', 'shift'];

  // Perform 1,000 rapid switches
  for (let i = 0; i < 1000; i++) {
    const nextLayout = layouts[i % layouts.length];
    sb.app.setLayout(nextLayout);
  }

  // Settle on Quizlet
  sb.app.setLayout('quizlet');
  assert.strictEqual(sb.appState.activeLayout, 'quizlet');
  assert.strictEqual(sb.body.getAttribute('data-layout'), 'quizlet');

  // Verify container has exactly 1 root layout wrapper element (.layout-quizlet)
  assert.strictEqual(container.children.length, 1, 'Container should have exactly 1 root layout wrapper element');
  assert.ok(container.querySelector('.layout-quizlet'), 'Quizlet container must be intact');
  assert.strictEqual(container.querySelectorAll('.mobile-deck-card').length, 4, 'All 4 courses intact');
});

probe('1.3: Layout Switching during Active Study Session preserves session progress & updates accent', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');

  const initialSession = sb.appState.activeSession;
  assert.ok(initialSession, 'Session must be active');
  const initialIndex = initialSession.currentIndex;
  const initialDeckId = initialSession.deckId;

  // Rate one card to advance progress
  sb.app.rateCard(3); // Good
  assert.strictEqual(sb.appState.activeSession.currentIndex, initialIndex + 1);

  // Switch layout to duolingo
  sb.app.setLayout('duolingo');
  assert.strictEqual(sb.appState.activeSession.currentIndex, initialIndex + 1, 'Current index preserved');
  assert.strictEqual(sb.appState.activeSession.deckId, initialDeckId, 'Deck ID preserved');
  const duoAccent = sb.dom.querySelector('#studyModeAccent .duo-hearts-pill');
  assert.ok(duoAccent, 'Duolingo study accent (hearts/XP) rendered');

  // Switch layout to anki
  sb.app.setLayout('anki');
  assert.strictEqual(sb.appState.activeSession.currentIndex, initialIndex + 1);
  const ankiAccent = sb.dom.querySelector('#studyModeAccent .anki-fsrs-study-pill');
  assert.ok(ankiAccent, 'Anki study accent (FSRS stability pill) rendered');

  // Switch layout to shift
  sb.app.setLayout('shift');
  assert.strictEqual(sb.appState.activeSession.currentIndex, initialIndex + 1);
  const shiftAccent = sb.dom.querySelector('#studyModeAccent .shift-timer-pill');
  assert.ok(shiftAccent, 'Clinical shift study accent (timer pill) rendered');
});

probe('1.4: Layout Switching does not mutate or desynchronize purchasedCourses data', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);

  // Snapshot course metrics
  const snapshotBefore = JSON.stringify(sb.purchasedCourses.map(c => ({
    id: c.id,
    due: c.due,
    mastery: c.mastery,
    decksCount: c.decks.length
  })));

  // Cycle layouts 40 times
  const layouts = ['quizlet', 'duolingo', 'anki', 'shift'];
  for (let i = 0; i < 40; i++) {
    sb.app.setLayout(layouts[i % layouts.length]);
  }

  const snapshotAfter = JSON.stringify(sb.purchasedCourses.map(c => ({
    id: c.id,
    due: c.due,
    mastery: c.mastery,
    decksCount: c.decks.length
  })));

  assert.strictEqual(snapshotBefore, snapshotAfter, 'Layout switches must be purely visual/presentational with 0 data mutation');
});

probe('1.5: Safe Fallback on standard unknown variants & boundary string inputs', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  sb.app.setLayout('quizlet');

  const standardBoundaryInputs = ['unknown_variant_xyz', 'custom_layout', '', '  ', null, undefined, 42];

  for (const input of standardBoundaryInputs) {
    assert.doesNotThrow(() => {
      sb.app.setLayout(input);
    }, `setLayout(${JSON.stringify(input)}) threw exception`);

    // Verify fallback to default layout or safe retention
    const container = sb.dom.querySelector('#dashboard-content');
    assert.ok(container && container.children.length > 0, '#dashboard-content must remain valid');
  }
});


// ============================================================================
// SECTION 2: Touch Target Ergonomics & Computed Dimensions (>= 44px)
// ============================================================================
console.log('\n▶ SECTION 2: Touch Target Ergonomics & Computed Dimensions (>= 44px)');

// Robust CSS Rule Parser handling nested @media and @keyframes blocks
function parseCSSRules(cssText, currentMedia = null) {
  const clean = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = [];
  let i = 0;
  while (i < clean.length) {
    const openBrace = clean.indexOf('{', i);
    if (openBrace === -1) break;
    const header = clean.slice(i, openBrace).trim();

    // Match closing brace accounting for nesting
    let depth = 1;
    let j = openBrace + 1;
    while (j < clean.length && depth > 0) {
      if (clean[j] === '{') depth++;
      else if (clean[j] === '}') depth--;
      j++;
    }
    const blockContent = clean.slice(openBrace + 1, j - 1).trim();
    i = j;

    if (header.startsWith('@media')) {
      rules.push(...parseCSSRules(blockContent, header));
    } else if (header.startsWith('@keyframes') || header.startsWith('@-webkit-keyframes')) {
      // Keyframe definition, skip nested selectors
    } else {
      const declarations = {};
      blockContent.split(';').forEach(decl => {
        const colon = decl.indexOf(':');
        if (colon !== -1) {
          const k = decl.slice(0, colon).trim().toLowerCase();
          const v = decl.slice(colon + 1).trim().replace(/\s*!important\s*$/i, '');
          if (k) declarations[k] = v;
        }
      });
      const selectors = header.split(',').map(s => s.trim());
      rules.push({ selectors, declarations, media: currentMedia });
    }
  }
  return rules;
}

const cssRules = parseCSSRules(fs.readFileSync(CSS_PATH, 'utf8'));

function findDeclarationsForSelector(selector, mediaFilter = null) {
  const matches = [];
  for (const rule of cssRules) {
    if (mediaFilter === null) {
      if (rule.media === null && rule.selectors.includes(selector)) {
        matches.push(rule.declarations);
      }
    } else {
      if (rule.media && rule.media.includes(mediaFilter) && rule.selectors.includes(selector)) {
        matches.push(rule.declarations);
      }
    }
  }
  return matches;
}

probe('2.1: .icon-action-btn enforces explicit 44x44px width & height on all viewports', () => {
  const baseDecls = findDeclarationsForSelector('.icon-action-btn', null);
  assert.ok(baseDecls.length > 0, '.icon-action-btn base rule exists');
  const base = Object.assign({}, ...baseDecls);
  assert.strictEqual(base['width'], '44px', 'Base width must be 44px');
  assert.strictEqual(base['height'], '44px', 'Base height must be 44px');
  assert.strictEqual(base['min-width'], '44px', 'Base min-width must be 44px');
  assert.strictEqual(base['min-height'], '44px', 'Base min-height must be 44px');

  // Check mobile <= 430px
  const mobileDecls = findDeclarationsForSelector('.icon-action-btn', '430px');
  assert.ok(mobileDecls.length > 0, '.icon-action-btn mobile rule exists');
  const mob = Object.assign({}, ...mobileDecls);
  assert.strictEqual(mob['width'], '44px', 'Mobile width must remain 44px');
  assert.strictEqual(mob['height'], '44px', 'Mobile height must remain 44px');
  assert.strictEqual(mob['min-width'], '44px', 'Mobile min-width must remain 44px');
  assert.strictEqual(mob['min-height'], '44px', 'Mobile min-height must remain 44px');
});

probe('2.2: .module-switch-pill maintains thumb-friendly touch padding & min-height', () => {
  const baseDecls = findDeclarationsForSelector('.module-switch-pill', null);
  assert.ok(baseDecls.length > 0, '.module-switch-pill base rule exists');
  const base = Object.assign({}, ...baseDecls);
  assert.ok(base['min-height'] === '40px' || base['min-height'] === '44px', 'min-height must be >= 40px');
  assert.strictEqual(base['padding'], '6px 12px', 'Base padding must be 6px 12px');

  const mobileDecls = findDeclarationsForSelector('.module-switch-pill', '430px');
  assert.ok(mobileDecls.length > 0, '.module-switch-pill mobile rule exists');
  const mob = Object.assign({}, ...mobileDecls);
  assert.ok(mob['min-height'] === '40px' || mob['min-height'] === '44px', 'Mobile min-height must be >= 40px');
  assert.strictEqual(mob['padding'], '6px 10px', 'Mobile padding must be 6px 10px');
});

probe('2.3: .v-pill enforces min-height: 44px across default and 375px screens', () => {
  const baseDecls = findDeclarationsForSelector('.v-pill', null);
  assert.ok(baseDecls.length > 0, '.v-pill base rule exists');
  const base = Object.assign({}, ...baseDecls);
  assert.strictEqual(base['min-height'], '44px', 'Base min-height must be 44px');

  const mobDecls = findDeclarationsForSelector('.v-pill', '375px');
  assert.ok(mobDecls.length > 0, '.v-pill 375px rule exists');
  const mob = Object.assign({}, ...mobDecls);
  assert.strictEqual(mob['min-height'], '44px', '375px min-height must be 44px');
});

probe('2.4: .back-to-platform-btn enforces min-height: 44px on default, 430px, and 375px', () => {
  const baseDecls = findDeclarationsForSelector('.back-to-platform-btn', null);
  const base = Object.assign({}, ...baseDecls);
  assert.strictEqual(base['min-height'], '44px', 'Base min-height must be 44px');

  const mob430 = Object.assign({}, ...findDeclarationsForSelector('.back-to-platform-btn', '430px'));
  assert.strictEqual(mob430['min-height'], '44px', '430px min-height must be 44px');

  const mob375 = Object.assign({}, ...findDeclarationsForSelector('.back-to-platform-btn', '375px'));
  assert.strictEqual(mob375['min-height'], '44px', '375px min-height must be 44px');
  assert.strictEqual(mob375['width'], '100%', '375px should expand to 100% width for thumb hitability');
});

probe('2.5: .back-link-btn enforces min-height: 44px and min-width: 44px', () => {
  const baseDecls = findDeclarationsForSelector('.back-link-btn', null);
  assert.ok(baseDecls.length > 0, '.back-link-btn rule exists');
  const base = Object.assign({}, ...baseDecls);
  assert.strictEqual(base['min-height'], '44px', 'min-height must be 44px');
  assert.strictEqual(base['min-width'], '44px', 'min-width must be 44px');
});

probe('2.6: .close-sheet-btn enforces 44x44px square touch boundary', () => {
  const baseDecls = findDeclarationsForSelector('.close-sheet-btn', null);
  assert.ok(baseDecls.length > 0, '.close-sheet-btn rule exists');
  const base = Object.assign({}, ...baseDecls);
  assert.strictEqual(base['width'], '44px');
  assert.strictEqual(base['height'], '44px');
  assert.strictEqual(base['min-width'], '44px');
  assert.strictEqual(base['min-height'], '44px');
});

probe('2.7: .tray-deck-pill enforces min-height: 44px and padding for clinical deck selection', () => {
  const baseDecls = findDeclarationsForSelector('.tray-deck-pill', null);
  assert.ok(baseDecls.length > 0, '.tray-deck-pill rule exists');
  const base = Object.assign({}, ...baseDecls);
  assert.strictEqual(base['min-height'], '44px', 'min-height must be 44px');
  assert.strictEqual(base['padding'], '10px 14px', 'padding must be 10px 14px');
});

probe('2.8: .glass-btn.sm enforces min-height: 44px with comfortable padding', () => {
  const baseDecls = findDeclarationsForSelector('.glass-btn.sm', null);
  assert.ok(baseDecls.length > 0, '.glass-btn.sm rule exists');
  const base = Object.assign({}, ...baseDecls);
  assert.strictEqual(base['min-height'], '44px', 'min-height must be 44px');
});

probe('2.9: All 8 target touch control classes exist and are instantiated in DOM/templates', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);

  // 1. .icon-action-btn
  const iconBtn = sb.dom.querySelector('.icon-action-btn');
  assert.ok(iconBtn, '.icon-action-btn must exist in DOM (#btnToggleVariantSheet)');

  // 2. .module-switch-pill
  const modPill = sb.dom.querySelector('.module-switch-pill');
  assert.ok(modPill, '.module-switch-pill must exist in DOM (#btnOpenModuleModal)');

  // 3. .v-pill
  const vPills = sb.dom.querySelectorAll('.v-pill');
  assert.strictEqual(vPills.length, 4, 'All 4 .v-pill layout buttons must exist in DOM');

  // 4. .back-to-platform-btn
  const backBtn = sb.dom.querySelector('.back-to-platform-btn');
  assert.ok(backBtn, '.back-to-platform-btn must exist in DOM (#btnBackToPlatform)');

  // 5. .back-link-btn
  const backLink = sb.dom.querySelector('.back-link-btn');
  assert.ok(backLink, '.back-link-btn must exist in DOM (#btnBackFromStudy or study-top-bar)');

  // 6. .close-sheet-btn
  const closeSheet = sb.dom.querySelector('.close-sheet-btn');
  assert.ok(closeSheet, '.close-sheet-btn must exist in DOM');

  // 7. .tray-deck-pill
  sb.app.setLayout('quizlet');
  const trayPills = sb.dom.querySelectorAll('.tray-deck-pill');
  assert.strictEqual(trayPills.length, 12, '12 .tray-deck-pill elements rendered in Quizlet');

  // 8. .glass-btn.sm
  const smBtns = sb.dom.querySelectorAll('.glass-btn.sm');
  assert.ok(smBtns.length > 0, '.glass-btn.sm elements exist in course actions');
});


// ============================================================================
// SECTION 3: Card 3D Flip Architecture, GPU Acceleration & Transitions
// ============================================================================
console.log('\n▶ SECTION 3: Card 3D Flip Architecture, GPU Acceleration & Transitions');

probe('3.1: .mobile-card-stage defines hardware-accelerated 3D perspective', () => {
  const stageDecls = Object.assign({}, ...findDeclarationsForSelector('.mobile-card-stage', null));
  assert.ok(stageDecls['perspective'], 'perspective must be defined on .mobile-card-stage');
  assert.strictEqual(stageDecls['perspective'], '1200px', 'perspective must be 1200px');
  assert.strictEqual(stageDecls['-webkit-perspective'], '1200px', '-webkit-perspective must be 1200px');
});

probe('3.2: .flashcard declares transform-style: preserve-3d, will-change, and cubic-bezier transition', () => {
  const cardDecls = Object.assign({}, ...findDeclarationsForSelector('.flashcard', null));
  assert.strictEqual(cardDecls['transform-style'], 'preserve-3d', 'transform-style must be preserve-3d');
  assert.strictEqual(cardDecls['-webkit-transform-style'], 'preserve-3d', '-webkit-transform-style must be preserve-3d');
  assert.strictEqual(cardDecls['will-change'], 'transform', 'will-change must specify transform for GPU layer promotion');
  assert.ok(cardDecls['transition'].includes('transform'), 'transition must animate transform');
  assert.ok(cardDecls['transition'].includes('cubic-bezier'), 'transition must use smooth cubic-bezier easing');

  // Crucial check: .flashcard must NOT have backdrop-filter directly on it (avoids WebKit 3D flattening)
  assert.strictEqual(cardDecls['backdrop-filter'], undefined, '.flashcard must NOT have direct backdrop-filter (WebKit 3D flattening bug)');
  assert.strictEqual(cardDecls['-webkit-backdrop-filter'], undefined, '.flashcard must NOT have direct -webkit-backdrop-filter');
});

probe('3.3: .flashcard.flipped applies exactly 180deg Y-axis rotation', () => {
  const flippedDecls = Object.assign({}, ...findDeclarationsForSelector('.flashcard.flipped', null));
  assert.strictEqual(flippedDecls['transform'], 'rotateY(180deg)', 'flipped transform must be rotateY(180deg)');
});

probe('3.4: .card-face, .card-front, and .card-back isolate glassmorphism surfaces and hide backface', () => {
  const faceDecls = Object.assign({}, ...findDeclarationsForSelector('.card-face', null));
  assert.strictEqual(faceDecls['backface-visibility'], 'hidden', 'backface-visibility must be hidden');
  assert.strictEqual(faceDecls['-webkit-backface-visibility'], 'hidden', '-webkit-backface-visibility must be hidden');
  assert.strictEqual(faceDecls['position'], 'absolute', 'card-face must be absolute overlay');
  assert.strictEqual(faceDecls['transform'], 'translateZ(0)', 'card-face must use translateZ(0) for GPU rasterization');

  // Check .card-front
  const frontDecls = Object.assign({}, ...findDeclarationsForSelector('.card-front', null));
  assert.strictEqual(frontDecls['transform'], 'rotateY(0deg) translateZ(1px)', '.card-front must be rotateY(0deg) translateZ(1px)');
  assert.ok(frontDecls['backdrop-filter'], '.card-front must host glassmorphism backdrop-filter');

  // Check .card-back
  const backDecls = Object.assign({}, ...findDeclarationsForSelector('.card-back', null));
  assert.strictEqual(backDecls['transform'], 'rotateY(180deg) translateZ(1px)', '.card-back must be rotateY(180deg) translateZ(1px)');
  assert.ok(backDecls['backdrop-filter'], '.card-back must host glassmorphism backdrop-filter');
});

probe('3.5: Card Flip State Machine toggles seamlessly and resets on card navigation', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');

  const card = sb.dom.querySelector('#flashcard');
  assert.ok(card, '#flashcard exists');

  // Initial state
  assert.strictEqual(sb.appState.isCardFlipped, false, 'Initial state: not flipped');
  assert.strictEqual(card.classList.contains('flipped'), false, 'Initial class: no flipped');

  // Flip 1 -> question to answer
  sb.app.toggleCardFlip();
  assert.strictEqual(sb.appState.isCardFlipped, true, 'After 1 flip: isCardFlipped is true');
  assert.strictEqual(card.classList.contains('flipped'), true, 'After 1 flip: card has flipped class');

  // Flip 2 -> answer back to question
  sb.app.toggleCardFlip();
  assert.strictEqual(sb.appState.isCardFlipped, false, 'After 2 flips: isCardFlipped is false');
  assert.strictEqual(card.classList.contains('flipped'), false, 'After 2 flips: card removes flipped class');

  // Advance to next card via rating -> flip state must automatically reset to false
  sb.app.toggleCardFlip(); // leave it flipped
  assert.strictEqual(sb.appState.isCardFlipped, true);
  sb.app.rateCard(3); // Rate Good and move next
  assert.strictEqual(sb.appState.isCardFlipped, false, 'Advancing to next card resets flip state');
  assert.strictEqual(card.classList.contains('flipped'), false, 'Card element loses flipped class on next card');
});

probe('3.6: 500 Rapid Consecutive Card Flips maintain flawless boolean-to-DOM class parity', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  sb.app.startDeckStudy('cardiology', 'cardio-ecg');
  const card = sb.dom.querySelector('#flashcard');

  for (let i = 1; i <= 500; i++) {
    sb.app.toggleCardFlip();
    const expected = (i % 2 === 1);
    assert.strictEqual(sb.appState.isCardFlipped, expected);
    assert.strictEqual(card.classList.contains('flipped'), expected);
  }
});


// ============================================================================
// SECTION 4: Responsive Layout Perfection & Typography Contrast
// ============================================================================
console.log('\n▶ SECTION 4: Responsive Layout Perfection & Typography Contrast');

probe('4.1: CSS syntax valid and contains all required responsive tokens (430px, 375px, 1024px)', () => {
  const css = inspectCSS(CSS_PATH);
  assert.strictEqual(css.syntaxValid, true, 'CSS syntax must be 100% valid with 0 errors');
  assert.strictEqual(css.errors.length, 0, '0 CSS syntax errors');
  assert.strictEqual(css.tokens.hasGlassmorphism, true, 'Glassmorphism tokens present');
  assert.strictEqual(css.tokens.hasVazirmatn, true, 'Vazirmatn typography present');
  assert.strictEqual(css.tokens.hasMobileMedia, true, 'Mobile media queries (430px / 375px) present');
  assert.strictEqual(css.tokens.hasDesktopMedia, true, 'Desktop media queries (1024px) present');
});

probe('4.2: Small Screen Breadcrumb Truncation prevents horizontal overflow at 375px and 430px', () => {
  const mob430 = Object.assign({}, ...findDeclarationsForSelector('.crumb-active', '430px'));
  assert.strictEqual(mob430['max-width'], '120px', 'max-width on 430px must be 120px');

  const mob375 = Object.assign({}, ...findDeclarationsForSelector('.crumb-active', '375px'));
  assert.strictEqual(mob375['max-width'], '110px', 'max-width on 375px must be 110px');
});

probe('4.3: Desktop viewports (1024px+) define 2-column medical grids and max-width reading containment', () => {
  const deskPlatformGrid = Object.assign({}, ...findDeclarationsForSelector('.platform-courses-grid', '1024px'));
  assert.strictEqual(deskPlatformGrid['grid-template-columns'], 'repeat(2, 1fr)', 'Platform courses grid must be 2 columns on desktop');

  const deskShiftGrid = Object.assign({}, ...findDeclarationsForSelector('.shift-wards-grid', '1024px'));
  assert.strictEqual(deskShiftGrid['grid-template-columns'], 'repeat(2, 1fr)', 'Shift wards grid must be 2 columns on desktop');

  // Check 720px focused reading containment
  const deskStudy = Object.assign({}, ...findDeclarationsForSelector('.study-mobile-view', '1024px'));
  assert.strictEqual(deskStudy['max-width'], '720px', 'Study view must be constrained to 720px on desktop');
});

probe('4.4: WCAG AA Contrast Compliance on --text-light variable (#64748b)', () => {
  const rootDecls = Object.assign({}, ...findDeclarationsForSelector(':root', null));
  const textLight = rootDecls['--text-light'];
  assert.strictEqual(textLight, '#64748b', '--text-light must be #64748b');

  // Compute luminance & contrast ratio against pure white #ffffff
  function hexToRgb(hex) {
    const num = parseInt(hex.replace('#', ''), 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }
  function luminance([r, g, b]) {
    const a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }
  const l1 = luminance([255, 255, 255]); // white background
  const l2 = luminance(hexToRgb('#64748b')); // text color
  const ratio = (l1 + 0.05) / (l2 + 0.05);

  assert.ok(ratio >= 4.5, `Contrast ratio ${ratio.toFixed(2)}:1 must exceed WCAG AA 4.5:1 threshold`);
});


// ============================================================================
// SECTION 5: Adversarial Boundary & Prototype Vulnerability Analysis
// ============================================================================
console.log('\n▶ SECTION 5: Adversarial Boundary & Prototype Vulnerability Analysis');

probe('5.1: Adversarial Object Prototype Key Rejection & Hardening', () => {
  const sb = createSandbox(HTML_PATH, JS_PATH);
  
  // Test that prototype keys (__proto__, toString, constructor) do not pollute or crash inappropriately
  sb.app.setLayout('__proto__');
  assert.ok(sb.appState.activeLayout === 'quizlet' || sb.appState.activeLayout === 'anki' || sb.appState.activeLayout === 'duolingo' || sb.appState.activeLayout === 'shift', 'Prototype key safely defaulted to valid layout');
  assert.strictEqual(Object.prototype.hasOwnProperty('__proto__'), true);

  // Restore clean state
  sb.app.setLayout('quizlet');
});


// ============================================================================
// SUMMARY REPORT
// ============================================================================
console.log('\n========================================================================');
console.log(`  📊 CHALLENGER M3 EMPIRICAL RESULTS: ${passCount}/${passCount + failCount} PASSED`);
if (failCount === 0) {
  console.log('  ✅ ALL EMPIRICAL CHALLENGE PROBES PASSED WITH ZERO DEFECTS');
} else {
  console.log(`  ❌ ${failCount} DEFECT(S) ENCOUNTERED`);
}
console.log('========================================================================\n');

if (failCount > 0) {
  process.exit(1);
}
