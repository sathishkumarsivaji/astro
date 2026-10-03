/**
 * ASTROVERSE — 17-Domain Empirical Validation Registry
 * =====================================================
 * Establishes the authoritative epistemic and scientific status for all
 * 17 Expert Mode domains.
 *
 * Core Axiom:
 *   ASTRONOMICAL CALCULATION ≠ TRADITIONAL INTERPRETATION ≠ EMPIRICAL PREDICTION.
 *
 * Requirements:
 * 1. Only Marriage currently possesses an audited empirical benchmark against
 *    historical cohorts (15,807 records from VedAstro and Astro-Databank).
 *    Its status is CALIBRATED_EMPIRICAL_BENCHMARK_AVAILABLE (Experimental, ~4-7y MAE).
 * 2. All other 16 domains (Property, Career, Education, Children, Foreign Travel,
 *    Vehicle, Business, Job, Finance, Family, Leadership, Wellness, Legal, Spiritual,
 *    Caution, Milestones) are strictly classified as:
 *    TRADITIONAL_RULE_FRAMEWORK_UNVALIDATED
 *    ("Traditional Rule Framework — Empirical Predictive Validation Not Established").
 * 3. Never claim or display predictive accuracy percentages for unvalidated domains.
 * 4. Separate Astronomical Calculation Resolution from Traditional Timing Resolution
 *    and Empirical Predictive Resolution.
 */

import { DOMAIN, ALL_DOMAINS, RESOLUTION } from "./expertPredictionSchema.js";

export const DOMAIN_VALIDATION_STATUS = Object.freeze({
  CALIBRATED_EMPIRICAL_BENCHMARK_AVAILABLE: "CALIBRATED_EMPIRICAL_BENCHMARK_AVAILABLE",
  TRADITIONAL_RULE_FRAMEWORK_UNVALIDATED:   "TRADITIONAL_RULE_FRAMEWORK_UNVALIDATED",
  ASTRONOMICALLY_CALCULATED:                "ASTRONOMICALLY_CALCULATED"
});

export const DOMAIN_VALIDATION_REGISTRY = Object.freeze({
  [DOMAIN.MARRIAGE]: {
    domain: DOMAIN.MARRIAGE,
    domainLabelEn: "Marriage & Partnership Timing",
    domainLabelTa: "திருமணம் & கூட்டாண்மை காலம்",
    status: DOMAIN_VALIDATION_STATUS.CALIBRATED_EMPIRICAL_BENCHMARK_AVAILABLE,
    empiricalOutcomeValidationAvailable: true,
    benchmarkCohortSize: 15807,
    benchmarkSources: ["VedAstro Public Cohort", "Astro-Databank Rodden A/AA"],
    astronomicalResolution: RESOLUTION.DAY,
    traditionalTimingResolution: RESOLUTION.DATE_RANGE,
    empiricalPredictiveResolution: RESOLUTION.YEAR,
    badgeEn: "Calibrated Empirical Benchmark Available (Experimental)",
    badgeTa: "அளவீடு செய்யப்பட்ட சான்றியல் ஒப்பீடு உள்ளது (பரிசோதனை)",
    disclaimerEn: "Empirically evaluated against historical cohort datasets with ~4-7y timing MAE. Not an individualized certainty.",
    disclaimerTa: "வரலாற்று தரவுத்தளங்களில் சரிபார்க்கப்பட்டது (MAE ~4-7 ஆண்டுகள்). இது தனிநபர் உறுதிப்பாடு அல்ல.",
    citations: ["Brihat Parasara Hora Sastra Ch. 18 & 46", "Phaladeepika Ch. 10", "Jataka Parijata Ch. 14"]
  },
  [DOMAIN.PROPERTY]: {
    domain: DOMAIN.PROPERTY,
    domainLabelEn: "Property & Real Estate Acquisition",
    domainLabelTa: "சொத்து & நிலம் வாங்குதல்",
    status: DOMAIN_VALIDATION_STATUS.TRADITIONAL_RULE_FRAMEWORK_UNVALIDATED,
    empiricalOutcomeValidationAvailable: false,
    benchmarkCohortSize: 0,
    benchmarkSources: [],
    astronomicalResolution: RESOLUTION.DAY,
    traditionalTimingResolution: RESOLUTION.DATE_RANGE,
    empiricalPredictiveResolution: "NOT_ESTABLISHED",
    badgeEn: "Traditional Rule Framework — Empirical Predictive Validation Not Established",
    badgeTa: "பாரம்பரிய ஜோதிட நெறிமுறை — அனுபவபூர்வ சான்றியல் சரிபார்ப்பு நிறுவப்படவில்லை",
    disclaimerEn: "Calculated using classical Jyotisha principles (4th Bhava, Mars, D4 Chaturthamsha). No certified empirical real-world outcome dataset exists.",
    disclaimerTa: "பாரம்பரிய ஜோதிட விதிகளின் அடிப்படையில் கணக்கிடப்பட்டது (4-ம் பாவம், செவ்வாய், D4). சான்றியல் வாழ்க்கை நிகழ்வுத் தரவுத்தளம் நிறுவப்படவில்லை.",
    citations: ["Brihat Parasara Hora Sastra Ch. 12", "Phaladeepika Ch. 16"]
  },
  [DOMAIN.CAREER]: {
    domain: DOMAIN.CAREER,
    domainLabelEn: "Career Progression & Professional Trajectory",
    domainLabelTa: "தொழில் முன்னேற்றம் & வளர்ச்சி",
    status: DOMAIN_VALIDATION_STATUS.TRADITIONAL_RULE_FRAMEWORK_UNVALIDATED,
    empiricalOutcomeValidationAvailable: false,
    benchmarkCohortSize: 0,
    benchmarkSources: [],
    astronomicalResolution: RESOLUTION.DAY,
    traditionalTimingResolution: RESOLUTION.DATE_RANGE,
    empiricalPredictiveResolution: "NOT_ESTABLISHED",
    badgeEn: "Traditional Rule Framework — Empirical Predictive Validation Not Established",
    badgeTa: "பாரம்பரிய ஜோதிட நெறிமுறை — அனுபவபூர்வ சான்றியல் சரிபார்ப்பு நிறுவப்படவில்லை",
    disclaimerEn: "Calculated from classical 10th house, Sun, Saturn, and D10 Dashamsha rules. Lacks prospective empirical validation cohorts.",
    disclaimerTa: "10-ம் பாவம், சூரியன், சனி மற்றும் D10 தசாம்ச விதிகளின்படி கணக்கிடப்பட்டது. சான்றியல் சரிபார்ப்பு தரவுத்தளம் இல்லை.",
    citations: ["BPHS Ch. 15", "Saravali Ch. 30", "Phaladeepika Ch. 18"]
  },
  [DOMAIN.EDUCATION]: {
    domain: DOMAIN.EDUCATION,
    domainLabelEn: "Education, Higher Studies & Academic Milestones",
    domainLabelTa: "கல்வி, உயர்கல்வி & தேர்வு காலங்கள்",
    status: DOMAIN_VALIDATION_STATUS.TRADITIONAL_RULE_FRAMEWORK_UNVALIDATED,
    empiricalOutcomeValidationAvailable: false,
    benchmarkCohortSize: 0,
    benchmarkSources: [],
    astronomicalResolution: RESOLUTION.DAY,
    traditionalTimingResolution: RESOLUTION.DATE_RANGE,
    empiricalPredictiveResolution: "NOT_ESTABLISHED",
    badgeEn: "Traditional Rule Framework — Empirical Predictive Validation Not Established",
    badgeTa: "பாரம்பரிய ஜோதிட நெறிமுறை — அனுபவபூர்வ சான்றியல் சரிபார்ப்பு நிறுவப்படவில்லை",
    disclaimerEn: "Derived from traditional 4th/5th/9th Bhava and D24 Siddhamsa rules. Empirical predictive validity is not established.",
    disclaimerTa: "4/5/9-ம் பாவங்கள் மற்றும் D24 சித்தாம்ச விதிகளின்படி கணக்கிடப்பட்டது. அனுபவபூர்வ உண்மைத்தன்மை நிறுவப்படவில்லை.",
    citations: ["BPHS Ch. 12 & 13", "Phaladeepika Ch. 16"]
  },
  [DOMAIN.CHILDREN]: {
    domain: DOMAIN.CHILDREN,
    domainLabelEn: "Progeny & Childbirth Timing",
    domainLabelTa: "புத்திர பாக்கியம் & குழந்தைகள் காலம்",
    status: DOMAIN_VALIDATION_STATUS.TRADITIONAL_RULE_FRAMEWORK_UNVALIDATED,
    empiricalOutcomeValidationAvailable: false,
    benchmarkCohortSize: 0,
    benchmarkSources: [],
    astronomicalResolution: RESOLUTION.DAY,
    traditionalTimingResolution: RESOLUTION.DATE_RANGE,
    empiricalPredictiveResolution: "NOT_ESTABLISHED",
    badgeEn: "Traditional Rule Framework — Empirical Predictive Validation Not Established",
    badgeTa: "பாரம்பரிய ஜோதிட நெறிமுறை — அனுபவபூர்வ சான்றியல் சரிபார்ப்பு நிறுவப்படவில்லை",
    disclaimerEn: "Derived from traditional 5th Bhava, Jupiter, and D7 Saptamsha indications. No empirical ground truth dataset has been validated.",
    disclaimerTa: "5-ம் பாவம், குரு மற்றும் D7 சப்தாம்ச விதிகளின்படி கணக்கிடப்பட்டது. சான்றியல் தரவுத்தளம் சரிபார்க்கப்படவில்லை.",
    citations: ["BPHS Ch. 13", "Jataka Parijata Ch. 13", "Phaladeepika Ch. 12"]
  },
  [DOMAIN.FOREIGN_TRAVEL]: {
    domain: DOMAIN.FOREIGN_TRAVEL,
    domainLabelEn: "Foreign Travel & Relocation",
    domainLabelTa: "வெளிநாட்டுப் பயணம் & இடமாற்றம்",
    status: DOMAIN_VALIDATION_STATUS.TRADITIONAL_RULE_FRAMEWORK_UNVALIDATED,
    empiricalOutcomeValidationAvailable: false,
    benchmarkCohortSize: 0,
    benchmarkSources: [],
    astronomicalResolution: RESOLUTION.DAY,
    traditionalTimingResolution: RESOLUTION.DATE_RANGE,
    empiricalPredictiveResolution: "NOT_ESTABLISHED",
    badgeEn: "Traditional Rule Framework — Empirical Predictive Validation Not Established",
    badgeTa: "பாரம்பரிய ஜோதிட நெறிமுறை — அனுபவபூர்வ சான்றியல் சரிபார்ப்பு நிறுவப்படவில்லை",
    disclaimerEn: "Classical assessment of 3rd/9th/12th houses, Rahu, and Moon. Prospective predictive validation is not established.",
    disclaimerTa: "3/9/12-ம் பாவங்கள், ராகு மற்றும் சந்திரன் நிலைகளின் பாரம்பரிய ஆய்வு. சான்றியல் சரிபார்ப்பு நிறுவப்படவில்லை.",
    citations: ["BPHS Ch. 17", "Uttara Kalamrita"]
  },
  [DOMAIN.VEHICLE]: {
    domain: DOMAIN.VEHICLE,
    domainLabelEn: "Vehicle & Conveyance Acquisition",
    domainLabelTa: "வாகனம் & வாகனம் வாங்கும் யோகம்",
    status: DOMAIN_VALIDATION_STATUS.TRADITIONAL_RULE_FRAMEWORK_UNVALIDATED,
    empiricalOutcomeValidationAvailable: false,
    benchmarkCohortSize: 0,
    benchmarkSources: [],
    astronomicalResolution: RESOLUTION.DAY,
    traditionalTimingResolution: RESOLUTION.DATE_RANGE,
    empiricalPredictiveResolution: "NOT_ESTABLISHED",
    badgeEn: "Traditional Rule Framework — Empirical Predictive Validation Not Established",
    badgeTa: "பாரம்பரிய ஜோதிட நெறிமுறை — அனுபவபூர்வ சான்றியல் சரிபார்ப்பு நிறுவப்படவில்லை",
    disclaimerEn: "Traditional 4th Bhava and Venus conveyance karakatva analysis. Empirical predictive validation not established.",
    disclaimerTa: "4-ம் பாவம் மற்றும் சுக்கிரன் வாகன காரகத்துவ ஆய்வு. சான்றியல் சரிபார்ப்பு நிறுவப்படவில்லை.",
    citations: ["BPHS Ch. 12", "Phaladeepika Ch. 16"]
  },
  [DOMAIN.BUSINESS]: {
    domain: DOMAIN.BUSINESS,
    domainLabelEn: "Business Venture & Entrepreneurship",
    domainLabelTa: "சுயதொழில் & வணிக வாய்ப்புகள்",
    status: DOMAIN_VALIDATION_STATUS.TRADITIONAL_RULE_FRAMEWORK_UNVALIDATED,
    empiricalOutcomeValidationAvailable: false,
    benchmarkCohortSize: 0,
    benchmarkSources: [],
    astronomicalResolution: RESOLUTION.DAY,
    traditionalTimingResolution: RESOLUTION.DATE_RANGE,
    empiricalPredictiveResolution: "NOT_ESTABLISHED",
    badgeEn: "Traditional Rule Framework — Empirical Predictive Validation Not Established",
    badgeTa: "பாரம்பரிய ஜோதிட நெறிமுறை — அனுபவபூர்வ சான்றியல் சரிபார்ப்பு நிறுவப்படவில்லை",
    disclaimerEn: "Traditional evaluation of 7th/10th houses and Mercury commercial karakatva. Empirical validation not established.",
    disclaimerTa: "7/10-ம் பாவங்கள் மற்றும் புதன் வணிக காரகத்துவ பாரம்பரிய ஆய்வு. சான்றியல் சரிபார்ப்பு நிறுவப்படவில்லை.",
    citations: ["BPHS Ch. 14", "Saravali Ch. 31"]
  },
  [DOMAIN.JOB]: {
    domain: DOMAIN.JOB,
    domainLabelEn: "Job Opportunities & Employment Transition",
    domainLabelTa: "வேலைவாய்ப்பு & உத்தியோக மாற்றம்",
    status: DOMAIN_VALIDATION_STATUS.TRADITIONAL_RULE_FRAMEWORK_UNVALIDATED,
    empiricalOutcomeValidationAvailable: false,
    benchmarkCohortSize: 0,
    benchmarkSources: [],
    astronomicalResolution: RESOLUTION.DAY,
    traditionalTimingResolution: RESOLUTION.DATE_RANGE,
    empiricalPredictiveResolution: "NOT_ESTABLISHED",
    badgeEn: "Traditional Rule Framework — Empirical Predictive Validation Not Established",
    badgeTa: "பாரம்பரிய ஜோதிட நெறிமுறை — அனுபவபூர்வ சான்றியல் சரிபார்ப்பு நிறுவப்படவில்லை",
    disclaimerEn: "Traditional 6th/10th service house indications. Empirical outcome validation not established.",
    disclaimerTa: "6/10-ம் உத்தியோக பாவங்கள் சார்ந்த பாரம்பரிய ஆய்வு. சான்றியல் சரிபார்ப்பு நிறுவப்படவில்லை.",
    citations: ["BPHS Ch. 14 & 15", "Phaladeepika Ch. 17"]
  },
  [DOMAIN.FINANCE]: {
    domain: DOMAIN.FINANCE,
    domainLabelEn: "Wealth, Accumulation & Financial Opportunities",
    domainLabelTa: "தன வரவு, சேமிப்பு & நிதி வாய்ப்புகள்",
    status: DOMAIN_VALIDATION_STATUS.TRADITIONAL_RULE_FRAMEWORK_UNVALIDATED,
    empiricalOutcomeValidationAvailable: false,
    benchmarkCohortSize: 0,
    benchmarkSources: [],
    astronomicalResolution: RESOLUTION.DAY,
    traditionalTimingResolution: RESOLUTION.DATE_RANGE,
    empiricalPredictiveResolution: "NOT_ESTABLISHED",
    badgeEn: "Traditional Rule Framework — Empirical Predictive Validation Not Established",
    badgeTa: "பாரம்பரிய ஜோதிட நெறிமுறை — அனுபவபூர்வ சான்றியல் சரிபார்ப்பு நிறுவப்படவில்லை",
    disclaimerEn: "Traditional Dhana Yoga (2nd/11th Bhavas, Jupiter) principles. Not an investment or predictive financial forecast.",
    disclaimerTa: "தன யோக (2/11-ம் பாவங்கள், குரு) பாரம்பரிய ஆய்வு. இது நிதி ஆலோசனை அல்லது திட்டவட்ட கணிப்பு அல்ல.",
    citations: ["BPHS Ch. 36", "Jataka Parijata Ch. 7"]
  },
  [DOMAIN.FAMILY]: {
    domain: DOMAIN.FAMILY,
    domainLabelEn: "Family Harmony & Parental Milestones",
    domainLabelTa: "குடும்ப நலம் & பெற்றோர் தொடர்புகள்",
    status: DOMAIN_VALIDATION_STATUS.TRADITIONAL_RULE_FRAMEWORK_UNVALIDATED,
    empiricalOutcomeValidationAvailable: false,
    benchmarkCohortSize: 0,
    benchmarkSources: [],
    astronomicalResolution: RESOLUTION.DAY,
    traditionalTimingResolution: RESOLUTION.DATE_RANGE,
    empiricalPredictiveResolution: "NOT_ESTABLISHED",
    badgeEn: "Traditional Rule Framework — Empirical Predictive Validation Not Established",
    badgeTa: "பாரம்பரிய ஜோதிட நெறிமுறை — அனுபவபூர்வ சான்றியல் சரிபார்ப்பு நிறுவப்படவில்லை",
    disclaimerEn: "Classical 2nd/4th/9th house associations and D12 Dwadashamsha. Empirical validation not established.",
    disclaimerTa: "2/4/9-ம் பாவங்கள் மற்றும் D12 துவாதசாம்ச பாரம்பரிய ஆய்வு. சான்றியல் சரிபார்ப்பு நிறுவப்படவில்லை.",
    citations: ["BPHS Ch. 12 & 16", "Phaladeepika Ch. 16"]
  },
  [DOMAIN.LEADERSHIP]: {
    domain: DOMAIN.LEADERSHIP,
    domainLabelEn: "Leadership, Authority & Public Recognition",
    domainLabelTa: "தலைமைப் பண்பு & சமூக அங்கீகாரம்",
    status: DOMAIN_VALIDATION_STATUS.TRADITIONAL_RULE_FRAMEWORK_UNVALIDATED,
    empiricalOutcomeValidationAvailable: false,
    benchmarkCohortSize: 0,
    benchmarkSources: [],
    astronomicalResolution: RESOLUTION.DAY,
    traditionalTimingResolution: RESOLUTION.DATE_RANGE,
    empiricalPredictiveResolution: "NOT_ESTABLISHED",
    badgeEn: "Traditional Rule Framework — Empirical Predictive Validation Not Established",
    badgeTa: "பாரம்பரிய ஜோதிட நெறிமுறை — அனுபவபூர்வ சான்றியல் சரிபார்ப்பு நிறுவப்படவில்லை",
    disclaimerEn: "Classical Raja Yoga and 5th/10th Bhava analysis. Empirical predictive validation not established.",
    disclaimerTa: "ராஜ யோகங்கள் மற்றும் 5/10-ம் பாவங்கள் சார்ந்த பாரம்பரிய ஆய்வு. சான்றியல் சரிபார்ப்பு நிறுவப்படவில்லை.",
    citations: ["BPHS Ch. 35", "Saravali Ch. 35"]
  },
  [DOMAIN.WELLNESS]: {
    domain: DOMAIN.WELLNESS,
    domainLabelEn: "Traditional Wellness & Preventive Attention",
    domainLabelTa: "பாரம்பரிய ஆரோக்கியம் & தடுப்பு கவனிப்பு",
    status: DOMAIN_VALIDATION_STATUS.TRADITIONAL_RULE_FRAMEWORK_UNVALIDATED,
    empiricalOutcomeValidationAvailable: false,
    benchmarkCohortSize: 0,
    benchmarkSources: [],
    astronomicalResolution: RESOLUTION.DAY,
    traditionalTimingResolution: RESOLUTION.DATE_RANGE,
    empiricalPredictiveResolution: "NOT_ESTABLISHED",
    badgeEn: "Traditional Rule Framework — Empirical Predictive Validation Not Established",
    badgeTa: "பாரம்பரிய ஜோதிட நெறிமுறை — அனுபவபூர்வ சான்றியல் சரிபார்ப்பு நிறுவப்படவில்லை",
    disclaimerEn: "Traditional Jyotisha/Ayurvedic symbolic correspondences only. Zero clinical diagnostic or disease predictive validity.",
    disclaimerTa: "பாரம்பரிய ஜோதிட-ஆயுர்வேத குறியீட்டு தொடர்பு மட்டுமே. மருத்துவ நோயறிதல் அல்லது நோய் கணிப்பு அல்ல.",
    citations: ["BPHS Ch. 14", "Prasna Marga"]
  },
  [DOMAIN.LEGAL]: {
    domain: DOMAIN.LEGAL,
    domainLabelEn: "Legal Matters, Disputes & Conflict Resolution",
    domainLabelTa: "வழக்குகள், பிணக்குகள் & தீர்வு காலங்கள்",
    status: DOMAIN_VALIDATION_STATUS.TRADITIONAL_RULE_FRAMEWORK_UNVALIDATED,
    empiricalOutcomeValidationAvailable: false,
    benchmarkCohortSize: 0,
    benchmarkSources: [],
    astronomicalResolution: RESOLUTION.DAY,
    traditionalTimingResolution: RESOLUTION.DATE_RANGE,
    empiricalPredictiveResolution: "NOT_ESTABLISHED",
    badgeEn: "Traditional Rule Framework — Empirical Predictive Validation Not Established",
    badgeTa: "பாரம்பரிய ஜோதிட நெறிமுறை — அனுபவபூர்வ சான்றியல் சரிபார்ப்பு நிறுவப்படவில்லை",
    disclaimerEn: "Classical 6th house (Shatru Bhava) and Mars-Saturn conflict cycle indicators. Not legal advice.",
    disclaimerTa: "6-ம் பாவம் (சத்ரு பாவம்) மற்றும் செவ்வாய்-சனி முரண்பாட்டு சுழற்சி ஆய்வு. சட்ட ஆலோசனை அல்ல.",
    citations: ["BPHS Ch. 14", "Prasna Marga Ch. 15"]
  },
  [DOMAIN.SPIRITUAL]: {
    domain: DOMAIN.SPIRITUAL,
    domainLabelEn: "Spiritual Awakening, Sadhana & Higher Wisdom",
    domainLabelTa: "ஆன்மீகம், சாதனா & குரு தொடர்பு",
    status: DOMAIN_VALIDATION_STATUS.TRADITIONAL_RULE_FRAMEWORK_UNVALIDATED,
    empiricalOutcomeValidationAvailable: false,
    benchmarkCohortSize: 0,
    benchmarkSources: [],
    astronomicalResolution: RESOLUTION.DAY,
    traditionalTimingResolution: RESOLUTION.DATE_RANGE,
    empiricalPredictiveResolution: "NOT_ESTABLISHED",
    badgeEn: "Traditional Rule Framework — Empirical Predictive Validation Not Established",
    badgeTa: "பாரம்பரிய ஜோதிட நெறிமுறை — அனுபவபூர்வ சான்றியல் சரிபார்ப்பு நிறுவப்படவில்லை",
    disclaimerEn: "Classical Moksha Trikona (4th/8th/12th), Jupiter, Ketu, and D9/D60 spiritual alignments. Empirical validation not established.",
    disclaimerTa: "மோட்ச திரிகோணங்கள் (4/8/12), குரு, கேது மற்றும் D9/D60 ஆன்மீக அமைப்புகள். சான்றியல் சரிபார்ப்பு நிறுவப்படவில்லை.",
    citations: ["BPHS Ch. 17 & 45", "Jaimini Upadesha Sutras"]
  },
  [DOMAIN.CAUTION]: {
    domain: DOMAIN.CAUTION,
    domainLabelEn: "Cautionary Cycles & Vulnerability Windows",
    domainLabelTa: "எச்சரிக்கை சுழற்சிகள் & தற்காப்பு காலங்கள்",
    status: DOMAIN_VALIDATION_STATUS.TRADITIONAL_RULE_FRAMEWORK_UNVALIDATED,
    empiricalOutcomeValidationAvailable: false,
    benchmarkCohortSize: 0,
    benchmarkSources: [],
    astronomicalResolution: RESOLUTION.DAY,
    traditionalTimingResolution: RESOLUTION.DATE_RANGE,
    empiricalPredictiveResolution: "NOT_ESTABLISHED",
    badgeEn: "Traditional Rule Framework — Empirical Predictive Validation Not Established",
    badgeTa: "பாரம்பரிய ஜோதிட நெறிமுறை — அனுபவபூர்வ சான்றியல் சரிபார்ப்பு நிறுவப்படவில்லை",
    disclaimerEn: "Traditional Dusthana (6th/8th/12th) transit confluence and Ashtakavarga low bindu screening. Empirical predictive validity not established.",
    disclaimerTa: "துஸ்தான (6/8/12) கோட்சார மற்றும் அஷ்டகவர்க்க குறைந்த பரல் நிலைகள் சார்ந்த ஆய்வு. சான்றியல் சரிபார்ப்பு நிறுவப்படவில்லை.",
    citations: ["BPHS Ch. 14 & 66", "Phaladeepika Ch. 20"]
  },
  [DOMAIN.MILESTONES]: {
    domain: DOMAIN.MILESTONES,
    domainLabelEn: "Major Life Milestones & Retrospective Alignment",
    domainLabelTa: "முக்கிய வாழ்க்கை மைல்கற்கள் & முந்தைய கால சரிபார்ப்பு",
    status: DOMAIN_VALIDATION_STATUS.TRADITIONAL_RULE_FRAMEWORK_UNVALIDATED,
    empiricalOutcomeValidationAvailable: false,
    benchmarkCohortSize: 0,
    benchmarkSources: [],
    astronomicalResolution: RESOLUTION.DAY,
    traditionalTimingResolution: RESOLUTION.DATE_RANGE,
    empiricalPredictiveResolution: "NOT_ESTABLISHED",
    badgeEn: "Traditional Rule Framework — Empirical Predictive Validation Not Established",
    badgeTa: "பாரம்பரிய ஜோதிட நெறிமுறை — அனுபவபூர்வ சான்றியல் சரிபார்ப்பு நிறுவப்படவில்லை",
    disclaimerEn: "Cross-domain synthesis designed for native self-reflection against lived life experiences. Empirical predictive validation not established.",
    disclaimerTa: "வாழ்ந்த அனுபவங்களுடன் ஒப்பிட்டு சுய ஆய்வு செய்வதற்கான கூட்டு கணிப்பு. சான்றியல் சரிபார்ப்பு நிறுவப்படவில்லை.",
    citations: ["BPHS Ch. 46-50"]
  }
});

/**
 * Returns validation metadata for a specific domain.
 * @param {string} domain 
 * @returns {Object} Domain validation metadata
 */
export function getDomainValidationInfo(domain) {
  return DOMAIN_VALIDATION_REGISTRY[domain] || {
    domain,
    domainLabelEn: domain,
    domainLabelTa: domain,
    status: DOMAIN_VALIDATION_STATUS.TRADITIONAL_RULE_FRAMEWORK_UNVALIDATED,
    empiricalOutcomeValidationAvailable: false,
    benchmarkCohortSize: 0,
    benchmarkSources: [],
    astronomicalResolution: RESOLUTION.DAY,
    traditionalTimingResolution: RESOLUTION.DATE_RANGE,
    empiricalPredictiveResolution: "NOT_ESTABLISHED",
    badgeEn: "Traditional Rule Framework — Empirical Predictive Validation Not Established",
    badgeTa: "பாரம்பரிய ஜோதிட நெறிமுறை — அனுபவபூர்வ சான்றியல் சரிபார்ப்பு நிறுவப்படவில்லை",
    disclaimerEn: "Traditional Jyotisha rules only; prospective empirical predictive accuracy is not established.",
    disclaimerTa: "பாரம்பரிய ஜோதிட விதிகளின் அடிப்படையிலானது; சான்றியல் துல்லியம் நிறுவப்படவில்லை.",
    citations: []
  };
}

/**
 * Returns all 17 domain validation entries as an array.
 * @returns {Array<Object>}
 */
export function getAllDomainValidationEntries() {
  return ALL_DOMAINS.map(d => getDomainValidationInfo(d));
}

/**
 * Returns an aggregate summary of the 17-Domain validation status.
 * @returns {Object}
 */
export function getDomainValidationSummary() {
  const all = getAllDomainValidationEntries();
  const empiricalCount = all.filter(d => d.empiricalOutcomeValidationAvailable).length;
  const unvalidatedCount = all.filter(d => !d.empiricalOutcomeValidationAvailable).length;
  return {
    totalDomains: all.length,
    empiricalCount,
    unvalidatedCount,
    ruleVersion: "1.0.0",
    nonNegotiableAxiom: "ASTRONOMICAL CALCULATION != TRADITIONAL INTERPRETATION != EMPIRICAL PREDICTION"
  };
}
