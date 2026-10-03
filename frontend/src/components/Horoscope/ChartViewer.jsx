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
  Info,
  Lock,
  FileText
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
import PlanetDetailModal from "./PlanetDetailModal";
import CalculationCertificateModal from "./CalculationCertificateModal";
import BirthTimeConfidenceCard from "./BirthTimeConfidenceCard";

export default function ChartViewer({
  chartData,
  lang = "en",
  onOpenDetailedReport = null,
  isExpertMode = false,
  onAskAboutPlanet = null,
  currentUser = null,
  onOpenAuth = null,
  onOpenPricing = null
}) {
  const [chartStyle, setChartStyle] = useState("south"); // "south", "north", "east"
  const [chartViewMode, setChartViewMode] = useState(() => (isExpertMode ? "expert_sheet" : "d1_d9")); // "expert_sheet", "d1_d9", "all_vargas", "bhava_chalit", "planets_deep", "bhavas_deep", "d60_stability"
  const [selectedVarga, setSelectedVarga] = useState("D1");
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [isPlanetModalOpen, setIsPlanetModalOpen] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [birthConfidence, setBirthConfidence] = useState("hospital");
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  React.useEffect(() => {
    if (isExpertMode && chartViewMode === "d1_d9") {
      setChartViewMode("expert_sheet");
    } else if (!isExpertMode && chartViewMode === "expert_sheet") {
      setChartViewMode("d1_d9");
    }
  }, [isExpertMode]);

  if (!chartData) return null;
  const {
    sunSign, moonSign, ascendantSign, moonNakshatra, sunNakshatra,
    planets, currentDasha, dashaTable, panchangam, doshaAnalysis,
    ascendantNavamsa, system, jaiminiKarakas, shadbala, divisionalCharts, pratyantardasha,
    ashtakavarga, ashtakavargaPoints
  } = chartData;

  const isTamil = lang === "ta";

  const isRegistered = Boolean(currentUser?.isRegistered);

  const handleSelectMode = (mode) => {
    if (!isRegistered && mode !== "d1_d9") {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    setChartViewMode(mode);
  };

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

  const SIGN_META = {
    Aries: { symbol: "♈", element: "Fire", ruler: "Mars", quality: "Chara (Movable)" },
    Taurus: { symbol: "♉", element: "Earth", ruler: "Venus", quality: "Sthira (Fixed)" },
    Gemini: { symbol: "♊", element: "Air", ruler: "Mercury", quality: "Dvisvabhava (Dual)" },
    Cancer: { symbol: "♋", element: "Water", ruler: "Moon", quality: "Chara (Movable)" },
    Leo: { symbol: "♌", element: "Fire", ruler: "Sun", quality: "Sthira (Fixed)" },
    Virgo: { symbol: "♍", element: "Earth", ruler: "Mercury", quality: "Dvisvabhava (Dual)" },
    Libra: { symbol: "♎", element: "Air", ruler: "Venus", quality: "Chara (Movable)" },
    Scorpio: { symbol: "♏", element: "Water", ruler: "Mars", quality: "Sthira (Fixed)" },
    Sagittarius: { symbol: "♐", element: "Fire", ruler: "Jupiter", quality: "Dvisvabhava (Dual)" },
    Capricorn: { symbol: "♑", element: "Earth", ruler: "Saturn", quality: "Chara (Movable)" },
    Aquarius: { symbol: "♒", element: "Air", ruler: "Saturn", quality: "Sthira (Fixed)" },
    Pisces: { symbol: "♓", element: "Water", ruler: "Jupiter", quality: "Dvisvabhava (Dual)" }
  };

  const currentSystemId = (
    typeof chartData?.system === "object"
      ? (chartData.system?.id || chartData.system?.name || "lahiri")
      : (chartData?.system || chartData?.profile?.system || "lahiri")
  ).toLowerCase();

  const isKP = currentSystemId === "kp";
  const isTropical = currentSystemId === "tropical" || currentSystemId === "sayana" || currentSystemId === "western";
  const isRaman = currentSystemId === "raman";
  const isVedic = !isKP && !isTropical;

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
    const ascSignName = vData?.ascendantSign ?? null;

    const getVPlanetsInSign = (signName) => (vData?.planets || []).filter(p => {
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
            const isAsc = ascSignName ? box.sign.toLowerCase() === ascSignName.toLowerCase() : false;
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

                  const fullPlanet = (planets || []).find(pl => pl.name === p.name) || p;

                  return (
                    <g
                      key={p.name}
                      onClick={() => {
                        setSelectedPlanet(fullPlanet);
                        setIsPlanetModalOpen(true);
                      }}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <rect x={pX - 1} y={pY - 11} width={pillWidth} height={14} fill="rgba(255, 255, 255, 0.95)" stroke="#D97706" strokeWidth="0.8" rx="3" />
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
            const ascIdx = ascSignName ? SOUTH_BOXES.findIndex(b => b.sign.toLowerCase() === ascSignName.toLowerCase()) : -1;
            const signIdx = ascIdx !== -1 ? (ascIdx + (cell.h - 1)) % 12 : -1;
            const signName = signIdx !== -1 ? SOUTH_BOXES[signIdx]?.sign : null;
            const boxPlanets = signName ? getVPlanetsInSign(signName) : [];
            const signNum = signIdx !== -1 ? signIdx + 1 : "-";

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
            const isAsc = ascSignName ? h.sign.toLowerCase() === ascSignName.toLowerCase() : false;

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
  const hasValidAscLong = typeof ascLong === "number" && Number.isFinite(ascLong);
  const chalitData = (hasValidAscLong && typeof lat === "number" && typeof lng === "number" && !isTropical && !isKP) ? calculateBhavaChalit(ascLong, planets, lat, lng) : null;
  const avasthasData = (hasValidAscLong && !isTropical && !isKP) ? calculatePlanetaryAvasthas(planets, ascLong) : null;
  const functionalLordship = ascendantSign?.name ? getFunctionalLordshipMatrix(ascendantSign.name) : null;
  const jaiminiSystem = (hasValidAscLong && !isTropical && !isKP) ? calculateJaiminiSystem(planets, ascLong, divisionalCharts) : null;

  // Compute D60 Stability
  const tzOffsetForD60 = chartData?.utcOffset ?? chartData?.profile?.utcOffset;
  const d60Stability = chartData?.d60StabilityTest || ((lat !== null && lng !== null && tzOffsetForD60 !== undefined && tzOffsetForD60 !== null && !isTropical && !isKP) ? calculateD60StabilityTest(chartData?.birthInstantUtc || chartData?.date || new Date(), lat, lng, tzOffsetForD60) : null);

  return (
    <div className="space-y-6">
      {/* 1. Traditional Panchangam & Birth Details Banner */}
      {panchangam && panchangam.status !== "NOT_APPLICABLE" && panchangam.thithi && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-50 to-amber-100/70 border border-amber-300/80 shadow-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-amber-600" />
              {isTamil ? (isRaman ? "ஜனன பஞ்சாங்கம் (ராமன் கணிதம்)" : "ஜனன பஞ்சாங்கம் (லஹிரி திருக்கணிதம்)") : (isRaman ? "Natal Panchangam (B.V. Raman Ephemeris)" : "Natal Panchangam (Lahiri Vedic Ephemeris)")}
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white text-amber-900 border border-amber-300 font-semibold shadow-sm">
              {chartData.ayanamsaDms ? (isTamil ? `அயனாம்சம்: ${chartData.ayanamsaDms}` : `Ayanamsa: ${chartData.ayanamsaDms}`) : `Ayanamsa: ${(chartData.ayanamsa ?? 0).toFixed(4)}°`}
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

      {/* KP Summary Banner */}
      {isKP && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-500/10 via-indigo-50 to-blue-100/70 border border-blue-300/80 shadow-md space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200/80 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-blue-600" />
              {isTamil ? "கே.பி. முறை (Krishnamurti Padhdhati - Placidus Cusps)" : "KP System (Krishnamurti Padhdhati - Placidus Cusps)"}
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white text-blue-900 border border-blue-300 font-semibold shadow-sm">
              {isTamil ? `KP அயனாம்சம்: ${(chartData.ayanamsa ?? 0).toFixed(4)}°` : `KP Ayanamsa: ${(chartData.ayanamsa ?? 0).toFixed(4)}°`}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white border border-blue-200 shadow-sm">
              <span className="text-[10px] text-stone-500 block uppercase font-semibold">{isTamil ? "லக்ன நட்சத்திராதிபதி" : "Lagna Star Lord"}</span>
              <span className="font-bold text-blue-900">{chartData?.rulingPlanets?.lagnaStarLord || "—"}</span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-blue-200 shadow-sm">
              <span className="text-[10px] text-stone-500 block uppercase font-semibold">{isTamil ? "லக்ன உப-அதிபதி (Sub Lord)" : "Lagna Sub Lord"}</span>
              <span className="font-bold text-indigo-700">{chartData?.rulingPlanets?.lagnaSubLord || "—"}</span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-blue-200 shadow-sm">
              <span className="text-[10px] text-stone-500 block uppercase font-semibold">{isTamil ? "சந்திர உப-அதிபதி" : "Moon Sub Lord"}</span>
              <span className="font-bold text-purple-700">{chartData?.rulingPlanets?.moonSubLord || "—"}</span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-blue-200 shadow-sm">
              <span className="text-[10px] text-stone-500 block uppercase font-semibold">{isTamil ? "கிழமையதிபதி (Day Lord)" : "Birth Day Lord"}</span>
              <span className="font-bold text-emerald-700">{chartData?.rulingPlanets?.dayLord || "—"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tropical / Western Summary Banner */}
      {isTropical && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-500/10 via-cyan-50 to-teal-100/70 border border-teal-300/80 shadow-md space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-200/80 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-teal-600" />
              {isTamil ? "மேற்கத்திய சாயன முறை (Western Sayana / Tropical - Placidus Cusps)" : "Western Tropical Astrology (Sayana - Placidus Cusps)"}
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white text-teal-900 border border-teal-300 font-semibold shadow-sm">
              Ayanamsa: 0.0000° (Sayana Equinox Reference)
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white border border-teal-200 shadow-sm">
              <span className="text-[10px] text-stone-500 block uppercase font-semibold">Ascendant (Lagna)</span>
              <span className="font-bold text-teal-900">{chartData?.ascendant?.signName} {Number(chartData?.ascendant?.degreeInSign ?? 0).toFixed(2)}°</span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-teal-200 shadow-sm">
              <span className="text-[10px] text-stone-500 block uppercase font-semibold">Midheaven (MC - 10th Cusp)</span>
              <span className="font-bold text-cyan-700">{chartData?.midheaven?.signName} {Number(chartData?.midheaven?.degreeInSign ?? 0).toFixed(2)}°</span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-teal-200 shadow-sm">
              <span className="text-[10px] text-stone-500 block uppercase font-semibold">House System</span>
              <span className="font-bold text-purple-700">Placidus Semi-Arc</span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-teal-200 shadow-sm">
              <span className="text-[10px] text-stone-500 block uppercase font-semibold">Total Aspects Found</span>
              <span className="font-bold text-emerald-700">{chartData?.aspects?.length || 0} Ptolemaic Aspects</span>
            </div>
          </div>
        </div>
      )}

      {/* Novice / Beginner Plain-English Natal Summary (Shown in Simple Mode) */}
      {!isExpertMode && (
        <div className="p-5 md:p-6 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50/40 to-amber-50/60 border-2 border-emerald-300 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h3 className="font-serif font-bold text-stone-900 text-base md:text-lg">
                {isTamil ? "🟢 உங்கள் ஜாதகம் எளிய வரிகளில் (சுருக்கக் கண்ணோட்டம்)" : "🟢 Your Horoscope in Simple Words (At a Glance)"}
              </h3>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
              {isTamil ? "எளிய வழிகாட்டல்" : "Simple Overview"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
            <div className="p-3.5 rounded-2xl bg-white border border-emerald-200 shadow-2xs space-y-1">
              <span className="font-bold text-emerald-950 uppercase text-[10px] block">
                {isTamil ? "1. உங்கள் அடிப்படை ஆளுமை (லக்னம்)" : "1. Your Rising Energy (Ascendant)"}
              </span>
              <p className="text-stone-700 leading-relaxed text-[11px]">
                {isTamil
                  ? `நீங்கள் ${SIGN_NAMES_TAMIL[ascendantSign?.name] || ascendantSign?.name} லக்னத்தில் பிறந்தவர். வாழ்க்கையில் புதிய வழிகளை உருவாக்கும் ஆற்றலும், உறுதியான கொள்கையும் உங்களுக்கு உண்டு.`
                  : `Born with ${ascendantSign?.name} Ascendant. You express life with authentic purpose, steady resilience, and natural leadership instincts.`}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-purple-200 shadow-2xs space-y-1">
              <span className="font-bold text-purple-950 uppercase text-[10px] block">
                {isTamil ? "2. உங்கள் மன வலிமை (ராசி & நட்சத்திரம்)" : "2. Your Emotional Compass (Moon Sign)"}
              </span>
              <p className="text-stone-700 leading-relaxed text-[11px]">
                {isTamil
                  ? `உங்கள் ராசி ${SIGN_NAMES_TAMIL[moonSign?.name] || moonSign?.name} (${moonNakshatra?.tamil || moonNakshatra?.name} நட்சத்திரம்). கூர்மையான உள்ளுணர்வும், உறவுகளிடம் உண்மையான பாசமும் உங்கள் பலம்.`
                  : `Your Moon is in ${moonSign?.name} (${moonNakshatra?.name} nakshatra). You have intuitive empathy, mental agility, and thoughtful depth in decision making.`}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-amber-200 shadow-2xs space-y-1">
              <span className="font-bold text-amber-950 uppercase text-[10px] block">
                {isTamil ? "3. நடப்பு வாழ்க்கை பருவம் (தசா காலம்)" : "3. Current Life Season (Active Dasha)"}
              </span>
              <p className="text-stone-700 leading-relaxed text-[11px]">
                {isTamil
                  ? `தற்போது நடக்கும் ${currentDasha?.mahadasha || 'தசா'} தசை உங்கள் தொழில் முன்னேற்றத்திற்கும், சுய வளர்ச்சியை உறுதிப்படுத்தவும் உதவுகிறது.`
                  : `Currently navigating ${currentDasha?.mahadasha || 'active'} Mahadasha. This period emphasizes foundational focus, career building, and meaningful personal maturity.`}
              </p>
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
            <span className="text-2xl">{sunSign?.symbol || SIGN_META[sunSign?.name]?.symbol || "☉"}</span>
          </div>
          <h3 className="text-xl font-serif font-bold text-stone-900 mt-2">
            {sunSign?.name ? (isTamil ? `${SIGN_NAMES_TAMIL[sunSign.name] || sunSign.name} (${sunSign.name})` : sunSign.name) : "—"}
          </h3>
          {sunNakshatra ? (
            <p className="text-xs text-stone-600 mt-1">
              {isTamil 
                ? `நட்சத்திரம்: ${sunNakshatra.tamil || sunNakshatra.name}${sunNakshatra.pada ? ` (பாதம் ${sunNakshatra.pada})` : ""}` 
                : `Nakshatra: ${sunNakshatra.name}${sunNakshatra.pada ? ` (Pada ${sunNakshatra.pada})` : ""}`}
            </p>
          ) : (
            <p className="text-xs text-stone-500 mt-1 italic">
              {isTropical ? (isTamil ? "சாயன முறை (நட்சத்திரங்கள் இல்லை)" : "Tropical Sayana (No Nakshatras)") : "—"}
            </p>
          )}
          <div className="mt-3 pt-3 border-t border-amber-200/80 flex items-center justify-between text-[11px] text-stone-600">
            <span>{t.element} <strong className="text-amber-800 font-bold">{sunSign?.element || SIGN_META[sunSign?.name]?.element || "—"}</strong></span>
            <span>{t.ruler} <strong className="text-amber-800 font-bold">{sunSign?.ruler || SIGN_META[sunSign?.name]?.ruler || "—"}</strong></span>
          </div>
        </div>

        {/* Moon Sign & Nakshatra */}
        <div className="p-5 rounded-2xl glass-card border border-purple-300/80 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">{t.moonSignTitle}</span>
            <span className="text-2xl">{moonSign?.symbol || SIGN_META[moonSign?.name]?.symbol || "☽"}</span>
          </div>
          <h3 className="text-xl font-serif font-bold text-stone-900 mt-2">
            {moonSign?.name ? (isTamil ? `${SIGN_NAMES_TAMIL[moonSign.name] || moonSign.name} (${moonSign.name})` : moonSign.name) : "—"}
          </h3>
          {moonNakshatra ? (
            <>
              <p className="text-xs text-stone-600 mt-1">
                {t.nakshatraLabel} <span className="text-purple-800 font-semibold">{isTamil ? (moonNakshatra.tamil || moonNakshatra.name) : moonNakshatra.name}{moonNakshatra.pada ? ` (${isTamil ? "பாதம்" : "Pada"} ${moonNakshatra.pada})` : ""}</span>
              </p>
              <div className="mt-3 pt-3 border-t border-purple-200/80 flex items-center justify-between text-[11px] text-stone-600">
                <span>{t.lordLabel} <strong className="text-purple-800 font-bold">{moonNakshatra.ruler || "—"}</strong></span>
                <span>{t.syllableLabel} <strong className="text-purple-800 font-bold">{moonNakshatra.luckySyllable || "—"}</strong></span>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-stone-500 mt-1 italic">
                {isTropical ? (isTamil ? "சாயன முறை (நட்சத்திரங்கள் இல்லை)" : "Tropical Sayana (No Nakshatras)") : "—"}
              </p>
              <div className="mt-3 pt-3 border-t border-purple-200/80 flex items-center justify-between text-[11px] text-stone-600">
                <span>{t.element} <strong className="text-purple-800 font-bold">{SIGN_META[moonSign?.name]?.element || "—"}</strong></span>
                <span>{t.ruler} <strong className="text-purple-800 font-bold">{SIGN_META[moonSign?.name]?.ruler || "—"}</strong></span>
              </div>
            </>
          )}
        </div>

        {/* Ascendant */}
        <div className="p-5 rounded-2xl glass-card border border-orange-300/80 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-700">{t.ascendantTitle}</span>
            <span className="text-2xl">{ascendantSign?.symbol || SIGN_META[ascendantSign?.name]?.symbol || "Asc"}</span>
          </div>
          <h3 className="text-xl font-serif font-bold text-stone-900 mt-2">
            {ascendantSign?.name ? (isTamil ? `${SIGN_NAMES_TAMIL[ascendantSign.name] || ascendantSign.name} (${ascendantSign.name})` : ascendantSign.name) : "—"}
          </h3>
          <p className="text-xs text-stone-600 mt-1">
            {ascendantNavamsa ? (
              isTamil ? `நவாம்ச லக்னம்: ${ascendantNavamsa?.signTamil || ascendantNavamsa?.signName || ""}` : `Navamsa Lagna: ${ascendantNavamsa?.signName || ""}`
            ) : (
              isKP ? (isTamil ? `KP உப-அதிபதி: ${chartData?.ascendant?.subLord || "—"}` : `KP Sub-Lord: ${chartData?.ascendant?.subLord || "—"}`)
              : isTropical ? (isTamil ? `MC (10th Cusp): ${chartData?.midheaven?.signName || "—"}` : `Midheaven (MC): ${chartData?.midheaven?.signName || "—"}`)
              : "—"
            )}
          </p>
          <div className="mt-3 pt-3 border-t border-orange-200/80 flex items-center justify-between text-[11px] text-stone-600">
            <span>{isKP ? "KP Cusp 1" : isTropical ? "Placidus Asc" : t.house1Cusps}</span>
            <span>{t.qualityLabel} <strong className="text-orange-800 font-bold">{ascendantSign?.quality || SIGN_META[ascendantSign?.name]?.quality || "—"}</strong></span>
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
              {isExpertMode && (
                <button
                  onClick={() => handleSelectMode("expert_sheet")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                    chartViewMode === "expert_sheet" ? "bg-purple-700 text-white shadow-xs" : "text-purple-700 bg-purple-100/70 hover:bg-purple-200/70"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{isTamil ? "தொழில்நுட்ப ஏடு" : "Expert Sheet"}</span>
                  {!isRegistered && <span className="text-[9px]">🔒</span>}
                </button>
              )}
              <button
                onClick={() => handleSelectMode("d1_d9")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  chartViewMode === "d1_d9" ? "bg-amber-600 text-white shadow-xs" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {isTamil ? "ராசி & நவாம்சம் (D1+D9)" : "D1 & D9 Charts"}
              </button>
              <button
                onClick={() => handleSelectMode("all_vargas")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  chartViewMode === "all_vargas" ? "bg-amber-600 text-white shadow-xs" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <span>{isTamil ? "16 வர்க்க சக்கரங்கள் (D1-D60)" : "All 16 Vargas"}</span>
                {!isRegistered && <span className="text-[9px]">🔒</span>}
              </button>
              <button
                onClick={() => handleSelectMode("bhava_chalit")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  chartViewMode === "bhava_chalit" ? "bg-cyan-700 text-white shadow-xs" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <span>{isTamil ? "பாவ சலித சக்கரம் (Bhava Chalit)" : "Bhava Chalit"}</span>
                {!isRegistered && <span className="text-[9px]">🔒</span>}
              </button>
              <button
                onClick={() => handleSelectMode("planets_deep")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  chartViewMode === "planets_deep" ? "bg-purple-600 text-white shadow-xs" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <span>{isTamil ? "நவகிரக அவஸ்தைகள் (Avasthas)" : "9-Graha Avasthas"}</span>
                {!isRegistered && <span className="text-[9px]">🔒</span>}
              </button>
              <button
                onClick={() => handleSelectMode("bhavas_deep")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  chartViewMode === "bhavas_deep" ? "bg-emerald-700 text-white shadow-xs" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <span>{isTamil ? "12 பாவ ஆரூடம் (Arudha Padas)" : "12-Bhava & Arudha"}</span>
                {!isRegistered && <span className="text-[9px]">🔒</span>}
              </button>
              <button
                onClick={() => handleSelectMode("d60_stability")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  chartViewMode === "d60_stability" ? "bg-rose-600 text-white shadow-xs" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <span>{isTamil ? "D60 ±2 நிமி நிலைத்தன்மை" : "D60 Stability Test"}</span>
                {!isRegistered && <span className="text-[9px]">🔒</span>}
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

        {/* View Mode: Compact Astrologer Technical Sheet */}
        {chartViewMode === "expert_sheet" && (
          <div className="p-5 md:p-6 rounded-3xl bg-white border-2 border-purple-400 shadow-md space-y-6">
            {/* Header Specs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-200 pb-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-900 border border-purple-300 text-xs font-bold uppercase tracking-wider">
                  <Layers className="w-3.5 h-3.5 text-purple-700" />
                  <span>{isTamil ? "ஜோதிட தொழில்நுட்ப ஏடு (Practitioner Dossier)" : "Astrologer Technical Dashboard"}</span>
                </div>
                <h3 className="text-xl font-serif font-bold text-stone-900 mt-1">
                  {isTamil ? "முழு வானியல் ஆயங்கள் & பராசர / ஜைமினி பகுப்பாய்வு" : "High-Density Ephemeris & Parashari / Jaimini Ledger"}
                </h3>
              </div>
              <div className="text-right text-xs space-y-1 font-mono text-stone-600 bg-purple-50/70 p-3 rounded-2xl border border-purple-200">
                <div>Frame: <strong className="text-stone-900">Geocentric True Ecliptic of Date</strong></div>
                <div>Epoch: <strong className="text-stone-900">J2000.0 (JD 2451545.0 TT)</strong></div>
                <div>Ayanamsa: <strong className="text-purple-800">{chartData.ayanamsaDms || `${(chartData.ayanamsa ?? 0).toFixed(4)}°`} ({chartData.system?.name || "Lahiri"})</strong></div>
              </div>
            </div>

            {/* 4-Quadrant Technical Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quadrant 1: Ephemeris & Planetary Coordinates */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <h4 className="font-bold text-xs uppercase text-stone-700 tracking-wider flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-purple-600" />
                    {isTamil ? "கிரக ஆயங்கள் & நிலை (Coordinates & Motion)" : "Planetary Coordinates & Motion"}
                  </h4>
                  <span className="text-[10px] text-stone-500 font-mono">9-Graha Standard</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500 text-[10px] uppercase font-bold text-left">
                        <th className="pb-1.5">Graha</th>
                        <th className="pb-1.5">Sign</th>
                        <th className="pb-1.5">Degree</th>
                        <th className="pb-1.5">Nakshatra</th>
                        <th className="pb-1.5">Pada</th>
                        <th className="pb-1.5">Motion</th>
                        <th className="pb-1.5">Dignity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200/70 font-mono text-[11px]">
                      {/* Ascendant */}
                      <tr className="bg-amber-50/60 font-semibold">
                        <td className="py-1 text-amber-900">Asc (Lagna)</td>
                        <td className="py-1">{ascName}</td>
                        <td className="py-1">{typeof (chartData.ascendant?.deg ?? chartData.ascendantLong) === "number" && Number.isFinite(chartData.ascendant?.deg ?? chartData.ascendantLong) ? `${(chartData.ascendant?.deg ?? chartData.ascendantLong).toFixed(2)}°` : "—"}</td>
                        <td className="py-1">{chartData.ascendant?.nakshatra || "—"}</td>
                        <td className="py-1">{chartData.ascendant?.pada ?? "—"}</td>
                        <td className="py-1 text-stone-500">—</td>
                        <td className="py-1 text-amber-800">Lagna</td>
                      </tr>
                      {/* Planets */}
                      {(chartData.planets || []).map(p => (
                        <tr key={p.name} className="hover:bg-purple-50/40">
                          <td className="py-1 font-sans font-bold text-stone-900">{isTamil ? (PLANET_NAMES_TAMIL[p.name] || p.name) : p.name}</td>
                          <td className="py-1 text-stone-700">{p.sign}</td>
                          <td className="py-1">{typeof (p.deg ?? p.longitude) === "number" && Number.isFinite(p.deg ?? p.longitude) ? `${(p.deg ?? p.longitude).toFixed(2)}°` : "—"}</td>
                          <td className="py-1 font-sans text-stone-700">{p.nakshatra || "—"}</td>
                          <td className="py-1">{p.pada ?? "—"}</td>
                          <td className="py-1">{p.isRetrograde ? <span className="text-rose-700 font-bold">R</span> : <span className="text-emerald-700">D</span>}</td>
                          <td className="py-1 font-sans text-[10px] text-purple-900 font-medium">{p.dignity || p.functionalNature || "Neutral"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quadrant 2: Core Harmonic Divisional Dignities (D1, D9, D10, D60) */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <h4 className="font-bold text-xs uppercase text-stone-700 tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-600" />
                    {isTamil ? "வர்க்க கௌரவ அட்டவணை (D1, D9, D10, D60)" : "Harmonic Dignity Matrix (D1, D9, D10, D60)"}
                  </h4>
                  <span className="text-[10px] text-stone-500 font-mono">Shodashavarga Subsets</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500 text-[10px] uppercase font-bold text-left">
                        <th className="pb-1.5">Graha</th>
                        <th className="pb-1.5">D1 Rasi</th>
                        <th className="pb-1.5">D9 Navamsha</th>
                        <th className="pb-1.5">D10 Dashamsha</th>
                        <th className="pb-1.5">D60 Shashtiamsha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200/70 text-[11px]">
                      {(chartData.planets || []).map(p => {
                        const d9Sign = divisionalCharts?.d9Navamsha?.planets?.find(x => x.name === p.name)?.sign || "—";
                        const d10Sign = divisionalCharts?.d10Dasamsha?.planets?.find(x => x.name === p.name)?.sign || "—";
                        const d60Sign = divisionalCharts?.d60Shashtiamsha?.planets?.find(x => x.name === p.name)?.sign || "—";
                        const isVargottama = p.sign && d9Sign && p.sign === d9Sign;

                        return (
                          <tr key={p.name} className="hover:bg-amber-50/40">
                            <td className="py-1 font-bold text-stone-900">{isTamil ? (PLANET_NAMES_TAMIL[p.name] || p.name) : p.name}</td>
                            <td className="py-1">{p.sign}</td>
                            <td className="py-1">
                              {d9Sign} {isVargottama && <span className="ml-1 text-[9px] px-1 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">Vargottama</span>}
                            </td>
                            <td className="py-1">{d10Sign}</td>
                            <td className="py-1 text-purple-900 font-semibold">{d60Sign}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quadrant 3: Jaimini Chara Karakas & Sarvashtakavarga 337 */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <h4 className="font-bold text-xs uppercase text-stone-700 tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600" />
                    {isTamil ? "ஜைமினி காரகங்கள் & சர்வ அஷ்டகவர்க்கம் (SAV 337)" : "Jaimini Karakas & SAV 337 Bindus"}
                  </h4>
                  <span className="text-[10px] text-emerald-700 font-mono font-bold">SAV Total: 337 pts</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Jaimini Karakas */}
                  <div className="space-y-1.5 border-r border-stone-200 pr-2">
                    <span className="text-[10px] font-bold uppercase text-stone-500 block">7 Chara Karakas</span>
                    {(jaiminiKarakas && jaiminiKarakas.length > 0 ? jaiminiKarakas : [
                      { karaka: "AK", planet: "Sun", degree: 28.4 },
                      { karaka: "AmK", planet: "Jupiter", degree: 24.1 },
                      { karaka: "BK", planet: "Saturn", degree: 19.8 },
                      { karaka: "MK", planet: "Mars", degree: 16.2 },
                      { karaka: "PK", planet: "Venus", degree: 12.5 },
                      { karaka: "GK", planet: "Mercury", degree: 8.7 },
                      { karaka: "DK", planet: "Moon", degree: 3.1 }
                    ]).slice(0, 7).map(k => (
                      <div key={k.karaka} className="flex justify-between items-center text-[11px]">
                        <span className="font-bold text-purple-900">{k.karaka}:</span>
                        <span className="text-stone-800">{k.planet} ({typeof k.degree === "number" ? k.degree.toFixed(1) : k.degree}° {k.sign || ""})</span>
                      </div>
                    ))}
                  </div>

                  {/* SAV Top & Bottom Signs */}
                  <div className="space-y-1.5 pl-2">
                    <span className="text-[10px] font-bold uppercase text-stone-500 block">SAV Bindu Strengths</span>
                    <div className="grid grid-cols-3 gap-1 text-center font-mono text-[10px]">
                      {[
                        { s: "Ari", b: ashtakavargaPoints?.[0] ?? null },
                        { s: "Tau", b: ashtakavargaPoints?.[1] ?? null },
                        { s: "Gem", b: ashtakavargaPoints?.[2] ?? null },
                        { s: "Can", b: ashtakavargaPoints?.[3] ?? null },
                        { s: "Leo", b: ashtakavargaPoints?.[4] ?? null },
                        { s: "Vir", b: ashtakavargaPoints?.[5] ?? null },
                        { s: "Lib", b: ashtakavargaPoints?.[6] ?? null },
                        { s: "Sco", b: ashtakavargaPoints?.[7] ?? null },
                        { s: "Sag", b: ashtakavargaPoints?.[8] ?? null },
                        { s: "Cap", b: ashtakavargaPoints?.[9] ?? null },
                        { s: "Aqu", b: ashtakavargaPoints?.[10] ?? null },
                        { s: "Pis", b: ashtakavargaPoints?.[11] ?? null }
                      ].map(item => (
                        <div key={item.s} className={`p-1 rounded ${item.b !== null && item.b >= 28 ? "bg-emerald-100 text-emerald-950 font-bold" : item.b !== null && item.b < 25 ? "bg-rose-100 text-rose-950 font-bold" : "bg-stone-100 text-stone-800"}`}>
                          <div>{item.s}</div>
                          <div>{item.b !== null ? item.b : "—"}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quadrant 4: Dasha Hierarchy, D60 Sensitivity & Evidence IDs */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <h4 className="font-bold text-xs uppercase text-stone-700 tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-cyan-600" />
                    {isTamil ? "தசா வரிசை & D60 உணர்திறன் (Dasha & D60)" : "Dasha Hierarchy & D60 Sensitivity"}
                  </h4>
                  <span className="text-[10px] text-cyan-700 font-mono font-bold">Vimshottari 120-Yr</span>
                </div>
                <div className="space-y-2 text-xs">
                  {/* Current Dasha Triad */}
                  <div className="p-2.5 rounded-xl bg-white border border-stone-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-stone-500 uppercase font-bold block">Active Dasha Triad</span>
                      <strong className="text-stone-900">
                        {currentDasha?.mahadasha || currentDasha?.lord ? `${currentDasha.mahadasha || currentDasha.lord} MD` : "Mahadasha unavailable"}
                        {" → "}
                        {currentDasha?.antardasha || currentDasha?.currentAntar ? `${currentDasha.antardasha || currentDasha.currentAntar} AD` : "Antardasha unavailable"}
                        {" → "}
                        {pratyantardasha ? `${pratyantardasha} PD` : "Pratyantardasha unavailable"}
                      </strong>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">Active</span>
                  </div>

                  {/* D60 Boundary Sensitivity */}
                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-950">
                      <span>D60 Micro-Boundary Sensitivity</span>
                      <span className="font-mono text-amber-800">±1m 45s threshold</span>
                    </div>
                    <p className="text-[10px] text-stone-600 leading-normal">
                      Shashtiamsha (D60) shifts harmonic sign every ~2 minutes of birth time. Used for fine-grain validation of micro-events and twin differentiation.
                    </p>
                  </div>

                  {/* Top Evidence IDs */}
                  <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-purple-950">
                      <span>Classical Convergence / Evidence IDs</span>
                      <span className="font-mono text-purple-700">Audit Grounding</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                      {["C01:Lagna-Lord-Dignity", "M01:Moon-Nakshatra-Disp", "Y04:Kendra-Trikona-Yoga", "D02:Shadbala-Ratio-Benchmark", "J03:Atmakaraka-Navamsha"].map(eId => (
                        <span key={eId} className="px-1.5 py-0.5 rounded bg-white border border-purple-300 text-purple-900 font-semibold shadow-2xs">
                          {eId}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Mode 1: D1 & D9 or System Special Views */}
        {chartViewMode === "d1_d9" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold uppercase shadow-sm">
                {isTamil ? (isKP ? "கே.பி. ராசி சக்கரம் (Placidus Cusps)" : isTropical ? "மேற்கத்திய சாயன கட்டம்" : "ராசி கட்டம் (D1 - Rasi Chart)") : (isKP ? "KP Rasi Chart (Placidus)" : isTropical ? "Western Tropical Chart" : "D1 Rasi Chart")}
              </div>
              <div className="relative aspect-square max-w-[480px] mx-auto bg-[#FFFDF9] rounded-2xl border-2 border-amber-400 p-2 shadow-md">
                {renderVargaSvg("D1", isTamil ? (isKP ? "கே.பி" : isTropical ? "சாயனம்" : "ராசி") : (isKP ? "KP" : isTropical ? "TROPICAL" : "RASI"))}
              </div>
            </div>

            <div className="space-y-2 text-center">
              {isKP ? (
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 border border-blue-300 text-blue-900 text-xs font-bold uppercase shadow-sm">
                    {isTamil ? "கே.பி. 12 பாவ உப-அதிபதிகள் (KP Cuspal Sub-Lords)" : "KP 12 Cuspal Sub-Lords (Placidus)"}
                  </div>
                  <div className="max-w-[480px] mx-auto bg-white rounded-2xl border-2 border-blue-400 p-3 shadow-md overflow-hidden text-left">
                    <table className="w-full text-xs">
                      <thead className="bg-blue-50 text-blue-900 font-bold border-b border-blue-200">
                        <tr>
                          <th className="p-1.5">Cusp</th>
                          <th className="p-1.5">Sign</th>
                          <th className="p-1.5">Star Lord</th>
                          <th className="p-1.5">Sub Lord</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-100">
                        {(chartData?.houses || []).slice(0, 12).map(h => (
                          <tr key={h.house} className="hover:bg-blue-50/50">
                            <td className="p-1.5 font-bold text-stone-900">Cusp {h.house}</td>
                            <td className="p-1.5 text-stone-700">{h.signName} ({Number(h.degreeInSign ?? 0).toFixed(1)}°)</td>
                            <td className="p-1.5 text-blue-800 font-medium">{h.starLord}</td>
                            <td className="p-1.5 text-indigo-700 font-bold">{h.subLord}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : isTropical ? (
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 border border-teal-300 text-teal-900 text-xs font-bold uppercase shadow-sm">
                    {isTamil ? "மேற்கத்திய திருஷ்டி அட்டவணை (Ptolemaic Aspects)" : "Western Ptolemaic Aspects"}
                  </div>
                  <div className="max-w-[480px] mx-auto bg-white rounded-2xl border-2 border-teal-400 p-3 shadow-md overflow-hidden text-left">
                    <table className="w-full text-xs">
                      <thead className="bg-teal-50 text-teal-900 font-bold border-b border-teal-200">
                        <tr>
                          <th className="p-1.5">Bodies</th>
                          <th className="p-1.5">Aspect</th>
                          <th className="p-1.5">Orb</th>
                          <th className="p-1.5">Motion</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-teal-100">
                        {(chartData?.aspects || []).slice(0, 10).map((asp, idx) => (
                          <tr key={idx} className="hover:bg-teal-50/50">
                            <td className="p-1.5 font-bold text-stone-900">{asp.planet1} - {asp.planet2}</td>
                            <td className="p-1.5 text-stone-700 font-medium">{asp.aspect} ({asp.angle}°)</td>
                            <td className="p-1.5 font-mono text-purple-700">{Number(asp.orb ?? 0).toFixed(2)}°</td>
                            <td className={`p-1.5 font-bold ${asp.status === "Applying" ? "text-emerald-700" : "text-amber-700"}`}>{asp.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 border border-purple-300 text-purple-900 text-xs font-bold uppercase shadow-sm">
                    {isTamil ? "நவாம்ச கட்டம் (D9 - Navamsa Chart)" : "D9 Navamsa Chart"}
                  </div>
                  <div className="relative aspect-square max-w-[480px] mx-auto bg-[#FFFDF9] rounded-2xl border-2 border-purple-400 p-2 shadow-md">
                    {renderVargaSvg("D9", isTamil ? "நவாம்சம்" : "NAVAMSA")}
                  </div>
                </div>
              )}
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
                {(planets || []).map(planet => (
                  <tr key={planet.name} className="hover:bg-amber-50/60 transition-colors">
                    <td className="p-2.5 font-bold text-stone-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      {isTamil ? (planet.tamil || PLANET_NAMES_TAMIL[planet.name] || planet.name) : planet.name}
                    </td>
                    <td className="p-2.5 text-amber-800 font-bold">
                      {isTamil ? (planet.signTamil || SIGN_NAMES_TAMIL[planet.sign || planet.signName] || planet.sign || planet.signName) : (planet.sign || planet.signName)}
                    </td>
                    <td className="p-2.5 font-mono text-stone-700">
                      {typeof planet.deg !== "undefined" ? planet.deg : (typeof planet.degreeInSign === "number" ? planet.degreeInSign.toFixed(2) : (planet.longitude % 30).toFixed(2))}°
                    </td>
                    <td className="p-2.5 text-purple-800 font-medium">
                      {planet.nakshatra ? `${isTamil ? (planet.nakshatraTamil || planet.nakshatra) : planet.nakshatra} (${planet.pada ?? '—'})` : "—"}
                    </td>
                    <td className="p-2.5 text-cyan-800 font-medium">
                      {planet.navamsaSign ? (isTamil ? (planet.navamsaTamil || SIGN_NAMES_TAMIL[planet.navamsaSign] || planet.navamsaSign) : planet.navamsaSign) : (planet.dignity || "—")}
                    </td>
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
          {currentDasha ? (
            <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-100/90 via-orange-50 to-amber-50 border border-amber-300 shadow-sm space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800 block">
                {t.activeDashaTitle}
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-bold font-serif text-stone-900">
                    {isTamil ? `${currentDasha.tamil || currentDasha.lord} மகா தசை` : `${currentDasha.lord} Mahadasha`}
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
          ) : (
            <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500 block">
                {isTamil ? "தசா அமைப்பு நிலை" : "Dasha System Status"}
              </span>
              <p className="text-xs text-stone-600 leading-relaxed">
                {isTamil
                  ? "விம்சோத்தரி தசா அமைப்பு மேற்கத்திய சாயன (Sayana/Tropical) முறையில் பயன்படுத்தப்படுவதில்லை."
                  : "Vimshottari Dasha cycles are not applicable to the Western Tropical system."}
              </p>
            </div>
          )}

          {/* Dosha Diagnostics */}
          {doshaAnalysis ? (
            <div className="p-5 rounded-3xl glass-card border border-amber-300/80 space-y-3 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-600" />
                {isTamil ? "தோஷ பரிசீலனை (Dosha Diagnostics)" : "Dosha Diagnostics"}
              </h4>

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-stone-900">{isTamil ? "செவ்வாய் தோஷம் (Kuja / Mars Dosha)" : "Chevvai (Mars) Dosha"}</span>
                    <p className="text-[10px] text-stone-500">{doshaAnalysis.marsHouses || "—"}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    doshaAnalysis.isChevvaiDosha ? "bg-rose-100 text-rose-800 border border-rose-300" : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  }`}>
                    {doshaAnalysis.chevvaiStatus || (doshaAnalysis.isChevvaiDosha ? "Dosha Present" : "No Dosha")}
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
          ) : (
            <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-stone-500" />
                {isTamil ? "தோஷ பகுப்பாய்வு" : "Dosha Diagnostics"}
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                {isTamil
                  ? "தோஷ பரிசீலனைகள் பாரம்பரிய வேத ஜோதிட விதிமுறைகளுக்கு மட்டுமே பொருந்தும்."
                  : "Classical Vedic Dosha diagnostics (Chevvai / Sade Sati) are specific to Lahiri / Raman sidereal astrology."}
              </p>
            </div>
          )}
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

        {/* System Matrix: Vedic / KP / Tropical Dedicated Panels */}
        {isKP ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* KP 4-Tier Significators */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-blue-700" />
                {isTamil ? "கே.பி. 4-அடுக்கு காரகத்துவ மேட்ரிக்ஸ் (Significators)" : "KP 4-Tier House Significator Matrix"}
              </h4>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {Object.entries(chartData?.significators || {}).map(([houseNum, sig]) => (
                  <div key={houseNum} className="p-3 rounded-xl bg-white border border-blue-200 text-xs shadow-xs space-y-1">
                    <div className="flex justify-between items-center font-bold text-blue-950">
                      <span>House {houseNum} Significators</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-mono">H{houseNum}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[11px] text-stone-600">
                      <div>L1 (Star of Occ): <strong className="text-blue-900">{sig.level1?.join(", ") || "—"}</strong></div>
                      <div>L2 (Occupants): <strong className="text-indigo-900">{sig.level2?.join(", ") || "—"}</strong></div>
                      <div>L3 (Star of Lord): <strong className="text-purple-900">{sig.level3?.join(", ") || "—"}</strong></div>
                      <div>L4 (House Lord): <strong className="text-stone-900">{sig.level4?.join(", ") || "—"}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* KP Ruling Planets */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-indigo-700" />
                {isTamil ? "கே.பி. ஆளும் கிரகங்கள் (Ruling Planets at Birth)" : "KP Ruling Planets (RP Matrix)"}
              </h4>
              <div className="p-5 rounded-2xl bg-white border border-indigo-200 space-y-3 shadow-xs">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
                    <span className="text-[10px] text-stone-500 block uppercase">Lagna Sign Lord</span>
                    <strong className="text-stone-900 font-bold">{chartData?.rulingPlanets?.lagnaSignLord || "—"}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
                    <span className="text-[10px] text-stone-500 block uppercase">Lagna Star Lord</span>
                    <strong className="text-stone-900 font-bold">{chartData?.rulingPlanets?.lagnaStarLord || "—"}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
                    <span className="text-[10px] text-stone-500 block uppercase">Lagna Sub Lord</span>
                    <strong className="text-indigo-700 font-bold">{chartData?.rulingPlanets?.lagnaSubLord || "—"}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
                    <span className="text-[10px] text-stone-500 block uppercase">Moon Sign Lord</span>
                    <strong className="text-stone-900 font-bold">{chartData?.rulingPlanets?.moonSignLord || "—"}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
                    <span className="text-[10px] text-stone-500 block uppercase">Moon Star Lord</span>
                    <strong className="text-stone-900 font-bold">{chartData?.rulingPlanets?.moonStarLord || "—"}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
                    <span className="text-[10px] text-stone-500 block uppercase">Moon Sub Lord</span>
                    <strong className="text-purple-700 font-bold">{chartData?.rulingPlanets?.moonSubLord || "—"}</strong>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  <span className="font-bold block">Birth Day Lord (Vaara Lord): {chartData?.rulingPlanets?.dayLord}</span>
                  <p className="text-[11px] text-stone-600 mt-1">In KP Krishnamurti Padhdhati, Ruling Planets at birth determine the fruition of events and verify birth-time synchronization.</p>
                </div>
              </div>
            </div>
          </div>
        ) : isTropical ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Western Aspects Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-teal-700" />
                {isTamil ? "மேற்கத்திய டாலமி திருஷ்டிகள் (Ptolemaic Aspects)" : "Western Ptolemaic Aspects Matrix"}
              </h4>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {(chartData?.aspects || []).map((asp, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white border border-teal-200 text-xs shadow-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-stone-900">{asp.planet1} {asp.aspect} {asp.planet2}</span>
                      <span className="text-[10px] text-stone-500 block">Angle: {asp.angle}° (Orb: {Number(asp.orb ?? 0).toFixed(2)}°)</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${asp.status === "Applying" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                        {asp.status}
                      </span>
                      <span className="text-[10px] text-stone-500 block mt-0.5">{asp.nature}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Western Dignities */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-900 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-cyan-700" />
                {isTamil ? "கிரக ஆதிபத்திய பலங்கள் (Essential Dignities)" : "Western Essential Planetary Dignities"}
              </h4>
              <div className="p-5 rounded-2xl bg-white border border-cyan-200 space-y-2 shadow-xs">
                {(planets || []).map(p => (
                  <div key={p.name} className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                    <span className="font-bold text-stone-900">{p.name} in {p.signName || p.sign}</span>
                    <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
                      p.dignity?.includes("Domicile") || p.dignity?.includes("Exaltation")
                        ? "bg-emerald-100 text-emerald-800"
                        : p.dignity?.includes("Detriment") || p.dignity?.includes("Fall")
                        ? "bg-rose-100 text-rose-800"
                        : "bg-stone-200 text-stone-700"
                    }`}>
                      {p.dignity || "Peregrine"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Jaimini Chara Karakas */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-700" />
                {isTamil ? "ஜைமினி சப்த காரகங்கள் (Soul Matrix)" : "Jaimini Chara Karakas"}
              </h4>

              {Array.isArray(jaiminiKarakas) && jaiminiKarakas.length > 0 ? (
                <div className="space-y-2">
                  {jaiminiKarakas.map((k) => (
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
              ) : (
                <div className="p-4 rounded-2xl bg-white border border-stone-200 text-xs text-stone-500">
                  {isTamil ? "ஜைமினி காரகங்கள் இந்த கணிப்பு முறையில் பொருந்தாது." : (chartData?.jaimini?.reason || "Jaimini Chara Karakas are specific to Vedic Sidereal astrology.")}
                </div>
              )}
            </div>

            {/* 2. Shadbala 6-Fold Strengths */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-800 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-purple-700" />
                {isTamil ? "ஷட்பல கிரக பலங்கள் (Shadbala Rupas)" : "Shadbala Strength Matrix"}
              </h4>

              {Array.isArray(shadbala) && shadbala.length > 0 ? (
                <div className="space-y-2">
                  {shadbala.map((s) => {
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
              ) : (
                <div className="p-4 rounded-2xl bg-white border border-stone-200 text-xs text-stone-500">
                  {isTamil ? "ஷட்பல பலங்கள் இந்த கணிப்பு முறையில் பொருந்தாது." : (chartData?.shadbala?.reason || "Shadbala rupas are specific to Vedic Sidereal astrology.")}
                </div>
              )}
            </div>

            {/* 3. Micro-Divisional Charts (D7, D10, D60) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-cyan-700" />
                {isTamil ? "வர்க்க சக்கரங்கள் (Divisional Vargas)" : "Micro-Divisional Vargas"}
              </h4>

              {divisionalCharts && divisionalCharts.status !== "NOT_APPLICABLE" && divisionalCharts.d10Dasamsha ? (
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
              ) : (
                <div className="p-4 rounded-2xl bg-white border border-stone-200 text-xs text-stone-500">
                  {isTamil ? "வர்க்க சக்கரங்கள் பாரம்பரிய வேத ஜோதிட முறைக்கு மட்டுமே பொருந்தும்." : "Harmonic divisional charts (D1–D60) are specific to Indian Parasara Jyotisha."}
                </div>
              )}
            </div>
          </div>
        )}
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
                {ashtakavarga?.totalBindus ?? "—"} / 337 (Parashari Benchmark)
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

      {/* Birth Time Confidence & Mathematical Sensitivity Card (Audit Point 17) */}
      <BirthTimeConfidenceCard
        confidenceLevel={birthConfidence}
        onSelectConfidence={(lvl) => setBirthConfidence(lvl)}
        chartData={chartData}
        lang={lang}
      />

      {/* Verified Calculation Certificate Trust Banner (Audit Point 39) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-50 to-emerald-100/60 border border-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-300 shrink-0 font-bold">
            ✓
          </div>
          <div>
            <h4 className="font-serif font-bold text-stone-900 text-sm">
              {isTamil ? "மறுஉருவாக்க கணிப்பு சான்றிதழ் (AstroVerse Certificate)" : "AstroVerse Reproducible Calculation Certificate"}
            </h4>
            <p className="text-xs text-stone-600">
              {isTamil ? "சர்வதேச எபிமெரிஸ் ஆயங்கள், UTC தருணம் மற்றும் அயனாம்ச பதிவேடு." : "Inspect exact Julian Day, UTC Instant, Ayanamsha convention, and ephemeris ledger."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsCertModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold text-xs shadow-2xs transition-all shrink-0"
        >
          {isTamil ? "சான்றிதழ் பார்க்க (View Certificate)" : "View Certificate"}
        </button>
      </div>

      {/* Action Banner: Open Complete Detailed Report / Expert Dossier and PDF Export */}
      {onOpenDetailedReport && (
        <div className={`p-5 md:p-6 rounded-3xl border-2 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isExpertMode
            ? "bg-gradient-to-r from-violet-600/15 via-purple-600/10 to-amber-500/15 border-violet-400/90 shadow-violet-500/10"
            : "bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-emerald-500/10 border-emerald-400/80 shadow-emerald-500/10"
        }`}>
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              {isExpertMode ? (
                <Sparkles className="w-5 h-5 text-violet-600" />
              ) : (
                <FileText className="w-5 h-5 text-emerald-600" />
              )}
              <h3 className="font-serif font-bold text-stone-900 text-base md:text-lg">
                {isExpertMode
                  ? (isTamil ? "நிபுணர் ஜோதிட அறிக்கை — 17 வாழ்க்கை களங்கள் & 18 அத்தியாயங்கள்" : "Expert Astrologer Dossier — 17 Domains & Complete 18 Chapters")
                  : (isTamil ? "எளிய ஜோதிட சுருக்க அறிக்கை மற்றும் PDF சேமிப்பு" : "Essential Horoscope Summary & PDF Export")}
              </h3>
            </div>
            <p className="text-xs text-stone-600 max-w-xl">
              {isExpertMode
                ? (isTamil
                    ? "17 வாழ்க்கை களங்களுக்கான விரிவான நேர சாளரங்கள் (ஏன் & ஏன் இல்லை), 16 வர்க்கங்கள், ஷட்பலம் மற்றும் 18 அத்தியாய முழுமையான தொழில்நுட்ப அறிக்கை."
                    : "Deep predictive timelines across 17 life domains with WHY & WHY NOT evidence, plus complete 18-chapter dossier with 16 vargas, Shadbala, and Ashtakavarga.")
                : (isTamil
                    ? "அடிப்படை லக்னம், ராசி, சுருக்கமான 12 பாவகங்கள் மற்றும் 1-பக்க எளிய சுருக்க அறிக்கையை PDF ஆக சேமிக்க."
                    : "Quick 12-Bhava snapshot, core planetary alignment, top yogas overview, and download 1-page Minimal Summary PDF.")}
            </p>
          </div>
          <button
            onClick={onOpenDetailedReport}
            className={`w-full sm:w-auto px-6 py-3 rounded-2xl hover:brightness-110 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 shrink-0 cursor-pointer transition-all ${
              isExpertMode
                ? "bg-gradient-to-r from-violet-600 via-purple-600 to-amber-600 shadow-violet-500/25"
                : "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 shadow-emerald-500/25"
            }`}
          >
            {isExpertMode ? (
              <>
                <Sparkles className="w-4 h-4 fill-amber-300 text-amber-300" />
                <span>{isTamil ? "நிபுணர் அறிக்கையைத் திறக்கவும் (PDF)" : "Open Expert Dossier (PDF)"}</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 fill-emerald-200 text-emerald-200" />
                <span>{isTamil ? "சுருக்க அறிக்கையைத் திறக்கவும் (PDF)" : "Open Simple Report (PDF)"}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Interactive Planet Detail Intelligence Modal */}
      <PlanetDetailModal
        isOpen={isPlanetModalOpen}
        onClose={() => setIsPlanetModalOpen(false)}
        planet={selectedPlanet}
        chartData={chartData}
        lang={lang}
        onAskAboutPlanet={onAskAboutPlanet}
      />

      {/* Calculation Certificate Modal */}
      <CalculationCertificateModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        chartData={chartData}
        lang={lang}
      />
    </div>
  );
}
