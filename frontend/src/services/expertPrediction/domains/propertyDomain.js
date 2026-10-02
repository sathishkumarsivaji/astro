import { DOMAIN, SUB_PHASE_STATUS } from '../expertPredictionSchema.js';
import { extractCanonicalFacts } from '../canonicalFactAdapter.js';
import { runDomainTiming } from '../domainTimingEngine.js';
import { calculatePropertyTimingEvents } from '../../astroEngine.js';

/**
 * Calculates Property domain timing in the Expert Prediction framework.
 * 
 * @param {Object} chartData Canonical chart data
 * @param {String} lang Language ('ta' or 'en')
 * @returns {Object} Expert domain prediction output for Property
 */
export function calculatePropertyExpert(chartData, lang) {
  const isTamil = lang === 'ta';
  const facts = extractCanonicalFacts(chartData);
  const domain = DOMAIN.PROPERTY;
  
  // Call legacy engine first
  const legacyTiming = calculatePropertyTimingEvents ? calculatePropertyTimingEvents(chartData, isTamil) : [];

  const h3Lord = facts.houseLords?.[3];
  const h4Lord = facts.houseLords?.[4];
  const h11Lord = facts.houseLords?.[11];

  const domainConfig = {
    domain,
    relevantHouses: [2, 4, 8, 11, 12],
    karakas: ['Mars', 'Venus', 'Moon', 'Saturn'],
    varga: 'D4',
    rules: {
      searchNegotiation: {
        ruleId: 'property_search_negotiation',
        evaluate: ({ context }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const searchNeg = activePlanets.includes('Mercury') || activeHouses.includes(3) || (h3Lord && activePlanets.includes(h3Lord));
          return {
            status: searchNeg ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: searchNeg ? (isTamil ? 'புதன் மற்றும் 3-ம் பாவ தொடர்பு தேடல் மற்றும் பேச்சுவார்த்தைக்கு சாதகமாக உள்ளது.' : 'Mercury or 3rd house activation indicates active search, documents, and negotiations.') : '',
            whyNot: searchNeg ? [] : [isTamil ? '3-ம் பாவக தொடர்பு குறைவாக உள்ளது.' : 'Lacks 3rd house or Mercury activation for negotiation phase.']
          };
        }
      },
      purchaseContract: {
        ruleId: 'property_purchase_contract',
        evaluate: ({ context }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const has4th = activeHouses.includes(4) || (h4Lord && activePlanets.includes(h4Lord));
          const has11th = activeHouses.includes(11) || (h11Lord && activePlanets.includes(h11Lord));
          const purchaseCont = has4th && has11th;
          return {
            status: purchaseCont ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: purchaseCont ? (isTamil ? '4 மற்றும் 11-ம் பாவக ஒருங்கிணைவு சொத்து வாங்கும் ஒப்பந்தத்திற்கு சாதகமாக உள்ளது.' : 'Simultaneous 4th house and 11th house activation supports purchase contracts.') : '',
            whyNot: purchaseCont ? [] : [isTamil ? '4 மற்றும் 11-ம் பாவக கூட்டு தொடர்பு இல்லை.' : 'Lacks simultaneous 4th and 11th house convergence for contract finalization.']
          };
        }
      },
      registration: {
        ruleId: 'property_registration',
        evaluate: ({ context }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const has4th = activeHouses.includes(4) || (h4Lord && activePlanets.includes(h4Lord));
          const hasMercury = activePlanets.includes('Mercury');
          const regSupported = has4th && hasMercury;
          return {
            status: regSupported ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: regSupported ? (isTamil ? 'புதன் மற்றும் 4-ம் பாவ அமைப்பு பத்திர பதிவுக்கு உகந்த காலம்.' : 'Mercury (deed/documentation) and 4th house alignment strongly supports legal property registration.') : '',
            whyNot: regSupported ? [] : [isTamil ? 'பத்திர பதிவிற்கான புதன் தொடர்பு இல்லை.' : 'Lacks Mercury and 4th house convergence for formal title registration.']
          };
        }
      },
      possessionConstruction: {
        ruleId: 'property_possession_construction',
        evaluate: ({ context }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const has4th = activeHouses.includes(4) || (h4Lord && activePlanets.includes(h4Lord));
          const hasMoon = activePlanets.includes('Moon');
          const possSupported = has4th && (hasMoon || activePlanets.includes('Mars'));
          return {
            status: possSupported ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: possSupported ? (isTamil ? '4-ம் பாவகம் மற்றும் சந்திரன்/செவ்வாய் அமைப்பு கட்டுமானம் அல்லது குடியேற உகந்தது.' : '4th house coupled with Moon (domestic dwelling) or Mars (bhumi) supports construction or taking possession.') : '',
            whyNot: possSupported ? [] : [isTamil ? 'குடியேறும் அல்லது கட்டுமான கிரக நிலைகள் இல்லை.' : 'Lacks 4th house domestic convergence for immediate possession.']
          };
        }
      },
      renovation: {
        ruleId: 'property_renovation',
        evaluate: ({ context }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const has4th = activeHouses.includes(4) || (h4Lord && activePlanets.includes(h4Lord));
          const hasMars = activePlanets.includes('Mars');
          const renovSupported = has4th && hasMars;
          return {
            status: renovSupported ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: renovSupported ? (isTamil ? 'செவ்வாய் மற்றும் 4-ம் பாவ இயக்கம் கட்டமைப்பு புனரமைப்புக்கு ஏற்றது.' : 'Mars structural engineering influence on 4th house supports renovation or remodeling.') : '',
            whyNot: renovSupported ? [] : [isTamil ? 'புதுப்பித்தல் கிரக நிலைகள் அமையவில்லை.' : 'Lacks Mars and 4th house structural modification signature.']
          };
        }
      }
    },
    legacyTiming
  };

  return runDomainTiming(domain, facts, domainConfig, isTamil);
}
