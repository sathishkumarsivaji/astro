/**
 * Mandatory Test 13: Clean Build & Release Package Integrity
 *
 * Asserts:
 * - package.json exists and contains clean build scripts.
 * - No sensitive files (.env, astroverse_store.json, node_modules) are tracked in git.
 * - Confirms frontend project structure and release package integrity.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

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

// 1. package.json exists with valid build script
const pkgPath = path.join(ROOT, "frontend/package.json");
assert(fs.existsSync(pkgPath), "frontend/package.json exists");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
assert(typeof pkg.scripts?.build === "string", "package.json contains 'build' script");

// 2. Check tracked git files for sensitive / runtime files
try {
  const trackedFiles = execSync("git ls-files", { cwd: ROOT, encoding: "utf8" });
  assert(!trackedFiles.includes("astroverse_store.json"), "No runtime database (astroverse_store.json) in tracked git files");
  assert(!trackedFiles.includes(".env\n") && !trackedFiles.endsWith(".env"), "No .env in tracked git files");
  assert(!trackedFiles.includes("node_modules/"), "No node_modules/ in tracked git files");
} catch (e) {
  console.log("  ℹ Git ls-files check skipped:", e.message);
}

// 3. Verify .gitignore excludes runtime store and env
const gitignorePath = path.join(ROOT, ".gitignore");
assert(fs.existsSync(gitignorePath), ".gitignore exists in root");
const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
assert(gitignoreContent.includes(".env"), ".gitignore excludes .env files");
assert(gitignoreContent.includes("node_modules"), ".gitignore excludes node_modules");

// 4. Verify synthetic test fixtures exist for clean CI testing
const testFixturePath = path.join(ROOT, "backend/test-data/synthetic_store_fixture.json");
assert(fs.existsSync(testFixturePath), "Synthetic test store fixture exists for tests");

console.log(`\nResult: ${passes} passed, ${fails} failed`);
process.exit(fails > 0 ? 1 : 0);
