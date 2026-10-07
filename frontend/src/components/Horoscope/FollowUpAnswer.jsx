import React, { useState } from "react";
import { Check, Copy, Shield, Bookmark, ExternalLink, HelpCircle, AlertCircle, Sparkles } from "lucide-react";
import { getChapterById } from "../../config/reportChapters.js";
import { getSystemConfig } from "../../config/astrologySystems.js";

export default function FollowUpAnswer({
  answer,
  system = "lahiri",
  relevantSections = [],
  evidenceIds = [],
  dataUsed = [],
  status = "REPORT_SUPPORTED",
  limitations = [],
  onSelectChapter = null,
  isTamil = false
}) {
  const [copied, setCopied] = useState(false);
  const sysConfig = getSystemConfig(system);

  const handleCopy = () => {
    if (answer) {
      navigator.clipboard.writeText(answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "CALCULATED_FACT":
      case "DETERMINISTIC_FACT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-blue-50 text-blue-800 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            {isTamil ? "கணக்கீட்டு உண்மை (FACT)" : "CALCULATED FACT"}
          </span>
        );
      case "SUPPORTED_INTERPRETATION":
      case "REPORT_SUPPORTED":
      case "SUPPORTED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {isTamil ? "சான்றுகளால் ஆதரிக்கப்பட்ட விளக்கம் (SUPPORTED)" : "SUPPORTED INTERPRETATION"}
          </span>
        );
      case "TRADITIONAL_INTERPRETATION":
      case "TRADITIONAL":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-indigo-50 text-indigo-800 border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            {isTamil ? "பாரம்பரிய ஜோதிட விளக்கம் (TRADITIONAL)" : "TRADITIONAL INTERPRETATION"}
          </span>
        );
      case "PARTIALLY_SUPPORTED":
      case "MIXED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-orange-50 text-orange-900 border border-orange-200">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
            {isTamil ? "பகுதி சான்றாதார விளக்கம் (PARTIAL)" : "PARTIALLY SUPPORTED"}
          </span>
        );
      case "INSUFFICIENT_DATA":
      case "INSUFFICIENT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-amber-50 text-amber-900 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            {isTamil ? "வரையறுக்கப்பட்ட தரவு (INSUFFICIENT)" : "INSUFFICIENT DATA"}
          </span>
        );
      case "AMBIGUOUS":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-purple-50 text-purple-900 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            {isTamil ? "தெளிவுபடுத்தல் தேவை (CLARIFICATION)" : "CLARIFICATION REQUIRED"}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30 rounded-2xl border border-amber-200 p-4 md:p-5 shadow-xs space-y-3.5 text-stone-800 text-xs md:text-sm">
      {/* Header with System & Status Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 pb-2.5">
        <div className="flex items-center flex-wrap gap-2">
          {/* Astrology System Badge */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-semibold border border-stone-200">
            <Shield className="w-3 h-3 text-amber-600" />
            <span>{isTamil ? sysConfig.tamilName : sysConfig.name}</span>
          </span>
          {getStatusBadge()}
        </div>

        <button
          onClick={handleCopy}
          aria-label={isTamil ? "பதிலை நகலெடு" : "Copy answer"}
          className="p-1.5 rounded-lg text-stone-500 hover:text-amber-800 hover:bg-amber-100/50 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
          title={isTamil ? "பதிலை நகலெடுக்க" : "Copy answer text"}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{copied ? (isTamil ? "நகலெடுக்கப்பட்டது" : "Copied") : (isTamil ? "நகலெடு" : "Copy")}</span>
        </button>
      </div>

      {/* Answer Body */}
      <div className="leading-relaxed font-sans text-stone-800 whitespace-pre-line text-xs md:text-[13px]">
        {answer}
      </div>

      {/* Sources / Evidence Footer */}
      {(relevantSections.length > 0 || evidenceIds.length > 0) && (
        <div className="pt-2 border-t border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-stone-600">
          {relevantSections.length > 0 && (
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="font-semibold text-stone-700 flex items-center gap-1">
                <Bookmark className="w-3 h-3 text-amber-600" />
                {isTamil ? "அறிக்கைப் பிரிவுகள்:" : "Report Sources:"}
              </span>
              {relevantSections.map((secId) => {
                const ch = getChapterById(secId);
                const title = ch ? (isTamil ? (ch.titleTamil || ch.title) : ch.title) : secId;
                return (
                  <button
                    key={secId}
                    type="button"
                    onClick={() => onSelectChapter && onSelectChapter(secId)}
                    className="px-2 py-0.5 rounded-md bg-amber-100/70 hover:bg-amber-200 text-amber-900 border border-amber-200 text-[10px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
                    title={isTamil ? "இந்த அத்தியாயத்திற்கு செல்லவும்" : "Jump to chapter"}
                  >
                    <span>{title}</span>
                    {onSelectChapter && <ExternalLink className="w-2.5 h-2.5 opacity-60" />}
                  </button>
                );
              })}
            </div>
          )}

          {evidenceIds.length > 0 && (
            <div className="flex items-center flex-wrap gap-1">
              <span className="font-semibold text-stone-700">
                {isTamil ? "சான்றாதாரக் குறியீடுகள்:" : "Evidence:"}
              </span>
              {evidenceIds.map((id) => (
                <span
                  key={id}
                  className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-300 font-mono text-[10px]"
                >
                  {id}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Limitations note */}
      {limitations.length > 0 && (
        <div className="text-[10px] text-stone-500 italic bg-stone-50 rounded-lg p-2 border border-stone-200">
          {limitations.join(" ")}
        </div>
      )}
    </div>
  );
}
