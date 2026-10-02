export const PREDICTION_CONFIG = {
  "version": "1.0.0",
  "name": "AstroVerse Universal Prediction & Consultation Configuration",
  "lastUpdated": "2026-09-29T02:15:00.000Z",
  "disclaimer": "All configuration weights represent traditional astrological heuristic rules for epistemic transparency. Predictions are empirical interpretative hypotheses based on configured traditions, not scientific determinism.",
  "confidenceClasses": {
    "VERY_HIGH": { "label": "Very Strong Convergence", "minEvidence": 5, "minAgreementRatio": 0.85 },
    "HIGH": { "label": "Strong Convergence", "minEvidence": 4, "minAgreementRatio": 0.70 },
    "MODERATE": { "label": "Moderate Convergence", "minEvidence": 3, "minAgreementRatio": 0.55 },
    "MIXED": { "label": "Mixed / Competing Indications", "minEvidence": 2, "minAgreementRatio": 0.40 },
    "LOW": { "label": "Weak Convergence", "minEvidence": 1, "minAgreementRatio": 0.25 },
    "INSUFFICIENT": { "label": "Insufficient Astrological Evidence", "minEvidence": 0, "minAgreementRatio": 0.0 }
  },
  "geographicDistanceBands": [
    { "id": "SAME_LOCALITY", "label": "Same Locality / Neighborhood", "minKm": 0, "maxKm": 10, "rank": 1 },
    { "id": "NEARBY_LOCALITY", "label": "Nearby Locality / Suburb", "minKm": 10, "maxKm": 25, "rank": 2 },
    { "id": "SAME_CITY", "label": "Same City / Metropolitan Area", "minKm": 25, "maxKm": 50, "rank": 3 },
    { "id": "NEARBY_CITY", "label": "Nearby City / Adjoining District", "minKm": 50, "maxKm": 100, "rank": 4 },
    { "id": "DIFFERENT_DISTRICT", "label": "Different District / Regional Zone", "minKm": 100, "maxKm": 250, "rank": 5 },
    { "id": "DIFFERENT_STATE", "label": "Different State / Long Distance", "minKm": 250, "maxKm": 500, "rank": 6 },
    { "id": "VERY_LONG_DISTANCE", "label": "Cross-Country / 500+ km", "minKm": 500, "maxKm": 2500, "rank": 7 },
    { "id": "FOREIGN", "label": "Foreign Connection / Overseas", "minKm": 2500, "maxKm": 20000, "rank": 8 }
  ],
  "cardinalDirections": {
    "NORTH": { "name": "North", "tamil": "வடக்கு", "degrees": 0, "signs": [4, 8, 12], "planets": ["Mercury"] },
    "NORTH_EAST": { "name": "North-East", "tamil": "வடகிழக்கு", "degrees": 45, "signs": [], "planets": ["Jupiter"] },
    "EAST": { "name": "East", "tamil": "கிழக்கு", "degrees": 90, "signs": [1, 5, 9], "planets": ["Sun", "Mars"] },
    "SOUTH_EAST": { "name": "South-East", "tamil": "தென்கிழக்கு", "degrees": 135, "signs": [], "planets": ["Venus"] },
    "SOUTH": { "name": "South", "tamil": "தெற்கு", "degrees": 180, "signs": [2, 6, 10], "planets": ["Mars"] },
    "SOUTH_WEST": { "name": "South-West", "tamil": "தென்மேற்கு", "degrees": 225, "signs": [], "planets": ["Rahu"] },
    "WEST": { "name": "West", "tamil": "மேற்கு", "degrees": 270, "signs": [3, 7, 11], "planets": ["Saturn"] },
    "NORTH_WEST": { "name": "North-West", "tamil": "வடமேற்கு", "degrees": 315, "signs": [], "planets": ["Moon"] },
    "CENTRAL": { "name": "Central / Nearby", "tamil": "மத்திய / அருகாமை", "degrees": null, "signs": [], "planets": [] },
    "INDETERMINATE": { "name": "Indeterminate / Multiple Factors", "tamil": "தெளிவற்ற / பல திசைகள்", "degrees": null, "signs": [], "planets": [] }
  },
  "familyWealthTiers": [
    { "id": "VERY_LOW", "label": "Significantly Lower than Native's Family", "rank": 1 },
    { "id": "LOWER", "label": "Moderately Lower than Native's Family", "rank": 2 },
    { "id": "SIMILAR", "label": "Comparable / Similar Socio-Economic Level", "rank": 3 },
    { "id": "MODERATELY_HIGHER", "label": "Moderately Stronger / Higher Financial Level", "rank": 4 },
    { "id": "HIGHER", "label": "Significantly Wealthier than Native's Family", "rank": 5 },
    { "id": "VERY_HIGH", "label": "Very Substantial Wealth / Prominent Affluence", "rank": 6 },
    { "id": "INSUFFICIENT_EVIDENCE", "label": "Insufficient Astrological Evidence to Differentiate", "rank": 0 }
  ],
  "residenceModels": [
    { "id": "LIKELY_JOINT", "label": "Likely Continued Joint Family Residence", "rank": 1 },
    { "id": "LIKELY_SEPARATE", "label": "Likely Independent / Separate Household", "rank": 2 },
    { "id": "PERIODIC_ADJUSTED", "label": "Periodic / Adjusted Multi-Home Arrangement", "rank": 3 },
    { "id": "MIXED", "label": "Mixed / Flexible Residential Dynamics", "rank": 4 },
    { "id": "INSUFFICIENT_EVIDENCE", "label": "Insufficient Astrological Evidence", "rank": 0 }
  ],
  "socialValuesTiers": [
    { "id": "STRONG_FAMILY", "label": "Strongly Family-Oriented & Traditional Values", "rank": 1 },
    { "id": "MODERATE_FAMILY", "label": "Moderately Traditional with Family Cohesion", "rank": 2 },
    { "id": "BALANCED_INDEPENDENT", "label": "Balanced Personal Autonomy & Respectful Cooperation", "rank": 3 },
    { "id": "STRONGLY_INDEPENDENT", "label": "Strongly Independent & Career-Centric Outlook", "rank": 4 },
    { "id": "MIXED_ADAPTIVE", "label": "Adaptive / Context-Dependent Social Dynamics", "rank": 5 }
  ],
  "rules": {
    "RULE_MAR_7L_11H": {
      "ruleId": "RULE_MAR_7L_11H",
      "name": "7th Lord in 11th House Relationship Fulfilment",
      "domain": "MARRIAGE",
      "tradition": "Parashari",
      "weight": 1.25,
      "description": "7th lord positioned in the 11th house of gains and wish fulfilment supports auspicious union and social harmony.",
      "historicalSampleSize": null,
      "validationStatus": "TRADITIONAL_RULE_ONLY",
      "tpr": null,
      "fpr": null,
      "lift": null
    },
    "RULE_MAR_VEN_JUP_CONJ": {
      "ruleId": "RULE_MAR_VEN_JUP_CONJ",
      "name": "Venus-Jupiter Auspicious Relationship Influence",
      "domain": "MARRIAGE",
      "tradition": "Parashari",
      "weight": 1.15,
      "description": "Benefic interaction between natural marriage significators (Venus) and wisdom/growth karaka (Jupiter).",
      "historicalSampleSize": null,
      "validationStatus": "TRADITIONAL_RULE_ONLY",
      "tpr": null,
      "fpr": null,
      "lift": null
    },
    "RULE_MAR_SAT_DELAY": {
      "ruleId": "RULE_MAR_SAT_DELAY",
      "name": "Saturn 7th House / 7th Lord Moderation & Delay",
      "domain": "MARRIAGE",
      "tradition": "Parashari",
      "weight": -1.20,
      "description": "Saturnian aspect or conjunction to 7th house/lord introduces maturity requirements, gradual realization, or post-28 timing.",
      "historicalSampleSize": null,
      "validationStatus": "TRADITIONAL_RULE_ONLY",
      "tpr": null,
      "fpr": null,
      "lift": null
    },
    "RULE_MAR_D9_VEN_STRONG": {
      "ruleId": "RULE_MAR_D9_VEN_STRONG",
      "name": "Navamsha D9 Dignified Venus Confirmation",
      "domain": "MARRIAGE",
      "tradition": "Varga D9",
      "weight": 1.30,
      "description": "Venus exalted, moolatrikona, or own sign in Navamsha D1 to D9 confirms foundational marital happiness.",
      "historicalSampleSize": null,
      "validationStatus": "TRADITIONAL_RULE_ONLY",
      "tpr": null,
      "fpr": null,
      "lift": null
    },
    "RULE_MAR_UPAPADA_2ND_BENEFIC": {
      "ruleId": "RULE_MAR_UPAPADA_2ND_BENEFIC",
      "name": "2nd from Upapada Lagna (UL) Benefic Preservation",
      "domain": "MARRIAGE",
      "tradition": "Jaimini",
      "weight": 1.20,
      "description": "Benefic planets (Jupiter, Venus, Mercury) in 2nd from UL sustain matrimonial longevity and family prosperity.",
      "historicalSampleSize": null,
      "validationStatus": "TRADITIONAL_RULE_ONLY",
      "tpr": null,
      "fpr": null,
      "lift": null
    },
    "RULE_RES_4L_AFFLICT_SEP": {
      "ruleId": "RULE_RES_4L_AFFLICT_SEP",
      "name": "4th Lord Dusthana Connection Independent Residence Indicator",
      "domain": "FAMILY_RESIDENCE",
      "tradition": "Parashari",
      "weight": 1.10,
      "description": "4th lord or 4th house associated with 3rd, 9th, or 12th houses traditionally suggests independent household or relocation.",
      "historicalSampleSize": null,
      "validationStatus": "TRADITIONAL_RULE_ONLY",
      "tpr": null,
      "fpr": null,
      "lift": null
    },
    "RULE_WEALTH_2ND_FROM_7TH": {
      "ruleId": "RULE_WEALTH_2ND_FROM_7TH",
      "name": "2nd House from 7th (8th House) In-Law Wealth Indicator",
      "domain": "SPOUSE_WEALTH",
      "tradition": "Bhavat Bhavam",
      "weight": 1.25,
      "description": "Strength of 8th house (2nd from 7th) and its lord indicates the accumulated assets and financial resources of spouse's family.",
      "historicalSampleSize": null,
      "validationStatus": "TRADITIONAL_RULE_ONLY",
      "tpr": null,
      "fpr": null,
      "lift": null
    }
  },
  "explanationDepthLevels": {
    "QUICK": { "label": "Quick Summary", "sectionsCount": 3, "technicalDetail": "minimal" },
    "STANDARD": { "label": "Standard Consultation", "sectionsCount": 7, "technicalDetail": "balanced" },
    "DETAILED": { "label": "Detailed Analysis", "sectionsCount": 11, "technicalDetail": "high" },
    "ASTROLOGER_MODE": { "label": "Astrologer Mode", "sectionsCount": 17, "technicalDetail": "exhaustive" },
    "EXPERT_MODE": { "label": "Expert Epistemic Mode", "sectionsCount": 17, "technicalDetail": "rigorous_audited" }
  }
};

export default PREDICTION_CONFIG;
