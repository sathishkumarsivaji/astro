import fs from 'fs';
import { resolve, join } from 'path';
import { parseCSV } from './inspect_datasets.mjs';

const ROOT = resolve(import.meta.dirname || '.', '..');
const RAW_DIR = join(ROOT, 'data', 'real_world_validation', 'raw');

const mRows = parseCSV(fs.readFileSync(join(RAW_DIR, 'MarriageInfoDataset.csv'), 'utf8'));

let exactMarriageDate = 0;
let yearOnlyMarriageDate = 0;
let monthYearMarriageDate = 0;
let unknownMarriageDate = 0;

let exactDivorceDate = 0;
let yearOnlyDivorceDate = 0;
let monthYearDivorceDate = 0;
let unknownDivorceDate = 0;
let dissolutionCount = 0;

function parseDate(dateStr) {
  if (!dateStr) return { type: 'UNKNOWN', raw: dateStr, year: null, date: null };
  const s = dateStr.trim();
  if (['none', 'unknown', 'n/a', 'not available', 'not married', 'not disclosed', 'null', 'na', ''].includes(s.toLowerCase())) {
    return { type: 'UNKNOWN', raw: s, year: null, date: null };
  }
  // DD/MM/YYYY
  const ddmmyyyy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, '0');
    const month = ddmmyyyy[2].padStart(2, '0');
    const year = parseInt(ddmmyyyy[3], 10);
    return { type: 'EXACT_DATE', raw: s, year, date: `${year}-${month}-${day}` };
  }
  // MM/YYYY
  const mmyyyy = s.match(/^(\d{1,2})\/(\d{4})$/);
  if (mmyyyy) {
    const month = mmyyyy[1].padStart(2, '0');
    const year = parseInt(mmyyyy[2], 10);
    return { type: 'MONTH_YEAR', raw: s, year, date: `${year}-${month}-01` };
  }
  // YYYY
  const yyyy = s.match(/^(\d{4})$/);
  if (yyyy) {
    const year = parseInt(yyyy[1], 10);
    return { type: 'YEAR_ONLY', raw: s, year, date: `${year}-07-01` }; // midpoint of year
  }
  // YYYY-MM-DD
  const yyyymmdd = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (yyyymmdd) {
    const year = parseInt(yyyymmdd[1], 10);
    return { type: 'EXACT_DATE', raw: s, year, date: s };
  }
  return { type: 'UNKNOWN', raw: s, year: null, date: null };
}

for (let i = 1; i < mRows.length; i++) {
  const info = JSON.parse(mRows[i][2]);
  for (const m of (info.marriages || [])) {
    const parsedM = parseDate(m.marriageDate);
    if (parsedM.type === 'EXACT_DATE') exactMarriageDate++;
    else if (parsedM.type === 'YEAR_ONLY') yearOnlyMarriageDate++;
    else if (parsedM.type === 'MONTH_YEAR') monthYearMarriageDate++;
    else unknownMarriageDate++;

    if (m.outcome === 'Dissolution') dissolutionCount++;

    const parsedD = parseDate(m.divorceDate);
    if (parsedD.type === 'EXACT_DATE') exactDivorceDate++;
    else if (parsedD.type === 'YEAR_ONLY') yearOnlyDivorceDate++;
    else if (parsedD.type === 'MONTH_YEAR') monthYearDivorceDate++;
    else unknownDivorceDate++;
  }
}

console.log('--- Marriage Date Breakdown ---');
console.log('Exact Date (DD/MM/YYYY):', exactMarriageDate);
console.log('Year Only (YYYY):', yearOnlyMarriageDate);
console.log('Month/Year (MM/YYYY):', monthYearMarriageDate);
console.log('Unknown / None / Missing:', unknownMarriageDate);
console.log('Total Valid Marriage Records (with date or year):', exactMarriageDate + yearOnlyMarriageDate + monthYearMarriageDate);

console.log('\n--- Divorce Date Breakdown ---');
console.log('Total Dissolution Outcomes:', dissolutionCount);
console.log('Exact Divorce Date:', exactDivorceDate);
console.log('Year Only Divorce Date:', yearOnlyDivorceDate);
console.log('Month/Year Divorce Date:', monthYearDivorceDate);
console.log('Unknown / None / Missing Divorce Date:', unknownDivorceDate);
console.log('Total Valid Divorce Records (with date or year):', exactDivorceDate + yearOnlyDivorceDate + monthYearDivorceDate);
