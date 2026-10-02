import React from "react";
import {
  Menu,
  Sparkles,
  Globe,
  User,
  LogIn,
  LogOut,
  CheckCircle2,
  Crown,
  Coins,
  SlidersHorizontal
} from "lucide-react";
import { TRANSLATIONS } from "../../services/localization";

export default function Navbar({
  onToggleSidebar,
  onOpenPricing,
  onOpenAuth = null,
  onLogout = null,
  currentUser = null,
  userCredits = null,
  lang = "en",
  setLang,
  isExpertMode = false,
  setIsExpertMode = null
}) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isTamil = lang === "ta";
  const isRegistered = Boolean(currentUser?.isRegistered);

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-[#FFFDF9]/95 border-b border-amber-200/90 shadow-2xs">
      <div className="w-full px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          
          {/* Left: Sidebar Toggle & Brand Name */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Hamburger Button for Sidebar */}
            <button
              onClick={onToggleSidebar}
              className="p-2 sm:p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-900 transition-all shadow-2xs flex items-center justify-center cursor-pointer"
              title={isTamil ? "மெனு பட்டை (Menu)" : "Toggle Navigation Menu"}
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5 text-amber-800" />
            </button>

            {/* Brand Logo & Name */}
            <div className="flex items-center gap-2.5 cursor-pointer select-none">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 p-0.5 shadow-md shadow-amber-500/20 shrink-0">
                <div className="w-full h-full bg-white rounded-[9px] flex items-center justify-center shadow-inner">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="font-serif text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-amber-950 via-amber-900 to-orange-900 bg-clip-text text-transparent">
                    {t.appName}
                  </span>
                  <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                    V2
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 font-medium">
                  {isTamil ? "வேத வானியல் நுண்ணறிவு" : "Vedic Astrology Intelligence"}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Name, Credits, Mode Toggle, Language Toggle, and Auth Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 ml-auto">
            
            {/* 1. USER NAME / REGISTRATION BADGE */}
            {isRegistered ? (
              <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-emerald-50/90 border border-emerald-300/90 text-xs font-bold text-emerald-950 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="max-w-[100px] sm:max-w-[140px] truncate">
                  {currentUser?.name || (isTamil ? "பதிவு செய்யப்பட்டவர்" : "User")}
                </span>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-stone-100 border border-stone-200 text-xs text-stone-600 font-medium">
                <User className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                <span>{isTamil ? "விருந்தினர்" : "Guest Mode"}</span>
              </div>
            )}

            {/* 2. CREDITS AVAILABLE */}
            <div
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold shadow-2xs"
              title={isTamil ? "கிடைக்கும் கிரெடிட்டுகள்" : "Available AI & Calculation Credits"}
            >
              <Coins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="hidden md:inline text-stone-500 text-[11px] font-medium">{t.credits}:</span>
              <span className="font-bold text-amber-900 text-xs sm:text-sm">
                {userCredits !== null ? userCredits : (isTamil ? "இணைக்கிறது..." : "Syncing...")}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${userCredits !== null ? "bg-emerald-500 animate-pulse" : "bg-amber-400 animate-ping"}`} />
            </div>

            {/* 3. MODE TOGGLE (Simple / Expert Mode) */}
            {setIsExpertMode && (
              <button
                onClick={() => setIsExpertMode(!isExpertMode)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
                  isExpertMode
                    ? "bg-stone-900 text-amber-300 border-stone-800 hover:bg-stone-800"
                    : "bg-white text-stone-700 border-amber-300 hover:bg-amber-50"
                }`}
                title={isExpertMode ? "Switch to Simple Mode" : "Switch to Expert Astrologer Mode"}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden lg:inline">
                  {isExpertMode ? (isTamil ? "நிபுணர் முறை" : "Expert Mode") : (isTamil ? "எளிய முறை" : "Simple Mode")}
                </span>
                <span className="lg:hidden">
                  {isExpertMode ? (isTamil ? "நிபுணர்" : "Expert") : (isTamil ? "எளிய" : "Simple")}
                </span>
              </button>
            )}

            {/* 4. LANGUAGE TOGGLE (Tamil / English) */}
            <button
              onClick={() => setLang(lang === "en" ? "ta" : "en")}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-white border border-amber-300 text-xs font-bold text-amber-950 hover:bg-amber-50 transition-all shadow-2xs cursor-pointer"
              title="Toggle Tamil / English Language"
            >
              <Globe className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{lang === "en" ? "தமிழ்" : "English"}</span>
            </button>

            {/* 5. AUTH / LOGIN / LOGOUT BUTTON */}
            {!isRegistered ? (
              <button
                onClick={() => onOpenAuth && onOpenAuth("register")}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{isTamil ? "உள்நுழை / பதிவு" : "Sign In / Register"}</span>
                <span className="sm:hidden">{isTamil ? "உள்நுழை" : "Sign In"}</span>
              </button>
            ) : (
              onLogout && (
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-stone-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 border border-stone-300 text-xs font-bold text-stone-700 transition-all shadow-2xs cursor-pointer"
                  title={isTamil ? "வெளியேறு (Sign Out)" : "Sign Out"}
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">{isTamil ? "வெளியேறு" : "Sign Out"}</span>
                </button>
              )
            )}

            {/* 6. PLANS / UPGRADE BUTTON */}
            {onOpenPricing && (
              <button
                onClick={onOpenPricing}
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:brightness-105 text-white text-xs font-semibold shadow-xs transition-all border border-amber-400/40 cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                <span>{isTamil ? "திட்டங்கள் (₹20+)" : "Plans (₹20+)"}</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
