import React, { useState, lazy, Suspense } from "react";
import Navbar from "./components/Common/Navbar";
import DisclaimerBanner from "./components/Common/DisclaimerBanner";
import HomeDashboard from "./components/Home/HomeDashboard";

// Lazy-loaded feature modules — only downloaded when the user navigates to them
const AskAstroVerseView = lazy(() => import("./components/Ask/AskAstroVerseView"));
const BirthChartForm = lazy(() => import("./components/Horoscope/BirthChartForm"));
const ChartViewer = lazy(() => import("./components/Horoscope/ChartViewer"));
const LifeTimeline = lazy(() => import("./components/Horoscope/LifeTimeline"));
const KundliMatch = lazy(() => import("./components/Horoscope/KundliMatch"));
const DetailedReportModal = lazy(() => import("./components/Horoscope/DetailedReportModal"));
const CalculationCertificateModal = lazy(() => import("./components/Horoscope/CalculationCertificateModal"));
const CameraCapture = lazy(() => import("./components/PalmReader/CameraCapture"));
const PalmReport = lazy(() => import("./components/PalmReader/PalmReport"));
const NumerologyCalc = lazy(() => import("./components/Numerology/NumerologyCalc"));
const NameGenerator = lazy(() => import("./components/BabyNames/NameGenerator"));
const PricingModal = lazy(() => import("./components/Monetization/PricingModal"));
const PrivacyModal = lazy(() => import("./components/Common/PrivacyModal"));
const BirthRecoveryWizard = lazy(() => import("./components/Horoscope/BirthRecoveryWizard"));
const GocharDashboard = lazy(() => import("./components/Horoscope/GocharDashboard"));
const PanchangMuhurta = lazy(() => import("./components/Horoscope/PanchangMuhurta"));
const PersonalizedCalendar = lazy(() => import("./components/Calendar/PersonalizedCalendar"));
const AstrologyJournal = lazy(() => import("./components/Journal/AstrologyJournal"));

import { calculateChartBySystem } from "./astrology";
import { fetchUserCredits } from "./services/aiAstrologyService";
import { TRANSLATIONS } from "./services/localization";
import { Sparkles, FileText, Compass, MessageSquare, Calendar, Heart, Layers, Clock, Hand, Hash, Baby } from "lucide-react";

export default function App() {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem("astro_preferred_lang") || "ta";
    } catch {
      return "ta";
    }
  });

  // 6 Core Architectural Experiences: "home", "chart", "ask", "timeline", "relationships", "explore"
  const [activeTab, setActiveTab] = useState("home");
  const [timelineSubTab, setTimelineSubTab] = useState("dasha"); // "dasha", "gochar"
  const [exploreSubTab, setExploreSubTab] = useState("panchang"); // "panchang", "recovery", "palm", "numerology", "names"
  
  const [isExpertMode, setIsExpertMode] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isDetailedReportOpen, setIsDetailedReportOpen] = useState(false);
  const [isCertOpen, setIsCertOpen] = useState(false);
  const [userCredits, setUserCredits] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [askInitialQuery, setAskInitialQuery] = useState("");

  const showToast = (message, type = "info") => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleSetLang = (newLang) => {
    setLang(newLang);
    try {
      localStorage.setItem("astro_preferred_lang", newLang);
    } catch (e) {
      console.warn("Could not save language preference:", e);
    }
  };

  React.useEffect(() => {
    fetchUserCredits().then(credits => {
      if (typeof credits === "number") {
        setUserCredits(credits);
      }
    }).catch(() => {});
  }, []);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isTamil = lang === "ta";

  const [birthProfile, setBirthProfile] = useState(() => {
    try {
      const saved = localStorage.getItem("astro_active_profile");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [chartData, setChartData] = useState(null);

  // Recompute chartData on initial mount if saved birthProfile exists
  React.useEffect(() => {
    if (birthProfile && !chartData && birthProfile.latitude !== null && birthProfile.longitude !== null && birthProfile.birthDate && birthProfile.birthTime) {
      try {
        const data = calculateChartBySystem(
          birthProfile.system || "lahiri",
          birthProfile
        );
        setChartData({ ...data, profile: birthProfile });
      } catch (err) {
        console.warn("Could not automatically restore chart data:", err);
      }
    }
  }, []);

  const handleApplyProfile = (data) => {
    setChartData(data);
    const prof = data.profile || null;
    setBirthProfile(prof);
    try {
      if (prof) {
        localStorage.setItem("astro_active_profile", JSON.stringify(prof));
      } else {
        localStorage.removeItem("astro_active_profile");
      }
    } catch (e) {
      console.warn("Could not persist active profile:", e);
    }
  };

  const handleSelectPromptFromHome = (queryText) => {
    setAskInitialQuery(queryText);
    setActiveTab("ask");
  };

  const applyRecoveredBirthProfile = ({ birthDate, birthTime, name, birthPlace, latitude, longitude, utcOffset, timezoneId }) => {
    if (!birthDate || !birthTime) {
      showToast(isTamil ? "பிறந்த தேதி மற்றும் நேரம் தேவை." : "Birth date and time are required.", "warning");
      return;
    }

    const lat = Number(latitude);
    const lon = Number(longitude);
    const hasValidCoords = !isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;

    const parsedOffset = Number(utcOffset);
    const validUtcOffset = Number.isFinite(parsedOffset) ? parsedOffset : null;
    const validTimezoneId = timezoneId || null;

    const recoveredProfile = {
      name: name?.trim() || (isTamil ? "ஜாதகர்" : "Native"),
      birthDate,
      birthTime,
      birthPlace: birthPlace?.trim() || "",
      latitude: hasValidCoords ? lat : null,
      longitude: hasValidCoords ? lon : null,
      utcOffset: validUtcOffset,
      timezoneId: validTimezoneId,
      system: "lahiri",
      isDemo: false,
      source: "inferred"
    };

    setBirthProfile(recoveredProfile);
    try {
      localStorage.setItem("astro_active_profile", JSON.stringify(recoveredProfile));
    } catch (e) {
      console.warn("Could not persist recovered profile:", e);
    }

    if (hasValidCoords && validUtcOffset !== null) {
      try {
        const updatedData = calculateChartBySystem(
          recoveredProfile.system || "lahiri",
          recoveredProfile
        );
        setChartData({ ...updatedData, profile: recoveredProfile });
        showToast(isTamil ? "மீட்கப்பட்ட ஜாதகம் வெற்றிகரமாக ஏற்றப்பட்டது!" : "Reconstructed birth chart calculated successfully!", "info");
      } catch (err) {
        console.warn("Recovered chart calculation deferred until location confirmed:", err);
      }
    }
    setActiveTab("chart");
  };

  const [palmTelemetry, setPalmTelemetry] = useState(null);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-stone-800 mystic-gradient pb-20 md:pb-12 relative">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-md px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md transition-all animate-bounce bg-white/95 border-amber-300 text-stone-900 flex items-center justify-between gap-3 text-xs font-semibold">
          <span>{toastMessage.message}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-stone-400 hover:text-stone-700 text-sm ml-2 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Navigation with 6 Core Experiences */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenPricing={() => setIsPricingOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        userCredits={userCredits}
        lang={lang}
        setLang={handleSetLang}
        isExpertMode={isExpertMode}
        setIsExpertMode={setIsExpertMode}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-stone-500 font-medium">{isTamil ? "தரவு ஏற்றப்படுகிறது..." : "Loading module..."}</p>
          </div>
        }>
        
        {/* Active Birth Profile / Demo Warning Banner */}
        {birthProfile?.isDemo && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400 text-amber-900 text-xs font-semibold flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {isTamil
                  ? "⚠️ [மாதிரி ஜாதகம் — இது உங்கள் சுய ஜாதகம் அல்ல]. உங்கள் துல்லியமான ஜாதகத்திற்கு 'என் ஜாதகம்' பிரிவில் உங்கள் உண்மையான பிறந்த விவரங்களை உள்ளிடவும்."
                  : "⚠️ [DEMO CHART — NOT USER DATA]. To generate your authentic personalized horoscope, enter your actual birth details in the My Chart tab."}
              </span>
            </div>
            <button
              onClick={() => { setChartData(null); setBirthProfile(null); }}
              className="px-3 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 text-[11px] font-bold shrink-0"
            >
              {isTamil ? "அழிக்க (Clear)" : "Clear"}
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* EXPERIENCE 1: HOME (Daily Cosmic Briefing & Actionable Hub) */}
        {/* ======================================================== */}
        {activeTab === "home" && (
          <HomeDashboard
            chartData={chartData}
            birthProfile={birthProfile}
            lang={lang}
            onCalculate={handleApplyProfile}
            onOpenReport={() => setIsDetailedReportOpen(true)}
            onOpenAsk={() => setActiveTab("ask")}
            onOpenCert={() => setIsCertOpen(true)}
            onSelectPrompt={handleSelectPromptFromHome}
            userCredits={userCredits}
          />
        )}

        {/* ======================================================== */}
        {/* EXPERIENCE 2: MY CHART (Interactive Birth Chart & Vargas) */}
        {/* ======================================================== */}
        {activeTab === "chart" && (
          <div className="space-y-8 animate-fadeIn">
            <BirthChartForm onCalculate={handleApplyProfile} initialProfile={birthProfile} lang={lang} />
            {chartData && (
              <ChartViewer
                chartData={chartData}
                lang={lang}
                onOpenDetailedReport={() => setIsDetailedReportOpen(true)}
                isExpertMode={isExpertMode}
                onAskAboutPlanet={(query) => {
                  setAskInitialQuery(query);
                  setActiveTab("ask");
                }}
              />
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* EXPERIENCE 3: ASK ASTROVERSE (Conversational AI Copilot) */}
        {/* ======================================================== */}
        {activeTab === "ask" && (
          <AskAstroVerseView
            chartData={chartData}
            lang={lang}
            initialQuery={askInitialQuery}
            onOpenReport={() => setIsDetailedReportOpen(true)}
          />
        )}

        {/* ======================================================== */}
        {/* EXPERIENCE 4: TIMELINE (Life Stages, Dashas, Transits, Calendar, Journal) */}
        {/* ======================================================== */}
        {activeTab === "timeline" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-2xl bg-white border border-amber-200/80 shadow-2xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setTimelineSubTab("dasha")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    timelineSubTab === "dasha"
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs"
                      : "text-stone-600 hover:text-stone-900 hover:bg-amber-50"
                  }`}
                >
                  {isTamil ? "விம்சோத்தரி தசா (0-120 Yrs)" : "Vimshottari Dasha (0–120 Yrs)"}
                </button>
                <button
                  onClick={() => setTimelineSubTab("gochar")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    timelineSubTab === "gochar"
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs"
                      : "text-stone-600 hover:text-stone-900 hover:bg-amber-50"
                  }`}
                >
                  {isTamil ? "கோச்சாரம் & ஏழரை சனி" : "Gochar & Saturn Transits"}
                </button>
                <button
                  onClick={() => setTimelineSubTab("calendar")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    timelineSubTab === "calendar"
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs"
                      : "text-stone-600 hover:text-stone-900 hover:bg-amber-50"
                  }`}
                >
                  {isTamil ? "தினசரி காலண்டர் & தாரா பலம்" : "Daily Transit Calendar"}
                </button>
                <button
                  onClick={() => setTimelineSubTab("journal")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    timelineSubTab === "journal"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-purple-700 hover:text-purple-900 hover:bg-purple-50"
                  }`}
                >
                  {isTamil ? "மைல்கற்கள் பதிவேடு (Journal)" : "Life Milestones Journal"}
                </button>
              </div>
            </div>

            {chartData ? (
              timelineSubTab === "dasha" ? (
                <LifeTimeline
                  lifeStages={chartData.lifeStages}
                  timeline={isTamil ? chartData.timelineTamil : chartData.timeline}
                  eventTiming={chartData.eventTiming}
                  lang={lang}
                />
              ) : timelineSubTab === "gochar" ? (
                <GocharDashboard chartData={chartData} lang={lang} />
              ) : timelineSubTab === "calendar" ? (
                <PersonalizedCalendar chartData={chartData} lang={lang} />
              ) : (
                <AstrologyJournal chartData={chartData} lang={lang} />
              )
            ) : (
              <div className="p-8 rounded-3xl bg-white border border-amber-200 text-center space-y-3 shadow-sm">
                <Sparkles className="w-8 h-8 text-amber-500 mx-auto" />
                <h3 className="text-lg font-serif font-bold text-stone-900">
                  {isTamil ? "ஆயுள் காலக்கோட்டைக் காண ஜாதகத்தை கணிக்கவும்" : "Calculate Horoscope to View Life Timeline"}
                </h3>
                <button
                  onClick={() => setActiveTab("chart")}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all"
                >
                  {isTamil ? "ஜாதகப் படிவத்திற்குச் செல்க" : "Go to Birth Form"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* EXPERIENCE 5: RELATIONSHIPS (36-Guna Match & Synastry)   */}
        {/* ======================================================== */}
        {activeTab === "relationships" && (
          <div className="space-y-6 animate-fadeIn">
            <KundliMatch profile={birthProfile} chartData={chartData} lang={lang} />
          </div>
        )}

        {/* ======================================================== */}
        {/* EXPERIENCE 6: EXPLORE (Panchanga, Recovery, Names, Palm) */}
        {/* ======================================================== */}
        {activeTab === "explore" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Secondary Tabs Navigation */}
            <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-white border border-amber-200/80 shadow-2xs">
              {[
                { id: "panchang", label: isTamil ? "பஞ்சாங்கம் & முகூர்த்தம்" : "Panchanga & Muhurta", icon: Clock },
                { id: "recovery", label: isTamil ? "பிறந்த நேர மீட்பு" : "Birth Recovery", icon: Sparkles },
                { id: "palm", label: isTamil ? "சாமுத்ரிக கைரேகை" : "Palmistry", icon: Hand },
                { id: "numerology", label: isTamil ? "எண் கணிதம்" : "Numerology", icon: Hash },
                { id: "names", label: isTamil ? "குழந்தை பெயர்கள்" : "Baby Names", icon: Baby }
              ].map(sub => {
                const Icon = sub.icon;
                const isSelected = exploreSubTab === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setExploreSubTab(sub.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs"
                        : "text-stone-600 hover:text-stone-900 hover:bg-amber-50"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{sub.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Sub-Views */}
            {exploreSubTab === "panchang" && (
              <PanchangMuhurta chartData={chartData} lang={lang} />
            )}

            {exploreSubTab === "recovery" && (
              <BirthRecoveryWizard
                lang={lang}
                onApplyEstimatedChart={applyRecoveredBirthProfile}
              />
            )}

            {exploreSubTab === "palm" && (
              <div className="space-y-6">
                {!palmTelemetry ? (
                  <CameraCapture onScanComplete={(telemetry) => setPalmTelemetry(telemetry)} lang={lang} />
                ) : (
                  <PalmReport
                    telemetry={palmTelemetry}
                    onRetake={() => setPalmTelemetry(null)}
                    lang={lang}
                  />
                )}
              </div>
            )}

            {exploreSubTab === "numerology" && (
              <NumerologyCalc profile={birthProfile} lang={lang} />
            )}

            {exploreSubTab === "names" && (
              <NameGenerator lang={lang} />
            )}
          </div>
        )}
        </Suspense>
      </main>

      {/* Statutory Disclaimer */}
      <DisclaimerBanner lang={lang} />

      {/* On-Demand Modals Wrapped in Suspense Boundary */}
      <Suspense fallback={null}>
        {/* Detailed Master Dossier Modal */}
        <DetailedReportModal
          isOpen={isDetailedReportOpen}
          onClose={() => setIsDetailedReportOpen(false)}
          chartData={chartData}
          lang={lang}
          onCreditDeducted={(newBal) => setUserCredits(newBal)}
          isExpertMode={isExpertMode}
        />

        {/* Calculation Certificate Modal */}
        <CalculationCertificateModal
          isOpen={isCertOpen}
          onClose={() => setIsCertOpen(false)}
          chartData={chartData}
          lang={lang}
        />

        {/* Pricing & Checkout Modal */}
        <PricingModal
          isOpen={isPricingOpen}
          onClose={() => setIsPricingOpen(false)}
          lang={lang}
          onPlanUpgraded={(details) => {
            if (details?.newBalance !== undefined) {
              setUserCredits(details.newBalance);
              showToast(isTamil ? "கட்டணம் வெற்றிகரமாக செலுத்தப்பட்டு கணக்கு புதுப்பிக்கப்பட்டது!" : "Subscription upgraded and credits updated successfully!", "success");
            }
          }}
        />

        {/* GDPR / DPDP Privacy & Data Governance Modal */}
        <PrivacyModal
          isOpen={isPrivacyOpen}
          onClose={() => setIsPrivacyOpen(false)}
          lang={lang}
          onDataErased={() => {
            setBirthProfile(null);
            setChartData(null);
            setUserCredits(15);
            showToast(isTamil ? "உங்கள் தரவு வெற்றிகரமாக அழிக்கப்பட்டது." : "All account data permanently erased.", "info");
          }}
        />
      </Suspense>
    </div>
  );
}
