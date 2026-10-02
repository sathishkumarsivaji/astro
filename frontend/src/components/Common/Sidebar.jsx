import React from "react";
import {
  Sparkles,
  Compass,
  MessageSquare,
  Calendar,
  Heart,
  Layers,
  Clock,
  Hand,
  Hash,
  Baby,
  FileText,
  ShieldCheck,
  Crown,
  ChevronLeft,
  ChevronRight,
  X,
  BookOpen,
  Award
} from "lucide-react";
import { TRANSLATIONS } from "../../services/localization";

export default function Sidebar({
  activeTab,
  setActiveTab,
  exploreSubTab,
  setExploreSubTab,
  timelineSubTab,
  setTimelineSubTab,
  isOpen,
  setIsOpen,
  isCollapsed,
  setIsCollapsed,
  isRegistered,
  onOpenAuth,
  onOpenPricing,
  onOpenPrivacy,
  onOpenCert,
  lang = "en"
}) {
  const isTamil = lang === "ta";
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const mainNavItems = [
    { id: "home", label: isTamil ? "முகப்பு" : "Home", icon: Sparkles, desc: isTamil ? "தினசரி பார்வை & வழிகாட்டல்" : "Daily Cosmic Overview" },
    { id: "chart", label: isTamil ? "என் ஜாதகம்" : "My Chart", icon: Compass, desc: isTamil ? "D1-D60 சக்கரங்கள் & கிரகங்கள்" : "Vedic Birth Kundli & Vargas" },
    { id: "ask", label: isTamil ? "கேளுங்கள்" : "Ask AstroVerse", icon: MessageSquare, desc: isTamil ? "AI ஜோதிட வழிகாட்டல்" : "AI Master Consultation" },
    { id: "timeline", label: isTamil ? "காலக்கோடு" : "Timeline", icon: Calendar, desc: isTamil ? "0-120 ஆண்டு தசா கட்டங்கள்" : "0–120 Yrs Dasha & Gochara" },
    { id: "relationships", label: isTamil ? "பொருத்தம்" : "Relationships", icon: Heart, desc: isTamil ? "14 பரிமாண திருமண பொருத்தம்" : "14-Domain Kundli Matching" },
    { id: "explore", label: isTamil ? "ஆராய்க" : "Explore Tools", icon: Layers, desc: isTamil ? "பஞ்சாங்கம், கைரேகை, எண்கள்" : "Panchang, Palm, Numerology" }
  ];

  const exploreSubItems = [
    { id: "rectification", label: isTamil ? "பிறந்த நேர திருத்தம்" : "Birth-Time Rectification", icon: ShieldCheck },
    { id: "panchang", label: isTamil ? "பஞ்சாங்கம் & முகூர்த்தம்" : "Panchang & Muhurta", icon: Clock },
    { id: "recovery", label: isTamil ? "பிறப்பு நேரம் மீட்பு (நஷ்ட ஜாதகம்)" : "Birth Recovery Wizard", icon: Clock },
    { id: "palm", label: isTamil ? "கைரேகை ஆய்வு" : "Palmistry Analysis", icon: Hand },
    { id: "numerology", label: isTamil ? "வேத எண் கணிதம்" : "Vedic Numerology", icon: Hash },
    { id: "names", label: isTamil ? "குழந்தை பெயர்கள்" : "Baby Name Generator", icon: Baby },
    { id: "journal", label: isTamil ? "ஜோதிட நாட்குறிப்பு" : "Astrology Journal", icon: BookOpen },
    { id: "calendar", label: isTamil ? "தனிப்பயன் நாட்காட்டி" : "Personalized Calendar", icon: Calendar }
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  const handleSubNavClick = (subId) => {
    if (subId === "journal" || subId === "calendar") {
      setActiveTab("timeline");
      if (setTimelineSubTab) setTimelineSubTab(subId);
    } else {
      setActiveTab("explore");
      if (setExploreSubTab) setExploreSubTab(subId);
    }
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#FFFDF9] border-r border-amber-200/90 shadow-lg lg:shadow-xs transition-all duration-300 flex flex-col justify-between ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "lg:w-20" : "lg:w-64"} w-72`}
      >
        {/* Top Sidebar Header / Branding */}
        <div className="p-4 border-b border-amber-100 flex items-center justify-between">
          <div
            onClick={() => { setActiveTab("home"); if (window.innerWidth < 1024) setIsOpen(false); }}
            className="flex items-center gap-3 cursor-pointer group overflow-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 p-0.5 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-all shrink-0">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center shadow-inner">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-serif text-lg font-bold tracking-wide bg-gradient-to-r from-amber-900 to-orange-800 bg-clip-text text-transparent">
                    {t.appName}
                  </span>
                  <span className="text-[9px] font-extrabold uppercase px-1 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                    V2
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 font-medium truncate">
                  {isTamil ? "வேத வானியல் நுண்ணறிவு" : "Vedic Astrology Intelligence"}
                </p>
              </div>
            )}
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop Collapse Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-stone-400 hover:text-amber-900 hover:bg-amber-100/70 transition-all"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4 text-amber-700" /> : <ChevronLeft className="w-4 h-4 text-amber-700" />}
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
          <div className={`px-2 text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2 ${isCollapsed ? "hidden" : "block"}`}>
            {isTamil ? "முக்கிய பகுதிகள்" : "Navigation"}
          </div>

          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isLocked = !isRegistered && item.lockedForGuest;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={isCollapsed ? `${item.label}${isLocked ? " (Locked)" : ""}` : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative ${
                  isActive
                    ? "bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white font-bold shadow-sm shadow-amber-500/25"
                    : "text-stone-700 hover:text-amber-950 hover:bg-amber-100/70"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-amber-600 group-hover:scale-110"} transition-transform`} />
                
                {!isCollapsed && (
                  <div className="flex-1 text-left truncate flex items-center justify-between">
                    <span className="truncate">{item.label}</span>
                    {isLocked && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-100/80 text-amber-900 rounded font-bold border border-amber-300/60 ml-1.5">
                        🔒
                      </span>
                    )}
                  </div>
                )}

                {isCollapsed && isLocked && (
                  <span className="absolute top-1 right-1 text-[8px]">🔒</span>
                )}
              </button>
            );
          })}

          {/* Sub-Items / Tools Drawer (When on Explore or Expanded) */}
          {!isCollapsed && (
            <div className="pt-4 space-y-1">
              <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                {isTamil ? "கூடுதல் ஆய்வுக் கருவிகள்" : "Specialized Tools"}
              </div>
              {exploreSubItems.map((sub) => {
                const SubIcon = sub.icon;
                const isSubActive = activeTab === "explore" && exploreSubTab === sub.id;

                return (
                  <button
                    key={sub.id}
                    onClick={() => handleSubNavClick(sub.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-all ${
                      isSubActive
                        ? "bg-amber-100 text-amber-950 font-bold border border-amber-300/80"
                        : "text-stone-600 hover:text-amber-900 hover:bg-amber-50/80"
                    }`}
                  >
                    <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? "text-amber-700" : "text-stone-400"}`} />
                    <span className="truncate">{sub.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Sidebar Footer: Certification, Privacy & Pricing */}
        <div className="p-3 border-t border-amber-100 bg-amber-50/40 space-y-1.5">
          {onOpenCert && (
            <button
              onClick={() => { onOpenCert(); if (window.innerWidth < 1024) setIsOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:text-amber-950 hover:bg-amber-100/60 border border-amber-200/60 transition-all ${
                isCollapsed ? "justify-center" : ""
              }`}
              title={isTamil ? "வானியல் சான்றிதழ்" : "Calculation Certificate"}
            >
              <Award className="w-4 h-4 text-amber-600 shrink-0" />
              {!isCollapsed && <span className="truncate">{isTamil ? "கணக்கீட்டு சான்றிதழ்" : "Ephemeris Certificate"}</span>}
            </button>
          )}

          {onOpenPrivacy && (
            <button
              onClick={() => { onOpenPrivacy(); if (window.innerWidth < 1024) setIsOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:text-amber-950 hover:bg-amber-100/60 border border-amber-200/60 transition-all ${
                isCollapsed ? "justify-center" : ""
              }`}
              title={isTamil ? "தனியுரிமை & தரவு உரிமைகள்" : "Privacy & Data Rights"}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              {!isCollapsed && <span className="truncate">{isTamil ? "தனியுரிமை & பாதுகாப்பு" : "Privacy & GDPR Rights"}</span>}
            </button>
          )}

          {!isCollapsed && (
            <div className="pt-2 text-[9px] text-stone-400 font-mono text-center leading-tight">
              VSOP87 / Meeus Ephemeris
              <div className="text-[8px] text-stone-400 font-sans mt-0.5">Vedic AstroVerse v4.2</div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
