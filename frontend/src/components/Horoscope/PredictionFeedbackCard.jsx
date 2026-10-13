import React, { useState } from 'react';

/**
 * SKR ASTRO — Structured Prediction Feedback & Outcome Recording Card
 *
 * Implements the 4-part feedback protocol:
 * Question 1: Birth data confirmation (data integrity)
 * Question 2: Interpretation relevance (perceived fit — NOT treated as outcome label)
 * Question 3: Present circumstance (current state context)
 * Question 4: Subsequent observed outcome (verified event tracking with right-censoring support)
 */
export default function PredictionFeedbackCard({
  predictionRecord,
  onSubmitFeedback,
  onReportOutcome,
  lang = 'en'
}) {
  const isTa = lang === 'ta';

  // State for immediate feedback (Questions 1-3)
  const [birthConfirmed, setBirthConfirmed] = useState(null);
  const [relevance, setRelevance] = useState(null);
  const [circumstance, setCircumstance] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // State for subsequent outcome reporting (Question 4)
  const [showOutcomeReporting, setShowOutcomeReporting] = useState(false);
  const [eventOccurred, setEventOccurred] = useState(null);
  const [reportedDate, setReportedDate] = useState('');
  const [isCensored, setIsCensored] = useState(false);
  const [outcomeSubmitted, setOutcomeSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  if (!predictionRecord || !predictionRecord.predictionId) {
    return null;
  }

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const payload = {
        predictionId: predictionRecord.predictionId,
        feedbackCategory: 'INTERPRETATION_RELEVANCE',
        relevanceScore: relevance,
        metadata: {
          birthDataConfirmed: birthConfirmed,
          currentCircumstance: circumstance,
          submittedAt: new Date().toISOString()
        }
      };
      if (onSubmitFeedback) {
        await onSubmitFeedback(payload);
      }
      setFeedbackSubmitted(true);
      setStatusMessage(isTa ? 'உங்கள் கருத்து வெற்றிகரமாக பதிவு செய்யப்பட்டது.' : 'Feedback recorded successfully.');
    } catch (err) {
      setStatusMessage(err?.message || (isTa ? 'கருத்து பதிவு செய்வதில் பிழை.' : 'Failed to submit feedback.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOutcomeSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const payload = {
        predictionId: predictionRecord.predictionId,
        eventOccurred: Boolean(eventOccurred),
        reportedDate: eventOccurred ? (reportedDate || null) : null,
        datePrecision: reportedDate ? 'MONTH_YEAR' : 'APPROX_YEAR',
        isCensored: Boolean(isCensored),
        observationEndedAt: new Date().toISOString()
      };
      if (onReportOutcome) {
        await onReportOutcome(payload);
      }
      setOutcomeSubmitted(true);
      setStatusMessage(isTa ? 'நிகழ்வு முடிவு வெற்றிகரமாக பதிவு செய்யப்பட்டது.' : 'Observed outcome recorded.');
    } catch (err) {
      setStatusMessage(err?.message || (isTa ? 'முடிவு பதிவு செய்வதில் பிழை.' : 'Failed to report outcome.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 my-4 text-slate-200 text-sm shadow-lg">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h4 className="font-semibold text-base text-amber-400">
            {isTa ? 'ஜாதக கணிப்பு பின்னூட்டம் & சரிபார்ப்பு' : 'Prediction Feedback & Outcome Ledger'}
          </h4>
          <span className="text-xs text-slate-400 font-mono">
            ID: {predictionRecord.predictionId} • {isTa ? 'நிலை' : 'Status'}: {predictionRecord.calibrationStatus || 'UNCALIBRATED'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowOutcomeReporting(!showOutcomeReporting)}
          className="text-xs px-3 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded border border-indigo-500/30 transition-colors"
        >
          {showOutcomeReporting 
            ? (isTa ? 'பின்னூட்டம் காட்டு' : 'Show Feedback Form')
            : (isTa ? 'நிகழ்ந்த முடிவை பதிவு செய்' : 'Report Event Outcome')}
        </button>
      </div>

      {statusMessage && (
        <div className="mt-3 p-2 bg-slate-800/80 border border-slate-600 rounded text-xs text-emerald-300">
          {statusMessage}
        </div>
      )}

      {!showOutcomeReporting ? (
        // Part 1: Initial Structured Feedback
        <form onSubmit={handleFeedbackSubmit} className="mt-4 space-y-4">
          {/* Question 1 */}
          <div>
            <label className="block font-medium text-slate-300 mb-1.5">
              {isTa ? '1. உங்கள் பிறந்த தேதி, நேரம் மற்றும் இடம் சரியானதா?' : '1. Is your birth information confirmed accurate?'}
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { val: 'CONFIRMED', labelEn: 'Yes, Confirmed', labelTa: 'ஆம், உறுதி செய்யப்பட்டது' },
                { val: 'NEEDS_CORRECTION', labelEn: 'Needs Correction', labelTa: 'திருத்தம் தேவை' },
                { val: 'UNSURE', labelEn: 'Not Sure', labelTa: 'தெரியவில்லை' }
              ].map(opt => (
                <button
                  type="button"
                  key={opt.val}
                  onClick={() => setBirthConfirmed(opt.val)}
                  className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                    birthConfirmed === opt.val
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                  }`}
                >
                  {isTa ? opt.labelTa : opt.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Question 2 */}
          <div>
            <label className="block font-medium text-slate-300 mb-1.5">
              {isTa ? '2. இந்த விளக்கம் உங்கள் தற்போதைய சூழ்நிலைக்கு பொருந்துகிறதா?' : '2. Does this interpretation match your current situation?'}
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { score: 5, labelEn: 'Highly Relevant', labelTa: 'மிகவும் பொருந்துகிறது' },
                { score: 3, labelEn: 'Partially Relevant', labelTa: 'பகுதி பொருந்துகிறது' },
                { score: 1, labelEn: 'Not Relevant', labelTa: 'பொருந்தவில்லை' },
                { score: 0, labelEn: 'Cannot Assess', labelTa: 'மதிப்பிட இயலவில்லை' }
              ].map(opt => (
                <button
                  type="button"
                  key={opt.score}
                  onClick={() => setRelevance(opt.score)}
                  className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                    relevance === opt.score
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                  }`}
                >
                  {isTa ? opt.labelTa : opt.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Question 3 */}
          <div>
            <label className="block font-medium text-slate-300 mb-1.5">
              {isTa ? '3. உங்கள் தற்போதைய நிலை (விருப்பத்தின் பேரில்):' : '3. What is your current situation concerning this topic? (Optional)'}
            </label>
            <input
              type="text"
              value={circumstance}
              onChange={(e) => setCircumstance(e.target.value)}
              placeholder={isTa ? 'எ.கா: சொத்து வாங்க திட்டமிட்டுள்ளேன் / வேலை மாற்றம் தேடுகிறேன்' : 'e.g. Actively searching, planning next year, already achieved'}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              maxLength={200}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || feedbackSubmitted || birthConfirmed === null}
            className="w-full py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-semibold rounded-lg text-xs transition-colors"
          >
            {feedbackSubmitted
              ? (isTa ? '✓ பின்னூட்டம் சமர்ப்பிக்கப்பட்டது' : '✓ Feedback Submitted')
              : (isTa ? 'பின்னூட்டத்தை சேமிக்கவும்' : 'Submit Feedback')}
          </button>
        </form>
      ) : (
        // Part 2: Subsequent Observed Outcome Reporting
        <form onSubmit={handleOutcomeSubmit} className="mt-4 space-y-4">
          <div className="p-3 bg-indigo-950/40 border border-indigo-800/50 rounded-lg text-xs text-indigo-200">
            {isTa
              ? 'குறிப்பு: குறிப்பிட்ட காலக்கட்டத்தில் உண்மையாக என்ன நிகழ்ந்தது என்பதை இங்கே பதிவு செய்யவும். இந்த தரவு மாதிரி சரிபார்ப்புக்கு மட்டுமே பயன்படும்.'
              : 'Notice: Record whether the anticipated event actually transpired during the specified horizon. Used strictly for empirical holdout validation.'}
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1.5">
              {isTa ? '4. குறிப்பிட்ட காலப்பகுதியில் நிகழ்வு நடந்ததா?' : '4. What happened subsequently during the prediction period?'}
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => { setEventOccurred(true); setIsCensored(false); }}
                className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                  eventOccurred === true && !isCensored
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {isTa ? 'ஆம், நிகழ்வு நடந்தது' : 'Event Occurred'}
              </button>
              <button
                type="button"
                onClick={() => { setEventOccurred(false); setIsCensored(false); }}
                className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                  eventOccurred === false && !isCensored
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {isTa ? 'இல்லை, நடக்கவில்லை' : 'Did Not Occur'}
              </button>
              <button
                type="button"
                onClick={() => { setEventOccurred(false); setIsCensored(true); }}
                className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                  isCensored
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {isTa ? 'காலம் இன்னும் முடியவில்லை (தொடர்கிறது)' : 'Horizon Ongoing (Censored)'}
              </button>
            </div>
          </div>

          {eventOccurred && (
            <div>
              <label className="block font-medium text-slate-300 mb-1.5">
                {isTa ? 'நிகழ்ந்த தோராயமான மாதம் / ஆண்டு:' : 'Approximate Month & Year of Event:'}
              </label>
              <input
                type="month"
                value={reportedDate}
                onChange={(e) => setReportedDate(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || outcomeSubmitted || eventOccurred === null}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-colors"
          >
            {outcomeSubmitted
              ? (isTa ? '✓ முடிவு பதிவு செய்யப்பட்டது' : '✓ Outcome Recorded')
              : (isTa ? 'முடிவை சமர்ப்பிக்கவும்' : 'Submit Observed Outcome')}
          </button>
        </form>
      )}
    </div>
  );
}
