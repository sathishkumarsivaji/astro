import { DOMAIN, SUB_PHASE_STATUS } from '../expertPredictionSchema.js';
import { extractCanonicalFacts } from '../canonicalFactAdapter.js';
import { runDomainTiming } from '../domainTimingEngine.js';

/**
 * Calculates Vehicle domain timing in the Expert Prediction framework.
 * 
 * @param {Object} chartData Canonical chart data
 * @param {String} lang Language ('ta' or 'en')
 * @returns {Object} Expert domain prediction output for Vehicle
 */
export function calculateVehicleExpert(chartData, lang) {
  const isTamil = lang === 'ta';
  const facts = extractCanonicalFacts(chartData);
  const domain = DOMAIN.VEHICLE;

  const h4Lord = facts.houseLords?.[4];
  const h11Lord = facts.houseLords?.[11];

  const domainConfig = {
    domain,
    relevantHouses: [2, 4, 11],
    karakas: ['Venus', 'Mars', 'Mercury', 'Moon'],
    varga: 'D4',
    rules: {
      newVehicle: {
        ruleId: 'vehicle_new_vehicle',
        evaluate: ({ context }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const hasVenus = activePlanets.includes('Venus');
          const has4th = activeHouses.includes(4) || (h4Lord && activePlanets.includes(h4Lord));
          const primarySupported = hasVenus && has4th;
          return {
            status: primarySupported ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: primarySupported ? (isTamil ? 'சுக்கிரன் மற்றும் 4-ம் பாவ இயக்கம் புதிய வாகனம் வாங்குவதற்கு மிகுந்த யோகத்தை அளிக்கிறது.' : 'Venus vehicle karaka and 4th house alignment strongly favors new vehicle acquisition.') : '',
            whyNot: primarySupported ? [] : [isTamil ? 'சுக்கிரன் மற்றும் 4-ம் பாவக கூட்டு தொடர்பு இல்லை.' : 'Lacks simultaneous Venus and 4th house activation for new vehicle.']
          };
        }
      },
      replacementVehicle: {
        ruleId: 'vehicle_replacement_vehicle',
        evaluate: ({ context }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const has4th = activeHouses.includes(4) || (h4Lord && activePlanets.includes(h4Lord));
          const hasMercury = activePlanets.includes('Mercury');
          const isReplacement = has4th && (hasMercury || activePlanets.includes('Mars'));
          return {
            status: isReplacement ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: isReplacement ? (isTamil ? 'புதன் அல்லது செவ்வாயுடன் 4-ம் பாவ தொடர்பு வாகன பரிமாற்றம்/மாற்றத்தை குறிக்கிறது.' : 'Mercury (trade/exchange) or Mars with 4th house supports vehicle upgrade or replacement.') : '',
            whyNot: isReplacement ? [] : [isTamil ? 'வாகன மாற்றத்திற்கான காரணிகள் இல்லை.' : 'Lacks exchange/replacement planetary indicators.']
          };
        }
      },
      luxuryUpgrade: {
        ruleId: 'vehicle_luxury_upgrade',
        evaluate: ({ context, canonicalFacts }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const hasVenus = activePlanets.includes('Venus');
          const has11th = activeHouses.includes(11) || (h11Lord && activePlanets.includes(h11Lord));
          const venusPlanet = (canonicalFacts?.planets || []).find(p => p.name === 'Venus');
          const isVenusDignified = venusPlanet && (venusPlanet.dignity === 'EXALTED' || venusPlanet.dignity === 'OWN');
          const luxurySupported = hasVenus && has11th && (isVenusDignified || context?.parentWindow?.strength >= 0.7);
          return {
            status: luxurySupported ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: luxurySupported ? (isTamil ? 'வலுவான சுக்கிரன் மற்றும் 11-ம் பாவ லாப அமைப்பு ஆடம்பர வாகனம் வாங்குவதை ஆதரிக்கிறது.' : 'Dignified Venus combined with 11th house fulfillment supports luxury vehicle upgrade.') : '',
            whyNot: luxurySupported ? [] : [isTamil ? 'ஆடம்பர வாகனத்திற்கான சுக்கிரன்-11ம் பாவ யோகம் இல்லை.' : 'Lacks dignified Venus and 11th house luxury convergence.']
          };
        }
      },
      delayCaution: {
        ruleId: 'vehicle_delay_caution',
        evaluate: ({ context, canonicalFacts }) => {
          const activePlanets = context?.activePlanets || [];
          const saturn4th = activePlanets.includes('Saturn') && (context?.activeHouses || []).includes(4);
          const afflictedVenus = canonicalFacts?.afflictedPlanets?.includes('Venus');
          const isDelay = Boolean(saturn4th || afflictedVenus);
          return {
            status: isDelay ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: isDelay ? (isTamil ? '4-ம் பாவத்தில் சனியின் தாக்கம் வாகன முடிவுகளில் பொறுமையை அறிவுறுத்துகிறது.' : 'Saturn influence on 4th house or Venus affliction cautions against hasty vehicle purchases.') : '',
            whyNot: isDelay ? [] : [isTamil ? 'வாகன தாமத காரணிகள் இல்லை.' : 'No major vehicle friction or delay signatures present.']
          };
        }
      }
    },
    legacyTiming: []
  };

  return runDomainTiming(domain, facts, domainConfig, isTamil);
}
