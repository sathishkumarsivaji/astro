/**
 * ASTROVERSE — Milestone Timeline Engine (Sections 20 & 22)
 * ==========================================================
 * Replaces raw 0–120 year dasha dumping with an intelligent,
 * age-appropriate life timeline structured into:
 *   PAST, CURRENT, NEXT 3 YEARS, NEXT 5 YEARS, NEXT 10 YEARS, LONG-TERM
 * and generates the authoritative NEXT IMPORTANT PERIODS table.
 */

import { EVIDENCE_STRENGTH, RESOLUTION } from "./lifeReportModel.js";
import { julianDateToDate } from "../astroEngine.js";

/**
 * Builds the comprehensive Life Timeline and Next Important Periods table.
 *
 * @param {Object} chartData - Complete chart data
 * @param {Array} domainReports - The 17 domain reports
 * @param {Object} currentLifePhase - Output of calculateCurrentLifePhase()
 * @param {string} [lang="en"] - "en" or "ta"
 * @returns {Object} Structured { lifeTimeline, nextImportantPeriods, majorMilestones }
 */
export function buildMilestoneLifeTimeline(chartData, domainReports = [], currentLifePhase, lang = "en") {
  const isTamil = lang === "ta";
  const currentAge = currentLifePhase?.currentAgeYears || 30;
  const currentYear = new Date().getFullYear();

  // Aggregate all timing windows across all 17 domains
  const allDomainWindows = [];
  domainReports.forEach(dr => {
    if (Array.isArray(dr.traditionalTimingWindows)) {
      dr.traditionalTimingWindows.forEach(w => {
        allDomainWindows.push({
          ...w,
          domainId: dr.domainId,
          domainDisplayName: dr.domainName?.[isTamil ? "ta" : "en"] || dr.domainId
        });
      });
    }
  });

  // Extract chronological timeline from chartData if available
  const rawTimeline = chartData.chronologicalDashaTimeline?.stages ||
                      chartData.chronologicalDashaTimeline ||
                      chartData.dashaTimeline ||
                      [];

  // Structure timeline into the 6 mandated lifecycle horizons
  const pastStages = [];
  const next3YearsStages = [];
  const next5YearsStages = [];
  const next10YearsStages = [];
  const longTermStages = [];

  // 1. Process Dasha Stages
  if (Array.isArray(rawTimeline)) {
    rawTimeline.forEach(st => {
      const startAge = st.startAge ?? (st.ageStart ?? null);
      const endAge = st.endAge ?? (st.ageEnd ?? null);

      if (startAge == null || endAge == null) return;

      const stageObj = {
        period: `${st.startDate || st.calendarYears || "Stage Start"} – ${st.endDate || "Stage End"}`,
        ageRange: `${startAge.toFixed(1)} – ${endAge.toFixed(1)} ${isTamil ? "வயது" : "yrs"}`,
        domain: "Life Trajectory",
        traditionalTheme: isTamil
          ? `${st.lord || st.mahadashaLord || 'தசா'} மகா தசா - ${st.activeAntar || st.antarLord || 'புக்தி'}`
          : `${st.lord || st.mahadashaLord || 'Dasha'} Mahadasha / ${st.activeAntar || st.antarLord || 'Antar'} Phase`,
        evidence: [
          `Mahadasha: ${st.lord || 'Operating Lord'}`,
          `Sub-Lord: ${st.activeAntar || 'Sub Lord'}`
        ],
        strength: EVIDENCE_STRENGTH.MODERATE,
        timingResolution: "TRADITIONAL RULE WINDOW",
        limitations: isTamil
          ? "பாரம்பரிய தசா கால கணிப்பு மட்டுமே; அறிவியல் உத்தரவாதம் அல்ல."
          : "Traditional planetary period boundary; non-deterministic.",
        isPast: endAge < currentAge,
        isCurrent: startAge <= currentAge && endAge >= currentAge
      };

      // Filter out age-inappropriate adult themes for childhood stages
      if (startAge < 18) {
        stageObj.domain = isTamil ? "ஆரம்ப வளர்ச்சி & கல்வி" : "Early Growth & Foundational Education";
      }

      if (endAge < currentAge) {
        pastStages.push(stageObj);
      } else if (startAge > currentAge && startAge <= currentAge + 3) {
        next3YearsStages.push(stageObj);
      } else if (startAge > currentAge + 3 && startAge <= currentAge + 5) {
        next5YearsStages.push(stageObj);
      } else if (startAge > currentAge + 5 && startAge <= currentAge + 10) {
        next10YearsStages.push(stageObj);
      } else if (startAge > currentAge + 10) {
        longTermStages.push(stageObj);
      }
    });
  }

  // 2. Merge Domain-Specific Convergence Windows into the Next Periods
  allDomainWindows.forEach(w => {
    const sDate = w.start ? new Date(w.start) : null;
    if (!sDate || isNaN(sDate.getTime())) return;

    const winYear = sDate.getFullYear();
    const yearsFromNow = winYear - currentYear;

    const winItem = {
      period: `${w.start} to ${w.end}`,
      domain: w.domainDisplayName,
      traditionalTheme: w.traditionalIndication,
      evidence: w.evidence || [],
      strength: w.strength > 0.7 ? EVIDENCE_STRENGTH.STRONG : EVIDENCE_STRENGTH.MODERATE,
      timingResolution: "TRADITIONAL RULE WINDOW",
      limitations: isTamil ? "பாரம்பரிய விதிமுறை சாளரம்" : "Traditional rule convergence window",
      whyImportant: w.explanation || (isTamil ? "முக்கிய பாவகங்கள் சுபமாக தூண்டப்படுகின்றன" : "Key domain significators are favorably activated"),
      caution: w.contradictions?.[0] || (isTamil ? "பொறுமையான திட்டமிடல் தேவை" : "Practice steady diligence and avoid hasty commitments")
    };

    if (yearsFromNow >= 0 && yearsFromNow <= 3) {
      next3YearsStages.push(winItem);
    } else if (yearsFromNow > 3 && yearsFromNow <= 5) {
      next5YearsStages.push(winItem);
    } else if (yearsFromNow > 5 && yearsFromNow <= 10) {
      next10YearsStages.push(winItem);
    } else if (yearsFromNow > 10) {
      longTermStages.push(winItem);
    }
  });

  // 3. Build NEXT IMPORTANT PERIODS Table (Section 22)
  const nextImportantPeriods = [];
  const candidateList = [...next3YearsStages, ...next5YearsStages].slice(0, 8);

  candidateList.forEach(cand => {
    nextImportantPeriods.push({
      period: cand.period,
      domain: cand.domain,
      traditionalIndication: cand.traditionalTheme,
      evidenceStrength: cand.strength || EVIDENCE_STRENGTH.MODERATE,
      resolution: "TRADITIONAL RULE WINDOW",
      whyImportant: cand.whyImportant || (isTamil ? "தசா-கோச்சார ஒருங்கிணைவு" : "Favorable planetary alignment"),
      caution: cand.caution || (isTamil ? "நிதானமான அணுகுமுறை தேவை" : "Maintain thoughtful balance")
    });
  });

  // Fallback if candidate list is small
  if (nextImportantPeriods.length === 0) {
    nextImportantPeriods.push({
      period: `${currentYear} – ${currentYear + 2}`,
      domain: isTamil ? "பொது வாழ்வியல் வளர்ச்சி" : "General Life Trajectory",
      traditionalIndication: isTamil ? "நிலையான முன்னேற்றக் காலம்" : "Steady Structural Progression",
      evidenceStrength: EVIDENCE_STRENGTH.MODERATE,
      resolution: "TRADITIONAL RULE WINDOW",
      whyImportant: isTamil ? "தற்போதைய தசா பலன்கள் சுபமாக இயங்குகின்றன" : "Active Dasha lords support foundational growth",
      caution: isTamil ? "அவசர முடிவுகளைத் தவிர்க்கவும்" : "Avoid unforced high-risk speculation"
    });
  }

  // 4. Retrospective and Prospective Major Milestones (Section 20)
  const retrospectiveMilestones = pastStages.slice(-4).map((p, idx) => ({
    id: `retro_${idx + 1}`,
    calendarYears: p.period,
    domain: p.domain,
    traditionalTheme: p.traditionalTheme,
    verificationPrompt: isTamil
      ? `இந்த காலகட்டத்தில் (${p.period}) உங்கள் வாழ்க்கையில் ஒரு முக்கிய கல்வி, தொழில் அல்லது வசிப்பிட மாற்றம் நிகழ்ந்ததா?`
      : `Did a notable educational, professional, or residential transition occur during this window (${p.period})?`,
    periodType: "Calculated Candidate Period",
    userConfirmed: null
  }));

  const prospectiveMilestones = nextImportantPeriods.slice(0, 5).map((np, idx) => ({
    id: `prosp_${idx + 1}`,
    period: np.period,
    domain: np.domain,
    theme: np.traditionalIndication,
    guidance: isTamil
      ? "இந்த காலகட்டத்தை சாதகமாக பயன்படுத்த முன்கூட்டியே திட்டமிடுங்கள்."
      : "Prepare systematically in advance to optimize this traditional alignment."
  }));

  return {
    lifeTimeline: {
      PAST: pastStages.slice(-6), // last 6 past stages
      CURRENT: currentLifePhase,
      NEXT_3_YEARS: next3YearsStages.slice(0, 6),
      NEXT_5_YEARS: next5YearsStages.slice(0, 6),
      NEXT_10_YEARS: next10YearsStages.slice(0, 6),
      LONG_TERM: longTermStages.slice(0, 6)
    },
    nextImportantPeriods,
    majorMilestones: {
      retrospective: retrospectiveMilestones,
      prospective: prospectiveMilestones
    }
  };
}
