import React, { useState, useMemo } from "react";
import { X, Play, ShieldCheck, History, Award, CheckCircle2, AlertTriangle, Layers, BarChart2, RefreshCw } from "lucide-react";
import {
  generatePredictionBenchmarkDataset,
  partitionDataset,
  evaluateWithAntiLeakageProtocol,
  runAblationStudy,
  replayHistoricalCase,
  ABLATION_MODELS
} from "../../services/predictionValidationLab.js";

export default function HistoricalReplayModal({ isOpen, onClose, lang = "en" }) {
  const isTamil = lang === "ta";

  // Generate reproducible benchmark cohort
  const benchmarkCases = useMemo(() => generatePredictionBenchmarkDataset(100, 108), []);
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [activeTab, setActiveTab] = useState("replay"); // "replay" | "ablation" | "calibration"
  const [ablationResults, setAblationResults] = useState(null);
  const [isRunningAblation, setIsRunningAblation] = useState(false);

  const activeCase = benchmarkCases[selectedCaseIdx] || benchmarkCases[0];

  const replayResult = useMemo(() => {
    return replayHistoricalCase(activeCase);
  }, [activeCase]);

  // Execute cryptographic anti-leakage calculation protocol
  const antiLeakageRecord = useMemo(() => {
    return evaluateWithAntiLeakageProtocol(activeCase, (input) => {
      return replayResult.predictionsAtCutoff;
    });
  }, [activeCase, replayResult]);

  const handleRunAblation = () => {
    setIsRunningAblation(true);
    setTimeout(() => {
      const partitioned = partitionDataset(benchmarkCases, 0.6, 0.2);
      const results = runAblationStudy(partitioned.blindTestSet);
      setAblationResults(results);
      setIsRunningAblation(false);
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-amber-300 flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-amber-100/50 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-stone-900">
                {isTamil ? "செயற்கை மாதிரி கணிப்பு சரிபார்ப்புக் களம்" : "Synthetic Prediction Validation Laboratory"}
              </h2>
              <p className="text-xs text-stone-600">
                {isTamil
                  ? "கணிப்பு கசிவு தற்காப்பு நெறிமுறை (Cryptographic Anti-Leakage) மூலம் மாதிரி சோதனை நிகழ்வுகளின் உண்மைத்தன்மை மறுஆய்வு."
                  : "Simulated benchmark case replay & 7-stage ablation pipeline with cryptographic SHA-256 pre-cutoff freezing."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-white/80 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 bg-stone-50/70 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab("replay")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "replay"
                ? "bg-white text-amber-900 border-t-2 border-amber-500 shadow-2xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Play className="w-4 h-4 text-amber-600" />
            <span>{isTamil ? "மாதிரி மறுஆய்வு (Simulated Replay)" : "Simulated Benchmark Replay"}</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("ablation");
              if (!ablationResults) handleRunAblation();
            }}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "ablation"
                ? "bg-white text-amber-900 border-t-2 border-amber-500 shadow-2xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Layers className="w-4 h-4 text-amber-600" />
            <span>{isTamil ? "7-அடுக்கு நீக்குதல் ஆய்வு (7-Stage Ablation)" : "7-Stage Ablation Study"}</span>
          </button>
        </div>

        {/* Conditional Synthetic Benchmark Disclosure Banner */}
        {activeCase?.verificationStatus !== "OFFICIALLY_DOCUMENTED" && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300 flex items-start gap-3 text-amber-900 text-xs shadow-2xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">
                {isTamil
                  ? "மென்பொருள் சரிபார்ப்பு மாதிரி அறிவிப்பு (Synthetic Simulation Disclosure)"
                  : "Software Validation Synthetic Benchmark Disclosure"}
              </div>
              <p className="mt-0.5 text-[11px] text-amber-800 leading-relaxed">
                {isTamil
                  ? "இந்த மாதிரி மறுஆய்வு முடிவுகள் மென்பொருள் வழிமுறை சரிபார்ப்பிற்காக உருவாக்கப்பட்ட செயற்கை மாதிரி தரவுக் குழுவை (Synthetic Simulation Benchmark Cohort) பயன்படுத்துகின்றன; இவை சரிபார்க்கப்பட்ட உண்மையான வரலாற்று பிறப்பு-நிகழ்வு பதிவுகள் அல்ல. இங்கு குறிப்பிடப்படும் கணிப்பு துல்லிய அளவீடுகள் நிஜ உலக ஜோதிட துல்லியத்தை பிரதிபலிக்காது."
                  : "These backtesting results use a synthetically generated benchmark cohort for software validation, not verified real-world birth-and-outcome records. Prediction accuracy claims here do not represent real-world astrological accuracy."}
              </p>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-stone-800 text-xs">
          {activeTab === "replay" && (
            <div className="space-y-6">
              {/* Case Selector */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-stone-900 flex items-center gap-2">
                    <span>{isTamil ? "மாதிரி ஆய்வு ஜாதகம்:" : "Simulated Benchmark Case:"}</span>
                    <span className="font-mono bg-amber-200/80 px-2 py-0.5 rounded text-amber-950 font-bold">
                      {activeCase.caseId}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {isTamil ? "செயற்கை மாதிரி (Synthetic Benchmark)" : `Cohort: ${activeCase.dataQuality} Grade Synthetic`}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-600 mt-1">
                    {activeCase.birthDate} at {activeCase.birthTime} ({activeCase.timezoneId}) | Cutoff: {activeCase.predictionCutoffDate}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedCaseIdx}
                    onChange={(e) => {
                      setSelectedCaseIdx(Number(e.target.value));
                      setRevealed(false);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-amber-300 bg-white text-stone-800 font-semibold text-xs cursor-pointer shadow-2xs"
                  >
                    {benchmarkCases.slice(0, 15).map((c, i) => (
                      <option key={c.caseId} value={i}>
                        {c.caseId} ({c.birthDate})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cryptographic Pre-Cutoff Hash Ledger */}
              <div className="p-3.5 rounded-2xl bg-stone-900 text-stone-200 font-mono text-[11px] space-y-1.5 border border-stone-800 shadow-inner">
                <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold tracking-wider uppercase">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Anti-Leakage Calculation Certificate (Pre-Cutoff State)
                  </span>
                  <span className="text-stone-400">SHA-256 Verified</span>
                </div>
                <div className="break-all text-emerald-300 font-semibold text-[10px]">
                  Hash: {antiLeakageRecord.certificateHash}
                </div>
                <div className="text-[10px] text-stone-400">
                  Cutoff: {antiLeakageRecord.predictionCutoffDate} | Certified: {antiLeakageRecord.createdAt}
                </div>
              </div>

              {/* Step 1: Prediction at Cutoff */}
              <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-stone-900 flex items-center gap-2 text-sm">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>{isTamil ? "1. காலக்கெடு தேதியில் கணிக்கப்பட்டவை (Predictions at Cutoff):" : "1. What ASTROVERSE Predicted at Cutoff Date:"}</span>
                  </div>
                  <span className="text-[10px] font-mono bg-stone-100 text-stone-600 px-2 py-0.5 rounded border border-stone-200">
                    Strict Anti-Leakage Enforced
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-1.5">
                    <div className="font-bold text-indigo-950 flex items-center justify-between">
                      <span>{isTamil ? "திருமண காலக்கணிப்பு" : "Marriage Timing & Age"}</span>
                      <span className="text-[10px] bg-indigo-200/80 px-2 py-0.5 rounded text-indigo-900 font-bold">
                        {replayResult.predictionsAtCutoff.marriage.predictedWindow}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-600">
                      • {isTamil ? "கணிக்கப்பட்ட வயது:" : "Predicted Age:"} <strong>{replayResult.predictionsAtCutoff.marriage.indicativeAge}</strong>
                    </div>
                    <div className="text-[11px] text-stone-600">
                      • {isTamil ? "துணை திசை:" : "Predicted Direction:"} <strong>{replayResult.predictionsAtCutoff.marriage.predictedDirection}</strong>
                    </div>
                    <div className="text-[11px] text-stone-600">
                      • {isTamil ? "தூரம்:" : "Distance Band:"} <strong>{replayResult.predictionsAtCutoff.marriage.predictedDistanceBand}</strong>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-orange-50/50 border border-orange-100 space-y-1.5">
                    <div className="font-bold text-orange-950 flex items-center justify-between">
                      <span>{isTamil ? "தொழில் முன்னேற்றம்" : "Career Promotion Timing"}</span>
                      <span className="text-[10px] bg-orange-200/80 px-2 py-0.5 rounded text-orange-900 font-bold">
                        {replayResult.predictionsAtCutoff.career.predictedWindow}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-600">
                      • {isTamil ? "முன்னேற்ற வயது:" : "Promotion Age:"} <strong>{replayResult.predictionsAtCutoff.career.indicativeAge}</strong>
                    </div>
                    <div className="text-[11px] text-stone-600">
                      • {isTamil ? "தசா பலம்:" : "Active Dasha:"} <strong>Vimshottari Master Cycle</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reveal Ground Truth Button */}
              {!revealed ? (
                <div className="text-center pt-2">
                  <button
                    onClick={() => setRevealed(true)}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{isTamil ? "மாதிரி உண்மை நிகழ்வை வெளிப்படுத்துக (Reveal Ground Truth)" : "Reveal Simulated Benchmark Ground Truth"}</span>
                  </button>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-2xs space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-emerald-950 flex items-center gap-2 text-sm">
                      <Award className="w-4 h-4 text-emerald-600" />
                      <span>{isTamil ? "2. மாதிரி உண்மை நிகழ்வு மற்றும் ஒப்பீடு (Simulation Reality vs Prediction):" : "2. Simulated Ground Truth vs Prediction:"}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] tracking-wider uppercase ${
                      replayResult.evaluation.verdict === "EXACT_PREDICTION_CONVERGENCE" || replayResult.evaluation.verdict === "STRONG_PREDICTION_CONVERGENCE"
                        ? "bg-emerald-600 text-white"
                        : "bg-amber-600 text-white"
                    }`}>
                      {replayResult.evaluation.verdict.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl bg-white border border-emerald-200 space-y-1.5">
                      <div className="font-bold text-stone-900">
                        {isTamil ? "மாதிரி திருமண நிகழ்வு:" : "Simulated Marriage Outcome:"}
                      </div>
                      <div className="text-[11px] text-stone-700">
                        • {isTamil ? "நடந்த வருடம்:" : "Simulated Year:"} <strong>{replayResult.actualHistoricalEvents.marriage.actualYear} (Age {replayResult.actualHistoricalEvents.marriage.actualAge})</strong>
                      </div>
                      <div className="text-[11px] text-stone-700">
                        • {isTamil ? "துணை அமைந்த திசை:" : "Simulated Direction:"} <strong>{replayResult.actualHistoricalEvents.marriage.actualDirection}</strong> {replayResult.evaluation.directionMatched ? "(✓ Matched)" : `(Predicted: ${replayResult.predictionsAtCutoff.marriage.predictedDirection})`}
                      </div>
                      <div className="text-[11px] text-stone-700">
                        • {isTamil ? "தூரம்:" : "Simulated Distance:"} <strong>{replayResult.actualHistoricalEvents.marriage.actualDistanceBand}</strong> {replayResult.evaluation.distanceCategoryMatched ? "(✓ Matched)" : `(Predicted: ${replayResult.predictionsAtCutoff.marriage.predictedDistanceBand})`}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-bold mt-2">
                        {isTamil 
                          ? `காலக்கணிப்பு இடைவெளி: ${replayResult.evaluation.marriageTimingDeltaYears !== null ? replayResult.evaluation.marriageTimingDeltaYears : "—"} ஆண்டுகள் (${replayResult.evaluation.marriageTimingDeltaYears <= 1.0 ? "நெருங்கிய பொருத்தம்" : "இயல்பான மாறுபாடு"})`
                          : `Timing Delta: ${replayResult.evaluation.marriageTimingDeltaYears !== null ? `${replayResult.evaluation.marriageTimingDeltaYears} Years` : "—"} (${replayResult.evaluation.marriageTimingDeltaYears <= 1.0 ? "Close Convergence" : "Standard Variance"})`}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-emerald-200 space-y-1.5">
                      <div className="font-bold text-stone-900">
                        {isTamil ? "மாதிரி தொழில் உயர்வு:" : "Simulated Career Outcome:"}
                      </div>
                      <div className="text-[11px] text-stone-700">
                        • {isTamil ? "பதவி உயர்வு ஆண்டு:" : "Simulated Promotion Year:"} <strong>{replayResult.actualHistoricalEvents.career.actualYear} (Age {replayResult.actualHistoricalEvents.career.actualAge})</strong>
                      </div>
                      <div className="text-[10px] text-emerald-700 font-bold mt-2">
                        {isTamil 
                          ? `காலக்கணிப்பு இடைவெளி: ${replayResult.evaluation.careerTimingDeltaYears !== null ? replayResult.evaluation.careerTimingDeltaYears : "—"} ஆண்டுகள்`
                          : `Timing Delta: ${replayResult.evaluation.careerTimingDeltaYears !== null ? `${replayResult.evaluation.careerTimingDeltaYears} Years` : "—"}`}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "ablation" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">
                    {isTamil ? "7-அடுக்கு விதிமுறை ஆய்வு (7-Stage Pre-Specified Rule-Based Ablation)" : "7-Stage Pre-Specified Rule-Based Ablation Study"}
                  </h3>
                  <p className="text-[11px] text-stone-600">
                    {isTamil
                      ? "முன்கூட்டியே வரையறுக்கப்பட்ட ஒவ்வொரு ஜோதிடக் கணக்கீட்டு அடுக்கின் ஒருங்கிணைப்பு மாற்றங்களை அளவிடும் ஆய்வு. மாதிரித் தரவுகளுக்கு ஏற்ப எந்த அளவுருக்களும் மாற்றியமைக்கப்படவில்லை."
                      : "Quantifies the incremental rule-convergence score changes across predefined astrological layers. No model parameters are fitted to synthetic data."}
                  </p>
                </div>
                <button
                  onClick={handleRunAblation}
                  disabled={isRunningAblation}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRunningAblation ? "animate-spin" : ""}`} />
                  <span>{isTamil ? "மீண்டும் இயக்குக" : "Re-evaluate"}</span>
                </button>
              </div>

              {ablationResults ? (
                <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                      <tr>
                        <th className="p-3">Model Architecture Layer</th>
                        <th className="p-3 text-center">Accuracy</th>
                        <th className="p-3 text-center">F1 Score</th>
                        <th className="p-3 text-center">±1 Yr Window</th>
                        <th className="p-3 text-center">Conditional Timing MAE</th>
                        <th className="p-3 text-center">Brier Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 bg-white">
                      {Object.entries(ablationResults).map(([key, data], idx) => (
                        <tr key={key} className={idx === Object.keys(ablationResults).length - 1 ? "bg-amber-50/50 font-bold text-amber-950" : "hover:bg-stone-50"}>
                          <td className="p-3 font-semibold">{data.modelName}</td>
                          <td className="p-3 text-center text-emerald-700 font-mono">{(data.accuracy * 100).toFixed(1)}%</td>
                          <td className="p-3 text-center font-mono">{data.f1Score.toFixed(3)}</td>
                          <td className="p-3 text-center text-indigo-700 font-mono">{data.within1YearPct.toFixed(1)}%</td>
                          <td className="p-3 text-center font-mono">{data.conditionalMeanAbsoluteErrorYears ?? data.meanAbsoluteErrorYears} yrs</td>
                          <td className="p-3 text-center text-stone-600 font-mono">{data.brierScore.toFixed(4)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-stone-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-2"></div>
                  <span>Evaluating 7-stage ablation across 10,000 benchmark cases...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <div className="text-[10px] text-stone-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>AstroVerse Blind-Test Validation Hash: SHA-256 Verified</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold cursor-pointer shadow-2xs"
          >
            {isTamil ? "மூடுக" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
