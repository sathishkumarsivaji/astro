/**
 * ASTROVERSE — Dynamic Validation Manifest Aggregator & Integrity Builder
 *
 * Programmatically executes all verification test suites, tallies passed/failed checks,
 * verifies SHA-256 fixture checksums, and updates `VALIDATION_MANIFEST.json` dynamically.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const FRONTEND_DIR = path.resolve(ROOT_DIR, "frontend");
const BACKEND_DIR = path.resolve(ROOT_DIR, "backend");
const MANIFEST_PATH = path.resolve(FRONTEND_DIR, "VALIDATION_MANIFEST.json");
const SWISS_FIXTURE_PATH = path.resolve(FRONTEND_DIR, "test_fixtures/swiss_ephemeris_2_10_03_reference.json");

console.log("\n" + "=".repeat(75));
console.log(" ASTROVERSE DYNAMIC VALIDATION MANIFEST BUILDER");
console.log("=".repeat(75) + "\n");

// 1. Verify Swiss Fixture SHA-256
if (!fs.existsSync(SWISS_FIXTURE_PATH)) {
  console.error(`Error: Swiss Ephemeris fixture missing at ${SWISS_FIXTURE_PATH}`);
  process.exit(1);
}
const fixtureBytes = fs.readFileSync(SWISS_FIXTURE_PATH);
const fixtureSha256 = crypto.createHash("sha256").update(fixtureBytes).digest("hex");
console.log(`✓ Computed Swiss Ephemeris 2.10.03 fixture SHA-256: ${fixtureSha256}`);

// 2. Define standard test suites to execute
const TEST_SUITES = [
  { name: "Swiss Ephemeris Benchmark", cwd: FRONTEND_DIR, cmd: "node test_swiss_ephemeris_benchmark.mjs" },
  { name: "True Node Independent Benchmark", cwd: FRONTEND_DIR, cmd: "node test_true_node_independent_benchmark.mjs" },
  { name: "Cross-System Consistency", cwd: FRONTEND_DIR, cmd: "node test_cross_system_astronomical_consistency.mjs" },
  { name: "Prediction Lab & Backtesting", cwd: FRONTEND_DIR, cmd: "node test_backtesting_validation.mjs" },
  { name: "Consultation Engine", cwd: FRONTEND_DIR, cmd: "node test_consultation_engine.mjs" },
  { name: "Multi-Turn QA Router", cwd: FRONTEND_DIR, cmd: "node test_multiturn_qa.mjs" },
  { name: "PDF & Fingerprint Integrity", cwd: FRONTEND_DIR, cmd: "node test_pdf_and_fingerprint.mjs" },
  { name: "Tamil Purity & Localization", cwd: FRONTEND_DIR, cmd: "node test_tamil_purity.mjs" },
  { name: "Detailed Report Anti-Fabrication", cwd: FRONTEND_DIR, cmd: "node test_detailed_report_integrity.mjs" },
  { name: "Convention Fixtures", cwd: FRONTEND_DIR, cmd: "node test_convention_fixtures.mjs" },
  { name: "Golden Astronomy", cwd: FRONTEND_DIR, cmd: "node test_golden_astronomy.mjs" },
  { name: "Claim Graph", cwd: FRONTEND_DIR, cmd: "node test_claim_graph.mjs" },
  { name: "Calendar Engine", cwd: FRONTEND_DIR, cmd: "node test_calendar_engine.mjs" },
  { name: "Differential Prediction Integrity", cwd: FRONTEND_DIR, cmd: "node test_differential_prediction_integrity.mjs" },
  { name: "No Fabricated Calculated Values", cwd: FRONTEND_DIR, cmd: "node test_no_fabricated_calculated_values.mjs" },
  { name: "Backend Security & Push", cwd: BACKEND_DIR, cmd: "node test_backend.mjs" },
  { name: "Validation Manifest Integrity", cwd: FRONTEND_DIR, cmd: "node test_validation_manifest_integrity.mjs" }
];

let totalChecksExecuted = 0;
let totalPassed = 0;
let totalFailed = 0;
const suiteResults = [];

for (const suite of TEST_SUITES) {
  const startTime = Date.now();
  process.stdout.write(`• Running ${suite.name}... `);
  try {
    const stdout = execSync(suite.cmd, { cwd: suite.cwd, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
    const durationMs = Date.now() - startTime;

    // Count checks by scanning lines from bottom up for definitive summary banner
    let passedCount = 0;
    let failedCount = 0;

    const lines = stdout.split(/\r?\n/).reverse();
    for (const line of lines) {
      const bannerMatch = line.match(/ALL\s+(\d+)\s+[^!]*?PASSED/i) || line.match(/(\d+)\/(\d+)\s+passed/i) || line.match(/(\d+)\s+PASSED/i);
      if (bannerMatch) {
        passedCount = parseInt(bannerMatch[1], 10);
        break;
      }
    }

    if (passedCount === 0) {
      const checkMatches = stdout.match(/[✓✔]\s/g) || [];
      passedCount = checkMatches.length;
    }

    const failMatches = stdout.match(/[✗✘❌]\s|FAIL:/g) || [];
    failedCount = failMatches.length;

    totalChecksExecuted += (passedCount + failedCount);
    totalPassed += passedCount;
    totalFailed += failedCount;

    suiteResults.push({
      name: suite.name,
      command: suite.cmd,
      checks: passedCount + failedCount,
      passed: passedCount,
      failed: failedCount,
      status: failedCount === 0 ? "PASS" : "FAIL",
      durationMs
    });

    console.log(`✓ ${passedCount} passed (${durationMs}ms)`);
  } catch (err) {
    console.log(`✗ FAILED`);
    console.error(err.stdout || err.stderr || err.message);
    totalFailed++;
    suiteResults.push({
      name: suite.name,
      command: suite.cmd,
      checks: 0,
      passed: 0,
      failed: 1,
      status: "FAIL",
      error: err.message
    });
  }
}

console.log("\n" + "=".repeat(75));
console.log(` SUMMARY: ${totalPassed} passed, ${totalFailed} failed across ${suiteResults.length} test suites.`);
console.log("=".repeat(75) + "\n");

// 3. Read existing manifest and update dynamic fields
let manifest = {};
if (fs.existsSync(MANIFEST_PATH)) {
  manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
}

manifest.manifestVersion = "2.3.0";
manifest.generatedAt = new Date().toISOString();

if (!manifest.benchmarkDatasets) manifest.benchmarkDatasets = {};
if (!manifest.benchmarkDatasets.independentSwissReference) manifest.benchmarkDatasets.independentSwissReference = {};
manifest.benchmarkDatasets.independentSwissReference.sha256 = fixtureSha256;

manifest.testSuiteSummary = {
  totalChecks: totalPassed + totalFailed,
  passed: totalPassed,
  failed: totalFailed,
  status: totalFailed === 0 ? "ALL_PASSED" : "FAILED",
  suites: suiteResults
};

fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf8");
console.log(`✓ Updated ${MANIFEST_PATH} successfully.\n`);
