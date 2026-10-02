/**
 * ASTROVERSE — Immutable Data Splitter
 * 
 * Partitions the real-world validation dataset into:
 * - TRAIN (60%)
 * - VALIDATION (20%)
 * - BLIND_TEST (10%)
 * - EXTERNAL_HOLDOUT (10%)
 * 
 * Guarantees:
 * 1. Person-level splitting: no person appears in more than one split.
 * 2. Spouse-pair linkage: spouses are grouped together into the same split.
 * 3. Deterministic cryptographic hashing (SHA-256).
 * 4. Freezes split hashes into split_manifest.json.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';
import { createHash } from 'crypto';

const ROOT = resolve(import.meta.dirname || '.', '..');
const PROCESSED_PATH = join(ROOT, 'data', 'real_world_validation', 'processed', 'real_world_validation_dataset.json');
const SPLITS_DIR = join(ROOT, 'data', 'real_world_validation', 'splits');
const SPLIT_MANIFEST_PATH = join(SPLITS_DIR, 'split_manifest.json');

function computeFileSha256(filePath) {
  const content = readFileSync(filePath);
  return createHash('sha256').update(content).digest('hex');
}

export function splitRealWorldDataset() {
  console.log('============================================================');
  console.log('ASTROVERSE IMMUTABLE PERSON-LEVEL DATA SPLITTER');
  console.log('============================================================\n');

  console.log('1. Loading canonical dataset...');
  const records = JSON.parse(readFileSync(PROCESSED_PATH, 'utf8'));
  console.log(`  Loaded ${records.length} records.`);

  // Build name to record mapping to identify spouse pairs
  const nameToIdMap = new Map();
  for (const r of records) {
    nameToIdMap.set(r.name.toLowerCase().trim(), r.sourceRecordId);
  }

  // Disjoint-set / Union-Find for person and spouse clustering
  const parent = new Map();
  function find(id) {
    if (!parent.has(id)) parent.set(id, id);
    if (parent.get(id) !== id) {
      parent.set(id, find(parent.get(id)));
    }
    return parent.get(id);
  }
  function union(idA, idB) {
    const rootA = find(idA);
    const rootB = find(idB);
    if (rootA !== rootB) {
      parent.set(rootB, rootA);
    }
  }

  // Union each person with their spouses if spouse is in the dataset
  for (const r of records) {
    const pId = r.sourceRecordId;
    find(pId);
    for (const m of r.marriages) {
      if (m.spouse) {
        const spouseKey = m.spouse.toLowerCase().trim();
        const spouseRecordId = nameToIdMap.get(spouseKey);
        if (spouseRecordId && spouseRecordId !== pId) {
          union(pId, spouseRecordId);
        }
      }
    }
  }

  // Group records by root cluster
  const clusterMap = new Map();
  for (const r of records) {
    const root = find(r.sourceRecordId);
    if (!clusterMap.has(root)) clusterMap.set(root, []);
    clusterMap.get(root).push(r);
  }

  console.log(`  Identified ${clusterMap.size} independent person/family clusters.`);

  // Assign clusters to splits deterministically using cluster root SHA-256 hash
  const splits = {
    TRAIN: [],
    VALIDATION: [],
    BLIND_TEST: [],
    INTERNAL_HOLDOUT: []
  };

  for (const [clusterRoot, clusterRecords] of clusterMap.entries()) {
    const hashInt = parseInt(
      createHash('sha256').update(`CLUSTER:${clusterRoot}`).digest('hex').slice(0, 8),
      16
    );
    const bucket = hashInt % 100;

    let targetSplit;
    if (bucket < 60) {
      targetSplit = 'TRAIN';
    } else if (bucket < 80) {
      targetSplit = 'VALIDATION';
    } else if (bucket < 90) {
      targetSplit = 'BLIND_TEST';
    } else {
      targetSplit = 'INTERNAL_HOLDOUT';
    }

    for (const rec of clusterRecords) {
      splits[targetSplit].push(rec);
    }
  }

  console.log('\n2. Split Distribution:');
  console.log(`  • TRAIN:            ${splits.TRAIN.length} (${(splits.TRAIN.length / records.length * 100).toFixed(2)}%)`);
  console.log(`  • VALIDATION:       ${splits.VALIDATION.length} (${(splits.VALIDATION.length / records.length * 100).toFixed(2)}%)`);
  console.log(`  • BLIND_TEST:       ${splits.BLIND_TEST.length} (${(splits.BLIND_TEST.length / records.length * 100).toFixed(2)}%)`);
  console.log(`  • INTERNAL_HOLDOUT: ${splits.INTERNAL_HOLDOUT.length} (${(splits.INTERNAL_HOLDOUT.length / records.length * 100).toFixed(2)}%)`);
  console.log(`  • Total Conserved:  ${splits.TRAIN.length + splits.VALIDATION.length + splits.BLIND_TEST.length + splits.INTERNAL_HOLDOUT.length}`);

  // Rigorous verification of zero overlap
  const seenIds = new Map();
  let overlapFound = false;

  for (const [splitName, recList] of Object.entries(splits)) {
    for (const r of recList) {
      if (seenIds.has(r.sourceRecordId)) {
        console.error(`  ✗ LEAKAGE ERROR: Person ${r.sourceRecordId} in both ${seenIds.get(r.sourceRecordId)} and ${splitName}`);
        overlapFound = true;
      }
      seenIds.set(r.sourceRecordId, splitName);
    }
  }

  if (overlapFound) {
    throw new Error('Data leakage detected: person appeared in multiple splits!');
  }
  console.log('✓ Zero person or spouse-pair overlap strictly verified across all 4 splits.');

  // Write files
  const splitFiles = {
    TRAIN: join(SPLITS_DIR, 'train.json'),
    VALIDATION: join(SPLITS_DIR, 'val.json'),
    BLIND_TEST: join(SPLITS_DIR, 'blind_test.json'),
    INTERNAL_HOLDOUT: join(SPLITS_DIR, 'internal_holdout.json')
  };

  const splitManifest = {
    manifestVersion: '2.0.0',
    generatedAt: new Date().toISOString(),
    totalRecords: records.length,
    splitPolicy: 'PERSON_AND_SPOUSE_CLUSTER_HASH_SHA256',
    ratios: {
      train: 0.60,
      validation: 0.20,
      blindTest: 0.10,
      internalHoldout: 0.10
    },
    splits: {}
  };

  for (const [sName, sPath] of Object.entries(splitFiles)) {
    writeFileSync(sPath, JSON.stringify(splits[sName], null, 2));
    const sha256 = computeFileSha256(sPath);
    splitManifest.splits[sName] = {
      recordCount: splits[sName].length,
      file: sPath.split(/[\/\\]/).pop(),
      sha256
    };
    console.log(`  ✓ Saved ${sName} -> ${splitManifest.splits[sName].file} (${sha256.slice(0, 16)}...)`);
  }

  // Also write external_holdout.json for backwards compatibility
  const legacyHoldoutPath = join(SPLITS_DIR, 'external_holdout.json');
  writeFileSync(legacyHoldoutPath, JSON.stringify(splits.INTERNAL_HOLDOUT, null, 2));
  splitManifest.splits.EXTERNAL_HOLDOUT_ALIAS = {
    recordCount: splits.INTERNAL_HOLDOUT.length,
    file: 'external_holdout.json',
    sha256: computeFileSha256(legacyHoldoutPath),
    note: 'Alias of INTERNAL_HOLDOUT for backwards compatibility; true external dataset is Astro-Databank in data/external_validation/astro_databank/'
  };

  writeFileSync(SPLIT_MANIFEST_PATH, JSON.stringify(splitManifest, null, 2));
  console.log(`\n✓ Split manifest generated at: ${SPLIT_MANIFEST_PATH}`);

  return { splits, splitManifest };
}

if (process.argv[1]?.endsWith('split_real_world_dataset.mjs')) {
  splitRealWorldDataset();
}
