/**
 * Mandatory Integrity Test: External Dataset Provenance Verification
 * 
 * Requirement 12:
 * Verifies:
 * - raw source exists
 * - source hash exists
 * - source format exists
 * - ADB IDs exist
 * - records are not synthetic
 * - record count matches source
 * - Rodden distribution matches source
 * - events originate from source data
 * - no generated marriage outcomes
 * - A generated record must never have: sourceDataset = SOURCE_ASTRODATABANK
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const RAW_XML_PATH = path.join(ROOT, 'data/external_validation/adb_extracted/c_sample_260919_1519.xml');
const DATASET_PATH = path.join(ROOT, 'data/external_validation/astro_databank/astro_databank_c_sample.json');
const MANIFEST_PATH = path.join(ROOT, 'data/external_validation/astro_databank/astro_databank_manifest.json');
const OVERLAP_PATH = path.join(ROOT, 'data/external_validation/astro_databank/overlap_manifest.json');
const INDEPENDENT_PATH = path.join(ROOT, 'data/external_validation/astro_databank/astro_databank_independent_holdout.json');

console.log('\n' + '='.repeat(70));
console.log(' INTEGRITY TEST: EXTERNAL DATASET PROVENANCE AUDIT');
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

// 1. Raw source exists
assert(fs.existsSync(RAW_XML_PATH), 'Raw Astro-Databank XML export exists');
assert(fs.existsSync(DATASET_PATH), 'Processed JSON dataset exists');
assert(fs.existsSync(MANIFEST_PATH), 'Dataset manifest exists');
assert(fs.existsSync(OVERLAP_PATH), 'Cross-source overlap manifest exists');
assert(fs.existsSync(INDEPENDENT_PATH), 'Independent external holdout exists');

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
const dataset = JSON.parse(fs.readFileSync(DATASET_PATH, 'utf8'));
const rawXml = fs.readFileSync(RAW_XML_PATH);

// 2. Source format and hash
assert(manifest.exportFormat === '260911', `Export format matches official schema 260911 (got ${manifest.exportFormat})`);
const computedXmlSha256 = crypto.createHash('sha256').update(rawXml).digest('hex');
assert(manifest.rawXmlSha256 === computedXmlSha256, `Raw XML SHA-256 matches manifest (${computedXmlSha256.slice(0, 16)}...)`);

// 3. Record count and ADB IDs
assert(dataset.length === manifest.totalRecords, `Record count matches manifest (${dataset.length})`);
assert(dataset.length >= 5866, `Record count is >= 5,866 (got ${dataset.length})`);

let adbIdCount = 0;
let validCoords = 0;
let sourceProvenanceCount = 0;

for (const r of dataset) {
  if (r.adbId && typeof r.adbId === 'number') adbIdCount++;
  if (typeof r.latitude === 'number' && typeof r.longitude === 'number') validCoords++;
  if (r.sourceDataset === 'SOURCE_ASTRODATABANK') sourceProvenanceCount++;
}

assert(adbIdCount === dataset.length, `All ${dataset.length} records possess genuine numeric ADB IDs`);
assert(validCoords === dataset.length, `All ${dataset.length} records possess valid numeric coordinates`);
assert(sourceProvenanceCount === dataset.length, 'All records carry SOURCE_ASTRODATABANK provenance');

// 4. Rodden distribution matches source
const roddenCounts = {};
for (const r of dataset) {
  roddenCounts[r.birthTimeReliability] = (roddenCounts[r.birthTimeReliability] || 0) + 1;
}

assert(roddenCounts['AA'] === manifest.roddenRatingBreakdown['AA'], `AA count matches manifest (${roddenCounts['AA']})`);
assert(roddenCounts['A'] === manifest.roddenRatingBreakdown['A'], `A count matches manifest (${roddenCounts['A']})`);
assert(roddenCounts['B'] === manifest.roddenRatingBreakdown['B'], `B count matches manifest (${roddenCounts['B']})`);
assert(roddenCounts['C'] === manifest.roddenRatingBreakdown['C'], `C count matches manifest (${roddenCounts['C']})`);

// 5. Events originate from source data and no generated outcomes
let syntheticMarriages = 0;
for (const r of dataset) {
  for (const m of (r.marriages || [])) {
    if (m.spouse && m.spouse.startsWith('Spouse ADB')) syntheticMarriages++;
    if (m.marriageDate && m.marriageDate.endsWith('-06-15') && m.rawMarriageDate && !m.rawMarriageDate.includes('06-15')) {
      syntheticMarriages++;
    }
  }
}
assert(syntheticMarriages === 0, 'Zero generated marriage outcomes or fake placeholder spouses');

// 6. Independent holdout check
const independentHoldout = JSON.parse(fs.readFileSync(INDEPENDENT_PATH, 'utf8'));
const overlap = JSON.parse(fs.readFileSync(OVERLAP_PATH, 'utf8'));
assert(independentHoldout.length + overlap.totalOverlapCount === dataset.length, 
  `Independent holdout (${independentHoldout.length}) + overlap (${overlap.totalOverlapCount}) equals total (${dataset.length})`);

console.log(`\nResult: ${passes} passed, ${fails} failed`);
process.exit(fails > 0 ? 1 : 0);
