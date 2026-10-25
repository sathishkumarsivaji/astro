import React, { useState, useEffect } from "react";
import {
  Sun,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  ShieldAlert,
  Award,
  Compass,
  Heart,
  Home,
  Car,
  Landmark,
  Briefcase,
  Plane,
  MapPin,
  CalendarDays,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { formatDateInTimezone } from "../../services/astroEngine";
import {
  calculateEnrichedDailyPanchang,
  searchAuspiciousMuhurtas,
  MUHURTA_EVENT_CONFIGS
} from "../../services/panchangEngine";

const DEFAULT_PRESET_CITIES = [
  { id: "chennai", name: "Chennai", nameTa: "சென்னை", lat: 13.0827, lng: 80.2707, tz: 5.5, timezoneId: "Asia/Kolkata" },
  { id: "madurai", name: "Madurai", nameTa: "மதுரை", lat: 9.9252, lng: 78.1198, tz: 5.5, timezoneId: "Asia/Kolkata" },
  { id: "coimbatore", name: "Coimbatore", nameTa: "கோயம்புத்தூர்", lat: 11.0168, lng: 76.9558, tz: 5.5, timezoneId: "Asia/Kolkata" },
  { id: "bengaluru", name: "Bengaluru", nameTa: "பெங்களூரு", lat: 12.9716, lng: 77.5946, tz: 5.5, timezoneId: "Asia/Kolkata" },
  { id: "delhi", name: "New Delhi", nameTa: "புது தில்லி", lat: 28.6139, lng: 77.2090, tz: 5.5, timezoneId: "Asia/Kolkata" },
  { id: "mumbai", name: "Mumbai", nameTa: "மும்பை", lat: 19.0760, lng: 72.8777, tz: 5.5, timezoneId: "Asia/Kolkata" },
  { id: "london", name: "London", nameTa: "லண்டன்", lat: 51.5074, lng: -0.1278, tz: 0, timezoneId: "Europe/London" },
  { id: "newyork", name: "New York", nameTa: "நியூயார்க்", lat: 40.7128, lng: -74.0060, tz: -5, timezoneId: "America/New_York" },
  { id: "singapore", name: "Singapore", nameTa: "சிங்கப்பூர்", lat: 1.3521, lng: 103.8198, tz: 8, timezoneId: "Asia/Singapore" },
  { id: "dubai", name: "Dubai", nameTa: "துபாய்", lat: 25.2048, lng: 55.2708, tz: 4, timezoneId: "Asia/Dubai" }
];

export default function PanchangMuhurta({
  chartData,
  lang = "en",
  onNavigate,
  onSelectPrompt,
  onOpenAsk
}) {
  const isTamil = lang === "ta";

  // Coordinates resolution: natal profile or selectable reference location
  const chartLat = chartData?.profile?.latitude ?? chartData?.latitude ?? null;
  const chartLng = chartData?.profile?.longitude ?? chartData?.longitude ?? null;
  const chartTz = chartData?.profile?.utcOffset ?? chartData?.utcOffset ?? null;
  const chartTzId = chartData?.profile?.timezoneId || chartData?.timezoneId || null;
  const chartPlace = chartData?.profile?.placeOfBirth || chartData?.place || null;

  const hasChartLocation = chartLat !== null && chartLng !== null && chartTz !== null;

  const [activeLocation, setActiveLocation] = useState(() => {
    if (hasChartLocation) {
      return {
        lat: chartLat,
        lng: chartLng,
        tz: chartTz,
        timezoneId: chartTzId,
        label: chartPlace || (isTamil ? "ஜாதக பிறந்த இடம்" : "Birth Chart Location"),
        isBirthLocation: true
      };
    }
    return {
      lat: DEFAULT_PRESET_CITIES[0].lat,
      lng: DEFAULT_PRESET_CITIES[0].lng,
      tz: DEFAULT_PRESET_CITIES[0].tz,
      timezoneId: DEFAULT_PRESET_CITIES[0].timezoneId,
      label: isTamil ? DEFAULT_PRESET_CITIES[0].nameTa : DEFAULT_PRESET_CITIES[0].name,
      isBirthLocation: false
    };
  });

  const [isLocationSelectorOpen, setIsLocationSelectorOpen] = useState(false);
  const [showSubhaHorai, setShowSubhaHorai] = useState(false);
  const [showGowri, setShowGowri] = useState(false);

  // Sync if chart location becomes available later
  useEffect(() => {
    if (hasChartLocation && !activeLocation.isBirthLocation) {
      setActiveLocation({
        lat: chartLat,
        lng: chartLng,
        tz: chartTz,
        timezoneId: chartTzId,
        label: chartPlace || (isTamil ? "ஜாதக பிறந்த இடம்" : "Birth Chart Location"),
        isBirthLocation: true
      });
    }
  }, [chartLat, chartLng, chartTz, chartTzId, chartPlace, hasChartLocation]);

  const activeLat = activeLocation.lat;
  const activeLng = activeLocation.lng;
  const activeTz = activeLocation.tz;
  const activeTzId = activeLocation.timezoneId;

  const todayStr = activeTz !== null
    ? (formatDateInTimezone(new Date(), activeTz, activeTzId) || new Date().toISOString().split("T")[0])
    : new Date().toISOString().split("T")[0];

  const [panchangDateStr, setPanchangDateStr] = useState(todayStr);
  const [selectedEvent, setSelectedEvent] = useState("marriage");
  const [daysAhead, setDaysAhead] = useState(30);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [sortBy, setSortBy] = useState("score");
  const [expandedCardDate, setExpandedCardDate] = useState(null);
  const [muhurtaResults, setMuhurtaResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Quick Date Shift helpers
  const handleShiftDate = (days) => {
    const cur = new Date(panchangDateStr);
    cur.setDate(cur.getDate() + days);
    setPanchangDateStr(cur.toISOString().split("T")[0]);
  };

  const handleSetToday = () => {
    setPanchangDateStr(todayStr);
  };

  // Safe Panchanga Calculation
  let dailyPanchang = null;
  let calculationError = null;
  try {
    dailyPanchang = calculateEnrichedDailyPanchang(panchangDateStr, activeLat, activeLng, activeTz, activeTzId);
  } catch (err) {
    console.error("Panchang Calculation Error:", err);
    calculationError = err.message || "Failed to calculate Panchanga for specified date & coordinates.";
  }

  // Find Muhurta with PROPER horizon time limits and event-specific rules
  const handleFindMuhurta = (targetDays = daysAhead, targetEvent = selectedEvent) => {
    setIsCalculating(true);
    try {
      const startDate = panchangDateStr;
      const results = searchAuspiciousMuhurtas(
        targetEvent,
        startDate,
        targetDays,
        activeLat,
        activeLng,
        activeTz,
        activeTzId
      );
      setMuhurtaResults(results);
    } catch (e) {
      console.error("Muhurta Search Error:", e);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSelectEvent = (eventId) => {
    setSelectedEvent(eventId);
    setSelectedMonth("all");
    handleFindMuhurta(daysAhead, eventId);
  };

  const handleSelectHorizon = (d) => {
    setDaysAhead(d);
    setSelectedMonth("all");
    handleFindMuhurta(d, selectedEvent);
  };

  const EVENT_OPTIONS = [
    {
      id: "marriage",
      label: isTamil ? MUHURTA_EVENT_CONFIGS.marriage.nameTa : MUHURTA_EVENT_CONFIGS.marriage.nameEn,
      icon: Heart,
      desc: isTamil ? MUHURTA_EVENT_CONFIGS.marriage.descTa : MUHURTA_EVENT_CONFIGS.marriage.descEn
    },
    {
      id: "griha_pravesh",
      label: isTamil ? MUHURTA_EVENT_CONFIGS.griha_pravesh.nameTa : MUHURTA_EVENT_CONFIGS.griha_pravesh.nameEn,
      icon: Home,
      desc: isTamil ? MUHURTA_EVENT_CONFIGS.griha_pravesh.descTa : MUHURTA_EVENT_CONFIGS.griha_pravesh.descEn
    },
    {
      id: "vehicle",
      label: isTamil ? MUHURTA_EVENT_CONFIGS.vehicle.nameTa : MUHURTA_EVENT_CONFIGS.vehicle.nameEn,
      icon: Car,
      desc: isTamil ? MUHURTA_EVENT_CONFIGS.vehicle.descTa : MUHURTA_EVENT_CONFIGS.vehicle.descEn
    },
    {
      id: "property",
      label: isTamil ? MUHURTA_EVENT_CONFIGS.property.nameTa : MUHURTA_EVENT_CONFIGS.property.nameEn,
      icon: Landmark,
      desc: isTamil ? MUHURTA_EVENT_CONFIGS.property.descTa : MUHURTA_EVENT_CONFIGS.property.descEn
    },
    {
      id: "business",
      label: isTamil ? MUHURTA_EVENT_CONFIGS.business.nameTa : MUHURTA_EVENT_CONFIGS.business.nameEn,
      icon: Briefcase,
      desc: isTamil ? MUHURTA_EVENT_CONFIGS.business.descTa : MUHURTA_EVENT_CONFIGS.business.descEn
    },
    {
      id: "travel",
      label: isTamil ? MUHURTA_EVENT_CONFIGS.travel.nameTa : MUHURTA_EVENT_CONFIGS.travel.nameEn,
      icon: Plane,
      desc: isTamil ? MUHURTA_EVENT_CONFIGS.travel.descTa : MUHURTA_EVENT_CONFIGS.travel.descEn
    }
  ];

  // Candidates filtered by month and sorted by user choice
  const rawCandidates = muhurtaResults?.topScreenedDates || [];
  const filteredCandidates = selectedMonth === "all"
    ? rawCandidates
    : rawCandidates.filter((c) => c.monthKey === selectedMonth);

  const candidateList = [...filteredCandidates].sort((a, b) => {
    if (sortBy === "date") return a.date.localeCompare(b.date);
    return b.muhurtaScore - a.muhurtaScore;
  });

  const handleSelectCityPreset = (city) => {
    setActiveLocation({
      lat: city.lat,
      lng: city.lng,
      tz: city.tz,
      timezoneId: city.timezoneId,
      label: isTamil ? city.nameTa : city.name,
      isBirthLocation: false
    });
    setIsLocationSelectorOpen(false);
  };

  const handleSelectBirthLocation = () => {
    if (hasChartLocation) {
      setActiveLocation({
        lat: chartLat,
        lng: chartLng,
        tz: chartTz,
        timezoneId: chartTzId,
        label: chartPlace || (isTamil ? "ஜாதக பிறந்த இடம்" : "Birth Chart Location"),
        isBirthLocation: true
      });
      setIsLocationSelectorOpen(false);
    } else if (onNavigate) {
      onNavigate("home");
    }
  };

  // Inspect Panchang for a candidate date
  const handleInspectCandidatePanchang = (date) => {
    setPanchangDateStr(date);
    const topEl = document.getElementById("daily-panchang-top");
    if (topEl) {
      topEl.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Ask AI about this candidate date
  const handleAskAboutCandidateDate = (candidate) => {
    const eventNameTa = selectedEvent === "marriage" ? "திருமணத்திற்கு"
      : selectedEvent === "griha_pravesh" ? "கிரகப்பிரவேசத்திற்கு"
      : selectedEvent === "vehicle" ? "வாகனம் வாங்குவதற்கு"
      : selectedEvent === "property" ? "பூமி / மனை கிரயம் செய்வதற்கு"
      : selectedEvent === "business" ? "தொழில் தொடங்குவதற்கு"
      : "சுப பிரயாணத்திற்கு";

    const eventNameEn = selectedEvent === "marriage" ? "marriage"
      : selectedEvent === "griha_pravesh" ? "housewarming (Griha Pravesham)"
      : selectedEvent === "vehicle" ? "vehicle purchase (Vahana)"
      : selectedEvent === "property" ? "property purchase (Bhumi)"
      : selectedEvent === "business" ? "business launch (Vyapar)"
      : "travel (Yatra)";

    const qText = isTamil
      ? `${candidate.date} (${candidate.dayTamil || candidate.day}) அன்று எனது ${eventNameTa} உகந்த நாளா? நட்சத்திரம்: ${candidate.nakshatraTamil}, திதி: ${candidate.tithiTamil}. விரிவான பஞ்சாங்க விளக்கம் தருக.`
      : `Is ${candidate.date} (${candidate.day}) favorable for my ${eventNameEn} based on my chart and Panchanga factors? (Nakshatra: ${candidate.nakshatra}, Tithi: ${candidate.tithi})`;

    if (onSelectPrompt) {
      onSelectPrompt(qText);
      if (onNavigate) onNavigate("ask");
    } else if (onOpenAsk) {
      onOpenAsk();
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner Navigation & Quick Links */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-amber-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-stone-900 block">
              {isTamil ? "பஞ்சாங்கம் & முகூர்த்த வழிகாட்டி" : "Vedic Panchanga & Muhurta Explorer"}
            </span>
            <span className="text-[11px] text-stone-500">
              {isTamil ? "சூரிய உதய அடிப்படையிலான வானியல் கணிப்புகள்" : "Sunrise-anchored high-precision astronomical ephemeris"}
            </span>
          </div>
        </div>

        {/* Quick External Links / Inter-tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {onNavigate && (
            <>
              <button
                onClick={() => onNavigate("timeline", "calendar")}
                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold border border-amber-200 flex items-center gap-1.5 transition-all cursor-pointer"
                title="View in Transit Calendar"
              >
                <CalendarDays className="w-3.5 h-3.5 text-amber-700" />
                <span>{isTamil ? "மாத காலண்டர்" : "Transit Calendar"}</span>
              </button>

              <button
                onClick={() => onNavigate("chart")}
                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold border border-amber-200 flex items-center gap-1.5 transition-all cursor-pointer"
                title="View Birth Chart"
              >
                <Compass className="w-3.5 h-3.5 text-amber-700" />
                <span>{isTamil ? "என் ஜாதகம்" : "Birth Kundli"}</span>
              </button>
            </>
          )}

          {(onOpenAsk || onSelectPrompt) && (
            <button
              onClick={() => {
                const prompt = isTamil
                  ? `இன்றைய பஞ்சாங்க நிலைகள் (${dailyPanchang?.varaName}, ${dailyPanchang?.tithi?.nameTamil}, ${dailyPanchang?.nakshatra?.tamil}) அடிப்படையில் இன்றைய தினத்தின் சுப நேரங்களை விளக்குங்கள்.`
                  : `Explain today's Panchanga elements (${dailyPanchang?.varaName}, ${dailyPanchang?.tithi?.name}, ${dailyPanchang?.nakshatra?.name}) and favorable windows for key activities.`;
                if (onSelectPrompt) {
                  onSelectPrompt(prompt);
                  if (onNavigate) onNavigate("ask");
                } else if (onOpenAsk) {
                  onOpenAsk();
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold flex items-center gap-1.5 shadow-xs hover:brightness-105 transition-all cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{isTamil ? "AI வழிகாட்டல்" : "Ask SKR ASTRO"}</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. Daily Panchang Header Banner */}
      <div id="daily-panchang-top" className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-amber-500/15 via-[#FFFDF9] to-orange-500/10 border border-amber-300/80 shadow-md space-y-6">
        {/* Top Control Bar: Title, Location Selector & Date Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-amber-200/80 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
              <Sun className="w-3.5 h-3.5 text-amber-600" />
              <span>{isTamil ? "தினசரி பஞ்சாங்கம் & சுப நேரங்கள்" : "Daily Vedic Panchanga & Timings"}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
              {isTamil ? "சூரிய உதய அடிப்படையிலான பஞ்சாங்க கணிப்புகள்" : "Sunrise-Anchored Panchanga & Muhurta"}
            </h2>

            {/* Active Location Display & Switcher Trigger */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-stone-600">
              <span className="flex items-center gap-1 font-semibold text-stone-800">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>{isTamil ? "கணிக்கப்படும் இடம்:" : "Location:"}</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white text-stone-900 font-bold border border-amber-300 shadow-2xs">
                {activeLocation.label} ({activeLat.toFixed(2)}°N, {activeLng.toFixed(2)}°E, UTC {activeTz >= 0 ? `+${activeTz}` : activeTz})
              </span>
              <button
                onClick={() => setIsLocationSelectorOpen(!isLocationSelectorOpen)}
                className="text-amber-800 hover:text-amber-950 font-bold underline ml-1 cursor-pointer"
              >
                {isTamil ? "மாற்றுக" : "Change City"}
              </button>
            </div>
          </div>

          {/* Date Picker & Quick Shift Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleShiftDate(-1)}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-amber-100 border border-amber-300 text-xs font-bold text-stone-800 shadow-2xs transition-all cursor-pointer"
              title="Previous Day"
            >
              ← {isTamil ? "நேற்று" : "Yesterday"}
            </button>

            <button
              onClick={handleSetToday}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold shadow-2xs transition-all cursor-pointer ${
                panchangDateStr === todayStr
                  ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                  : "bg-white hover:bg-amber-100 border-amber-300 text-stone-800"
              }`}
            >
              {isTamil ? "இன்று" : "Today"}
            </button>

            <button
              onClick={() => handleShiftDate(1)}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-amber-100 border border-amber-300 text-xs font-bold text-stone-800 shadow-2xs transition-all cursor-pointer"
              title="Next Day"
            >
              {isTamil ? "நாளை" : "Tomorrow"} →
            </button>

            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-amber-300 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <input
                type="date"
                value={panchangDateStr}
                onChange={(e) => setPanchangDateStr(e.target.value)}
                className="text-xs font-bold bg-transparent text-stone-900 focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Location Dropdown / Drawer */}
        {isLocationSelectorOpen && (
          <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-600" />
                <span>{isTamil ? "பஞ்சாங்க கணக்கீட்டு நகரத்தைத் தேர்வு செய்யவும்" : "Select Reference City for Daily Timings"}</span>
              </span>
              <button
                onClick={() => setIsLocationSelectorOpen(false)}
                className="text-stone-400 hover:text-stone-800 text-xs font-bold cursor-pointer"
              >
                ✕ {isTamil ? "மூடுக" : "Close"}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {hasChartLocation ? (
                <button
                  onClick={handleSelectBirthLocation}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    activeLocation.isBirthLocation
                      ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                      : "bg-white text-amber-900 border-amber-300 hover:bg-amber-100"
                  }`}
                >
                  ★ {isTamil ? "ஜாதக பிறந்த இடம்" : "Birth Chart Location"} ({chartPlace || "Natal"})
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (onNavigate) onNavigate("home");
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100/80 text-amber-950 border border-amber-300 hover:bg-amber-200 flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5 text-amber-700" />
                  <span>{isTamil ? "ஜாதக கணிப்பிற்குச் செல்லவும்" : "Enter Birth Details in Chart Form"} →</span>
                </button>
              )}

              {DEFAULT_PRESET_CITIES.map((c) => {
                const isSelected = !activeLocation.isBirthLocation && activeLocation.label === (isTamil ? c.nameTa : c.name);
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCityPreset(c)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                        : "bg-white text-stone-800 border-amber-200 hover:bg-amber-100"
                    }`}
                  >
                    {isTamil ? c.nameTa : c.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Calculation Error Handler */}
        {calculationError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs space-y-1">
            <strong>{isTamil ? "கணிப்பு பிழை:" : "Calculation Error:"}</strong>
            <p>{calculationError}</p>
          </div>
        )}

        {/* 5 Angas Grid with Exact Time Limits */}
        {dailyPanchang && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-600" />
                <span>{isTamil ? "பஞ்சாங்கத்தின் 5 அங்கங்கள் & நேர வரம்புகள்" : "The 5 Sacred Panchanga Elements & Exact Transition Limits"}</span>
              </h3>
              <span className="text-[11px] text-stone-500 font-medium">
                {dailyPanchang.date} • {dailyPanchang.varaName}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {/* 1. VARA */}
              <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-xs hover:border-amber-400 transition-all space-y-1.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-stone-500 uppercase font-extrabold tracking-wider">
                      {isTamil ? "1. வாரம் (Vara)" : "1. Vara (Day)"}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
                      {dailyPanchang.vara?.ruler || dailyPanchang.varaLord} Lord
                    </span>
                  </div>
                  <strong className="text-base font-serif font-bold text-stone-900 block mt-1">
                    {isTamil ? (dailyPanchang.vara?.tamil || dailyPanchang.varaName) : dailyPanchang.varaName}
                  </strong>
                </div>
                <div className="pt-2 border-t border-amber-100 text-[11px] text-stone-600">
                  <span>{isTamil ? "பகல் நேரம்:" : "Day Span:"} </span>
                  <strong className="text-stone-900">{dailyPanchang.dayDurationHours} hrs</strong>
                </div>
              </div>

              {/* 2. TITHI */}
              <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-xs hover:border-amber-400 transition-all space-y-1.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-stone-500 uppercase font-extrabold tracking-wider">
                      {isTamil ? "2. திதி (Tithi)" : "2. Tithi (Lunar Day)"}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold">
                      {dailyPanchang.tithi?.paksha}
                    </span>
                  </div>
                  <strong className="text-base font-serif font-bold text-stone-900 block mt-1">
                    {isTamil ? (dailyPanchang.tithi?.nameTamil || dailyPanchang.tithi?.name) : dailyPanchang.tithi?.name}
                  </strong>
                </div>

                <div className="pt-2 border-t border-amber-100 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-stone-500 font-medium">{isTamil ? "நேர வரம்பு:" : "Time Limit:"}</span>
                    <strong className="text-purple-900 font-mono">
                      {isTamil ? dailyPanchang.tithi?.untilDetailedTa : dailyPanchang.tithi?.untilDetailedEn}
                    </strong>
                  </div>
                  {dailyPanchang.tithi?.nextTithi && (
                    <div className="text-[10px] text-stone-500 truncate">
                      {isTamil ? "பின்பு: " : "Next: "}
                      <span className="font-semibold text-stone-800">
                        {isTamil ? dailyPanchang.tithi?.nextTithiTamil : dailyPanchang.tithi?.nextTithi}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. NAKSHATRA */}
              <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-xs hover:border-amber-400 transition-all space-y-1.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-stone-500 uppercase font-extrabold tracking-wider">
                      {isTamil ? "3. நட்சத்திரம் (Nakshatra)" : "3. Nakshatra"}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold">
                      Pada {dailyPanchang.nakshatra?.pada}
                    </span>
                  </div>
                  <strong className="text-base font-serif font-bold text-stone-900 block mt-1 text-purple-900">
                    {isTamil ? (dailyPanchang.nakshatra?.tamil || dailyPanchang.nakshatra?.name) : dailyPanchang.nakshatra?.name}
                  </strong>
                </div>

                <div className="pt-2 border-t border-amber-100 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-stone-500 font-medium">{isTamil ? "நேர வரம்பு:" : "Time Limit:"}</span>
                    <strong className="text-emerald-800 font-mono">
                      {isTamil ? dailyPanchang.nakshatra?.untilDetailedTa : dailyPanchang.nakshatra?.untilDetailedEn}
                    </strong>
                  </div>
                  {dailyPanchang.nakshatra?.nextNakshatra && (
                    <div className="text-[10px] text-stone-500 truncate">
                      {isTamil ? "பின்பு: " : "Next: "}
                      <span className="font-semibold text-stone-800">
                        {isTamil ? dailyPanchang.nakshatra?.nextNakshatraTamil : dailyPanchang.nakshatra?.nextNakshatra}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. YOGA */}
              <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-xs hover:border-amber-400 transition-all space-y-1.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-stone-500 uppercase font-extrabold tracking-wider">
                      {isTamil ? "4. யோகம் (Yoga)" : "4. Yoga"}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      dailyPanchang.yoga?.isAuspicious ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900"
                    }`}>
                      {dailyPanchang.yoga?.isAuspicious ? (isTamil ? "சுபம்" : "Shubha") : (isTamil ? "அசுபம்" : "Ashubha")}
                    </span>
                  </div>
                  <strong className="text-base font-serif font-bold text-stone-900 block mt-1">
                    {dailyPanchang.yoga?.name}
                  </strong>
                </div>

                <div className="pt-2 border-t border-amber-100 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-stone-500 font-medium">{isTamil ? "நேர வரம்பு:" : "Time Limit:"}</span>
                    <strong className="text-stone-900 font-mono">
                      {isTamil ? dailyPanchang.yoga?.untilDetailedTa : dailyPanchang.yoga?.untilDetailedEn}
                    </strong>
                  </div>
                  {dailyPanchang.yoga?.nextYoga && (
                    <div className="text-[10px] text-stone-500 truncate">
                      {isTamil ? "பின்பு: " : "Next: "}
                      <span className="font-semibold text-stone-800">{dailyPanchang.yoga.nextYoga}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. KARANA */}
              <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-xs hover:border-amber-400 transition-all space-y-1.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-stone-500 uppercase font-extrabold tracking-wider">
                      {isTamil ? "5. கரணம் (Karana)" : "5. Karana"}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      dailyPanchang.karana?.isBhadra ? "bg-rose-100 text-rose-900" : "bg-blue-100 text-blue-900"
                    }`}>
                      {dailyPanchang.karana?.isBhadra ? (isTamil ? "விஷ்டி / பத்ரா" : "Bhadra") : (isTamil ? "சுப கரணம்" : "Benefic")}
                    </span>
                  </div>
                  <strong className="text-base font-serif font-bold text-stone-900 block mt-1">
                    {dailyPanchang.karana?.name}
                  </strong>
                </div>

                <div className="pt-2 border-t border-amber-100 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-stone-500 font-medium">{isTamil ? "நேர வரம்பு:" : "Time Limit:"}</span>
                    <strong className="text-stone-900 font-mono">
                      {isTamil ? dailyPanchang.karana?.untilDetailedTa : dailyPanchang.karana?.untilDetailedEn}
                    </strong>
                  </div>
                  {dailyPanchang.karana?.nextKarana && (
                    <div className="text-[10px] text-stone-500 truncate">
                      {isTamil ? "பின்பு: " : "Next: "}
                      <span className="font-semibold text-stone-800">{dailyPanchang.karana.nextKarana}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Timings Matrix: Auspicious & Inauspicious Muhurtas with 12h/24h precision */}
            <div className="pt-2 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* A. Auspicious Timings Card */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>{isTamil ? "சுப நேரங்கள் (Auspicious Muhurtas)" : "Auspicious Timings (Shubha Kalams)"}</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
                      {isTamil ? "நற்காரியங்களுக்கு உகந்தது" : "Recommended for Beginnings"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white border border-emerald-100">
                      <span className="text-[10px] text-stone-500 uppercase block font-semibold">
                        {isTamil ? "அபிஜித் முகூர்த்தம்:" : "Abhijit Muhurta:"}
                      </span>
                      <strong className="text-emerald-900 font-mono text-xs block mt-0.5">
                        {dailyPanchang.abhijitMuhurta12 || dailyPanchang.abhijitMuhurta}
                      </strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-emerald-100">
                      <span className="text-[10px] text-stone-500 uppercase block font-semibold">
                        {isTamil ? "பிரம்ம முகூர்த்தம்:" : "Brahma Muhurta:"}
                      </span>
                      <strong className="text-emerald-900 font-mono text-xs block mt-0.5">
                        {dailyPanchang.brahmaMuhurta12 || dailyPanchang.brahmaMuhurta}
                      </strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-emerald-100">
                      <span className="text-[10px] text-stone-500 uppercase block font-semibold">
                        {isTamil ? "அமிர்த காலம்:" : "Amrita Kalam:"}
                      </span>
                      <strong className="text-emerald-900 font-mono text-xs block mt-0.5">
                        {dailyPanchang.amritaKalam12 || dailyPanchang.amritaKalam || "—"}
                      </strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-emerald-100">
                      <span className="text-[10px] text-stone-500 uppercase block font-semibold">
                        {isTamil ? "சூரிய உதயம் / அஸ்தமனம்:" : "Sunrise / Sunset:"}
                      </span>
                      <strong className="text-stone-900 font-mono text-xs block mt-0.5">
                        {dailyPanchang.sunrise} – {dailyPanchang.sunset}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* B. Inauspicious Caution Timings Card */}
                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-rose-200/60 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-950 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      <span>{isTamil ? "அசுப நேரங்கள் (விலக்க வேண்டியவை)" : "Caution Periods (Ashubha Kalams)"}</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 font-bold border border-rose-300">
                      {isTamil ? "தவிர்க்கவும்" : "Avoid for Important Deals"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white border border-rose-100">
                      <span className="text-[10px] text-stone-500 uppercase block font-semibold">
                        {isTamil ? "இராகு காலம்:" : "Rahu Kalam:"}
                      </span>
                      <strong className="text-rose-900 font-mono text-xs block mt-0.5">
                        {dailyPanchang.rahuKalam12 || dailyPanchang.rahuKalam}
                      </strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-rose-100">
                      <span className="text-[10px] text-stone-500 uppercase block font-semibold">
                        {isTamil ? "எமகண்டம்:" : "Yamagandam:"}
                      </span>
                      <strong className="text-orange-900 font-mono text-xs block mt-0.5">
                        {dailyPanchang.yamagandam12 || dailyPanchang.yamagandam}
                      </strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-rose-100">
                      <span className="text-[10px] text-stone-500 uppercase block font-semibold">
                        {isTamil ? "குளிகை காலம்:" : "Gulika Kalam:"}
                      </span>
                      <strong className="text-stone-800 font-mono text-xs block mt-0.5">
                        {dailyPanchang.gulikaKalam12 || dailyPanchang.gulikaKalam}
                      </strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-rose-100">
                      <span className="text-[10px] text-stone-500 uppercase block font-semibold">
                        {isTamil ? "துர்முகூர்த்தம்:" : "Durmuhurtham:"}
                      </span>
                      <strong className="text-rose-900 font-mono text-xs block mt-0.5">
                        {dailyPanchang.durmuhurtham12 || dailyPanchang.durmuhurtham || "—"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subha Horai & Gowri Panchangam Interactive Accordions */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSubhaHorai(!showSubhaHorai)}
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    showSubhaHorai
                      ? "bg-amber-600 text-white border-amber-600"
                      : "bg-white text-stone-800 border-amber-300 hover:bg-amber-100"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{isTamil ? "24 சுப ஹோரை அட்டவணை" : "24 Planetary Horas Table"}</span>
                  {showSubhaHorai ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => setShowGowri(!showGowri)}
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    showGowri
                      ? "bg-amber-600 text-white border-amber-600"
                      : "bg-white text-stone-800 border-amber-300 hover:bg-amber-100"
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>{isTamil ? "கௌரி பஞ்சாங்கம் (பகல் 8 பாகம்)" : "Tamil Gowri Panchangam"}</span>
                  {showGowri ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Subha Horai Table Container */}
              {showSubhaHorai && dailyPanchang.horas && dailyPanchang.horas.length > 0 && (
                <div className="p-4 rounded-2xl bg-white border border-amber-200 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                    <span className="text-xs font-bold text-stone-900 uppercase">
                      {isTamil ? "24 மணி நேர கிரக ஹோரை காலங்கள் (சூரிய உதயம் முதல்)" : "24 Planetary Horas (From Local Sunrise)"}
                    </span>
                    <span className="text-[10px] text-stone-500">
                      {isTamil ? "குரு, சுக்கிரன், புதன், வளர்பிறை சந்திரன் ஹோரைகள் மிக நன்று" : "Jupiter, Venus, Mercury & Moon horas are most auspicious"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
                    {dailyPanchang.horas.map((h, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                          h.isShubha
                            ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                            : "bg-stone-50 border-stone-200 text-stone-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">{isTamil ? h.planetTamil : h.planet}</span>
                          <span className="text-[9px] font-mono px-1 rounded bg-white/70">
                            H{h.hour}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono mt-1 block">
                          {h.time12 || h.time24}
                        </span>
                        <span className={`text-[9px] font-bold block mt-0.5 ${h.isShubha ? "text-emerald-700" : "text-stone-500"}`}>
                          {isTamil ? h.natureTamil : h.nature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gowri Panchangam Table Container */}
              {showGowri && dailyPanchang.gowriPanchangam && dailyPanchang.gowriPanchangam.length > 0 && (
                <div className="p-4 rounded-2xl bg-white border border-amber-200 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                    <span className="text-xs font-bold text-stone-900 uppercase">
                      {isTamil ? "இன்றைய பகல் கௌரி பஞ்சாங்கம் (8 சம பிரிவுகள்)" : "Daytime Gowri Panchangam (8 Equal Daytime Segments)"}
                    </span>
                    <span className="text-[10px] text-stone-500">
                      {isTamil ? "அமிர்தம், சோபனம், லாபம், தனம் நன்று" : "Amirdham, Sobanam, Labham, Dhanam are auspicious"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {dailyPanchang.gowriPanchangam.map((g, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                          g.isAuspicious
                            ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                            : "bg-rose-50/60 border-rose-200 text-rose-900"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">{isTamil ? g.nameTamil : g.name}</span>
                          <span className="text-[9px] font-mono px-1 rounded bg-white/70">
                            Part {g.part}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono mt-1 block">
                          {g.time12 || g.time24}
                        </span>
                        <span className={`text-[9px] font-bold block mt-0.5 ${g.isAuspicious ? "text-emerald-700" : "text-rose-700"}`}>
                          {g.nature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Dedicated Event Muhurta Finder with Functional Horizon Limits */}
      <div className="p-6 md:p-8 rounded-3xl bg-white border border-amber-300 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-200 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-bold uppercase tracking-wider shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{isTamil ? "சுப தினங்கள் கணிப்பான்" : "Preliminary Panchanga-Based Date Screening"}</span>
            </div>
            <h3 className="text-xl font-serif font-bold text-stone-900 mt-1">
              {isTamil ? "சுப முகூர்த்த தேதிகள் தேடல்" : "Auspicious Date Screening & Muhurta Explorer"}
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              {isTamil 
                ? "குறிப்பு: இது பஞ்சாங்க சுத்தியை அடிப்படையாகக் கொண்ட ஆரம்ப தின தேர்வாகும். குறிப்பிட்ட ஜாதகருக்கான இறுதி முகூர்த்த நிர்ணயத்திற்கு லக்ன சுத்தி, தாராபலம் மற்றும் சந்திரபலம் கணிக்கப்பட வேண்டும்."
                : "Note: This provides preliminary calendar-level date screening (Panchanga Shuddhi). Final electional Muhurta requires computing the event Lagna, Bhava Shuddhi, and individual Tarabala/Chandrabala."}
            </p>
          </div>
        </div>

        {/* Event Selector Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {EVENT_OPTIONS.map((ev) => {
            const Icon = ev.icon;
            const isSelected = selectedEvent === ev.id;
            return (
              <button
                key={ev.id}
                type="button"
                onClick={() => handleSelectEvent(ev.id)}
                className={`p-4 rounded-2xl border text-left transition-all space-y-1.5 cursor-pointer ${
                  isSelected
                    ? "bg-amber-50 border-2 border-amber-500 shadow-md ring-2 ring-amber-300/40"
                    : "bg-white border-stone-200 hover:border-amber-300 hover:bg-stone-50/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isSelected ? "text-amber-600" : "text-stone-500"}`} />
                    <span className="text-xs font-bold text-stone-900">{ev.label}</span>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                </div>
                <p className="text-[11px] text-stone-500 leading-snug">{ev.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Horizon Range and Calculate Action (TIME LIMITS PROPERLY WIRED) */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>{isTamil ? "தேடல் கால அளவு (Time Horizon):" : "Search Horizon (Time Limit):"}</span>
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {[14, 30, 60, 90, 180].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleSelectHorizon(d)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    daysAhead === d
                      ? "bg-amber-600 text-white shadow-sm ring-2 ring-amber-300/50"
                      : "bg-white text-stone-700 border border-amber-200 hover:bg-amber-100/60"
                  }`}
                >
                  {d} {isTamil ? "நாட்கள்" : "Days"}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleFindMuhurta(daysAhead, selectedEvent)}
            disabled={isCalculating}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white font-bold text-xs shadow-md shadow-amber-500/25 hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>
              {isCalculating
                ? (isTamil ? "கணிக்கிறது..." : "Screening Dates...")
                : (isTamil ? `அடுத்த ${daysAhead} நாட்களில் சுப தேதிகளைக் கண்டறி` : `Find Auspicious Dates (${daysAhead} Days)`)}
            </span>
          </button>
        </div>

        {/* Muhurta Candidates Result List with Active Action Links */}
        {muhurtaResults && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>
                    {isTamil
                      ? `கண்டறியப்பட்ட சுப தேதிகள் (${candidateList.length} தேதிகள், அடுத்த ${daysAhead} நாட்களில்)`
                      : `Ranked Auspicious Dates (${candidateList.length} screened dates across ${daysAhead} days)`}
                  </span>
                </h4>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  {isTamil
                    ? `ஆய்வு செய்யப்பட்ட காலம்: ${muhurtaResults.startDate} முதல் ${muhurtaResults.endDate} வரை (${muhurtaResults.totalDatesEvaluated} தினங்கள்)`
                    : `Screening horizon: ${muhurtaResults.startDate} to ${muhurtaResults.endDate} (${muhurtaResults.totalDatesEvaluated} days evaluated)`}
                </p>
              </div>

              {/* Sort By Controls */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto bg-stone-100 p-1 rounded-xl text-xs">
                <span className="text-[10px] text-stone-500 px-1 font-semibold">{isTamil ? "வரிசை:" : "Sort:"}</span>
                <button
                  type="button"
                  onClick={() => setSortBy("score")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    sortBy === "score" ? "bg-white text-amber-900 shadow-2xs" : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  {isTamil ? "அதிக சுப மதிப்பெண்" : "Highest Rated"}
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy("date")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    sortBy === "date" ? "bg-white text-amber-900 shadow-2xs" : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  {isTamil ? "தேதி வாரியாக" : "By Date"}
                </button>
              </div>
            </div>

            {/* Month Filter Bar for 60, 90, 180 Days Horizons */}
            {muhurtaResults.months && muhurtaResults.months.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-2xl bg-amber-50/50 border border-amber-200">
                <span className="text-[11px] font-bold text-amber-950 flex items-center gap-1 mr-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-700" />
                  <span>{isTamil ? "மாதம் வாரியாக வடிகட்டுக:" : "Filter by Month:"}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedMonth("all")}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedMonth === "all"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "bg-white text-stone-700 border border-amber-200 hover:bg-amber-100/60"
                  }`}
                >
                  {isTamil ? "அனைத்து மாதங்கள்" : "All Months"} ({rawCandidates.length})
                </button>
                {muhurtaResults.months.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setSelectedMonth(m.key)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedMonth === m.key
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-white text-stone-700 border border-amber-200 hover:bg-amber-100/60"
                    }`}
                  >
                    {isTamil ? m.labelTa : m.labelEn} ({m.count})
                  </button>
                ))}
              </div>
            )}

            {candidateList.length === 0 ? (
              <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 text-center text-xs text-stone-600 space-y-2">
                <p>
                  {isTamil
                    ? "தேர்ந்தெடுக்கப்பட்ட காலக்கட்டத்தில் உகந்த சுப தினங்கள் அமையவில்லை. தயவுசெய்து கால அளவை (60/90/180 நாட்கள்) அதிகரிக்கவும்."
                    : "No dates scored in the favorable tier during preliminary screening within this date range. Try expanding the search horizon (60, 90, or 180 Days)."}
                </p>
                <div className="flex justify-center gap-2 pt-1">
                  {[60, 90, 180].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleSelectHorizon(d)}
                      className="px-3 py-1 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold hover:bg-amber-200 cursor-pointer"
                    >
                      {d} {isTamil ? "நாட்கள் தேடு" : "Days"}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {candidateList.map((m, idx) => {
                  const isExpanded = expandedCardDate === m.date;
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white border border-amber-200 hover:border-amber-400 transition-all shadow-sm space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        {/* Header: Date, Weekday, Score Badge */}
                        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                          <div>
                            <span className="text-xs font-bold text-stone-900 block">{m.date}</span>
                            <span className="text-[10px] text-amber-700 font-semibold">
                              {isTamil ? (m.dayTamil || m.day) : m.day} &bull; {isTamil ? m.monthLabelTa : m.monthLabelEn}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              m.muhurtaScore >= 85
                                ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                                : m.muhurtaScore >= 70
                                  ? "bg-amber-100 text-amber-900 border-amber-300"
                                  : "bg-stone-100 text-stone-800 border-stone-300"
                            }`}>
                              Score: {m.muhurtaScore}
                            </span>
                          </div>
                        </div>

                        {/* Core Panchanga Factors */}
                        <div className="space-y-1.5 text-xs text-stone-600">
                          <div className="flex justify-between">
                            <span className="text-stone-500">{isTamil ? "திதி:" : "Tithi:"}</span>
                            <strong className="text-stone-900 text-right">
                              {isTamil ? (m.tithiTamil || m.tithi) : m.tithi}
                              {m.tithiUntil12 && <span className="text-[10px] text-purple-700 block font-mono">until {m.tithiUntil12}</span>}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-stone-500">{isTamil ? "நட்சத்திரம்:" : "Nakshatra:"}</span>
                            <strong className="text-purple-800 text-right">
                              {isTamil ? (m.nakshatraTamil || m.nakshatra) : m.nakshatra}
                              {m.nakshatraUntil12 && <span className="text-[10px] text-stone-500 block font-mono">until {m.nakshatraUntil12}</span>}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-stone-500">{isTamil ? "யோகம் / கரணம்:" : "Yoga / Karana:"}</span>
                            <strong className="text-stone-800 text-right font-medium">
                              {m.yoga} &bull; {m.karana}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-stone-500">{isTamil ? "அபிஜித் முகூர்த்தம்:" : "Abhijit:"}</span>
                            <strong className="text-emerald-700 font-mono">{m.abhijitMuhurta12 || "—"}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-stone-500">{isTamil ? "இராகு காலம்:" : "Rahu Kalam:"}</span>
                            <strong className="text-rose-700 font-mono">{m.rahuKalam12 || "—"}</strong>
                          </div>
                        </div>

                        {/* Event Recommendation Banner */}
                        <div className="text-[11px] p-2 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 font-medium">
                          {isTamil ? m.recommendationTa : m.recommendationEn}
                        </div>

                        {/* Expand Details Accordion Button */}
                        <button
                          type="button"
                          onClick={() => setExpandedCardDate(isExpanded ? null : m.date)}
                          className="w-full py-1 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200 text-[10px] font-bold text-stone-600 flex items-center justify-center gap-1 transition-all cursor-pointer"
                        >
                          <span>{isExpanded ? (isTamil ? "விவரங்களை மறைக்க" : "Hide Factors") : (isTamil ? "சுப & எச்சரிக்கை காரணிகள்" : "View Planetary Factors")}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        {/* Expanded Factor Details */}
                        {isExpanded && (
                          <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2 text-[10px] animate-fadeIn">
                            {/* Positive Factors */}
                            {m.positiveFactors && m.positiveFactors.length > 0 && (
                              <div className="space-y-1">
                                <span className="font-bold text-emerald-800 uppercase block">
                                  ✓ {isTamil ? "சுப சாதக காரணங்கள்:" : "Favorable Factors:"}
                                </span>
                                {(isTamil && m.positiveFactorsTa ? m.positiveFactorsTa : m.positiveFactors).map((f, fIdx) => (
                                  <div key={fIdx} className="text-emerald-900 pl-2 border-l-2 border-emerald-400">
                                    {f}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Cautionary Factors */}
                            {m.negativeFactors && m.negativeFactors.length > 0 && (
                              <div className="space-y-1 pt-1 border-t border-stone-200">
                                <span className="font-bold text-rose-800 uppercase block">
                                  ⚠ {isTamil ? "எச்சரிக்கை அம்சங்கள்:" : "Cautionary Aspects:"}
                                </span>
                                {(isTamil && m.negativeFactorsTa ? m.negativeFactorsTa : m.negativeFactors).map((f, fIdx) => (
                                  <div key={fIdx} className="text-rose-900 pl-2 border-l-2 border-rose-400">
                                    {f}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Timing Windows Matrix */}
                            <div className="pt-1 border-t border-stone-200 space-y-0.5 font-mono text-[9.5px]">
                              {m.amritaKalam12 && (
                                <div className="text-emerald-800 flex justify-between">
                                  <span>{isTamil ? "அமிர்த காலம்:" : "Amrita Kalam:"}</span>
                                  <span>{m.amritaKalam12}</span>
                                </div>
                              )}
                              {m.yamagandam12 && (
                                <div className="text-orange-900 flex justify-between">
                                  <span>{isTamil ? "எமகண்டம்:" : "Yamagandam:"}</span>
                                  <span>{m.yamagandam12}</span>
                                </div>
                              )}
                              {m.durmuhurtham12 && (
                                <div className="text-rose-900 flex justify-between">
                                  <span>{isTamil ? "துர்முகூர்த்தம்:" : "Durmuhurtham:"}</span>
                                  <span>{m.durmuhurtham12}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Working Interactive Action Links on Candidate Card */}
                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleInspectCandidatePanchang(m.date)}
                          className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition-all"
                          title="Load this day's full Panchang above"
                        >
                          <Sun className="w-3.5 h-3.5 text-amber-600" />
                          <span>{isTamil ? "பஞ்சாங்கம் பார்க்க" : "View Panchang"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAskAboutCandidateDate(m)}
                          className="text-[11px] font-bold text-purple-800 hover:text-purple-950 flex items-center gap-1 cursor-pointer bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200 transition-all"
                          title="Ask AI about this specific date"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                          <span>{isTamil ? "AI-யிடம் கேட்க" : "Ask AI"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
