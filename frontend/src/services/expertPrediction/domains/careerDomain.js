import { DOMAIN, SUB_PHASE_STATUS } from '../expertPredictionSchema.js';
import { extractCanonicalFacts } from '../canonicalFactAdapter.js';
import { runDomainTiming } from '../domainTimingEngine.js';
import { calculateCareerTimingEvents } from '../../astroEngine.js';

/**
 * Calculates Career domain timing in the Expert Prediction framework.
 * 
 * @param {Object} chartData Canonical chart data
 * @param {String} lang Language ('ta' or 'en')
 * @returns {Object} Expert domain prediction output for Career
 */
export function calculateCareerExpert(chartData, lang) {
  const isTamil = lang === 'ta';
  const facts = extractCanonicalFacts(chartData);
  const domain = DOMAIN.CAREER;
  
  const legacyTiming = calculateCareerTimingEvents ? calculateCareerTimingEvents(chartData, isTamil) : [];

  const h10Lord = facts.houseLords?.[10];
  const h11Lord = facts.houseLords?.[11];
  const h6Lord = facts.houseLords?.[6];

  const domainConfig = {
    domain,
    relevantHouses: [2, 6, 10, 11],
    karakas: ['Sun', 'Saturn', 'Mercury', 'Jupiter'],
    varga: 'D10',
    rules: {
      foundationPhase: {
        ruleId: 'career_foundation_phase',
        evaluate: ({ context }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const has10th = activeHouses.includes(10) || (h10Lord && activePlanets.includes(h10Lord));
          const hasMercury = activePlanets.includes('Mercury');
          const isFoundation = has10th && (hasMercury || activeHouses.includes(1) || activeHouses.includes(2));
          return {
            status: isFoundation ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: isFoundation ? (isTamil ? 'தொழில் அடித்தளம் அமைக்கும் தசா மற்றும் பாவக அமைப்பு செயல்படுகிறது.' : '10th house connection with foundational skills significators active.') : '',
            whyNot: isFoundation ? [] : [isTamil ? 'அடித்தள அமைப்பிற்கான தொடர்புகள் இல்லை.' : 'Foundational career initiation indicators not dominant.']
          };
        }
      },
      accelerationPhase: {
        ruleId: 'career_acceleration_phase',
        evaluate: ({ context }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const has10th = activeHouses.includes(10) || (h10Lord && activePlanets.includes(h10Lord));
          const hasJupiter = activePlanets.includes('Jupiter');
          const isAccel = has10th && hasJupiter;
          return {
            status: isAccel ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: isAccel ? (isTamil ? '10-ம் அதிபதியுடன் குருவின் சுப தொடர்பு விரைவான தொழில் முன்னேற்றத்தை உருவாக்குகிறது.' : '10th house convergence with Jupiter transit/dasha provides marked career acceleration.') : '',
            whyNot: isAccel ? [] : [isTamil ? '10-ம் அதிபதியுடன் குருவின் ஒருங்கிணைவு இல்லை.' : 'Lacks simultaneous 10th house and Jupiter acceleration synergy.']
          };
        }
      },
      authorityPhase: {
        ruleId: 'career_authority_phase',
        evaluate: ({ context }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const has10th = activeHouses.includes(10) || (h10Lord && activePlanets.includes(h10Lord));
          const hasSun = activePlanets.includes('Sun');
          const isAuth = hasSun && (has10th || activeHouses.includes(9));
          return {
            status: isAuth ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: isAuth ? (isTamil ? 'சூரியனின் வலுவான தாக்கம் மற்றும் 10-ம் பாவ இயக்கம் அதிகாரம் மற்றும் பதவி உயர்வை அளிக்கிறது.' : 'Sun authority karaka alignment with 10th/9th house signifies professional leadership and executive standing.') : '',
            whyNot: isAuth ? [] : [isTamil ? 'அதிகாரத்திற்கான சூரியன்-10ம் பாவ இணைப்பு இல்லை.' : 'Lacks Sun and 10th house executive authority alignment.']
          };
        }
      },
      peakPhase: {
        ruleId: 'career_peak_phase',
        evaluate: ({ context, parentWindow }) => {
          const hasD10 = context?.vargaFacts?.some(v => v.varga === 'D10' && v.isActivated);
          const hasTransits = (context?.transitFacts || []).length > 0;
          const isPeak = Boolean(parentWindow && parentWindow.strength >= 0.7 && (hasD10 || hasTransits));
          return {
            status: isPeak ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: isPeak ? (isTamil ? 'தசா, கோச்சாரம் மற்றும் தசாம்சம் (D10) இணைந்த உச்ச நிலை தொழில் காலம்.' : 'Peak career convergence supported by Dasha, major transit triggers, and Dashamsha (D10) confirmation.') : '',
            whyNot: isPeak ? [] : [isTamil ? 'முழுமையான உச்சநிலை ஒருங்கிணைவு அமையவில்லை.' : 'Convergence does not meet multi-tier peak threshold across D10 and transits.']
          };
        }
      },
      consolidationPhase: {
        ruleId: 'career_consolidation_phase',
        evaluate: ({ context }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const hasSaturn = activePlanets.includes('Saturn');
          const has10th = activeHouses.includes(10) || (h10Lord && activePlanets.includes(h10Lord));
          const isConsolidation = hasSaturn && (has10th || activeHouses.includes(11));
          return {
            status: isConsolidation ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: isConsolidation ? (isTamil ? 'சனியின் கர்ம காரகத்துவம் பொறுப்புகளை நிலைநிறுத்தி நீண்டகால ஸ்திரத்தன்மையை தருகிறது.' : 'Saturn influence on 10th/11th houses establishes enduring institutional consolidation and responsibility.') : '',
            whyNot: isConsolidation ? [] : [isTamil ? 'ஸ்திரத்தன்மைக்கான சனி தொடர்பு இல்லை.' : 'Saturnian consolidation and maturity signature not active.']
          };
        }
      }
    },
    legacyTiming
  };

  return runDomainTiming(domain, facts, domainConfig, isTamil);
}
