import React from "react";
import { Sparkles, Compass, CheckCircle2, AlertCircle, ArrowRight, MessageSquare, BookOpen, Layers, Shield, Eye } from "lucide-react";
import { TRANSLATIONS } from "../../services/localization";

export default function PlanetDetailModal({ isOpen, onClose, planet, chartData, lang = "en", onAskAboutPlanet = null }) {
  if (!isOpen || !planet) return null;

  const isTamil = lang === "ta";
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const PLANET_NAMES_TAMIL = {
    Sun: "சூரியன் (Surya)",
    Moon: "சந்திரன் (Chandra)",
    Mars: "செவ்வாய் (Mangal)",
    Mercury: "புதன் (Budha)",
    Jupiter: "குரு / வியாழன் (Brihaspati)",
    Venus: "சுக்கிரன் (Shukra)",
    Saturn: "சனி (Shani)",
    Rahu: "ராகு (North Node)",
    Ketu: "கேது (South Node)",
    Uranus: "யுரேனஸ்",
    Neptune: "நெப்டியூன்",
    Pluto: "புளூட்டோ"
  };

  const SIGN_NAMES_TAMIL = {
    Aries: "மேஷம் (Mesha)", Taurus: "ரிஷபம் (Vrishabha)", Gemini: "மிதுனம் (Mithuna)", Cancer: "கடகம் (Kataka)",
    Leo: "சிம்மம் (Simha)", Virgo: "கன்னி (Kanya)", Libra: "துலாம் (Tula)", Scorpio: "விருச்சிகம் (Vrischika)",
    Sagittarius: "தனுசு (Dhanus)", Capricorn: "மகரம் (Makara)", Aquarius: "கும்பம் (Kumbha)", Pisces: "மீனம் (Meena)"
  };

  const PLANET_ROLES = {
    Sun: {
      coreTheme: isTamil ? "ஆத்ம காரகன், தலைமைத்துவம், தன்னம்பிக்கை & தந்தை" : "Soul Signifier, Leadership, Vitality, Authority & Father",
      usedIn: [
        isTamil ? "தொழில் & அரசு அதிகார யோகம் (10-ம் பாவகம்)" : "Career & Governance Prominence (10th House)",
        isTamil ? "ஆரோக்கியம் & உடல் உயிர்சக்தி" : "Vitality & Constitutional Health",
        isTamil ? "தந்தை & பூர்வீக ஆசிகள் (9-ம் பாவகம்)" : "Paternal Heritage & Dharma (9th House)"
      ]
    },
    Moon: {
      coreTheme: isTamil ? "மனோ காரகன், உணர்ச்சி நிலை, தாய் & கற்பனை திறன்" : "Mind Signifier, Emotional Balance, Intuition & Mother",
      usedIn: [
        isTamil ? "விம்சோத்தரி தசா-புக்தி ஆரம்ப இருப்பு" : "Vimshottari Dasha Baseline Balance",
        isTamil ? "அஷ்டகூட திருமணப் பொருத்தம் (36 குணம்)" : "36-Guna Matrimonial Compatibility",
        isTamil ? "கோச்சார ஏழரை சனி & அஷ்டம சனி கணிப்பு" : "Transit Sade Sati & Ashtama Shani Impact"
      ]
    },
    Mars: {
      coreTheme: isTamil ? "தைரிய காரகன், நிலம்/பூமி, சகோதரர் & செயல்பாட்டு ஆற்றல்" : "Courage, Land/Property, Siblings, Ambition & Executive Action",
      usedIn: [
        isTamil ? "பூமி யோகம் & சொத்து வாங்கும் காலக்கோடு (4-ம் பாவகம்)" : "Real Estate & Property Acquisition (4th House)",
        isTamil ? "செவ்வாய் தோஷம் (Manglik Dosha) பரிசீலனை" : "Kuja / Manglik Dosha Analysis (2, 4, 7, 8, 12)",
        isTamil ? "போட்டித் தேர்வுகள் & சவால்களை வெல்லும் பலம் (6-ம் பாவகம்)" : "Competitive Exams & Overcoming Obstacles (6th House)"
      ]
    },
    Mercury: {
      coreTheme: isTamil ? "வித்யா காரகன், புத்தி கூர்மை, வணிகம், பேச்சு & கணிதம்" : "Intellect, Commercial Agility, Speech, Analytics & Technology",
      usedIn: [
        isTamil ? "கல்வி, உயர்கல்வி & தொழில்நுட்ப தேர்ச்சி (4 & 5-ம் பாவகங்கள்)" : "Academic Distinction & Technical Education (4th & 5th Houses)",
        isTamil ? "வியாபாரம், பங்குச்சந்தை & தகவல் தொடர்பு திறன்" : "Commerce, Trading & Communication Enterprises",
        isTamil ? "புத-ஆதித்ய யோகம் (Budhaditya Yoga) உருவாக்கம்" : "Budhaditya & Bhadra Mahapurusha Formations"
      ]
    },
    Jupiter: {
      coreTheme: isTamil ? "குரு பகவான், ஞானம், செல்வம், புத்திர பாக்கியம் & தெய்வீக அருள்" : "Wisdom, Dharma, Wealth, Children, Preceptor & Divine Grace",
      usedIn: [
        isTamil ? "தன யோகம் & நிதி மேலாண்மை (2, 5, 9, 11-ம் பாவகங்கள்)" : "Wealth Multiplication & Financial Prosperity (2, 5, 9, 11)",
        isTamil ? "புத்திர பாக்கியம் & ஆன்மீக நாட்டம் (5 & 9-ம் பாவகங்கள்)" : "Progeny Blessing & Spiritual Initiation (D7 & D20)",
        isTamil ? "ஹம்ச யோகம் & குரு பார்வை தோஷ நிவர்த்தி" : "Hamsa Mahapurusha & All-Protective 5/7/9 Drishti"
      ]
    },
    Venus: {
      coreTheme: isTamil ? "களத்திர காரகன், கலை, சொகுசு வாகனம், காதல் & மணவாழ்க்கை" : "Spouse Signifier, Luxury, Aesthetics, Vehicles & Harmonious Relationships",
      usedIn: [
        isTamil ? "திருமண காலம் & வாழ்க்கைத் துணைவரின் குணம் (7-ம் பாவகம் & D9)" : "Marriage Timing & Partner Dynamics (7th House & D9)",
        isTamil ? "சொகுசு வாகன சேர்க்கை & சுக போகங்கள் (4-ம் பாவகம் & D16)" : "Conveyances & Domestic Comforts (4th House & D16)",
        isTamil ? "மாளவ்ய யோகம் & கலைத் துறை வெற்றி" : "Malavya Mahapurusha & Creative Distinction"
      ]
    },
    Saturn: {
      coreTheme: isTamil ? "கர்ம காரகன், ஒழுக்கம், பொறுமை, ஆயுள் & நிலையான உழைப்பு" : "Karma Arbiter, Discipline, Longevity, Perseverance & Structured Success",
      usedIn: [
        isTamil ? "தொழில் நிலைத்தன்மை & தலைமைப் பொறுப்புகள் (10-ம் பாவகம்)" : "Vocational Longevity & Leadership (10th House)",
        isTamil ? "ஆயுள் பலம் & தடைகளைத் தாண்டும் சக்தி (8-ம் பாவகம்)" : "Ayur Bala & Endurance through Tests (8th House)",
        isTamil ? "சச யோகம் & ஏழரை சனி காலக்கட்டங்கள்" : "Sasa Mahapurusha & Major Career Restructuring Cycles"
      ]
    },
    Rahu: {
      coreTheme: isTamil ? "விநோத யோக காரகன், வெளிநாட்டு பயணம், தொழில்நுட்பம் & அதிரடி வளர்ச்சி" : "Unconventional Expansion, Foreign Lands, Tech Breakthroughs & Material Ambition",
      usedIn: [
        isTamil ? "வெளிநாட்டு பயணம் & குடியுரிமை வாய்ப்புகள் (9 & 12-ம் பாவகங்கள்)" : "Overseas Relocation & Foreign Opportunities (9th & 12th Houses)",
        isTamil ? "டிஜிட்டல் மீடியா & நவீன தொழில்நுட்ப நிறுவனங்கள்" : "Digital Innovation & Modern Enterprise Ventures",
        isTamil ? "கால சர்ப்ப தோஷ அமைப்புகள்" : "Kala Sarpa Pattern Evaluation"
      ]
    },
    Ketu: {
      coreTheme: isTamil ? "ஞான காரகன், மோக்ஷம், உள்ளுணர்வு, ஆராய்ச்சி & பற்றற்ற நிலை" : "Spiritual Liberation, High Intuition, Research Agility & Non-Attachment",
      usedIn: [
        isTamil ? "மோக்ஷ யோகம் & ஆன்மீக உயர் நிலைகள் (12-ம் பாவகம் & D20)" : "Moksha Trikona & Mystical Research (12th House & D20)",
        isTamil ? "விஞ்ஞான ஆராய்ச்சி, மருத்துவம் & குறியீட்டு பகுப்பாய்வு" : "Deep Analytical Research & Abstract Problem Solving"
      ]
    }
  };

  const roleInfo = PLANET_ROLES[planet.name] || {
    coreTheme: isTamil ? "கிரக அதிர்வு மற்றும் பலன்" : "Planetary Influence & Aspect",
    usedIn: [isTamil ? "பொது ஜாதக ஆய்வு" : "General Chart Analysis"]
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="planet-detail-title"
    >
      <div className="max-w-xl w-full my-8 p-6 md:p-8 rounded-3xl bg-[#FFFDF9] border border-amber-300 relative space-y-6 shadow-2xl animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-800 p-2 text-sm font-bold rounded-full hover:bg-stone-100 transition-all"
          aria-label="Close dialog"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 border-b border-amber-200/80 pb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 p-0.5 shadow-md shadow-amber-500/20 shrink-0">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center font-serif text-2xl font-bold text-amber-700">
              {planet.name.slice(0, 2)}
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold uppercase tracking-wider mb-1">
              <Compass className="w-3 h-3 text-amber-700" />
              <span>{isTamil ? "கிரக நுண்ணறிவு விவரம்" : "Planetary Intelligence"}</span>
            </div>
            <h2 id="planet-detail-title" className="text-xl md:text-2xl font-serif font-bold text-stone-900">
              {isTamil ? (PLANET_NAMES_TAMIL[planet.name] || planet.name) : planet.name}
            </h2>
            <p className="text-xs text-stone-600">
              {roleInfo.coreTheme}
            </p>
          </div>
        </div>

        {/* Key Planetary Parameters Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70">
            <span className="text-[10px] uppercase font-bold text-stone-500 block">{isTamil ? "ராசி / பாவகம்" : "Sign / House"}</span>
            <span className="font-bold text-stone-900 text-sm">{isTamil ? (SIGN_NAMES_TAMIL[planet.sign] || planet.sign) : planet.sign}</span>
            <span className="text-[11px] text-amber-800 block">{planet.house ? `H${planet.house} (${isTamil ? `${planet.house}-ம் வீடு` : `House ${planet.house}`})` : (isTamil ? "வீடு குறிப்பிடப்படவில்லை" : "House unassigned")}</span>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70">
            <span className="text-[10px] uppercase font-bold text-stone-500 block">{isTamil ? "பாகை & கலை" : "Exact Degree"}</span>
            <span className="font-bold font-mono text-stone-900 text-sm">
              {typeof planet.degreeInSign === "number" ? `${planet.degreeInSign.toFixed(2)}°` : (typeof planet.longitude === "number" ? `${(planet.longitude % 30).toFixed(2)}°` : "N/A")}
            </span>
            <span className="text-[11px] text-stone-600 block">
              {typeof planet.longitude === "number" ? `Total: ${planet.longitude.toFixed(2)}°` : ""}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70">
            <span className="text-[10px] uppercase font-bold text-stone-500 block">{isTamil ? "நட்சத்திரம் & பாதம்" : "Nakshatra & Pada"}</span>
            <span className="font-bold text-stone-900 text-sm">{planet.nakshatra || "N/A"}</span>
            <span className="text-[11px] text-amber-800 block">{isTamil ? `பாதம் ${planet.pada ?? 'N/A'}` : `Pada ${planet.pada ?? 'N/A'}`}</span>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
            <span className="text-[10px] uppercase font-bold text-stone-500 block">{isTamil ? "இயக்கம் (Motion)" : "Motion Status"}</span>
            <span className={`font-bold text-xs ${planet.isRetrograde ? "text-rose-600" : "text-emerald-700"}`}>
              {planet.isRetrograde ? (isTamil ? "வக்ரம் (Retrograde ℞)" : "Retrograde ℞") : (isTamil ? "நேர்கதி (Direct)" : "Direct Motion")}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
            <span className="text-[10px] uppercase font-bold text-stone-500 block">{isTamil ? "நிலை (Dignity)" : "Dignity / Avastha"}</span>
            <span className="font-bold text-xs text-stone-800">{planet.dignity || (planet.isCombust ? "Combust" : "Normal")}</span>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
            <span className="text-[10px] uppercase font-bold text-stone-500 block">{isTamil ? "நவாம்சம் (D9)" : "Navamsha (D9)"}</span>
            <span className="font-bold text-xs text-stone-800">{planet.navamsaSign || "D9 Mapped"}</span>
          </div>
        </div>

        {/* Where this planet is used in predictions */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5 uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            <span>{isTamil ? "இந்த கிரகம் பயன்படும் முக்கிய கணிப்புகள் (Used In):" : "Where This Planet Influences Predictions:"}</span>
          </span>
          <div className="space-y-1.5">
            {roleInfo.usedIn.map((item, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-200/60 flex items-center gap-2 text-xs text-stone-800 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive CTA to ask follow-up questions about this planet */}
        <div className="pt-2 border-t border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              if (onAskAboutPlanet) {
                onAskAboutPlanet(`Explain how ${planet.name} at ${(planet.longitude % 30).toFixed(2)}° in ${planet.sign} (${planet.nakshatra} Pada ${planet.pada}) impacts my life and career.`);
              }
            }}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white font-bold text-xs shadow-md shadow-amber-500/20 hover:brightness-105 flex items-center justify-center gap-2 transition-all"
          >
            <MessageSquare className="w-4 h-4 text-amber-100" />
            <span>{isTamil ? `${planet.name} பற்றி கேள் (Ask AstroVerse)` : `Ask AstroVerse About ${planet.name}`}</span>
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-all"
          >
            {isTamil ? "மூடுக (Close)" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
