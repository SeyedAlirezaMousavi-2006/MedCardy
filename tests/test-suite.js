/**
 * MedCardy Comprehensive E2E Test Suite Runner
 * Executes all 4 tiers of tests:
 *  - Tier 1: Feature Coverage (60 tests)
 *  - Tier 2: Boundary & Corner Cases (60 tests)
 *  - Tier 3: Cross-Feature Interactions (12 tests)
 *  - Tier 4: Real-World Clinical Application Scenarios (5 tests)
 *
 * Usage:
 *  node tests/test-suite.js              # Standard progressive execution (exits 0)
 *  node tests/test-suite.js --strict     # Strict TDD execution (fails pending milestones)
 */

const path = require('node:path');
const { getMilestoneStatus } = require('./dom-harness.js');

const HTML_PATH = path.resolve(__dirname, '../index.html');
const APP_JS_PATH = path.resolve(__dirname, '../js/app.js');
const CSS_PATH = path.resolve(__dirname, '../css/style.css');

// Parse CLI flags
const args = process.argv.slice(2);
const tierArg = args.find(a => a.startsWith('--tier='));
const targetTier = tierArg ? parseInt(tierArg.split('=')[1], 10) : null;

// Print Test Suite Banner
console.log('='.repeat(72));
console.log('  🫀 MedCardy UI/UX E2E Test Suite - 4-Tier Verification');
console.log('='.repeat(72));

const status = getMilestoneStatus(HTML_PATH, APP_JS_PATH, CSS_PATH);
console.log(`Execution Mode: ${status.isStrictMode ? 'STRICT TDD' : 'PROGRESSIVE MILESTONE'}`);
console.log(`Milestone Readiness:`);
console.log(`  - M1 (Platform Hub & Data Architecture): ${status.m1Ready ? 'READY' : 'PENDING'}`);
console.log(`  - M2 (4 Dashboard Layouts & Switchers):  ${status.m2Ready ? 'READY' : 'PENDING'}`);
console.log(`  - M3 (CSS Glassmorphism & Responsive):   ${status.m3Ready ? 'READY' : 'PENDING'}`);
console.log('='.repeat(72) + '\n');

// Load selected tier or all tiers
if (!targetTier || targetTier === 1) {
  require('./tier1-features.js');
}
if (!targetTier || targetTier === 2) {
  require('./tier2-boundaries.js');
}
if (!targetTier || targetTier === 3) {
  require('./tier3-interactions.js');
}
if (!targetTier || targetTier === 4) {
  require('./tier4-scenarios.js');
}
