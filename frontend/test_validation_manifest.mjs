import { createHash } from 'crypto';
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'fs';
import { join, resolve, relative } from 'path';

const ROOT = resolve(import.meta.dirname || '.');
const MANIFEST_PATH = join(ROOT, 'validation_manifest.json');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  \x1b[32m\u2713\x1b[0m ${label}`);
    passed++;
  } else {
    console.log(`  \x1b[31m\u2717\x1b[0m ${label}`);
    failed++;
  }
}

/**
 * Recursively collect files matching patterns in a directory.
 */
function collectFiles(dir, extensions, ignore = ['node_modules', '.git', 'dist', 'build']) {
  const files = [];
  if (!existsSync(dir)) return files;
  const walk = (d) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      if (ignore.includes(entry.name)) continue;
      const fullPath = join(d, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  };
  walk(dir);
  return files.sort();
}

/**
 * Compute SHA-256 hash of file contents.
 */
function hashFile(filePath) {
  const content = readFileSync(filePath);
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Compute a tree hash: SHA-256 of all file hashes concatenated.
 */
function computeTreeHash(files) {
  const hasher = createHash('sha256');
  for (const f of files) {
    const relPath = relative(ROOT, f).replace(/\\/g, '/');
    const fileHash = hashFile(f);
    hasher.update(`${relPath}:${fileHash}\n`);
  }
  return hasher.digest('hex');
}

console.log('\n=== Validation Manifest Integrity Test ===\n');

// 1. Compute source tree hash (all .js, .jsx, .mjs files in src/)
const srcFiles = collectFiles(join(ROOT, 'src'), ['.js', '.jsx', '.mjs']);
const sourceTreeHash = computeTreeHash(srcFiles);
console.log(`  Source tree: ${srcFiles.length} files, hash: ${sourceTreeHash.substring(0, 16)}...`);

// 2. Compute test tree hash (all test files)
const testFiles = collectFiles(ROOT, ['.mjs']).filter(f => {
  const rel = relative(ROOT, f);
  return rel.startsWith('test_') || rel.includes('/test_');
});
const testTreeHash = computeTreeHash(testFiles);
console.log(`  Test tree: ${testFiles.length} files, hash: ${testTreeHash.substring(0, 16)}...`);

// 3. Compute fixture tree hash
const fixtureDir = join(ROOT, 'test_fixtures');
const fixtureFiles = collectFiles(fixtureDir, ['.json', '.js', '.mjs']);
const fixtureTreeHash = computeTreeHash(fixtureFiles);
console.log(`  Fixture tree: ${fixtureFiles.length} files, hash: ${fixtureTreeHash.substring(0, 16)}...`);

// 4. Compute package-lock hash
const lockPath = join(ROOT, 'package-lock.json');
const packageLockHash = existsSync(lockPath) ? hashFile(lockPath) : 'MISSING';
console.log(`  package-lock.json: ${packageLockHash === 'MISSING' ? 'MISSING' : packageLockHash.substring(0, 16) + '...'}`);

// 5. Get git commit
let gitCommit = 'UNKNOWN';
try {
  const { execSync } = await import('child_process');
  gitCommit = execSync('git rev-parse HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
} catch (e) {
  gitCommit = 'GIT_UNAVAILABLE';
}
console.log(`  Git commit: ${gitCommit.substring(0, 12)}...`);

// 6. Generate manifest
const manifest = {
  generationTimestamp: new Date().toISOString(),
  gitCommit,
  sourceTreeHash,
  sourceFileCount: srcFiles.length,
  testTreeHash,
  testFileCount: testFiles.length,
  fixtureTreeHash,
  fixtureFileCount: fixtureFiles.length,
  packageLockHash,
  manifestVersion: '1.0.0'
};

// Compute manifest hash (hash of all component hashes)
const manifestHasher = createHash('sha256');
manifestHasher.update(JSON.stringify({
  sourceTreeHash,
  testTreeHash,
  fixtureTreeHash,
  packageLockHash,
  gitCommit
}));
manifest.manifestHash = manifestHasher.digest('hex');

// 7. Check against stored manifest (if exists)
if (existsSync(MANIFEST_PATH)) {
  const stored = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  console.log('\n  Comparing with stored manifest...');
  
  assert(stored.sourceTreeHash === sourceTreeHash, 
    `Source tree hash matches (stored: ${stored.sourceTreeHash?.substring(0, 16)}...)`);
  assert(stored.testTreeHash === testTreeHash,
    `Test tree hash matches (stored: ${stored.testTreeHash?.substring(0, 16)}...)`);
  assert(stored.fixtureTreeHash === fixtureTreeHash,
    `Fixture tree hash matches (stored: ${stored.fixtureTreeHash?.substring(0, 16)}...)`);
  assert(stored.packageLockHash === packageLockHash,
    `Package-lock hash matches`);
  
  if (failed > 0) {
    console.log('\n  \x1b[33m\u26a0 Manifest mismatch detected. Regenerate with: node test_validation_manifest.mjs --generate\x1b[0m');
  }
} else {
  console.log('\n  No stored manifest found. Generating initial manifest...');
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`  \x1b[32m\u2713\x1b[0m Manifest written to ${MANIFEST_PATH}`);
  passed++;
}

// Handle --generate flag
if (process.argv.includes('--generate')) {
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`\n  \x1b[32m\u2713\x1b[0m Manifest regenerated at ${MANIFEST_PATH}`);
}

console.log(`\n  Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
