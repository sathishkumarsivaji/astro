/**
 * ASTROVERSE — Process-Isolated Anti-Leakage Prediction Sandbox Worker
 *
 * Runs strictly isolated prediction computations.
 * Input constraint: Only serialized JSON containing birth parameters and pre-cutoff date is accepted.
 * Outcome state (actualEvents, groundTruth) is architecturally inaccessible in this process.
 */

import { calculateChartBySystem } from "../astrology/index.js";

/**
 * Executes a deterministic, sandboxed prediction calculation from serialized birth parameters.
 * @param {string|object} sandboxedInputJson Serialized JSON or plain input object
 * @returns {object} Prediction result containing ruleConvergenceScore and indicativeYear
 */
export function executeSandboxedPrediction(sandboxedInputJson) {
  const input = typeof sandboxedInputJson === "string" 
    ? JSON.parse(sandboxedInputJson) 
    : JSON.parse(JSON.stringify(sandboxedInputJson));

  const { caseId, birthDate, birthTime, latitude, longitude, utcOffset, timezoneId, cutoffDate } = input;

  if (!birthDate || !birthTime) {
    throw new Error("Invalid sandboxed input: missing birth date/time");
  }

  // Calculate chart within isolated context
  let chart = null;
  try {
    chart = calculateChartBySystem("lahiri", {
      birthDate,
      birthTime,
      latitude: Number(latitude) || 0,
      longitude: Number(longitude) || 0,
      utcOffset: Number(utcOffset) || 0,
      timezoneId: timezoneId || "UTC"
    }, { lang: "en" });
  } catch (_err) {
    chart = null;
  }

  const birthYear = parseInt(birthDate.split("-")[0], 10);
  let predictedMarriageAge = null;
  let ruleConvergenceScore = null;
  let eventWindowIdentified = false;
  let verdict = "INSUFFICIENT_RULE_CONVERGENCE";
  let interpretationScope = "Astrological rule-derived timing only. This is not an empirically validated probability or guarantee of an event.";
  let explanation = "No rule-derived timing window met the configured dasha criteria.";

  if (chart?.dashaTable && Array.isArray(chart.dashaTable)) {
    const match = chart.dashaTable.find(d => {
      const lord = (d.lord || "").toLowerCase();
      return (lord === "venus" || lord === "jupiter" || lord === "mercury" || lord === "rahu" || lord === "moon") && d.startAge >= 21 && d.startAge <= 36;
    });
    if (match && typeof match.startAge === "number") {
      predictedMarriageAge = Math.round(match.startAge + (match.endAge - match.startAge) / 2);
      ruleConvergenceScore = (match.lord === "Venus" || match.lord === "Jupiter") ? 0.84 : 0.72;
      eventWindowIdentified = true;
      verdict = "RULE_DERIVED_TIMING_WINDOW";
      explanation = `A timing window was derived from the configured dasha rule: ${match.lord} from age ${match.startAge} to ${match.endAge}.`;
    }
  }

  const indicativeYear = predictedMarriageAge != null ? birthYear + predictedMarriageAge : null;

  return {
    caseId,
    cutoffDate,
    verdict,
    eventWindowIdentified,
    indicativeYear,
    indicativeAge: predictedMarriageAge,
    ruleConvergenceScore,
    explanation,
    interpretationScope,
    isolationMode: "PROCESS_SERIALIZED_SANDBOX_V1",
    timestamp: new Date().toISOString()
  };
}

// Support execution as child process / CLI worker if called directly
if (typeof process !== "undefined" && process.argv && process.argv[1]?.endsWith("sandboxedPredictionWorker.mjs")) {
  let inputData = "";
  process.stdin.on("data", chunk => { inputData += chunk; });
  process.stdin.on("end", () => {
    try {
      const result = executeSandboxedPrediction(inputData);
      process.stdout.write(JSON.stringify(result));
    } catch (err) {
      process.stderr.write(JSON.stringify({ error: err.message }));
      process.exit(1);
    }
  });
}
