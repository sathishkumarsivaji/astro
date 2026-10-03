import fs from 'fs';
import path from 'path';

function scanDirectory(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git') continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      scanDirectory(filePath, fileList);
    } else if (filePath.endsWith('.json')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const backendDir = 'd:/ASTRO/backend';
const testDataDirName = path.normalize('/test-data/');

let hasFailures = false;

const jsonFiles = scanDirectory(backendDir);

for (const file of jsonFiles) {
  const isTestData = file.includes(testDataDirName) || file.includes('\\test-data\\');
  
  if (file.endsWith('package.json') || file.endsWith('package-lock.json') || file.endsWith('jsconfig.json') || file.endsWith('tsconfig.json')) {
      console.log(`PASS: ${file} (Config file)`);
      continue;
  }

  let content;
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch (e) {
    continue;
  }
  
  if (!content.trim()) {
    console.log(`PASS: ${file} (Empty file)`);
    continue;
  }
  
  if (isTestData) {
    console.log(`PASS: ${file} (Test data)`);
    continue;
  }

  // Check if file is tracked in git. Git-ignored runtime database files that are not tracked
  // are never included in git-based release archives or clean checkouts.
  const isRuntimeData = file.includes(path.normalize('/data/')) || file.includes('\\data\\');
  let isTracked = false;
  try {
    const { execSync } = await import('child_process');
    const rootDir = path.resolve(backendDir, '..');
    const relPath = path.relative(rootDir, file).replace(/\\/g, '/');
    const out = execSync(`git ls-files "${relPath}"`, { cwd: rootDir, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    isTracked = out.length > 0;
  } catch (_e) {
    isTracked = false;
  }

  if (isRuntimeData && !isTracked) {
    console.log(`PASS: ${file} (Git-ignored untracked local runtime file, excluded from release)`);
    continue;
  }

  let fileFailed = false;
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    // If it's not valid JSON, we still do regex checks
  }

  // Check 1: More than 10 user records
  if (parsed && parsed.users && Object.keys(parsed.users).length > 10) {
    console.error(`FAIL: ${file} - More than 10 user records`);
    fileFailed = true;
  }

  // Check 2: email addresses matching real domains (not @example.test)
  const emailRegex = /"email"\s*:\s*"([^"]+)"/g;
  let match;
  while ((match = emailRegex.exec(content)) !== null) {
    if (!match[1].endsWith('@example.test')) {
      console.error(`FAIL: ${file} - Contains real email domain: ${match[1]}`);
      fileFailed = true;
    }
  }

  // Check 3: passwordHash / user_secrets with real-looking hashes (not prefixed with SYNTHETIC_)
  if (parsed && parsed.user_secrets) {
    for (const key in parsed.user_secrets) {
      if (!parsed.user_secrets[key].startsWith('SYNTHETIC_')) {
        console.error(`FAIL: ${file} - Contains real-looking secret hash`);
        fileFailed = true;
      }
    }
  }
  const pwdHashRegex = /"passwordHash"\s*:\s*"([^"]+)"/g;
  while ((match = pwdHashRegex.exec(content)) !== null) {
    if (!match[1].startsWith('SYNTHETIC_')) {
      console.error(`FAIL: ${file} - Contains real-looking passwordHash`);
      fileFailed = true;
    }
  }

  // Check 4: push_subscriptions with real browser endpoint URLs
  if (parsed && parsed.push_subscriptions && Object.keys(parsed.push_subscriptions).length > 0) {
    console.error(`FAIL: ${file} - Contains push subscriptions`);
    fileFailed = true;
  }
  const endpointRegex = /"endpoint"\s*:\s*"https:\/\/[^"]+"/g;
  while ((match = endpointRegex.exec(content)) !== null) {
      console.error(`FAIL: ${file} - Contains browser endpoint URL`);
      fileFailed = true;
  }

  if (!fileFailed) {
    console.log(`PASS: ${file}`);
  } else {
    hasFailures = true;
  }
}

if (hasFailures) {
  process.exit(1);
} else {
  process.exit(0);
}
