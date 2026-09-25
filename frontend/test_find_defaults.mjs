import fs from 'node:fs';
import path from 'node:path';

function scan(dir) {
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const fp = path.join(dir, entry);
    if (fs.statSync(fp).isDirectory()) {
      scan(fp);
    } else if (entry.endsWith('.js') || entry.endsWith('.jsx')) {
      const content = fs.readFileSync(fp, 'utf8');
      const lines = content.split('\n');
      lines.forEach((l, i) => {
        if (l.includes('|| "Aries"') || l.includes("|| 'Aries'") || l.includes('ascendantLong ??') || l.includes('ascendantLong = 0') || l.includes('ascLong ??')) {
          console.log(`${fp}:${i+1}: ${l.trim()}`);
        }
      });
    }
  }
}

scan('./src');
