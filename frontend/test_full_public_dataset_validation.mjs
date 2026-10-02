/**
 * Mandatory Test 1: Full Public Dataset Validation
 *
 * Asserts:
 * - 15,807 raw rows ingested
 * - dataset_manifest.json exists with non-empty SHA-256 hashes
 * - DATA_QUALITY_EXCLUDED records are quarantined in excluded_dataset.json (not deleted)
 * - Manifest counts accurately match the datasets
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const MANIFEST_PATH = path.join(ROOT, "data/real_world_validation/dataset_manifest.json");
const PROCESSED_PATH = path.join(ROOT, "data/real_world_validation/processed/real_world_validation_dataset.json");
const EXCLUDED_PATH = path.join(ROOT, "data/real_world_validation/processed/excluded_dataset.json");
const UNKNOWN_PATH = path.join(ROOT, "data/real_world_validation/processed/unknown_dataset.json");

console.log("\n" + "=".repeat(70));
console.log(" TEST 1: FULL PUBLIC DATASET VALIDATION & PROVENANCE INTEGRITY");
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

// 1. Manifest exists
assert(fs.existsSync(MANIFEST_PATH), "dataset_manifest.json exists on disk");
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));

// 2. SHA-256 hashes present
assert(manifest.sourceDatasets?.[0]?.sha256?.length === 64, "Raw PersonList SHA-256 is valid 64-char hex");
assert(manifest.sourceDatasets?.[1]?.sha256?.length === 64, "Raw MarriageInfo SHA-256 is valid 64-char hex");
assert(manifest.processedDataset?.sha256?.length === 64, "Processed Dataset SHA-256 is valid 64-char hex");

// 3. Raw rows ingested count
assert(manifest.statistics?.totalRawRows === 15807, `Raw rows ingested is exactly 15,807 (got ${manifest.statistics?.totalRawRows})`);

// 4. Excluded records are quarantined, not deleted
assert(fs.existsSync(EXCLUDED_PATH), "excluded_dataset.json exists on disk");
const excludedRecords = JSON.parse(fs.readFileSync(EXCLUDED_PATH, "utf8"));
assert(excludedRecords.length === manifest.statistics?.excludedRecords, `Quarantined excluded records match manifest count (${excludedRecords.length})`);
assert(excludedRecords.length > 0, "Quarantine contains non-zero excluded records (no silent deletion)");

for (const ex of excludedRecords.slice(0, 5)) {
  assert(ex.DATA_QUALITY_EXCLUDED === true, `Record ${ex.sourceRecordId} carries DATA_QUALITY_EXCLUDED: true`);
  assert(typeof ex.reasonCode === "string" && ex.reasonCode.length > 0, `Record ${ex.sourceRecordId} has explicit reasonCode: ${ex.reasonCode}`);
}

// 5. Eligible dataset records
assert(fs.existsSync(PROCESSED_PATH), "real_world_validation_dataset.json exists on disk");
const eligibleRecords = JSON.parse(fs.readFileSync(PROCESSED_PATH, "utf8"));
assert(eligibleRecords.length === manifest.statistics?.canonicalIngestedPersons, `Eligible records match manifest count (${eligibleRecords.length})`);
assert(eligibleRecords.length > 15000, `Eligible cohort is large public population (>15,000, got ${eligibleRecords.length})`);

// 6. Conservation of total records
const unknownRecords = JSON.parse(fs.readFileSync(UNKNOWN_PATH, "utf8"));
const totalAccounted = eligibleRecords.length + excludedRecords.length + unknownRecords.length;
assert(totalAccounted === manifest.statistics?.totalRawRows, `Total accounted (${totalAccounted}) equals total raw rows (${manifest.statistics?.totalRawRows})`);

console.log(`\nResult: ${passes} passed, ${fails} failed`);
process.exit(fails > 0 ? 1 : 0);
