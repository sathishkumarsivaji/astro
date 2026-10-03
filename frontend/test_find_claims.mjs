import fs from 'node:fs';
import path from 'node:path';

const PROHIBITED_MARKETING_PATTERNS = [
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

// Patterns that falsely claim runtime is powered by or uses Swiss Ephemeris
const PROHIBITED_RUNTIME_EPHEMERIS_PATTERNS = [
  "runtime uses swiss ephemeris",
  "powered by swiss ephemeris",
  "using swiss ephemeris runtime",
  "calculated using swiss ephemeris",
  "swiss ephemeris calculation engine",
  "built on swiss ephemeris",
  "ephemeris engine: swiss"
];

// Reference / benchmark statements that are explicitly permitted
const PERMITTED_REFERENCE_EPHEMERIS_PATTERNS = [
  "reference parity",
  "parity verified",
  "reference oracle",
  "reference comparison",
  "reference fixtures",
  "benchmarked against swiss ephemeris",
  "swiss ephemeris reference",
  "swiss ephemeris library (astrodienst)",
  "swiss ephemeris internally computes",
  "se_sidm_"
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
      const lower = l.toLowerCase();

      // 1. Check general prohibited marketing claims
      for (const pat of PROHIBITED_MARKETING_PATTERNS) {
        if (lower.includes(pat.toLowerCase())) {
          console.error(`Violation in ${targetPath}:${i+1} [${pat}]: ${l.trim()}`);
          totalViolations++;
          return;
        }
      }

      // 2. Check Swiss Ephemeris claims with context discrimination (Requirement 16)
      if (lower.includes("swiss ephemeris")) {
        const isPermittedReference = PERMITTED_REFERENCE_EPHEMERIS_PATTERNS.some(p => lower.includes(p));
        const isProhibitedRuntime = PROHIBITED_RUNTIME_EPHEMERIS_PATTERNS.some(p => lower.includes(p));

        if (isProhibitedRuntime || !isPermittedReference) {
          console.error(`Violation in ${targetPath}:${i+1} [Swiss Ephemeris runtime claim]: ${l.trim()}`);
          totalViolations++;
        }
      }
    });
  }
}

console.log("Scanning paths for prohibited marketing / uncalibrated claims (with context-aware ephemeris distinction)...");
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
