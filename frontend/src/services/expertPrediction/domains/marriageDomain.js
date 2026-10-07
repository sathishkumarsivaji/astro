import { DOMAIN, SUB_PHASE_STATUS } from '../expertPredictionSchema.js';
import { extractCanonicalFacts } from '../canonicalFactAdapter.js';
import { runDomainTiming } from '../domainTimingEngine.js';
import { calculateMarriageTimingEvents } from '../../astroEngine.js';

/**
 * Calculates Marriage domain timing in the Expert Prediction framework.
 * Wraps the legacy marriage engine and maps to precise expert sub-phases.
 * 
 * @param {Object} chartData Canonical chart data
 * @param {String} lang Language ('ta' or 'en')
 * @returns {Object} Expert domain prediction output for Marriage
 */
export function calculateMarriageExpert(chartData, lang) {
  const isTamil = lang === 'ta';
  const facts = extractCanonicalFacts(chartData);
  const domain = DOMAIN.MARRIAGE;
  
  // Call legacy engine first
  const legacyTiming = calculateMarriageTimingEvents ? calculateMarriageTimingEvents(chartData, isTamil) : [];

  const h2Lord = facts.houseLords?.[2];
  const h7Lord = facts.houseLords?.[7];

  const domainConfig = {
    domain,
    relevantHouses: [1, 2, 7, 11],
    karakas: ['Venus', 'Jupiter'],
    varga: 'D9',
    rules: {
      natalPromise: {
        ruleId: 'marriage_natal_promise',
        evaluate: ({ context, canonicalFacts }) => {
          const h7Status = canonicalFacts?.houses?.[6];
          const hasPromise = Boolean(h7Lord) && (!canonicalFacts?.afflictions?.combustLords?.includes(h7Lord));
          return {
            status: hasPromise ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: hasPromise
              ? (isTamil ? 'ஜாதகத்தில் 7-ம் பாவ அமைப்பு மற்றும் சுக்கிரன் நிலை திருமண வாய்ப்பை சுட்டிக்காட்டுகிறது.' : 'Natal 7th house disposition and Venus signify relationship promise.')
              : '',
            whyNot: hasPromise ? [] : [isTamil ? '7-ம் பாவகத்தில் கடுமையான பலவீனம் காணப்படுகிறது.' : '7th house or its lord exhibits notable affliction.']
          };
        }
      },
      engagementWindow: {
        ruleId: 'marriage_engagement_window',
        evaluate: ({ context }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const has2nd = activeHouses.includes(2) || (h2Lord && activePlanets.includes(h2Lord));
          const has7th = activeHouses.includes(7) || (h7Lord && activePlanets.includes(h7Lord));
          const isSupported = has2nd && has7th;
          return {
            status: isSupported ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: isSupported
              ? (isTamil ? '2 மற்றும் 7ஆம் அதிபதிகளின் தொடர்பு நிச்சயதார்த்தத்தை ஆதரிக்கிறது.' : 'Simultaneous connection of 2nd (kutumba) and 7th (kalatra) significators supports engagement.')
              : '',
            whyNot: isSupported ? [] : [isTamil ? '2 மற்றும் 7ஆம் அதிபதிகளின் கூட்டு தொடர்பு இல்லை.' : 'Insufficient convergence between 2nd and 7th house lords for engagement.']
          };
        }
      },
      marriageWindow: {
        ruleId: 'marriage_marriage_window',
        evaluate: ({ context, parentWindow }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const has7th = activeHouses.includes(7) || (h7Lord && activePlanets.includes(h7Lord));
          const hasVenus = activePlanets.includes('Venus');
          const hasVarga = context?.vargaFacts?.some(v => v.varga === 'D9' && v.isActivated);
          const isSupported = (has7th || hasVenus) && (parentWindow?.strength >= 0.5 || hasVarga);
          return {
            status: isSupported ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: isSupported
              ? (isTamil ? '7-ம் பாவ இயக்கம் மற்றும் நவாம்ச ஒருங்கிணைவு திருமணத்திற்கு சாதகமான நேரத்தை குறிக்கிறது.' : 'Strong 7th house activation, Venus significator, and Navamsha (D9) alignment define marriage window.')
              : '',
            whyNot: isSupported ? [] : [isTamil ? 'திருமணத்திற்கான ஒருங்கிணைவு முழுமை பெறவில்லை.' : 'Convergence on 7th house or Venus remains below activation threshold.']
          };
        }
      },
      delayIndicators: {
        ruleId: 'marriage_delay_indicators',
        evaluate: ({ canonicalFacts, context }) => {
          const activePlanets = context?.activePlanets || [];
          const saturnInfluence = activePlanets.includes('Saturn') || canonicalFacts?.afflictions?.h7?.includes?.('Saturn');
          const rahuInfluence = activePlanets.includes('Rahu') || canonicalFacts?.afflictions?.h7?.includes?.('Rahu');
          const isDelayed = Boolean(saturnInfluence || rahuInfluence);
          return {
            status: isDelayed ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: isDelayed
              ? (isTamil ? 'சனி அல்லது ராகுவின் தாக்கம் திருமணத்தில் காலதாமதத்தை அல்லது முதிர்வை குறிக்கிறது.' : 'Saturn/Rahu influence on 7th house or significators indicates traditional maturation or timing delay.')
              : '',
            whyNot: isDelayed ? [] : [isTamil ? 'குறிப்பிடத்தக்க தாமத காரணிகள் இல்லை.' : 'No major Saturnian or nodal delay factors identified.']
          };
        }
      }
    },
    legacyTiming
  };

  return runDomainTiming(domain, facts, domainConfig, isTamil);
}
