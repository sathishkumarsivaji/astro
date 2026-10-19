/**
 * ASTROVERSE — Full Regression Suite Runner & Machine-Readable Aggregator
 * ======================================================================
 * Executes the full test matrix specified in the Phase 4 audit instructions.
 * Records exact command, start/end timestamps, exit code, passed/failed/blocked
 * counts into MACHINE_READABLE_TEST_RESULTS.json.
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const FRONTEND_DIR = path.join(ROOT, "frontend");
const BACKEND_DIR = path.join(ROOT, "backend");

const suites = [
  // 1. Release Manifest & Gates
  { name: "Release Manifest Integrity", cwd: FRONTEND_DIR, cmd: "node test_release_package_integrity.mjs" },
  { name: "17-Point Release Certification Gate", cwd: FRONTEND_DIR, cmd: "node test_release_certification_gate.mjs" },
  { name: "Validation Manifest Integrity", cwd: FRONTEND_DIR, cmd: "node test_validation_manifest_integrity.mjs" },
  
  // 2. Astronomical Precision & Ephemeris
  { name: "Golden Astronomy Precision (780 checks)", cwd: FRONTEND_DIR, cmd: "node test_golden_astronomy.mjs" },
  { name: "Swiss Ephemeris Benchmark", cwd: FRONTEND_DIR, cmd: "node test_swiss_ephemeris_benchmark.mjs" },
  { name: "Independent Ephemeris 500 Cases", cwd: FRONTEND_DIR, cmd: "node test_independent_ephemeris_500_cases.mjs" },
  { name: "Multi-System Precision (90 checks)", cwd: FRONTEND_DIR, cmd: "node test_multi_system_precision.mjs" },
  { name: "Historical Time Engine & DST", cwd: FRONTEND_DIR, cmd: "node test_historical_time_engine.mjs" },

  // 3. Birth Rectification & Birth Quality
  { name: "Rectification Full Suite", cwd: FRONTEND_DIR, cmd: "node test_rectification_suite.mjs" },
  { name: "Rectification Ground Truth Benchmark", cwd: FRONTEND_DIR, cmd: "node test_rectification_ground_truth_benchmark.mjs" },
  { name: "Rectification Edge Boundary", cwd: FRONTEND_DIR, cmd: "node test_rectification_edge_boundary.mjs" },
  { name: "Rectification Margin & Stability", cwd: FRONTEND_DIR, cmd: "node test_rectification_stability.mjs" },
  { name: "Birth Quality & Feature Engineering", cwd: BACKEND_DIR, cmd: "node test/test_phase3_and_4_birth_quality_and_feature_engineering.mjs" },

  // 4. Q&A Accuracy, Contracts, & Grounding
  { name: "Q&A Accuracy and Timing Contracts (23 checks)", cwd: FRONTEND_DIR, cmd: "node test_qa_accuracy_and_timing_contracts.mjs" },
  { name: "Q&A Scientific Grounding", cwd: FRONTEND_DIR, cmd: "node test_qa_scientific_grounding.mjs" },
  { name: "Precision Q&A Engine", cwd: FRONTEND_DIR, cmd: "node test_precision_qa_engine.mjs" },
  { name: "System Comparison Q&A", cwd: FRONTEND_DIR, cmd: "node test_system_comparison_qa.mjs" },
  { name: "Task Q&A Engine", cwd: FRONTEND_DIR, cmd: "node test_task_qa_engine.mjs" },
  { name: "Universal Claim Firewall", cwd: FRONTEND_DIR, cmd: "node test_universal_claim_firewall.mjs" },

  // 5. Anti-Fabrication & Evidence Firewalls
  { name: "Forensic Integrity Mandates", cwd: FRONTEND_DIR, cmd: "node test_forensic_integrity_mandates.mjs" },
  { name: "Forensic Remediation Suite", cwd: FRONTEND_DIR, cmd: "node test_forensic_remediation_suite.mjs" },
  { name: "Stage 2 Evidence Firewall", cwd: BACKEND_DIR, cmd: "node test/test_stage2_evidence_firewall.mjs" },
  { name: "No Fabricated Calculated Values", cwd: FRONTEND_DIR, cmd: "node test_no_fabricated_calculated_values.mjs" },
  { name: "User Facing No Fabricated Values", cwd: FRONTEND_DIR, cmd: "node test_user_facing_no_fabricated_values.mjs" },
  { name: "Report Accuracy Claim Integrity", cwd: FRONTEND_DIR, cmd: "node test_report_accuracy_claim_integrity.mjs" },
  { name: "No PII in Release", cwd: BACKEND_DIR, cmd: "node test/test_no_pii_in_release.mjs" },

  // 6. Empirical Validation & Real-World Benchmarks
  { name: "Real-World Empirical Benchmark", cwd: FRONTEND_DIR, cmd: "node test_real_world_empirical_benchmark.mjs" },
  { name: "Harrell's C Censoring", cwd: FRONTEND_DIR, cmd: "node test_harrells_c_censoring.mjs" },
  { name: "Prediction Cache Integrity", cwd: FRONTEND_DIR, cmd: "node test_prediction_cache_version_integrity.mjs" },

  // 7. Continuous Learning & Feedback
  { name: "Stage 1 Prediction Records", cwd: BACKEND_DIR, cmd: "node test/test_stage1_prediction_records.mjs" },
  { name: "Stage 3 Feedback Outcomes (11 checks)", cwd: BACKEND_DIR, cmd: "node test/test_stage3_feedback_outcomes.mjs" },
  { name: "Stage 5 Continuous Learning (22 checks)", cwd: BACKEND_DIR, cmd: "node test/test_stage5_continuous_learning.mjs" },
  { name: "Phase 12 Adversarial Negative Controls", cwd: BACKEND_DIR, cmd: "node test/test_phase12_adversarial_negative_controls.mjs" },

  // 8. Authentic External Benchmark Datasets
  { name: "Celebrity Milestones Dataset Integrity", cwd: FRONTEND_DIR, cmd: "node test_celebrity_milestones_dataset.mjs" },
  { name: "Celebrity Historical Milestone Pipeline", cwd: FRONTEND_DIR, cmd: "node test_celebrity_historical_milestone_pipeline.mjs" }
];

console.log("\n" + "=".repeat(80));
console.log(` ASTROVERSE — EXECUTING FULL REGRESSION TEST MATRIX (${suites.length} SUITES)`);
console.log("=".repeat(80) + "\n");

const overallStart = new Date().toISOString();
const results = {
  startedAt: overallStart,
  nodeVersion: process.version,
  totalSuites: suites.length,
  passedSuites: 0,
  failedSuites: 0,
  blockedSuites: 0,
  suiteResults: [],
  completedAt: null,
  allPassed: false
};

for (let i = 0; i < suites.length; i++) {
  const s = suites[i];
  const num = `[${String(i + 1).padStart(2, "0")}/${suites.length}]`;
  console.log(`${num} Running: ${s.name} (${s.cmd})...`);
  
  const suiteRecord = {
    index: i + 1,
    name: s.name,
    directory: path.relative(ROOT, s.cwd),
    command: s.cmd,
    startedAt: new Date().toISOString(),
    completedAt: null,
    exitCode: null,
    status: "NOT_RUN",
    stdoutSnippet: "",
    stderrSnippet: ""
  };

  try {
    const stdout = execSync(s.cmd, {
      cwd: s.cwd,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      maxBuffer: 50 * 1024 * 1024
    });
    suiteRecord.exitCode = 0;
    suiteRecord.status = "PASS";
    suiteRecord.stdoutSnippet = stdout.slice(-800).trim();
    results.passedSuites++;
    console.log(`     ✓ PASS`);
  } catch (err) {
    suiteRecord.exitCode = err.status !== undefined ? err.status : 1;
    suiteRecord.status = "FAIL";
    suiteRecord.stdoutSnippet = (err.stdout || "").slice(-800).trim();
    suiteRecord.stderrSnippet = (err.stderr || err.message || "").slice(-800).trim();
    results.failedSuites++;
    console.error(`     ✗ FAIL (exit code ${suiteRecord.exitCode})`);
  } finally {
    suiteRecord.completedAt = new Date().toISOString();
    results.suiteResults.push(suiteRecord);
  }
}

results.completedAt = new Date().toISOString();
results.allPassed = (results.failedSuites === 0 && results.blockedSuites === 0);

console.log("\n" + "=".repeat(80));
console.log(` RESULTS SUMMARY: ${results.passedSuites} Passed, ${results.failedSuites} Failed, ${results.blockedSuites} Blocked`);
console.log("=".repeat(80) + "\n");

const outPath = path.join(ROOT, "MACHINE_READABLE_TEST_RESULTS.json");
fs.writeFileSync(outPath, JSON.stringify(results, null, 2), "utf8");
console.log(`Machine-readable test results written to: ${outPath}\n`);

if (!results.allPassed) {
  process.exit(1);
}
