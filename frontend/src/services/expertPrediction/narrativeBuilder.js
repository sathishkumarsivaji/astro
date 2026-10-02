/**
 * ASTROVERSE — Expert Mode Narrative Builder
 * ============================================
 * Generates bilingual (English + Tamil) plain-language narratives
 * for Expert Mode domain predictions.
 *
 * RULES:
 * - Every statement must be traceable to evidence
 * - Health narratives pass through healthSafetyLayer
 * - Never fabricate dates or claim unsupported precision
 * - Use conditional/suggestive language, not deterministic claims
 */

import { RESOLUTION, DOMAIN, SUB_PHASE_STATUS } from "./expertPredictionSchema.js";

// ─────────────────────────────────────────────────────────────
// 1. RESOLUTION LABELS
// ─────────────────────────────────────────────────────────────

const RESOLUTION_LABELS = {
  [RESOLUTION.YEAR]:               { en: "Year-level", ta: "ஆண்டு நிலை" },
  [RESOLUTION.SEASON]:             { en: "Season-level", ta: "பருவ நிலை" },
  [RESOLUTION.MONTH_RANGE]:        { en: "Month-range", ta: "மாத வரம்பு" },
  [RESOLUTION.DATE_RANGE]:         { en: "Date-range", ta: "தேதி வரம்பு" },
  [RESOLUTION.DAY]:                { en: "Day-level", ta: "நாள் நிலை" },
  [RESOLUTION.TIME_WINDOW]:        { en: "Time-window", ta: "நேர சாளரம்" },
  [RESOLUTION.MULTI_MODAL]:        { en: "Multiple windows", ta: "பல சாளரங்கள்" },
  [RESOLUTION.NOT_DISCRIMINATING]: { en: "Not discriminating", ta: "வேறுபாடு இல்லை" },
  [RESOLUTION.INSUFFICIENT_DATA]:  { en: "Insufficient data", ta: "போதிய தரவு இல்லை" }
};

// ─────────────────────────────────────────────────────────────
// 2. DOMAIN LABELS
// ─────────────────────────────────────────────────────────────

const DOMAIN_LABELS = {
  [DOMAIN.MARRIAGE]:       { en: "Marriage & Partnership", ta: "திருமணம் & வாழ்க்கைத் துணை" },
  [DOMAIN.PROPERTY]:       { en: "Property & Real Estate", ta: "சொத்து & நிலம்" },
  [DOMAIN.CAREER]:         { en: "Career & Professional Growth", ta: "தொழில் & வாழ்க்கை வளர்ச்சி" },
  [DOMAIN.EDUCATION]:      { en: "Education & Academic Excellence", ta: "கல்வி & மேதைமை" },
  [DOMAIN.CHILDREN]:       { en: "Children & Progeny", ta: "குழந்தை & சந்ததி" },
  [DOMAIN.FOREIGN_TRAVEL]: { en: "Foreign Travel & Relocation", ta: "வெளிநாடு & இடமாற்றம்" },
  [DOMAIN.VEHICLE]:        { en: "Vehicle Acquisition", ta: "வாகன சேர்க்கை" },
  [DOMAIN.BUSINESS]:       { en: "Business & Enterprise", ta: "வணிகம் & தொழில்முனைவு" },
  [DOMAIN.JOB]:            { en: "Employment & Job Transitions", ta: "வேலை & பணி மாற்றங்கள்" },
  [DOMAIN.FINANCE]:        { en: "Finance & Wealth", ta: "நிதி & செல்வம்" },
  [DOMAIN.FAMILY]:         { en: "Family & Parental Themes", ta: "குடும்பம் & பெற்றோர்" },
  [DOMAIN.LEADERSHIP]:     { en: "Leadership & Public Life", ta: "தலைமை & பொது வாழ்க்கை" },
  [DOMAIN.WELLNESS]:       { en: "Traditional Wellness & Preventive Attention", ta: "பாரம்பரிய ஆரோக்கியம் & தடுப்பு கவனிப்பு" },
  [DOMAIN.LEGAL]:          { en: "Legal & Litigation", ta: "சட்டம் & வழக்கு" },
  [DOMAIN.SPIRITUAL]:      { en: "Spiritual & Inner Life", ta: "ஆன்மீகம் & உள்வாழ்க்கை" },
  [DOMAIN.CAUTION]:        { en: "Caution & Risk Periods", ta: "எச்சரிக்கை & ஆபத்து காலங்கள்" },
  [DOMAIN.MILESTONES]:     { en: "Major Life Milestones", ta: "முக்கிய வாழ்க்கை மைல்கற்கள்" }
};

// ─────────────────────────────────────────────────────────────
// 3. MAIN NARRATIVE BUILDER
// ─────────────────────────────────────────────────────────────

/**
 * Builds the complete bilingual narrative for a domain result.
 *
 * @param {Object} domainResult - From createDomainResult()
 * @returns {{ en: string, ta: string }}
 */
export function buildDomainNarrative(domainResult) {
  if (!domainResult) return { en: "", ta: "" };
  const domain = domainResult.domain;
  const outlook = domainResult.outlook || "SUPPORTED";
  const natalPromise = domainResult.natalPromise || {};
  const primaryWindows = Array.isArray(domainResult.primaryWindows)
    ? domainResult.primaryWindows
    : (Array.isArray(domainResult.timingWindows) ? domainResult.timingWindows : []);
  const cautionWindows = Array.isArray(domainResult.cautionWindows) ? domainResult.cautionWindows : [];
  const subPhases = Array.isArray(domainResult.subPhases) ? domainResult.subPhases : [];
  const whyNot = domainResult.whyNot || { whyNotStronger: [], whatPreventsGreaterPrecision: [] };
  const resolution = domainResult.resolution || RESOLUTION.INSUFFICIENT_DATA;

  const en = [];
  const ta = [];

  const label = DOMAIN_LABELS[domain] || { en: domain, ta: domain };

  // Header
  en.push(`## ${label.en}`);
  ta.push(`## ${label.ta}`);

  // Outlook
  en.push(`**Outlook:** ${outlook}`);
  ta.push(`**கணிப்பு:** ${translateOutlook(outlook, true)}`);

  // Natal promise summary
  if (natalPromise && natalPromise.status) {
    en.push(`**Natal Assessment:** ${natalPromise.status}`);
    ta.push(`**மூல ஜாதக மதிப்பீடு:** ${natalPromise.statusTamil || natalPromise.status}`);
  }

  // Resolution
  const resLabel = RESOLUTION_LABELS[resolution] || RESOLUTION_LABELS[RESOLUTION.INSUFFICIENT_DATA];
  en.push(`**Timing Resolution:** ${resLabel.en}`);
  ta.push(`**நேர கணிப்பு நிலை:** ${resLabel.ta}`);

  // Primary windows
  if (primaryWindows.length > 0) {
    en.push("");
    en.push("### Timing Windows");
    ta.push("");
    ta.push("### நேர சாளரங்கள்");

    for (let i = 0; i < primaryWindows.length; i++) {
      const w = primaryWindows[i];
      const windowNarrative = buildWindowNarrative(w, i + 1, false);
      const windowNarrativeTa = buildWindowNarrative(w, i + 1, true);
      en.push(windowNarrative);
      ta.push(windowNarrativeTa);
    }
  } else {
    en.push("\nNo sufficiently supported timing window identified.");
    ta.push("\nபோதுமான ஆதரவுள்ள நேர சாளரம் கண்டறியப்படவில்லை.");
  }

  // Caution windows
  if (cautionWindows.length > 0) {
    en.push("");
    en.push("### Caution Periods");
    ta.push("");
    ta.push("### எச்சரிக்கை காலங்கள்");

    for (const w of cautionWindows) {
      en.push(buildCautionNarrative(w, false));
      ta.push(buildCautionNarrative(w, true));
    }
  }

  // Sub-phases
  if (subPhases.length > 0) {
    en.push("");
    en.push("### Sub-Phase Assessment");
    ta.push("");
    ta.push("### துணை-கட்ட மதிப்பீடு");

    for (const sp of subPhases) {
      en.push(buildSubPhaseNarrative(sp, false));
      ta.push(buildSubPhaseNarrative(sp, true));
    }
  }

  // WHY NOT section
  if (whyNot) {
    const whyNotNarr = buildWhyNotNarrative(whyNot, false);
    const whyNotNarrTa = buildWhyNotNarrative(whyNot, true);
    if (whyNotNarr) {
      en.push("");
      en.push(whyNotNarr);
      ta.push("");
      ta.push(whyNotNarrTa);
    }
  }

  return {
    en: en.join("\n"),
    ta: ta.join("\n")
  };
}

// ─────────────────────────────────────────────────────────────
// 4. WINDOW NARRATIVE
// ─────────────────────────────────────────────────────────────

function buildWindowNarrative(window, index, isTamil) {
  const lines = [];
  const prefix = isTamil ? `**சாளரம் ${index}:**` : `**Window ${index}:**`;

  // Date range
  const dateRange = formatDateRange(window.startDate, window.endDate, isTamil);
  lines.push(`${prefix} ${dateRange}`);

  // Confidence
  const conf = window.confidenceType || "CANDIDATE_WINDOW";
  lines.push(isTamil ? `  ஒருங்கிணைவு: ${translateConfidence(conf, true)}` : `  Convergence: ${translateConfidence(conf, false)}`);

  // Resolution
  const res = RESOLUTION_LABELS[window.resolution] || { en: window.resolution, ta: window.resolution };
  lines.push(isTamil ? `  கணிப்பு நிலை: ${res.ta}` : `  Resolution: ${res.en}`);

  // WHY — supporting factors
  if (window.whySupported && window.whySupported.length > 0) {
    lines.push(isTamil ? "  **ஏன் இந்த காலம்?**" : "  **Why this window?**");
    for (const factor of window.whySupported) {
      const desc = isTamil ? (factor.descriptionTamil || factor.description) : factor.description;
      lines.push(`  - ${desc}`);
    }
  }

  // Dasha details
  if (window.dashaFacts) {
    const df = window.dashaFacts;
    if (df.md) {
      lines.push(isTamil
        ? `  மகா தசா: ${df.md.tamil || df.md.lord}`
        : `  Mahadasha: ${df.md.lord}`);
    }
    if (df.ad) {
      lines.push(isTamil
        ? `  அந்தர்தசா: ${df.ad.tamil || df.ad.lord}`
        : `  Antardasha: ${df.ad.lord}`);
    }
    if (df.pd) {
      lines.push(isTamil
        ? `  பிரத்தியந்தர தசா: ${df.pd.tamil || df.pd.lord}`
        : `  Pratyantardasha: ${df.pd.lord}`);
    }
  }

  // WHY NOT — contradictions
  if (window.contradictions && window.contradictions.length > 0) {
    lines.push(isTamil ? "  **ஏன் வலிமையாக இல்லை:**" : "  **Why not stronger:**");
    for (const c of window.contradictions) {
      const desc = isTamil ? (c.descriptionTamil || c.description) : c.description;
      lines.push(`  - ${desc}`);
    }
  }

  // Precision limits
  if (window.whatPreventsGreaterPrecision && window.whatPreventsGreaterPrecision.length > 0) {
    lines.push(isTamil ? "  **துல்லியத்தை தடுப்பது:**" : "  **What prevents greater precision:**");
    for (const p of window.whatPreventsGreaterPrecision) {
      const desc = isTamil ? (p.descriptionTamil || p.description) : p.description;
      lines.push(`  - ${desc}`);
    }
  }

  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────
// 5. CAUTION NARRATIVE
// ─────────────────────────────────────────────────────────────

function buildCautionNarrative(window, isTamil) {
  const dateRange = formatDateRange(window.startDate, window.endDate, isTamil);
  const lines = [];

  lines.push(isTamil ? `⚠️ **எச்சரிக்கை:** ${dateRange}` : `⚠️ **Caution:** ${dateRange}`);

  if (window.contradictions?.length > 0) {
    for (const c of window.contradictions) {
      const desc = isTamil ? (c.descriptionTamil || c.description) : c.description;
      lines.push(`  - ${desc}`);
    }
  }

  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────
// 6. SUB-PHASE NARRATIVE
// ─────────────────────────────────────────────────────────────

function buildSubPhaseNarrative(subPhase, isTamil) {
  const status = subPhase.status || SUB_PHASE_STATUS.INSUFFICIENT_DATA;
  const label = isTamil ? (subPhase.labelTamil || subPhase.label) : subPhase.label;

  const statusLabel = {
    [SUB_PHASE_STATUS.SUPPORTED]:         isTamil ? "✅ ஆதரிக்கப்படுகிறது" : "✅ Supported",
    [SUB_PHASE_STATUS.NOT_ESTABLISHED]:   isTamil ? "❓ நிறுவப்படவில்லை" : "❓ Not established",
    [SUB_PHASE_STATUS.INSUFFICIENT_DATA]: isTamil ? "⚪ போதிய தரவு இல்லை" : "⚪ Insufficient data"
  }[status] || status;

  let line = `- **${label}**: ${statusLabel}`;

  if (status === SUB_PHASE_STATUS.SUPPORTED && subPhase.window) {
    const dateRange = formatDateRange(subPhase.window.startDate, subPhase.window.endDate, isTamil);
    line += ` — ${dateRange}`;
  }

  return line;
}

// ─────────────────────────────────────────────────────────────
// 7. WHY NOT NARRATIVE
// ─────────────────────────────────────────────────────────────

function buildWhyNotNarrative(whyNot, isTamil) {
  const lines = [];

  if (whyNot.whyNotStronger?.length > 0) {
    lines.push(isTamil ? "### ஏன் வலிமையாக இல்லை" : "### Why Not Stronger");
    for (const item of whyNot.whyNotStronger) {
      const desc = isTamil ? (item.descriptionTamil || item.description) : item.description;
      lines.push(`- ${desc}`);
    }
  }

  if (whyNot.whatPreventsGreaterPrecision?.length > 0) {
    lines.push(isTamil ? "### துல்லியத்தை தடுக்கும் காரணிகள்" : "### What Prevents Greater Precision");
    for (const item of whyNot.whatPreventsGreaterPrecision) {
      const desc = isTamil ? (item.descriptionTamil || item.description) : item.description;
      lines.push(`- ${desc}`);
    }
  }

  return lines.length > 0 ? lines.join("\n") : null;
}

// ─────────────────────────────────────────────────────────────
// 8. HELPERS
// ─────────────────────────────────────────────────────────────

function formatDateRange(startDate, endDate, isTamil) {
  if (!startDate && !endDate) {
    return isTamil ? "தேதி தீர்மானிக்கப்படவில்லை" : "Date not determined";
  }
  if (startDate && endDate) {
    return `${formatDate(startDate, isTamil)} – ${formatDate(endDate, isTamil)}`;
  }
  if (startDate) {
    return isTamil ? `${formatDate(startDate, isTamil)} முதல்` : `From ${formatDate(startDate, isTamil)}`;
  }
  return isTamil ? `${formatDate(endDate, isTamil)} வரை` : `Until ${formatDate(endDate, isTamil)}`;
}

function formatDate(dateStr, isTamil) {
  if (!dateStr) return isTamil ? "தெரியவில்லை" : "Unknown";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = isTamil
      ? ["ஜனவரி", "பிப்ரவரி", "மார்ச்", "ஏப்ரல்", "மே", "ஜூன்", "ஜூலை", "ஆகஸ்ட்", "செப்டம்பர்", "அக்டோபர்", "நவம்பர்", "டிசம்பர்"]
      : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  } catch {
    return dateStr;
  }
}

function translateOutlook(outlook, isTamil) {
  if (!isTamil) return outlook;
  const map = {
    "SUPPORTED": "ஆதரிக்கப்படுகிறது",
    "PARTIAL": "பகுதியளவு",
    "NOT_ESTABLISHED": "நிறுவப்படவில்லை",
    "INSUFFICIENT_DATA": "போதிய தரவு இல்லை"
  };
  return map[outlook] || outlook;
}

function translateConfidence(conf, isTamil) {
  if (!isTamil) return conf.replace(/_/g, " ").toLowerCase();
  const map = {
    "PEAK_CONVERGENCE": "உச்ச ஒருங்கிணைவு",
    "STRONG_CONVERGENCE": "வலுவான ஒருங்கிணைவு",
    "PRIMARY_ACTIVATION": "முதன்மை இயக்கம்",
    "CANDIDATE_WINDOW": "வேட்பாளர் சாளரம்",
    "GUARDED_PERIOD": "பாதுகாப்பு காலம்",
    "INSUFFICIENT_DATA": "போதிய தரவு இல்லை"
  };
  return map[conf] || conf;
}

// ─────────────────────────────────────────────────────────────
// 9. EXPORTS
// ─────────────────────────────────────────────────────────────

export { DOMAIN_LABELS, RESOLUTION_LABELS };
