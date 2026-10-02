/**
 * ASTROVERSE — Legal & Litigation Domain Adapter
 * ==============================================
 * Analyzes legal disputes, arbitration, litigation pressure,
 * and favorable resolution windows via 6th, 7th, 8th, and 12th houses.
 */

import { DOMAIN, SUB_PHASE_STATUS } from '../expertPredictionSchema.js';
import { extractCanonicalFacts } from '../canonicalFactAdapter.js';
import { runDomainTiming } from '../domainTimingEngine.js';

export function calculateLegalExpert(chartData, lang = 'en') {
  const isTamil = lang === 'ta';
  const facts = extractCanonicalFacts(chartData);

  const config = {
    domain: DOMAIN.LEGAL,
    domainLabel: "Legal & Litigation",
    domainLabelTamil: "சட்டம் & வழக்கு",
    houses: [6, 7, 8, 12],
    karakas: ['Mars', 'Saturn', 'Jupiter', 'Rahu'],
    varga: 'D30',
    subPhases: [
      'legalChallengeWindow',
      'resolutionWindow',
      'litigationPressure',
      'favorableOutcomeWindow'
    ],
    rules: {
      legalChallengeWindow: (windows, facts) => {
        const h6Lord = facts.houseLords?.[6];
        const isAfflicted = ['Mars', 'Rahu', 'Saturn'].includes(h6Lord);
        return {
          status: isAfflicted ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
          why: isAfflicted
            ? (isTamil ? "6-ம் அதிபதியுடன் செவ்வாய்/ராகு தொடர்பு சட்ட சவால்களை குறிக்கிறது." : "6th house connection with Mars/Rahu indicates active legal challenge period.")
            : "",
          whyNot: isAfflicted ? [] : [isTamil ? "சட்ட சவால் குறிப்புகள் இல்லை." : "No strong indicators for legal challenges."]
        };
      },
      litigationPressure: (windows, facts) => {
        const h8Lord = facts.houseLords?.[8];
        const hasPressure = ['Saturn', 'Rahu'].includes(h8Lord);
        return {
          status: hasPressure ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
          why: hasPressure
            ? (isTamil ? "8-ம் அதிபதி தொடர்பு நீதிமன்ற அழுத்தத்தை குறிக்கிறது." : "8th house influence indicates litigation delays or administrative pressure.")
            : "",
          whyNot: hasPressure ? [] : [isTamil ? "நீதிமன்ற அழுத்தம் குறைவாக உள்ளது." : "No sustained litigation pressure detected."]
        };
      },
      favorableOutcomeWindow: (windows, facts) => {
        const jupiter = facts.planets?.find(p => p.name === 'Jupiter');
        const isFavorable = jupiter && [1, 5, 9, 10, 11].includes(jupiter.house);
        return {
          status: isFavorable ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
          why: isFavorable
            ? (isTamil ? "குருவின் சுப பார்வை வழக்குகளில் சாதகமான முடிவுக்கு வழிவகுக்கும்." : "Jupiter benefic alignment supports favorable outcome or settlement.")
            : "",
          whyNot: isFavorable ? [] : [isTamil ? "சாதகமான முடிவுக்கான குறிப்பிட்ட நேரம் இல்லை." : "No explicit favorable outcome window isolated."]
        };
      },
      resolutionWindow: (windows) => {
        const hasWindow = Array.isArray(windows) && windows.length > 0;
        return {
          status: hasWindow ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
          why: hasWindow
            ? (isTamil ? "தசா சுழற்சி மூலம் வழக்கு தீர்வுக்கான நேரம் கண்டறியப்பட்டுள்ளது." : "Dasha timeline establishes a potential resolution window.")
            : "",
          whyNot: hasWindow ? [] : [isTamil ? "தீர்வு காலம் இன்னும் நிறுவப்படவில்லை." : "Resolution window not firmly established."]
        };
      }
    }
  };

  return runDomainTiming(DOMAIN.LEGAL, facts, config, lang);
}
