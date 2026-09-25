import React, { useState, useEffect } from "react";
import { Heart, Sparkles, User, Calendar, Clock, MapPin, ShieldCheck, AlertTriangle, ArrowLeftRight, Check } from "lucide-react";
import { calculateAshtakootaMatch, calculatePlanetaryPositions, NAKSHATRAS } from "../../services/astroEngine";
import { TRANSLATIONS } from "../../services/localization";
import PlaceAutocomplete from "../Common/PlaceAutocomplete";
import { resolveTypedPlace } from "../../services/geoService";

export default function KundliMatch({ profile = null, chartData = null, lang = "en" }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isTamil = lang === "ta";

  // Determine initial role for Partner 1 based on loaded profile's gender
  const initialP1Role = (profile?.gender === "female") ? "bride" : "groom";
  const [p1Role, setP1Role] = useState(initialP1Role); // "groom" | "bride"

  // Partner 1 State
  const [partner1Mode, setPartner1Mode] = useState(() => chartData ? "profile" : "details");
  const [p1Name, setP1Name] = useState(() => profile?.name && profile.name !== "Native" && profile.name !== "ஜாதகர்" ? profile.name : "");
  const [p1Date, setP1Date] = useState(() => profile?.birthDate || "");
  const [p1Time, setP1Time] = useState(() => profile?.birthTime || "");
  const [p1City, setP1City] = useState(() => profile?.birthPlace || "");
  const [p1Lat, setP1Lat] = useState(() => profile?.latitude ?? null);
  const [p1Lng, setP1Lng] = useState(() => profile?.longitude ?? null);
  const [p1Tz, setP1Tz] = useState(() => profile?.utcOffset ?? 5.5);
  const [p1TimezoneId, setP1TimezoneId] = useState(() => profile?.timezoneId || null);
  const [p1Nak, setP1Nak] = useState(() => chartData?.moonNakshatra?.name || "Ashwini");
  const [p1Pada, setP1Pada] = useState(() => chartData?.moonNakshatra?.pada ?? null);
  const [p1ChartData, setP1ChartData] = useState(() => chartData || null);

  // Partner 2 State
  const [partner2Mode, setPartner2Mode] = useState("details"); // "details" | "nakshatra"
  const [p2Name, setP2Name] = useState("");
  const [p2Date, setP2Date] = useState("");
  const [p2Time, setP2Time] = useState("");
  const [p2City, setP2City] = useState("");
  const [p2Lat, setP2Lat] = useState(null);
  const [p2Lng, setP2Lng] = useState(null);
  const [p2Tz, setP2Tz] = useState(null);
  const [p2TimezoneId, setP2TimezoneId] = useState(null);
  const [p2Nak, setP2Nak] = useState("");
  const [p2Pada, setP2Pada] = useState(null);
  const [p2ChartData, setP2ChartData] = useState(null);

  const [matchResult, setMatchResult] = useState(null);

  const POPULAR_CITIES = [
    { name: isTamil ? "சென்னை" : "Chennai", display: isTamil ? "சென்னை, தமிழ்நாடு" : "Chennai, Tamil Nadu", lat: 13.0827, lng: 80.2707, tz: 5.5, timezoneId: "Asia/Kolkata" },
    { name: isTamil ? "மதுரை" : "Madurai", display: isTamil ? "மதுரை, தமிழ்நாடு" : "Madurai, Tamil Nadu", lat: 9.9252, lng: 78.1198, tz: 5.5, timezoneId: "Asia/Kolkata" },
    { name: isTamil ? "கோவை" : "Coimbatore", display: isTamil ? "கோவை, தமிழ்நாடு" : "Coimbatore, Tamil Nadu", lat: 11.0168, lng: 76.9558, tz: 5.5, timezoneId: "Asia/Kolkata" },
    { name: isTamil ? "சேலம்" : "Salem", display: isTamil ? "சேலம், தமிழ்நாடு" : "Salem, Tamil Nadu", lat: 11.6643, lng: 78.1460, tz: 5.5, timezoneId: "Asia/Kolkata" },
    { name: isTamil ? "பெங்களூரு" : "Bengaluru", display: isTamil ? "பெங்களூரு, கர்நாடகா" : "Bengaluru, Karnataka", lat: 12.9716, lng: 77.5946, tz: 5.5, timezoneId: "Asia/Kolkata" },
    { name: isTamil ? "புது தில்லி" : "New Delhi", display: isTamil ? "புது தில்லி, இந்தியா" : "New Delhi, India", lat: 28.6139, lng: 77.2090, tz: 5.5, timezoneId: "Asia/Kolkata" },
    { name: isTamil ? "சிங்கப்பூர்" : "Singapore", display: isTamil ? "சிங்கப்பூர்" : "Singapore", lat: 1.3521, lng: 103.8198, tz: 8.0, timezoneId: "Asia/Singapore" }
  ];

  const NAK_NAMES_TAMIL = {
    Ashwini: "அசுவினி", Bharani: "பரணி", Krittika: "கிருத்திகை", Rohini: "ரோகிணி",
    Mrigashira: "மிருகசீரிஷம்", Ardra: "திருவாதிரை", Punarvasu: "புனர்பூசம்", Pushya: "பூசம்",
    Ashlesha: "ஆயில்யம்", Magha: "மகம்", "Purva Phalguni": "பூரம்", "Uttara Phalguni": "உத்திரம்",
    Hasta: "அஸ்தம்", Chitra: "சித்திரை", Swati: "சுவாதி", Vishakha: "விசாகம்",
    Anuradha: "அனுஷம்", Jyeshtha: "கேட்டை", Mula: "மூலம்", "Purva Ashadha": "பூராடம்",
    "Uttara Ashadha": "உத்திராடம்", Shravana: "திருவோணம்", Dhanishta: "அவிட்டம்",
    Shatabhisha: "சதயம்", "Purva Bhadrapada": "பூரட்டாதி", "Uttara Bhadrapada": "உத்திரட்டாதி",
    Revati: "ரேவதி"
  };

  // Sync loaded profile when changed
  useEffect(() => {
    if (chartData?.moonNakshatra?.name) {
      setP1Nak(chartData.moonNakshatra.name);
      setP1Pada(chartData.moonNakshatra.pada ?? null);
      setP1ChartData(chartData);
    }
    if (profile?.gender === "female") {
      setP1Role("bride");
    } else if (profile?.gender === "male") {
      setP1Role("groom");
    }
    if (profile?.name && profile.name !== "Native" && profile.name !== "ஜாதகர்") {
      setP1Name(profile.name);
    }
  }, [chartData, profile]);

  const p2Role = p1Role === "groom" ? "bride" : "groom";

  const handleSwapRoles = () => {
    setP1Role(prev => (prev === "groom" ? "bride" : "groom"));
    setMatchResult(null);
  };

  // Resolve typed city if coords are missing
  const getP1ResolvedCoords = () => {
    if (typeof p1Lat === "number" && typeof p1Lng === "number") {
      return { lat: p1Lat, lng: p1Lng, tz: p1Tz, timezoneId: p1TimezoneId };
    }
    if (p1City?.trim()) {
      const match = resolveTypedPlace(p1City, isTamil);
      if (match) return { lat: match.lat, lng: match.lon ?? match.lng, tz: match.tz ?? 5.5, timezoneId: match.timezoneId };
    }
    return null;
  };

  const getP2ResolvedCoords = () => {
    if (typeof p2Lat === "number" && typeof p2Lng === "number") {
      return { lat: p2Lat, lng: p2Lng, tz: p2Tz, timezoneId: p2TimezoneId };
    }
    if (p2City?.trim()) {
      const match = resolveTypedPlace(p2City, isTamil);
      if (match) return { lat: match.lat, lng: match.lon ?? match.lng, tz: match.tz ?? 5.5, timezoneId: match.timezoneId };
    }
    return null;
  };

  // Validation guards
  const isP1Valid = partner1Mode === "profile" 
    ? Boolean(chartData) 
    : (partner1Mode === "details" ? Boolean(p1Date && p1Time && getP1ResolvedCoords()) : Boolean(p1Nak));

  const isP2Valid = partner2Mode === "details"
    ? Boolean(p2Date && p2Time && getP2ResolvedCoords())
    : Boolean(p2Nak);

  const canMatch = isP1Valid && isP2Valid;

  const handleMatch = () => {
    if (!canMatch) return;

    let computedP1Chart = chartData;
    let p1EffectiveNak = p1Nak;
    let p1EffectivePada = p1Pada;
    let p1EffectiveMoonSign = chartData?.moonSign?.name || null;

    const p1Coords = getP1ResolvedCoords();
    if (partner1Mode === "details" && p1Date && p1Time && p1Coords) {
      try {
        computedP1Chart = calculatePlanetaryPositions(p1Date, p1Time, p1Coords.lat, p1Coords.lng, "vedic", p1Coords.timezoneId || (p1Coords.tz ?? 5.5));
        setP1ChartData(computedP1Chart);
        setP1Lat(p1Coords.lat);
        setP1Lng(p1Coords.lng);
        setP1Tz(p1Coords.tz);
        setP1TimezoneId(p1Coords.timezoneId);
        if (computedP1Chart.moonNakshatra?.name) {
          p1EffectiveNak = computedP1Chart.moonNakshatra.name;
          p1EffectivePada = computedP1Chart.moonNakshatra.pada ?? null;
          p1EffectiveMoonSign = computedP1Chart.moonSign?.name || null;
          setP1Nak(computedP1Chart.moonNakshatra.name);
          setP1Pada(p1EffectivePada);
        }
      } catch (err) {
        console.error("Partner 1 calculation error:", err);
      }
    } else if (partner1Mode === "profile" && chartData) {
      computedP1Chart = chartData;
      p1EffectiveNak = chartData.moonNakshatra?.name || p1Nak;
      p1EffectivePada = chartData.moonNakshatra?.pada ?? null;
      p1EffectiveMoonSign = chartData.moonSign?.name || null;
    }

    let computedP2Chart = null;
    let p2EffectiveNak = p2Nak;
    let p2EffectivePada = p2Pada;
    let p2EffectiveMoonSign = null;

    const p2Coords = getP2ResolvedCoords();
    if (partner2Mode === "details" && p2Date && p2Time && p2Coords) {
      try {
        computedP2Chart = calculatePlanetaryPositions(p2Date, p2Time, p2Coords.lat, p2Coords.lng, "vedic", p2Coords.timezoneId || (p2Coords.tz ?? 5.5));
        setP2ChartData(computedP2Chart);
        setP2Lat(p2Coords.lat);
        setP2Lng(p2Coords.lng);
        setP2Tz(p2Coords.tz);
        setP2TimezoneId(p2Coords.timezoneId);
        if (computedP2Chart.moonNakshatra?.name) {
          p2EffectiveNak = computedP2Chart.moonNakshatra.name;
          p2EffectivePada = computedP2Chart.moonNakshatra.pada ?? null;
          p2EffectiveMoonSign = computedP2Chart.moonSign?.name || null;
          setP2Nak(computedP2Chart.moonNakshatra.name);
          setP2Pada(p2EffectivePada);
        }
      } catch (err) {
        console.error("Partner 2 calculation error:", err);
      }
    }

    if (!p1EffectiveNak || !p2EffectiveNak) return;

    // Strict Groom / Bride parameter assignment according to selected roles
    const isP1Groom = p1Role === "groom";

    const groomNak = isP1Groom ? p1EffectiveNak : p2EffectiveNak;
    const brideNak = isP1Groom ? p2EffectiveNak : p1EffectiveNak;
    const groomMoonSign = isP1Groom ? p1EffectiveMoonSign : p2EffectiveMoonSign;
    const brideMoonSign = isP1Groom ? p2EffectiveMoonSign : p1EffectiveMoonSign;
    const groomPada = isP1Groom ? p1EffectivePada : p2EffectivePada;
    const bridePada = isP1Groom ? p2EffectivePada : p1EffectivePada;

    const groomName = isP1Groom 
      ? (p1Name || (isTamil ? "மணமகன்" : "Groom"))
      : (p2Name || (isTamil ? "மணமகன்" : "Groom"));
    const brideName = isP1Groom 
      ? (p2Name || (isTamil ? "மணமகள்" : "Bride"))
      : (p1Name || (isTamil ? "மணமகள்" : "Bride"));

    const res = calculateAshtakootaMatch(
      groomNak,
      brideNak,
      groomMoonSign,
      brideMoonSign,
      groomPada,
      bridePada
    );

    // Mutual Chevvai (Mars) Dosha Matching Diagnostic
    let doshaMatchVerdict = null;
    const p1HasChevvai = computedP1Chart?.doshaAnalysis?.isChevvaiDosha;
    const p2HasChevvai = computedP2Chart?.doshaAnalysis?.isChevvaiDosha;

    if (p1HasChevvai !== undefined && p2HasChevvai !== undefined) {
      if (p1HasChevvai && p2HasChevvai) {
        doshaMatchVerdict = {
          status: "compatible",
          title: isTamil ? "இருவருக்கும் செவ்வாய் தோஷம் சமநிலை (தோஷ சாம்யம்)" : "Mutual Mars Dosha Balance (Traditional Samya)",
          desc: isTamil
            ? "இருவர் ஜாதகத்திலும் செவ்வாய் தோஷம் சமமாக அமைந்திருப்பதால் தோஷ சாம்யம் ஏற்பட்டு பரிகார ரீதியாக தோஷம் நீங்குகிறது."
            : "Both charts present comparable Mars Dosha, achieving Samya (mutual neutralization) under classical Parashari rules."
        };
      } else if (!p1HasChevvai && !p2HasChevvai) {
        doshaMatchVerdict = {
          status: "compatible",
          title: isTamil ? "இருவருக்கும் செவ்வாய் தோஷம் இல்லை (சுப யோகம்)" : "Clear of Mars Dosha (Both Free of Kuja Dosha)",
          desc: isTamil
            ? "தேர்ந்தெடுக்கப்பட்ட பாரம்பரிய விதியின்படி இருவர் ஜாதகத்திலும் செவ்வாய் தோஷம் இல்லை."
            : "Both charts are free of Kuja Dosha under the selected convention."
        };
      } else {
        doshaMatchVerdict = {
          status: "advisory",
          title: isTamil ? "செவ்வாய் தோஷ வேறுபாடு (பரிகார ஆலோசனை)" : "Asymmetric Mars Dosha (Remedial Review)",
          desc: isTamil
            ? `ஒருவருக்கு செவ்வாய் தோஷம் உள்ளதாகவும் மற்றவருக்கு இல்லை என்றும் கணக்கிடப்பட்டுள்ளது (${isP1Groom ? (p1HasChevvai ? "மணமகனுக்கு உண்டு" : "மணமகளுக்கு உண்டு") : (p2HasChevvai ? "மணமகனுக்கு உண்டு" : "மணமகளுக்கு உண்டு")}). பாரம்பரிய தோஷப் பொருத்த பரிகாரங்களை ஆராயவும்.`
            : "Traditional Mars-Dosha comparison shows an asymmetry between the charts. Consider consulting traditional remedial guidance."
        };
      }
    }

    setMatchResult({
      ...res,
      doshaMatchVerdict,
      groomName,
      brideName,
      groomNak,
      brideNak,
      groomPada,
      bridePada,
      groomMoonSign,
      brideMoonSign,
      isP1Groom
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      <div className="p-6 md:p-8 rounded-3xl bg-white border border-rose-300/80 shadow-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 border border-rose-300 text-rose-900 text-xs font-bold uppercase tracking-wider">
            <Heart className="w-3.5 h-3.5 fill-rose-600 text-rose-600" /> {t.matchHeaderTag}
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900">
            {isTamil ? "வேத அஷ்டகூட திருமணப் பொருத்தம் & செவ்வாய் தோஷ ஆய்வு" : "Vedic Ashtakoota Matrimonial Compatibility & Dosha Synergy"}
          </h2>
          <p className="text-xs text-stone-600 max-w-xl mx-auto leading-relaxed">
            {isTamil
              ? "36 நற்பொருத்த புள்ளிகள் (வர்ணம், வசியம், தினம், யோனி, கிரஹ மைத்ரி, கணம், ராசி, நாடி) மற்றும் இருவரின் செவ்வாய் தோஷ சமநிலையை உயர் துல்லிய எபிமெரிஸ் மூலம் கணக்கிடுகிறது."
              : "Authentic 36-point Parashari Ashtakoota matching with mutual Mars (Chevvai) Dosha balance diagnostics based on exact natal planetary longitudes."}
          </p>

          {/* Quick Swap Roles Button */}
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={handleSwapRoles}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-all shadow-xs"
              title={isTamil ? "மணமகன் மற்றும் மணமகள் நிலையை மாற்ற" : "Swap Groom & Bride Roles"}
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-amber-700" />
              <span>{isTamil ? "மணமகன் / மணமகள் நிலையை மாற்றுக" : "Swap Groom / Bride Roles"}</span>
            </button>
          </div>
        </div>

        {/* Dual Input Grid: Partner 1 & Partner 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Partner 1 Card */}
          <div className={`p-5 rounded-2xl border space-y-4 shadow-sm transition-all ${
            p1Role === "groom" ? "bg-blue-50/40 border-blue-200" : "bg-rose-50/40 border-rose-200"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                <span className="text-lg">{p1Role === "groom" ? "👨" : "👩"}</span>
                <div>
                  <span className={p1Role === "groom" ? "text-blue-900" : "text-rose-900"}>
                    {p1Role === "groom" ? (isTamil ? "மணமகன் (Groom / Boy)" : "Groom (Boy / Male)") : (isTamil ? "மணமகள் (Bride / Girl)" : "Bride (Girl / Female)")}
                  </span>
                  {p1Name && <span className="text-xs font-normal text-stone-600 ml-1.5">({p1Name})</span>}
                </div>
              </div>

              {/* Role Toggle for Partner 1 */}
              <button
                type="button"
                onClick={() => setP1Role(prev => (prev === "groom" ? "bride" : "groom"))}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                  p1Role === "groom"
                    ? "bg-blue-600 text-white border-blue-700 shadow-xs"
                    : "bg-rose-600 text-white border-rose-700 shadow-xs"
                }`}
              >
                {p1Role === "groom" ? (isTamil ? "ஆண் (Boy) ✓" : "Male (Boy) ✓") : (isTamil ? "பெண் (Girl) ✓" : "Female (Girl) ✓")}
              </button>
            </div>

            {/* Mode Tabs for Partner 1 */}
            <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-[11px]">
              {chartData && (
                <button
                  type="button"
                  onClick={() => setPartner1Mode("profile")}
                  className={`flex-1 py-1 rounded-md font-bold transition-all ${
                    partner1Mode === "profile" ? "bg-white text-stone-900 shadow-xs" : "text-stone-600"
                  }`}
                >
                  {isTamil ? "ஏற்றப்பட்ட ஜாதகம்" : "Loaded Chart"}
                </button>
              )}
              <button
                type="button"
                onClick={() => setPartner1Mode("details")}
                className={`flex-1 py-1 rounded-md font-bold transition-all ${
                  partner1Mode === "details" ? "bg-white text-stone-900 shadow-xs" : "text-stone-600"
                }`}
              >
                {isTamil ? "பிறந்த விபரங்கள்" : "Full Details"}
              </button>
              <button
                type="button"
                onClick={() => setPartner1Mode("nakshatra")}
                className={`flex-1 py-1 rounded-md font-bold transition-all ${
                  partner1Mode === "nakshatra" ? "bg-white text-stone-900 shadow-xs" : "text-stone-600"
                }`}
              >
                {isTamil ? "நட்சத்திரம்" : "Nakshatra"}
              </button>
            </div>

            {/* Mode 1: Loaded Chart Profile */}
            {partner1Mode === "profile" && chartData && (
              <div className="p-3.5 rounded-xl bg-white/90 border border-stone-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-500">{isTamil ? "நட்சத்திரம் & பாதம்:" : "Nakshatra & Pada:"}</span>
                  <span className="font-bold text-stone-900">
                    {isTamil ? chartData.moonNakshatra?.tamil : chartData.moonNakshatra?.name} ({isTamil ? "பாதம்" : "Pada"} {chartData.moonNakshatra?.pada})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">{isTamil ? "ராசி:" : "Rasi (Moon Sign):"}</span>
                  <span className="font-bold text-stone-900">
                    {isTamil ? chartData.moonSign?.tamil : chartData.moonSign?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">{isTamil ? "செவ்வாய் தோஷம்:" : "Mars Dosha:"}</span>
                  <span className={`font-bold ${chartData.doshaAnalysis?.isChevvaiDosha ? "text-rose-700" : "text-emerald-700"}`}>
                    {chartData.doshaAnalysis?.isChevvaiDosha ? (isTamil ? "உள்ளது" : "Present") : (isTamil ? "இல்லை" : "None")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">{isTamil ? "பிறந்த ஊர்:" : "Birth Place:"}</span>
                  <span className="font-medium text-stone-700 truncate max-w-[180px]">{profile?.birthPlace || "Default"}</span>
                </div>
              </div>
            )}

            {/* Mode 2: Full Birth Details */}
            {partner1Mode === "details" && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-stone-600 font-medium block mb-1">
                    {isTamil ? "பெயர் (விருப்பமிருந்தால்):" : "Name (Optional):"}
                  </label>
                  <input
                    type="text"
                    value={p1Name}
                    onChange={e => setP1Name(e.target.value)}
                    placeholder={p1Role === "groom" ? (isTamil ? "மணமகன் பெயர்" : "Groom's Name") : (isTamil ? "மணமகள் பெயர்" : "Bride's Name")}
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-stone-600 font-medium flex items-center gap-1 mb-1">
                      <Calendar className="w-3 h-3 text-amber-600" />
                      {isTamil ? "பிறந்த தேதி" : "Birth Date"}
                    </label>
                    <input
                      type="date"
                      value={p1Date}
                      onChange={e => setP1Date(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-amber-500 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-stone-600 font-medium flex items-center gap-1 mb-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      {isTamil ? "பிறந்த நேரம்" : "Birth Time"}
                    </label>
                    <input
                      type="time"
                      value={p1Time}
                      onChange={e => setP1Time(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-amber-500 shadow-xs"
                    />
                  </div>
                </div>

                {/* Birth City Autocomplete with typing and autopopulation */}
                <div>
                  <label className="text-[11px] text-stone-600 font-medium flex items-center gap-1 mb-1">
                    <MapPin className="w-3 h-3 text-amber-600" />
                    {isTamil ? "பிறந்த ஊர் / நகரம் (தட்டச்சு செய்து தேர்வு செய்க)" : "Birth Place / City (Type to Search & Autopopulate)"}
                  </label>
                  <PlaceAutocomplete
                    value={p1City}
                    onChange={(val) => {
                      setP1City(val);
                      setP1Lat(null);
                      setP1Lng(null);
                      setP1Tz(null);
                      setP1TimezoneId(null);
                    }}
                    onSelect={(p) => {
                      setP1City(p.displayString || p.name);
                      setP1Lat(p.lat);
                      setP1Lng(p.lon ?? p.lng);
                      setP1Tz(p.tz ?? 5.5);
                      setP1TimezoneId(p.timezoneId || null);
                    }}
                    lang={lang}
                    placeholder={isTamil ? "நகரம் / ஊரை தட்டச்சு செய்யவும்..." : "Search birth city..."}
                  />

                  {/* Quick Popular City Chips */}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {POPULAR_CITIES.map(city => (
                      <button
                        key={`p1-${city.name}`}
                        type="button"
                        onClick={() => {
                          setP1City(city.display);
                          setP1Lat(city.lat);
                          setP1Lng(city.lng);
                          setP1Tz(city.tz);
                          setP1TimezoneId(city.timezoneId);
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                          p1City === city.display
                            ? "bg-amber-100 text-amber-900 border-amber-400 font-bold"
                            : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
                        }`}
                      >
                        {city.name}
                      </button>
                    ))}
                  </div>

                  {p1Lat !== null && p1Lng !== null && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                      <span>✓</span>
                      <span>{isTamil ? "இடம் சரிபார்க்கப்பட்டது" : "Location verified"}: {Number(p1Lat).toFixed(3)}°, {Number(p1Lng).toFixed(3)}°{p1TimezoneId ? ` (${p1TimezoneId})` : ''}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mode 3: Nakshatra Only */}
            {partner1Mode === "nakshatra" && (
              <div className="space-y-2">
                <label className="text-xs text-stone-700 font-semibold">{t.birthMoonNak}</label>
                <select
                  value={p1Nak}
                  onChange={e => setP1Nak(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-900 text-sm focus:outline-none focus:border-amber-500 shadow-sm"
                >
                  {NAKSHATRAS.map(n => (
                    <option key={`p1-nak-${n.name}`} value={n.name}>
                      {isTamil ? (NAK_NAMES_TAMIL[n.name] || n.name) : n.name} ({n.name})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Partner 2 Card */}
          <div className={`p-5 rounded-2xl border space-y-4 shadow-sm transition-all ${
            p2Role === "groom" ? "bg-blue-50/40 border-blue-200" : "bg-rose-50/40 border-rose-200"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                <span className="text-lg">{p2Role === "groom" ? "👨" : "👩"}</span>
                <div>
                  <span className={p2Role === "groom" ? "text-blue-900" : "text-rose-900"}>
                    {p2Role === "groom" ? (isTamil ? "மணமகன் (Groom / Boy)" : "Groom (Boy / Male)") : (isTamil ? "மணமகள் (Bride / Girl)" : "Bride (Girl / Female)")}
                  </span>
                  {p2Name && <span className="text-xs font-normal text-stone-600 ml-1.5">({p2Name})</span>}
                </div>
              </div>

              {/* Role Indicator for Partner 2 */}
              <button
                type="button"
                onClick={() => setP1Role(prev => (prev === "groom" ? "bride" : "groom"))}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                  p2Role === "groom"
                    ? "bg-blue-600 text-white border-blue-700 shadow-xs"
                    : "bg-rose-600 text-white border-rose-700 shadow-xs"
                }`}
              >
                {p2Role === "groom" ? (isTamil ? "ஆண் (Boy) ✓" : "Male (Boy) ✓") : (isTamil ? "பெண் (Girl) ✓" : "Female (Girl) ✓")}
              </button>
            </div>

            {/* Mode Toggle: Details vs Nakshatra Only */}
            <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-[11px]">
              <button
                type="button"
                onClick={() => setPartner2Mode("details")}
                className={`flex-1 py-1 rounded-md font-bold transition-all ${
                  partner2Mode === "details" ? "bg-white text-stone-900 shadow-xs" : "text-stone-600"
                }`}
              >
                {isTamil ? "பிறந்த விபரங்கள்" : "Full Details"}
              </button>
              <button
                type="button"
                onClick={() => setPartner2Mode("nakshatra")}
                className={`flex-1 py-1 rounded-md font-bold transition-all ${
                  partner2Mode === "nakshatra" ? "bg-white text-stone-900 shadow-xs" : "text-stone-600"
                }`}
              >
                {isTamil ? "நட்சத்திரம் மட்டும்" : "Nakshatra Only"}
              </button>
            </div>

            {partner2Mode === "details" ? (
              <div className="space-y-3">
                {/* Partner 2 Name */}
                <div>
                  <label className="text-[11px] text-stone-600 font-medium block mb-1">
                    {isTamil ? "பெயர் (விருப்பமிருந்தால்):" : "Name (Optional):"}
                  </label>
                  <input
                    type="text"
                    value={p2Name}
                    onChange={e => setP2Name(e.target.value)}
                    placeholder={p2Role === "groom" ? (isTamil ? "மணமகன் பெயர்" : "Groom's Name") : (isTamil ? "மணமகள் பெயர்" : "Bride's Name")}
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-stone-600 font-medium flex items-center gap-1 mb-1">
                      <Calendar className="w-3 h-3 text-amber-600" />
                      {isTamil ? "பிறந்த தேதி" : "Birth Date"}
                    </label>
                    <input
                      type="date"
                      value={p2Date}
                      onChange={e => setP2Date(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-amber-500 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-stone-600 font-medium flex items-center gap-1 mb-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      {isTamil ? "பிறந்த நேரம்" : "Birth Time"}
                    </label>
                    <input
                      type="time"
                      value={p2Time}
                      onChange={e => setP2Time(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-amber-500 shadow-xs"
                    />
                  </div>
                </div>

                {/* Birth City Autocomplete with typing & autopopulation */}
                <div>
                  <label className="text-[11px] text-stone-600 font-medium flex items-center gap-1 mb-1">
                    <MapPin className="w-3 h-3 text-amber-600" />
                    {isTamil ? "பிறந்த ஊர் / நகரம் (தட்டச்சு செய்து தேர்வு செய்க)" : "Birth Place / City (Type to Search & Autopopulate)"}
                  </label>
                  <PlaceAutocomplete
                    value={p2City}
                    onChange={(val) => {
                      setP2City(val);
                      setP2Lat(null);
                      setP2Lng(null);
                      setP2Tz(null);
                      setP2TimezoneId(null);
                    }}
                    onSelect={(p) => {
                      setP2City(p.displayString || p.name);
                      setP2Lat(p.lat);
                      setP2Lng(p.lon ?? p.lng);
                      setP2Tz(p.tz ?? 5.5);
                      setP2TimezoneId(p.timezoneId || null);
                    }}
                    lang={lang}
                    placeholder={isTamil ? "நகரம் / ஊரை தட்டச்சு செய்யவும்..." : "Search birth city..."}
                  />

                  {/* Quick Popular City Chips */}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {POPULAR_CITIES.map(city => (
                      <button
                        key={`p2-${city.name}`}
                        type="button"
                        onClick={() => {
                          setP2City(city.display);
                          setP2Lat(city.lat);
                          setP2Lng(city.lng);
                          setP2Tz(city.tz);
                          setP2TimezoneId(city.timezoneId);
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                          p2City === city.display
                            ? "bg-amber-100 text-amber-900 border-amber-400 font-bold"
                            : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
                        }`}
                      >
                        {city.name}
                      </button>
                    ))}
                  </div>

                  {p2Lat !== null && p2Lng !== null && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                      <span>✓</span>
                      <span>{isTamil ? "இடம் சரிபார்க்கப்பட்டது" : "Location verified"}: {Number(p2Lat).toFixed(3)}°, {Number(p2Lng).toFixed(3)}°{p2TimezoneId ? ` (${p2TimezoneId})` : ''}</span>
                    </div>
                  )}
                </div>

                {p2ChartData && (
                  <div className="p-3 rounded-xl bg-white/90 border border-stone-200 text-xs space-y-1 mt-2">
                    <div className="flex justify-between">
                      <span className="text-stone-500">{isTamil ? "கணக்கிடப்பட்ட நட்சத்திரம்:" : "Calculated Nakshatra:"}</span>
                      <span className="font-bold text-stone-900">
                        {isTamil ? p2ChartData.moonNakshatra?.tamil : p2ChartData.moonNakshatra?.name} ({isTamil ? "பாதம்" : "Pada"} {p2ChartData.moonNakshatra?.pada})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">{isTamil ? "ராசி:" : "Rasi:"}</span>
                      <span className="font-bold text-stone-900">{isTamil ? p2ChartData.moonSign?.tamil : p2ChartData.moonSign?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">{isTamil ? "செவ்வாய் தோஷம்:" : "Mars Dosha:"}</span>
                      <span className={`font-bold ${p2ChartData.doshaAnalysis?.isChevvaiDosha ? "text-rose-700" : "text-emerald-700"}`}>
                        {p2ChartData.doshaAnalysis?.isChevvaiDosha ? (isTamil ? "உள்ளது" : "Present") : (isTamil ? "இல்லை" : "None")}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs text-stone-700 font-semibold">{t.birthMoonNak}</label>
                <select
                  value={p2Nak}
                  onChange={e => setP2Nak(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-900 text-sm focus:outline-none focus:border-amber-500 shadow-sm"
                >
                  <option value="">{isTamil ? "-- நட்சத்திரத்தைத் தேர்ந்தெடுக்கவும் --" : "-- Select Nakshatra --"}</option>
                  {NAKSHATRAS.map(n => (
                    <option key={`p2-nak-${n.name}`} value={n.name}>
                      {isTamil ? (NAK_NAMES_TAMIL[n.name] || n.name) : n.name} ({n.name})
                    </option>
                  ))}
                </select>

                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    {isTamil
                      ? "நட்சத்திர முறை: முழு ஜாதகம் அல்லது செவ்வாய் தோஷ ஒப்பீடு இன்றி 36-புள்ளி அஷ்டகூடப் பொருத்தத்தை மட்டுமே கணக்கிடுகிறது. முழுமையான செவ்வாய் தோஷ ஆய்விற்கு 'பிறந்த விபரங்கள்' முறையைத் தேர்ந்தெடுக்கவும்."
                      : "Nakshatra-Only Mode: Computes classical 36-point Ashtakoota compatibility without full planetary chart or Chevvai (Mars) Dosha verification. Switch to 'Full Details' for complete dosha diagnostics."}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Calculate Match Button */}
        <div className="space-y-2">
          <button
            onClick={handleMatch}
            disabled={!canMatch}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all ${
              canMatch
                ? "bg-gradient-to-r from-rose-600 via-purple-600 to-amber-600 text-white shadow-rose-500/25 hover:brightness-110 active:scale-[0.99] cursor-pointer"
                : "bg-stone-300 text-stone-500 cursor-not-allowed shadow-none"
            }`}
          >
            <Sparkles className="w-4 h-4 text-rose-200" />
            <span>{t.matchBtn}</span>
          </button>

          {!canMatch && (
            <p className="text-center text-[11px] text-rose-700 font-medium">
              {isTamil
                ? "பொருத்தத்தைக் கணக்கிட இருவரின் பிறந்த தேதி, நேரம் மற்றும் ஊர் அல்லது நட்சத்திரங்களைத் தேர்ந்தெடுக்கவும்."
                : "Please complete the required birth details or select Nakshatras for both partners."}
            </p>
          )}
        </div>

        {/* Results Presentation */}
        {matchResult && (
          <div className="space-y-6 pt-6 border-t border-amber-200 animate-fadeIn">
            {/* Main Score Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-50 via-rose-50 to-amber-50 border border-rose-300 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-widest text-rose-800 block">
                  {t.matchScoreTitle}
                </span>
                <h3 className="text-2xl font-serif font-bold text-stone-900">
                  {isTamil ? (matchResult.totalScore >= 18 ? "சுப மங்கல அனுகூல பொருத்தம் (உத்தமம்)" : "மத்திமம் - பரிகாரம் தேவை") : matchResult.recommendation}
                </h3>
                
                {/* Designated Groom & Bride Badges */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100/80 border border-blue-300 text-blue-950 text-xs">
                    <span className="font-bold">👨 {isTamil ? "மணமகன்:" : "Groom:"}</span>
                    <span>{matchResult.groomName} ({isTamil ? (NAK_NAMES_TAMIL[matchResult.groomNak] || matchResult.groomNak) : matchResult.groomNak}{matchResult.groomPada ? ` - பாதம் ${matchResult.groomPada}` : ""})</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100/80 border border-rose-300 text-rose-950 text-xs">
                    <span className="font-bold">👩 {isTamil ? "மணமகள்:" : "Bride:"}</span>
                    <span>{matchResult.brideName} ({isTamil ? (NAK_NAMES_TAMIL[matchResult.brideNak] || matchResult.brideNak) : matchResult.brideNak}{matchResult.bridePada ? ` - பாதம் ${matchResult.bridePada}` : ""})</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <span className="text-4xl font-extrabold text-amber-700">
                    {matchResult.totalScore}
                  </span>
                  <span className="text-stone-500 text-sm font-bold"> / 36</span>
                  <div className="text-xs text-emerald-800 font-bold">{matchResult.percentage}% {t.matchLabel}</div>
                </div>
              </div>
            </div>

            {/* Chevvai (Mars) Dosha Match Alert Card */}
            {matchResult.doshaMatchVerdict && (
              <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-xs ${
                matchResult.doshaMatchVerdict.status === "compatible"
                  ? "bg-emerald-50/80 border-emerald-300 text-emerald-950"
                  : "bg-amber-50/90 border-amber-300 text-amber-950"
              }`}>
                {matchResult.doshaMatchVerdict.status === "compatible" ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold text-xs">
                    {matchResult.doshaMatchVerdict.title}
                  </h4>
                  <p className="text-[11px] text-stone-700 mt-0.5 leading-relaxed">
                    {matchResult.doshaMatchVerdict.desc}
                  </p>
                </div>
              </div>
            )}

            {/* Applied Classical Cancellations Card */}
            {matchResult.appliedCancellations && matchResult.appliedCancellations.length > 0 && (
              <div className="p-4 rounded-xl bg-purple-50/90 border border-purple-300 text-purple-950 space-y-2 shadow-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-700 shrink-0" />
                  <h4 className="font-bold text-xs">
                    {isTamil ? "சாஸ்திர தோஷ நிவர்த்தி (Applied Classical Cancellations)" : "Classical Dosha Cancellations Applied (Parihara / Apavada)"}
                  </h4>
                </div>
                <ul className="text-[11px] text-stone-700 list-disc list-inside space-y-1">
                  {matchResult.appliedCancellations.map((c, idx) => (
                    <li key={idx} className="leading-relaxed">
                      <span className="font-semibold text-purple-900">{c.kuta}:</span> {c.reason} ({c.rule})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 8 Kootas Detailed Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {matchResult.kutas.map(kuta => (
                <div key={kuta.name} className="p-3.5 rounded-xl bg-[#FFFDF9] border border-amber-200 space-y-1 shadow-sm">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-900 truncate">{kuta.name.split(" ")[0]}</span>
                    <span className="font-bold text-amber-800">{kuta.score}/{kuta.max}</span>
                  </div>
                  <p className="text-[10px] text-stone-600 truncate">{kuta.name.split("(")[1]?.replace(")", "") || ""}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
