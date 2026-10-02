/**
 * ASTROVERSE — Major Life Milestones Domain Adapter
 * =================================================
 * Synthesizes monumental life pivot points across Kendra houses (1, 4, 7, 10),
 * Jupiter-Saturn double transits, and karmic crossroads.
 */

import { DOMAIN, SUB_PHASE_STATUS } from '../expertPredictionSchema.js';
import { extractCanonicalFacts } from '../canonicalFactAdapter.js';
import { runDomainTiming } from '../domainTimingEngine.js';

export function calculateMilestoneExpert(chartData, lang = 'en', otherDomainResults = {}) {
  const isTamil = lang === 'ta';
  const facts = extractCanonicalFacts(chartData);

  const config = {
    domain: DOMAIN.MILESTONES,
    domainLabel: "Major Life Milestones",
    domainLabelTamil: "முக்கிய வாழ்க்கை மைல்கற்கள்",
    houses: [1, 4, 7, 10],
    karakas: ['Jupiter', 'Saturn', 'Sun', 'Moon'],
    relevantVargas: ['D9', 'D10'],
    subPhases: [
      'majorTransition',
      'lifeDirectionShift',
      'karmaResolution',
      'destinyActivation'
    ],
    rules: {
      majorTransition: (windows) => {
        const hasMajor = Array.isArray(windows) && windows.some(w => w.confidenceType === 'PEAK_CONVERGENCE');
        return {
          status: hasMajor ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
          why: hasMajor
            ? (isTamil ? "கேந்திர பாவகங்களின் ஒருங்கிணைவு முக்கிய வாழ்க்கை மாற்றத்தை குறிக்கிறது." : "Kendra house convergence triggers a pivotal life transition.")
            : "",
          whyNot: hasMajor ? [] : [isTamil ? "முக்கிய திருப்புமுனை காலம் நிறுவப்படவில்லை." : "No peak transition window currently isolated."]
        };
      },
      lifeDirectionShift: (windows) => {
        const hasShift = Array.isArray(windows) && windows.length > 0;
        return {
          status: hasShift ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
          why: hasShift
            ? (isTamil ? "தசா அதிபதி மாற்றம் வாழ்க்கை பாதையில் புதிய திசையை உருவாக்குகிறது." : "Major dasha transitions mark a shift in life direction.")
            : "",
          whyNot: hasShift ? [] : [isTamil ? "திசை மாற்றம் நிறுவப்படவில்லை." : "No shift period active."]
        };
      },
      karmaResolution: (windows) => {
        const hasRes = Array.isArray(windows) && windows.length > 0;
        return {
          status: hasRes ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
          why: hasRes
            ? (isTamil ? "முக்கிய கர்ம வினைகளின் நிறைவு காலம்." : "Karmic completion and maturation cycle active.")
            : "",
          whyNot: []
        };
      },
      destinyActivation: (windows) => {
        const hasDestiny = Array.isArray(windows) && windows.some(w => w.confidenceType === 'PEAK_CONVERGENCE' || w.confidenceType === 'STRONG_CONVERGENCE');
        return {
          status: hasDestiny ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
          why: hasDestiny
            ? (isTamil ? "விதி மற்றும் தர்மத்தை செயல்படுத்துவதற்கான உச்ச ஒருங்கிணைவு." : "Peak alignment activating core karmic dharma.")
            : "",
          whyNot: hasDestiny ? [] : [isTamil ? "விதி இயக்கம் நிறுவப்படவில்லை." : "No destiny activation window isolated."]
        };
      }
    }
  };

  return runDomainTiming(DOMAIN.MILESTONES, facts, config, lang);
}
