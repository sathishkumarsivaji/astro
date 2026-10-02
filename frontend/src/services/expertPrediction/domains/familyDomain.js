/**
 * @file familyDomain.js
 * Expert Mode Domain Adapter for Family.
 */

import { DOMAIN, SUB_PHASE_STATUS } from '../expertPredictionSchema.js';
import { extractCanonicalFacts } from '../canonicalFactAdapter.js';
import { runDomainTiming } from '../domainTimingEngine.js';

/**
 * Calculates family domain expert prediction
 * @param {Object} chartData - Raw chart data from the engine
 * @param {string} lang - Language code ('en' or 'ta')
 * @returns {Object} Domain analysis result complying with expertPredictionSchema
 */
export function calculateFamilyExpert(chartData, lang) {
    const isTamil = lang === 'ta';
    const facts = extractCanonicalFacts(chartData, lang);

    const config = {
        domain: DOMAIN.FAMILY,
        varga: 'D12', // Dwadasamsa (Parents)
        houses: [2, 4, 9],
        karakas: ['Moon', 'Sun', 'Jupiter', 'Venus'],
        subPhases: [
            'familyResponsibility',
            'parentalSupport',
            'residenceTransition',
            'majorFamilyEvent'
        ],
        rules: {
            familyResponsibility: (ctx) => {
                // familyResponsibility needs 2nd house activation
                if (ctx.activeHouses.includes(2)) {
                    return { status: SUB_PHASE_STATUS.SUPPORTED, why: '2nd house activation indicates taking on family responsibilities.', whyNot: [] };
                }
                return { status: SUB_PHASE_STATUS.NOT_ESTABLISHED, why: '', whyNot: ['2nd house is not prominently active.'] };
            },
            parentalSupport: (ctx) => {
                // parentalSupport needs 4th (mother) / 9th (father) activation
                const has4th = ctx.activeHouses.includes(4);
                const has9th = ctx.activeHouses.includes(9);
                
                if (has4th || has9th) {
                    return { status: SUB_PHASE_STATUS.SUPPORTED, why: 'Activation of 4th or 9th house indicates focus on parental matters.', whyNot: [] };
                }
                return { status: SUB_PHASE_STATUS.NOT_ESTABLISHED, why: '', whyNot: ['Neither 4th nor 9th houses are strongly active.'] };
            },
            residenceTransition: (ctx) => {
                if (ctx.activeHouses.includes(4) && ctx.activePlanets.includes('Mars')) {
                    return { status: SUB_PHASE_STATUS.SUPPORTED, why: '4th house with Mars indicates changes to residence or property.', whyNot: [] };
                }
                return { status: SUB_PHASE_STATUS.NOT_ESTABLISHED, why: '', whyNot: ['Lacks indicators for residential changes.'] };
            },
            majorFamilyEvent: (ctx) => {
                if (ctx.activeHouses.includes(2) && ctx.activePlanets.includes('Jupiter')) {
                    return { status: SUB_PHASE_STATUS.SUPPORTED, why: 'Jupiter influencing 2nd house points to auspicious family events.', whyNot: [] };
                }
                return { status: SUB_PHASE_STATUS.NOT_ESTABLISHED, why: '', whyNot: ['No major auspicious indicators active.'] };
            }
        }
    };

    const domainTiming = runDomainTiming(facts, config, isTamil);
    return domainTiming;
}
