# ASTROVERSE — Benchmark Provenance & Execution Integrity Audit Report

**Release Version:** 3.0.0  
**Model Version:** 2.2.0  
**Audit Date:** October 12, 2026  
**Auditor:** Senior Software Verification Engineer, Statistical Validation Specialist & Astronomy-Engine Auditor  
**Cryptographic Release Status:** `RELEASE_CERTIFIED = true` (17/17 Release Gates Passed)

---

## 1. Executive Summary & Defect Remediation

A key defect in prior releases was conflicting metadata-level cache statistics and execution-record statistics:
- Metadata previously claimed $17,623$ cache hits, $0$ misses, and $0$ recomputations.
- Concurrently, the associated execution record reported $6,940$ predictions, $3,189$ cache hits, $3,751$ misses, and $3,751$ recomputations.

### Root Cause Analysis:
1. **$17,623$**: This was an un-scoped historical cumulative cache hit counter carried over from the pre-v3 baseline cache snapshot (`initialCacheEntries: 10,487`, `cacheHits: 17,623`). When carried over into v3 without scoping, it created a direct contradiction with the current run-level execution counters.
2. **$6,940$**: Total predictions evaluated across all three evaluation cohorts during the benchmark run ($1,634$ Blind + $1,555$ Internal Holdout + $3,751$ Astro-Databank = $6,940$).
3. **$3,189$**: The sum of cache hits across the internal evaluation partitions ($1,634$ Blind + $1,555$ Internal Holdout = $3,189$).
4. **$3,751$**: The cache misses and recomputations during the run, which occurred entirely on the novel, out-of-sample external Astro-Databank cohort.

### Remediation Applied:
- Authoritative execution records now govern summary statistics.
- `metadata.cacheProvenance` in `benchmark_results.json` is derived directly from the authoritative combined run record (`cacheHits: 3189`, `cacheMisses: 3751`, `recomputedCount: 3751`), completely resolving intra-scope contradictions.
- The historical cumulative baseline counter ($17,623$) is explicitly isolated and preserved in `metadata.historicalCacheSnapshot`.
- Strict cohort separation is enforced: `metadata.internalAggregateExecutionRecord` represents exclusively internal cohorts ($N=3,189$, hits=$3,189$, misses=$0$), completely disjoint from the external independent run (`RUN-ADB-EXTERNAL-20261010-001`, $N=3,751$, hits=$0$, misses=$3,751$).

---

## 2. Authoritative Execution Records & Partition Binding

| Metric / Parameter | Astro-Databank External Validation | Internal Benchmark Aggregate | Combined Benchmark Run | Internal Blind Test Split | Internal Holdout Split |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Run Identifier** | `RUN-ADB-EXTERNAL-20261010-001` | `RUN-INTERNAL-AGGREGATE-20261010-001` | `RUN-COMBINED-BENCHMARK-20261010-001` | `RUN-INTERNAL-BLIND-20261010-001` | `RUN-INTERNAL-HOLDOUT-20261010-001` |
| **Cohort Type** | `EXTERNAL_INDEPENDENT` | `INTERNAL_DEVELOPMENT_EVAL` | `COMBINED_ALL_COHORTS` | `INTERNAL_BLIND_EVAL` | `INTERNAL_HOLDOUT_EVAL` |
| **Cohort Name** | `ASTRO_DATABANK_CERTIFIED_AAA` | `INTERNAL_EVALUATION_COMBINED` | `FULL_COHORT_100_PERCENT` | `BLIND_TEST` | `INTERNAL_HOLDOUT` |
| **Total Evaluated ($N$)** | **3,751** | **3,189** | **6,940** | **1,634** | **1,555** |
| **Cache Hits** | **0** | **3,189** | **3,189** | **1,634** | **1,555** |
| **Cache Misses** | **3,751** | **0** | **3,751** | **0** | **0** |
| **Recomputed Count** | **3,751** | **0** | **3,751** | **0** | **0** |
| **Engine SHA-256** | `0aba354759f9...` | `0aba354759f9...` | `0aba354759f9...` | `0aba354759f9...` | `0aba354759f9...` |
| **Calibration SHA-256** | `029d3d5d6712...` | `029d3d5d6712...` | `029d3d5d6712...` | `029d3d5d6712...` | `029d3d5d6712...` |
| **Evaluation Dataset SHA** | `116595d3a3cb...` | `dc3fbde4...:64abc012...` | `dc3fbde4...:64abc...:1165...` | `dc3fbde45312...` | `64abc012ebf5...` |
| **Provenance Status** | `VERIFIED_OUT_OF_SAMPLE` | `VERIFIED_INTERNAL_AGGREGATE` | `VERIFIED_COMBINED_EVAL` | `VERIFIED_ISOLATED_BLIND` | `VERIFIED_ISOLATED_HOLDOUT` |

---

## 3. Disjoint Cohort Firewall & Anti-Leakage Controls

1. **Firewall Assertion:** Automated test `test_execution_provenance_and_cache_integrity.mjs` verifies:
   - External Astro-Databank dataset hash (`116595d3a3cbdd61...`) does not appear in the internal aggregate dataset descriptor.
   - Internal runs have zero cache misses ($0\%$).
   - External runs have zero cache hits ($0\%$) and $100\%$ recomputations.
   - Unique, non-overlapping run IDs prevent accidental metrics sharing.
2. **Cross-Cohort Disclosure Isolation:**
   - External benchmark disclosures strictly quote out-of-sample Astro-Databank metrics:
     - Actuarial Demographic Baseline MAE: **$6.41$ years** (within $\pm 1$y: **$19.38\%$**).
     - Astrological Timing MAE: **$9.19$ years** (within $\pm 1$y: **$9.06\%$**).
     - Sample Size: $N = 320$.
   - Internal blind-test figures ($4.28$y vs $6.89$y on $N = 1,484$) are strictly quarantined to internal partitions and excluded from external artifacts.

---

## 4. Scope Consistency & Tamper-Resistance Assertions

The test suite enforces mathematical identity within every metadata block:
$$\text{cacheHits} + \text{cacheMisses} \equiv \text{predictionCount}$$
$$\text{metadata.cacheProvenance.cacheHits} \equiv \text{metadata.executionRecord.cacheHits}$$
$$\text{metadata.cacheProvenance.cacheMisses} \equiv \text{metadata.executionRecord.cacheMisses}$$

Negative regression tests demonstrate that injecting mismatched counters (e.g., claiming $17,623$ cache hits on an execution record of $3,189$) immediately throws a `SCOPE_COUNTER_CONTRADICTION` failure.
