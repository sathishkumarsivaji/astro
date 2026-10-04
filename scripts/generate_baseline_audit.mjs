/**
 * ASTROVERSE — Phase 1 Baseline Freeze and Audit
 *
 * 1. Hashes complete source tree.
 * 2. Hashes all validation datasets.
 * 3. Hashes all model/calibration artifacts.
 * 4. Hashes the current prediction engine.
 * 5. Preserves historical validation reports without overwriting.
 * 6. Generates machine-readable baseline audit manifest.
 * 7. Records every current metric without modification.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execSync } from "child_process";

const ROOT = process.cwd();
const auditDir = path.join(ROOT, "data", "real_world_validation", "baseline_audit");
if (!fs.existsSync(auditDir)) {
  fs.mkdirSync(auditDir, { recursive: true });
}

function hashFile(p) {
  if (!fs.existsSync(p)) return null;
  const content = fs.readFileSync(p);
  return crypto.createHash("sha256").update(content).digest("hex");
}

function hashDirectory(dir, exts = [".js", ".mjs", ".json"]) {
  let entries = [];
  function walk(d) {
    if (!fs.existsSync(d)) return;
    for (const f of fs.readdirSync(d)) {
      if (f === "node_modules" || f === ".git" || f === "dist" || f === "baseline_audit" || f === "cache") continue;
      const fp = path.join(d, f);
      const stat = fs.statSync(fp);
      if (stat.isDirectory()) {
        walk(fp);
      } else if (exts.some(ext => f.endsWith(ext))) {
        const h = hashFile(fp);
        const rel = path.relative(ROOT, fp).replace(/\\/g, "/");
        entries.push({ path: rel, hash: h, bytes: stat.size });
      }
    }
  }
  walk(dir);
  entries.sort((a, b) => a.path.localeCompare(b.path));
  const combined = entries.map(e => `${e.hash}  ${e.path}`).join("\n");
  const treeHash = crypto.createHash("sha256").update(combined).digest("hex");
  return { treeHash, fileCount: entries.length, files: entries };
}

let gitCommit = "UNKNOWN";
try {
  gitCommit = execSync("git rev-parse HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
} catch (e) {
  // ignore
}

console.log("Hashing trees...");
const srcTree = hashDirectory(path.join(ROOT, "frontend", "src"));
const testTree = hashDirectory(path.join(ROOT, "frontend"), [".mjs"]);
const backendTree = hashDirectory(path.join(ROOT, "backend", "src"));

const keyFiles = {
  astroEngine: "frontend/src/services/astroEngine.js",
  empiricalEvaluationEngine: "frontend/src/services/realWorldValidation/empiricalEvaluationEngine.js",
  discreteHazardSurvivalEngine: "frontend/src/services/realWorldValidation/discreteHazardSurvivalEngine.js",
  calibrationProvider: "frontend/src/services/realWorldValidation/calibrationProvider.js",
  predictionCacheManager: "frontend/src/services/realWorldValidation/predictionCacheManager.js",
  calibrationModel: "data/real_world_validation/results/calibration_model.json",
  benchmarkResults: "data/real_world_validation/results/benchmark_results.json",
  astroDatabankExternalBenchmark: "data/real_world_validation/results/astro_databank_external_benchmark.json",
  externalValidationReport: "data/real_world_validation/results/external_validation_report.json",
  trainSplit: "data/real_world_validation/splits/train_split.json",
  valSplit: "data/real_world_validation/splits/val_split.json",
  blindTestSplit: "data/real_world_validation/splits/blind_test_split.json",
  internalHoldoutSplit: "data/real_world_validation/splits/internal_holdout_split.json",
  astroDatabankTrueIndependent: "data/real_world_validation/processed/astro_databank_true_independent.json",
  datasetOverlapManifest: "data/real_world_validation/processed/dataset_overlap_manifest.json"
};

const fileHashes = {};
for (const [k, relPath] of Object.entries(keyFiles)) {
  const fp = path.join(ROOT, relPath);
  fileHashes[k] = {
    path: relPath,
    exists: fs.existsSync(fp),
    sha256: hashFile(fp),
    bytes: fs.existsSync(fp) ? fs.statSync(fp).size : 0
  };
}

// Archive historical reports and benchmark JSONs into baseline_audit
const filesToArchive = [
  { src: "ASTROVERSE_FINAL_VALIDATION_REPORT.md", dest: "ASTROVERSE_FINAL_VALIDATION_REPORT.baseline.md" },
  { src: "ASTROVERSE_REAL_WORLD_VALIDATION_REPORT.md", dest: "ASTROVERSE_REAL_WORLD_VALIDATION_REPORT.baseline.md" },
  { src: "data/real_world_validation/results/benchmark_results.json", dest: "benchmark_results.baseline.json" },
  { src: "data/real_world_validation/results/calibration_model.json", dest: "calibration_model.baseline.json" },
  { src: "data/real_world_validation/results/astro_databank_external_benchmark.json", dest: "astro_databank_external_benchmark.baseline.json" },
  { src: "data/real_world_validation/results/external_validation_report.json", dest: "external_validation_report.baseline.json" }
];

for (const item of filesToArchive) {
  const sp = path.join(ROOT, item.src);
  const dp = path.join(auditDir, item.dest);
  if (fs.existsSync(sp)) {
    fs.copyFileSync(sp, dp);
    console.log("Archived:", item.src, "->", item.dest);
  }
}

// Read current benchmark metrics without modification
let currentMetrics = null;
const benchPath = path.join(ROOT, "data/real_world_validation/results/benchmark_results.json");
if (fs.existsSync(benchPath)) {
  const parsed = JSON.parse(fs.readFileSync(benchPath, "utf8"));
  currentMetrics = {
    generatedAt: parsed.generatedAt,
    v3DiscreteHazardModel: parsed.v3DiscreteHazardModel ? {
      sampleSize: parsed.v3DiscreteHazardModel.sampleSize,
      events: parsed.v3DiscreteHazardModel.events,
      logLikelihood: parsed.v3DiscreteHazardModel.logLikelihood,
      aic: parsed.v3DiscreteHazardModel.aic,
      bic: parsed.v3DiscreteHazardModel.bic,
      coefficients: parsed.v3DiscreteHazardModel.coefficients,
      concordanceIndex: parsed.v3DiscreteHazardModel.concordanceIndex,
      maeTimingYears: parsed.v3DiscreteHazardModel.maeTimingYears,
      ablationStudy: parsed.v3DiscreteHazardModel.ablationStudy
    } : null,
    evaluation: parsed.evaluation
  };
}

const auditManifest = {
  manifestVersion: "1.0.0",
  phase: "PHASE_1_BASELINE_FREEZE",
  timestamp: new Date().toISOString(),
  gitCommit,
  sourceTree: {
    frontendSrcHash: srcTree.treeHash,
    frontendSrcFiles: srcTree.fileCount,
    frontendTestHash: testTree.treeHash,
    frontendTestFiles: testTree.fileCount,
    backendSrcHash: backendTree.treeHash,
    backendSrcFiles: backendTree.fileCount
  },
  fileHashes,
  archivedFiles: filesToArchive.map(f => f.dest),
  recordedBaselineMetrics: currentMetrics
};

const auditManifestPath = path.join(auditDir, "baseline_audit_manifest.json");
fs.writeFileSync(auditManifestPath, JSON.stringify(auditManifest, null, 2), "utf8");
console.log("✓ Phase 1 Baseline Audit Complete. Manifest written to:", auditManifestPath);
