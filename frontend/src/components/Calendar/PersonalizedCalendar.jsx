import React, { useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sparkles, AlertTriangle, CheckCircle2, Moon, Clock, ShieldCheck, Sun, Info } from "lucide-react";
import { generatePersonalizedMonthCalendar } from "../../services/calendarEngine";
import { TRANSLATIONS } from "../../services/localization";

export default function PersonalizedCalendar({ chartData, lang = "en" }) {
  const isTamil = lang === "ta";
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12
  const [selectedDay, setSelectedDay] = useState(null);

  const monthData = chartData ? generatePersonalizedMonthCalendar(currentYear, currentMonth, chartData) : null;

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDay(null);
  };

  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const MONTH_NAMES_TAMIL = [
    "ஜனவரி", "பிப்ரவரி", "மார்ச்", "ஏப்ரல்", "மே", "ஜூன்",
    "ஜூலை", "ஆகஸ்ட்", "செப்டம்பர்", "அக்டோபர்", "நவம்பர்", "டிசம்பர்"
  ];

  const WEEK_DAYS = isTamil ? ["ஞா", "தி", "செ", "பு", "வி", "வெ", "ச"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (!chartData) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-amber-200 text-center space-y-3 shadow-xs">
        <CalendarIcon className="w-8 h-8 text-amber-600 mx-auto" />
        <h3 className="text-lg font-serif font-bold text-stone-900">
          {isTamil ? "தனிப்பயனாக்கப்பட்ட காலண்டரைக் காண ஜாதகத்தை கணிக்கவும்" : "Calculate Horoscope to Activate Personalized Transit Calendar"}
        </h3>
        <p className="text-xs text-stone-600 max-w-md mx-auto">
          {isTamil
            ? "உங்கள் ஜென்ம நட்சத்திரம் மற்றும் சந்திர ராசி அடிப்படையில் 30 நாட்களுக்கான தாரா பலம் மற்றும் சந்திராஷ்டம நாட்களைக் கணக்கிட ஜாதகத்தை உள்ளிடவும்."
            : "Enter your birth details to generate personalized daily Tara Bala, Chandrashtama alerts, and custom Muhurta timings."}
        </p>
      </div>
    );
  }

  // First day of month offset
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Calendar Header Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/15 via-[#FFFDF9] to-orange-500/10 border border-amber-300/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
            <CalendarIcon className="w-3.5 h-3.5 text-amber-600" />
            <span>{isTamil ? "தனிப்பயனாக்கப்பட்ட தினசரி காலண்டர்" : "Personalized Transit Calendar"}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
            {isTamil ? `${MONTH_NAMES_TAMIL[currentMonth - 1]} ${currentYear}` : `${MONTH_NAMES[currentMonth - 1]} ${currentYear}`}
          </h2>
          <p className="text-xs text-stone-600">
            {isTamil
              ? `ஜென்ம நட்சத்திரம்: ${chartData.moonNakshatra?.name || "Ashwini"} • சந்திர ராசி: ${chartData.moonSign?.name || "Aries"}`
              : `Janma Nakshatra: ${chartData.moonNakshatra?.name || "Ashwini"} • Janma Rasi: ${chartData.moonSign?.name || "Aries"}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2.5 rounded-xl bg-white hover:bg-amber-100 border border-amber-300 text-stone-800 transition-all shadow-2xs"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setCurrentYear(today.getFullYear());
              setCurrentMonth(today.getMonth() + 1);
              setSelectedDay(null);
            }}
            className="px-3 py-2 rounded-xl bg-white hover:bg-amber-100 border border-amber-300 text-xs font-bold text-stone-800 transition-all shadow-2xs"
          >
            {isTamil ? "இன்று" : "Today"}
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2.5 rounded-xl bg-white hover:bg-amber-100 border border-amber-300 text-stone-800 transition-all shadow-2xs"
            aria-label="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white border border-amber-200/90 shadow-xs space-y-4">
        {/* Week Day Header */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-stone-500 uppercase tracking-wider pb-2 border-b border-stone-100">
          {WEEK_DAYS.map((wd, idx) => (
            <div key={idx} className={idx === 0 || idx === 6 ? "text-amber-700 font-extrabold" : ""}>
              {wd}
            </div>
          ))}
        </div>

        {/* Days Matrix */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {/* Empty leading cells */}
          {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-16 sm:h-20 rounded-xl bg-stone-50/50" />
          ))}

          {/* Month Days */}
          {monthData?.days.map((dayItem) => {
            const isSelected = selectedDay?.day === dayItem.day;
            const isToday =
              dayItem.day === today.getDate() &&
              currentMonth === (today.getMonth() + 1) &&
              currentYear === today.getFullYear();

            return (
              <button
                key={dayItem.day}
                type="button"
                onClick={() => setSelectedDay(dayItem)}
                className={`h-16 sm:h-20 p-1.5 sm:p-2 rounded-xl border text-left flex flex-col justify-between transition-all relative ${
                  isSelected
                    ? "bg-amber-500 text-white border-amber-600 shadow-md scale-102 z-10"
                    : isToday
                    ? "bg-amber-100/70 border-amber-400 text-stone-900"
                    : dayItem.isChandrashtama
                    ? "bg-rose-50 border-rose-200 text-rose-950 hover:bg-rose-100/70"
                    : dayItem.taraBala.isAuspicious
                    ? "bg-emerald-50/50 border-emerald-200 text-emerald-950 hover:bg-emerald-100/70"
                    : "bg-white border-stone-200 text-stone-800 hover:bg-amber-50/60"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-xs font-bold ${isSelected ? "text-white" : "text-stone-900"}`}>
                    {dayItem.day}
                  </span>
                  {dayItem.isChandrashtama && (
                    <span className="text-[9px] px-1 rounded bg-rose-200 text-rose-900 font-bold" title="Chandrashtama Day">
                      ⚠️ 8th
                    </span>
                  )}
                </div>

                <div className="space-y-0.5 truncate w-full">
                  <span className={`text-[9px] font-semibold block truncate ${isSelected ? "text-amber-100" : "text-stone-500"}`}>
                    {dayItem.transitNakshatra}
                  </span>
                  <span className={`text-[9px] font-bold block truncate ${isSelected ? "text-white" : dayItem.taraBala.isAuspicious ? "text-emerald-700" : "text-stone-600"}`}>
                    {isTamil ? dayItem.taraBala.nameTa : dayItem.taraBala.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Deep Dive Card */}
      {selectedDay && (
        <div className="p-6 rounded-3xl bg-[#FFFDF9] border border-amber-300 shadow-md space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-200/80 pb-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-lg text-stone-900">
                  {selectedDay.dateStr}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  {selectedDay.score}% {isTamil ? "சாதக குறியீடு" : "Favorable Index"}
                </span>
              </div>
              <p className="text-xs text-stone-600">
                {isTamil ? `சந்திரன் சஞ்சாரம்: ${selectedDay.transitSign} (${selectedDay.transitNakshatra} நட்சத்திரம்)` : `Moon Transit: ${selectedDay.transitSign} (${selectedDay.transitNakshatra} Nakshatra)`}
              </p>
            </div>

            <button
              onClick={() => setSelectedDay(null)}
              className="text-stone-400 hover:text-stone-800 text-xs font-bold"
            >
              ✕ {isTamil ? "மூடுக" : "Close"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">
                {isTamil ? "தாரா பலம் (Tara Bala Quality):" : "Tara Bala Alignment:"}
              </span>
              <p className="font-bold text-stone-900 text-sm">
                {isTamil ? selectedDay.taraBala.nameTa : selectedDay.taraBala.name} ({selectedDay.taraBala.quality})
              </p>
              <p className="text-[11px] text-stone-600">{selectedDay.taraBala.description}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">
                {isTamil ? "பரிந்துரைக்கப்படும் செயல்பாடுகள்:" : "Recommended Focus:"}
              </span>
              <div className="space-y-1">
                {selectedDay.favorableFor.map((act, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[11px] font-medium text-stone-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{act}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
