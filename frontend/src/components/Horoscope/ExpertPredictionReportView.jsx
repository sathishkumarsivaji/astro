import React, { useState, useMemo } from "react";
import {
  Calendar,
  Clock,
  Shield,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Info,
  ExternalLink,
  Heart,
  Home,
  Briefcase,
  GraduationCap,
  Baby,
  Plane,
  Car,
  TrendingUp,
  Coins,
  Users,
  Award,
  Activity,
  Scale,
  Compass,
  Milestone,
  FileCode
} from "lucide-react";

import {
  generateExpertReport,
  calculateElectionalMuhurta,
  RESOLUTION_LABELS,
  CONFIDENCE_TYPE,
  SUB_PHASE_STATUS,
  DOMAIN
} from "../../services/expertPrediction";

// Domain icon map
const DOMAIN_ICONS = {
  [DOMAIN.MARRIAGE]: Heart,
  [DOMAIN.PROPERTY]: Home,
  [DOMAIN.CAREER]: Briefcase,
  [DOMAIN.EDUCATION]: GraduationCap,
  [DOMAIN.CHILDREN]: Baby,
  [DOMAIN.FOREIGN_TRAVEL]: Plane,
  [DOMAIN.VEHICLE]: Car,
  [DOMAIN.BUSINESS]: TrendingUp,
  [DOMAIN.JOB]: Briefcase,
  [DOMAIN.FINANCE]: Coins,
  [DOMAIN.FAMILY]: Users,
  [DOMAIN.LEADERSHIP]: Award,
  [DOMAIN.WELLNESS]: Activity,
  [DOMAIN.LEGAL]: Scale,
  [DOMAIN.SPIRITUAL]: Compass,
  [DOMAIN.CAUTION]: ShieldAlert,
  [DOMAIN.MILESTONES]: Milestone
};

export default function ExpertPredictionReportView({ chartData, lang = "en" }) {
  const isTamil = lang === "ta";
  const [selectedDomain, setSelectedDomain] = useState(DOMAIN.MARRIAGE);
  const [showEvidenceModal, setShowEvidenceModal] = useState(null);
  const [activeMuhurtaWindow, setActiveMuhurtaWindow] = useState(null);
  const [muhurtaResult, setMuhurtaResult] = useState(null);
  const [activeSubPhaseTab, setActiveSubPhaseTab] = useState(null);

  // Compute expert report memoized
  const expertReport = useMemo(() => {
    try {
      return generateExpertReport(chartData, lang);
    } catch (err) {
      console.error("Expert report generation failed:", err);
      return null;
    }
  }, [chartData, lang]);

  if (!expertReport || !expertReport.domainResults) {
    return (
      <div className="p-8 text-center bg-amber-50 rounded-2xl border border-amber-200 text-stone-700">
        <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
        <p className="font-semibold">
          {isTamil
            ? "நிபுணர் பயன்முறை அறிக்கை தயாரிப்பதில் சிக்கல் ஏற்பட்டது."
            : "Unable to generate Expert Mode prediction report. Please verify chart data."}
        </p>
      </div>
    );
  }

  const { domainResults, crossDomainAnalysis, reportMeta } = expertReport;
  const currentDomainResult = domainResults[selectedDomain];

  const handleComputeMuhurta = (window) => {
    setActiveMuhurtaWindow(window);
    const lat = chartData?.latitude;
    const lng = chartData?.longitude;
    const tzOffset = chartData?.utcOffset ?? chartData?.timezoneOffsetHours ?? chartData?.tz;
    const tzId = chartData?.timezoneId ?? chartData?.ianaTimezone ?? null;

    if (typeof lat !== "number" || !Number.isFinite(lat) ||
        typeof lng !== "number" || !Number.isFinite(lng) ||
        typeof tzOffset !== "number" || !Number.isFinite(tzOffset)) {
      setMuhurtaResult({
        status: "INSUFFICIENT_DATA",
        domain: selectedDomain,
        muhurtaCandidates: [],
        guidanceEn: "Location coordinates (latitude, longitude) or timezone offset are missing from chart data. Muhurta cannot be calculated without verified geographic coordinates.",
        guidanceTa: "ஜாதகத்தில் அட்சரேகை, தீர்க்கரேகை அல்லது நேர மண்டல விவரங்கள் இல்லை. புவியியல் அமைப்பின்றி முகூர்த்தம் கணக்கிட முடியாது."
      });
      return;
    }

    const res = calculateElectionalMuhurta({
      domain: selectedDomain,
      timingWindow: window,
      location: {
        latitude: lat,
        longitude: lng,
        timezoneOffsetHours: tzOffset,
        timezoneId: tzId
      },
      isTamil
    });
    setMuhurtaResult(res);
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header Bar ── */}
      <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-purple-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 text-violet-200 border border-violet-400/30 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              {isTamil ? "உயர் துல்லிய நிபுணர் காலக்கோடு" : "Expert Mode — Precision Life-Event Timeline"}
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
              {isTamil
                ? "17-கள ஆதாரபூர்வ ஜோதிட கணிப்பு அறிக்கை"
                : "17-Domain Evidence-Derived Astrological Timeline"}
            </h2>
            <p className="text-xs md:text-sm text-violet-200/90 mt-1 max-w-2xl">
              {isTamil
                ? "எந்த ஊகங்களும் இல்லாமல், மூல ஜாதகம், தசா புக்தி, கோச்சாரம் மற்றும் வர்க்க சக்கரங்களின் ஒருங்கிணைவு அடிப்படையில் கணக்கிடப்பட்ட காலங்கள்."
                : "Strictly calculation-grounded timing windows with explicit resolution declarations, WHY & WHY NOT evidence chains, and sub-phase decomposition."}
            </p>
          </div>
          <div className="flex md:flex-col items-center md:items-end justify-between gap-2 border-t md:border-t-0 md:border-l border-violet-800/80 pt-3 md:pt-0 md:pl-6 text-right">
            <div>
              <div className="text-[11px] text-violet-300 uppercase tracking-wider font-semibold">
                {isTamil ? "ஆய்வு செய்யப்பட்ட களங்கள்" : "Domains Analyzed"}
              </div>
              <div className="text-lg font-black text-amber-300">
                {Object.values(domainResults || {}).filter(d => d.outlook === 'SUPPORTED' && d.primaryWindows?.length > 0).length} / {Object.keys(domainResults || {}).length} {isTamil ? "முழுமை" : "Fully Supported"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-violet-300">
                {Object.keys(domainResults || {}).length} {isTamil ? "களங்கள்" : "Domains"} • {Object.values(domainResults || {}).filter(d => d.outlook === 'SUPPORTED' && d.primaryWindows?.length > 0).length} {isTamil ? "முழுமை" : "Supported"} • {Object.values(domainResults || {}).filter(d => d.outlook === 'PARTIAL' || (d.outlook === 'SUPPORTED' && (!d.primaryWindows || d.primaryWindows.length === 0))).length} {isTamil ? "பகுதி" : "Partial"} • {Object.values(domainResults || {}).filter(d => d.outlook === 'INSUFFICIENT_DATA' || d.outlook === 'NOT_ESTABLISHED').length} {isTamil ? "போதிய தரவில்லை" : "Insufficient"}
              </div>
              <div className="text-[10px] text-violet-300/80 mt-0.5">
                {reportMeta.totalPrimaryWindows} {isTamil ? "சுப சாளரங்கள்" : "Primary Windows"} • {reportMeta.totalCautionWindows} {isTamil ? "எச்சரிக்கை சாளரங்கள்" : "Caution Windows"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Cross-Domain Synergies & Conflicts Alert (if any) ── */}
      {crossDomainAnalysis?.crossDomainConflicts?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <span className="font-bold">
              {isTamil ? "குறுக்கு-கள முரண்பாடுகள் கண்டறியப்பட்டுள்ளன:" : "Cross-Domain Friction Window Detected:"}
            </span>
            <ul className="list-disc list-inside space-y-0.5 text-amber-800">
              {crossDomainAnalysis.crossDomainConflicts.map((c, i) => (
                <li key={i}>{c.description} ({c.overlapStart} – {c.overlapEnd})</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── 17 Domain Horizontal Navigation ── */}
      <div className="border-b border-stone-200 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto py-2 no-scrollbar scroll-smooth">
          {Object.keys(domainResults).map((domKey) => {
            const dom = domainResults[domKey];
            const Icon = DOMAIN_ICONS[domKey] || Layers;
            const isSelected = selectedDomain === domKey;
            const hasWindows = (dom.primaryWindows?.length || 0) > 0;
            const hasCaution = (dom.cautionWindows?.length || 0) > 0;

            return (
              <button
                key={domKey}
                onClick={() => {
                  setSelectedDomain(domKey);
                  setActiveMuhurtaWindow(null);
                  setMuhurtaResult(null);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                  isSelected
                    ? "bg-violet-700 text-white shadow-md shadow-violet-700/20 scale-[1.02]"
                    : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200/80"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-amber-300" : "text-violet-600"}`} />
                <span>{isTamil ? dom.domainLabelTamil : dom.domainLabel}</span>
                {hasCaution && (
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-amber-300" : "bg-amber-500"}`} />
                )}
                {hasWindows && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isSelected ? "bg-violet-800 text-violet-200" : "bg-stone-100 text-stone-600"
                  }`}>
                    {dom.primaryWindows.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Active Domain Detailed View ── */}
      {currentDomainResult && (
        <div className="space-y-6">
          {/* Domain Overview Card */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-stone-900">
                    {isTamil ? currentDomainResult.domainLabelTamil : currentDomainResult.domainLabel}
                  </h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase ${
                    currentDomainResult.outlook === "SUPPORTED"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : currentDomainResult.outlook === "PARTIAL"
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : "bg-stone-100 text-stone-600 border border-stone-200"
                  }`}>
                    {currentDomainResult.outlook}
                  </span>
                </div>
                {currentDomainResult.natalPromise?.status && (
                  <p className="text-xs text-stone-600 mt-1">
                    <span className="font-semibold text-stone-800">
                      {isTamil ? "மூல ஜாதக நிலை: " : "Natal Promise: "}
                    </span>
                    {currentDomainResult.natalPromise.status}
                  </p>
                )}
              </div>

              {/* Resolution Badge */}
              <div className="flex items-center gap-2 self-start md:self-auto bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200/80">
                <Clock className="w-3.5 h-3.5 text-violet-600" />
                <div className="text-[11px]">
                  <span className="text-stone-500 font-medium">
                    {isTamil ? "துல்லிய நிலை: " : "Resolution: "}
                  </span>
                  <span className="font-bold text-violet-900">
                    {RESOLUTION_LABELS[currentDomainResult.resolution]?.[isTamil ? "ta" : "en"] || currentDomainResult.resolution}
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-Phases Assessment Grid */}
            {currentDomainResult.subPhases?.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  {isTamil ? "துணை-கட்ட பகுப்பாய்வு (Sub-Phases)" : "Sub-Phase Evidence Breakdown"}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {currentDomainResult.subPhases.map((sp, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between ${
                        sp.status === SUB_PHASE_STATUS.SUPPORTED
                          ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                          : sp.status === SUB_PHASE_STATUS.NOT_ESTABLISHED
                          ? "bg-stone-50 border-stone-200 text-stone-600"
                          : "bg-slate-50 border-slate-200 text-slate-500 opacity-75"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold truncate">
                          {isTamil ? (sp.labelTamil || sp.label) : sp.label}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                          sp.status === SUB_PHASE_STATUS.SUPPORTED
                            ? "bg-emerald-200 text-emerald-900"
                            : "bg-stone-200 text-stone-700"
                        }`}>
                          {sp.status === SUB_PHASE_STATUS.SUPPORTED ? "SUPPORTED" : "UNPROVEN"}
                        </span>
                      </div>
                      {sp.why && (
                        <p className="text-[10px] mt-1 text-stone-600 line-clamp-2">
                          {sp.why}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Primary Timing Windows ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-stone-900 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-violet-600" />
                {isTamil ? "கணக்கிடப்பட்ட சுப காலங்கள் (Timing Windows)" : "Qualified Timing Windows"}
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 font-extrabold">
                  {currentDomainResult.primaryWindows?.length || 0}
                </span>
              </h4>
            </div>

            {currentDomainResult.primaryWindows?.length === 0 ? (
              <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200 text-center text-xs text-stone-600">
                {isTamil
                  ? "இந்த களத்திற்கு போதிய ஒருங்கிணைவு கொண்ட முதன்மை சுப சாளரம் கண்டறியப்படவில்லை."
                  : "No strongly supported primary timing window currently isolated for this domain."}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {currentDomainResult.primaryWindows.map((win, idx) => (
                  <div
                    key={win.windowId || idx}
                    className="bg-white rounded-2xl border-2 border-stone-200/90 hover:border-violet-400 p-5 shadow-sm transition-all space-y-4"
                  >
                    {/* Window Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-800 flex items-center justify-center font-black text-xs">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="text-sm font-black text-stone-900">
                            {win.startDate} → {win.endDate}
                          </div>
                          <div className="text-[10px] text-stone-500 font-medium">
                            {win.windowId} • {RESOLUTION_LABELS[win.resolution]?.[isTamil ? "ta" : "en"] || win.resolution}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${
                          win.confidenceType === CONFIDENCE_TYPE.PEAK_CONVERGENCE
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : win.confidenceType === CONFIDENCE_TYPE.STRONG_CONVERGENCE
                            ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                            : "bg-blue-100 text-blue-900 border border-blue-200"
                        }`}>
                          {win.confidenceType?.replace(/_/g, " ")}
                        </span>
                        <button
                          onClick={() => handleComputeMuhurta(win)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3 text-amber-200" />
                          {isTamil ? "முகூர்த்தம்" : "Muhurta"}
                        </button>
                      </div>
                    </div>

                    {/* Dasha & Transit Matrix for this Window */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-stone-50/80 p-3 rounded-xl border border-stone-200/60 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-stone-500 block uppercase">
                          {isTamil ? "மகா தசா" : "Mahadasha"}
                        </span>
                        <span className="font-extrabold text-stone-800">
                          {win.dashaFacts?.md?.lord || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-stone-500 block uppercase">
                          {isTamil ? "அந்தர்தசா" : "Antardasha"}
                        </span>
                        <span className="font-extrabold text-stone-800">
                          {win.dashaFacts?.ad?.lord || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-stone-500 block uppercase">
                          {isTamil ? "பிரத்தியந்தர தசா" : "Pratyantar (Peak)"}
                        </span>
                        <span className="font-extrabold text-stone-800">
                          {win.dashaFacts?.pd?.lord || (isTamil ? "பொதுவான காலம்" : "Full AD span")}
                        </span>
                      </div>
                    </div>

                    {/* WHY Section */}
                    {win.whySupported?.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[11px] font-extrabold text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          {isTamil ? "ஏன் இந்த காலக்கோடு ஆதரிக்கப்படுகிறது (WHY Supported):" : "WHY This Window is Supported:"}
                        </div>
                        <ul className="text-xs text-stone-700 space-y-1 pl-5 list-disc">
                          {win.whySupported.map((f, fi) => (
                            <li key={fi}>{isTamil ? (f.descriptionTamil || f.description) : f.description}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* WHY NOT Stronger Section */}
                    {win.whyNotStronger?.length > 0 && (
                      <div className="space-y-1 bg-amber-50/60 p-3 rounded-xl border border-amber-200/50">
                        <div className="text-[11px] font-extrabold text-amber-900 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          {isTamil ? "ஏன் இன்னும் வலிமையாக இல்லை (WHY NOT Stronger):" : "WHY NOT Stronger / Counter-Factors:"}
                        </div>
                        <ul className="text-xs text-amber-900 space-y-0.5 pl-5 list-disc">
                          {win.whyNotStronger.map((c, ci) => (
                            <li key={ci}>{isTamil ? (c.descriptionTamil || c.description) : c.description}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Precision Limits */}
                    {win.whatPreventsGreaterPrecision?.length > 0 && (
                      <div className="text-[11px] text-stone-500 italic pl-1 flex items-center gap-1">
                        <Info className="w-3 h-3 text-stone-400" />
                        <span>
                          {isTamil ? "துல்லிய வரம்பு: " : "Precision limit: "}
                          {win.whatPreventsGreaterPrecision.map(p => isTamil ? (p.descriptionTamil || p.description) : p.description).join("; ")}
                        </span>
                      </div>
                    )}

                    {/* Machine Evidence Toggle */}
                    <div className="border-t border-stone-100 pt-2 flex justify-end">
                      <button
                        onClick={() => setShowEvidenceModal(showEvidenceModal === win.windowId ? null : win.windowId)}
                        className="text-[10px] text-violet-700 hover:text-violet-900 font-bold flex items-center gap-1"
                      >
                        <FileCode className="w-3 h-3" />
                        {showEvidenceModal === win.windowId
                          ? (isTamil ? "சான்றுகளை மறை" : "Hide Raw Evidence")
                          : (isTamil ? "கணக்கீட்டு சான்றுகள்" : "Inspect Machine Evidence")}
                      </button>
                    </div>

                    {/* Raw Machine Evidence Drawer */}
                    {showEvidenceModal === win.windowId && (
                      <div className="bg-stone-900 text-stone-200 p-3 rounded-xl text-[10px] font-mono overflow-x-auto space-y-1">
                        <div className="text-amber-400 font-bold"># Canonical Evidence Ledger</div>
                        <div>CalculationVersion: {win.calculationVersion} | Ephemeris: {win.ephemerisVersion}</div>
                        <div>Resolution: {win.resolution} | StrengthScore: {win.strength}</div>
                        <div>TransitHits: {JSON.stringify(win.transitFacts?.length || 0)}</div>
                        <div>VargaConfirmations: {JSON.stringify(win.vargaFacts || [])}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Caution & Guarded Windows ── */}
          {currentDomainResult.cautionWindows?.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-black text-amber-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                {isTamil ? "எச்சரிக்கை காலங்கள் (Caution Windows)" : "Caution & Remedial Vigilance Windows"}
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold">
                  {currentDomainResult.cautionWindows.length}
                </span>
              </h4>

              <div className="grid grid-cols-1 gap-3">
                {currentDomainResult.cautionWindows.map((cwin, cidx) => (
                  <div
                    key={cwin.windowId || cidx}
                    className="bg-amber-50/80 rounded-2xl border border-amber-300 p-4 space-y-2 text-xs text-amber-950"
                  >
                    <div className="flex items-center justify-between font-black text-amber-900">
                      <span>{cwin.startDate} → {cwin.endDate}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-amber-200 text-amber-900 uppercase font-black">
                        GUARDED PERIOD
                      </span>
                    </div>
                    {cwin.contradictions?.length > 0 && (
                      <ul className="list-disc list-inside space-y-0.5 text-amber-900">
                        {cwin.contradictions.map((c, ci) => (
                          <li key={ci}>{isTamil ? (c.descriptionTamil || c.description) : c.description}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Electional Muhurta Results Drawer (if triggered) ── */}
          {muhurtaResult && activeMuhurtaWindow && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-400 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  <h4 className="text-sm font-black text-stone-900">
                    {isTamil ? "முகூர்த்த கணிப்பு முடிவுகள்" : "Electional Muhurta Screen"} ({muhurtaResult.eventType})
                  </h4>
                </div>
                <button
                  onClick={() => setMuhurtaResult(null)}
                  className="text-xs text-stone-500 hover:text-stone-800 font-bold"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-stone-700">
                {isTamil ? muhurtaResult.summaryTa : muhurtaResult.summaryEn}
              </p>

              {muhurtaResult.muhurtaCandidates?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {muhurtaResult.muhurtaCandidates.map((m, mi) => (
                    <div key={mi} className="bg-white p-3 rounded-xl border border-amber-200 text-xs space-y-1">
                      <div className="flex items-center justify-between font-black text-stone-900">
                        <span>{m.date}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                          Score: {m.score}/100
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-600">
                        Tithi: {m.tithi?.name || "—"} • Nakshatra: {m.nakshatra?.name || "—"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                muhurtaResult.guidanceEn && (
                  <p className="text-xs text-amber-900 italic bg-white/60 p-2.5 rounded-lg border border-amber-200">
                    {isTamil ? muhurtaResult.guidanceTa : muhurtaResult.guidanceEn}
                  </p>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
