/**
 * ASTROVERSE — Validation Manifest & Fixture Tamper-Evidence Integrity Suite
 *
 * Verifies that:
 * 1. The independent Swiss Ephemeris reference fixture file exists and is intact.
 * 2. The SHA-256 digest of `test_fixtures/swiss_ephemeris_2_10_03_reference.json`
 *    strictly equals the immutable pinned constant.
 * 3. `VALIDATION_MANIFEST.json` stores the exact identical SHA-256 digest.
 * 4. Fails CI with exit code 1 if any tamper or discrepancy is detected.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pinned, immutable SHA-256 digest of the independent Swiss Ephemeris 2.10.03 fixture
export const PINNED_SWISS_FIXTURE_SHA256 = "4dd3b7156aeeba6243e6d4eefa11be3bbf448e72b7cbbf2d71c7c8084146f70b";

const FIXTURE_PATH = path.resolve(__dirname, "test_fixtures/swiss_ephemeris_2_10_03_reference.json");
const MANIFEST_PATH = path.resolve(__dirname, "VALIDATION_MANIFEST.json");

console.log("\n" + "=".repeat(75));
console.log(" ASTROVERSE VALIDATION MANIFEST & FIXTURE INTEGRITY AUDIT");
console.log("=".repeat(75));

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    failed++;
  }
}

// 1. Fixture File Presence
assert(fs.existsSync(FIXTURE_PATH), `Swiss Ephemeris fixture exists at: ${FIXTURE_PATH}`);

// 2. Computed SHA-256 vs Pinned Constant
const fixtureRaw = fs.readFileSync(FIXTURE_PATH, "utf8").replace(/\r\n/g, "\n");
const computedFixtureSha256 = crypto.createHash("sha256").update(fixtureRaw, "utf8").digest("hex");
console.log(`• Pinned Expected SHA-256: ${PINNED_SWISS_FIXTURE_SHA256}`);
console.log(`• Computed Disk SHA-256:   ${computedFixtureSha256}`);

assert(
  computedFixtureSha256 === PINNED_SWISS_FIXTURE_SHA256,
  "Disk fixture SHA-256 strictly equals pinned expected constant (zero tampering, LF-normalized)"
);

// 3. Manifest File Presence
assert(fs.existsSync(MANIFEST_PATH), `VALIDATION_MANIFEST.json exists at: ${MANIFEST_PATH}`);

// 4. Manifest Stored SHA-256 vs Pinned Constant
const manifestRaw = fs.readFileSync(MANIFEST_PATH, "utf8");
const manifest = JSON.parse(manifestRaw);
const manifestStoredSha = manifest.benchmarkDatasets?.independentSwissReference?.sha256;
console.log(`• Manifest Stored SHA-256: ${manifestStoredSha}`);

assert(
  manifestStoredSha === PINNED_SWISS_FIXTURE_SHA256,
  "VALIDATION_MANIFEST.json contains exact identical fixture SHA-256"
);

// 5. Verification of Provenance Source String
const provenanceSource = manifest.benchmarkDatasets?.independentSwissReference?.provenance;
assert(
  provenanceSource && !provenanceSource.includes("DE431") && provenanceSource.includes("Moshier/Swiss"),
  "Manifest provenance accurately reflects Moshier/Swiss fallback source without unverified DE431 claim"
);

console.log("=".repeat(75));
if (failed === 0) {
  console.log(` ALL ${passed} MANIFEST & FIXTURE INTEGRITY CHECKS PASSED 100%!`);
  process.exit(0);
} else {
  console.error(` INTEGRITY FAILURE: ${failed} checks failed!`);
  process.exit(1);
}
