import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const srcDir = path.join(ROOT, "frontend", "src");

function walk(dir) {
  let results = [];
  for (const f of fs.readdirSync(dir)) {
    const fp = path.join(dir, f);
    const stat = fs.statSync(fp);
    if (stat.isDirectory()) {
      results = results.concat(walk(fp));
    } else if (f.endsWith(".js") || f.endsWith(".jsx")) {
      results.push(fp);
    }
  }
  return results;
}

const files = walk(srcDir);
const findings = [];

const patterns = [
  { name: "Default 0.5/0.75/0.9 fallback", regex: /(\?\?|\|\|)\s*(0\.5|0\.75|0\.9)\b/ },
  { name: "Arbitrary score fallback 50/75", regex: /(\?\?|\|\|)\s*(50|75)\b/ },
  { name: "Default timing age (25-35)", regex: /(age|timing|targetAge|eventAge)\s*(\?\?|\|\|)\s*(2[0-9]|3[0-5])\b/i },
  { name: "Missing Venus neutral fallback", regex: /venus.*(\?\?|\|\|)\s*(0\.5|50)/i },
  { name: "Missing Transit neutral fallback", regex: /transit.*(\?\?|\|\|)\s*(0\.5|50)/i },
  { name: "Dasha AD to MD substitution", regex: /adLord\s*(\?\?|\|\|)\s*mdLord|antardasha\s*(\?\?|\|\|)\s*mahadasha/i }
];

for (const f of files) {
  const content = fs.readFileSync(f, "utf8");
  const lines = content.split("\n");
  lines.forEach((line, idx) => {
    for (const pat of patterns) {
      if (pat.regex.test(line)) {
        findings.push({
          file: path.relative(ROOT, f).replace(/\\/g, "/"),
          lineNum: idx + 1,
          pattern: pat.name,
          lineText: line.trim()
        });
      }
    }
  });
}

console.log(`Found ${findings.length} potential fallback matches:`);
for (const item of findings) {
  console.log(`[${item.pattern}] ${item.file}:${item.lineNum} -> ${item.lineText}`);
}
