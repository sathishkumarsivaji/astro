# ASTROVERSE — Official Forensic Test Results Report

**Audit Date:** October 12, 2026  
**Release Version:** 3.0.0  
**Model Version:** 2.2.0  
**Git Branch / Commit:** `remediation/forensic-accuracy-and-release-integrity` (`6603089`)  
**Execution Environment:** Node.js v24.17.0, Windows x64  
**Total Test Suites Executed:** 10  
**Total Automated Assertions Verified:** 1,041+  
**Failures / Skipped / Blocked:** 0  
**Final Release Certification:** `RELEASE_CERTIFIED = true` (17/17 Gates Passed)

---

## 1. Executive Test Suite Execution Summary

| Suite Name | File / Command | Verified Checks | Passed | Failed | Exit Code | Certification Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **17-Point Release Certification Gate** | `node frontend/test_release_certification_gate.mjs` | 17 | 17 | 0 | 0 | **PASS** (`RELEASE_CERTIFIED = true`) |
| **Execution Provenance & Integrity** | `node frontend/test_execution_provenance_and_cache_integrity.mjs` | 19 | 19 | 0 | 0 | **PASS** |
| **Birth Reconstruction Validation** | `node frontend/test_birth_reconstruction_validation.mjs` | 16 | 16 | 0 | 0 | **PASS** |
| **Isolated Node Modules Regression** | `node frontend/test_partial_node_modules_gate_failure.mjs` | 6 | 6 | 0 | 0 | **PASS** |
| **Fabricated Defaults Regression** | `node frontend/test_phase2_fabricated_defaults_regression.mjs` | 15 | 15 | 0 | 0 | **PASS** |
| **Benchmark Metrics Reconciliation** | `node frontend/test_benchmark_metrics_reconciliation.mjs` | 5 | 5 | 0 | 0 | **PASS** |
| **Production Backend & Security** | `node backend/test_backend.mjs` | 88 | 88 | 0 | 0 | **PASS** |
| **Release PII Sanitization** | `node backend/test/test_no_pii_in_release.mjs` | 5 | 5 | 0 | 0 | **PASS** |
| **Golden Astronomical Ephemeris** | `node frontend/test_golden_astronomy.mjs` | 780 | 780 | 0 | 0 | **PASS** |
| **Cross-System Planetary Invariants** | `node frontend/test_cross_system_astronomical_consistency.mjs` | 90 | 90 | 0 | 0 | **PASS** |
| **TOTALS** | **10 Automated Test Suites** | **1,041+** | **1,041+** | **0** | **0** | **100% VERIFIED** |

---

## 2. Detailed Verification Breakdown

### 2.1 Release Certification Gate (17/17 Gates Passed)
- **Gate 01–03:** Verified runtime SHA-256 digests of `astroEngine.js` (`f20db0ff...`), `empiricalEvaluationEngine.js` (`88307ad6...`), and `discreteHazardSurvivalEngine.js` (`e6e6549c...`) match manifest entries.
- **Gate 04–05:** Verified aggregate prediction engine hash (`0aba3547...`) and internal engine hash match manifest prediction hash.
- **Gate 06–07:** Verified calibration model training split hash (`7cdd3611...`) and calibration file SHA (`029d3d5d...`) match manifest calibration hash.
- **Gate 08–09:** Verified benchmark engine and calibration hashes match across `benchmark_results.json`, `astro_databank_external_benchmark.json`, and `latestBenchmarkResults.json`.
- **Gate 10:** Verified authentic dataset hashes on disk (`train`: `7cdd3611...`, `blind`: `dc3fbde4...`, `adbDataset`: `116595d3...`) match manifest without field substitution.
- **Gate 11:** Verified 100% of 20,508 prediction cache records bound to manifest hashes across 17 mandatory fields.
- **Gate 12:** Verified clean package integrity: `package.json` and lockfile in sync; all 8 dependencies and binaries present in `node_modules`; zero untracked temp stores or bundled dependencies in release zip.
- **Gate 13:** Verified production build succeeds freshly; compiled `dist/index.html` verified.
- **Gate 14:** Verified static linting (`npm run lint` / oxlint) passes with 0 errors across 297 source files; zero banned synthetic heuristics found.
- **Gate 15:** Core astronomical calculations, divisional charts (D1, D9, D10), and null contracts verified.
- **Gate 16:** Epistemic anti-fabrication firewalls, LLM post-generation redaction, statutory disclaimers, and clinical medical safety verified.
- **Gate 17:** All 16 prerequisite gates passed; `RELEASE_CERTIFIED = true`.

### 2.2 Execution Provenance & Cache Integrity (19/19 Tests Passed)
- Verified binding of unique execution records across partitions:
  - Combined benchmark run: `RUN-COMBINED-BENCHMARK-20261010-001` ($N=6,940$, hits=$3,189$, misses=$3,751$).
  - Internal aggregate run: `RUN-INTERNAL-AGGREGATE-20261010-001` ($N=3,189$, hits=$3,189$, misses=$0$).
  - External independent run: `RUN-ADB-EXTERNAL-20261010-001` ($N=3,751$, hits=$0$, misses=$3,751$).
- Reconciled cache provenance: `metadata.cacheProvenance` strictly matches `metadata.executionRecord` within the same scope.
- Scope consistency: Verified that mismatched cache counters within the same scope fail validation.
- Preserved historical baseline counter ($17,623$) under `metadata.historicalCacheSnapshot`.
- Negative tamper-resistance: Tampered run IDs, cohort labels, impossible counters ($\text{hits} > N$), tampered engine hashes, and missing provenance blocks strictly fail validation.

### 2.3 Birth Reconstruction (Nashta Jataka) Validation (16/16 Tests Passed)
- **Check 1A–1B:** Missing answered events or coordinates return `status: "INSUFFICIENT_DATA"` and `null` chart values.
- **Check 2A–2B:** Missing event months set `month: null` and $T = \text{year} + 0.5$ without defaulting to May ($M=5$).
- **Check 3A–3B:** Palm profile discloses 2D elevation limitations; palm mounts contribute 0 points to candidate rankings.
- **Check 4A–4B:** Question registry IDs correctly mapped (`q6_first_job`, `q13_marriage`) to Dasha rules.
- **Check 5A:** Single event returns `INSUFFICIENT_DATA`, `AMBIGUOUS_MULTI_CANDIDATE`, and null date fields (`estimatedBirthYear: null`).
- **Check 5B:** Multiple consistent anchors yield `PLAUSIBLE_CANDIDATE_FOUND` with honest notices.
- **Check 5C–5D:** Chronological contradictions and invalid years fail closed with `CONTRADICTORY_DATES` / `INSUFFICIENT_DATA` and null date fields.
- **Check 5E:** Extreme timezone boundaries (-12 to +14) compute safely without crashing.
- **Check 5F:** Weak candidate score separation ($<3.0$) returns `NOT_DISCRIMINATING` and null birth date/time. Unconfirmed hypothesis preserved under `diagnosticEstimatedDateHypothesis`.
- **Check 5G:** Synthetic placeholder images produce non-personal illustrative templates.
- **Check 5H:** Tied candidates and unresolvable dates strictly withhold usable estimated birth dates.

### 2.4 Isolated Node Modules Dependency Regression (6/6 Cases Passed)
- All 6 cases tested in isolated `os.tmpdir()` sandboxes without touching workspace `node_modules`:
  - Complete mock installation (passes)
  - Missing required package (fails)
  - Missing required binary (fails)
  - Incomplete package installation (fails)
  - Missing `node_modules` directory (fails)
  - Interrupted installation with `.staging` (fails)

### 2.5 Benchmark Metrics Reconciliation (5/5 Checks Passed)
- Verified external Astro-Databank canonical metrics: Demographic MAE 6.41y (within $\pm 1$y: 19.38%) vs Astrological MAE 9.19y (within $\pm 1$y: 9.06%) on $N=320$.
- Verified internal blind-test canonical metrics: Demographic MAE 4.28y (within $\pm 1$y: 28.71%) vs Astrological MAE 6.89y (within $\pm 1$y: 13.01%) on $N=1,484$.
- Verified cross-cohort disclosure firewall: zero internal blind metrics leak into external benchmark artifacts.
- Verified survival LRT p-values ($p = 0.40662$ on internal, $p = 0.50833$ on external holdout).

### 2.6 Fabricated Defaults Regression (15/15 Tests Passed)
- Verified zero occurrence of hardcoded fallbacks: no `'06:45'` fallback string, no default 15° Sun degree, no synthetic elemental distributions `{fire:3, air:2, ...}`, no default planet houses/speeds, no default yoga outcomes, no default house 1 substitution, no default cohort probability (0.842), no default birth year (1950), and no default age (45.0).

### 2.7 Production Backend & Security (88/88 Checks Passed)
- Tested HMAC session authority, user authentication tiers, geocoding & timezone resolution, payment webhook HMAC signatures & idempotent replay defense, privacy & data erasure, pricing tiers (₹20, ₹50, ₹100, ₹200), multi-tenant isolation, automated secret scanning (zero hardcoded secrets), CSRF protection & HttpOnly cookie isolation, and AI evidence grounding & statutory disclaimers.

### 2.8 Golden Astronomy & Cross-System Consistency (870 Checks Passed)
- 780 golden planetary benchmarks verified against Swiss Ephemeris reference data with sub-arcsecond residuals.
- 90 cross-system invariant checks verified across 4 astronomical calculation engines across multiple historical and future epochs.
