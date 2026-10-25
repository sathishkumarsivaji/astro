/**
 * SKR ASTRO — Unified Production PDF Export Service
 * ====================================================
 * Version: 2.1.0
 * 
 * Replaces legacy raster html2canvas / broken jsPDF Indic font rendering with:
 * 1. Headless Chromium print-to-pdf backend export providing:
 *    - True HarfBuzz OpenType complex text shaping for Tamil script.
 *    - 100% genuine searchable, copyable Unicode Tamil text (no mojibake).
 *    - Crisp vector SVG charts (D1 Rasi and D9 Navamsha).
 *    - Strict A4 portrait print CSS with semantic pagination.
 * 2. Automatic fallback to client-side window/iframe print dialog when offline
 *    or when backend is unreachable.
 * 3. Canonical report snapshot model ensuring exact parity between UI,
 *    evaluated chart facts, and exported PDF documents.
 * 4. Zero hardcoded convergence values (0.91, 0.88, 0.86 removed).
 * 5. Deterministic interval containment for current dasha resolution.
 */

import { buildCanonicalReportSnapshot } from "./customerReport/reportSnapshotModel.js";
import { generatePrintReportHTML } from "./printReportTemplate.js";

/**
 * Triggers a client-side file download from an in-memory Blob.
 *
 * @param {Blob} blob
 * @param {string} fileName
 */
function triggerBlobDownload(blob, fileName) {
  if (typeof window === "undefined" || !window.URL) return;
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    try {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      // Safe cleanup
    }
  }, 2000);
}

/**
 * Fallback: Prints the report HTML using an invisible iframe or popup window.
 *
 * @param {string} printHTML
 */
function printViaPrintEngine(printHTML) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  try {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(printHTML);
    doc.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
      try {
        iframe.contentWindow.print();
      } catch (printErr) {
        console.warn("Iframe print invocation fallback:", printErr);
      }
      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch {
          // Safe cleanup
        }
      }, 4000);
    }, 600);
  } catch (err) {
    console.warn("Direct iframe print failed, falling back to window.open:", err);
    const win = window.open("", "_blank");
    if (win) {
      win.document.open();
      win.document.write(printHTML);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 600);
    }
  }
}

/**
 * Generates and downloads a high-precision, beautifully styled PDF in Tamil or English.
 *
 * Supported tiers:
 * - "short": 1-2 page essential summary snapshot
 * - "detailed": comprehensive life-domain master report with charts, metrics & timeline
 *
 * Supported audience modes:
 * - "client": direct, accessible guidance for the native
 * - "astrologer": auditable technical dossier with full planetary dignity and evidence IDs
 *
 * @param {Object} chartData - Complete astrological chart calculation bundle
 * @param {string} [lang="en"] - Language code ("ta" or "en")
 * @param {string} [tier="detailed"] - Report tier ("short" or "detailed")
 * @param {Function} [onProgress=null] - Optional progress callback (msg: string) => void
 * @param {Object} [options={}] - Extra options { audienceMode, asOf, viewMode, aiReportText }
 * @returns {Promise<{ success: boolean, method: string, reportIdentifier: string }>}
 */
export async function generateAstrologyReportPDF(
  chartData,
  lang = "en",
  tier = "detailed",
  onProgress = null,
  options = {}
) {
  if (!chartData || typeof chartData !== "object") {
    throw new Error("INVALID_CHART_DATA: A valid birth chart calculation object is required for PDF export.");
  }

  const isTamil = lang === "ta";
  const audienceMode = options.audienceMode || "client";

  if (onProgress) {
    onProgress(isTamil ? "கணக்கீட்டு தரவுகள் சரிபார்க்கப்படுகின்றன..." : "Validating calculation snapshot...");
  }

  // 1. Build canonical report snapshot
  const snapshot = buildCanonicalReportSnapshot(chartData, {
    language: lang,
    tier,
    audienceMode,
    asOf: options.asOf || new Date().toISOString()
  });

  const fileName = `SKR_ASTRO_${isTamil ? "Jathagam" : "Horoscope"}_${snapshot.reportIdentifier}.pdf`;

  // 2. Try high-precision Chromium backend export
  if (typeof fetch === "function") {
    try {
      if (onProgress) {
        onProgress(isTamil ? "உயர்தர PDF அறிக்கை உருவாக்கப்படுகிறது..." : "Rendering vector PDF via Chromium engine...");
      }

      const response = await fetch("/api/export/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chartData,
          lang,
          tier,
          audienceMode,
          options: {
            asOf: snapshot.asOf,
            viewMode: options.viewMode,
            aiReportText: options.aiReportText
          }
        })
      });

      if (response.ok) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/pdf")) {
          const blob = await response.blob();
          if (blob && blob.size > 0) {
            triggerBlobDownload(blob, fileName);
            if (onProgress) {
              onProgress(isTamil ? "பதிவிறக்கம் நிறைவுற்றது." : "Download complete.");
            }
            return {
              success: true,
              method: "chromium-backend",
              reportIdentifier: snapshot.reportIdentifier
            };
          }
        }
      }
    } catch (networkErr) {
      console.warn("Backend PDF service unavailable, proceeding with browser print engine fallback:", networkErr);
    }
  }

  // 3. Fallback to client print engine
  if (onProgress) {
    onProgress(isTamil ? "அச்சு உலாவி திறக்கப்படுகிறது..." : "Launching browser print engine...");
  }

  const printHTML = generatePrintReportHTML(snapshot);
  printViaPrintEngine(printHTML);

  if (onProgress) {
    onProgress(isTamil ? "அச்சு தயார்." : "Print ready.");
  }

  return {
    success: true,
    method: "browser-print-engine",
    reportIdentifier: snapshot.reportIdentifier
  };
}

export { buildCanonicalReportSnapshot } from "./customerReport/reportSnapshotModel.js";
export { generatePrintReportHTML } from "./printReportTemplate.js";
