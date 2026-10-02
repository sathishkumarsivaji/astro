/**
 * ASTROVERSE — Dasha Timing Calculator for Birth-Time Rectification
 *
 * Evaluates authentic 3-tier Vimshottari Dasha timing (Mahadasha, Antardasha,
 * and Pratyantardasha) active at the exact historical event date.
 *
 * Strictly separates static natal house structure from dynamic event timing.
 * Leverages candidate's authentic birth-time dependent Dasha balance.
 */

import { calculatePratyantardasha } from "../../astroEngine.js";

/**
 * Calculates MD, AD, and PD active at an event date for a candidate chart
 */
export function calculateEventDashaHierarchy(eventDate, candidateChart, targetLords = new Set(), secondaryLords = new Set()) {
  if (!eventDate || !candidateChart) {
    return {
      activeMD: null,
      activeAD: null,
      activePD: null,
      mdConnected: false,
      adConnected: false,
      pdConnected: false,
      timingScore: 0,
      timingEvidence: [],
      ruleIds: []
    };
  }

  let parsedDate = null;
  if (eventDate instanceof Date && !isNaN(eventDate.getTime())) {
    parsedDate = eventDate;
  } else if (typeof eventDate === "string") {
    parsedDate = new Date(eventDate);
  }

  if (!parsedDate || isNaN(parsedDate.getTime())) {
    return {
      activeMD: null,
      activeAD: null,
      activePD: null,
      mdConnected: false,
      adConnected: false,
      pdConnected: false,
      timingScore: 0,
      timingEvidence: [],
      ruleIds: []
    };
  }

  const dashaTable = Array.isArray(candidateChart.dashaTable) ? candidateChart.dashaTable : [];
  let activeMD = null;
  let activeAD = null;
  let activeADObject = null;

  for (const dasha of dashaTable) {
    const dStart = dasha.startDateIso ? new Date(dasha.startDateIso) : null;
    const dEnd = dasha.endDateIso ? new Date(dasha.endDateIso) : null;

    if (dStart && dEnd && parsedDate >= dStart && parsedDate < dEnd) {
      activeMD = dasha.lord;
      if (Array.isArray(dasha.bukthis)) {
        for (const bukthi of dasha.bukthis) {
          const bStart = bukthi.startDateIso ? new Date(bukthi.startDateIso) : null;
          const bEnd = bukthi.endDateIso ? new Date(bukthi.endDateIso) : null;
          if (bStart && bEnd && parsedDate >= bStart && parsedDate < bEnd) {
            activeAD = bukthi.subLord || bukthi.lord;
            activeADObject = bukthi;
            break;
          }
        }
      }
      break;
    }
  }

  // Calculate Pratyantardasha (PD)
  let activePD = null;
  if (activeMD && activeAD && activeADObject) {
    const bStart = activeADObject.startDateIso ? new Date(activeADObject.startDateIso) : null;
    const bEnd = activeADObject.endDateIso ? new Date(activeADObject.endDateIso) : null;
    if (bStart && bEnd) {
      const daysSinceBukthiStart = (parsedDate.getTime() - bStart.getTime()) / (1000 * 60 * 60 * 24);
      const bukthiTotalDays = (bEnd.getTime() - bStart.getTime()) / (1000 * 60 * 60 * 24);

      try {
        const pdList = calculatePratyantardasha(activeAD, bukthiTotalDays);
        if (Array.isArray(pdList)) {
          let runningDays = 0;
          for (const pd of pdList) {
            if (daysSinceBukthiStart >= runningDays && daysSinceBukthiStart < runningDays + pd.durationDays) {
              activePD = pd.lord;
              break;
            }
            runningDays += pd.durationDays;
          }
        }
      } catch (_e) {
        activePD = null;
      }
    }
  }

  const timingEvidence = [];
  const ruleIds = [];
  let timingScore = 0;

  const targetSet = targetLords instanceof Set ? targetLords : new Set(targetLords);
  const secondarySet = secondaryLords instanceof Set ? secondaryLords : new Set(secondaryLords);

  const mdConnected = activeMD ? (targetSet.has(activeMD) || secondarySet.has(activeMD)) : false;
  const adConnected = activeAD ? (targetSet.has(activeAD) || secondarySet.has(activeAD)) : false;
  const pdConnected = activePD ? (targetSet.has(activePD) || secondarySet.has(activePD)) : false;

  if (activeMD) {
    if (mdConnected) {
      timingEvidence.push({ factor: `Mahadasha Lord ${activeMD} directly connected to event domain`, role: "MD Lord Synergy" });
      ruleIds.push("DASHA_MD_ACTIVATION");
      timingScore += targetSet.has(activeMD) ? 15 : 10;
    }
    if (activeAD) {
      if (adConnected) {
        timingEvidence.push({ factor: `Antardasha Lord ${activeAD} acts as specific timing trigger`, role: "AD Lord Synergy" });
        ruleIds.push("DASHA_AD_ACTIVATION");
        timingScore += targetSet.has(activeAD) ? 15 : 10;
      }
    }
    if (activePD && pdConnected) {
      timingEvidence.push({ factor: `Pratyantardasha Lord ${activePD} qualifies fine-grained sub-window`, role: "PD Lord Convergence" });
      ruleIds.push("DASHA_PD_ACTIVATION");
      timingScore += 8;
    }
  }

  return {
    activeMD,
    activeAD,
    activePD,
    mdConnected,
    adConnected,
    pdConnected,
    timingScore: Math.min(35, timingScore),
    timingEvidence,
    ruleIds
  };
}
