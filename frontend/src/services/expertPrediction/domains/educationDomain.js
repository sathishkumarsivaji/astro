/**
 * @file educationDomain.js
 * Expert Mode Domain Adapter for Education.
 * Integrates existing education timing from astroEngine into the Expert Mode schema.
 */

import { DOMAIN, SUB_PHASE_STATUS } from '../expertPredictionSchema.js';
import { extractCanonicalFacts } from '../canonicalFactAdapter.js';
import { runDomainTiming } from '../domainTimingEngine.js';
import { calculateEducationTimingEvents } from '../../astroEngine.js';

/**
 * Calculates education domain expert prediction
 * @param {Object} chartData - Raw chart data from the engine
 * @param {string} lang - Language code ('en' or 'ta')
 * @returns {Object} Domain analysis result complying with expertPredictionSchema
 */
export function calculateEducationExpert(chartData, lang) {
    const isTamil = lang === 'ta';
    const facts = extractCanonicalFacts(chartData, lang);

    // Base config for education domain
    const config = {
        domain: DOMAIN.EDUCATION,
        varga: 'D24', // Siddhamsa
        houses: [4, 5, 9],
        karakas: ['Mercury', 'Jupiter'],
        subPhases: [
            'studyPeriod',
            'learningAcceleration',
            'examSupport',
            'competitiveExamSupport',
            'higherEducation',
            'admissionPeriod',
            'completionPeriod'
        ],
        rules: {
            studyPeriod: (ctx) => {
                const has4th = ctx.activeHouses.includes(4);
                if (has4th) return { status: SUB_PHASE_STATUS.SUPPORTED, why: '4th house of foundational education is active.', whyNot: [] };
                return { status: SUB_PHASE_STATUS.NOT_ESTABLISHED, why: '', whyNot: ['4th house not highly active.'] };
            },
            learningAcceleration: (ctx) => {
                const hasMerc = ctx.activePlanets.includes('Mercury');
                if (hasMerc) return { status: SUB_PHASE_STATUS.SUPPORTED, why: 'Mercury (karaka for learning) is prominently active.', whyNot: [] };
                return { status: SUB_PHASE_STATUS.NOT_ESTABLISHED, why: '', whyNot: ['Mercury is not the primary active lord.'] };
            },
            examSupport: (ctx) => {
                const has5th = ctx.activeHouses.includes(5);
                if (has5th) return { status: SUB_PHASE_STATUS.SUPPORTED, why: 'Stronger calculated indicators for examination performance via 5th house.', whyNot: [] };
                return { status: SUB_PHASE_STATUS.NOT_ESTABLISHED, why: '', whyNot: ['5th house of academic performance is not strongly activated.'] };
            },
            competitiveExamSupport: (ctx) => {
                const has6th = ctx.activeHouses.includes(6);
                if (has6th && ctx.activePlanets.includes('Mars')) return { status: SUB_PHASE_STATUS.SUPPORTED, why: '6th house and Mars indicate competitive success.', whyNot: [] };
                return { status: SUB_PHASE_STATUS.NOT_ESTABLISHED, why: '', whyNot: ['Lack of competitive indicators (6th house).'] };
            },
            higherEducation: (ctx) => {
                const has9th = ctx.activeHouses.includes(9);
                if (has9th) return { status: SUB_PHASE_STATUS.SUPPORTED, why: '9th house indicates higher studies.', whyNot: [] };
                return { status: SUB_PHASE_STATUS.NOT_ESTABLISHED, why: '', whyNot: ['9th house is not heavily active.'] };
            },
            admissionPeriod: (ctx) => {
                if (ctx.activeHouses.includes(4) && ctx.activeHouses.includes(9)) {
                    return { status: SUB_PHASE_STATUS.SUPPORTED, why: 'Activation of education houses supports admission processes.', whyNot: [] };
                }
                return { status: SUB_PHASE_STATUS.NOT_ESTABLISHED, why: '', whyNot: ['Insufficient convergence for admissions.'] };
            },
            completionPeriod: (ctx) => {
                if (ctx.activeHouses.includes(4) && ctx.activePlanets.includes('Jupiter')) {
                    return { status: SUB_PHASE_STATUS.SUPPORTED, why: 'Jupiter provides completion and fruition in studies.', whyNot: [] };
                }
                return { status: SUB_PHASE_STATUS.NOT_ESTABLISHED, why: '', whyNot: ['Missing completion indicators.'] };
            }
        }
    };

    // Retrieve existing legacy events if available to enrich
    const existingEvents = calculateEducationTimingEvents ? calculateEducationTimingEvents(chartData, lang) : [];
    config.legacyTiming = existingEvents;

    // Use engine to get domain timing
    const domainTiming = runDomainTiming(facts, config, isTamil);
    return domainTiming;
}
