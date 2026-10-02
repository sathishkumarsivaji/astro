/**
 * ASTROVERSE — P0-24 Negative Data Matrix Test
 * 
 * Verifies that missing or incomplete astronomical/astrological data produces
 * explicit INSUFFICIENT_DATA or null, and NEVER fabricates arbitrary defaults:
 * 0°, Aries, House 1, Pada 1, 28 SAV bindus, Sun Dasha, Rohini, or Mars Lagna Lord.
 * 
 * Enforces the non-negotiable rule:
 * VALID CALCULATED VALUE OR NULL / INSUFFICIENT_DATA
 */

import { readFileSync } from 'fs';
import { resolve, join } from 'path';
import { buildEvidenceChain } from './src/services/expertPrediction/evidenceChainBuilder.js';
import { 
  calculateDedicatedGocharDashboard, 
  calculatePlanetaryAvasthas,
  calculateNakshatraDispositorProfile 
} from './src/services/astroEngine.js';
import { generateAINewbornNames } from './src/services/babyNameEngine.js';
import { getRuleProvenance } from './src/config/ruleProvenanceRegistry.js';

const ROOT = resolve(import.meta.dirname || '.');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  \x1b[32m✓\x1b[0m ${message}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✗ FAIL:\x1b[0m ${message}`);
    failed++;
  }
}

console.log('\n============================================================');
console.log('ASTROVERSE P0-24 NEGATIVE DATA MATRIX SUITE');
console.log('============================================================\n');

// ------------------------------------------------------------
// Test 1: buildEvidenceChain("career", {}, {})
// ------------------------------------------------------------
console.log('Test 1: buildEvidenceChain with empty facts');
try {
  const result1 = buildEvidenceChain('career', {}, {});
  assert(result1.resolution === 'INSUFFICIENT_DATA', 
    `Test 1.1: resolution is INSUFFICIENT_DATA (got: ${result1.resolution})`);
  assert(result1.totalIndependentConfirmations === 0, 
    `Test 1.2: totalIndependentConfirmations === 0 (got: ${result1.totalIndependentConfirmations})`);
  
  // Ensure no fabricated signs or lords
  const nodes = result1.evidenceNodes || [];
  const fabricatedLagna = nodes.some(n => n.nodeId === 'NATAL_LAGNA' && n.sign === 'Mesha');
  const fabricatedDasha = nodes.some(n => n.nodeId === 'DASHA_MD' && n.lord === 'Sun');
  assert(!fabricatedLagna, 'Test 1.3: No fabricated Lagna Mesha in evidence nodes');
  assert(!fabricatedDasha, 'Test 1.4: No fabricated Sun Dasha in evidence nodes');
} catch (e) {
  assert(false, `Test 1 threw unexpected error: ${e.message}`);
}

// ------------------------------------------------------------
// Test 2: calculateDedicatedGocharDashboard({}, "2026-10-02")
// ------------------------------------------------------------
console.log('\nTest 2: calculateDedicatedGocharDashboard with empty chart');
try {
  const result2 = calculateDedicatedGocharDashboard({}, '2026-10-02');
  assert(result2.status === 'INSUFFICIENT_DATA', 
    `Test 2.1: status is INSUFFICIENT_DATA (got: ${result2.status})`);
  assert(result2.natalReference === null, 
    `Test 2.2: natalReference is null (got: ${result2.natalReference})`);
  assert(result2.sadeSati && result2.sadeSati.status === 'INSUFFICIENT_DATA', 
    `Test 2.3: sadeSati status is INSUFFICIENT_DATA (got: ${result2.sadeSati?.status})`);
  assert(result2.ashtamaShani && result2.ashtamaShani.status === 'INSUFFICIENT_DATA', 
    `Test 2.4: ashtamaShani status is INSUFFICIENT_DATA (got: ${result2.ashtamaShani?.status})`);
  assert(result2.kantakaShani && result2.kantakaShani.status === 'INSUFFICIENT_DATA', 
    `Test 2.5: kantakaShani status is INSUFFICIENT_DATA (got: ${result2.kantakaShani?.status})`);
  assert(result2.jupiterTransit && result2.jupiterTransit.status === 'INSUFFICIENT_DATA', 
    `Test 2.6: jupiterTransit status is INSUFFICIENT_DATA (got: ${result2.jupiterTransit?.status})`);
  assert(Array.isArray(result2.transits) && result2.transits.length === 0, 
    'Test 2.7: transits array is empty on insufficient input');
} catch (e) {
  assert(false, `Test 2 threw unexpected error: ${e.message}`);
}

// ------------------------------------------------------------
// Test 3: calculatePlanetaryAvasthas([{name:"Mars"}])
// ------------------------------------------------------------
console.log('\nTest 3: calculatePlanetaryAvasthas with missing longitude');
try {
  const result3 = calculatePlanetaryAvasthas([{ name: 'Mars' }]);
  assert(Array.isArray(result3) && result3.length === 1, 
    'Test 3.1: returns array with one planet record');
  const p = result3[0] || {};
  assert(p.status === 'INSUFFICIENT_DATA', 
    `Test 3.2: planet status is INSUFFICIENT_DATA (got: ${p.status})`);
  assert(p.sign === null, 
    `Test 3.3: planet sign is null (got: ${p.sign})`);
  assert(p.degreeInSign === null, 
    `Test 3.4: degreeInSign is null (got: ${p.degreeInSign})`);
  assert(p.house === null, 
    `Test 3.5: house is null (got: ${p.house})`);
  assert(p.baladi === null && p.jagratadi === null && p.deeptadi === null, 
    'Test 3.6: avasthas (baladi, jagratadi, deeptadi) are null');
} catch (e) {
  assert(false, `Test 3 threw unexpected error: ${e.message}`);
}

// ------------------------------------------------------------
// Test 4: generateAINewbornNames({})
// ------------------------------------------------------------
console.log('\nTest 4: generateAINewbornNames with empty inputs');
try {
  let threwExpected = false;
  let thrownMessage = '';
  try {
    await generateAINewbornNames({});
  } catch (err) {
    if (err.message && err.message.includes('INSUFFICIENT_DATA')) {
      threwExpected = true;
      thrownMessage = err.message;
    }
  }
  assert(threwExpected, 
    `Test 4.1: throws INSUFFICIENT_DATA error on empty input (got message: "${thrownMessage}")`);
} catch (e) {
  assert(false, `Test 4 threw unexpected error: ${e.message}`);
}

// ------------------------------------------------------------
// Test 5: Prediction config rule count == provenance registry coverage
// ------------------------------------------------------------
console.log('\nTest 5: Prediction config rule count == provenance registry coverage');
try {
  const cfgPath = join(ROOT, 'src/config/prediction_config.json');
  const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
  const ruleKeys = Object.keys(cfg.rules || {});
  
  assert(ruleKeys.length > 0, `Test 5.1: prediction_config.json contains ${ruleKeys.length} rules`);
  
  let fullyCovered = 0;
  const missingRules = [];
  
  for (const ruleId of ruleKeys) {
    const prov = getRuleProvenance(ruleId);
    if (prov && 
        prov.ruleId === ruleId && 
        prov.tradition && 
        prov.sourceTitle && 
        prov.implementationFormula && 
        prov.selectedConvention && 
        prov.validationStatus) {
      fullyCovered++;
    } else {
      missingRules.push(ruleId);
    }
  }
  
  assert(missingRules.length === 0, 
    `Test 5.2: Missing provenance for rules: [${missingRules.join(', ')}]`);
  assert(fullyCovered === ruleKeys.length, 
    `Test 5.3: Provenance coverage is 100% (${fullyCovered}/${ruleKeys.length})`);
} catch (e) {
  assert(false, `Test 5 threw unexpected error: ${e.message}`);
}

// ------------------------------------------------------------
// Test 6: No source calculated-value path uses arbitrary fallback
// (0, 1, 28, 30, house 1, Aries, Sun, Rohini, Pada 3, Mars)
// ------------------------------------------------------------
console.log('\nTest 6: Anti-fabrication check across calculated-value paths');
try {
  // 6.1 Dispositor profile does not default to house 1
  const dispositorProfile = calculateNakshatraDispositorProfile({
    name: 'Sun',
    longitude: 10.0 // house omitted
  }, []);
  assert(dispositorProfile && dispositorProfile.house === null, 
    `Test 6.1: Dispositor profile house is not defaulted to 1 (got: ${dispositorProfile?.house})`);

  // 6.2 Gochar SAV bindus does not default to 28
  const gocharFullChart = {
    moon: { longitude: 45.0, sign: 'Taurus', house: 1 },
    ascendant: { longitude: 40.0, sign: 'Taurus' }
    // Note: ashtakavarga is completely omitted
  };
  const gocharWithMissingSAV = calculateDedicatedGocharDashboard(gocharFullChart, '2026-10-02');
  const saturnTransit = (gocharWithMissingSAV.transits || []).find(t => t.name === 'Saturn');
  assert(saturnTransit && saturnTransit.savBindus === null, 
    `Test 6.2: Missing SAV does not default to 28 (got: ${saturnTransit?.savBindus})`);

  // 6.3 Static check: ensure removed fabricated literals do not exist in critical files
  const filesToScan = [
    'src/services/expertPrediction/evidenceChainBuilder.js',
    'src/services/babyNameEngine.js',
    'src/services/astroEngine.js'
  ];
  
  const forbiddenPatterns = [
    { pattern: /\|\|\s*['"]Mesha['"]/g, label: 'fallback to Mesha/Aries' },
    { pattern: /nakshatraName\s*=\s*['"]Rohini['"]/g, label: 'default nakshatra Rohini' },
    { pattern: /pada\s*=\s*3/g, label: 'default pada 3' },
    { pattern: /let\s+savBindus\s*=\s*28/g, label: 'hardcoded 28 SAV bindus default' }
  ];

  let patternViolations = 0;
  for (const relPath of filesToScan) {
    const fullPath = join(ROOT, relPath);
    const code = readFileSync(fullPath, 'utf8');
    for (const { pattern, label } of forbiddenPatterns) {
      if (pattern.test(code)) {
        console.error(`  Violation in ${relPath}: found ${label}`);
        patternViolations++;
      }
    }
  }
  assert(patternViolations === 0, 
    `Test 6.3: Static scan for prohibited default literals in core calculation services (violations: ${patternViolations})`);

} catch (e) {
  assert(false, `Test 6 threw unexpected error: ${e.message}`);
}

// ------------------------------------------------------------
// Summary
// ------------------------------------------------------------
console.log('\n============================================================');
console.log(`P0-24 RESULTS: ${passed} checks passed, ${failed} failed.`);
console.log('============================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\x1b[32mALL P0-24 NEGATIVE DATA TESTS COMPLETED SUCCESSFULLY.\x1b[0m\n');
}
