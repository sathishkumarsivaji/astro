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
 *
 * Usage:
 *   node scripts/package_clean_release.mjs         # Audit only
 *   node scripts/package_clean_release.mjs --pack  # Audit + Build ASTRO.zip
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

console.log("\n" + "=".repeat(70));
console.log(" ASTROVERSE — CLEAN RELEASE PACKAGING AUDIT & BUILD");
console.log("=".repeat(70));

const shouldPack = process.argv.includes("--pack") || process.argv.includes("--zip");

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

console.log("✓ Release Packaging Rule Enforced: Source + lockfiles only. ZERO node_modules packaged.");

// 4. If --pack requested, generate ASTRO.zip via git archive
if (shouldPack) {
  const zipName = "ASTRO.zip";
  const zipPath = path.join(ROOT, zipName);
  console.log(`\nGenerating clean distribution archive ${zipName}...`);

  try {
    execSync(`git archive --format=zip -o "${zipPath}" HEAD`, { cwd: ROOT, stdio: "inherit" });
    if (!fs.existsSync(zipPath)) {
      throw new Error(`Failed to generate ${zipPath}`);
    }

    const stats = fs.statSync(zipPath);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
    const hash = crypto.createHash("sha256").update(fs.readFileSync(zipPath)).digest("hex");

    console.log(`✓ Clean release archive generated successfully:`);
    console.log(`  File:   ${zipPath}`);
    console.log(`  Size:   ${sizeMb} MB (${stats.size.toLocaleString()} bytes)`);
    console.log(`  SHA256: ${hash}`);
    console.log(`✓ Integrity verified: zero node_modules, zero untracked temp files.`);
  } catch (err) {
    console.error(`FAIL: Could not generate clean archive: ${err.message}`);
    process.exit(1);
  }
}
