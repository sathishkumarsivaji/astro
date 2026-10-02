/**
 * ASTROVERSE — Follow-Up Question Generation Engine
 *
 * Dynamically produces relevant, verified, and deduplicated follow-up questions
 * for any given report section or the full report.
 *
 * STRICT REQUISITE FILTERING:
 * - D9 questions STRICTLY require calculated D9 chart data (never passes just because planets exist).
 * - D10 questions STRICTLY require calculated D10 chart data.
 * - Section questions require actual corresponding section findings.
 * - Dynamically creates questions from real findings (e.g. specific career timing windows,
 *   active yogas, contraindicated gems).
 */

import { FOLLOW_UP_SECTIONS_CONFIG, getFollowUpConfigForSection } from "../config/followUpQuestions.js";
import { buildFollowUpContext } from "./followUpContextBuilder.js";

/**
 * Normalizes question string for deduplication comparison
 */
function normalizeQuestionText(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Checks if all required data fields are genuinely available in the context
 */
function hasRequiredData(requiredData = [], context, chartData = {}) {
  if (!requiredData || requiredData.length === 0) return true;

  for (const key of requiredData) {
    switch (key) {
      case "coreProfile":
        if (!context.chart.ascendant?.sign || !context.chart.moon?.sign) return false;
        break;
      case "strongestThemes":
        if (!context.report.executiveSummary?.strongestThemes?.length) return false;
        break;
      case "currentLifePhase":
        if (!context.report.executiveSummary?.currentLifePhase && !context.chart.currentDasha?.lord) return false;
        break;
      case "birthTimeReliability":
        if (!context.report.executiveSummary?.birthTimeReliability) return false;
        break;
      case "keyCautions":
        if (!context.report.executiveSummary?.keyCautions?.length && !context.report.wellness?.risks?.length) return false;
        break;
      case "ascendant":
        if (!context.chart.ascendant?.sign) return false;
        break;
      case "planets":
        if (!context.chart.planets || context.chart.planets.length === 0) return false;
        break;
      case "atmakaraka":
        if (!context.chart.atmakaraka?.planet) return false;
        break;
      case "aspectsOrDrishti":
        if (context.system.id === "tropical") {
          if (!context.chart.aspects || context.chart.aspects.length === 0) return false;
        }
        break;
      case "yogas":
        if (!context.chart.yogas || context.chart.yogas.length === 0) return false;
        break;
      case "bhavas":
        // Must have actual calculated 12 bhavas data, NOT just planets
        if (!context.report.activeSectionData?.bhavasDetailed?.length && !chartData.bhavasDetailed?.length) {
          return false;
        }
        break;
      case "wellness":
        if (!context.report.wellness?.summary && !context.report.activeSectionData?.domainWellness && !chartData.domainPredictions?.wellness && !chartData.domainPredictions?.health) {
          return false;
        }
        break;
      case "wellnessWindows":
        if (!context.report.wellness?.risks?.length && !chartData.riskMatrix?.risks?.length) return false;
        break;
      case "education":
        if (!context.report.activeSectionData?.academicThemes && !chartData.domainPredictions?.education && !chartData.domainPredictions?.studies) {
          return false;
        }
        break;
      case "educationWindows":
        if (!context.report.activeSectionData?.examWindows?.length && !chartData.masterPredictions?.education?.windows?.length) {
          return false;
        }
        break;
      case "career":
        if (!context.report.career?.destiny && !chartData.careerPathway && !chartData.domainPredictions?.career) {
          return false;
        }
        break;
      case "careerWindows":
        if (!context.report.career?.windows?.length && !chartData.masterPredictions?.career?.windows?.length) {
          return false;
        }
        break;
      case "d10":
        // STRICT: Tropical system cannot have D10, and chart MUST have genuine D10 data
        if (context.system.id === "tropical") return false;
        if (!context.chart.vargas?.d10?.ascendant && !context.report.activeSectionData?.d10Chart?.ascendant && !chartData.structuredVargas?.D10?.ascendant) {
          return false;
        }
        break;
      case "d9":
        // STRICT: Tropical system cannot have D9, and chart MUST have genuine D9 data
        if (context.system.id === "tropical") return false;
        if (!context.chart.vargas?.d9?.ascendant && !context.report.activeSectionData?.d9Chart?.ascendant && !chartData.structuredVargas?.D9?.ascendant) {
          return false;
        }
        break;
      case "tenthCuspSubLord":
        if (context.system.id !== "kp" || !context.chart.kpSubLords?.cusp_10) return false;
        break;
      case "seventhCuspSubLord":
        if (context.system.id !== "kp" || !context.chart.kpSubLords?.cusp_7) return false;
        break;
      case "property":
        if (!context.report.wealth?.summary && !chartData.domainPredictions?.property && !chartData.domainPredictions?.wealth) {
          return false;
        }
        break;
      case "propertyWindows":
        if (!context.report.wealth?.windows?.length && !chartData.masterPredictions?.property?.windows?.length) {
          return false;
        }
        break;
      case "leadership":
        if (!context.report.activeSectionData?.governanceThemes && !chartData.domainPredictions?.politics) {
          return false;
        }
        break;
      case "marriage":
        if (!context.report.marriage?.verdict && !chartData.marriagePathway && !chartData.domainPredictions?.marriage && !chartData.domainPredictions?.relationship) {
          return false;
        }
        break;
      case "marriageWindows":
        if (!context.report.marriage?.windows?.length && !chartData.masterPredictions?.marriage?.windows?.length) {
          return false;
        }
        break;
      case "foreign":
        if (!context.report.activeSectionData?.foreignTravelSummary && !chartData.domainPredictions?.travel && !chartData.domainPredictions?.foreignMoksha) {
          return false;
        }
        break;
      case "tridosha":
        if (context.system.id === "tropical") return false;
        if (!context.report.activeSectionData?.primaryDosha && !chartData.tridoshaBalance?.primaryDosha) {
          return false;
        }
        break;
      case "remedies":
        if (context.system.id === "tropical") return false;
        if (!context.report.remedies?.primaryGemstone && !context.report.remedies?.mantra && !chartData.personalizedRemedies) {
          return false;
        }
        break;
      case "auspicious":
        if (!context.report.activeSectionData?.auspiciousWindows && !chartData.auspiciousTimelines) {
          return false;
        }
        break;
      case "riskMatrix":
        if (!context.report.wellness?.risks?.length && !chartData.riskMatrix?.risks?.length) {
          return false;
        }
        break;
      case "currentMahadasha":
        if (context.system.id === "tropical") return false;
        if (!context.chart.currentDasha?.lord) return false;
        break;
      case "currentAntardasha":
        if (context.system.id === "tropical") return false;
        if (!context.chart.currentDasha?.subLord) return false;
        break;
      case "dashaTable":
        if (context.system.id === "tropical") return false;
        if (!chartData.dashaTable || chartData.dashaTable.length === 0) return false;
        break;
      case "timelineStages":
        if (context.system.id === "tropical") return false;
        if (!context.report.activeSectionData?.timelineStages?.length && !chartData.chronologicalDashaTimeline?.stages?.length) {
          return false;
        }
        break;
      case "retrospectiveAudit":
        if (context.system.id === "tropical") return false;
        if (!context.report.activeSectionData?.retrospectiveMilestones?.length && !chartData.retrospectiveLifeAudit?.milestones?.length && !chartData.retrospectiveMilestones?.length) {
          return false;
        }
        break;
      case "reasoningChain":
        if (context.system.id === "tropical") return false;
        if (!context.evidence.evidenceIds || context.evidence.evidenceIds.length === 0) return false;
        break;
      case "evidenceLedger":
        if (!context.evidence.evidenceIds || context.evidence.evidenceIds.length === 0) return false;
        break;
      case "contradictionReconciliation":
        if (context.system.id === "tropical") return false;
        break;
      case "system":
        if (!context.system?.name) return false;
        break;
      case "houseSystem":
        if (!context.system?.defaultHouseSystem) return false;
        break;
      case "shadbala":
        if (context.system.id === "tropical" || context.system.id === "kp") return false;
        if (!context.chart.shadbala || context.chart.shadbala.length === 0) return false;
        break;
      case "ashtakavarga":
        if (context.system.id === "tropical" || context.system.id === "kp") return false;
        if (!context.chart.ashtakavarga || typeof context.chart.ashtakavarga.totalBindus !== "number") return false;
        break;
      case "multiSystemComparison":
        if (!context.multiSystemAvailable) return false;
        break;
      case "masterPredictions":
        if (!context.report.career?.windows?.length && !context.report.marriage?.windows?.length) return false;
        break;
      default:
        break;
    }
  }

  return true;
}

/**
 * Replaces placeholders in template text with actual calculated values
 */
function interpolateQuestionText(templateText, context, isTamil = false) {
  let text = templateText;

  const asc = context.chart.ascendant?.sign || "";
  const moon = context.chart.moon?.sign || "";
  const nak = context.chart.moon?.nakshatra || "";
  const curMd = context.chart.currentDasha?.lord || "";
  const curAd = context.chart.currentDasha?.subLord || "";
  const ak = context.chart.atmakaraka?.planet || "";
  const gem = context.report.remedies?.primaryGemstone || "";
  const sub10 = context.chart.kpSubLords?.cusp_10 || "";
  const sub7 = context.chart.kpSubLords?.cusp_7 || "";
  const sysName = isTamil ? (context.system.tamilName || context.system.name) : context.system.name;

  text = text.replace(/\{ascendant\}/g, asc);
  text = text.replace(/\{moonSign\}/g, moon);
  text = text.replace(/\{nakshatra\}/g, nak);
  text = text.replace(/\{currentMahadasha\}/g, curMd);
  text = text.replace(/\{currentAntardasha\}/g, curAd);
  text = text.replace(/\{atmakaraka\}/g, ak);
  text = text.replace(/\{primaryGemstone\}/g, gem);
  text = text.replace(/\{tenthCuspSubLord\}/g, sub10);
  text = text.replace(/\{seventhCuspSubLord\}/g, sub7);
  text = text.replace(/\{systemName\}/g, sysName);

  return text;
}

/**
 * Generates follow-up questions for a specific section
 */
export function getSectionQuestions({
  sectionId = "execSummary",
  systemId = "lahiri",
  reportData = null,
  chartData = null,
  evidence = null,
  lang = "en",
  multiSystemBundle = null
}) {
  const isTamil = lang === "ta";
  const effectiveChartData = chartData || reportData || {};
  const context = buildFollowUpContext({
    chartData: effectiveChartData,
    activeSection: sectionId,
    systemId,
    multiSystemBundle,
    lang
  });

  const secConfig = getFollowUpConfigForSection(sectionId);
  const sysId = context.system.id;

  // 1. Check system applicability
  if (!secConfig.applicableSystems.includes(sysId)) {
    return {
      sectionId,
      systemId: sysId,
      applicable: false,
      reason: `Section "${secConfig.label}" is not applicable to the ${context.system.name} system.`,
      questions: []
    };
  }

  const seenNorm = new Set();
  const eligibleQuestions = [];

  // 2. Generate dynamic finding-driven questions from actual section data
  if (sectionId === "career" && context.report.career?.windows?.length > 0) {
    const firstWin = context.report.career.windows[0];
    const winYears = firstWin.calendarYears || "";
    if (winYears) {
      const qText = isTamil
        ? `தொழில் ஆய்வில் ${winYears} காலக்கட்டம் முக்கிய முன்னேற்ற காலமாக சுட்டிக்காட்டப்படுவது ஏன்?`
        : `Why does the report identify ${winYears} as an important career progression window?`;
      seenNorm.add(normalizeQuestionText(qText));
      eligibleQuestions.push({
        id: "dyn_career_win",
        text: qText,
        category: "Career",
        priority: 1,
        source: "generated",
        requiredData: ["careerWindows"]
      });
    }
  }

  if (sectionId === "relationships" && context.report.marriage?.windows?.length > 0) {
    const firstWin = context.report.marriage.windows[0];
    const winYears = firstWin.calendarYears || "";
    if (winYears) {
      const qText = isTamil
        ? `திருமண கால கணிப்பில் ${winYears} காலம் உகந்த சுப காலமாக மதிப்பிடப்படுவது ஏன்?`
        : `What planetary factors support the ${winYears} window for marriage timing?`;
      seenNorm.add(normalizeQuestionText(qText));
      eligibleQuestions.push({
        id: "dyn_marr_win",
        text: qText,
        category: "Marriage",
        priority: 1,
        source: "generated",
        requiredData: ["marriageWindows"]
      });
    }
  }

  if (sectionId === "yogas" && context.chart.yogas?.length > 0) {
    const topYoga = context.chart.yogas[0].name;
    const qText = isTamil
      ? `என் ஜாதகத்தில் அமைந்துள்ள ${topYoga} இந்த அறிக்கையின்படி எவ்வாறு பலன் தரும்?`
      : `How does the ${topYoga} in my chart manifest according to the report?`;
    seenNorm.add(normalizeQuestionText(qText));
    eligibleQuestions.push({
      id: "dyn_top_yoga",
      text: qText,
      category: "Yoga",
      priority: 1,
      source: "generated",
      requiredData: ["yogas"]
    });
  }

  if (sectionId === "remedies" && context.report.remedies?.contraindicatedGemstones?.length > 0) {
    const rawStone = context.report.remedies.contraindicatedGemstones[0];
    const badStone = typeof rawStone === "string" ? rawStone : (rawStone?.gemstone || rawStone?.name || "Diamond");
    const qText = isTamil
      ? `பரிகாரப் பிரிவில் ${badStone} ரத்தினம் எனக்கு தவிர்க்கப்பட வேண்டும் என கூறப்பட்டிருப்பது ஏன்?`
      : `Why is ${badStone} contraindicated for me in the remedies section?`;
    seenNorm.add(normalizeQuestionText(qText));
    eligibleQuestions.push({
      id: "dyn_bad_stone",
      text: qText,
      category: "Remedies",
      priority: 2,
      source: "generated",
      requiredData: ["remedies"]
    });
  }

  // 3. Evaluate static templates with strict data availability
  for (const tmpl of secConfig.templates) {
    if (tmpl.systems && !tmpl.systems.includes(sysId)) {
      continue;
    }

    if (!hasRequiredData(tmpl.requiredData, context, effectiveChartData)) {
      continue;
    }

    const rawText = isTamil ? tmpl.textTamil : tmpl.text;
    const interpolated = interpolateQuestionText(rawText, context, isTamil);
    const norm = normalizeQuestionText(interpolated);

    if (seenNorm.has(norm)) {
      continue;
    }
    seenNorm.add(norm);

    eligibleQuestions.push({
      id: tmpl.id,
      text: interpolated,
      category: tmpl.category,
      priority: tmpl.priority || 5,
      source: "template",
      requiredData: tmpl.requiredData || []
    });
  }

  eligibleQuestions.sort((a, b) => a.priority - b.priority);

  return {
    sectionId,
    systemId: sysId,
    applicable: true,
    questions: eligibleQuestions.slice(0, 6)
  };
}

/**
 * Generates follow-up questions for the Full Report general view
 */
export function getFullReportQuestions({
  systemId = "lahiri",
  reportData = null,
  chartData = null,
  evidence = null,
  lang = "en",
  multiSystemBundle = null
}) {
  const isTamil = lang === "ta";
  const effectiveChartData = chartData || reportData || {};
  const context = buildFollowUpContext({
    chartData: effectiveChartData,
    activeSection: "fullReport",
    systemId,
    multiSystemBundle,
    lang
  });

  const fullConfig = FOLLOW_UP_SECTIONS_CONFIG.fullReport;
  const sysId = context.system.id;
  const seenNorm = new Set();
  const eligibleQuestions = [];

  for (const tmpl of fullConfig.templates) {
    if (tmpl.systems && !tmpl.systems.includes(sysId)) {
      continue;
    }
    if (!hasRequiredData(tmpl.requiredData, context, effectiveChartData)) {
      continue;
    }

    const rawText = isTamil ? tmpl.textTamil : tmpl.text;
    const interpolated = interpolateQuestionText(rawText, context, isTamil);
    const norm = normalizeQuestionText(interpolated);

    if (seenNorm.has(norm)) continue;
    seenNorm.add(norm);

    eligibleQuestions.push({
      id: tmpl.id,
      text: interpolated,
      category: tmpl.category,
      priority: tmpl.priority || 5,
      source: "template",
      requiredData: tmpl.requiredData || []
    });
  }

  // Dynamic Dasha question (strictly Vedic)
  if (context.chart.currentDasha?.lord && !seenNorm.has(normalizeQuestionText("what does my period mean"))) {
    const md = context.chart.currentDasha.lord;
    const ad = context.chart.currentDasha.subLord || "";
    const dynText = isTamil
      ? `என் தற்போதைய ${md}${ad ? `–${ad}` : ""} தசா காலம் இந்த அறிக்கையின்படி எதைக் குறிக்கிறது?`
      : `What does my ${md}${ad ? `–${ad}` : ""} period mean according to this report?`;
    eligibleQuestions.push({
      id: "dyn_dasha_1",
      text: dynText,
      category: "Dasha",
      priority: 2,
      source: "generated",
      requiredData: ["currentMahadasha"]
    });
  }

  // Dynamic Career Timing Window question
  if (context.report.career?.windows?.length > 0) {
    const yr = context.report.career.windows[0].years;
    if (yr) {
      const dynText = isTamil
        ? `அறிக்கை ஏன் ${yr} காலத்தை முக்கிய தொழில் வளர்ச்சி சாளரமாக அடையாளம் காட்டுகிறது?`
        : `Why does the report identify ${yr} as an important career progression window?`;
      eligibleQuestions.push({
        id: "dyn_career_win_full",
        text: dynText,
        category: "Timing",
        priority: 2,
        source: "generated",
        requiredData: ["careerWindows"]
      });
    }
  }

  // Dynamic Marriage Timing Window question
  if (context.report.marriage?.windows?.length > 0) {
    const yr = context.report.marriage.windows[0].years;
    if (yr) {
      const dynText = isTamil
        ? `${yr} திருமண காலத்தை அறிக்கையில் எந்த கிரக காரணிகள் ஆதரிக்கின்றன?`
        : `What planetary factors support the ${yr} window for marriage timing?`;
      eligibleQuestions.push({
        id: "dyn_marr_win_full",
        text: dynText,
        category: "Timing",
        priority: 3,
        source: "generated",
        requiredData: ["marriageWindows"]
      });
    }
  }

  // Dynamic Major Yoga question (strictly Vedic)
  if (sysId !== "tropical" && context.chart.yogas?.length > 0) {
    const topYoga = context.chart.yogas[0].name;
    const dynText = isTamil
      ? `என் ஜாதகத்தில் உள்ள ${topYoga} யோகம் அறிக்கையின்படி எவ்வாறு வெளிப்படுகிறது?`
      : `How does the ${topYoga} in my chart manifest according to the report?`;
    eligibleQuestions.push({
      id: "dyn_yoga_full",
      text: dynText,
      category: "Yogas",
      priority: 3,
      source: "generated",
      requiredData: ["yogas"]
    });
  }

  // Dynamic D10 Dashamsha question (strictly Vedic)
  if (sysId !== "tropical" && context.chart.vargas?.d10?.ascendant) {
    const d10Asc = context.chart.vargas.d10.ascendant;
    const dynText = isTamil
      ? `என் தசாம்சம் (D10) லக்னம் (${d10Asc}) தொழில் அந்தஸ்தை எவ்வாறு தீர்மானிக்கிறது?`
      : `How does my D10 Dashamsha Ascendant (${d10Asc}) influence my vocational status?`;
    eligibleQuestions.push({
      id: "dyn_d10_full",
      text: dynText,
      category: "Career",
      priority: 4,
      source: "generated",
      requiredData: ["d10"]
    });
  }

  // Dynamic D9 Navamsha question (strictly Vedic)
  if (sysId !== "tropical" && context.chart.vargas?.d9?.ascendant) {
    const d9Asc = context.chart.vargas.d9.ascendant;
    const dynText = isTamil
      ? `என் நவாம்சம் (D9) லக்னம் (${d9Asc}) நீண்டகால வாழ்க்கை விதியை எவ்வாறு வழிநடத்துகிறது?`
      : `What does my D9 Navamsha Ascendant (${d9Asc}) reveal about my long-term trajectory?`;
    eligibleQuestions.push({
      id: "dyn_d9_full",
      text: dynText,
      category: "Relationships",
      priority: 4,
      source: "generated",
      requiredData: ["d9"]
    });
  }

  // Dynamic Contraindicated Gemstone safety question
  if (sysId !== "tropical" && context.report.remedies?.contraindicatedGemstones?.length > 0) {
    const rawGem = context.report.remedies.contraindicatedGemstones[0];
    const badGem = typeof rawGem === "string" ? rawGem : (rawGem?.gemstone || rawGem?.name || "Diamond");
    const dynText = isTamil
      ? `எனக்கு ஏன் ${badGem} ரத்தினம் தவிர்க்கப்பட வேண்டும் என்று அறிக்கை கூறுகிறது?`
      : `Why is ${badGem} contraindicated for me according to the remedies analysis?`;
    eligibleQuestions.push({
      id: "dyn_gem_full",
      text: dynText,
      category: "Remedies",
      priority: 4,
      source: "generated",
      requiredData: ["remedies"]
    });
  }

  // Dynamic KP Sub Lord question (strictly KP)
  if (sysId === "kp" && context.chart.kpSubLords?.cusp_10) {
    const sub10 = context.chart.kpSubLords.cusp_10;
    const dynText = isTamil
      ? `கே.பி. ஆய்வின்படி 10-ம் பாவ உப அதிபதி (${sub10}) தொழில் பற்றி என்ன கூறுகிறார்?`
      : `What does my 10th cusp sub lord (${sub10}) indicate according to the KP analysis?`;
    eligibleQuestions.push({
      id: "dyn_kp_1",
      text: dynText,
      category: "KP",
      priority: 3,
      source: "generated",
      requiredData: ["tenthCuspSubLord"]
    });
  }

  // Dynamic Multi-System Comparison question
  if (context.multiSystemAvailable) {
    const dynText = isTamil
      ? "லஹிரி மற்றும் கே.பி. முறைகளுக்கு இடையே என் ஜாதகத்தில் உள்ள முக்கிய மாற்றங்கள் என்ன?"
      : "What are the main differences between Lahiri and KP for my chart?";
    eligibleQuestions.push({
      id: "dyn_comp_1",
      text: dynText,
      category: "System Comparison",
      priority: 4,
      source: "generated",
      requiredData: ["multiSystemComparison"]
    });
  }

  eligibleQuestions.sort((a, b) => a.priority - b.priority);

  return {
    sectionId: "fullReport",
    systemId: sysId,
    applicable: true,
    questions: eligibleQuestions.slice(0, 10)
  };
}
