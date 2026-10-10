import React, { useState } from "react";
import { BookOpen, Plus, Calendar, Sparkles, CheckCircle2, Trash2, ArrowRight, Clock, Award, ShieldCheck, Lock, Check, X, AlertCircle } from "lucide-react";
import { correlateLifeEventWithAstrology } from "../../services/calendarEngine";
import { TRANSLATIONS } from "../../services/localization";

export default function AstrologyJournal({ chartData, lang = "en" }) {
  const isTamil = lang === "ta";
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const storageKey = `astro_journal_${chartData?.reportId || "default"}`;
  const prospectiveKey = `astro_prospective_${chartData?.reportId || "default"}`;

  const [activeTab, setActiveTab] = useState("retrospective"); // "retrospective" | "prospective"

  // 1. Retrospective Past Milestones State
  const [journalEntries, setJournalEntries] = useState(() => {
    try {
      const saved = typeof window !== "undefined" && window.sessionStorage ? sessionStorage.getItem(storageKey) : null;
      if (saved) return JSON.parse(saved);
      if (chartData?.isDemoMode) {
        return [
          {
            id: "evt_demo_1",
            title: isTamil ? "முதல் வேலை / தொழில் தொடக்கம்" : "First Major Career Role",
            date: "2015-06-15",
            notes: isTamil ? "புதிய நகரத்திற்கு இடமாற்றம் மற்றும் தொழில் வளர்ச்சி." : "Relocated to new city and started engineering career.",
            correlation: {
              operatingDasha: "Jupiter",
              activeBukthi: "Saturn",
              ageAtEvent: 25.14
            }
          }
        ];
      }
      return [];
    } catch (err) {
      console.warn("[JOURNAL] Failed to load journal entries from storage:", err);
      return [];
    }
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // 2. Prospective Prediction Ledger State (Immutable Timestamping)
  const [prospectiveEntries, setProspectiveEntries] = useState(() => {
    try {
      const saved = typeof window !== "undefined" && window.sessionStorage ? sessionStorage.getItem(prospectiveKey) : null;
      if (saved) return JSON.parse(saved);
      return [];
    } catch (err) {
      console.warn("[JOURNAL] Failed to load prospective entries:", err);
      return [];
    }
  });

  const [isAddingProspective, setIsAddingProspective] = useState(false);
  const [prospTitle, setProspTitle] = useState("");
  const [prospCategory, setProspCategory] = useState("CAREER");
  const [prospStart, setProspStart] = useState("");
  const [prospEnd, setProspEnd] = useState("");
  const [prospRationale, setProspRationale] = useState("");

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;

    const correlation = correlateLifeEventWithAstrology(newDate, newTitle, chartData);

    const newEntry = {
      id: `evt_${Date.now()}`,
      title: newTitle.trim(),
      date: newDate,
      notes: newNotes.trim(),
      correlation
    };

    const updated = [newEntry, ...journalEntries];
    setJournalEntries(updated);
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        sessionStorage.setItem(storageKey, JSON.stringify(updated));
      }
    } catch (err) {
      console.warn("[JOURNAL] Failed to persist journal entry:", err);
    }

    setNewTitle("");
    setNewDate("");
    setNewNotes("");
    setIsAdding(false);
  };

  const handleDeleteEvent = (id) => {
    const updated = journalEntries.filter(e => e.id !== id);
    setJournalEntries(updated);
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        sessionStorage.setItem(storageKey, JSON.stringify(updated));
      }
    } catch (err) {
      console.warn("[JOURNAL] Failed to persist deleted state:", err);
    }
  };

  const handleAddProspective = (e) => {
    e.preventDefault();
    if (!prospTitle.trim() || !prospStart || !prospEnd) return;

    const nowISO = new Date().toISOString();
    const newEntry = {
      id: `pred_${Date.now()}`,
      title: prospTitle.trim(),
      category: prospCategory,
      targetStart: prospStart,
      targetEnd: prospEnd,
      rationale: prospRationale.trim(),
      lockedTimestamp: nowISO,
      isLocked: true,
      outcome: "PENDING_MATURATION",
      resolvedDate: null
    };

    const updated = [newEntry, ...prospectiveEntries];
    setProspectiveEntries(updated);
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        sessionStorage.setItem(prospectiveKey, JSON.stringify(updated));
      }
    } catch (err) {
      console.warn("[JOURNAL] Failed to persist prospective entry:", err);
    }

    setProspTitle("");
    setProspStart("");
    setProspEnd("");
    setProspRationale("");
    setIsAddingProspective(false);
  };

  const handleResolveProspective = (id, outcome) => {
    const updated = prospectiveEntries.map(e => {
      if (e.id === id) {
        return {
          ...e,
          outcome,
          resolvedDate: new Date().toISOString()
        };
      }
      return e;
    });
    setProspectiveEntries(updated);
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        sessionStorage.setItem(prospectiveKey, JSON.stringify(updated));
      }
    } catch (err) {
      console.warn("[JOURNAL] Failed to persist outcome resolution:", err);
    }
  };

  const handleDeleteProspective = (id) => {
    const updated = prospectiveEntries.filter(e => e.id !== id);
    setProspectiveEntries(updated);
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        sessionStorage.setItem(prospectiveKey, JSON.stringify(updated));
      }
    } catch (err) {
      console.warn("[JOURNAL] Failed to delete prospective entry:", err);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-500/15 via-[#FFFDF9] to-amber-500/10 border border-purple-300/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5 text-purple-700" />
            <span>{isTamil ? "வாழ்க்கை நிகழ்வுகள் & எதிர்கால சரிபார்ப்பு" : "Astrology Life Journal & Prospective Validation"}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
            {activeTab === "retrospective" 
              ? (isTamil ? "கடந்த கால மைல்கற்கள் பதிவேடு" : "Retrospective Milestone & Dasha Correlation Tracker")
              : (isTamil ? "முன்னோக்கிய கணிப்பு பூட்டு & காலாவதி சரிபார்ப்பு" : "Prospective Prediction Lock & Maturation Ledger")}
          </h2>
          <p className="text-xs text-stone-600 max-w-lg">
            {activeTab === "retrospective"
              ? (isTamil
                  ? "கடந்த கால நிகழ்வுகளைப் பதிவு செய்து, அவை எந்த தசா-புக்தி காலத்தில் நிகழ்ந்தன என்பதை ஒப்பிட்டுப் பாருங்கள்."
                  : "Log past milestones and verify retrospective correlations against calculated Vimshottari timing.")
              : (isTamil
                  ? "நிகழ்வு நிகழும் முன்பே கணிப்புகளை பூட்டி, காலாவதிக்குப் பிறகு அதன் உண்மையான முடிவை பதிவு செய்து தன்னிச்சையாக சரிபாருங்கள் (பின்புல பக்கச்சார்பற்ற உண்மை சரிபார்ப்பு)."
                  : "Lock astrological predictions with immutable timestamps before event windows occur. Register verified outcomes only after windows mature to eliminate hindsight bias.")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "retrospective" ? (
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{isTamil ? "நிகழ்வு சேர்க்க" : "Add Life Event"}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAddingProspective(!isAddingProspective)}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all shrink-0"
            >
              <Lock className="w-4 h-4" />
              <span>{isTamil ? "முன்னோக்கிய கணிப்பை பூட்டு" : "Lock Prospective Prediction"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-stone-200 gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab("retrospective")}
          className={`pb-2.5 transition-all flex items-center gap-2 border-b-2 ${
            activeTab === "retrospective"
              ? "border-purple-600 text-purple-900"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{isTamil ? "1. கடந்த கால மைல்கற்கள்" : "1. Past Milestones (Retrospective)"} ({journalEntries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("prospective")}
          className={`pb-2.5 transition-all flex items-center gap-2 border-b-2 ${
            activeTab === "prospective"
              ? "border-indigo-600 text-indigo-900"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{isTamil ? "2. முன்னோக்கிய சரிபார்ப்புப் பதிவேடு" : "2. Prospective Validation Ledger"} ({prospectiveEntries.length})</span>
        </button>
      </div>

      {/* VIEW 1: RETROSPECTIVE PAST MILESTONES */}
      {activeTab === "retrospective" && (
        <div className="space-y-4">
          {/* Add Event Form Modal / Inline Box */}
          {isAdding && (
            <form onSubmit={handleAddEvent} className="p-6 rounded-3xl bg-white border-2 border-purple-300 shadow-md space-y-4 animate-fadeIn">
              <h3 className="font-serif font-bold text-base text-stone-900">
                {isTamil ? "புதிய வாழ்க்கை நிகழ்வை சேர்க்கவும்" : "Log New Life Milestone"}
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    {isTamil ? "நிகழ்வின் பெயர் (எ.கா: திருமணம், புதிய வேலை)" : "Event Title (e.g. Marriage, Career Promotion)"}
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Relocated to Europe"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-purple-400 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    {isTamil ? "நிகழ்ந்த தேதி" : "Date of Event"}
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-purple-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  {isTamil ? "குறிப்புகள் (விருப்பத்தேர்வு)" : "Personal Notes (Optional)"}
                </label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Context about this milestone..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-purple-400 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold"
                >
                  {isTamil ? "ரத்து" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs"
                >
                  {isTamil ? "சேமி & ஒப்பிடு" : "Save & Correlate"}
                </button>
              </div>
            </form>
          )}

          {/* Journal Entries List */}
          <div className="space-y-3">
            {journalEntries.length === 0 ? (
              <div className="p-8 rounded-3xl bg-white border border-stone-200 text-center text-xs text-stone-500">
                {isTamil ? "இன்னும் நிகழ்வுகள் எதுவும் பதிவு செய்யப்படவில்லை." : "No life milestones logged yet. Click 'Add Life Event' above."}
              </div>
            ) : (
              journalEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-5 rounded-2xl bg-white border border-purple-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-purple-300 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-sm text-stone-900">{entry.title}</span>
                      <span className="text-[11px] text-stone-500 font-mono">({entry.date})</span>
                    </div>
                    {entry.notes && (
                      <p className="text-xs text-stone-600">{entry.notes}</p>
                    )}
                    {entry.correlation && (
                      <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 font-bold">
                          {isTamil ? `தசா: ${entry.correlation.operatingDasha}` : `Dasha: ${entry.correlation.operatingDasha}`}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                          {isTamil ? `அந்தர தசை: ${entry.correlation.activeBukthi}` : `Antardasha: ${entry.correlation.activeBukthi}`}
                        </span>
                        <span className="text-stone-500">
                          {isTamil ? `வயது: ${entry.correlation.ageAtEvent}` : `Age: ${entry.correlation.ageAtEvent}`}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteEvent(entry.id)}
                    className="text-stone-400 hover:text-rose-600 p-2 text-xs font-bold transition-colors"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: PROSPECTIVE PREDICTION LEDGER */}
      {activeTab === "prospective" && (
        <div className="space-y-4">
          {/* Methodology Banner */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 flex items-start gap-3">
            <Lock className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
            <div className="space-y-1 leading-relaxed">
              <span className="font-bold block">
                {isTamil ? "பின்புல பக்கச்சார்பற்ற முன்னோக்கிய சரிபார்ப்பு நெறிமுறை" : "Hindsight-Free Prospective Validation Protocol"}
              </span>
              <p className="text-[11px] text-indigo-900">
                {isTamil 
                  ? "ஜோதிட கணிப்புகள் நிகழ்வு நடப்பதற்கு முன்னரே கால எல்லை மற்றும் மாற்றமுடியாத நேர முத்திரையுடன் (immutable timestamp) பூட்டப்படுகின்றன. கணிப்பு காலம் முடிவடைந்த பின்னரே அதன் முடிவு பதிவு செய்யப்படும். இது பின்தங்கிய தேர்தல் பிழைகளை (cherry-picking) முற்றிலுமாகத் தவிர்க்கிறது."
                  : "Predictions are permanently time-stamped and locked prior to the target event window. Outcome evaluation unlocks only after the target date arrives, preventing retrospective cherry-picking or confirmation bias."}
              </p>
            </div>
          </div>

          {/* Form to Lock New Prediction */}
          {isAddingProspective && (
            <form onSubmit={handleAddProspective} className="p-6 rounded-3xl bg-white border-2 border-indigo-300 shadow-md space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-600" />
                <h3 className="font-serif font-bold text-base text-stone-900">
                  {isTamil ? "முன்னோக்கிய கணிப்பை முத்திரையிட்டு பூட்டுக" : "Lock New Prospective Prediction"}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    {isTamil ? "கணிப்பு தலைப்பு (எ.கா: பதவி உயர்வு / வெளிநாட்டு பயணம்)" : "Prediction Title (e.g. Promotion / Relocation)"}
                  </label>
                  <input
                    type="text"
                    value={prospTitle}
                    onChange={(e) => setProspTitle(e.target.value)}
                    placeholder="e.g. Promotion to Director level"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-indigo-400 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    {isTamil ? "பிரிவு" : "Category"}
                  </label>
                  <select
                    value={prospCategory}
                    onChange={(e) => setProspCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-indigo-400 outline-none"
                  >
                    <option value="CAREER">Career & Profession</option>
                    <option value="MARRIAGE">Relationships & Marriage</option>
                    <option value="FINANCE">Finance & Wealth</option>
                    <option value="EDUCATION">Education & Exams</option>
                    <option value="RELOCATION">Relocation & Travel</option>
                    <option value="WELLNESS">Vitality & Health-Safe</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    {isTamil ? "கணிப்பு கால துவக்கம் (Start Date)" : "Target Window Start"}
                  </label>
                  <input
                    type="date"
                    value={prospStart}
                    onChange={(e) => setProspStart(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-indigo-400 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    {isTamil ? "கணிப்பு கால முடிவு (End / Maturation Date)" : "Target Window End (Maturation Date)"}
                  </label>
                  <input
                    type="date"
                    value={prospEnd}
                    onChange={(e) => setProspEnd(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-indigo-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  {isTamil ? "ஜோதிட தசா/கோச்சார காரணம் & விரிவான குறிப்பு" : "Astrological Timing Rationale (Dasha/Bukthi/Transit)"}
                </label>
                <textarea
                  value={prospRationale}
                  onChange={(e) => setProspRationale(e.target.value)}
                  placeholder="e.g. Saturn transit over 10th house while Jupiter Bukthi is active in 9th..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-indigo-400 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingProspective(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold"
                >
                  {isTamil ? "ரத்து" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isTamil ? "பூட்டி நேரமுத்திரையிடு" : "Lock & Timestamp"}</span>
                </button>
              </div>
            </form>
          )}

          {/* Prospective Entries List */}
          <div className="space-y-3">
            {prospectiveEntries.length === 0 ? (
              <div className="p-8 rounded-3xl bg-white border border-stone-200 text-center text-xs text-stone-500">
                {isTamil ? "இன்னும் முன்னோக்கிய கணிப்புகள் எதுவும் பதிவு செய்யப்படவில்லை. 'முன்னோக்கிய கணிப்பை பூட்டு' என்பதை கிளிக் செய்யவும்." : "No prospective predictions locked yet. Click 'Lock Prospective Prediction' above."}
              </div>
            ) : (
              prospectiveEntries.map((pred) => {
                const isMature = todayStr >= pred.targetEnd;
                return (
                  <div
                    key={pred.id}
                    className="p-5 rounded-2xl bg-white border border-indigo-200 shadow-xs space-y-3 hover:border-indigo-300 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-sm text-stone-900">{pred.title}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-900">
                            {pred.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-500 font-mono">
                          Window: {pred.targetStart} → {pred.targetEnd}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {pred.outcome === "PENDING_MATURATION" ? (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{isTamil ? "காலாவதி நிலுவையில்" : "Pending Maturation"}</span>
                          </span>
                        ) : pred.outcome === "CONFIRMED_OCCURRED" ? (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>{isTamil ? "நிகழ்ந்தது உறுதி" : "Confirmed Occurred"}</span>
                          </span>
                        ) : pred.outcome === "CONFIRMED_NOT_OCCURRED" ? (
                          <span className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-[10px] font-bold flex items-center gap-1">
                            <X className="w-3 h-3 text-rose-600" />
                            <span>{isTamil ? "நிகழவில்லை உறுதி" : "Confirmed Not Occurred"}</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-300 text-stone-700 text-[10px] font-bold">
                            {pred.outcome}
                          </span>
                        )}

                        <button
                          onClick={() => handleDeleteProspective(pred.id)}
                          className="text-stone-400 hover:text-rose-600 p-1.5 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {pred.rationale && (
                      <p className="text-xs text-stone-600 italic bg-stone-50 p-2 rounded-lg border border-stone-200">
                        "{pred.rationale}"
                      </p>
                    )}

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-stone-100 text-[10px] text-stone-500">
                      <div>
                        🔒 {isTamil ? `பூட்டப்பட்ட நேரம்: ${new Date(pred.lockedTimestamp).toLocaleString()}` : `Immutable Lock: ${new Date(pred.lockedTimestamp).toLocaleString()}`}
                      </div>

                      {/* Outcome Registration Actions */}
                      <div className="flex items-center gap-1.5">
                        {!isMature ? (
                          <span className="text-amber-700 font-medium">
                            ⏳ {isTamil ? `${pred.targetEnd} அன்று சரிபார்ப்பு திறக்கப்படும்` : `Outcome unlocks on maturation: ${pred.targetEnd}`}
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-stone-700">{isTamil ? "முடிவு பதிவு:" : "Register Outcome:"}</span>
                            <button
                              onClick={() => handleResolveProspective(pred.id, "CONFIRMED_OCCURRED")}
                              className={`px-2 py-0.5 rounded border text-[10px] font-bold ${pred.outcome === "CONFIRMED_OCCURRED" ? "bg-emerald-600 text-white border-emerald-600" : "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"}`}
                            >
                              Occurred
                            </button>
                            <button
                              onClick={() => handleResolveProspective(pred.id, "CONFIRMED_NOT_OCCURRED")}
                              className={`px-2 py-0.5 rounded border text-[10px] font-bold ${pred.outcome === "CONFIRMED_NOT_OCCURRED" ? "bg-rose-600 text-white border-rose-600" : "bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100"}`}
                            >
                              Did Not
                            </button>
                            <button
                              onClick={() => handleResolveProspective(pred.id, "PARTIAL_OCCURRENCE")}
                              className={`px-2 py-0.5 rounded border text-[10px] font-bold ${pred.outcome === "PARTIAL_OCCURRENCE" ? "bg-amber-600 text-white border-amber-600" : "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"}`}
                            >
                              Partial
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
