import React, { useState } from "react";
import { BookOpen, Plus, Calendar, Sparkles, CheckCircle2, Trash2, ArrowRight, Clock, Award, ShieldCheck } from "lucide-react";
import { correlateLifeEventWithAstrology } from "../../services/calendarEngine";
import { TRANSLATIONS } from "../../services/localization";

export default function AstrologyJournal({ chartData, lang = "en" }) {
  const isTamil = lang === "ta";
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const storageKey = `astro_journal_${chartData?.reportId || "default"}`;

  const [journalEntries, setJournalEntries] = useState(() => {
    try {
      const saved = typeof window !== "undefined" && window.localStorage ? localStorage.getItem(storageKey) : null;
      return saved ? JSON.parse(saved) : [
        {
          id: "evt_1",
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
    } catch {
      return [];
    }
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newNotes, setNewNotes] = useState("");

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
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      }
    } catch (err) {}

    setNewTitle("");
    setNewDate("");
    setNewNotes("");
    setIsAdding(false);
  };

  const handleDeleteEvent = (id) => {
    const updated = journalEntries.filter(e => e.id !== id);
    setJournalEntries(updated);
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      }
    } catch (err) {}
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-500/15 via-[#FFFDF9] to-amber-500/10 border border-purple-300/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5 text-purple-700" />
            <span>{isTamil ? "வாழ்க்கை நிகழ்வுகள் & தசா தொடர்பு" : "Astrology Life Journal"}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
            {isTamil ? "உங்கள் கடந்த கால மைல்கற்கள் பதிவேடு" : "Personal Milestone & Dasha Correlation Tracker"}
          </h2>
          <p className="text-xs text-stone-600 max-w-lg">
            {isTamil
              ? "உங்கள் வாழ்க்கையில் நிகழ்ந்த முக்கிய நிகழ்வுகளைப் பதிவு செய்து, அவை எந்த தசா-புக்தி காலத்தில் நிகழ்ந்தன என்பதை ஒப்பிட்டுப் பாருங்கள்."
              : "Log your significant life milestones and verify retrospective correlations against your calculated Vimshottari timing."}
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isTamil ? "நிகழ்வு சேர்க்க" : "Add Life Event"}</span>
        </button>
      </div>

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
  );
}
