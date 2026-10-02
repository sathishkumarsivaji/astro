import React, { useState } from "react";
import { Sun, Moon, Calendar, Clock, Sparkles, CheckCircle2, ShieldAlert, Award, Compass, Heart, Home, Car, Landmark, Briefcase, Plane } from "lucide-react";
import { calculateDailyPanchang, calculateEventMuhurta, formatDateInTimezone } from "../../services/astroEngine";

export default function PanchangMuhurta({ chartData, lang = "en" }) {
  const isTamil = lang === "ta";

  // Coordinates from chart profile (strictly guarded — zero silent defaults)
  const lat = chartData?.profile?.latitude ?? chartData?.latitude ?? null;
  const lng = chartData?.profile?.longitude ?? chartData?.longitude ?? null;
  const tz = chartData?.profile?.utcOffset ?? chartData?.utcOffset ?? null;
  const timezoneId = chartData?.profile?.timezoneId || chartData?.timezoneId || null;

  const todayStr = (tz !== null) ? (formatDateInTimezone(new Date(), tz, timezoneId) || new Date().toISOString().split("T")[0]) : new Date().toISOString().split("T")[0];

  const [panchangDateStr, setPanchangDateStr] = useState(todayStr);
  const [selectedEvent, setSelectedEvent] = useState("marriage");
  const [daysAhead, setDaysAhead] = useState(30);
  const [muhurtaResults, setMuhurtaResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  if (lat === null || lng === null || tz === null) {
    return (
      <div className="p-8 rounded-3xl bg-amber-50/80 border border-amber-300 text-center space-y-3">
        <ShieldAlert className="w-8 h-8 text-amber-600 mx-auto" />
        <h3 className="font-serif font-bold text-stone-900 text-lg">
          {isTamil ? "இடம் தேர்ந்தெடுக்கப்படவில்லை" : "Location Unavailable"}
        </h3>
        <p className="text-xs text-stone-600 max-w-md mx-auto">
          {isTamil
            ? "துல்லியமான சூரிய உதயம் மற்றும் பஞ்சாங்கம் கணக்கிட பிறந்த ஜாதக படிவத்தில் இடத்தை தேர்வு செய்யவும்."
            : "Location unavailable. Please select a birth location before calculating sunrise-anchored Panchanga & Muhurta screening."}
        </p>
      </div>
    );
  }

  const dailyPanchang = calculateDailyPanchang(panchangDateStr, lat, lng, tz, timezoneId);

  const handleFindMuhurta = () => {
    setIsCalculating(true);
    try {
      const startDate = panchangDateStr;
      const results = calculateEventMuhurta(selectedEvent, startDate, null, lat, lng, tz, timezoneId);
      setMuhurtaResults(results);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCalculating(false);
    }
  };

  const EVENT_OPTIONS = [
    { id: "marriage", label: isTamil ? "திருமண முகூர்த்தம் (Marriage)" : "Vivaha (Marriage)", icon: Heart, desc: isTamil ? "குரு, சுக்கிரன் மற்றும் சுப திதி/நட்சத்திரங்கள்" : "Auspicious Venus/Jupiter & shubha nakshatra alignment" },
    { id: "griha_pravesh", label: isTamil ? "கிரகப்பிரவேசம் (Housewarming)" : "Griha Pravesham (Housewarming)", icon: Home, desc: isTamil ? "வாஸ்து புருஷர் விழிப்பு & ஸ்திர லக்ன சுபம்" : "Fixed sign Ascendant & auspicious lunar day" },
    { id: "vehicle", label: isTamil ? "வாகனம் வாங்குதல் (Vehicle Purchase)" : "Vahana (Vehicle Purchase)", icon: Car, desc: isTamil ? "சுக்கிரன் & சந்திரன் சுப சஞ்சாரம்" : "Benefic Venus/Moon transit & auspicious vara" },
    { id: "property", label: isTamil ? "பூமி / சொத்து கிரயம் (Property Purchase)" : "Bhumi (Property Purchase)", icon: Landmark, desc: isTamil ? "செவ்வாய், பூமி காரக சுப பார்வை" : "Mars & 4th house lord auspicious aspect" },
    { id: "business", label: isTamil ? "தொழில் தொடங்குதல் (Business Launch)" : "Vyapar (Business Launch)", icon: Briefcase, desc: isTamil ? "புதன், குரு சுப யோக காலம்" : "Mercury/Jupiter commercial yoga timing" },
    { id: "travel", label: isTamil ? "சுப பிரயாணம் (Travel / Relocation)" : "Yatra (Auspicious Travel)", icon: Plane, desc: isTamil ? "சந்திர பலம் & சுப திசை முகூர்த்தம்" : "Moon strength & auspicious directional alignment" }
  ];

  const candidateList = muhurtaResults
    ? (Array.isArray(muhurtaResults) ? muhurtaResults : (muhurtaResults.topScreenedDates || muhurtaResults.bestWindows || muhurtaResults.allCandidates || []))
    : [];

  return (
    <div className="space-y-8">
      {/* 1. Daily Panchang Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-50 to-amber-100/70 border border-amber-300/80 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-200/80 pb-3">
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-600" />
            <h3 className="font-serif font-bold text-stone-900 text-lg">
              {isTamil ? "தினசரி பஞ்சாங்கம் & சுப நேர கணிப்பான் (சூரிய உதய அடிப்படையிலானது)" : "Daily Vedic Panchanga & Timings (Sunrise Anchored)"}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>{isTamil ? "தேதி தேர்வு:" : "Panchang Date:"}</span>
            </label>
            <input
              type="date"
              value={panchangDateStr}
              onChange={(e) => setPanchangDateStr(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-amber-300 text-xs font-bold bg-white text-stone-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* 5 Angas Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-white border border-amber-200 shadow-sm">
            <span className="text-[10px] text-stone-500 block uppercase font-bold">{isTamil ? "வாரம் (Vara)" : "Vara (Day)"}</span>
            <span className="font-bold text-stone-900 text-sm mt-0.5 block">
              {isTamil ? (dailyPanchang.vara?.tamil || dailyPanchang.vara?.name || dailyPanchang.varaName || "") : (dailyPanchang.vara?.name || dailyPanchang.varaName || (typeof dailyPanchang.vara === "string" ? dailyPanchang.vara : ""))}
            </span>
            <span className="text-[10px] text-amber-700 block mt-0.5">{dailyPanchang.vara?.ruler || dailyPanchang.varaLord || ""} Lord</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-amber-200 shadow-sm">
            <span className="text-[10px] text-stone-500 block uppercase font-bold">{isTamil ? "திதி (Tithi)" : "Tithi"}</span>
            <span className="font-bold text-stone-900 text-sm mt-0.5 block">
              {isTamil ? (dailyPanchang.tithi?.nameTamil || dailyPanchang.tithi?.name || dailyPanchang.tithiName || "") : (dailyPanchang.tithi?.name || dailyPanchang.tithiName || (typeof dailyPanchang.tithi === "string" ? dailyPanchang.tithi : ""))}
            </span>
            <span className="text-[10px] text-purple-700 block mt-0.5">
              {dailyPanchang.tithi?.paksha || dailyPanchang.paksha || ""} {dailyPanchang.tithi?.until ? `· Until ${dailyPanchang.tithi.until}` : ""}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-amber-200 shadow-sm">
            <span className="text-[10px] text-stone-500 block uppercase font-bold">{isTamil ? "நட்சத்திரம் (Nakshatra)" : "Nakshatra"}</span>
            <span className="font-bold text-purple-800 text-sm mt-0.5 block">
              {isTamil ? (dailyPanchang.nakshatra?.tamil || dailyPanchang.nakshatra?.name || dailyPanchang.nakshatraName || "") : (dailyPanchang.nakshatra?.name || dailyPanchang.nakshatraName || (typeof dailyPanchang.nakshatra === "string" ? dailyPanchang.nakshatra : ""))}
            </span>
            <span className="text-[10px] text-stone-500 block mt-0.5">
              Pada {dailyPanchang.nakshatra?.pada ?? dailyPanchang.pada ?? 'N/A'} {dailyPanchang.nakshatra?.until ? `· Until ${dailyPanchang.nakshatra.until}` : ""}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-amber-200 shadow-sm">
            <span className="text-[10px] text-stone-500 block uppercase font-bold">{isTamil ? "யோகம் (Yoga)" : "Yoga"}</span>
            <span className="font-bold text-stone-900 text-sm mt-0.5 block">
              {dailyPanchang.yoga?.name || dailyPanchang.yogaName || (typeof dailyPanchang.yoga === "string" ? dailyPanchang.yoga : "")}
            </span>
            <span className="text-[10px] text-emerald-700 block mt-0.5">
              {dailyPanchang.yoga?.nature || dailyPanchang.yogaNature || ""} {dailyPanchang.yoga?.until ? `· Until ${dailyPanchang.yoga.until}` : ""}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-amber-200 shadow-sm">
            <span className="text-[10px] text-stone-500 block uppercase font-bold">{isTamil ? "கரணம் (Karana)" : "Karana"}</span>
            <span className="font-bold text-stone-900 text-sm mt-0.5 block">
              {dailyPanchang.karana?.name || dailyPanchang.karanaName || (typeof dailyPanchang.karana === "string" ? dailyPanchang.karana : "")}
            </span>
            <span className="text-[10px] text-stone-500 block mt-0.5">
              {dailyPanchang.karanaLord || (dailyPanchang.karana?.isBhadra ? "Vishti (Inauspicious)" : "Benefic Karana")} {dailyPanchang.karana?.until ? `· Until ${dailyPanchang.karana.until}` : ""}
            </span>
          </div>
        </div>

        {/* Timings: Sunrise, Sunset, Rahu Kalam, Yamagandam, Abhijit */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200">
            <span className="text-[10px] text-amber-900 block font-bold uppercase">{isTamil ? "சூரிய உதயம் / அஸ்தமனம்" : "Sunrise / Sunset"}</span>
            <span className="font-bold text-stone-900 mt-0.5 block">{dailyPanchang.sunrise} - {dailyPanchang.sunset}</span>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200">
            <span className="text-[10px] text-rose-900 block font-bold uppercase">{isTamil ? "இராகு காலம் (Rahu Kalam)" : "Rahu Kalam (Inauspicious)"}</span>
            <span className="font-bold text-rose-900 mt-0.5 block">{dailyPanchang.rahuKalam}</span>
          </div>

          <div className="p-3 rounded-xl bg-orange-50/80 border border-orange-200">
            <span className="text-[10px] text-orange-900 block font-bold uppercase">{isTamil ? "எமகண்டம் (Yamagandam)" : "Yamagandam"}</span>
            <span className="font-bold text-orange-900 mt-0.5 block">{dailyPanchang.yamagandam}</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200">
            <span className="text-[10px] text-emerald-900 block font-bold uppercase">{isTamil ? "அபிஜித் முகூர்த்தம் (Abhijit)" : "Abhijit Muhurta (Auspicious)"}</span>
            <span className="font-bold text-emerald-900 mt-0.5 block">{dailyPanchang.abhijitMuhurta}</span>
          </div>
        </div>
      </div>

      {/* 2. Dedicated Event Muhurta Finder */}
      <div className="p-6 md:p-8 rounded-3xl bg-white border border-amber-300 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-amber-200 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-bold uppercase tracking-wider shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              {isTamil ? "பஞ்சாங்க அடிப்படையிலான ஆரம்ப சுப தின தேர்வு" : "Preliminary Panchanga-Based Date Screening"}
            </div>
            <h3 className="text-xl font-serif font-bold text-stone-900 mt-1">
              {isTamil ? "சுப காரிய முகூர்த்த தேதிகள் கணிப்பான்" : "Auspicious Date Screening & Muhurta Explorer"}
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
                onClick={() => setSelectedEvent(ev.id)}
                className={`p-4 rounded-2xl border text-left transition-all space-y-1.5 ${
                  isSelected
                    ? "bg-amber-50 border-2 border-amber-500 shadow-md"
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

        {/* Horizon Range and Calculate Action */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-stone-800">{isTamil ? "கால அளவு:" : "Search Horizon:"}</span>
            <div className="flex items-center gap-1.5">
              {[30, 60, 90, 180].map((d) => (
                <button
                  key={d}
                  onClick={() => setDaysAhead(d)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    daysAhead === d
                      ? "bg-amber-600 text-white shadow-sm"
                      : "bg-white text-stone-700 border border-amber-200 hover:bg-amber-100/60"
                  }`}
                >
                  {d} {isTamil ? "நாட்கள்" : "Days"}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleFindMuhurta}
            disabled={isCalculating}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white font-bold text-xs shadow-md shadow-amber-500/25 hover:brightness-110 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>{isCalculating ? (isTamil ? "கணிக்கிறது..." : "Searching...") : (isTamil ? "சுப முகூர்த்த தேதிகளைக் கண்டறி" : "Find Auspicious Dates")}</span>
          </button>
        </div>

        {/* Muhurta Candidates Result List */}
        {muhurtaResults && (
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              {isTamil ? `கண்டறியப்பட்ட சிறந்த சுப தேதிகள் (${candidateList.length} தேதிகள்)` : `Ranked Auspicious Dates (${candidateList.length} screened dates)`}
            </h4>

            {candidateList.length === 0 ? (
              <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 text-center text-xs text-stone-600">
                {isTamil ? "தேர்ந்தெடுக்கப்பட்ட காலக்கட்டத்தில் உகந்த சுப தினங்கள் அமையவில்லை. தயவுசெய்து கால அளவை அதிகரிக்கவும்." : "No dates scored in the favorable tier during preliminary screening within this date range. Try expanding the search horizon."}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {candidateList.map((m, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-white border border-amber-200 hover:border-amber-400 transition-all shadow-sm space-y-2">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                      <div>
                        <span className="text-xs font-bold text-stone-900 block">{m.date}</span>
                        <span className="text-[10px] text-amber-700 font-medium">
                          {isTamil ? (m.dayTamil || m.day) : m.day}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold border border-emerald-300">
                        Score: {m.muhurtaScore}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-stone-600">
                      <div className="flex justify-between">
                        <span>{isTamil ? "திதி:" : "Tithi:"}</span>
                        <strong className="text-stone-900">{m.tithi}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>{isTamil ? "நட்சத்திரம்:" : "Nakshatra:"}</span>
                        <strong className="text-purple-800">{m.nakshatra}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>{isTamil ? "அபிஜித்:" : "Abhijit:"}</span>
                        <strong className="text-emerald-700 font-mono">{m.abhijitMuhurta}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>{isTamil ? "இராகு காலம்:" : "Rahu Kalam:"}</span>
                        <strong className="text-rose-700 font-mono">{m.rahuKalam}</strong>
                      </div>
                    </div>

                    <p className="text-[11px] text-stone-500 italic bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                      {m.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
