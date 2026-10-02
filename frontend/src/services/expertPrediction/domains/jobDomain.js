import { DOMAIN, SUB_PHASE_STATUS } from '../expertPredictionSchema.js';
import { extractCanonicalFacts } from '../canonicalFactAdapter.js';
import { runDomainTiming } from '../domainTimingEngine.js';

/**
 * Calculates Job domain timing in the Expert Prediction framework.
 * Focuses on employment specifics as distinct from general career.
 * 
 * @param {Object} chartData Canonical chart data
 * @param {String} lang Language ('ta' or 'en')
 * @returns {Object} Expert domain prediction output for Job
 */
export function calculateJobExpert(chartData, lang) {
  const isTamil = lang === 'ta';
  const facts = extractCanonicalFacts(chartData);
  const domain = DOMAIN.JOB;

  const houseLords = facts.houseLords || {};
  const h2Lord = houseLords[2];
  const h3Lord = houseLords[3];
  const h4Lord = houseLords[4];
  const h6Lord = houseLords[6];
  const h9Lord = houseLords[9];
  const h10Lord = houseLords[10];
  const h11Lord = houseLords[11];

  const domainConfig = {
    domain,
    relevantHouses: [2, 6, 10, 11],
    karakas: ['Saturn', 'Sun', 'Mercury', 'Jupiter'],
    varga: 'D10',
    rules: {
      jobSearch: {
        ruleId: 'job_search',
        evaluate: ({ context }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const isJobSearch = (activeHouses.includes(6) || (h6Lord && activePlanets.includes(h6Lord))) && (activePlanets.includes('Mercury') || activePlanets.includes('Saturn'));
          return {
            status: isJobSearch ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: isJobSearch ? (isTamil ? '6-ம் பாவ சேவை ஸ்தானம் மற்றும் புதன்/சனி தொடர்பு வேலை தேடலுக்கு சாதகமாக உள்ளது.' : '6th house (service) with Mercury/Saturn triggers active job applications and recruitment.') : '',
            whyNot: isJobSearch ? [] : [isTamil ? 'வேலை தேடலுக்கான 6-ம் பாவ தொடர்பு இல்லை.' : 'Lacks 6th house service activation and Mercury/Saturn agility.']
          };
        }
      },
      interviewSelection: {
        ruleId: 'job_interview_selection',
        evaluate: ({ context }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const isInterview = activeHouses.includes(10) || (h10Lord && activePlanets.includes(h10Lord));
          return {
            status: isInterview ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: isInterview ? (isTamil ? '10-ம் பாவ இயக்கம் நேர்காணல் வெற்றி மற்றும் வேலை தேர்வுக்கு சாதகமாக உள்ளது.' : '10th house status activation supports successful interview performance and candidate selection.') : '',
            whyNot: isInterview ? [] : [isTamil ? 'நேர்காணல் தேர்வுக்கான 10-ம் பாவ தொடர்பு இல்லை.' : '10th house authority axis is not actively activated.']
          };
        }
      },
      joining: {
        ruleId: 'job_joining',
        evaluate: ({ context }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const isJoining = (activeHouses.includes(10) || (h10Lord && activePlanets.includes(h10Lord))) && (activeHouses.includes(6) || (h6Lord && activePlanets.includes(h6Lord)));
          return {
            status: isJoining ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: isJoining ? (isTamil ? '10 மற்றும் 6-ம் பாவக ஒருங்கிணைவு புதிய பணியில் சேருவதை ஆதரிக்கிறது.' : 'Dual activation of 10th (status) and 6th (service) supports onboarding and job joining.') : '',
            whyNot: isJoining ? [] : [isTamil ? 'பணியில் சேருவதற்கான கூட்டு பாவக தொடர்பு இல்லை.' : 'Lacks combined 10th and 6th house convergence for job induction.']
          };
        }
      },
      promotion: {
        ruleId: 'job_promotion',
        evaluate: ({ context }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const isPromotion = activePlanets.includes('Sun') && (activeHouses.includes(10) || (h10Lord && activePlanets.includes(h10Lord))) && activePlanets.includes('Jupiter');
          return {
            status: isPromotion ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: isPromotion ? (isTamil ? 'சூரியன், 10-ம் பாவகம் மற்றும் குருவின் பார்வை பதவி உயர்வை அளிக்கிறது.' : 'Sun authority karaka with 10th house and Jupiter benefic aspect directly supports promotion.') : '',
            whyNot: isPromotion ? [] : [isTamil ? 'பதவி உயர்வுக்கான சூரியன்-குரு-10ம் பாவ யோகம் இல்லை.' : 'Lacks Sun, 10th house, and Jupiter promotion triad.']
          };
        }
      },
      roleChange: {
        ruleId: 'job_role_change',
        evaluate: ({ context }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const isRoleChange = (activeHouses.includes(10) || (h10Lord && activePlanets.includes(h10Lord))) && (activePlanets.includes('Mercury') || activePlanets.includes('Mars'));
          return {
            status: isRoleChange ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: isRoleChange ? (isTamil ? 'புதன் அல்லது செவ்வாயுடன் 10-ம் பாவ தொடர்பு பொறுப்பு/பணி மாற்றத்தை தருகிறது.' : 'Mercury (functional versatility) or Mars with 10th house indicates lateral role change or title adjustment.') : '',
            whyNot: isRoleChange ? [] : [isTamil ? 'பொறுப்பு மாற்றத்திற்கான கிரக நிலைகள் இல்லை.' : 'Lacks functional modification indicators for role pivot.']
          };
        }
      },
      salaryGrowth: {
        ruleId: 'job_salary_growth',
        evaluate: ({ context }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const has2nd = activeHouses.includes(2) || (h2Lord && activePlanets.includes(h2Lord));
          const has11th = activeHouses.includes(11) || (h11Lord && activePlanets.includes(h11Lord));
          const isGrowth = has2nd && has11th;
          return {
            status: isGrowth ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: isGrowth ? (isTamil ? '2 மற்றும் 11-ம் பாவக தொடர்பு சம்பள உயர்வை உறுதி செய்கிறது.' : 'Convergence on 2nd (earned income) and 11th (gains) supports salary hike or appraisal benefits.') : '',
            whyNot: isGrowth ? [] : [isTamil ? 'சம்பள உயர்வுக்கான 2-11 பாவக தொடர்பு இல்லை.' : 'Lacks wealth houses (2nd/11th) convergence for compensation increase.']
          };
        }
      },
      transfer: {
        ruleId: 'job_transfer',
        evaluate: ({ context }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const isTransfer = (activeHouses.includes(3) || (h3Lord && activePlanets.includes(h3Lord))) || (activeHouses.includes(4) || (h4Lord && activePlanets.includes(h4Lord)));
          return {
            status: isTransfer ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: isTransfer ? (isTamil ? '3 அல்லது 4-ம் பாவ தொடர்பு பணியிட இடமாற்றத்தை குறிக்கிறது.' : '3rd house (movement) or 4th house residence shift indicates job relocation or branch transfer.') : '',
            whyNot: isTransfer ? [] : [isTamil ? 'இடமாற்றத்திற்கான 3/4-ம் பாவ தொடர்பு இல்லை.' : 'Lacks relocation indicators for organizational transfer.']
          };
        }
      },
      jobPressure: {
        ruleId: 'job_pressure',
        evaluate: ({ context, canonicalFacts }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const is6thActive = activeHouses.includes(6) || (h6Lord && activePlanets.includes(h6Lord));
          const hasMalefics = activePlanets.includes('Saturn') || activePlanets.includes('Rahu') || activePlanets.includes('Mars');
          const isPressure = is6thActive && hasMalefics;
          return {
            status: isPressure ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: isPressure ? (isTamil ? '6-ம் பாவகத்தில் அசுப கிரகங்களின் தாக்கம் பணியிட பணிச்சுமையை உருவாக்குகிறது.' : 'Malefic activation on 6th house indicates intense workload, competition, or workplace friction.') : '',
            whyNot: isPressure ? [] : [isTamil ? 'பணியிட பணிச்சுமை அழுத்தங்கள் இல்லை.' : 'No prominent workplace stress or 6th-house friction triggers active.']
          };
        }
      },
      resignationChange: {
        ruleId: 'job_resignation_change',
        evaluate: ({ context }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const isResignation = activeHouses.includes(9) || (h9Lord && activePlanets.includes(h9Lord));
          return {
            status: isResignation ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: isResignation ? (isTamil ? '10-க்கு 12-ம் பாவகமான 9-ம் பாவ தொடர்பு தற்போதைய வேலையிலிருந்து விடைபெற வழிகோலுகிறது.' : '9th house (12th from 10th - relinquishment of current post) supports voluntary job departure or transition.') : '',
            whyNot: isResignation ? [] : [isTamil ? 'பணி விலகலுக்கான 9-ம் பாவ தொடர்பு இல்லை.' : 'Lacks post-relinquishment (9th house) indicators.']
          };
        }
      }
    },
    legacyTiming: [],
    deduplicateWithCareer: true
  };

  return runDomainTiming(domain, facts, domainConfig, isTamil);
}
