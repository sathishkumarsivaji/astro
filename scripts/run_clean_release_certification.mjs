/**
 * ASTROVERSE — Isolated Clean Environment Release Certification Runner
 * ======================================================================
 * MANDATORY REQUIREMENT 1:
 * - Creates an isolated, clean temporary directory.
 * - Extracts clean repository source tree (via git archive / tracked files) without node_modules or uncommitted drift.
 * - Executes npm ci in the isolated clean environment (never skipping npm ci).
 * - Executes npm run lint, npm run build, and all mandatory test suites.
 * - Executes 17-point release certification gate.
 * - Explicitly distinguishes HISTORICAL_ARTIFACT from LIVE_CERTIFIED.
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

console.log("\n" + "=".repeat(80));
console.log(" ASTROVERSE — ISOLATED CLEAN RELEASE CERTIFICATION RUNNER");
console.log("=".repeat(80) + "\n");

const timestamp = Date.now();
const tempBase = path.join(os.tmpdir(), `astro_clean_cert_${timestamp}`);
fs.mkdirSync(tempBase, { recursive: true });

console.log(`[1] Created isolated clean sandbox at:\n    ${tempBase}\n`);

let certificationStatus = "FAILED";
let certificationStage = "INIT";

try {
  // Step 1: Export clean repository archive (zero node_modules, zero untracked drift)
  certificationStage = "GIT_ARCHIVE";
  const zipPath = path.join(tempBase, "clean_source.zip");
  console.log("[2] Archiving clean repository source via git archive...");
  execSync(`git archive --format=zip -o "${zipPath}" HEAD`, { cwd: ROOT, stdio: "inherit" });

  // Step 2: Extract clean source to sandbox
  certificationStage = "EXTRACT_SOURCE";
  const sandboxDir = path.join(tempBase, "source");
  fs.mkdirSync(sandboxDir, { recursive: true });
  console.log(`[3] Extracting clean source into ${sandboxDir}...`);
  execSync(`tar -xf "${zipPath}" -C "${sandboxDir}"`, { stdio: "inherit" });

  const feDir = path.join(sandboxDir, "frontend");
  if (!fs.existsSync(path.join(feDir, "package.json"))) {
    throw new Error("Clean extracted source missing frontend/package.json");
  }

  // Step 3: Run npm ci strictly in clean isolated directory (no existing node_modules)
  certificationStage = "NPM_CI";
  console.log("\n[4] Executing clean 'npm ci' in isolated environment (mandatory, no cache skipping)...");
  execSync("npm ci --no-audit --prefer-offline", { cwd: feDir, stdio: "inherit" });

  // Step 4: Run static lint & heuristic compliance
  certificationStage = "NPM_RUN_LINT";
  console.log("\n[5] Executing 'npm run lint' in isolated environment...");
  execSync("npm run lint", { cwd: feDir, stdio: "inherit" });

  // Step 5: Run production build
  certificationStage = "NPM_RUN_BUILD";
  console.log("\n[6] Executing 'npm run build' in isolated environment...");
  execSync("npm run build", { cwd: feDir, stdio: "inherit" });

  // Step 6: Run mandatory regression tests
  certificationStage = "MANDATORY_TESTS";
  console.log("\n[7] Running mandatory test suites in isolated environment...");
  console.log("    - test_convention_fixtures.mjs");
  execSync("node test_convention_fixtures.mjs", { cwd: feDir, stdio: "inherit" });

  console.log("    - test_system_comparison_qa.mjs");
  execSync("node test_system_comparison_qa.mjs", { cwd: feDir, stdio: "inherit" });

  // Step 7: Run 17-point release certification gate
  certificationStage = "RELEASE_GATE";
  console.log("\n[8] Executing 17-point Release Certification Gate in isolated environment...");
  execSync("node test_release_certification_gate.mjs", { cwd: feDir, stdio: "inherit" });

  certificationStatus = "LIVE_CERTIFIED";
  console.log("\n" + "=".repeat(80));
  console.log(" ✓ ISOLATED CLEAN RELEASE CERTIFICATION PASSED: LIVE_CERTIFIED");
  console.log("   - Clean npm ci: PASS");
  console.log("   - Clean lint & build: PASS");
  console.log("   - Mandatory test suites: PASS");
  console.log("   - Release gate: PASS");
  console.log("   - Status: LIVE_CERTIFIED (NOT A STALE HISTORICAL ARTIFACT)");
  console.log("=".repeat(80) + "\n");
} catch (err) {
  certificationStatus = "FAILED";
  console.error(`\n✗ CLEAN CERTIFICATION FAILED during stage [${certificationStage}]:`, err.message);
} finally {
  console.log(`[Cleanup] Cleaning up isolated temporary directory...`);
  try {
    fs.rmSync(tempBase, { recursive: true, force: true });
    console.log(`✓ Temporary directory removed.\n`);
  } catch (cleanErr) {
    console.warn(`Notice: Could not fully delete ${tempBase}:`, cleanErr.message);
  }
}

if (certificationStatus !== "LIVE_CERTIFIED") {
  process.exit(1);
}
