import React, { useState } from "react";
import { Info, Lock, ShieldCheck } from "lucide-react";
import { TRANSLATIONS } from "../../services/localization";

export default function DisclaimerBanner({ lang = "en" }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const [minimized, setMinimized] = useState(false);

  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setMinimized(false)}
          className="p-2.5 rounded-full bg-[#FFFDF9] border border-amber-300 text-amber-800 text-xs shadow-lg hover:scale-105 transition-transform flex items-center gap-1.5"
        >
          <ShieldCheck className="w-4 h-4 text-amber-600" />
          <span className="hidden sm:inline text-[11px] font-medium">{t.complianceBadge}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-amber-200 text-[11px] text-stone-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-stone-800">{t.disclaimerLabel}</span>
            <p className="mt-0.5 leading-relaxed text-stone-600">
              {t.disclaimerText}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1 text-stone-500">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span className="text-stone-600 font-medium">{t.encrypted}</span>
          </div>
          <button
            onClick={() => setMinimized(true)}
            className="text-stone-500 hover:text-stone-800 font-bold px-2 py-1 rounded hover:bg-amber-100 transition-colors"
          >
            {t.dismiss}
          </button>
        </div>
      </div>
    </div>
  );
}
