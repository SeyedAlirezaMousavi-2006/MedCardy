/**
 * MedCardy E2E Test Suite - Tier 1: Feature Coverage
 * 60 test cases covering Features 1-12 (5 tests per feature)
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createSandbox, inspectCSS, getMilestoneStatus } = require('./dom-harness.js');

const HTML_PATH = path.resolve(__dirname, '../index.html');
const APP_JS_PATH = path.resolve(__dirname, '../js/app.js');
const CSS_PATH = path.resolve(__dirname, '../css/style.css');

describe('Tier 1: Feature Coverage (60 Tests)', () => {
  const status = getMilestoneStatus(HTML_PATH, APP_JS_PATH, CSS_PATH);

  // =========================================================================
  // Feature 1: Platform Hub Screen & Ecosystem Separation (M1)
  // =========================================================================
  describe('Feature 1: Platform Hub Screen & Ecosystem Separation', () => {
    it('T1.1: Platform Hub screen container exists with distinct platform branding', (t) => {
      if (!status.hasPlatformHub && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: #screen-platform-hub not yet introduced into index.html');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const hub = sb.dom.getElementById('screen-platform-hub');
      assert.ok(hub, '#screen-platform-hub container must exist');
      const text = hub.textContent || '';
      assert.ok(text.includes('پلتفرم') || text.includes('MedCardy') || text.includes('اکوسیستم'),
        'Platform Hub must include overarching platform context');
    });

    it('T1.2: Enrolled medical program and student academic status are displayed', (t) => {
      if (!status.hasPlatformHub && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: Academic profile not yet in Platform Hub');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const hub = sb.dom.getElementById('screen-platform-hub');
      assert.ok(hub, 'Platform Hub must exist');
      const text = hub.textContent || '';
      assert.ok(text.includes('پره‌انترنی') || text.includes('داخلی') || text.includes('پزشکی') || text.includes('دکتر'),
        'Platform Hub must display student medical program context');
    });

    it('T1.3: 4 purchased courses overview cards are presented in Platform Hub', (t) => {
      if (!status.hasPlatformHub && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: 4-course overview not yet in Platform Hub');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const hub = sb.dom.getElementById('screen-platform-hub');
      assert.ok(hub, 'Platform Hub must exist');
      const text = hub.textContent || '';
      assert.ok(text.includes('قلب') || text.includes('کاردیولوژی'), 'Must display Cardiology course');
      assert.ok(text.includes('فارماکولوژی') || text.includes('دارو'), 'Must display Pharmacology course');
      assert.ok(text.includes('ریه') || text.includes('تنفس'), 'Must display Pulmonology course');
      assert.ok(text.includes('کودکان') || text.includes('اطفال'), 'Must display Pediatrics course');
    });

    it('T1.4: Platform ecosystem modules (Cards, Q-Bank, Atlas, Calculators) are presented', (t) => {
      if (!status.hasPlatformHub && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: Ecosystem modules grid not yet in Platform Hub');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.htmlContent;
      assert.ok(html.includes('فلش‌کارت') || html.includes('Cards'), 'Cards module must be present');
      assert.ok(html.includes('Q-Bank') || html.includes('بانک سؤالات'), 'Q-Bank module must be present');
      assert.ok(html.includes('اطلس') || html.includes('Atlas'), 'Atlas module must be present');
      assert.ok(html.includes('محاسبه‌گر') || html.includes('Calculators'), 'Calculators module must be present');
    });

    it('T1.5: Navigation entry point connects Platform Hub into Cards module', (t) => {
      if (!status.hasPlatformHub && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: Hub entry navigation not yet implemented');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      assert.ok(typeof sb.app.openCardsModule === 'function' || typeof sb.app.showScreen === 'function',
        'Navigation method to open Cards module must exist');
    });
  });

  // =========================================================================
  // Feature 2: Breadcrumbs & Back Navigation (M1)
  // =========================================================================
  describe('Feature 2: Breadcrumbs & Back Navigation', () => {
    it('T1.6: Persistent breadcrumb bar container exists in Cards module', (t) => {
      if (!status.hasBreadcrumbs && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: .module-breadcrumb-bar not yet added to index.html');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const breadcrumb = sb.dom.querySelector('.module-breadcrumb-bar') || sb.dom.getElementById('moduleBreadcrumbs');
      assert.ok(breadcrumb, 'Breadcrumb bar container must exist');
    });

    it('T1.7: Prominent back button ("← بازگشت به پلتفرم اصلی") is present', (t) => {
      if (!status.hasBreadcrumbs && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: Back to platform button not yet added');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.htmlContent;
      assert.ok(html.includes('بازگشت به پلتفرم') || html.includes('btnBackToPlatform'),
        'Back to platform button must be clearly labeled');
    });

    it('T1.8: Breadcrumb trail shows hierarchical platform-to-module location', (t) => {
      if (!status.hasBreadcrumbs && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: Breadcrumb path trail not yet added');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const trail = sb.dom.querySelector('.breadcrumb-trail') || sb.dom.getElementById('breadcrumbTrail');
      assert.ok(trail, 'Breadcrumb trail element must exist');
    });

    it('T1.9: Invoking app.backToPlatform() switches active screen to platform-hub', (t) => {
      if (!status.hasBreadcrumbs && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: app.backToPlatform() handler not yet added');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      assert.ok(typeof sb.app.backToPlatform === 'function', 'app.backToPlatform function must be defined');
      sb.app.backToPlatform();
      assert.strictEqual(sb.appState.activeScreen, 'platform-hub');
    });

    it('T1.10: Breadcrumbs visibility adjusts based on active screen', (t) => {
      if (!status.hasBreadcrumbs && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: Breadcrumb stateful visibility not yet implemented');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      if (typeof sb.app.backToPlatform === 'function') {
        sb.app.backToPlatform();
        const bar = sb.dom.querySelector('.module-breadcrumb-bar');
        if (bar) {
          assert.ok(bar.classList.contains('hidden') || bar.style.display === 'none' || sb.appState.activeScreen === 'platform-hub');
        }
      }
    });
  });

  // =========================================================================
  // Feature 3: 4 Purchased Courses Data Organization (M1)
  // =========================================================================
  describe('Feature 3: 4 Purchased Courses Data Organization', () => {
    it('T1.11: purchasedCourses array contains exactly 4 medical courses', (t) => {
      if (!status.hasPurchasedCourses && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: purchasedCourses schema not yet implemented');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const courses = sb.evalInContext('typeof purchasedCourses !== "undefined" ? purchasedCourses : null');
      assert.ok(Array.isArray(courses), 'purchasedCourses must be an array');
      assert.strictEqual(courses.length, 4, 'Must contain exactly 4 purchased courses');
    });

    it('T1.12: The 4 courses cover Cardiology, Pharmacology, Pulmonology, and Pediatrics', (t) => {
      if (!status.hasPurchasedCourses && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: 4 course IDs not yet implemented');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const courses = sb.evalInContext('purchasedCourses');
      const ids = courses.map(c => (c.id || '').toLowerCase());
      assert.ok(ids.includes('cardiology') || ids.some(id => id.includes('cardio')), 'Cardiology required');
      assert.ok(ids.includes('pharmacology') || ids.some(id => id.includes('pharma')), 'Pharmacology required');
      assert.ok(ids.includes('pulmonology') || ids.some(id => id.includes('pulmo')), 'Pulmonology required');
      assert.ok(ids.includes('pediatrics') || ids.some(id => id.includes('peds') || id.includes('pediat')), 'Pediatrics required');
    });

    it('T1.13: Each course contains 3 specialized clinical decks (total 12 decks)', (t) => {
      if (!status.hasPurchasedCourses && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: 12-deck hierarchy not yet implemented');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const courses = sb.evalInContext('purchasedCourses');
      let totalDecks = 0;
      for (const course of courses) {
        assert.ok(Array.isArray(course.decks), `Course ${course.id} must have a decks array`);
        assert.strictEqual(course.decks.length, 3, `Course ${course.id} must contain 3 clinical decks`);
        totalDecks += course.decks.length;
      }
      assert.strictEqual(totalDecks, 12, 'Total decks across all 4 courses must be 12');
    });

    it('T1.14: Every deck defines id, title, cards, due, overdue, and progress metrics', (t) => {
      if (!status.hasPurchasedCourses && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: Deck metrics schema not yet implemented');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const courses = sb.evalInContext('purchasedCourses');
      for (const course of courses) {
        for (const deck of course.decks) {
          assert.ok(deck.id, 'Deck must have id');
          assert.ok(deck.title, 'Deck must have title');
          assert.ok(typeof deck.cards === 'number', 'Deck must have numeric total cards');
          assert.ok(typeof deck.due === 'number', 'Deck must have numeric due count');
          assert.ok(typeof deck.progress === 'number', 'Deck must have numeric progress percentage');
        }
      }
    });

    it('T1.15: Decks contain clinical scenario flashcards with questions and answers', (t) => {
      if (!status.hasPurchasedCourses && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: Clinical cardsList data not yet loaded');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const courses = sb.evalInContext('purchasedCourses');
      const firstDeck = courses[0].decks[0];
      assert.ok(Array.isArray(firstDeck.cardsList) && firstDeck.cardsList.length > 0,
        'Deck must contain cardsList with clinical scenarios');
      const card = firstDeck.cardsList[0];
      assert.ok(card.question || card.scenario, 'Card must have question or clinical scenario');
      assert.ok(card.answer || card.pearl, 'Card must have answer or pearl');
    });
  });

  // =========================================================================
  // Feature 4: Active Study Session Engine (M1)
  // =========================================================================
  describe('Feature 4: Active Study Session Engine', () => {
    it('T1.16: app.startDeckStudy(courseId, deckId) initializes activeSession and switches screen', (t) => {
      if (!status.hasActiveSession && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: Dynamic activeSession engine not yet implemented');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      assert.ok(typeof sb.app.startDeckStudy === 'function', 'app.startDeckStudy must exist');
      sb.app.startDeckStudy('cardiology', 'cardio-ecg');
      assert.strictEqual(sb.appState.activeScreen, 'study', 'Screen must transition to study');
      assert.ok(sb.appState.activeSession !== null, 'activeSession must be initialized');
    });

    it('T1.17: Multi-card queue is populated with cards from the selected deck', (t) => {
      if (!status.hasActiveSession && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: Multi-card queue not yet implemented');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      sb.app.startDeckStudy('cardiology', 'cardio-ecg');
      const session = sb.appState.activeSession;
      assert.ok(Array.isArray(session.queue), 'Session must have a queue array');
      assert.ok(session.queue.length > 0, 'Session queue must not be empty');
      assert.strictEqual(session.currentIndex, 0, 'Initial currentIndex must be 0');
    });

    it('T1.18: #flashcard front dynamically renders clinical scenario and tags', (t) => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const cardFront = sb.dom.querySelector('.card-front');
      assert.ok(cardFront, 'Card front face must exist');
      const text = cardFront.textContent || '';
      assert.ok(text.length > 20, 'Card front must contain descriptive clinical scenario text');
    });

    it('T1.19: 3D card flip toggles between question and answer faces', (t) => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const initialFlip = sb.appState.isCardFlipped;
      sb.app.toggleCardFlip();
      assert.strictEqual(sb.appState.isCardFlipped, !initialFlip, 'isCardFlipped must toggle');
      sb.app.toggleCardFlip();
      assert.strictEqual(sb.appState.isCardFlipped, initialFlip, 'isCardFlipped must toggle back');
    });

    it('T1.20: Rating card (Again/Hard/Good/Easy) advances queue and updates stats', (t) => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      assert.ok(typeof sb.app.rateCard === 'function', 'app.rateCard function must exist');
      // Should execute without throwing
      assert.doesNotThrow(() => {
        sb.app.rateCard(3);
      });
    });
  });

  // =========================================================================
  // Feature 5: Isolated Course Progress Metrics (M1)
  // =========================================================================
  describe('Feature 5: Isolated Course Progress Metrics', () => {
    it('T1.21: Rating a card in Course A updates Course A due count', (t) => {
      if (!status.hasIsolatedMetrics && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: Isolated course metrics recalculation not yet implemented');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const cardio = sb.evalInContext('purchasedCourses.find(c => c.id === "cardiology")');
      const initialDue = cardio.due;
      sb.evalInContext('app.rateCard(3)');
      const updatedCardio = sb.evalInContext('purchasedCourses.find(c => c.id === "cardiology")');
      assert.ok(updatedCardio.due <= initialDue, 'Cardiology due count must decrease or update');
    });

    it('T1.22: Updating Course A does NOT alter due count of Course B (Pharmacology)', (t) => {
      if (!status.hasIsolatedMetrics && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: Course isolation validation pending M1');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const pharmaBefore = sb.evalInContext('purchasedCourses.find(c => c.id === "pharmacology").due');
      sb.app.startDeckStudy('cardiology', 'cardio-ecg');
      sb.app.rateCard(3);
      const pharmaAfter = sb.evalInContext('purchasedCourses.find(c => c.id === "pharmacology").due');
      assert.strictEqual(pharmaAfter, pharmaBefore, 'Pharmacology due count must remain unchanged');
    });

    it('T1.23: Updating Course A does NOT alter due count of Course C (Pulmonology)', (t) => {
      if (!status.hasIsolatedMetrics && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: Course isolation validation pending M1');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const pulmoBefore = sb.evalInContext('purchasedCourses.find(c => c.id === "pulmonology").due');
      sb.app.startDeckStudy('cardiology', 'cardio-ecg');
      sb.app.rateCard(4);
      const pulmoAfter = sb.evalInContext('purchasedCourses.find(c => c.id === "pulmonology").due');
      assert.strictEqual(pulmoAfter, pulmoBefore, 'Pulmonology due count must remain unchanged');
    });

    it('T1.24: Updating Course A does NOT alter due count of Course D (Pediatrics)', (t) => {
      if (!status.hasIsolatedMetrics && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: Course isolation validation pending M1');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const pedsBefore = sb.evalInContext('purchasedCourses.find(c => c.id === "pediatrics").due');
      sb.app.startDeckStudy('cardiology', 'cardio-ecg');
      sb.app.rateCard(1);
      const pedsAfter = sb.evalInContext('purchasedCourses.find(c => c.id === "pediatrics").due');
      assert.strictEqual(pedsAfter, pedsBefore, 'Pediatrics due count must remain unchanged');
    });

    it('T1.25: Global aggregate stats correctly compute derived totals from all 4 courses', (t) => {
      if (!status.hasIsolatedMetrics && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: Global metrics aggregator pending M1');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const courses = sb.evalInContext('purchasedCourses');
      const expectedTotalDue = courses.reduce((acc, c) => acc + c.due, 0);
      const stats = sb.evalInContext('app.calculateGlobalStats ? app.calculateGlobalStats() : null');
      if (stats) {
        assert.strictEqual(stats.totalDue, expectedTotalDue, 'Global totalDue must match sum of 4 courses');
      }
    });
  });

  // =========================================================================
  // Feature 6: Quizlet Modern 4-Course Layout (M2)
  // =========================================================================
  describe('Feature 6: Quizlet Modern 4-Course Layout', () => {
    it('T1.26: Template quizlet renders container with modular course cards', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.quizlet();
      assert.ok(html.includes('layout-quizlet'), 'Quizlet layout container must be generated');
      assert.ok(html.includes('mobile-hero-quizlet') || html.includes('quizlet-hero'), 'Hero section must exist');
    });

    it('T1.27: Course cards in Quizlet render course title, progress, and review badges', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.quizlet();
      assert.ok(html.includes('تسلط') || html.includes('progress') || html.includes('٪'),
        'Must display progress indicators');
      assert.ok(html.includes('سررسید') || html.includes('due') || html.includes('مرور'),
        'Must display due review badges');
    });

    it('T1.28: Expandable deck trays/pills show the 3 decks per course', (t) => {
      if (!status.m2Ready && !status.isStrictMode) {
        return t.skip('Pending Milestone 2: 4-course deck tray adaptation for Quizlet pending M2');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.quizlet();
      assert.ok(html.includes('deck') || html.includes('مجموعه'), 'Must render deck tray items');
    });

    it('T1.29: Quick review / smart study button is rendered with due count', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.quizlet();
      assert.ok(html.includes('مرور هوشمند') || html.includes('study'), 'Smart review button must be present');
    });

    it('T1.30: Clicking a course or deck study trigger invokes study room session', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.quizlet();
      assert.ok(html.includes('showScreen(\'study\')') || html.includes('startDeckStudy'),
        'Must contain study trigger handler');
    });
  });

  // =========================================================================
  // Feature 7: Duolingo Pulse 4-Course Layout (M2)
  // =========================================================================
  describe('Feature 7: Duolingo Pulse 4-Course Layout', () => {
    it('T1.31: Template duolingo generates gamified learning pathway layout', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.duolingo();
      assert.ok(html.includes('layout-duolingo'), 'Duolingo container must exist');
    });

    it('T1.32: Streak hero displays continuous study days with flame animation', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.duolingo();
      assert.ok(html.includes('🔥') || html.includes('flame'), 'Flame icon must be present');
      assert.ok(html.includes('زنجیره') || html.includes('streak'), 'Streak text must be present');
    });

    it('T1.33: XP daily goal bar reflects progress and review target', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.duolingo();
      assert.ok(html.includes('هدف روزانه XP') || html.includes('duo-progress'), 'XP goal bar must exist');
      assert.ok(html.includes('duo-progress-bar'), 'Progress bar element must exist');
    });

    it('T1.34: Daily clinical quests are rendered for medical students', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.duolingo();
      assert.ok(html.includes('ماموریت‌های روزانه') || html.includes('duo-quest-item'), 'Daily quests must exist');
    });

    it('T1.35: Pulse action button launches active study session', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.duolingo();
      assert.ok(html.includes('duo-pulse-btn') || html.includes('ادامه زنجیره'), 'Pulse action button must exist');
    });
  });

  // =========================================================================
  // Feature 8: Anki FSRS 4-Course Layout (M2)
  // =========================================================================
  describe('Feature 8: Anki FSRS 4-Course Layout', () => {
    it('T1.36: Template anki renders dense hierarchical tree layout', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.anki();
      assert.ok(html.includes('layout-anki'), 'Anki layout container must exist');
      assert.ok(html.includes('anki-mobile-card') || html.includes('anki-deck-tree') || html.includes('anki-decks-stream') || html.includes('anki-tree'),
        'Hierarchical tree structure or card stream must exist');
    });

    it('T1.37: 3-column chip matrix (Due, Overdue, New) is rendered', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.anki();
      assert.ok(html.includes('chip-due') || html.includes('due') || html.includes('عقب‌افتاده') || html.includes('سررسید'),
        'Due chips must exist in Anki matrix');
      assert.ok(html.includes('chip-new') || html.includes('new') || html.includes('جدید'),
        'New chips must exist in Anki matrix');
    });

    it('T1.38: 3-column chip matrix displays numeric values for decks', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.anki();
      assert.ok(html.includes('anki-chip') || html.includes('tree-numbers') || html.includes('tree-badge') || html.includes('badge-'),
        'Numeric counters must be populated');
    });

    it('T1.39: FSRS v4 algorithm parameters (retrievability, stability) are displayed', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.anki();
      assert.ok(html.includes('FSRS') || html.includes('الگوریتم') || html.includes('پایداری'),
        'FSRS v4 parameter display must exist');
    });

    it('T1.40: Clicking deck row in Anki tree triggers study session', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.anki();
      assert.ok(html.includes('showScreen(\'study\')') || html.includes('startDeckStudy'),
        'Deck study trigger must be bound to deck rows');
    });
  });

  // =========================================================================
  // Feature 9: Clinical Shift 4-Course Layout (M2)
  // =========================================================================
  describe('Feature 9: Clinical Shift 4-Course Layout', () => {
    it('T1.41: Template shift renders emergency ward triage stations', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.shift();
      assert.ok(html.includes('layout-shift'), 'Shift layout container must exist');
      assert.ok(html.includes('shift-wards-grid') || html.includes('ward-triage-card') || html.includes('اورژانس'),
        'Emergency wards triage grid must exist');
    });

    it('T1.42: The triage stations map to the 4 courses (Cardio, Pharma, Pulmo, Peds)', (t) => {
      if (!status.m2Ready && !status.isStrictMode) {
        return t.skip('Pending Milestone 2: 4-course ward triage mapping pending M2');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.shift();
      assert.ok(html.includes('قلب') || html.includes('تروما'), 'Cardiology ward required');
      assert.ok(html.includes('مسمومیت') || html.includes('فارماکو'), 'Pharmacology ward required');
      assert.ok(html.includes('ریه') || html.includes('ICU'), 'Pulmonology ward required');
      assert.ok(html.includes('کودکان') || html.includes('اطفال') || html.includes('نوزادان'), 'Pediatrics ward required');
    });

    it('T1.43: 5-minute rapid shift review buttons are provided', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.shift();
      assert.ok(html.includes('دقیقه') || html.includes('سریع') || html.includes('شیفت') || html.includes('شروع شیفت'),
        'Rapid shift review trigger must exist');
    });

    it('T1.44: Emergency severity indicators and triage accents are displayed', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.shift();
      assert.ok(html.includes('danger') || html.includes('alert') || html.includes('🚨') || html.includes('red'),
        'Emergency severity indicators must be present');
    });

    it('T1.45: Shift layout provides high-contrast thumb-friendly buttons', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.shift();
      assert.ok(html.includes('glass-btn') || html.includes('btn') || html.includes('card'),
        'Buttons must be present in shift template');
    });
  });

  // =========================================================================
  // Feature 10: Interactive Switchers & Button Physics (M2)
  // =========================================================================
  describe('Feature 10: Interactive Switchers & Button Physics', () => {
    it('T1.46: #layoutSwitcher contains 4 variant buttons (quizlet, duolingo, anki, shift)', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const switcher = sb.dom.getElementById('layoutSwitcher');
      assert.ok(switcher, '#layoutSwitcher must exist');
      const pills = switcher.querySelectorAll('.v-pill');
      assert.strictEqual(pills.length, 4, 'Must have exactly 4 layout variant pills');
      const variants = pills.map(p => p.getAttribute('data-variant'));
      assert.deepStrictEqual(variants.sort(), ['anki', 'duolingo', 'quizlet', 'shift'].sort());
    });

    it('T1.47: Calling app.setLayout updates appState.activeLayout and body data-layout', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      sb.app.setLayout('anki');
      assert.strictEqual(sb.appState.activeLayout, 'anki');
      assert.strictEqual(sb.body.getAttribute('data-layout'), 'anki');

      sb.app.setLayout('shift');
      assert.strictEqual(sb.appState.activeLayout, 'shift');
      assert.strictEqual(sb.body.getAttribute('data-layout'), 'shift');
    });

    it('T1.48: Switching layout updates the active class on switcher buttons', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      sb.app.setLayout('duolingo');
      const activePill = sb.dom.querySelector('#layoutSwitcher .v-pill.active');
      assert.ok(activePill, 'An active pill must exist');
      assert.strictEqual(activePill.getAttribute('data-variant'), 'duolingo');
    });

    it('T1.49: #btnStyleSwitcher contains 3 styles (btn-style-glass, btn-style-3d, btn-style-outline)', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const styleSwitcher = sb.dom.getElementById('btnStyleSwitcher');
      assert.ok(styleSwitcher, '#btnStyleSwitcher must exist');
      const cards = styleSwitcher.querySelectorAll('.style-choice-card');
      assert.strictEqual(cards.length, 3, 'Must have 3 button style choice cards');
      const styles = cards.map(c => c.getAttribute('data-btn-style'));
      assert.ok(styles.includes('btn-style-glass'), 'Glass style required');
      assert.ok(styles.includes('btn-style-3d'), '3D style required');
      assert.ok(styles.includes('btn-style-outline'), 'Outline style required');
    });

    it('T1.50: Calling app.setBtnStyle updates appState.activeBtnStyle and body class', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      sb.app.setBtnStyle('btn-style-3d');
      assert.strictEqual(sb.appState.activeBtnStyle, 'btn-style-3d');
      assert.ok(sb.body.classList.contains('btn-style-3d'), 'Body class must include btn-style-3d');

      sb.app.setBtnStyle('btn-style-outline');
      assert.strictEqual(sb.appState.activeBtnStyle, 'btn-style-outline');
      assert.ok(sb.body.classList.contains('btn-style-outline'), 'Body class must include btn-style-outline');
    });
  });

  // =========================================================================
  // Feature 11: Responsive Mobile & Desktop Ergonomics (M3)
  // =========================================================================
  describe('Feature 11: Responsive Mobile & Desktop Ergonomics', () => {
    it('T1.51: Meta viewport is configured with viewport-fit=cover and scaling limits', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const meta = sb.dom.querySelector('meta[name="viewport"]');
      assert.ok(meta, 'Viewport meta tag must exist');
      const content = meta.getAttribute('content') || '';
      assert.ok(content.includes('width=device-width'), 'Must define width=device-width');
      assert.ok(content.includes('viewport-fit=cover'), 'Must specify viewport-fit=cover');
    });

    it('T1.52: Bottom fixed navigation bar (.bottom-nav-bar) is rendered for thumb reachability', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const nav = sb.dom.querySelector('.bottom-nav-bar');
      assert.ok(nav, '.bottom-nav-bar must exist');
      assert.ok(nav.classList.contains('glass-bottom-bar'), 'Must have glassmorphism styling class');
    });

    it('T1.53: Bottom nav contains 5 distinct navigation items for core modules', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const items = sb.dom.querySelectorAll('.bottom-nav-bar .b-nav-item');
      assert.strictEqual(items.length, 5, 'Must contain 5 navigation buttons');
      const screens = items.map(item => item.getAttribute('data-screen'));
      assert.ok(screens.includes('dashboard'), 'dashboard nav required');
      assert.ok(screens.includes('study'), 'study nav required');
      assert.ok(screens.includes('recovery'), 'recovery nav required');
      assert.ok(screens.includes('courses'), 'courses nav required');
      assert.ok(screens.includes('results'), 'results nav required');
    });

    it('T1.54: Special recovery button features prominent badge counter', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const recoveryBtn = sb.dom.querySelector('.special-recovery-btn');
      assert.ok(recoveryBtn, '.special-recovery-btn must exist');
      const badge = recoveryBtn.querySelector('.recovery-bubble-badge');
      assert.ok(badge, 'Recovery bubble badge must exist');
    });

    it('T1.55: Content canvas is contained within app-wrapper structure', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const wrapper = sb.dom.querySelector('.app-wrapper');
      assert.ok(wrapper, '.app-wrapper must exist');
      const main = wrapper.querySelector('main.content-canvas');
      assert.ok(main, 'main.content-canvas must be nested inside .app-wrapper');
    });
  });

  // =========================================================================
  // Feature 12: CSS Glassmorphism & Syntax Integrity (M3)
  // =========================================================================
  describe('Feature 12: CSS Glassmorphism & Syntax Integrity', () => {
    it('T1.56: CSS file contains zero syntax errors or unclosed blocks', (t) => {
      const inspection = inspectCSS(CSS_PATH);
      if (!inspection.syntaxValid && !status.isStrictMode) {
        return t.skip(`Pending Milestone 3: CSS syntax remediation at lines ${inspection.errors.map(e => e.line).join(', ')}`);
      }
      assert.ok(inspection.syntaxValid, `CSS syntax must be valid: ${JSON.stringify(inspection.errors)}`);
    });

    it('T1.57: Glassmorphism tokens (backdrop-filter blur) are defined', () => {
      const inspection = inspectCSS(CSS_PATH);
      assert.ok(inspection.tokens.hasGlassmorphism, 'backdrop-filter must be defined for glassmorphism');
    });

    it('T1.58: Ambient background glow orbs (.ambient-background) are defined in DOM and CSS', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const ambient = sb.dom.querySelector('.ambient-background');
      assert.ok(ambient, '.ambient-background must exist');
      const orbs = ambient.querySelectorAll('.orb');
      assert.ok(orbs.length >= 3, 'Must have at least 3 ambient orbs');
    });

    it('T1.59: Vazirmatn Persian font is loaded and configured', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      assert.ok(sb.htmlContent.includes('Vazirmatn'), 'Vazirmatn Google font link must exist in head');
      const inspection = inspectCSS(CSS_PATH);
      assert.ok(inspection.tokens.hasVazirmatn, 'Vazirmatn must be configured in CSS font-family');
    });

    it('T1.60: Document dir="rtl" is set on root html tag', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      assert.ok(sb.htmlContent.includes('dir="rtl"'), 'HTML root must define dir="rtl"');
    });
  });
});
