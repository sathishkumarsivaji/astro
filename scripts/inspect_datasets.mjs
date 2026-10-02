import { readFileSync } from 'fs';
import { resolve, join } from 'path';

const ROOT = resolve(import.meta.dirname || '.', '..');
const RAW_DIR = join(ROOT, 'data', 'real_world_validation', 'raw');

export function parseCSV(content) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;
  const len = content.length;

  while (i < len) {
    const char = content[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < len && content[i + 1] === '"') {
          currentField += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
        i++;
      } else if (char === '\r') {
        if (i + 1 < len && content[i + 1] === '\n') {
          i++;
        }
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
        i++;
      } else if (char === '\n') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
        i++;
      } else {
        currentField += char;
        i++;
      }
    }
  }
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }
  return rows;
}

const pContent = readFileSync(join(RAW_DIR, 'PersonList-15k.csv'), 'utf8');
const pRows = parseCSV(pContent);
console.log('Parsed Person rows:', pRows.length);
console.log('Person Header:', pRows[0]);
console.log('Person Row 1:', pRows[1]);

const mContent = readFileSync(join(RAW_DIR, 'MarriageInfoDataset.csv'), 'utf8');
const mRows = parseCSV(mContent);
console.log('\nParsed Marriage rows:', mRows.length);
console.log('Marriage Header:', mRows[0]);
console.log('Marriage Row 1:', mRows[1]);
