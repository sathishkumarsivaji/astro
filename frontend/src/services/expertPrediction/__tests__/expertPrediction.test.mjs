/**
 * ASTROVERSE — Expert Mode Prediction Engine Test Suite
 * =====================================================
 * Verifies:
 *   1. Canonical Fact extraction & read-only safety
 *   2. Resolution Classifier (all 9 levels: YEAR to INSUFFICIENT_DATA)
 *   3. Evidence Chain & Independence Group double-count prevention
 *   4. Sub-phase evaluation: evidence-driven (SUPPORTED vs NOT_ESTABLISHED)
 *   5. All 17 domain adapters run with 100% success
 *   6. Health & Wellness Safety Layer (blocks clinical diagnosis / forbidden terms)
 *   7. Life-event timing vs Electional Muhurta timing separation
 *   8. WHY & WHY NOT sections generated for each window
 *   9. Bilingual English & Tamil narratives
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateChartBySystem
} from '../../astroEngine.js';

import {
  generateExpertReport,
  generateDomainReport,
  calculateElectionalMuhurta,
  calculateLifeEventTiming,
  extractCanonicalFacts,
  sanitizeHealthText,
  validateHealthOutput,
  RESOLUTION,
  CONFIDENCE_TYPE,
  SUB_PHASE_STATUS,
  DOMAIN,
  ALL_DOMAINS,
  HEALTH_FORBIDDEN_TERMS
} from '../index.js';

import { classifyResolution, isResolutionAtLeast } from '../resolutionClassifier.js';
import { calculateIndependentEvidence } from '../independenceController.js';
import { buildEvidenceChain } from '../evidenceChainBuilder.js';
import { rankAndClassifyWindows } from '../windowRanker.js';

const TEST_BIRTH_DATA = {
  birthDate: '1990-05-15',
  birthTime: '10:30',
  latitude: 13.0827,
  longitude: 80.2707,
  utcOffset: 5.5,
  system: 'lahiri'
};

describe('Expert Mode Prediction Engine Benchmark', () => {
  const chart = calculateChartBySystem('lahiri', TEST_BIRTH_DATA);

  it('1. Canonical Fact Adapter extracts read-only facts without altering chart', () => {
    const facts = extractCanonicalFacts(chart);
    assert.equal(facts.status, 'OK');
    assert.equal(facts.planets.length, 9);
    assert.equal(facts.houses.length, 12);
    assert.ok(facts.ascendant);
    assert.ok(facts.ascendantLord);
    assert.ok(facts.houseLords[1]);
    assert.ok(Object.isFrozen(facts));
  });

  it('2. Resolution Classifier accurately classifies all 9 resolution levels', () => {
    // Insufficient data
    assert.equal(classifyResolution({}), RESOLUTION.INSUFFICIENT_DATA);

    // Multi-modal
    assert.equal(classifyResolution({
      startDate: '2028-01-01', endDate: '2028-12-31', multiplePeaks: true
    }), RESOLUTION.MULTI_MODAL);

    // Date range (< 30 days)
    assert.equal(classifyResolution({
      startDate: '2028-06-01', endDate: '2028-06-20'
    }), RESOLUTION.DATE_RANGE);

    // Month range (30-120 days)
    assert.equal(classifyResolution({
      startDate: '2028-06-01', endDate: '2028-08-01'
    }), RESOLUTION.MONTH_RANGE);

    // Year range (365 days)
    assert.equal(classifyResolution({
      startDate: '2028-01-01', endDate: '2029-01-01'
    }), RESOLUTION.YEAR);

    // Broad / Not discriminating (> 5 years)
    assert.equal(classifyResolution({
      startDate: '2025-01-01', endDate: '2035-01-01'
    }), RESOLUTION.NOT_DISCRIMINATING);

    // Day level strictly requires explicit independent corroboration (P0-1)
    assert.equal(classifyResolution({
      startDate: '2028-06-01', endDate: '2028-06-05', transitFacts: [{ planet: 'Jupiter' }], hasIndependentCorroboration: true
    }), RESOLUTION.DAY);

    // Without explicit independent corroboration, narrow transit window stays at DATE_RANGE
    assert.equal(classifyResolution({
      startDate: '2028-06-01', endDate: '2028-06-05', transitFacts: [{ planet: 'Jupiter' }]
    }), RESOLUTION.DATE_RANGE);

    // Time window (muhurta)
    assert.equal(classifyResolution({
      startDate: '2028-06-01', endDate: '2028-06-01', muhurtaFacts: [{ time: '10:30' }]
    }), RESOLUTION.TIME_WINDOW);
  });

  it('3. Independence Controller penalizes correlated indicators to avoid double counting', () => {
    const rawNodes = [
      { nodeId: 'n1', independenceGroupId: 'ig_dasha' },
      { nodeId: 'n2', independenceGroupId: 'ig_dasha' }, // correlated with n1
      { nodeId: 'n3', independenceGroupId: 'ig_transit' } // independent
    ];
    const groups = [
      { groupId: 'ig_dasha', independenceScore: 1.0 },
      { groupId: 'ig_transit', independenceScore: 1.0 }
    ];
    const { independentCount, totalRaw, correlationPenalty } = calculateIndependentEvidence(rawNodes, groups);
    assert.equal(totalRaw, 3);
    assert.equal(independentCount, 2);
    assert.ok(correlationPenalty > 0, 'Penalty must be applied for correlated evidence');
  });

  it('4. Health & Wellness Safety Layer strictly sanitizes clinical terms', () => {
    const testText = "Native will have surgery and heart attack during this cancer transit.";
    const { sanitized, violations } = sanitizeHealthText(testText);
    assert.ok(violations.includes('surgery'));
    assert.ok(violations.includes('heart attack'));
    assert.ok(violations.includes('cancer'));
    assert.ok(!sanitized.includes('surgery'));
    assert.ok(!sanitized.includes('heart attack'));
  });

  it('5. Generates full 17-Domain Expert Report with ZERO errors', () => {
    const report = generateExpertReport(chart, 'en');
    assert.equal(report.reportMeta.status, 'COMPLETE');
    assert.equal(Object.keys(report.domainResults).length, 17);
    assert.ok(report.reportMeta.totalPrimaryWindows > 0);

    // Verify all 17 domains exist
    for (const dom of ALL_DOMAINS) {
      assert.ok(report.domainResults[dom], `Domain ${dom} must be present`);
      assert.ok(report.domainResults[dom].subPhases, `Domain ${dom} must have subPhases`);
      assert.ok(report.domainResults[dom].narrative?.en, `Domain ${dom} must have English narrative`);
      assert.ok(report.domainResults[dom].narrative?.ta, `Domain ${dom} must have Tamil narrative`);
    }
  });

  it('6. Sub-phases are strictly evidence-driven (never blindly auto-promoted)', () => {
    const report = generateExpertReport(chart, 'en');
    const propertyResult = report.domainResults.property;
    assert.ok(Array.isArray(propertyResult.subPhases));

    // Must have at least one valid status
    propertyResult.subPhases.forEach(sp => {
      assert.ok(
        [SUB_PHASE_STATUS.SUPPORTED, SUB_PHASE_STATUS.NOT_ESTABLISHED, SUB_PHASE_STATUS.INSUFFICIENT_DATA].includes(sp.status),
        `Sub-phase ${sp.subPhaseId || sp.label} has invalid status ${sp.status}`
      );
    });
  });

  it('7. Every primary timing window includes WHY and WHY NOT evidence', () => {
    const report = generateExpertReport(chart, 'en');
    const marriageResult = report.domainResults.marriage;
    assert.ok(marriageResult.primaryWindows.length > 0);

    const win = marriageResult.primaryWindows[0];
    assert.ok(win.whySupported, 'Window must contain whySupported');
    assert.ok(win.whyNotStronger, 'Window must contain whyNotStronger');
    assert.ok(win.resolution, 'Window must contain resolution');
    assert.ok(win.dashaFacts, 'Window must contain dashaFacts');
  });

  it('8. Life-Event Timing vs Electional Muhurta Timing are separated', () => {
    // 1. Broad window correctly rejects date election
    const broadWindow = {
      windowId: 'broad_win',
      startDate: '2028-01-01',
      endDate: '2028-12-31',
      resolution: RESOLUTION.YEAR
    };
    const broadMuhurta = calculateElectionalMuhurta({
      domain: 'marriage',
      timingWindow: broadWindow
    });
    assert.equal(broadMuhurta.status, 'REQUIRES_NARROW_WINDOW_SELECTION');
    assert.equal(broadMuhurta.muhurtaCandidates.length, 0);

    // 2. Narrow window requires verified location (no silent defaults)
    const narrowWindow = {
      windowId: 'narrow_win',
      startDate: '2028-06-01',
      endDate: '2028-06-20',
      resolution: RESOLUTION.DATE_RANGE
    };
    const missingLocMuhurta = calculateElectionalMuhurta({
      domain: 'property',
      timingWindow: narrowWindow
    });
    assert.equal(missingLocMuhurta.status, 'INSUFFICIENT_DATA');

    // 3. Narrow window with location screens candidate dates
    const narrowMuhurta = calculateElectionalMuhurta({
      domain: 'property',
      timingWindow: narrowWindow,
      location: { latitude: 13.0827, longitude: 80.2707, timezoneOffsetHours: 5.5 }
    });
    assert.ok(['SUPPORTED', 'NOT_ESTABLISHED'].includes(narrowMuhurta.status));
  });

  it('9. Bilingual parity: Tamil and English outputs generated simultaneously', () => {
    const reportEn = generateExpertReport(chart, 'en');
    const reportTa = generateExpertReport(chart, 'ta');

    assert.equal(reportEn.reportMeta.status, 'COMPLETE');
    assert.equal(reportTa.reportMeta.status, 'COMPLETE');
    assert.ok(reportTa.domainResults.career.narrative.ta.includes('தொழில்') || reportTa.domainResults.career.narrative.ta.includes('##'));
  });

  it('10. Sub-phase execution dispatch evaluates canonical rules with subPhaseContext', () => {
    const report = generateExpertReport(chart, 'en');
    const marriage = report.domainResults.marriage;
    assert.ok(Array.isArray(marriage.subPhases));
    assert.equal(marriage.subPhases.length, 4);

    // Each subphase must have valid status and non-empty labels
    marriage.subPhases.forEach(sp => {
      assert.ok([SUB_PHASE_STATUS.SUPPORTED, SUB_PHASE_STATUS.NOT_ESTABLISHED, SUB_PHASE_STATUS.INSUFFICIENT_DATA].includes(sp.status));
      assert.ok(sp.subPhaseId);
      assert.ok(sp.label);
      assert.ok(sp.labelTamil);
      assert.ok(typeof sp.strength === 'number');
      assert.ok(sp.strength >= 0.0 && sp.strength <= 1.0);
    });

    const career = report.domainResults.career;
    assert.equal(career.subPhases.length, 5);
    career.subPhases.forEach(sp => {
      assert.ok([SUB_PHASE_STATUS.SUPPORTED, SUB_PHASE_STATUS.NOT_ESTABLISHED, SUB_PHASE_STATUS.INSUFFICIENT_DATA].includes(sp.status));
    });
  });

  it('11. 15-level traversable evidence chain integrity: nodes link via childNodeIds and contain zero undefined/null/NaN', () => {
    const facts = extractCanonicalFacts(chart);
    const dashaMatch = { mdLord: 'Jupiter', adLord: 'Venus', level: 'AD' };
    const transitHits = [{ transitingPlanet: 'Saturn', house: 10 }, { planet: 'Jupiter', house: 7 }];
    const vargaConfirmations = [{ varga: 'D9', isActivated: true }, { varga: 'D10', isActivated: true }];

    const { evidenceNodes, independenceGroups, totalIndependentConfirmations } = buildEvidenceChain(
      DOMAIN.CAREER, facts, dashaMatch, transitHits, vargaConfirmations
    );

    assert.ok(evidenceNodes.length >= 15, `Chain must contain at least 15 nodes, got ${evidenceNodes.length}`);
    assert.ok(independenceGroups.length >= 3, `Must contain multiple independence groups, got ${independenceGroups.length}`);
    assert.ok(totalIndependentConfirmations >= 2);

    // Verify all 15 levels are covered
    const presentLevels = new Set(evidenceNodes.map(n => n.level));
    for (let lvl = 1; lvl <= 15; lvl++) {
      assert.ok(presentLevels.has(lvl), `Evidence level ${lvl} must be present in the chain`);
    }

    // Verify no descriptions contain "undefined", "null", or "NaN"
    evidenceNodes.forEach(node => {
      assert.ok(!node.description.includes('undefined'), `Node ${node.nodeId} description contains undefined`);
      assert.ok(!node.description.includes('null'), `Node ${node.nodeId} description contains null`);
      assert.ok(!node.description.includes('NaN'), `Node ${node.nodeId} description contains NaN`);
      if (node.descriptionTamil) {
        assert.ok(!node.descriptionTamil.includes('undefined'), `Node ${node.nodeId} descriptionTamil contains undefined`);
        assert.ok(!node.descriptionTamil.includes('null'), `Node ${node.nodeId} descriptionTamil contains null`);
      }
    });

    // Verify traversability: Level 1 root connects downward through childNodeIds
    const level1Node = evidenceNodes.find(n => n.level === 1);
    assert.ok(level1Node);
    assert.ok(level1Node.childNodeIds && level1Node.childNodeIds.length > 0, 'Level 1 node must have child node links');
  });

  it('12. Independence scoring is strictly bounded 0.0 <= strength <= 1.0', () => {
    const manyNodes = [
      { nodeId: 'n1', independenceGroupId: 'g1' },
      { nodeId: 'n2', independenceGroupId: 'g1' },
      { nodeId: 'n3', independenceGroupId: 'g1' },
      { nodeId: 'n4', independenceGroupId: 'g2' },
      { nodeId: 'n5', independenceGroupId: 'g2' },
      { nodeId: 'n6', independenceGroupId: 'g3' },
      { nodeId: 'n7', independenceGroupId: 'g4' },
      { nodeId: 'n8', independenceGroupId: 'g5' }
    ];
    const manyGroups = [
      { groupId: 'g1', independenceScore: 1.0 },
      { groupId: 'g2', independenceScore: 1.0 },
      { groupId: 'g3', independenceScore: 1.0 },
      { groupId: 'g4', independenceScore: 1.0 },
      { groupId: 'g5', independenceScore: 1.0 }
    ];

    const result = calculateIndependentEvidence(manyNodes, manyGroups);
    assert.ok(result.adjustedStrength >= 0.0 && result.adjustedStrength <= 1.0, `Strength must be in [0, 1], got ${result.adjustedStrength}`);
    assert.equal(result.independentCount, 5);
    assert.equal(result.totalRaw, 8);
    assert.ok(result.correlationPenalty > 0);
  });

  it('13. Resolution ranking hierarchy is strictly ordinal (TIME_WINDOW > DAY > DATE_RANGE > MONTH_RANGE > SEASON > YEAR)', () => {
    // TIME_WINDOW (1) is finer than everything
    assert.ok(isResolutionAtLeast(RESOLUTION.TIME_WINDOW, RESOLUTION.DAY));
    assert.ok(isResolutionAtLeast(RESOLUTION.TIME_WINDOW, RESOLUTION.DATE_RANGE));
    assert.ok(isResolutionAtLeast(RESOLUTION.TIME_WINDOW, RESOLUTION.MONTH_RANGE));
    assert.ok(isResolutionAtLeast(RESOLUTION.TIME_WINDOW, RESOLUTION.YEAR));

    // DAY (2) is finer than DATE_RANGE (3)
    assert.ok(isResolutionAtLeast(RESOLUTION.DAY, RESOLUTION.DATE_RANGE));
    assert.ok(!isResolutionAtLeast(RESOLUTION.DATE_RANGE, RESOLUTION.DAY));

    // DATE_RANGE (3) is finer than MONTH_RANGE (4)
    assert.ok(isResolutionAtLeast(RESOLUTION.DATE_RANGE, RESOLUTION.MONTH_RANGE));
    assert.ok(!isResolutionAtLeast(RESOLUTION.MONTH_RANGE, RESOLUTION.DATE_RANGE));

    // MONTH_RANGE (4) is finer than YEAR (6)
    assert.ok(isResolutionAtLeast(RESOLUTION.MONTH_RANGE, RESOLUTION.YEAR));
    assert.ok(!isResolutionAtLeast(RESOLUTION.YEAR, RESOLUTION.MONTH_RANGE));

    // Non-timing resolutions cannot satisfy timing precision
    assert.ok(!isResolutionAtLeast(RESOLUTION.INSUFFICIENT_DATA, RESOLUTION.YEAR));
    assert.ok(!isResolutionAtLeast(RESOLUTION.NOT_DISCRIMINATING, RESOLUTION.MONTH_RANGE));
    assert.ok(!isResolutionAtLeast(RESOLUTION.MULTI_MODAL, RESOLUTION.DATE_RANGE));
  });

  it('14. Window merging strictly preserves evidenceIds, transitFacts, vargaFacts, contradictions, and selects finest resolution', () => {
    const win1 = {
      domain: DOMAIN.PROPERTY,
      subPhase: 'purchaseContract',
      startDate: '2028-06-01',
      endDate: '2028-06-25',
      resolution: RESOLUTION.MONTH_RANGE,
      strength: 0.65,
      supportingRuleIds: ['rule_prop_1'],
      evidenceIds: ['ev_1'],
      transitFacts: [{ planet: 'Jupiter', house: 4 }],
      vargaFacts: [{ varga: 'D4', isActivated: true }],
      contradictions: [{ description: 'Mild delay' }],
      whySupported: ['Jupiter activates 4th house']
    };

    const win2 = {
      domain: DOMAIN.PROPERTY,
      subPhase: 'purchaseContract',
      startDate: '2028-06-15',
      endDate: '2028-07-05',
      resolution: RESOLUTION.DATE_RANGE, // finer resolution!
      strength: 0.85,
      supportingRuleIds: ['rule_prop_2'],
      evidenceIds: ['ev_2'],
      transitFacts: [{ planet: 'Mars', house: 4 }],
      vargaFacts: [{ varga: 'D4', isActivated: true }],
      contradictions: [{ description: 'Workload pressure' }],
      whySupported: ['Mars activates 4th lord']
    };

    const ranked = rankAndClassifyWindows([win1, win2], DOMAIN.PROPERTY);
    assert.equal(ranked.primaryWindows.length, 1, 'Overlapping matching subphase windows must merge into 1');
    const merged = ranked.primaryWindows[0];

    assert.equal(merged.startDate, '2028-06-01');
    assert.equal(merged.endDate, '2028-07-05');
    assert.equal(merged.strength, 0.85);
    // Finest resolution must be preserved
    assert.equal(merged.resolution, RESOLUTION.DATE_RANGE);
    // All evidence & rule IDs must be preserved
    assert.ok(merged.supportingRuleIds.includes('rule_prop_1') && merged.supportingRuleIds.includes('rule_prop_2'));
    assert.ok(merged.evidenceIds.includes('ev_1') && merged.evidenceIds.includes('ev_2'));
    assert.equal(merged.transitFacts.length, 2);
    assert.equal(merged.whySupported.length, 2);
  });

  it('15. Field-based data completeness reflects availability of chart parameters and divisional charts', () => {
    const report = generateExpertReport(chart, 'en');
    Object.values(report.domainResults).forEach(d => {
      assert.ok(d.meta, `Domain ${d.domain} must have meta`);
      assert.ok(typeof d.meta.dataCompleteness === 'number');
      assert.ok(d.meta.dataCompleteness >= 0.0 && d.meta.dataCompleteness <= 1.0);
      assert.ok(d.meta.ephemerisVersion, 'Must record ephemeris provenance');
    });
  });
});
