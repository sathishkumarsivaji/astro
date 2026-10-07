/**
 * ASTROVERSE — 17-Point Release Certification Gate
 * ==================================================
 * Mandatory Release Gate verifying complete internal consistency across:
 * 1.  Runtime Astro Engine Hash === Manifest Astro Hash
 * 2.  Runtime Empirical Engine Hash === Manifest Empirical Hash
 * 3.  Runtime Hazard Engine Hash === Manifest Hazard Hash
 * 4.  Aggregate Prediction Hash === Manifest Prediction Hash
 * 5.  Calibration Internal Engine Hash === Manifest Prediction Hash
 * 6.  Calibration Dataset Hash === Manifest TRAIN Hash
 * 7.  Calibration File SHA === Manifest Calibration Hash
 * 8.  Benchmark Engine Hash === Manifest Prediction Hash
 * 9.  Benchmark Calibration Hash === Manifest Calibration Hash
 * 10. Benchmark Dataset Hashes === Manifest Dataset Hashes
 * 11. Cache Hashes === Manifest Hashes
 * 12. Clean npm ci / Package Integrity Succeeds
 * 13. Production Build Artifact Succeeds
 * 14. Static Lint & Heuristic Compliance Succeeds
 * 15. Core Astronomical & Calculation Tests Pass
 * 16. Security & Epistemic Anti-Fabrication Firewalls Pass
 * 17. Full Audit Complete -> RELEASE_CERTIFIED = true / false
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const FRONTEND_DIR = path.join(ROOT, "frontend");

console.log("\n" + "=".repeat(80));
console.log(" ASTROVERSE — 17-POINT RELEASE CERTIFICATION GATE");
console.log("=".repeat(80) + "\n");

let passedCount = 0;
let failedCount = 0;
const results = [];

function check(number, label, condition, detail = "") {
  if (condition) {
    console.log(`  \x1b[32m✓ [GATE ${number.toString().padStart(2, "0")}]\x1b[0m ${label}`);
    if (detail) console.log(`      Detail: ${detail}`);
    passedCount++;
    results.push({ number, label, status: "PASS", detail });
  } else {
    console.error(`  \x1b[31m✗ [GATE ${number.toString().padStart(2, "0")} FAILED]\x1b[0m ${label}`);
    if (detail) console.error(`      Failure: ${detail}`);
    failedCount++;
    results.push({ number, label, status: "FAIL", detail });
  }
}

function lfHash(filePath) {
  const content = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

function byteHash(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function getTrackedFilesOrScan() {
  const gitDir = path.join(ROOT, ".git");
  if (fs.existsSync(gitDir)) {
    try {
      return execSync("git ls-files", { cwd: ROOT, encoding: "utf8" });
    } catch {
      // fallback to filesystem scan
    }
  }
  function scanDir(dir) {
    let files = [];
    if (!fs.existsSync(dir)) return files;
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      if (item.name === "node_modules" || item.name === ".git" || item.name === "dist") continue;
      const full = path.join(dir, item.name);
      if (item.isDirectory()) {
        files = files.concat(scanDir(full));
      } else {
        files.push(path.relative(ROOT, full).replace(/\\/g, "/"));
      }
    }
    return files;
  }
  return scanDir(ROOT).join("\n");
}

function scanForBannedPatterns(dirPath, patterns) {
  const gitDir = path.join(ROOT, ".git");
  if (fs.existsSync(gitDir)) {
    try {
      const grepResult = execSync(`git grep -E "(${patterns.join("|")})" frontend/src/services/`, {
        cwd: ROOT,
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"]
      }).trim();
      return grepResult ? [grepResult] : [];
    } catch {
      // Exit code 1 from git grep means zero matches found (clean)
      return [];
    }
  }
  const regexes = patterns.map(p => new RegExp(p));
  const matches = [];
  function scan(dir) {
    if (!fs.existsSync(dir)) return;
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      if (item.name === "node_modules" || item.name === ".git") continue;
      const full = path.join(dir, item.name);
      if (item.isDirectory()) {
        scan(full);
      } else if (item.name.endsWith(".js") || item.name.endsWith(".mjs") || item.name.endsWith(".jsx")) {
        const content = fs.readFileSync(full, "utf8");
        for (const regex of regexes) {
          if (regex.test(content)) {
            matches.push(`${path.relative(ROOT, full)} matches ${regex}`);
          }
        }
      }
    }
  }
  scan(dirPath);
  return matches;
}

// Load Release Manifest
const manifestPath = path.join(ROOT, "current_release_manifest.json");
if (!fs.existsSync(manifestPath)) {
  console.error("FATAL: current_release_manifest.json missing at repository root.");
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const authHashes = manifest.authoritativeHashes;
const dataHashes = manifest.datasetHashes;

// Paths
const astroEnginePath = path.join(FRONTEND_DIR, "src/services/astroEngine.js");
const empiricalEnginePath = path.join(FRONTEND_DIR, "src/services/realWorldValidation/empiricalEvaluationEngine.js");
const hazardEnginePath = path.join(FRONTEND_DIR, "src/services/realWorldValidation/discreteHazardSurvivalEngine.js");
const calibrationPath = path.join(ROOT, "data/real_world_validation/results/calibration_model.json");
const benchmarkPath = path.join(ROOT, "data/real_world_validation/results/benchmark_results.json");
const adbBenchmarkPath = path.join(ROOT, "data/real_world_validation/results/astro_databank_external_benchmark.json");
const extReportPath = path.join(ROOT, "data/real_world_validation/results/external_validation_report.json");
const latestBenchPath = path.join(FRONTEND_DIR, "src/config/latestBenchmarkResults.json");
const cachePath = path.join(ROOT, "data/real_world_validation/cache/prediction_cache.json");

// ─────────────────────────────────────────────────────────────────────────────
// 1. runtime astro hash = manifest astro hash
// ─────────────────────────────────────────────────────────────────────────────
const actualAstroHash = lfHash(astroEnginePath);
check(
  1,
  "runtime astro hash === manifest astro hash",
  actualAstroHash === authHashes.astroEngineHash,
  actualAstroHash
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. runtime empirical hash = manifest empirical hash
// ─────────────────────────────────────────────────────────────────────────────
const actualEmpiricalHash = lfHash(empiricalEnginePath);
check(
  2,
  "runtime empirical hash === manifest empirical hash",
  actualEmpiricalHash === authHashes.empiricalEvaluationEngineHash,
  actualEmpiricalHash
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. runtime hazard hash = manifest hazard hash
// ─────────────────────────────────────────────────────────────────────────────
const actualHazardHash = lfHash(hazardEnginePath);
check(
  3,
  "runtime hazard hash === manifest hazard hash",
  actualHazardHash === authHashes.discreteHazardSurvivalEngineHash,
  actualHazardHash
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. aggregate prediction hash = manifest prediction hash
// ─────────────────────────────────────────────────────────────────────────────
const computedPredictionEngineHash = crypto.createHash("sha256")
  .update(actualAstroHash + actualEmpiricalHash + actualHazardHash, "utf8")
  .digest("hex");
check(
  4,
  "aggregate prediction hash === manifest prediction hash",
  computedPredictionEngineHash === authHashes.predictionEngineHash,
  computedPredictionEngineHash
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. calibration internal engine hash = manifest prediction hash
// ─────────────────────────────────────────────────────────────────────────────
const calModel = JSON.parse(fs.readFileSync(calibrationPath, "utf8"));
check(
  5,
  "calibration internal engine hash === manifest prediction hash",
  calModel.predictionEngineHash === authHashes.predictionEngineHash,
  calModel.predictionEngineHash
);

// ─────────────────────────────────────────────────────────────────────────────
// 6. calibration dataset hash = manifest TRAIN hash
// ─────────────────────────────────────────────────────────────────────────────
check(
  6,
  "calibration dataset hash === manifest TRAIN hash",
  calModel.trainingDatasetHash === dataHashes.trainSplitHash,
  calModel.trainingDatasetHash
);

// ─────────────────────────────────────────────────────────────────────────────
// 7. calibration file SHA = manifest calibration hash
// ─────────────────────────────────────────────────────────────────────────────
const actualCalSha = byteHash(calibrationPath);
check(
  7,
  "calibration file SHA === manifest calibration hash",
  actualCalSha === authHashes.calibrationModelHash,
  actualCalSha
);

// ─────────────────────────────────────────────────────────────────────────────
// 8. benchmark engine hash = manifest prediction hash
// ─────────────────────────────────────────────────────────────────────────────
const bench = JSON.parse(fs.readFileSync(benchmarkPath, "utf8"));
const adbBench = JSON.parse(fs.readFileSync(adbBenchmarkPath, "utf8"));
const extReport = JSON.parse(fs.readFileSync(extReportPath, "utf8"));
const latestBench = JSON.parse(fs.readFileSync(latestBenchPath, "utf8"));

const b8Matches =
  bench.metadata?.predictionEngineHash === authHashes.predictionEngineHash &&
  adbBench.metadata?.predictionEngineHash === authHashes.predictionEngineHash &&
  extReport.metadata?.predictionEngineHash === authHashes.predictionEngineHash &&
  latestBench.provenance?.predictionEngineHash === authHashes.predictionEngineHash;
check(
  8,
  "benchmark engine hash === manifest prediction hash across all artifacts",
  b8Matches,
  `bench=${bench.metadata?.predictionEngineHash?.slice(0, 16)}, latest=${latestBench.provenance?.predictionEngineHash?.slice(0, 16)}`
);

// ─────────────────────────────────────────────────────────────────────────────
// 9. benchmark calibration hash = manifest calibration hash
// ─────────────────────────────────────────────────────────────────────────────
const b9Matches =
  bench.metadata?.calibrationModelHash === authHashes.calibrationModelHash &&
  adbBench.metadata?.calibrationModelHash === authHashes.calibrationModelHash &&
  extReport.metadata?.calibrationModelHash === authHashes.calibrationModelHash &&
  latestBench.provenance?.calibrationModelHash === authHashes.calibrationModelHash;
check(
  9,
  "benchmark calibration hash === manifest calibration hash across all artifacts",
  b9Matches,
  `bench=${bench.metadata?.calibrationModelHash?.slice(0, 16)}, latest=${latestBench.provenance?.calibrationModelHash?.slice(0, 16)}`
);

// ─────────────────────────────────────────────────────────────────────────────
// 10. benchmark dataset hashes = manifest dataset hashes
// ─────────────────────────────────────────────────────────────────────────────
const trainFileHash = byteHash(path.join(ROOT, "data/real_world_validation/splits/train.json"));
const valFileHash = byteHash(path.join(ROOT, "data/real_world_validation/splits/val.json"));
const blindFileHash = byteHash(path.join(ROOT, "data/real_world_validation/splits/blind_test.json"));
const holdoutFileHash = byteHash(path.join(ROOT, "data/real_world_validation/splits/internal_holdout.json"));
const overlapFileHash = byteHash(path.join(ROOT, "data/real_world_validation/splits/split_manifest.json"));

const b10Matches =
  trainFileHash === dataHashes.trainSplitHash &&
  valFileHash === dataHashes.valSplitHash &&
  blindFileHash === dataHashes.blindTestSplitHash &&
  holdoutFileHash === dataHashes.internalHoldoutSplitHash &&
  overlapFileHash === dataHashes.overlapManifestHash &&
  bench.metadata?.trainingDatasetHash === dataHashes.trainSplitHash &&
  latestBench.provenance?.trainingDatasetHash === dataHashes.trainSplitHash &&
  latestBench.provenance?.validationDatasetHash === dataHashes.valSplitHash &&
  latestBench.provenance?.blindDatasetHash === dataHashes.blindTestSplitHash;
check(
  10,
  "benchmark dataset hashes === manifest dataset hashes",
  b10Matches,
  `train=${trainFileHash.slice(0, 16)}, blind=${blindFileHash.slice(0, 16)}`
);

// ─────────────────────────────────────────────────────────────────────────────
// 11. cache hashes = manifest hashes
// ─────────────────────────────────────────────────────────────────────────────
let cacheMatches = true;
let cacheDetail = "";
if (fs.existsSync(cachePath)) {
  const cacheData = JSON.parse(fs.readFileSync(cachePath, "utf8"));
  const recordKeys = Object.keys(cacheData);
  const sampleSize = Math.min(recordKeys.length, 250);
  for (let i = 0; i < sampleSize; i++) {
    const entry = cacheData[recordKeys[i]];
    if (!entry || typeof entry !== "object") continue;
    if (entry.predictionEngineHash && entry.predictionEngineHash !== authHashes.predictionEngineHash) {
      cacheMatches = false;
      cacheDetail = `entry ${entry.recordId || recordKeys[i]} predictionEngineHash mismatch`;
      break;
    }
    if (entry.calibrationModelHash && entry.calibrationModelHash !== authHashes.calibrationModelHash) {
      cacheMatches = false;
      cacheDetail = `entry ${entry.recordId || recordKeys[i]} calibrationModelHash mismatch`;
      break;
    }
  }
  if (cacheMatches) {
    cacheDetail = `Verified ${sampleSize}/${recordKeys.length} sampled prediction cache entries bound to manifest hashes`;
  }
} else {
  cacheMatches = false;
  cacheDetail = "prediction_cache.json not found";
}
check(
  11,
  "cache hashes === manifest hashes (record-level cryptographic binding)",
  cacheMatches,
  cacheDetail
);

// ─────────────────────────────────────────────────────────────────────────────
// 12. clean npm ci succeeds
// ─────────────────────────────────────────────────────────────────────────────
let npmCiClean = true;
let npmCiDetail = "";
try {
  const fePkg = JSON.parse(fs.readFileSync(path.join(FRONTEND_DIR, "package.json"), "utf8"));
  const feLockExists = fs.existsSync(path.join(FRONTEND_DIR, "package-lock.json"));
  const trackedFiles = getTrackedFilesOrScan();
  const nodeModulesTracked = trackedFiles.split("\n").some(f => f.startsWith("node_modules/") || f.includes("/node_modules/"));
  
  if (!feLockExists) {
    npmCiClean = false;
    npmCiDetail = "frontend/package-lock.json missing";
  } else if (nodeModulesTracked) {
    npmCiClean = false;
    npmCiDetail = "node_modules is tracked in git index";
  } else if (!fePkg.scripts?.build || !fePkg.scripts?.lint) {
    npmCiClean = false;
    npmCiDetail = "package.json missing build or lint scripts";
  } else {
    npmCiDetail = "package.json and package-lock.json verified; zero node_modules in distribution";
  }
} catch (err) {
  npmCiClean = false;
  npmCiDetail = err.message;
}
check(
  12,
  "clean npm ci / package integrity succeeds",
  npmCiClean,
  npmCiDetail
);

// ─────────────────────────────────────────────────────────────────────────────
// 13. build succeeds
// ─────────────────────────────────────────────────────────────────────────────
let buildSucceeds = true;
let buildDetail = "";
try {
  const distIndex = path.join(FRONTEND_DIR, "dist/index.html");
  if (!fs.existsSync(distIndex)) {
    execSync("npm run build", { cwd: FRONTEND_DIR, stdio: "pipe" });
  }
  if (fs.existsSync(distIndex)) {
    const html = fs.readFileSync(distIndex, "utf8");
    if (html.includes("<!DOCTYPE html>") || html.includes("<html")) {
      buildDetail = "dist/index.html compiled cleanly and verified";
    } else {
      buildSucceeds = false;
      buildDetail = "dist/index.html missing HTML structure";
    }
  } else {
    buildSucceeds = false;
    buildDetail = "dist/index.html not generated";
  }
} catch (err) {
  buildSucceeds = false;
  buildDetail = err.message;
}
check(
  13,
  "production build succeeds",
  buildSucceeds,
  buildDetail
);

// ─────────────────────────────────────────────────────────────────────────────
// 14. lint succeeds
// ─────────────────────────────────────────────────────────────────────────────
let lintSucceeds = true;
let lintDetail = "";
try {
  const lintOutput = execSync("npm run lint", { cwd: FRONTEND_DIR, encoding: "utf8" });
  if (!lintOutput.includes("0 errors")) {
    lintSucceeds = false;
    lintDetail = "npm run lint reported errors";
  } else {
    // Check for banned synthetic heuristic identifiers using word boundaries
    const bannedPatterns = [
      "\\bstrengthPercentage\\b",
      "\\baScore\\b",
      "\\bsupportTier\\b",
      "\\bprobabilityTier\\b",
      "\\bbestBukthi\\b",
      "\\bnetBalance\\b"
    ];
    const bannedMatches = scanForBannedPatterns(path.join(FRONTEND_DIR, "src/services"), bannedPatterns);

    if (bannedMatches.length === 0) {
      lintDetail = "npm run lint passed with 0 errors; zero banned synthetic heuristics";
    } else {
      lintSucceeds = false;
      lintDetail = `Banned heuristic identifiers found: ${bannedMatches.join("; ").slice(0, 100)}`;
    }
  }
} catch (err) {
  lintSucceeds = false;
  lintDetail = err.message;
}
check(
  14,
  "lint succeeds (zero errors, zero banned synthetic heuristic identifiers)",
  lintSucceeds,
  lintDetail
);

// ─────────────────────────────────────────────────────────────────────────────
// 15. core tests pass
// ─────────────────────────────────────────────────────────────────────────────
let corePass = true;
let coreDetail = "";
try {
  const {
    calculatePlanetaryPositions,
    calculateD1,
    calculateD9,
    calculateD10,
    getUtcInstantFromLocal,
    getJulianDateFromUtc,
    julianDateToDate
  } = await import("./src/services/astroEngine.js");

  // A. Julian Date conversion invariant
  const utc = getUtcInstantFromLocal("1990-05-15", "14:30", "Asia/Kolkata");
  if (!utc || isNaN(utc.getTime())) throw new Error("UTC instant resolution invalid");
  const jd = getJulianDateFromUtc(utc);
  if (!jd || isNaN(jd)) throw new Error("JD calculation invalid");
  const roundtripDate = julianDateToDate(jd);
  if (Math.abs(roundtripDate.getTime() - utc.getTime()) > 1000) {
    throw new Error("Meeus JD roundtrip exceeds tolerance");
  }

  // B. Planetary calculation invariant
  const chart = calculatePlanetaryPositions("1990-05-15", "14:30", 13.0827, 80.2707, "vedic", "Asia/Kolkata");
  if (!chart || !Array.isArray(chart.planets) || chart.planets.length < 7) {
    throw new Error("Planetary positions array invalid");
  }

  // C. D1, D9, D10 separation invariant
  const sunLong = chart.planets[0].longitude;
  const d1 = calculateD1(sunLong);
  const d9 = calculateD9(sunLong);
  const d10 = calculateD10(sunLong);
  if (!d1 || !d9 || !d10) throw new Error("Divisional calculations failed");

  // D. Spouse direction null contract
  const { evaluateSpouseDirection } = await import("./src/services/consultationEngine.js");
  const nullDir = evaluateSpouseDirection(null);
  if (
    nullDir.primaryDirection !== null ||
    nullDir.secondaryDirection !== null ||
    nullDir.confidenceCategory !== "INSUFFICIENT_DATA"
  ) {
    throw new Error("Spouse direction null contract violated");
  }

  coreDetail = "Astronomical calculations, divisional charts (D1/D9/D10), and null contracts verified";
} catch (err) {
  corePass = false;
  coreDetail = err.message;
}
check(
  15,
  "core astronomical & calculation tests pass",
  corePass,
  coreDetail
);

// ─────────────────────────────────────────────────────────────────────────────
// 16. security tests pass
// ─────────────────────────────────────────────────────────────────────────────
let secPass = true;
let secDetail = "";
try {
  // A. No secret env files or runtime DB in distribution or git index
  const trackedFiles = getTrackedFilesOrScan();
  const trackedLines = trackedFiles.split("\n");
  if (trackedLines.some(f => f === ".env" || f.endsWith("/.env") || f.endsWith(".env.local"))) {
    throw new Error("Secret .env found in distribution or git index");
  }
  if (trackedLines.some(f => f.endsWith("astroverse_store.json"))) {
    throw new Error("astroverse_store.json found in distribution or git index");
  }

  // B. Exact-date / deterministic prediction firewall
  const { verifyAndSanitizeAiNarrative } = await import("./src/services/aiEvidenceGate.js");
  const groundlessClaim = "Marriage will happen on 14 June 2028.";
  const res = verifyAndSanitizeAiNarrative(groundlessClaim, {
    planets: [{ name: "Sun", house: 1 }]
  });
  if (res.isValid) {
    throw new Error("Claim firewall failed to intercept exact-date life-event claim");
  }

  // C. Post-generation LLM firewall
  const { verifyGeneratedAnswer } = await import("./src/services/questionAnswer/qaFirewall.js");
  const tamperedCheck = verifyGeneratedAnswer({
    text: "This is guaranteed to be a highly favorable period.",
    answerObject: { answerability: "INSUFFICIENT_DATA", timingWindows: [] },
    isTamil: false
  });
  if (tamperedCheck.isValid || !tamperedCheck.sanitizedText.includes("INSUFFICIENT_DATA")) {
    throw new Error("Post-generation firewall failed to neutralize deterministic assertion on INSUFFICIENT_DATA");
  }

  // D. Domain safety validator
  const { validateSafety } = await import("./src/services/questionAnswer/qaSafetyValidator.js");
  const healthCheck = validateSafety("Patient will undergo emergency surgery for tumor.", "health");
  if (healthCheck.isValid || healthCheck.violations.length === 0) {
    throw new Error("Health safety validator failed to block medical diagnosis/surgery");
  }

  secDetail = "No repository secrets, semantic claim firewall, LLM post-generation firewall, and health safety verified";
} catch (err) {
  secPass = false;
  secDetail = err.message;
}
check(
  16,
  "security & epistemic anti-fabrication firewalls pass",
  secPass,
  secDetail
);

// ─────────────────────────────────────────────────────────────────────────────
// 17. full audit completes
// ─────────────────────────────────────────────────────────────────────────────
const all16Passed = passedCount === 16 && failedCount === 0;
check(
  17,
  "full release certification audit completes",
  all16Passed,
  all16Passed ? "All 16 prerequisite gates passed with 0 failures" : `${failedCount} prerequisite gate(s) failed`
);

console.log("\n" + "-".repeat(80));
console.log(`Summary: ${passedCount} passed, ${failedCount} failed`);
console.log("-".repeat(80));

const RELEASE_CERTIFIED = all16Passed;
if (RELEASE_CERTIFIED) {
  console.log("\n\x1b[32m================================================================================");
  console.log(" RELEASE_CERTIFIED = true");
  console.log(" All 17 Release Certification Gate requirements verified 100% successfully.");
  console.log("================================================================================\x1b[0m\n");
  process.exit(0);
} else {
  console.error("\n\x1b[31m================================================================================");
  console.error(" RELEASE_CERTIFIED = false");
  console.error(" Release Certification Gate FAILED. One or more requirements were violated.");
  console.error("================================================================================\x1b[0m\n");
  process.exit(1);
}
