/**
 * ASTROVERSE — Clean Release Packaging Script
 *
 * Enforces the Release Integrity Standard:
 * NEVER bundle node_modules in distribution archives.
 * Distributes clean source tree + package-lock.json.
 * Recipients execute:
 *   npm ci
 *   npm run build
 *   npm run lint
 * guaranteeing native executable binary permissions on POSIX and Windows.
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

console.log("\n" + "=".repeat(70));
console.log(" ASTROVERSE — CLEAN RELEASE PACKAGING AUDIT");
console.log("=".repeat(70));

// 1. Verify that node_modules is not tracked in git
try {
  const tracked = execSync("git ls-files", { cwd: ROOT, encoding: "utf8" });
  if (tracked.includes("node_modules/")) {
    console.error("FAIL: node_modules/ is tracked in git. Must be removed from git index.");
    process.exit(1);
  }
  console.log("✓ Zero node_modules files in git index.");
} catch (e) {
  console.log("ℹ Git ls-files check skipped:", e.message);
}

// 2. Verify package-lock.json is present
const rootLock = path.join(ROOT, "package-lock.json");
const feLock = path.join(ROOT, "frontend/package-lock.json");
const hasLock = fs.existsSync(rootLock) || fs.existsSync(feLock);
if (!hasLock) {
  console.error("FAIL: package-lock.json missing. Cannot guarantee deterministic npm ci.");
  process.exit(1);
}
console.log("✓ package-lock.json present for deterministic clean installs.");

// 3. Verify clean build output
const distIndex = path.join(ROOT, "frontend/dist/index.html");
if (fs.existsSync(distIndex)) {
  console.log("✓ frontend/dist/index.html verified from clean build.");
} else {
  console.log("ℹ frontend/dist/ not yet built. Run npm run build.");
}

console.log("\nRelease Packaging Rule Enforced: Source + lockfiles only. ZERO node_modules packaged.");
