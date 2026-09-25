import React, { useState } from "react";
import { Hash, Sparkles, Calendar, User, Gem, Palette, Clock } from "lucide-react";
import { calculateNumerology } from "../../services/numerologyEngine";
import { TRANSLATIONS } from "../../services/localization";

export default function NumerologyCalc({ profile = null, lang = "en" }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isTamil = lang === "ta";

  const initialName = (profile?.name && profile?.name !== "Native" && profile?.name !== "ஜாதகர்") ? profile.name : "";
  const initialDob = profile?.birthDate || "";

  const [name, setName] = useState(initialName);
  const [dob, setDob] = useState(initialDob);
  const [system, setSystem] = useState("pythagorean");
  const [result, setResult] = useState(() => (initialDob && initialName ? calculateNumerology(initialDob, initialName, "pythagorean") : null));

  React.useEffect(() => {
    if (profile?.name && profile.name !== "Native" && profile.name !== "ஜாதகர்" && !name) {
      setName(profile.name);
    }
    if (profile?.birthDate && !dob) {
      setDob(profile.birthDate);
    }
    if (profile?.birthDate && profile?.name && !result) {
      setResult(calculateNumerology(profile.birthDate, profile.name, system));
    }
  }, [profile]);

  const handleCalculate = (e) => {
    e.preventDefault();
    if (!dob || !name) return;
    const res = calculateNumerology(dob, name, system);
    setResult(res);
  };

  const NUM_TITLES_TAMIL = {
    1: "தலைவர் & புதிய கண்டுபிடிப்பாளர் (The Leader)",
    2: "அமைதியாளர் & ராஜதந்திரி (The Peacemaker)",
    3: "கலைஞர் & சிறந்த பேச்சாளர் (The Creative)",
    4: "மகா நிர்மாண அமைப்பாளர் (The Master Builder)",
    5: "சுதந்திர சிந்தனையாளர் & சாகசக்காரர் (The Explorer)",
    6: "அன்பு காப்பாளர் & குணப்படுத்துபவர் (The Healer)",
    7: "மெய்ஞானி & சிந்தனையாளர் (The Mystic)",
    8: "அதிகாரமிக்க சாதனையாளர் (The Executive)",
    9: "உலகளாவிய மனிதநேயவாதி (The Humanitarian)",
    11: "மாஸ்டர் எண் 11: ஆன்ம ஒளியூட்டுபவர் (The Illuminator)",
    22: "மாஸ்டர் எண் 22: வரலாற்று சிற்பி (The Master Architect)",
    33: "மாஸ்டர் எண் 33: உலக ஆசான் (The Master Teacher)"
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-white border border-amber-300 shadow-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold uppercase tracking-wider">
            <Hash className="w-3.5 h-3.5" /> {t.numTitle}
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900">
            {t.numMainTitle}
          </h2>
          <p className="text-xs text-stone-600 max-w-lg mx-auto">
            {t.numDesc}
          </p>
          <p className="text-[11px] text-stone-500 italic max-w-lg mx-auto text-center">
            {isTamil
              ? "பாரம்பரிய எண் கணித விளக்கம் (கலாச்சார குறியீட்டு மாதிரி மட்டுமே; உளவியல் நோயறிதல் அல்ல)"
              : "Traditional numerology interpretation (heuristic cultural archetype, not an empirical psychological profile)"}
          </p>
        </div>

        {/* System Toggle */}
        <div className="flex justify-center">
          <div className="bg-amber-50 p-1.5 rounded-xl border border-amber-200 flex gap-2">
            <button
              onClick={() => { setSystem("pythagorean"); setResult(calculateNumerology(dob, name, "pythagorean")); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                system === "pythagorean" ? "bg-amber-500 text-white shadow-md shadow-amber-500/20" : "text-stone-700 hover:text-stone-900"
              }`}
            >
              {t.pythagoreanSystem}
            </button>
            <button
              onClick={() => { setSystem("chaldean"); setResult(calculateNumerology(dob, name, "chaldean")); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                system === "chaldean" ? "bg-purple-600 text-white shadow-md shadow-purple-600/20" : "text-stone-700 hover:text-stone-900"
              }`}
            >
              {t.chaldeanSystem}
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleCalculate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-600" />
              {t.fullBirthName}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#FFFDF9] border border-amber-300 text-stone-900 text-sm focus:outline-none focus:border-amber-500 shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              {t.dob}
            </label>
            <input
              type="date"
              required
              value={dob}
              onChange={e => setDob(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#FFFDF9] border border-amber-300 text-stone-900 text-sm focus:outline-none focus:border-amber-500 shadow-sm"
            />
          </div>

          <div className="md:col-span-2 pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white font-bold text-sm shadow-md shadow-amber-500/25 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {t.recalculateNum}
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      {result ? (
        <>
          {/* 4 Core Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Life Path */}
            <div className="p-5 rounded-2xl bg-white border border-amber-300 relative overflow-hidden space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">{t.lifePathTitle}</span>
                <span className="text-3xl font-extrabold text-amber-700">{result.lifePathNumber}</span>
              </div>
              <h4 className="text-sm font-bold text-stone-900">
                {isTamil ? (NUM_TITLES_TAMIL[result.lifePathNumber] || result.lifePathInfo.title) : result.lifePathInfo.title}
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">{result.lifePathInfo.traits}</p>
            </div>

            {/* Destiny */}
            <div className="p-5 rounded-2xl bg-white border border-purple-300 relative overflow-hidden space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800">{t.destinyTitle}</span>
                <span className="text-3xl font-extrabold text-purple-700">{result.destinyNumber}</span>
              </div>
              <h4 className="text-sm font-bold text-stone-900">
                {isTamil ? (NUM_TITLES_TAMIL[result.destinyNumber] || result.destinyInfo.title) : result.destinyInfo.title}
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">{result.destinyInfo.traits}</p>
            </div>

            {/* Soul Urge */}
            <div className="p-5 rounded-2xl bg-white border border-rose-300 relative overflow-hidden space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">{t.soulUrgeTitle}</span>
                <span className="text-3xl font-extrabold text-rose-700">{result.soulUrgeNumber}</span>
              </div>
              <h4 className="text-sm font-bold text-stone-900">{isTamil ? "ஆழ்மன விருப்பம்" : "Inner Heart's Desire"}</h4>
              <p className="text-xs text-stone-600 leading-relaxed">{t.soulUrgeDesc}</p>
            </div>

            {/* Personality */}
            <div className="p-5 rounded-2xl bg-white border border-cyan-300 relative overflow-hidden space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-800">{t.personalityTitle}</span>
                <span className="text-3xl font-extrabold text-cyan-700">{result.personalityNumber}</span>
              </div>
              <h4 className="text-sm font-bold text-stone-900">{isTamil ? "சமூக ஆளுமை ஒளிவட்டம்" : "Social Aura & Impression"}</h4>
              <p className="text-xs text-stone-600 leading-relaxed">{t.personalityDesc}</p>
            </div>
          </div>

          {/* Cycles */}
          <div className="p-6 rounded-3xl bg-white border border-amber-300 space-y-4 shadow-sm">
            <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              {t.forecastCycleTitle}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">{t.personalYear}</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-amber-700">
                    {isTamil ? `ஆண்டு எண் ${result.personalYear}` : `Personal Year ${result.personalYear}`}
                  </span>
                </div>
                <p className="text-xs text-stone-600">{t.personalYearDesc}</p>
              </div>

              <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800">{t.personalMonth}</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-purple-700">
                    {isTamil ? `மாத எண் ${result.personalMonth}` : `Personal Month ${result.personalMonth}`}
                  </span>
                </div>
                <p className="text-xs text-stone-600">{t.personalMonthDesc}</p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">{t.personalDay}</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-emerald-700">
                    {isTamil ? `நாள் எண் ${result.personalDay}` : `Personal Day ${result.personalDay}`}
                  </span>
                </div>
                <p className="text-xs text-stone-600">{t.personalDayDesc}</p>
              </div>
            </div>
          </div>

          {/* Lucky Attributes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-amber-200 space-y-2 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
                <Hash className="w-4 h-4 text-amber-600" /> {t.luckyNumbers}
              </div>
              <div className="flex gap-2 pt-1">
                {result.luckyNumbers.map(n => (
                  <span key={n} className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 font-bold flex items-center justify-center text-sm">
                    {n}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-amber-200 space-y-2 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-900 uppercase tracking-wider">
                <Palette className="w-4 h-4 text-purple-600" /> {t.powerColors}
              </div>
              <p className="text-xs font-semibold text-stone-800 pt-1">
                {result.luckyColors.join(", ")}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-amber-200 space-y-2 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wider">
                <Gem className="w-4 h-4 text-emerald-600" /> {t.gemstones}
              </div>
              <p className="text-xs font-semibold text-stone-800 pt-1">
                {result.luckyStones.join(", ")}
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="p-8 rounded-3xl bg-white/70 border border-amber-200/80 text-center space-y-2">
          <Sparkles className="w-8 h-8 text-amber-500 mx-auto" />
          <h3 className="font-serif font-bold text-stone-800 text-base">
            {isTamil ? "எண் கணித வரைபடத்தைக் கணக்கிட விவரங்களை உள்ளிடவும்" : "Enter Details to Generate Numerology Blueprint"}
          </h3>
          <p className="text-xs text-stone-600 max-w-md mx-auto">
            {isTamil
              ? "மேலே உங்கள் பெயர் மற்றும் பிறந்த தேதியை உள்ளிட்டு கணக்கிடு பொத்தானை அழுத்தவும்."
              : "Enter your full name and date of birth above and click Recalculate to generate your Pythagorean and Chaldean matrix."}
          </p>
        </div>
      )}
    </div>
  );
}

