/**
 * @file leadershipDomain.js
 * Expert Mode Domain Adapter for Leadership.
 */

import { DOMAIN, SUB_PHASE_STATUS } from '../expertPredictionSchema.js';
import { extractCanonicalFacts } from '../canonicalFactAdapter.js';
import { runDomainTiming } from '../domainTimingEngine.js';

/**
 * Calculates leadership domain expert prediction
 * @param {Object} chartData - Raw chart data from the engine
 * @param {string} lang - Language code ('en' or 'ta')
 * @returns {Object} Domain analysis result complying with expertPredictionSchema
 */
export function calculateLeadershipExpert(chartData, lang) {
    const isTamil = lang === 'ta';
    const facts = extractCanonicalFacts(chartData, lang);

    const config = {
        domain: DOMAIN.LEADERSHIP,
        varga: 'D10', // Dasamsa
        houses: [5, 9, 10, 11],
        karakas: ['Sun', 'Mars', 'Jupiter', 'Saturn'],
        subPhases: [
            'leadershipOpportunity',
            'recognitionWindow',
            'publicVisibility',
            'institutionalResponsibility',
            'authorityPeriod'
        ],
        rules: {
            leadershipOpportunity: (ctx) => {
                // leadershipOpportunity needs Sun + 10th strong
                const has10th = ctx.activeHouses.includes(10);
                const hasSun = ctx.activePlanets.includes('Sun');
                
                if (has10th && hasSun) {
                    return { status: SUB_PHASE_STATUS.SUPPORTED, why: 'Strong 10th house activation combined with Sun supports leadership.', whyNot: [] };
                }
                return { status: SUB_PHASE_STATUS.NOT_ESTABLISHED, why: '', whyNot: ['Requires combination of 10th house and Sun.'] };
            },
            recognitionWindow: (ctx) => {
                // recognitionWindow needs 11th activation
                if (ctx.activeHouses.includes(11)) {
                    return { status: SUB_PHASE_STATUS.SUPPORTED, why: '11th house activation supports awards and recognition.', whyNot: [] };
                }
                return { status: SUB_PHASE_STATUS.NOT_ESTABLISHED, why: '', whyNot: ['11th house is not strongly active.'] };
            },
            publicVisibility: (ctx) => {
                if (ctx.activeHouses.includes(10) || ctx.activePlanets.includes('Moon')) {
                    return { status: SUB_PHASE_STATUS.SUPPORTED, why: '10th house or Moon activation increases public visibility.', whyNot: [] };
                }
                return { status: SUB_PHASE_STATUS.NOT_ESTABLISHED, why: '', whyNot: ['Visibility indicators are weak.'] };
            },
            institutionalResponsibility: (ctx) => {
                if (ctx.activeHouses.includes(9) && ctx.activePlanets.includes('Jupiter')) {
                    return { status: SUB_PHASE_STATUS.SUPPORTED, why: '9th house and Jupiter support roles in institutions.', whyNot: [] };
                }
                return { status: SUB_PHASE_STATUS.NOT_ESTABLISHED, why: '', whyNot: ['Lacks institutional indicators (9th/Jupiter).'] };
            },
            authorityPeriod: (ctx) => {
                if (ctx.activeHouses.includes(10) && ctx.activePlanets.includes('Saturn')) {
                    return { status: SUB_PHASE_STATUS.SUPPORTED, why: 'Saturn and 10th house bring structured authority and responsibility.', whyNot: [] };
                }
                return { status: SUB_PHASE_STATUS.NOT_ESTABLISHED, why: '', whyNot: ['Saturn is not strongly influencing the 10th house.'] };
            }
        }
    };

    const domainTiming = runDomainTiming(facts, config, isTamil);
    return domainTiming;
}
