import React, { useState } from "react";
import {
  Sparkles,
  FileText,
  Award,
  Shield,
  CheckCircle2,
  Heart,
  Printer,
  Compass,
  Gem,
  Flame,
  GraduationCap,
  Briefcase,
  Home,
  Landmark,
  Activity,
  Crown,
  Globe2,
  Layers,
  Check,
  Zap,
  Star,
  ChevronRight,
  Bot,
  Copy,
  CheckCheck,
  RefreshCw,
  AlertCircle,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Calendar,
  Sun,
  Info
} from "lucide-react";
import {
  generateAIDeepAstrologyReport
} from "../../services/aiAstrologyService";
import {
  calculateExecutiveSummary,
  calculatePredictionReasoningChain,
  reconcileEvidenceContradictions,
  calculateMultiSystemBundle,
  CALCULATION_CONVENTIONS
} from "../../services/astroEngine";

function CertaintyBadge({ type = "calculated", isTamil = false }) {
  if (type === "calculated") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-blue-50 text-blue-800 border border-blue-200">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
        {isTamil ? "கணக்கீடு (CALCULATED)" : "CALCULATED"}
      </span>
    );
  }
  if (type === "traditional") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-amber-50 text-amber-900 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        {isTamil ? "சாஸ்திர விளக்கம் (TRADITIONAL)" : "TRADITIONAL INTERPRETATION"}
      </span>
    );
  }
  if (type === "timing") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-emerald-50 text-emerald-900 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        {isTamil ? "காலக்கட்ட கணிப்பு (TIMING ASSESSMENT)" : "TIMING ASSESSMENT"}
      </span>
    );
  }
  return null;
}

function AstrologicalGlossaryTooltip({ term, explanation, isTamil = false }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="underline decoration-dotted decoration-amber-500 font-semibold cursor-help text-amber-900 inline-flex items-center gap-0.5 hover:text-amber-700 text-[11px]"
      >
        <span>{term}</span>
        <Info className="w-3 h-3 text-amber-600" />
      </button>
      {open && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-stone-900 text-stone-100 text-[11px] rounded-xl shadow-xl border border-amber-400 leading-normal">
          <div className="flex justify-between items-center mb-1 font-bold text-amber-300 text-xs">
            <span>{term}</span>
            <button onClick={() => setOpen(false)} className="text-stone-400 hover:text-white text-xs">✕</button>
          </div>
          <p>{explanation}</p>
        </div>
      )}
    </span>
  );
}

export default function DetailedReportModal({ isOpen, onClose, chartData, lang = "en", onCreditDeducted = null }) {
  const [reportTier, setReportTier] = useState("detailed"); // "short" or "detailed"
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState("algorithmic"); // "algorithmic" or "ai"
  const [audienceMode, setAudienceMode] = useState("client"); // "client" (Client View) or "astrologer" (Astrologer View)
  const [selectedReasoningDomain, setSelectedReasoningDomain] = useState(null); // domain for "Why this prediction?" modal

  const chartId = chartData?.reportId || `chart_${(chartData?.birthDate || chartData?.date || "").toString()}_${chartData?.ascendantLong || chartData?.ascendant?.longitude || 0}`;
  const milestoneStorageKey = `astro_milestones_${chartId}`;

  const [confirmedMilestones, setConfirmedMilestones] = useState(() => {
    try {
      const saved = typeof window !== "undefined" && window.localStorage ? localStorage.getItem(milestoneStorageKey) : null;
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleMilestone = (mId) => {
    setConfirmedMilestones(prev => {
      const updated = { ...prev, [mId]: !prev[mId] };
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.setItem(milestoneStorageKey, JSON.stringify(updated));
        }
      } catch (err) {
        console.warn("Failed to persist milestone confirmation to localStorage", err);
      }
      return updated;
    });
  };

  // AI Generation State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReportText, setAiReportText] = useState("");
  const [aiError, setAiError] = useState("");
  const [copied, setCopied] = useState(false);

  const multiSystemBundle = React.useMemo(() => {
    if (!isOpen || !chartData) return null;
    try {
      const lat = chartData?.latitude ?? chartData?.lat ?? chartData?.profile?.latitude;
      const lng = chartData?.longitude ?? chartData?.lng ?? chartData?.profile?.longitude;
      const bDate = chartData?.birthDateStr || chartData?.birthDate || chartData?.profile?.birthDate;
      const bTime = chartData?.birthTimeStr || chartData?.time || chartData?.profile?.birthTime || "12:00";
      const tz = chartData?.utcOffset ?? chartData?.tz ?? chartData?.profile?.utcOffset;
      const tzId = chartData?.timezoneId ?? chartData?.profile?.timezoneId ?? null;

      if (lat === undefined || lat === null || lng === undefined || lng === null || !bDate || tz === undefined || tz === null) {
        return null;
      }
      const bData = {
        birthDate: bDate,
        birthTime: bTime,
        latitude: Number(lat),
        longitude: Number(lng),
        utcOffset: Number(tz),
        timezoneId: tzId
      };
      return calculateMultiSystemBundle(bData);
    } catch (err) {
      console.warn("Multi-system bundle computation skipped:", err);
      return null;
    }
  }, [isOpen, chartData]);

  if (!isOpen || !chartData) return null;

  const { sunSign, moonSign, ascendantSign, moonNakshatra } = chartData;
  const isTamil = lang === "ta";

  // Safe Accessors for Core Astronomical Identifiers
  const getSignName = (s, fallback = "N/A") => {
    if (!s) return fallback;
    if (typeof s === "string") return s;
    return s.name || s.sign || fallback;
  };
  const getSignTamil = (s, fallback = "N/A") => {
    if (!s) return fallback;
    if (typeof s === "string") return s;
    return s.tamil || s.name || fallback;
  };
  const getNakName = (n, fallback = "N/A") => {
    if (!n) return fallback;
    if (typeof n === "string") return n;
    return n.name || fallback;
  };
  const getNakTamil = (n, fallback = "N/A") => {
    if (!n) return fallback;
    if (typeof n === "string") return n;
    return n.tamil || n.name || fallback;
  };
  const getNakPada = (n) => {
    if (!n) return "-";
    if (typeof n === "object" && n.pada !== undefined && n.pada !== null) return n.pada;
    return "-";
  };
  const getNakRuler = (n) => {
    if (!n) return "-";
    if (typeof n === "object" && n.ruler) return n.ruler;
    return "-";
  };

  const ascName = getSignName(ascendantSign, chartData.ascendant?.sign || "N/A");
  const ascTamil = getSignTamil(ascendantSign, chartData.ascendant?.signTamil || "N/A");
  const moonName = getSignName(moonSign, chartData.moon?.sign || "N/A");
  const moonTamil = getSignTamil(moonSign, chartData.moon?.signTamil || "N/A");
  const sunName = getSignName(sunSign, chartData.sun?.sign || "N/A");
  const sunTamil = getSignTamil(sunSign, chartData.sun?.signTamil || "N/A");
  const nakName = getNakName(moonNakshatra, chartData.moon?.nakshatra || "N/A");
  const nakTamil = getNakTamil(moonNakshatra, chartData.moon?.nakshatraTamil || "N/A");
  const nakPada = getNakPada(moonNakshatra);
  const nakRuler = getNakRuler(moonNakshatra);

  const domain = (isTamil ? chartData.domainPredictionsTamil : chartData.domainPredictions) || {};
  const yogas = (isTamil ? chartData.detectedYogasTamil : chartData.detectedYogas) || [];
  const bhavas = (isTamil ? chartData.bhavasDetailedTamil : chartData.bhavasDetailed) || [];
  const dosha = (isTamil ? chartData.tridoshaBalanceTamil : chartData.tridoshaBalance) || {};
  const remedies = (isTamil ? chartData.personalizedRemediesTamil : chartData.personalizedRemedies) || {};
  const auspicious = (isTamil ? chartData.auspiciousTimelinesTamil : chartData.auspiciousTimelines) || {};
  const riskData = (isTamil ? chartData.riskMatrixTamil : chartData.riskMatrix) || {};
  const timelineData = (isTamil ? (chartData.chronologicalDashaTimelineTamil || chartData.vimshottariCycleTimelineTamil) : (chartData.chronologicalDashaTimeline || chartData.vimshottariCycleTimeline)) || {};
  const timelineStages = Array.isArray(timelineData) ? timelineData : (timelineData.stages || []);
  const careerPathway = (isTamil ? chartData.careerPathwayTamil : chartData.careerPathway) || {};
  const marriagePathway = (isTamil ? chartData.marriagePathwayTamil : chartData.marriagePathway) || {};
  const retroRaw = (isTamil ? (chartData.retrospectiveLifeAuditTamil || chartData.retrospectiveMilestonesTamil) : (chartData.retrospectiveLifeAudit || chartData.retrospectiveMilestones)) || [];
  const retrospectiveAudit = Array.isArray(retroRaw) ? retroRaw : (retroRaw?.milestones || []);
  const atmakaraka = chartData.atmakaraka || (chartData.jaiminiKarakas && chartData.jaiminiKarakas[0]) || null;
  const rawExecSummary = chartData.executiveSummary || calculateExecutiveSummary(chartData, lang) || {};
  const execSummary = {
    coreProfile: rawExecSummary.coreProfile || {
      lagna: isTamil ? ascTamil : ascName,
      moonSign: isTamil ? moonTamil : moonName,
      sunSign: isTamil ? sunTamil : sunName,
      nakshatra: isTamil ? `${nakTamil} பாதம் ${nakPada}` : `${nakName} Pada ${nakPada}`,
      atmakaraka: atmakaraka ? `${atmakaraka.planet} (${isTamil ? (atmakaraka.signTamil || atmakaraka.sign) : atmakaraka.sign})` : "N/A"
    },
    strongestThemes: rawExecSummary.strongestThemes || [],
    currentLifePhase: rawExecSummary.currentLifePhase || {
      activeMahadasha: isTamil ? "செயலில் உள்ள தசை" : "Active Mahadasha",
      activeAntardasha: isTamil ? "செயலில் உள்ள புக்தி" : "Active Antardasha",
      ageRange: "N/A",
      theme: isTamil ? "காலக்கட்ட கடமைகள்" : "Karmic Maturation & Key Life-Stage Responsibilities"
    },
    birthTimeReliability: rawExecSummary.birthTimeReliability || rawExecSummary.birthTimeSensitivity || {
      status: isTamil ? "குறைந்த எல்லை உணர்திறன்" : "Low Boundary Sensitivity",
      lagnaDegree: "N/A",
      d60Sensitivity: "Shashtiamsha (D60) shifts sign every ~2 minutes.",
      d9Sensitivity: "Navamsha (D9) shifts sign every ~13.3 minutes."
    },
    nextImportantWindows: rawExecSummary.nextImportantWindows || [],
    keyCautions: rawExecSummary.keyCautions || []
  };
  const birthDataConfidence = chartData.reportEvidencePackage?.birthDataConfidence || {
    lagnaDegreeInSign: parseFloat(((chartData.ascendant?.longitude ?? chartData.ascendantLong ?? 0) % 30).toFixed(2)),
    boundaryProximityAlert: ((chartData.ascendant?.longitude ?? chartData.ascendantLong ?? 0) % 30) < 1.0 || ((chartData.ascendant?.longitude ?? chartData.ascendantLong ?? 0) % 30) > 29.0,
    boundaryNotes: isTamil ? "லக்ன பாகை நிலையாக உள்ளது." : "Ascendant comfortably placed within sign boundary.",
    d60Sensitivity: "Shashtiamsha (D60) shifts sign every ~2 minutes of birth time.",
    d9Sensitivity: "Navamsha (D9) shifts sign every ~13.3 minutes of birth time."
  };

  const handleGenerateAIReport = async () => {
    setAiLoading(true);
    setAiError("");
    setViewMode("ai");

    try {
      const result = await generateAIDeepAstrologyReport(chartData, lang, onCreditDeducted);
      setAiReportText(result);
    } catch (err) {
      setAiError(err.message || "Failed to generate AI report");
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopyAI = () => {
    if (aiReportText) {
      navigator.clipboard.writeText(aiReportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrintMinimal = () => {
    setReportTier("short");
    setActiveTab("all");
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const handlePrintDetailed = () => {
    setReportTier("detailed");
    setActiveTab("all");
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const tabs = [
    { id: "all", label: isTamil ? "அனைத்து பக்கங்கள் (முழு அறிக்கை)" : "All Chapters (Full View)", icon: Layers },
    { id: "execSummary", label: isTamil ? "0. நிர்வாக சுருக்கம்" : "0. Executive Summary", icon: FileText },
    { id: "blueprint", label: isTamil ? "1. மூல ஜாதகம்" : "1. Natal Blueprint", icon: Compass },
    { id: "yogas", label: isTamil ? "2. முக்கிய யோகங்கள் & தோஷங்கள்" : "2. Important Yogas & Doshas", icon: Award },
    { id: "bhavas", label: isTamil ? "3. 12 பாவகங்கள்" : "3. 12 Bhavas Deep Dive", icon: CheckCircle2 },
    { id: "health", label: isTamil ? "4. பாரம்பரிய ஜோதிட ஆரோக்கிய கூறுகள்" : "4. Astrological Wellness & Vitality", icon: Activity },
    { id: "studies", label: isTamil ? "5. கல்வி & மேதைமை" : "5. Studies & Exams", icon: GraduationCap },
    { id: "career", label: isTamil ? "6. தொழில் & தலைமை" : "6. Career & Vocations", icon: Briefcase },
    { id: "property", label: isTamil ? "7. பூமி & சொத்து யோகம்" : "7. Property & Vehicles", icon: Home },
    { id: "politics", label: isTamil ? "8. பொது சேவை & தலைமைத்துவ கூறுகள்" : "8. Public Leadership & Governance", icon: Landmark },
    { id: "relationships", label: isTamil ? "9. திருமணம் & குடும்பம்" : "9. Marriage & Progeny", icon: Heart },
    { id: "foreign", label: isTamil ? "10. வெளிநாடு & ஆன்மீகம்" : "10. Foreign Travel & Spiritual Themes", icon: Globe2 },
    { id: "dosha", label: isTamil ? "11. திரிதோஷ சமநிலை" : "11. Tridosha Balance", icon: Flame },
    { id: "remedies", label: isTamil ? "12. பரிகாரங்கள் & ரத்தினம்" : "12. Remedies & Gem Associations", icon: Gem },
    { id: "auspicious", label: isTamil ? "13. சுப முகூர்த்த காலங்கள்" : "13. Auspicious Timing Principles", icon: Clock },
    { id: "risks", label: isTamil ? "14. எச்சரிக்கை காலங்கள் & பரிகாரம்" : "14. Traditional Caution Indicators & Timing Windows", icon: ShieldAlert },
    { id: "timeline", label: isTamil ? "15. விம்சோத்தரி தசா காலக்கோடு (0-120 ஆண்டு)" : "15. Complete Vimshottari Timeline (0–120 Yrs)", icon: Calendar },
    { id: "milestoneAudit", label: isTamil ? "16. கடந்த கால மைல்கற்கள் சரிபார்ப்பு" : "16. Retrospective Milestone Verification", icon: CheckCheck },
    { id: "reasoningDossier", label: isTamil ? "17. ஜோதிட ஆதார சங்கிலி (Astrologer Dossier)" : "17. Astrologer Evidence Dossier", icon: Sparkles },
    { id: "technicalAppendix", label: isTamil ? "18. தொழில்நுட்ப கணக்கீட்டு பிற்சேர்க்கை" : "18. Technical Calculation Appendix", icon: Layers },
    { id: "multiSystemComparison", label: isTamil ? "19. பல ஜோதிட முறைகளின் ஒப்பீடு" : "19. Multi-System Comparative Analysis", icon: Compass }
  ];

  return (
    <div className="detailed-report-modal-overlay fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-2 md:p-4 overflow-y-auto">
      <div className="detailed-report-modal-card max-w-5xl w-full my-4 md:my-8 p-4 md:p-8 rounded-3xl bg-[#FFFDF9] border border-amber-300 relative space-y-6 shadow-2xl text-stone-800 max-h-[92vh] overflow-y-auto">
        
        {/* Top Header & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-2xl font-serif font-bold text-stone-900">
                  {isTamil ? "முழுமையான வேத ஜோதிட விரிவான அறிக்கை" : "Comprehensive Vedic Astrology Report"}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300">
                  {reportTier === "detailed" ? (isTamil ? "முழு விரிவான பதிப்பு" : "Master Edition") : (isTamil ? "சுருக்கப் பதிப்பு" : "Essential Summary")}
                </span>
              </div>
              <p className="text-xs text-stone-600">
                {isTamil
                  ? "ஆரோக்கியம், கல்வி, தொழில், பூமி/வாகனம், பொதுத் தலைமை & 12 பாவக முழு ஆய்வு"
                  : "Multi-Domain Life Analysis: Wellness, Education, Career, Assets, Public Leadership & 12 Bhavas"}
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 shrink-0 no-print print:hidden">
            <button
              onClick={() => handleGenerateAIReport()}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 text-white font-bold text-xs shadow-lg shadow-purple-500/20 flex items-center gap-1.5 hover:brightness-110 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
              <span>{isTamil ? "✨ AI ஆய்வு" : "✨ AI Master Reading"}</span>
            </button>
            <button
              onClick={handlePrintMinimal}
              title={isTamil ? "சுருக்க அறிக்கை PDF ஆக சேமிக்க" : "Save Minimal Snapshot PDF"}
              className="px-3 py-2 rounded-xl bg-white border border-amber-300 hover:bg-amber-50 text-stone-800 font-bold text-xs shadow-xs flex items-center gap-1.5 hover:border-amber-400 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-amber-700" />
              <span>{isTamil ? "சுருக்க PDF" : "Minimal PDF"}</span>
            </button>
            <button
              onClick={handlePrintDetailed}
              title={isTamil ? "முழு விரிவான அறிக்கை PDF ஆக சேமிக்க" : "Save Full Detailed Master PDF"}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 hover:brightness-110 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isTamil ? "முழு PDF / அச்சிடு" : "Full PDF / Print"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-stone-700 hover:bg-amber-100 hover:text-stone-900 text-xs font-bold transition-all cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Astronomical Calculation Conventions Disclosure */}
        <div className="px-3.5 py-2 rounded-xl bg-amber-50/70 border border-amber-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-600 font-mono">
          <div className="flex flex-wrap items-center gap-3">
            <span><strong>Ephemeris:</strong> Astronomy Engine (VSOP87/NOVAS-derived) — AstroVerse Lahiri/Chitrapaksha</span>
            <span><strong>Synthesis:</strong> Parashari & Jaimini</span>
            <span><strong>House System:</strong> Whole Sign / Equal-House Bhava Chalit</span>
            <span><strong>Engine:</strong> AstroVerse Engine 4.2.0</span>
          </div>
          <span className="text-[10px] text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded font-sans font-medium">
            Report ID: {chartData?.reportId || `AV-${(chartData?.profile?.name || "NATAL").slice(0, 3).toUpperCase()}-${(chartData?.profile?.year || 2026)}`}
          </span>
        </div>

        {/* Quick Glossary Bar */}
        <div className="px-3.5 py-2 rounded-xl bg-amber-50/50 border border-amber-200/70 flex flex-wrap items-center gap-4 text-xs text-stone-700">
          <span className="font-bold text-[10px] uppercase text-amber-900 tracking-wider flex items-center gap-1">
            <Info className="w-3 h-3 text-amber-600" />
            {isTamil ? "சாஸ்திர சொற்களஞ்சியம்:" : "Astrology Glossary:"}
          </span>
          <AstrologicalGlossaryTooltip
            term="Maraka (மாரகாதிபதி)"
            explanation="Longevity / Health Period Indicator — A traditional classical categorization for the 2nd and 7th house rulers. In classical astrology, Maraka lords govern transitions and longevity thresholds; they are NOT omens of doom."
            isTamil={isTamil}
          />
          <AstrologicalGlossaryTooltip
            term="Shadbala (ஷட்பலம்)"
            explanation="Sixfold Planetary Strength — Measures a planet's quantitative capacity and operational competence to deliver its portfolio; high Shadbala means strong capacity, not necessarily purely benefic outcome."
            isTamil={isTamil}
          />
          <AstrologicalGlossaryTooltip
            term="Vargas (வர்க்கங்கள்)"
            explanation="Harmonic Sub-Charts — Mathematical magnifications of specific life areas (e.g., D9 Navamsha for marriage/inner potential, D10 Dashamsha for career profession, D60 Shashtiamsha for past karma)."
            isTamil={isTamil}
          />
          <AstrologicalGlossaryTooltip
            term="Dasha / Bhukti (தசா புக்தி)"
            explanation="Planetary Timing Periods — The classical Vimshottari 120-year cycle determining WHEN specific planetary promises and karmic potentials awaken."
            isTamil={isTamil}
          />
        </div>

        {/* Audience View Switcher: Client View vs Astrologer View */}
        {viewMode === "algorithmic" && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/5 to-amber-500/10 border border-amber-300 no-print print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                {isTamil ? "அறிக்கை பார்வை முறை:" : "Report Lens:"}
              </span>
              <div className="inline-flex rounded-xl bg-white border border-amber-200 p-0.5 shadow-xs text-xs">
                <button
                  onClick={() => setAudienceMode("client")}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    audienceMode === "client"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  {isTamil ? "வாடிக்கையாளர் பார்வை (Client View)" : "Client View"}
                </button>
                <button
                  onClick={() => setAudienceMode("astrologer")}
                  className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                    audienceMode === "astrologer"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-stone-600 hover:text-purple-900"
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  {isTamil ? "ஜோதிடர் ஆய்வுப் பார்வை (Astrologer Dossier)" : "Astrologer View (Deep Evidence)"}
                </button>
              </div>
            </div>

            <span className="text-[11px] text-stone-600 italic">
              {audienceMode === "astrologer"
                ? (isTamil ? "9-அடுக்கு ஆதார சங்கிலி & சான்றுகள் குறியீடுகள் (C01, M01...) செயலாக்கத்தில் உள்ளன" : "9-Level Reasoning Chains & Evidence IDs (C01, M01...) Active")
                : (isTamil ? "சுருக்கமான, தெளிவான நேரடி முடிவுகள் & வாழ்வியல் வழிகாட்டல்" : "Executive Synthesis & Actionable Timelines")}
            </span>
          </div>
        )}

        {/* View Mode Switcher: Mathematical Ephemeris vs AI Deep Reading */}
        <div className="flex items-center justify-between p-2 bg-amber-50/80 rounded-2xl border border-amber-200/80 no-print print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("algorithmic")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                viewMode === "algorithmic"
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                  : "text-stone-700 hover:text-stone-900 hover:bg-amber-100/60"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{isTamil ? "கணித சாஸ்திர ஆய்வு (Classical Astrological Matrix)" : "Classical Astrological Matrix"}</span>
            </button>

            <button
              onClick={() => {
                if (!aiReportText && !aiLoading) {
                  handleGenerateAIReport();
                } else {
                  setViewMode("ai");
                }
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                viewMode === "ai"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/20"
                  : "text-purple-700 hover:text-purple-900 hover:bg-purple-50"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 fill-purple-300" />
              <span>{isTamil ? "✨ AI ஆழமான ஆய்வு (AI Master Reading)" : "✨ AI Deep Synthesis"}</span>
              {aiReportText && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
            </button>
          </div>

          <div className="text-[11px] text-stone-500 hidden sm:block">
            {viewMode === "ai" 
              ? (isTamil ? "Google Gemini AI மூலம் இயங்குகிறது" : "Powered by Google Gemini 1.5/2.5 AI")
              : (isTamil ? "லாஹிரி அயனாம்சம் & நவகிரக பாகை கணிதம்" : "Lahiri Ayanamsha & Ephemeris Matrix")}
          </div>
        </div>

        {/* 2-Tier Version Switcher & Pricing Banner (Only in algorithmic mode) */}
        {viewMode === "algorithmic" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-1.5 bg-amber-50/80 rounded-2xl border border-amber-200/80 no-print print:hidden">
            {/* Tier 1: Short Essential Summary */}
            <button
              onClick={() => setReportTier("short")}
              className={`p-3.5 rounded-xl text-left transition-all relative flex flex-col justify-between ${
                reportTier === "short"
                  ? "bg-white border-2 border-amber-500 shadow-md"
                  : "bg-white/60 hover:bg-white border border-amber-200/60 opacity-80 hover:opacity-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-600" />
                  {isTamil ? "சுருக்க அறிக்கை (Essential Snapshot)" : "Essential Summary (Quick Report)"}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                  {isTamil ? "இலவசம் (Free)" : "Standard (Free)"}
                </span>
              </div>
              <p className="text-[11px] text-stone-600 mt-1">
                {isTamil ? "லக்னம், ராசி, சுருக்கமான 12 பாவகங்கள் மற்றும் முக்கிய சுப யோகங்கள்." : "Core planetary alignment, top yogas overview & basic 12-Bhava snapshot."}
              </p>
            </button>

            {/* Tier 2: Master Comprehensive Dossier */}
            <button
              onClick={() => setReportTier("detailed")}
              className={`p-3.5 rounded-xl text-left transition-all relative flex flex-col justify-between ${
                reportTier === "detailed"
                  ? "bg-amber-50/90 border-2 border-amber-500 shadow-md shadow-amber-500/10"
                  : "bg-white/60 hover:bg-white border border-amber-200/60 opacity-80 hover:opacity-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  {isTamil ? "மகா ஆயுள் வழிகாட்டி (Master Life Dossier)" : "Comprehensive Master Dossier"}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold shadow-sm">
                  {isTamil ? "₹499 மதிப்பு (அனைத்தும் திறக்கப்பட்டுள்ளது)" : "₹499 ($9.99 Value) Unlocked"}
                </span>
              </div>
              <p className="text-[11px] text-stone-700 mt-1">
                {isTamil ? "12 பாவகங்கள், ஆரோக்கியம், கல்வி, தொழில், பூமி/வாகனம், அரசியல் தகுதி & ரத்தின பரிந்துரை." : "Deep 12-Bhava breakdown, Health, Studies, Career, Property, Politics & Gemstones."}
              </p>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* AI GENERATED DEEP REPORT VIEW */}
        {/* ========================================================================= */}
        {viewMode === "ai" && (
          <div className="space-y-6">
            {aiLoading && (
              <div className="p-12 text-center space-y-4 rounded-3xl bg-white border border-purple-300 shadow-sm">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 flex items-center justify-center mx-auto shadow-xl shadow-purple-500/20 animate-spin">
                  <Sparkles className="w-8 h-8 text-white fill-white" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-stone-900">
                    {isTamil ? "வேத ஜோதிட AI உங்கள் மகா ஜாதகத்தை கணித்துக்கொண்டிருக்கிறது..." : "AI Master Astrologer is Synthesizing Your Chart..."}
                  </h3>
                  <p className="text-xs text-stone-600 max-w-md mx-auto">
                    {isTamil 
                      ? "லக்னம், நவாம்சம், தசா புக்தி காலங்கள், யோகங்கள் மற்றும் நவகிரக பார்வைகளை ஆராய்ந்து 8 அத்தியாயங்கள் கொண்ட தனிப்பயன் அறிக்கை தயாராகிறது." 
                      : "Correlating Lagna, Navamsa D9, Vimshottari Dasha, planetary avasthas, and yogas into an unrepeatable life dossier."}
                  </p>
                </div>
              </div>
            )}

            {aiError && (
              <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{isTamil ? "AI ஆய்வு உருவாக்குவதில் பிழை" : "AI Generation Error"}</span>
                </div>
                <p className="text-xs text-rose-700 leading-relaxed">{aiError}</p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleGenerateAIReport()}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-100 text-rose-800 hover:bg-rose-200 text-xs font-bold flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{isTamil ? "மீண்டும் முயற்சி செய்" : "Retry"}</span>
                  </button>
                </div>
              </div>
            )}

            {!aiLoading && !aiError && aiReportText && (
              <div className="space-y-4">
                {/* AI Header Bar */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 border border-purple-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-stone-900">
                        {isTamil ? "AI மகா ஜாதக விரிவான ஆய்வு (AI Master Dossier)" : "AI Comprehensive Vedic Astrological Master Dossier"}
                      </h4>
                      <span className="text-[10px] text-purple-800">
                        {isTamil ? "பராசர & ஜைமினி பாரம்பரிய சாஸ்திர முறைப்படி தொகுக்கப்பட்டது" : "Grounding Parashara & Jaimini Classical Syntheses"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyAI}
                      className="px-3 py-1.5 rounded-xl bg-white border border-amber-200 hover:bg-amber-50 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? (isTamil ? "நகலெடுக்கப்பட்டது!" : "Copied!") : (isTamil ? "நகலெடு" : "Copy")}</span>
                    </button>
                    <button
                      onClick={() => handleGenerateAIReport()}
                      className="p-1.5 rounded-xl bg-white border border-amber-200 hover:bg-amber-50 text-stone-700 transition-all shadow-sm"
                      title="Regenerate"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Markdown Display */}
                <div className="p-6 md:p-8 rounded-3xl bg-white border border-amber-200 shadow-sm space-y-4 text-stone-800 text-sm leading-relaxed whitespace-pre-line font-sans select-text">
                  {aiReportText}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detailed Mode: Chapter Navigation Tabs */}
        {viewMode === "algorithmic" && reportTier === "detailed" && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-amber-200/80 no-scrollbar no-print print:hidden">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap flex items-center gap-1.5 transition-all text-[11px] font-medium ${
                    isActive
                      ? "bg-amber-500 text-white font-bold shadow-sm shadow-amber-500/20"
                      : "bg-amber-50/70 text-stone-700 hover:text-stone-900 hover:bg-amber-100/70 border border-amber-200/50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SHORT REPORT VIEW */}
        {/* ========================================================================= */}
        {viewMode === "algorithmic" && reportTier === "short" && (
          <div className="space-y-6">
            {/* Quick Natal Core */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-white border border-amber-200 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-amber-700">
                  {isTamil ? "லக்னம்" : "Ascendant"}
                </span>
                <h4 className="text-base font-bold text-stone-900">{isTamil ? ascTamil : ascName}</h4>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-amber-200 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-purple-700">
                  {isTamil ? "ராசி & நட்சத்திரம்" : "Moon Sign & Star"}
                </span>
                <h4 className="text-base font-bold text-stone-900">{isTamil ? `${moonTamil} - ${nakTamil}` : `${moonName} - ${nakName}`}</h4>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-amber-200 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-rose-700">
                  {isTamil ? "சூரிய ராசி" : "Sun Sign"}
                </span>
                <h4 className="text-base font-bold text-stone-900">{isTamil ? sunTamil : sunName}</h4>
              </div>
            </div>

            {/* Quick 12 Bhavas Highlights */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-amber-900 border-b border-amber-200 pb-1">
                {isTamil ? "12 பாவகங்களின் சுருக்கக் கண்ணோட்டம்" : "12 Bhavas Quick Summary Snapshot"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {bhavas.slice(0, 6).map((b) => (
                  <div key={b.num} className="p-3 rounded-xl bg-white border border-amber-200 shadow-sm space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-amber-900">{b.title.split(":")[0]}</span>
                      <span className="text-[10px] text-cyan-700 font-medium">{isTamil ? b.signTamil : b.signName}</span>
                    </div>
                    <p className="text-[11px] text-stone-600 line-clamp-2">{b.prediction}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Lifespan Milestones Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-amber-200 pb-1">
                <h3 className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  {isTamil ? "முக்கிய விம்சோத்தரி தசா மைல்கற்கள் முன்னோட்டம்" : "Pivotal Vimshottari Dasha Milestones Preview"}
                </h3>
                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {isTamil ? "சாஸ்திர கணிதம்" : "Classical Dasha Framework"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {timelineStages.slice(3, 7).map((stg) => (
                  <div key={stg.id || stg.stageNum} className="p-3 rounded-xl bg-white border border-amber-200 shadow-sm space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900">{stg.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-bold">
                        {stg.ageRange} {isTamil ? "வயது" : "Yrs"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-stone-500">
                      <span>{stg.calendarYears}</span>
                      <span className="text-emerald-700 font-bold">{stg.evidenceLevel || (isTamil ? 'சாஸ்திர ஆய்வு' : 'Classical Evidence')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PDF Export & Print Options (End of Short Report) */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-white to-amber-50 border-2 border-amber-300 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-amber-700" />
                  <h4 className="text-sm font-bold text-stone-900">
                    {isTamil ? "📥 அறிக்கையை PDF ஆக சேமிக்க / அச்சிட" : "📥 Save & Print Astrological Dossier (PDF Download)"}
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">2 Options Available</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handlePrintMinimal}
                  className="p-3.5 rounded-xl border border-amber-300 bg-white hover:bg-amber-50 text-left transition-all shadow-xs flex flex-col justify-between space-y-1 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5 group-hover:text-amber-700">
                      <FileText className="w-3.5 h-3.5 text-amber-600" />
                      {isTamil ? "1. சுருக்க அறிக்கை PDF (Minimal PDF)" : "1. Save Minimal Snapshot PDF"}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">1-2 Pages</span>
                  </div>
                  <p className="text-[10px] text-stone-600">
                    {isTamil ? "அடிப்படை லக்னம், ராசி, முக்கிய யோகங்கள் மற்றும் 12 பாவக சுருக்கம் மட்டும் சேமிக்க." : "Saves core birth chart, prominent yogas, 12 Bhavas snapshot, and current operating period."}
                  </p>
                </button>

                <button
                  onClick={handlePrintDetailed}
                  className="p-3.5 rounded-xl border-2 border-amber-400 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 hover:bg-amber-100 text-left transition-all shadow-xs flex flex-col justify-between space-y-1 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5 group-hover:text-amber-800">
                      <Crown className="w-3.5 h-3.5 text-amber-600" />
                      {isTamil ? "2. முழு மகா அறிக்கை PDF (Detailed Master)" : "2. Save Complete Master PDF"}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-bold">All 18 Chapters</span>
                  </div>
                  <p className="text-[10px] text-stone-600">
                    {isTamil ? "18 அத்தியாயங்கள், 16 வர்க்க சக்கரங்கள், ஷட்பலம், அஷ்டகவர்க்கம் மற்றும் முழு காலக்கோடுடன் சேமிக்க." : "Saves full multi-domain life dossier, 16 harmonic vargas, Shadbala, Ashtakavarga, and technical calculations."}
                  </p>
                </button>
              </div>
            </div>

            {/* Prompt to switch to Master Dossier */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-100/80 via-orange-50 to-amber-50 border border-amber-300 text-center space-y-3 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center mx-auto">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-stone-900">
                {isTamil ? "முழுமையான மகா ஜாதக வாழ்க்கை வழிகாட்டி அறிக்கையைப் பார்க்கவும்" : "Unlock Full Master Astrological Dossier (18 Chapters + Technical Appendix)"}
              </h4>
              <p className="text-xs text-stone-700 max-w-xl mx-auto">
                {isTamil
                  ? "உடல் ஆரோக்கியம், உயர்கல்வி வாய்ப்புகள், தொழில் பொற்காலம், பூமி யோகம், 16 வர்க்க சக்கரங்கள் மற்றும் ஷட்பல கணிதங்களை விரிவாக அறிய முழு அறிக்கைக்கு மாறவும்."
                  : "Explore detailed Health Vitality, Academic Mastery, Career Zeniths, Land/Property timing, 16 Divisional Charts, and Full Technical Calculations in our Master Edition."}
              </p>
              <button
                onClick={() => setReportTier("detailed")}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white font-bold text-xs shadow-md shadow-amber-500/20 hover:brightness-110 transition-all inline-flex items-center gap-2"
              >
                <span>{isTamil ? "முழு மகா அறிக்கையைத் திறக்கவும் (Master Dossier)" : "View Complete Master Report"}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* COMPREHENSIVE MASTER REPORT VIEW (FULL MULTI-PAGE DOSSIER) */}
        {/* ========================================================================= */}
        {viewMode === "algorithmic" && reportTier === "detailed" && (
          <div className="space-y-8">
            {/* PAGE 1: YOUR HOROSCOPE IN SIMPLE WORDS (CLIENT-FRIENDLY OVERVIEW) */}
            <div className="p-5 md:p-6 rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-amber-50/70 border-2 border-emerald-300 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base md:text-lg font-serif font-bold text-stone-900">
                    {isTamil ? "🟢 உங்கள் ஜாதகம் எளிய தமிழில் (ஆரம்ப நிலை சுருக்கம்)" : "🟢 Your Horoscope in Simple Words (Beginner Overview)"}
                  </h3>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
                  {isTamil ? "எளிய விளக்கம்" : "Plain Language"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs text-stone-700">
                <div className="p-3.5 rounded-2xl bg-white border border-emerald-200 shadow-2xs space-y-1">
                  <span className="font-bold text-emerald-900 uppercase text-[10px] block">
                    {isTamil ? "1. உங்கள் அடிப்படை இயல்பு & பலம்" : "1. Your Core Nature & Strength"}
                  </span>
                  <p className="leading-relaxed">
                    {isTamil
                      ? `நீங்கள் ${ascTamil} லக்னம் மற்றும் ${moonTamil} ராசியில் (${nakTamil} நட்சத்திரம்) பிறந்தவர். உங்கள் ஆளுமையின் மிகப்பெரிய பலம் உங்கள் மன உறுதி, ஒழுங்கு மற்றும் கூர்மையான சிந்தனைத்திறன்.`
                      : `Born with ${ascName} Ascendant and ${moonName} Moon (${nakName} nakshatra). Your natural disposition combines resilience, structured ambition, and intuitive discernment.`}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-amber-200 shadow-2xs space-y-1">
                  <span className="font-bold text-amber-900 uppercase text-[10px] block">
                    {isTamil ? "2. தற்போதைய காலக்கட்டம் எதை நோக்கி நகர்கிறது?" : "2. Where Your Current Life Phase Points"}
                  </span>
                  <p className="leading-relaxed">
                    {isTamil
                      ? `தற்போது நடக்கும் ${execSummary?.currentLifePhase?.activeMahadasha || 'தசா'} தசை உங்கள் தொழில் மற்றும் தனிப்பட்ட முன்னேற்றத்தில் புதிய அடித்தளத்தை உருவாக்குகிறது.`
                      : `Your active ${execSummary?.currentLifePhase?.activeMahadasha || 'Mahadasha'} period focuses attention on consolidating professional authority, financial stability, and purposeful life direction.`}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-purple-200 shadow-2xs space-y-1">
                  <span className="font-bold text-purple-900 uppercase text-[10px] block">
                    {isTamil ? "3. நீங்கள் கவனிக்க வேண்டிய முக்கிய விஷயம்" : "3. Key Focus & Harmony Advice"}
                  </span>
                  <p className="leading-relaxed">
                    {isTamil
                      ? "வேலைப்பளு மற்றும் மன அழுத்தத்தைத் தவிர்த்து, சீரான உணவு முறை மற்றும் ஆன்மீக தியானத்தை அன்றாடம் கடைப்பிடிப்பது உங்களுக்கு முழுமையான நன்மைகளைத் தரும்."
                      : "Maintain healthy work-life equilibrium, avoid impulsive financial speculations during adverse transits, and observe grounding daily wellness habits."}
                  </p>
                </div>
              </div>
            </div>

            {/* CHAPTER 0: EXECUTIVE SUMMARY */}
            {(activeTab === "all" || activeTab === "execSummary") && execSummary && (
              <div className="p-5 md:p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-100/30 to-purple-500/10 border-2 border-amber-300 shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-300/80 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-700" />
                    <h3 className="text-base md:text-lg font-serif font-bold text-amber-950">
                      {isTamil ? "0. மகா ஜாதக நிர்வாக சுருக்கம் (Executive Summary)" : "0. Report Executive Summary"}
                    </h3>
                  </div>
                  <CertaintyBadge type="timing" isTamil={isTamil} />
                </div>

                {/* Grid of Summary Modules */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {/* Core Profile */}
                  <div className="p-3.5 rounded-2xl bg-white/90 border border-amber-200 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">
                        {isTamil ? "அடிப்படை கட்டமைப்பு" : "Core Astrological Profile"}
                      </span>
                      <CertaintyBadge type="calculated" isTamil={isTamil} />
                    </div>
                    <div className="text-xs space-y-0.5 text-stone-800">
                      <div><strong className="text-stone-900">{isTamil ? "லக்னம்:" : "Lagna:"}</strong> {execSummary.coreProfile.lagna}</div>
                      <div><strong className="text-stone-900">{isTamil ? "ராசி / நட்சத்திரம்:" : "Moon / Star:"}</strong> {execSummary.coreProfile.moonSign} ({execSummary.coreProfile.nakshatra})</div>
                      <div><strong className="text-stone-900">{isTamil ? "சூரிய ராசி:" : "Sun Sign:"}</strong> {execSummary.coreProfile.sunSign}</div>
                      <div><strong className="text-stone-900">{isTamil ? "ஆத்மகாரகன்:" : "Atmakaraka:"}</strong> {execSummary.coreProfile.atmakaraka}</div>
                    </div>
                  </div>

                  {/* Current Life Phase */}
                  <div className="p-3.5 rounded-2xl bg-white/90 border border-purple-200 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-purple-800 tracking-wider">
                        {isTamil ? "தற்போதைய வாழ்வியல் கட்டம்" : "Current Operating Life Phase"}
                      </span>
                      <CertaintyBadge type="timing" isTamil={isTamil} />
                    </div>
                    <div className="text-xs space-y-0.5 text-stone-800">
                      <div><strong className="text-stone-900">{isTamil ? "நடப்பு தசை:" : "Active Dasha:"}</strong> {execSummary.currentLifePhase.activeMahadasha} ({execSummary.currentLifePhase.ageRange} yrs)</div>
                      <div><strong className="text-stone-900">{isTamil ? "நடப்பு புக்தி:" : "Active Antardasha:"}</strong> {execSummary.currentLifePhase.activeAntardasha}</div>
                      <div className="text-[11px] text-stone-600 italic">{execSummary.currentLifePhase.theme}</div>
                    </div>
                  </div>

                  {/* Birth Time Reliability */}
                  <div className={`p-3.5 rounded-2xl border shadow-2xs space-y-1.5 ${
                    execSummary.birthTimeReliability.status.includes("Boundary") ? "bg-amber-50/90 border-amber-300" : "bg-white/90 border-emerald-200"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-stone-700 tracking-wider">
                        {isTamil ? "பிறப்பு நேர உணர்திறன்" : "Birth-Time Sensitivity"}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        execSummary.birthTimeReliability.status.includes("Boundary") ? "bg-amber-200 text-amber-900" : "bg-emerald-100 text-emerald-900"
                      }`}>
                        {execSummary.birthTimeReliability.status}
                      </span>
                    </div>
                    <div className="text-xs space-y-0.5 text-stone-800">
                      <div><strong className="text-stone-900">{isTamil ? "லக்ன பாகை:" : "Lagna Degree:"}</strong> {execSummary.birthTimeReliability.lagnaDegree}</div>
                      <div className="text-[10px] text-stone-600">{execSummary.birthTimeReliability.d60Sensitivity}</div>
                      <div className="text-[10px] text-stone-600">{execSummary.birthTimeReliability.d9Sensitivity}</div>
                    </div>
                  </div>
                </div>

                {/* Strongest Themes & Next Windows */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                  <div className="p-3.5 rounded-2xl bg-white/90 border border-amber-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-amber-900 tracking-wider">
                        {isTamil ? "முதன்மை சாஸ்திர யோக பலன்கள்" : "Strongest Natal Astrological Themes"}
                      </span>
                      <CertaintyBadge type="traditional" isTamil={isTamil} />
                    </div>
                    <ul className="text-xs space-y-1 text-stone-800 list-disc list-inside">
                      {execSummary.strongestThemes.map((theme, idx) => (
                        <li key={idx} className="font-medium text-stone-900">{theme}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/90 border border-emerald-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-emerald-900 tracking-wider">
                        {isTamil ? "அடுத்த முக்கிய சுப காலக்கட்டங்கள்" : "Next Important Candidate Windows"}
                      </span>
                      <CertaintyBadge type="timing" isTamil={isTamil} />
                    </div>
                    <div className="space-y-1">
                      {execSummary.nextImportantWindows.map((win, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-emerald-50/50 border border-emerald-100">
                          <span className="font-bold text-emerald-950">{win.domain}</span>
                          <span className="font-mono text-stone-700">{win.window}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Key Cautions */}
                <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs space-y-1 text-amber-950">
                  <strong className="block text-[10px] uppercase font-bold text-amber-900">
                    {isTamil ? "முக்கிய பாரம்பரிய முன்னெச்சரிக்கை வழிகாட்டுதல்:" : "Key Traditional Astrological Considerations:"}
                  </strong>
                  {execSummary.keyCautions.map((caution, idx) => (
                    <p key={idx} className="leading-relaxed text-stone-800 text-[11px]">• {caution}</p>
                  ))}
                </div>
              </div>
            )}

            {/* CHAPTER 1: Core Astrological Configuration */}
            {(activeTab === "all" || activeTab === "blueprint") && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-amber-300 pb-2">
                  <h3 className="text-base font-serif font-bold text-amber-900 flex items-center gap-2">
                    <Compass className="w-4 h-4 text-amber-600" />
                    {isTamil ? "1. மூல ஜாதக கட்டமைப்பு & ஆன்ம ஆளுமை" : "1. Natal Blueprint, Solar Signification & Jaimini Atmakaraka"}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono font-bold">Chapter 1</span>
                </div>

                {/* Birth-Data Confidence Banner */}
                <div className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                  birthDataConfidence.boundaryProximityAlert ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-stone-50 border-stone-200 text-stone-700'
                }`}>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <span className="font-bold">{isTamil ? "பிறப்பு நேர துல்லிய சரிபார்ப்பு:" : "Birth-Data Confidence & Boundary Status:"} </span>
                      <span>{birthDataConfidence.boundaryNotes}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-stone-500 font-mono">
                    <span>{birthDataConfidence.d60Sensitivity}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-sm space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-amber-700">
                      {isTamil ? "ஜென்ம லக்னம் (Ascendant)" : "Ascendant (Lagna)"}
                    </span>
                    <h4 className="text-lg font-bold text-stone-900">{isTamil ? ascTamil : ascName}</h4>
                    <p className="text-xs text-stone-600">
                      {isTamil 
                        ? "உடலமைப்பு, மன உறுதி, வெளித்தோற்றம் மற்றும் வாழ்வின் முதன்மையான அணுகுமுறையை நிர்ணயிக்கிறது." 
                        : "Determines physical constitution, vital endurance, temperament, and societal disposition."}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-sm space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-purple-700">
                      {isTamil ? "ஜென்ம ராசி & நட்சத்திரம்" : "Moon Sign & Nakshatra"}
                    </span>
                    <h4 className="text-lg font-bold text-stone-900">{isTamil ? `${moonTamil} - ${nakTamil}` : `${moonName} - ${nakName}`}</h4>
                    <p className="text-xs text-stone-600">
                      {isTamil 
                        ? `பாதம்: ${nakPada} | அதிபதி: ${nakRuler} | ஆதிக்கம்: மன அமைதி, சிந்தனை ஓட்டம் மற்றும் உள்ளுணர்வு.` 
                        : `Pada: ${nakPada} | Ruler: ${nakRuler} | Deep subconscious mind, psychic intuition, and emotional peace.`}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-sm space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-rose-700">
                      {isTamil ? "சூரிய ராசி & ஆளுமை" : "Sun Sign & Solar Signification"}
                    </span>
                    <h4 className="text-lg font-bold text-stone-900">{isTamil ? sunTamil : sunName}</h4>
                    <p className="text-xs text-stone-600">
                      {isTamil 
                        ? "ஆளுமைத் திறன், கௌரவம், தந்தையின் வழி ஆசி மற்றும் தலைமைப் பண்பு (நைசர்கிக ஆத்மகாரகன்)." 
                        : "Leadership capability, self-worth, paternal karma, and vocational sovereignty (Naisargika Atmakaraka)."}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-indigo-200 shadow-sm space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-indigo-700">
                      {isTamil ? "ஜைமினி ஆத்மகாரகன் (Soul Planet)" : "Jaimini Chara Atmakaraka"}
                    </span>
                    <h4 className="text-lg font-bold text-stone-900">
                      {atmakaraka ? `${atmakaraka.planet} (${atmakaraka.sign})` : "Calculated"}
                    </h4>
                    <p className="text-xs text-stone-600">
                      {atmakaraka 
                        ? (isTamil ? (atmakaraka.spiritualSignificationTa || atmakaraka.spiritualSignification || "ஆன்ம வளர்ச்சி மற்றும் தர்ம கடமைகள்.") : (atmakaraka.spiritualSignification || "Innermost soul desire, karmic evolution and spiritual destiny."))
                        : (isTamil ? "ஜாதகத்தில் அதிக பாகை பெற்ற ஆன்ம காரக கிரகம்." : "Planet holding the highest degree in its sign representing soul purpose.")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* CHAPTER 2: Detected Auspicious Vedic Yogas */}
            {(activeTab === "all" || activeTab === "yogas") && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-amber-300 pb-2">
                  <h3 className="text-base font-serif font-bold text-amber-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-600" />
                    {isTamil ? "2. ஜாதகத்தில் அமைந்துள்ள விசேஷ சுப யோகங்கள்" : "2. Detected Auspicious Vedic Yogas & Power Alignments"}
                  </h3>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold border border-amber-300">
                    {yogas.length} {isTamil ? "யோகங்கள் கண்டறியப்பட்டன" : "Yogas Active"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {yogas.map((yoga, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white border border-amber-200 space-y-2 hover:border-amber-400 transition-all shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-stone-900 text-sm md:text-base">
                            {yoga.name}
                          </h4>
                          <span className="text-[10px] text-amber-700 font-medium">
                            {isTamil ? "தொடர்புடைய கிரகங்கள்: " : "Planets: "} {yoga.planetsInvolved}
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold border border-amber-300 shrink-0">
                          {yoga.category}
                        </span>
                      </div>
                      <p className="text-xs text-stone-700 leading-relaxed pt-1">
                        {yoga.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CHAPTER 3: Exhaustive 12 House Predictions */}
            {(activeTab === "all" || activeTab === "bhavas") && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-amber-300 pb-2">
                  <h3 className="text-base font-serif font-bold text-amber-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {isTamil ? "3. பன்னிரண்டு பாவக முழு பலன்கள் (லக்ன ரீதியான துல்லிய ஆய்வு)" : "3. Complete 12 Bhavas (Houses) Comprehensive Breakdown"}
                  </h3>
                  <span className="text-[11px] text-stone-600 font-medium">
                    {isTamil ? `லக்னம்: ${ascTamil}` : `Ascendant: ${ascName}`}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bhavas.map((b) => (
                    <div
                      key={b.num}
                      className="p-4 rounded-2xl bg-white border border-amber-200 hover:border-amber-400 transition-all space-y-2.5 flex flex-col justify-between shadow-sm"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-amber-900">
                            {b.title}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-mono font-semibold border border-amber-200">
                            {b.sanskrit}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 font-medium">
                            {isTamil ? "ராசி: " : "Sign: "}{isTamil ? b.signTamil : b.signName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 font-medium">
                            {isTamil ? "அதிபதி: " : "Lord: "}{isTamil ? b.lordTamil : b.lordName} ({isTamil ? `${b.lordHouse}-ம் வீடு` : `H${b.lordHouse}`})
                          </span>
                        </div>

                        {/* Occupants Badge */}
                        <div className="text-[10px] text-stone-500">
                          <span className="font-semibold text-stone-700">{isTamil ? "அமர்ந்துள்ள கிரகங்கள்: " : "Occupants: "}</span>
                          {b.occupants && b.occupants.length > 0 ? (
                            <span className="text-amber-800 font-semibold">{b.occupants.join(", ")}</span>
                          ) : (
                            <span className="text-stone-400 italic">{isTamil ? "கிரகங்கள் இல்லை (தனித்த பாவம்)" : "None (Aspect governed)"}</span>
                          )}
                        </div>

                        <p className="text-[11px] text-stone-700 leading-relaxed pt-1">
                          {b.prediction}
                        </p>
                      </div>

                      {/* Classical Bhava Status */}
                      <div className="pt-2 border-t border-amber-100 flex justify-between items-center text-[10px]">
                        <span className="text-stone-600">{isTamil ? "பாவக பல நிலை:" : "Bhava Status:"}</span>
                        <span className="font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                          {b.classicalStatus || (isTamil ? "சுப நிலை" : "Auspicious")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CHAPTER 4: Traditional Astrological Health Tendencies & Preventive Wellness */}
            {(activeTab === "all" || activeTab === "health") && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-300 pb-2">
                  <h3 className="text-base font-serif font-bold text-emerald-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    {isTamil ? "4. பாரம்பரிய ஜோதிட உடல் சமநிலை & தடுப்பு நலன்" : "4. Traditional Astrological Health Tendencies & Preventive Wellness"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedReasoningDomain("health")}
                      className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isTamil ? "சான்றுகள்" : "Why this prediction?"}</span>
                    </button>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
                      {domain.health?.constitution || domain.health?.longevity || (isTamil ? "பாரம்பரிய ஆய்வு" : "Classical Model")}
                    </span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-sm space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-emerald-800">
                        {isTamil ? "பாரம்பரிய உடல் நலம் & ஆரோக்கியக் கண்ணோட்டம்" : "Traditional Vitality Correspondences"}
                      </span>
                      <p className="text-xs text-stone-700 leading-relaxed">
                        {domain.health?.summary}
                      </p>

                      {/* Evidence Ledger Factors */}
                      {domain.health?.supportingFactors && domain.health.supportingFactors.length > 0 && (
                        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1 mt-2">
                          <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
                            {isTamil ? "ஆரோக்கிய சாதக காரணிகள்:" : "Supporting Vitality Factors:"}
                          </span>
                          <ul className="space-y-1 text-xs text-emerald-950">
                            {domain.health.supportingFactors.map((fac, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{fac}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {domain.health?.counterIndicators && domain.health.counterIndicators.length > 0 && (
                        <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1 mt-2">
                          <span className="text-[10px] font-bold text-rose-900 uppercase tracking-wider block">
                            {isTamil ? "கவனிக்க வேண்டிய சவால்கள்:" : "Counter-Indicators & Vulnerabilities:"}
                          </span>
                          <ul className="space-y-1 text-xs text-rose-950">
                            {domain.health.counterIndicators.map((fac, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                                <span>{fac}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200">
                      <span className="text-xs font-bold text-amber-900">
                        {isTamil ? "பாரம்பரிய உடலியல் மண்டல தொடர்பு & வாழ்க்கைமுறை கவனம்" : "Traditional Body-Area & Wellness Associations"}
                      </span>
                      <ul className="space-y-1 text-xs text-stone-700">
                        {domain.health?.sensitiveOrgans?.map((org, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>{org}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="pt-2 border-t border-emerald-200/60 text-[11px] text-emerald-900">
                        <span className="font-semibold text-stone-600">{isTamil ? "தினசரி ஆரோக்கிய பழக்கம்: " : "Daily Regimen: "}</span>
                        {domain.health?.dailyRegimen}
                      </div>
                    </div>
                  </div>

                  {/* Statutory Medical Non-Diagnosis Notice */}
                  <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-300 text-xs text-amber-950 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <p className="leading-relaxed text-[11px]">
                      <strong>{isTamil ? "சட்டரீதியான மருத்துவ அறிவிப்பு:" : "Statutory Health Notice:"}</strong> {isTamil
                        ? "இந்த ஆய்வு பாரம்பரிய வேத ஜோதிட உடலமைப்பு விதிகளை அடிப்படையாகக் கொண்டது. இது எவ்வித மருத்துவ நோயறிதலோ அல்லது மருத்துவ சிகிச்சையோ அல்ல. உடல்நலக் குறைபாடுகளுக்கு எப்போதும் தகுதிவாய்ந்த மருத்துவரை அணுகவும்."
                        : "This assessment reflects traditional Ayurvedic and classical astrological indications. It is not a medical diagnosis, clinical prognosis, or treatment recommendation. Always consult qualified healthcare professionals for medical advice."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* CHAPTER 5: Studies, Higher Education & Competitive Exams */}
            {(activeTab === "all" || activeTab === "studies") && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-cyan-300 pb-2">
                  <h3 className="text-base font-serif font-bold text-cyan-900 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-cyan-600" />
                    {isTamil ? "5. உயர்கல்வி, ஆராய்ச்சித் துறை & போட்டித் தேர்வு யோகம்" : "5. Higher Studies, Scholastic Genius & Competitive Exams"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedReasoningDomain("education")}
                      className="px-2.5 py-1 rounded-xl bg-cyan-50 text-cyan-800 border border-cyan-300 hover:bg-cyan-100 text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                      <span>{isTamil ? "சான்றுகள்" : "Why this prediction?"}</span>
                    </button>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-900 font-bold border border-cyan-300">
                      {domain.studies?.evidenceLevel || domain.studies?.classicalStatus || (isTamil ? "சாஸ்திர ஆய்வு" : "Classical Evidence")}
                    </span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-cyan-200 shadow-sm space-y-4">
                  <p className="text-xs text-stone-700 leading-relaxed">
                    {domain.studies?.summary}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="p-3.5 rounded-xl bg-cyan-50/50 border border-cyan-200 space-y-2">
                      <span className="text-xs font-bold text-cyan-900">
                        {isTamil ? "அபார தேர்ச்சி தரும் கல்வித் துறைகள்" : "Recommended Higher Academic Pathways"}
                      </span>
                      <ul className="space-y-1.5 text-xs text-stone-700">
                        {domain.studies?.recommendedFields?.map((fld, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                            <span>{fld}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Evidence Ledger Studies */}
                      {domain.studies?.supportingFactors && domain.studies.supportingFactors.length > 0 && (
                        <div className="p-2.5 rounded-lg bg-cyan-100/60 border border-cyan-200 text-xs text-cyan-950 mt-2">
                          <span className="font-bold text-[10px] uppercase block text-cyan-900">{isTamil ? "கல்வி சாதக அமைப்புகள்:" : "Scholastic Catalysts:"}</span>
                          <span className="text-[11px]">{domain.studies.supportingFactors.join("; ")}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-3.5 rounded-xl bg-cyan-50/50 border border-cyan-200 space-y-2 flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold text-amber-900">
                          {isTamil ? "போட்டித் தேர்வுகள் & நுழைவுத் தேர்வு வாய்ப்பு" : "Competitive & Entrance Exam Destiny"}
                        </span>
                        <p className="text-xs text-stone-700 mt-2">
                          {domain.studies?.competitiveExamOutlook}
                        </p>
                        {domain.studies?.counterIndicators && domain.studies.counterIndicators.length > 0 && (
                          <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-900 mt-2">
                            <span className="font-bold text-[10px] uppercase block text-rose-800">{isTamil ? "கவனிக்க வேண்டிய தடைகள்:" : "Exam Vulnerabilities:"}</span>
                            <span>{domain.studies.counterIndicators.join("; ")}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-500 italic">
                        {isTamil ? "UPSC, GATE, GRE, CA, மெடிக்கல் மற்றும் வங்கித் தேர்வுகளுக்கு உகந்தது." : "Auspicious alignment for Civil Services, Engineering, CA, Medical & Advanced Certifications."}
                      </span>
                    </div>
                  </div>

                  {careerPathway.examOutlook && (
                    <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-300 space-y-1.5">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{isTamil ? "போட்டித் தேர்வு & அரசு வேலை கணித ஆய்வு:" : "Competitive Exam & Govt Service Diagnostic:"}</span>
                      </div>
                      <p className="text-xs text-stone-800 leading-relaxed font-medium">
                        {careerPathway.examOutlook}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CHAPTER 6: Career, Vocations & Executive Leadership */}
            {(activeTab === "all" || activeTab === "career") && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-purple-300 pb-2">
                  <h3 className="text-base font-serif font-bold text-purple-900 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-purple-600" />
                    {isTamil ? "6. தொழில் சாம்ராஜ்யம், உத்தியோகம் & தலைமைப் பொற்காலம்" : "6. Career Domain, Vocations & Executive Leadership"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedReasoningDomain("career")}
                      className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-800 border border-purple-300 hover:bg-purple-100 text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>{isTamil ? "சான்றுகள்" : "Why this prediction?"}</span>
                    </button>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold border border-purple-300">
                      {domain.career?.zenithAgeRange}
                    </span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-purple-200 shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-3 rounded-xl bg-purple-50 border border-purple-200">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-purple-800">
                        {isTamil ? "முதன்மை தொழில் ஆளுமை" : "Primary Vocational Dominance"}
                      </span>
                      <h4 className="text-sm md:text-base font-bold text-stone-900">{domain.career?.domain}</h4>
                    </div>
                    <span className="text-xs font-mono font-bold text-purple-900 px-3 py-1 rounded-lg bg-purple-100 border border-purple-300 shrink-0">
                      {isTamil ? (domain.career?.leadershipStatus || "தலைமைத் தகுதி: 10-ம் அதிபதி & சூரியன்/சனி ஆய்வு") : (domain.career?.leadershipStatus || "Leadership Status: Evaluated via 10th Lord & Sun/Saturn")}
                    </span>
                  </div>

                  <p className="text-xs text-stone-700 leading-relaxed">
                    {domain.career?.summary}
                  </p>

                  {/* Career Evidence Ledger Factors */}
                  {((domain.career?.supportingFactors && domain.career.supportingFactors.length > 0) || (domain.career?.counterIndicators && domain.career.counterIndicators.length > 0)) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {domain.career?.supportingFactors && domain.career.supportingFactors.length > 0 && (
                        <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 space-y-1">
                          <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block">
                            {isTamil ? "தொழில் சாதக அம்சங்கள்:" : "Career Catalysts & Strengths:"}
                          </span>
                          <span className="text-xs text-stone-700 leading-relaxed">
                            {domain.career.supportingFactors.join("; ")}
                          </span>
                        </div>
                      )}
                      {domain.career?.counterIndicators && domain.career.counterIndicators.length > 0 && (
                        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
                          <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                            {isTamil ? "கவனிக்க வேண்டிய சவால்கள்:" : "Professional Challenges & Delays:"}
                          </span>
                          <span className="text-xs text-stone-700 leading-relaxed">
                            {domain.career.counterIndicators.join("; ")}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Multi-Pathway Career Vocational Framework */}
                  {careerPathway?.careerPathways && (
                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                        {isTamil ? "நான்கு பரிமாண தொழில் வாய்ப்புகள் & சாதக நிலைகள்:" : "Multi-Pathway Vocational Matrix & Evidence:"}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(careerPathway.careerPathways).map(([key, pway]) => (
                          <div key={key} className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200/80 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-purple-950">{pway.title}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 text-purple-900 font-bold border border-purple-300 font-mono">
                                {pway.alignment || pway.tier}
                              </span>
                            </div>
                            <span className="text-[10px] text-purple-800 font-semibold block">{pway.tier}</span>
                            {pway.supportingFactors?.length > 0 && (
                              <p className="text-[11px] text-stone-700 leading-relaxed">
                                <span className="font-semibold text-emerald-800">{isTamil ? "சாதக அமைப்புகள்: " : "Catalysts: "}</span>
                                {pway.supportingFactors.join("; ")}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {careerPathway.businessVerdict && (
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 space-y-1.5">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                        <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{isTamil ? "வியாபார யோகம் & சுயதொழில் கணித ஆய்வு:" : "Vyapara Yoga & Business Destiny Analysis:"}</span>
                      </div>
                      <p className="text-xs text-stone-800 leading-relaxed font-medium">
                        {careerPathway.businessVerdict}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CHAPTER 7: Property, Real Estate & Vehicles */}
            {(activeTab === "all" || activeTab === "property") && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-amber-300 pb-2">
                  <h3 className="text-base font-serif font-bold text-amber-900 flex items-center gap-2">
                    <Home className="w-4 h-4 text-amber-600" />
                    {isTamil ? "7. பூமி யோகம், சொந்த வீடு, நிலம் & சொகுசு வாகனங்கள்" : "7. Real Estate, Landed Properties & Luxury Vehicles"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedReasoningDomain("property")}
                      className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>{isTamil ? "சான்றுகள்" : "Why this prediction?"}</span>
                    </button>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                      {domain.property?.outlook}
                    </span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-amber-200 shadow-sm space-y-4">
                  <p className="text-xs text-stone-700 leading-relaxed">
                    {domain.property?.summary}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200 space-y-1.5">
                      <span className="text-xs font-bold text-amber-800">
                        {isTamil ? "பூமி காரக பலம் (செவ்வாய்)" : "Bhoomi Karaka Fortitude (Mars)"}
                      </span>
                      <p className="text-xs text-stone-700">
                        {isTamil ? "விவசாய நிலம், வணிக வளாகங்கள் அல்லது சொந்த மனை வாங்குவதில் அனுகூலம்." : "Favorable conditions for acquiring commercial real estate, residential plots, and constructed villas."}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200 space-y-1.5">
                      <span className="text-xs font-bold text-purple-800">
                        {isTamil ? "வாகன காரக பலம் (சுக்கிரன்)" : "Vahana Karaka Luxuries (Venus)"}
                      </span>
                      <p className="text-xs text-stone-700">
                        {domain.property?.vehicleLuxuries}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CHAPTER 8: Leadership, Public Service & Governance Themes */}
            {(activeTab === "all" || activeTab === "politics") && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-rose-300 pb-2">
                  <h3 className="text-base font-serif font-bold text-rose-900 flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-rose-600" />
                    {isTamil ? "8. தலைமைப் பண்புகள், மக்கள் சேவை & நிர்வாக ஆளுமை" : "8. Leadership, Public Service & Governance Themes"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedReasoningDomain("politics")}
                      className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-900 border border-rose-300 hover:bg-rose-100 text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                      <span>{isTamil ? "சான்றுகள்" : "Why this prediction?"}</span>
                    </button>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 font-bold border border-rose-300">
                      {isTamil ? `நிலை: ${domain.politics?.alignment || 'பாரம்பரிய பலம்'}` : `Alignment: ${domain.politics?.alignment || 'Classical Indicators'}`}
                    </span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-rose-200 shadow-sm space-y-4">
                  {/* Suitability Badge */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-xl bg-rose-50/50 border border-rose-200">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-rose-700">
                        {isTamil ? "சமுதாய வழிகாட்டல் & நிர்வாக ஆளுமை நிலை" : "Public Service & Governance Aptitude"}
                      </span>
                      <h4 className="text-sm md:text-base font-bold text-stone-900">{domain.politics?.category}</h4>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-stone-500 block">{isTamil ? "சமுதாயப் பொறுப்பு நிலை" : "Public Stewardship Alignment"}</span>
                        <span className="text-xs font-bold text-emerald-700">{domain.politics?.alignment || (isTamil ? "உயர் அனுகூலம்" : "Favorable Alignment")}</span>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-rose-100 border border-rose-300 flex items-center justify-center font-bold text-rose-900 text-xs">
                        {domain.politics?.alignment || (isTamil ? "சாஸ்திர பலம்" : "Evaluated")}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-stone-700 leading-relaxed">
                    {domain.politics?.summary}
                  </p>

                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-amber-900">
                      {isTamil ? "பரிந்துரைக்கப்படும் தலைமைப் பாதைகள்" : "Optimal Public Leadership & Governance Pathways"}
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {domain.politics?.recommendedPathways?.map((pway, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-rose-50/40 border border-rose-200/80 flex items-center gap-2 text-xs text-stone-700">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{pway}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CHAPTER 9: Marriage, Partner & Progeny Karma */}
            {(activeTab === "all" || activeTab === "relationships") && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-pink-300 pb-2">
                  <h3 className="text-base font-serif font-bold text-pink-900 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-600" />
                    {isTamil ? "9. களத்திர பாவம், திருமண இணக்கம் & குழந்தைகள் யோகம்" : "9. Marriage Synergy, Spouse Profile & Progeny Karma"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedReasoningDomain("marriage")}
                      className="px-2.5 py-1 rounded-xl bg-pink-50 text-pink-900 border border-pink-300 hover:bg-pink-100 text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                      <span>{isTamil ? "சான்றுகள்" : "Why this prediction?"}</span>
                    </button>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-900 font-bold border border-pink-300">
                      {marriagePathway.marriageType || (isTamil ? "காந்தர்வ விவாக யோகம்" : "Self-Chosen Marriage")}
                    </span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-pink-200 shadow-sm space-y-3">
                  <div className="p-3 rounded-xl bg-pink-50/50 border border-pink-200">
                    <span className="text-xs font-bold text-pink-800">{isTamil ? "வாழ்க்கைத் துணையின் சுபாவம்: " : "Spouse Character Profile: "}</span>
                    <span className="text-xs text-stone-700">{domain.relationship?.spouseProfile}</span>
                  </div>

                  {marriagePathway.verdict && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-pink-50 via-rose-50 to-amber-50 border border-pink-300 space-y-3">
                      <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                        <Heart className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{isTamil ? "களத்திர பாவக ஆய்வு & திருமண பந்த கணிதம் (Marital Diagnostics):" : "7th House & Marriage Astrological Diagnostic:"}</span>
                      </div>
                      <p className="text-xs text-stone-800 leading-relaxed font-medium whitespace-pre-line">
                        {marriagePathway.verdict}
                      </p>
                      {marriagePathway.primeWindows && marriagePathway.primeWindows.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-pink-200">
                          <span className="text-[11px] font-bold text-pink-900 block">
                            {isTamil ? "முக்கிய விவாக சுப தசா சாளரங்கள் (Prime Candidate Windows):" : "Prime Matrimonial Candidate Windows:"}
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {marriagePathway.primeWindows.map((win, wIdx) => (
                              <div key={wIdx} className="p-2.5 rounded-xl bg-white/90 border border-pink-200 space-y-1 shadow-2xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pink-100 text-pink-900 border border-pink-300">
                                    {isTamil ? `சாளரம் ${wIdx + 1}` : `Prime Window ${wIdx + 1}`}
                                  </span>
                                  <span className="text-[10px] font-mono font-bold text-emerald-800">
                                    {win.calendarYears}
                                  </span>
                                </div>
                                <div className="text-xs font-bold text-stone-900">
                                  {isTamil ? `${win.mahadashaTamil || win.mahadashaLord} தசை - ${win.subTamil || win.subLord} புக்தி` : `${win.mahadashaLord} MD - ${win.subLord} AD`}
                                </div>
                                <div className="text-[10px] text-stone-600 font-mono">
                                  {isTamil ? `வயது: ${win.startAge.toFixed(1)} - ${win.endAge.toFixed(1)}` : `Ages: ${win.startAge.toFixed(1)} - ${win.endAge.toFixed(1)}`}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-stone-700">
                        <span className="font-bold text-rose-800">{isTamil ? "முதன்மை விவாக காலம்:" : "Primary Marriage Timeline:"}</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 font-mono font-bold border border-rose-300">
                          {marriagePathway.auspiciousAgeRange}
                        </span>
                        {marriagePathway.calendarYears && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-mono font-bold border border-emerald-300">
                            {marriagePathway.calendarYears}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-stone-700 leading-relaxed">
                    {domain.relationship?.summary}
                  </p>
                </div>
              </div>
            )}

            {/* CHAPTER 10: Foreign Travel, Settlement & Moksha */}
            {(activeTab === "all" || activeTab === "foreign") && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-indigo-300 pb-2">
                  <h3 className="text-base font-serif font-bold text-indigo-900 flex items-center gap-2">
                    <Globe2 className="w-4 h-4 text-indigo-600" />
                    {isTamil ? "10. அயல்நாட்டு வாழ்க்கை, உலகப் பயணம் & ஆன்ம முக்தி" : "10. Foreign Travel, Overseas Settlement & Moksha Sadhana"}
                  </h3>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 font-bold border border-indigo-300">
                    {domain.foreignMoksha?.foreignChance}
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-indigo-200 shadow-sm space-y-3">
                  <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-200">
                    <span className="text-xs font-bold text-indigo-800">{isTamil ? "ஆன்மீக மேன்மை: " : "Spiritual Transcendence: "}</span>
                    <span className="text-xs text-stone-700">{domain.foreignMoksha?.spiritualElevation}</span>
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed">
                    {domain.foreignMoksha?.summary}
                  </p>
                </div>
              </div>
            )}

            {/* CHAPTER 11: Ayurvedic Dosha & Health Vitality */}
            {(activeTab === "all" || activeTab === "dosha") && (
              <div className="space-y-4">
                <h3 className="text-base font-serif font-bold text-amber-900 flex items-center gap-2 border-b border-amber-300 pb-2">
                  <Flame className="w-4 h-4 text-orange-600" />
                  {isTamil ? "11. ஆயுர்வேத திரிதோஷ சமநிலை & ஆரோக்கிய வழிகாட்டல்" : "11. Ayurvedic Tridosha Balance & Somatic Health Guidance"}
                </h3>

                <div className="p-5 rounded-2xl bg-white border border-amber-200 shadow-sm space-y-4">
                  {/* Elemental Distribution Summary */}
                  {dosha.elementalDistribution && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200">
                        <span className="text-[10px] uppercase font-bold text-orange-800 block">{isTamil ? "நெருப்பு (Fire/Pitta)" : "Fire Elements"}</span>
                        <span className="text-sm font-bold text-stone-900">{dosha.elementalDistribution.fire} {isTamil ? "கிரகங்கள்" : "Grahas"}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                        <span className="text-[10px] uppercase font-bold text-emerald-800 block">{isTamil ? "காற்று (Air/Vata)" : "Air Elements"}</span>
                        <span className="text-sm font-bold text-stone-900">{dosha.elementalDistribution.air} {isTamil ? "கிரகங்கள்" : "Grahas"}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-200">
                        <span className="text-[10px] uppercase font-bold text-cyan-800 block">{isTamil ? "நீர் (Water/Kapha)" : "Water Elements"}</span>
                        <span className="text-sm font-bold text-stone-900">{dosha.elementalDistribution.water} {isTamil ? "கிரகங்கள்" : "Grahas"}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                        <span className="text-[10px] uppercase font-bold text-amber-800 block">{isTamil ? "நிலம் (Earth/Kapha)" : "Earth Elements"}</span>
                        <span className="text-sm font-bold text-stone-900">{dosha.elementalDistribution.earth} {isTamil ? "கிரகங்கள்" : "Grahas"}</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Vata */}
                    <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-emerald-900">
                          {isTamil ? "வாத தோஷம் (Vata)" : "Vata Dosha (Air/Ether)"}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-800">{dosha.vata?.status || "Balanced"}</span>
                      </div>
                      <p className="text-[11px] text-stone-700 leading-relaxed mt-1">
                        {dosha.vata?.guidance}
                      </p>
                    </div>

                    {/* Pitta */}
                    <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-rose-900">
                          {isTamil ? "பித்த தோஷம் (Pitta)" : "Pitta Dosha (Fire/Agni)"}
                        </span>
                        <span className="text-xs font-mono font-bold text-rose-800">{dosha.pitta?.status || "Balanced"}</span>
                      </div>
                      <p className="text-[11px] text-stone-700 leading-relaxed mt-1">
                        {dosha.pitta?.guidance}
                      </p>
                    </div>

                    {/* Kapha */}
                    <div className="p-3.5 rounded-xl bg-cyan-50/50 border border-cyan-200 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-cyan-900">
                          {isTamil ? "கப தோஷம் (Kapha)" : "Kapha Dosha (Water/Earth)"}
                        </span>
                        <span className="text-xs font-mono font-bold text-cyan-800">{dosha.kapha?.status || "Balanced"}</span>
                      </div>
                      <p className="text-[11px] text-stone-700 leading-relaxed mt-1">
                        {dosha.kapha?.guidance}
                      </p>
                    </div>
                  </div>

                  {/* Ayurvedic Disclaimer */}
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-[10px] text-stone-600">
                    <span className="font-semibold">{isTamil ? "சாஸ்திரக் குறிப்பு:" : "Traditional Disclaimer:"} </span>
                    {dosha.disclaimer || (isTamil ? "இந்த ஆயுர்வேத தோஷ பகுப்பாய்வு பாரம்பரிய ஜோதிட தத்துவத்தின் அடிப்படையிலானது; மருத்துவ சிகிச்சைக்கானது அல்ல." : "This Tridosha evaluation is based on traditional astrological principles and does not constitute medical diagnosis or therapy.")}
                  </div>
                </div>
              </div>
            )}

            {/* CHAPTER 12: Vedic Remedies & Gemstone Prescription */}
            {(activeTab === "all" || activeTab === "remedies") && (
              <div className="space-y-4">
                <h3 className="text-base font-serif font-bold text-amber-900 flex items-center gap-2 border-b border-amber-300 pb-2">
                  <Gem className="w-4 h-4 text-purple-600" />
                  {isTamil ? "12. வேத சாஸ்திர பரிகாரங்கள் & தனிப்பயன் ரத்தின பரிந்துரை" : "12. Personalized Vedic Remedies, Mantra Sadhana & Gemstone Matrix"}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-sm space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-800">
                        {isTamil ? "முதன்மை அதிர்ஷ்ட ரத்தினம்" : "Primary Auspicious Gemstone"}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold border border-amber-200">
                        {remedies.gemLord}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-stone-900">
                      {remedies.primaryGemstone}
                    </h4>
                    <p className="text-xs text-stone-700 leading-relaxed">
                      {isTamil 
                        ? "சுப முகூர்த்த நாளில் வலது கையின் மோதிர விரலில் தங்கம் அல்லது வெள்ளியில் பதித்து அணிவது லக்ன பலத்தை கூட்டி அதிர்ஷ்டத்தையும் நேர்மறை ஆற்றலையும் பன்மடங்கு பெருக்கும்." 
                        : "Set in gold or silver on the ring finger of the dominant hand during Shukla Paksha to amplify vital force, mental clarity, and auspicious fortune."}
                    </p>
                    {remedies.gemstonePrescription && remedies.gemstonePrescription.length > 0 && (
                      <div className="pt-2 border-t border-amber-100 space-y-1">
                        <span className="font-semibold text-[11px] text-emerald-900 block">{isTamil ? "பரிந்துரைக்கப்படும் ரத்தினங்கள்:" : "Recommended Prescriptions:"}</span>
                        {remedies.gemstonePrescription.map((g, idx) => (
                          <div key={idx} className="text-[11px] text-stone-700 flex items-start gap-1.5">
                            <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold shrink-0">{g.suitability}</span>
                            <span><strong>{g.gemstone}</strong> ({g.lord}) - {g.reason}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {(remedies.traditionallyDiscouragedGemstones || remedies.contraindicatedGemstones) && (remedies.traditionallyDiscouragedGemstones || remedies.contraindicatedGemstones).length > 0 && (
                      <div className="pt-2 border-t border-rose-100 space-y-1">
                        <span className="font-semibold text-[11px] text-rose-900 block">{isTamil ? "தவிர்க்க வேண்டிய ரத்தினங்கள் (பாரம்பரிய வழிகாட்டல்):" : "Traditionally Discouraged Gemstones:"}</span>
                        {(remedies.traditionallyDiscouragedGemstones || remedies.contraindicatedGemstones).map((g, idx) => (
                          <div key={idx} className="text-[11px] text-rose-800 flex items-start gap-1.5">
                            <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-800 border border-rose-200 font-bold shrink-0">Avoid</span>
                            <span><strong>{g.gemstone}</strong> ({g.lord}) - {g.reason}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-sm space-y-2.5">
                    <span className="text-xs font-bold text-purple-800">
                      {isTamil ? "தினசரி உபய மந்திர சாதனை & தான தர்மம்" : "Daily Planetary Mantra Sadhana & Charity"}
                    </span>
                    <h4 className="text-base font-bold text-stone-900">
                      {remedies.mantra}
                    </h4>
                    <p className="text-xs text-stone-700 leading-relaxed">
                      {isTamil 
                        ? "தினமும் அதிகாலை பிரம்ம முகூர்த்தத்தில் 108 முறை ஜெபிப்பது நவக்கிரக தோஷங்களை அகற்றி மன அமைதியையும் காரிய சித்தியையும் வழங்கும்." 
                        : "Chanting 108 times at sunrise calms mental fluctuations, clears karmic obstacles, and invites divine blessings."}
                    </p>
                    {remedies.charity && (
                      <div className="pt-2 border-t border-amber-100 text-[11px] text-amber-900">
                        <span className="font-semibold text-stone-600">{isTamil ? "பரிந்துரைக்கப்படும் தானம்: " : "Recommended Charity: "}</span>
                        {remedies.charity}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* CHAPTER 13: Auspicious Life Milestones & Day-to-Day Muhurtha Timeline */}
            {(activeTab === "all" || activeTab === "auspicious") && (
              <div className="space-y-6">
                <div className="border-b border-amber-300 pb-2">
                  <h3 className="text-base font-serif font-bold text-amber-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    {isTamil ? "13. சுப முகூர்த்த காலங்கள் & முக்கிய வாழ்வியல் சுப கால அட்டவணை" : "13. Auspicious Life Milestones & Day-to-Day Muhurtha Timeline"}
                  </h3>
                  <p className="text-xs text-stone-600 mt-0.5">
                    {auspicious.summary}
                  </p>
                </div>

                {/* Milestone Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(auspicious.milestones || []).map((m) => (
                    <div key={m.id} className="p-4 rounded-2xl bg-white border border-amber-200 hover:border-amber-400 transition-all space-y-3 flex flex-col justify-between shadow-sm">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-serif font-bold text-amber-900 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            {m.category}
                          </h4>
                        </div>

                        {/* Age & Year Timeline Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {m.ageRange && (
                            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                              {isTamil ? `வயது: ${m.ageRange}` : `Age: ${m.ageRange}`}
                            </span>
                          )}
                          {m.calendarYears && (
                            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-mono font-bold border border-emerald-300">
                              {isTamil ? `ஆண்டுகள்: ${m.calendarYears}` : `Years: ${m.calendarYears}`}
                            </span>
                          )}
                        </div>

                        {/* Favorable Planets & Best Tithis/Days */}
                        <div className="space-y-1 text-[11px] text-stone-700 pt-1">
                          {m.favorablePlanets && (
                            <div>
                              <span className="font-semibold text-amber-800">{isTamil ? "சுப கிரகங்கள்: " : "Favorable Planets: "}</span>
                              {m.favorablePlanets}
                            </div>
                          )}
                          {m.auspiciousNakshatras && (
                            <div>
                              <span className="font-semibold text-emerald-800">{isTamil ? "உகந்த நட்சத்திரங்கள்: " : "Auspicious Stars: "}</span>
                              {m.auspiciousNakshatras}
                            </div>
                          )}
                          {m.bestTithis && (
                            <div>
                              <span className="font-semibold text-purple-800">{isTamil ? "சுப திதிகள்: " : "Auspicious Tithis: "}</span>
                              {m.bestTithis}
                            </div>
                          )}
                          {m.favorableWeekdays && (
                            <div>
                              <span className="font-semibold text-cyan-800">{isTamil ? "சுப கிழமைகள்: " : "Favorable Days: "}</span>
                              {m.favorableWeekdays}
                            </div>
                          )}
                          {m.auspiciousMonths && (
                            <div>
                              <span className="font-semibold text-orange-800">{isTamil ? "சுப மாதங்கள்: " : "Favorable Months: "}</span>
                              {m.auspiciousMonths}
                            </div>
                          )}
                        </div>

                        {/* Astrological Rationale */}
                        <p className="text-[11px] text-stone-700 leading-relaxed bg-amber-50/60 p-2.5 rounded-xl border border-amber-200">
                          {m.rationale}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Day-to-Day Muhurtha & Everyday Activity Optimization */}
                {auspicious.dayToDayMuhurthaGuide && (
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50/70 border border-amber-300 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-600" />
                      <h4 className="text-sm font-bold text-stone-900">
                        {isTamil ? "தினசரி சுப முகூர்த்தம் & அன்றாட காரிய வழிகாட்டி (Day-to-Day Muhurtha)" : "Day-to-Day Muhurtha & Everyday Activity Optimization"}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-white border border-amber-200 space-y-1 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-amber-900">
                            {isTamil 
                              ? `பிரம்ம முகூர்த்தம் (${auspicious.dayToDayMuhurthaGuide.brahmaMuhurtham?.time || "சூரிய உதயத்திற்கு 96 - 48 நிமிடங்கள் முன்"})`
                              : `Brahma Muhurtham (${auspicious.dayToDayMuhurthaGuide.brahmaMuhurtham?.time || "96 - 48 mins prior to local sunrise"})`}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-bold">Dawn Window</span>
                        </div>
                        <p className="text-[11px] text-stone-700 leading-relaxed">
                          {auspicious.dayToDayMuhurthaGuide.brahmaMuhurtham?.purpose}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white border border-amber-200 space-y-1 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-emerald-900">
                            {isTamil 
                              ? `அபிஜித் முகூர்த்தம் (${auspicious.dayToDayMuhurthaGuide.abhijitMuhurtham?.time || "உச்ச சூரிய மதிய நேரத்திற்கு ±24 நிமிடங்கள்"})`
                              : `Abhijit Muhurtham (${auspicious.dayToDayMuhurthaGuide.abhijitMuhurtham?.time || "±24 mins centered on local solar noon"})`}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono font-bold">Solar Midday</span>
                        </div>
                        <p className="text-[11px] text-stone-700 leading-relaxed">
                          {auspicious.dayToDayMuhurthaGuide.abhijitMuhurtham?.purpose}
                        </p>
                      </div>
                    </div>

                    {/* Planetary Hora Activity Matrix */}
                    {auspicious.dayToDayMuhurthaGuide.planetaryHoraGuide && (
                      <div className="space-y-2 pt-2 border-t border-amber-200">
                        <span className="text-xs font-bold text-purple-900 block">
                          {isTamil ? "காரிய சித்தி தரும் நவகிரக ஹோரை அட்டவணை (Planetary Horas for Daily Tasks)" : "Planetary Hora Alignment for Everyday Tasks"}
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {auspicious.dayToDayMuhurthaGuide.planetaryHoraGuide.map((h, i) => (
                            <div key={i} className="p-2.5 rounded-xl bg-white border border-amber-200 space-y-1 shadow-sm">
                              <span className="text-[11px] font-bold text-amber-900 block">{h.hora}</span>
                              <p className="text-[10px] text-stone-700 leading-snug">{isTamil ? h.ideal : (h.idealTa || h.ideal)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rahu Kalam Weekly Avoidance Guide */}
                    {auspicious.dayToDayMuhurthaGuide.rahuKalamAvoidance && (
                      <div className="space-y-2 pt-2 border-t border-amber-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            {isTamil ? "தவிர்க்க வேண்டிய ராகு காலம் & எமகண்டம் (Rahu Kalam Avoidance)" : "Inauspicious Rahu Kalam & Yamagandam Timing Guide"}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 leading-relaxed">
                          {auspicious.dayToDayMuhurthaGuide.rahuKalamAvoidance.rule}
                        </p>
                        <div className="overflow-x-auto bg-white rounded-xl border border-amber-200 p-2 shadow-sm">
                          <table className="w-full text-[10px] text-left border-collapse">
                            <thead>
                              <tr className="border-b border-amber-200 text-stone-700 font-mono">
                                <th className="py-1 px-2">{isTamil ? "கிழமை" : "Day"}</th>
                                <th className="py-1 px-2 text-rose-800 font-bold">{isTamil ? "ராகு காலம்" : "Rahu Kalam"}</th>
                                <th className="py-1 px-2 text-amber-800 font-bold">{isTamil ? "எமகண்டம்" : "Yamagandam"}</th>
                                <th className="py-1 px-2 text-cyan-800 font-bold">{isTamil ? "குளிகை" : "Gulika"}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {auspicious.dayToDayMuhurthaGuide.rahuKalamAvoidance.weeklyTable?.map((row, idx) => (
                                <tr key={idx} className="border-b border-amber-100 last:border-0 font-mono">
                                  <td className="py-1.5 px-2 font-bold text-stone-800">{row.day}</td>
                                  <td className="py-1.5 px-2 text-rose-700 font-medium">{row.rahu}</td>
                                  <td className="py-1.5 px-2 text-amber-700 font-medium">{row.yama}</td>
                                  <td className="py-1.5 px-2 text-cyan-700 font-medium">{row.gulika}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* CHAPTER 14: Traditional Caution Indicators & Timing Windows */}
            {(activeTab === "all" || activeTab === "risks") && (
              <div className="space-y-6">
                <div className="border-b border-rose-300 pb-2">
                  <h3 className="text-base font-serif font-bold text-rose-900 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    {isTamil ? "14. பாரம்பரிய எச்சரிக்கை குறிகாட்டிகள் & கால அட்டவணை" : "14. Traditional Caution Indicators & Timing Windows"}
                  </h3>
                  <p className="text-xs text-stone-600 mt-0.5">
                    {riskData.summary}
                  </p>
                  {riskData.statutoryNotice && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>{riskData.statutoryNotice}</div>
                    </div>
                  )}
                </div>

                {/* Risk Cards */}
                <div className="space-y-4">
                  {(riskData.risks || []).map((r) => (
                    <div key={r.id} className="p-4 md:p-5 rounded-2xl bg-white border border-rose-200 space-y-3 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-100 pb-2.5">
                        <div>
                          <h4 className="text-sm md:base font-serif font-bold text-stone-900 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            {r.title}
                          </h4>
                          <span className="text-[10px] text-stone-500">
                            {r.astrologicalBasis}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {r.convergenceLevel && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold border bg-indigo-50 text-indigo-900 border-indigo-200">
                              {isTamil ? `கோச்சார குவிப்பு: ${r.convergenceLevel}` : `Transit: ${r.convergenceLevel}`}
                            </span>
                          )}
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                            (r.traditionalCautionLevel || "").includes("Elevated") || (r.traditionalCautionLevel || "").includes("High") || (r.traditionalCautionLevel || "").includes("உயர்")
                              ? "bg-rose-100 text-rose-900 border-rose-300"
                              : "bg-amber-100 text-amber-900 border-amber-300"
                          }`}>
                            {r.traditionalCautionLevel}
                          </span>
                        </div>
                      </div>

                      {/* Timelines & Warning Triggers */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-rose-50/40 border border-rose-200 space-y-1.5">
                          <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                            {isTamil ? "எச்சரிக்கை வயது & கால கட்டம் (Traditional Caution Window)" : "Traditional Caution Age & Calendar Window"}
                          </span>
                          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                            <span className="text-amber-800 font-bold">
                              {isTamil ? `வயது: ${r.traditionalCautionWindowAge}` : `Age: ${r.traditionalCautionWindowAge}`}
                            </span>
                            {r.traditionalCautionCalendarYears && (
                              <span className="text-emerald-800 font-bold">
                                [{r.traditionalCautionCalendarYears}]
                              </span>
                            )}
                          </div>
                          {r.traditionalBodyAreas && (
                            <p className="text-[11px] text-stone-700 pt-1">
                              <span className="font-semibold text-amber-900">{isTamil ? "பாரம்பரிய உடலியல் தொடர்பு: " : "Traditional Body-Area Associations: "}</span>
                              {r.traditionalBodyAreas}
                            </p>
                          )}
                          {r.transitTrigger && (
                            <p className="text-[11px] text-indigo-900 pt-1 bg-indigo-50/60 p-1.5 rounded-lg border border-indigo-100">
                              <span className="font-semibold">{isTamil ? "கோச்சார காரணிகள்: " : "Transit Triggers: "}</span>
                              {r.transitTrigger}
                            </p>
                          )}
                          {r.vulnerabilityTriggers && (
                            <p className="text-[11px] text-stone-700 pt-1">
                              <span className="font-semibold text-amber-800">{isTamil ? "தூண்டும் காரணிகள்: " : "Triggers: "}</span>
                              {r.vulnerabilityTriggers}
                            </p>
                          )}
                          {r.warningSignals && (
                            <p className="text-[11px] text-stone-700 pt-1">
                              <span className="font-semibold text-rose-800">{isTamil ? "முன்னெச்சரிக்கை: " : "Warning Signals: "}</span>
                              {r.warningSignals}
                            </p>
                          )}
                        </div>

                        {/* Protective Remedies & Shields */}
                        <div className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-200 space-y-1.5">
                          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-emerald-600" />
                            {isTamil ? "தற்காப்பு பரிகாரங்கள் & வேதம் கூறும் கவசம்" : "Protective Remedial Shield & Guidance"}
                          </span>
                          <p className="text-[11px] text-stone-700 leading-relaxed font-medium">
                            {r.protectiveRemedy}
                          </p>
                          {r.medicalNotice && (
                            <p className="text-[10px] text-stone-500 italic pt-1 border-t border-emerald-100">
                              {r.medicalNotice}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CHAPTER 15: Complete Vimshottari Dasha Life-Stage Timeline (0–120 Yrs) */}
            {(activeTab === "all" || activeTab === "timeline") && (
              <div className="space-y-6">
                <div className="border-b border-amber-300 pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="text-base font-serif font-bold text-amber-950 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-600" />
                      {isTamil
                        ? "15. விம்சோத்தரி தசா-புக்தி & கோச்சார காலக்கோடு (0-120 ஆண்டு கட்டமைப்பு)"
                        : "15. Complete Vimshottari Dasha Life-Stage Timeline (0–120 Yrs)"}
                    </h3>
                    <div className="flex items-center gap-2">
                      <CertaintyBadge type="timing" isTamil={isTamil} />
                      <span className="px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-extrabold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        {isTamil ? "பராசர சாஸ்திர தசா-கோச்சார கணிதம்" : "Parashari Dasha & Transit Framework"}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-stone-600 mt-1">
                    {timelineData.summary || (isTamil
                      ? "ஜாதகரின் விம்சோத்தரி தசா புக்தி சுழற்சிகள், பாவக அதிபதிகள் மற்றும் கோச்சார கிரக அமைப்புகளை அடிப்படையாகக் கொண்டு கணக்கிடப்பட்ட காலவரிசை வாழ்வியல் கட்டங்கள்."
                      : "Chronological lifecycle trajectory mapping out life-stage themes directly derived from the native's actual Vimshottari Mahadasha and Antardasha sequence, operating lords, and transit triggers.")}
                  </p>
                </div>

                {/* Summary Highlight Metric Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-amber-800 block">
                      {isTamil ? "விம்சோத்தரி தசா சுழற்சி" : "Vimshottari Dasha Cycle"}
                    </span>
                    <span className="text-xs font-bold text-stone-900 font-mono">0 - 120 {isTamil ? "ஆண்டு கட்டமைப்பு" : "Year Framework"}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-50/80 border border-purple-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-purple-800 block">
                      {isTamil ? "தசா காலக்கட்டங்கள்" : "Lifecycle Stages"}
                    </span>
                    <span className="text-xs font-bold text-purple-950 font-mono">{timelineStages.length} {isTamil ? "தசா கட்டங்கள்" : "Dasha Stages"}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                      {isTamil ? "சான்றுகள் நிலை" : "Evidence Convergence"}
                    </span>
                    <span className="text-xs font-bold text-emerald-950 font-mono">{isTamil ? "தசா-கோச்சார இணைவு" : "Dasha & Transit Convergence"}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-cyan-50/80 border border-cyan-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-cyan-800 block">
                      {isTamil ? "கணித முறைமை" : "Calculation Framework"}
                    </span>
                    <span className="text-xs font-bold text-cyan-950 font-mono">120-Yr Vimshottari</span>
                  </div>
                </div>

                {/* Chronological Timeline Milestone Cards */}
                <div className="relative border-l-2 border-amber-300 ml-3 md:ml-4 pl-4 md:pl-6 space-y-5">
                  {timelineStages.map((stage) => (
                    <div key={stage.id || stage.stageNum} className="relative group">
                      {/* Timeline Dot with Milestone Number */}
                      <div className="absolute -left-[27px] md:-left-[35px] top-1.5 w-6 h-6 md:w-7 md:h-7 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 border-2 border-white shadow text-white text-[10px] md:text-xs font-bold flex items-center justify-center">
                        {stage.stageNum}
                      </div>

                      {/* Milestone Card */}
                      <div className="p-4 md:p-5 rounded-2xl bg-white border border-amber-200/90 shadow-sm space-y-3 transition-all hover:border-amber-400 hover:shadow-md">
                        {/* Header: Title, Age, Calendar Years & Probability Badge */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-2.5">
                          <div>
                            <h4 className="text-sm md:text-base font-serif font-bold text-stone-900 flex items-center gap-2">
                              {stage.title}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 font-mono text-xs mt-0.5">
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold border border-amber-300 text-[11px]">
                                {isTamil ? `வயது: ${stage.ageRange} ஆண்டுகள்` : `Age: ${stage.ageRange} Yrs`}
                              </span>
                              {stage.calendarYears && (
                                <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-semibold border border-stone-300 text-[11px]">
                                  {stage.calendarYears}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1.5">
                            <CertaintyBadge type="timing" isTamil={isTamil} />
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-extrabold flex items-center gap-1 shadow-sm">
                              <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                              {stage.evidenceLevel || (isTamil ? "சாஸ்திர சான்றுகள்" : "Classical Evidence")}
                            </span>
                          </div>
                        </div>

                        {/* Astrological & Transit Triggers */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/70 space-y-1">
                            <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                              {isTamil ? "இயங்கும் மகா தசை / புக்தி:" : "Active Dasha / Sub-Period:"}
                            </span>
                            <p className="text-[11px] font-medium text-stone-800">
                              {stage.dashaTrigger}
                            </p>
                          </div>

                          <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-200/70 space-y-1">
                            <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block">
                              {isTamil ? "கிரக கோச்சார & பாவக தூண்டுதல்:" : "Planetary Transit & Bhava Trigger:"}
                            </span>
                            <p className="text-[11px] font-medium text-stone-800">
                              {stage.planetaryTransit}
                            </p>
                          </div>
                        </div>

                        {/* Prediction Details */}
                        <div className="p-3 rounded-xl bg-[#FFFDF9] border border-amber-100">
                          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                            {isTamil ? "சாஸ்திர பலன் & நிகழ்வு விவரம்:" : "Astrological Forecast & Life Manifestation:"}
                          </span>
                          <p className="text-xs md:text-sm text-stone-800 leading-relaxed font-serif">
                            {stage.prediction}
                          </p>
                        </div>

                        {/* Actionable Dharmic Guidance */}
                        {stage.actionableGuidance && (
                          <div className="p-2.5 rounded-xl bg-emerald-50/40 border border-emerald-200 flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
                                {isTamil ? "சாஸ்திர பரிகாரம் & வழிகாட்டுதல்:" : "Dharmic Guidance & Actionable Practice:"}
                              </span>
                              <p className="text-[11px] text-stone-700 leading-relaxed">
                                {stage.actionableGuidance}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CHAPTER 16: RETROSPECTIVE LIFE MILESTONE VERIFICATION (SENIOR VALIDATION) */}
            {(activeTab === "all" || activeTab === "milestoneAudit") && retrospectiveAudit && retrospectiveAudit.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-purple-300 pb-2">
                  <h3 className="text-base font-serif font-bold text-purple-900 flex items-center gap-2">
                    <CheckCheck className="w-4 h-4 text-purple-600" />
                    {isTamil
                      ? "16. கடந்த கால வாழ்வியல் மைல்கற்கள் சரிபார்ப்பு (முதியோருக்கான சரிபார்ப்பு)"
                      : "16. Retrospective Life Milestone Verification (Senior Validation)"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <CertaintyBadge type="timing" isTamil={isTamil} />
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold border border-purple-300">
                      {isTamil ? `${retrospectiveAudit.length} உத்தேச காலக்கட்டங்கள்` : `${retrospectiveAudit.length} Candidate Windows`}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-2">
                  <p className="text-xs text-purple-900 leading-relaxed font-medium">
                    {isTamil
                      ? "முதியோர்கள் மற்றும் மூத்தவர்கள் தங்கள் சொந்த கடந்த கால வாழ்க்கையின் முக்கிய சம்பவங்களை (உயர்கல்வி, திருமணம், தொழில் உச்சம், புத்திரப்பேறு, பூமி/வீடு வாங்குதல்) கீழே உள்ள உத்தேச தசா-புக்தி காலக்கட்டங்களோடு ஒப்பிட்டுப் பார்த்து, உறுதிப்படுத்தப்பட்ட நிகழ்வுகளை சாஸ்திர சான்றாகப் பதிவு செய்து கொள்ளலாம்."
                      : "Use these periods as candidate historical windows and compare them with the native's known life events (higher education completion, marriage, career peak, childbirth, property purchase, major shifts). User-confirmed matches can then be recorded as retrospective validation evidence."}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {retrospectiveAudit.map((m, idx) => {
                    const isConfirmed = Boolean(confirmedMilestones[m.milestoneId || idx]);
                    return (
                      <div key={m.milestoneId || idx} className="p-4 rounded-2xl bg-white border border-purple-200 shadow-sm space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                                {m.milestoneTheme}
                              </span>
                              <span className="text-xs font-bold text-stone-900">{m.dasha}</span>
                            </div>
                            <div className="text-xs font-semibold text-purple-900 mt-1">
                              {isTamil ? `கணக்கிடப்பட்ட உத்தேச வயது: ${m.ageRange}` : `Calculated Candidate Age: ${m.ageRange}`} ({m.calendarYears})
                            </div>
                          </div>
                          <button
                            onClick={() => toggleMilestone(m.milestoneId || idx)}
                            className={`text-[10px] px-2.5 py-1 rounded-full font-bold border transition-all cursor-pointer ${
                              isConfirmed
                                ? "bg-emerald-100 text-emerald-900 border-emerald-300 shadow-2xs"
                                : "bg-stone-100 text-stone-700 hover:bg-stone-200 border-stone-300"
                            }`}
                          >
                            {isConfirmed
                              ? (isTamil ? "✓ சரிபார்க்கப்பட்டது (Confirmed)" : "✓ User Confirmed")
                              : (isTamil ? "உத்தேச காலக்கட்டம் (Candidate Window)" : "Candidate Window (Unverified)")}
                          </button>
                        </div>

                        <div className="text-xs text-stone-700 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                          <strong className="text-stone-900 block mb-0.5">
                            {isTamil ? "சாஸ்திர காரகத்துவ நிகழ்வு:" : "Classical Life Trigger:"}
                          </strong>
                          {m.lifeEventTrigger}
                        </div>

                        <div className="text-xs text-purple-800 bg-purple-50/50 p-2.5 rounded-xl border border-purple-100 italic">
                          <strong className="text-purple-900 not-italic block mb-0.5">
                            {isTamil ? "உண்மை வாழ்க்கை சரிபார்ப்புக் குறிப்பு:" : "Real Life Verification Prompt:"}
                          </strong>
                          "{m.verificationPrompt}"
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CHAPTER 17: ASTROLOGER EVIDENCE DOSSIER & REASONING CHAINS */}
            {(activeTab === "all" || audienceMode === "astrologer" || activeTab === "reasoningDossier") && (
              <div className="p-5 md:p-6 rounded-3xl bg-gradient-to-br from-purple-50 via-white to-amber-50/60 border-2 border-purple-300 shadow-md space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-700" />
                    <h3 className="text-base md:text-lg font-serif font-bold text-purple-950">
                      {isTamil
                        ? "17. ஜோதிட ஆதார சங்கிலி & சான்றுகள் குறியீடு (Astrologer Evidence Dossier)"
                        : "17. Hierarchical Evidence Dossier & 9-Level Reasoning Chains"}
                    </h3>
                  </div>
                  <CertaintyBadge type="calculated" isTamil={isTamil} />
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">
                  {isTamil
                    ? "ஒவ்வொரு பலனுக்கும் பின்னால் உள்ள 9-அடுக்கு சாஸ்திர ஆதாரங்கள் (Level 1 Natal Promise முதல் Level 9 Qualitative Assessment வரை), முரண்பாடுகளை சமன் செய்யும் சாஸ்திர முறை மற்றும் சான்றுகள் குறியீடுகள் (Evidence IDs) கீழே தரப்பட்டுள்ளன."
                    : "The complete technical evidence ledger separating Natal Promise (D1), Functional Lordship, Planetary Capacity (Shadbala), Varga Confirmations (D9/D10/D4/D7/D24/D30), Dasha Activation, Gochara Triggers, Jaimini Arudhas, and Contradiction Reconciliation with traceable Evidence IDs."}
                </p>

                {/* Domain Selector for Deep Reasoning Drilldown */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                  {[
                    { id: "career", label: isTamil ? "தொழில் (C01-C09)" : "Career (C01-C09)", color: "border-blue-300 bg-blue-50 text-blue-900" },
                    { id: "marriage", label: isTamil ? "திருமணம் (M01-M09)" : "Marriage (M01-M09)", color: "border-rose-300 bg-rose-50 text-rose-900" },
                    { id: "wealth", label: isTamil ? "தன யோகம் (W01-W09)" : "Wealth (W01-W09)", color: "border-emerald-300 bg-emerald-50 text-emerald-900" },
                    { id: "property", label: isTamil ? "பூமி (P01-P09)" : "Property (P01-P09)", color: "border-amber-300 bg-amber-50 text-amber-900" },
                    { id: "education", label: isTamil ? "கல்வி (E01-E09)" : "Education (E01-E09)", color: "border-cyan-300 bg-cyan-50 text-cyan-900" },
                    { id: "health", label: isTamil ? "சுகாதாரம் (H01-H09)" : "Health (H01-H09)", color: "border-orange-300 bg-orange-50 text-orange-900" },
                    { id: "spirituality", label: isTamil ? "ஆன்மீகம் (S01-S09)" : "Spirituality (S01-S09)", color: "border-purple-300 bg-purple-50 text-purple-900" },
                  ].map((dom) => {
                    const chain = calculatePredictionReasoningChain(chartData, dom.id, { lang });
                    return (
                      <button
                        key={dom.id}
                        onClick={() => setSelectedReasoningDomain(dom.id)}
                        className={`p-2.5 rounded-xl border text-center transition-all shadow-2xs hover:scale-105 ${dom.color}`}
                      >
                        <span className="font-bold text-xs block">{dom.label}</span>
                        <span className="text-[10px] opacity-80 block mt-0.5">{chain.classification}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Primary 9-Level Reasoning Chain Breakdown for Career & Marriage */}
                <div className="space-y-4 pt-2">
                  {["career", "marriage"].map((domKey) => {
                    const chain = calculatePredictionReasoningChain(chartData, domKey, { lang });
                    return (
                      <div key={domKey} className="p-4 rounded-2xl bg-white border border-purple-200 shadow-sm space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 font-mono font-bold text-xs uppercase">
                              {domKey} Domain Ledger ({chain.layerCount || 9} Levels)
                            </span>
                            <span className="font-bold text-sm text-stone-900">
                              {chain.classification}
                            </span>
                          </div>
                          <button
                            onClick={() => setSelectedReasoningDomain(domKey)}
                            className="text-xs text-purple-700 hover:text-purple-900 font-bold underline flex items-center gap-1"
                          >
                            <span>{isTamil ? "முழு 9-அடுக்கு சான்றுகளைக் காண்க" : "View Full 9-Level Trace"}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Evidence IDs Pill Row */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] text-stone-500 uppercase font-bold mr-1">
                            {isTamil ? "சான்றுகள் குறியீடு:" : "Evidence IDs:"}
                          </span>
                          {(chain.evidenceIds || []).map((evId) => (
                            <span key={evId} className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-900 font-mono font-bold text-[10px] border border-purple-200">
                              {evId}
                            </span>
                          ))}
                        </div>

                        {/* Summary & Reconciliation */}
                        <p className="text-xs text-stone-700 leading-relaxed bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                          {chain.summary}
                        </p>

                        {/* Contradiction Reconciliation Note */}
                        {chain.reconciliation && (
                          <div className="text-[11px] text-purple-900 bg-purple-50/70 p-2.5 rounded-xl border border-purple-200">
                            <strong>{isTamil ? "முரண்பாடுகள் சமன்செய்தல் (Contradiction Reconciliation):" : "Contradiction Reconciliation:"} </strong>
                            {chain.reconciliation.reconciliationNote}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CHAPTER 18: COMPREHENSIVE TECHNICAL CALCULATION APPENDIX */}
            {(activeTab === "all" || audienceMode === "astrologer" || activeTab === "technicalAppendix") && (
              <div className="p-5 md:p-6 rounded-3xl bg-white border-2 border-amber-400 shadow-md space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-amber-700" />
                    <h3 className="text-base md:text-lg font-serif font-bold text-amber-950">
                      {isTamil
                        ? "18. தொழில்நுட்ப கணக்கீட்டு பிற்சேர்க்கை & வானியல் தரவுத்தளம் (Technical Calculation Appendix)"
                        : "18. Comprehensive Technical Calculation Appendix & Astronomical Dataset"}
                    </h3>
                  </div>
                  <CertaintyBadge type="calculated" isTamil={isTamil} />
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">
                  {isTamil
                    ? "ஜோதிட வல்லுநர்கள், ஆராய்ச்சியாளர்கள் மற்றும் தணிக்கையாளர்களுக்கான முழுமையான கணக்கீட்டுத் தரவுகள்: 16 வர்க்கங்கள் (D1-D60), 6-வகை ஷட்பலம், அஷ்டகவர்க்கம் (337 பிந்துக்கள்), ஜைமினி காரகங்கள், பாவ சலனம் மற்றும் பஞ்சாங்க துல்லிய விபரங்கள்."
                    : "Complete deterministic computational ledger providing full technical traceability across Astronomical Coordinates, 9-Graha Ephemeris, 12-Bhava Chalit cusps, 16 Shodashavarga harmonics, 6-Fold Shadbala virupas, 337-Bindu Ashtakavarga matrix, Jaimini Chara Karakas, Planetary Avasthas, and Root-Solved Panchanga."}
                </p>

                {/* 18.1 Astronomical Birth Instant & Coordinates */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-amber-600" />
                    {isTamil ? "18.1 வானியல் பிறப்பு அமைப்புகள் & நேரக் குறியீடு" : "18.1 Astronomical Birth Coordinates & Time Instant"}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-stone-500 block uppercase">Birth Date / UTC</span>
                      <strong className="text-stone-900">{chartData.date ? new Date(chartData.date).toISOString().slice(0, 16).replace("T", " ") : "N/A"}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 block uppercase">Timezone / Offset</span>
                      <strong className="text-stone-900">{chartData.timezoneId || `UTC${(chartData.tz ?? chartData.utcOffset ?? 5.5) >= 0 ? "+" : ""}${chartData.tz ?? chartData.utcOffset ?? 5.5}`}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 block uppercase">Geo Latitude</span>
                      <strong className="text-stone-900">{typeof chartData.lat === "number" ? `${chartData.lat.toFixed(4)}°` : (chartData.latitude ? `${Number(chartData.latitude).toFixed(4)}°` : "N/A")}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 block uppercase">Geo Longitude</span>
                      <strong className="text-stone-900">{typeof chartData.lng === "number" ? `${chartData.lng.toFixed(4)}°` : (chartData.longitude ? `${Number(chartData.longitude).toFixed(4)}°` : "N/A")}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 block uppercase">Ayanamsha at Birth Date</span>
                      <strong className="text-stone-900">{chartData.ayanamsaDms || (typeof chartData.ayanamsa === "number" ? `${chartData.ayanamsa.toFixed(4)}°` : "23° 51' 25.5\"")} (Chitrapaksha)</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 block uppercase">Lagna Speed</span>
                      <strong className="text-stone-900">{chartData.ascendantSpeedDegPerMin ? `${chartData.ascendantSpeedDegPerMin.toFixed(4)}°/min` : "~0.25°/min"}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 block uppercase">D9 / D60 Sensitivity</span>
                      <strong className="text-stone-900">D9: ~{chartData.birthDataConfidence?.repD9Min || 13.3}m | D60: ~{chartData.birthDataConfidence?.repD60Min || 2.0}m</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 block uppercase">Ephemeris Engine</span>
                      <strong className="text-stone-900">VSOP87 / NOVAS</strong>
                    </div>
                  </div>
                </div>

                {/* 18.2 Complete 9-Graha Calculated Position & Dispositor Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-600" />
                    {isTamil ? "18.2 நவகிரக வானியல் பாகை & ஆதிபத்திய அட்டவணை" : "18.2 Complete 9-Graha Calculated Position & Dispositor Table"}
                  </h4>
                  <div className="overflow-x-auto rounded-2xl border border-amber-200 shadow-2xs bg-white">
                    <table className="w-full text-[11px] text-left border-collapse">
                      <thead>
                        <tr className="bg-amber-100/70 border-b border-amber-200 text-stone-800 font-mono text-[10px] uppercase">
                          <th className="p-2">Graha</th>
                          <th className="p-2">Longitude</th>
                          <th className="p-2">Sign</th>
                          <th className="p-2">House</th>
                          <th className="p-2">Deg In Sign</th>
                          <th className="p-2">Nakshatra</th>
                          <th className="p-2">Pada</th>
                          <th className="p-2">Motion</th>
                          <th className="p-2">Dignity</th>
                          <th className="p-2">Dispositor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100 font-mono text-[11px]">
                        {/* Ascendant Row */}
                        <tr className="bg-amber-50/40 font-semibold">
                          <td className="p-2 text-stone-900">Ascendant (Lagna)</td>
                          <td className="p-2">{chartData.ascendantLong !== undefined ? `${chartData.ascendantLong.toFixed(2)}°` : (chartData.ascendant?.longitude ? `${chartData.ascendant.longitude.toFixed(2)}°` : "-")}</td>
                          <td className="p-2 text-amber-900">{getSignName(chartData.ascendantSign, chartData.ascendant?.sign || "N/A")}</td>
                          <td className="p-2">1</td>
                          <td className="p-2">{chartData.ascendantLong !== undefined ? `${(chartData.ascendantLong % 30).toFixed(2)}°` : "-"}</td>
                          <td className="p-2">{chartData.ascendant?.nakshatra || "-"}</td>
                          <td className="p-2">{chartData.ascendant?.pada ?? "-"}</td>
                          <td className="p-2 text-stone-600">Direct</td>
                          <td className="p-2 text-stone-600">Reference</td>
                          <td className="p-2">{chartData.ascendantSign?.ruler || chartData.ascendant?.ruler || "-"}</td>
                        </tr>
                        {(chartData.planets || []).map((p) => {
                          const degInSign = typeof p.longitude === "number" ? (p.longitude % 30).toFixed(2) : (typeof p.long === "number" ? (p.long % 30).toFixed(2) : "-");
                          return (
                            <tr key={p.name} className="hover:bg-amber-50/50">
                              <td className="p-2 font-bold text-stone-900">{p.name}</td>
                              <td className="p-2">{typeof p.longitude === "number" ? `${p.longitude.toFixed(2)}°` : (typeof p.long === "number" ? `${p.long.toFixed(2)}°` : "-")}</td>
                              <td className="p-2 text-stone-800">{p.sign || "-"}</td>
                              <td className="p-2 font-bold">{p.house ?? "-"}</td>
                              <td className="p-2">{degInSign !== "-" ? `${degInSign}°` : "-"}</td>
                              <td className="p-2">{p.nakshatra || "-"}</td>
                              <td className="p-2">{p.pada ?? "-"}</td>
                              <td className="p-2">
                                <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${p.isRetrograde ? "bg-rose-100 text-rose-900" : "bg-emerald-50 text-emerald-800"}`}>
                                  {p.isRetrograde ? "Retrograde" : "Direct"}
                                </span>
                              </td>
                              <td className="p-2">{p.dignity || "Neutral"}</td>
                              <td className="p-2 text-stone-700">{p.dispositor || "-"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 18.3 Whole-Sign vs Equal-House Bhava Chalit Cusp Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                    {isTamil ? "18.3 ராசி பாவகம் vs பாவ சலன இடைவெளி அட்டவணை" : "18.3 Whole-Sign vs Bhava Chalit Cusp & Planetary Shifts"}
                  </h4>
                  <div className="overflow-x-auto rounded-2xl border border-amber-200 shadow-2xs bg-white">
                    <table className="w-full text-[11px] text-left border-collapse">
                      <thead>
                        <tr className="bg-amber-100/70 border-b border-amber-200 text-stone-800 font-mono text-[10px] uppercase">
                          <th className="p-2">Bhava</th>
                          <th className="p-2">Whole-Sign</th>
                          <th className="p-2">Lord</th>
                          <th className="p-2">Chalit Cusp (Deg)</th>
                          <th className="p-2">Chalit Span (±15°)</th>
                          <th className="p-2">Whole-Sign Occupants</th>
                          <th className="p-2">Bhava Chalit Occupants</th>
                          <th className="p-2">Shift Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100 font-mono text-[11px]">
                        {(chartData.bhavaChalit?.bhavas || chartData.bhavasDetailed || []).map((bh, idx) => {
                          const bNum = bh.bhavaNum || bh.num || idx + 1;
                          const rasiSign = bh.signName || bh.sign || "-";
                          const lord = bh.lordName || bh.lord || "-";
                          const cuspDeg = typeof bh.madhyaDegree === "number"
                            ? `${bh.madhyaDegree.toFixed(2)}°`
                            : (typeof bh.cuspDegree === "number" ? `${bh.cuspDegree.toFixed(2)}°` : "-");
                          const spanStr = (typeof bh.arambhaDegree === "number" && typeof bh.antyaDegree === "number")
                            ? `${bh.arambhaDegree.toFixed(1)}° - ${bh.antyaDegree.toFixed(1)}°`
                            : ((typeof bh.startDegree === "number" && typeof bh.endDegree === "number")
                              ? `${bh.startDegree.toFixed(1)}° - ${bh.endDegree.toFixed(1)}°`
                              : "-");
                          const wsOcc = (bh.wholeSignOccupants || (chartData.planets || []).filter(p => p.house === bNum).map(p => p.name)).join(", ") || "-";
                          const chalitOcc = (bh.occupants || bh.chalitOccupants || bh.planets || []).map(p => (typeof p === "string" ? p : p.name)).join(", ") || "-";
                          const hasShift = wsOcc !== chalitOcc && (wsOcc !== "-" || chalitOcc !== "-");
                          return (
                            <tr key={bNum} className={hasShift ? "bg-amber-50/60" : "hover:bg-amber-50/30"}>
                              <td className="p-2 font-bold text-stone-900">House {bNum}</td>
                              <td className="p-2">{rasiSign}</td>
                              <td className="p-2">{lord}</td>
                              <td className="p-2 font-bold text-purple-900">{cuspDeg}</td>
                              <td className="p-2 text-stone-600">{spanStr}</td>
                              <td className="p-2">{wsOcc}</td>
                              <td className="p-2 font-semibold text-stone-900">{chalitOcc}</td>
                              <td className="p-2">
                                {hasShift ? (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                                    Shifted
                                  </span>
                                ) : (
                                  <span className="text-stone-400 text-[10px]">Identical</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 18.4 Complete Shodashavarga (16 Divisional Charts D1-D60) Matrix */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                    {isTamil ? "18.4 சோடசவர்க்க சக்கரங்கள் முழுமை அட்டவணை (D1 - D60)" : "18.4 Complete Shodashavarga Harmonic Matrix (D1 to D60)"}
                  </h4>
                  <div className="overflow-x-auto rounded-2xl border border-amber-200 shadow-2xs bg-white">
                    <table className="w-full text-[10px] text-center border-collapse">
                      <thead>
                        <tr className="bg-amber-100/70 border-b border-amber-200 text-stone-800 font-mono uppercase">
                          <th className="p-1.5 text-left">Graha</th>
                          <th className="p-1.5">D1 (Rāśi)</th>
                          <th className="p-1.5">D2 (Horā)</th>
                          <th className="p-1.5">D3 (Drek)</th>
                          <th className="p-1.5">D4 (Chat)</th>
                          <th className="p-1.5">D7 (Sapt)</th>
                          <th className="p-1.5 font-bold text-purple-900">D9 (Nav)</th>
                          <th className="p-1.5 font-bold text-blue-900">D10 (Dash)</th>
                          <th className="p-1.5">D12 (Dvad)</th>
                          <th className="p-1.5">D16 (Shod)</th>
                          <th className="p-1.5">D20 (Vim)</th>
                          <th className="p-1.5">D24 (Siddh)</th>
                          <th className="p-1.5">D27 (Bhām)</th>
                          <th className="p-1.5">D30 (Trim)</th>
                          <th className="p-1.5">D40 (Khav)</th>
                          <th className="p-1.5">D45 (Aksh)</th>
                          <th className="p-1.5 font-bold text-rose-900">D60 (Ṣaṣṭ)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100 font-mono text-[10px]">
                        {["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"].map((pName) => {
                          const vObj = chartData.structuredVargas || chartData.vargas || {};
                          const getVargaSign = (dKey) => {
                            if (vObj[dKey]?.planets?.[pName]) return vObj[dKey].planets[pName].sign?.slice(0, 3) || vObj[dKey].planets[pName].signName?.slice(0, 3) || "-";
                            if (vObj[dKey]?.[pName]) return vObj[dKey][pName].sign?.slice(0, 3) || vObj[dKey][pName]?.slice(0, 3) || "-";
                            return "-";
                          };
                          const d60Obj = vObj.D60?.planets?.[pName] || vObj.D60?.[pName];
                          const d60Str = d60Obj ? (d60Obj.sign?.slice(0, 3) || d60Obj.signName?.slice(0, 3) || "-") : "-";
                          return (
                            <tr key={pName} className="hover:bg-amber-50/50">
                              <td className="p-1.5 font-bold text-left text-stone-900">{pName}</td>
                              <td className="p-1.5">{getVargaSign("D1")}</td>
                              <td className="p-1.5">{getVargaSign("D2")}</td>
                              <td className="p-1.5">{getVargaSign("D3")}</td>
                              <td className="p-1.5">{getVargaSign("D4")}</td>
                              <td className="p-1.5">{getVargaSign("D7")}</td>
                              <td className="p-1.5 font-bold text-purple-900 bg-purple-50/30">{getVargaSign("D9")}</td>
                              <td className="p-1.5 font-bold text-blue-900 bg-blue-50/30">{getVargaSign("D10")}</td>
                              <td className="p-1.5">{getVargaSign("D12")}</td>
                              <td className="p-1.5">{getVargaSign("D16")}</td>
                              <td className="p-1.5">{getVargaSign("D20")}</td>
                              <td className="p-1.5">{getVargaSign("D24")}</td>
                              <td className="p-1.5">{getVargaSign("D27")}</td>
                              <td className="p-1.5">{getVargaSign("D30")}</td>
                              <td className="p-1.5">{getVargaSign("D40")}</td>
                              <td className="p-1.5">{getVargaSign("D45")}</td>
                              <td className="p-1.5 font-bold text-rose-900 bg-rose-50/30">{d60Str}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 18.5 Full 6-Fold Shadbala Breakdown Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-amber-600" />
                    {isTamil ? "18.5 அறுவகை ஷட்பல வீரிய கணித அட்டவணை (Virupas)" : "18.5 Complete 6-Fold Shadbala Breakdown (Virupas & Strength Ratios)"}
                  </h4>
                  <div className="overflow-x-auto rounded-2xl border border-amber-200 shadow-2xs bg-white">
                    <table className="w-full text-[11px] text-left border-collapse">
                      <thead>
                        <tr className="bg-amber-100/70 border-b border-amber-200 text-stone-800 font-mono text-[10px] uppercase">
                          <th className="p-2">Graha</th>
                          <th className="p-2">Sthana Bala</th>
                          <th className="p-2">Dig Bala</th>
                          <th className="p-2">Kala Bala</th>
                          <th className="p-2">Cheshta Bala</th>
                          <th className="p-2">Naisargika</th>
                          <th className="p-2">Drik Bala</th>
                          <th className="p-2 font-bold text-purple-900">Total Virupas</th>
                          <th className="p-2">Req. Virupas</th>
                          <th className="p-2">Ratio</th>
                          <th className="p-2">Qualification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100 font-mono text-[11px]">
                        {(Array.isArray(chartData.shadbala?.planetShadbala)
                          ? chartData.shadbala.planetShadbala
                          : (Array.isArray(chartData.shadbala)
                            ? chartData.shadbala
                            : (Array.isArray(chartData.shadbala?.planets) ? chartData.shadbala.planets : []))
                        ).map((sb) => {
                          const totalV = typeof sb.totalVirupas === "number" ? sb.totalVirupas : (typeof sb.totalBala === "number" ? sb.totalBala : null);
                          const reqV = typeof sb.requiredRupas === "number" ? (sb.requiredRupas * 60) : (typeof sb.requiredBala === "number" ? sb.requiredBala : null);
                          const ratio = typeof sb.ratio === "number" ? sb.ratio : (typeof sb.strengthRatio === "number" ? sb.strengthRatio : (totalV !== null && reqV ? totalV / reqV : null));
                          const isStrong = typeof sb.isSufficient === "boolean" ? sb.isSufficient : (ratio !== null ? ratio >= 1.0 : false);
                          return (
                            <tr key={sb.name || sb.planet} className="hover:bg-amber-50/50">
                              <td className="p-2 font-bold text-stone-900">{sb.name || sb.planet}</td>
                              <td className="p-2">{typeof sb.sthanaBala === "number" ? sb.sthanaBala.toFixed(1) : "-"}</td>
                              <td className="p-2">{typeof sb.digBala === "number" ? sb.digBala.toFixed(1) : "-"}</td>
                              <td className="p-2">{typeof sb.kalaBala === "number" ? sb.kalaBala.toFixed(1) : "-"}</td>
                              <td className="p-2">{typeof sb.cheshtaBala === "number" ? sb.cheshtaBala.toFixed(1) : "-"}</td>
                              <td className="p-2">{typeof sb.naisargikaBala === "number" ? sb.naisargikaBala.toFixed(1) : "-"}</td>
                              <td className="p-2">{typeof sb.drikBala === "number" ? sb.drikBala.toFixed(1) : "-"}</td>
                              <td className="p-2 font-bold text-purple-900">{totalV !== null ? totalV.toFixed(1) : "-"}</td>
                              <td className="p-2 text-stone-500">{reqV !== null ? reqV.toFixed(0) : "-"}</td>
                              <td className="p-2 font-bold">{ratio !== null ? ratio.toFixed(2) : "-"}</td>
                              <td className="p-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isStrong ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900"}`}>
                                  {isStrong ? "Sufficient / Strong" : "Low Virupas"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 18.6 7-Graha BAV + Lagna Contribution and 337-Bindu SAV Matrix */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-600" />
                    {isTamil ? "18.6 அஷ்டகவர்க்க பிந்து பரவல் (337 மொத்த பிந்துக்கள்)" : "18.6 7-Graha BAV + Lagna Contribution and 337-Bindu SAV Matrix"}
                  </h4>
                  <div className="overflow-x-auto rounded-2xl border border-amber-200 shadow-2xs bg-white">
                    <table className="w-full text-[11px] text-center border-collapse">
                      <thead>
                        <tr className="bg-amber-100/70 border-b border-amber-200 text-stone-800 font-mono text-[10px] uppercase">
                          <th className="p-2 text-left">Sign (Rāśi)</th>
                          <th className="p-2">Sun</th>
                          <th className="p-2">Moon</th>
                          <th className="p-2">Mars</th>
                          <th className="p-2">Mercury</th>
                          <th className="p-2">Jupiter</th>
                          <th className="p-2">Venus</th>
                          <th className="p-2">Saturn</th>
                          <th className="p-2 font-bold text-purple-900">SAV Total (337)</th>
                          <th className="p-2">Evaluation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100 font-mono text-[11px]">
                        {["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"].map((sName, sIdx) => {
                          const bav = chartData.ashtakavarga?.bav || {};
                          const sav = chartData.ashtakavarga?.savBySign || chartData.ashtakavarga?.sav || chartData.ashtakavargaPoints || [];
                          const savVal = Array.isArray(sav) && sav[sIdx] !== undefined ? sav[sIdx] : "-";
                          const isHigh = typeof savVal === "number" ? savVal >= 28 : false;
                          return (
                            <tr key={sName} className={isHigh ? "bg-emerald-50/20 hover:bg-emerald-50/40" : "bg-amber-50/20 hover:bg-amber-50/40"}>
                              <td className="p-2 text-left font-bold text-stone-900">{sIdx + 1}. {sName}</td>
                              <td className="p-2">{bav.Sun?.[sIdx] ?? bav.sun?.[sIdx] ?? "-"}</td>
                              <td className="p-2">{bav.Moon?.[sIdx] ?? bav.moon?.[sIdx] ?? "-"}</td>
                              <td className="p-2">{bav.Mars?.[sIdx] ?? bav.mars?.[sIdx] ?? "-"}</td>
                              <td className="p-2">{bav.Mercury?.[sIdx] ?? bav.mercury?.[sIdx] ?? "-"}</td>
                              <td className="p-2">{bav.Jupiter?.[sIdx] ?? bav.jupiter?.[sIdx] ?? "-"}</td>
                              <td className="p-2">{bav.Venus?.[sIdx] ?? bav.venus?.[sIdx] ?? "-"}</td>
                              <td className="p-2">{bav.Saturn?.[sIdx] ?? bav.saturn?.[sIdx] ?? "-"}</td>
                              <td className="p-2 font-bold text-purple-950 bg-purple-50/40">{savVal}</td>
                              <td className="p-2">
                                {typeof savVal === "number" ? (
                                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${isHigh ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}>
                                    {isHigh ? "Benefic (≥28)" : "Caution (<28)"}
                                  </span>
                                ) : (
                                  <span className="text-stone-400 text-[10px]">N/A</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 18.7 Complete Jaimini System (7 Chara Karakas & Arudhas) */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    {isTamil ? "18.7 ஜைமினி 7-சர காரகங்கள் & ஆரூட பாதங்கள்" : "18.7 Jaimini Chara Karaka Hierarchy & Arudha Padas"}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Karakas Table */}
                    <div className="p-3 rounded-2xl bg-amber-50/40 border border-amber-200">
                      <span className="text-[10px] font-bold text-amber-900 uppercase block mb-1">7 Chara Karakas (Sun to Saturn)</span>
                      <table className="w-full text-[11px] text-left font-mono">
                        <thead>
                          <tr className="border-b border-amber-200 text-stone-500 text-[10px]">
                            <th className="py-1">Karaka</th>
                            <th className="py-1">Planet</th>
                            <th className="py-1">Deg in Sign</th>
                            <th className="py-1">Karakamsha</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-100">
                          {(chartData.jaiminiSystem?.charaKarakas || (Array.isArray(chartData.jaiminiKarakas) ? chartData.jaiminiKarakas : [])).map((k, i) => (
                            <tr key={i}>
                              <td className="py-1 font-bold text-purple-900">{k.role || k.karaka || "-"}</td>
                              <td className="py-1 text-stone-900">{k.planet || k.name || "-"}</td>
                              <td className="py-1">{typeof k.degreeInSign === "number" ? `${k.degreeInSign.toFixed(2)}°` : "-"}</td>
                              <td className="py-1 text-stone-700">{k.karakamsha || k.sign || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Arudha Padas Table */}
                    <div className="p-3 rounded-2xl bg-purple-50/40 border border-purple-200">
                      <span className="text-[10px] font-bold text-purple-900 uppercase block mb-1">Arudha Padas (AL, UL, A1–A12)</span>
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="p-2 rounded-xl bg-white border border-purple-100">
                          <span className="text-[10px] text-stone-500 block">Arudha Lagna (AL)</span>
                          <strong className="text-purple-950">{chartData.jaiminiSystem?.arudhaLagna?.sign || chartData.jaiminiSystem?.AL?.sign || (typeof chartData.jaiminiSystem?.AL === "string" ? chartData.jaiminiSystem.AL : "N/A")}</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-white border border-purple-100">
                          <span className="text-[10px] text-stone-500 block">Upapada Lagna (UL)</span>
                          <strong className="text-purple-950">{chartData.jaiminiSystem?.upapadaLagna?.sign || chartData.jaiminiSystem?.UL?.sign || (typeof chartData.jaiminiSystem?.UL === "string" ? chartData.jaiminiSystem.UL : "N/A")}</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-white border border-purple-100 col-span-2">
                          <span className="text-[10px] text-stone-500 block mb-1">Bhava Arudhas (A1 - A12)</span>
                          <div className="flex flex-wrap gap-1">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(b => (
                              <span key={b} className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 text-[10px] font-bold">
                                A{b}: {chartData.jaiminiSystem?.bhavaPadas?.[b - 1]?.sign || chartData.jaiminiSystem?.bhavaArudhas?.[b - 1]?.sign || "N/A"}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 18.8 Planetary Avasthas Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-amber-600" />
                    {isTamil ? "18.8 கிரக அவஸ்தைகள் (பாலாதி, ஜாக்ரதாதி & தீப்தாதி)" : "18.8 Planetary Avasthas (Baladi, Jagratadi & Deeptadi States)"}
                  </h4>
                  <div className="overflow-x-auto rounded-2xl border border-amber-200 shadow-2xs bg-white">
                    <table className="w-full text-[11px] text-left border-collapse font-mono">
                      <thead>
                        <tr className="bg-amber-100/70 border-b border-amber-200 text-stone-800 text-[10px] uppercase">
                          <th className="p-2">Graha</th>
                          <th className="p-2">Baladi (Age State)</th>
                          <th className="p-2">Jagratadi (Awake State)</th>
                          <th className="p-2">Deeptadi (Luminosity State)</th>
                          <th className="p-2">Operational Potency</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100 text-[11px]">
                        {(Array.isArray(chartData.planetaryAvasthas)
                          ? chartData.planetaryAvasthas
                          : (chartData.planets || [])
                        ).map((p) => {
                          const pName = p.planet || p.name;
                          const av = Array.isArray(chartData.planetaryAvasthas)
                            ? chartData.planetaryAvasthas.find(a => a.planet === pName)
                            : (chartData.planetaryAvasthas?.[pName] || p.avasthas || {});
                          const baladiStr = av?.baladi?.name ?? (typeof av?.baladi === "string" ? av.baladi : null) ?? p.baladiAvastha ?? "N/A";
                          const jagratadiStr = av?.jagratadi?.name ?? (typeof av?.jagratadi === "string" ? av.jagratadi : null) ?? p.jagratadiAvastha ?? "N/A";
                          const deeptadiStr = av?.deeptadi?.name ?? (typeof av?.deeptadi === "string" ? av.deeptadi : null) ?? p.deeptadiAvastha ?? "N/A";
                          const potencyStr = av?.potency ?? av?.baladi?.potency ?? "Evaluated";
                          return (
                            <tr key={pName} className="hover:bg-amber-50/50">
                              <td className="p-2 font-bold text-stone-900">{pName}</td>
                              <td className="p-2">{baladiStr}</td>
                              <td className="p-2">{jagratadiStr}</td>
                              <td className="p-2 text-purple-900 font-medium">{deeptadiStr}</td>
                              <td className="p-2 text-stone-600">{potencyStr}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 18.9 Technical Panchanga Dataset */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    {isTamil ? "18.9 வானியல் பஞ்சாங்க துல்லிய விபரங்கள்" : "18.9 Root-Solved Astronomical Panchanga Elements"}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 p-3 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs font-mono">
                    <div className="p-2 rounded-xl bg-white border border-amber-100">
                      <span className="text-[10px] text-stone-500 uppercase block">Tithi</span>
                      <strong className="text-stone-900">
                        {chartData.dailyPanchang?.tithi
                          ? (typeof chartData.dailyPanchang.tithi === "object"
                            ? `${chartData.dailyPanchang.tithi.name || "N/A"} (${chartData.dailyPanchang.tithi.paksha || ""})${chartData.dailyPanchang.tithi.until ? ` until ${chartData.dailyPanchang.tithi.until}` : ""}`
                            : chartData.dailyPanchang.tithi)
                          : "N/A"}
                      </strong>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-amber-100">
                      <span className="text-[10px] text-stone-500 uppercase block">Nakshatra</span>
                      <strong className="text-stone-900">
                        {chartData.dailyPanchang?.nakshatra
                          ? (typeof chartData.dailyPanchang.nakshatra === "object"
                            ? `${chartData.dailyPanchang.nakshatra.name || "N/A"}${chartData.dailyPanchang.nakshatra.until ? ` until ${chartData.dailyPanchang.nakshatra.until}` : ""}`
                            : chartData.dailyPanchang.nakshatra)
                          : (chartData.moonNakshatra?.name || "N/A")}
                      </strong>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-amber-100">
                      <span className="text-[10px] text-stone-500 uppercase block">Yoga</span>
                      <strong className="text-stone-900">
                        {chartData.dailyPanchang?.yoga
                          ? (typeof chartData.dailyPanchang.yoga === "object"
                            ? chartData.dailyPanchang.yoga.name
                            : chartData.dailyPanchang.yoga)
                          : "N/A"}
                      </strong>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-amber-100">
                      <span className="text-[10px] text-stone-500 uppercase block">Karana</span>
                      <strong className="text-stone-900">
                        {chartData.dailyPanchang?.karana
                          ? (typeof chartData.dailyPanchang.karana === "object"
                            ? chartData.dailyPanchang.karana.name
                            : chartData.dailyPanchang.karana)
                          : "N/A"}
                      </strong>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-amber-100">
                      <span className="text-[10px] text-stone-500 uppercase block">Vaara (Solar Day)</span>
                      <strong className="text-stone-900">
                        {chartData.dailyPanchang?.vaara
                          ? (typeof chartData.dailyPanchang.vaara === "object"
                            ? chartData.dailyPanchang.vaara.name
                            : chartData.dailyPanchang.vaara)
                          : (chartData.dailyPanchang?.vara?.name || "N/A")}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 18.10 Standards Registry & Ephemeris Conventions */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-2">
                  <span className="font-bold text-stone-800 uppercase tracking-wider block">
                    18.10 Standards Registry & Computational Reproducibility Specification
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px] font-mono text-stone-700">
                    <div><strong>Sidereal Engine:</strong> AstroVerse 4.2.0 (VSOP87)</div>
                    <div><strong>Ayanamsha:</strong> Lahiri (Chitra Paksha Anchor 23° 51' 25.5")</div>
                    <div><strong>House System:</strong> Whole-Sign + Sripati / Equal Chalit</div>
                    <div><strong>Dasha Year:</strong> 365.24219878 Tropical Solar Days</div>
                    <div><strong>Lunar Nodes:</strong> Astronomical Mean Node</div>
                    <div><strong>Shadbala System:</strong> Classical Parashari 6-Fold (Virupas)</div>
                  </div>
                  <p className="text-[10px] text-stone-500 pt-1 border-t border-stone-200 italic leading-relaxed">
                    All astronomical planetary coordinates and spherical conversions are calculated directly in local memory. Astrological interpretations follow classical Parashari and Jaimini methodologies and do not constitute legal, medical, or financial assurances.
                  </p>
                </div>
              </div>
            )}

            {/* 19. Multi-System Comparative Analysis (Lahiri vs KP vs Raman vs Tropical) */}
            {(activeTab === "all" || audienceMode === "astrologer" || activeTab === "multiSystemComparison") && multiSystemBundle && (
              <div className="p-5 md:p-6 rounded-3xl bg-white border-2 border-indigo-400 shadow-md space-y-6">
                {/* Chapter Header */}
                <div className="border-b border-indigo-200 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-serif font-bold text-lg md:text-xl text-stone-900 flex items-center gap-2">
                        <Compass className="w-5 h-5 text-indigo-600" />
                        {isTamil ? "19. பல ஜோதிட முறைகளின் ஒப்பீட்டு ஆய்வு" : "19. Multi-System Comparative Analysis"}
                      </h3>
                      <p className="text-xs text-stone-600 mt-1">
                        {isTamil
                          ? "லஹிரி, கே.பி., பி.வி. ராமன் மற்றும் மேற்கத்திய சாயன முறைகளின் சுயாதீன வானியல் கணக்கீடுகள் மற்றும் உடன்பாட்டு பகுப்பாய்வு."
                          : "Deterministic side-by-side comparison across Lahiri (Chitrapaksha), KP (Krishnamurti), Raman, and Tropical (Sayana) systems."}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-indigo-100 text-indigo-900 border border-indigo-200">
                        {multiSystemBundle.comparison.summary.agreementPercentage}% {isTamil ? "உடன்பாடு" : "Sidereal Agreement"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4 Systems Architectural Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-1">
                    <span className="text-[10px] font-bold text-amber-900 uppercase block tracking-wider">1. Lahiri Sidereal</span>
                    <strong className="text-xs text-stone-900 block">Chitrapaksha Ayanamsha</strong>
                    <p className="text-[11px] text-stone-600">Ayanamsha: {multiSystemBundle.comparison.summary.lahiriAyanamsha}</p>
                    <p className="text-[10px] text-stone-500">Whole Sign / Sripati, 16 Vargas, Shadbala, 337-SAV, Jaimini, Dasha.</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-1">
                    <span className="text-[10px] font-bold text-blue-900 uppercase block tracking-wider">2. KP System</span>
                    <strong className="text-xs text-stone-900 block">Krishnamurti Padhdhati</strong>
                    <p className="text-[11px] text-stone-600">Ayanamsha: {multiSystemBundle.comparison.summary.kpAyanamsha}</p>
                    <p className="text-[10px] text-stone-500">Placidus Cusps, 249 Star/Sub-lords, 4-Tier Significators, Ruling Planets.</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-900 uppercase block tracking-wider">3. Raman Sidereal</span>
                    <strong className="text-xs text-stone-900 block">B.V. Raman (397 AD)</strong>
                    <p className="text-[11px] text-stone-600">Ayanamsha: {multiSystemBundle.comparison.summary.ramanAyanamsha}</p>
                    <p className="text-[10px] text-stone-500">Independent recalculation from 397 AD epoch. Full Vedic methodology.</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-1">
                    <span className="text-[10px] font-bold text-purple-900 uppercase block tracking-wider">4. Tropical / Sayana</span>
                    <strong className="text-xs text-stone-900 block">Western Astronomical</strong>
                    <p className="text-[11px] text-stone-600">Ayanamsha: None (0°00'00'')</p>
                    <p className="text-[10px] text-stone-500">Vernal Equinox base, Placidus Houses, Ptolemaic Aspects, Western Dignities.</p>
                  </div>
                </div>

                {/* Cross-System Planetary & Cusp Coordinates Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    {isTamil ? "19.1 நவகிரகங்கள் & லக்ன ஒப்பீட்டு அட்டவணை" : "19.1 Multi-System Calculated Coordinates & Agreement Table"}
                  </h4>
                  <div className="overflow-x-auto rounded-2xl border border-indigo-200 shadow-2xs bg-white">
                    <table className="w-full text-[11px] text-left border-collapse">
                      <thead>
                        <tr className="bg-indigo-100/70 border-b border-indigo-200 text-stone-800 font-mono text-[10px] uppercase">
                          <th className="py-2.5 px-3">Body / Point</th>
                          <th className="py-2.5 px-3">Lahiri (Chitrapaksha)</th>
                          <th className="py-2.5 px-3">KP (Placidus + Sub)</th>
                          <th className="py-2.5 px-3">Raman (397 AD)</th>
                          <th className="py-2.5 px-3">Tropical (Sayana)</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-indigo-100 font-mono text-stone-700">
                        {multiSystemBundle.comparison.comparisons.map((row, idx) => {
                          const badgeColor = row.classification === "AGREEMENT" 
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : row.classification === "PARTIAL AGREEMENT"
                            ? "bg-amber-100 text-amber-900 border-amber-200"
                            : "bg-rose-100 text-rose-800 border-rose-200";

                          return (
                            <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-indigo-50/20"}>
                              <td className="py-2 px-3 font-bold font-sans text-stone-900">{row.body}</td>
                              <td className="py-2 px-3">
                                <div>{row.lahiri.formatted}</div>
                                <div className="text-[10px] font-sans text-stone-500">{row.lahiri.sign} (H{row.lahiri.house}) • {row.lahiri.nakshatra} ({row.lahiri.pada})</div>
                              </td>
                              <td className="py-2 px-3">
                                <div>{row.kp.formatted}</div>
                                <div className="text-[10px] font-sans text-stone-500">{row.kp.sign} (H{row.kp.house}) • Sub: {row.kp.subLord}</div>
                              </td>
                              <td className="py-2 px-3">
                                {row.raman ? (
                                  <>
                                    <div>{row.raman.formatted}</div>
                                    <div className="text-[10px] font-sans text-stone-500">{row.raman.sign} (H{row.raman.house})</div>
                                  </>
                                ) : "—"}
                              </td>
                              <td className="py-2 px-3">
                                {row.tropical ? (
                                  <>
                                    <div>{row.tropical.formatted}</div>
                                    <div className="text-[10px] font-sans text-stone-500">{row.tropical.sign} (H{row.tropical.house}) • {row.tropical.dignity || "—"}</div>
                                  </>
                                ) : "—"}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${badgeColor}`}>
                                  {row.classification}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Technique Applicability Matrix */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    {isTamil ? "19.2 ஜோதிட முறைகளின் கோட்பாட்டு பொருத்தம்" : "19.2 Cross-System Astrological Technique Applicability Matrix"}
                  </h4>
                  <div className="overflow-x-auto rounded-2xl border border-indigo-200 shadow-2xs bg-white">
                    <table className="w-full text-[11px] text-left border-collapse">
                      <thead>
                        <tr className="bg-indigo-100/70 border-b border-indigo-200 text-stone-800 font-mono text-[10px] uppercase">
                          <th className="py-2 px-3">Technique / Framework</th>
                          <th className="py-2 px-3">Lahiri Sidereal</th>
                          <th className="py-2 px-3">KP System</th>
                          <th className="py-2 px-3">Raman Sidereal</th>
                          <th className="py-2 px-3">Tropical Sayana</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-indigo-100 text-stone-700 text-[11px]">
                        {multiSystemBundle.comparison.techniqueMatrix.map((tRow, tIdx) => (
                          <tr key={tIdx} className={tIdx % 2 === 0 ? "bg-white" : "bg-indigo-50/20"}>
                            <td className="py-2 px-3 font-semibold text-stone-900">{tRow.technique}</td>
                            <td className="py-2 px-3">{tRow.lahiri}</td>
                            <td className="py-2 px-3">{tRow.kp}</td>
                            <td className="py-2 px-3">{tRow.raman}</td>
                            <td className="py-2 px-3 text-stone-500 italic">{tRow.tropical}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Transparency Notice */}
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 text-xs text-indigo-950 space-y-1">
                  <span className="font-bold uppercase tracking-wider block text-[11px] text-indigo-900">
                    Computational Integrity & Anti-Fabrication Guarantee
                  </span>
                  <p className="text-[10px] text-indigo-800 leading-relaxed">
                    AstroVerse enforces absolute mathematical isolation across astrology systems. Lahiri, KP, Raman, and Tropical models share astronomical ephemeris observations (VSOP87) but strictly execute their own coordinate transformations and interpretation logic. Classical techniques (Shadbala, Ashtakavarga, Vargas) are never fabricated or silently evaluated on Sayana tropical coordinates.
                  </p>
                </div>
              </div>
            )}

            {/* INTERACTIVE "WHY THIS PREDICTION?" MODAL */}
            {selectedReasoningDomain && (
              <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
                <div className="max-w-2xl w-full bg-[#FFFDF9] rounded-3xl border-2 border-purple-400 p-5 md:p-6 shadow-2xl space-y-4 max-h-[88vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-purple-200 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      <div>
                        <h4 className="font-serif font-bold text-stone-900 text-base md:text-lg">
                          {isTamil ? "ஏன் இந்த பலன் கணிக்கப்பட்டுள்ளது? (Reasoning Chain)" : "Why Am I Getting This Astrological Prediction?"}
                        </h4>
                        <span className="text-xs font-mono font-bold text-purple-800 uppercase">
                          {selectedReasoningDomain} Domain Trace
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedReasoningDomain(null)}
                      className="p-1.5 rounded-xl bg-purple-50 text-purple-900 hover:bg-purple-100 text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  {(() => {
                    const domainChain = calculatePredictionReasoningChain(chartData, selectedReasoningDomain, { lang }) || {};
                    const levels = domainChain.evidenceLevels || domainChain.evidenceChain || domainChain.levels || [];
                    const classification = domainChain.reconciliation?.classification || domainChain.classification || (isTamil ? "சாஸ்திர ஒருமைப்பாடு" : "Classical Astrological Alignment");
                    const summary = isTamil ? (domainChain.whyThisPredictionTa || domainChain.summary) : (domainChain.whyThisPredictionEn || domainChain.summary);
                    return (
                      <div className="space-y-4">
                        <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-xs space-y-1">
                          <div className="flex justify-between font-bold">
                            <span className="text-purple-900">{isTamil ? "முடிவு நிலை:" : "Qualitative Assessment:"}</span>
                            <span className="text-purple-950 font-mono">{classification}</span>
                          </div>
                          <p className="text-stone-700">{summary}</p>
                        </div>

                        {/* 9-Level Chain Hierarchy */}
                        <div className="space-y-2">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                            {isTamil ? "9-அடுக்கு சாஸ்திர ஆதார சங்கிலி" : "9-Level Hierarchical Evidence Chain"}
                          </h5>

                          {levels.map((lvl, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-white border border-stone-200 shadow-2xs space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-purple-900 flex items-center gap-1.5">
                                  <span className="w-4 h-4 rounded-full bg-purple-200 text-purple-900 flex items-center justify-center font-mono text-[9px] font-bold">
                                    {idx + 1}
                                  </span>
                                  {lvl.title || lvl.layer || lvl.name || `Level ${idx + 1}`}
                                </span>
                                {lvl.evidenceId && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-mono text-[9px] font-bold">
                                    {lvl.evidenceId}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-stone-600 leading-relaxed pl-5">
                                {lvl.description || lvl.finding || lvl.detail || lvl.rule}
                              </p>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => setSelectedReasoningDomain(null)}
                          className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
                        >
                          {isTamil ? "மூடுக (Close)" : "Close Trace"}
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* PDF Export & Print Options (End of Master Detailed Report) */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-white to-amber-50 border-2 border-amber-300 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-amber-700" />
                  <h4 className="text-sm font-bold text-stone-900">
                    {isTamil ? "📥 அறிக்கையை PDF ஆக சேமிக்க / அச்சிட" : "📥 Save & Print Astrological Dossier (PDF Download)"}
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">2 Options Available</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handlePrintMinimal}
                  className="p-3.5 rounded-xl border border-amber-300 bg-white hover:bg-amber-50 text-left transition-all shadow-xs flex flex-col justify-between space-y-1 group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5 group-hover:text-amber-700">
                      <FileText className="w-3.5 h-3.5 text-amber-600" />
                      {isTamil ? "1. சுருக்க அறிக்கை PDF (Minimal PDF)" : "1. Save Minimal Snapshot PDF"}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">1-2 Pages</span>
                  </div>
                  <p className="text-[10px] text-stone-600">
                    {isTamil ? "அடிப்படை லக்னம், ராசி, முக்கிய யோகங்கள் மற்றும் 12 பாவக சுருக்கம் மட்டும் சேமிக்க." : "Saves core birth chart, prominent yogas, 12 Bhavas snapshot, and current operating period."}
                  </p>
                </button>

                <button
                  onClick={handlePrintDetailed}
                  className="p-3.5 rounded-xl border-2 border-amber-400 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 hover:bg-amber-100 text-left transition-all shadow-xs flex flex-col justify-between space-y-1 group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5 group-hover:text-amber-800">
                      <Crown className="w-3.5 h-3.5 text-amber-600" />
                      {isTamil ? "2. முழு மகா அறிக்கை PDF (Detailed Master)" : "2. Save Complete Master PDF"}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-bold">All 18 Chapters</span>
                  </div>
                  <p className="text-[10px] text-stone-600">
                    {isTamil ? "18 அத்தியாயங்கள், 16 வர்க்க சக்கரங்கள், ஷட்பலம், அஷ்டகவர்க்கம் மற்றும் முழு காலக்கோடுடன் சேமிக்க." : "Saves full multi-domain life dossier, 16 harmonic vargas, Shadbala, Ashtakavarga, and technical calculations."}
                  </p>
                </button>
              </div>
            </div>

            <div className="p-4 md:p-5 rounded-2xl bg-stone-100/80 border border-stone-300 text-stone-700 space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-stone-300 pb-1.5">
                <span className="font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-stone-600" />
                  {isTamil ? "கணித முறைமை & சாஸ்திர விதிகள் (Calculation Conventions)" : "Calculation Conventions & Reproducibility Standards"}
                </span>
                <span className="text-[10px] font-mono text-stone-600">Standard v2.1</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono">
                <div><strong>Ayanamsha:</strong> Lahiri / Chitrapaksha</div>
                <div><strong>House System:</strong> Whole Sign (Rāśi Bhava)</div>
                <div><strong>Lunar Nodes:</strong> Astronomical Mean Node</div>
                <div><strong>Dasha Year:</strong> 365.2422 Days</div>
              </div>
              <div className="text-[10px] text-stone-500 pt-1 border-t border-stone-200 leading-relaxed">
                <strong>Technical Disclosure:</strong> All planetary coordinates are computed via Astronomy Engine (VSOP87/NOVAS-derived planetary model) with AstroVerse Lahiri / Chitrapaksha Sidereal conversion. Planetary war (Graha Yuddha) is evaluated under classical 1.0° angular threshold; Virupa war reduction is disclosed as unimplemented. Traditional wellness correspondences and gemstone suggestions represent traditional symbolic interpretations and do NOT constitute medical diagnoses or commercial performance guarantees.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
