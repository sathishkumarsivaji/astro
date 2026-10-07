/**
 * ASTROVERSE — Dedicated Comparison Engine
 * ==========================================
 * Evaluates comparative questions (Option A vs Option B) using
 * deterministic multi-factor scoring, astrological significator alignment,
 * risk indicators, and evidence completeness.
 *
 * Implements Section 12 of the Precision Q&A Engine Mandate.
 */

import { buildChartFactId, buildHouseFactId, buildLordFactId } from "./evidenceGraph.js";
import { calculateMultiSystemBundle } from "../../astrology/index.js";
import { toTamilPlanet, toTamilRasi, toTamilNakshatra } from "../tamilAstrologyUtils.js";

/**
 * Deterministic DMS formatter safe for browser and Node.
 */
export function formatDms(deg) {
  if (deg == null || isNaN(deg)) return "-";
  const abs = Math.abs(deg);
  const d = Math.floor(abs);
  const minFloat = (abs - d) * 60;
  const m = Math.floor(minFloat);
  const s = Math.round((minFloat - m) * 60);
  return `${deg < 0 ? '-' : ''}${d}° ${String(m).padStart(2, '0')}' ${String(s).padStart(2, '0')}''`;
}

/**
 * Classifies whether the difference between Lahiri and KP for a specific body
 * represents a genuine astrological material boundary shift.
 */
export function classifyMaterialDifference(lahiriBody, kpBody) {
  if (!lahiriBody || !kpBody) {
    return {
      classification: "INSUFFICIENT_DATA",
      isMaterial: false,
      details: "Missing coordinate"
    };
  }

  const signChanged = Boolean(
    lahiriBody.sign && kpBody.sign &&
    lahiriBody.sign !== "N/A" && kpBody.sign !== "N/A" &&
    lahiriBody.sign.toLowerCase() !== kpBody.sign.toLowerCase()
  );

  const nakshatraChanged = Boolean(
    lahiriBody.nakshatra && kpBody.nakshatra &&
    lahiriBody.nakshatra !== "N/A" && kpBody.nakshatra !== "N/A" &&
    lahiriBody.nakshatra.toLowerCase() !== kpBody.nakshatra.toLowerCase()
  );

  const padaChanged = Boolean(
    lahiriBody.pada != null && kpBody.pada != null &&
    lahiriBody.pada !== kpBody.pada
  );

  const houseChanged = Boolean(
    lahiriBody.house != null && kpBody.house != null &&
    lahiriBody.house !== kpBody.house
  );

  let classification = "NO_MATERIAL_DIFFERENCE";
  let explanationEn = "Numerical longitude offset only; sign, nakshatra, and pada remain identical.";
  let explanationTa = "சிறிய பாகை வேறுபாடு மட்டுமே; ராசி, நட்சத்திரம் மற்றும் பாதம் மாறாமல் ஒரே அமைப்பில் உள்ளன.";

  if (signChanged) {
    classification = "SIGN_CHANGE";
    explanationEn = `Zodiac sign boundary crossed: ${lahiriBody.sign} in Lahiri vs ${kpBody.sign} in KP.`;
    explanationTa = `ராசி எல்லை மாறியுள்ளது: லஹிரியில் ${toTamilRasi(lahiriBody.sign)}, கே.பி.யில் ${toTamilRasi(kpBody.sign)}.`;
  } else if (nakshatraChanged) {
    classification = "NAKSHATRA_CHANGE";
    explanationEn = `Nakshatra boundary crossed: ${lahiriBody.nakshatra} in Lahiri vs ${kpBody.nakshatra} in KP.`;
    explanationTa = `நட்சத்திர எல்லை மாறியுள்ளது: லஹிரியில் ${toTamilNakshatra(lahiriBody.nakshatra)}, கே.பி.யில் ${toTamilNakshatra(kpBody.nakshatra)}.`;
  } else if (padaChanged) {
    classification = "PADA_CHANGE";
    explanationEn = `Nakshatra pada changed: Pada ${lahiriBody.pada} in Lahiri vs Pada ${kpBody.pada} in KP (alters D9 Navamsha).`;
    explanationTa = `நட்சத்திர பாதம் மாறியுள்ளது: லஹிரியில் பாதம் ${lahiriBody.pada}, கே.பி.யில் பாதம் ${kpBody.pada} (நவாம்ச நிலையை மாற்றுகிறது).`;
  } else if (houseChanged) {
    classification = "HOUSE_SHIFT";
    explanationEn = `House cusp shift under Placidus geometry: House ${lahiriBody.house} in Lahiri vs House ${kpBody.house} in KP Bhava Chalit.`;
    explanationTa = `பிளாசிடஸ் பாவக கணிதத்தால் பாவ சலித மாற்றம்: லஹிரியில் ${lahiriBody.house}-ம் பாவகம், கே.பி.யில் ${kpBody.house}-ம் பாவகம்.`;
  }

  const isMaterial = signChanged || nakshatraChanged || padaChanged || houseChanged;

  return {
    classification,
    isMaterial,
    signChanged,
    nakshatraChanged,
    padaChanged,
    houseChanged,
    explanationEn,
    explanationTa
  };
}

/**
 * Compares Lahiri and KP system calculations deterministically from the same birth data.
 * Adheres strictly to the Material Difference Mandate.
 */
export function compareAstrologySystems({ chart, multiSystemBundle = null, isTamil = false }) {
  if (!chart && !multiSystemBundle) {
    return {
      status: "INSUFFICIENT_DATA",
      summaryEn: "Insufficient birth data to calculate and compare astrological systems.",
      summaryTa: "ஜோதிட முறைகளை ஒப்பிட்டு கணக்கிட தேவையான பிறப்பு தரவுகள் கிடைக்கவில்லை."
    };
  }

  let bundle = multiSystemBundle;
  if (!bundle) {
    if (chart?.multiSystemBundle) {
      bundle = chart.multiSystemBundle;
    } else {
      let bDate = chart?.birthDateStr;
      if (!bDate && chart?.birthDate) {
        if (typeof chart.birthDate === "string") {
          bDate = chart.birthDate.split("T")[0];
        } else if (chart.birthDate instanceof Date) {
          bDate = chart.birthDate.toISOString().split("T")[0];
        }
      }
      if (!bDate && chart?.date) {
        if (typeof chart.date === "string") {
          bDate = chart.date.split("T")[0];
        } else if (chart.date instanceof Date) {
          bDate = chart.date.toISOString().split("T")[0];
        }
      }

      let bTime = chart?.birthTimeStr || chart?.birthTime || chart?.time || "12:00";
      if (typeof bTime === "string" && bTime.length > 5) {
        bTime = bTime.slice(0, 5);
      }

      const birthData = chart?.birthData || {
        birthDate: bDate,
        birthTime: bTime,
        latitude: chart?.birthLatitude ?? chart?.latitude ?? chart?.lat,
        longitude: chart?.birthLongitude ?? chart?.longitude ?? chart?.lng,
        timezoneId: chart?.timezoneId || chart?.tz || chart?.timezone || "Asia/Kolkata",
        utcOffset: chart?.utcOffset
      };
      if (birthData.birthDate && (birthData.latitude != null || birthData.lat != null)) {
        try {
          bundle = calculateMultiSystemBundle(birthData);
        } catch {
          bundle = null;
        }
      }
    }
  }

  const lahiriChart = bundle?.systems?.lahiri || (chart?.system?.id === "lahiri" ? chart : null);
  const kpChart = bundle?.systems?.kp || (chart?.system?.id === "kp" ? chart : null);

  if (!lahiriChart || !kpChart) {
    return {
      status: "INSUFFICIENT_DATA",
      summaryEn: "Both Lahiri and KP system charts must be calculated to evaluate comparative differences.",
      summaryTa: "இரு முறைகளின் ஒப்பீட்டை துல்லியமாக அறிய லஹிரி மற்றும் கே.பி. கணித முடிவுகள் இரண்டும் தேவை."
    };
  }

  // 1. Ayanamsha Comparison
  const lahiriAyanVal = lahiriChart.ayanamsaValue ?? lahiriChart.ayanamshaValue ?? lahiriChart.ayanamsa ?? lahiriChart.ayanamsha ?? bundle?.observations?.ayanamshas?.lahiri;
  const kpAyanVal = kpChart.ayanamsaValue ?? kpChart.ayanamshaValue ?? kpChart.ayanamsa ?? kpChart.ayanamsha ?? bundle?.observations?.ayanamshas?.kp;

  const lahiriAyanStr = lahiriAyanVal != null ? `${Number(lahiriAyanVal).toFixed(4)}° (${formatDms(lahiriAyanVal)})` : "கணக்கிடப்படவில்லை";
  const kpAyanStr = kpAyanVal != null ? `${Number(kpAyanVal).toFixed(4)}° (${formatDms(kpAyanVal)})` : "கணக்கிடப்படவில்லை";
  const ayanamshaDiff = (lahiriAyanVal != null && kpAyanVal != null)
    ? Math.abs(lahiriAyanVal - kpAyanVal)
    : null;
  const ayanamshaDiffStr = ayanamshaDiff != null
    ? `${ayanamshaDiff.toFixed(4)}° (${formatDms(ayanamshaDiff)})`
    : "கணக்கிடப்படவில்லை";

  // 2. Body Ledger Comparison
  const bodiesList = ["Ascendant", "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
  const bodyComparisons = [];
  const materialDifferences = [];

  for (const name of bodiesList) {
    let lObj = null;
    let kObj = null;

    if (name === "Ascendant") {
      const lLong = lahiriChart.ascendantLong ?? lahiriChart.ascendant?.longitude;
      const kLong = kpChart.ascendant?.longitude ?? kpChart.ascendantLong;
      lObj = {
        name,
        longitude: lLong,
        sign: lahiriChart.ascendantSign?.name ?? lahiriChart.ascendant?.signName ?? "N/A",
        house: 1,
        nakshatra: lahiriChart.ascendantNakshatra?.name ?? lahiriChart.ascendant?.nakshatra ?? "N/A",
        pada: lahiriChart.ascendantNakshatra?.pada ?? lahiriChart.ascendant?.pada ?? null,
        formatted: formatDms(lLong)
      };
      kObj = {
        name,
        longitude: kLong,
        sign: kpChart.ascendant?.signName ?? kpChart.ascendantSign?.name ?? "N/A",
        house: 1,
        nakshatra: kpChart.ascendant?.nakshatra ?? "N/A",
        pada: kpChart.ascendant?.pada ?? null,
        starLord: kpChart.ascendant?.starLord ?? "N/A",
        subLord: kpChart.ascendant?.subLord ?? "N/A",
        formatted: formatDms(kLong)
      };
    } else {
      const lP = (lahiriChart.planets || []).find(p => (p.name || p.planetName) === name);
      const kP = (kpChart.planets || []).find(p => (p.name || p.planetName) === name);
      if (lP) {
        lObj = {
          name,
          longitude: lP.long ?? lP.longitude,
          sign: lP.sign ?? lP.signName ?? "N/A",
          house: lP.house ?? null,
          nakshatra: lP.nakshatra ?? "N/A",
          pada: lP.nakshatraPada ?? lP.pada ?? null,
          formatted: formatDms(lP.long ?? lP.longitude)
        };
      }
      if (kP) {
        kObj = {
          name,
          longitude: kP.longitude ?? kP.long,
          sign: kP.signName ?? kP.sign ?? "N/A",
          house: kP.house ?? null,
          nakshatra: kP.nakshatra ?? "N/A",
          pada: kP.pada ?? null,
          starLord: kP.starLord ?? "N/A",
          subLord: kP.subLord ?? "N/A",
          formatted: formatDms(kP.longitude ?? kP.long)
        };
      }
    }

    if (lObj && kObj) {
      const mat = classifyMaterialDifference(lObj, kObj);
      const deltaDeg = Math.abs((lObj.longitude || 0) - (kObj.longitude || 0));
      const compItem = {
        name,
        lahiri: lObj,
        kp: kObj,
        deltaDeg: parseFloat(deltaDeg.toFixed(4)),
        deltaFormatted: formatDms(deltaDeg),
        ...mat
      };
      bodyComparisons.push(compItem);
      if (mat.isMaterial) {
        materialDifferences.push(compItem);
      }
    }
  }

  // 3. KP Cusps and Sub-Lords
  const kpHouses = kpChart.houses || kpChart.cusps || [];
  const cuspalSubLords = {};
  for (const h of kpHouses) {
    if (h.house != null) {
      cuspalSubLords[h.house] = {
        house: h.house,
        sign: h.signName || h.sign,
        degree: h.degreeInSign != null ? h.degreeInSign.toFixed(2) + "°" : formatDms(h.longitude),
        starLord: h.starLord,
        subLord: h.subLord,
        subSubLord: h.subSubLord
      };
    }
  }

  // 4. Formatted Direct Answers (Bilingual)
  const hasMaterial = materialDifferences.length > 0;

  // Build Table of Longitudes
  const ledgerLinesEn = bodyComparisons.map(b => 
    `• ${b.name.padEnd(9)} | Lahiri: ${b.lahiri.formatted.padEnd(14)} (${b.lahiri.sign}, H${b.lahiri.house || '-'}) | KP: ${b.kp.formatted.padEnd(14)} (${b.kp.sign}, H${b.kp.house || '-'}) | Δ: ${b.deltaFormatted}`
  );

  const ledgerLinesTa = bodyComparisons.map(b => {
    const pTa = toTamilPlanet(b.name) || b.name;
    const lSignTa = toTamilRasi(b.lahiri.sign) || b.lahiri.sign;
    const kSignTa = toTamilRasi(b.kp.sign) || b.kp.sign;
    return `• ${pTa.padEnd(10)} | லஹிரி: ${b.lahiri.formatted.padEnd(14)} (${lSignTa}, பா${b.lahiri.house || '-'}) | KP: ${b.kp.formatted.padEnd(14)} (${kSignTa}, பா${b.kp.house || '-'}) | வேறுபாடு: ${b.deltaFormatted}`;
  });

  // Boundary shifts summary
  let boundarySummaryEn = "";
  let boundarySummaryTa = "";

  if (materialDifferences.length === 0) {
    boundarySummaryEn = "No planetary or ascendant positions cross a zodiac sign, nakshatra, or pada boundary between Lahiri and KP. Therefore, there is NO material difference in signs or stars; the angular variation is strictly a minor numerical longitude offset.";
    boundarySummaryTa = "உங்கள் ஜாதகத்தில் எந்த கிரகமும் அல்லது லக்னமும் லஹிரி மற்றும் கே.பி. முறைகளுக்கு இடையே ராசி, நட்சத்திரம் அல்லது பாத எல்லையைக் கடக்கவில்லை. எனவே இதில் பொருள் சார்ந்த மாற்றம் (Material Difference) எதுவும் இல்லை; உள்ள வேறுபாடு ஒரு சிறிய கணித பாகை இடைவெளி மட்டுமே.";
  } else {
    const shiftDetailsEn = materialDifferences.map(m => `  - ${m.name}: ${m.explanationEn}`);
    const shiftDetailsTa = materialDifferences.map(m => `  - ${toTamilPlanet(m.name) || m.name}: ${m.explanationTa}`);
    boundarySummaryEn = `Material boundary shifts detected between Lahiri and KP:\n${shiftDetailsEn.join("\n")}`;
    boundarySummaryTa = `லஹிரி மற்றும் கே.பி. முறைகளுக்கு இடையே கண்டறியப்பட்ட பொருள் சார்ந்த மாற்றங்கள்:\n${shiftDetailsTa.join("\n")}`;
  }

  // Sub-Lord summary
  const sub10 = cuspalSubLords[10]?.subLord || "Not calculated";
  const sub7 = cuspalSubLords[7]?.subLord || "Not calculated";
  const sub1 = cuspalSubLords[1]?.subLord || "Not calculated";
  const l10Lord = (lahiriChart.planets || []).find(p => p.house === 10)?.name || "10th Lord";

  const subLordSummaryEn = `KP's foundational innovation is the 249 Cuspal Sub-Lord division:\n• 1st Cusp (Ascendant) Sub-Lord: ${sub1}\n• 7th Cusp (Partnership) Sub-Lord: ${sub7}\n• 10th Cusp (Career) Sub-Lord: ${sub10}\nIn classical Lahiri, events are judged primarily through the house lord (${l10Lord}) and divisional vargas (D9/D10); in KP, the Cuspal Sub-Lord dictates whether a house's promise materializes through its 4-tier star significators.`;
  const subLordSummaryTa = `KP முறையின் மிக முக்கியமான தனிச்சிறப்பு 249 பாவக உப-அதிபதி (Cuspal Sub-Lord) கணிதமாகும்:\n• 1-ம் பாவகம் (லக்னம்) உப அதிபதி: ${toTamilPlanet(sub1) || sub1}\n• 7-ம் பாவகம் (களத்திரம்) உப அதிபதி: ${toTamilPlanet(sub7) || sub7}\n• 10-ம் பாவகம் (தொழில்) உப அதிபதி: ${toTamilPlanet(sub10) || sub10}\nலஹிரியில் 10-ம் பாவாதிபதி மற்றும் D10 தசாம்ச வர்க்க பலம் முதன்மையாகப் பார்க்கப்படும் நிலையில், கே.பி.யில் 10-ம் பாவ உப அதிபதியே தொழில் காரகத்துவங்களை (2, 6, 10, 11 பாவக தொடர்புகள்) திட்டவட்டமாக நிர்ணயிக்கிறது.`;

  // Timing methodology summary
  const timingMethodologyEn = "Timing systems diverge fundamentally: Lahiri relies on classical Vimshottari Mahadasha-Antardasha cycles confirmed by Gochar transits crossing natal sign points. KP relies on the Cuspal Sub-Lord's significator activation combined with the Ruling Planets (Lagna Lord, Moon Star Lord, Day Lord) operative at the moment of query. Timing rules from one system cannot be interchanged or generalized to the other.";
  const timingMethodologyTa = "காலக்கணிப்பு முறைமையில் இரு அமைப்புகளும் வேறுபடுகின்றன: லஹிரி முறையில் விம்சோத்தரி தசா-புக்தி மற்றும் கோச்சாரப் பெயர்ச்சிகள் பாரம்பரியமாக ஆராயப்படுகின்றன; கே.பி. முறையில் உப-அதிபதி குறிக்கும் பாவக காரகத்துவங்கள் (Significators) மற்றும் ஆளும் கிரகங்கள் (Ruling Planets) கொண்டு நிகழ்வுகளின் காலக்கோடு துல்லியப்படுத்தப்படுகிறது. ஒரு அமைப்பின் காலக்கணிப்பை மற்றொன்றுக்கு பொதுமைப்படுத்தக்கூடாது.";

  // Verdict summary
  let verdictEn = "";
  let verdictTa = "";
  if (!hasMaterial) {
    verdictEn = `Verdict: No material sign or nakshatra difference exists in your natal ledger. The ${ayanamshaDiffStr} ayanamsha difference shifts longitudes slightly without crossing star boundaries. The genuine divergence lies in interpretive methodology: classical Parashari aspects and Vargas (Lahiri) vs. Placidus semi-arc cusps and Cuspal Sub-Lords (KP).`;
    verdictTa = `முடிவு: உங்கள் ஜாதகத்தில் லக்னம் மற்றும் கிரகங்களின் ராசி அல்லது நட்சத்திர அமைப்பில் பொருள் சார்ந்த மாற்றம் இல்லை. ${ayanamshaDiffStr} அயனாம்ச இடைவெளி சிறிய பாகை மாற்றத்தை மட்டுமே ஏற்படுத்துகிறது. உண்மையான வேறுபாடு பலன் காணும் முறைமையில்தான் உள்ளது: பராசர வர்க்க சக்கரங்கள் மற்றும் பார்வைகள் (லஹிரி) vs பிளாசிடஸ் பாவக ஆரம்பங்கள் மற்றும் உப அதிபதிகள் (கே.பி.).`;
  } else {
    verdictEn = `Verdict: Material differences exist in your chart due to the ${ayanamshaDiffStr} ayanamsha offset and Placidus cuspal division, altering specific planetary house placements or pada boundaries. These directly influence which houses each planet activates.`;
    verdictTa = `முடிவு: ${ayanamshaDiffStr} அயனாம்ச வேறுபாடு மற்றும் பிளாசிடஸ் பாவக ஆரம்ப கணிதத்தால் உங்கள் ஜாதகத்தில் பொருள் சார்ந்த மாற்றங்கள் (குறிப்பாக பாவ சலித இடப்பெயர்ச்சி) உள்ளன. இது கிரகங்கள் பலன் தரும் பாவக ஆதிக்கத்தை நேரடியாக மாற்றுகிறது.`;
  }

  // Full direct answers
  const directAnswerEn = [
    "When comparing the Lahiri and KP systems for your horoscope, astronomical coordinate variations and their subsequent interpretive impacts must be distinguished clearly:\n",
    `1. Ayanamsha (Precession Offset)\n• Lahiri: Chitrapaksha Ayanamsha (${lahiriAyanStr})\n• KP: Krishnamurti New Ayanamsha (${kpAyanStr})\n• Calculated difference in your chart: ${ayanamshaDiffStr}\n`,
    `2. Planetary Longitudes & Ascendant\nBoth systems are calculated from the identical birth coordinates and timestamp:\n${ledgerLinesEn.join("\n")}\n`,
    `3. Nakshatra & Pada Boundary Analysis\n${boundarySummaryEn}\n`,
    `4. KP Sub-Lord Significators\n${subLordSummaryEn}\n`,
    `5. Timing Methodology\n${timingMethodologyEn}\n`,
    `6. Conclusion\n${verdictEn}`
  ].join("\n");

  const directAnswerTa = [
    "உங்கள் ஜாதகத்தில் லஹிரி மற்றும் கே.பி. முறைகளை ஒப்பிடும்போது, கணித ரீதியாக மாறும் அம்சங்களையும், அந்த மாற்றங்கள் பலன் விளக்கத்தில் ஏற்படுத்தும் தாக்கத்தையும் தனித்தனியாக பார்க்க வேண்டும்:\n",
    `1. அயனாம்சம்\n• லஹிரி: சித்திரபக்ஷ லஹிரி அயனாம்சம் (${lahiriAyanStr})\n• கே.பி.: KP New Ayanamsha அமைப்பு (${kpAyanStr})\n• உங்கள் ஜாதகத்தில் கணக்கிடப்பட்ட actual difference: ${ayanamshaDiffStr}\n`,
    `2. கிரக நிலைகள் & லக்னம்\nஉங்கள் பிறந்த நேரம் மற்றும் இடத்தை ஒரே input ஆக வைத்து இரு முறைகளிலும் கிரகங்களின் பாகைகள் கணக்கிடப்படுகின்றன:\n${ledgerLinesTa.join("\n")}\n`,
    `3. நட்சத்திரம் / பாதம்\n${boundarySummaryTa}\n`,
    `4. கே.பி. உப அதிபதி (KP Sub-Lord)\n${subLordSummaryTa}\n`,
    `5. காலக்கணிப்பு முறைமை\n${timingMethodologyTa}\n`,
    `6. முடிவு\n${verdictTa}`
  ].join("\n");

  return {
    status: "SUCCESS",
    ayanamsha: {
      lahiri: lahiriAyanVal,
      kp: kpAyanVal,
      differenceDeg: ayanamshaDiff,
      lahiriFormatted: lahiriAyanStr,
      kpFormatted: kpAyanStr,
      diffFormatted: ayanamshaDiffStr
    },
    bodies: bodyComparisons,
    materialDifferences,
    hasMaterialDifference: hasMaterial,
    cuspalSubLords,
    tenthSubLord: sub10,
    seventhSubLord: sub7,
    ascendantSubLord: sub1,
    directAnswerEn,
    directAnswerTa,
    summaryEn: verdictEn,
    summaryTa: verdictTa
  };
}

/**
 * Evaluates comparative inquiries between two astrological options.
 *
 * @param {Object} params
 * @param {string} params.comparisonType - "YEAR" | "CAREER_TYPE" | "PROPERTY_TYPE" | "FAMILY_WEALTH" | "GENERIC"
 * @param {string} params.optionA - First candidate (e.g., "Job", "2027", "Land")
 * @param {string} params.optionB - Second candidate (e.g., "Business", "2028", "Apartment")
 * @param {Object} params.chart - Calculated chart data
 * @param {boolean} [params.isTamil=false] - Language flag
 * @returns {Object} Structured comparative analysis
 */
export function evaluateComparison({ comparisonType, optionA, optionB, chart, isTamil = false }) {
  const pMap = {};
  for (const p of (chart?.planets || [])) {
    pMap[p.name || p.planetName] = p;
  }

  // 1. Job vs Business Comparison
  if (comparisonType === "CAREER_TYPE" || /job.*business|business.*job/i.test(`${optionA} ${optionB}`)) {
    const saturnDignity = pMap["Saturn"]?.dignity || null;
    const mercuryDignity = pMap["Mercury"]?.dignity || null;
    const sunDignity = pMap["Sun"]?.dignity || null;

    const jobScore = (saturnDignity === "Exalted" ? 3 : (saturnDignity === "Own" ? 2 : (saturnDignity ? 1 : 0))) +
                     (sunDignity === "Exalted" ? 2 : (sunDignity ? 1 : 0));
    const bizScore = (mercuryDignity === "Exalted" ? 3 : (mercuryDignity === "Own" ? 2 : (mercuryDignity ? 1 : 0))) +
                     (pMap["Jupiter"]?.dignity === "Exalted" ? 2 : (pMap["Jupiter"]?.dignity ? 1 : 0));

    const favorsJob = jobScore >= bizScore;

    return {
      type: "CAREER_TYPE",
      optionA: {
        name: isTamil ? "அரசு / தனியார் உத்தியோகம் (Job / Service)" : "Employment / Salaried Service",
        supporting: ["6-ம் பாவகம் (சேவை) மற்றும் சனி/சூரியனின் அமைப்பு"],
        score: jobScore,
        risk: "குறைந்த நிதி இடர் (Lower Financial Volatility)"
      },
      optionB: {
        name: isTamil ? "சுயதொழில் / வர்த்தகம் (Business / Venture)" : "Independent Business / Commerce",
        supporting: ["7-ம் பாவகம் (பொதுத் தொடர்பு) மற்றும் புதன்/குருவின் அமைப்பு"],
        score: bizScore,
        risk: "சந்தை ஏற்ற இறக்க இடர் (Market Fluctuation Risk)"
      },
      verdictEn: favorsJob
        ? "Structured employment aligns more consistently with current planetary dignities than speculative commerce."
        : "Independent business or trade shows higher traditional planetary alignment than fixed salary employment.",
      verdictTa: favorsJob
        ? "தற்போதைய கிரக அமைப்புகளின்படி, சுயதொழிலை விட நிலையான உத்தியோகம் அதிக சமநிலையையும் பாதுகாப்பையும் தருகிறது."
        : "ஜாதகத்தில் 7 மற்றும் 10-ம் பாவக கிரக அமைப்புகள் சுயதொழில் அல்லது வணிக முனைப்பிற்கு சாதகமாக உள்ளன.",
      whyEn: `Saturn (${saturnDignity || "Calculated"}) governs disciplined service while Mercury (${mercuryDignity || "Calculated"}) governs commercial trade.`,
      whyTa: `சனி பகவான் (${saturnDignity || "கணித நிலை"}) ஒழுங்குபடுத்தப்பட்ட பணியையும், புதன் (${mercuryDignity || "கணித நிலை"}) வணிகத் திறனையும் குறிக்கின்றனர்.`,
      evidenceIds: ["PLANET_FACT_SATURN_DIGNITY", "PLANET_FACT_MERCURY_DIGNITY", "HOUSE_FACT_H6", "HOUSE_FACT_H10"],
      limitationsEn: "Astrological career comparison evaluates qualitative constitutional fitness; economic market conditions remain external factors.",
      limitationsTa: "ஜோதிட ஒப்பீடு நபரின் இயல்பான மனநிலை மற்றும் திறனை மட்டுமே காட்டுகிறது; சந்தை நிலைமைகள் புறக்காரணிகளாகும்."
    };
  }

  // 2. Land vs Apartment Property Comparison
  if (comparisonType === "PROPERTY_TYPE" || /land.*flat|apartment.*land|நிலம்.*வீடு/i.test(`${optionA} ${optionB}`)) {
    const marsDignity = pMap["Mars"]?.dignity || null;
    const venusDignity = pMap["Venus"]?.dignity || null;
    const favorsLand = marsDignity === "Exalted" || marsDignity === "Own";

    return {
      type: "PROPERTY_TYPE",
      optionA: {
        name: isTamil ? "நிலம் / வீட்டு மனை (Land / Plot)" : "Open Land / Plot",
        supporting: [marsDignity ? `பூமி காரகன் செவ்வாய் பலம்: ${marsDignity}` : "பூமி காரகன் செவ்வாய் காரகத்துவம்"],
        score: favorsLand ? 3 : 2,
        risk: "பராமரிப்பு மற்றும் ஆவண சரிபார்ப்பு தேவை"
      },
      optionB: {
        name: isTamil ? "கட்டப்பட்ட அடுக்குமாடி குடியிருப்பு (Apartment / Flat)" : "Constructed Apartment / Flat",
        supporting: [venusDignity ? `சுக காரகன் சுக்கிரன் பலம்: ${venusDignity}` : "சுக காரகன் சுக்கிரன் காரகத்துவம்"],
        score: favorsLand ? 2 : 3,
        risk: "தேய்மானம் மற்றும் மாதாந்திர பராமரிப்பு செலவுகள்"
      },
      verdictEn: favorsLand
        ? "Mars dispositor strength indicates higher traditional affinity for open land or agricultural plot acquisition."
        : "Venus dispositor alignment favors ready-to-move constructed residential apartments or modern dwellings.",
      verdictTa: favorsLand
        ? "செவ்வாய் பகவானின் நில அமைப்பின்படி, வெறும் மனை அல்லது நிலம் வாங்குவது பாரம்பரிய அடிப்படையில் அதிக பலன் தரும்."
        : "சுக்கிர பகவானின் அமைப்பின்படி, நவீன அடுக்குமாடி குடியிருப்பு அல்லது கட்டப்பட்ட வீடு அமைவது சாதகமாக உள்ளது.",
      whyEn: "Mars is the traditional Bhumi Karaka (significator of soil/land) while Venus governs modern architectural comfort.",
      whyTa: "செவ்வாய் பூமி காரகனாகவும், சுக்கிரன் சொகுசு குடியிருப்பு காரகனாகவும் விளங்குகின்றனர்.",
      evidenceIds: ["PLANET_FACT_MARS_BHUMI", "PLANET_FACT_VENUS_SUKHA", "HOUSE_FACT_H4"],
      limitationsEn: "Choice depends on legal title clearance and liquidity requirements.",
      limitationsTa: "சொத்து வாங்குவதில் பத்திர ஆவணங்களின் சட்டபூர்வ தன்மையே முதன்மையானது."
    };
  }

  // 3. Generic Options Comparison Fallback
  return {
    type: "GENERIC",
    optionA: { name: String(optionA || "Option A"), score: 1 },
    optionB: { name: String(optionB || "Option B"), score: 1 },
    verdictEn: `Both options (${optionA} and ${optionB}) present balanced astrological parameters under current chart analysis.`,
    verdictTa: `இரண்டு தேர்வுகளும் (${optionA} மற்றும் ${optionB}) தற்போதைய ஜாதக கணிதத்தில் சமநிலையான பலன்களைக் காட்டுகின்றன.`,
    whyEn: "No singular planetary factor overwhelmingly dominates one option over the other.",
    whyTa: "ஒரு தேர்வை மட்டும் தனித்து முன்னிறுத்தும் வகையில் அசாத்திய கிரக ஆதிக்கம் அமையவில்லை.",
    evidenceIds: ["CHART_FACT_BALANCED_OPTIONS"],
    limitationsEn: "Requires domain-specific real-world contextual parameters to discriminate further.",
    limitationsTa: "மேலும் துல்லியமாக பிரிக்க நடைமுறை சூழ்நிலைகளின் விவரங்கள் தேவை."
  };
}
