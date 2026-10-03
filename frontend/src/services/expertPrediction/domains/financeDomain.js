/**
 * @file financeDomain.js
 * Expert Mode Domain Adapter for Finance.
 */

import { DOMAIN, SUB_PHASE_STATUS } from '../expertPredictionSchema.js';
import { extractCanonicalFacts } from '../canonicalFactAdapter.js';
import { runDomainTiming } from '../domainTimingEngine.js';

/**
 * Calculates finance domain expert prediction
 * @param {Object} chartData - Raw chart data from the engine
 * @param {string} lang - Language code ('en' or 'ta')
 * @returns {Object} Domain analysis result complying with expertPredictionSchema
 */
export function calculateFinanceExpert(chartData, lang) {
    const isTamil = lang === 'ta';
    const facts = extractCanonicalFacts(chartData, lang);

    // Base config for finance domain
    const config = {
        domain: DOMAIN.FINANCE,
        varga: 'D2', // Hora
        houses: [2, 5, 8, 9, 11],
        karakas: ['Jupiter', 'Venus', 'Mercury', 'Saturn'],
        subPhases: [
            'incomeGrowth',
            'savingsAccumulation',
            'financialOpportunity',
            'investmentSupport',
            'debtPressure',
            'recoveryPeriod',
            'assetAccumulation'
        ],
        rules: {
            incomeGrowth: (ctx) => {
                // needs 2nd + 11th + benefic dasha
                const has2nd = ctx.activeHouses.includes(2);
                const has11th = ctx.activeHouses.includes(11);
                const hasBenefic = ['Jupiter', 'Venus', 'Mercury', 'Moon'].some(p => ctx.activePlanets.includes(p));
                
                if (has2nd && has11th && hasBenefic) {
                    return { status: SUB_PHASE_STATUS.SUPPORTED, why: 'Strong connection between 2nd (wealth) and 11th (gains) under benefic influence.', whyNot: [] };
                }
                return { status: SUB_PHASE_STATUS.NOT_ESTABLISHED, why: '', whyNot: ['Requires combined activation of 2nd and 11th houses with benefics.'] };
            },
            savingsAccumulation: (ctx) => {
                if (ctx.activeHouses.includes(2)) return { status: SUB_PHASE_STATUS.SUPPORTED, why: '2nd house activation supports savings.', whyNot: [] };
                return { status: SUB_PHASE_STATUS.NOT_ESTABLISHED, why: '', whyNot: ['2nd house is not active.'] };
            },
            financialOpportunity: (ctx) => {
                if (ctx.activeHouses.includes(9) || ctx.activeHouses.includes(11)) {
                    return { status: SUB_PHASE_STATUS.SUPPORTED, why: 'Favorable activation of 9th or 11th houses provides opportunities.', whyNot: [] };
                }
                return { status: SUB_PHASE_STATUS.NOT_ESTABLISHED, why: '', whyNot: ['No strong indicators for sudden opportunities.'] };
            },
            investmentSupport: (ctx) => {
                // needs 5th + Mercury/Jupiter
                const has5th = ctx.activeHouses.includes(5);
                const hasMercJup = ctx.activePlanets.includes('Mercury') || ctx.activePlanets.includes('Jupiter');
                
                if (has5th && hasMercJup) {
                    return { status: SUB_PHASE_STATUS.SUPPORTED, why: '5th house activation combined with Mercury/Jupiter supports calculated investments.', whyNot: [] };
                }
                return { status: SUB_PHASE_STATUS.NOT_ESTABLISHED, why: '', whyNot: ['Requires 5th house and Mercury or Jupiter activation.'] };
            },
            debtPressure: (ctx) => {
                // caution: 8th/12th + Saturn/Rahu
                const has8thOr12th = ctx.activeHouses.includes(8) || ctx.activeHouses.includes(12);
                const hasSatRahu = ctx.activePlanets.includes('Saturn') || ctx.activePlanets.includes('Rahu');
                
                if (has8thOr12th && hasSatRahu) {
                    return { status: SUB_PHASE_STATUS.SUPPORTED, why: 'Activation of 8th/12th houses with malefic influence indicates caution regarding debts and expenses.', whyNot: [] };
                }
                return { status: SUB_PHASE_STATUS.NOT_ESTABLISHED, why: '', whyNot: ['No strong debt-pressure indicators active.'] };
            },
            recoveryPeriod: (ctx) => {
                if (ctx.activeHouses.includes(11) && ctx.activePlanets.includes('Jupiter')) {
                    return { status: SUB_PHASE_STATUS.SUPPORTED, why: 'Jupiter influencing gains supports recovery from financial strain.', whyNot: [] };
                }
                return { status: SUB_PHASE_STATUS.NOT_ESTABLISHED, why: '', whyNot: ['Recovery indicators are currently weak.'] };
            },
            assetAccumulation: (ctx) => {
                if (ctx.activeHouses.includes(4) && ctx.activeHouses.includes(2)) {
                    return { status: SUB_PHASE_STATUS.SUPPORTED, why: 'Connection of 2nd and 4th houses supports tangible asset growth.', whyNot: [] };
                }
                return { status: SUB_PHASE_STATUS.NOT_ESTABLISHED, why: '', whyNot: ['Asset building houses (2, 4) lack combined activation.'] };
            }
        }
    };

    const domainTiming = runDomainTiming(facts, config, isTamil);
    domainTiming.statutoryNotice = {
        en: "FINANCIAL ADVISORY NOTICE: Astrological indications represent symbolic traditional tendencies and cyclical archetypes. They do NOT constitute financial, investment, accounting, or tax advice. Always consult a licensed financial advisor.",
        ta: "நிதி ஆலோசனை அறிவிப்பு: ஜோதிட குறிப்புகள் பாரம்பரிய போக்குகளை மட்டுமே குறிக்கின்றன. இது முதலீட்டு அல்லது நிதி ஆலோசனை அல்ல."
    };
    return domainTiming;
}
