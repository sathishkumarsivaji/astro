/**
 * SKR ASTRO — Wellness & Vitality Rhythm Evaluator
 * =================================================
 * Evaluates personal vitality rhythms, physical energy cycles, and lifestyle restoration.
 * Strictly adheres to health safety mandates:
 * 1. Focuses purely on vitality cycles, rest periods, and routine optimization.
 * 2. Strictly prohibits clinical diagnostics, disease naming, or pathology prediction.
 * 3. Appends statutory medical notices in English and Tamil.
 */

import { hasChartData, buildInsufficientDataAnswer } from "../../chartAccessors.js";

export function evaluateWellnessVitalityCycle({ question = "", context = {}, isTamil = false } = {}) {
  const questionId = context.questionId || "TASK_WELLNESS_VITALITY_CYCLE";

  if (!hasChartData(context)) {
    return buildInsufficientDataAnswer({
      questionId,
      intent: "WELLNESS_VITALITY_CYCLE",
      taskType: "VITALITY_RHYTHM_EVALUATION",
      isTamil,
      missingInputs: ["birthChart", "planetaryPositions"],
      traditionalMethod: "1st & 6th Bhavas, Sun & Moon Vitality Karakas",
      customDirectAnswerEn: "Insufficient birth chart data to evaluate personal vitality rhythms. A verified birth chart with calculated Ascendant and Sun/Moon placements is required.",
      customDirectAnswerTa: "உடல் சக்தி மற்றும் புத்துணர்ச்சி சுழற்சியை மதிப்பிட தேவையான பிறப்பு ஜாதகத் தரவுகள் கிடைக்கவில்லை."
    });
  }

  // Statutory Medical Disclaimer
  const statutoryNotice = {
    en: "STATUTORY MEDICAL NOTICE: Astrological evaluations represent traditional lifestyle rhythms and cyclical vitality archetypes. They NEVER diagnose, treat, prevent, or cure any medical disease or mental health condition. Always consult a licensed healthcare professional for any health concern.",
    ta: "சட்டப்பூர்வ மருத்துவ அறிவிப்பு: ஜோதிட குறிப்புகள் பாரம்பரிய வாழ்க்கை முறை மற்றும் சக்தி நிலைகளை மட்டுமே குறிக்கின்றன. இது மருத்துவ நோய் கண்டறிதல் அல்லது சிகிச்சை அல்ல. உடல்நலக் குறைபாடுகளுக்கு எப்போதும் மருத்துவரை அணுகவும்."
  };

  const directAnswer = isTamil
    ? "உங்கள் உடல் சக்தி மற்றும் புத்துணர்ச்சி நிலைகள் லக்ன பலம் (1-ம் பாவகம்), சூரியன் (உடல் உறுதி) மற்றும் சந்திரன் (மன அமைதி மற்றும் தூக்க சுழற்சி) ஆகியவற்றின் ஒருங்கிணைவை அடிப்படையாகக் கொண்டவை."
    : "Your vitality and energy rhythms are governed by your Ascendant vitality (1st house), the Sun as physical vitality significator, and the Moon for mental restoration and circadian balance.";

  const reason = isTamil
    ? "வேலைப்பளு மற்றும் மன அழுத்த காலங்களில் (6 மற்றும் 8-ம் பாவக தாக்கங்கள்) உடற்பயிற்சி, போதுமான தூக்கம் மற்றும் சீரான உணவுப் பழக்கம் உங்கள் உடல் ஆற்றலை சமநிலையில் வைத்திருக்க உதவும்."
    : "During periods of intense service or occupational strain (6th/8th house transit themes), prioritizing circadian sleep hygiene, hydration, and restorative nutrition sustains steady vitality.";

  const recommendation = {
    vitalityOrientation: "HOLISTIC_RESTORATION",
    lifestyleRhythmsEn: "Maintain regular sleep cycles, integrate stress-moderation practices, and avoid over-exertion during intense workload phases.",
    lifestyleRhythmsTa: "சீரான தூக்கம், மன அமைதிக்கான தியானம் மற்றும் அதிக பணிச்சுமையின் போது உடலுக்கு போதிய ஓய்வு அளித்தல் அவசியம்."
  };

  return {
    questionId,
    intent: "WELLNESS_VITALITY_CYCLE",
    answerState: "ANSWERED",
    directAnswer,
    reason,
    limitation: isTamil
      ? "ஜோதிட அமைப்புகள் ஒருபோதும் மருத்துவ சிகிச்சைக்கு மாற்றாகாது. எந்தவொரு உடல்நல அறிகுறிகளுக்கும் தகுதியான மருத்துவரை அணுகவும்."
      : "Astrological rhythms never substitute for clinical pathology or medical assessments. Consult healthcare professionals for physical symptoms.",
    recommendation,
    supportingClaims: [
      "1st House (Lagna / Vitality) and Solar/Lunar constitutional balance",
      "Traditional Ayurvedic lifestyle rhythm harmonization"
    ],
    limitingClaims: [
      "Zero clinical disease diagnostics or medical pathology inference.",
      statutoryNotice.en
    ],
    missingInputs: [],
    traditionalMethod: "1st & 6th Bhavas, Sun & Moon Vitality karakas, D6 Shashtamsha Context",
    statutoryNotice,
    empiricalStatus: "NOT_VALIDATED"
  };
}
