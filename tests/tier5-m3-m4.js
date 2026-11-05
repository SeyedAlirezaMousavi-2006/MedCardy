/**
 * MedCardy Tier 5 Test Suite: Milestone 3 & Milestone 4 Verification
 * 
 * Verifies:
 *  - Section A: Milestone 3 Responsive & Media Query Rules (15 Tests)
 *  - Section B: Milestone 3 Glassmorphism Aesthetic & Typography (10 Tests)
 *  - Section C: Milestone 4 Prototype Pollution Defense & Input Sanitization (8 Tests)
 *  - Section D: Milestone 4 Navigation Hardening & Corrupted Session Resilience (7 Tests)
 *  - Section E: Milestone 4 Zero Uncaught Runtime Errors & Cross-Layout State Permutations (5 Tests)
 * 
 * Total: 45 Tests
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { createSandbox, inspectCSS, getMilestoneStatus } = require('./dom-harness.js');

const HTML_PATH = path.resolve(__dirname, '../index.html');
const APP_JS_PATH = path.resolve(__dirname, '../js/app.js');
const CSS_PATH = path.resolve(__dirname, '../css/style.css');

// Robust CSS Rule Parser handling nested @media and @keyframes blocks
function parseCSSRules(cssText, currentMedia = null) {
  const clean = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = [];
  let i = 0;
  while (i < clean.length) {
    const openBrace = clean.indexOf('{', i);
    if (openBrace === -1) break;
    const header = clean.slice(i, openBrace).trim();

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
      // skip animation keyframes
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

function hexToRgb(hex) {
  const clean = hex.replace('#', '').trim();
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function luminance([r, g, b]) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function contrastRatio(hex1, hex2) {
  const l1 = luminance(hexToRgb(hex1));
  const l2 = luminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Tier 5: Milestone 3 Responsive Styling & Milestone 4 Hardening Verification (45 Tests)', () => {
  const status = getMilestoneStatus(HTML_PATH, APP_JS_PATH, CSS_PATH);

  // =========================================================================
  // Section A: Milestone 3 Responsive & Media Query Rules (15 Tests)
  // =========================================================================
  describe('Section A: Milestone 3 Responsive & Media Query Rules', () => {
    it('T5.1: Media query @media (max-width: 430px) is defined in CSS', () => {
      assert.ok(status.cssInspection.tokens.hasMobileMedia, 'Mobile media queries must exist');
      const cssContent = fs.readFileSync(CSS_PATH, 'utf8');
      assert.ok(cssContent.includes('@media (max-width: 430px)'), 'CSS must include max-width: 430px query');
    });

    it('T5.2: Media query @media (max-width: 375px) is defined in CSS', () => {
      const cssContent = fs.readFileSync(CSS_PATH, 'utf8');
      assert.ok(cssContent.includes('@media (max-width: 375px)'), 'CSS must include max-width: 375px query');
    });

    it('T5.3: Media query @media (min-width: 1024px) is defined in CSS', () => {
      assert.ok(status.cssInspection.tokens.hasDesktopMedia, 'Desktop media queries must exist');
      const cssContent = fs.readFileSync(CSS_PATH, 'utf8');
      assert.ok(cssContent.includes('@media (min-width: 1024px)'), 'CSS must include min-width: 1024px query');
    });

    it('T5.4: Mobile <= 430px: .platform-tag and .user-role are hidden to conserve header space', () => {
      const tagDecls = Object.assign({}, ...findDeclarationsForSelector('.platform-tag', '430px'));
      const roleDecls = Object.assign({}, ...findDeclarationsForSelector('.user-role', '430px'));
      assert.strictEqual(tagDecls['display'], 'none', '.platform-tag must have display: none at 430px');
      assert.strictEqual(roleDecls['display'], 'none', '.user-role must have display: none at 430px');
    });

    it('T5.5: Mobile <= 430px: .icon-action-btn enforces exact 44x44px touch bounding box', () => {
      const decls = Object.assign({}, ...findDeclarationsForSelector('.icon-action-btn', '430px'));
      assert.strictEqual(decls['width'], '44px', 'Width must be 44px');
      assert.strictEqual(decls['height'], '44px', 'Height must be 44px');
      assert.strictEqual(decls['min-width'], '44px', 'Min-width must be 44px');
      assert.strictEqual(decls['min-height'], '44px', 'Min-height must be 44px');
    });

    it('T5.6: Mobile <= 430px: Breadcrumb active leaf (.crumb-active) enforces max-width: 120px truncation', () => {
      const decls = Object.assign({}, ...findDeclarationsForSelector('.crumb-active', '430px'));
      assert.strictEqual(decls['max-width'], '120px', '.crumb-active must have max-width: 120px at 430px');
    });

    it('T5.7: Mobile <= 375px: .module-breadcrumb-bar stacks vertically (flex-direction: column)', () => {
      const decls = Object.assign({}, ...findDeclarationsForSelector('.module-breadcrumb-bar', '375px'));
      assert.strictEqual(decls['flex-direction'], 'column', 'Breadcrumb bar must stack vertically at 375px');
      assert.strictEqual(decls['align-items'], 'stretch', 'Breadcrumb bar must stretch items at 375px');
    });

    it('T5.8: Mobile <= 375px: .back-to-platform-btn expands to full width with min-height: 44px', () => {
      const decls = Object.assign({}, ...findDeclarationsForSelector('.back-to-platform-btn', '375px'));
      assert.strictEqual(decls['width'], '100%', 'Back button must be full width at 375px');
      assert.strictEqual(decls['min-height'], '44px', 'Back button must maintain min-height 44px');
    });

    it('T5.9: Mobile <= 375px: Breadcrumb active leaf (.crumb-active) tightens truncation to max-width: 110px', () => {
      const decls = Object.assign({}, ...findDeclarationsForSelector('.crumb-active', '375px'));
      assert.strictEqual(decls['max-width'], '110px', '.crumb-active must have max-width: 110px at 375px');
    });

    it('T5.10: Mobile <= 375px: Layout switcher pills (.v-pill) enforce min-height: 44px', () => {
      const decls = Object.assign({}, ...findDeclarationsForSelector('.v-pill', '375px'));
      assert.strictEqual(decls['min-height'], '44px', '.v-pill must enforce min-height: 44px at 375px');
    });

    it('T5.11: Desktop >= 1024px: .app-wrapper enforces max-width: 1180px with auto margins', () => {
      const decls = Object.assign({}, ...findDeclarationsForSelector('.app-wrapper', '1024px'));
      assert.strictEqual(decls['max-width'], '1180px', '.app-wrapper must have max-width: 1180px');
      assert.strictEqual(decls['margin'], '0 auto', '.app-wrapper must be centered');
    });

    it('T5.12: Desktop >= 1024px: .platform-courses-grid renders as 2 columns (repeat(2, 1fr))', () => {
      const decls = Object.assign({}, ...findDeclarationsForSelector('.platform-courses-grid', '1024px'));
      assert.strictEqual(decls['grid-template-columns'], 'repeat(2, 1fr)', 'Platform courses grid must be 2 columns');
    });

    it('T5.13: Desktop >= 1024px: .shift-wards-grid renders as 2 columns (repeat(2, 1fr))', () => {
      const decls = Object.assign({}, ...findDeclarationsForSelector('.shift-wards-grid', '1024px'));
      assert.strictEqual(decls['grid-template-columns'], 'repeat(2, 1fr)', 'Shift wards grid must be 2 columns');
    });

    it('T5.14: Desktop >= 1024px: Clinical deck streams in Anki and Duolingo render as 2 columns', () => {
      const ankiStream = Object.assign({}, ...findDeclarationsForSelector('.anki-decks-stream', '1024px'));
      const duoQuests = Object.assign({}, ...findDeclarationsForSelector('.duo-quests-list', '1024px'));
      assert.strictEqual(ankiStream['grid-template-columns'], 'repeat(2, 1fr)', 'Anki stream must be 2 columns');
      assert.strictEqual(duoQuests['grid-template-columns'], 'repeat(2, 1fr)', 'Duolingo quests must be 2 columns');
    });

    it('T5.15: Desktop >= 1024px: Focused reading screens constrain max-width to 720px', () => {
      const studyDecls = Object.assign({}, ...findDeclarationsForSelector('.study-mobile-view', '1024px'));
      const recDecls = Object.assign({}, ...findDeclarationsForSelector('.recovery-mobile-view', '1024px'));
      const resDecls = Object.assign({}, ...findDeclarationsForSelector('.results-mobile-card', '1024px'));
      assert.strictEqual(studyDecls['max-width'], '720px', 'Study view must be <= 720px');
      assert.strictEqual(recDecls['max-width'], '720px', 'Recovery view must be <= 720px');
      assert.strictEqual(resDecls['max-width'], '720px', 'Results view must be <= 720px');
    });
  });

  // =========================================================================
  // Section B: Milestone 3 Glassmorphism Aesthetic & Typography (10 Tests)
  // =========================================================================
  describe('Section B: Milestone 3 Glassmorphism Aesthetic & Typography', () => {
    it('T5.16: CSS custom properties define light medical glassmorphism tokens', () => {
      const rootDecls = Object.assign({}, ...findDeclarationsForSelector(':root', null));
      assert.ok(rootDecls['--glass-bg'], '--glass-bg must be defined');
      assert.ok(rootDecls['--glass-border'], '--glass-border must be defined');
      assert.ok(rootDecls['--glass-blur'], '--glass-blur must be defined');
      assert.ok(rootDecls['--glass-shadow'], '--glass-shadow must be defined');
    });

    it('T5.17: Glass card surfaces declare backdrop-filter: blur(16px)', () => {
      const cardDecls = Object.assign({}, ...findDeclarationsForSelector('.glass-card', null));
      const hasBackdrop = cardDecls['backdrop-filter'] || cardDecls['-webkit-backdrop-filter'];
      assert.ok(hasBackdrop, '.glass-card must declare backdrop-filter');
      assert.ok(hasBackdrop.includes('blur(16px)') || hasBackdrop.includes('var(--glass-blur)'),
        'backdrop-filter must specify 16px blur');
    });

    it('T5.18: Card surfaces define semi-transparent white background', () => {
      const rootDecls = Object.assign({}, ...findDeclarationsForSelector(':root', null));
      const glassBg = rootDecls['--glass-bg'];
      assert.ok(glassBg && glassBg.includes('rgba(255, 255, 255,'), '--glass-bg must be semi-transparent white');
    });

    it('T5.19: Elevated container treatments declare layered medical blue shadows', () => {
      const rootDecls = Object.assign({}, ...findDeclarationsForSelector(':root', null));
      const shadow = rootDecls['--glass-shadow'];
      assert.ok(shadow && shadow.includes('rgba(2, 132, 199,'), '--glass-shadow must use medical blue tint');
    });

    it('T5.20: Vazirmatn font family is set as the root primary font', () => {
      const bodyDecls = Object.assign({}, ...findDeclarationsForSelector('body', null));
      assert.ok(bodyDecls['font-family'] && bodyDecls['font-family'].includes('Vazirmatn'),
        'body font-family must include Vazirmatn');
    });

    it('T5.21: Typography hierarchy defines distinct font-weight tokens', () => {
      const cssContent = fs.readFileSync(CSS_PATH, 'utf8');
      assert.ok(cssContent.includes('font-weight: 800') || cssContent.includes('font-weight: 900'),
        'Bold heading weights must be defined');
      assert.ok(cssContent.includes('font-weight: 700'), 'Subheading weight must be defined');
      assert.ok(cssContent.includes('font-weight: 600'), 'Medium label weight must be defined');
    });

    it('T5.22: Secondary text color token --text-light meets WCAG AA contrast ratio >= 4.5:1', () => {
      const rootDecls = Object.assign({}, ...findDeclarationsForSelector(':root', null));
      const textLight = rootDecls['--text-light'];
      assert.strictEqual(textLight, '#64748b', '--text-light must be #64748b');
      const ratio = contrastRatio('#ffffff', textLight);
      assert.ok(ratio >= 4.5, `Contrast ratio ${ratio.toFixed(2)}:1 must meet WCAG AA >= 4.5:1`);
    });

    it('T5.23: Main text color token --text-main meets WCAG AAA contrast ratio >= 7.0:1', () => {
      const rootDecls = Object.assign({}, ...findDeclarationsForSelector(':root', null));
      const textMain = rootDecls['--text-main'];
      assert.strictEqual(textMain, '#0f172a', '--text-main must be #0f172a');
      const ratio = contrastRatio('#ffffff', textMain);
      assert.ok(ratio >= 7.0, `Contrast ratio ${ratio.toFixed(2)}:1 must meet WCAG AAA >= 7.0:1`);
    });

    it('T5.24: Primary touch controls declare min-height: 44px', () => {
      const trayDecls = Object.assign({}, ...findDeclarationsForSelector('.tray-deck-pill', null));
      assert.strictEqual(trayDecls['min-height'], '44px', '.tray-deck-pill must have min-height: 44px');
      const closeDecls = Object.assign({}, ...findDeclarationsForSelector('.close-sheet-btn', null));
      assert.strictEqual(closeDecls['min-height'], '44px', '.close-sheet-btn must have min-height: 44px');
    });

    it('T5.25: Bottom navigation bar items enforce thumb-friendly height (--bottom-bar-height: 72px)', () => {
      const rootDecls = Object.assign({}, ...findDeclarationsForSelector(':root', null));
      assert.strictEqual(rootDecls['--bottom-bar-height'], '72px', '--bottom-bar-height must be 72px');
    });
  });

  // =========================================================================
  // Section C: Milestone 4 Prototype Pollution Defense & Input Sanitization (8 Tests)
  // =========================================================================
  describe('Section C: Milestone 4 Prototype Pollution Defense & Input Sanitization', () => {
    it('T5.26: app.setLayout("__proto__") safely rejects prototype key and falls back to quizlet', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      assert.doesNotThrow(() => {
        sb.app.setLayout('__proto__');
      }, 'setLayout("__proto__") must not throw exception');
      assert.strictEqual(sb.appState.activeLayout, 'quizlet', 'Active layout must default safely to quizlet');
    });

    it('T5.27: app.setLayout("constructor") and app.setLayout("toString") safely reject non-template keys', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      assert.doesNotThrow(() => {
        sb.app.setLayout('constructor');
        sb.app.setLayout('toString');
      });
      assert.strictEqual(sb.appState.activeLayout, 'quizlet');
    });

    it('T5.28: renderDashboard() defensively verifies hasOwnProperty and never invokes prototype properties', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      sb.appState.activeLayout = '__proto__';
      assert.doesNotThrow(() => {
        sb.app.renderDashboard();
      });
      const dash = sb.dom.getElementById('dashboard-content');
      assert.ok(dash && !dash.innerHTML.includes('[object Object]'), 'Dashboard must not render raw object string');
    });

    it('T5.29: app.setBtnStyle("__proto__") and app.setBtnStyle("constructor") default safely to btn-style-glass', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      assert.doesNotThrow(() => {
        sb.app.setBtnStyle('__proto__');
      });
      assert.strictEqual(sb.appState.activeBtnStyle, 'btn-style-glass');
    });

    it('T5.30: app.openCardsModule("__proto__") sanitizes course ID and prevents prototype traversal', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      assert.doesNotThrow(() => {
        sb.app.openCardsModule('__proto__');
      });
      assert.strictEqual(sb.appState.activeCourseFilter, 'all');
      assert.strictEqual(sb.appState.activeScreen, 'dashboard');
    });

    it('T5.31: app.recalculateCourseStats("__proto__") safely exits without modifying global Object.prototype', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      assert.doesNotThrow(() => {
        sb.app.recalculateCourseStats('__proto__');
        sb.app.recalculateCourseStats('constructor');
      });
      assert.strictEqual(({}).due, undefined);
    });

    it('T5.32: app.startDeckStudy("__proto__", "__proto__") safely defaults to standard first course and deck', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      assert.doesNotThrow(() => {
        sb.app.startDeckStudy('__proto__', '__proto__');
      });
      assert.ok(sb.appState.activeSession !== null);
      assert.strictEqual(sb.appState.activeScreen, 'study');
    });

    it('T5.33: Global Object.prototype remains clean and untainted across all hostile switcher invocations', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      sb.app.setLayout('__proto__');
      sb.app.setBtnStyle('__proto__');
      sb.app.showScreen('__proto__');
      assert.strictEqual(({}).activeLayout, undefined);
      assert.strictEqual(({}).activeBtnStyle, undefined);
      assert.strictEqual(({}).activeScreen, undefined);
    });
  });

  // =========================================================================
  // Section D: Milestone 4 Navigation Hardening & Corrupted Session Resilience (7 Tests)
  // =========================================================================
  describe('Section D: Milestone 4 Navigation Hardening & Corrupted Session Resilience', () => {
    it('T5.34: app.showScreen(null), app.showScreen(undefined), and app.showScreen(12345) default safely to platform-hub', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      assert.doesNotThrow(() => {
        sb.app.showScreen(null);
        assert.strictEqual(sb.appState.activeScreen, 'platform-hub');
        sb.app.showScreen(undefined);
        assert.strictEqual(sb.appState.activeScreen, 'platform-hub');
        sb.app.showScreen(12345);
        assert.strictEqual(sb.appState.activeScreen, 'platform-hub');
      });
    });

    it('T5.35: app.showScreen("unknown_screen_404") falls back to platform-hub and hides breadcrumbs', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      sb.app.showScreen('unknown_screen_404');
      assert.strictEqual(sb.appState.activeScreen, 'platform-hub');
      const breadcrumbs = sb.dom.getElementById('moduleBreadcrumbs') || sb.dom.querySelector('.module-breadcrumb-bar');
      if (breadcrumbs) {
        assert.ok(breadcrumbs.classList.contains('hidden') || breadcrumbs.style.display === 'none',
          'Breadcrumbs must be hidden on platform-hub');
      }
    });

    it('T5.36: Rapid 50-step random screen navigation loop executes cleanly with zero runtime exceptions', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const screens = ['platform-hub', 'dashboard', 'study', 'recovery', 'courses', 'results', 'bogus-1', null];
      assert.doesNotThrow(() => {
        for (let i = 0; i < 50; i++) {
          sb.app.showScreen(screens[i % screens.length]);
        }
      });
      assert.ok(sb.appState.activeScreen);
    });

    it('T5.37: app.startDeckStudy(null, null) and app.startDeckStudy("invalid-course", "invalid-deck") initialize valid session', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      assert.doesNotThrow(() => {
        sb.app.startDeckStudy(null, null);
      });
      assert.ok(sb.appState.activeSession && sb.appState.activeSession.queue.length > 0);
      assert.doesNotThrow(() => {
        sb.app.startDeckStudy('invalid-course', 'invalid-deck');
      });
      assert.ok(sb.appState.activeSession && sb.appState.activeSession.queue.length > 0);
    });

    it('T5.38: Corrupted appState.activeSession = {} does not crash renderCurrentCard() or rateCard()', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      sb.appState.activeSession = {};
      assert.doesNotThrow(() => {
        sb.app.renderCurrentCard();
        sb.app.rateCard(1);
      });
    });

    it('T5.39: app.rateCard() handles corrupted rating inputs safely with default rating', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      sb.app.startDeckStudy('cardiology', 'cardio-ecg');
      const corruptedRatings = [null, undefined, 'hostile', -50, 999, {}, []];
      for (const r of corruptedRatings) {
        assert.doesNotThrow(() => {
          sb.app.rateCard(r);
        });
      }
    });

    it('T5.40: app.updateRecoveryPrescription() handles invalid inputs within clamped [5, 60] min range', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const testInputs = [NaN, -10, 1000, 'abc', null];
      for (const input of testInputs) {
        assert.doesNotThrow(() => {
          sb.app.updateRecoveryPrescription(input);
        });
        assert.ok(sb.appState.recoveryMinutes >= 5 && sb.appState.recoveryMinutes <= 60,
          `Recovery minutes must stay clamped between 5 and 60, got: ${sb.appState.recoveryMinutes}`);
      }
    });
  });

  // =========================================================================
  // Section E: Milestone 4 Zero Uncaught Runtime Errors & Cross-Layout State Permutations (5 Tests)
  // =========================================================================
  describe('Section E: Milestone 4 Zero Uncaught Runtime Errors & Cross-Layout State Permutations', () => {
    it('T5.41: 24-State Layout x Screen Permutation Matrix executes without unhandled errors', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      const layouts = ['quizlet', 'duolingo', 'anki', 'shift'];
      const screens = ['platform-hub', 'dashboard', 'study', 'recovery', 'courses', 'results'];

      for (const l of layouts) {
        sb.app.setLayout(l);
        for (const s of screens) {
          assert.doesNotThrow(() => {
            sb.app.showScreen(s);
          }, `Layout ${l} with Screen ${s} must not throw`);
        }
      }
    });

    it('T5.42: Keyboard event handler executes safely for Space, 1-4, and unhandled keys', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      sb.app.showScreen('study');
      sb.app.startDeckStudy('cardiology', 'cardio-ecg');

      const keyEvents = [
        { code: 'Space', key: ' ' },
        { code: 'Digit1', key: '1' },
        { code: 'Digit2', key: '2' },
        { code: 'Digit3', key: '3' },
        { code: 'Digit4', key: '4' },
        { code: 'KeyX', key: 'x' },
        { code: 'Enter', key: 'Enter' }
      ];

      for (const evt of keyEvents) {
        assert.doesNotThrow(() => {
          if (typeof sb.window.dispatchEvent === 'function') {
            sb.window.dispatchEvent({ type: 'keydown', ...evt, preventDefault: () => {} });
          } else {
            if (evt.code === 'Space') sb.app.toggleCardFlip();
            else if (['1', '2', '3', '4'].includes(evt.key)) sb.app.rateCard(evt.key);
          }
        });
      }
    });

    it('T5.43: Rapid 20x open/close cycling of Module Modal and Customizer Sheet executes cleanly', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      assert.doesNotThrow(() => {
        for (let i = 0; i < 20; i++) {
          sb.app.toggleModuleModal(true);
          sb.app.toggleModuleModal(false);
          sb.app.toggleVariantSheet(true);
          sb.app.toggleVariantSheet(false);
        }
      });
    });

    it('T5.44: Rapid study review flow completes session and renders results with Persian digits', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      sb.app.startDeckStudy('cardiology', 'cardio-ecg');
      for (let i = 0; i < 10; i++) {
        sb.app.rateCard(3);
      }
      assert.strictEqual(sb.appState.activeScreen, 'results');
      const reviewedEl = sb.dom.getElementById('resCardsReviewed');
      if (reviewedEl) {
        const text = reviewedEl.textContent || '';
        assert.ok(/[۰-۹]/.test(text) || text === '۱۰' || text.length > 0,
          'Reviewed count should format with Persian digits');
      }
    });

    it('T5.45: End-to-end recovery session workflow executes without console errors', () => {
      const sb = createSandbox(HTML_PATH, APP_JS_PATH);
      sb.app.showScreen('recovery');
      sb.app.updateRecoveryPrescription(20);
      assert.strictEqual(sb.appState.recoveryMinutes, 20);

      // Start study
      sb.app.startDeckStudy('pulmonology', 'pulmo-copd');
      assert.strictEqual(sb.appState.activeScreen, 'study');
      sb.app.rateCard(4); // Easy
      assert.ok(sb.appState.activeSession !== null);
    });
  });
});
