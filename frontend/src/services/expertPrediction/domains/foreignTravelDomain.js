/**
 * @file foreignTravelDomain.js
 * Expert Mode Domain Adapter for Foreign Travel.
 */

import { DOMAIN, SUB_PHASE_STATUS } from '../expertPredictionSchema.js';
import { extractCanonicalFacts } from '../canonicalFactAdapter.js';
import { runDomainTiming } from '../domainTimingEngine.js';

/**
 * Calculates foreign travel domain expert prediction
 * @param {Object} chartData - Raw chart data from the engine
 * @param {string} lang - Language code ('en' or 'ta')
 * @returns {Object} Domain analysis result complying with expertPredictionSchema
 */
export function calculateForeignTravelExpert(chartData, lang) {
    const isTamil = lang === 'ta';
    const facts = extractCanonicalFacts(chartData, lang);

    // Analyze basic chart layout for 4th lord
    const ascSign = facts.ascendant.sign;
    // ... logic to find 4th lord would normally go here if not provided by canonical facts
    // We will use canonical facts assuming it has house lord mapping or we can abstract it

    const config = {
        domain: DOMAIN.FOREIGN_TRAVEL,
        varga: 'D12', // Dwadasamsa
        houses: [3, 4, 9, 12],
        karakas: ['Rahu', 'Moon', 'Saturn'],
        subPhases: [
            'travelWindow',
            'longDistanceTravel',
            'foreignTravel',
            'relocation',
            'permanentResidence',
            'returnHome'
        ],
        rules: {
            travelWindow: (ctx) => {
                if (ctx.activeHouses.includes(3) || ctx.activeHouses.includes(9)) {
                    return { status: SUB_PHASE_STATUS.SUPPORTED, why: 'Activation of travel houses (3rd/9th).', whyNot: [] };
                }
                return { status: SUB_PHASE_STATUS.NOT_ESTABLISHED, why: '', whyNot: ['Primary travel houses inactive.'] };
            },
            longDistanceTravel: (ctx) => {
                if (ctx.activeHouses.includes(9)) {
                    return { status: SUB_PHASE_STATUS.SUPPORTED, why: '9th house supports long distance journeys.', whyNot: [] };
                }
                return { status: SUB_PHASE_STATUS.NOT_ESTABLISHED, why: '', whyNot: ['9th house is not heavily active.'] };
            },
            foreignTravel: (ctx) => {
                // foreignTravel needs Rahu/9th/12th convergence
                const has9th = ctx.activeHouses.includes(9);
                const has12th = ctx.activeHouses.includes(12);
                const hasRahu = ctx.activePlanets.includes('Rahu');
                
                if (hasRahu && (has9th || has12th)) {
                    return { status: SUB_PHASE_STATUS.SUPPORTED, why: 'Convergence of Rahu with 9th/12th houses strongly indicates foreign travel.', whyNot: [] };
                }
                return { status: SUB_PHASE_STATUS.NOT_ESTABLISHED, why: '', whyNot: ['Lacks combination of Rahu with 9th or 12th houses.'] };
            },
            relocation: (ctx) => {
                // relocation needs 4th lord + 12th activation
                // Approximation: if 4th and 12th are activated
                const has4th = ctx.activeHouses.includes(4);
                const has12th = ctx.activeHouses.includes(12);
                
                if (has4th && has12th) {
                    return { status: SUB_PHASE_STATUS.SUPPORTED, why: 'Activation of 4th (home) and 12th (foreign) supports relocation.', whyNot: [] };
                }
                return { status: SUB_PHASE_STATUS.NOT_ESTABLISHED, why: '', whyNot: ['Requires simultaneous activation of 4th and 12th houses.'] };
            },
            permanentResidence: (ctx) => {
                // SUPPORTED only if 4th lord in 12th AND Rahu aspects 4th
                // In context of timing, we look for 4th and 12th strongly connected to Rahu
                const has4th = ctx.activeHouses.includes(4);
                const has12th = ctx.activeHouses.includes(12);
                const hasRahu = ctx.activePlanets.includes('Rahu');
                
                if (has4th && has12th && hasRahu) {
                    return { status: SUB_PHASE_STATUS.SUPPORTED, why: 'Strong connection between 4th, 12th, and Rahu indicating permanent settlement potential.', whyNot: [] };
                }
                return { status: SUB_PHASE_STATUS.NOT_ESTABLISHED, why: '', whyNot: ['Strict conditions (4th/12th + Rahu) for permanent residence are not met.'] };
            },
            returnHome: (ctx) => {
                if (ctx.activeHouses.includes(2) || ctx.activeHouses.includes(4)) {
                    if (ctx.activePlanets.includes('Jupiter') || ctx.activePlanets.includes('Venus')) {
                        return { status: SUB_PHASE_STATUS.SUPPORTED, why: 'Benefic influence on 2nd/4th houses indicates return to origins.', whyNot: [] };
                    }
                }
                return { status: SUB_PHASE_STATUS.NOT_ESTABLISHED, why: '', whyNot: ['No strong indicators for return home.'] };
            }
        }
    };

    const domainTiming = runDomainTiming(facts, config, isTamil);
    return domainTiming;
}
