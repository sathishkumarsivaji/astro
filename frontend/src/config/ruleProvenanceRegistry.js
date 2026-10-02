/**
 * ASTROVERSE — Traditional Rule Provenance Registry
 *
 * Every predictive/interpretive rule must carry full provenance.
 * This registry defines the schema and provides utilities for rule metadata.
 */

/**
 * Schema for a traditional predictive rule's provenance.
 * @typedef {Object} RuleProvenance
 * @property {string} ruleId - Unique rule identifier (e.g., 'BPHS_7_1_MARRIAGE_TIMING')
 * @property {string} tradition - Astrological tradition (e.g., 'Parashari', 'Jaimini', 'KP', 'Nadi')
 * @property {string} sourceTitle - Primary text source (e.g., 'Brihat Parasara Hora Shastra')
 * @property {string} sourceEdition - Edition/translation referenced
 * @property {string|null} chapterOrSection - Chapter reference
 * @property {string|null} verseOrPageWhenAvailable - Specific verse or page
 * @property {string} ruleTextSummary - Brief summary of the rule in plain language
 * @property {string} implementationFormula - How the rule is computationally implemented
 * @property {string[]} knownAlternativeConventions - Other traditions' versions of this rule
 * @property {string} selectedConvention - Which convention ASTROVERSE uses and why
 * @property {string} validationStatus - One of: TRADITIONAL_RULE_ONLY, INTERNALLY_TESTED, EXTERNALLY_VALIDATED
 */

/**
 * Creates a rule provenance entry.
 */
export function createRuleProvenance({
  ruleId,
  tradition,
  sourceTitle,
  sourceEdition = 'Not specified',
  chapterOrSection = null,
  verseOrPageWhenAvailable = null,
  ruleTextSummary,
  implementationFormula,
  knownAlternativeConventions = [],
  selectedConvention,
  validationStatus = 'TRADITIONAL_RULE_ONLY'
}) {
  if (!ruleId) throw new Error('Rule provenance requires a ruleId');
  if (!tradition) throw new Error('Rule provenance requires a tradition');
  if (!sourceTitle) throw new Error('Rule provenance requires a sourceTitle');
  if (!ruleTextSummary) throw new Error('Rule provenance requires a ruleTextSummary');
  if (!implementationFormula) throw new Error('Rule provenance requires an implementationFormula');
  if (!selectedConvention) throw new Error('Rule provenance requires a selectedConvention');
  
  return Object.freeze({
    ruleId,
    tradition,
    sourceTitle,
    sourceEdition,
    chapterOrSection,
    verseOrPageWhenAvailable,
    ruleTextSummary,
    implementationFormula,
    knownAlternativeConventions,
    selectedConvention,
    validationStatus
  });
}

/**
 * Initial provenance entries for core implemented rules.
 * Every predictive rule configured in prediction_config.json must exist here.
 */
export const RULE_PROVENANCE_REGISTRY = {
  VIMSHOTTARI_DASHA_SEQUENCE: createRuleProvenance({
    ruleId: 'VIMSHOTTARI_DASHA_SEQUENCE',
    tradition: 'Parashari',
    sourceTitle: 'Brihat Parasara Hora Shastra',
    sourceEdition: 'R. Santhanam translation (Ranjan Publications)',
    chapterOrSection: 'Chapter 46 (Dasha Interpretation)',
    verseOrPageWhenAvailable: 'Verses 1-12',
    ruleTextSummary: 'The Vimshottari Dasha system assigns a 120-year cycle divided among 9 planets based on the Moon nakshatra at birth. Each planet rules a fixed number of years.',
    implementationFormula: 'Balance = (remaining nakshatra arc / total arc) * dasha years. Sequence: Ketu(7), Venus(20), Sun(6), Moon(10), Mars(7), Rahu(18), Jupiter(16), Saturn(19), Mercury(17).',
    knownAlternativeConventions: ['Ashtottari (108-year)', 'Yogini dasha', 'Chara dasha (Jaimini)'],
    selectedConvention: 'Vimshottari (120-year) is the universally standard Parashari system, selected as the primary dasha model.',
    validationStatus: 'INTERNALLY_TESTED'
  }),
  
  MARRIAGE_7TH_HOUSE: createRuleProvenance({
    ruleId: 'MARRIAGE_7TH_HOUSE',
    tradition: 'Parashari',
    sourceTitle: 'Brihat Parasara Hora Shastra',
    sourceEdition: 'R. Santhanam translation',
    chapterOrSection: 'Chapter 20 (Effects of Bhavas)',
    ruleTextSummary: 'The 7th house and its lord govern marriage, partnerships, and spouse. Dasha periods of 7th lord or planets associated with 7th house indicate marriage timing.',
    implementationFormula: 'Identify 7th lord, check MD/AD of 7th lord or planets in/aspecting 7th. Cross-verify with D9 navamsha lagna lord and Venus condition.',
    knownAlternativeConventions: ['KP uses 7th cusp sub-lord for marriage timing', 'Jaimini uses Darakaraka and Upapada'],
    selectedConvention: 'Parashari 7th house analysis with D9 cross-verification, following standard Vedic practice.',
    validationStatus: 'TRADITIONAL_RULE_ONLY'
  }),
  
  SHADBALA_COMPUTATION: createRuleProvenance({
    ruleId: 'SHADBALA_COMPUTATION',
    tradition: 'Parashari',
    sourceTitle: 'Brihat Parasara Hora Shastra',
    sourceEdition: 'R. Santhanam translation',
    chapterOrSection: 'Chapter 27 (Planetary Strengths)',
    ruleTextSummary: 'Shadbala measures planetary strength via six components: Sthana (positional), Dig (directional), Kala (temporal), Cheshta (motional), Naisargika (natural), and Drig (aspectual).',
    implementationFormula: 'Sum of 6 balas in virupas. Converted to rupas (÷60). Required minimum varies by planet. Ratio = actual/required.',
    knownAlternativeConventions: ['Some schools include Ashtakavarga strength separately', 'Jaimini does not use Shadbala'],
    selectedConvention: 'Standard Parashari Shadbala with all 6 components. Threshold values per Graha Bala requirements.',
    validationStatus: 'INTERNALLY_TESTED'
  }),

  RULE_MAR_7L_11H: createRuleProvenance({
    ruleId: 'RULE_MAR_7L_11H',
    tradition: 'Parashari',
    sourceTitle: 'Brihat Parasara Hora Shastra',
    sourceEdition: 'R. Santhanam translation (Ranjan Publications)',
    chapterOrSection: 'Chapter 24 (Effects of Bhava Lords)',
    verseOrPageWhenAvailable: 'Verses on 7th Lord in 11th House',
    ruleTextSummary: '7th lord positioned in the 11th house of gains and wish fulfilment supports auspicious union and social harmony.',
    implementationFormula: 'Evaluate if natal 7th lord occupies 11th bhava from Lagna; assign positive weight for marriage timing.',
    knownAlternativeConventions: ['KP cuspal sub-lord linkage of 7th and 11th cusps'],
    selectedConvention: 'Standard Parashari bhava lordship and placement convention.',
    validationStatus: 'TRADITIONAL_RULE_ONLY'
  }),

  RULE_MAR_VEN_JUP_CONJ: createRuleProvenance({
    ruleId: 'RULE_MAR_VEN_JUP_CONJ',
    tradition: 'Parashari',
    sourceTitle: 'Brihat Parasara Hora Shastra',
    sourceEdition: 'R. Santhanam translation (Ranjan Publications)',
    chapterOrSection: 'Chapter 26 (Planetary Conjunctions)',
    verseOrPageWhenAvailable: 'Verses on Venus-Jupiter Conjunction',
    ruleTextSummary: 'Benefic interaction between natural marriage significator (Venus) and wisdom/growth karaka (Jupiter).',
    implementationFormula: 'Verify conjunction within same sign or mutual aspect between Venus and Jupiter.',
    knownAlternativeConventions: ['Western tight orb conjunction (within 6 degrees)'],
    selectedConvention: 'Vedic mutual association (sambandha) and whole-sign co-presence.',
    validationStatus: 'TRADITIONAL_RULE_ONLY'
  }),

  RULE_MAR_SAT_DELAY: createRuleProvenance({
    ruleId: 'RULE_MAR_SAT_DELAY',
    tradition: 'Parashari',
    sourceTitle: 'Brihat Parasara Hora Shastra',
    sourceEdition: 'R. Santhanam translation (Ranjan Publications)',
    chapterOrSection: 'Chapter 20 (Effects of 7th Bhava)',
    verseOrPageWhenAvailable: 'Verses on Saturnian influence on 7th house and lord',
    ruleTextSummary: 'Saturnian aspect or conjunction to 7th house/lord introduces maturity requirements, gradual realization, or post-28 timing.',
    implementationFormula: 'Check if Saturn aspects (3rd, 7th, 10th drishti) or conjoins 7th house or 7th lord; apply negative acceleration / maturity delay.',
    knownAlternativeConventions: ['Jaimini Saturn aspect on Darakaraka / Upapada'],
    selectedConvention: 'Parashari full-sight drishti matrix for Saturnian delay attribution.',
    validationStatus: 'TRADITIONAL_RULE_ONLY'
  }),

  RULE_MAR_D9_VEN_STRONG: createRuleProvenance({
    ruleId: 'RULE_MAR_D9_VEN_STRONG',
    tradition: 'Varga D9',
    sourceTitle: 'Brihat Parasara Hora Shastra',
    sourceEdition: 'R. Santhanam translation (Ranjan Publications)',
    chapterOrSection: 'Chapter 6 (Divisional Charts - Navamsha)',
    verseOrPageWhenAvailable: 'Verses on Navamsha evaluation of Kalatrakaraka',
    ruleTextSummary: 'Venus exalted, moolatrikona, or own sign in Navamsha D9 confirms foundational marital happiness.',
    implementationFormula: 'Compute D9 chart and verify Venus sign placement dignity (Pisces=exalted, Taurus/Libra=own sign).',
    knownAlternativeConventions: ['Pushkar Navamsha placement of Kalatrakaraka'],
    selectedConvention: 'Parashari D9 essential dignity assessment.',
    validationStatus: 'TRADITIONAL_RULE_ONLY'
  }),

  RULE_MAR_UPAPADA_2ND_BENEFIC: createRuleProvenance({
    ruleId: 'RULE_MAR_UPAPADA_2ND_BENEFIC',
    tradition: 'Jaimini',
    sourceTitle: 'Jaimini Upadesha Sutras',
    sourceEdition: 'Sanjay Rath commentary / B. Suryanarain Rao translation',
    chapterOrSection: 'Adhyaya 1, Pada 4',
    verseOrPageWhenAvailable: 'Sutras on Upapada Lagna second house preservation',
    ruleTextSummary: 'Benefic planets (Jupiter, Venus, Mercury) in 2nd from UL sustain matrimonial longevity and family prosperity.',
    implementationFormula: 'Locate Upapada Lagna (Arudha Pada of 12th house); check presence/aspect of benefics in 2nd from UL.',
    knownAlternativeConventions: ['Parashari 2nd house from Upapada evaluation'],
    selectedConvention: 'Jaimini Sutras canonical Upapada second house analysis.',
    validationStatus: 'TRADITIONAL_RULE_ONLY'
  }),

  RULE_RES_4L_AFFLICT_SEP: createRuleProvenance({
    ruleId: 'RULE_RES_4L_AFFLICT_SEP',
    tradition: 'Parashari',
    sourceTitle: 'Brihat Parasara Hora Shastra',
    sourceEdition: 'R. Santhanam translation (Ranjan Publications)',
    chapterOrSection: 'Chapter 17 (Effects of 4th Bhava)',
    verseOrPageWhenAvailable: 'Verses on foreign residence and household division',
    ruleTextSummary: '4th lord or 4th house associated with 3rd, 9th, or 12th houses traditionally suggests independent household or relocation.',
    implementationFormula: 'Evaluate association (conjunction, aspect, mutual reception) of 4th lord with 3rd/9th/12th houses.',
    knownAlternativeConventions: ['Nadi combinations for long-distance travel and domestic relocation'],
    selectedConvention: 'Parashari dusthana/upachaya relationship to 4th house.',
    validationStatus: 'TRADITIONAL_RULE_ONLY'
  }),

  RULE_WEALTH_2ND_FROM_7TH: createRuleProvenance({
    ruleId: 'RULE_WEALTH_2ND_FROM_7TH',
    tradition: 'Bhavat Bhavam',
    sourceTitle: 'Brihat Parasara Hora Shastra',
    sourceEdition: 'R. Santhanam translation (Ranjan Publications)',
    chapterOrSection: 'Chapter 14 (Bhavat Bhavam Principles)',
    verseOrPageWhenAvailable: '8th house as 2nd from 7th (Dhana of Kalatra)',
    ruleTextSummary: 'Strength of 8th house (2nd from 7th) and its lord indicates the accumulated assets and financial resources of spouse\'s family.',
    implementationFormula: 'Evaluate 8th house dignity, lord strength, and benefic occupancy as derived wealth indicator for spouse.',
    knownAlternativeConventions: ['KP 8th cusp sub-lord analysis'],
    selectedConvention: 'Classical Bhavat Bhavam derived house lordship methodology.',
    validationStatus: 'TRADITIONAL_RULE_ONLY'
  })
};

/**
 * Retrieves provenance for a rule by ID.
 * @param {string} ruleId
 * @returns {RuleProvenance|null}
 */
export function getRuleProvenance(ruleId) {
  return RULE_PROVENANCE_REGISTRY[ruleId] || null;
}
