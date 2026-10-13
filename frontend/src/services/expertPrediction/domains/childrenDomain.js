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

const SIGN_ORDER = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

const SIGN_LORDS = {
    Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
    Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
    Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter'
};

const NATURAL_BENEFICS = new Set(['Jupiter', 'Venus', 'Mercury', 'Moon']);
const NATURAL_MALEFICS = new Set(['Saturn', 'Mars', 'Rahu', 'Ketu', 'Sun']);
const FAVORABLE_HOUSES = new Set([1, 2, 4, 5, 7, 9, 10, 11]);
const DUSTHANA_HOUSES = new Set([6, 8, 12]);

/**
 * Evaluates structured traditional children-domain evidence from chart data.
 * Enforces strict separation between traditional symbolic rules and medical fertility
 * or exact child-count claims.
 *
 * @param {Object} chartOrContext - Raw chart object or Q&A context containing chart
 * @param {Object} [options={}]
 * @returns {Object} Structured traditional children evidence
 */
export function evaluateChildrenTraditionalEvidence(chartOrContext, options = {}) {
    const chart = chartOrContext?.chart || chartOrContext?.chartData || (chartOrContext?.planets ? chartOrContext : null);
    const rawPlanets = Array.isArray(chart?.planets) ? chart.planets : [];

    const missingEvidence = [];
    const supportingRuleResults = [];
    const limitingRuleResults = [];
    const calculatedFacts = [];
    const traditionalRules = [];

    if (!chart) {
        return {
            status: 'INSUFFICIENT_DATA',
            interpretationType: 'TRADITIONAL',
            supportingRuleResults: [],
            limitingRuleResults: [],
            evaluatedRuleResults: [],
            missingEvidence: ['5th_house', '5th_lord', 'Jupiter'],
            fertilityStatus: 'NOT_ASSESSED',
            exactChildCount: null,
            outcomeGuarantee: false,
            calculatedFacts: [],
            traditionalRules: []
        };
    }

    // Resolve Ascendant & 5th house
    const ascObj = chart.ascendant || chart.lagna || null;
    const ascSign = ascObj?.signName || ascObj?.sign || (typeof ascObj === 'string' ? ascObj : null);
    const ascIdx = ascSign ? SIGN_ORDER.indexOf(ascSign) : -1;

    const explicitBhavas = Array.isArray(chart.bhavasDetailed) ? chart.bhavasDetailed : (Array.isArray(chart.houses) ? chart.houses : null);
    const explicitH5 = explicitBhavas ? explicitBhavas.find(b => (b.num || b.house) === 5) : (chart.houseMap ? chart.houseMap[5] : null);
    const explicitHouseListProvidedWithout5 = Boolean(
        (Array.isArray(chart.bhavasDetailed) && chart.bhavasDetailed.length > 0 && !explicitH5) ||
        (Array.isArray(chart.houses) && chart.houses.length > 0 && !explicitH5) ||
        (chart.houseMap && Object.keys(chart.houseMap).length > 0 && !chart.houseMap[5]) ||
        (Array.isArray(chart.missingHouses) && chart.missingHouses.includes(5))
    );

    let fifthSign = explicitH5?.signName || explicitH5?.sign || null;
    if (!fifthSign && ascIdx !== -1 && !explicitHouseListProvidedWithout5) {
        fifthSign = SIGN_ORDER[(ascIdx + 4) % 12];
    }

    if (!fifthSign || explicitHouseListProvidedWithout5) {
        missingEvidence.push('5th_house');
    }

    // Resolve 5th lord
    const fifthLordName = explicitH5?.lordName || explicitH5?.lord || (fifthSign ? SIGN_LORDS[fifthSign] : null);
    const findPlanet = (name) => {
        if (!name) return null;
        return rawPlanets.find(p => (p.name || p.planetName || '').toLowerCase() === name.toLowerCase()) || null;
    };

    const fifthLordPlanet = findPlanet(fifthLordName);
    const hasFifthLordPlacement = Boolean(
        fifthLordPlanet &&
        (fifthLordPlanet.sign || fifthLordPlanet.signName) &&
        (typeof fifthLordPlanet.house === 'number' || typeof fifthLordPlanet.bhava === 'number' || ascIdx !== -1)
    );

    if (!fifthLordName || !hasFifthLordPlacement) {
        missingEvidence.push('5th_lord');
    }

    // Resolve Jupiter (Putra Karaka)
    const jupiterPlanet = findPlanet('Jupiter');
    const hasJupiterPlacement = Boolean(
        jupiterPlanet &&
        (jupiterPlanet.sign || jupiterPlanet.signName) &&
        (typeof jupiterPlanet.house === 'number' || typeof jupiterPlanet.bhava === 'number' || ascIdx !== -1)
    );

    if (!hasJupiterPlacement) {
        missingEvidence.push('Jupiter');
    }

    if (missingEvidence.length > 0) {
        return {
            status: 'INSUFFICIENT_DATA',
            interpretationType: 'TRADITIONAL',
            supportingRuleResults: [],
            limitingRuleResults: [],
            evaluatedRuleResults: [],
            missingEvidence,
            fertilityStatus: 'NOT_ASSESSED',
            exactChildCount: null,
            outcomeGuarantee: false,
            calculatedFacts: [],
            traditionalRules: []
        };
    }

    const resolvePlanetHouse = (p) => {
        if (!p) return null;
        if (typeof p.house === 'number') return p.house;
        if (typeof p.bhava === 'number') return p.bhava;
        const pSign = p.sign || p.signName;
        if (pSign && ascIdx !== -1) {
            const pIdx = SIGN_ORDER.indexOf(pSign);
            if (pIdx !== -1) return ((pIdx - ascIdx + 12) % 12) + 1;
        }
        return null;
    };

    const fifthLordSign = fifthLordPlanet.sign || fifthLordPlanet.signName;
    const fifthLordHouse = resolvePlanetHouse(fifthLordPlanet);
    const fifthLordDignity = fifthLordPlanet.dignity || null;

    const jupiterSign = jupiterPlanet.sign || jupiterPlanet.signName;
    const jupiterHouse = resolvePlanetHouse(jupiterPlanet);
    const jupiterDignity = jupiterPlanet.dignity || null;

    const fifthOccupants = rawPlanets
        .filter(p => resolvePlanetHouse(p) === 5)
        .map(p => p.name || p.planetName)
        .filter(Boolean);

    // Record canonical calculated facts (strictly non-interpretive)
    calculatedFacts.push({
        id: 'HOUSE_FACT_H5',
        factor: 'House_5',
        sign: fifthSign,
        lord: fifthLordName,
        occupants: fifthOccupants
    });
    calculatedFacts.push({
        id: `LORD_FACT_5TH_${fifthLordName.toUpperCase()}`,
        factor: '5th_Lord',
        planet: fifthLordName,
        sign: fifthLordSign,
        house: fifthLordHouse,
        dignity: fifthLordDignity
    });
    calculatedFacts.push({
        id: 'PLANET_FACT_JUPITER_KARAKA',
        factor: 'Jupiter',
        sign: jupiterSign,
        house: jupiterHouse,
        dignity: jupiterDignity
    });

    // Rule 1: 5th House (Putra Bhava) Occupants & Disposition
    const beneficOccupants = fifthOccupants.filter(name => NATURAL_BENEFICS.has(name));
    const maleficOccupants = fifthOccupants.filter(name => NATURAL_MALEFICS.has(name));

    if (beneficOccupants.length > 0) {
        const rule1 = {
            ruleId: 'CHILDREN_RULE_5TH_HOUSE_BENEFIC_OCCUPANCY',
            factor: '5th_House',
            shastra: 'Brihat Parashara Hora Shastra (Putra Bhava Adhyaya)',
            status: 'SUPPORTING',
            summaryEn: `5th house (${fifthSign}) is occupied by natural benefic(s): ${beneficOccupants.join(', ')}.`,
            summaryTa: `5-ம் புத்திர பாவகத்தில் (${fifthSign}) சுப கிரகம் (${beneficOccupants.join(', ')}) அமர்ந்துள்ளது.`
        };
        supportingRuleResults.push(rule1);
        traditionalRules.push({
            id: rule1.ruleId,
            ruleName: 'Putra Bhava Benefic Association',
            shastra: rule1.shastra,
            condition: 'Natural benefic occupying 5th house',
            traditionalInterpretation: rule1.summaryEn
        });
    } else if (fifthOccupants.length === 0) {
        const rule1Unoccupied = {
            ruleId: 'CHILDREN_RULE_5TH_HOUSE_UNOCCUPIED_CUSP',
            factor: '5th_House',
            shastra: 'Brihat Parashara Hora Shastra (Putra Bhava Adhyaya)',
            status: 'SUPPORTING',
            summaryEn: `5th house (${fifthSign}) is free of direct malefic occupancy and governed by ${fifthLordName}.`,
            summaryTa: `5-ம் புத்திர பாவகம் (${fifthSign}) நேரடி அசுப கிரக ஆக்கிரமிப்பின்றி ${fifthLordName} ஆதிக்கத்தில் உள்ளது.`
        };
        supportingRuleResults.push(rule1Unoccupied);
        traditionalRules.push({
            id: rule1Unoccupied.ruleId,
            ruleName: 'Putra Bhava Unafflicted Cusp',
            shastra: rule1Unoccupied.shastra,
            condition: '5th house unoccupied by malefics',
            traditionalInterpretation: rule1Unoccupied.summaryEn
        });
    }

    if (maleficOccupants.length > 0) {
        const rule1Lim = {
            ruleId: 'CHILDREN_RULE_5TH_HOUSE_MALEFIC_OCCUPANCY',
            factor: '5th_House',
            shastra: 'Phaladeepika (Chapter 12)',
            status: 'LIMITING',
            summaryEn: `5th house (${fifthSign}) has traditional malefic occupancy (${maleficOccupants.join(', ')}), which classical texts associate with patience or delay in family matters (symbolic only, not a medical finding).`,
            summaryTa: `5-ம் பாவகத்தில் (${fifthSign}) ${maleficOccupants.join(', ')} அமர்ந்துள்ளது; இது பாரம்பரிய ரீதியாக பொறுமை அல்லது காலதாமதத்தைக் குறிக்கும் குறியீடாகும் (மருத்துவ முடிவு அல்ல).`
        };
        limitingRuleResults.push(rule1Lim);
        traditionalRules.push({
            id: rule1Lim.ruleId,
            ruleName: 'Putra Bhava Malefic Caution',
            shastra: rule1Lim.shastra,
            condition: 'Malefic occupying 5th house',
            traditionalInterpretation: rule1Lim.summaryEn
        });
    }

    // Rule 2: 5th Lord Placement & Dignity
    const is5thLordDebilitated = /debil|neecha/i.test(fifthLordDignity || '');
    const is5thLordDusthana = DUSTHANA_HOUSES.has(fifthLordHouse);

    if (FAVORABLE_HOUSES.has(fifthLordHouse) && !is5thLordDebilitated) {
        const rule2 = {
            ruleId: 'CHILDREN_RULE_5TH_LORD_FAVORABLE_HOUSE',
            factor: '5th_Lord',
            shastra: 'Brihat Parashara Hora Shastra (Ch. 16)',
            status: 'SUPPORTING',
            summaryEn: `5th lord ${fifthLordName} is placed in House ${fifthLordHouse} (${fifthLordSign})${fifthLordDignity ? ` with ${fifthLordDignity} dignity` : ''}, supporting traditional 5th-house signification.`,
            summaryTa: `5-ம் அதிபதி ${fifthLordName}, ${fifthLordHouse}-ம் பாவகத்தில் (${fifthLordSign}) அமைந்து பாரம்பரிய புத்திர பாவக பலத்தை அளிக்கிறார்.`
        };
        supportingRuleResults.push(rule2);
        traditionalRules.push({
            id: rule2.ruleId,
            ruleName: 'Pancama-Adhipati Kendra/Trikona/Labha Placement',
            shastra: rule2.shastra,
            condition: '5th lord placed in Kendra, Trikona, 2nd, or 11th house',
            traditionalInterpretation: rule2.summaryEn
        });
    } else if (is5thLordDusthana || is5thLordDebilitated) {
        const rule2Lim = {
            ruleId: 'CHILDREN_RULE_5TH_LORD_CHALLENGED',
            factor: '5th_Lord',
            shastra: 'Brihat Parashara Hora Shastra (Ch. 16)',
            status: 'LIMITING',
            summaryEn: `5th lord ${fifthLordName} is placed in House ${fifthLordHouse} (${fifthLordSign})${fifthLordDignity ? ` (${fifthLordDignity})` : ''}, indicating mixed or delayed traditional 5th-house expression.`,
            summaryTa: `5-ம் அதிபதி ${fifthLordName}, ${fifthLordHouse}-ம் பாவகத்தில் (${fifthLordSign}) அமைந்திருப்பது பாரம்பரிய விதிகளின்படி கலவையான அல்லது தாமதமான பலனைக் குறிக்கிறது.`
        };
        limitingRuleResults.push(rule2Lim);
        traditionalRules.push({
            id: rule2Lim.ruleId,
            ruleName: 'Pancama-Adhipati Dusthana/Neecha Disposition',
            shastra: rule2Lim.shastra,
            condition: '5th lord in 6th/8th/12th house or debilitated',
            traditionalInterpretation: rule2Lim.summaryEn
        });
    } else {
        const rule2Mod = {
            ruleId: 'CHILDREN_RULE_5TH_LORD_MODERATE_HOUSE',
            factor: '5th_Lord',
            shastra: 'Brihat Parashara Hora Shastra (Ch. 16)',
            status: 'SUPPORTING',
            summaryEn: `5th lord ${fifthLordName} is placed in House ${fifthLordHouse} (${fifthLordSign}), providing moderate traditional support.`,
            summaryTa: `5-ம் அதிபதி ${fifthLordName}, ${fifthLordHouse}-ம் பாவகத்தில் (${fifthLordSign}) நிதானமான பாரம்பரிய நிலையைப் பெற்றுள்ளார்.`
        };
        supportingRuleResults.push(rule2Mod);
        traditionalRules.push({
            id: rule2Mod.ruleId,
            ruleName: 'Pancama-Adhipati Upachaya Placement',
            shastra: rule2Mod.shastra,
            condition: '5th lord in moderate house',
            traditionalInterpretation: rule2Mod.summaryEn
        });
    }

    // Rule 3: Jupiter (Putra Karaka) Placement & Dignity
    const isJupDebilitated = /debil|neecha/i.test(jupiterDignity || '');
    const isJupDusthana = DUSTHANA_HOUSES.has(jupiterHouse);

    if (FAVORABLE_HOUSES.has(jupiterHouse) && !isJupDebilitated) {
        const rule3 = {
            ruleId: 'CHILDREN_RULE_JUPITER_KARAKA_STRONG',
            factor: 'Jupiter',
            shastra: 'Phaladeepika (Putra Karaka Prakarana)',
            status: 'SUPPORTING',
            summaryEn: `Natural progeny significator (Putra Karaka) Jupiter is placed in House ${jupiterHouse} (${jupiterSign})${jupiterDignity ? ` (${jupiterDignity})` : ''}, a supportive traditional placement.`,
            summaryTa: `புத்திர காரகன் குரு பகவான் ${jupiterHouse}-ம் பாவகத்தில் (${jupiterSign}) சாதகமான பாரம்பரிய நிலையில் அமர்ந்துள்ளார்.`
        };
        supportingRuleResults.push(rule3);
        traditionalRules.push({
            id: rule3.ruleId,
            ruleName: 'Putra Karaka Guru Favorable Disposition',
            shastra: rule3.shastra,
            condition: 'Jupiter in Kendra, Trikona, 2nd, or 11th house without debilitation',
            traditionalInterpretation: rule3.summaryEn
        });
    } else if (isJupDusthana || isJupDebilitated) {
        const rule3Lim = {
            ruleId: 'CHILDREN_RULE_JUPITER_KARAKA_CHALLENGED',
            factor: 'Jupiter',
            shastra: 'Phaladeepika (Putra Karaka Prakarana)',
            status: 'LIMITING',
            summaryEn: `Putra Karaka Jupiter is in House ${jupiterHouse} (${jupiterSign})${jupiterDignity ? ` (${jupiterDignity})` : ''}, which traditional rules treat as a moderating factor requiring supportive dasha activation.`,
            summaryTa: `புத்திர காரகன் குரு பகவான் ${jupiterHouse}-ம் பாவகத்தில் (${jupiterSign}) அமைந்திருப்பது தசா புக்தி ஆதரவை எதிர்நோக்கும் மிதமான நிலையாகும்.`
        };
        limitingRuleResults.push(rule3Lim);
        traditionalRules.push({
            id: rule3Lim.ruleId,
            ruleName: 'Putra Karaka Guru Moderated Disposition',
            shastra: rule3Lim.shastra,
            condition: 'Jupiter in 6th/8th/12th house or debilitated',
            traditionalInterpretation: rule3Lim.summaryEn
        });
    } else {
        const rule3Mod = {
            ruleId: 'CHILDREN_RULE_JUPITER_KARAKA_MODERATE',
            factor: 'Jupiter',
            shastra: 'Phaladeepika (Putra Karaka Prakarana)',
            status: 'SUPPORTING',
            summaryEn: `Putra Karaka Jupiter is positioned in House ${jupiterHouse} (${jupiterSign}), contributing steady traditional karaka signification.`,
            summaryTa: `புத்திர காரகன் குரு பகவான் ${jupiterHouse}-ம் பாவகத்தில் (${jupiterSign}) சமநிலையான பாரம்பரிய அமைப்பில் உள்ளார்.`
        };
        supportingRuleResults.push(rule3Mod);
        traditionalRules.push({
            id: rule3Mod.ruleId,
            ruleName: 'Putra Karaka Guru Balanced Placement',
            shastra: rule3Mod.shastra,
            condition: 'Jupiter in 3rd house without debilitation',
            traditionalInterpretation: rule3Mod.summaryEn
        });
    }

    // Optional Rule 4: D7 Saptamsha Varga (if available)
    const d7Chart = chart.vargas?.D7 || chart.vargas?.d7 || chart.divisionalCharts?.D7 || chart.allVargas?.D7 || null;
    const d7Asc = d7Chart?.ascendant?.signName || d7Chart?.ascendant?.sign || (typeof d7Chart?.ascendant === 'string' ? d7Chart.ascendant : null);
    if (d7Asc) {
        calculatedFacts.push({
            id: 'VARGA_FACT_D7_ASC',
            factor: 'D7_Ascendant',
            sign: d7Asc
        });
        const rule4 = {
            ruleId: 'CHILDREN_RULE_D7_SAPTAMSHA_EVALUATED',
            factor: 'D7',
            shastra: 'Brihat Parashara Hora Shastra (Shodashavarga Adhyaya)',
            status: 'SUPPORTING',
            summaryEn: `Optional D7 Saptamsha divisional chart is available with Ascendant in ${d7Asc} (ruled by ${SIGN_LORDS[d7Asc] || 'lord'}).`,
            summaryTa: `துணை வர்க்கமான D7 சப்தாம்ச லக்னம் ${d7Asc} ராசியில் அமைந்துள்ளது.`
        };
        supportingRuleResults.push(rule4);
        traditionalRules.push({
            id: rule4.ruleId,
            ruleName: 'Saptamsha (D7) Divisional Corroboration',
            shastra: rule4.shastra,
            condition: 'D7 Saptamsha Lagna calculated',
            traditionalInterpretation: rule4.summaryEn
        });
    }

    return {
        status: 'EVALUATED',
        interpretationType: 'TRADITIONAL',
        interpretationPolicy: 'TRADITIONAL_ONLY',
        medicalFertilityAssessment: false,
        supportingRuleResults,
        limitingRuleResults,
        evaluatedRuleResults: [...supportingRuleResults, ...limitingRuleResults],
        missingEvidence: [],
        fertilityStatus: 'NOT_ASSESSED',
        exactChildCount: null,
        outcomeGuarantee: false,
        fifthHouse: {
            house: 5,
            sign: fifthSign,
            lord: fifthLordName,
            occupants: fifthOccupants
        },
        fifthLord: {
            planet: fifthLordName,
            sign: fifthLordSign,
            house: fifthLordHouse,
            dignity: fifthLordDignity
        },
        jupiter: {
            planet: 'Jupiter',
            sign: jupiterSign,
            house: jupiterHouse,
            dignity: jupiterDignity
        },
        d7Summary: d7Asc ? { ascendant: d7Asc, ruler: SIGN_LORDS[d7Asc] || null } : null,
        calculatedFacts,
        traditionalRules
    };
}

