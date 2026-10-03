/**
 * Mandatory Integrity Test: Verify External Dataset is NOT Synthetic
 * 
 * Requirement 1:
 * - The external dataset must contain ONLY records actually imported from official Astro-Databank public C export.
 * - It must fail if records contain generated identifiers such as:
 *   "AstroDatabank Public Case" or deterministic synthetic marriage formulas.
 * - Zero tolerance for synthetic records posing as public external records.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const DATASET_PATH = path.join(ROOT, 'data/external_validation/astro_databank/astro_databank_c_sample.json');
const MANIFEST_PATH = path.join(ROOT, 'data/external_validation/astro_databank/astro_databank_manifest.json');

console.log('\n' + '='.repeat(70));
console.log(' INTEGRITY TEST: EXTERNAL DATASET IS NOT SYNTHETIC');
console.log('='.repeat(70));

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

assert(fs.existsSync(DATASET_PATH), 'Dataset file exists');
assert(fs.existsSync(MANIFEST_PATH), 'Manifest file exists');

const raw = fs.readFileSync(DATASET_PATH, 'utf8');
const dataset = JSON.parse(raw);
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

// 1. Check for prohibited synthetic strings in raw JSON
assert(!raw.includes('AstroDatabank Public Case'), 'No "AstroDatabank Public Case" placeholder names found');
assert(!raw.includes('Spouse ADB'), 'No "Spouse ADB" placeholder spouses found');

// 2. Scan every record for synthetic patterns
let syntheticIdCount = 0;
let syntheticFormulaCount = 0;
let validAdbIdCount = 0;
let genuineNameCount = 0;

for (const r of dataset) {
  if (r.name && (r.name.includes('AstroDatabank Public Case') || /public case\s*\d+/i.test(r.name))) {
    syntheticIdCount++;
  }
  if (r.adbId && typeof r.adbId === 'number' && r.adbId > 0) {
    validAdbIdCount++;
  }
  if (r.name && r.name !== 'Unknown' && !r.name.startsWith('ADB_')) {
    genuineNameCount++;
  }
  // Check for deterministic synthetic marriage formula: mAge = 20 + (idx % 15) with June 15
  if (r.marriages) {
    for (const m of r.marriages) {
      if (m.marriageDate && m.marriageDate.endsWith('-06-15') && m.spouse && m.spouse.startsWith('Spouse ADB')) {
        syntheticFormulaCount++;
      }
    }
  }
}

assert(syntheticIdCount === 0, `Zero synthetic placeholder names (got ${syntheticIdCount})`);
assert(syntheticFormulaCount === 0, `Zero synthetic marriage formulas (got ${syntheticFormulaCount})`);
assert(validAdbIdCount === dataset.length, `All ${dataset.length} records have valid numerical ADB IDs`);
assert(genuineNameCount >= 5800, `At least 5,800 records have genuine public names (got ${genuineNameCount})`);

// 3. Verify Rodden rating distribution is from authentic public export
assert(manifest.roddenRatingBreakdown?.AA >= 3600, `Authentic AA rating count >= 3,600 (got ${manifest.roddenRatingBreakdown?.AA})`);
assert(manifest.roddenRatingBreakdown?.totalAA_A >= 4832, `Authentic A/AA rating count >= 4,832 (got ${manifest.roddenRatingBreakdown?.totalAA_A})`);

console.log(`\nResult: ${passes} passed, ${fails} failed`);
process.exit(fails > 0 ? 1 : 0);
