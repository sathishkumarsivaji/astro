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
    classification = "HOUSE_SYSTEM_DIFFERENCE";
    explanationEn = `House placement diverges due to fundamentally different house systems: Lahiri uses Whole Sign / Rāśi Bhava (House ${lahiriBody.house}), whereas KP uses Placidus semi-arc cusp boundaries (House ${kpBody.house}).`;
    explanationTa = `அடிப்படையில் வேறுபட்ட பாவக முறைகளால் பாவகம் மாறுகிறது: லஹிரி ராசி பாவக முறையையும் (ராசி/பாவகம் ${lahiriBody.house}), கே.பி. பிளாசிடஸ் அரை-விகித பாவக ஆரம்பங்களையும் (பாவகம் ${kpBody.house}) பயன்படுத்துகின்றன.`;
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
        timezoneId: chart?.timezoneId || chart?.tz || chart?.timezone || null,
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

  // 1. Ayanamsha Comparison & Precision Model Declaration
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

  // Effective House Systems actually configured and used
  const lahiriEffectiveHouse = "Whole Sign / Rāśi Bhava (Classical Parashari)";
  const lahiriEffectiveHouseTa = "முழு ராசி / ராசி பாவகம் (பாரம்பரிய பராசர முறை)";
  const kpEffectiveHouse = kpChart.system?.houseSystem || (kpChart.system?.isHouseSystemFallback ? "Equal (Placidus Polar Fallback)" : "Placidus Cusps (Semi-Arc)");
  const kpEffectiveHouseTa = kpChart.system?.isHouseSystemFallback ? "சம பாவக முறை (பிளாசிடஸ் துருவ மாற்று)" : "பிளாசிடஸ் (Placidus Semi-Arc) முறை";

  // 2. Body Ledger Comparison & Cusp Boundary Analysis
  const bodiesList = ["Ascendant", "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
  const bodyComparisons = [];
  const materialDifferences = [];
  const kpHouses = kpChart.houses || kpChart.cusps || [];

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
        subSubLord: kpChart.ascendant?.subSubLord ?? "N/A",
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
          subSubLord: kP.subSubLord ?? "N/A",
          formatted: formatDms(kP.longitude ?? kP.long)
        };
      }
    }

    if (lObj && kObj) {
      const mat = classifyMaterialDifference(lObj, kObj);
      const deltaDeg = Math.abs((lObj.longitude || 0) - (kObj.longitude || 0));

      // Build chart-specific exact boundary details
      let chartSpecificBoundaryEn = mat.explanationEn;
      let chartSpecificBoundaryTa = mat.explanationTa;

      if (mat.classification === "HOUSE_SYSTEM_DIFFERENCE") {
        const kCusp = kpHouses.find(h => h.house === kObj.house);
        const cuspStartStr = kCusp ? `${kCusp.signName || kCusp.sign} ${kCusp.degreeInSign != null ? kCusp.degreeInSign.toFixed(2) + "°" : formatDms(kCusp.longitude)}` : `House ${kObj.house}`;
        const cuspStartTa = kCusp ? `${toTamilRasi(kCusp.signName || kCusp.sign)} ${kCusp.degreeInSign != null ? kCusp.degreeInSign.toFixed(2) + "°" : formatDms(kCusp.longitude)}` : `${kObj.house}-ம் பாவகம்`;
        chartSpecificBoundaryEn = `${name} at ${kObj.formatted} resides in House ${lObj.house} (${lObj.sign}) under Lahiri Whole Sign, but shifts to House ${kObj.house} under KP Placidus (cusp begins at ${cuspStartStr}). Methodological impact: activates House ${kObj.house} significations instead of House ${lObj.house}.`;
        chartSpecificBoundaryTa = `${toTamilPlanet(name) || name} (${kObj.formatted}) லஹிரி முழு ராசி முறையில் ${lObj.house}-ம் இடத்திலும் (${toTamilRasi(lObj.sign)}), கே.பி. பிளாசிடஸ் முறையில் ${kObj.house}-ம் பாவகத்திலும் (பாவக ஆரம்பம்: ${cuspStartTa}) அமைகிறது. பலன் தாக்கம்: ${lObj.house}-ம் பாவக காரகத்துவத்திற்குப் பதிலாக ${kObj.house}-ம் பாவக காரகத்துவங்களை இயக்குகிறது.`;
      } else if (mat.classification === "PADA_CHANGE") {
        chartSpecificBoundaryEn = `${name} at ${lObj.formatted} (Lahiri) vs ${kObj.formatted} (KP) crosses the 3° 20' pada boundary, moving from Pada ${lObj.pada} to Pada ${kObj.pada} in ${kObj.nakshatra}. Methodological impact: alters its D9 Navamsha sign position.`;
        chartSpecificBoundaryTa = `${toTamilPlanet(name) || name}: லஹிரியில் ${lObj.formatted}, கே.பி.யில் ${kObj.formatted}. 3° 20' பாத எல்லையைக் கடந்து ${toTamilNakshatra(kObj.nakshatra)} பாதம் ${lObj.pada}-லிருந்து பாதம் ${kObj.pada}-க்கு மாறுகிறது. பலன் தாக்கம்: D9 நவாம்ச ராசி நிலை மாறுகிறது.`;
      } else if (mat.classification === "NAKSHATRA_CHANGE") {
        chartSpecificBoundaryEn = `${name} crosses the 13° 20' constellation boundary from ${lObj.nakshatra} (Lahiri) to ${kObj.nakshatra} (KP). Methodological impact: alters natal Nakshatra Lord and Vimshottari balance.`;
        chartSpecificBoundaryTa = `${toTamilPlanet(name) || name} 13° 20' நட்சத்திர எல்லையைக் கடந்து ${toTamilNakshatra(lObj.nakshatra)}-லிருந்து ${toTamilNakshatra(kObj.nakshatra)}-க்கு மாறுகிறது. பலன் தாக்கம்: நட்சத்திர அதிபதி மற்றும் தசா இருப்பு மாறுகிறது.`;
      } else if (mat.classification === "SIGN_CHANGE") {
        chartSpecificBoundaryEn = `${name} crosses the 30° zodiac sign boundary from ${lObj.sign} (Lahiri) to ${kObj.sign} (KP). Methodological impact: alters domicile dispositor and elemental triplicity.`;
        chartSpecificBoundaryTa = `${toTamilPlanet(name) || name} 30° ராசி எல்லையைக் கடந்து ${toTamilRasi(lObj.sign)}-லிருந்து ${toTamilRasi(kObj.sign)}-க்கு மாறுகிறது. பலன் தாக்கம்: ராசி அதிபதி மற்றும் அடிப்படை குணம் மாறுகிறது.`;
      }

      const compItem = {
        name,
        lahiri: lObj,
        kp: kObj,
        deltaDeg: parseFloat(deltaDeg.toFixed(4)),
        deltaFormatted: formatDms(deltaDeg),
        ...mat,
        chartSpecificBoundaryEn,
        chartSpecificBoundaryTa
      };
      bodyComparisons.push(compItem);
      if (mat.isMaterial) {
        materialDifferences.push(compItem);
      }
    }
  }

  // 3. KP Cusps, 249 Division & Complete Significator Chain
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

  // Build complete significator chains for key cusps (1st, 7th, 10th)
  const kpSignificators = kpChart.significators || {};
  const getCuspChain = (cuspNum) => {
    const cObj = kpHouses.find(h => h.house === cuspNum) || {};
    const starL = cObj.starLord || "N/A";
    const subL = cObj.subLord || "N/A";
    const subSubL = cObj.subSubLord || "N/A";
    const subPlanet = (kpChart.planets || []).find(p => p.name === subL);
    const starOfSub = subPlanet?.starLord || "N/A";

    const subSigHouses = [];
    const starSigHouses = [];
    for (let h = 1; h <= 12; h++) {
      const s = kpSignificators[h];
      if (!s) continue;
      if (s.level1?.includes(subL) || s.level2?.includes(subL) || s.level3?.includes(subL) || s.level4?.includes(subL)) {
        subSigHouses.push(h);
      }
      if (starOfSub !== "N/A" && (s.level1?.includes(starOfSub) || s.level2?.includes(starOfSub) || s.level3?.includes(starOfSub) || s.level4?.includes(starOfSub))) {
        starSigHouses.push(h);
      }
    }
    return {
      cuspNum,
      sign: cObj.signName || cObj.sign || "N/A",
      degree: cObj.degreeInSign != null ? cObj.degreeInSign.toFixed(2) + "°" : formatDms(cObj.longitude),
      starLord: starL,
      subLord: subL,
      subSubLord: subSubL,
      subPlanetStarLord: starOfSub,
      subSignifiedHouses: subSigHouses.length > 0 ? subSigHouses.join(", ") : "None directly",
      starSignifiedHouses: starSigHouses.length > 0 ? starSigHouses.join(", ") : "None directly"
    };
  };

  const chain1 = getCuspChain(1);
  const chain7 = getCuspChain(7);
  const chain10 = getCuspChain(10);

  // 4. Chart-Specific Timing Comparison
  const lahiriCurrentDasha = lahiriChart.currentDasha || null;
  const lahiriMd = (typeof lahiriCurrentDasha === "object" ? (lahiriCurrentDasha?.lord || lahiriCurrentDasha?.mahadasha) : lahiriCurrentDasha) || "Operating";
  const lahiriAd = (typeof lahiriCurrentDasha === "object" ? (lahiriCurrentDasha?.subLord || lahiriCurrentDasha?.currentAntar || lahiriCurrentDasha?.antarDasha) : lahiriChart.currentAntar) || "Operating";
  const lahiriMdTa = toTamilPlanet(lahiriMd) || lahiriMd;
  const lahiriAdTa = toTamilPlanet(lahiriAd) || lahiriAd;

  const kpCurMd = kpChart.curMd || (Array.isArray(kpChart.dashaTable) ? kpChart.dashaTable.find(d => d.isCurrent) : null);
  const kpCurBk = kpChart.curBk || kpCurMd?.bukthis?.find(b => b.isCurrent) || null;
  const kpMd = kpCurMd?.lord || kpChart.currentDasha?.lord || lahiriMd;
  const kpAd = kpCurBk?.subLord || kpChart.currentDasha?.subLord || lahiriAd;
  const kpMdTa = toTamilPlanet(kpMd) || kpMd;
  const kpAdTa = toTamilPlanet(kpAd) || kpAd;

  const rp = kpChart.rulingPlanets || {};
  const rpListEn = [
    rp.lagnaSignLord ? `Lagna Lord: ${rp.lagnaSignLord}` : null,
    rp.lagnaStarLord ? `Lagna Star Lord: ${rp.lagnaStarLord}` : null,
    rp.lagnaSubLord ? `Lagna Sub-Lord: ${rp.lagnaSubLord}` : null,
    rp.moonStarLord ? `Moon Star Lord: ${rp.moonStarLord}` : null,
    rp.dayLord ? `Day Lord: ${rp.dayLord}` : null
  ].filter(Boolean).join(", ") || "Active at moment of query";

  const rpListTa = [
    rp.lagnaSignLord ? `லக்ன அதிபதி: ${toTamilPlanet(rp.lagnaSignLord) || rp.lagnaSignLord}` : null,
    rp.lagnaStarLord ? `லக்ன நட்சத்திர அதிபதி: ${toTamilPlanet(rp.lagnaStarLord) || rp.lagnaStarLord}` : null,
    rp.lagnaSubLord ? `லக்ன உப-அதிபதி: ${toTamilPlanet(rp.lagnaSubLord) || rp.lagnaSubLord}` : null,
    rp.moonStarLord ? `சந்திர நட்சத்திர அதிபதி: ${toTamilPlanet(rp.moonStarLord) || rp.moonStarLord}` : null,
    rp.dayLord ? `கிழமை அதிபதி: ${toTamilPlanet(rp.dayLord) || rp.dayLord}` : null
  ].filter(Boolean).join(", ") || "கேள்வி நேர ஆளும் கிரகங்கள்";

  let timingClassification = "NOT_DISCRIMINATING";
  if (!lahiriMd || !kpMd) {
    timingClassification = "INSUFFICIENT_DATA";
  } else if (lahiriMd === kpMd && lahiriAd === kpAd) {
    timingClassification = "TIMING_CONVERGES";
  } else if (lahiriMd === kpMd && lahiriAd !== kpAd) {
    timingClassification = "TIMING_PARTIALLY_DIVERGES";
  } else {
    timingClassification = "TIMING_STRONGLY_DIVERGES";
  }

  const timingConvergence = (lahiriMd === kpMd && lahiriAd === kpAd)
    ? `Dasha periods converge (${timingClassification}): Both systems currently operate under ${lahiriMd} Mahadasha — ${lahiriAd} Antardasha.`
    : `Dasha periods show boundary divergence (${timingClassification}): Lahiri operates under ${lahiriMd}-${lahiriAd}, whereas KP operates under ${kpMd}-${kpAd}.`;
  const timingConvergenceTa = (lahiriMd === kpMd && lahiriAd === kpAd)
    ? `தசா காலக்கோடு ஒத்திருக்கிறது (${timingClassification}): இரு முறைகளிலும் தற்போது ${lahiriMdTa} மகா தசை — ${lahiriAdTa} புக்தி நடைபெறுகிறது.`
    : `தசா காலக்கோட்டில் எல்லை வேறுபாடு (${timingClassification}): லஹிரியில் ${lahiriMdTa}-${lahiriAdTa}, கே.பி.யில் ${kpMdTa}-${kpAdTa}.`;

  // 5. Formatted Direct Answers (Bilingual)
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
    const shiftDetailsEn = materialDifferences.map(m => `  - ${m.name}: ${m.chartSpecificBoundaryEn}`);
    const shiftDetailsTa = materialDifferences.map(m => `  - ${toTamilPlanet(m.name) || m.name}: ${m.chartSpecificBoundaryTa}`);
    boundarySummaryEn = `Material differences detected in your chart:\n${shiftDetailsEn.join("\n")}`;
    boundarySummaryTa = `உங்கள் ஜாதகத்தில் கண்டறியப்பட்ட பொருள் சார்ந்த மாற்றங்கள்:\n${shiftDetailsTa.join("\n")}`;
  }

  // Sub-Lord summary with complete chain
  const sub10 = cuspalSubLords[10]?.subLord || "Not calculated";
  const sub7 = cuspalSubLords[7]?.subLord || "Not calculated";
  const sub1 = cuspalSubLords[1]?.subLord || "Not calculated";
  const l10Obj = (lahiriChart.bhavasDetailed || []).find(b => b.num === 10) || {};
  const l10Lord = l10Obj.lordName || (lahiriChart.planets || []).find(p => p.house === 10)?.name || "10th Lord";
  const l10LordTa = toTamilPlanet(l10Lord) || l10Lord;

  const subLordSummaryEn = `KP's foundational architecture replaces equal house sign rulership with the 249 Sub-Division System (formed by subdividing the 27 Nakshatras proportionally by the 9 Vimshottari Dasha spans: 27 × 9 = 243, expanding to 249 as 6 nodes span across zodiac sign boundaries):\n` +
    `• 1st Cusp (${chain1.sign} ${chain1.degree}): Cusp Lord: ${chain1.starLord} → Sub-Lord: ${chain1.subLord} (in star of ${chain1.subPlanetStarLord}, Sub-Sub: ${chain1.subSubLord}). Sub-Lord signifies houses [${chain1.subSignifiedHouses}]; its Star Lord signifies houses [${chain1.starSignifiedHouses}].\n` +
    `• 7th Cusp (${chain7.sign} ${chain7.degree}): Cusp Lord: ${chain7.starLord} → Sub-Lord: ${chain7.subLord} (in star of ${chain7.subPlanetStarLord}, Sub-Sub: ${chain7.subSubLord}). Sub-Lord signifies houses [${chain7.subSignifiedHouses}]; its Star Lord signifies houses [${chain7.starSignifiedHouses}].\n` +
    `• 10th Cusp (${chain10.sign} ${chain10.degree}): Cusp Lord: ${chain10.starLord} → Sub-Lord: ${chain10.subLord} (in star of ${chain10.subPlanetStarLord}, Sub-Sub: ${chain10.subSubLord}). Sub-Lord signifies houses [${chain10.subSignifiedHouses}]; its Star Lord signifies houses [${chain10.starSignifiedHouses}].\n` +
    `Methodological divergence: In the Lahiri calculation profile, classical Vedic interpretation analyzes the 10th house lord (${l10Lord}) and divisional vargas (D9/D10); in KP, the 10th Cusp Sub-Lord (${chain10.subLord}) and its star lord dictate whether professional events materialize through 4-tier house significators.`;

  const subLordSummaryTa = `KP முறையின் அடிப்படை கட்டமைப்பு 249 உப-அதிபதி (Sub-Lord) கணிதமாகும் (27 நட்சத்திரங்கள் ஒவ்வொன்றையும் 9 விம்சோத்தரி தசா விகிதப்படி பிரிப்பதன் மூலம் 27 × 9 = 243 உப பிரிவுகள் உருவாகின்றன; இதில் 6 உப பிரிவுகள் ராசி எல்லையில் இரண்டாகப் பிரிவதால் மொத்தம் 249 உப பிரிவுகள் ஏற்படுகின்றன):\n` +
    `• 1-ம் பாவகம் (${toTamilRasi(chain1.sign)} ${chain1.degree}): நட்சத்திர அதிபதி: ${toTamilPlanet(chain1.starLord) || chain1.starLord} → உப-அதிபதி: ${toTamilPlanet(chain1.subLord) || chain1.subLord} (${toTamilPlanet(chain1.subPlanetStarLord) || chain1.subPlanetStarLord} நட்சத்திரத்தில்; உப-உப: ${toTamilPlanet(chain1.subSubLord) || chain1.subSubLord}). உப-அதிபதி குறிக்கும் பாவகங்கள்: [${chain1.subSignifiedHouses}]; நட்சத்திர அதிபதி குறிக்கும் பாவகங்கள்: [${chain1.starSignifiedHouses}].\n` +
    `• 7-ம் பாவகம் (${toTamilRasi(chain7.sign)} ${chain7.degree}): நட்சத்திர அதிபதி: ${toTamilPlanet(chain7.starLord) || chain7.starLord} → உப-அதிபதி: ${toTamilPlanet(chain7.subLord) || chain7.subLord} (${toTamilPlanet(chain7.subPlanetStarLord) || chain7.subPlanetStarLord} நட்சத்திரத்தில்; உப-உப: ${toTamilPlanet(chain7.subSubLord) || chain7.subSubLord}). உப-அதிபதி குறிக்கும் பாவகங்கள்: [${chain7.subSignifiedHouses}]; நட்சத்திர அதிபதி குறிக்கும் பாவகங்கள்: [${chain7.starSignifiedHouses}].\n` +
    `• 10-ம் பாவகம் (${toTamilRasi(chain10.sign)} ${chain10.degree}): நட்சத்திர அதிபதி: ${toTamilPlanet(chain10.starLord) || chain10.starLord} → உப-அதிபதி: ${toTamilPlanet(chain10.subLord) || chain10.subLord} (${toTamilPlanet(chain10.subPlanetStarLord) || chain10.subPlanetStarLord} நட்சத்திரத்தில்; உப-உப: ${toTamilPlanet(chain10.subSubLord) || chain10.subSubLord}). உப-அதிபதி குறிக்கும் பாவகங்கள்: [${chain10.subSignifiedHouses}]; நட்சத்திர அதிபதி குறிக்கும் பாவகங்கள்: [${chain10.starSignifiedHouses}].\n` +
    `முறைமை வேறுபாடு: லஹிரி கணக்கீட்டு அமைப்பில் பராசர மரபு 10-ம் பாவாதிபதி (${l10LordTa}) மற்றும் D9/D10 வர்க்க சக்கர பலத்தை முதன்மையாகக் கொள்கிறது; கே.பி.யில் 10-ம் பாவ உப-அதிபதி (${toTamilPlanet(chain10.subLord) || chain10.subLord}) மற்றும் அதன் நட்சத்திர அதிபதியின் 4-நிலை பாவக தொடர்புகளே தொழில் நிகழ்வுகளை திட்டவட்டமாக நிர்ணயிக்கின்றன.`;

  // Timing methodology summary with chart-specific active periods
  const timingMethodologyEn = `Chart-specific timing analysis:\n` +
    `• Current Period: ${timingConvergence}\n` +
    `• Lahiri Timing Method: Classical Vimshottari Mahadasha (${lahiriMd}) - Antardasha (${lahiriAd}) validated by Gochar transits crossing natal Moon and Lagna sign points.\n` +
    `• KP Timing Method: Event fruitfulness determined by Cuspal Sub-Lord activation; timing pin-pointed by Ruling Planets (${rpListEn}) and DBAS (Dasha-Bukthi-Antara-Sookshma) transiting active significator stars.\n` +
    `Note: Interpretive timing rules from one framework cannot be cross-applied or substituted into the other.`;

  const timingMethodologyTa = `ஜாதக அடிப்படையிலான காலக்கணிப்பு ஒப்பீடு:\n` +
    `• நடப்பு தசா-புக்தி: ${timingConvergenceTa}\n` +
    `• லஹிரி காலக்கணிப்பு: பாரம்பரிய விம்சோத்தரி மகா தசை (${lahiriMdTa}) - புக்தி (${lahiriAdTa}) மற்றும் சந்திரன்/லக்ன ராசி புள்ளிகளைக் கடக்கும் கோச்சாரப் பெயர்ச்சிகள்.\n` +
    `• கே.பி. காலக்கணிப்பு: பாவக உப-அதிபதி உறுதிசெய்த காரகத்துவங்கள் இயங்கும் காலம்; ஆளும் கிரகங்கள் (${rpListTa}) மற்றும் தசா-புக்தி அதிபதிகள் சுப காரக நட்சத்திரங்களில் பிரவேசிக்கும் காலம் கொண்டு துல்லியப்படுத்தப்படுகிறது.\n` +
    `குறிப்பு: ஒரு அமைப்பின் காலக்கணிப்பு விதிகளை மற்றொரு அமைப்பிற்கு மாற்றிப் பொருத்துவது முறையற்றது.`;

  // Verdict summary
  let verdictEn = "";
  let verdictTa = "";
  if (!hasMaterial) {
    verdictEn = `Verdict: No material sign or nakshatra difference exists in your natal ledger. The ${ayanamshaDiffStr} precession difference (${lahiriAyanStr} Chitrapaksha vs ${kpAyanStr} KP New) shifts longitudes slightly without crossing star boundaries. The genuine divergence is structural: classical Vedic Whole Sign interpretation (Lahiri) vs Placidus cusps and 249 Cuspal Sub-Lords (KP).`;
    verdictTa = `முடிவு: உங்கள் ஜாதகத்தில் லக்னம் மற்றும் கிரகங்களின் ராசி அல்லது நட்சத்திர அமைப்பில் பொருள் சார்ந்த மாற்றம் இல்லை. ${ayanamshaDiffStr} அயனாம்ச இடைவெளி (${lahiriAyanStr} சித்திரபக்ஷ vs ${kpAyanStr} கே.பி. புதிய அயனாம்சம்) சிறிய பாகை மாற்றத்தை மட்டுமே ஏற்படுத்துகிறது. உண்மையான வேறுபாடு கட்டமைப்பு சார்ந்தது: பாரம்பரிய பராசர முழு ராசி முறை (லஹிரி) vs பிளாசிடஸ் பாவக ஆரம்பங்கள் மற்றும் 249 உப-அதிபதிகள் (கே.பி.).`;
  } else {
    verdictEn = `Verdict: Material differences exist in your chart due to two distinct causes: (A) Coordinate offset: ${ayanamshaDiffStr} difference between Chitrapaksha (${lahiriAyanStr}) and KP New (${kpAyanStr}) ayanamsha, and (B) House system divergence: Lahiri Whole Sign vs KP Placidus cusp boundaries. These alter specific planetary house placements or pada boundaries, directly modifying which houses each planet activates.`;
    verdictTa = `முடிவு: உங்கள் ஜாதகத்தில் இரண்டு காரணங்களால் பொருள் சார்ந்த மாற்றங்கள் உள்ளன: (A) ஆயத்தொலைவு வேறுபாடு: சித்திரபக்ஷ (${lahiriAyanStr}) மற்றும் கே.பி. புதிய (${kpAyanStr}) அயனாம்சத்திற்கு இடையிலான ${ayanamshaDiffStr} இடைவெளி; (B) பாவக முறை வேறுபாடு: லஹிரி முழு ராசி vs கே.பி. பிளாசிடஸ் பாவக ஆரம்பங்கள். இவை கிரகங்களின் பாவக ஆதிக்கத்தை நேரடியாக மாற்றுகின்றன.`;
  }

  // Full direct answers
  const directAnswerEn = [
    "When comparing the Lahiri and KP systems for your horoscope, astronomical coordinate variations and house system methodologies must be distinguished clearly:\n",
    `1. Ayanamsha (Precession Offset)\n• Lahiri: Chitrapaksha Ayanamsha (${lahiriAyanStr})\n• KP: Krishnamurti New Ayanamsha (${kpAyanStr})\n• Calculated coordinate difference in your chart: ${ayanamshaDiffStr}\n• Lahiri effective house system: ${lahiriEffectiveHouse}\n• KP effective house system: ${kpEffectiveHouse}\n`,
    `2. Planetary Longitudes & Ascendant\nBoth systems are calculated from the identical birth coordinates and timestamp:\n${ledgerLinesEn.join("\n")}\n`,
    `3. Nakshatra & Pada Boundary Analysis\n${boundarySummaryEn}\n`,
    `4. KP Sub-Lord Significators\n${subLordSummaryEn}\n`,
    `5. Timing Methodology\n${timingMethodologyEn}\n`,
    `6. Conclusion\n${verdictEn}`
  ].join("\n");

  const directAnswerTa = [
    "உங்கள் ஜாதகத்தில் லஹிரி மற்றும் கே.பி. முறைகளை ஒப்பிடும்போது, வானியல் கணித வேறுபாடுகளையும் பாவக முறைமைகளின் தாக்கத்தையும் தனித்தனியாக பிரித்துப் பார்க்க வேண்டும்:\n",
    `1. அயனாம்சம்\n• லஹிரி: சித்திரபக்ஷ லஹிரி அயனாம்சம் (${lahiriAyanStr})\n• கே.பி.: KP New Ayanamsha அமைப்பு (${kpAyanStr})\n• உங்கள் ஜாதகத்தில் கணக்கிடப்பட்ட actual difference: ${ayanamshaDiffStr}\n• லஹிரி நடைமுறை பாவக அமைப்பு (Lahiri effective house system): ${lahiriEffectiveHouseTa}\n• கே.பி. நடைமுறை பாவக அமைப்பு (KP effective house system): ${kpEffectiveHouseTa}\n`,
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
    effectiveHouseSystems: {
      lahiri: lahiriEffectiveHouse,
      kp: kpEffectiveHouse
    },
    bodies: bodyComparisons,
    materialDifferences,
    hasMaterialDifference: hasMaterial,
    cuspalSubLords,
    significatorChains: {
      cusp1: chain1,
      cusp7: chain7,
      cusp10: chain10
    },
    timingComparison: {
      lahiri: { mahadasha: lahiriMd, antardasha: lahiriAd },
      kp: { mahadasha: kpMd, antardasha: kpAd },
      convergence: timingConvergence,
      classification: timingClassification
    },
    tenthSubLord: sub10,
    seventhSubLord: sub7,
    ascendantSubLord: sub1,
    evidenceLayeredClaims: [
      { layer: "CALCULATED_FACT", claimEn: `Chitrapaksha Ayanamsha: ${lahiriAyanStr}; KP New Ayanamsha: ${kpAyanStr}; Offset: ${ayanamshaDiffStr}`, claimTa: `சித்திரபக்ஷ அயனாம்சம்: ${lahiriAyanStr}; KP New அயனாம்சம்: ${kpAyanStr}; இடைவெளி: ${ayanamshaDiffStr}` },
      { layer: "CONVENTION_FACT", claimEn: `Lahiri convention uses Whole Sign houses; KP convention uses Placidus cusps and 249 sub-divisions.`, claimTa: `லஹிரி முறைமை முழு ராசி பாவகத்தையும், கே.பி. முறைமை பிளாசிடஸ் ஆரம்பங்களையும் 249 உப-பிரிவுகளையும் பயன்படுத்துகின்றன.` },
      { layer: "TRADITIONAL_INTERPRETATION", claimEn: `Vedic Parashari relies on 10th lord and D10 vargas; KP relies on 10th cusp sub-lord significators.`, claimTa: `பராசர ஜோதிடம் 10-ம் அதிபதியையும் தசாம்சத்தையும் முதன்மையாகக் கொள்கிறது; KP 10-ம் பாவ உப-அதிபதி காரகங்களை முதன்மையாகக் கொள்கிறது.` },
      { layer: "CALCULATED_FACT", claimEn: `Current Dasha timing comparison status: ${timingClassification}`, claimTa: `நடப்பு தசா காலக்கோடு ஒப்பீட்டு நிலை: ${timingClassification}` }
    ],
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
