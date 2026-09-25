import fs from 'node:fs';
import path from 'node:path';

const PROHIBITED_PATTERNS = [
  "Swiss Ephemeris",
  "ELP2000",
  "IAU SOFA",
  "Sub-Arcsecond",
  "Sub-arcsecond",
  "Commercial-Grade",
  "Commercial Grade",
  "death prediction",
  "death timing",
  "Life Destiny Master Dossier",
  "Politics Eligibility",
  "Deep Neural Line Extraction"
];

let totalViolations = 0;

function scanPath(targetPath) {
  if (!fs.existsSync(targetPath)) return;
  const stat = fs.statSync(targetPath);
  
  if (stat.isDirectory()) {
    const entries = fs.readdirSync(targetPath);
    for (const entry of entries) {
      if (entry === 'node_modules' || entry === '.git') continue;
      scanPath(path.join(targetPath, entry));
    }
  } else {
    const ext = path.extname(targetPath).toLowerCase();
    if (!['.js', '.jsx', '.md', '.html', '.css', '.json'].includes(ext)) return;
    const content = fs.readFileSync(targetPath, 'utf8');
    const lines = content.split('\n');
    lines.forEach((l, i) => {
      for (const pat of PROHIBITED_PATTERNS) {
        if (l.toLowerCase().includes(pat.toLowerCase())) {
          console.error(`Violation in ${targetPath}:${i+1} [${pat}]: ${l.trim()}`);
          totalViolations++;
          break;
        }
      }
    });
  }
}

console.log("Scanning paths for prohibited marketing / uncalibrated claims...");
scanPath('./src');
scanPath('./dist');
scanPath('./README.md');
scanPath('./index.html');

if (totalViolations > 0) {
  console.error(`\nFAILED: Found ${totalViolations} prohibited claim violation(s).`);
  process.exit(1);
} else {
  console.log("\nPASSED: 0 prohibited claim violations across src, dist, README, and index.html.");
  process.exit(0);
}

