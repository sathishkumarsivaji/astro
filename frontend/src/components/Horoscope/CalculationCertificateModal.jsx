import React from "react";
import { Shield, Award, CheckCircle2, Copy, Download, ExternalLink, Calendar, MapPin, Compass, Clock, Info } from "lucide-react";
import { generateCalculationCertificate } from "../../astrology/conventions";

export default function CalculationCertificateModal({ isOpen, onClose, chartData, lang = "en" }) {
  if (!isOpen || !chartData) return null;

  const isTamil = lang === "ta";
  const profile = chartData.profile || {};
  const systemId = (
    typeof chartData.system === "object"
      ? (chartData.system?.id || chartData.system?.name || "lahiri")
      : (chartData.system || profile.system || "lahiri")
  ).toLowerCase();

  const certificateData = generateCalculationCertificate(systemId, {
    ...profile,
    latitude: profile.latitude ?? chartData.latitude,
    longitude: profile.longitude ?? chartData.longitude,
    utcOffset: profile.utcOffset ?? chartData.utcOffset,
    timezoneId: profile.timezoneId ?? chartData.timezoneId,
    utcDate: chartData.utcDate,
    jd: chartData.jd
  });

  const cert = certificateData.certificate;

  const copyLedgerToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(cert, null, 2));
    alert(isTamil ? "சான்றிதழ் விவரங்கள் நகலெடுக்கப்பட்டன!" : "Calculation Certificate copied to clipboard!");
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cert-title"
    >
      <div className="max-w-2xl w-full my-8 p-6 md:p-8 rounded-3xl bg-[#FFFDF9] border border-amber-300 relative space-y-6 shadow-2xl animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-800 p-2 text-sm font-bold rounded-full hover:bg-stone-100 transition-all"
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Certificate Header */}
        <div className="text-center space-y-2 border-b border-amber-200/80 pb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>{isTamil ? "மறுஉருவாக்க கணிப்பு சான்றிதழ்" : "Reproducible Calculation Certificate"}</span>
          </div>
          <h2 id="cert-title" className="text-2xl md:text-3xl font-serif font-bold text-stone-900">
            AstroVerse {isTamil ? "கணக்கீட்டு சான்றிதழ்" : "Calculation Certificate"}
          </h2>
          <p className="text-xs text-stone-600 max-w-lg mx-auto">
            {isTamil
              ? "இந்த ஜாதகக் கணிப்பு சர்வதேச வானியல் இயற்பியல் தரநிலைகள் மற்றும் அங்கீகரிக்கப்பட்ட பாரம்பரிய சூத்திரங்களின்படி கணக்கிடப்பட்டுள்ளது."
              : "This birth chart has been mathematically certified under international planetary ephemeris conventions."}
          </p>
        </div>

        {/* Certificate Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 space-y-1">
            <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-600" />
              {isTamil ? "மரபு & முறை (System)" : "Tradition & System"}
            </span>
            <p className="font-bold text-stone-900 text-sm">{cert.system}</p>
            <p className="text-[11px] text-stone-600">{cert.conventionId}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 space-y-1">
            <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider flex items-center gap-1">
              <Compass className="w-3 h-3 text-amber-600" />
              {isTamil ? "அயனாம்சம் (Ayanamsha)" : "Ayanamsha Model"}
            </span>
            <p className="font-bold text-stone-900 text-sm">{cert.ayanamshaModel}</p>
            <p className="text-[11px] text-stone-600">
              {typeof chartData.ayanamsa === "number" ? `${chartData.ayanamsa.toFixed(4)}°` : (chartData.ayanamsa ? `${chartData.ayanamsa}°` : (chartData.ayanamsaValue ? `${Number(chartData.ayanamsaValue).toFixed(4)}°` : "0.0000°"))}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 space-y-1">
            <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-600" />
              {isTamil ? "UTC தருணம் (UTC Instant)" : "UTC Instant & JD"}
            </span>
            <p className="font-mono font-bold text-stone-900">{cert.utcInstant || "N/A"}</p>
            <p className="text-[11px] text-stone-600 font-mono">
              JD: {typeof cert.julianDay === "number" ? cert.julianDay.toFixed(5) : "N/A"}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 space-y-1">
            <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-600" />
              {isTamil ? "புவியியல் இடம் & நேர மண்டலம்" : "Location & Timezone"}
            </span>
            <p className="font-bold text-stone-900">
              {cert.latitude ? `${Number(cert.latitude).toFixed(4)}°, ${Number(cert.longitude).toFixed(4)}°` : "N/A"}
            </p>
            <p className="text-[11px] text-stone-600">
              {cert.timezoneId || "UTC"} (Offset: {cert.utcOffset !== null ? `UTC${cert.utcOffset >= 0 ? "+" : ""}${cert.utcOffset}` : "N/A"})
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
              {isTamil ? "வானியல் எபிமெரிஸ் & ஆயத்தொலைவு" : "Ephemeris & Frame"}
            </span>
            <p className="font-semibold text-stone-900">{cert.ephemerisEngine}</p>
            <p className="text-[10px] text-stone-500">Coordinate Frame: Geocentric True Ecliptic of Date (ECT)</p>
            <p className="text-[10px] text-stone-500">Reference Epoch: J2000.0 (JD 2451545.0 TT)</p>
            <p className="text-[10px] text-stone-500">Node Model: {cert.nodeModel || "Mean Node"}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
              {isTamil ? "நாட்காட்டி & துல்லியம்" : "Calendar & Precision"}
            </span>
            <p className="font-semibold text-stone-900">{chartData.calendarSystem || cert.calendarSystem}</p>
            <p className="text-[10px] text-stone-500">Precision: {cert.accuracy}</p>
            <p className="text-[10px] text-stone-500">Generated: {new Date(cert.calculatedAt).toLocaleString()}</p>
          </div>
        </div>

        {/* Polar Fallback Disclosure if Applicable */}
        {(chartData.isHouseSystemFallback || chartData.houseSystemFallbackReason) && (
          <div className="p-3.5 rounded-2xl bg-amber-100/70 border border-amber-300 text-xs text-amber-950 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Shield className="w-4 h-4 text-amber-700" />
              <span>{isTamil ? "துருவ அட்சரேகை பாவக மாற்று அறிவிப்பு:" : "House System Polar Fallback Disclosure:"}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-900">
              {isTamil 
                ? `கோரப்பட்ட பாவக முறை: ${chartData.houseSystemRequested || "Placidus"} | நடைமுறைப்படுத்தப்பட்ட முறை: ${chartData.houseSystemEffective || "Equal"}. காரணம்: ${chartData.houseSystemFallbackReason || "துருவ அட்சரேகை விலகல்"}.`
                : `Requested System: ${chartData.houseSystemRequested || "Placidus"} | Effective System: ${chartData.houseSystemEffective || "Equal"}. Reason: ${chartData.houseSystemFallbackReason || "Circumpolar latitude divergence limit"}.`}
            </p>
          </div>
        )}

        {/* Audit Disclaimer & D60 Sensitivity */}
        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 text-xs text-stone-600 space-y-2">
          <div className="flex items-start gap-2 font-medium text-amber-950">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>{isTamil ? "அறிவியல் & மரபு வேறுபாடு விளக்கம்:" : "Scientific & Traditional Framework Disclosure:"}</span>
          </div>
          <p className="pl-6 text-[11px] leading-relaxed text-stone-600">
            {cert.astronomicalDisclaimer}
          </p>
          {cert.d60SensitivityNotice && (
            <p className="pl-6 text-[10px] leading-relaxed text-amber-900 font-medium">
              ⚠️ {cert.d60SensitivityNotice}
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            onClick={copyLedgerToClipboard}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-100/80 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{isTamil ? "கணக்கீட்டு பதிவை நகலெடு (Copy JSON)" : "Copy Calculation Ledger (JSON)"}</span>
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white font-bold text-xs shadow-md hover:brightness-105 transition-all"
          >
            {isTamil ? "சரிபார்ப்பு முடிந்தது" : "Done / Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
