import React, { useState } from "react";
import {
  Clock,
  Calendar,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronRight,
  TrendingUp,
  Activity,
  Award,
  Info,
  RefreshCw,
  Sliders,
  FileText,
  Plus,
  Trash2,
  HelpCircle,
  BarChart3,
  Search,
  Check
} from "lucide-react";
import { runBirthTimeRectification, EVENT_TYPES, DATE_PRECISION_LEVELS, EVENT_IMPORTANCE_LEVELS, SOURCE_RELIABILITY_LEVELS } from "../../services/birthTimeRectification/index.js";
import { TRANSLATIONS } from "../../services/localization.js";

const DEMO_FIXTURE_EVENTS = [
  {
    id: "EVT-1",
    type: "CAREER_START",
    date: "2016-07-01",
    datePrecision: "EXACT_DAY",
    importance: "HIGH",
    sourceReliability: "DEMO_FIXTURE",
    description: "First software engineering role",
    verified: true
  },
  {
    id: "EVT-2",
    type: "MARRIAGE",
    date: "2019-11-20",
    datePrecision: "EXACT_DAY",
    importance: "CRITICAL",
    sourceReliability: "DEMO_FIXTURE",
    description: "Wedding ceremony",
    verified: true
  },
  {
    id: "EVT-3",
    type: "CHILD_BIRTH",
    date: "2021-08-14",
    datePrecision: "EXACT_DAY",
    importance: "HIGH",
    sourceReliability: "DEMO_FIXTURE",
    description: "Birth of first child",
    verified: true
  },
  {
    id: "EVT-4",
    type: "RELOCATION",
    date: "2023-03-10",
    datePrecision: "MONTH",
    importance: "MEDIUM",
    sourceReliability: "DEMO_FIXTURE",
    description: "Relocated to new metropolitan city",
    verified: true
  }
];

export default function BirthTimeRectificationLab({
  chartData = null,
  onApplyRectifiedTime = null,
  lang = "en"
}) {
  const isTamil = lang === "ta";
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // Form State - initialized from active chart profile or empty
  const [birthDate, setBirthDate] = useState(
    chartData?.profile?.birthDate || chartData?.birthDateStr || chartData?.birthDate || ""
  );
  const [approxTime, setApproxTime] = useState(
    chartData?.profile?.birthTime || chartData?.birthTime || ""
  );
  const [marginMinutes, setMarginMinutes] = useState(30);
  const [system, setSystem] = useState(chartData?.system || "lahiri");
  const [events, setEvents] = useState([]);
  const [isDemoFixtureActive, setIsDemoFixtureActive] = useState(false);

  // New Event Inputs
  const [newType, setNewType] = useState("CAREER_START");
  const [newDate, setNewDate] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newImportance, setNewImportance] = useState("HIGH");
  const [newPrecision, setNewPrecision] = useState("EXACT_DAY");

  // Output / Execution State
  const [activeTab, setActiveTab] = useState("results"); // 'results', 'candidates', 'stability', 'validation', 'evidence'
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLoadDemoEvents = () => {
    setEvents(DEMO_FIXTURE_EVENTS);
    setIsDemoFixtureActive(true);
    if (!birthDate) setBirthDate("1992-08-15");
    if (!approxTime) setApproxTime("06:00");
  };

  const handleClearEvents = () => {
    setEvents([]);
    setIsDemoFixtureActive(false);
    setResult(null);
  };

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!newDate) {
      setErrorMsg(isTamil ? "நிகழ்வு தேதியை உள்ளிடவும்." : "Please provide a valid event date.");
      return;
    }
    setErrorMsg("");
    const newEvt = {
      id: `EVT-${Date.now()}`,
      type: newType,
      date: newDate,
      datePrecision: newPrecision,
      importance: newImportance,
      sourceReliability: "USER_VERIFIED",
      description: newDesc || `${newType} milestone`,
      verified: true
    };
    setEvents([...events, newEvt]);
    setIsDemoFixtureActive(false);
    setNewDate("");
    setNewDesc("");
  };

  const handleRemoveEvent = (id) => {
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    if (updated.length === 0) setIsDemoFixtureActive(false);
  };

  const handleRunRectification = () => {
    if (!birthDate) {
      setErrorMsg(isTamil ? "பிறந்த தேதியை உள்ளிடவும்." : "Please enter a valid birth date (YYYY-MM-DD).");
      return;
    }
    if (!approxTime) {
      setErrorMsg(isTamil ? "தோராயமான பிறந்த நேரத்தை உள்ளிடவும்." : "Please enter an approximate birth time (HH:MM).");
      return;
    }
    if (events.length === 0) {
      setErrorMsg(isTamil ? "குறைந்தது ஒரு சரிபார்க்கப்பட்ட நிகழ்வை உள்ளிடவும்." : "Please add at least one verified life event.");
      return;
    }

    setErrorMsg("");
    setIsCalculating(true);

    try {
      const lat = chartData?.profile?.lat ?? chartData?.lat ?? (isDemoFixtureActive ? 13.0827 : 0);
      const lng = chartData?.profile?.lng ?? chartData?.lng ?? (isDemoFixtureActive ? 80.2707 : 0);
      const tz = chartData?.profile?.tz ?? chartData?.tz ?? (isDemoFixtureActive ? 5.5 : null);
      const timezoneId = chartData?.profile?.timezoneId || chartData?.timezoneId || (isDemoFixtureActive ? "Asia/Kolkata" : "UTC");

      const rectResult = runBirthTimeRectification({
        birthDate: String(birthDate),
        approximateTime: String(approxTime),
        marginMinutes: Number(marginMinutes),
        lat: Number(lat),
        lng: Number(lng),
        timezoneId,
        utcOffset: tz !== null ? Number(tz) : null,
        system,
        events
      });

      setResult(rectResult);
      setActiveTab("results");
    } catch (err) {
      console.error("[RECTIFICATION] Error running rectification:", err);
      setErrorMsg(err.message || (isTamil ? "கணக்கீட்டில் பிழை ஏற்பட்டது." : "Calculation error occurred."));
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-purple-900 via-indigo-950 to-stone-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>{isTamil ? "சான்றுகள் அடிப்படையிலான பிறந்த நேர திருத்தம்" : "Evidence-Based Birth-Time Rectification Lab"}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-amber-200">
            {isTamil ? "வரலாற்று நிகழ்வுகள் வழியே ஆதாரபூர்வ நேர திருத்தம்" : "Evidence-Based Birth-Time Rectification via Life Milestones"}
          </h2>
          <p className="text-xs md:text-sm text-purple-200/90 max-w-3xl leading-relaxed">
            {isTamil
              ? "திருமணம், வேலை வாய்ப்பு, பதவி உயர்வு, குழந்தை பிறப்பு, இடமாற்றம் போன்ற ஆவணப்படுத்தப்பட்ட நிகழ்வுகளை 16 வர்க்க சக்கரங்கள், விம்சோத்தரி தசா-புக்தி-பிரத்யந்தர காலங்கள் மற்றும் உண்மையான வரலாற்று கோச்சார சஞ்சாரங்களுடன் கணித ரீதியாக பொருத்தி நிலையான பிறந்த நேர இடைவெளியை தீர்மானிக்கிறது."
              : "Reconciles documented milestone events with 16 harmonic divisional charts (D1..D60), 3-tier Vimshottari Dasha cycles (MD/AD/PD), and historical planetary transits to determine the peak astrological consistency interval without artificial assumptions."}
          </p>
        </div>
      </div>

      {/* Control Panel: Search Interval & Events Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Search Range & Controls */}
        <div className="p-5 md:p-6 rounded-3xl bg-[#FFFDF9] border border-amber-200/80 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-amber-200/60 pb-3">
            <Sliders className="w-4 h-4 text-amber-700" />
            <h3 className="font-serif font-bold text-stone-900 text-sm">
              {isTamil ? "கணக்கீட்டு அளவுருக்கள்" : "Search Window & System"}
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="text-[11px] font-bold text-stone-700 block mb-1">
                {isTamil ? "பிறந்த தேதி (Birth Date):" : "Birth Date:"}
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 bg-white font-mono text-xs focus:ring-2 focus:ring-purple-400 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-stone-700 block mb-1">
                {isTamil ? "தோராயமான பிறந்த நேரம் (Approximate Time):" : "Approximate Time:"}
              </label>
              <input
                type="time"
                value={approxTime}
                onChange={(e) => setApproxTime(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 bg-white font-mono text-xs focus:ring-2 focus:ring-purple-400 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-stone-700 block mb-1">
                {isTamil ? "தேடல் வரம்பு (Search Window Margin):" : "Search Window Margin:"}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[15, 30, 60, 120, 180, 360].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMarginMinutes(m)}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all ${
                      marginMinutes === m
                        ? "bg-purple-700 text-white border-purple-800 shadow-xs"
                        : "bg-white text-stone-700 border-stone-200 hover:bg-purple-50"
                    }`}
                  >
                    ±{m >= 60 ? `${m / 60}h` : `${m}m`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-stone-700 block mb-1">
                {isTamil ? "ஜோதிட முறை (Astrology System):" : "Astrology System:"}
              </label>
              <select
                value={system}
                onChange={(e) => setSystem(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 bg-white text-xs font-semibold focus:ring-2 focus:ring-purple-400 outline-none"
              >
                <option value="lahiri">Lahiri / Chitrapaksha Sidereal (BPHS)</option>
                <option value="raman">Raman Sidereal</option>
                <option value="kp">Krishnamurti Padhdhati (KP)</option>
                <option value="tropical">Western Tropical (Sayana)</option>
              </select>
            </div>

            <button
              type="button"
              disabled={isCalculating}
              onClick={handleRunRectification}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold text-xs shadow-md hover:brightness-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isCalculating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isTamil ? "கணக்கிடப்படுகிறது..." : "Rectifying..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{isTamil ? "நேர திருத்தத்தை தொடங்கு" : "Run Birth-Time Rectification"}</span>
                </>
              )}
            </button>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right 2 Columns: Milestone Event Timeline Manager */}
        <div className="lg:col-span-2 p-5 md:p-6 rounded-3xl bg-[#FFFDF9] border border-amber-200/80 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/60 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-700" />
              <h3 className="font-serif font-bold text-stone-900 text-sm">
                {isTamil ? "சரிபார்க்கப்பட்ட வாழ்வியல் நிகழ்வுகள்" : "Verified Life Events Registry"}
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              {isDemoFixtureActive && (
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 uppercase">
                  DEMONSTRATION DATA
                </span>
              )}
              {events.length === 0 ? (
                <button
                  type="button"
                  onClick={handleLoadDemoEvents}
                  className="text-[11px] font-bold px-3 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-all"
                >
                  {isTamil ? "மாதிரி நிகழ்வுகளை ஏற்று" : "Load Sample Events (Demo Fixture)"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleClearEvents}
                  className="text-[11px] font-bold px-3 py-1 rounded-lg bg-stone-100 text-stone-700 border border-stone-300 hover:bg-stone-200 transition-all"
                >
                  {isTamil ? "அழிக்க" : "Clear All"}
                </button>
              )}
            </div>
          </div>

          {/* Quick Add Event Form */}
          <form onSubmit={handleAddEvent} className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/60 space-y-2.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-bold text-stone-600 block mb-1">{isTamil ? "நிகழ்வு வகை:" : "Event Category:"}</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full p-2 rounded-lg border border-stone-300 bg-white text-xs font-medium"
                >
                  {EVENT_TYPES.map(tKey => (
                    <option key={tKey} value={tKey}>{tKey.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-600 block mb-1">{isTamil ? "நிகழ்ந்த தேதி:" : "Event Date:"}</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full p-2 rounded-lg border border-stone-300 bg-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-600 block mb-1">{isTamil ? "முக்கியத்துவம்:" : "Importance:"}</label>
                <select
                  value={newImportance}
                  onChange={(e) => setNewImportance(e.target.value)}
                  className="w-full p-2 rounded-lg border border-stone-300 bg-white text-xs font-medium"
                >
                  {EVENT_IMPORTANCE_LEVELS.map(imp => (
                    <option key={imp} value={imp}>{imp}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder={isTamil ? "விளக்கம் (எ.கா. நிறுவனத்தில் மூத்த பொறியாளர் பதவி உயர்வு)" : "Description (e.g. Marriage or Career Promotion milestone)"}
                className="flex-1 p-2 rounded-lg border border-stone-300 bg-white text-xs"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isTamil ? "சேர்" : "Add Event"}</span>
              </button>
            </div>
          </form>

          {/* Events List */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {events.length === 0 ? (
              <div className="p-6 text-center text-stone-500 text-xs border border-dashed border-stone-300 rounded-2xl">
                {isTamil ? "நிகழ்வுகள் எதுவும் சேர்க்கப்படவில்லை. மேலே உள்ள படிவத்தைப் பயன்படுத்தி நிகழ்வுகளை சேர்க்கவும் அல்லது மாதிரி நிகழ்வுகளை ஏற்றவும்." : "No events registered yet. Use the form above to add your verified milestones or click 'Load Sample Events'."}
              </div>
            ) : (
              events.map((evt, idx) => (
                <div
                  key={evt.id}
                  className="p-3 rounded-xl bg-white border border-stone-200/80 shadow-xs flex items-center justify-between text-xs hover:border-purple-300 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-900 font-mono font-bold flex items-center justify-center text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">{evt.type.replace(/_/g, " ")}</span>
                        <span className="text-[10px] px-2 py-0.2 rounded bg-amber-100 text-amber-900 font-mono">
                          {evt.date || evt.startDate}
                        </span>
                        <span className="text-[9px] uppercase font-bold text-purple-700">
                          {evt.importance}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500">{evt.description}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveEvent(evt.id)}
                    className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                    title="Remove event"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Results & Deep Inspection Views */}
      {result && (
        <div className="p-6 md:p-8 rounded-3xl bg-[#FFFDF9] border border-purple-200 shadow-md space-y-6 animate-fadeIn">
          {/* Top Result Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-amber-50 border border-purple-200 flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
                  result.resolution === "MINUTE_LEVEL"
                    ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                    : result.resolution === "MULTI_MODAL"
                    ? "bg-purple-100 text-purple-900 border border-purple-300"
                    : "bg-amber-100 text-amber-900 border border-amber-300"
                }`}>
                  {result.resolution.replace(/_/g, " ")}
                </span>
                <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-800 border border-stone-300">
                  Strength: {result.evidenceStrength}
                </span>
              </div>

              <div className="flex items-baseline gap-3 flex-wrap">
                {result.centralEstimate ? (
                  <h3 className="text-3xl md:text-4xl font-serif font-extrabold text-purple-950 font-mono tracking-tight">
                    {result.centralEstimate}
                  </h3>
                ) : (
                  <h3 className="text-2xl md:text-3xl font-serif font-extrabold text-purple-950 font-mono tracking-tight">
                    {result.candidateInterval?.start} – {result.candidateInterval?.end}
                  </h3>
                )}
                {result.candidateInterval && (
                  <span className="text-xs text-stone-600">
                    ({isTamil ? "நிலையான வரம்பு" : "Candidate Interval"}: <strong className="text-purple-900 font-mono">{result.candidateInterval.start} – {result.candidateInterval.end}</strong>, {result.candidateInterval.elapsedMinutes} mins)
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-600 max-w-xl">
                {isTamil ? result.verdictTamil : result.verdict}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="p-3 rounded-xl bg-white border border-purple-200 text-center shadow-xs min-w-[120px]">
                <span className="text-[10px] text-stone-500 uppercase font-bold block">{isTamil ? "உச்ச மதிப்பெண்" : "Peak Score"}</span>
                <span className="text-xl font-mono font-extrabold text-purple-900">{result.peakScore}/100</span>
              </div>

              {result.resolution === "MINUTE_LEVEL" && result.centralEstimate && onApplyRectifiedTime ? (
                <button
                  type="button"
                  onClick={() => onApplyRectifiedTime(result.centralEstimate)}
                  className="px-5 py-3 rounded-xl bg-purple-800 text-white font-bold text-xs shadow-md hover:bg-purple-900 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{isTamil ? "இந்த நேரத்தை ஜாதகத்தில் பயன்படுத்து" : "Apply Rectified Time"}</span>
                </button>
              ) : (
                <div className="text-[10px] text-stone-500 italic max-w-[140px] text-center bg-stone-100/80 p-2 rounded-lg border border-stone-200">
                  {isTamil ? "நிமிட அளவிலான துல்லியம் நிறுவப்படவில்லை" : "Minute-level precision not isolated"}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs for Deep Dive */}
          <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-3">
            {[
              { id: "results", labelEn: "Candidate Summary", labelTa: "முடிவுகள் தொகுப்பு", icon: Award },
              { id: "candidates", labelEn: "Top Candidates Grid", labelTa: "முன்னணி நேரங்கள்", icon: Layers },
              { id: "stability", labelEn: "Stability & Regions", labelTa: "நிலைப்புத்தன்மை", icon: Activity },
              { id: "validation", labelEn: "Cross-Validation (LOEO)", labelTa: "சரிபார்ப்பு முறை", icon: ShieldCheck }
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-purple-900 text-white shadow-xs"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{isTamil ? tab.labelTa : tab.labelEn}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Candidate Summary */}
          {activeTab === "results" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-white border border-stone-200 text-center">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">D1 Lagna</span>
                  <span className="text-sm font-bold text-purple-950 font-serif">{result.peakChart?.ascendantSign?.name || "—"}</span>
                  <span className="text-[10px] text-stone-400 block font-mono">{result.peakChart?.ascendantDeg?.toFixed?.(2)}°</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-stone-200 text-center">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">D9 Navamsha</span>
                  <span className="text-sm font-bold text-purple-950 font-serif">{result.peakChart?.ascendantNavamsa?.sign || "—"}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-stone-200 text-center">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Stability Status</span>
                  <span className="text-sm font-bold text-purple-950 font-serif">{result.stability?.stabilityLevel}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-stone-200 text-center">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">LOEO Pass Rate</span>
                  <span className="text-sm font-bold text-purple-950 font-mono">
                    {(result.validation?.leaveOneOut?.heldOutEventPassRate * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Top Candidates Grid */}
          {activeTab === "candidates" && (
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-xl border border-stone-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-purple-900 text-white text-[11px]">
                    <tr>
                      <th className="p-2.5">Time</th>
                      <th className="p-2.5">Score</th>
                      <th className="p-2.5">Positive</th>
                      <th className="p-2.5">Contradiction</th>
                      <th className="p-2.5">Domains</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 font-mono text-[11px] bg-white">
                    {result.topCandidates.map((c, idx) => (
                      <tr key={idx} className={idx === 0 ? "bg-purple-50 font-bold" : "hover:bg-stone-50"}>
                        <td className="p-2.5 text-purple-950">{c.timeString}</td>
                        <td className="p-2.5 text-emerald-800">{c.totalScore}</td>
                        <td className="p-2.5 text-stone-700">{c.positiveScore}</td>
                        <td className="p-2.5 text-rose-700">{c.contradictionPenalty}</td>
                        <td className="p-2.5 text-purple-800">{c.domainDiversityCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Stability & Regions */}
          {activeTab === "stability" && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-white border border-stone-200">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Stability Level</span>
                  <span className="text-sm font-bold text-emerald-800">{result.stability.stabilityLevel}</span>
                  <span className="text-[10px] text-stone-400 block">Score Spread: {result.stability.scoreSpread} pts</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-stone-200">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Stable Interval</span>
                  <span className="text-sm font-bold text-purple-900 font-mono">{result.stability.elapsedIntervalMinutes} Mins</span>
                  <span className="text-[10px] text-stone-400 block">{result.stability.stableIntervalStart} – {result.stability.stableIntervalEnd}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-stone-200">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Resolution</span>
                  <span className="text-sm font-bold text-amber-900">{result.resolution}</span>
                  <span className="text-[10px] text-stone-400 block">{result.stability.isMultiPeak ? "Multimodal Peaks" : "Single Region"}</span>
                </div>
              </div>

              {result.stability.stableRegions?.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Identified Stable Regions:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {result.stability.stableRegions.map((reg, rIdx) => (
                      <div key={rIdx} className="p-3 rounded-lg bg-white border border-stone-200 space-y-1">
                        <div className="flex items-center justify-between font-mono">
                          <strong className="text-purple-950">{reg.start} – {reg.end}</strong>
                          <span className="text-emerald-800 font-bold">Peak: {reg.peakScore}</span>
                        </div>
                        <p className="text-[11px] text-stone-500">
                          Elapsed: {reg.elapsedMinutes} mins | Samples: {reg.candidateCount} | Peak at {reg.peakTime}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Leave-One-Out Validation */}
          {activeTab === "validation" && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-white border border-stone-200 grid grid-cols-3 gap-3 text-center">
                <div>
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Held-Out Pass Rate</span>
                  <span className="text-lg font-bold text-emerald-800 font-mono">
                    {(result.validation.leaveOneOut.heldOutEventPassRate * 100).toFixed(0)}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Candidate Stability</span>
                  <span className="text-lg font-bold text-purple-900 font-mono">
                    {(result.validation.leaveOneOut.trainingCandidateStability * 100).toFixed(0)}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Overfit Risk</span>
                  <span className="text-sm font-bold text-purple-950">
                    {result.validation.leaveOneOut.overfitRisk}
                  </span>
                </div>
              </div>

              {result.validation.leaveOneOut.rounds?.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Out-of-Sample LOEO Rounds:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {result.validation.leaveOneOut.rounds.map((r) => (
                      <div key={r.round} className="p-2.5 rounded-lg bg-white border border-stone-200 flex items-center justify-between text-[11px]">
                        <div>
                          <strong className="text-stone-900 block">Held Out: {r.heldOutEventType}</strong>
                          <span className="text-stone-500 font-mono">Training Winner: {r.selectedTrainingTime}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.passedHeldOut ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900"
                        }`}>
                          {r.passedHeldOut ? "Pass" : "Fail"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Statutory Disclaimer */}
          <div className="p-3.5 rounded-xl bg-stone-100 text-stone-600 text-[11px] italic border border-stone-200 flex items-start gap-2">
            <Info className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
            <span>
              {isTamil
                ? "அறிவிப்பு: இந்த பிறந்த நேர திருத்தம் உள்ளிடப்பட்ட வரலாற்று நிகழ்வுகள், வர்க்க சக்கரங்கள் மற்றும் கோச்சார சஞ்சாரங்களின் கணித ஒருமைப்பாட்டு வரம்பை மட்டுமே வழங்குகிறது."
                : "Statutory Notice: Evidence-Based Birth-Time Rectification establishes the highest statistical consistency interval from entered lifetime milestones and harmonic divisional charts. It is an analytical decision-support tool."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
