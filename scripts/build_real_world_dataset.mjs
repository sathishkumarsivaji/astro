/**
 * ASTROVERSE — Real-World Dataset Pipeline
 * 
 * Ingests, validates, cleans, and standardizes the 15,807 public records from:
 * 1. VedAstro 15,000 Famous People Birth Date & Location
 * 2. VedAstro 15,000 Famous People Marriage & Divorce Info
 * 
 * Outputs:
 * - data/real_world_validation/processed/real_world_validation_dataset.json
 * - data/real_world_validation/dataset_manifest.json
 */

import { readFileSync, writeFileSync, statSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import { createHash } from 'crypto';
import { parseCSV } from './inspect_datasets.mjs';

const ROOT = resolve(import.meta.dirname || '.', '..');
const RAW_DIR = join(ROOT, 'data', 'real_world_validation', 'raw');
const PROCESSED_DIR = join(ROOT, 'data', 'real_world_validation', 'processed');
const MANIFEST_PATH = join(ROOT, 'data', 'real_world_validation', 'dataset_manifest.json');

const PERSON_CSV_PATH = join(RAW_DIR, 'PersonList-15k.csv');
const MARRIAGE_CSV_PATH = join(RAW_DIR, 'MarriageInfoDataset.csv');

function computeFileSha256(filePath) {
  const content = readFileSync(filePath);
  return createHash('sha256').update(content).digest('hex');
}

function parseStdTime(stdTimeStr) {
  // Format: "19:55 26/06/1954 +01:00" or "05:30 15/01/1920 -05:00"
  if (!stdTimeStr) return null;
  const match = stdTimeStr.trim().match(/^(\d{2}):(\d{2})\s+(\d{2})\/(\d{2})\/(\d{4})\s+([\+\-]\d{2}):(\d{2})$/);
  if (!match) return null;

  const hours = match[1];
  const minutes = match[2];
  const day = match[3];
  const month = match[4];
  const year = match[5];
  const tzSign = match[6].startsWith('-') ? -1 : 1;
  const tzHours = parseInt(match[6].slice(1), 10);
  const tzMinutes = parseInt(match[7], 10);
  const tzOffsetHours = tzSign * (tzHours + tzMinutes / 60);

  return {
    birthTime: `${hours}:${minutes}`,
    birthDate: `${year}-${month}-${day}`,
    birthYear: parseInt(year, 10),
    birthMonth: parseInt(month, 10),
    birthDay: parseInt(day, 10),
    sourceUtcOffset: tzOffsetHours,
    sourceUtcOffsetStr: `${match[6]}:${match[7]}`
  };
}

function parseEventDate(dateStr) {
  if (!dateStr) return { precision: 'NONE', raw: dateStr, year: null, date: null };
  const s = dateStr.trim();
  const lower = s.toLowerCase();
  if (['none', 'unknown', 'n/a', 'not available', 'not married', 'not disclosed', 'null', 'na', ''].includes(lower)) {
    return { precision: 'NONE', raw: s, year: null, date: null };
  }

  // DD/MM/YYYY
  const ddmmyyyy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, '0');
    const month = ddmmyyyy[2].padStart(2, '0');
    const year = parseInt(ddmmyyyy[3], 10);
    return { precision: 'DAY', raw: s, year, date: `${year}-${month}-${day}` };
  }

  // MM/YYYY
  const mmyyyy = s.match(/^(\d{1,2})\/(\d{4})$/);
  if (mmyyyy) {
    const month = mmyyyy[1].padStart(2, '0');
    const year = parseInt(mmyyyy[2], 10);
    return { precision: 'MONTH', raw: s, year, date: `${year}-${month}-01` };
  }

  // YYYY
  const yyyy = s.match(/^(\d{4})$/);
  if (yyyy) {
    const year = parseInt(yyyy[1], 10);
    return { precision: 'YEAR', raw: s, year, date: `${year}-07-01` };
  }

  // YYYY-MM-DD
  const yyyymmdd = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (yyyymmdd) {
    const year = parseInt(yyyymmdd[1], 10);
    return { precision: 'DAY', raw: s, year, date: s };
  }

  return { precision: 'NONE', raw: s, year: null, date: null };
}

function normalizeUnionMode(typeStr) {
  if (!typeStr) return 'UNKNOWN';
  const t = typeStr.trim().toLowerCase();
  if (t === 'love' || t === 'romantic') return 'LOVE';
  if (t === 'arranged') return 'ARRANGED';
  if (t === 'pragmatic' || t === 'morganatic') return 'PRAGMATIC';
  return 'UNKNOWN';
}

function normalizeOutcome(outcomeStr) {
  if (!outcomeStr) return 'UNKNOWN';
  const o = outcomeStr.trim().toLowerCase();
  if (o.includes('dissolution') || o.includes('divorce') || o.includes('separation') || o.includes('separated')) {
    return 'DISSOLUTION';
  }
  if (o.includes('happiness') || o.includes('ongoing')) {
    return 'HAPPINESS';
  }
  if (o.includes('struggle') || o.includes('infatuation')) {
    return 'STRUGGLE';
  }
  if (o.includes('tragic') || o.includes('death') || o.includes('murder')) {
    return 'TRAGIC';
  }
  if (o === 'none' || o === 'not married' || o === 'no marriage') {
    return 'NONE';
  }
  return 'UNKNOWN';
}

function normalizeCredibility(credStr) {
  if (!credStr) return 'UNKNOWN';
  const c = credStr.trim().toLowerCase();
  if (c === 'high') return 'HIGH';
  if (c === 'medium') return 'MEDIUM';
  if (c === 'low') return 'LOW';
  return 'UNKNOWN';
}

export function buildRealWorldValidationDataset() {
  console.log('============================================================');
  console.log('ASTROVERSE REAL-WORLD VALIDATION DATASET PIPELINE');
  console.log('============================================================\n');

  console.log('1. Reading raw CSV datasets...');
  const personCsv = readFileSync(PERSON_CSV_PATH, 'utf8');
  const marriageCsv = readFileSync(MARRIAGE_CSV_PATH, 'utf8');

  const personSha256 = computeFileSha256(PERSON_CSV_PATH);
  const marriageSha256 = computeFileSha256(MARRIAGE_CSV_PATH);

  console.log(`  PersonList-15k.csv SHA-256: ${personSha256}`);
  console.log(`  MarriageInfoDataset.csv SHA-256: ${marriageSha256}`);

  const pRows = parseCSV(personCsv);
  const mRows = parseCSV(marriageCsv);

  const totalRawRows = pRows.length - 1;
  console.log(`\n2. Parsing ${totalRawRows} raw records...`);

  // Build marriage lookup map by PartitionKey
  const marriageLookup = new Map();
  for (let i = 1; i < mRows.length; i++) {
    const [partitionKey, rowKey, infoStr] = mRows[i];
    if (!partitionKey) continue;
    try {
      const parsed = JSON.parse(infoStr);
      marriageLookup.set(partitionKey, parsed.marriages || []);
    } catch {
      marriageLookup.set(partitionKey, []);
    }
  }

  // Audit counters
  let validBirthRecords = 0;
  let missingTimeCount = 0;
  let validMarriageRecords = 0;
  let validDivorceRecords = 0;
  let unknownDates = 0;
  let lowCredibility = 0;
  let mediumCredibility = 0;
  let highCredibility = 0;
  let duplicatePersons = 0;
  let duplicateEvents = 0;
  let excludedRecords = 0;

  const personFingerprints = new Set();
  const canonicalDataset = [];

  for (let i = 1; i < pRows.length; i++) {
    const [rowKey, birthTimeStr, gender, name, notes] = pRows[i];

    if (!rowKey || !name || !birthTimeStr) {
      excludedRecords++;
      continue;
    }

    let btObj;
    try {
      btObj = JSON.parse(birthTimeStr);
    } catch {
      excludedRecords++;
      continue;
    }

    const parsedTime = parseStdTime(btObj.StdTime);
    if (!parsedTime || !btObj.Location || typeof btObj.Location.Latitude !== 'number' || typeof btObj.Location.Longitude !== 'number') {
      missingTimeCount++;
      excludedRecords++;
      continue;
    }

    validBirthRecords++;

    // Deduplication check
    const fp = [name.toLowerCase().trim(), parsedTime.birthDate, parsedTime.birthTime, btObj.Location.Latitude, btObj.Location.Longitude].join('|');
    if (personFingerprints.has(fp)) {
      duplicatePersons++;
      // Exclude placeholder duplicate names like 'Empty'
      if (name.toLowerCase().includes('empty')) {
        excludedRecords++;
        continue;
      }
    }
    personFingerprints.add(fp);

    // Extract rodden reliability rating
    const roddenMatch = notes ? notes.match(/['"]rodden['"]\s*:\s*['"]([^'"]+)['"]/i) : null;
    const birthTimeReliability = roddenMatch ? roddenMatch[1].toUpperCase() : 'UNKNOWN';

    // Historical time standard classification
    // Longitude LMT = 4 minutes per degree = Longitude / 15 hours
    const lmtOffsetHours = parseFloat((btObj.Location.Longitude / 15.0).toFixed(4));
    const isPreStandardEra = parsedTime.birthYear < 1900;
    const historicalTimeStandard = isPreStandardEra ? 'LOCAL_MEAN_TIME_CANDIDATE' : 'STANDARD_TIME';

    // Process marriages
    const rawMarriages = marriageLookup.get(rowKey) || [];
    const processedMarriages = [];
    const seenEventKeys = new Set();

    for (let mIdx = 0; mIdx < rawMarriages.length; mIdx++) {
      const rm = rawMarriages[mIdx];
      const parsedMDate = parseEventDate(rm.marriageDate);
      const parsedDDate = parseEventDate(rm.divorceDate);
      const normType = normalizeUnionMode(rm.type);
      const normOutcome = normalizeOutcome(rm.outcome);
      const normCred = normalizeCredibility(rm.dataCredibility);

      if (normCred === 'HIGH') highCredibility++;
      else if (normCred === 'MEDIUM') mediumCredibility++;
      else if (normCred === 'LOW') lowCredibility++;

      if (parsedMDate.precision !== 'NONE') validMarriageRecords++;
      else unknownDates++;

      if (parsedDDate.precision !== 'NONE') validDivorceRecords++;

      // Check event duplication
      const eventKey = `${parsedMDate.raw || ''}|${rm.spouse || ''}|${parsedDDate.raw || ''}`;
      if (seenEventKeys.has(eventKey) && eventKey.length > 5) {
        duplicateEvents++;
        continue;
      }
      seenEventKeys.add(eventKey);

      processedMarriages.push({
        marriageId: `${rowKey}_m${mIdx + 1}`,
        rawMarriageDate: rm.marriageDate || null,
        marriageDate: parsedMDate.date,
        marriageYear: parsedMDate.year,
        marriageDatePrecision: parsedMDate.precision,
        rawDivorceDate: rm.divorceDate || null,
        divorceDate: parsedDDate.date,
        divorceYear: parsedDDate.year,
        divorceDatePrecision: parsedDDate.precision,
        marriageType: normType,
        spouse: rm.spouse || null,
        outcome: normOutcome,
        sourceCredibility: normCred,
        hasExactMarriageDate: parsedMDate.precision === 'DAY',
        hasExactDivorceDate: parsedDDate.precision === 'DAY'
      });
    }

    const hasDocumentedMarriage = processedMarriages.some(m => m.marriageDate !== null || m.marriageYear !== null);
    const hasDivorce = processedMarriages.some(m => m.outcome === 'DISSOLUTION' || m.divorceYear !== null);

    canonicalDataset.push({
      sourceDataset: 'VedAstro 15000-Famous-People',
      sourceVersion: '1.0.0',
      sourceURL: 'https://huggingface.co/datasets/vedastro-org/',
      sourceRecordId: rowKey,
      name,
      gender,
      birthDate: parsedTime.birthDate,
      birthYear: parsedTime.birthYear,
      birthMonth: parsedTime.birthMonth,
      birthDay: parsedTime.birthDay,
      birthTime: parsedTime.birthTime,
      birthTimeReliability,
      birthPlace: btObj.Location.Name || 'Unknown Location',
      latitude: btObj.Location.Latitude,
      longitude: btObj.Location.Longitude,
      historicalTimeStandard,
      sourceUtcOffset: parsedTime.sourceUtcOffset,
      sourceUtcOffsetStr: parsedTime.sourceUtcOffsetStr,
      longitudeDerivedLMT: lmtOffsetHours,
      hasDocumentedMarriage,
      hasDivorce,
      marriageCount: processedMarriages.length,
      marriages: processedMarriages
    });
  }

  console.log(`\n3. Dataset Import Audit Summary:`);
  console.log(`  • Total Raw Rows:             ${totalRawRows}`);
  console.log(`  • Valid Birth Records:        ${validBirthRecords}`);
  console.log(`  • Canonical Ingested Persons: ${canonicalDataset.length}`);
  console.log(`  • Valid Marriage Records:     ${validMarriageRecords}`);
  console.log(`  • Valid Divorce Records:      ${validDivorceRecords}`);
  console.log(`  • Unknown / Missing Dates:    ${unknownDates}`);
  console.log(`  • High Credibility Events:    ${highCredibility}`);
  console.log(`  • Medium Credibility Events:  ${mediumCredibility}`);
  console.log(`  • Low Credibility Events:     ${lowCredibility}`);
  console.log(`  • Missing Time Records:       ${missingTimeCount}`);
  console.log(`  • Duplicate Persons Detected: ${duplicatePersons}`);
  console.log(`  • Duplicate Events Removed:   ${duplicateEvents}`);
  console.log(`  • Excluded Records:           ${excludedRecords}`);

  // Write processed dataset
  const outputFilePath = join(PROCESSED_DIR, 'real_world_validation_dataset.json');
  writeFileSync(outputFilePath, JSON.stringify(canonicalDataset, null, 2));
  console.log(`\n✓ Processed canonical dataset written to: ${outputFilePath}`);

  const processedSha256 = computeFileSha256(outputFilePath);

  // Generate dataset_manifest.json
  const manifest = {
    manifestVersion: '1.0.0',
    schemaVersion: 'REAL_WORLD_VALIDATION_SCHEMA_V1',
    parserVersion: '1.0.0-vedastro-canonical',
    importDate: new Date().toISOString(),
    sourceDatasets: [
      {
        name: 'VedAstro 15000-Famous-People-Birth-Date-Location',
        url: 'https://huggingface.co/datasets/vedastro-org/15000-Famous-People-Birth-Date-Location',
        fileName: 'PersonList-15k.csv',
        sha256: personSha256
      },
      {
        name: 'VedAstro 15000-Famous-People-Marriage-Divorce-Info',
        url: 'https://huggingface.co/datasets/vedastro-org/15000-Famous-People-Marriage-Divorce-Info',
        fileName: 'MarriageInfoDataset.csv',
        sha256: marriageSha256
      }
    ],
    processedDataset: {
      fileName: 'real_world_validation_dataset.json',
      sha256: processedSha256,
      recordCount: canonicalDataset.length
    },
    statistics: {
      totalRawRows,
      validBirthRecords,
      canonicalIngestedPersons: canonicalDataset.length,
      validMarriageRecords,
      validDivorceRecords,
      unknownDates,
      highCredibility,
      mediumCredibility,
      lowCredibility,
      missingTime: missingTimeCount,
      duplicatePersons,
      duplicateEvents,
      excludedRecords
    },
    eligibilityRules: {
      birthData: 'Valid birth date (YYYY-MM-DD), birth time (HH:mm), non-null latitude and longitude coordinates.',
      roddenRating: 'Requires documented Rodden rating (AA preferred, certified public record baseline).',
      marriageEvaluation: 'Candidate must possess non-null marriage year or full date with documented credibility rating.',
      divorceEvaluation: 'Candidate must possess documented dissolution status or explicit divorce date.'
    }
  };

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`✓ Dataset manifest generated at: ${MANIFEST_PATH}`);

  return { canonicalDataset, manifest };
}

if (process.argv[1]?.endsWith('build_real_world_dataset.mjs')) {
  buildRealWorldValidationDataset();
}
