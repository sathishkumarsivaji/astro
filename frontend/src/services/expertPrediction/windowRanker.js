import { CONFIDENCE_TYPE } from './expertPredictionSchema.js';
import { isResolutionAtLeast } from './resolutionClassifier.js';

/**
 * Ranks, deduplicates, and classifies timing windows.
 * @param {Array} windows - Array of timing window objects.
 * @param {string} domain - The domain ID.
 * @returns {Object} Separated primary and caution windows, and best resolution.
 */
export function rankAndClassifyWindows(windows, domain) {
  // 1. Sort by strength descending
  const sortedWindows = [...windows].sort((a, b) => (b.strength || 0) - (a.strength || 0));
  
  // 2. Deduplicate overlapping windows (merge only if same domain & subPhase and continuous temporal overlap)
  const mergedWindows = [];
  const MERGE_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000;
  
  const deduplicateItems = (arr) => {
    if (!Array.isArray(arr)) return [];
    const seen = new Set();
    return arr.filter(item => {
      const key = typeof item === 'object' && item !== null
        ? (item.nodeId || item.factorId || item.id || item.description || item.planet || JSON.stringify(item))
        : String(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  sortedWindows.forEach(win => {
    if (!win.startDate || !win.endDate) {
      mergedWindows.push({ ...win });
      return;
    }

    const winStart = new Date(win.startDate).getTime();
    const winEnd = new Date(win.endDate).getTime();
    if (isNaN(winStart) || isNaN(winEnd)) {
      mergedWindows.push({ ...win });
      return;
    }
    
    const overlapIndex = mergedWindows.findIndex(mw => {
      // Must match domain
      if (mw.domain && win.domain && mw.domain !== win.domain) return false;
      // Must match subPhase
      if ((mw.subPhase || null) !== (win.subPhase || null)) return false;
      if (!mw.startDate || !mw.endDate) return false;
      const mwStart = new Date(mw.startDate).getTime();
      const mwEnd = new Date(mw.endDate).getTime();
      if (isNaN(mwStart) || isNaN(mwEnd)) return false;
      return (winStart <= mwEnd + MERGE_THRESHOLD_MS) && (winEnd >= mwStart - MERGE_THRESHOLD_MS);
    });
    
    if (overlapIndex !== -1) {
      // Merge while rigorously preserving evidence, facts, and rules
      const mw = mergedWindows[overlapIndex];
      const curStart = new Date(mw.startDate).getTime();
      const curEnd = new Date(mw.endDate).getTime();
      mw.startDate = new Date(Math.min(winStart, curStart)).toISOString().slice(0, 10);
      mw.endDate = new Date(Math.max(winEnd, curEnd)).toISOString().slice(0, 10);
      mw.strength = Math.max(mw.strength || 0, win.strength || 0);
      mw.traditionalRuleConvergence = mw.strength;
      mw.traditionalEvidenceStrength = mw.strength;
      if (mw.epistemicStatus) {
        mw.epistemicStatus.traditionalRuleConvergence = mw.strength;
        mw.epistemicStatus.traditionalEvidenceStrength = mw.strength;
      }
      if (win.astronomicalResolution && (!mw.astronomicalResolution || isResolutionAtLeast(win.astronomicalResolution, mw.astronomicalResolution))) {
        mw.astronomicalResolution = win.astronomicalResolution;
      }
      if (win.traditionalTimingResolution && (!mw.traditionalTimingResolution || isResolutionAtLeast(win.traditionalTimingResolution, mw.traditionalTimingResolution))) {
        mw.traditionalTimingResolution = win.traditionalTimingResolution;
      }
      if (win.empiricalPredictiveResolution && !mw.empiricalPredictiveResolution) {
        mw.empiricalPredictiveResolution = win.empiricalPredictiveResolution;
      }

      // Preserve rule IDs & evidence IDs
      mw.supportingRuleIds = Array.from(new Set([...(mw.supportingRuleIds || []), ...(win.supportingRuleIds || [])]));
      mw.evidenceIds = Array.from(new Set([...(mw.evidenceIds || []), ...(win.evidenceIds || [])]));

      // Preserve transit and varga facts
      mw.transitFacts = deduplicateItems([...(mw.transitFacts || []), ...(win.transitFacts || [])]);
      mw.vargaFacts = deduplicateItems([...(mw.vargaFacts || []), ...(win.vargaFacts || [])]);
      mw.natalFacts = deduplicateItems([...(mw.natalFacts || []), ...(win.natalFacts || [])]);

      // Preserve contradictions & explanations
      mw.contradictions = deduplicateItems([...(mw.contradictions || []), ...(win.contradictions || [])]);
      mw.whySupported = deduplicateItems([...(mw.whySupported || []), ...(win.whySupported || [])]);
      mw.whyNotStronger = deduplicateItems([...(mw.whyNotStronger || []), ...(win.whyNotStronger || [])]);
      mw.whatPreventsGreaterPrecision = deduplicateItems([...(mw.whatPreventsGreaterPrecision || []), ...(win.whatPreventsGreaterPrecision || [])]);
      mw.independenceGroups = deduplicateItems([...(mw.independenceGroups || []), ...(win.independenceGroups || [])]);

      // Preserve dasha facts (prefer finer PD if available)
      if (win.dashaFacts?.pd && (!mw.dashaFacts || !mw.dashaFacts.pd)) {
        mw.dashaFacts = { ...(mw.dashaFacts || {}), pd: win.dashaFacts.pd };
      }

      // Preserve peak window
      if (!mw.peakWindow && win.peakWindow) {
        mw.peakWindow = win.peakWindow;
      }

      // Preserve finest resolution
      if (win.resolution && (!mw.resolution || isResolutionAtLeast(win.resolution, mw.resolution))) {
        mw.resolution = win.resolution;
      }
    } else {
      mergedWindows.push({ ...win });
    }
  });

  // 3. Assign CONFIDENCE_TYPE and separate
  const primaryWindows = [];
  const cautionWindows = [];
  let bestResolution = null;

  mergedWindows.forEach(win => {
    if (!win.confidenceType || win.confidenceType === CONFIDENCE_TYPE.INSUFFICIENT_DATA) {
      if (win.strength >= 0.8) {
        win.confidenceType = CONFIDENCE_TYPE.PEAK_CONVERGENCE;
      } else if (win.strength >= 0.6) {
        win.confidenceType = CONFIDENCE_TYPE.STRONG_CONVERGENCE;
      } else if (win.strength >= 0.4) {
        win.confidenceType = CONFIDENCE_TYPE.PRIMARY_ACTIVATION;
      } else {
        win.confidenceType = CONFIDENCE_TYPE.CANDIDATE_WINDOW;
      }
    }

    // Determine finest resolution overall
    if (win.resolution && (!bestResolution || isResolutionAtLeast(win.resolution, bestResolution))) {
      bestResolution = win.resolution;
    }

    const cautionCount = Array.isArray(win.contradictions)
      ? win.contradictions.filter(c => c.type === 'CAUTION' || c.severity === 'HIGH').length
      : (win.contradictions?.cautionFactors?.length || 0);

    if (win.confidenceType === CONFIDENCE_TYPE.GUARDED_PERIOD || cautionCount > 2) {
      cautionWindows.push(win);
    } else {
      primaryWindows.push(win);
    }
  });

  return {
    primaryWindows,
    cautionWindows,
    bestResolution
  };
}
