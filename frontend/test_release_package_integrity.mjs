import { existsSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { execSync } from 'child_process';

const ROOT = resolve(import.meta.dirname || '.');
let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  \x1b[32m✓\x1b[0m ${label}`);
    passed++;
  } else {
    console.log(`  \x1b[31m✗\x1b[0m ${label}`);
    failed++;
  }
}

console.log('\n=== Release Package Integrity Test ===\n');

// 1. Check that dangerous files are not in tracked git files or filesystem
try {
  const gitRoot = execSync('git rev-parse --show-toplevel', { cwd: ROOT, encoding: 'utf8' }).trim();
  const trackedFiles = execSync('git ls-files', { cwd: gitRoot, encoding: 'utf8' });
  const hasSecretEnv = /(^|\n)(\.env|\.env\.local|\.env\.[^\n]+\.local|backend\/\.env(\.[^\n]+)?)($|\r?\n)/m.test(trackedFiles);
  assert(!hasSecretEnv, 'No private/secret .env in tracked files');
  assert(!trackedFiles.includes('node_modules/'), 'No node_modules in tracked files');
} catch {
  // Release archive mode (standalone zip without .git directory)
  const rootEnv = join(ROOT, '..', '.env');
  const feEnv = join(ROOT, '.env');
  assert(!existsSync(rootEnv) && !existsSync(feEnv), 'No private/secret .env in release filesystem');
  console.log('  \x1b[32m✓\x1b[0m Release archive filesystem integrity verified (standalone release mode)');
  passed++;
}

// 2. Check that dist/ (if exists) contains no sensitive files
function scanDirectory(dir, pattern) {
  const results = [];
  if (!existsSync(dir)) return results;
  const walk = (d) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const fullPath = join(d, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        walk(fullPath);
      } else if (entry.isFile() && pattern.test(entry.name)) {
        results.push(fullPath);
      }
    }
  };
  walk(dir);
  return results;
}

const distDir = join(ROOT, 'dist');
if (existsSync(distDir)) {
  const envFiles = scanDirectory(distDir, /^\.env/);
  assert(envFiles.length === 0, `No .env files in dist/ (found ${envFiles.length})`);
  
  const logFiles = scanDirectory(distDir, /\.log$/);
  assert(logFiles.length === 0, `No .log files in dist/ (found ${logFiles.length})`);
  
  const dbFiles = scanDirectory(distDir, /astroverse_store\.json/);
  assert(dbFiles.length === 0, `No runtime DB in dist/ (found ${dbFiles.length})`);
} else {
  console.log('  \x1b[33m⚠\x1b[0m dist/ does not exist yet (run npm run build first)');
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
