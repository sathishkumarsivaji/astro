import React, { useState } from "react";
import { Compass, Calendar, Clock, MapPin, Sparkles, Globe, ArrowRight, AlertCircle, User } from "lucide-react";
import { calculateChartBySystem } from "../../astrology";
import { TRANSLATIONS } from "../../services/localization";
import { EMPTY_BIRTH_PROFILE, DEMO_BIRTH_PROFILE, validateBirthProfile } from "../../types/birthProfile";
import PlaceAutocomplete from "../Common/PlaceAutocomplete";
import { POPULAR_PLACES_DB, resolveTypedPlace } from "../../services/geoService";

export default function BirthChartForm({ onCalculate, initialProfile = null, lang = "en" }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isTamil = lang === "ta";

  const [formData, setFormData] = useState(() => initialProfile || { ...EMPTY_BIRTH_PROFILE });
  const [errors, setErrors] = useState([]);

  const popularCities = [
    { name: lang === "ta" ? "சென்னை, தமிழ்நாடு" : "Chennai, India", lat: 13.0827, lng: 80.2707, tz: 5.5, timezoneId: "Asia/Kolkata" },
    { name: lang === "ta" ? "மதுரை, தமிழ்நாடு" : "Madurai, India", lat: 9.9252, lng: 78.1198, tz: 5.5, timezoneId: "Asia/Kolkata" },
    { name: lang === "ta" ? "கோவை, தமிழ்நாடு" : "Coimbatore, India", lat: 11.0168, lng: 76.9558, tz: 5.5, timezoneId: "Asia/Kolkata" },
    { name: lang === "ta" ? "ஓசூர், கிருஷ்ணகிரி" : "Hosur, Krishnagiri", lat: 12.7409, lng: 77.8253, tz: 5.5, timezoneId: "Asia/Kolkata" },
    { name: lang === "ta" ? "சேலம், தமிழ்நாடு" : "Salem, Tamil Nadu", lat: 11.6643, lng: 78.1460, tz: 5.5, timezoneId: "Asia/Kolkata" },
    { name: lang === "ta" ? "பெங்களூரு" : "Bengaluru, India", lat: 12.9716, lng: 77.5946, tz: 5.5, timezoneId: "Asia/Kolkata" },
    { name: lang === "ta" ? "புது தில்லி" : "New Delhi, India", lat: 28.6139, lng: 77.2090, tz: 5.5, timezoneId: "Asia/Kolkata" },
    { name: lang === "ta" ? "லண்டன்" : "London, UK", lat: 51.5074, lng: -0.1278, tz: 0.0, timezoneId: "Europe/London" },
    { name: lang === "ta" ? "சிங்கப்பூர்" : "Singapore", lat: 1.3521, lng: 103.8198, tz: 8.0, timezoneId: "Asia/Singapore" }
  ];

  const handleCitySelect = (city) => {
    setFormData(prev => ({
      ...prev,
      birthPlace: city.displayString || city.name,
      latitude: city.lat,
      longitude: city.lon || city.lng,
      utcOffset: city.tz ?? 5.5,
      timezoneId: city.timezoneId || (city.tz === 5.5 ? "Asia/Kolkata" : (city.tz === 0.0 ? "Europe/London" : (city.tz === 8.0 ? "Asia/Singapore" : "UTC")))
    }));
  };

  const handleLoadDemo = () => {
    const demo = { ...DEMO_BIRTH_PROFILE };
    setFormData(demo);
    setErrors([]);
    const chartData = calculateChartBySystem(
      demo.system || "lahiri",
      demo
    );
    onCalculate({ ...chartData, profile: demo });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Auto-resolve coordinates if place name is typed
    let lat = formData.latitude;
    let lng = formData.longitude;
    let tzOffset = formData.utcOffset;
    let tzId = formData.timezoneId;

    if ((lat === null || lng === null) && formData.birthPlace?.trim()) {
      const match = resolveTypedPlace(formData.birthPlace);
      if (match) {
        lat = match.lat;
        lng = match.lon ?? match.lng;
        tzOffset = match.tz ?? 5.5;
        tzId = match.timezoneId || "Asia/Kolkata";
      }
    }

    const profileToValidate = {
      ...formData,
      latitude: lat,
      longitude: lng,
      utcOffset: tzOffset ?? 5.5,
      timezoneId: tzId,
      name: formData.name?.trim() || (isTamil ? "ஜாதகர்" : "Native"),
      isDemo: false
    };

    const validation = validateBirthProfile(profileToValidate);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    setErrors([]);

    if (lat === null || lng === null) {
      alert(lang === "ta" ? "பிறந்த இடத்தை பரிந்துரையிலிருந்து தேர்வு செய்யவும் அல்லது சரியான பெயரை உள்ளிடவும்" : "Please select a birth location from the suggestions or enter a recognized city name.");
      return;
    }

    try {
      const chartData = calculateChartBySystem(
        profileToValidate.system || "lahiri",
        profileToValidate
      );
      onCalculate({ ...chartData, profile: profileToValidate });
    } catch (err) {
      const errMsg = err?.message || String(err);
      if (errMsg.includes("AMBIGUOUS_FOLD")) {
        setErrors([isTamil ? "தேர்ந்தெடுக்கப்பட்ட நேரம் பகல் சேமிப்பு நேர மாற்றத்தால் (DST Fallback) இரண்டு முறை நிகழ்கிறது. தயவுசெய்து துல்லியமான நேரத்தை உறுதிப்படுத்தவும்." : "The selected birth time is ambiguous due to Daylight Saving Time fallback. Please verify the exact birth instant."]);
      } else if (errMsg.includes("NONEXISTENT_LOCAL_TIME")) {
        setErrors([isTamil ? "தேர்ந்தெடுக்கப்பட்ட நேரம் பகல் சேமிப்பு நேர மாற்றத்தால் (DST Spring Forward) இல்லாத ஒரு நேரமாகும். தயவுசெய்து சரியான நேரத்தை உள்ளிடவும்." : "The selected birth time does not exist in this timezone due to Daylight Saving Time spring-forward clock change. Please adjust the time."]);
      } else {
        setErrors([errMsg]);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-8 rounded-3xl glass-card border border-amber-300/80 relative overflow-hidden shadow-lg">
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold uppercase tracking-wider shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" /> {t.natalChartTitle}
        </div>
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900">
          {t.enterBirthCoord}
        </h2>
        <p className="text-xs text-stone-600 max-w-lg mx-auto">
          {t.natalChartSubtitle}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Astrological System Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5 justify-center">
            <Compass className="w-3.5 h-3.5 text-amber-600" />
            <span>{isTamil ? "ஜோதிட கணக்கீட்டு முறை (Calculation System)" : "Astrological Calculation System"}</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "lahiri", labelEn: "Lahiri (Chitrapaksha)", labelTa: "லஹரி (சித்திரபக்ஷ)", descEn: "Vedic Sidereal Standard", descTa: "வேத நிராயணம்" },
              { id: "kp", labelEn: "KP System", labelTa: "கே.பி. முறை", descEn: "Placidus Cusps & Sub-Lords", descTa: "உப-அதிபதி முறை" },
              { id: "raman", labelEn: "B.V. Raman", labelTa: "பி.வி. ராமன்", descEn: "Sidereal (397 AD Epoch)", descTa: "ராமன் நிராயணம்" },
              { id: "tropical", labelEn: "Western (Sayana)", labelTa: "சாயனம் (மேற்கத்திய)", descEn: "Vernal Equinox (0° Aries)", descTa: "சாயன அயனம்" },
            ].map(sys => {
              const isSelected = (formData.system || "lahiri").toLowerCase() === sys.id || (sys.id === "lahiri" && formData.system === "vedic");
              return (
                <button
                  key={sys.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, system: sys.id }))}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                    isSelected
                      ? "bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20 font-bold"
                      : "bg-white text-stone-700 border-amber-200/80 hover:bg-amber-50"
                  }`}
                >
                  <span className="text-xs font-semibold">{isTamil ? sys.labelTa : sys.labelEn}</span>
                  <span className={`text-[10px] ${isSelected ? "text-amber-100" : "text-stone-500"}`}>
                    {isTamil ? sys.descTa : sys.descEn}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700">{t.fullName}</label>
            <input
              type="text"
              value={formData.name}
              placeholder={lang === "ta" ? "உங்கள் பெயர் (விரும்பினால்)" : "Your Name (Optional)"}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white border border-amber-200/90 text-stone-900 text-sm focus:outline-none focus:border-amber-500 shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-600" />
              {isTamil ? "பாலினம் (Gender)" : "Gender"}
            </label>
            <div className="grid grid-cols-2 gap-2 h-[46px]">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, gender: "male" }))}
                className={`flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all border ${
                  formData.gender === "male" || !formData.gender
                    ? "bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-500/25"
                    : "bg-white text-stone-700 border-amber-200 hover:bg-amber-50"
                }`}
              >
                <span>👨</span>
                <span>{isTamil ? "ஆண் (Male)" : "Male"}</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, gender: "female" }))}
                className={`flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all border ${
                  formData.gender === "female"
                    ? "bg-rose-500 text-white border-rose-600 shadow-sm shadow-rose-500/25"
                    : "bg-white text-stone-700 border-amber-200 hover:bg-rose-50"
                }`}
              >
                <span>👩</span>
                <span>{isTamil ? "பெண் (Female)" : "Female"}</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              {t.dob}
            </label>
            <input
              type="date"
              required
              value={formData.birthDate}
              onChange={e => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white border border-amber-200/90 text-stone-900 text-sm focus:outline-none focus:border-amber-500 shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              {t.birthTime}
            </label>
            <input
              type="time"
              required
              value={formData.birthTime}
              onChange={e => setFormData(prev => ({ ...prev, birthTime: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white border border-amber-200/90 text-stone-900 text-sm focus:outline-none focus:border-amber-500 shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              {t.birthPlace}
            </label>
            <PlaceAutocomplete
              value={formData.birthPlace}
              lang={lang}
              onChange={(val) => setFormData(prev => ({ ...prev, birthPlace: val, latitude: null, longitude: null, utcOffset: null, timezoneId: null }))}
              onSelect={(p) => {
                setFormData(prev => ({
                  ...prev,
                  birthPlace: p.displayString || p.name,
                  latitude: p.lat,
                  longitude: p.lon ?? p.lng,
                  utcOffset: p.tz ?? 5.5,
                  timezoneId: p.timezoneId || null
                }));
              }}
            />
            {formData.latitude !== null && formData.longitude !== null && (
              <div className="mt-1 flex items-center gap-1 text-xs text-emerald-700">
                <span>✓</span>
                <span>{lang === "ta" ? "இடம் சரிபார்க்கப்பட்டது" : "Location verified"}: {Number(formData.latitude).toFixed(4)}°, {Number(formData.longitude).toFixed(4)}°{formData.timezoneId ? ` (${formData.timezoneId})` : ''}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Location Chips */}
        <div className="space-y-2">
          <span className="text-[11px] text-stone-600 font-semibold">{t.quickLocations}</span>
          <div className="flex flex-wrap gap-2">
            {popularCities.map(city => (
              <button
                key={city.name}
                type="button"
                onClick={() => handleCitySelect(city)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                  formData.birthPlace === city.name
                    ? "bg-amber-100 text-amber-900 border-amber-400 font-bold shadow-sm"
                    : "bg-white text-stone-600 border-amber-200/70 hover:bg-amber-50 hover:text-stone-900"
                }`}
              >
                {city.name}
              </button>
            ))}
          </div>
        </div>

        {/* Validation Errors */}
        {errors.length > 0 && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{isTamil ? "தயவுசெய்து சரியான விவரங்களை உள்ளிடவும்:" : "Please provide complete birth details:"}</span>
            </div>
            {errors.map((err, i) => (
              <div key={i} className="pl-5">• {err}</div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white font-bold text-sm shadow-lg shadow-amber-500/25 hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <span>{t.calculateBtn}</span>
            <ArrowRight className="w-4 h-4 text-amber-100" />
          </button>

          <button
            type="button"
            onClick={handleLoadDemo}
            className="px-5 py-3.5 rounded-xl bg-amber-100/80 hover:bg-amber-200/80 text-amber-900 border border-amber-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-700" />
            <span>{isTamil ? "மாதிரி ஜாதகம் ஏற்றுக (Demo)" : "Load Demo Chart"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
