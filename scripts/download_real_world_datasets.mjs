/**
 * ASTROVERSE — Download Public Validation Datasets
 * 
 * Sources:
 * 1. VedAstro 15,000 Famous People Birth Date & Location
 *    https://huggingface.co/datasets/vedastro-org/15000-Famous-People-Birth-Date-Location
 * 2. VedAstro 15,000 Famous People Marriage & Divorce Info
 *    https://huggingface.co/datasets/vedastro-org/15000-Famous-People-Marriage-Divorce-Info
 */

import { createWriteStream, existsSync, statSync } from 'fs';
import { resolve, join } from 'path';
import { createHash } from 'crypto';
import https from 'https';

const ROOT = resolve(import.meta.dirname || '.', '..');
const RAW_DIR = join(ROOT, 'data', 'real_world_validation', 'raw');

const DATASETS = [
  {
    name: 'PersonList-15k.csv',
    url: 'https://huggingface.co/datasets/vedastro-org/15000-Famous-People-Birth-Date-Location/raw/main/PersonList-15k.csv',
    destination: join(RAW_DIR, 'PersonList-15k.csv')
  },
  {
    name: 'MarriageInfoDataset.csv',
    url: 'https://huggingface.co/datasets/vedastro-org/15000-Famous-People-Marriage-Divorce-Info/raw/main/MarriageInfoDataset.csv',
    destination: join(RAW_DIR, 'MarriageInfoDataset.csv')
  }
];

function downloadFile(url, destPath) {
  return new Promise((res, rej) => {
    const fileStream = createWriteStream(destPath);
    const hash = createHash('sha256');
    let totalBytes = 0;

    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        // Handle redirect if any
        return res(downloadFile(response.headers.location, destPath));
      }
      if (response.statusCode !== 200) {
        return rej(new Error(`Failed to download ${url}: HTTP ${response.statusCode}`));
      }

      response.on('data', (chunk) => {
        hash.update(chunk);
        fileStream.write(chunk);
        totalBytes += chunk.length;
      });

      response.on('end', () => {
        fileStream.end();
        const sha256 = hash.digest('hex');
        res({ totalBytes, sha256 });
      });

      response.on('error', (err) => {
        fileStream.close();
        rej(err);
      });
    }).on('error', rej);
  });
}

async function run() {
  console.log('Downloading public real-world datasets from Hugging Face...');
  for (const ds of DATASETS) {
    console.log(`\nFetching ${ds.name} from: ${ds.url}`);
    const start = Date.now();
    try {
      const { totalBytes, sha256 } = await downloadFile(ds.url, ds.destination);
      const elapsed = ((Date.now() - start) / 1000).toFixed(2);
      console.log(`✓ Downloaded ${ds.name} (${(totalBytes / 1024 / 1024).toFixed(2)} MB in ${elapsed}s)`);
      console.log(`  SHA-256: ${sha256}`);
    } catch (e) {
      console.error(`✗ Error downloading ${ds.name}:`, e.message);
      process.exit(1);
    }
  }
  console.log('\nAll raw validation datasets downloaded successfully.');
}

run();
