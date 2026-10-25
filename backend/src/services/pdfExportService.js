/**
 * SKR ASTRO — High-Precision Headless Chromium PDF Export Service
 * =================================================================
 * Version: 2.1.0
 * 
 * Provides production-grade server-side PDF generation using system Chromium:
 * - 100% correct Tamil OpenType shaping (HarfBuzz).
 * - True searchable, selectable Unicode Tamil text (no mojibake).
 * - Vector SVG charts and measured A4 portrait print CSS.
 * - Concurrency capped (max 2 concurrent renders).
 * - Automatic timeout (15s) and guaranteed temporary file cleanup.
 */

import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import { generatePrintReportHTML } from "../../../frontend/src/services/printReportTemplate.js";
import { buildCanonicalReportSnapshot } from "../../../frontend/src/services/customerReport/reportSnapshotModel.js";

const execFileAsync = promisify(execFile);

// Candidate binary paths across Windows, Linux, and macOS
const CANDIDATE_CHROME_PATHS = [
  process.env.CHROME_BIN,
  process.env.CHROMIUM_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
];

let cachedChromePath = null;

/**
 * Discovers the authoritative Chromium browser binary on the system
 */
export function getChromiumBinaryPath() {
  if (cachedChromePath && fs.existsSync(cachedChromePath)) {
    return cachedChromePath;
  }

  for (const candidate of CANDIDATE_CHROME_PATHS) {
    if (candidate && fs.existsSync(candidate)) {
      cachedChromePath = candidate;
      return cachedChromePath;
    }
  }

  return null;
}

export function isChromiumAvailable() {
  return Boolean(getChromiumBinaryPath());
}

// Concurrency gate: max 2 simultaneous renders
let activeRenders = 0;
const MAX_CONCURRENT_RENDERS = 2;
const waitQueue = [];

function acquireRenderSlot() {
  return new Promise((resolve) => {
    if (activeRenders < MAX_CONCURRENT_RENDERS) {
      activeRenders++;
      resolve();
    } else {
      waitQueue.push(resolve);
    }
  });
}

function releaseRenderSlot() {
  if (waitQueue.length > 0) {
    const next = waitQueue.shift();
    next();
  } else {
    activeRenders = Math.max(0, activeRenders - 1);
  }
}

/**
 * Renders a canonical report snapshot directly into a PDF Buffer
 *
 * @param {Object} snapshot - Canonical report snapshot
 * @param {Object} [options={}] - Extra options
 * @returns {Promise<Buffer>} Generated PDF bytes
 */
export async function renderSnapshotToPdfBuffer(snapshot, options = {}) {
  const chromePath = getChromiumBinaryPath();
  if (!chromePath) {
    throw new Error("PDF_RENDERER_UNAVAILABLE: Headless Chromium binary was not found on this server.");
  }

  const htmlContent = generatePrintReportHTML(snapshot);
  const runId = crypto.randomBytes(12).toString("hex");
  const tempDir = os.tmpdir();
  const htmlPath = path.join(tempDir, `skr_astro_report_${runId}.html`);
  const pdfPath = path.join(tempDir, `skr_astro_report_${runId}.pdf`);

  await acquireRenderSlot();

  try {
    // Write application-controlled HTML template
    await fs.promises.writeFile(htmlPath, htmlContent, "utf8");

    // Chromium flags for deterministic, headless print-to-pdf
    const args = [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--no-pdf-header-footer",
      "--run-all-compositor-stages-before-draw",
      `--print-to-pdf=${pdfPath}`,
      htmlPath
    ];

    const timeoutMs = options.timeoutMs || 15000;
    await execFileAsync(chromePath, args, { timeout: timeoutMs });

    if (!fs.existsSync(pdfPath)) {
      throw new Error("PDF_GENERATION_FAILED: Chromium process exited without producing output file.");
    }

    const pdfBuffer = await fs.promises.readFile(pdfPath);
    return pdfBuffer;
  } finally {
    releaseRenderSlot();

    // Guaranteed ephemeral cleanup
    try {
      if (fs.existsSync(htmlPath)) await fs.promises.unlink(htmlPath);
    } catch (_) {}
    try {
      if (fs.existsSync(pdfPath)) await fs.promises.unlink(pdfPath);
    } catch (_) {}
  }
}

/**
 * High-level method accepting raw chartData and options
 */
export async function generateReportPdf(chartData, options = {}) {
  const snapshot = buildCanonicalReportSnapshot(chartData, options);
  const pdfBuffer = await renderSnapshotToPdfBuffer(snapshot, options);
  return {
    pdfBuffer,
    snapshot,
    fileName: `${snapshot.reportIdentifier}.pdf`
  };
}
