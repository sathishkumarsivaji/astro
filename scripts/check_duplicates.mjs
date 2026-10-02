import fs from 'fs';
import { resolve, join } from 'path';
import { parseCSV } from './inspect_datasets.mjs';

const ROOT = resolve(import.meta.dirname || '.', '..');
const RAW_DIR = join(ROOT, 'data', 'real_world_validation', 'raw');

const pRows = parseCSV(fs.readFileSync(join(RAW_DIR, 'PersonList-15k.csv'), 'utf8'));
const rowKeys = new Set();
const duplicateRowKeys = [];
const personFingerprints = new Set();
const duplicatePersons = [];

for (let i = 1; i < pRows.length; i++) {
  const [rowKey, birthTimeStr, gender, name, notes] = pRows[i];
  if (rowKeys.has(rowKey)) {
    duplicateRowKeys.push(rowKey);
  }
  rowKeys.add(rowKey);

  const bt = JSON.parse(birthTimeStr);
  const fp = [name.toLowerCase().trim(), bt.StdTime, bt.Location.Latitude, bt.Location.Longitude].join('|');
  if (personFingerprints.has(fp)) {
    duplicatePersons.push({ rowKey, name });
  }
  personFingerprints.add(fp);
}
console.log('Unique RowKeys:', rowKeys.size);
console.log('Duplicate RowKeys:', duplicateRowKeys.length);
console.log('Duplicate Persons (identical name+birth):', duplicatePersons.length);
if (duplicatePersons.length > 0) console.log('Sample duplicates:', duplicatePersons.slice(0, 5));
