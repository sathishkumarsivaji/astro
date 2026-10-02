/**
 * Mandatory Test 2: External Astro-Databank Dataset Validation
 *
 * Asserts:
 * - Astro-Databank Category C sample exists in data/external_validation/astro_databank/
 * - Contains >= 4,832 A/AA rated records
 * - Provenance class is SOURCE_ASTRODATABANK
 * - Manifest exists with matching SHA-256 hash
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const DATASET_PATH = path.join(ROOT, "data/external_validation/astro_databank/astro_databank_c_sample.json");
const MANIFEST_PATH = path.join(ROOT, "data/external_validation/astro_databank/astro_databank_manifest.json");

console.log("\n" + "=".repeat(70));
console.log(" TEST 2: INDEPENDENT ASTRO-DATABANK EXTERNAL DATASET VALIDATION");
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

// 1. Files exist
assert(fs.existsSync(DATASET_PATH), "astro_databank_c_sample.json exists");
assert(fs.existsSync(MANIFEST_PATH), "astro_databank_manifest.json exists");

const datasetRaw = fs.readFileSync(DATASET_PATH);
const dataset = JSON.parse(datasetRaw);
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));

// 2. Hash integrity
const computedSha256 = crypto.createHash("sha256").update(datasetRaw).digest("hex");
assert(computedSha256 === manifest.sha256, `Dataset SHA-256 matches manifest (${computedSha256.slice(0, 16)}...)`);

// 3. Size and Rodden Rating breakdown
assert(dataset.length === manifest.totalRecords, `Total records match manifest (${dataset.length})`);
assert(dataset.length >= 5000, `Dataset contains >= 5,000 records (got ${dataset.length})`);

const aOrAaRecords = dataset.filter(r => r.birthTimeReliability === "AA" || r.birthTimeReliability === "A");
assert(aOrAaRecords.length >= 4832, `Contains >= 4,832 A/AA rated records (got ${aOrAaRecords.length})`);
assert(manifest.roddenRatingBreakdown?.totalAA_A === 4832, "Manifest documents exactly 4,832 A/AA rated records");

// 4. Provenance
assert(manifest.provenanceClass === "SOURCE_ASTRODATABANK", "Manifest specifies SOURCE_ASTRODATABANK provenance");
for (const r of dataset.slice(0, 20)) {
  assert(r.sourceDataset === "SOURCE_ASTRODATABANK", `Record ${r.sourceRecordId} source dataset is SOURCE_ASTRODATABANK`);
  assert(typeof r.latitude === "number" && typeof r.longitude === "number", `Record ${r.sourceRecordId} has numeric coordinates`);
}

console.log(`\nResult: ${passes} passed, ${fails} failed`);
process.exit(fails > 0 ? 1 : 0);
