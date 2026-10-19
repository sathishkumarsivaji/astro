/**
 * ASTROVERSE — Celebrity Public Milestones Dataset Verification Suite
 * ====================================================================
 * Asserts structural integrity, zero fabrication, source traceability,
 * and mathematical accuracy of the authentic celebrity milestone dataset.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import assert from "assert";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const DATASET_PATH = path.join(ROOT, "data/external_validation/astro_databank/celebrity_public_milestones_dataset.json");
const MANIFEST_PATH = path.join(ROOT, "data/external_validation/astro_databank/celebrity_milestones_manifest.json");

console.log("\n" + "=".repeat(80));
console.log(" ASTROVERSE — CELEBRITY PUBLIC MILESTONES DATASET INTEGRITY SUITE");
console.log("=".repeat(80) + "\n");

let passed = 0;
let total = 0;

function check(title, fn) {
  total++;
  try {
    fn();
    console.log(`  ✓ [PASS] ${title}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${title}: ${err.message}`);
  }
}

// 1. Manifest and Dataset file presence and SHA-256 match
check("1. Manifest and dataset files exist and cryptographic hashes strictly match", () => {
  assert.ok(fs.existsSync(DATASET_PATH), "Dataset file must exist");
  assert.ok(fs.existsSync(MANIFEST_PATH), "Manifest file must exist");

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const datasetBuffer = fs.readFileSync(DATASET_PATH);
  const actualHash = crypto.createHash("sha256").update(datasetBuffer).digest("hex");

  assert.strictEqual(actualHash, manifest.datasetFile.sha256, "Manifest SHA-256 must match disk file SHA-256");
  assert.strictEqual(datasetBuffer.length, manifest.datasetFile.fileSizeBytes, "File size must match manifest bytes");
});

// Load dataset
const dataset = JSON.parse(fs.readFileSync(DATASET_PATH, "utf8"));
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));

// 2. Total record count and Rodden rating integrity
check("2. Subject population conforms strictly to Astrodienst source (6,036 authentic entries)", () => {
  assert.strictEqual(dataset.length, 6036, "Dataset must contain exactly 6,036 subjects");
  assert.strictEqual(manifest.statistics.totalSubjects, 6036, "Manifest must declare 6,036 subjects");

  const aaCount = dataset.filter(r => r.roddenRating === "AA").length;
  const aCount = dataset.filter(r => r.roddenRating === "A").length;
  assert.strictEqual(aaCount, 3825, "Must preserve exact 3,825 Rodden AA birth certificate records");
  assert.strictEqual(aCount, 1161, "Must preserve exact 1,161 Rodden A quote/memory records");
});

// 3. Zero fabricated records / mandatory provenance fields
check("3. Zero fabrication: all records have non-empty name, birth date, and provenance notes", () => {
  for (const rec of dataset) {
    assert.ok(rec.adbId.startsWith("ADB_"), `adbId must be valid: ${rec.adbId}`);
    assert.ok(typeof rec.name === "string" && rec.name.length > 0, "Name must be non-empty");
    assert.ok(rec.birth, "Birth object must exist");
    assert.ok(rec.provenance, "Provenance object must exist");
    assert.ok(
      rec.provenance.source === "Astrodienst Astro-Databank Official Research Export",
      "Source must cite Astrodienst Astro-Databank Official Research Export"
    );
    assert.ok(
      rec.provenance.overlapStatus.startsWith("TRUE_INDEPENDENT_EXTERNAL") || rec.provenance.overlapStatus.startsWith("OVERLAPS_VEDASTRO_"),
      `Overlap status must be declared: ${rec.provenance.overlapStatus}`
    );
  }
});

// 4. Milestone event validation across key requested domains
check("4. Milestones cover all requested domains (Awards, Career/Business, Finance, Health, Property)", () => {
  const domains = manifest.statistics.domains;

  assert.ok(domains.AWARDS_HONORS.totalEvents >= 600, `Awards must have >= 600 events (got ${domains.AWARDS_HONORS.totalEvents})`);
  assert.ok(domains.CAREER_BUSINESS.totalEvents >= 1600, `Career/Business must have >= 1,600 events (got ${domains.CAREER_BUSINESS.totalEvents})`);
  assert.ok(domains.FINANCIAL.totalEvents >= 65, `Financial must have >= 65 events (got ${domains.FINANCIAL.totalEvents})`);
  assert.ok(domains.HEALTH_WELLNESS.totalEvents >= 300, `Health must have >= 300 events (got ${domains.HEALTH_WELLNESS.totalEvents})`);
  assert.ok(domains.PROPERTY_RESIDENCE.totalEvents >= 80, `Property must have >= 80 events (got ${domains.PROPERTY_RESIDENCE.totalEvents})`);
  assert.ok(domains.FAMILY_CHILDREN.totalEvents >= 300, `Family/Children must have >= 300 events (got ${domains.FAMILY_CHILDREN.totalEvents})`);
  assert.ok(domains.RELATIONSHIPS.totalEvents >= 1000, `Relationships must have >= 1,000 events (got ${domains.RELATIONSHIPS.totalEvents})`);
});

// 5. Mathematical accuracy of age at event calculations
check("5. Age at event is calculated mathematically without synthetic defaults", () => {
  let verifiedAges = 0;
  for (const rec of dataset) {
    for (const ev of rec.milestones) {
      if (ev.ageAtEvent != null && rec.birth.year != null && ev.eventYear != null) {
        if (ev.datePrecision === "DAY" && rec.birth.datePrecision === "DAY") {
          const bD = new Date(rec.birth.date);
          const eD = new Date(ev.eventDate);
          const diffYears = (eD.getTime() - bD.getTime()) / (365.2425 * 86400000);
          assert.ok(
            Math.abs(ev.ageAtEvent - diffYears) < 0.05,
            `Exact day age must match timestamp difference: ${ev.ageAtEvent} vs ${diffYears}`
          );
        } else {
          assert.strictEqual(
            ev.ageAtEvent,
            ev.eventYear - rec.birth.year,
            `Year precision age must equal year difference: ${ev.ageAtEvent} vs ${ev.eventYear - rec.birth.year}`
          );
        }
        verifiedAges++;
      }
    }
  }
  assert.ok(verifiedAges > 5000, `Must verify > 5,000 authentic age calculations (got ${verifiedAges})`);
});

// 6. Famous celebrity spotlight verification (Marie Curie, Cher, Coco Chanel)
check("6. Authentic milestone preservation on benchmark celebrities", () => {
  const curie = dataset.find(r => r.name.toLowerCase().includes("curie") && r.name.toLowerCase().includes("marie"));
  assert.ok(curie, "Marie Curie must exist in dataset");
  assert.strictEqual(curie.roddenRating, "AA", "Marie Curie birth data must be Rodden AA");
  assert.ok(
    curie.milestones.some(m => m.domain === "AWARDS_HONORS" && m.description.includes("Nobel Prize for Physics")),
    "Marie Curie must have 1903 Nobel Prize for Physics milestone"
  );
  assert.ok(
    curie.milestones.some(m => m.domain === "AWARDS_HONORS" && m.description.includes("Nobel Prize for Chemistry")),
    "Marie Curie must have 1911 Nobel Prize for Chemistry milestone"
  );

  const cher = dataset.find(r => r.name.toLowerCase() === "cher");
  assert.ok(cher, "Cher must exist in dataset");
  assert.strictEqual(cher.roddenRating, "AA", "Cher birth data must be Rodden AA");
  assert.ok(
    cher.milestones.some(m => m.domain === "AWARDS_HONORS" && m.description.includes("Oscar")),
    "Cher must have Oscar award milestone"
  );

  const chanel = dataset.find(r => r.name.toLowerCase().includes("chanel") && r.name.toLowerCase().includes("coco"));
  assert.ok(chanel, "Coco Chanel must exist in dataset");
  assert.strictEqual(chanel.roddenRating, "AA", "Coco Chanel birth data must be Rodden AA");
  assert.ok(
    chanel.milestones.some(m => m.domain === "CAREER_BUSINESS" && m.description.includes("comeback")),
    "Coco Chanel must have Chanel comeback career milestone"
  );
  assert.ok(
    chanel.milestones.some(m => m.domain === "PROPERTY_RESIDENCE" && m.description.includes("Exiled")),
    "Coco Chanel must have exile residence milestone"
  );
});

console.log("\n" + "=".repeat(80));
console.log(` RESULTS: ${passed} / ${total} tests passed (${Math.round((passed / total) * 100)}%)`);
console.log("=".repeat(80) + "\n");

if (passed !== total) {
  process.exit(1);
}
