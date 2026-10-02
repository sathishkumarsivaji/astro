import React, { useState } from "react";
import { Shield, Download, Trash2, CheckCircle2, AlertTriangle, Loader2, X, Lock, FileText, Database } from "lucide-react";
import { ensureSessionToken } from "../../services/aiAstrologyService";
import { apiFetch } from "../../services/apiClient";

export default function PrivacyModal({ isOpen, onClose, lang = "en", onDataErased = null }) {
  const isTamil = lang === "ta";
  const [isExporting, setIsExporting] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [eraseSuccess, setEraseSuccess] = useState(false);
  const [confirmErase, setConfirmErase] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen) return null;

  const handleExportData = async () => {
    setIsExporting(true);
    setErrorMessage(null);
    try {
      const token = await ensureSessionToken();
      const res = await apiFetch("/api/user/export", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        credentials: "include"
      });

      if (res && res.ok) {
        const dossier = await res.json();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dossier, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `astroverse_user_dossier_${dossier.userId || "data"}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 5000);
      } else {
        const err = res ? await res.json().catch(() => ({})) : {};
        setErrorMessage(err.error || (isTamil ? "தரவு ஏற்றுமதி செய்ய முடியவில்லை." : "Failed to export data dossier."));
      }
    } catch (e) {
      setErrorMessage(isTamil ? "சேவையகத்துடன் தொடர்பு கொள்ள முடியவில்லை." : "Could not connect to backend server for export.");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePermanentErasure = async () => {
    setIsErasing(true);
    setErrorMessage(null);
    try {
      const token = await ensureSessionToken();
      const res = await apiFetch("/api/user/delete", {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        credentials: "include"
      });

      if (res && res.ok) {
        // Purge local storage
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.removeItem("astro_session_token");
          localStorage.removeItem("astro_user_id");
          localStorage.removeItem("astro_current_user");
          localStorage.removeItem("astro_account_secret");
          localStorage.removeItem("astro_saved_charts");
          localStorage.removeItem("astro_journal_entries");
        }
        setEraseSuccess(true);
        if (typeof onDataErased === "function") {
          onDataErased();
        }
        setTimeout(() => {
          setEraseSuccess(false);
          setConfirmErase(false);
          onClose();
          window.location.reload();
        }, 2000);
      } else {
        const err = res ? await res.json().catch(() => ({})) : {};
        setErrorMessage(err.error || (isTamil ? "தரவு நீக்கம் தோல்வியடைந்தது." : "Failed to erase account data."));
      }
    } catch (e) {
      setErrorMessage(isTamil ? "சேவையகத்துடன் தொடர்பு கொள்ள முடியவில்லை." : "Could not connect to backend server for erasure.");
    } finally {
      setIsErasing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-2xl w-full my-8 p-6 md:p-8 rounded-3xl bg-[#FFFDF9] border border-amber-300 relative space-y-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-800 p-2 text-sm font-bold"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" /> {isTamil ? "தரவு பாதுகாப்பு & தனியுரிமை" : "Data Privacy & Governance"}
          </div>
          <h2 className="text-2xl font-serif font-bold text-stone-900">
            {isTamil ? "தனியுரிமை & தரவு உரிமைகள் மேலாண்மை" : "Your Privacy & Data Rights"}
          </h2>
          <p className="text-xs text-stone-600">
            {isTamil
              ? "AstroVerse உங்கள் தனியுரிமையை மதிக்கிறது. GDPR Article 20 மற்றும் இந்திய DPDP சட்டம் 2023-ன் படி உங்கள் தரவுகளை முழுமையாக ஏற்றுமதி செய்யவோ அல்லது நிரந்தரமாக நீக்கவோ முடியும்."
              : "AstroVerse enforces zero-knowledge ephemeris privacy. Compliant with GDPR Article 20 Data Portability and India DPDP Act 2023 Right to Erasure."}
          </p>
        </div>

        {/* Governance Standards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>{isTamil ? "ரகசிய குறியாக்கம்" : "Encrypted Storage"}</span>
            </div>
            <p className="text-[11px] text-stone-600">
              {isTamil ? "HMAC-SHA256 குறியாக்கப்பட்ட அமர்வு பாதுகாப்பு." : "HMAC-SHA256 signed cryptographic session security."}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
              <FileText className="w-3.5 h-3.5 text-amber-700" />
              <span>{isTamil ? "தரவு பெயர்வுத்திறன்" : "Data Portability"}</span>
            </div>
            <p className="text-[11px] text-stone-600">
              {isTamil ? "முழுமையான ஜாதகங்கள் மற்றும் பரிவர்த்தனைகள் JSON வடிவில்." : "Export complete dossiers in machine-readable JSON."}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
              <Database className="w-3.5 h-3.5 text-amber-700" />
              <span>{isTamil ? "மறக்கப்படும் உரிமை" : "Right to Erasure"}</span>
            </div>
            <p className="text-[11px] text-stone-600">
              {isTamil ? "சர்வர் மற்றும் லோக்கல் சேமிப்பகத்திலிருந்து முழுமையான நீக்கம்." : "Permanent purging across backend db and client storage."}
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Actions Area */}
        <div className="space-y-4 pt-2">
          {/* 1. Export Dossier */}
          <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-stone-900">
                {isTamil ? "முழுமையான தரவு கோப்பை பதிவிறக்கு (Export Dossier)" : "Download Complete Data Dossier"}
              </h4>
              <p className="text-xs text-stone-600">
                {isTamil
                  ? "சேமிக்கப்பட்ட ஜாதகங்கள், பரிவர்த்தனை பதிவுகள் மற்றும் உரிமங்களை JSON கோப்பாக பதிவிறக்கவும்."
                  : "Download all saved horoscopes, ledger transaction history, and account entitlements as JSON."}
              </p>
            </div>
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shrink-0 shadow-xs transition-all disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : exportSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-200" /> : <Download className="w-4 h-4" />}
              <span>{exportSuccess ? (isTamil ? "பதிவிறக்கப்பட்டது!" : "Exported!") : isExporting ? (isTamil ? "ஏற்றுமதி ஆகிறது..." : "Exporting...") : (isTamil ? "பதிவிறக்கு (JSON)" : "Export JSON")}</span>
            </button>
          </div>

          {/* 2. Permanent Erasure */}
          <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 shadow-xs space-y-3">
            <div>
              <h4 className="text-sm font-bold text-rose-900 flex items-center gap-1.5">
                <Trash2 className="w-4 h-4 text-rose-600" />
                {isTamil ? "கணக்கு மற்றும் தரவு நிரந்தர நீக்கம் (Permanent Erasure)" : "Permanent Account & Data Deletion"}
              </h4>
              <p className="text-xs text-stone-600">
                {isTamil
                  ? "இந்த செயல் சர்வர் மற்றும் இந்த உலாவியில் உள்ள உங்கள் அனைத்து ஜாதக கணக்குகளையும் மீட்டெடுக்க முடியாதவாறு நிரந்தரமாக அழித்துவிடும்."
                  : "Purges your identity, saved horoscopes, session tokens, and credit balances permanently from both backend database and local browser."}
              </p>
            </div>

            {eraseSuccess ? (
              <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>{isTamil ? "உங்கள் தரவு வெற்றிகரமாக நிரந்தரமாக அழிக்கப்பட்டது. பக்கம் புதுப்பிக்கப்படுகிறது..." : "Account data permanently erased. Reloading clean state..."}</span>
              </div>
            ) : confirmErase ? (
              <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 space-y-2">
                <p className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-700" />
                  {isTamil ? "நிச்சயமாக அழிக்க விரும்புகிறீர்களா? இதை மீட்டெடுக்க முடியாது." : "Are you absolutely sure? This cannot be undone."}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePermanentErasure}
                    disabled={isErasing}
                    className="px-4 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isErasing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    <span>{isTamil ? "ஆம், நிரந்தரமாக அழி" : "Yes, Purge Permanently"}</span>
                  </button>
                  <button
                    onClick={() => setConfirmErase(false)}
                    className="px-3 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold"
                  >
                    {isTamil ? "ரத்துசெய்" : "Cancel"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmErase(true)}
                className="px-4 py-2 rounded-xl bg-white border border-rose-300 text-rose-700 hover:bg-rose-100 text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isTamil ? "என் தரவுகளை நிரந்தரமாக அழி (Delete All Data)" : "Erase All My Data"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-amber-200 text-center">
          <p className="text-[11px] text-stone-500">
            {isTamil
              ? "AstroVerse உங்கள் தனிப்பட்ட ஜாதக தகவல்களை மூன்றாம் தரப்பினருக்கு விற்பனை செய்வதில்லை."
              : "AstroVerse commits to zero third-party data broker transmission. All birth ephemeris computation occurs on privacy-shielded nodes."}
          </p>
        </div>
      </div>
    </div>
  );
}
