/**
 * ASTROVERSE — Traditional Wellness & Preventive Attention Domain Adapter
 * ========================================================================
 * Implements strict non-clinical safety guardrails.
 * Never diagnoses illnesses, predicts surgery, organ failure, or death.
 * Frame exclusively as traditional Jyotisha/Ayurvedic symbolic correspondence.
 */

import { DOMAIN, SUB_PHASE_STATUS, RESOLUTION, createDomainResult } from '../expertPredictionSchema.js';
import { extractCanonicalFacts } from '../canonicalFactAdapter.js';
import { runDomainTiming } from '../domainTimingEngine.js';
import { calculateHealthVulnerabilityEvents } from '../../astroEngine.js';
import { getBodyRegionsForHouses, getBodyRegionsForPlanets } from '../bodyRegionRegistry.js';
import { validateHealthOutput, sanitizeHealthText } from '../healthSafetyLayer.js';

/**
 * Calculates Expert Mode Traditional Wellness & Preventive Attention predictions.
 *
 * @param {Object} chartData
 * @param {string} [lang="en"]
 * @returns {Object} ExpertDomainResult
 */
export function calculateHealthExpert(chartData, lang = 'en') {
  const isTamil = lang === 'ta';
  const facts = extractCanonicalFacts(chartData);

  // Explicit check for ascendant sign index
  if (facts.ascendantSignIdx === null || facts.ascendantSignIdx === undefined || !Number.isFinite(facts.ascendantSignIdx)) {
    return createDomainResult({
      domain: DOMAIN.WELLNESS,
      domainLabel: "Traditional Wellness & Preventive Attention",
      domainLabelTamil: "பாரம்பரிய ஆரோக்கியம் & தடுப்பு கவனிப்பு",
      outlook: "INSUFFICIENT_DATA",
      resolution: RESOLUTION.INSUFFICIENT_DATA,
      whyNot: {
        whyNotStronger: [
          {
            description: "Ascendant sign index is missing; wellness body-region mapping requires calculated Lagna.",
            descriptionTamil: "லக்ன ராசி விவரம் இல்லை; நல்வாழ்வு உடல்-பகுதி கணிப்பிற்கு லக்னம் அவசியம்.",
            severity: "HIGH",
            type: "PRECISION_LIMIT"
          }
        ],
        whatPreventsGreaterPrecision: []
      }
    });
  }

  // 1. Consume legacy engine's safe vulnerability calculations
  let legacyEvents = [];
  let natalStatus = isTamil ? "பாரம்பரிய தற்காப்பு நல்வாழ்வு வழிகாட்டல்" : "Traditional Preventive Ayurvedic Balance";
  try {
    const rawLegacy = calculateHealthVulnerabilityEvents ? calculateHealthVulnerabilityEvents(chartData, lang) : null;
    if (rawLegacy) {
      legacyEvents = rawLegacy.candidateWindows || [];
      if (rawLegacy.natalPromise?.status) {
        natalStatus = rawLegacy.natalPromise.status;
      }
    }
  } catch (_err) {
    legacyEvents = [];
  }

  // 2. Identify primary body-region correspondences based on Lagna and 6th/8th houses
  const lagnaSignIdx = facts.ascendantSignIdx;
  const regionsForLagnaAnd6th = getBodyRegionsForHouses([1, 6, 8], lagnaSignIdx);
  const primaryRegion = regionsForLagnaAnd6th[0] || null;

  // 3. Configure domain timing
  const config = {
    domain: DOMAIN.WELLNESS,
    domainLabel: "Traditional Wellness & Preventive Attention",
    domainLabelTamil: "பாரம்பரிய ஆரோக்கியம் & தடுப்பு கவனிப்பு",
    houses: [1, 6, 8, 12],
    karakas: ['Sun', 'Moon', 'Mars', 'Saturn'],
    varga: 'D30',
    legacyTiming: legacyEvents,
    natalPromise: {
      status: natalStatus,
      primaryRegion: primaryRegion ? (isTamil ? primaryRegion.labelTa : primaryRegion.labelEn) : null,
      disclaimer: isTamil
        ? "பாரம்பரிய ஜோதிட குறியீட்டு வழிகாட்டல் மட்டுமே. மருத்துவ நோயறிதல் அல்ல."
        : "Traditional astrological symbolic correspondence only; not a medical diagnosis."
    },
    rules: {
      baselineConstitution: () => ({
        status: SUB_PHASE_STATUS.SUPPORTED,
        why: isTamil
          ? "மூல ஜாதக லக்னம் மற்றும் 6-ம் பாவக அமைப்பு ஆய்வு செய்யப்பட்டது."
          : "Natal Lagna and 6th-house constitution evaluated.",
        whyNot: []
      }),
      heightenedCautionPeriod: (windows) => {
        const hasCaution = Array.isArray(windows) && windows.some(w => w.confidenceType === 'GUARDED_PERIOD');
        return {
          status: hasCaution ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
          why: hasCaution
            ? (isTamil ? "தசா அல்லது கோச்சாரத்தில் தற்காப்பு கவனம் தேவைப்படும் காலம்." : "Heightened preventive attention indicated by Dasha/transit cycle.")
            : "",
          whyNot: hasCaution ? [] : [isTamil ? "எச்சரிக்கை காலம் கண்டறியப்படவில்லை." : "No heightened caution period active."]
        };
      },
      recoverySupportivePeriod: (windows) => {
        const hasBenefic = Array.isArray(windows) && windows.some(w => w.confidenceType === 'PEAK_CONVERGENCE' || w.confidenceType === 'STRONG_CONVERGENCE');
        return {
          status: hasBenefic ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
          why: hasBenefic
            ? (isTamil ? "சுப கிரக தொடர்பு புத்துணர்ச்சிக்கு ஆதரவளிக்கிறது." : "Benefic planetary alignment supportive of vitality recovery.")
            : "",
          whyNot: hasBenefic ? [] : [isTamil ? "புத்துணர்ச்சி காலம் கண்டறியப்படவில்லை." : "No recovery period established."]
        };
      },
      monitoringPeriod: () => ({
        status: SUB_PHASE_STATUS.SUPPORTED,
        why: isTamil
          ? "வழக்கமான நல்வாழ்வு பராமரிப்பு பரிந்துரைக்கப்படுகிறது."
          : "Routine wellness lifestyle vigilance recommended.",
        whyNot: []
      })
    }
  };

  // 4. Run generic engine
  const domainTiming = runDomainTiming(DOMAIN.WELLNESS, facts, config, lang);

  // 5. Sanitize and validate all text output for medical safety
  try {
    validateHealthOutput(domainTiming);
  } catch (_safetyError) {
    // If any forbidden term slipped in, sanitize it recursively
    sanitizeObjectStrings(domainTiming);
  }

  return domainTiming;
}

function sanitizeObjectStrings(obj) {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      obj[key] = sanitizeHealthText(obj[key]).sanitized;
    } else if (typeof obj[key] === 'object') {
      sanitizeObjectStrings(obj[key]);
    }
  }
}
