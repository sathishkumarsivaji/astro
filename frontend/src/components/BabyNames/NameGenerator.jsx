import React, { useState, useEffect } from "react";
import { 
  Baby, Sparkles, Heart, Share2, ThumbsUp, Calendar, Clock, MapPin, 
  User, ShieldCheck, Award, Zap, Star, RefreshCw, Layers
} from "lucide-react";
import { 
  calculateNewbornAstroProfile, 
  generateAINewbornNames, 
  generateBabyNames, 
  NAKSHATRA_PADA_SYLLABLES 
} from "../../services/babyNameEngine.js";
import { NAKSHATRAS } from "../../services/astroEngine.js";
import { TRANSLATIONS } from "../../services/localization.js";
import PlaceAutocomplete from "../Common/PlaceAutocomplete";

const POPULAR_LOCATIONS = [
  { name: "Chennai, Tamil Nadu", lat: 13.0827, lon: 80.2707 },
  { name: "Coimbatore, Tamil Nadu", lat: 11.0168, lon: 76.9558 },
  { name: "Madurai, Tamil Nadu", lat: 9.9252, lon: 78.1198 },
  { name: "Hosur, Tamil Nadu", lat: 12.7409, lon: 77.8253 },
  { name: "Bengaluru, Karnataka", lat: 12.9716, lon: 77.5946 },
  { name: "Mumbai, Maharashtra", lat: 19.0760, lon: 72.8777 },
  { name: "Delhi, NCR", lat: 28.7041, lon: 77.1025 },
  { name: "London, UK", lat: 51.5074, lon: -0.1278 },
  { name: "New York, USA", lat: 40.7128, lon: -74.0060 }
];

export default function NameGenerator({ lang = "en" }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isTamil = lang === "ta";

  // Tab mode: 'newborn' (Full Horoscope calculation) vs 'browse' (Catalog filters)
  const [activeMode, setActiveMode] = useState("newborn");

  // Newborn Form State
  const [initial, setInitial] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [time, setTime] = useState("");
  const [place, setPlace] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [parentSurname, setParentSurname] = useState("");

  // Calculation Results
  const [newbornProfile, setNewbornProfile] = useState(null);
  const [shortlist, setShortlist] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [votes, setVotes] = useState({});

  // AI Generation State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiNames, setAiNames] = useState([]);

  // Browse Catalog Filter State
  const [selectedNakshatra, setSelectedNakshatra] = useState("");
  const [targetSyllable, setTargetSyllable] = useState("");
  const [browseReligion, setBrowseReligion] = useState("all");

  // Run initial calculation on mount
  useEffect(() => {
    handleCalculateNewborn();
  }, [lang]);

  const handleLocationSelect = (loc) => {
    setSelectedLocation(loc);
    setPlace(loc.name);
  };

  const handleCalculateNewborn = () => {
    try {
      const profile = calculateNewbornAstroProfile({
        dob,
        time,
        lat: selectedLocation.lat,
        lon: selectedLocation.lon,
        gender,
        initial,
        surname: parentSurname,
        lang
      });
      setNewbornProfile(profile);
      setAiNames([]); // Reset custom AI names on new horoscope calculation
      setAiError("");
    } catch (err) {
      console.error("Newborn calculation error:", err);
    }
  };

  const handleGenerateAiNames = async () => {
    if (!newbornProfile) return;
    setIsAiLoading(true);
    setAiError("");

    try {
      const generated = await generateAINewbornNames({
        nakshatraName: newbornProfile.nakshatraName,
        pada: newbornProfile.pada,
        syllable: newbornProfile.auspiciousSyllableEn,
        syllableTa: newbornProfile.auspiciousSyllableTa,
        gender,
        initial,
        driverNumber: newbornProfile.driverNumber,
        destinyNumber: newbornProfile.destinyNumber,
        lagnaLord: newbornProfile.lagnaLord,
        lang
      });
      setAiNames(generated);
    } catch (err) {
      console.error("AI Generation failed:", err);
      setAiError(err.message || "Failed to generate AI names. Please ensure Gemini API Key is configured.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const toggleShortlist = (name) => {
    setShortlist(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const castVote = (name) => {
    setVotes(prev => ({ ...prev, [name]: (prev[name] || 0) + 1 }));
  };

  // Browse Catalog fallback names
  const currentNakMeta = NAKSHATRAS.find(n => n.name === selectedNakshatra);
  const browseNames = generateBabyNames({
    gender,
    religion: browseReligion,
    nakshatraSyllable: targetSyllable,
    parentSurname,
    targetLifePath: 1
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Mode Selector / Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl bg-white border border-amber-300 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-300">
            <Baby className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
              {isTamil ? "குழந்தை வேத நாமகரண ஜோதிடம்" : "Newborn Vedic Namakarana & Horoscope"}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-mono font-bold">
                {isTamil ? "நட்சத்திர பாத சுப அட்சரங்கள்" : "Nakshatra Pada Syllables"}
              </span>
            </h1>
            <p className="text-xs text-stone-600">
              {isTamil 
                ? "பிறந்த நேரம், நட்சத்திர பாதம் மற்றும் எண் கணிதத்திற்கு உகந்த சுப பெயர் தேர்வு"
                : "Auspicious starting sounds, numerological resonance & empowering blessings"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-amber-50 p-1.5 rounded-2xl border border-amber-200">
          <button
            onClick={() => setActiveMode("newborn")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeMode === "newborn"
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                : "text-stone-700 hover:text-stone-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isTamil ? "ஜாதக நாமகரணம்" : "Horoscope Namakarana"}
          </button>
          <button
            onClick={() => setActiveMode("browse")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeMode === "browse"
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                : "text-stone-700 hover:text-stone-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {isTamil ? "பெயர் பட்டியல் உலாவி" : "Browse Catalog"}
          </button>
        </div>
      </div>

      {activeMode === "newborn" ? (
        /* NEWBORN HOROSCOPE & NAMAKARANA SUITE */
        <div className="space-y-6">
          {/* Input Controls Card */}
          <div className="p-6 md:p-8 rounded-3xl bg-white border border-amber-300 shadow-md space-y-6">
            <div className="flex items-center justify-between border-b border-amber-200 pb-4">
              <div>
                <h2 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-600" />
                  {isTamil ? "குழந்தையின் ஜனன விபரங்களை உள்ளிடவும்" : "Enter Newborn's Birth Details"}
                </h2>
                <p className="text-xs text-stone-600 mt-0.5">
                  {isTamil 
                    ? "துல்லியமான நட்சத்திர பாதம் & யோக பலன் தரும் பெயர்களை கணக்கிட தேவையான விபரங்கள்"
                    : "Accurate planetary calculations to pinpoint exact Moon Nakshatra Pada & Auspicious Syllables"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Initial */}
              <div className="space-y-1.5">
                <label className="text-xs text-stone-700 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  {t.babyInitial}
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={initial}
                  onChange={(e) => setInitial(e.target.value.toUpperCase())}
                  placeholder="e.g. S / K"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFDF9] border border-amber-300 text-stone-900 text-xs font-bold tracking-wider focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 uppercase shadow-sm"
                />
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label className="text-xs text-stone-700 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  {t.genderLabel}
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFDF9] border border-amber-300 text-stone-900 text-xs focus:outline-none focus:border-amber-500 shadow-sm"
                >
                  <option value="boy">{t.babyBoy}</option>
                  <option value="girl">{t.babyGirl}</option>
                  <option value="unisex">{t.unisex}</option>
                </select>
              </div>

              {/* Date of Birth */}
              <div className="space-y-1.5">
                <label className="text-xs text-stone-700 font-semibold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  {t.babyDob}
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFDF9] border border-amber-300 text-stone-900 text-xs focus:outline-none focus:border-amber-500 shadow-sm"
                />
              </div>

              {/* Time of Birth */}
              <div className="space-y-1.5">
                <label className="text-xs text-stone-700 font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  {t.babyTime}
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFDF9] border border-amber-300 text-stone-900 text-xs focus:outline-none focus:border-amber-500 shadow-sm"
                />
              </div>

              {/* Family Surname */}
              <div className="space-y-1.5">
                <label className="text-xs text-stone-700 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  {t.surnameLabel}
                </label>
                <input
                  type="text"
                  value={parentSurname}
                  onChange={(e) => setParentSurname(e.target.value)}
                  placeholder="e.g. Varma / Kumar"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFDF9] border border-amber-300 text-stone-900 text-xs focus:outline-none focus:border-amber-500 shadow-sm"
                />
              </div>
            </div>

            {/* Location Selector with District & State Autocomplete */}
            <div className="space-y-2 pt-1">
              <label className="text-xs text-stone-700 font-semibold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                {t.babyPlace}
              </label>
              <PlaceAutocomplete
                value={place}
                lang={lang}
                onChange={(val) => setPlace(val)}
                onSelect={(loc) => {
                  setSelectedLocation({
                    name: loc.displayString || loc.name,
                    lat: loc.lat,
                    lon: loc.lon
                  });
                  setPlace(loc.displayString || loc.name);
                }}
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {POPULAR_LOCATIONS.map((loc) => (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => handleLocationSelect(loc)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-medium transition-all ${
                      place === loc.name
                        ? "bg-amber-500 text-white font-bold shadow-md shadow-amber-500/20"
                        : "bg-amber-50 hover:bg-amber-100 text-stone-700 border border-amber-200"
                    }`}
                  >
                    {loc.name.split(",")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Calculate Button */}
            <button
              onClick={handleCalculateNewborn}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <Sparkles className="w-4 h-4" />
              {t.calculateNewbornNames}
            </button>
          </div>

          {/* Newborn Horoscope Summary & Auspicious Syllables Card */}
          {newbornProfile && (
            <div className="p-6 md:p-8 rounded-3xl bg-white border border-amber-300 shadow-md space-y-6 relative overflow-hidden">
              <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-200 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-900 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300">
                    {t.newbornKundliTitle}
                  </span>
                  <h3 className="text-xl md:text-2xl font-serif font-bold text-stone-900 mt-1.5 flex items-center gap-2">
                    <span>{isTamil ? newbornProfile.moonSignTa : newbornProfile.moonSign} Rasi</span>
                    <span className="text-stone-400">•</span>
                    <span className="text-amber-700">{isTamil ? newbornProfile.nakshatraNameTa : newbornProfile.nakshatraName}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-900 font-sans font-bold border border-purple-300">
                      {isTamil ? `பாதம் ${newbornProfile.pada}` : `Pada ${newbornProfile.pada}`}
                    </span>
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-stone-500 block">{t.driverDestiny}</span>
                    <span className="text-sm font-bold text-stone-800">
                      Driver: <strong className="text-amber-700 font-mono">{newbornProfile.driverNumber}</strong> | Destiny: <strong className="text-purple-700 font-mono">{newbornProfile.destinyNumber}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Sacred Starting Syllables Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-100/90 via-orange-50 to-amber-50 border border-amber-300 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-600 fill-amber-500" />
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                      {t.auspiciousSyllables}
                    </span>
                  </div>
                  <p className="text-xs text-stone-700">
                    {isTamil
                      ? `${newbornProfile.nakshatraNameTa} பாதம் ${newbornProfile.pada}-ல் பிறந்த குழந்தைக்கு கீழ்க்காணும் மங்கல அட்சரத்தில் பெயர் வைப்பது ஆயுள், ஆரோக்கியம் மற்றும் சகல ஐஸ்வர்யங்களை தரும்.`
                      : `Sacred phoneme for ${newbornProfile.nakshatraName} Pada ${newbornProfile.pada} directly awakens vitality and removes doshas per Vedic Namakarana.`}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="px-5 py-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white font-black text-2xl shadow-md shadow-amber-500/25 flex items-center gap-2">
                    <span>{newbornProfile.auspiciousSyllableTa}</span>
                    <span className="text-amber-100 text-lg">({newbornProfile.auspiciousSyllableEn})</span>
                  </div>
                </div>
              </div>

              {/* Astrological Parameters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200">
                  <span className="text-stone-500 block text-[10px]">{t.ascendantTitle}</span>
                  <span className="font-bold text-stone-900 mt-0.5 block">{isTamil ? newbornProfile.lagnaTa : newbornProfile.lagna} ({newbornProfile.lagnaLord})</span>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200">
                  <span className="text-stone-500 block text-[10px]">{t.ruler}</span>
                  <span className="font-bold text-amber-800 mt-0.5 block">{newbornProfile.nakshatraRuler}</span>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200">
                  <span className="text-stone-500 block text-[10px]">Star Presiding Deity</span>
                  <span className="font-bold text-stone-900 mt-0.5 block truncate" title={newbornProfile.nakshatraDeity}>
                    {newbornProfile.nakshatraDeity}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200">
                  <span className="text-stone-500 block text-[10px]">{t.allPadaSyllables}</span>
                  <span className="font-bold text-purple-900 mt-0.5 block">
                    {newbornProfile.allPadaSyllablesTa.join(" • ")}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Shortlist Bar */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-amber-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <Heart className="w-4 h-4 fill-purple-600 text-purple-600" />
              </div>
              <div>
                <span className="text-xs font-bold text-stone-900">
                  {t.savedShortlist} ({shortlist.length})
                </span>
                <p className="text-[11px] text-stone-600">
                  {shortlist.join(", ") || t.noNamesShortlisted}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowShareModal(true)}
              className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300 flex items-center gap-2 transition-all shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-600" />
              {t.shareWithFamily}
            </button>
          </div>

          {/* Suggested Names Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  {isTamil ? "நட்சத்திர & பாத பெயர் பரிந்துரைகள்" : "Nakshatra & Pada Name Suggestions"}
                </h3>
                <p className="text-xs text-stone-600">
                  {isTamil
                    ? "ஒவ்வொரு பெயருக்கும் வழங்கப்பட்டுள்ள சாஸ்திர பலன்கள், நிலை வகைப்பாடு (Tiers 1-5) & நன்மைகளுக்கான விளக்கங்கள்"
                    : "Categorized into structured 5-tier alignment (Tiers 1–5), Chaldean compound vibrations & detailed empowerment rationale"}
                </p>
              </div>
            </div>

            {/* Primary Exact Pada Names Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(newbornProfile?.suggestedNames || []).filter(item => !item.isSameStarAlternative).map((item) => {
                const isFavorited = shortlist.includes(item.name);
                const currentVote = votes[item.name] || 0;
                return (
                  <div
                    key={item.name}
                    className="p-5 rounded-2xl bg-white border border-amber-200 hover:border-amber-400 transition-all space-y-3.5 flex flex-col justify-between group relative shadow-sm"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xl font-serif font-bold text-stone-900">
                              {initial && <span className="text-amber-700 mr-1">{initial}.</span>}
                              {item.name}
                            </h4>
                            {item.nameTa && (
                              <span className="text-sm font-bold text-amber-800 font-sans">
                                ({item.nameTa})
                              </span>
                            )}
                            {parentSurname && (
                              <span className="text-xs text-stone-500 font-normal">
                                {parentSurname}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border flex items-center gap-1 ${
                              item.tier === 1 ? "bg-emerald-100 text-emerald-900 border-emerald-300" :
                              item.tier === 2 ? "bg-teal-100 text-teal-900 border-teal-300" :
                              item.tier === 3 ? "bg-blue-100 text-blue-900 border-blue-300" :
                              item.tier === 4 ? "bg-amber-100 text-amber-900 border-amber-300" :
                              "bg-stone-100 text-stone-900 border-stone-300"
                            }`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                              {isTamil ? `நிலை ${item.tier || 1}: ${item.tierLabel}` : `Tier ${item.tier || 1}: ${item.tierLabel || "Exact Nakshatra + Pada"}`}
                            </span>
                            {item.syllableMatch && (
                              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold border border-emerald-300 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                {item.syllableMatch}
                              </span>
                            )}
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold border border-purple-300">
                              Chaldean: {item.nameNumber?.compound} → {item.nameNumber?.single}
                            </span>
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                              {item.alignmentBadge || item.compatibilityLabel || t.harmony}
                            </span>
                          </div>
                          {item.compoundTitle && (
                            <div className="mt-1 text-[11px] font-semibold text-amber-800 font-mono">
                              ✦ {item.compoundTitle}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => toggleShortlist(item.name)}
                          className={`p-2 rounded-xl transition-all shrink-0 ${
                            isFavorited
                              ? "bg-rose-100 text-rose-600 border border-rose-300"
                              : "bg-amber-50 text-stone-500 hover:text-stone-800 border border-amber-200"
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isFavorited ? "fill-rose-500" : ""}`} />
                        </button>
                      </div>

                      {/* Meaning */}
                      <p className="text-xs text-stone-700 leading-relaxed font-medium">
                        "{isTamil && item.meaningTa ? item.meaningTa : item.meaning}"
                      </p>

                      {/* NUMEROLOGICALLY FORTIFIED SPELLING */}
                      {item.isTuned && item.tunedName ? (
                        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-emerald-50 border border-amber-300 space-y-2 shadow-sm">
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                              {isTamil ? "எண்கணித சுப எழுத்து சேர்க்கை (Fortified Spelling)" : "Numerologically Fortified Spelling"}
                            </span>
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-mono font-bold border border-emerald-300">
                              Chaldean: {item.tunedCompound} → {item.tunedSingle}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-0.5">
                            <div className="text-base font-serif font-bold text-amber-950 tracking-wide">
                              {initial && <span className="text-amber-700 mr-1">{initial}.</span>}
                              {item.tunedName}
                              {parentSurname && <span className="text-xs text-stone-600 font-normal ml-1.5">{parentSurname}</span>}
                            </div>
                            <div className="text-[10px] font-semibold text-amber-900 font-mono text-right max-w-[200px] truncate">
                              ✦ {isTamil && item.tunedCompoundTitleTa ? item.tunedCompoundTitleTa : item.tunedCompoundTitle}
                            </div>
                          </div>

                          <p className="text-[11px] text-stone-800 leading-snug bg-white/80 p-2 rounded-xl border border-amber-200 font-medium">
                            <span className="text-amber-800 font-bold mr-1">✦ {isTamil ? "எழுத்து பலன்:" : "Tuned Reason:"}</span>
                            {isTamil && item.addedLetterExplanationTa ? item.addedLetterExplanationTa : item.addedLetterExplanation}
                          </p>
                        </div>
                      ) : (
                        <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-[11px]">
                          <span className="text-emerald-900 font-semibold flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            {isTamil ? "இயற்கையான உச்ச ராஜயோக அதிர்வு" : "Optimal Raja Yoga Vibration"}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-800 font-bold">
                            Compound {item.compoundNumber} → {item.destinyNumber}
                          </span>
                        </div>
                      )}

                      {/* WHY SUGGESTED & EMPOWERMENT RATIONALE */}
                      <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-1.5 shadow-inner">
                        <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                          {t.whySuggested}
                        </span>
                        <p className="text-[11px] text-stone-700 leading-relaxed">
                          {isTamil && item.whyGreatfulTa ? item.whyGreatfulTa : item.whyGreatful}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-2 border-t border-amber-100 flex items-center justify-between text-[11px]">
                      <span className="text-stone-500 text-[10px]">
                        {isTamil ? "குடும்ப அங்கீகாரம் & வாக்குகள்" : "Family Resonance"}
                      </span>
                      
                      <button
                        onClick={() => castVote(item.name)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-stone-800 text-[11px] font-medium border border-amber-200 transition-all shadow-sm"
                      >
                        <ThumbsUp className="w-3 h-3 text-amber-600" />
                        <span>{currentVote} {t.familyVotes}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Same-Nakshatra Broader Alternatives Section (Level 3 Fallback) */}
            {(newbornProfile?.suggestedNames || []).some(item => item.isSameStarAlternative) && (
              <div className="mt-8 pt-6 border-t border-amber-200 space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-300 space-y-1">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                    <Layers className="w-4 h-4 text-amber-700" />
                    <span>{isTamil ? "அதே நட்சத்திர மாற்றுப் பெயர்கள் (பிற பாதங்கள்)" : "Same-Nakshatra Alternatives (Broader Star Phonetics)"}</span>
                  </div>
                  <p className="text-xs text-stone-700">
                    {isTamil
                      ? `இப்பெயர்கள் ${newbornProfile?.nakshatraName} நட்சத்திரத்தின் பிற பாத ஒலி அமைப்புகளைக் கொண்டவை. துல்லிய பாத ஒலி (${newbornProfile?.auspiciousSyllableEn}) தவிர கூடுதல் விருப்பங்களுக்காக வழங்கப்படுகின்றன.`
                      : `These names belong to other Padas of ${newbornProfile?.nakshatraName}. Provided as secondary options for broader family consideration beyond the primary ${newbornProfile?.auspiciousSyllableEn} Pada syllable.`}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(newbornProfile?.suggestedNames || []).filter(item => item.isSameStarAlternative).map((item) => {
                    const isFavorited = shortlist.includes(item.name);
                    const currentVote = votes[item.name] || 0;
                    return (
                      <div
                        key={item.name}
                        className="p-5 rounded-2xl bg-stone-50/60 border border-stone-300 hover:border-amber-400 transition-all space-y-3.5 flex flex-col justify-between group relative shadow-sm"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xl font-serif font-bold text-stone-900">
                                  {initial && <span className="text-amber-700 mr-1">{initial}.</span>}
                                  {item.name}
                                </h4>
                                {item.nameTa && (
                                  <span className="text-sm font-bold text-stone-700 font-sans">
                                    ({item.nameTa})
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border flex items-center gap-1 ${
                                  item.tier === 1 ? "bg-emerald-100 text-emerald-900 border-emerald-300" :
                                  item.tier === 2 ? "bg-teal-100 text-teal-900 border-teal-300" :
                                  item.tier === 3 ? "bg-blue-100 text-blue-900 border-blue-300" :
                                  item.tier === 4 ? "bg-amber-100 text-amber-900 border-amber-300" :
                                  "bg-stone-100 text-stone-900 border-stone-300"
                                }`}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                  {isTamil ? `நிலை ${item.tier || 4}: ${item.tierLabel}` : `Tier ${item.tier || 4}: ${item.tierLabel || "Same-Star Alternative"}`}
                                </span>
                                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                  {item.syllableMatch ? `${item.syllableMatch}` : "Same-Star Alternative"}
                                </span>
                                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold border border-purple-300">
                                  Chaldean: {item.nameNumber?.compound} → {item.nameNumber?.single}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => toggleShortlist(item.name)}
                              className={`p-2 rounded-xl transition-all shrink-0 ${
                                isFavorited
                                  ? "bg-rose-100 text-rose-600 border border-rose-300"
                                  : "bg-white text-stone-500 hover:text-stone-800 border border-stone-200"
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${isFavorited ? "fill-rose-500" : ""}`} />
                            </button>
                          </div>

                          <p className="text-xs text-stone-700 leading-relaxed font-medium">
                            "{isTamil && item.meaningTa ? item.meaningTa : item.meaning}"
                          </p>

                          <div className="p-3 rounded-xl bg-white border border-stone-200 space-y-1">
                            <span className="text-[10px] font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-stone-500" />
                              {t.whySuggested}
                            </span>
                            <p className="text-[11px] text-stone-600 leading-relaxed">
                              {isTamil && item.whyGreatfulTa ? item.whyGreatfulTa : item.whyGreatful}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-[11px]">
                          <span className="text-stone-500 text-[10px]">
                            {isTamil ? "குடும்ப அங்கீகாரம் & வாக்குகள்" : "Family Resonance"}
                          </span>
                          <button
                            onClick={() => castVote(item.name)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-stone-100 text-stone-800 text-[11px] font-medium border border-stone-300 transition-all shadow-sm"
                          >
                            <ThumbsUp className="w-3 h-3 text-amber-600" />
                            <span>{currentVote} {t.familyVotes}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* AI Bespoke Generation Card */}
          <div className="p-6 md:p-8 rounded-3xl bg-white border border-purple-300 shadow-md space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 border border-purple-300 text-purple-900 text-xs font-bold">
                  <Zap className="w-3.5 h-3.5 text-purple-600" />
                  {t.aiDeepSynthesis}
                </div>
                <h3 className="text-xl font-serif font-bold text-stone-900">
                  {isTamil ? "Gemini AI மூலம் அரிய & நவீன பெயர்களை உருவாக்குக" : "Generate Rare, Modern & Creative Names with Gemini AI"}
                </h3>
                <p className="text-xs text-stone-600 max-w-xl">
                  {isTamil
                    ? "செயற்கை நுண்ணறிவு ஜோதிட அல்காரிதம் உங்கள் குழந்தையின் நட்சத்திர பாதம் மற்றும் எண்களுக்கு ஏற்ப பிரத்தியேக பெயர்களை உருவாக்கும்."
                    : "Gemini AI synthesizes rare Sanskrit and Tamil names conforming to exact phonetics, planetary rulers, and numerological balance."}
                </p>
              </div>

              <button
                onClick={handleGenerateAiNames}
                disabled={isAiLoading}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 transition-all shrink-0 disabled:opacity-50"
              >
                {isAiLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-purple-200" />
                    {t.aiGenerating}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-purple-200" />
                    {t.generateAiNamesBtn}
                  </>
                )}
              </button>
            </div>

            {aiError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {aiError}
              </div>
            )}

            {/* AI Generated Names Grid */}
            {aiNames.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {aiNames.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-purple-50/40 border border-purple-200 space-y-3 relative group shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
                          {initial && <span className="text-purple-700 mr-1">{initial}.</span>}
                          {item.name}
                          {item.nameTa && <span className="text-purple-800 font-sans text-sm">({item.nameTa})</span>}
                        </h4>
                        <span className="text-[10px] text-purple-700 font-semibold">
                          AI Astrological Synthesis
                        </span>
                      </div>

                      <button
                        onClick={() => toggleShortlist(item.name)}
                        className={`p-2 rounded-xl transition-all ${
                          shortlist.includes(item.name)
                            ? "bg-rose-100 text-rose-600 border border-rose-300"
                            : "bg-white text-stone-500 hover:text-stone-800 border border-purple-200"
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${shortlist.includes(item.name) ? "fill-rose-500 text-rose-500" : ""}`} />
                      </button>
                    </div>

                    <p className="text-xs text-stone-700">
                      "{isTamil && item.meaningTa ? item.meaningTa : item.meaning}"
                    </p>

                    <div className="p-3 rounded-xl bg-white border border-purple-200 space-y-1">
                      <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-purple-600" />
                        {t.whySuggested}
                      </span>
                      <p className="text-[11px] text-stone-700 leading-relaxed">
                        {item.whyGreatful}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* BROWSE CATALOG MODE */
        <div className="space-y-6">
          <div className="p-6 md:p-8 rounded-3xl bg-white border border-amber-300 shadow-md space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-serif font-bold text-stone-900">
                {t.babyMainTitle}
              </h2>
              <p className="text-xs text-stone-600 max-w-lg mx-auto">
                {t.babyDesc}
              </p>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs text-stone-700 font-semibold">{t.genderLabel}</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFDF9] border border-amber-300 text-stone-900 text-xs focus:outline-none focus:border-amber-500 shadow-sm"
                >
                  <option value="all">{t.allGenders}</option>
                  <option value="boy">{t.babyBoy}</option>
                  <option value="girl">{t.babyGirl}</option>
                  <option value="unisex">{t.unisex}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-stone-700 font-semibold">{t.cultureLabel}</label>
                <select
                  value={browseReligion}
                  onChange={e => setBrowseReligion(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFDF9] border border-amber-300 text-stone-900 text-xs focus:outline-none focus:border-amber-500 shadow-sm"
                >
                  <option value="all">{t.allTraditions}</option>
                  <option value="vedic">{t.vedicSanskrit}</option>
                  <option value="western">{t.westernModern}</option>
                  <option value="arabic">{t.arabicTradition}</option>
                  <option value="universal">{t.universalTradition}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-stone-700 font-semibold">{t.nakshatraFilter}</label>
                <select
                  value={selectedNakshatra}
                  onChange={e => {
                    const nakName = e.target.value;
                    setSelectedNakshatra(nakName);
                    const meta = NAKSHATRA_PADA_SYLLABLES[nakName];
                    if (meta && meta.syllablesEn.length > 0) {
                      setTargetSyllable(meta.syllablesEn[0]);
                    } else {
                      setTargetSyllable("");
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFDF9] border border-amber-300 text-stone-900 text-xs focus:outline-none focus:border-amber-500 shadow-sm"
                >
                  <option value="">{t.anyNakshatra}</option>
                  {NAKSHATRAS.map(n => (
                    <option key={n.name} value={n.name}>{n.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-stone-700 font-semibold">{t.surnameLabel}</label>
                <input
                  type="text"
                  value={parentSurname}
                  onChange={e => setParentSurname(e.target.value)}
                  placeholder="e.g. Kapoor"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFDF9] border border-amber-300 text-stone-900 text-xs focus:outline-none focus:border-amber-500 shadow-sm"
                />
              </div>
            </div>

            {selectedNakshatra && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <span className="text-xs text-stone-800 font-medium">
                  {t.auspiciousSoundsFor} <strong className="text-amber-800">{selectedNakshatra}</strong>:
                </span>
                <div className="flex flex-wrap gap-2">
                  {(NAKSHATRA_PADA_SYLLABLES[selectedNakshatra]?.syllablesEn || currentNakMeta?.syllables || []).map((syl, sIdx) => {
                    const sylTa = NAKSHATRA_PADA_SYLLABLES[selectedNakshatra]?.syllablesTa?.[sIdx];
                    return (
                      <button
                        key={syl}
                        onClick={() => setTargetSyllable(syl === targetSyllable ? "" : syl)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          targetSyllable === syl
                            ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                            : "bg-white text-stone-700 hover:text-stone-900 border border-amber-200"
                        }`}
                      >
                        {sylTa && <span>{sylTa}</span>}
                        <span>({syl})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Catalog Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {browseNames.map(item => {
              const isFavorited = shortlist.includes(item.name);
              const currentVote = votes[item.name] || 0;
              return (
                <div
                  key={item.name}
                  className="p-5 rounded-2xl bg-white border border-amber-200 hover:border-amber-400 transition-all space-y-3 relative group shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
                        {item.name} {parentSurname && <span className="text-xs font-normal text-stone-500">{parentSurname}</span>}
                      </h3>
                      <span className="text-[10px] text-amber-800 font-medium">
                        {item.origin} • {item.religion}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleShortlist(item.name)}
                      className={`p-2 rounded-xl transition-all ${
                        isFavorited
                          ? "bg-rose-100 text-rose-600 border border-rose-300"
                          : "bg-amber-50 text-stone-500 hover:text-stone-800 border border-amber-200"
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFavorited ? "fill-rose-500 text-rose-500" : ""}`} />
                    </button>
                  </div>

                  <p className="text-xs text-stone-700">"{item.meaning}"</p>

                  <div className="pt-2 border-t border-amber-100 flex items-center justify-between text-[11px]">
                    <div>
                      <span className="text-stone-500">{t.destinyNo} </span>
                      <span className="font-bold text-purple-800">{item.destinyNumber}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-semibold border border-emerald-300">
                        {item.compatibilityLabel || t.harmony}
                      </span>
                      
                      <button
                        onClick={() => castVote(item.name)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-stone-800 text-[10px] border border-amber-200"
                      >
                        <ThumbsUp className="w-3 h-3 text-amber-600" />
                        <span>{currentVote}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-[#FFFDF9] border border-amber-300 shadow-2xl space-y-4 text-stone-800">
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-amber-600" />
                {t.votingModalTitle}
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-stone-500 hover:text-stone-800 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-700 leading-relaxed">
              {t.votingModalDesc}
            </p>

            <div className="p-3 rounded-xl bg-white border border-amber-200 flex items-center justify-between shadow-sm">
              <span className="text-xs text-stone-600 truncate font-mono">
                https://astroverse.ai/vote?token=fam-8492-baby
              </span>
              <button
                onClick={() => alert(isTamil ? "இணைப்பு நகலெடுக்கப்பட்டது!" : "Voting link copied to clipboard!")}
                className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white text-xs font-bold shrink-0 ml-2 shadow-sm"
              >
                {t.copyLink}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


