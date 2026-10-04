/**
 * ASTROVERSE — Behavioral Anti-Fabrication Invariant Test Suite
 * ============================================================
 * Rigorously verifies all 12 core anti-fabrication invariants across the
 * system to ensure absolute scientific defensibility, non-fabrication,
 * and fail-closed integrity under peer review.
 */

import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// 1. Domain & Fact Adapters
import {
  extractCanonicalFacts,
  getActiveDashaAtAge
} from './src/services/expertPrediction/canonicalFactAdapter.js';
import {
  createTimingWindow,
  createEvidenceNode,
  RESOLUTION
} from './src/services/expertPrediction/expertPredictionSchema.js';
import { buildStructuredClaimGraph, synthesizeExplanationFromGraph } from './src/services/claimGraphEngine.js';
import { calculatePlanetaryPositions } from './src/services/astroEngine.js';

// 2. Survival & Empirical Engine
import {
  FEATURE_STATE,
  getFeatureValueWithState,
  extractSubjectEventTime,
  predictDiscreteHazardSurvival,
  evaluateCohortDiscreteHazardSurvival,
  runRealDataFeatureAblation,
  runDiscreteHazardPermutationTest,
  SURVIVAL_AGE_BINS,
  TRAIN_DEMOGRAPHIC_BASELINE_HAZARD
} from './src/services/realWorldValidation/discreteHazardSurvivalEngine.js';

// 3. Cache Manager
import {
  computeSystemFingerprint,
  computeInputHash,
  getCachedPrediction,
  setCachedPrediction,
  invalidateAll
} from './src/services/realWorldValidation/predictionCacheManager.js';

console.log('\n===========================================================================');
console.log(' ASTROVERSE — BEHAVIORAL ANTI-FABRICATION INVARIANT VERIFICATION SUITE');
console.log('===========================================================================\n');

let passedCount = 0;
let totalCount = 0;

function check(desc, fn) {
  totalCount++;
  try {
    fn();
    console.log(`  ✓ [Invariant ${totalCount}] ${desc}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✗ [Invariant ${totalCount}] FAILED: ${desc}`);
    console.error(`    ${err.message}`);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// INVARIANT 1: Missing Antardasha (AD) returns null, never Mahadasha fallback
// ---------------------------------------------------------------------------
check('Missing Antardasha returns adLord: null and adTamil: null (never mdLord fallback)', () => {
  const dashaTableWithoutBukthis = [
    {
      lord: 'Jupiter',
      tamil: 'Guru',
      startAge: 20,
      endAge: 36,
      bukthis: [] // Missing Antardashas
    }
  ];

  const activePeriod = getActiveDashaAtAge(dashaTableWithoutBukthis, 25);
  assert.ok(activePeriod, 'Active period should be returned for age 25');
  assert.equal(activePeriod.mdLord, 'Jupiter', 'MD lord should be Jupiter');
  assert.equal(activePeriod.adLord, null, 'AD lord must be null when bukthis are absent (no MD substitution)');
  assert.equal(activePeriod.adTamil, null, 'AD Tamil lord must be null');
});

check('Antardasha with missing sub-period lord returns null (no mdLord fallback)', () => {
  const dashaTableEmptyBkLord = [
    {
      lord: 'Venus',
      tamil: 'Shukra',
      startAge: 20,
      endAge: 40,
      bukthis: [
        {
          startAge: 20,
          endAge: 23
          // subLord and lord omitted
        }
      ]
    }
  ];

  const activePeriodBk = getActiveDashaAtAge(dashaTableEmptyBkLord, 21);
  assert.ok(activePeriodBk, 'Active period should be returned for age 21');
  assert.equal(activePeriodBk.mdLord, 'Venus', 'MD lord should be Venus');
  assert.equal(activePeriodBk.adLord, null, 'Missing sub-period lord must evaluate to null, not Venus');
  assert.equal(activePeriodBk.adTamil, null, 'Missing sub-period tamil lord must evaluate to null');
});

// ---------------------------------------------------------------------------
// INVARIANT 2: Missing Model Artifact Coefficients Fails Closed
// ---------------------------------------------------------------------------
check('predictDiscreteHazardSurvival fails closed with MODEL_ARTIFACT_MISSING when beta is absent', () => {
  const dummyChart = {
    planetaryPositions: {
      Ascendant: { longitude: 10, sign: 'Aries', house: 1 },
      Venus: { longitude: 50, sign: 'Taurus', house: 2 }
    }
  };
  const dummyWindows = [{ startAge: 24, endAge: 27, activationScore: 0.8 }];

  // Call COMBINED_HAZARD without betaAstro
  const resCombined = predictDiscreteHazardSurvival(dummyChart, dummyWindows, {
    modelType: 'COMBINED_HAZARD'
    // betaAstro intentionally omitted
  });

  assert.equal(resCombined.status, 'MODEL_ARTIFACT_MISSING');
  assert.equal(resCombined.betaAstro, null);
  assert.equal(resCombined.occurrenceProbability, null);
  assert.equal(resCombined.expectedTimingAge, null);
});

check('evaluateCohortDiscreteHazardSurvival fails closed with MODEL_ARTIFACT_MISSING when beta is absent', () => {
  const cohort = [
    { birthYear: 1990, censoringStatus: 'EVENT', firstDocumentedMarriage: { marriageYear: 2016 }, hasDocumentedMarriage: true }
  ];
  const chartProvider = () => ({
    planetaryPositions: { Ascendant: { longitude: 0, sign: 'Aries', house: 1 } }
  });

  const res = evaluateCohortDiscreteHazardSurvival(cohort, chartProvider, {
    // betaAstro intentionally omitted
  });

  assert.equal(res.status, 'MODEL_ARTIFACT_MISSING');
  assert.equal(res.validationStatus, 'NOT_EMPIRICALLY_VALIDATED');
  assert.equal(res.concordanceIndex, null);
});

// ---------------------------------------------------------------------------
// INVARIANT 3: Multi-Factor Model Missing Coefficients Fails Closed
// ---------------------------------------------------------------------------
check('Multi-factor model fails closed if any of the 6 coefficients are missing or non-finite', () => {
  const dummyChart = {
    planetaryPositions: { Ascendant: { longitude: 10, sign: 'Aries', house: 1 } }
  };
  const dummyWindows = [];

  const res = predictDiscreteHazardSurvival(dummyChart, dummyWindows, {
    modelType: 'MULTI_FACTOR',
    coefficients: {
      betaDasha: 0.25,
      betaTransitJup: 0.15
      // Remaining 4 coefficients intentionally missing
    }
  });

  assert.equal(res.status, 'MODEL_ARTIFACT_MISSING');
  assert.ok(res.error.includes('Missing required fitted multi-factor coefficient'));
  assert.equal(res.expectedTimingAge, null);
  assert.equal(res.occurrenceProbability, null);
});

// ---------------------------------------------------------------------------
// INVARIANT 4: Missing/Non-event Timing Returns null (Never Arbitrary 26.0)
// ---------------------------------------------------------------------------
check('Expected timing returns null (never arbitrary fallback like 26.0) when distribution has zero density', () => {
  const chart = {
    planetaryPositions: { Ascendant: { longitude: 0, sign: 'Aries', house: 1 } }
  };
  // Fit with large negative beta to create zero hazard/event probabilities
  const pred = predictDiscreteHazardSurvival(chart, [], {
    modelType: 'COMBINED_HAZARD',
    betaAstro: 0.0,
    baselineTable: SURVIVAL_AGE_BINS.map(b => ({ ...b, hazardRate: 0.0, logit: -20.0 }))
  });

  assert.equal(pred.expectedTimingAge, null, 'Timing must be null when hazard probability is 0');
  assert.equal(pred.peakTimingAge, null);
  assert.equal(pred.interval80, null);
  assert.equal(pred.interval50, null);
});

// ---------------------------------------------------------------------------
// INVARIANT 5: Zero vs Missing Distinction via FEATURE_STATE
// ---------------------------------------------------------------------------
check('getFeatureValueWithState strictly distinguishes CALCULATED_ZERO from MISSING', () => {
  const featureBag = {
    DASHA_7TH_LORD: 0.0,            // Evaluated: condition not met
    VENUS_NATAL_PROMISE: null,       // Missing: Venus uncalculated
    ASHTAKAVARGA_7TH_SAV: 28,        // Evaluated: non-zero
    INVALID_STAT: NaN               // Error: calculation NaN
  };

  const dashaState = getFeatureValueWithState(featureBag, 'DASHA_7TH_LORD');
  assert.equal(dashaState.state, FEATURE_STATE.CALCULATED_ZERO);
  assert.equal(dashaState.value, 0.0);

  const venusState = getFeatureValueWithState(featureBag, 'VENUS_NATAL_PROMISE');
  assert.equal(venusState.state, FEATURE_STATE.MISSING);
  assert.equal(venusState.value, null);

  const savState = getFeatureValueWithState(featureBag, 'ASHTAKAVARGA_7TH_SAV');
  assert.equal(savState.state, FEATURE_STATE.CALCULATED_NONZERO);
  assert.equal(savState.value, 28);

  const errorState = getFeatureValueWithState(featureBag, 'INVALID_STAT');
  assert.equal(errorState.state, FEATURE_STATE.CALCULATION_ERROR);
  assert.equal(errorState.value, null);

  const naState = getFeatureValueWithState(featureBag, 'NON_EXISTENT_KEY');
  assert.equal(naState.state, FEATURE_STATE.NOT_APPLICABLE);
  assert.equal(naState.value, null);
});

// ---------------------------------------------------------------------------
// INVARIANT 6: Timing Window Resolution Defaults to NOT_ESTABLISHED (Never YEAR)
// ---------------------------------------------------------------------------
check('createTimingWindow defaults to NOT_ESTABLISHED (never empirical YEAR without validation)', () => {
  const timingWindow = createTimingWindow({
    domain: 'relationships',
    startAge: 25,
    endAge: 27
  });

  assert.equal(
    timingWindow.empiricalPredictiveResolution,
    'NOT_ESTABLISHED',
    'Empirical predictive resolution must default to NOT_ESTABLISHED without validation'
  );
  assert.notEqual(
    timingWindow.resolution,
    RESOLUTION.YEAR,
    'Timing window must NEVER default to YEAR'
  );
  assert.equal(
    timingWindow.resolution,
    RESOLUTION.INSUFFICIENT_DATA,
    'Unresolved window resolution must default to INSUFFICIENT_DATA'
  );
});

// ---------------------------------------------------------------------------
// INVARIANT 7: Calculation Confidence vs Predictive Probability Disentangled
// ---------------------------------------------------------------------------
check('createEvidenceNode separates calculationConfidence (1.0) from predictiveProbability (null)', () => {
  const node = createEvidenceNode({
    nodeId: 'node_d1_lagna',
    ruleId: 'lagna_in_aries',
    ruleName: 'Lagna in Aries',
    value: true,
    ruleWeight: 0.85
  });

  assert.equal(node.calculationStatus, 'CALCULATED');
  assert.equal(node.calculationConfidence, 1.0, 'Deterministic calculation success must have calculationConfidence = 1.0');
  assert.equal(node.predictiveProbability, null, 'Evidence node must NEVER fabricate a predictiveProbability');
  assert.equal(node.traditionalRuleWeight, 0.85, 'Traditional weight must be preserved separately');
  assert.equal(node.traditionalEvidenceStrength, 0.85, 'Traditional evidence strength defaults to traditional rule weight');
});

// ---------------------------------------------------------------------------
// INVARIANT 8: Claim Graph Outputs Factor Counts Without Pseudo-Probabilities
// ---------------------------------------------------------------------------
check('Claim Graph returns structured factor counts without pseudo-probabilities', () => {
  const chart = calculatePlanetaryPositions("1990-04-25", "05:56:00", 12.9165, 79.1325, "vedic", 5.5);
  const context = {
    system: { id: "lahiri" },
    chart: {
      ascendant: { sign: "Aries", degree: 14.5 },
      planets: chart.planets,
      currentDasha: { lord: "Jupiter", subLord: "Mars" },
      vargas: {
        d9: { ascendant: { sign: "Leo" }, planets: chart.planets },
        d10: { ascendant: { sign: "Sagittarius" }, planets: chart.planets }
      }
    },
    report: {
      activeSectionData: {},
      evidence: { evidenceIds: ["C01", "C02", "M01"] }
    }
  };

  const graph = buildStructuredClaimGraph('career', context);
  assert.ok(graph.claims.length > 0, 'Graph should have claims');

  for (const claim of graph.claims) {
    assert.ok(typeof claim.traditionalConvergence === 'string', 'Convergence level must be qualitative string');
    assert.ok(typeof claim.traditionalRuleConvergenceScore === 'number', 'Convergence score must be numeric');
    assert.ok(typeof claim.traditionalEvidenceCount === 'number', 'Traditional evidence count must be numeric');
    assert.ok(typeof claim.independentEvidenceGroups === 'number', 'Independent group count must be numeric');
    assert.ok(typeof claim.counterIndicatorsCount === 'number', 'Counter indicator count must be numeric');
    assert.equal(claim.predictiveProbability, undefined, 'Claim must NOT fabricate predictive probability');
  }

  const narrativeEn = synthesizeExplanationFromGraph(graph, 'en');
  assert.ok(!narrativeEn.includes('probability:'), 'Narrative must not present pseudo-probability');
  assert.ok(narrativeEn.includes('factors,'), 'Narrative should state factor count');
  assert.ok(narrativeEn.includes('not an empirical probability'), 'Narrative should state qualitative assessment not probability');
});

// ---------------------------------------------------------------------------
// INVARIANT 9: Exact Event Dates Yield Exact Decimal Ages (groundTruthPrecision: "DAY")
// ---------------------------------------------------------------------------
check('extractSubjectEventTime derives exact decimal age with groundTruthPrecision: "DAY"', () => {
  const recExact = {
    birthDate: '1990-01-01',
    censoringStatus: 'EVENT',
    hasDocumentedMarriage: true,
    firstDocumentedMarriage: {
      marriageDate: '2015-07-02'
    }
  };

  const timeExact = extractSubjectEventTime(recExact);
  assert.equal(timeExact.isEvent, true);
  assert.equal(timeExact.groundTruthPrecision, 'DAY');
  assert.ok(timeExact.eventAge > 25.49 && timeExact.eventAge < 25.51, `Expected ~25.5 years, got ${timeExact.eventAge}`);

  const recYearOnly = {
    birthYear: 1990,
    censoringStatus: 'EVENT',
    hasDocumentedMarriage: true,
    firstDocumentedMarriage: {
      marriageYear: 2015
    }
  };

  const timeYear = extractSubjectEventTime(recYearOnly);
  assert.equal(timeYear.isEvent, true);
  assert.equal(timeYear.groundTruthPrecision, 'YEAR');
  assert.equal(timeYear.eventAge, 25.0);
});

// ---------------------------------------------------------------------------
// INVARIANT 10: Cryptographic Cache Invalidation on Component Hash Alterations
// ---------------------------------------------------------------------------
check('Cache system fingerprint changes whenever any engine hash or version changes', () => {
  const fpInitial = computeSystemFingerprint();
  assert.ok(typeof fpInitial === 'string' && fpInitial.length === 64, 'Fingerprint must be SHA-256');

  // Change astro engine hash
  const fpAstroChanged = computeSystemFingerprint({
    astroEngineHash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  });
  assert.notEqual(fpInitial, fpAstroChanged, 'Fingerprint must change when astroEngineHash changes');

  // Change model coefficients hash
  const fpCoefChanged = computeSystemFingerprint({
    modelCoefficientsHash: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
  });
  assert.notEqual(fpInitial, fpCoefChanged, 'Fingerprint must change when modelCoefficientsHash changes');

  // Change rule version
  const fpRuleChanged = computeSystemFingerprint({
    ruleVersion: 'RULE_V4_MODIFIED'
  });
  assert.notEqual(fpInitial, fpRuleChanged, 'Fingerprint must change when ruleVersion changes');

  // Change resolution classifier version
  const fpResChanged = computeSystemFingerprint({
    resolutionClassifierVersion: 'RC_V9_MODIFIED'
  });
  assert.notEqual(fpInitial, fpResChanged, 'Fingerprint must change when resolutionClassifierVersion changes');
});

// ---------------------------------------------------------------------------
// INVARIANT 11: 7-Model Ablation Computes Paired Comparisons (delta C, MAE, AIC)
// ---------------------------------------------------------------------------
check('runRealDataFeatureAblation includes paired comparisons between adjacent models', () => {
  const mockTrain = [
    { birthYear: 1980, censoringStatus: 'EVENT', firstDocumentedMarriage: { marriageYear: 2005 }, hasDocumentedMarriage: true },
    { birthYear: 1985, censoringStatus: 'EVENT', firstDocumentedMarriage: { marriageYear: 2012 }, hasDocumentedMarriage: true },
    { birthYear: 1990, censoringStatus: 'RIGHT_CENSORED', currentAge: 40, hasDocumentedMarriage: false }
  ];
  const mockEval = [
    { birthYear: 1982, censoringStatus: 'EVENT', firstDocumentedMarriage: { marriageYear: 2010 }, hasDocumentedMarriage: true },
    { birthYear: 1988, censoringStatus: 'RIGHT_CENSORED', currentAge: 38, hasDocumentedMarriage: false }
  ];

  const chartProvider = (rec) => ({
    planetaryPositions: {
      Ascendant: { longitude: 10, sign: 'Aries', house: 1 },
      Venus: { longitude: 40, sign: 'Taurus', house: 2 }
    },
    _marriageTimingEvents: {
      candidateWindows: [{ startAge: 25, endAge: 30, activationScore: 0.6 }]
    }
  });

  const ablation = runRealDataFeatureAblation(mockTrain, mockEval, chartProvider);
  assert.ok(Array.isArray(ablation), 'Ablation returns array of 7 models');
  assert.equal(ablation.length, 7, 'Should have exactly 7 models (0 to 6)');
  assert.ok(Array.isArray(ablation.pairedComparisons), 'Ablation must include pairedComparisons');
  assert.ok(ablation.pairedComparisons.length >= 5, 'Must contain paired comparisons for adjacent models');

  const m2v0 = ablation.pairedComparisons.find(p => p.targetModel === 'MODEL_2' && p.baseModel === 'MODEL_0');
  assert.ok(m2v0, 'Must include MODEL_2 vs MODEL_0 comparison');
  assert.ok('deltaCIndex' in m2v0, 'Must report deltaCIndex');
  assert.ok('deltaAIC' in m2v0, 'Must report deltaAIC');
  assert.ok('deltaMAE' in m2v0, 'Must report deltaMAE');
});

// ---------------------------------------------------------------------------
// INVARIANT 12: Permutation Test Respects numPermutations
// ---------------------------------------------------------------------------
check('runDiscreteHazardPermutationTest executes requested numPermutations without clamping', () => {
  const cohort = [
    { birthYear: 1980, censoringStatus: 'EVENT', firstDocumentedMarriage: { marriageYear: 2005 }, hasDocumentedMarriage: true },
    { birthYear: 1982, censoringStatus: 'EVENT', firstDocumentedMarriage: { marriageYear: 2008 }, hasDocumentedMarriage: true },
    { birthYear: 1985, censoringStatus: 'EVENT', firstDocumentedMarriage: { marriageYear: 2012 }, hasDocumentedMarriage: true },
    { birthYear: 1988, censoringStatus: 'EVENT', firstDocumentedMarriage: { marriageYear: 2015 }, hasDocumentedMarriage: true },
    { birthYear: 1990, censoringStatus: 'RIGHT_CENSORED', currentAge: 40, hasDocumentedMarriage: false },
    { birthYear: 1992, censoringStatus: 'RIGHT_CENSORED', currentAge: 38, hasDocumentedMarriage: false }
  ];

  const chartProvider = () => ({
    planetaryPositions: {
      Ascendant: { longitude: 0, sign: 'Aries', house: 1 },
      Venus: { longitude: 30, sign: 'Taurus', house: 2 }
    },
    _marriageTimingEvents: {
      candidateWindows: [{ startAge: 25, endAge: 30, activationScore: 0.5 }]
    }
  });

  const permRes = runDiscreteHazardPermutationTest(cohort, chartProvider, {
    numPermutations: 50,
    seed: 12345,
    betaAstro: 0.1
  });

  assert.equal(permRes.numPermutations, 50, 'numPermutations must match requested 50');
  assert.ok(typeof permRes.empiricalPValue === 'number', 'empirical p-value must be calculated');
  assert.ok(permRes.empiricalPValue >= 0.0 && permRes.empiricalPValue <= 1.0, 'p-value must be in [0, 1]');
});

console.log('\n===========================================================================');
console.log(` SUMMARY: ${passedCount} / ${totalCount} BEHAVIORAL ANTI-FABRICATION INVARIANTS PASSED`);
console.log('===========================================================================\n');
console.log('✅ ALL SCIENTIFIC AND FAIL-CLOSED INVARIANTS INDEPENDENTLY CONFIRMED.\n');
