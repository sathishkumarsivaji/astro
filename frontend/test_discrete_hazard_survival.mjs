/**
 * Test: Discrete-Time Hazard Survival & Time-To-Event Engine
 *
 * Verifies:
 * 1. 16 discrete 2-year bins across [18, 50].
 * 2. Demographic baseline hazard derived from TRAIN partition.
 * 3. Astrological interval feature extraction across bins.
 * 4. Survival probability, cumulative incidence, expected timing age.
 * 5. Right-censored log-likelihood and Likelihood Ratio Test vs Age-Only null model.
 * 6. Feature-level survival hazard ratios and 95% CIs.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SURVIVAL_AGE_BINS,
  TRAIN_DEMOGRAPHIC_BASELINE_HAZARD,
  FROZEN_TRAIN_BETA_ASTRO,
  extractIntervalAstrologicalFeatures,
  predictDiscreteHazardSurvival,
  evaluateCohortDiscreteHazardSurvival,
  runRealDataFeatureLevelSurvivalAnalysis,
  fitDiscreteHazardModel
} from "./src/services/realWorldValidation/discreteHazardSurvivalEngine.js";
import { calculatePlanetaryPositions, calculateMarriageTimingEvents } from "./src/services/astroEngine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

console.log("\n" + "=".repeat(70));
console.log(" ASTROVERSE — DISCRETE-TIME HAZARD SURVIVAL ENGINE TEST");
console.log("=".repeat(70) + "\n");

let passes = 0;
let fails = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passes++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    fails++;
  }
}

// 1. Bin discretization verification
assert(SURVIVAL_AGE_BINS.length === 16, "16 discrete age intervals defined");
assert(SURVIVAL_AGE_BINS[0].startAge === 18 && SURVIVAL_AGE_BINS[15].endAge === 50, "Intervals span exactly [18, 50]");

// 2. Demographic baseline hazard verification
assert(TRAIN_DEMOGRAPHIC_BASELINE_HAZARD.length === 16, "16 baseline demographic hazards present");
const peakBin = TRAIN_DEMOGRAPHIC_BASELINE_HAZARD.reduce((max, b) => b.hazard > max.hazard ? b : max);
assert(peakBin.bin === "28–30", `Peak demographic hazard correctly located at age 28-30 (got ${peakBin.bin})`);

// 3. Test individual chart survival prediction
const sampleChart = calculatePlanetaryPositions("1985-05-15", "10:30", 13.08, 80.27, "lahiri", 5.5);
const timingEvents = calculateMarriageTimingEvents(sampleChart);
const windows = timingEvents?.candidateWindows || [];

const predCombined = predictDiscreteHazardSurvival(sampleChart, windows, { modelType: "COMBINED_HAZARD", betaAstro: FROZEN_TRAIN_BETA_ASTRO });
assert(Number.isFinite(predCombined.occurrenceProbability), "Occurrence probability is finite number");
assert(predCombined.occurrenceProbability > 0 && predCombined.occurrenceProbability < 1, "Occurrence probability in (0, 1)");
assert(predCombined.intervals.length === 16, "Output contains all 16 interval hazard rates");
assert(Number.isFinite(predCombined.expectedTimingAge), "Expected timing age is finite");
assert(predCombined.expectedTimingAge >= 18 && predCombined.expectedTimingAge <= 50, `Expected timing age in [18, 50] (got ${predCombined.expectedTimingAge}y)`);
assert(predCombined.interval80.widthYears > 0, `80% interval has positive width (${predCombined.interval80.widthYears}y)`);

// 4. Test Null Age-Only Model vs Combined Model
const predNull = predictDiscreteHazardSurvival(sampleChart, windows, { modelType: "DEMOGRAPHIC_AGE_ONLY" });
assert(predNull.occurrenceProbability > 0, "Null demographic model generates valid occurrence probability");
assert(predNull.expectedTimingAge >= 25 && predNull.expectedTimingAge <= 29, `Null demographic model central age near population median (got ${predNull.expectedTimingAge}y)`);

// 5. Evaluate on small sample cohort
const trainRecords = JSON.parse(fs.readFileSync(path.join(ROOT, "data/real_world_validation/splits/train.json"), "utf8")).slice(0, 30);
const chartCache = new Map();
function getChart(rec) {
  if (chartCache.has(rec.sourceRecordId)) return chartCache.get(rec.sourceRecordId);
  const c = calculatePlanetaryPositions(rec.birthDate, rec.birthTime || "12:00", rec.latitude || 13.0, rec.longitude || 80.0, "lahiri", rec.sourceUtcOffset || 5.5);
  c._marriageTimingEvents = calculateMarriageTimingEvents(c);
  chartCache.set(rec.sourceRecordId, c);
  return c;
}

const cohortEval = evaluateCohortDiscreteHazardSurvival(trainRecords, getChart, { betaAstro: FROZEN_TRAIN_BETA_ASTRO });
assert(cohortEval.cohortEvaluatedN > 0, `Evaluated sample cohort subjects: ${cohortEval.cohortEvaluatedN}`);
assert(Number.isFinite(cohortEval.likelihood.logLikNullModel), "Null model log-likelihood is finite");
assert(Number.isFinite(cohortEval.likelihood.logLikCombinedModel), "Combined model log-likelihood is finite");
assert(cohortEval.likelihood.likelihoodRatioStatistic >= 0, "Likelihood Ratio Test statistic >= 0");
assert(Number.isFinite(cohortEval.concordanceIndex), "Concordance index is finite");
assert(cohortEval.concordanceIndex >= 0.40 && cohortEval.concordanceIndex <= 1.0, `Concordance index in reasonable range (got ${cohortEval.concordanceIndex})`);

// 6. Feature-level analysis (Regression test: Data dependency)
const datasetA = trainRecords.slice(0, 15);
const datasetB = trainRecords.slice(15, 30);

const resultsA = runRealDataFeatureLevelSurvivalAnalysis(datasetA, getChart);
const resultsB = runRealDataFeatureLevelSurvivalAnalysis(datasetB, getChart);

assert(resultsA.length >= 6, "At least 6 shastric features evaluated on Dataset A");
assert(resultsB.length >= 6, "At least 6 shastric features evaluated on Dataset B");
assert(resultsA.some(f => f.featureId === "DASHA_7TH_LORD"), "DASHA_7TH_LORD evaluated");
assert(resultsA.some(f => f.featureId === "TRANSIT_JUPITER_7TH"), "TRANSIT_JUPITER_7TH evaluated");

// Strict data dependency check: changing input dataset changes output statistics
const countsA = resultsA.map(f => `${f.featureId}:${f.exposedCount}:${f.eventCount}`).join("|");
const countsB = resultsB.map(f => `${f.featureId}:${f.exposedCount}:${f.eventCount}`).join("|");
assert(countsA !== countsB, "Feature-level statistics are genuinely data-dependent (Dataset A != Dataset B)");

// Check that confidence intervals are mathematically calculated, not fixed multipliers
for (const feat of resultsA) {
  if (feat.status !== "INSUFFICIENT_DATA") {
    assert(Array.isArray(feat.ci95) && feat.ci95.length === 2, `${feat.featureId} has 95% CI array`);
    assert(feat.ci95[0] <= feat.oddsRatio && feat.oddsRatio <= feat.ci95[1], `${feat.featureId} odds ratio within 95% CI`);
    assert(feat.ciMethod === "Asymptotic Fisher Information Hessian Standard Error", `${feat.featureId} CI method documented`);
    assert(Number.isFinite(feat.pValue), `${feat.featureId} p-value is finite number`);
  }
}

// 7. Test genuine model fitting on TRAIN
const fittedModel = fitDiscreteHazardModel(trainRecords, getChart, { maxRecords: 25 });
assert(fittedModel.optimization.converged === true, "Model optimization converged via Newton-Raphson / IRLS");
assert(Number.isFinite(fittedModel.coefficients.betaAstro), "betaAstro is finite fitted coefficient");
assert(Number.isFinite(fittedModel.likelihood.likelihoodRatioStatistic), "LRT statistic is finite number");
assert(Number.isFinite(fittedModel.likelihood.lrtPValue), "LRT p-value is finite number");
assert(typeof fittedModel.sampleProvenance.modelFitHash === "string", "Model fit hash generated");

console.log("\n" + "-".repeat(70));
console.log(`Results: ${passes} passed, ${fails} failed.`);
console.log("-".repeat(70));

process.exit(fails > 0 ? 1 : 0);

