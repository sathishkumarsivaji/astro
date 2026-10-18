/**
 * ASTROVERSE — Clean Environment Preparation Script
 * ===================================================
 * 
 * Prepares clean dependencies for both frontend and backend:
 * - Runs `npm ci --no-audit --no-fund` for frontend.
 * - Runs `npm ci --no-audit --no-fund` for backend.
 * - Verifies presence of all required packages and binaries.
 * - Emits machine-readable ENVIRONMENT_PREPARATION_LOG.json.
 * 
 * Usage:
 *   node scripts/prepare_environment.mjs
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

console.log("\n" + "=".repeat(70));
console.log(" ASTROVERSE — ENVIRONMENT PREPARATION RUNNER (npm ci)");
console.log("=".repeat(70) + "\n");

const startTime = new Date().toISOString();
const log = {
  startedAt: startTime,
  nodeVersion: process.version,
  platform: process.platform,
  arch: process.arch,
  frontend: { status: "PENDING", exitCode: null, durationMs: 0 },
  backend: { status: "PENDING", exitCode: null, durationMs: 0 },
  verification: { success: false, missingPackages: [], missingBinaries: [] },
  completedAt: null,
  overallSuccess: false
};

const requiredFrontendPackages = [
  "astronomy-engine",
  "react",
  "react-dom",
  "lucide-react",
  "jspdf",
  "dompurify",
  "vite",
  "oxlint"
];

const requiredBackendPackages = [
  "express",
  "geo-tz",
  "helmet",
  "pg",
  "web-push",
  "dotenv",
  "cors"
];

try {
  // 1. Frontend npm ci
  console.log("[1/3] Installing frontend dependencies via npm ci...");
  const t0Fe = Date.now();
  try {
    execSync("npm ci --no-audit --no-fund", { cwd: FRONTEND_DIR, stdio: "inherit" });
    log.frontend.status = "SUCCESS";
    log.frontend.exitCode = 0;
  } catch (err) {
    log.frontend.status = "FAILED";
    log.frontend.exitCode = err.status || 1;
    log.frontend.error = err.message;
    console.error("Frontend npm ci failed:", err.message);
  }
  log.frontend.durationMs = Date.now() - t0Fe;

  // 2. Backend npm ci
  console.log("\n[2/3] Installing backend dependencies via npm ci...");
  const t0Be = Date.now();
  try {
    execSync("npm ci --no-audit --no-fund", { cwd: BACKEND_DIR, stdio: "inherit" });
    log.backend.status = "SUCCESS";
    log.backend.exitCode = 0;
  } catch (err) {
    log.backend.status = "FAILED";
    log.backend.exitCode = err.status || 1;
    log.backend.error = err.message;
    console.error("Backend npm ci failed:", err.message);
  }
  log.backend.durationMs = Date.now() - t0Be;

  // 3. Dependency & Binary Verification
  console.log("\n[3/3] Verifying installed packages and binaries...");
  const missingPkgs = [];
  const missingBins = [];

  for (const pkg of requiredFrontendPackages) {
    if (!fs.existsSync(path.join(FRONTEND_DIR, "node_modules", pkg, "package.json"))) {
      missingPkgs.push(`frontend:${pkg}`);
    }
  }

  const binDir = path.join(FRONTEND_DIR, "node_modules", ".bin");
  const requiredBins = process.platform === "win32" ? ["vite.cmd", "oxlint.cmd"] : ["vite", "oxlint"];
  for (const bin of requiredBins) {
    if (!fs.existsSync(path.join(binDir, bin))) {
      missingBins.push(bin);
    }
  }

  for (const pkg of requiredBackendPackages) {
    if (!fs.existsSync(path.join(BACKEND_DIR, "node_modules", pkg, "package.json"))) {
      missingPkgs.push(`backend:${pkg}`);
    }
  }

  log.verification.missingPackages = missingPkgs;
  log.verification.missingBinaries = missingBins;
  log.verification.success = (missingPkgs.length === 0 && missingBins.length === 0);

  if (log.verification.success && log.frontend.status === "SUCCESS" && log.backend.status === "SUCCESS") {
    log.overallSuccess = true;
    console.log("\n✓ All frontend and backend dependencies cleanly prepared and verified.");
  } else {
    log.overallSuccess = false;
    console.error("\n✗ Verification failed.");
    if (missingPkgs.length > 0) console.error("  Missing packages:", missingPkgs);
    if (missingBins.length > 0) console.error("  Missing binaries:", missingBins);
  }

} catch (globalErr) {
  log.overallSuccess = false;
  log.globalError = globalErr.message;
  console.error("Preparation crashed:", globalErr.message);
} finally {
  log.completedAt = new Date().toISOString();
  const logPath = path.join(ROOT, "ENVIRONMENT_PREPARATION_LOG.json");
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2), "utf8");
  console.log(`\nLog written to ${logPath}`);
  console.log("=".repeat(70) + "\n");
  if (!log.overallSuccess) {
    process.exit(1);
  }
}
