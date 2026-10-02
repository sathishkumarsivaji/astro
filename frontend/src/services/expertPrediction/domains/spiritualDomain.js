/**
 * ASTROVERSE — Spiritual & Inner Life Domain Adapter
 * ==================================================
 * Analyzes spiritual awakening, meditation/retreat cycles,
 * devotional deepening, and spiritual teacher/Guru connections.
 */

import { DOMAIN, SUB_PHASE_STATUS } from '../expertPredictionSchema.js';
import { extractCanonicalFacts } from '../canonicalFactAdapter.js';
import { runDomainTiming } from '../domainTimingEngine.js';

export function calculateSpiritualExpert(chartData, lang = 'en') {
  const isTamil = lang === 'ta';
  const facts = extractCanonicalFacts(chartData);

  const h5Lord = facts.houseLords?.[5];
  const h9Lord = facts.houseLords?.[9];
  const h12Lord = facts.houseLords?.[12];

  const config = {
    domain: DOMAIN.SPIRITUAL,
    domainLabel: "Spiritual & Inner Life",
    domainLabelTamil: "ஆன்மீகம் & உள்வாழ்க்கை",
    houses: [5, 9, 12],
    karakas: ['Jupiter', 'Ketu', 'Moon', 'Sun'],
    relevantVargas: ['D9', 'D60'],
    subPhases: [
      'spiritualAwakening',
      'retreatPeriod',
      'devotionalIntensification',
      'teacherConnection'
    ],
    rules: {
      spiritualAwakening: {
        ruleId: 'spiritual_awakening',
        evaluate: ({ context }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const hasMoksha = activeHouses.includes(9) || activeHouses.includes(12);
          const hasSpiritualKaraka = activePlanets.includes('Ketu') || activePlanets.includes('Jupiter');
          const isMokshaActive = hasMoksha && hasSpiritualKaraka;
          return {
            status: isMokshaActive ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: isMokshaActive
              ? (isTamil ? "கேது அல்லது குருவின் 9/12-ம் பாவ தொடர்பு ஆழ்ந்த ஆன்மீக விழிப்புணர்வை குறிக்கிறது." : "Ketu or Jupiter connection with 9th/12th houses indicates spiritual introspection and inner awakening.")
              : "",
            whyNot: isMokshaActive ? [] : [isTamil ? "ஆன்மீக விழிப்புணர்வு காலம் நிறுவப்படவில்லை." : "No explicit awakening trigger isolated."]
          };
        }
      },
      retreatPeriod: {
        ruleId: 'spiritual_retreat_period',
        evaluate: ({ context }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const has12th = activeHouses.includes(12) || (h12Lord && activePlanets.includes(h12Lord));
          const hasSolitude = activePlanets.includes('Ketu') || activePlanets.includes('Saturn');
          const isRetreat = has12th && hasSolitude;
          return {
            status: isRetreat ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: isRetreat
              ? (isTamil ? "12-ம் பாவ இயக்கம் மற்றும் கேது/சனி தாக்கம் தியானம் மற்றும் தனிமை வழிபாட்டிற்கு உகந்தது." : "12th house activation coupled with Ketu/Saturn favors meditation retreats, seclusion, and contemplative silence.")
              : "",
            whyNot: isRetreat ? [] : [isTamil ? "தியான காலம் நிறுவப்படவில்லை." : "Lacks 12th house and solitude significators for retreat window."]
          };
        }
      },
      devotionalIntensification: {
        ruleId: 'spiritual_devotional_intensification',
        evaluate: ({ context }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const has5th = activeHouses.includes(5) || (h5Lord && activePlanets.includes(h5Lord));
          const hasBhaktiKaraka = activePlanets.includes('Jupiter') || activePlanets.includes('Moon');
          const isBhakti = has5th && hasBhaktiKaraka;
          return {
            status: isBhakti ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: isBhakti
              ? (isTamil ? "5-ம் பாவக பூர்வபுண்ணிய தொடர்பு மற்றும் குரு/சந்திரன் பார்வை பக்தி மார்க்கத்தை தீவிரப்படுத்துகிறது." : "5th house Purvapunya connection with Jupiter/Moon deepens devotional discipline and mantra practice.")
              : "",
            whyNot: isBhakti ? [] : [isTamil ? "பக்தி தீவிரப்படுத்தும் காலம் நிறுவப்படவில்லை." : "Lacks 5th house devotion and mantra alignment."]
          };
        }
      },
      teacherConnection: {
        ruleId: 'spiritual_teacher_connection',
        evaluate: ({ context }) => {
          const activePlanets = context?.activePlanets || [];
          const activeHouses = context?.activeHouses || [];
          const has9th = activeHouses.includes(9) || (h9Lord && activePlanets.includes(h9Lord));
          const hasGuru = activePlanets.includes('Jupiter');
          const isGuru = has9th && hasGuru;
          return {
            status: isGuru ? SUB_PHASE_STATUS.SUPPORTED : SUB_PHASE_STATUS.NOT_ESTABLISHED,
            why: isGuru
              ? (isTamil ? "9-ம் அதிபதி மற்றும் குரு பகவானின் ஆதிக்கம் ஆன்மீக வழிகாட்டி/குருவை சந்திக்க ஆதரவளிக்கிறது." : "9th house guru-sthana and Jupiter activation directly supports meeting and connecting with spiritual mentors.")
              : "",
            whyNot: isGuru ? [] : [isTamil ? "குரு தொடர்பு காலம் நிறுவப்படவில்லை." : "Lacks 9th house and Jupiter mentorship convergence."]
          };
        }
      }
    }
  };

  return runDomainTiming(DOMAIN.SPIRITUAL, facts, config, lang);
}
