/**
 * ASTROVERSE — Cross-Domain Caution & Risk Engine
 * ===============================================
 * Aggregates caution windows across all domains without duplication.
 * Identifies high-friction periods, Maraka lord operations,
 * and Sade Sati / Ashtama Shani transits.
 */

import { DOMAIN, SUB_PHASE_STATUS } from '../expertPredictionSchema.js';
import { extractCanonicalFacts } from '../canonicalFactAdapter.js';
import { runDomainTiming } from '../domainTimingEngine.js';

export function calculateCautionExpert(chartData, lang = 'en', otherDomainResults = {}) {
  const isTamil = lang === 'ta';
  const facts = extractCanonicalFacts(chartData);

  // Collect caution windows already identified across other domains to avoid re-duplication
  const existingCautionWindows = [];
  if (otherDomainResults && typeof otherDomainResults === 'object') {
    for (const [domKey, domRes] of Object.entries(otherDomainResults)) {
      if (Array.isArray(domRes.cautionWindows)) {
        domRes.cautionWindows.forEach(cw => {
          existingCautionWindows.push({
            ...cw,
            sourceDomain: domKey
          });
        });
      }
    }
  }

  const config = {
    domain: DOMAIN.CAUTION,
    domainLabel: "Caution & Risk Periods",
    domainLabelTamil: "எச்சரிக்கை & ஆபத்து காலங்கள்",
    houses: [6, 8, 12],
    karakas: ['Saturn', 'Mars', 'Rahu', 'Ketu', 'Sun'],
    varga: 'D30',
    existingWindows: existingCautionWindows,
    subPhases: [
      'generalCaution',
      'healthCaution',
      'financialCaution',
      'relationshipCaution',
      'travelCaution'
    ],
    rules: {
      generalCaution: (windows) => {
        const hasCaution = Array.isArray(windows) && windows.length > 0;
        return {
          status: hasCaution ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
          why: hasCaution
            ? (isTamil ? "பாரம்பரிய தசா-கோச்சார எச்சரிக்கை காலங்கள் கண்டறியப்பட்டுள்ளன." : "Traditional Dasha/transit caution period identified.")
            : "",
          whyNot: hasCaution ? [] : [isTamil ? "பொதுவான எச்சரிக்கை காலம் இல்லை." : "No heightened general caution window active."]
        };
      },
      healthCaution: () => ({
        status: otherDomainResults[DOMAIN.WELLNESS]?.cautionWindows?.length > 0
          ? SUB_PHASE_STATUS.SUPPORTED
          : SUB_PHASE_STATUS.NOT_ESTABLISHED,
        why: isTamil
          ? "ஆரோக்கிய களத்தில் தற்காப்பு கவனம் தேவைப்படும் காலம் சுட்டிக்காட்டப்பட்டுள்ளது."
          : "Preventive attention period active as detailed in Wellness analysis.",
        whyNot: []
      }),
      financialCaution: () => ({
        status: otherDomainResults[DOMAIN.FINANCE]?.cautionWindows?.length > 0
          ? SUB_PHASE_STATUS.SUPPORTED
          : SUB_PHASE_STATUS.NOT_ESTABLISHED,
        why: isTamil ? "நிதி களத்தில் எச்சரிக்கை காலம் உள்ளது." : "Financial vigilance window active in Finance analysis.",
        whyNot: []
      }),
      relationshipCaution: () => ({
        status: otherDomainResults[DOMAIN.MARRIAGE]?.cautionWindows?.length > 0
          ? SUB_PHASE_STATUS.SUPPORTED
          : SUB_PHASE_STATUS.NOT_ESTABLISHED,
        why: isTamil ? "திருமண களத்தில் சமரசம் தேவைப்படும் காலம்." : "Guarded relationship period active in Marriage analysis.",
        whyNot: []
      }),
      travelCaution: () => ({
        status: otherDomainResults[DOMAIN.FOREIGN_TRAVEL]?.cautionWindows?.length > 0
          ? SUB_PHASE_STATUS.SUPPORTED
          : SUB_PHASE_STATUS.NOT_ESTABLISHED,
        why: isTamil ? "பயணங்களில் கூடுதல் கவனம் தேவை." : "Travel vigilance period active in Foreign Travel analysis.",
        whyNot: []
      })
    }
  };

  return runDomainTiming(DOMAIN.CAUTION, facts, config, lang);
}
