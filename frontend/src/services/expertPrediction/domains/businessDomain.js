import { DOMAIN, SUB_PHASE_STATUS } from '../expertPredictionSchema.js';
import { extractCanonicalFacts } from '../canonicalFactAdapter.js';
import { runDomainTiming } from '../domainTimingEngine.js';

/**
 * Calculates Business domain timing in the Expert Prediction framework.
 * 
 * @param {Object} chartData Canonical chart data
 * @param {String} lang Language ('ta' or 'en')
 * @returns {Object} Expert domain prediction output for Business
 */
export function calculateBusinessExpert(chartData, lang) {
  const isTamil = lang === 'ta';
  const facts = extractCanonicalFacts(chartData);
  const domain = DOMAIN.BUSINESS;

  const houseLords = facts.houseLords || {};
  const h3Lord = houseLords[3];
  const h7Lord = houseLords[7];
  const h9Lord = houseLords[9];
  const h10Lord = houseLords[10];
  const h11Lord = houseLords[11];
  const h2Lord = houseLords[2];
  const h8Lord = houseLords[8];
  const h12Lord = houseLords[12];

  const domainConfig = {
    domain,
    relevantHouses: [2, 3, 5, 7, 9, 10, 11],
    karakas: ['Mercury', 'Jupiter', 'Venus', 'Saturn', 'Mars'],
    varga: 'D10',
    rules: {
      startup: {
        ruleId: 'business_startup',
        evaluate: ({ context }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const isStartup = (activeHouses.includes(3) || (h3Lord && activePlanets.includes(h3Lord))) && activePlanets.includes('Mercury');
          return {
            status: isStartup ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: isStartup ? (isTamil ? '3-ம் பாவக துணிவு மற்றும் புதன் காரகத்துவம் புதிய தொழில் தொடங்குவதை ஆதரிக்கிறது.' : '3rd house initiative and Mercury commercial significations strongly support enterprise startup.') : '',
            whyNot: isStartup ? [] : [isTamil ? '3-ம் பாவகம் மற்றும் புதன் சேர்க்கை அமையவில்லை.' : 'Lacks 3rd house initiative and Mercury commercial synergy.']
          };
        }
      },
      launch: {
        ruleId: 'business_launch',
        evaluate: ({ context }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const isLaunch = (activeHouses.includes(10) || (h10Lord && activePlanets.includes(h10Lord))) && (activePlanets.includes('Sun') || activePlanets.includes('Jupiter'));
          return {
            status: isLaunch ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: isLaunch ? (isTamil ? '10-ம் பாவ இயக்கம் மற்றும் குரு/சூரியன் சுப பார்வை வணிக அறிமுகத்திற்கு சாதகமாக உள்ளது.' : '10th house executive standing with Sun/Jupiter supports public commercial launch.') : '',
            whyNot: isLaunch ? [] : [isTamil ? 'வணிக அறிமுகத்திற்கான 10-ம் பாவ ஒருங்கிணைவு இல்லை.' : 'Lacks 10th house convergence for formal market launch.']
          };
        }
      },
      expansion: {
        ruleId: 'business_expansion',
        evaluate: ({ context }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const isExpansion = (activeHouses.includes(9) || (h9Lord && activePlanets.includes(h9Lord))) && activePlanets.includes('Jupiter');
          return {
            status: isExpansion ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: isExpansion ? (isTamil ? '9-ம் பாவ பாக்கிய ஸ்தானம் மற்றும் குரு தொழில் விரிவாக்கத்திற்கு துணைபுரிகிறது.' : '9th house fortune and Jupiter expansion karaka signify commercial scaling.') : '',
            whyNot: isExpansion ? [] : [isTamil ? 'விரிவாக்கத்திற்கான குரு-9ம் பாவ யோகம் இல்லை.' : 'Lacks 9th house and Jupiter expansion alignment.']
          };
        }
      },
      partnership: {
        ruleId: 'business_partnership',
        evaluate: ({ context }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const isPartnership = activeHouses.includes(7) || (h7Lord && activePlanets.includes(h7Lord));
          return {
            status: isPartnership ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: isPartnership ? (isTamil ? '7-ம் பாவக தொடர்பு வணிக கூட்டாண்மைக்கு வழிகோலுகிறது.' : '7th house commercial partnership activation indicates joint venture alliances.') : '',
            whyNot: isPartnership ? [] : [isTamil ? 'கூட்டுத்தொழிலுக்கான 7-ம் பாவ தொடர்பு இல்லை.' : '7th house partnership axis not actively triggered.']
          };
        }
      },
      majorContract: {
        ruleId: 'business_major_contract',
        evaluate: ({ context }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const has10or11 = activeHouses.includes(10) || activeHouses.includes(11);
          const hasComm = activePlanets.includes('Mercury') || activePlanets.includes('Jupiter');
          const isContract = has10or11 && hasComm;
          return {
            status: isContract ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: isContract ? (isTamil ? '10/11-ம் பாவகம் மற்றும் புதன் முக்கிய வணிக ஒப்பந்தங்களுக்கு வழிவகுக்கிறது.' : '10th/11th houses with Mercury commercial agility support signing major contracts.') : '',
            whyNot: isContract ? [] : [isTamil ? 'ஒப்பந்தத்திற்கான ஒருங்கிணைவு அமையவில்லை.' : 'Lacks commercial contract convergence indicators.']
          };
        }
      },
      capitalInvestment: {
        ruleId: 'business_capital_investment',
        evaluate: ({ context }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const isCap = (activeHouses.includes(2) || activeHouses.includes(5) || activeHouses.includes(11)) && (activePlanets.includes('Jupiter') || activePlanets.includes('Mars'));
          return {
            status: isCap ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: isCap ? (isTamil ? '2/11-ம் பாவகங்கள் மற்றும் குரு முதலீடுகளை ஈர்க்க சாதகமாக உள்ளன.' : 'Wealth houses (2nd/11th) with Jupiter signify capital allocation and investment inflows.') : '',
            whyNot: isCap ? [] : [isTamil ? 'முதலீட்டிற்கான நிதி பாவக ஒருங்கிணைவு இல்லை.' : 'Lacks investment capital alignment.']
          };
        }
      },
      revenueGrowth: {
        ruleId: 'business_revenue_growth',
        evaluate: ({ context }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const has2nd = activeHouses.includes(2) || (h2Lord && activePlanets.includes(h2Lord));
          const has11th = activeHouses.includes(11) || (h11Lord && activePlanets.includes(h11Lord));
          const isGrowth = has2nd && has11th;
          return {
            status: isGrowth ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: isGrowth ? (isTamil ? '2 மற்றும் 11-ம் பாவகங்களின் இணைப்பு வலுவான வருவாய் வளர்ச்சியை சுட்டிக்காட்டுகிறது.' : 'Direct connection of 2nd (dhana) and 11th (labha) indicates robust revenue acceleration.') : '',
            whyNot: isGrowth ? [] : [isTamil ? '2 மற்றும் 11-ம் பாவ கூட்டு வருவாய் யோகம் இல்லை.' : 'Lacks dual wealth-house confluence for revenue surge.']
          };
        }
      },
      cashFlowPressure: {
        ruleId: 'business_cash_flow_pressure',
        evaluate: ({ context }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const hasTrik = activeHouses.includes(8) || activeHouses.includes(12);
          const hasMalefic = activePlanets.includes('Saturn') || activePlanets.includes('Rahu') || activePlanets.includes('Mars');
          const isPressure = hasTrik && hasMalefic;
          return {
            status: isPressure ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: isPressure ? (isTamil ? '8/12-ம் பாவகம் மற்றும் அசுப கிரகங்கள் பணப்புழக்கத்தில் தற்காலிக நெருக்கடியை குறிக்கின்றன.' : '8th/12th house activation by malefic transits indicates liquidity constraints and cash-flow caution.') : '',
            whyNot: isPressure ? [] : [isTamil ? 'பணப்புழக்க நெருக்கடி காரணிகள் இல்லை.' : 'No major liquidity stress indicators active.']
          };
        }
      },
      restructuring: {
        ruleId: 'business_restructuring',
        evaluate: ({ context }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const isRestructure = (activeHouses.includes(8) || activeHouses.includes(10)) && (activePlanets.includes('Saturn') || activePlanets.includes('Rahu'));
          return {
            status: isRestructure ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: isRestructure ? (isTamil ? '8-ம் பாவ மாற்றம் மற்றும் சனியின் தாக்கம் நிறுவன மறுசீரமைப்பை உருவாக்குகிறது.' : '8th house transformation combined with Saturn/Rahu triggers organizational restructuring.') : '',
            whyNot: isRestructure ? [] : [isTamil ? 'மறுசீரமைப்பு தேவைகள் காணப்படவில்லை.' : 'No structural realignment indicators active.']
          };
        }
      }
    },
    legacyTiming: []
  };

  const result = runDomainTiming(domain, facts, domainConfig, isTamil);
  result.statutoryNotice = {
    en: "COMMERCIAL ADVISORY NOTICE: Astrological indications represent symbolic traditional tendencies and cyclical archetypes. They do NOT constitute business, investment, financial, or legal counsel. Consult professional advisors for commercial decisions.",
    ta: "வணிக ஆலோசனை அறிவிப்பு: ஜோதிட குறிப்புகள் பாரம்பரிய போக்குகளை மட்டுமே குறிக்கின்றன. இது தொழில் அல்லது முதலீட்டு ஆலோசனை அல்ல."
  };
  return result;
}
