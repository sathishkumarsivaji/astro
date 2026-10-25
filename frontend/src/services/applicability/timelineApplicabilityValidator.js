/**
 * ASTROVERSE — Timeline Applicability Validator
 * =============================================
 * Version: 2.1.0
 * 
 * Enforces Section 13 non-negotiable validation constraints:
 * - Block release if an infant row predicts research publications
 * - Block release if a toddler row predicts personal job promotion
 * - Block release if a preschool row predicts marriage negotiations
 * - Block release if a young child is told to fulfill marital duties
 * - Block release if a child is instructed to manage employees or corporate disputes
 * - Block release if property purchase agency is attributed to a minor
 * - Block release if rejected event wording remains in titles or narratives
 */

export function validateTimelineApplicability(stages = []) {
  const stageList = Array.isArray(stages) ? stages : (stages.stages || []);
  const violations = [];

  stageList.forEach((stage, idx) => {
    let s = stage.startAge ?? stage.pStart ?? null;
    let e = stage.endAge ?? stage.pEnd ?? null;

    if (s == null && typeof stage.ageRange === "string") {
      const parts = stage.ageRange.split("-").map(p => parseFloat(p.trim()));
      if (parts.length >= 2 && !isNaN(parts[0])) {
        s = parts[0];
        e = parts[1];
      }
    }

    const titleLower = (stage.title || "").toLowerCase();
    const predLower = (stage.prediction || "").toLowerCase();
    const guidanceLower = (stage.actionableGuidance || "").toLowerCase();
    const fullText = `${titleLower} ${predLower} ${guidanceLower}`;

    // Infant checks (< 1.0 year)
    if (s !== null && s < 1.0) {
      if (
        fullText.includes("research achievement") ||
        fullText.includes("academic/competitive achievement") ||
        fullText.includes("ஆராய்ச்சி வெற்றி")
      ) {
        violations.push({
          index: idx,
          stageId: stage.id || `stage_${idx}`,
          age: s,
          rule: "INFANT_NO_RESEARCH_PUBLICATION",
          message: `Stage at age ${s} predicts research or academic achievement.`
        });
      }
      if (
        fullText.includes("vocational ascent") ||
        fullText.includes("leadership & institutional recognition") ||
        fullText.includes("உத்தியோக உயர்வு")
      ) {
        violations.push({
          index: idx,
          stageId: stage.id || `stage_${idx}`,
          age: s,
          rule: "INFANT_NO_CAREER_PROMOTION",
          message: `Stage at age ${s} predicts career promotion or vocational ascent.`
        });
      }
    }

    // Toddler & Preschool checks (< 6.0 years)
    if (s !== null && s < 6.0) {
      if (
        fullText.includes("matrimonial") ||
        fullText.includes("marriage negotiations") ||
        fullText.includes("சுப விவாக") ||
        fullText.includes("திருமண பந்தம்")
      ) {
        violations.push({
          index: idx,
          stageId: stage.id || `stage_${idx}`,
          age: s,
          rule: "PRESCHOOL_NO_MARRIAGE",
          message: `Stage at age ${s} contains marriage negotiations or matrimonial alliance text.`
        });
      }
      if (
        fullText.includes("managing employee disputes") ||
        fullText.includes("executive duties") ||
        fullText.includes("audit a company")
      ) {
        violations.push({
          index: idx,
          stageId: stage.id || `stage_${idx}`,
          age: s,
          rule: "CHILD_NO_EMPLOYEE_DISPUTE_MANAGEMENT",
          message: `Stage at age ${s} instructs child to manage employees or corporate disputes.`
        });
      }
    }

    // General Minor checks (< 18.0 years)
    if (s !== null && s < 18.0) {
      if (
        titleLower.includes("vocational ascent") ||
        titleLower.includes("leadership & institutional") ||
        titleLower.includes("உத்தியோக உயர்வு")
      ) {
        violations.push({
          index: idx,
          stageId: stage.id || `stage_${idx}`,
          age: s,
          rule: "MINOR_NO_CAREER_TITLE",
          message: `Stage at age ${s} has career promotion title.`
        });
      }
      if (
        titleLower.includes("matrimonial") ||
        titleLower.includes("relational alliances, matrimonial") ||
        titleLower.includes("திருமண பந்தம்")
      ) {
        violations.push({
          index: idx,
          stageId: stage.id || `stage_${idx}`,
          age: s,
          rule: "MINOR_NO_MATRIMONIAL_TITLE",
          message: `Stage at age ${s} has matrimonial alliance title.`
        });
      }
      if (
        titleLower.includes("real estate, conveyances & domestic asset") ||
        titleLower.includes("சொத்து சேர்க்கை") ||
        titleLower.includes("மனை, வாகனம்")
      ) {
        violations.push({
          index: idx,
          stageId: stage.id || `stage_${idx}`,
          age: s,
          rule: "MINOR_NO_PROPERTY_PURCHASE_TITLE",
          message: `Stage at age ${s} has adult property/conveyance acquisition title.`
        });
      }
      if (
        guidanceLower.includes("fulfill marital duties") ||
        guidanceLower.includes("இல்லற கடமைகளை")
      ) {
        violations.push({
          index: idx,
          stageId: stage.id || `stage_${idx}`,
          age: s,
          rule: "MINOR_NO_MARITAL_DUTIES_GUIDANCE",
          message: `Stage at age ${s} instructs minor to fulfill marital duties.`
        });
      }
    }
  });

  return {
    valid: violations.length === 0,
    violationCount: violations.length,
    violations
  };
}
