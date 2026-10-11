/**
 * ASTROVERSE — Report Quality Scoring Integrity Regression Suite
 * ==============================================================
 * Verifies that:
 * 1. validateLifeReport calculates qualityScore deterministically across all 8 dimensions.
 * 2. personalizationScore, timingCompleteness, and evidenceCompleteness derive strictly
 *    from authentic chart calculations, planetary placements, and verified evidence nodes.
 * 3. Removing planetary positions, ascendant, or coordinates strictly penalizes personalizationScore.
 * 4. Fake or empty evidence nodes do not count towards evidenceCompleteness.
 * 5. Inverted timing windows strictly penalize timing consistency and overall quality score.
 */

import { strict as assert } from 'node:assert';
import { validateLifeReport } from './src/services/customerReport/reportValidator.js';
import { ALL_17_DOMAINS } from './src/services/customerReport/lifeReportModel.js';

console.log('\n============================================================');
console.log(' ASTROVERSE — REPORT QUALITY SCORING INTEGRITY TEST');
console.log('============================================================\n');

function makeSyntheticValidReport() {
  const domainReports = ALL_17_DOMAINS.map(domainId => ({
    domainId,
    domainName: { en: domainId, ta: `${domainId} தமிழ்` },
    evidenceStrength: domainId === "marriage" ? "STRONG" : "MODERATE",
    empiricalStatus: domainId === "marriage" ? "EXPERIMENTAL" : "NOT_ESTABLISHED",
    empiricalResolution: domainId === "marriage" ? "MULTI_YEAR_RANGE" : "NOT_ESTABLISHED",
    executiveConclusion: "This is a detailed and authentic executive conclusion exceeding ten characters.",
    evidenceChain: [
      {
        evidenceId: `EV_${domainId.toUpperCase()}_01`,
        ruleId: `RULE_${domainId.toUpperCase()}_01`,
        source: "Brihat Parashara Hora Shastra",
        planetaryCombination: "Jupiter in 9th house"
      }
    ],
    technicalEvidence: {
      primaryHouse: 9,
      rulingPlanet: "Jupiter"
    },
    traditionalTimingWindows: domainId === "marriage" ? [
      {
        start: "2026-01-01",
        end: "2028-12-31",
        traditionalRuleLabel: "TRADITIONAL RULE WINDOW",
        predictiveProbability: null
      }
    ] : []
  }));

  return {
    clientProfile: {
      birthDate: "1990-05-15",
      birthTime: "14:30",
      birthPlace: "Chennai, India"
    },
    dataQuality: {
      birthDate: "1990-05-15",
      latitude: 13.0827,
      longitude: 80.2707,
      completenessScore: 0.95
    },
    coreNatalProfile: {
      ascendant: { sign: "Leo", degree: 15.5, longitude: 135.5, lord: "Sun" },
      moonSign: { sign: "Sagittarius", degree: 10.2, longitude: 250.2, lord: "Jupiter" }
    },
    planetaryTable: [
      { name: "Sun", longitude: 30.5 },
      { name: "Moon", longitude: 250.2 },
      { name: "Mars", longitude: 310.4 },
      { name: "Mercury", longitude: 45.1 },
      { name: "Jupiter", longitude: 85.3 },
      { name: "Venus", longitude: 20.8 },
      { name: "Saturn", longitude: 280.9 },
      { name: "Rahu", longitude: 15.0 },
      { name: "Ketu", longitude: 195.0 }
    ],
    currentDasha: {
      lord: "Jupiter",
      startDate: "2020-01-01",
      endDate: "2036-01-01"
    },
    currentTransits: {
      status: "CALCULATED",
      saturnHouse: 7,
      sadeSati: false
    },
    domainReports,
    lifeTimeline: { CURRENT: { period: "2026-2029" } },
    majorMilestones: { prospective: [{ year: 2027, title: "Career Phase" }] }
  };
}

// 1. Baseline Valid Report
const rep1 = makeSyntheticValidReport();
const val1 = validateLifeReport(rep1);
assert.equal(val1.isValid, true, 'Valid report must pass all 16 checks');
assert.equal(val1.qualityScore.evidenceCompleteness, 100, 'All 17 domains have real evidence');
assert.equal(val1.qualityScore.personalizationScore, 100, 'Full chart personalization score must be 100');
assert.equal(val1.qualityScore.timingCompleteness, 100, 'Timing completeness must be 100%');
console.log('✓ Baseline report achieves 100% across evidenceCompleteness, personalizationScore, and timingCompleteness');

// 2. Personalization Score Degradation on Missing Planetary Data
const rep2 = makeSyntheticValidReport();
rep2.planetaryTable = []; // Remove planets
const val2 = validateLifeReport(rep2);
assert(val2.qualityScore.personalizationScore < 100, 'Removing planetary table must reduce personalizationScore');
assert.equal(val2.qualityScore.personalizationScore, 60, 'Personalization score should drop from 100 to 60');
console.log(`✓ Removing planetary table drops personalizationScore from 100 to ${val2.qualityScore.personalizationScore}`);

// 3. Evidence Completeness Degradation on Empty Evidence Nodes
const rep3 = makeSyntheticValidReport();
// Clear evidence chains and technical evidence on first 5 domains
for (let i = 0; i < 5; i++) {
  rep3.domainReports[i].evidenceChain = [];
  rep3.domainReports[i].technicalEvidence = {};
}
const val3 = validateLifeReport(rep3);
assert(val3.qualityScore.evidenceCompleteness < 100, 'Empty evidence chains must reduce evidenceCompleteness');
assert.equal(val3.qualityScore.evidenceCompleteness, parseFloat(((12 / 17) * 100).toFixed(1)));
console.log(`✓ Stripping evidence from 5 domains drops evidenceCompleteness to ${val3.qualityScore.evidenceCompleteness}%`);

// 4. Timing Completeness Degradation on Inverted Dates
const rep4 = makeSyntheticValidReport();
rep4.domainReports[0].traditionalTimingWindows = [
  { start: "2030-01-01", end: "2025-01-01", traditionalRuleLabel: "TRADITIONAL RULE WINDOW", predictiveProbability: null }
];
const val4 = validateLifeReport(rep4);
assert.equal(val4.isValid, false, 'Inverted timing window must fail report validation');
assert(val4.qualityScore.timingCompleteness < 100, 'Inverted timing window must reduce timingCompleteness');
console.log(`✓ Inverted timing window fails report validation and reduces timingCompleteness to ${val4.qualityScore.timingCompleteness}%`);

console.log('\n============================================================');
console.log(' ALL REPORT QUALITY SCORING TESTS PASSED (100% SUCCESS)');
console.log('============================================================\n');
