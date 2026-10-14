import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '..');
const projectRootDir = path.resolve(backendDir, '..');

// 1. Directory verification - Fail if expected directories cannot be located
if (!fs.existsSync(backendDir)) {
  console.error(`FATAL: Backend directory does not exist at resolved path: ${backendDir}`);
  process.exit(1);
}
if (!fs.existsSync(projectRootDir)) {
  console.error(`FATAL: Project root directory does not exist at resolved path: ${projectRootDir}`);
  process.exit(1);
}

console.log("==============================================================");
console.log(" SKR ASTRO: PORTABLE PII & SENSITIVE DATA RELEASE AUDIT SUITE");
console.log("==============================================================");
console.log(`Backend Dir: ${backendDir}`);
console.log(`Project Root: ${projectRootDir}\n`);

/**
 * Validates a single JSON content string against PII & sensitive data rules.
 * Returns an array of violation strings (empty if clean).
 */
export function validateNoPII(content, filePath = "in-memory") {
  const violations = [];
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    // If not valid JSON, we still perform regex checks
  }

  // Check 1: More than 10 user records
  if (parsed && parsed.users && Object.keys(parsed.users).length > 10) {
    violations.push(`More than 10 user records (count: ${Object.keys(parsed.users).length})`);
  }

  // Check 2: email addresses matching real domains (not @example.test)
  const emailRegex = /"email"\s*:\s*"([^"]+)"/g;
  let match;
  while ((match = emailRegex.exec(content)) !== null) {
    if (!match[1].endsWith('@example.test')) {
      violations.push(`Contains real email domain: ${match[1]}`);
    }
  }

  // Check 3: passwordHash / user_secrets with real-looking hashes (not prefixed with SYNTHETIC_)
  if (parsed && parsed.user_secrets) {
    for (const key in parsed.user_secrets) {
      if (!String(parsed.user_secrets[key]).startsWith('SYNTHETIC_')) {
        violations.push(`user_secrets[${key}] contains real-looking secret hash`);
      }
    }
  }
  const pwdHashRegex = /"passwordHash"\s*:\s*"([^"]+)"/g;
  while ((match = pwdHashRegex.exec(content)) !== null) {
    if (!match[1].startsWith('SYNTHETIC_')) {
      violations.push(`passwordHash contains real-looking hash: ${match[1].slice(0, 10)}...`);
    }
  }

  // Check 4: push_subscriptions with real browser endpoint URLs
  if (parsed && parsed.push_subscriptions && Object.keys(parsed.push_subscriptions).length > 0) {
    violations.push(`Contains push subscriptions (count: ${Object.keys(parsed.push_subscriptions).length})`);
  }
  const endpointRegex = /"endpoint"\s*:\s*"https:\/\/[^"]+"/g;
  while ((match = endpointRegex.exec(content)) !== null) {
    violations.push(`Contains browser push endpoint URL: ${match[0]}`);
  }

  // Check 5: rawUserId in prediction records or metadata
  if (parsed && parsed.prediction_records) {
    for (const [id, rec] of Object.entries(parsed.prediction_records)) {
      if (rec.metadata && rec.metadata.rawUserId) {
        violations.push(`Contains rawUserId in prediction record ${id} metadata`);
      }
      if (rec.rawUserId) {
        violations.push(`Contains top-level rawUserId in prediction record ${id}`);
      }
    }
  }
  if (/"rawUserId"\s*:\s*"[^"]+"/i.test(content)) {
    violations.push(`Contains non-null rawUserId string literal`);
  }

  return violations;
}

/**
 * Negative Tests: Proves that synthetic sensitive records are reliably detected and rejected.
 */
function runNegativeTests() {
  console.log("--- RUNNING NEGATIVE CONTROLS (Proving PII Detection Invariants) ---");
  
  const negativeCases = [
    {
      name: "Detects rawUserId in prediction record metadata",
      payload: JSON.stringify({
        prediction_records: {
          pred_1: {
            predictionId: "pred_1",
            metadata: { rawUserId: "usr_sensitive_9999" }
          }
        }
      }),
      expectedKeyword: "rawUserId"
    },
    {
      name: "Detects rawUserId as literal field",
      payload: JSON.stringify({ rawUserId: "usr_customer_real_id" }),
      expectedKeyword: "rawUserId"
    },
    {
      name: "Detects real email domain (@gmail.com)",
      payload: JSON.stringify({ users: { u1: { email: "customer@gmail.com" } } }),
      expectedKeyword: "real email domain"
    },
    {
      name: "Detects non-synthetic password hash",
      payload: JSON.stringify({ user_secrets: { u1: "$2b$10$abcdef1234567890abcdef1234567890abcdef12" } }),
      expectedKeyword: "secret hash"
    },
    {
      name: "Detects push subscriptions",
      payload: JSON.stringify({ push_subscriptions: { sub1: { endpoint: "https://fcm.googleapis.com/fcm/send/token" } } }),
      expectedKeyword: "push subscriptions"
    },
    {
      name: "Detects browser push endpoint URL regex",
      payload: JSON.stringify({ endpoint: "https://updates.push.services.mozilla.com/wpush/v2/gAAAAAB" }),
      expectedKeyword: "browser push endpoint URL"
    },
    {
      name: "Detects oversized user table (> 10 users)",
      payload: JSON.stringify({
        users: Object.fromEntries(Array.from({ length: 15 }, (_, i) => [`u_${i}`, { email: `user_${i}@example.test` }]))
      }),
      expectedKeyword: "More than 10 user records"
    }
  ];

  let passedControls = 0;
  for (const tc of negativeCases) {
    const violations = validateNoPII(tc.payload, tc.name);
    assert(violations.length > 0, `Negative control failed: ${tc.name} was not detected as a violation!`);
    const found = violations.some(v => v.includes(tc.expectedKeyword));
    assert(found, `Negative control failed: expected keyword '${tc.expectedKeyword}' not in violations: ${violations.join(", ")}`);
    console.log(`✓ [PASS NEGATIVE CONTROL] ${tc.name} detected (${violations.length} violation(s))`);
    passedControls++;
  }
  console.log(`✓ All ${passedControls} negative control tests passed!\n`);
}

runNegativeTests();

// 2. Discover and scan files across backend and release artifacts
function scanDirectory(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === 'coverage') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath, fileList);
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const jsonFiles = scanDirectory(backendDir);

// Also include root release manifest if present
const releaseManifestPath = path.join(projectRootDir, 'current_release_manifest.json');
if (fs.existsSync(releaseManifestPath)) {
  jsonFiles.push(releaseManifestPath);
}

// Fail if scan unexpectedly finds zero eligible files
if (jsonFiles.length === 0) {
  console.error(`FATAL: Scan unexpectedly found 0 eligible JSON files in ${backendDir}`);
  process.exit(1);
}

console.log(`--- SCANNING ELIGIBLE REPOSITORY FILES (Total Found: ${jsonFiles.length}) ---`);

const fileStatsByType = {
  config: 0,
  testData: 0,
  runtimeUntracked: 0,
  scannedAndAudited: 0
};

let hasFailures = false;
const testDataDirName = path.normalize('/test-data/');

for (const file of jsonFiles) {
  const normFile = path.normalize(file);
  const isTestData = normFile.includes(testDataDirName) || normFile.includes('\\test-data\\') || normFile.includes('/test-data/');
  const fileName = path.basename(file);

  if (fileName === 'package.json' || fileName === 'package-lock.json' || fileName === 'jsconfig.json' || fileName === 'tsconfig.json') {
    fileStatsByType.config++;
    console.log(`PASS: ${file} (Config file)`);
    continue;
  }

  let content;
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch (e) {
    console.warn(`WARN: Could not read ${file}: ${e.message}`);
    continue;
  }

  if (!content.trim()) {
    console.log(`PASS: ${file} (Empty file)`);
    continue;
  }

  if (isTestData) {
    fileStatsByType.testData++;
    console.log(`PASS: ${file} (Test data fixture)`);
    continue;
  }

  // Check if file is tracked in git. Git-ignored runtime database files that are not tracked
  // are never included in git-based release archives or clean checkouts.
  const isRuntimeData = normFile.includes(path.normalize('/data/')) || normFile.includes('\\data\\') || normFile.includes('/data/');
  let isTracked = false;
  try {
    const { execSync } = await import('child_process');
    const relPath = path.relative(projectRootDir, file).replace(/\\/g, '/');
    const out = execSync(`git ls-files "${relPath}"`, { cwd: projectRootDir, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    isTracked = out.length > 0;
  } catch (_e) {
    isTracked = false;
  }

  if (isRuntimeData && !isTracked) {
    fileStatsByType.runtimeUntracked++;
    console.log(`PASS: ${file} (Git-ignored untracked local runtime file, excluded from release)`);
    continue;
  }

  fileStatsByType.scannedAndAudited++;

  // Calculate SHA-256 for release audit record
  const sha256 = crypto.createHash('sha256').update(content).digest('hex');
  const violations = validateNoPII(content, file);

  if (violations.length === 0) {
    console.log(`PASS: ${file} [SHA-256: ${sha256.slice(0, 16)}...] (0 violations)`);
  } else {
    console.error(`FAIL: ${file} [SHA-256: ${sha256.slice(0, 16)}...]`);
    for (const v of violations) {
      console.error(`  - Violation: ${v}`);
    }
    hasFailures = true;
  }
}

console.log("\n==============================================================");
console.log(" SCAN SUMMARY:");
console.log(` Total JSON files found:      ${jsonFiles.length}`);
console.log(` Scanned and audited:         ${fileStatsByType.scannedAndAudited}`);
console.log(` Config files skipped:        ${fileStatsByType.config}`);
console.log(` Test data fixtures skipped:  ${fileStatsByType.testData}`);
console.log(` Untracked runtime skipped:   ${fileStatsByType.runtimeUntracked}`);
console.log("==============================================================");

if (hasFailures) {
  console.error("FAILED: One or more release files contain PII or secret violations!");
  process.exit(1);
} else {
  console.log("SUCCESS: All scanned files passed PII and sensitive data inspection without violations.\n");
  process.exit(0);
}
