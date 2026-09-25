import React, { useState } from "react";
import Navbar from "./components/Common/Navbar";
import DisclaimerBanner from "./components/Common/DisclaimerBanner";
import BirthChartForm from "./components/Horoscope/BirthChartForm";
import ChartViewer from "./components/Horoscope/ChartViewer";
import LifeTimeline from "./components/Horoscope/LifeTimeline";
import KundliMatch from "./components/Horoscope/KundliMatch";
import DetailedReportModal from "./components/Horoscope/DetailedReportModal";
import CameraCapture from "./components/PalmReader/CameraCapture";
import PalmReport from "./components/PalmReader/PalmReport";
import NumerologyCalc from "./components/Numerology/NumerologyCalc";
import NameGenerator from "./components/BabyNames/NameGenerator";
import PricingModal from "./components/Monetization/PricingModal";
import BirthRecoveryWizard from "./components/Horoscope/BirthRecoveryWizard";
import GocharDashboard from "./components/Horoscope/GocharDashboard";
import PanchangMuhurta from "./components/Horoscope/PanchangMuhurta";
import { calculateChartBySystem } from "./astrology";
import { fetchUserCredits } from "./services/aiAstrologyService";
import { TRANSLATIONS } from "./services/localization";
import { Sparkles, FileText } from "lucide-react";

export default function App() {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem("astro_preferred_lang") || "ta";
    } catch {
      return "ta";
    }
  });
  const [activeTab, setActiveTab] = useState("horoscope");
  const [horoscopeSubTab, setHoroscopeSubTab] = useState("chart");
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isDetailedReportOpen, setIsDetailedReportOpen] = useState(false);
  const [userCredits, setUserCredits] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

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

  const applyRecoveredBirthProfile = ({ birthDate, birthTime, name, birthPlace, latitude, longitude, utcOffset, timezoneId }) => {
    if (!birthDate || !birthTime) {
      showToast(lang === "ta" ? "பிறந்த தேதி மற்றும் நேரம் தேவை." : "Birth date and time are required.", "warning");
      return;
    }

    const lat = Number(latitude);
    const lon = Number(longitude);
    const hasValidCoords = !isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;

    const parsedOffset = Number(utcOffset);
    const validUtcOffset = Number.isFinite(parsedOffset) ? parsedOffset : 5.5;

    const recoveredProfile = {
      name: name?.trim() || (lang === "ta" ? "ஜாதகர்" : "Native"),
      birthDate,
      birthTime,
      birthPlace: birthPlace?.trim() || "",
      latitude: hasValidCoords ? lat : null,
      longitude: hasValidCoords ? lon : null,
      utcOffset: validUtcOffset,
      timezoneId: timezoneId || (validUtcOffset === 0 ? "UTC" : "Asia/Kolkata"),
      system: "vedic",
      isDemo: false,
      source: "inferred"
    };

    setBirthProfile(recoveredProfile);
    try {
      localStorage.setItem("astro_active_profile", JSON.stringify(recoveredProfile));
    } catch (e) {
      console.warn("Could not persist recovered profile:", e);
    }

    if (hasValidCoords) {
      const updatedData = calculateChartBySystem(
        recoveredProfile.system || "lahiri",
        recoveredProfile
      );
      setChartData({ ...updatedData, profile: recoveredProfile });
    } else {
      showToast(lang === "ta"
        ? "கணிக்கப்பட்ட பிறந்த நாள் மற்றும் நேரம் படிவத்தில் நிரப்பப்பட்டுள்ளது. துல்லியமான லக்னத்திற்கு தயவுசெய்து உங்கள் பிறந்த ஊரை படிவத்தில் தேர்ந்தெடுக்கவும்."
        : "Estimated birth date and time loaded into the form. Please select your birth place in the form for accurate Lagna and coordinates.", "info");
    }
    setHoroscopeSubTab("chart");
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

      {/* Top Navigation with Full Toggle */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenPricing={() => setIsPricingOpen(true)}
        userCredits={userCredits}
        lang={lang}
        setLang={handleSetLang}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner with Button to Open Comprehensive Detailed Master Dossier */}
        <div className="p-4 md:p-6 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-50 to-amber-100/70 border border-amber-300/80 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-700 flex items-center justify-center border border-amber-400/50 shrink-0 shadow-sm">
              <FileText className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base md:text-lg text-stone-900">
                {t.masterDossierBannerTitle}
              </h3>
              <p className="text-xs text-stone-600">
                {t.masterDossierBannerDesc}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (!chartData) {
                showToast(lang === "ta"
                  ? "விரிவான அறிக்கையைக் காண தயவுசெய்து உங்கள் பிறந்த விவரங்களை உள்ளிட்டு ஜாதகத்தை கணிக்கவும் அல்லது மாதிரி ஜாதகத்தை ஏற்றவும்."
                  : "Please enter your birth details to calculate your chart, or load a demo chart first.", "warning");
                return;
              }
              setIsDetailedReportOpen(true);
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-500/25 hover:brightness-110 flex items-center justify-center gap-2 shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>{t.viewDetailedReport}</span>
          </button>
        </div>

        {/* Active Birth Profile / Demo Warning Banner */}
        {birthProfile?.isDemo && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400 text-amber-900 text-xs font-semibold flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {lang === "ta"
                  ? "⚠️ [மாதிரி ஜாதகம் — இது உங்கள் சுய ஜாதகம் அல்ல]. உங்கள் துல்லியமான ஜாதகத்திற்கு கீழே உள்ள படிவத்தில் உங்கள் உண்மையான பிறந்த நேரம் மற்றும் ஊரை உள்ளிடவும்."
                  : "⚠️ [DEMO CHART — NOT USER DATA]. To generate your authentic personalized horoscope, enter your actual birth details in the form below."}
              </span>
            </div>
            <button
              onClick={() => { setChartData(null); setBirthProfile(null); }}
              className="px-3 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 text-[11px] font-bold shrink-0"
            >
              {lang === "ta" ? "அழிக்க (Clear)" : "Clear"}
            </button>
          </div>
        )}

        {/* Module 1: Horoscope & Kundli */}
        {activeTab === "horoscope" && (
           <div className="space-y-8 animate-fadeIn">
             <div className="flex flex-wrap items-center justify-between gap-4 p-2.5 rounded-2xl bg-white/80 border border-amber-200/80 shadow-sm">
               <div className="flex flex-wrap items-center gap-2">
                 <button
                   onClick={() => setHoroscopeSubTab("chart")}
                   className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                     horoscopeSubTab === "chart"
                       ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25"
                       : "text-stone-600 hover:text-stone-900 hover:bg-amber-50"
                   }`}
                 >
                   {t.subTabChart}
                 </button>
                 <button
                   onClick={() => setHoroscopeSubTab("timeline")}
                   className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                     horoscopeSubTab === "timeline"
                       ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25"
                       : "text-stone-600 hover:text-stone-900 hover:bg-amber-50"
                   }`}
                 >
                   {t.subTabTimeline}
                 </button>
                 <button
                   onClick={() => setHoroscopeSubTab("gochar")}
                   className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                     horoscopeSubTab === "gochar"
                       ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25"
                       : "text-stone-600 hover:text-stone-900 hover:bg-amber-50"
                   }`}
                 >
                   {lang === "ta" ? "கோச்சாரம் & ஏழரை சனி" : "Gochar & Transits"}
                 </button>
                 <button
                   onClick={() => setHoroscopeSubTab("panchang")}
                   className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                     horoscopeSubTab === "panchang"
                       ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25"
                       : "text-stone-600 hover:text-stone-900 hover:bg-amber-50"
                   }`}
                 >
                   {lang === "ta" ? "பஞ்சாங்கம் & முகூர்த்தம்" : "Panchanga & Muhurta"}
                 </button>
                 <button
                   onClick={() => setHoroscopeSubTab("match")}
                   className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                     horoscopeSubTab === "match"
                       ? "bg-rose-600 text-white shadow-md shadow-rose-600/25"
                       : "text-stone-600 hover:text-stone-900 hover:bg-rose-50"
                   }`}
                 >
                   {t.subTabMatch}
                 </button>
                 <button
                   onClick={() => setHoroscopeSubTab("recovery")}
                   className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                     horoscopeSubTab === "recovery"
                       ? "bg-purple-600 text-white shadow-md shadow-purple-600/25"
                       : "text-purple-700 hover:text-purple-900 hover:bg-purple-50"
                   }`}
                 >
                   <Sparkles className="w-3.5 h-3.5" />
                   <span>{t.subTabRecovery}</span>
                 </button>
               </div>

               <div className="text-xs text-stone-500">
                 {t.currentSystem} <span className="text-amber-700 font-bold uppercase">{chartData?.system || "vedic"}</span>
               </div>
             </div>

             {horoscopeSubTab === "chart" && (
               <div className="space-y-8">
                 <BirthChartForm onCalculate={handleApplyProfile} initialProfile={birthProfile} lang={lang} />
                 {chartData && <ChartViewer chartData={chartData} lang={lang} onOpenDetailedReport={() => setIsDetailedReportOpen(true)} />}
               </div>
             )}

             {horoscopeSubTab === "timeline" && (
               chartData ? (
                 <LifeTimeline
                   lifeStages={chartData.lifeStages}
                   timeline={lang === "ta" ? chartData.timelineTamil : chartData.timeline}
                   eventTiming={chartData.eventTiming}
                   lang={lang}
                 />
               ) : (
                 <div className="p-8 rounded-3xl bg-white border border-amber-200 text-center space-y-3 shadow-sm">
                   <Sparkles className="w-8 h-8 text-amber-500 mx-auto" />
                   <h3 className="text-lg font-serif font-bold text-stone-900">
                     {lang === "ta" ? "ஆயுள் காலக்கோட்டைக் காண ஜாதகத்தை கணிக்கவும்" : "Calculate Horoscope to View Life Timeline"}
                   </h3>
                   <p className="text-xs text-stone-600 max-w-md mx-auto">
                     {lang === "ta"
                       ? "மேலே உள்ள 'ஜாதக கட்டம்' பிரிவில் உங்கள் பிறந்த நாள், நேரம் மற்றும் ஊரை உள்ளிட்டு ஜாதகத்தை கணிக்கவும் அல்லது மாதிரி ஜாதகத்தை ஏற்றவும்."
                       : "Please enter your birth date, time and location in the Chart tab to generate your chronological life timeline, or load a demo chart."}
                   </p>
                   <button
                     onClick={() => setHoroscopeSubTab("chart")}
                     className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all"
                   >
                     {lang === "ta" ? "ஜாதகப் படிவத்திற்குச் செல்க" : "Go to Birth Form"}
                   </button>
                 </div>
               )
             )}

             {horoscopeSubTab === "gochar" && (
               <GocharDashboard chartData={chartData} lang={lang} />
             )}

             {horoscopeSubTab === "panchang" && (
               <PanchangMuhurta chartData={chartData} lang={lang} />
             )}

             {horoscopeSubTab === "match" && (
               <KundliMatch profile={birthProfile} chartData={chartData} lang={lang} />
             )}

             {horoscopeSubTab === "recovery" && (
               <BirthRecoveryWizard
                 lang={lang}
                 onApplyEstimatedChart={applyRecoveredBirthProfile}
               />
             )}
           </div>
         )}

        {/* Module: Nashta Jataka Birth Recovery Dedicated Top-level Tab */}
        {activeTab === "birthRecovery" && (
          <div className="space-y-8 animate-fadeIn">
            <BirthRecoveryWizard
              lang={lang}
              onApplyEstimatedChart={(params) => {
                applyRecoveredBirthProfile(params);
                setActiveTab("horoscope");
              }}
            />
          </div>
        )}

        {/* Module 2: AI Palm Reading */}
        {activeTab === "palm" && (
          <div className="space-y-8 animate-fadeIn">
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

        {/* Module 3: Numerology Matrix */}
        {activeTab === "numerology" && (
          <div className="space-y-8 animate-fadeIn">
            <NumerologyCalc profile={birthProfile} lang={lang} />
          </div>
        )}

        {/* Module 4: Kids' Name Generator */}
        {activeTab === "names" && (
          <div className="space-y-8 animate-fadeIn">
            <NameGenerator lang={lang} />
          </div>
        )}
      </main>

      {/* Statutory Disclaimer */}
      <DisclaimerBanner lang={lang} />

      {/* Detailed Master Dossier Modal */}
      <DetailedReportModal
        isOpen={isDetailedReportOpen}
        onClose={() => setIsDetailedReportOpen(false)}
        chartData={chartData}
        lang={lang}
        onCreditDeducted={(newBal) => setUserCredits(newBal)}
      />

      {/* Pricing & Checkout Modal */}
      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        lang={lang}
      />
    </div>
  );
}
