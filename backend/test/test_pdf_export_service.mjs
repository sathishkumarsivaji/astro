/**
 * Test PDF Export Service directly in backend
 * Validates Headless Chromium PDF Generation, Unicode Tamil Text Shaping & Extraction
 */

import assert from "node:assert/strict";
import fs from "fs";
import { execSync } from "child_process";
import { calculateChartBySystem } from "../../frontend/src/astrology/index.js";
import { generateReportPdf, isChromiumAvailable } from "../src/services/pdfExportService.js";

console.log("=== TESTING PDF EXPORT SERVICE & UNICODE TAMIL EXTRACTION ===");

assert.ok(isChromiumAvailable(), "Chromium must be available on the system");

const birthData1994 = {
  birthDate: "1994-08-15",
  birthTime: "14:30:00",
  latitude: 13.0827,
  longitude: 80.2707,
  timezoneId: "Asia/Kolkata",
  utcOffset: 5.5
};

const chart1994 = calculateChartBySystem("lahiri", birthData1994);

// 1. Generate Tamil Detailed PDF Report
console.log("\n1. Generating Tamil Detailed PDF Report (1994 chart)...");
const resultTa = await generateReportPdf(chart1994, { lang: "ta", tier: "detailed" });
assert.ok(resultTa.pdfBuffer instanceof Buffer, "Must return PDF buffer");
assert.ok(resultTa.pdfBuffer.length > 5000, "PDF buffer must have reasonable size");
console.log(`   ✓ Generated Tamil Detailed PDF: ${resultTa.fileName} (${resultTa.pdfBuffer.length} bytes)`);

const testPdfPath = "d:/ASTRO/test_generated_tamil_report.pdf";
fs.writeFileSync(testPdfPath, resultTa.pdfBuffer);

// 2. Extract text using python pypdf from Tamil PDF
console.log("\n2. Extracting text via pypdf from Tamil PDF...");
const pythonExtractScript = `
import pypdf, re
reader = pypdf.PdfReader('${testPdfPath}')
full_text = []
for idx, page in enumerate(reader.pages):
    raw_page_text = page.extract_text()
    logical_page_text = re.sub(r'([\\u0bc6\\u0bc7\\u0bc8])([\\u0b95-\\u0bb9])', r'\\2\\1', raw_page_text)
    logical_clean = re.sub(r'\\s+', ' ', logical_page_text)
    full_text.append(f'PAGE {idx+1}:\\n' + logical_clean)
all_text = '\\n'.join(full_text)
print('PAGE_COUNT:', len(reader.pages))
print('TOTAL_TEXT_LEN:', len(all_text))

required = [
    'ஜாதக அறிக்கை',
    'பிறந்த நாள் மற்றும் நேரம்',
    'அனுஷம்',
    'சந்திரன்',
    'சுக்கிரன்',
    'சூரியன்',
    'செவ்வாய்',
    'குரு',
    'சனி',
    'புதன்'
]
for req in required:
    found = req in all_text
    print(f'KEYWORD [{req}]:', 'FOUND' if found else 'MISSING')
    assert found, f'Missing required keyword: {req}'

assert '\\x0b' not in all_text, 'Corrupt \\x0b detected in text'
assert '[object Object]' not in all_text, 'Unresolved [object Object] detected in PDF text'
print('CORRUPT_BYTES_CHECK: PASS')
print('OBJECT_OBJECT_CHECK: PASS')
`;

fs.writeFileSync("d:/ASTRO/test_extract.py", pythonExtractScript);
const output1 = execSync("python d:/ASTRO/test_extract.py", { encoding: "utf8" });
console.log(output1);

// 3. Test Ashwini Nakshatra in Tamil PDF
console.log("\n3. Testing Ashwini (அசுவினி) Nakshatra in 2000-01-15 Chart...");
const birthData2000 = {
  birthDate: "2000-01-15",
  birthTime: "12:00:00",
  latitude: 13.0827,
  longitude: 80.2707,
  timezoneId: "Asia/Kolkata",
  utcOffset: 5.5
};
const chart2000 = calculateChartBySystem("lahiri", birthData2000);
const resultAshwini = await generateReportPdf(chart2000, { lang: "ta", tier: "detailed" });
const ashwiniPdfPath = "d:/ASTRO/test_generated_ashwini_report.pdf";
fs.writeFileSync(ashwiniPdfPath, resultAshwini.pdfBuffer);

const pythonAshwiniScript = `
import pypdf, re
reader = pypdf.PdfReader('${ashwiniPdfPath}')
all_text = ' '.join([p.extract_text() for p in reader.pages])
all_text = re.sub(r'([\\u0bc6\\u0bc7\\u0bc8])([\\u0b95-\\u0bb9])', r'\\2\\1', all_text)
assert 'அசுவினி' in all_text, 'Expected அசுவினி in extracted text'
assert '\\x0b' not in all_text, 'Corrupt \\x0b detected'
print('ASHWINI_KEYWORD: FOUND')
print('ASHWINI_CORRUPT_CHECK: PASS')
`;
fs.writeFileSync("d:/ASTRO/test_ashwini.py", pythonAshwiniScript);
const output2 = execSync("python d:/ASTRO/test_ashwini.py", { encoding: "utf8" });
console.log(output2);

// 4. Generate English Snapshot PDF
console.log("\n4. Generating English Snapshot PDF (tier: short)...");
const resultEn = await generateReportPdf(chart1994, { lang: "en", tier: "short" });
assert.ok(resultEn.pdfBuffer.length > 5000, "English snapshot must be non-empty");
console.log(`   ✓ Generated English Snapshot: ${resultEn.fileName} (${resultEn.pdfBuffer.length} bytes)`);

// 5. Test Astrologer Dossier mode
console.log("\n5. Generating Astrologer Evidence Dossier...");
const resultDossier = await generateReportPdf(chart1994, { lang: "en", tier: "detailed", audienceMode: "astrologer" });
assert.ok(resultDossier.pdfBuffer.length > 5000, "Astrologer dossier must be non-empty");
console.log(`   ✓ Generated Astrologer Dossier: ${resultDossier.fileName} (${resultDossier.pdfBuffer.length} bytes)`);

// Clean up scratch python scripts
try {
  fs.unlinkSync("d:/ASTRO/test_extract.py");
  fs.unlinkSync("d:/ASTRO/test_ashwini.py");
  fs.unlinkSync(testPdfPath);
  fs.unlinkSync(ashwiniPdfPath);
} catch {}

console.log("\n=== ALL PDF EXPORT SERVICE TESTS PASSED PERFECTLY ===");
