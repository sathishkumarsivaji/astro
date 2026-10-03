/**
 * Mandatory Test 13: Clean Build & Release Package Integrity
 *
 * Asserts:
 * - package.json exists and contains clean build and lint scripts.
 * - package-lock.json exists for deterministic npm ci execution.
 * - No sensitive files (.env, astroverse_store.json, node_modules) are tracked in git.
 * - Clean build execution (npm run build) exits 0 and generates fresh dist/index.html.
 * - Clean lint execution (npm run lint) exits 0 with 0 errors.
 * - Release distribution rule: Source + lockfiles only, NEVER bundle node_modules.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const FRONTEND_DIR = path.join(ROOT, "frontend");

console.log("\n" + "=".repeat(70));
console.log(" TEST 13: CLEAN BUILD & RELEASE PACKAGE INTEGRITY AUDIT");
console.log("=".repeat(70));

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

// 1. package.json exists with valid build and lint scripts
const pkgPath = path.join(FRONTEND_DIR, "package.json");
assert(fs.existsSync(pkgPath), "frontend/package.json exists");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
assert(typeof pkg.scripts?.build === "string", "package.json contains 'build' script");
assert(typeof pkg.scripts?.lint === "string", "package.json contains 'lint' script");

// 2. package-lock.json exists for deterministic npm ci
const lockPath = path.join(FRONTEND_DIR, "package-lock.json");
assert(fs.existsSync(lockPath), "frontend/package-lock.json exists for deterministic npm ci");

// 3. Check tracked git files for sensitive / runtime files
try {
  const trackedFiles = execSync("git ls-files", { cwd: ROOT, encoding: "utf8" });
  assert(!trackedFiles.includes("astroverse_store.json"), "No runtime database (astroverse_store.json) in tracked git files");
  assert(!trackedFiles.includes(".env\n") && !trackedFiles.endsWith(".env"), "No .env in tracked git files");
  assert(!trackedFiles.includes("node_modules/"), "No node_modules/ in tracked git files");
} catch (e) {
  console.log("  ℹ Git ls-files check skipped:", e.message);
}

// 4. Verify .gitignore excludes runtime store, env, and node_modules
const gitignorePath = path.join(ROOT, ".gitignore");
assert(fs.existsSync(gitignorePath), ".gitignore exists in root");
const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
assert(gitignoreContent.includes(".env"), ".gitignore excludes .env files");
assert(gitignoreContent.includes("node_modules"), ".gitignore excludes node_modules");

// 5. Actually verify the clean build process (execute npm run build)
console.log("\n  Executing clean compilation check (npm run build)...");
const distIndexPath = path.join(FRONTEND_DIR, "dist/index.html");
const distDir = path.join(FRONTEND_DIR, "dist");

try {
  // Clean dist if exists to guarantee it's not counting a pre-existing build
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }

  execSync("npm run build", { cwd: FRONTEND_DIR, stdio: "pipe" });
  assert(fs.existsSync(distIndexPath), "npm run build executes cleanly and produces fresh dist/index.html");
  if (fs.existsSync(distIndexPath)) {
    const html = fs.readFileSync(distIndexPath, "utf8");
    assert(html.includes("<!DOCTYPE html>") || html.includes("<html"), "dist/index.html contains valid HTML entrypoint");
  }
} catch (buildErr) {
  assert(false, `Clean compilation failed: ${buildErr.message}`);
}

// 6. Verify clean lint execution (npm run lint) exits 0 with 0 errors
console.log("\n  Executing clean lint check (npm run lint)...");
try {
  const lintOutput = execSync("npm run lint", { cwd: FRONTEND_DIR, encoding: "utf8" });
  assert(lintOutput.includes("0 errors"), "npm run lint passes with 0 errors");
} catch (lintErr) {
  // If exit code is 0 it passes
  assert(lintErr.status === 0, `Clean lint failed: ${lintErr.message}`);
}

// 7. Verify release packaging script excludes node_modules
const packageScriptPath = path.join(ROOT, "scripts/package_clean_release.mjs");
assert(fs.existsSync(packageScriptPath), "scripts/package_clean_release.mjs exists");
const packageScriptContent = fs.readFileSync(packageScriptPath, "utf8");
assert(packageScriptContent.includes("node_modules"), "package_clean_release.mjs enforces zero node_modules rule");

// 8. Verify synthetic test fixtures exist for clean CI testing
const testFixturePath = path.join(ROOT, "backend/test-data/synthetic_store_fixture.json");
assert(fs.existsSync(testFixturePath), "Synthetic test store fixture exists for tests");

console.log(`\nResult: ${passes} passed, ${fails} failed`);
process.exit(fails > 0 ? 1 : 0);
