/**
 * ASTROVERSE — Report Validator & Quality Auditor (Sections 33 & 34)
 * ==================================================================
 * Implements the mandatory 16-check validation suite before customer report
 * and PDF generation. Calculates internal Report Quality Score across 8
 * dimensions without exposing arbitrary accuracy percentages to customers.
 */

import { checkReportRepetition } from "./antiRepetitionEngine.js";
import { ALL_17_DOMAINS } from "./lifeReportModel.js";

/**
 * Validates a LifeReportModel across all 16 mandated criteria.
 *
 * @param {Object} lifeReport - The complete LifeReportModel
 * @param {Object} [options={}] - Validation options (e.g. lang: "en" | "ta")
 * @returns {Object} Comprehensive validation result { isValid, checks, qualityScore, failures }
 */
export function validateLifeReport(lifeReport, options = {}) {
  const lang = options.lang || lifeReport.calculationMetadata?.lang || "en";
  const isTamil = lang === "ta";
  const checks = [];
  const failures = [];

  function recordCheck(id, name, passed, details = "") {
    checks.push({ id, name, passed, details });
    if (!passed) {
      failures.push({ id, name, details });
    }
  }

  // 1. Factual Consistency Validation
  const hasClient = Boolean(lifeReport.clientProfile?.birthDate || lifeReport.dataQuality?.birthDate);
  const hasCoords = lifeReport.dataQuality?.latitude != null && lifeReport.dataQuality?.longitude != null;
  recordCheck(
    1,
    "factualConsistency",
    hasClient && hasCoords,
    hasClient && hasCoords ? "Client birth date and geographic coordinates verified." : "Missing birth date or coordinates."
  );

  // 2. Planetary Position Consistency
  const planets = lifeReport.planetaryTable || [];
  const validPlanets = planets.length >= 7 && planets.every(p => {
    if (!p || typeof p !== "object" || !p.name) return false;
    const l = p.longitude != null ? p.longitude : p.deg;
    return typeof l === "number" && Number.isFinite(l) && l >= 0 && l <= 360;
  });
  recordCheck(
    2,
    "planetaryPositionConsistency",
    validPlanets,
    validPlanets ? `Verified ${planets.length} planetary positions with valid sidereal longitudes.` : "Planetary table incomplete or missing longitudes."
  );

  // 3. Dasha Consistency
  const dasha = lifeReport.currentDasha || lifeReport.executiveSummary?.currentLifePhase;
  let validDasha = Boolean(dasha && (dasha.lord || dasha.mahadasha));
  if (validDasha && dasha.startDate && dasha.endDate) {
    const s = new Date(dasha.startDate).getTime();
    const e = new Date(dasha.endDate).getTime();
    if (Number.isFinite(s) && Number.isFinite(e) && s > e) {
      validDasha = false;
    }
  }
  recordCheck(
    3,
    "dashaConsistency",
    validDasha,
    validDasha ? `Operating Dasha identified (${dasha.lord || dasha.mahadasha}).` : "Operating Dasha undefined or chronological order inverted."
  );

  // 4. Transit Consistency
  const transits = lifeReport.currentTransits;
  const validTransits = Boolean(
    transits && (
      transits.sadeSati !== undefined ||
      transits.saturnHouse !== undefined ||
      Array.isArray(transits.majorEvents) ||
      transits.status === "CALCULATED"
    )
  );
  recordCheck(
    4,
    "transitConsistency",
    validTransits,
    validTransits ? "Real-time transit dashboard and planetary transit data verified." : "Transit data missing."
  );

  // 5. Domain Evidence Consistency (All 17 domains present and distinct)
  const domainReports = lifeReport.domainReports || [];
  const uniqueValidDomainIds = new Set(
    domainReports
      .filter(d => d && typeof d === "object" && d.domainId && ALL_17_DOMAINS.includes(d.domainId))
      .map(d => d.domainId)
  );
  const all17Present = ALL_17_DOMAINS.every(d => uniqueValidDomainIds.has(d)) &&
    uniqueValidDomainIds.size === 17 &&
    domainReports.length === 17;
  recordCheck(
    5,
    "domainEvidenceConsistency",
    all17Present,
    all17Present ? `All ${ALL_17_DOMAINS.length} distinct mandated domains present.` : `Missing or duplicate domains: unique count ${uniqueValidDomainIds.size}/${ALL_17_DOMAINS.length}`
  );

  // 6. Timing Consistency
  let timingValid = true;
  domainReports.forEach(dr => {
    (dr.traditionalTimingWindows || []).forEach(tw => {
      if (tw.start && tw.end) {
        const s = new Date(tw.start).getTime();
        const e = new Date(tw.end).getTime();
        if (!isNaN(s) && !isNaN(e)) {
          if (s > e) timingValid = false;
        } else if (tw.start > tw.end) {
          timingValid = false;
        }
      }
    });
  });
  recordCheck(
    6,
    "timingConsistency",
    timingValid,
    timingValid ? "All timing window date ranges are chronological." : "Found inverted start/end dates in timing windows."
  );

  // 7. Empirical Resolution Consistency
  const marriageRep = domainReports.find(d => d.domainId === "marriage");
  const otherReps = domainReports.filter(d => d.domainId !== "marriage");
  const empiricalResValid =
    (!marriageRep || marriageRep.empiricalResolution === "MULTI_YEAR_RANGE") &&
    otherReps.every(d => d.empiricalResolution === "NOT_ESTABLISHED");
  recordCheck(
    7,
    "empiricalResolutionConsistency",
    empiricalResValid,
    empiricalResValid
      ? "Marriage correctly clamped to MULTI_YEAR_RANGE; all other 16 domains NOT_ESTABLISHED."
      : "Empirical resolution leaks detected in unvalidated domains."
  );

  // 8. Health Safety Compliance
  const wellnessRep = domainReports.find(d => d.domainId === "wellness");
  const wellnessText = JSON.stringify(wellnessRep || {});
  const healthSafe =
    !/\bcancer\b/i.test(wellnessText) &&
    !/\btumor\b/i.test(wellnessText) &&
    !/\btumour\b/i.test(wellnessText) &&
    !/\bcarcinoma\b/i.test(wellnessText) &&
    !/\bheart attack\b/i.test(wellnessText) &&
    !/\bcardiac arrest\b/i.test(wellnessText) &&
    !/\bsurgery (?:prediction|guarantee|guaranteed)\b/i.test(wellnessText) &&
    !/\bguaranteed surgery\b/i.test(wellnessText) &&
    !/\borgan failure\b/i.test(wellnessText) &&
    !/\bexact lifespan\b/i.test(wellnessText) &&
    !/\blifespan prediction\b/i.test(wellnessText) &&
    !/\b(?:death|fatality) timing\b/i.test(wellnessText) &&
    !/\bமாரடைப்பு\b/i.test(wellnessText) &&
    !/\bபுற்றுநோய்\b/i.test(wellnessText);
  recordCheck(
    8,
    "healthSafety",
    healthSafe,
    healthSafe ? "Zero clinical diagnostic overclaims in wellness domain." : "Prohibited clinical diagnostic terms detected in wellness domain."
  );

  // 9. Legal Safety Compliance
  const legalRep = domainReports.find(d => d.domainId === "legal");
  const legalText = JSON.stringify(legalRep || {});
  const legalSafe =
    !/you will win the case/i.test(legalText) &&
    !/guaranteed court victory/i.test(legalText) &&
    !/court victory certainty/i.test(legalText) &&
    !/verdict in your favor guaranteed/i.test(legalText) &&
    !/certain trial win/i.test(legalText) &&
    !/guaranteed acquittal/i.test(legalText) &&
    !/வழக்கில் நிச்சயம் வெற்றி பெறுவீர்கள்/i.test(legalText);
  recordCheck(
    9,
    "legalSafety",
    legalSafe,
    legalSafe ? "Zero deterministic trial victory guarantees in legal domain." : "Prohibited legal guarantee detected."
  );

  // 10. Financial Safety Compliance
  const finRep = domainReports.find(d => d.domainId === "finance");
  const finText = JSON.stringify(finRep || {});
  const finSafe =
    !/guaranteed profit/i.test(finText) &&
    !/guaranteed investment return/i.test(finText) &&
    !/lottery jackpot win/i.test(finText) &&
    !/risk[\s-]free investment/i.test(finText) &&
    !/stock market windfall guaranteed/i.test(finText) &&
    !/100% return guaranteed/i.test(finText) &&
    !/நிச்சய பண லாபம்/i.test(finText);
  recordCheck(
    10,
    "financialSafety",
    finSafe,
    finSafe ? "Zero monetary profit guarantees in finance domain." : "Prohibited financial return guarantee detected."
  );

  // 11. Anti-Fabrication Invariant
  const allReportText = JSON.stringify(lifeReport);
  const antiFabSafe =
    !/100% accurate/i.test(allReportText) &&
    !/guaranteed destiny/i.test(allReportText) &&
    !/will definitely/i.test(allReportText);
  recordCheck(
    11,
    "antiFabrication",
    antiFabSafe,
    antiFabSafe ? "Zero deterministic guarantees or fabricated precision found." : "Prohibited fatalistic claim found."
  );

  // 12. Anti-False-Precision Gate
  let falsePrecisionSafe = true;
  domainReports.forEach(dr => {
    (dr.traditionalTimingWindows || []).forEach(tw => {
      if (tw.traditionalRuleLabel !== "TRADITIONAL RULE WINDOW") {
        falsePrecisionSafe = false;
      }
      if (tw.predictiveProbability !== null) {
        falsePrecisionSafe = false;
      }
    });
  });
  recordCheck(
    12,
    "antiFalsePrecision",
    falsePrecisionSafe,
    falsePrecisionSafe ? "All traditional timing windows carry TRADITIONAL RULE WINDOW label with null probability." : "Timing window disguised as empirical precision."
  );

  // 13. Repetition Detection
  const repAudit = checkReportRepetition(domainReports);
  const repSafe = repAudit.repetitionScore >= 0.85;
  recordCheck(
    13,
    "repetitionDetection",
    repSafe,
    `Repetition score: ${repAudit.repetitionScore * 100}% (${repAudit.violations.length} violations).`
  );

  // 14. Missing-Data Detection
  const dataQuality = lifeReport.dataQuality || {};
  const hasCompleteness = typeof dataQuality.completenessScore === "number" && Number.isFinite(dataQuality.completenessScore);
  const completeness = hasCompleteness ? dataQuality.completenessScore : 0.0;
  const noMissing = hasCompleteness && completeness >= 0.7;
  recordCheck(
    14,
    "missingDataDetection",
    noMissing,
    hasCompleteness ? `Data completeness score: ${(completeness * 100).toFixed(0)}%.` : "Data completeness score uncalculated or missing."
  );

  // 15. Tamil Language Purity (if lang = ta)
  let tamilPurity = true;
  if (isTamil) {
    tamilPurity = domainReports.every(dr => dr.domainName?.ta && dr.executiveConclusion.length > 10);
  }
  recordCheck(
    15,
    "tamilLanguagePurity",
    tamilPurity,
    tamilPurity ? "Tamil localization completeness verified." : "Incomplete Tamil localization."
  );

  // 16. PDF Layout Validation
  const hasTimeline = Boolean(lifeReport.lifeTimeline?.CURRENT);
  const hasMilestones = Boolean(lifeReport.majorMilestones?.prospective?.length > 0);
  const pdfLayoutValid = hasTimeline && hasMilestones && all17Present;
  recordCheck(
    16,
    "pdfLayoutValidation",
    pdfLayoutValid,
    pdfLayoutValid ? "Structural sections and page layout prerequisites satisfied." : "Missing required structural sections for PDF."
  );

  // Calculate Internal Quality Score (Section 34)
  const passedCount = checks.filter(c => c.passed).length;
  const totalCount = checks.length;
  const passRate = (passedCount / totalCount) * 100;

  // Real evidence verification across domains (must resolve to authentic non-empty nodes)
  const domainsWithRealEvidence = domainReports.filter(dr => {
    if (!dr || typeof dr !== "object") return false;
    const hasChain = Array.isArray(dr.evidenceChain) && dr.evidenceChain.length > 0 &&
      dr.evidenceChain.every(ec => ec && (ec.evidenceId || ec.ruleId || ec.source || ec.planetaryCombination));
    const techKeys = dr.technicalEvidence && typeof dr.technicalEvidence === "object"
      ? Object.keys(dr.technicalEvidence).filter(k => k !== "evidenceNodeId" && dr.technicalEvidence[k] !== null && dr.technicalEvidence[k] !== undefined)
      : [];
    const hasTech = techKeys.length > 0;
    return hasChain || hasTech;
  });
  const uniqueDomainsWithEvidence = new Set(
    domainsWithRealEvidence.map(d => d.domainId).filter(id => ALL_17_DOMAINS.includes(id))
  );

  // Timing completeness: ratio of domains having valid chronological timing windows with non-empty boundaries or explicit NOT_ESTABLISHED
  let domainsWithValidTiming = 0;
  domainReports.forEach(dr => {
    if (!dr || typeof dr !== "object") return;
    const tws = dr.traditionalTimingWindows || [];
    if (tws.length > 0) {
      const allChronological = tws.every(tw => {
        if (!tw || typeof tw !== "object") return false;
        if (!tw.start || !tw.end || typeof tw.start !== "string" || typeof tw.end !== "string") return false;
        const s = new Date(tw.start).getTime();
        const e = new Date(tw.end).getTime();
        return !isNaN(s) && !isNaN(e) ? s <= e : tw.start <= tw.end;
      });
      if (allChronological) domainsWithValidTiming++;
    } else if (dr.empiricalResolution === "NOT_ESTABLISHED") {
      domainsWithValidTiming++;
    }
  });

  // Personalization score: strictly grounded in client planetary table, ascendant, and dasha
  let personalizationChecksPassed = 0;
  if (validPlanets) personalizationChecksPassed += 40;
  if (hasClient && hasCoords) personalizationChecksPassed += 20;
  if (validDasha) personalizationChecksPassed += 20;
  if (lifeReport.coreNatalProfile?.ascendant?.sign) personalizationChecksPassed += 20;

  const qualityScore = {
    evidenceCompleteness: parseFloat(((uniqueDomainsWithEvidence.size / 17) * 100).toFixed(1)),
    domainCompleteness: parseFloat(((uniqueValidDomainIds.size / 17) * 100).toFixed(1)),
    timingCompleteness: parseFloat(((domainsWithValidTiming / Math.max(1, domainReports.length)) * 100).toFixed(1)),
    safetyCompliance: (healthSafe && legalSafe && finSafe && antiFabSafe) ? 100 : 0,
    personalizationScore: personalizationChecksPassed,
    repetitionScore: parseFloat((repAudit.repetitionScore * 100).toFixed(1)),
    dataConsistency: (hasClient && hasCoords && validDasha && validPlanets) ? 100 : 0,
    resolutionCompliance: empiricalResValid ? 100 : 0,
    overallQualityScore: parseFloat(passRate.toFixed(1))
  };

  const isValid = failures.length === 0;

  return {
    isValid,
    totalChecks: totalCount,
    passedChecks: passedCount,
    failedChecks: failures.length,
    checks,
    failures,
    qualityScore,
    isReadyForCustomerDelivery: isValid
  };
}
