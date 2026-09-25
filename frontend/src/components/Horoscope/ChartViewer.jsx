import React, { useState } from "react";
import {
  Sparkles,
  Compass,
  Shield,
  Award,
  Calendar,
  Clock,
  Sun,
  Moon,
  Flame,
  CheckCircle2,
  ChevronRight,
  Layers,
  Activity,
  AlertTriangle,
  HelpCircle,
  Eye,
  Info
} from "lucide-react";
import {
  calculateD60StabilityTest,
  calculateBhavaChalit,
  calculatePlanetaryAvasthas,
  calculateNakshatraDispositorProfile,
  getFunctionalLordshipMatrix,
  calculateJaiminiSystem
} from "../../services/astroEngine";
import { TRANSLATIONS } from "../../services/localization";

export default function ChartViewer({ chartData, lang = "en", onOpenDetailedReport = null }) {
  const [chartStyle, setChartStyle] = useState("south"); // "south", "north", "east"
  const [chartViewMode, setChartViewMode] = useState("d1_d9"); // "d1_d9", "all_vargas", "bhava_chalit", "planets_deep", "bhavas_deep", "d60_stability"
  const [selectedVarga, setSelectedVarga] = useState("D1");
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  if (!chartData) return null;
  const {
    sunSign, moonSign, ascendantSign, moonNakshatra, sunNakshatra,
    planets, currentDasha, dashaTable, panchangam, doshaAnalysis,
    ascendantNavamsa, system, jaiminiKarakas, shadbala, divisionalCharts, pratyantardasha,
    ashtakavarga, ashtakavargaPoints
  } = chartData;

  const isTamil = lang === "ta";

  const SIGN_NAMES_TAMIL = {
    Aries: "மேஷம்", Taurus: "ரிஷபம்", Gemini: "மிதுனம்", Cancer: "கடகம்",
    Leo: "சிம்மம்", Virgo: "கன்னி", Libra: "துலாம்", Scorpio: "விருச்சிகம்",
    Sagittarius: "தனுசு", Capricorn: "மகரம்", Aquarius: "கும்பம்", Pisces: "மீனம்"
  };

  const PLANET_NAMES_TAMIL = {
    Sun: "சூரி", Moon: "சந்", Mars: "செவ்", Mercury: "புத",
    Jupiter: "குரு", Venus: "சுக்", Saturn: "சனி", Rahu: "ராகு", Ketu: "கேது"
  };

  const SOUTH_BOXES = [
    { sign: "Pisces", x: 10, y: 10, w: 95, h: 95 },
    { sign: "Aries", x: 105, y: 10, w: 95, h: 95 },
    { sign: "Taurus", x: 200, y: 10, w: 95, h: 95 },
    { sign: "Gemini", x: 295, y: 10, w: 95, h: 95 },

    { sign: "Cancer", x: 295, y: 105, w: 95, h: 95 },
    { sign: "Leo", x: 295, y: 200, w: 95, h: 95 },

    { sign: "Virgo", x: 295, y: 295, w: 95, h: 95 },
    { sign: "Libra", x: 200, y: 295, w: 95, h: 95 },
    { sign: "Scorpio", x: 105, y: 295, w: 95, h: 95 },
    { sign: "Sagittarius", x: 10, y: 295, w: 95, h: 95 },

    { sign: "Capricorn", x: 10, y: 200, w: 95, h: 95 },
    { sign: "Aquarius", x: 10, y: 105, w: 95, h: 95 },
  ];

  // Shodashavarga Metadata
  const VARGA_LIST = [
    { code: "D1", name: "Rasi", nameTa: "ராசி", purpose: "Physical body, vitality & overall destiny" },
    { code: "D2", name: "Hora", nameTa: "ஹோரா", purpose: "Wealth, financial accumulation & liquid assets" },
    { code: "D3", name: "Drekkana", nameTa: "திரேக்காணம்", purpose: "Siblings, vitality, courage & initiatives" },
    { code: "D4", name: "Chaturthamsha", nameTa: "சதுர்த்தாம்சம்", purpose: "Fixed assets, real estate & general fortunes" },
    { code: "D7", name: "Saptamsha", nameTa: "சப்தாம்சம்", purpose: "Children, progeny fortune & creative continuity" },
    { code: "D9", name: "Navamsha", nameTa: "நவாம்சம்", purpose: "Dharma, marriage partner, inner potential & soul" },
    { code: "D10", name: "Dashamsha", nameTa: "தசாம்சம்", purpose: "Career authority, leadership, profession & public status" },
    { code: "D12", name: "Dvadasamsha", nameTa: "துவாதசாம்சம்", purpose: "Parents, ancestral lineage & parental heritage" },
    { code: "D16", name: "Shodashamsha", nameTa: "சோடசாம்சம்", purpose: "Conveyances, comforts, vehicles & general happiness" },
    { code: "D20", name: "Vimshamsha", nameTa: "விம்சாம்சம்", purpose: "Spiritual practice, upasana & inner devotion" },
    { code: "D24", name: "Chaturvimshamsha", nameTa: "சதுர்விம்சாம்சம்", purpose: "Higher learning, academic prowess & knowledge" },
    { code: "D27", name: "Saptavimshamsha", nameTa: "சப்தவிம்சாம்சம்", purpose: "Physical strength, resilience & stamina" },
    { code: "D30", name: "Trishamsha", nameTa: "திரிம்சாம்சம்", purpose: "Arishta, misfortunes, health vulnerabilities & remedies" },
    { code: "D40", name: "Khavedamsha", nameTa: "கவேதாம்சம்", purpose: "Maternal legacy & auspicious/inauspicious karmic fruits" },
    { code: "D45", name: "Akshavedamsha", nameTa: "அக்ஷவேதாம்சம்", purpose: "Paternal karma & general character integrity" },
    { code: "D60", name: "Shashtiamsha", nameTa: "ஷஷ்டியாம்சம்", purpose: "Traditional Karmic Themes, Birth-Time Sensitivity & D60 Interpretation" },
  ];

  // Helper for Rasi Chart
  const getRasiPlanetsInSign = (signName) => (planets || []).filter(p => p?.sign && signName && p.sign.toLowerCase() === signName.toLowerCase());
  const isRasiAscSign = (signName) => Boolean(ascendantSign?.name && signName && ascendantSign.name.toLowerCase() === signName.toLowerCase());

  // Generic Varga Helper
  const getVargaChartData = (vargaCode) => {
    if (vargaCode === "D1") {
      return {
        ascendantSign: ascendantSign?.name || null,
        planets: (planets || []).map(p => ({ ...p, signName: p.sign }))
      };
    }
    if (vargaCode === "D9") {
      return {
        ascendantSign: ascendantNavamsa?.signName || null,
        planets: (planets || []).map(p => ({ ...p, signName: p.navamsaSign }))
      };
    }
    const keyMap = {
      D2: "d2Hora", D3: "d3Drekkana", D4: "d4Chaturthamsha", D7: "d7Saptamsha",
      D10: "d10Dasamsha", D12: "d12Dvadasamsha", D16: "d16Shodashamsha", D20: "d20Vimshamsha",
      D24: "d24Chaturvimshamsha", D27: "d27Saptavimshamsha", D30: "D30",
      D40: "d40Khavedamsha", D45: "d45Akshavedamsha", D60: "d60Shashtiamsha"
    };
    const chartKey = keyMap[vargaCode] || vargaCode;
    const vChart = divisionalCharts?.[chartKey] || divisionalCharts?.[vargaCode] || (vargaCode === "D30" ? (divisionalCharts?.d30Trimsamsa || divisionalCharts?.d30Trimsamsha) : null);
    if (vChart) {
      return {
        ascendantSign: vChart.ascendant?.name || null,
        planets: vChart.planets || []
      };
    }
    return {
      ascendantSign: ascendantSign?.name || null,
      planets: (planets || []).map(p => ({ ...p, signName: p.sign }))
    };
  };

  // Generic Varga Renderer
  const renderVargaSvg = (vargaCode, titleLabel) => {
    const vData = getVargaChartData(vargaCode);
    const ascSignName = vData.ascendantSign;

    const getVPlanetsInSign = (signName) => (vData.planets || []).filter(p => {
      const s = p.signName || p.sign;
      return s && signName && s.toLowerCase() === signName.toLowerCase();
    });

    if (chartStyle === "south") {
      return (
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full select-none"
          textRendering="optimizeLegibility"
          style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
          <rect x="8" y="8" width="384" height="384" fill="#FFFDF9" stroke="#B45309" strokeWidth="2.5" rx="6" />
          <rect x="105" y="105" width="190" height="190" fill="#FAF5EB" stroke="#B45309" strokeWidth="1.5" strokeDasharray="5,4" rx="8" />
          <text x="200" y="185" textAnchor="middle" fill="#78350F" fontSize="18" fontWeight="900">
            {vargaCode} {titleLabel}
          </text>
          <text x="200" y="210" textAnchor="middle" fill="#9A3412" fontSize="12.5" fontWeight="800">
            {ascSignName ? (isTamil ? `லக்னம்: ${SIGN_NAMES_TAMIL[ascSignName] || ascSignName}` : `Lagna: ${ascSignName}`) : (isTamil ? "லக்னம்: —" : "Lagna: —")}
          </text>

          {SOUTH_BOXES.map(box => {
            const boxPlanets = getVPlanetsInSign(box.sign);
            const isAsc = box.sign.toLowerCase() === ascSignName.toLowerCase();
            const boxTitle = isTamil ? (SIGN_NAMES_TAMIL[box.sign] || box.sign) : box.sign.substring(0, 3).toUpperCase();
            const isCrowded = boxPlanets.length > 3;

            return (
              <g key={box.sign}>
                <rect
                  x={box.x}
                  y={box.y}
                  width={box.w}
                  height={box.h}
                  fill={isAsc ? "rgba(245, 158, 11, 0.22)" : "none"}
                  stroke="#B45309"
                  strokeWidth="1.5"
                />
                <text x={box.x + 6} y={box.y + 16} fill={isAsc ? "#9A3412" : "#0F172A"} fontSize="12.5" fontWeight="800">
                  {boxTitle} {isAsc && (isTamil ? "(லக்)" : "(ASC)")}
                </text>
                {isAsc && <line x1={box.x} y1={box.y} x2={box.x + 32} y2={box.y + 32} stroke="#D97706" strokeWidth="2.5" />}

                {boxPlanets.map((p, idx) => {
                  const pColor =
                    p.name === "Sun" ? "#B45309" :
                    p.name === "Moon" ? "#312E81" :
                    p.name === "Mars" ? "#B91C1C" :
                    p.name === "Mercury" ? "#047857" :
                    p.name === "Jupiter" ? "#C2410C" :
                    p.name === "Venus" ? "#BE185D" :
                    p.name === "Saturn" ? "#0F172A" :
                    p.name === "Rahu" ? "#6B21A8" : "#713F12";

                  const pX = isCrowded ? box.x + 5 + (idx % 2) * 44 : box.x + 6;
                  const pY = isCrowded ? box.y + 32 + Math.floor(idx / 2) * 16 : box.y + 34 + idx * 16;
                  const pillWidth = isCrowded ? 41 : (isTamil ? 52 : 46);

                  return (
                    <g key={p.name}>
                      <rect x={pX - 1} y={pY - 11} width={pillWidth} height={14} fill="rgba(255, 255, 255, 0.90)" stroke="rgba(203, 213, 225, 0.4)" strokeWidth="0.5" rx="3" />
                      <text x={pX + 2} y={pY} fill={pColor} fontSize={isCrowded ? "11.5" : "12.5"} fontWeight="800">
                        {isTamil ? (PLANET_NAMES_TAMIL[p.name] || p.name) : p.name.substring(0, 2)}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      );
    } else if (chartStyle === "north") {
      // North Indian Diamond Chart
      return (
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full select-none"
          textRendering="optimizeLegibility"
          style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
          <rect x="8" y="8" width="384" height="384" fill="#FFFDF9" stroke="#B45309" strokeWidth="2.5" rx="6" />
          <line x1="8" y1="8" x2="392" y2="392" stroke="#B45309" strokeWidth="1.8" />
          <line x1="8" y1="392" x2="392" y2="8" stroke="#B45309" strokeWidth="1.8" />
          <line x1="200" y1="8" x2="8" y2="200" stroke="#B45309" strokeWidth="1.8" />
          <line x1="8" y1="200" x2="200" y2="392" stroke="#B45309" strokeWidth="1.8" />
          <line x1="200" y1="392" x2="392" y2="200" stroke="#B45309" strokeWidth="1.8" />
          <line x1="392" y1="200" x2="200" y2="8" stroke="#B45309" strokeWidth="1.8" />

          {[
            { h: 1, cx: 200, cy: 110, numX: 200, numY: 155 },
            { h: 2, cx: 105, cy: 50, numX: 140, numY: 80 },
            { h: 3, cx: 50, cy: 105, numX: 80, numY: 140 },
            { h: 4, cx: 110, cy: 200, numX: 155, numY: 200 },
            { h: 5, cx: 50, cy: 295, numX: 80, numY: 260 },
            { h: 6, cx: 105, cy: 350, numX: 140, numY: 320 },
            { h: 7, cx: 200, cy: 290, numX: 200, numY: 245 },
            { h: 8, cx: 295, cy: 350, numX: 260, numY: 320 },
            { h: 9, cx: 350, cy: 295, numX: 320, numY: 260 },
            { h: 10, cx: 290, cy: 200, numX: 245, numY: 200 },
            { h: 11, cx: 350, cy: 105, numX: 320, numY: 140 },
            { h: 12, cx: 295, cy: 50, numX: 260, numY: 80 }
          ].map(cell => {
            const ascIdx = SOUTH_BOXES.findIndex(b => b.sign.toLowerCase() === ascSignName.toLowerCase());
            const signIdx = (ascIdx + (cell.h - 1)) % 12;
            const signName = SOUTH_BOXES[signIdx]?.sign || "Aries";
            const boxPlanets = getVPlanetsInSign(signName);
            const signNum = signIdx + 1;

            return (
              <g key={cell.h}>
                <text x={cell.numX} y={cell.numY} fill="#B45309" fontSize="13" fontWeight="900" textAnchor="middle">
                  {signNum}
                </text>
                {boxPlanets.map((p, pIdx) => {
                  const pColor =
                    p.name === "Sun" ? "#B45309" :
                    p.name === "Moon" ? "#312E81" :
                    p.name === "Mars" ? "#B91C1C" :
                    p.name === "Mercury" ? "#047857" :
                    p.name === "Jupiter" ? "#C2410C" :
                    p.name === "Venus" ? "#BE185D" :
                    p.name === "Saturn" ? "#0F172A" :
                    p.name === "Rahu" ? "#6B21A8" : "#713F12";

                  const yOffset = cell.cy - (boxPlanets.length - 1) * 8 + pIdx * 16;
                  return (
                    <g key={p.name}>
                      <rect x={cell.cx - 22} y={yOffset - 11} width={44} height={15} fill="rgba(255, 255, 255, 0.90)" stroke="rgba(203, 213, 225, 0.4)" strokeWidth="0.5" rx="3" />
                      <text x={cell.cx} y={yOffset} fill={pColor} fontSize="12" fontWeight="800" textAnchor="middle">
                        {isTamil ? (PLANET_NAMES_TAMIL[p.name] || p.name) : p.name.substring(0, 2)}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      );
    } else {
      // East Indian Chart (Bangla / Odia style)
      return (
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full select-none"
          textRendering="optimizeLegibility"
          style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
          <rect x="8" y="8" width="384" height="384" fill="#FFFDF9" stroke="#B45309" strokeWidth="2.5" rx="6" />
          <line x1="8" y1="8" x2="392" y2="392" stroke="#B45309" strokeWidth="1.8" />
          <line x1="8" y1="392" x2="392" y2="8" stroke="#B45309" strokeWidth="1.8" />
          <rect x="105" y="105" width="190" height="190" fill="#FAF5EB" stroke="#B45309" strokeWidth="1.5" rx="4" />
          <line x1="105" y1="105" x2="295" y2="295" stroke="#B45309" strokeWidth="1.5" />
          <line x1="105" y1="295" x2="295" y2="105" stroke="#B45309" strokeWidth="1.5" />

          <text x="200" y="195" textAnchor="middle" fill="#78350F" fontSize="16" fontWeight="900">
            {vargaCode} East Indian
          </text>
          <text x="200" y="215" textAnchor="middle" fill="#9A3412" fontSize="12" fontWeight="800">
            {ascSignName}
          </text>

          {/* 12 East Indian Fixed Houses */}
          {[
            { sign: "Aries", cx: 200, cy: 55 },
            { sign: "Taurus", cx: 295, cy: 55 },
            { sign: "Gemini", cx: 345, cy: 105 },
            { sign: "Cancer", cx: 345, cy: 200 },
            { sign: "Leo", cx: 345, cy: 295 },
            { sign: "Virgo", cx: 295, cy: 345 },
            { sign: "Libra", cx: 200, cy: 345 },
            { sign: "Scorpio", cx: 105, cy: 345 },
            { sign: "Sagittarius", cx: 55, cy: 295 },
            { sign: "Capricorn", cx: 55, cy: 200 },
            { sign: "Aquarius", cx: 55, cy: 105 },
            { sign: "Pisces", cx: 105, cy: 55 }
          ].map(h => {
            const boxPlanets = getVPlanetsInSign(h.sign);
            const isAsc = h.sign.toLowerCase() === ascSignName.toLowerCase();

            return (
              <g key={h.sign}>
                <text x={h.cx} y={h.cy - 10} fill={isAsc ? "#9A3412" : "#64748B"} fontSize="11" fontWeight="800" textAnchor="middle">
                  {h.sign.substring(0, 3)} {isAsc && "(Asc)"}
                </text>
                {boxPlanets.map((p, pIdx) => (
                  <text key={p.name} x={h.cx} y={h.cy + 6 + pIdx * 13} fill="#0F172A" fontSize="11" fontWeight="800" textAnchor="middle">
                    {p.name.substring(0, 2)}
                  </text>
                ))}
              </g>
            );
          })}
        </svg>
      );
    }
  };

  // Compute Bhava Chalit data
  const lat = chartData?.profile?.latitude ?? chartData?.latitude ?? null;
  const lng = chartData?.profile?.longitude ?? chartData?.longitude ?? null;
  const ascLong = chartData?.ascendant?.longitude ?? chartData?.ascendantLong ?? null;
  const chalitData = (ascLong !== null && lat !== null && lng !== null) ? calculateBhavaChalit(ascLong, planets, lat, lng) : null;
  const avasthasData = ascLong !== null ? calculatePlanetaryAvasthas(planets, ascLong) : null;
  const functionalLordship = ascendantSign?.name ? getFunctionalLordshipMatrix(ascendantSign.name) : null;
  const jaiminiSystem = ascLong !== null ? calculateJaiminiSystem(planets, ascLong, divisionalCharts) : null;

  // Compute D60 Stability
  const d60Stability = chartData?.d60StabilityTest || ((lat !== null && lng !== null) ? calculateD60StabilityTest(chartData?.birthInstantUtc || chartData?.date || new Date(), lat, lng, chartData?.utcOffset || chartData?.profile?.utcOffset || 5.5) : null);

  return (
    <div className="space-y-6">
      {/* 1. Traditional Panchangam & Birth Details Banner */}
      {panchangam && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-50 to-amber-100/70 border border-amber-300/80 shadow-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-amber-600" />
              {isTamil ? "ஜனன பஞ்சாங்கம் (Thirukanitha / Lahiri Ephemeris)" : "Natal Panchangam (Vedic Ephemeris)"}
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white text-amber-900 border border-amber-300 font-semibold shadow-sm">
              {isTamil ? `லஹிரி அயனாம்சம்: ${chartData.ayanamsaDms}` : `Lahiri Ayanamsa: ${chartData.ayanamsaDms}`}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white border border-amber-200/80 shadow-sm">
              <span className="text-[10px] text-stone-500 block uppercase font-semibold">{isTamil ? "தமிழ் வருடம் & மாதம்" : "Tamil Year & Month"}</span>
              <span className="font-bold text-stone-900">{isTamil ? `${panchangam.tamilYear}` : panchangam.tamilMonthEn}</span>
              <span className="text-[11px] text-amber-700 block font-medium">{isTamil ? `${panchangam.tamilMonth} மாதம்` : panchangam.tamilYear}</span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-amber-200/80 shadow-sm">
              <span className="text-[10px] text-stone-500 block uppercase font-semibold">{isTamil ? "திதி & பட்சம்" : "Thithi & Paksha"}</span>
              <span className="font-bold text-stone-900">{isTamil ? panchangam.thithi : panchangam.thithiEn}</span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-amber-200/80 shadow-sm">
              <span className="text-[10px] text-stone-500 block uppercase font-semibold">{isTamil ? "யோகம் & கரணம்" : "Yoga & Karana"}</span>
              <span className="font-bold text-purple-700">{panchangam.yogam}</span>
              <span className="text-[11px] text-stone-500 block">{panchangam.karanam}</span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-amber-200/80 shadow-sm">
              <span className="text-[10px] text-stone-500 block uppercase font-semibold">{isTamil ? "பிறப்பு தசா இருப்பு" : "Birth Dasha Balance"}</span>
              <span className="font-bold text-emerald-700">{isTamil ? panchangam.dashaBalance : panchangam.dashaBalanceEn}</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Planetary Triad Highlights (Sun, Moon, Ascendant) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sun Sign */}
        <div className="p-5 rounded-2xl glass-card border border-amber-300/80 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">{t.sunSignTitle}</span>
            <span className="text-2xl">{sunSign.symbol}</span>
          </div>
          <h3 className="text-xl font-serif font-bold text-stone-900 mt-2">
            {isTamil ? `${SIGN_NAMES_TAMIL[sunSign.name] || sunSign.name} (${sunSign.name})` : sunSign.name}
          </h3>
          <p className="text-xs text-stone-600 mt-1">
            {isTamil ? `நட்சத்திரம்: ${sunNakshatra.tamil} (பாதம் ${sunNakshatra.pada})` : `Nakshatra: ${sunNakshatra.name} (Pada ${sunNakshatra.pada})`}
          </p>
          <div className="mt-3 pt-3 border-t border-amber-200/80 flex items-center justify-between text-[11px] text-stone-600">
            <span>{t.element} <strong className="text-amber-800 font-bold">{sunSign.element}</strong></span>
            <span>{t.ruler} <strong className="text-amber-800 font-bold">{sunSign.ruler}</strong></span>
          </div>
        </div>

        {/* Moon Sign & Nakshatra */}
        <div className="p-5 rounded-2xl glass-card border border-purple-300/80 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">{t.moonSignTitle}</span>
            <span className="text-2xl">{moonSign.symbol}</span>
          </div>
          <h3 className="text-xl font-serif font-bold text-stone-900 mt-2">
            {isTamil ? `${SIGN_NAMES_TAMIL[moonSign.name] || moonSign.name} (${moonSign.name})` : moonSign.name}
          </h3>
          <p className="text-xs text-stone-600 mt-1">
            {t.nakshatraLabel} <span className="text-purple-800 font-semibold">{isTamil ? moonNakshatra.tamil : moonNakshatra.name} (பாதம் {moonNakshatra.pada})</span>
          </p>
          <div className="mt-3 pt-3 border-t border-purple-200/80 flex items-center justify-between text-[11px] text-stone-600">
            <span>{t.lordLabel} <strong className="text-purple-800 font-bold">{moonNakshatra.ruler}</strong></span>
            <span>{t.syllableLabel} <strong className="text-purple-800 font-bold">{moonNakshatra.luckySyllable}</strong></span>
          </div>
        </div>

        {/* Ascendant */}
        <div className="p-5 rounded-2xl glass-card border border-orange-300/80 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-700">{t.ascendantTitle}</span>
            <span className="text-2xl">{ascendantSign.symbol}</span>
          </div>
          <h3 className="text-xl font-serif font-bold text-stone-900 mt-2">
            {isTamil ? `${SIGN_NAMES_TAMIL[ascendantSign.name] || ascendantSign.name} (${ascendantSign.name})` : ascendantSign.name}
          </h3>
          <p className="text-xs text-stone-600 mt-1">
            {isTamil ? `நவாம்ச லக்னம்: ${ascendantNavamsa?.signTamil || ""}` : `Navamsa Lagna: ${ascendantNavamsa?.signName || ""}`}
          </p>
          <div className="mt-3 pt-3 border-t border-orange-200/80 flex items-center justify-between text-[11px] text-stone-600">
            <span>{t.house1Cusps}</span>
            <span>{t.qualityLabel} <strong className="text-orange-800 font-bold">{ascendantSign.quality}</strong></span>
          </div>
        </div>
      </div>

      {/* 3. Comprehensive Multi-Chart & Astrological Explorer Controls */}
      <div className="p-6 rounded-3xl glass-card border border-amber-300/80 space-y-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-200/80 pb-4">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-600" />
            <h3 className="font-serif font-bold text-stone-900 text-lg">
              {isTamil ? "முழு சோடசவர்க்கம் & உயர் ஜோதிட ஆய்வுக் கூடம்" : "Shodashavarga & Astrological Explorer"}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex flex-wrap items-center bg-amber-50 p-1 rounded-xl border border-amber-200/80 text-xs shadow-inner gap-1">
              <button
                onClick={() => setChartViewMode("d1_d9")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  chartViewMode === "d1_d9" ? "bg-amber-600 text-white shadow-xs" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {isTamil ? "ராசி & நவாம்சம் (D1+D9)" : "D1 & D9 Charts"}
              </button>
              <button
                onClick={() => setChartViewMode("all_vargas")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  chartViewMode === "all_vargas" ? "bg-amber-600 text-white shadow-xs" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {isTamil ? "16 வர்க்க சக்கரங்கள் (D1-D60)" : "All 16 Vargas"}
              </button>
              <button
                onClick={() => setChartViewMode("bhava_chalit")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  chartViewMode === "bhava_chalit" ? "bg-cyan-700 text-white shadow-xs" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {isTamil ? "பாவ சலித சக்கரம் (Bhava Chalit)" : "Bhava Chalit"}
              </button>
              <button
                onClick={() => setChartViewMode("planets_deep")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  chartViewMode === "planets_deep" ? "bg-purple-600 text-white shadow-xs" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {isTamil ? "நவகிரக அவஸ்தைகள் (Avasthas)" : "9-Graha Avasthas"}
              </button>
              <button
                onClick={() => setChartViewMode("bhavas_deep")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  chartViewMode === "bhavas_deep" ? "bg-emerald-700 text-white shadow-xs" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {isTamil ? "12 பாவ ஆரூடம் (Arudha Padas)" : "12-Bhava & Arudha"}
              </button>
              <button
                onClick={() => setChartViewMode("d60_stability")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  chartViewMode === "d60_stability" ? "bg-rose-600 text-white shadow-xs" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {isTamil ? "D60 ±2 நிமி நிலைத்தன்மை" : "D60 Stability Test"}
              </button>
            </div>

            {/* South / North / East Style Switcher */}
            <div className="flex items-center bg-amber-50 p-1 rounded-xl border border-amber-200/80 text-xs shadow-inner">
              <button
                onClick={() => setChartStyle("south")}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  chartStyle === "south" ? "bg-amber-500 text-white shadow-sm" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {t.southStyle || "South"}
              </button>
              <button
                onClick={() => setChartStyle("north")}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  chartStyle === "north" ? "bg-amber-500 text-white shadow-sm" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {t.northStyle || "North"}
              </button>
              <button
                onClick={() => setChartStyle("east")}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  chartStyle === "east" ? "bg-amber-500 text-white shadow-sm" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {isTamil ? "கிழக்கு" : "East"}
              </button>
            </div>
          </div>
        </div>

        {/* View Mode 1: D1 & D9 Side-by-Side */}
        {chartViewMode === "d1_d9" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold uppercase shadow-sm">
                {isTamil ? "ராசி கட்டம் (D1 - Rasi Chart)" : "D1 Rasi Chart"}
              </div>
              <div className="relative aspect-square max-w-[480px] mx-auto bg-[#FFFDF9] rounded-2xl border-2 border-amber-400 p-2 shadow-md">
                {renderVargaSvg("D1", isTamil ? "ராசி" : "RASI")}
              </div>
            </div>

            <div className="space-y-2 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 border border-purple-300 text-purple-900 text-xs font-bold uppercase shadow-sm">
                {isTamil ? "நவாம்ச கட்டம் (D9 - Navamsa Chart)" : "D9 Navamsa Chart"}
              </div>
              <div className="relative aspect-square max-w-[480px] mx-auto bg-[#FFFDF9] rounded-2xl border-2 border-purple-400 p-2 shadow-md">
                {renderVargaSvg("D9", isTamil ? "நவாம்சம்" : "NAVAMSA")}
              </div>
            </div>
          </div>
        )}

        {/* View Mode 2: All 16 Vargas Selector */}
        {chartViewMode === "all_vargas" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 p-3 bg-amber-50/70 rounded-2xl border border-amber-200">
              {VARGA_LIST.map(v => (
                <button
                  key={v.code}
                  onClick={() => setSelectedVarga(v.code)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedVarga === v.code
                      ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                      : "bg-white text-stone-700 hover:bg-amber-100/60 border border-amber-200/70"
                  }`}
                >
                  {v.code} - {isTamil ? v.nameTa : v.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7">
                <div className="relative aspect-square max-w-[480px] mx-auto bg-[#FFFDF9] rounded-2xl border-2 border-amber-400 p-2 shadow-md">
                  {renderVargaSvg(selectedVarga, isTamil ? VARGA_LIST.find(v => v.code === selectedVarga)?.nameTa : VARGA_LIST.find(v => v.code === selectedVarga)?.name)}
                </div>
              </div>

              <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-amber-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 font-mono font-bold text-xs">
                    {selectedVarga}
                  </span>
                  <h4 className="text-lg font-serif font-bold text-stone-900">
                    {isTamil ? VARGA_LIST.find(v => v.code === selectedVarga)?.nameTa : VARGA_LIST.find(v => v.code === selectedVarga)?.name}
                  </h4>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">
                  {VARGA_LIST.find(v => v.code === selectedVarga)?.purpose}
                </p>

                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-stone-600">{isTamil ? "வர்க்க லக்னம்:" : "Varga Ascendant:"}</span>
                    <strong className="text-stone-900">{getVargaChartData(selectedVarga).ascendantSign}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">{isTamil ? "சாஸ்திர முக்கியத்துவம்:" : "Classical Authority:"}</span>
                    <strong className="text-amber-800">BPHS Chapter 6 Shodashavarga</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Mode 3: Bhava Chalit Chart */}
        {chartViewMode === "bhava_chalit" && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200 text-xs text-cyan-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Info className="w-4 h-4 text-cyan-700" />
                <span>{isTamil ? "ஸ்ரீபதி சம பாவ சலித கணித முறை விளக்கம்" : "Sripati Equal Bhava Chalit Disclosure"}</span>
              </div>
              <p>
                {isTamil
                  ? "ராசி சக்கரத்தில் முழு ராசியும் (Whole Sign) ஒரு பாவகமாகக் கருதப்படும். ஆனால் பாவ சலிதத்தில் லக்ன பாகை மத்திய புள்ளியாகக் கொண்டு பாவ எல்லைகள் பிரிக்கப்படுகின்றன. இதனால் சில கிரகங்கள் அடுத்த அல்லது முந்தைய பாவகத்திற்கு இடம் மாறலாம்."
                  : "While the Rasi chart uses Whole Sign houses, Bhava Chalit computes unequal/equal house boundaries using Sripati cusps. Planets near sign boundaries may shift to adjacent bhavas."}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <div className="relative aspect-square max-w-[480px] mx-auto bg-[#FFFDF9] rounded-2xl border-2 border-cyan-400 p-2 shadow-md">
                  {renderVargaSvg("D1", isTamil ? "பாவ சலிதம்" : "CHALIT")}
                </div>
              </div>

              <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-cyan-200 shadow-sm space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-cyan-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-700" />
                  {isTamil ? "இடம் மாறிய கிரகங்கள் & பாவ எல்லைகள்" : "Bhava Shifts & Cusp Boundaries"}
                </h4>

                {chalitData?.shiftedPlanets && chalitData.shiftedPlanets.length > 0 ? (
                  <div className="space-y-2">
                    {chalitData.shiftedPlanets.map((sp, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs space-y-1">
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-amber-900">{sp.planet}</span>
                          <span className="text-stone-700 font-mono">Rasi H{sp.rasiHouse} → Chalit H{sp.chalitHouse}</span>
                        </div>
                        <p className="text-[11px] text-stone-600">{sp.reason || sp.explanation}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-600 bg-stone-50 p-3 rounded-xl">
                    {isTamil ? "அனைத்து கிரகங்களும் ராசி மற்றும் பாவ சலிதத்தில் ஒரே பாவகத்தில் அமைந்துள்ளன." : "All 9 Grahas remain in their congruent Whole Sign houses in the Bhava Chalit."}
                  </p>
                )}

                <div className="overflow-x-auto max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-cyan-50 text-cyan-900 font-bold border-b border-cyan-200">
                      <tr>
                        <th className="p-1.5">Bhava</th>
                        <th className="p-1.5">Madhya (Cusp)</th>
                        <th className="p-1.5">Sign</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyan-100">
                      {(chalitData?.cusps || []).map((c, i) => (
                        <tr key={i}>
                          <td className="p-1.5 font-bold text-stone-900">H{i + 1}</td>
                          <td className="p-1.5 font-mono text-stone-700">{c.degree?.toFixed(2)}°</td>
                          <td className="p-1.5 text-cyan-800">{c.sign}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Mode 4: 9-Graha Avasthas & Deep Profiles */}
        {chartViewMode === "planets_deep" && (
          <div className="space-y-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-700" />
              {isTamil ? "நவகிரக பாலடி, ஜாக்ரதாதி & தீப்தாதி அவஸ்தைகள்" : "9-Graha Baladi, Jagratadi & Deeptadi Avasthas Matrix"}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(avasthasData?.planets || planets || []).map(p => {
                const dispositor = calculateNakshatraDispositorProfile(p, planets, ascLong);
                return (
                  <div key={p.name} className="p-4 rounded-2xl bg-white border border-purple-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                        <h5 className="font-bold text-sm text-stone-900">
                          {isTamil ? (PLANET_NAMES_TAMIL[p.name] || p.name) : p.name}
                        </h5>
                      </div>
                      <span className="text-xs font-mono font-bold text-purple-800">
                        {p.deg?.toFixed(2)}° ({p.sign})
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-stone-500">Baladi (5-fold):</span>
                        <strong className="text-amber-900">{p.baladiAvastha || "Yuva (Youthful)"}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Jagratadi (3-fold):</span>
                        <strong className="text-purple-800">{p.jagratadiAvastha || "Jagrata (Awake)"}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Deeptadi (9-fold):</span>
                        <strong className="text-emerald-800">{p.deeptadiAvastha || "Swastha (Content)"}</strong>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-stone-100">
                        <span className="text-stone-500">Nakshatra Deity:</span>
                        <strong className="text-stone-800">{dispositor?.deity || "-"}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Dispositor Chain:</span>
                        <span className="text-[11px] font-mono font-bold text-cyan-800">{dispositor?.chain || `${p.name} → Sign Lord`}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* View Mode 5: 12-Bhava & Arudha Padas */}
        {chartViewMode === "bhavas_deep" && (
          <div className="space-y-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-700" />
              {isTamil ? "12 பாவகங்கள் & ஜைமினி ஆரூட பாதங்கள் (AL, UL, A1-A12)" : "12-Bhava Matrix & Jaimini Arudha Padas"}
            </h4>

            {/* Arudha Lagna & Upapada Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 space-y-1">
                <span className="text-[10px] font-bold uppercase text-amber-900">Arudha Lagna (AL) - Public Persona</span>
                <h5 className="font-bold text-base text-stone-900">
                  {jaiminiSystem?.arudhaLagna?.sign ? `${jaiminiSystem.arudhaLagna.sign} (H${jaiminiSystem.arudhaLagna.house})` : "—"}
                </h5>
                <p className="text-xs text-stone-600">Reflects worldly status, public perception, and financial reputation.</p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-300 space-y-1">
                <span className="text-[10px] font-bold uppercase text-purple-900">Upapada Lagna (UL) - Marital Matrix</span>
                <h5 className="font-bold text-base text-stone-900">
                  {jaiminiSystem?.upapadaLagna?.sign ? `${jaiminiSystem.upapadaLagna.sign} (H${jaiminiSystem.upapadaLagna.house})` : "—"}
                </h5>
                <p className="text-xs text-stone-600">Reflects marital harmony, spouse's background, and relational longevity.</p>
              </div>
            </div>

            {/* 12 Bhava Padas Table */}
            {jaiminiSystem?.bhavaPadas && jaiminiSystem.bhavaPadas.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {jaiminiSystem.bhavaPadas.map((bp, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white border border-emerald-200 text-center shadow-xs">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">{bp.pada || `A${i + 1}`}</span>
                    <strong className="text-xs text-stone-900 block mt-0.5">{bp.sign || "—"}</strong>
                    <span className="text-[10px] text-stone-500 block">{bp.house ? `H${bp.house}` : "—"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* View Mode 6: D60 Stability Test Tool */}
        {chartViewMode === "d60_stability" && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-rose-50/80 border border-rose-300 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <h4 className="font-serif font-bold text-stone-900 text-base">
                    {isTamil ? "D60 ஷஷ்டியாம்ச ±2 நிமிட பிறப்பு நேர நிலைத்தன்மை சோதனை" : "D60 Shashtiamsha ±2-Minute Sensitivity Test"}
                  </h4>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  d60Stability?.isStable
                    ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                    : "bg-rose-100 text-rose-900 border-rose-300"
                }`}>
                  {isTamil ? (d60Stability?.stabilityLevelTa || d60Stability?.classification || "உணர்திறன் ஆய்வு") : (d60Stability?.classification || "Sensitivity Active")}
                </span>
              </div>

              <p className="text-xs text-stone-700 leading-relaxed">
                {isTamil
                  ? "லக்ன பாகை வேகத்தைப் பொறுத்து சஷ்டியாம்ச (D60) 0°30′ பகுதி சில நிமிடங்களிலேயே மாறக்கூடியது. பிறப்பு நேரத்தில் ±2 நிமிடங்கள் மாறுபட்டால் D60 லக்னம், பகுதி (Part 1-60) மற்றும் அதிதேவதை எவ்வாறு மாறுகிறது என்பதை கீழே காண்க."
                  : "Parashara mandates that D60 is the ultimate discriminator for karmic lineage and subtle calibration. Because the 0°30′ D60 division shifts every few minutes depending on local rising speed, precision birth time verification is essential."}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="p-3.5 rounded-2xl bg-white border border-rose-200 space-y-1 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-stone-500">T - 2 Minutes</span>
                  <h5 className="font-bold text-sm text-stone-900">{d60Stability?.minus2Min?.sign || d60Stability?.tMinus2Min?.sign || "-"}</h5>
                  <div className="text-[10px] font-mono text-purple-700 font-bold">
                    {d60Stability?.minus2Min?.partIndex ? `Part ${d60Stability.minus2Min.partIndex}/60 (0°30′)` : "0°30′ Division"}
                  </div>
                  <div className="text-[10px] text-stone-600 font-medium">
                    {d60Stability?.minus2Min?.deity ? `Deity: ${d60Stability.minus2Min.deity}` : ""}
                  </div>
                  <span className="text-[10px] text-rose-700 font-mono block pt-0.5">
                    Asc: {d60Stability?.minus2Min?.ascLongitude ? `${d60Stability.minus2Min.ascLongitude}°` : "-"}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-400 shadow-sm space-y-1">
                  <span className="text-[10px] uppercase font-bold text-amber-900">T (Recorded Time)</span>
                  <h5 className="font-bold text-base text-stone-900">{d60Stability?.exactTime?.sign || d60Stability?.tCenter?.sign || divisionalCharts?.d60Shashtiamsha?.ascendant?.name || "-"}</h5>
                  <div className="text-[10px] font-mono text-purple-800 font-bold">
                    {d60Stability?.exactTime?.partIndex ? `Part ${d60Stability.exactTime.partIndex}/60 (0°30′)` : "0°30′ Division"}
                  </div>
                  <div className="text-[10px] text-amber-900 font-medium">
                    {d60Stability?.exactTime?.deity ? `Deity: ${d60Stability.exactTime.deity}` : ""}
                  </div>
                  <span className="text-[10px] text-amber-800 font-bold block pt-0.5">
                    Asc: {d60Stability?.exactTime?.ascLongitude ? `${d60Stability.exactTime.ascLongitude}°` : "-"}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-rose-200 space-y-1 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-stone-500">T + 2 Minutes</span>
                  <h5 className="font-bold text-sm text-stone-900">{d60Stability?.plus2Min?.sign || d60Stability?.tPlus2Min?.sign || "-"}</h5>
                  <div className="text-[10px] font-mono text-purple-700 font-bold">
                    {d60Stability?.plus2Min?.partIndex ? `Part ${d60Stability.plus2Min.partIndex}/60 (0°30′)` : "0°30′ Division"}
                  </div>
                  <div className="text-[10px] text-stone-600 font-medium">
                    {d60Stability?.plus2Min?.deity ? `Deity: ${d60Stability.plus2Min.deity}` : ""}
                  </div>
                  <span className="text-[10px] text-rose-700 font-mono block pt-0.5">
                    Asc: {d60Stability?.plus2Min?.ascLongitude ? `${d60Stability.plus2Min.ascLongitude}°` : "-"}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-rose-800 italic bg-white/70 p-3 rounded-xl border border-rose-200">
                {isTamil ? (d60Stability?.technicalAdvisoryTa || "ஆலோசனை: உங்கள் பிறப்பு நேரம் துல்லியமாக வினாடி வரை சரிபார்க்கப்பட்டால் மட்டுமே D60 பலன்களை முழுமையாக உறுதிப்படுத்த முடியும்.") : (d60Stability?.astrologicalAdvice || d60Stability?.technicalAdvisoryEn || "Cautionary Standard: D60 micro-predictions should be verified through retrospective life milestones before finalizing traditional karmic pattern conclusions.")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 4. Planetary Ephemeris & Dosha Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Planetary Ephemeris Table */}
        <div className="lg:col-span-7 p-6 rounded-3xl glass-card border border-amber-300/80 space-y-4 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600" />
            {isTamil ? "நவகிரக ஸ்புட நிலைகள் (Planetary Ephemeris & Longitudes)" : "Planetary Ephemeris Longitudes"}
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-800">
              <thead className="bg-amber-50 text-stone-700 uppercase text-[10px] border-b border-amber-200 font-bold">
                <tr>
                  <th className="p-2.5">{isTamil ? "கிரகம்" : "Planet"}</th>
                  <th className="p-2.5">{isTamil ? "ராசி" : "Rasi"}</th>
                  <th className="p-2.5">{isTamil ? "பாகை" : "Degree"}</th>
                  <th className="p-2.5">{isTamil ? "நட்சத்திரம் (பாதம்)" : "Nakshatra (Pada)"}</th>
                  <th className="p-2.5">{isTamil ? "நவாம்சம்" : "Navamsa"}</th>
                  <th className="p-2.5">{isTamil ? "பாவம்" : "House"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {planets.map(planet => (
                  <tr key={planet.name} className="hover:bg-amber-50/60 transition-colors">
                    <td className="p-2.5 font-bold text-stone-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      {isTamil ? planet.tamil : planet.name}
                    </td>
                    <td className="p-2.5 text-amber-800 font-bold">{isTamil ? planet.signTamil : planet.sign}</td>
                    <td className="p-2.5 font-mono text-stone-700">{planet.deg}°</td>
                    <td className="p-2.5 text-purple-800 font-medium">{isTamil ? planet.nakshatraTamil : planet.nakshatra} ({planet.pada})</td>
                    <td className="p-2.5 text-cyan-800 font-medium">{isTamil ? planet.navamsaTamil : planet.navamsaSign}</td>
                    <td className="p-2.5 font-bold text-stone-900">{planet.house}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dosha & Mahadasha Status Card */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Mahadasha */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-100/90 via-orange-50 to-amber-50 border border-amber-300 shadow-sm space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800 block">
              {t.activeDashaTitle}
            </span>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xl font-bold font-serif text-stone-900">
                  {isTamil ? `${currentDasha.tamil} மகா தசை` : `${currentDasha.lord} Mahadasha`}
                </h4>
                <p className="text-xs text-stone-600 font-medium">
                  {isTamil ? `வயது ${currentDasha.startAge} முதல் ${currentDasha.endAge} வரை` : `Ages ${currentDasha.startAge} to ${currentDasha.endAge}`}
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-amber-500 text-white text-xs font-bold shadow-sm">
                {t.activeDashaBadge}
              </div>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              {t.activeDashaDesc}
            </p>
          </div>

          {/* Dosha Diagnostics */}
          <div className="p-5 rounded-3xl glass-card border border-amber-300/80 space-y-3 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-amber-600" />
              {isTamil ? "தோஷ பரிசீலனை (Dosha Diagnostics)" : "Dosha Diagnostics"}
            </h4>

            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-stone-900">{isTamil ? "செவ்வாய் தோஷம் (Kuja / Mars Dosha)" : "Chevvai (Mars) Dosha"}</span>
                  <p className="text-[10px] text-stone-500">{doshaAnalysis.marsHouses}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  doshaAnalysis.isChevvaiDosha ? "bg-rose-100 text-rose-800 border border-rose-300" : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                }`}>
                  {doshaAnalysis.chevvaiStatus}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-stone-900">{isTamil ? "ஏழரை சனி / அஷ்டம சனி நிலை" : "Sade Sati (Ezharai Sani) Status"}</span>
                  <p className="text-[10px] text-stone-500">{isTamil ? "கோச்சார சனி சஞ்சார நிலை" : "Transit Saturn influence on Moon sign"}</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold">
                  {isTamil ? "தற்போது ஏழரை சனி இல்லை" : "No Active Sade Sati"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Complete 120-Year Vimshottari Mahadasha Timeline */}
      {dashaTable && dashaTable.length > 0 && (
        <div className="p-6 rounded-3xl glass-card border border-amber-300/80 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                {isTamil ? "120 வருட முழு விம்சோத்தரி மகா தசா காலக்கோடு" : "Complete 120-Year Vimshottari Mahadasha Timeline"}
              </h4>
              <p className="text-xs text-stone-600 mt-0.5">
                {isTamil ? "ஒவ்வொரு கிரக மகா தசையின் தொடக்க வயது, முடிவு வயது மற்றும் கால அட்டவணை" : "Chronological sequence of all planetary Mahadasha cycles with exact dates"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-9 gap-2 pt-2">
            {dashaTable.map((d, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  d.isCurrent
                    ? "bg-amber-100 border-amber-400 shadow-md"
                    : "bg-white border-amber-200/80 hover:bg-amber-50/70"
                }`}
              >
                <span className="text-[10px] text-stone-500 block uppercase font-medium">
                  {isTamil ? "தசை" : "Dasha"} {idx + 1}
                </span>
                <h5 className="font-bold text-sm text-stone-900 mt-0.5">
                  {isTamil ? d.tamil : d.lord}
                </h5>
                <span className="text-[11px] text-amber-800 font-bold block mt-1">
                  {d.durationYears} {isTamil ? "வருடங்கள்" : "yrs"}
                </span>
                <span className="text-[10px] text-stone-500 block mt-1">
                  {isTamil ? `வயது ${d.startAge} - ${d.endAge}` : `Age ${d.startAge}-${d.endAge}`}
                </span>
                {d.isCurrent && (
                  <span className="mt-2 inline-block px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-extrabold uppercase shadow-sm">
                    {isTamil ? "நடப்பு" : "Active"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Astrological Matrix (Jaimini Chara Karakas, Shadbala 6-Fold Strengths & Divisional Vargas) */}
      <div className="p-6 md:p-8 rounded-3xl glass-card border border-purple-300/80 space-y-6 relative overflow-hidden shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-purple-200/80 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 border border-purple-300 text-purple-900 text-[10px] font-bold uppercase tracking-wider shadow-sm">
              <Sparkles className="w-3 h-3 text-purple-700" />
              {isTamil ? "பராசர & ஜைமினி உயர் கணித மேட்ரிக்ஸ் (Classical Vedic Matrix)" : "Parashari & Jaimini Classical Ephemeris Matrix"}
            </div>
            <h3 className="text-xl font-serif font-bold text-stone-900 mt-1.5 flex items-center gap-2">
              {isTamil ? "ஜைமினி சப்த காரகங்கள், ஷட்பல பலம் & வர்க்க சக்கரங்கள்" : "Jaimini Chara Karakas, Shadbala & Divisional Vargas"}
            </h3>
          </div>

          {pratyantardasha && (
            <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-right shadow-sm">
              <span className="text-[10px] text-stone-500 block uppercase font-bold">
                {isTamil ? "நடப்பு தசா-புக்தி" : "Running Dasha-Bukthi"}
              </span>
              <span className="text-xs font-bold text-purple-800">
                {pratyantardasha.majorLord} → {pratyantardasha.subLord} ({pratyantardasha.antarSpanMonths}m)
              </span>
            </div>
          )}
        </div>

        {/* 3-Column Grid: Karakas, Shadbala, Vargas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. Jaimini Chara Karakas */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-700" />
              {isTamil ? "ஜைமினி சப்த காரகங்கள் (Soul Matrix)" : "Jaimini Chara Karakas"}
            </h4>

            <div className="space-y-2">
              {(jaiminiKarakas || []).map((k) => (
                <div
                  key={k.code}
                  className="p-3 rounded-xl bg-white border border-amber-200 hover:border-amber-400 transition-all flex items-center justify-between text-xs shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-bold text-[10px]">
                        {k.code}
                      </span>
                      <span className="font-bold text-stone-900">
                        {isTamil ? k.planetTa : k.planet}
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-500 block mt-0.5">
                      {isTamil ? k.roleTa : k.role}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-purple-800 text-[11px] font-bold block">{k.degInSign}</span>
                    <span className="text-[10px] text-stone-500 block">H{k.house} ({k.sign})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Shadbala 6-Fold Strengths */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-800 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-purple-700" />
              {isTamil ? "ஷட்பல கிரக பலங்கள் (Shadbala Rupas)" : "Shadbala Strength Matrix"}
            </h4>

            <div className="space-y-2">
              {(shadbala || []).map((s) => {
                const ratioVal = s.ratio || (s.totalRupas / (s.requiredRupas || 6.0));
                const ratioPercent = Math.round(ratioVal * 100);
                return (
                  <div
                    key={s.planet}
                    className="p-3 rounded-xl bg-white border border-purple-200 space-y-1.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-stone-900">
                        {isTamil ? s.planetTa : s.planet}
                      </span>
                      <span className="font-mono text-emerald-700 font-bold text-[11px]">
                        {s.totalRupas} / {s.requiredRupas} Rupas (Ratio: {s.ratio})
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-stone-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          ratioPercent >= 110
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                            : ratioPercent >= 95
                            ? "bg-gradient-to-r from-amber-500 to-orange-500"
                            : "bg-gradient-to-r from-purple-500 to-indigo-500"
                        }`}
                        style={{ width: `${Math.min(100, ratioPercent)}%` }}
                      />
                    </div>

                    <span className="text-[10px] text-stone-500 block">
                      {s.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Micro-Divisional Charts (D7, D10, D60) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-700" />
              {isTamil ? "வர்க்க சக்கரங்கள் (Divisional Vargas)" : "Micro-Divisional Vargas"}
            </h4>

            {divisionalCharts && (
              <div className="space-y-3 text-xs">
                {/* D10 Dasamsha */}
                <div className="p-3.5 rounded-2xl bg-white border border-cyan-200 space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-900">D10 Dasamsha (தசாம்சம்)</span>
                    <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-900 text-[10px] font-bold border border-cyan-300">
                      {isTamil ? `லக்னம்: ${divisionalCharts.d10Dasamsha?.ascendant?.tamil}` : `Asc: ${divisionalCharts.d10Dasamsha?.ascendant?.name}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600">
                    {isTamil ? "தொழில் தலைமை, அரசு பதவிகள் & பொது அந்தஸ்து" : "Executive career command, public authority & high status"}
                  </p>
                </div>

                {/* D60 Shashtiamsha */}
                <div className="p-3.5 rounded-2xl bg-white border border-purple-200 space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900">D60 Shashtiamsha (ஷஷ்டியாம்சம்)</span>
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 text-[10px] font-bold border border-purple-300">
                      {isTamil ? `லக்னம்: ${divisionalCharts.d60Shashtiamsha?.ascendant?.tamil}` : `Asc: ${divisionalCharts.d60Shashtiamsha?.ascendant?.name}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600">
                    {isTamil ? "பாரம்பரிய கர்ம வினைகள் & இரட்டைப் பிறப்பு நுணுக்க கணிப்பு" : "Traditional karmic themes, twin birth differentiation & micro-zodiac calibration"}
                  </p>
                </div>

                {/* D7 Saptamsha */}
                <div className="p-3.5 rounded-2xl bg-white border border-amber-200 space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900">D7 Saptamsha (சப்தாம்சம்)</span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300">
                      {isTamil ? `லக்னம்: ${divisionalCharts.d7Saptamsha?.ascendant?.tamil}` : `Asc: ${divisionalCharts.d7Saptamsha?.ascendant?.name}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600">
                    {isTamil ? "புத்ர பாக்கியம், வம்ச விருத்தி & படைப்பாற்றல்" : "Progeny fortune, lineage continuity & creative fruitfulness"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 7. Parashari Sarvashtakavarga (337 Bindus) - 12 Bhava Matrix */}
      {ashtakavargaPoints && ashtakavargaPoints.length === 12 && (
        <div className="p-6 md:p-8 rounded-3xl glass-card border border-emerald-300/80 space-y-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-200/80 pb-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                {isTamil ? "பராசர சர்வ அஷ்டகவர்க்கம் (337 பரல்கள்)" : "Classical Sarvashtakavarga (337 Bindus)"}
              </div>
              <h3 className="text-xl font-serif font-bold text-stone-900 mt-1.5">
                {isTamil ? "12 ராசி பாவக பரல்கள் & சுப யோக பலம்" : "12-Rasi Bhava Bindu Distribution & Strength Matrix"}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-right shadow-sm">
              <span className="text-[10px] text-stone-500 block uppercase font-bold">
                {isTamil ? "மொத்த பரல்கள்" : "Total Bindus"}
              </span>
              <span className="text-xs font-bold text-emerald-900 font-mono">
                {ashtakavarga?.totalBindus || 337} / 337 (Parashari Benchmark)
              </span>
            </div>
          </div>

          {/* 12-Sign Bindu Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { sign: "Aries", nameTa: "மேஷம்", idx: 0 },
              { sign: "Taurus", nameTa: "ரிஷபம்", idx: 1 },
              { sign: "Gemini", nameTa: "மிதுனம்", idx: 2 },
              { sign: "Cancer", nameTa: "கடகம்", idx: 3 },
              { sign: "Leo", nameTa: "சிம்மம்", idx: 4 },
              { sign: "Virgo", nameTa: "கன்னி", idx: 5 },
              { sign: "Libra", nameTa: "துலாம்", idx: 6 },
              { sign: "Scorpio", nameTa: "விருச்சிகம்", idx: 7 },
              { sign: "Sagittarius", nameTa: "தனுசு", idx: 8 },
              { sign: "Capricorn", nameTa: "மகரம்", idx: 9 },
              { sign: "Aquarius", nameTa: "கும்பம்", idx: 10 },
              { sign: "Pisces", nameTa: "மீனம்", idx: 11 },
            ].map(r => {
              const bindus = ashtakavargaPoints[r.idx];
              const isHigh = bindus >= 28;
              const isMedium = bindus >= 25 && bindus < 28;
              const isLow = bindus < 25;

              return (
                <div
                  key={r.sign}
                  className={`p-3.5 rounded-2xl border text-center transition-all ${
                    isHigh
                      ? "bg-emerald-50/90 border-emerald-300 shadow-sm"
                      : isMedium
                      ? "bg-amber-50/80 border-amber-300"
                      : "bg-rose-50/70 border-rose-200"
                  }`}
                >
                  <span className="text-[11px] font-bold text-stone-700 block">
                    {isTamil ? r.nameTa : r.sign}
                  </span>
                  <div className="text-xl font-mono font-extrabold my-1 text-stone-900">
                    {bindus} <span className="text-[10px] font-normal text-stone-500">{isTamil ? "பரல்கள்" : "pts"}</span>
                  </div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      isHigh
                        ? "bg-emerald-200 text-emerald-900"
                        : isMedium
                        ? "bg-amber-200 text-amber-900"
                        : "bg-rose-200 text-rose-900"
                    }`}
                  >
                    {isHigh
                      ? (isTamil ? "அதி சுபம் (>=28)" : "Strong (>=28)")
                      : isMedium
                      ? (isTamil ? "மத்திமம் (25-27)" : "Moderate (25-27)")
                      : (isTamil ? "விழிப்புணர்வு (<25)" : "Challenging (<25)")}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-stone-500 italic bg-white/60 p-3 rounded-xl border border-stone-200">
            {isTamil
              ? "குறிப்பு: பராசர சர்வ அஷ்டகவர்க்க சாஸ்திரப்படி 28 அல்லது அதற்கு மேற்பட்ட பரல்கள் பெற்ற பாவங்கள் / ராசிகள் கோச்சார சஞ்சாரங்களின் போது மிக உயர்ந்த நற்பலன்களையும், 25-27 பரல்கள் சமமான நற்பலன்களையும் வழங்குகின்றன."
              : "Parashari Principle: Signs with 28+ bindus deliver peak prosperity and success during transits; 25-27 bindus indicate balanced stability, while <25 bindus warrant strategic patience and Vedic remedies."}
          </p>
        </div>
      )}
      {/* Action Banner: Open Complete 18-Chapter Detailed Report and PDF Export */}
      {onOpenDetailedReport && (
        <div className="p-5 md:p-6 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-400/90 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <h3 className="font-serif font-bold text-stone-900 text-base md:text-lg">
                {isTamil ? "முழுமையான 18 அத்தியாய மகா ஜோதிட அறிக்கை மற்றும் PDF சேமிப்பு" : "Complete 18-Chapter Astrological Life Dossier & PDF Export"}
              </h3>
            </div>
            <p className="text-xs text-stone-600 max-w-xl">
              {isTamil
                ? "ஆரோக்கியம், கல்வி, தொழில், பூமி/வாகனம், அரசியல் தலைமை, 16 வர்க்கங்கள், ஷட்பலம் மற்றும் முழுமையான அஷ்டகவர்க்க அட்டவணைகளை PDF ஆக சேமிக்க."
                : "Explore multi-domain lifecycle analysis, full 16 harmonic vargas, Shadbala calculation ledger, Ashtakavarga, and download Minimal or Detailed Master PDF."}
            </p>
          </div>
          <button
            onClick={onOpenDetailedReport}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 shrink-0 cursor-pointer transition-all"
          >
            <Sparkles className="w-4 h-4 fill-amber-300 text-amber-300" />
            <span>{isTamil ? "முழு அறிக்கையைத் திறக்கவும் (PDF)" : "Open Complete Report (PDF)"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
