/**
 * Diagnostic analysis of raw VedAstro datasets
 */
import { readFileSync } from 'fs';
import { resolve, join } from 'path';
import { parseCSV } from './inspect_datasets.mjs';

const ROOT = resolve(import.meta.dirname || '.', '..');
const RAW_DIR = join(ROOT, 'data', 'real_world_validation', 'raw');

const pRows = parseCSV(readFileSync(join(RAW_DIR, 'PersonList-15k.csv'), 'utf8'));
const mRows = parseCSV(readFileSync(join(RAW_DIR, 'MarriageInfoDataset.csv'), 'utf8'));

console.log(`Person records (excluding header): ${pRows.length - 1}`);
console.log(`Marriage records (excluding header): ${mRows.length - 1}`);

// Analyze PersonList
let validBirthTimeJSON = 0;
let invalidBirthTimeJSON = 0;
const roddenCounts = {};
const genderCounts = {};

for (let i = 1; i < pRows.length; i++) {
  const [rowKey, birthTimeStr, gender, name, notes] = pRows[i];
  genderCounts[gender] = (genderCounts[gender] || 0) + 1;
  try {
    const bt = JSON.parse(birthTimeStr);
    if (bt.StdTime && bt.Location) validBirthTimeJSON++;
    else invalidBirthTimeJSON++;
  } catch {
    invalidBirthTimeJSON++;
  }

  // Parse rodden rating
  const match = notes ? notes.match(/['"]rodden['"]\s*:\s*['"]([^'"]+)['"]/i) : null;
  const rating = match ? match[1].toUpperCase() : 'UNKNOWN';
  roddenCounts[rating] = (roddenCounts[rating] || 0) + 1;
}

console.log('\n--- PersonList Summary ---');
console.log('Valid Birth JSON:', validBirthTimeJSON);
console.log('Invalid Birth JSON:', invalidBirthTimeJSON);
console.log('Genders:', genderCounts);
console.log('Rodden Ratings:', roddenCounts);

// Analyze MarriageInfo
let validMarriageJSON = 0;
let invalidMarriageJSON = 0;
let totalMarriageEvents = 0;
let marriageTypeCounts = {};
let outcomeCounts = {};
let credibilityCounts = {};
let withMarriageDate = 0;
let withDivorceDate = 0;

for (let i = 1; i < mRows.length; i++) {
  const [partitionKey, rowKey, infoStr] = mRows[i];
  try {
    const info = JSON.parse(infoStr);
    validMarriageJSON++;
    const marriages = info.marriages || [];
    totalMarriageEvents += marriages.length;
    for (const m of marriages) {
      marriageTypeCounts[m.type || 'EMPTY'] = (marriageTypeCounts[m.type || 'EMPTY'] || 0) + 1;
      outcomeCounts[m.outcome || 'EMPTY'] = (outcomeCounts[m.outcome || 'EMPTY'] || 0) + 1;
      credibilityCounts[m.dataCredibility || 'EMPTY'] = (credibilityCounts[m.dataCredibility || 'EMPTY'] || 0) + 1;
      if (m.marriageDate && m.marriageDate.trim() !== '') withMarriageDate++;
      if (m.divorceDate && m.divorceDate.trim() !== '') withDivorceDate++;
    }
  } catch {
    invalidMarriageJSON++;
  }
}

console.log('\n--- MarriageInfo Summary ---');
console.log('Valid Marriage JSON records:', validMarriageJSON);
console.log('Invalid Marriage JSON records:', invalidMarriageJSON);
console.log('Total marriage events across all persons:', totalMarriageEvents);
console.log('Events with marriage date:', withMarriageDate);
console.log('Events with divorce date:', withDivorceDate);
console.log('Marriage types:', marriageTypeCounts);
console.log('Outcomes:', outcomeCounts);
console.log('Credibility levels:', credibilityCounts);
