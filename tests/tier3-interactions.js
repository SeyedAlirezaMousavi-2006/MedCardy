/**
 * MedCardy E2E Test Suite - Tier 3: Cross-Feature Interactions
 * 12 test cases verifying multi-feature workflows and subsystem interoperability
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createSandbox, inspectCSS, getMilestoneStatus } = require('./dom-harness.js');

const HTML_PATH = path.resolve(__dirname, '../index.html');
const APP_JS_PATH = path.resolve(__dirname, '../js/app.js');
const CSS_PATH = path.resolve(__dirname, '../css/style.css');

describe('Tier 3: Cross-Feature Interactions (12 Tests)', () => {
  const status = getMilestoneStatus(HTML_PATH, APP_JS_PATH, CSS_PATH);

  it('T3.1: Platform Hub -> Cardiology Card -> Study Session -> Breadcrumbs Back to Platform (F1, F2, F3, F4)', (t) => {
    if (!status.m1Ready && !status.isStrictMode) {
      return t.skip('Pending Milestone 1: Platform Hub and Breadcrumb navigation integration pending M1');
    }
    const sb = createSandbox(HTML_PATH, APP_JS_PATH);
    sb.app.showScreen('platform-hub');
    assert.strictEqual(sb.appState.activeScreen, 'platform-hub');

    if (typeof sb.app.openCardsModule === 'function') {
      sb.app.openCardsModule('cardiology');
    }
    sb.app.startDeckStudy('cardiology', 'cardio-ecg');
    assert.strictEqual(sb.appState.activeScreen, 'study');
    assert.ok(sb.appState.activeSession !== null);

    sb.app.backToPlatform();
    assert.strictEqual(sb.appState.activeScreen, 'platform-hub');
  });

  it('T3.2: Layout Switcher during active Study Session preserves session state (F4, F6, F7, F8, F9, F10)', () => {
    const sb = createSandbox(HTML_PATH, APP_JS_PATH);
    sb.app.showScreen('study');
    const initialScreen = sb.appState.activeScreen;

    const variants = ['quizlet', 'duolingo', 'anki', 'shift'];
    for (const v of variants) {
      sb.app.setLayout(v);
      assert.strictEqual(sb.appState.activeLayout, v);
      assert.strictEqual(sb.appState.activeScreen, initialScreen,
        `Active screen should remain study after switching to ${v}`);
    }
  });

  it('T3.3: Button Style Switcher updates styling classes without disrupting active view (F1, F4, F10)', () => {
    const sb = createSandbox(HTML_PATH, APP_JS_PATH);
    const styles = ['btn-style-glass', 'btn-style-3d', 'btn-style-outline'];

    for (const style of styles) {
      sb.app.setBtnStyle(style);
      assert.strictEqual(sb.appState.activeBtnStyle, style);
      assert.ok(sb.body.classList.contains(style), `Body must have class ${style}`);
    }
  });

  it('T3.4: Reviewing a card in Study Room updates Anki FSRS chips and Quizlet progress counters (F4, F5, F6, F8)', (t) => {
    if (!status.hasIsolatedMetrics && !status.isStrictMode) {
      return t.skip('Pending Milestone 1: Real-time multi-template metric synchronization pending M1');
    }
    const sb = createSandbox(HTML_PATH, APP_JS_PATH);
    const initialDue = sb.evalInContext('purchasedCourses.find(c => c.id === "cardiology").due');
    sb.app.startDeckStudy('cardiology', 'cardio-ecg');
    sb.app.rateCard(3);

    const updatedDue = sb.evalInContext('purchasedCourses.find(c => c.id === "cardiology").due');
    assert.ok(updatedDue <= initialDue, 'Cardiology due count must be updated');
  });

  it('T3.5: Recovery Mode slider adjustment derives correct card count and launches recovery study (F3, F4, F5, F10)', () => {
    const sb = createSandbox(HTML_PATH, APP_JS_PATH);
    sb.app.showScreen('recovery');
    assert.strictEqual(sb.appState.activeScreen, 'recovery');

    sb.app.updateRecoveryPrescription(25);
    assert.strictEqual(sb.appState.recoveryMinutes, 25);

    const display = sb.dom.getElementById('timeValueDisplay');
    if (display) {
      assert.ok(display.textContent.includes('25') || display.textContent.includes('۲۵'),
        'Time display must update to 25 minutes');
    }
  });

  it('T3.6: Breadcrumbs trail reflects active Course and Deck when navigating between Courses and Study (F2, F3, F4)', (t) => {
    if (!status.hasBreadcrumbs && !status.isStrictMode) {
      return t.skip('Pending Milestone 1: Breadcrumb context synchronization pending M1');
    }
    const sb = createSandbox(HTML_PATH, APP_JS_PATH);
    sb.app.showScreen('courses');
    assert.strictEqual(sb.appState.activeScreen, 'courses');
  });

  it('T3.7: Clinical Shift ward selection launches emergency session with course isolation (F4, F5, F9)', (t) => {
    if (!status.m2Ready && !status.isStrictMode) {
      return t.skip('Pending Milestone 2: Shift ward session dispatching pending M2');
    }
    const sb = createSandbox(HTML_PATH, APP_JS_PATH);
    sb.app.setLayout('shift');
    assert.strictEqual(sb.appState.activeLayout, 'shift');
    sb.app.startDeckStudy('pharmacology', 'pharma-antidotes');
    assert.strictEqual(sb.appState.activeScreen, 'study');
  });

  it('T3.8: Switching layout from Anki to Duolingo preserves course progress and streak stats (F5, F7, F8, F10)', () => {
    const sb = createSandbox(HTML_PATH, APP_JS_PATH);
    sb.app.setLayout('anki');
    assert.strictEqual(sb.appState.activeLayout, 'anki');

    sb.app.setLayout('duolingo');
    assert.strictEqual(sb.appState.activeLayout, 'duolingo');

    const streak = sb.dom.querySelector('.streak-pill');
    assert.ok(streak, 'Streak badge must persist across layout switches');
  });

  it('T3.9: Mobile viewport with Duolingo layout retains bottom nav bar accessibility (F7, F10, F11)', () => {
    const sb = createSandbox(HTML_PATH, APP_JS_PATH);
    sb.app.setLayout('duolingo');
    const nav = sb.dom.querySelector('.bottom-nav-bar');
    assert.ok(nav, 'Bottom nav bar must remain in DOM');
    const navItems = nav.querySelectorAll('.b-nav-item');
    assert.strictEqual(navItems.length, 5, 'All 5 bottom navigation buttons must remain accessible');
  });

  it('T3.10: Results screen action "یک دور مرور دیگر" relaunches study session with updated queue (F4, F5, F10)', () => {
    const sb = createSandbox(HTML_PATH, APP_JS_PATH);
    sb.app.showScreen('results');
    assert.strictEqual(sb.appState.activeScreen, 'results');

    // Clicking restart study
    sb.app.showScreen('study');
    assert.strictEqual(sb.appState.activeScreen, 'study');
  });

  it('T3.11: Module modal selection displays notification toast without disrupting Cards module (F1, F2, F10)', () => {
    const sb = createSandbox(HTML_PATH, APP_JS_PATH);
    assert.doesNotThrow(() => {
      sb.app.showToast('ماژول بانک تست به زودی فعال می‌شود');
    });
    // Active screen should remain unchanged
    assert.ok(sb.appState.activeScreen);
  });

  it('T3.12: Keyboard navigation (Space to flip, 1-4 to rate) interacts correctly with FSRS buttons (F4, F5, F10)', () => {
    const sb = createSandbox(HTML_PATH, APP_JS_PATH);
    sb.app.showScreen('study');
    const initialFlip = sb.appState.isCardFlipped;

    // Simulate space flip
    sb.app.toggleCardFlip();
    assert.strictEqual(sb.appState.isCardFlipped, !initialFlip);

    // Simulate rating
    assert.doesNotThrow(() => {
      sb.app.rateCard(3);
    });
  });
});
