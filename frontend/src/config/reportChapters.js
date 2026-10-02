/**
 * ASTROVERSE — Canonical 19-Chapter Report Architecture
 *
 * Defines the structural schema for comprehensive astrological reports,
 * ensuring strict synchronization across the deterministic engine, UI tabs,
 * AI prompt generators, and multi-system comparison views.
 */

export const EXECUTIVE_SUMMARY_CHAPTER = {
  id: "execSummary",
  chapterNumber: 0,
  title: "0. Executive Summary & Astro-Identity",
  titleTamil: "0. நிர்வாக சுருக்கம் & ஜோதிட அடையாளம்",
  description: "Holistic core astrological identity, core profile, and cross-domain snapshot.",
  systems: ["lahiri", "kp", "raman", "tropical"]
};

export const REPORT_CHAPTERS = [
  {
    id: "blueprint",
    chapterNumber: 1,
    title: "1. Natal Blueprint & Karmic Disposition",
    titleTamil: "1. மூல ஜாதகம் & லக்ன பலம்",
    description: "Detailed zodiacal positions, signs, degrees, combustion, retrogradation, and dispositor trees.",
    systems: ["lahiri", "kp", "raman", "tropical"]
  },
  {
    id: "yogas",
    chapterNumber: 2,
    title: "2. Auspicious Vedic Yogas & Power Alignments",
    titleTamil: "2. முக்கிய யோகங்கள் & தோஷங்கள்",
    description: "Classical Parashari and Jaimini yogas, Raja Yogas, Dhana Yogas, and cancellation rules.",
    systems: ["lahiri", "raman"]
  },
  {
    id: "bhavas",
    chapterNumber: 3,
    title: "3. Complete 12 Bhavas Deep Dive",
    titleTamil: "3. 12 பாவகங்கள் விரிவான ஆய்வு",
    description: "Cuspal house positions, sandhis, midpoints, and Placidus / Sripati house comparisons.",
    systems: ["lahiri", "kp", "raman", "tropical"]
  },
  {
    id: "health",
    chapterNumber: 4,
    title: "4. Astrological Wellness & Vitality",
    titleTamil: "4. பாரம்பரிய ஜோதிட ஆரோக்கிய கூறுகள்",
    description: "Traditional astrological indicators for vitality, 6th/8th/12th house dynamics, and lifestyle wellness.",
    systems: ["lahiri", "kp", "raman", "tropical"]
  },
  {
    id: "studies",
    chapterNumber: 5,
    title: "5. Studies & Exams Diagnostics",
    titleTamil: "5. கல்வி & மேதைமை",
    description: "Academic potential, 4th/5th house analysis, Mercury/Jupiter dignity, and examination cycles.",
    systems: ["lahiri", "kp", "raman", "tropical"]
  },
  {
    id: "career",
    chapterNumber: 6,
    title: "6. Career & Vocations Momentum",
    titleTamil: "6. தொழில் & தலைமை",
    description: "10th house, 2nd/11th wealth houses, D10 Dashamsha status, and professional trajectories.",
    systems: ["lahiri", "kp", "raman", "tropical"]
  },
  {
    id: "property",
    chapterNumber: 7,
    title: "7. Property & Vehicles (Bhoomi & Vahana)",
    titleTamil: "7. பூமி & சொத்து யோகம்",
    description: "4th house landed assets, real estate dynamics, D4 Chaturthamsha, and acquisition timing.",
    systems: ["lahiri", "kp", "raman", "tropical"]
  },
  {
    id: "politics",
    chapterNumber: 8,
    title: "8. Public Leadership & Governance",
    titleTamil: "8. பொது சேவை & தலைமைத்துவ கூறுகள்",
    description: "Sun, Mars, 10th house authority indicators, institutional influence, and civic stewardship.",
    systems: ["lahiri", "kp", "raman", "tropical"]
  },
  {
    id: "relationships",
    chapterNumber: 9,
    title: "9. Marriage & Progeny Architecture",
    titleTamil: "9. திருமணம் & குடும்பம்",
    description: "7th house, Venus/Jupiter dynamics, D9 Navamsha, Upapada, and curated timing windows.",
    systems: ["lahiri", "kp", "raman", "tropical"]
  },
  {
    id: "foreign",
    chapterNumber: 10,
    title: "10. Foreign Travel & Spiritual Themes",
    titleTamil: "10. வெளிநாடு & ஆன்மீகம்",
    description: "9th and 12th house overseas indicators, relocation dynamics, and spiritual liberation (Moksha).",
    systems: ["lahiri", "kp", "raman", "tropical"]
  },
  {
    id: "dosha",
    chapterNumber: 11,
    title: "11. Tridosha Balance & Constitution",
    titleTamil: "11. திரிதோஷ சமநிலை",
    description: "Traditional Ayurvedic Vata-Pitta-Kapha elemental balance and lifestyle harmony.",
    systems: ["lahiri", "raman"]
  },
  {
    id: "remedies",
    chapterNumber: 12,
    title: "12. Remedies & Gem Associations",
    titleTamil: "12. பரிகாரங்கள் & ரத்தினம்",
    description: "Gemstones (Ratna), Mantras, Danas, and ethical behavioral remedies based on functional nature.",
    systems: ["lahiri", "raman"]
  },
  {
    id: "auspicious",
    chapterNumber: 13,
    title: "13. Auspicious Timing Principles",
    titleTamil: "13. சுப முகூர்த்த காலங்கள்",
    description: "Muhurta principles, Panchanga temporal quality, and favorable milestone windows.",
    systems: ["lahiri", "kp", "raman", "tropical"]
  },
  {
    id: "risks",
    chapterNumber: 14,
    title: "14. Caution Indicators & Timing Windows",
    titleTamil: "14. எச்சரிக்கை காலங்கள் & பரிகாரம்",
    description: "Traditional caution periods, Sade Sati, Maraka periods, and proactive remedial discipline.",
    systems: ["lahiri", "kp", "raman", "tropical"]
  },
  {
    id: "timeline",
    chapterNumber: 15,
    title: "15. Complete Vimshottari Timeline (0–120 Yrs)",
    titleTamil: "15. விம்சோத்தரி தசா காலக்கோடு (0-120 ஆண்டு)",
    description: "120-year cycle breakdown: Maha Dasha, Antardasha, Pratyantardasha with precise transition dates.",
    systems: ["lahiri", "kp", "raman"]
  },
  {
    id: "milestoneAudit",
    chapterNumber: 16,
    title: "16. Retrospective Milestone Candidate Audit",
    titleTamil: "16. கடந்த கால மைல்கற்கள் வேட்பாளர் தணிக்கை",
    description: "Historical retrospective checkpoints and candidate timing windows audited against documented or native life milestones.",
    systems: ["lahiri", "raman"]
  },
  {
    id: "reasoningDossier",
    chapterNumber: 17,
    title: "17. Astrologer Evidence Dossier",
    titleTamil: "17. ஜோதிட ஆதார சங்கிலி (Astrologer Dossier)",
    description: "9-level verifiable prediction reasoning chains across career, marriage, wealth, and health.",
    systems: ["lahiri", "raman"]
  },
  {
    id: "technicalAppendix",
    chapterNumber: 18,
    title: "18. Technical Calculation Appendix",
    titleTamil: "18. தொழில்நுட்ப கணக்கீட்டு பிற்சேர்க்கை",
    description: "Authoritative raw tables: 9-graha coordinates, dispositors, Shadbala breakdown, and 337-SAV matrix.",
    systems: ["lahiri", "kp", "raman", "tropical"]
  },
  {
    id: "multiSystemComparison",
    chapterNumber: 19,
    title: "19. Multi-System Comparative Analysis & Synthesis",
    titleTamil: "19. பல ஜோதிட முறைகளின் ஒப்பீடு & ஒருங்கிணைப்பு",
    description: "Shared canonical astronomical observations with independent astrological transformations across Lahiri, KP, Raman, and Tropical.",
    systems: ["lahiri", "kp", "raman", "tropical"]
  }
];

export const ALL_REPORT_CHAPTERS = [EXECUTIVE_SUMMARY_CHAPTER, ...REPORT_CHAPTERS];

export function getChaptersForSystem(systemId = "lahiri") {
  const norm = (systemId || "lahiri").toLowerCase();
  return ALL_REPORT_CHAPTERS.filter(ch => ch.systems.includes(norm));
}

export function getChapterById(chapterId) {
  if (chapterId === "execSummary") return EXECUTIVE_SUMMARY_CHAPTER;
  return REPORT_CHAPTERS.find(ch => ch.id === chapterId);
}
