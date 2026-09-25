/**
 * ASTROVERSE — Canonical 19-Chapter Report Architecture
 *
 * Defines the structural schema for comprehensive astrological reports,
 * ensuring strict synchronization across the deterministic engine, UI tabs,
 * AI prompt generators, and multi-system comparison views.
 */

export const REPORT_CHAPTERS = [
  {
    id: "ch1_executive_summary",
    chapterNumber: 1,
    title: "1. Executive Summary & Astro-Identity",
    titleTamil: "1. முதன்மை சுருக்கம் & ஜோதிட அடையாளம்",
    description: "Holistic core astrological identity, core profile, and cross-domain snapshot.",
    systems: ["lahiri", "kp", "raman", "tropical"]
  },
  {
    id: "ch2_panchanga",
    chapterNumber: 2,
    title: "2. Panchanga & Temporal Dynamics",
    titleTamil: "2. பஞ்சாங்கம் & கால இயக்கவியல்",
    description: "Five limbs of time: Tithi, Vara, Nakshatra, Yoga, Karana, plus Sunrise/Sunset & Solar Day.",
    systems: ["lahiri", "kp", "raman"]
  },
  {
    id: "ch3_rasi_chart",
    chapterNumber: 3,
    title: "3. Rasi Chart & Planetary Status",
    titleTamil: "3. ராசி சக்கரம் & கிரக நிலைகள்",
    description: "Detailed zodiacal positions, signs, degrees, combustion, retrogradation, and dispositor trees.",
    systems: ["lahiri", "kp", "raman", "tropical"]
  },
  {
    id: "ch4_bhava_chalit",
    chapterNumber: 4,
    title: "4. Bhava Chalit & House Analysis",
    titleTamil: "4. பாவ சலிதம் & வீடுகளின் ஆய்வு",
    description: "Cuspal house positions, sandhis, midpoints, and Placidus / Sripati house comparisons.",
    systems: ["lahiri", "kp", "raman", "tropical"]
  },
  {
    id: "ch5_vargas",
    chapterNumber: 5,
    title: "5. Complete Divisional Charts (Vargas D1–D60)",
    titleTamil: "5. வர்க்க சக்கரங்கள் (D1–D60)",
    description: "16 classical Shodashavargas including Navamsha (D9) and Shashtiamsha (D60) with deities.",
    systems: ["lahiri", "raman"]
  },
  {
    id: "ch6_shadbala",
    chapterNumber: 6,
    title: "6. Planetary Strengths & Shadbala Suite",
    titleTamil: "6. ஷட்பலம் & கிரக பலம்",
    description: "Six-fold planetary strength assessment: Sthana, Dig, Kala, Chesta, Naisargika, and Drik Bala.",
    systems: ["lahiri", "raman"]
  },
  {
    id: "ch7_ashtakavarga",
    chapterNumber: 7,
    title: "7. Ashtakavarga Dynamics & Transit BAV",
    titleTamil: "7. அஷ்டகவர்க்கம் & கோச்சார பரல்கள்",
    description: "Bhinnashtakavarga (BAV), Samudayashtakavarga (SAV - 337 bindus), and Kakshya transit analysis.",
    systems: ["lahiri", "raman"]
  },
  {
    id: "ch8_jaimini",
    chapterNumber: 8,
    title: "8. Jaimini Astrology & Chara Karakas",
    titleTamil: "8. ஜைமினி ஜோதிடம் & காரகங்கள்",
    description: "7-karaka system (Atmakaraka to Darakaraka), Arudha Lagna (AL), and Upapada Lagna (UL).",
    systems: ["lahiri", "raman"]
  },
  {
    id: "ch9_avasthas",
    chapterNumber: 9,
    title: "9. Planetary Avasthas & Subtle Dignity",
    titleTamil: "9. அவஸ்தைகள் & சூட்சும பலன்கள்",
    description: "Baladi (infant to dead) and Jagradadi (awake, dreaming, sleeping) psychological states.",
    systems: ["lahiri", "raman"]
  },
  {
    id: "ch10_dasha",
    chapterNumber: 10,
    title: "10. Vimshottari Dasha Suite & Timing",
    titleTamil: "10. விம்சோத்தரி தசா-புக்தி கால அட்டவணை",
    description: "120-year cycle breakdown: Maha Dasha, Antardasha, Pratyantardasha with precise transition dates.",
    systems: ["lahiri", "kp", "raman"]
  },
  {
    id: "ch11_career",
    chapterNumber: 11,
    title: "11. Career, Vocation & Financial Dynamics",
    titleTamil: "11. தொழில், வருமானம் & நிதி நிலை",
    description: "10th house, 2nd/11th wealth houses, D10 Dashamsha status, and professional trajectories.",
    systems: ["lahiri", "kp", "raman", "tropical"]
  },
  {
    id: "ch12_matrimony",
    chapterNumber: 12,
    title: "12. Matrimonial Compatibility & Relationship Architecture",
    titleTamil: "12. திருமண பொருத்தம் & களத்திர வாழ்க்கை",
    description: "7th house, Venus/Jupiter dynamics, D9 Navamsha, Upapada, and curated timing windows.",
    systems: ["lahiri", "kp", "raman", "tropical"]
  },
  {
    id: "ch13_health",
    chapterNumber: 13,
    title: "13. Health, Vitality & Traditional Astrological Indicators",
    titleTamil: "13. உடல் நலம், ஆயுள் & பாரம்பரிய ஜோதிடக் குறிப்புகள்",
    description: "Traditional astrological indicators for vitality, 6th/8th/12th house dynamics, and seasonal lifestyle wellness.",
    systems: ["lahiri", "kp", "raman", "tropical"]
  },
  {
    id: "ch14_transits",
    chapterNumber: 14,
    title: "14. Auspicious Timelines & Transit Forecasts",
    titleTamil: "14. கோச்சார பலன்கள் & சுப கால கட்டங்கள்",
    description: "Gochar transit impacts of Saturn (Sade Sati), Jupiter, Rahu-Ketu, and lifecycle milestones.",
    systems: ["lahiri", "kp", "raman", "tropical"]
  },
  {
    id: "ch15_remedies",
    chapterNumber: 15,
    title: "15. Vedic Remedial Architecture & Gemstones",
    titleTamil: "15. பரிகாரங்கள், ரத்தினங்கள் & வழிபாடுகள்",
    description: "Gemstones (Ratna), Mantras, Danas, and ethical behavioral remedies based on functional nature.",
    systems: ["lahiri", "raman"]
  },
  {
    id: "ch16_palmistry",
    chapterNumber: 16,
    title: "16. Palmistry & Samudrika Shastra",
    titleTamil: "16. சாமுத்ரிக லட்சணம் & கைரேகை குறிப்புகள்",
    description: "Classical Samudrika principles correlating palm mounts and lines to planetary dignities.",
    systems: ["lahiri", "kp", "raman", "tropical"]
  },
  {
    id: "ch17_evidence",
    chapterNumber: 17,
    title: "17. Astrologer Evidence Dossier",
    titleTamil: "17. ஜோதிட சான்றுகள் தொகுப்பு",
    description: "9-level verifiable prediction reasoning chains across career, marriage, wealth, and health.",
    systems: ["lahiri", "raman"]
  },
  {
    id: "ch18_technical_appendix",
    chapterNumber: 18,
    title: "18. Technical Calculation Appendix",
    titleTamil: "18. தொழில்நுட்ப கணக்கீட்டு பிற்சேர்க்கை",
    description: "Authoritative raw tables: 9-graha coordinates, dispositors, Shadbala breakdown, and 337-SAV matrix.",
    systems: ["lahiri", "kp", "raman", "tropical"]
  },
  {
    id: "ch19_multisystem_comparison",
    chapterNumber: 19,
    title: "19. Multi-System Comparative Analysis",
    titleTamil: "19. பல ஜோதிட முறைகளின் ஒப்பீட்டு ஆய்வு",
    description: "Rigorous side-by-side comparison of Lahiri, KP, Raman, and Tropical systems with agreement metrics.",
    systems: ["lahiri", "kp", "raman", "tropical"]
  }
];

export function getChaptersForSystem(systemId = "lahiri") {
  const norm = (systemId || "lahiri").toLowerCase();
  return REPORT_CHAPTERS.filter(ch => ch.systems.includes(norm));
}

export function getChapterById(chapterId) {
  return REPORT_CHAPTERS.find(ch => ch.id === chapterId);
}
