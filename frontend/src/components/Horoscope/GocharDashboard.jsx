import React, { useState } from "react";
import { Compass, Moon, Sun, AlertTriangle, ShieldCheck, Sparkles, Clock, Calendar, ArrowRight, Activity } from "lucide-react";
import { calculateDedicatedGocharDashboard, formatDateInTimezone } from "../../services/astroEngine";

export default function GocharDashboard({ chartData, lang = "en" }) {
  const tzOffset = chartData?.tz ?? chartData?.utcOffset ?? chartData?.profile?.utcOffset ?? 5.5;
  const tzId = chartData?.timezoneId ?? chartData?.ianaTimezone ?? chartData?.profile?.timezoneId ?? chartData?.profile?.ianaTimezone ?? (tzOffset === 5.5 ? "Asia/Kolkata" : null);

  const [targetDateStr, setTargetDateStr] = useState(() => {
    return formatDateInTimezone(new Date(), tzOffset, tzId) || new Date().toISOString().split("T")[0];
  });
  const isTamil = lang === "ta";

  if (!chartData) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-amber-200 text-center space-y-3 shadow-sm">
        <Compass className="w-8 h-8 text-amber-500 mx-auto" />
        <h3 className="text-lg font-serif font-bold text-stone-900">
          {isTamil ? "கோச்சார பலன்களைக் காண ஜாதகத்தை கணிக்கவும்" : "Calculate Horoscope to View Real-Time Transits"}
        </h3>
        <p className="text-xs text-stone-600 max-w-md mx-auto">
          {isTamil
            ? "கோச்சார நவகிரக சஞ்சாரங்கள், ஏழரை சனி மற்றும் குரு பெயர்ச்சி பலன்களைப் பெற ஜாதகப் படிவத்தில் விவரங்களை உள்ளிடவும்."
            : "Please enter your birth details in the Chart tab to analyze live Gochara transits, Sade Sati, and Jupiter aspects."}
        </p>
      </div>
    );
  }

  const gochar = calculateDedicatedGocharDashboard(chartData, targetDateStr);

  const SIGN_NAMES_TAMIL = {
    Aries: "மேஷம்", Taurus: "ரிஷபம்", Gemini: "மிதுனம்", Cancer: "கடகம்",
    Leo: "சிம்மம்", Virgo: "கன்னி", Libra: "துலாம்", Scorpio: "விருச்சிகம்",
    Sagittarius: "தனுசு", Capricorn: "மகரம்", Aquarius: "கும்பம்", Pisces: "மீனம்"
  };

  const PLANET_NAMES_TAMIL = {
    Sun: "சூரியன்", Moon: "சந்திரன்", Mars: "செவ்வாய்", Mercury: "புதன்",
    Jupiter: "குரு", Venus: "சுக்கிரன்", Saturn: "சனி", Rahu: "ராகு", Ketu: "கேது"
  };

  return (
    <div className="space-y-6">
      {/* Header & Date Controller */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-50 to-amber-100/70 border border-amber-300/80 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-200/80 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-600" />
            <h3 className="font-serif font-bold text-stone-900 text-lg">
              {isTamil ? "நிகழ்நேர கோச்சார நவகிரக சஞ்சாரம் & ஏழரை சனி நிலை" : "Real-Time Gochara Transits & Sade Sati Dashboard"}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>{isTamil ? "கோச்சார தேதி:" : "Transit Date:"}</span>
            </label>
            <input
              type="date"
              value={targetDateStr}
              onChange={(e) => setTargetDateStr(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-amber-300 text-xs font-bold bg-white text-stone-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed">
          {isTamil
            ? "ஜனன ராசி, லக்னம் மற்றும் அஷ்டகவர்க்க பரல்களின் அடிப்படையில் நிகழ்நேர நவகிரகங்களின் கோச்சார நிலைகள் துல்லியமாக பகுப்பாய்வு செய்யப்படுகின்றன."
            : "Ephemeris calculations mapping live planetary transits against your natal Moon sign, Ascendant, and Sarvashtakavarga bindu distribution."}
        </p>
      </div>

      {/* Sade Sati & Saturn Transit Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sade Sati Card */}
        <div className="p-6 rounded-3xl bg-white border border-amber-300 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
              <Moon className="w-4 h-4 text-purple-600" />
              {isTamil ? "சனி கோச்சார நிலை & ஏழரை சனி" : "Saturn Transit & Sade Sati Analysis"}
            </h4>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
              gochar.sadeSati?.isActive
                ? "bg-amber-100 text-amber-900 border-amber-300"
                : "bg-emerald-100 text-emerald-900 border-emerald-300"
            }`}>
              {gochar.sadeSati?.status || (isTamil ? "நடப்பில் இல்லை" : "Not Active")}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-stone-600">{isTamil ? "ஜனன ராசி (Moon Sign):" : "Natal Moon Sign:"}</span>
              <strong className="text-stone-900">{isTamil ? (SIGN_NAMES_TAMIL[chartData.moonSign?.name] || chartData.moonSign?.name) : chartData.moonSign?.name}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-600">{isTamil ? "கோச்சார சனி ராசி:" : "Transit Saturn Sign:"}</span>
              <strong className="text-purple-800">{isTamil ? (SIGN_NAMES_TAMIL[gochar.saturnGochar?.sign] || gochar.saturnGochar?.sign) : gochar.saturnGochar?.sign} ({gochar.saturnGochar?.deg?.toFixed(1)}°)</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-600">{isTamil ? "சந்திரனிலிருந்து சனி பாவம்:" : "Saturn House from Moon:"}</span>
              <strong className="text-amber-900">{isTamil ? `${gochar.saturnGochar?.houseFromMoon}-ம் பாவம்` : `House ${gochar.saturnGochar?.houseFromMoon}`}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-600">{isTamil ? "ராசியின் அஷ்டகவர்க்க பரல்கள்:" : "SAV Bindus in Transit Sign:"}</span>
              <span className="px-2 py-0.5 rounded bg-white text-stone-900 font-mono font-bold border border-amber-200">
                {gochar.saturnGochar?.savBindus} / 56 {isTamil ? "பரல்கள்" : "bindus"}
              </span>
            </div>
          </div>

          <p className="text-xs text-stone-600 leading-relaxed bg-white/50 p-3 rounded-xl border border-stone-100">
            {gochar.sadeSati?.summary || (isTamil
              ? "கோச்சார சனி தற்போது உங்கள் ராசிக்கு சாதகமான அமைப்பில் சஞ்சரிக்கிறார்."
              : "Transit Saturn is currently operating outside the 7.5-year Sade Sati zone, providing relative stability.")}
          </p>
        </div>

        {/* Jupiter Gochar Card */}
        <div className="p-6 rounded-3xl bg-white border border-amber-300 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-600" />
              {isTamil ? "குரு பெயர்ச்சி & சுப சஞ்சார பலன்" : "Jupiter (Guru) Gochar & Drishti"}
            </h4>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              {isTamil ? `${gochar.jupiterGochar?.houseFromMoon}-ம் பாவம்` : `House ${gochar.jupiterGochar?.houseFromMoon} from Moon`}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-stone-600">{isTamil ? "கோச்சார குரு ராசி:" : "Transit Jupiter Sign:"}</span>
              <strong className="text-amber-800">{isTamil ? (SIGN_NAMES_TAMIL[gochar.jupiterGochar?.sign] || gochar.jupiterGochar?.sign) : gochar.jupiterGochar?.sign} ({gochar.jupiterGochar?.deg?.toFixed(1)}°)</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-600">{isTamil ? "குருவின் சிறப்பு பார்வைகள் (5, 7, 9):" : "Jupiter 5th/7th/9th Drishti:"}</span>
              <strong className="text-purple-800 font-mono">{gochar.jupiterGochar?.drishtiSigns?.join(", ")}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-600">{isTamil ? "கோச்சார ராசியின் பரல்கள்:" : "SAV Bindus in Transit Sign:"}</span>
              <span className="px-2 py-0.5 rounded bg-white text-stone-900 font-mono font-bold border border-amber-200">
                {gochar.jupiterGochar?.savBindus} / 56 {isTamil ? "பரல்கள்" : "bindus"}
              </span>
            </div>
          </div>

          <p className="text-xs text-stone-600 leading-relaxed bg-white/50 p-3 rounded-xl border border-stone-100">
            {gochar.jupiterGochar?.summary || (isTamil
              ? "கோச்சார குருவின் சஞ்சாரம் மற்றும் சுப பார்வைகள் உங்கள் ஜாதகத்தில் ஞானம் மற்றும் சுப நிகழ்ச்சிகளுக்கு வழிவகுக்கின்றன."
              : "Jupiter transit illuminates benefic house axes, offering spiritual clarity, mentorship, and auspicious openings.")}
          </p>
        </div>
      </div>

      {/* 9-Graha Real-Time Ephemeris Table */}
      <div className="p-6 rounded-3xl bg-white border border-amber-300 shadow-sm space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          {isTamil ? "9 நவகிரகங்களின் நிகழ்நேர கோச்சார நிலைகள்" : "9-Graha Live Transit Longitudes & Rasi Placements"}
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-800">
            <thead className="bg-amber-50 text-stone-700 uppercase text-[10px] border-b border-amber-200 font-bold">
              <tr>
                <th className="p-2.5">{isTamil ? "கிரகம்" : "Planet"}</th>
                <th className="p-2.5">{isTamil ? "கோச்சார ராசி" : "Transit Sign"}</th>
                <th className="p-2.5">{isTamil ? "பாகை" : "Degree"}</th>
                <th className="p-2.5">{isTamil ? "நட்சத்திரம் (பாதம்)" : "Nakshatra (Pada)"}</th>
                <th className="p-2.5">{isTamil ? "சந்திரனிலிருந்து பாவம்" : "House from Moon"}</th>
                <th className="p-2.5">{isTamil ? "அஷ்டகவர்க்க பரல்கள்" : "SAV Bindus"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {(gochar.transits || []).map((p) => (
                <tr key={p.name} className="hover:bg-amber-50/60 transition-colors">
                  <td className="p-2.5 font-bold text-stone-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    {isTamil ? (PLANET_NAMES_TAMIL[p.name] || p.name) : p.name}
                    {p.isRetrograde && (
                      <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 text-[9px] font-bold border border-rose-300">
                        {isTamil ? "வக்ரம்" : "R"}
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-amber-800 font-bold">{isTamil ? (SIGN_NAMES_TAMIL[p.sign] || p.sign) : p.sign}</td>
                  <td className="p-2.5 font-mono text-stone-700">{p.deg?.toFixed(2)}°</td>
                  <td className="p-2.5 text-purple-800 font-medium">{p.nakshatra} ({p.pada})</td>
                  <td className="p-2.5 font-bold text-stone-900">{isTamil ? `${p.houseFromMoon}-ம் பாவம்` : `H${p.houseFromMoon}`}</td>
                  <td className="p-2.5">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                      (p.savBindus || 0) >= 28 ? "bg-emerald-100 text-emerald-800" : (p.savBindus || 0) >= 25 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                    }`}>
                      {p.savBindus || "-"} pts
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
