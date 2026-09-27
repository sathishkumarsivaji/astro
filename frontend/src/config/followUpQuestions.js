/**
 * ASTROVERSE — Follow-Up Questions Configuration
 *
 * Canonical mapping linking Report Chapters to contextual follow-up question templates.
 * Uses canonical chapter IDs from src/config/reportChapters.js:
 * execSummary, blueprint, yogas, bhavas, health, studies, career, property,
 * politics, relationships, foreign, dosha, remedies, auspicious, risks,
 * timeline, milestoneAudit, reasoningDossier, technicalAppendix, multiSystemComparison.
 * Also defines "fullReport" for general whole-report questions.
 */

export const QUESTION_CATEGORIES = {
  UNDERSTANDING: "Understanding",
  TIMING: "Timing",
  CAREER: "Career",
  FINANCE: "Finance",
  MARRIAGE: "Marriage",
  FAMILY: "Family",
  EDUCATION: "Education",
  HEALTH: "Health",
  PROPERTY: "Property",
  TRAVEL: "Travel",
  SPIRITUAL: "Spiritual",
  DASHA: "Dasha",
  TRANSIT: "Transit",
  PLANET: "Planet",
  HOUSE: "House",
  YOGA: "Yoga",
  KP: "KP",
  SYSTEM_COMPARISON: "System Comparison",
  EVIDENCE: "Evidence",
  TECHNICAL: "Technical",
  REMEDIES: "Remedies",
  GENERAL: "General"
};

export const FOLLOW_UP_SECTIONS_CONFIG = {
  execSummary: {
    sectionId: "execSummary",
    label: "0. Executive Summary & Astro-Identity",
    labelTamil: "0. நிர்வாக சுருக்கம் & ஜோதிட அடையாளம்",
    applicableSystems: ["lahiri", "kp", "raman", "tropical"],
    templates: [
      {
        id: "exec_1",
        text: "What are the most important themes highlighted in my report?",
        textTamil: "என் அறிக்கையில் சுட்டிக்காட்டப்பட்டுள்ள மிக முக்கியமான தலைப்புகள் எவை?",
        category: QUESTION_CATEGORIES.UNDERSTANDING,
        priority: 1,
        requiredData: ["coreProfile"]
      },
      {
        id: "exec_2",
        text: "Which life areas show the strongest planetary emphasis?",
        textTamil: "எந்த வாழ்க்கை துறைகள் வலுவான கிரக முக்கியத்துவத்தைக் காட்டுகின்றன?",
        category: QUESTION_CATEGORIES.UNDERSTANDING,
        priority: 2,
        requiredData: ["strongestThemes"]
      },
      {
        id: "exec_3",
        text: "What does my current life phase indicate right now?",
        textTamil: "எனது தற்போதைய வாழ்க்கை கட்டம் எதை உணர்த்துகிறது?",
        category: QUESTION_CATEGORIES.TIMING,
        priority: 3,
        requiredData: ["currentLifePhase"]
      },
      {
        id: "exec_4",
        text: "How sensitive is my chart to small birth time changes?",
        textTamil: "பிறந்த நேரத்தின் சிறிய மாற்றங்களுக்கு எனது ஜாதகம் எவ்வளவு உணர்திறன் கொண்டது?",
        category: QUESTION_CATEGORIES.TECHNICAL,
        priority: 4,
        requiredData: ["birthTimeReliability"]
      },
      {
        id: "exec_5",
        text: "What are the key caution windows I should keep in mind?",
        textTamil: "நான் நினைவில் கொள்ள வேண்டிய முக்கிய எச்சரிக்கை காலங்கள் எவை?",
        category: QUESTION_CATEGORIES.TIMING,
        priority: 5,
        requiredData: ["keyCautions"]
      }
    ]
  },

  blueprint: {
    sectionId: "blueprint",
    label: "1. Natal Blueprint & Karmic Disposition",
    labelTamil: "1. மூல ஜாதகம் & லக்ன பலம்",
    applicableSystems: ["lahiri", "kp", "raman", "tropical"],
    templates: [
      {
        id: "bp_1",
        text: "What does my Ascendant ({ascendant}) indicate about my core temperament?",
        textTamil: "என் லக்னம் ({ascendant}) எனது குணாதிசயங்களை எவ்வாறு குறிக்கிறது?",
        category: QUESTION_CATEGORIES.UNDERSTANDING,
        priority: 1,
        requiredData: ["ascendant"]
      },
      {
        id: "bp_2",
        text: "Which planets are most influential in my natal chart?",
        textTamil: "எனது ஜாதகத்தில் மிகவும் செல்வாக்கு மிக்க கிரகங்கள் எவை?",
        category: QUESTION_CATEGORIES.PLANET,
        priority: 2,
        requiredData: ["planets"]
      },
      {
        id: "bp_3",
        text: "Are there any retrograde or combust planets in my chart and what do they mean?",
        textTamil: "என் ஜாதகத்தில் வக்ர அல்லது அஸ்தமன கிரகங்கள் உள்ளனவா, அவற்றின் பொருள் என்ன?",
        category: QUESTION_CATEGORIES.PLANET,
        priority: 3,
        requiredData: ["planets"]
      },
      {
        id: "bp_4",
        text: "What does my Jaimini Atmakaraka ({atmakaraka}) reveal about my soul mission?",
        textTamil: "எனது ஜைமினி ஆத்மகாரகன் ({atmakaraka}) ஆன்ம லட்சியத்தை எவ்வாறு விளக்குகிறார்?",
        category: QUESTION_CATEGORIES.SPIRITUAL,
        priority: 4,
        systems: ["lahiri", "raman"],
        requiredData: ["atmakaraka"]
      },
      {
        id: "bp_5",
        text: "What are the strongest planetary aspects in my chart?",
        textTamil: "என் ஜாதகத்தில் அமைந்துள்ள வலிமையான கிரகப் பார்வைகள் யாவை?",
        category: QUESTION_CATEGORIES.UNDERSTANDING,
        priority: 5,
        requiredData: ["aspectsOrDrishti"]
      }
    ]
  },

  yogas: {
    sectionId: "yogas",
    label: "2. Auspicious Vedic Yogas & Power Alignments",
    labelTamil: "2. முக்கிய யோகங்கள் & தோஷங்கள்",
    applicableSystems: ["lahiri", "raman"],
    templates: [
      {
        id: "yoga_1",
        text: "Which Vedic yogas are formed in my chart and how do they manifest?",
        textTamil: "என் ஜாதகத்தில் உருவாகும் வேத யோகங்கள் எவை மற்றும் அவை எவ்வாறு பலன் தரும்?",
        category: QUESTION_CATEGORIES.YOGA,
        priority: 1,
        requiredData: ["yogas"]
      },
      {
        id: "yoga_2",
        text: "What conditions are required for these yogas to activate?",
        textTamil: "இந்த யோகங்கள் செயல்பாட்டுக்கு வர என்ன நிபந்தனைகள் தேவை?",
        category: QUESTION_CATEGORIES.TIMING,
        priority: 2,
        requiredData: ["yogas"]
      },
      {
        id: "yoga_3",
        text: "Are there any cancellations or mitigations affecting my yogas?",
        textTamil: "எனது யோகங்களை பாதிக்கும் பங்கம் அல்லது நிவர்த்திகள் உள்ளனவா?",
        category: QUESTION_CATEGORIES.YOGA,
        priority: 3,
        requiredData: ["yogas"]
      },
      {
        id: "yoga_4",
        text: "Does my chart have Raja Yoga or Dhana Yoga combinations?",
        textTamil: "என் ஜாதகத்தில் ராஜ யோகம் அல்லது தன யோக அமைப்புகள் உள்ளதா?",
        category: QUESTION_CATEGORIES.YOGA,
        priority: 4,
        requiredData: ["yogas"]
      }
    ]
  },

  bhavas: {
    sectionId: "bhavas",
    label: "3. Complete 12 Bhavas Deep Dive",
    labelTamil: "3. 12 பாவகங்கள் விரிவான ஆய்வு",
    applicableSystems: ["lahiri", "kp", "raman", "tropical"],
    templates: [
      {
        id: "bhava_1",
        text: "Which houses in my chart are the strongest and most active?",
        textTamil: "என் ஜாதகத்தில் எந்த பாவகங்கள் மிகவும் வலுவாகவும் சுறுசுறுப்பாகவும் உள்ளன?",
        category: QUESTION_CATEGORIES.HOUSE,
        priority: 1,
        requiredData: ["bhavas"]
      },
      {
        id: "bhava_2",
        text: "Why is the 10th house important in my chart's house breakdown?",
        textTamil: "எனது பாவக ஆய்வில் 10-ம் வீடு ஏன் முக்கியமானது?",
        category: QUESTION_CATEGORIES.HOUSE,
        priority: 2,
        requiredData: ["bhavas"]
      },
      {
        id: "bhava_3",
        text: "How do house cusps and planetary house shifts (Bhava Chalit) affect my results?",
        textTamil: "பாவ சந்தி மற்றும் பாவ சலித கிரக மாற்றங்கள் எனது பலன்களை எவ்வாறு பாதிக்கின்றன?",
        category: QUESTION_CATEGORIES.TECHNICAL,
        priority: 3,
        requiredData: ["bhavas"]
      },
      {
        id: "bhava_4",
        text: "Which houses act as supporting kendras and trikonas for me?",
        textTamil: "எனக்கு ஆதரவளிக்கும் கேந்திர மற்றும் திரிகோண பாவகங்கள் எவை?",
        category: QUESTION_CATEGORIES.HOUSE,
        priority: 4,
        requiredData: ["bhavas"]
      }
    ]
  },

  health: {
    sectionId: "health",
    label: "4. Astrological Wellness & Vitality",
    labelTamil: "4. பாரம்பரிய ஜோதிட ஆரோக்கிய கூறுகள்",
    applicableSystems: ["lahiri", "kp", "raman", "tropical"],
    templates: [
      {
        id: "health_1",
        text: "What traditional astrological wellness indicators are noted in my report?",
        textTamil: "எனது அறிக்கையில் குறிப்பிடப்பட்டுள்ள பாரம்பரிய ஜோதிட ஆரோக்கியக் குறிப்புகள் யாவை?",
        category: QUESTION_CATEGORIES.HEALTH,
        priority: 1,
        requiredData: ["wellness"]
      },
      {
        id: "health_2",
        text: "Which planetary factors are linked to vitality and constitution in this analysis?",
        textTamil: "இந்த ஆய்வில் உடல் வலிமை மற்றும் தற்காப்புடன் தொடர்புடைய கிரக காரணிகள் எவை?",
        category: QUESTION_CATEGORIES.HEALTH,
        priority: 2,
        requiredData: ["wellness"]
      },
      {
        id: "health_3",
        text: "Which periods suggest paying more attention to daily wellness routines?",
        textTamil: "அன்றாட நலப் பழக்கவழக்கங்களில் கூடுதல் கவனம் செலுத்த வேண்டிய காலங்கள் எவை?",
        category: QUESTION_CATEGORIES.TIMING,
        priority: 3,
        requiredData: ["wellnessWindows"]
      },
      {
        id: "health_4",
        text: "How does the traditional 6th and 8th house analysis relate to lifestyle balance?",
        textTamil: "பாரம்பரிய 6 மற்றும் 8-ம் பாவக ஆய்வு வாழ்க்கை சமநிலையுடன் எவ்வாறு தொடர்புடையது?",
        category: QUESTION_CATEGORIES.HEALTH,
        priority: 4,
        requiredData: ["bhavas"]
      }
    ]
  },

  studies: {
    sectionId: "studies",
    label: "5. Studies & Exams Diagnostics",
    labelTamil: "5. கல்வி & மேதைமை",
    applicableSystems: ["lahiri", "kp", "raman", "tropical"],
    templates: [
      {
        id: "study_1",
        text: "What does my chart indicate about higher education and learning style?",
        textTamil: "உயர்கல்வி மற்றும் கற்றல் பாணி பற்றி என் ஜாதகம் என்ன காட்டுகிறது?",
        category: QUESTION_CATEGORIES.EDUCATION,
        priority: 1,
        requiredData: ["education"]
      },
      {
        id: "study_2",
        text: "Which academic fields are well-aligned with my 4th and 5th house indicators?",
        textTamil: "4 மற்றும் 5-ம் பாவகக் குறிப்புகளுடன் பொருந்தக்கூடிய கல்வித் துறைகள் எவை?",
        category: QUESTION_CATEGORIES.EDUCATION,
        priority: 2,
        requiredData: ["education"]
      },
      {
        id: "study_3",
        text: "What does the report say about competitive examinations and mental focus?",
        textTamil: "போட்டித் தேர்வுகள் மற்றும் மனக் கவனம் பற்றி அறிக்கை என்ன கூறுகிறது?",
        category: QUESTION_CATEGORIES.EDUCATION,
        priority: 3,
        requiredData: ["education"]
      },
      {
        id: "study_4",
        text: "Which planetary periods support academic milestones according to the report?",
        textTamil: "கல்வி மைல்கற்களுக்கு ஆதரவளிக்கும் கிரக காலங்கள் எவை?",
        category: QUESTION_CATEGORIES.TIMING,
        priority: 4,
        requiredData: ["educationWindows"]
      }
    ]
  },

  career: {
    sectionId: "career",
    label: "6. Career & Vocations Momentum",
    labelTamil: "6. தொழில் & தலைமை",
    applicableSystems: ["lahiri", "kp", "raman", "tropical"],
    templates: [
      {
        id: "career_1",
        text: "What does my report indicate about career growth and professional momentum?",
        textTamil: "என் தொழில் வளர்ச்சி மற்றும் முன்னேற்றம் பற்றி அறிக்கை என்ன கூறுகிறது?",
        category: QUESTION_CATEGORIES.CAREER,
        priority: 1,
        requiredData: ["career"]
      },
      {
        id: "career_2",
        text: "Which periods are highlighted as supportive for career transitions or growth?",
        textTamil: "தொழில் மாற்றம் அல்லது வளர்ச்சிக்கு உகந்த காலங்களாக எவை சுட்டிக்காட்டப்படுகின்றன?",
        category: QUESTION_CATEGORIES.TIMING,
        priority: 2,
        requiredData: ["careerWindows"]
      },
      {
        id: "career_3",
        text: "Which planets and houses are most influential in shaping my professional path?",
        textTamil: "என் தொழில் பாதையை வடிவமைப்பதில் எந்த கிரகங்களும் பாவகங்களும் அதிக செல்வாக்கு செலுத்துகின்றன?",
        category: QUESTION_CATEGORIES.CAREER,
        priority: 3,
        requiredData: ["career"]
      },
      {
        id: "career_4",
        text: "What does the Dashamsha (D10) divisional chart indicate for my vocation?",
        textTamil: "தசாம்சம் (D10) வர்க்க சக்கரம் எனது தொழில் பற்றி என்ன குறிக்கிறது?",
        category: QUESTION_CATEGORIES.CAREER,
        priority: 4,
        systems: ["lahiri", "raman"],
        requiredData: ["d10"]
      },
      {
        id: "career_5",
        text: "What does my 10th cusp sub lord ({tenthCuspSubLord}) indicate in the KP analysis?",
        textTamil: "கே.பி. ஆய்வில் எனது 10-ம் பாவ உப அதிபதி ({tenthCuspSubLord}) எதை உணர்த்துகிறார்?",
        category: QUESTION_CATEGORIES.KP,
        priority: 5,
        systems: ["kp"],
        requiredData: ["tenthCuspSubLord"]
      }
    ]
  },

  property: {
    sectionId: "property",
    label: "7. Property & Vehicles (Bhoomi & Vahana)",
    labelTamil: "7. பூமி & சொத்து யோகம்",
    applicableSystems: ["lahiri", "kp", "raman", "tropical"],
    templates: [
      {
        id: "prop_1",
        text: "What does the report indicate about real estate and property ownership?",
        textTamil: "சொத்து மற்றும் பூமி யோகம் பற்றி அறிக்கை என்ன கூறுகிறது?",
        category: QUESTION_CATEGORIES.PROPERTY,
        priority: 1,
        requiredData: ["property"]
      },
      {
        id: "prop_2",
        text: "Which timing windows are supportive for property or vehicle acquisitions?",
        textTamil: "சொத்து அல்லது வாகனம் வாங்குவதற்கு சாதகமான காலங்கள் எவை?",
        category: QUESTION_CATEGORIES.TIMING,
        priority: 2,
        requiredData: ["propertyWindows"]
      },
      {
        id: "prop_3",
        text: "How do Mars (Bhoomi Karaka) and the 4th house influence my asset stability?",
        textTamil: "செவ்வாய் மற்றும் 4-ம் பாவக அமைப்புகள் என் சொத்து நிலைத்தன்மையை எவ்வாறு பாதிக்கின்றன?",
        category: QUESTION_CATEGORIES.PROPERTY,
        priority: 3,
        requiredData: ["property"]
      }
    ]
  },

  politics: {
    sectionId: "politics",
    label: "8. Public Leadership & Governance",
    labelTamil: "8. பொது சேவை & தலைமைத்துவ கூறுகள்",
    applicableSystems: ["lahiri", "kp", "raman", "tropical"],
    templates: [
      {
        id: "pol_1",
        text: "What public leadership or administrative qualities does my report highlight?",
        textTamil: "என் அறிக்கை என்ன பொதுத் தலைமை அல்லது நிர்வாகத் திறமைகளை முன்னிலைப்படுத்துகிறது?",
        category: QUESTION_CATEGORIES.CAREER,
        priority: 1,
        requiredData: ["leadership"]
      },
      {
        id: "pol_2",
        text: "How do Sun and Saturn interact in shaping my civic stewardship themes?",
        textTamil: "சூரியன் மற்றும் சனியின் நிலைகள் என் நிர்வாக பண்புகளை எவ்வாறு வடிவமைக்கின்றன?",
        category: QUESTION_CATEGORIES.PLANET,
        priority: 2,
        requiredData: ["planets"]
      }
    ]
  },

  relationships: {
    sectionId: "relationships",
    label: "9. Marriage & Progeny Architecture",
    labelTamil: "9. திருமணம் & குடும்பம்",
    applicableSystems: ["lahiri", "kp", "raman", "tropical"],
    templates: [
      {
        id: "rel_1",
        text: "What factors are influencing partnership and relationship dynamics in my report?",
        textTamil: "என் அறிக்கையில் உறவுகள் மற்றும் திருமண இயக்கத்தை பாதிக்கும் காரணிகள் எவை?",
        category: QUESTION_CATEGORIES.MARRIAGE,
        priority: 1,
        requiredData: ["marriage"]
      },
      {
        id: "rel_2",
        text: "Which timing windows are identified for marriage or partnership milestones?",
        textTamil: "திருமண சுப நிகழ்வுகளுக்கு சுட்டிக்காட்டப்பட்டுள்ள உகந்த காலங்கள் எவை?",
        category: QUESTION_CATEGORIES.TIMING,
        priority: 2,
        requiredData: ["marriageWindows"]
      },
      {
        id: "rel_3",
        text: "What does the 7th house and Venus dignity indicate about partner characteristics?",
        textTamil: "7-ம் வீடு மற்றும் சுக்கிரனின் நிலை வாழ்க்கைத்துணையின் இயல்புகளைப் பற்றி என்ன காட்டுகிறது?",
        category: QUESTION_CATEGORIES.MARRIAGE,
        priority: 3,
        requiredData: ["marriage"]
      },
      {
        id: "rel_4",
        text: "What does the Navamsha (D9) chart reveal about marital harmony?",
        textTamil: "நவாம்சம் (D9) சக்கரம் திருமண ஒற்றுமை பற்றி எதை வெளிப்படுத்துகிறது?",
        category: QUESTION_CATEGORIES.MARRIAGE,
        priority: 4,
        systems: ["lahiri", "raman"],
        requiredData: ["d9"]
      },
      {
        id: "rel_5",
        text: "How does the KP 7th cusp sub lord ({seventhCuspSubLord}) approach marriage timing?",
        textTamil: "கே.பி. 7-ம் பாவ உப அதிபதி ({seventhCuspSubLord}) திருமண காலத்தை எவ்வாறு அணுகுகிறார்?",
        category: QUESTION_CATEGORIES.KP,
        priority: 5,
        systems: ["kp"],
        requiredData: ["seventhCuspSubLord"]
      }
    ]
  },

  foreign: {
    sectionId: "foreign",
    label: "10. Foreign Travel & Spiritual Themes",
    labelTamil: "10. வெளிநாடு & ஆன்மீகம்",
    applicableSystems: ["lahiri", "kp", "raman", "tropical"],
    templates: [
      {
        id: "for_1",
        text: "Does my report indicate overseas travel, relocation, or cross-border connections?",
        textTamil: "என் அறிக்கையில் வெளிநாட்டுப் பயணம் அல்லது தூரதேச இடமாற்ற யோகம் உள்ளதா?",
        category: QUESTION_CATEGORIES.TRAVEL,
        priority: 1,
        requiredData: ["foreign"]
      },
      {
        id: "for_2",
        text: "What do the 9th and 12th houses suggest regarding higher philosophical pursuits?",
        textTamil: "9 மற்றும் 12-ம் பாவகங்கள் ஆன்மீக மற்றும் தத்துவ தேடல்கள் பற்றி என்ன கூறுகின்றன?",
        category: QUESTION_CATEGORIES.SPIRITUAL,
        priority: 2,
        requiredData: ["foreign"]
      }
    ]
  },

  dosha: {
    sectionId: "dosha",
    label: "11. Tridosha Balance & Constitution",
    labelTamil: "11. திரிதோஷ சமநிலை",
    applicableSystems: ["lahiri", "raman"],
    templates: [
      {
        id: "dosha_1",
        text: "What is my dominant Ayurvedic constitution (Vata, Pitta, Kapha) in the report?",
        textTamil: "அறிக்கையில் எனது முதன்மை ஆயுர்வேத சுபாவம் (வாதம், பித்தம், கபம்) என்ன?",
        category: QUESTION_CATEGORIES.HEALTH,
        priority: 1,
        requiredData: ["tridosha"]
      },
      {
        id: "dosha_2",
        text: "What elemental distribution (Fire, Earth, Air, Water) shapes my physical tendencies?",
        textTamil: "எந்த பூத சமநிலை (நெருப்பு, பூமி, காற்று, நீர்) எனது உடல் அமைப்பை வடிவமைக்கிறது?",
        category: QUESTION_CATEGORIES.HEALTH,
        priority: 2,
        requiredData: ["tridosha"]
      }
    ]
  },

  remedies: {
    sectionId: "remedies",
    label: "12. Remedies & Gem Associations",
    labelTamil: "12. பரிகாரங்கள் & ரத்தினம்",
    applicableSystems: ["lahiri", "raman"],
    templates: [
      {
        id: "rem_1",
        text: "Which traditional remedies and mantras are suggested for my functional benefics?",
        textTamil: "என் லக்ன சுப கிரகங்களுக்கு என்ன பாரம்பரிய பரிகாரங்களும் மந்திரங்களும் பரிந்துரைக்கப்பட்டுள்ளன?",
        category: QUESTION_CATEGORIES.REMEDIES,
        priority: 1,
        requiredData: ["remedies"]
      },
      {
        id: "rem_2",
        text: "Why is {primaryGemstone} recommended and are any gemstones contraindicated?",
        textTamil: "{primaryGemstone} ஏன் பரிந்துரைக்கப்படுகிறது மற்றும் தவிர்க்கப்பட வேண்டிய ரத்தினங்கள் எவை?",
        category: QUESTION_CATEGORIES.REMEDIES,
        priority: 2,
        requiredData: ["remedies"]
      },
      {
        id: "rem_3",
        text: "Which specific chart factors do these recommended remedies aim to harmonize?",
        textTamil: "பரிந்துரைக்கப்பட்ட பரிகாரங்கள் ஜாதகத்தின் எந்தக் குறிப்பிட்ட நிலைகளைச் சமன்படுத்த உதவுகின்றன?",
        category: QUESTION_CATEGORIES.REMEDIES,
        priority: 3,
        requiredData: ["remedies"]
      }
    ]
  },

  auspicious: {
    sectionId: "auspicious",
    label: "13. Auspicious Timing Principles",
    labelTamil: "13. சுப முகூர்த்த காலங்கள்",
    applicableSystems: ["lahiri", "kp", "raman", "tropical"],
    templates: [
      {
        id: "ausp_1",
        text: "What principles of auspicious timing (Muhurta) are recommended in my report?",
        textTamil: "என் அறிக்கையில் பரிந்துரைக்கப்படும் சுப முகூர்த்த கொள்கைகள் யாவை?",
        category: QUESTION_CATEGORIES.TIMING,
        priority: 1,
        requiredData: ["auspicious"]
      },
      {
        id: "ausp_2",
        text: "Which upcoming candidate windows are favorable for major endeavors?",
        textTamil: "முக்கிய முயற்சிகளுக்கு சாதகமான உத்தேச காலக்கட்டங்கள் எவை?",
        category: QUESTION_CATEGORIES.TIMING,
        priority: 2,
        requiredData: ["auspicious"]
      }
    ]
  },

  risks: {
    sectionId: "risks",
    label: "14. Caution Indicators & Timing Windows",
    labelTamil: "14. எச்சரிக்கை காலங்கள் & பரிகாரம்",
    applicableSystems: ["lahiri", "kp", "raman", "tropical"],
    templates: [
      {
        id: "risk_1",
        text: "What caution windows are identified based on planetary periods?",
        textTamil: "கிரக காலங்களின் அடிப்படையில் என்ன எச்சரிக்கை காலங்கள் அடையாளம் காணப்பட்டுள்ளன?",
        category: QUESTION_CATEGORIES.TIMING,
        priority: 1,
        requiredData: ["riskMatrix"]
      },
      {
        id: "risk_2",
        text: "What protective measures and mindfulness practices does the report recommend?",
        textTamil: "அறிக்கை என்ன தற்காப்பு நடவடிக்கைகளையும் எச்சரிக்கை அணுகுமுறையையும் பரிந்துரைக்கிறது?",
        category: QUESTION_CATEGORIES.REMEDIES,
        priority: 2,
        requiredData: ["riskMatrix"]
      }
    ]
  },

  timeline: {
    sectionId: "timeline",
    label: "15. Complete Vimshottari Timeline (0–120 Yrs)",
    labelTamil: "15. விம்சோத்தரி தசா காலக்கோடு (0-120 ஆண்டு)",
    applicableSystems: ["lahiri", "kp", "raman"],
    templates: [
      {
        id: "time_1",
        text: "What is my current Mahadasha ({currentMahadasha}) and Antardasha ({currentAntardasha})?",
        textTamil: "என் தற்போதைய மகா தசை ({currentMahadasha}) மற்றும் அந்தர்தசை ({currentAntardasha}) என்ன?",
        category: QUESTION_CATEGORIES.DASHA,
        priority: 1,
        requiredData: ["currentMahadasha"]
      },
      {
        id: "time_2",
        text: "What major themes are highlighted during this {currentMahadasha}–{currentAntardasha} period?",
        textTamil: "இந்த {currentMahadasha}–{currentAntardasha} காலக்கட்டத்தில் என்ன முக்கிய தலைப்புகள் சுட்டிக்காட்டப்படுகின்றன?",
        category: QUESTION_CATEGORIES.TIMING,
        priority: 2,
        requiredData: ["currentMahadasha", "currentAntardasha"]
      },
      {
        id: "time_3",
        text: "What transition will occur when my next Antardasha starts?",
        textTamil: "எனது அடுத்த புக்தி தொடங்கும் போது என்ன மாற்றங்கள் ஏற்படும்?",
        category: QUESTION_CATEGORIES.TIMING,
        priority: 3,
        requiredData: ["dashaTable"]
      },
      {
        id: "time_4",
        text: "How do active planetary transits interact with my current dasha stage?",
        textTamil: "நடப்பு கோச்சாரப் பெயர்ச்சிகள் எனது தசா காலக்கட்டத்துடன் எவ்வாறு இணைகின்றன?",
        category: QUESTION_CATEGORIES.TRANSIT,
        priority: 4,
        requiredData: ["timelineStages"]
      }
    ]
  },

  milestoneAudit: {
    sectionId: "milestoneAudit",
    label: "16. Retrospective Milestone Verification",
    labelTamil: "16. கடந்த கால மைல்கற்கள் சரிபார்ப்பு",
    applicableSystems: ["lahiri", "raman"],
    templates: [
      {
        id: "audit_1",
        text: "How do calculated retrospective candidate windows correlate with my past life events?",
        textTamil: "கணக்கிடப்பட்ட கடந்த கால உத்தேச மைல்கற்கள் என் முந்தைய வாழ்க்கை நிகழ்வுகளுடன் எவ்வாறு பொருந்துகின்றன?",
        category: QUESTION_CATEGORIES.EVIDENCE,
        priority: 1,
        requiredData: ["retrospectiveAudit"]
      },
      {
        id: "audit_2",
        text: "Why is retrospective verification useful for evaluating astrological alignment?",
        textTamil: "ஜோதிட ஒத்திசைவை மதிப்பீடு செய்ய கடந்த கால சரிபார்ப்பு ஏன் பயனுள்ளதாக இருக்கிறது?",
        category: QUESTION_CATEGORIES.UNDERSTANDING,
        priority: 2,
        requiredData: ["retrospectiveAudit"]
      }
    ]
  },

  reasoningDossier: {
    sectionId: "reasoningDossier",
    label: "17. Astrologer Evidence Dossier",
    labelTamil: "17. ஜோதிட ஆதார சங்கிலி (Astrologer Dossier)",
    applicableSystems: ["lahiri", "raman"],
    templates: [
      {
        id: "dossier_1",
        text: "What 9-layer evidence chain supports the career conclusions in my report?",
        textTamil: "என் அறிக்கையின் தொழில் முடிவுகளுக்கு என்ன 9-அடுக்கு சான்றாதாரச் சங்கிலி ஆதரவளிக்கிறது?",
        category: QUESTION_CATEGORIES.EVIDENCE,
        priority: 1,
        requiredData: ["reasoningChain"]
      },
      {
        id: "dossier_2",
        text: "Which findings in the report have the highest multi-factor convergence?",
        textTamil: "அறிக்கையில் உள்ள எந்த பலன்கள் பல காரணி ஒருமுகப்பாட்டைக் கொண்டுள்ளன?",
        category: QUESTION_CATEGORIES.EVIDENCE,
        priority: 2,
        requiredData: ["evidenceLedger"]
      },
      {
        id: "dossier_3",
        text: "How does the report reconcile opposing planetary indications?",
        textTamil: "எதிர்மறையான கிரக அமைப்புகளை அறிக்கை எவ்வாறு சமன் செய்கிறது?",
        category: QUESTION_CATEGORIES.EVIDENCE,
        priority: 3,
        requiredData: ["contradictionReconciliation"]
      }
    ]
  },

  technicalAppendix: {
    sectionId: "technicalAppendix",
    label: "18. Technical Calculation Appendix",
    labelTamil: "18. தொழில்நுட்ப கணக்கீட்டு பிற்சேர்க்கை",
    applicableSystems: ["lahiri", "kp", "raman", "tropical"],
    templates: [
      {
        id: "tech_1",
        text: "Which ayanamsha and coordinate conventions were used to calculate my chart?",
        textTamil: "என் ஜாதகத்தை கணக்கிட எந்த அயனாம்சம் மற்றும் ஆயத்தொலைவு முறை பயன்படுத்தப்பட்டது?",
        category: QUESTION_CATEGORIES.TECHNICAL,
        priority: 1,
        requiredData: ["system"]
      },
      {
        id: "tech_2",
        text: "Which house division system is being applied in this report?",
        textTamil: "இந்த அறிக்கையில் எந்த பாவகப் பிரிவு முறை பயன்படுத்தப்படுகிறது?",
        category: QUESTION_CATEGORIES.TECHNICAL,
        priority: 2,
        requiredData: ["houseSystem"]
      },
      {
        id: "tech_3",
        text: "How does the 6-fold Shadbala virupa breakdown evaluate planetary strengths?",
        textTamil: "6-வகை ஷட்பல விருபா ஆய்வு கிரக வலிமையை எவ்வாறு அளவிடுகிறது?",
        category: QUESTION_CATEGORIES.TECHNICAL,
        priority: 3,
        systems: ["lahiri", "raman"],
        requiredData: ["shadbala"]
      },
      {
        id: "tech_4",
        text: "What does the 337-Bindu Sarvashtakavarga (SAV) distribution indicate?",
        textTamil: "337-பிந்து சர்வாஷ்டகவர்க்க (SAV) பகிர்வு எதை உணர்த்துகிறது?",
        category: QUESTION_CATEGORIES.TECHNICAL,
        priority: 4,
        systems: ["lahiri", "raman"],
        requiredData: ["ashtakavarga"]
      }
    ]
  },

  multiSystemComparison: {
    sectionId: "multiSystemComparison",
    label: "19. Multi-System Comparative Analysis",
    labelTamil: "19. பல ஜோதிட முறைகளின் ஒப்பீடு",
    applicableSystems: ["lahiri", "kp", "raman", "tropical"],
    templates: [
      {
        id: "comp_1",
        text: "Why do Lahiri, KP, Raman, and Tropical show different planetary positions?",
        textTamil: "லஹிரி, கே.பி., ராமன் மற்றும் சாயன முறைகள் ஏன் மாறுபட்ட கிரக நிலைகளைக் காட்டுகின்றன?",
        category: QUESTION_CATEGORIES.SYSTEM_COMPARISON,
        priority: 1,
        requiredData: ["multiSystemComparison"]
      },
      {
        id: "comp_2",
        text: "Which planets change zodiac signs between the Sidereal and Tropical calculations?",
        textTamil: "நிரயன மற்றும் சாயன கணக்கீடுகளுக்கு இடையே எந்த கிரகங்கள் ராசி மாறுகின்றன?",
        category: QUESTION_CATEGORIES.SYSTEM_COMPARISON,
        priority: 2,
        requiredData: ["multiSystemComparison"]
      },
      {
        id: "comp_3",
        text: "How does KP house division differ from Whole Sign houses for my chart?",
        textTamil: "என் ஜாதகத்தில் முழு ராசி பாவகங்களில் இருந்து கே.பி. பாவகப் பிரிவு எவ்வாறு வேறுபடுகிறது?",
        category: QUESTION_CATEGORIES.SYSTEM_COMPARISON,
        priority: 3,
        requiredData: ["multiSystemComparison"]
      },
      {
        id: "comp_4",
        text: "What are the core technical differences between Lahiri and Raman ayanamshas?",
        textTamil: "லஹிரி மற்றும் ராமன் அயனாம்சங்களுக்கு இடையிலான முக்கிய தொழில்நுட்ப வேறுபாடுகள் யாவை?",
        category: QUESTION_CATEGORIES.SYSTEM_COMPARISON,
        priority: 4,
        requiredData: ["multiSystemComparison"]
      }
    ]
  },

  fullReport: {
    sectionId: "fullReport",
    label: "Full Report General Follow-Up",
    labelTamil: "முழு அறிக்கை பொதுவான கேள்விகள்",
    applicableSystems: ["lahiri", "kp", "raman", "tropical"],
    templates: [
      {
        id: "full_1",
        text: "What are the three most important themes in my overall report?",
        textTamil: "என் முழு அறிக்கையில் உள்ள மிக முக்கியமான மூன்று தலைப்புகள் எவை?",
        category: QUESTION_CATEGORIES.GENERAL,
        priority: 1,
        requiredData: ["coreProfile"]
      },
      {
        id: "full_2",
        text: "What should I understand first from this report?",
        textTamil: "இந்த அறிக்கையிலிருந்து நான் முதலில் புரிந்து கொள்ள வேண்டியது என்ன?",
        category: QUESTION_CATEGORIES.GENERAL,
        priority: 2,
        requiredData: ["coreProfile"]
      },
      {
        id: "full_3",
        text: "What does my current dasha ({currentMahadasha}) indicate across my life domains?",
        textTamil: "என் நடப்பு தசை ({currentMahadasha}) வாழ்வின் பல்வேறு பகுதிகளில் எதை உணர்த்துகிறது?",
        category: QUESTION_CATEGORIES.TIMING,
        priority: 3,
        systems: ["lahiri", "kp", "raman"],
        requiredData: ["currentMahadasha"]
      },
      {
        id: "full_4",
        text: "Which findings have the strongest multi-factor evidence in the report?",
        textTamil: "அறிக்கையில் பல காரணிகளால் வலுவாக ஆதரிக்கப்படும் முடிவுகள் எவை?",
        category: QUESTION_CATEGORIES.EVIDENCE,
        priority: 4,
        requiredData: ["evidenceLedger"]
      },
      {
        id: "full_5",
        text: "What are the upcoming milestone timing windows highlighted in the report?",
        textTamil: "அறிக்கையில் சுட்டிக்காட்டப்பட்டுள்ள அடுத்தடுத்த முக்கிய சுப காலங்கள் எவை?",
        category: QUESTION_CATEGORIES.TIMING,
        priority: 5,
        requiredData: ["masterPredictions"]
      },
      {
        id: "full_6",
        text: "Which life areas require more patience or attention according to the report?",
        textTamil: "அறிக்கையின்படி எந்த வாழ்க்கை துறைகளில் கூடுதல் பொறுமையும் கவனமும் தேவை?",
        category: QUESTION_CATEGORIES.GENERAL,
        priority: 6,
        requiredData: ["riskMatrix"]
      },
      {
        id: "full_7",
        text: "How do the different sections of the report connect with each other?",
        textTamil: "அறிக்கையின் வெவ்வேறு பகுதிகள் எவ்வாறு ஒன்றோடொன்று இணைகின்றன?",
        category: QUESTION_CATEGORIES.UNDERSTANDING,
        priority: 7,
        requiredData: ["coreProfile"]
      },
      {
        id: "full_8",
        text: "How does the selected system ({systemName}) shape the interpretations in this report?",
        textTamil: "தேர்ந்தெடுக்கப்பட்ட ஜோதிட முறை ({systemName}) இந்த அறிக்கையின் விளக்கங்களை எவ்வாறு தீர்மானிக்கிறது?",
        category: QUESTION_CATEGORIES.SYSTEM_COMPARISON,
        priority: 8,
        requiredData: ["system"]
      }
    ]
  }
};

/**
 * Returns configuration for a section, falling back to fullReport if "all" or unknown
 */
export function getFollowUpConfigForSection(sectionId = "fullReport") {
  if (!sectionId || sectionId === "all") {
    return FOLLOW_UP_SECTIONS_CONFIG.fullReport;
  }
  return FOLLOW_UP_SECTIONS_CONFIG[sectionId] || FOLLOW_UP_SECTIONS_CONFIG.fullReport;
}
