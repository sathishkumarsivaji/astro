/**
 * @file childrenDomain.js
 * Expert Mode Domain Adapter for Children/Progeny.
 * Integrates existing progeny timing from astroEngine into the Expert Mode schema.
 */

import { DOMAIN, SUB_PHASE_STATUS } from '../expertPredictionSchema.js';
import { extractCanonicalFacts } from '../canonicalFactAdapter.js';
import { runDomainTiming } from '../domainTimingEngine.js';
import { calculateProgenyTimingEvents } from '../../astroEngine.js';

/**
 * Calculates children/progeny domain expert prediction
 * @param {Object} chartData - Raw chart data from the engine
 * @param {string} lang - Language code ('en' or 'ta')
 * @returns {Object} Domain analysis result complying with expertPredictionSchema
 */
export function calculateChildrenExpert(chartData, lang) {
    const isTamil = lang === 'ta';
    const facts = extractCanonicalFacts(chartData, lang);

    // Base config for progeny domain
    const config = {
        domain: DOMAIN.CHILDREN,
        varga: 'D7', // Saptamsa
        houses: [2, 5, 11],
        karakas: ['Jupiter'],
        subPhases: [
            'familyExpansion',
            'progenyTiming',
            'childMilestones'
        ],
        rules: {
            familyExpansion: (ctx) => {
                const has2nd = ctx.activeHouses.includes(2);
                if (has2nd) return { status: SUB_PHASE_STATUS.SUPPORTED, why: '2nd house activation indicates family expansion.', whyNot: [] };
                return { status: SUB_PHASE_STATUS.NOT_ESTABLISHED, why: '', whyNot: ['2nd house is not prominently active.'] };
            },
            progenyTiming: (ctx) => {
                const has5th = ctx.activeHouses.includes(5);
                const hasJupiter = ctx.activePlanets.includes('Jupiter');
                
                if (has5th || hasJupiter) {
                    return { 
                        status: SUB_PHASE_STATUS.SUPPORTED, 
                        why: 'Traditional progeny timing indicator via 5th house or Jupiter.', 
                        whyNot: [] 
                    };
                }
                return { 
                    status: SUB_PHASE_STATUS.NOT_ESTABLISHED, 
                    why: '', 
                    whyNot: ['Primary traditional indicators (5th house, Jupiter) are inactive.'] 
                };
            },
            childMilestones: (ctx) => {
                const has11th = ctx.activeHouses.includes(11);
                if (has11th) {
                    return { status: SUB_PHASE_STATUS.SUPPORTED, why: '11th house (gains/fulfillment) supports child-related milestones.', whyNot: [] };
                }
                return { status: SUB_PHASE_STATUS.NOT_ESTABLISHED, why: '', whyNot: ['11th house is not strongly active.'] };
            }
        }
    };

    // Retrieve existing legacy events if available to enrich
    const existingEvents = calculateProgenyTimingEvents ? calculateProgenyTimingEvents(chartData, lang) : [];
    config.legacyTiming = existingEvents;

    // Use engine to get domain timing
    const domainTiming = runDomainTiming(facts, config, isTamil);
    return domainTiming;
}
