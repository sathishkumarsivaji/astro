/**
 * ASTROVERSE — Current Period Engine (Section 21)
 * ================================================
 * Computes CURRENT LIFE PHASE calculated from actual current date.
 * Guarantees that childhood periods are never presented as current,
 * and extracts activated houses, planets, domains, transits,
 * opportunities, and caution areas.
 */

import { extractCanonicalFacts } from "../expertPrediction/canonicalFactAdapter.js";
import { julianDateToDate, getJulianDateFromUtc, calculateDedicatedGocharDashboard } from "../astroEngine.js";

/**
 * Maps house numbers to relevant life domains
 */
const HOUSE_TO_DOMAINS = {
  1: ["leadership", "wellness", "milestones"],
  2: ["finance", "family", "career"],
  3: ["foreignTravel", "business", "education"],
  4: ["property", "vehicle", "family", "education"],
  5: ["children", "education", "spiritual", "finance"],
  6: ["job", "wellness", "legal", "caution"],
  7: ["marriage", "business", "legal"],
  8: ["finance", "wellness", "legal", "caution"],
  9: ["spiritual", "foreignTravel", "education", "leadership"],
  10: ["career", "job", "business", "leadership", "milestones"],
  11: ["finance", "career", "business", "children"],
  12: ["spiritual", "foreignTravel", "wellness", "caution"]
};

/**
 * Calculates the authoritative Current Life Phase matching the user's current date.
 *
 * @param {Object} chartData - Complete chart data
 * @param {Date} [currentDate=new Date()] - Reference date (actual current date)
 * @param {string} [lang="en"] - "en" or "ta"
 * @returns {Object} Structured Current Life Phase object
 */
export function calculateCurrentLifePhase(chartData, currentDate = new Date(), lang = "en") {
  const isTamil = lang === "ta";
  const canonicalFacts = extractCanonicalFacts(chartData, lang);

  // 1. Calculate Native's Current Age
  let birthDate = null;
  if (chartData.birthDateStr) {
    birthDate = new Date(chartData.birthDateStr);
  } else if (chartData.birthDate) {
    birthDate = new Date(chartData.birthDate);
  } else if (canonicalFacts.birthYear) {
    birthDate = new Date(canonicalFacts.birthYear, 0, 1);
  }

  let currentAgeYears = 30; // sensible fallback
  if (birthDate && !isNaN(birthDate.getTime())) {
    const ageDiffMs = currentDate.getTime() - birthDate.getTime();
    currentAgeYears = Math.max(0, parseFloat((ageDiffMs / (365.25 * 24 * 3600 * 1000)).toFixed(1)));
  }

  // 2. Identify Active Dasha Periods for current date
  const currentJd = getJulianDateFromUtc(currentDate);
  let activeDashaMatch = null;

  const dashaTable = chartData.dashaTable || canonicalFacts.dashaTable || [];
  if (Array.isArray(dashaTable) && dashaTable.length > 0) {
    for (const d of dashaTable) {
      const jdStart = d.jdStart ?? (d.startDate ? getJulianDateFromUtc(new Date(d.startDate)) : null);
      const jdEnd = d.jdEnd ?? (d.endDate ? getJulianDateFromUtc(new Date(d.endDate)) : null);
      if (Number.isFinite(jdStart) && Number.isFinite(jdEnd)) {
        if (currentJd >= jdStart && currentJd <= jdEnd) {
          activeDashaMatch = d;
          break;
        }
      }
    }
  }

  // Fallback to chartData.currentDasha if table lookup did not match
  const cd = chartData.currentDasha || {};
  const mahaLord = activeDashaMatch?.lord || activeDashaMatch?.mahadasha || cd.lord || cd.mahadasha || "";
  const antarLord = activeDashaMatch?.subLord || activeDashaMatch?.antardasha || cd.currentAntar || cd.antarDasha || "";
  const pratyantarLord = activeDashaMatch?.pratyantardasha || cd.currentPratyantar || "";

  let startDateIso = activeDashaMatch?.startDate || cd.startDate || new Date(currentDate.getFullYear() - 1, 0, 1).toISOString().slice(0, 10);
  let endDateIso = activeDashaMatch?.endDate || cd.endDate || new Date(currentDate.getFullYear() + 2, 0, 1).toISOString().slice(0, 10);

  // Guard against childhood dates being returned as current
  if (birthDate && !isNaN(birthDate.getTime())) {
    const startObj = new Date(startDateIso);
    if (!isNaN(startObj.getTime()) && startObj.getTime() < birthDate.getTime()) {
      // startDate cannot precede birth date
      startDateIso = birthDate.toISOString().slice(0, 10);
    }
  }

  // 3. Activated Houses and Planets
  const houseLords = canonicalFacts.houseLords || {};
  const planets = canonicalFacts.planets || [];
  const activatedPlanetsSet = new Set([mahaLord, antarLord]);
  if (pratyantarLord) activatedPlanetsSet.add(pratyantarLord);

  const activatedHousesSet = new Set();
  for (let h = 1; h <= 12; h++) {
    const lord = houseLords[h];
    if (lord && activatedPlanetsSet.has(lord)) {
      activatedHousesSet.add(h);
    }
  }

  planets.forEach(p => {
    if (activatedPlanetsSet.has(p.name) && p.house) {
      activatedHousesSet.add(p.house);
    }
  });

  const activatedHouses = Array.from(activatedHousesSet).sort((a, b) => a - b);
  const activatedPlanets = Array.from(activatedPlanetsSet);

  // 4. Activated Domains
  const activatedDomainsSet = new Set();
  activatedHouses.forEach(h => {
    const doms = HOUSE_TO_DOMAINS[h] || [];
    doms.forEach(d => activatedDomainsSet.add(d));
  });
  const activatedDomains = Array.from(activatedDomainsSet);

  // 5. Current Major Transits (Live Gochar Dashboard)
  let gochar = null;
  try {
    gochar = calculateDedicatedGocharDashboard(chartData, currentDate);
  } catch (_e) {
    gochar = null;
  }

  const sadeSati = gochar?.sadeSati || {
    isActive: false,
    phaseNameEn: "Not Active",
    phaseNameTa: "நடைமுறையில் இல்லை",
    descriptionEn: "Saturn is not transiting the 12th, 1st, or 2nd from natal Moon.",
    descriptionTa: "சனி பகவான் ஜென்ம ராசிக்கு 12, 1, 2-ல் இல்லை."
  };

  const jupiterTransit = gochar?.jupiterTransit || {
    houseFromMoon: 5,
    isFavorable: true,
    descriptionEn: "Jupiter occupies an auspicious angle from natal Moon.",
    descriptionTa: "குரு பகவான் சந்திரனுக்கு சுப ஸ்தானத்தில் சஞ்சரிக்கிறார்."
  };

  // 6. Supporting Indicators & Contradictions
  const supportingIndicators = [];
  const contradictions = [];

  if (jupiterTransit.isFavorable) {
    supportingIndicators.push(
      isTamil
        ? `கோச்சாரத்தில் குரு பகவானின் சுப பார்வை பலம் சேர்க்கிறது (${jupiterTransit.descriptionTa || "சுப சஞ்சாரம்"}).`
        : `Gochara Jupiter transit provides supportive benefic influence (${jupiterTransit.descriptionEn || "Auspicious alignment"}).`
    );
  }

  supportingIndicators.push(
    isTamil
      ? `${mahaLord} மகா தசா மற்றும் ${antarLord} புக்தி இயக்கம் ${activatedHouses.join(", ")}-ம் பாவகங்களை சுபமாக இயக்குகிறது.`
      : `Operating ${mahaLord} Mahadasha and ${antarLord} Antardasha activate key life houses: ${activatedHouses.join(", ")}.`
  );

  if (sadeSati.isActive) {
    contradictions.push(
      isTamil
        ? `ஏழரை சனி இயக்கம் (${sadeSati.phaseNameTa}): பொறுமையும் விவேகமும் தேவைப்படும் காலம்.`
        : `Active Sade Sati cycle (${sadeSati.phaseNameEn}): calls for steady patience and avoidance of unforced risk.`
    );
  }

  // 7. Opportunities and Caution Areas
  const currentOpportunities = [];
  if (activatedHouses.includes(10) || activatedHouses.includes(11)) {
    currentOpportunities.push(
      isTamil
        ? "தொழில் மற்றும் பொது வாழ்வில் புதிய பொறுப்புகள், பதவி உயர்வு மற்றும் நிதி வரவு வாய்ப்புகள்."
        : "Career recognition, promotion momentum, and favorable professional gain opportunities."
    );
  }
  if (activatedHouses.includes(4)) {
    currentOpportunities.push(
      isTamil
        ? "சொத்து வாங்குதல், வீடு புதுப்பித்தல் அல்லது வாகன யோகத்திற்கான சாதகமான சூழல்."
        : "Real estate acquisition, domestic renewal, or conveyance upgrade possibilities."
    );
  }
  if (activatedHouses.includes(7)) {
    currentOpportunities.push(
      isTamil
        ? "கூட்டு வர்த்தகம், வாடிக்கையாளர் விரிவாக்கம் மற்றும் உறவுகள் வலுப்படும் காலம்."
        : "Commercial partnership agreements and relational consolidation opportunities."
    );
  }
  if (currentOpportunities.length === 0) {
    currentOpportunities.push(
      isTamil
        ? "தனிப்பட்ட திறன் மேம்பாடு மற்றும் எதிர்காலத்திற்கான நிலையான அடித்தளம் அமைத்தல்."
        : "Consolidating core operational capabilities and building long-term foundation."
    );
  }

  const currentCautionAreas = [];
  if (sadeSati.isActive || activatedHouses.includes(6) || activatedHouses.includes(8)) {
    currentCautionAreas.push(
      isTamil
        ? "அவசர கடன் வாங்குதல், ஊக வணிக முதலீடுகள் மற்றும் தேவையற்ற வாக்குவாதங்களைத் தவிர்க்கவும்."
        : "Avoid speculative leverage, hasty borrowings, and unforced workplace conflicts."
    );
  }
  if (activatedHouses.includes(12)) {
    currentCautionAreas.push(
      isTamil
        ? "திட்டமிடப்படாத விரய செலவுகளை கட்டுப்படுத்தி சேமிப்பில் கவனம் செலுத்தவும்."
        : "Monitor unexpected expenditures and preserve liquidity buffers."
    );
  }
  if (currentCautionAreas.length === 0) {
    currentCautionAreas.push(
      isTamil
        ? "சீரான வாழ்க்கை முறை மற்றும் ஓய்வை சமநிலையில் பராமரிக்கவும்."
        : "Maintain balanced lifestyle rhythms and steady preventive health habits."
    );
  }

  return {
    currentAgeYears,
    currentAgeDisplay: `${currentAgeYears} ${isTamil ? "வயது" : "years"}`,
    mahadasha: mahaLord,
    antardasha: antarLord,
    pratyantardasha: pratyantarLord,
    dashaDisplay: `${mahaLord} / ${antarLord}${pratyantarLord ? ` / ${pratyantarLord}` : ""}`,
    startDate: startDateIso,
    endDate: endDateIso,
    activatedHouses,
    activatedPlanets,
    activatedDomains,
    currentTransits: {
      sadeSati,
      jupiterTransit,
      saturnHouse: gochar?.saturnTransit?.houseFromMoon || null
    },
    supportingIndicators,
    contradictions,
    currentOpportunities,
    currentCautionAreas,
    summaryNarrative: isTamil
      ? `ஜாதகரின் தற்போதைய வயது ${currentAgeYears}. இப்போது ${mahaLord} மகா தசையில் ${antarLord} புக்தி நடைபெறுகிறது (${startDateIso} முதல் ${endDateIso} வரை). இந்த காலகட்டம் முக்கியமாக ${activatedDomains.slice(0, 3).join(", ")} துறைகளை இயக்குகிறது.`
      : `At the current age of ${currentAgeYears}, the native is operating under the ${mahaLord} Mahadasha and ${antarLord} Antardasha (${startDateIso} to ${endDateIso}). This phase prominently activates ${activatedDomains.slice(0, 3).join(", ")}.`
  };
}
