/**
 * ASTROVERSE — Astro-Databank Deterministic Stratified Regression Sample (V1)
 * 
 * Requirement 3:
 * Creates a secondary regression sample for rapid testing (N=500) stratified by:
 * - Rodden rating (AA, A, other)
 * - Gender (Male, Female, Unknown)
 * - Birth century (<1900, 1900-1949, >=1950)
 * - Marriage occurrence (EVENT vs NO_EVENT/RIGHT_CENSORED)
 * - Birth-time type (LOCAL_MEAN_TIME, STANDARD_TIME, DAYLIGHT_SAVING_TIME, etc.)
 * - Date precision (DAY, YEAR, OTHER)
 * 
 * Uses deterministic seeded PRNG (seed = 133742).
 * Persists to: data/external_validation/astro_databank/astro_databank_regression_sample.json
 * Named: ASTRO_DATABANK_REGRESSION_SAMPLE
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ROOT = path.resolve(import.meta.dirname || '.', '..');
const INDEPENDENT_PATH = path.join(ROOT, 'data/external_validation/astro_databank/astro_databank_independent_holdout.json');
const OUTPUT_PATH = path.join(ROOT, 'data/external_validation/astro_databank/astro_databank_regression_sample.json');
const MANIFEST_PATH = path.join(ROOT, 'data/external_validation/astro_databank/regression_sample_manifest.json');

function createSeededPRNG(seed = 133742) {
  let s = (seed | 0) || 1;
  return function() {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildAdbRegressionSample(targetSize = 500, seed = 133742) {
  console.log('============================================================');
  console.log('ASTROVERSE — DETERMINISTIC STRATIFIED REGRESSION SAMPLE');
  console.log('============================================================\n');

  if (!fs.existsSync(INDEPENDENT_PATH)) {
    throw new Error(`Independent holdout not found at: ${INDEPENDENT_PATH}`);
  }

  const allRecords = JSON.parse(fs.readFileSync(INDEPENDENT_PATH, 'utf8'));
  console.log(`Source true independent records: ${allRecords.length}`);

  const rng = createSeededPRNG(seed);

  // Group into strata
  const strata = new Map();

  for (const r of allRecords) {
    const rodden = r.birthTimeReliability === 'AA' ? 'AA' : (r.birthTimeReliability === 'A' ? 'A' : 'OTHER');
    const gender = r.gender || 'Unknown';
    const yr = r.birthYear || 1950;
    const century = yr < 1900 ? 'PRE_1900' : (yr < 1950 ? 'EARLY_20TH' : 'MID_LATE_20TH');
    const occ = r.hasDocumentedMarriage ? 'HAS_MARRIAGE' : 'NO_MARRIAGE';
    const tt = r.sourceTimeType || 'STANDARD_TIME';
    const prec = r.firstDocumentedMarriage?.marriageDatePrecision || 'NONE';

    const stratumKey = `${rodden}|${gender}|${century}|${occ}|${tt}|${prec}`;
    if (!strata.has(stratumKey)) strata.set(stratumKey, []);
    strata.get(stratumKey).push(r);
  }

  console.log(`Stratified into ${strata.size} distinct multi-dimensional demographic strata.`);

  // Proportional allocation
  const sample = [];
  const stratumEntries = Array.from(strata.entries()).sort((a, b) => b[1].length - a[1].length);

  // Shuffle within each stratum using seeded PRNG
  for (const [key, items] of stratumEntries) {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
  }

  // Allocate quotas proportionally
  let allocated = 0;
  const quotas = new Map();
  for (const [key, items] of stratumEntries) {
    const proportion = items.length / allRecords.length;
    let count = Math.round(proportion * targetSize);
    if (count === 0 && items.length > 0 && allocated < targetSize) count = 1;
    count = Math.min(count, items.length);
    quotas.set(key, count);
    allocated += count;
  }

  // Adjust if slightly above or below target
  while (allocated < targetSize) {
    for (const [key, items] of stratumEntries) {
      const cur = quotas.get(key);
      if (cur < items.length) {
        quotas.set(key, cur + 1);
        allocated++;
        if (allocated >= targetSize) break;
      }
    }
  }
  while (allocated > targetSize) {
    for (let i = stratumEntries.length - 1; i >= 0; i--) {
      const key = stratumEntries[i][0];
      const cur = quotas.get(key);
      if (cur > 1) {
        quotas.set(key, cur - 1);
        allocated--;
        if (allocated <= targetSize) break;
      }
    }
  }

  for (const [key, items] of stratumEntries) {
    const q = quotas.get(key);
    sample.push(...items.slice(0, q));
  }

  // Final shuffle of the sample
  for (let i = sample.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [sample[i], sample[j]] = [sample[j], sample[i]];
  }

  console.log(`Selected deterministic stratified sample: N = ${sample.length}`);

  const aaCount = sample.filter(r => r.birthTimeReliability === 'AA').length;
  const aCount = sample.filter(r => r.birthTimeReliability === 'A').length;
  const marriageCount = sample.filter(r => r.hasDocumentedMarriage).length;
  console.log(`  AA rating:   ${aaCount}`);
  console.log(`  A rating:    ${aCount}`);
  console.log(`  Marriages:   ${marriageCount}`);

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(sample, null, 2));
  console.log(`✓ Wrote sample to: ${OUTPUT_PATH}`);

  const manifest = {
    sampleName: 'ASTRO_DATABANK_REGRESSION_SAMPLE',
    purpose: 'Rapid non-authoritative regression testing only. Never substitute for full external validation.',
    generatedAt: new Date().toISOString(),
    seed,
    sampleSize: sample.length,
    sourcePopulation: allRecords.length,
    strataDimensions: ['Rodden rating', 'Gender', 'Birth century', 'Marriage occurrence', 'Time standard', 'Date precision'],
    strataCount: strata.size,
    composition: {
      aaCount,
      aCount,
      otherRoddenCount: sample.length - aaCount - aCount,
      marriageDocumentedCount: marriageCount
    },
    sha256: crypto.createHash('sha256').update(fs.readFileSync(OUTPUT_PATH)).digest('hex')
  };

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`✓ Wrote regression sample manifest to: ${MANIFEST_PATH}`);
}

if (process.argv[1] && process.argv[1].endsWith('create_adb_regression_sample.mjs')) {
  buildAdbRegressionSample();
}
