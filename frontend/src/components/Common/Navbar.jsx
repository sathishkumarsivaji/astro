import React from "react";
import { Sparkles, Moon, Sun, Hand, Compass, Hash, Baby, ShieldCheck, Crown, Globe } from "lucide-react";
import { TRANSLATIONS } from "../../services/localization";

export default function Navbar({ activeTab, setActiveTab, onOpenPricing, userCredits = null, lang = "en", setLang }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const navItems = [
    { id: "horoscope", label: t.navHoroscope, icon: Compass },
    { id: "birthRecovery", label: t.navBirthRecovery, icon: Sparkles },
    { id: "palm", label: t.navPalm, icon: Hand },
    { id: "numerology", label: t.navNumerology, icon: Hash },
    { id: "names", label: t.navNames, icon: Baby },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#FFFDF9]/90 border-b border-amber-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand Identity */}
          <div 
            onClick={() => setActiveTab("horoscope")} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 p-0.5 shadow-md shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-all">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center shadow-inner">
                <Sparkles className="w-6 h-6 text-amber-600 group-hover:rotate-12 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-2xl font-bold tracking-wide bg-gradient-to-r from-amber-900 via-amber-800 to-orange-800 bg-clip-text text-transparent">
                  {t.appName}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                  VEDIC PRO
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 bg-amber-50/80 p-1.5 rounded-full border border-amber-200/80 shadow-inner">
            {navItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white font-bold shadow-md shadow-amber-500/25"
                      : "text-stone-600 hover:text-amber-900 hover:bg-amber-100/70"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-amber-600"}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Language Switcher & Credits */}
          <div className="flex items-center gap-3">
            {/* Tamil / English Toggle Button */}
            <button
              onClick={() => setLang(lang === "en" ? "ta" : "en")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-amber-300 text-xs font-bold text-amber-900 hover:bg-amber-50 transition-all shadow-sm"
              title="Toggle Tamil / English Language"
            >
              <Globe className="w-3.5 h-3.5 text-amber-600" />
              <span>{lang === "en" ? "தமிழ்" : "English"}</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-xs shadow-sm">
              <span className={`w-2 h-2 rounded-full ${userCredits !== null ? "bg-emerald-500 animate-pulse" : "bg-amber-400 animate-ping"}`} />
              <span className="text-stone-500">{t.credits}:</span>
              <span className="font-bold text-amber-800">
                {userCredits !== null ? userCredits : (lang === "ta" ? "இணைக்கிறது..." : "Syncing...")}
              </span>
            </div>

            <button
              onClick={onOpenPricing}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white text-xs font-semibold uppercase tracking-wider hover:brightness-105 shadow-md shadow-amber-600/25 transition-all border border-amber-400/40"
            >
              <Crown className="w-3.5 h-3.5 text-amber-200" />
              <span>{t.upgradePass}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#FFFDF9]/95 backdrop-blur-lg border-t border-amber-200 py-2 px-3 flex justify-around shadow-lg">
        {navItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
                isActive ? "text-amber-700 font-bold bg-amber-100/70" : "text-stone-500"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] tracking-tight">{tab.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
