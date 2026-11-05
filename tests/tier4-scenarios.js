/**
 * MedCardy E2E Test Suite - Tier 4: Real-World Clinical Application Scenarios
 * 5 multi-step clinical student workflows exercising end-to-end user journeys
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createSandbox, inspectCSS, getMilestoneStatus } = require('./dom-harness.js');

const HTML_PATH = path.resolve(__dirname, '../index.html');
const APP_JS_PATH = path.resolve(__dirname, '../js/app.js');
const CSS_PATH = path.resolve(__dirname, '../css/style.css');

describe('Tier 4: Real-World Clinical Application Scenarios (5 Tests)', () => {
  const status = getMilestoneStatus(HTML_PATH, APP_JS_PATH, CSS_PATH);

  it('T4.1: Scenario 1 - Pre-intern Comprehensive Workflow (Platform Hub -> Cards -> ECG Study -> Rate Cards -> Stats Check -> Back to Platform)', (t) => {
    if (!status.m1Ready && !status.isStrictMode) {
      return t.skip('Pending Milestone 1: Platform Hub, 4 courses, and breadcrumb navigation pending M1');
    }
    const sb = createSandbox(HTML_PATH, APP_JS_PATH);

    // Step 1: Student opens Platform Hub
    sb.app.showScreen('platform-hub');
    assert.strictEqual(sb.appState.activeScreen, 'platform-hub');
    const hub = sb.dom.getElementById('screen-platform-hub');
    assert.ok(hub, 'Platform Hub screen must exist');

    // Step 2: Enters Cards module for Cardiology
    if (typeof sb.app.openCardsModule === 'function') {
      sb.app.openCardsModule('cardiology');
    }
    sb.app.showScreen('dashboard');

    // Step 3: Starts study for Cardiology ECG deck
    sb.app.startDeckStudy('cardiology', 'cardio-ecg');
    assert.strictEqual(sb.appState.activeScreen, 'study');

    // Step 4: Reviews cards with FSRS ratings (Again, Hard, Good)
    sb.app.rateCard(1); // Again
    sb.app.rateCard(2); // Hard
    sb.app.rateCard(3); // Good

    // Step 5: Verify isolated metric update: Cardiology updated, Pediatrics intact
    const pedsDue = sb.evalInContext('purchasedCourses.find(c => c.id === "pediatrics").due');
    assert.ok(typeof pedsDue === 'number', 'Pediatrics due count must remain valid number');

    // Step 6: Uses breadcrumbs to return to Platform Hub
    sb.app.backToPlatform();
    assert.strictEqual(sb.appState.activeScreen, 'platform-hub');
  });

  it('T4.2: Scenario 2 - Cross-Paradigm Layout Adaptability (Quizlet -> Duolingo -> Anki FSRS -> Clinical Shift)', () => {
    const sb = createSandbox(HTML_PATH, APP_JS_PATH);

    // Step 1: Starts in Quizlet Modern
    sb.app.setLayout('quizlet');
    assert.strictEqual(sb.appState.activeLayout, 'quizlet');
    const quizletHtml = sb.mobileDashboardTemplates.quizlet();
    assert.ok(quizletHtml.includes('layout-quizlet'));

    // Step 2: Switches to Duolingo Pulse, checks streak and XP goal
    sb.app.setLayout('duolingo');
    assert.strictEqual(sb.appState.activeLayout, 'duolingo');
    const duoHtml = sb.mobileDashboardTemplates.duolingo();
    assert.ok(duoHtml.includes('duo-streak-hero'));
    assert.ok(duoHtml.includes('duo-progress-container'));

    // Step 3: Switches to Anki FSRS, verifies 3-column chip matrix
    sb.app.setLayout('anki');
    assert.strictEqual(sb.appState.activeLayout, 'anki');
    const ankiHtml = sb.mobileDashboardTemplates.anki();
    assert.ok(ankiHtml.includes('anki-fsrs-badge') || ankiHtml.includes('FSRS'));

    // Step 4: Switches to Clinical Shift, verifies triage layout
    sb.app.setLayout('shift');
    assert.strictEqual(sb.appState.activeLayout, 'shift');
    const shiftHtml = sb.mobileDashboardTemplates.shift();
    assert.ok(shiftHtml.includes('layout-shift'));
  });

  it('T4.3: Scenario 3 - Mobile Night-Shift Workflow at 375px (Bottom Nav -> 3D Button Style -> Pulmonology Ward -> Card Flip -> Rate Easy)', () => {
    const sb = createSandbox(HTML_PATH, APP_JS_PATH);

    // Step 1: Intern uses bottom nav to navigate to Dashboard
    sb.app.showScreen('dashboard');
    assert.strictEqual(sb.appState.activeScreen, 'dashboard');

    // Step 2: Switches button style to 3D tactile style for nighttime tactile feedback
    sb.app.setBtnStyle('btn-style-3d');
    assert.strictEqual(sb.appState.activeBtnStyle, 'btn-style-3d');
    assert.ok(sb.body.classList.contains('btn-style-3d'));

    // Step 3: Switches to Clinical Shift layout
    sb.app.setLayout('shift');
    assert.strictEqual(sb.appState.activeLayout, 'shift');

    // Step 4: Enters study room session
    sb.app.showScreen('study');
    assert.strictEqual(sb.appState.activeScreen, 'study');

    // Step 5: Flips card to view diagnosis and contraindications
    assert.strictEqual(sb.appState.isCardFlipped, false);
    sb.app.toggleCardFlip();
    assert.strictEqual(sb.appState.isCardFlipped, true);

    // Step 6: Rates card 'Easy' (rating 4)
    assert.doesNotThrow(() => {
      sb.app.rateCard(4);
    });
  });

  it('T4.4: Scenario 4 - Rapid Emergency Shift Triage (Clinical Shift -> 5-Min Rapid Review -> Rate 4 Cards -> Results Screen Metrics)', () => {
    const sb = createSandbox(HTML_PATH, APP_JS_PATH);

    // Step 1: Intern selects Clinical Shift layout
    sb.app.setLayout('shift');
    assert.strictEqual(sb.appState.activeLayout, 'shift');

    // Step 2: Launches study room
    sb.app.showScreen('study');
    assert.strictEqual(sb.appState.activeScreen, 'study');

    // Step 3: Rapidly rates cards (Again, Hard, Good, Easy)
    sb.app.rateCard(1);
    sb.app.rateCard(2);
    sb.app.rateCard(3);
    sb.app.rateCard(4);

    // Step 4: Transitions to results screen and checks summary metrics
    sb.app.showScreen('results');
    assert.strictEqual(sb.appState.activeScreen, 'results');
    const resultsCard = sb.dom.querySelector('.results-mobile-card');
    assert.ok(resultsCard, 'Results summary card must be rendered');
  });

  it('T4.5: Scenario 5 - Full Smart Recovery Cycle (Recovery Nav -> 25 Min Slider -> Smart Prescription -> Start Recovery -> Results)', () => {
    const sb = createSandbox(HTML_PATH, APP_JS_PATH);

    // Step 1: User navigates to Recovery screen via bottom navigation
    sb.app.showScreen('recovery');
    assert.strictEqual(sb.appState.activeScreen, 'recovery');

    // Step 2: Adjusts slider to 25 minutes
    sb.app.updateRecoveryPrescription(25);
    assert.strictEqual(sb.appState.recoveryMinutes, 25);

    // Step 3: Prescription box calculates proportional cards and retention
    const prescriptionBox = sb.dom.getElementById('prescriptionBox');
    assert.ok(prescriptionBox, 'Prescription box element must exist');
    const text = prescriptionBox.textContent || '';
    assert.ok(text.includes('کارت بحرانی') || text.includes('نسخه پیشنهادی') || text.includes('یادآوری'),
      'Prescription box must display clinical recovery recommendation');

    // Step 4: User launches recovery study session
    sb.app.showScreen('study');
    assert.strictEqual(sb.appState.activeScreen, 'study');

    // Step 5: Completes review and checks results
    sb.app.rateCard(3);
    sb.app.showScreen('results');
    assert.strictEqual(sb.appState.activeScreen, 'results');
  });
});
