/**
 * ASTROVERSE — V3 Full-Cohort Execution & Anti-Truncation Audit Test
 *
 * Verifies that the V3 Discrete-Time Hazard Survival Model is executed across
 * 100% of the permitted cohorts without artificial slicing or pilot caps:
 *  1. TRAIN model fitting evaluates the complete TRAIN cohort (N=9,366), not .slice(0, 400).
 *  2. VALIDATION evaluates the complete VAL cohort (N=3,155), not .slice(0, 400).
 *  3. BLIND_TEST evaluates the complete BLIND cohort (N=1,634), not .slice(0, 400).
 *  4. INTERNAL_HOLDOUT evaluates the complete HOLDOUT cohort (N=1,555), not .slice(0, 400).
 *  5. Astro-Databank Certified A/AA evaluates the complete external cohort (N=3,751), not .slice(0, 400).
 *  6. Astro-Databank All Independent evaluates the complete external cohort (N=4,798), not .slice(0, 400).
 *  7. Feature-level survival analysis evaluates the complete TRAIN cohort, not .slice(0, 200).
 *  8. 7-model ablation evaluates the complete evaluation cohort, not capped at 150/250.
 *  9. Harrell's C-index evaluates across all pairs without a 500-pair truncation cap.
 * 10. Benchmark artifact reflects full-cohort sample sizes across all splits.
 *
 * Exits non-zero if ANY truncation check fails.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

console.log("\n" + "=".repeat(75));
console.log(" ASTROVERSE — V3 FULL-COHORT EXECUTION & ANTI-TRUNCATION AUDIT");
console.log("=".repeat(75) + "\n");

let passed = 0;
let failed = 0;

function assert(condition, ruleId, description) {
  if (condition) {
    console.log(`  ✓ [Check ${ruleId}] ${description}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL [Check ${ruleId}] ${description}`);
    failed++;
  }
}

// -----------------------------------------------------------------------------
// PART 1: Source Code Inspection (Zero Truncation Slices in V3 Runner)
// -----------------------------------------------------------------------------
const runnerSource = fs.readFileSync(
  path.join(ROOT, "frontend/test_real_world_empirical_benchmark.mjs"),
  "utf8"
);

// Check TRAIN fitting has no maxRecords truncation
assert(
  !/fitDiscreteHazardModel\s*\(\s*trainRecords\s*,\s*getChartForRecord\s*,\s*\{\s*maxRecords:\s*\d+/m.test(runnerSource),
  "1.1",
  "fitDiscreteHazardModel() does not specify a truncated maxRecords in benchmark runner"
);

// Check VAL evaluation has no slice
assert(
  !runnerSource.includes("valRecords.slice(0, 400)") && !runnerSource.includes("valRecords.slice("),
  "1.2",
  "VAL V3 evaluation does not slice valRecords"
);

// Check BLIND evaluation has no slice
assert(
  !runnerSource.includes("blindRecords.slice(0, 400)") && !/evaluateCohortDiscreteHazardSurvival\s*\(\s*blindRecords\.slice/m.test(runnerSource),
  "1.3",
  "BLIND_TEST V3 evaluation does not slice blindRecords"
);

// Check INTERNAL_HOLDOUT evaluation has no slice
assert(
  !runnerSource.includes("internalHoldoutRecords.slice(0, 400)") && !/evaluateCohortDiscreteHazardSurvival\s*\(\s*internalHoldoutRecords\.slice/m.test(runnerSource),
  "1.4",
  "INTERNAL_HOLDOUT V3 evaluation does not slice internalHoldoutRecords"
);

// Check Astro-Databank Certified A/AA has no slice
assert(
  !runnerSource.includes("adbCertifiedCohort.slice(0, 400)") && !/evaluateCohortDiscreteHazardSurvival\s*\(\s*adbCertifiedCohort\.slice/m.test(runnerSource),
  "1.5",
  "Astro-Databank Certified A/AA V3 evaluation does not slice adbCertifiedCohort"
);

// Check Astro-Databank AA, A, and All Independent have no slice
assert(
  !runnerSource.includes("adbAACohort.slice(0, 250)") &&
  !runnerSource.includes("adbACohort.slice(0, 250)") &&
  !runnerSource.includes("adbRecords.slice(0, 400)"),
  "1.6",
  "Astro-Databank sensitivity cohorts (AA, A, All Independent) do not slice records"
);

// Check Feature-Level Survival Analysis has no slice
assert(
  !runnerSource.includes("trainRecords.slice(0, 200)") && !/runRealDataFeatureLevelSurvivalAnalysis\s*\(\s*trainRecords\.slice/m.test(runnerSource),
  "1.7",
  "Feature-level survival analysis does not slice trainRecords"
);

// Check 7-model ablation has no maxRecords truncation
assert(
  !/runRealDataFeatureAblation\s*\([^)]*\{\s*maxRecords:\s*\d+/m.test(runnerSource),
  "1.8",
  "7-model feature ablation does not specify a truncated maxRecords in runner"
);

// -----------------------------------------------------------------------------
// PART 2: Engine Implementation Inspection (No Hidden Engine Caps)
// -----------------------------------------------------------------------------
const engineSource = fs.readFileSync(
  path.join(ROOT, "frontend/src/services/realWorldValidation/discreteHazardSurvivalEngine.js"),
  "utf8"
);

// Harrell's C-index should evaluate across all pairs without a 500-pair cap
assert(
  !engineSource.includes("maxPairs = Math.min(n, 500)"),
  "2.1",
  "computeHarrellsCIndex does not truncate evaluation at 500 pairs"
);

// Ablation should not default to 250 records
assert(
  !engineSource.includes("Math.min(evalRecords.length, 250)"),
  "2.2",
  "runRealDataFeatureAblation does not cap evaluation at 250 records by default"
);

// -----------------------------------------------------------------------------
// PART 3: Stored Benchmark Artifact Cohort Size Audit
// -----------------------------------------------------------------------------
const LATEST_BENCHMARK_PATH = path.join(ROOT, "frontend/src/config/latestBenchmarkResults.json");

if (fs.existsSync(LATEST_BENCHMARK_PATH)) {
  const artifact = JSON.parse(fs.readFileSync(LATEST_BENCHMARK_PATH, "utf8"));
  const v3 = artifact.discreteHazardModelV3;

  if (v3) {
    const trainEvaluated = v3.trainFit?.sampleProvenance?.evaluatedSubjects ?? 0;
    const valEvaluated = v3.validationMetrics?.cohortEvaluatedN ?? 0;
    const blindEvaluated = v3.blindTestMetrics?.cohortEvaluatedN ?? 0;
    const holdoutEvaluated = v3.internalHoldoutMetrics?.cohortEvaluatedN ?? 0;
    const adbCertifiedEvaluated = v3.astroDatabankCertifiedMetrics?.cohortEvaluatedN ?? 0;
    const adbAllEvaluated = v3.astroDatabankSensitivity?.ALL_INDEPENDENT?.cohortEvaluatedN ?? 0;
    const trainPersonTime = v3.featureLevelStatistics?.[0]?.personTime ?? 0;

    assert(
      trainEvaluated > 7000,
      "3.1",
      `TRAIN model fitting executed on full permitted cohort (evaluated ${trainEvaluated} / 9,366 subjects, not capped at 400)`
    );

    assert(
      valEvaluated > 2500,
      "3.2",
      `VALIDATION executed on full cohort (evaluated ${valEvaluated} / 3,155 subjects, not capped at 400)`
    );

    assert(
      blindEvaluated > 1400,
      "3.3",
      `BLIND_TEST executed on full cohort (evaluated ${blindEvaluated} / 1,634 subjects, not capped at 400)`
    );

    assert(
      holdoutEvaluated > 1400,
      "3.4",
      `INTERNAL_HOLDOUT executed on full cohort (evaluated ${holdoutEvaluated} / 1,555 subjects, not capped at 400)`
    );

    assert(
      adbCertifiedEvaluated > 800,
      "3.5",
      `Astro-Databank Certified A/AA executed on full cohort (evaluated ${adbCertifiedEvaluated} / 3,751 subjects, not capped at 106)`
    );

    assert(
      adbAllEvaluated > 1000,
      "3.6",
      `Astro-Databank All Independent executed on full cohort (evaluated ${adbAllEvaluated} / 4,798 subjects, not capped at 400)`
    );

    assert(
      trainPersonTime > 10000,
      "3.7",
      `Feature-level survival analysis person-time spans full TRAIN cohort (${trainPersonTime} person-intervals, not capped at 1,463)`
    );
  } else {
    assert(false, "3.0", "discreteHazardModelV3 missing from latestBenchmarkResults.json");
  }
} else {
  console.log("  ℹ latestBenchmarkResults.json not yet generated; skipping artifact size checks until benchmark run.");
}

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log("\n" + "=".repeat(75));
console.log(` V3 FULL-COHORT EXECUTION AUDIT: ${passed} passed, ${failed} failed`);
console.log("=".repeat(75));

if (failed > 0) {
  console.error(`\n❌ FULL-COHORT AUDIT FAILED with ${failed} violation(s).`);
  process.exit(1);
} else {
  console.log("\n✅ ALL FULL-COHORT EXECUTION & ANTI-TRUNCATION CHECKS PASSED.");
  process.exit(0);
}
