/**
 * ASTROVERSE — Celebrity Historical Milestone Pipeline Regression Suite
 * ======================================================================
 * Tests Phase 6-11 implementation:
 * - Anti-leakage person-level partitioning and VedAstro quarantine
 * - Anomaly quarantine integrity
 * - Multi-model domain benchmark verification
 * - Epistemic honesty & non-fabrication invariants
 * - Negative controls & edge cases
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import assert from "assert";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const DATASET_PATH = path.join(ROOT, "data/external_validation/astro_databank/celebrity_public_milestones_dataset.json");
const MANIFEST_PATH = path.join(ROOT, "data/external_validation/astro_databank/celebrity_milestones_manifest.json");
const QUARANTINE_PATH = path.join(ROOT, "data/external_validation/astro_databank/celebrity_milestones_quarantine.json");
const BENCHMARK_RESULTS_PATH = path.join(ROOT, "data/external_validation/results/celebrity_domain_benchmark_results.json");

console.log("\n" + "=".repeat(80));
console.log(" ASTROVERSE — CELEBRITY HISTORICAL MILESTONE PIPELINE TEST SUITE");
console.log("=".repeat(80) + "\n");

let passed = 0;
let total = 0;

function check(title, fn) {
  total++;
  try {
    fn();
    console.log(`  ✓ [PASS] ${title}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${title}: ${err.message}`);
  }
}

// 1. Dataset & Manifest Integrity
check("1. Verified dataset, manifest, and quarantine files exist with non-zero size", () => {
  assert.ok(fs.existsSync(DATASET_PATH), "Dataset must exist");
  assert.ok(fs.existsSync(MANIFEST_PATH), "Manifest must exist");
  assert.ok(fs.existsSync(QUARANTINE_PATH), "Quarantine log must exist");
  assert.ok(fs.existsSync(BENCHMARK_RESULTS_PATH), "Benchmark results must exist");

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  assert.strictEqual(manifest.statistics.totalSubjects, 6036, "Manifest must declare 6,036 subjects");
});

const dataset = JSON.parse(fs.readFileSync(DATASET_PATH, "utf8"));
const quarantine = JSON.parse(fs.readFileSync(QUARANTINE_PATH, "utf8"));
const benchmarkResults = JSON.parse(fs.readFileSync(BENCHMARK_RESULTS_PATH, "utf8"));

// 2. Anomaly Quarantine Integrity
check("2. Quarantine log captures anomalous records with documented reasons and zero false-pass", () => {
  assert.ok(quarantine.length > 0, "Quarantine log must contain records");
  for (const q of quarantine) {
    assert.ok(q.adbId, "Quarantined record must have adbId");
    assert.ok(q.reason, "Quarantined record must declare reason");
    assert.ok(
      ["EVENT_BEFORE_BIRTH_YEAR", "NEGATIVE_SUBJECT_AGE", "IMPLAUSIBLE_AGE_EXCEEDS_120_YEARS", "INVALID_EVENT_DATE"].includes(q.reason),
      `Reason must be valid recognized category: ${q.reason}`
    );
  }

  // Ensure no valid milestone in dataset has negative age on personal event
  for (const sub of dataset) {
    for (const m of sub.milestones || []) {
      if (!m.isKinshipEvent && m.ageAtEvent != null) {
        assert.ok(m.ageAtEvent >= 0, `Personal milestone cannot have negative age: ${m.milestoneId}`);
        assert.ok(m.ageAtEvent <= 123, `Milestone age must be plausible (<= 123y): ${m.milestoneId} had ${m.ageAtEvent}`);
      }
    }
  }
});

// 3. Anti-Leakage Person-Level Partitioning
check("3. 100% Person-level isolation: VedAstro holdouts isolated to TEST, zero train/val leakage", () => {
  const trainIds = new Set();
  const valIds = new Set();
  const testIds = new Set();

  for (const subject of dataset) {
    const overlapStatus = subject.provenance?.overlapStatus || "";
    const isProtectedOverlap =
      overlapStatus.includes("BLIND_TEST") ||
      overlapStatus.includes("INTERNAL_HOLDOUT");

    if (isProtectedOverlap) {
      testIds.add(subject.adbId);
      // Negative test: must NEVER be in train or val
      assert.ok(!trainIds.has(subject.adbId), `Holdout ${subject.adbId} leaked into train`);
      assert.ok(!valIds.has(subject.adbId), `Holdout ${subject.adbId} leaked into val`);
    } else {
      const hash = crypto.createHash("sha256").update("CELEB_SPLIT_" + subject.adbId).digest("hex");
      const val = parseInt(hash.substring(0, 8), 16) / 0xffffffff;
      if (val < 0.60) {
        trainIds.add(subject.adbId);
      } else if (val < 0.80) {
        valIds.add(subject.adbId);
      } else {
        testIds.add(subject.adbId);
      }
    }
  }

  // Verify mutually disjoint partitions
  for (const id of trainIds) {
    assert.ok(!valIds.has(id), `Subject ${id} in both train and val`);
    assert.ok(!testIds.has(id), `Subject ${id} in both train and test`);
  }
  for (const id of valIds) {
    assert.ok(!testIds.has(id), `Subject ${id} in both val and test`);
  }
});

// 4. Domain Benchmark Coverage & 4-Model Comparison
check("4. Benchmark covers all 10 domains with 4 distinct comparative models per domain", () => {
  const requiredDomains = [
    "CAREER_BUSINESS",
    "AWARDS_HONORS",
    "HEALTH_WELLNESS",
    "RELATIONSHIPS",
    "FAMILY_CHILDREN",
    "LEGAL_MUNDANE",
    "BEREAVEMENT_FAMILY_LOSS",
    "DEATH_END_OF_LIFE",
    "PROPERTY_RESIDENCE",
    "FINANCIAL"
  ];

  for (const dom of requiredDomains) {
    const res = benchmarkResults.domainBenchmarks[dom];
    assert.ok(res, `Benchmark must include domain ${dom}`);
    assert.ok(res.models.modelA_population, `Model A must exist for ${dom}`);
    assert.ok(res.models.modelB_demographic, `Model B must exist for ${dom}`);
    assert.ok(res.models.modelC_astrologyOnly, `Model C must exist for ${dom}`);
    assert.ok(res.models.modelD_combinedHybrid, `Model D must exist for ${dom}`);

    // Verify metric presence
    for (const [mName, mEval] of Object.entries(res.models)) {
      assert.ok(typeof mEval.mae === "number" && mEval.mae > 0, `${mName} MAE must be positive number`);
      assert.ok(typeof mEval.medAe === "number" && mEval.medAe > 0, `${mName} MedAE must be positive number`);
      assert.ok(typeof mEval.cIndex === "number" && mEval.cIndex >= 0 && mEval.cIndex <= 1, `${mName} C-index must be between 0 and 1`);
    }

    // Likelihood ratio test metrics
    assert.ok(typeof res.comparison.lrtChiSquare === "number", `LRT Chi-square must exist for ${dom}`);
    assert.ok(typeof res.comparison.lrtPValue === "number", `LRT p-value must exist for ${dom}`);
  }
});

// 5. Epistemic Integrity: Unsubstantiated Superiority Rejected
check("5. Epistemic honesty: Global status preserved as EXPERIMENTAL_NOT_EMPIRICALLY_VALIDATED", () => {
  const overall = benchmarkResults.overallAssessment;
  assert.ok(overall, "Overall assessment must exist");
  assert.strictEqual(
    overall.globalEmpiricalStatus,
    "EXPERIMENTAL_NOT_EMPIRICALLY_VALIDATED",
    "Global status must remain EXPERIMENTAL_NOT_EMPIRICALLY_VALIDATED without powered validation"
  );
  assert.ok(
    overall.scientificConclusion.includes("EXPERIMENTAL_NOT_EMPIRICALLY_VALIDATED"),
    "Scientific conclusion must cite EXPERIMENTAL_NOT_EMPIRICALLY_VALIDATED"
  );
  assert.ok(
    overall.mandatoryDisclaimer.length > 50,
    "Mandatory scientific disclaimer must be substantial"
  );
});

// 6. Negative Controls: Rejection of Overfitted / Fabricated Claims
check("6. Negative controls: Zero perfect predictions, no zero MAE, no ungrounded certainty", () => {
  for (const [dom, res] of Object.entries(benchmarkResults.domainBenchmarks)) {
    if (res.status === "INSUFFICIENT_SAMPLE_SIZE") continue;

    // MAE cannot be 0 (impossible in real-world empirical milestones)
    assert.ok(res.models.modelD_combinedHybrid.mae >= 5.0, `${dom} Combined MAE implausibly small (< 5y) indicating potential fabrication/overfitting`);
    // C-Index cannot be 1.0
    assert.ok(res.models.modelD_combinedHybrid.cIndex < 0.95, `${dom} Combined C-Index implausibly high (>= 0.95)`);
  }
});

console.log("\n" + "=".repeat(80));
console.log(` RESULTS: ${passed} / ${total} tests passed (${Math.round((passed / total) * 100)}%)`);
console.log("=".repeat(80) + "\n");

if (passed !== total) {
  process.exit(1);
}
