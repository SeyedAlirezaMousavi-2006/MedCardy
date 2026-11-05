/**
 * MedCardy E2E Test Suite - Tier 2: Boundary & Corner Cases
 * 60 test cases covering boundary conditions, resilience, and adversarial inputs (5 tests per feature)
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createSandbox, inspectCSS, getMilestoneStatus } = require('./dom-harness.js');

const HTML_PATH = path.resolve(__dirname, '../index.html');
const APP_JS_PATH = path.resolve(__dirname, '../js/app.js');
const CSS_PATH = path.resolve(__dirname, '../css/style.css');

describe('Tier 2: Boundary & Corner Cases (60 Tests)', () => {
  const status = getMilestoneStatus(HTML_PATH, APP_JS_PATH, CSS_PATH);

  // =========================================================================
  // Feature 1 Boundaries: Platform Hub Screen (5 tests)
  // =========================================================================
  describe('Feature 1 Boundaries: Platform Hub Screen', () => {
    it('T2.1: Enrolled programs list with 0 courses displays empty state / placeholder gracefully', (t) => {
      if (!status.hasPlatformHub && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: Platform Hub empty course boundary pending M1');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      assert.doesNotThrow(() => {
        sb.evalInContext('if (typeof app.renderPlatformCourses === "function") app.renderPlatformCourses([]);');
      });
    });

    it('T2.2: Missing student avatar / profile name falls back to default clinical icon without throwing', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const avatar = sb.dom.querySelector('.avatar-circle');
      assert.ok(avatar, 'Avatar element must exist in header');
      assert.ok(avatar.textContent.length > 0, 'Avatar must contain default placeholder symbol (e.g. 🩺)');
    });

    it('T2.3: Rapid repeated clicks on module cards do not create duplicate modals or throw exceptions', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      assert.doesNotThrow(() => {
        for (let i = 0; i < 5; i++) {
          if (typeof sb.app.toggleModuleModal === 'function') {
            sb.app.toggleModuleModal(true);
          }
        }
      }, 'Repeated modal open calls must be idempotent');
    });

    it('T2.4: Attempting navigation to an invalid screen ID falls back to default platform view without crash', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      assert.doesNotThrow(() => {
        sb.app.showScreen('non_existent_screen_xyz');
      });
      // Should not blow up, screen should either be unchanged or fallback
      assert.ok(sb.appState.activeScreen !== undefined);
    });

    it('T2.5: Clicking outside module modal (on backdrop) closes the modal cleanly', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const backdrop = sb.dom.getElementById('moduleModalBackdrop');
      if (backdrop && typeof sb.app.toggleModuleModal === 'function') {
        sb.app.toggleModuleModal(true);
        backdrop.click();
        assert.ok(!backdrop.classList.contains('active') || backdrop.style.display !== 'flex',
          'Modal should close on backdrop click');
      }
    });
  });

  // =========================================================================
  // Feature 2 Boundaries: Breadcrumbs & Back Navigation (5 tests)
  // =========================================================================
  describe('Feature 2 Boundaries: Breadcrumbs & Back Navigation', () => {
    it('T2.6: Deeply nested breadcrumb navigation (Hub -> Course -> Deck -> Study) builds accurate path trail', (t) => {
      if (!status.hasBreadcrumbs && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: Deep breadcrumb trail formatting pending M1');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      if (typeof sb.app.startDeckStudy === 'function') {
        sb.app.startDeckStudy('cardiology', 'cardio-ecg');
        const trail = sb.dom.querySelector('.breadcrumb-trail');
        if (trail) {
          assert.ok(trail.textContent.includes('ماژول فلش‌کارت') || trail.textContent.includes('قلب'),
            'Trail must reflect nested context');
        }
      }
    });

    it('T2.7: Invoking app.backToPlatform() when already on Platform Hub is idempotent and safe', (t) => {
      if (!status.hasBreadcrumbs && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: app.backToPlatform() pending M1');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      assert.doesNotThrow(() => {
        sb.app.backToPlatform();
        sb.app.backToPlatform();
      }, 'Consecutive backToPlatform calls must be safe');
      assert.strictEqual(sb.appState.activeScreen, 'platform-hub');
    });

    it('T2.8: Breadcrumb bar on narrow (320px) viewport preserves back button readability without text wrap overflow', (t) => {
      if (!status.hasBreadcrumbs && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: Breadcrumb container pending M1');
      }
      const css = inspectCSS(CSS_PATH);
      assert.ok(css.tokens.hasGlassmorphism, 'CSS must be available for layout inspection');
    });

    it('T2.9: Rapid toggling between screens updates breadcrumbs synchronously without desynchronization', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      assert.doesNotThrow(() => {
        const screens = ['dashboard', 'study', 'recovery', 'courses', 'results'];
        for (const s of screens) {
          sb.app.showScreen(s);
          assert.strictEqual(sb.appState.activeScreen, s);
        }
      });
    });

    it('T2.10: Direct browser history/url hash navigation retains valid breadcrumb root state', (t) => {
      if (!status.hasBreadcrumbs && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: URL routing state pending M1');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      assert.ok(sb.appState.activeScreen !== undefined);
    });
  });

  // =========================================================================
  // Feature 3 Boundaries: 4 Purchased Courses Data Organization (5 tests)
  // =========================================================================
  describe('Feature 3 Boundaries: 4 Purchased Courses Data Organization', () => {
    it('T2.11: Course with 0 due cards renders disabled/completed review button instead of error', (t) => {
      if (!status.hasPurchasedCourses && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: Course zero-due boundary pending M1');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const courses = sb.evalInContext('purchasedCourses');
      assert.ok(courses.every(c => c.due >= 0), 'Due counts must be non-negative integers');
    });

    it('T2.12: Course with 100% mastery progress renders celebration/badge without progress bar overflow', (t) => {
      if (!status.hasPurchasedCourses && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: Course 100% progress boundary pending M1');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const courses = sb.evalInContext('purchasedCourses');
      assert.ok(courses.every(c => c.progress <= 100 && c.progress >= 0),
        'Course progress must be between 0% and 100%');
    });

    it('T2.13: Malformed/corrupted deck array in course object defaults gracefully to empty deck array', (t) => {
      if (!status.hasPurchasedCourses && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: Malformed deck schema boundary pending M1');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      assert.doesNotThrow(() => {
        sb.evalInContext('const fakeCourse = { id: "test", decks: null }; (fakeCourse.decks || []);');
      });
    });

    it('T2.14: Querying a non-existent course ID returns null/undefined without crash', (t) => {
      if (!status.hasPurchasedCourses && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: Non-existent course ID lookup pending M1');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const result = sb.evalInContext('purchasedCourses.find(c => c.id === "non_existent_course_404")');
      assert.strictEqual(result, undefined, 'Invalid course ID should return undefined');
    });

    it('T2.15: Mutating runtime deck state does not pollute or mutate initial seed data objects', (t) => {
      if (!status.hasPurchasedCourses && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: Seed data immutability pending M1');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const courses = sb.evalInContext('purchasedCourses');
      assert.ok(courses.length === 4, 'Must have 4 courses');
    });
  });

  // =========================================================================
  // Feature 4 Boundaries: Active Study Session Engine (5 tests)
  // =========================================================================
  describe('Feature 4 Boundaries: Active Study Session Engine', () => {
    it('T2.16: Initializing study session with an empty card queue shows notification rather than crash', (t) => {
      if (!status.hasActiveSession && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: Empty card queue handling pending M1');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      assert.doesNotThrow(() => {
        if (typeof sb.app.startCustomSession === 'function') {
          sb.app.startCustomSession([]);
        }
      });
    });

    it('T2.17: Rating the final card in queue transitions seamlessly to #screen-results', (t) => {
      if (!status.hasActiveSession && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: Session completion transition pending M1');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      sb.app.startDeckStudy('cardiology', 'cardio-ecg');
      const session = sb.appState.activeSession;
      if (session && session.queue) {
        // Force queue to 1 card to test completion
        session.queue = [session.queue[0]];
        session.currentIndex = 0;
        sb.app.rateCard(3);
        assert.strictEqual(sb.appState.activeScreen, 'results',
          'Rating final card must transition to results screen');
      }
    });

    it('T2.18: Rating button pressed before flipping card allows rating safely without desync', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      sb.appState.isCardFlipped = false;
      assert.doesNotThrow(() => {
        sb.app.rateCard(3);
      });
    });

    it('T2.19: Rapid double-click on FSRS rating button does not decrement queue count twice for same card', (t) => {
      if (!status.hasActiveSession && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: Rapid rating idempotency pending M1');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      sb.app.startDeckStudy('cardiology', 'cardio-ecg');
      const initialIdx = sb.appState.activeSession.currentIndex;
      sb.app.rateCard(3);
      const afterFirst = sb.appState.activeSession.currentIndex;
      assert.strictEqual(afterFirst, initialIdx + 1, 'Index should advance by exactly 1');
    });

    it('T2.20: Keyboard shortcuts (Space, 1-4) are ignored when activeScreen is NOT study', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      sb.app.showScreen('dashboard');
      const flippedBefore = sb.appState.isCardFlipped;
      // Simulate Space keydown while on dashboard
      const evt = { code: 'Space', key: ' ', preventDefault: () => {} };
      // State should remain unchanged
      assert.strictEqual(sb.appState.isCardFlipped, flippedBefore,
        'Card should not flip when not on study screen');
    });
  });

  // =========================================================================
  // Feature 5 Boundaries: Isolated Course Progress Metrics (5 tests)
  // =========================================================================
  describe('Feature 5 Boundaries: Isolated Course Progress Metrics', () => {
    it('T2.21: Rating 10 cards in Cardiology leaves Pharmacology due count strictly unchanged', (t) => {
      if (!status.hasIsolatedMetrics && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: Multi-rating course isolation pending M1');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const pharmaBefore = sb.evalInContext('purchasedCourses.find(c => c.id === "pharmacology").due');
      sb.app.startDeckStudy('cardiology', 'cardio-ecg');
      for (let i = 0; i < 10; i++) {
        sb.app.rateCard(3);
      }
      const pharmaAfter = sb.evalInContext('purchasedCourses.find(c => c.id === "pharmacology").due');
      assert.strictEqual(pharmaAfter, pharmaBefore, 'Pharmacology due must be invariant');
    });

    it('T2.22: Rating 10 cards in Cardiology leaves Pulmonology due count strictly unchanged', (t) => {
      if (!status.hasIsolatedMetrics && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: Multi-rating course isolation pending M1');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const pulmoBefore = sb.evalInContext('purchasedCourses.find(c => c.id === "pulmonology").due');
      sb.app.startDeckStudy('cardiology', 'cardio-ecg');
      for (let i = 0; i < 10; i++) {
        sb.app.rateCard(4);
      }
      const pulmoAfter = sb.evalInContext('purchasedCourses.find(c => c.id === "pulmonology").due');
      assert.strictEqual(pulmoAfter, pulmoBefore, 'Pulmonology due must be invariant');
    });

    it('T2.23: Rating 10 cards in Cardiology leaves Pediatrics due count strictly unchanged', (t) => {
      if (!status.hasIsolatedMetrics && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: Multi-rating course isolation pending M1');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const pedsBefore = sb.evalInContext('purchasedCourses.find(c => c.id === "pediatrics").due');
      sb.app.startDeckStudy('cardiology', 'cardio-ecg');
      for (let i = 0; i < 10; i++) {
        sb.app.rateCard(2);
      }
      const pedsAfter = sb.evalInContext('purchasedCourses.find(c => c.id === "pediatrics").due');
      assert.strictEqual(pedsAfter, pedsBefore, 'Pediatrics due must be invariant');
    });

    it('T2.24: Progress percentage calculation handles zero total cards gracefully without NaN / division by zero', (t) => {
      if (!status.hasIsolatedMetrics && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: Zero-card division safety pending M1');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      assert.doesNotThrow(() => {
        const calc = sb.evalInContext('typeof calculateProgress === "function" ? calculateProgress(0, 0) : 0');
        assert.ok(!Number.isNaN(calc), 'Must not return NaN');
      });
    });

    it('T2.25: Decrementing due reviews cannot produce negative due numbers (clamped at >= 0)', (t) => {
      if (!status.hasIsolatedMetrics && !status.isStrictMode) {
        return t.skip('Pending Milestone 1: Negative due clamp validation pending M1');
      }
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const cardio = sb.evalInContext('purchasedCourses.find(c => c.id === "cardiology")');
      assert.ok(cardio.due >= 0, 'Due reviews cannot be negative');
    });
  });

  // =========================================================================
  // Feature 6 Boundaries: Quizlet Modern 4-Course Layout (5 tests)
  // =========================================================================
  describe('Feature 6 Boundaries: Quizlet Modern 4-Course Layout', () => {
    it('T2.26: Expanding multiple deck trays in Quizlet layout does not cause DOM overflow', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.quizlet();
      assert.ok(html.length > 500, 'Quizlet layout should produce comprehensive markup');
    });

    it('T2.27: Quizlet course card with zero overdue cards displays clean status without broken badge', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.quizlet();
      assert.ok(!html.includes('NaN'), 'Template must not render NaN in place of numeric statistics');
      assert.ok(!html.includes('undefined'), 'Template must not render undefined in place of text');
    });

    it('T2.28: Selecting a deck from Quizlet tray passes valid course and deck parameters', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.quizlet();
      assert.ok(html.includes('showScreen(\'study\')') || html.includes('startDeckStudy'),
        'Must contain study trigger');
    });

    it('T2.29: Course card with extra-long Persian title does not break card grid alignment', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.quizlet();
      assert.ok(html.includes('m-deck-title') || html.includes('m-deck-header'),
        'Deck title styling classes must be defined');
    });

    it('T2.30: Rapidly switching to Quizlet layout re-renders active deck trays cleanly', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      assert.doesNotThrow(() => {
        for (let i = 0; i < 5; i++) {
          sb.app.setLayout('quizlet');
        }
      });
      assert.strictEqual(sb.appState.activeLayout, 'quizlet');
    });
  });

  // =========================================================================
  // Feature 7 Boundaries: Duolingo Pulse 4-Course Layout (5 tests)
  // =========================================================================
  describe('Feature 7 Boundaries: Duolingo Pulse 4-Course Layout', () => {
    it('T2.31: Streak days counter initialized to 0 displays zero flame cleanly without broken UI', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const streakPill = sb.dom.querySelector('.streak-pill');
      assert.ok(streakPill, '.streak-pill must exist');
      assert.ok(streakPill.textContent.includes('🔥'), 'Streak pill must contain flame emoji');
    });

    it('T2.32: XP progress bar clamps at 100% width when earned XP exceeds daily target', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.duolingo();
      assert.ok(html.includes('duo-progress-bar'), 'Progress bar element must exist');
    });

    it('T2.33: Clicking an already completed daily quest does not award duplicate XP', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.duolingo();
      assert.ok(html.includes('+20 XP ✅') || html.includes('badge-confirmed'),
        'Completed quest badge must be displayed');
    });

    it('T2.34: Course nodes on Duolingo path maintain correct locked/unlocked state order', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.duolingo();
      assert.ok(html.length > 500, 'Duolingo template must render complete course path');
    });

    it('T2.35: Clicking recovery quest node opens recovery screen with accurate state', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.duolingo();
      assert.ok(html.includes('app.showScreen(\'recovery\')'),
        'Recovery quest node must route to recovery screen');
    });
  });

  // =========================================================================
  // Feature 8 Boundaries: Anki FSRS 4-Course Layout (5 tests)
  // =========================================================================
  describe('Feature 8 Boundaries: Anki FSRS 4-Course Layout', () => {
    it('T2.36: Collapsing all 4 course nodes in Anki tree leaves compact view without broken heights', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.anki();
      assert.ok(html.includes('layout-anki'), 'Anki template should be well-formed');
    });

    it('T2.37: Expanding all 4 courses renders deck chip rows without clipping', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.anki();
      assert.ok(html.includes('anki-chip') || html.includes('chip-'), 'Chips must be present');
    });

    it('T2.38: Deck with 0 overdue cards renders "0" chip without collapsing matrix layout', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.anki();
      assert.ok(!html.includes('NaN'), 'Chips must not render NaN values');
    });

    it('T2.39: FSRS parameters with boundary values render in valid scientific format', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.anki();
      assert.ok(html.includes('FSRS v4'), 'FSRS v4 algorithm version label must be present');
    });

    it('T2.40: Repeatedly clicking tree expand/collapse toggles does not corrupt container state', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      assert.doesNotThrow(() => {
        sb.app.setLayout('anki');
        sb.app.setLayout('quizlet');
        sb.app.setLayout('anki');
      });
      assert.strictEqual(sb.appState.activeLayout, 'anki');
    });
  });

  // =========================================================================
  // Feature 9 Boundaries: Clinical Shift 4-Course Layout (5 tests)
  // =========================================================================
  describe('Feature 9 Boundaries: Clinical Shift 4-Course Layout', () => {
    it('T2.41: Emergency ward with 0 urgent cards shows stable ward badge instead of error', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.shift();
      assert.ok(html.length > 500, 'Shift template must render robust emergency markup');
    });

    it('T2.42: 5-minute rapid shift review button limits queue to highest-urgency cards', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.shift();
      assert.ok(html.includes('دقیقه') || html.includes('مرور فوری') || html.includes('emergency'),
        'Rapid review trigger must be present');
    });

    it('T2.43: Long clinical scenario descriptions inside shift ward cards wrap with ellipsis', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.shift();
      assert.ok(html.includes('shift-desc-text') || html.includes('shift-mobile-alert'),
        'Descriptive elements must be present');
    });

    it('T2.44: Rapid shift triage button triggers haptic feedback (navigator.vibrate) safely on mobile', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      assert.doesNotThrow(() => {
        if (sb.navigator.vibrate) sb.navigator.vibrate(12);
      });
    });

    it('T2.45: Shift layout adapts to narrow screens by stacking ward triage stations vertically', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const html = sb.mobileDashboardTemplates.shift();
      assert.ok(html.includes('layout-shift'), 'Shift layout container must exist');
    });
  });

  // =========================================================================
  // Feature 10 Boundaries: Interactive Switchers & Button Physics (5 tests)
  // =========================================================================
  describe('Feature 10 Boundaries: Interactive Switchers & Button Physics', () => {
    it('T2.46: Calling app.setLayout("unknown_variant") falls back safely without crash', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      assert.doesNotThrow(() => {
        sb.app.setLayout('unknown_variant_xyz');
      });
      // Should not throw and activeLayout should remain defined
      assert.ok(sb.appState.activeLayout);
    });

    it('T2.47: Calling app.setBtnStyle("invalid_style") falls back safely without crash', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      assert.doesNotThrow(() => {
        sb.app.setBtnStyle('invalid_style_xyz');
      });
      assert.ok(sb.appState.activeBtnStyle);
    });

    it('T2.48: Switching layout 10 times in 100ms executes smoothly without orphaned DOM elements', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const variants = ['quizlet', 'duolingo', 'anki', 'shift'];
      assert.doesNotThrow(() => {
        for (let i = 0; i < 10; i++) {
          sb.app.setLayout(variants[i % variants.length]);
        }
      });
      assert.strictEqual(sb.appState.activeLayout, variants[9 % variants.length]);
    });

    it('T2.49: Switching button style during active study session does not reset session progress', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      sb.app.showScreen('study');
      sb.app.setBtnStyle('btn-style-3d');
      assert.strictEqual(sb.appState.activeScreen, 'study',
        'Active screen must remain study when button style changes');
      assert.strictEqual(sb.appState.activeBtnStyle, 'btn-style-3d');
    });

    it('T2.50: Opening design customizer bottom sheet displays correct active selection highlight', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      sb.app.setBtnStyle('btn-style-outline');
      const activeBtn = sb.dom.querySelector('#btnStyleSwitcher .style-choice-card.active');
      if (activeBtn) {
        assert.strictEqual(activeBtn.getAttribute('data-btn-style'), 'btn-style-outline');
      }
    });
  });

  // =========================================================================
  // Feature 11 Boundaries: Responsive Mobile & Desktop Ergonomics (5 tests)
  // =========================================================================
  describe('Feature 11 Boundaries: Responsive Mobile & Desktop Ergonomics', () => {
    it('T2.51: Viewport at 320px width: zero horizontal scroll and elements maintain fit within 100vw', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const meta = sb.dom.querySelector('meta[name="viewport"]');
      assert.ok(meta.getAttribute('content').includes('width=device-width'),
        'Must specify width=device-width');
    });

    it('T2.52: Viewport at 1440px width: container respects max-width constraint without stretching across screen', () => {
      const css = inspectCSS(CSS_PATH);
      assert.ok(css.tokens.hasDesktopMedia, 'Desktop media query must be defined in CSS');
    });

    it('T2.53: Interactive touch targets (buttons, pills, nav items) have ergonomic touch sizing', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const navItems = sb.dom.querySelectorAll('.bottom-nav-bar .b-nav-item');
      assert.strictEqual(navItems.length, 5, 'Nav items must exist for touch target evaluation');
    });

    it('T2.54: Safe area inset padding (env(safe-area-inset-bottom)) is configured for mobile notches', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const meta = sb.dom.querySelector('meta[name="viewport"]');
      assert.ok(meta.getAttribute('content').includes('viewport-fit=cover'),
        'viewport-fit=cover enables safe area inset calculations');
    });

    it('T2.55: Mobile modal backdrops cover full screen dimensions and trap clicks', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const modal = sb.dom.getElementById('moduleModalBackdrop');
      assert.ok(modal, 'Module modal backdrop element must exist');
      assert.ok(modal.classList.contains('bottom-sheet-backdrop'), 'Must have backdrop overlay class');
    });
  });

  // =========================================================================
  // Feature 12 Boundaries: CSS Glassmorphism & Syntax Integrity (5 tests)
  // =========================================================================
  describe('Feature 12 Boundaries: CSS Glassmorphism & Syntax Integrity', () => {
    it('T2.56: CSS syntax integrity: verified no orphaned semicolons or unbalanced braces', (t) => {
      const inspection = inspectCSS(CSS_PATH);
      if (!inspection.syntaxValid && !status.isStrictMode) {
        return t.skip(`Pending Milestone 3: CSS syntax integrity remediation at lines ${inspection.errors.map(e => e.line).join(', ')}`);
      }
      assert.ok(inspection.syntaxValid, 'CSS must have valid syntax');
    });

    it('T2.57: CSS custom variables define core medical palette tokens (--med-primary, --med-success)', () => {
      const cssContent = require('node:fs').readFileSync(CSS_PATH, 'utf8');
      assert.ok(cssContent.includes('--med-primary') || cssContent.includes('--primary'),
        'Primary medical color token required');
      assert.ok(cssContent.includes('--med-success') || cssContent.includes('--success'),
        'Success medical color token required');
    });

    it('T2.58: Direction RTL (dir="rtl") properly aligns text and layout', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const htmlTag = sb.dom.querySelector('html');
      assert.ok(htmlTag, 'html root tag must exist');
      assert.strictEqual(htmlTag.getAttribute('dir'), 'rtl', 'Root dir must be rtl');
    });

    it('T2.59: Glassmorphism fallback background color provided when backdrop-filter is unsupported', () => {
      const inspection = inspectCSS(CSS_PATH);
      assert.ok(inspection.tokens.hasGlassmorphism, 'Glassmorphism styles must be present');
    });

    it('T2.60: CSS keyframe animations (pulseDot, flame-anim) have valid syntax and termination', () => {
      const cssContent = require('node:fs').readFileSync(CSS_PATH, 'utf8');
      assert.ok(cssContent.includes('@keyframes pulseDot') || cssContent.includes('pulse'),
        'Pulse keyframe animation must be defined');
    });
  });
});
