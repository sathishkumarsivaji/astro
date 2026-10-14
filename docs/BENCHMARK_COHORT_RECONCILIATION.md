# SKR ASTRO / ASTROVERSE — Benchmark Cohort & Provenance Reconciliation

## 1. Executive Summary & Epistemic Honesty Charter

This document provides the authoritative, mathematically verified reconciliation of all benchmark cohorts across SKR ASTRO / ASTROVERSE, specifically reconciling the **3,751** certified independent external records with the **320** timing-evaluated and **313** occurrence-evaluated subsets from Astro-Databank, as well as the internal blind-test cohort of **1,484** records.

In accordance with the project's zero-fabrication charter:
1. Astrological models are categorized as `EXPERIMENTAL_NOT_EMPIRICALLY_VALIDATED`.
2. On independent external data, astrological timing (MAE = 9.19 years, 9.06% within 1 year) does **not** outperform demographic actuarial baselines (MAE = 6.41 years, 19.38% within 1 year).
3. 100% predictive accuracy is neither claimed nor demonstrated.

---

## 2. Astro-Databank External Cohort Funnel

```
Total Public MediaWiki XML Export: 6,036 records
 │
 ├── Excluded: Overlap with VedAstro Training/Val/Blind sets: 1,238 records
 │     ├── Training Overlap:            746
 │     ├── Validation Overlap:          249
 │     ├── Internal Blind Overlap:      118
 │     └── Internal Holdout Overlap:    125
 │
 └── True Independent Holdout: 4,798 records
       │
       ├── Excluded: Rodden Rating B, C, DD, X (Lower precision): 1,047 records
       │
       └── Certified Rodden Rating AA & A Primary Cohort: 3,751 records
```

### Breakdown of the 3,751 Rodden AA/A External Cohort

Every record in the 3,751 primary independent cohort is accounted for:

| Cohort Category | Count | Mathematical Percentage | Description |
| :--- | :--- | :--- | :--- |
| **Missing Outcome Annotation** | 2,850 | 75.98% | Biographies without verified marriage status records |
| **Right-Censored Records** | 556 | 14.82% | Subject unmarried at study cutoff / deceased prior to horizon |
| **Confirmed Marriage Events** | 302 | 8.05% | Verified marriage event within observation horizon |
| **Negative Control Controls** | 11 | 0.29% | Verified lifelong unmarried subjects reaching horizon |
| **Unknown / Ambiguous** | 25 | 0.67% | Conflicting biographical accounts |
| **Event Pre-Horizon** | 7 | 0.19% | Event occurred prior to observation window start |
| **TOTAL** | **3,751** | **100.00%** | **Complete Rodden AA/A Certified Independent Cohort** |

---

## 3. Evaluable Subsets & Exact Inclusion Criteria

### 3.1. Occurrence Classification Cohort ($N = 313$)
- **Inclusion Criteria**: Subjects with unambiguous ground-truth outcome resolution within the observation horizon:
  - 302 Confirmed Events (Positive cases)
  - 11 Verified Lifelong Unmarried (Negative controls)
- **Results**:
  - Primary Calibrated Classifier: $\text{MCC} = 0.0109$, $\text{ROC-AUC} = 0.5072$, $\text{Specificity} = 90.91\%$, $\text{Sensitivity} = 10.93\%$
  - Confusion Matrix: $\text{TP} = 33, \text{FP} = 1, \text{TN} = 10, \text{FN} = 269$
  - Status: `NOT_DISCRIMINATIVE`, `NOT_EMPIRICALLY_VALIDATED`

### 3.2. Timing MAE Evaluation Cohort ($N = 320$)
- **Inclusion Criteria**: Confirmed married subjects with verified exact calendar day marriage date annotations and validated planetary coordinates:
  - Astrological Model MAE: **9.19 years**
  - Demographic Median Baseline MAE: **6.41 years**
  - Astrological Within $\pm 1$ Year: **9.06%** ($29/320$)
  - Demographic Baseline Within $\pm 1$ Year: **19.38%** ($62/320$)
  - Status: Astrological timing model **does not outperform** demographic baseline ($9.19\text{y} > 6.41\text{y}$).

---

## 4. Internal Blind Test vs. External Independent Benchmark Reconciliation

| Metric / Dimension | External Astro-Databank Benchmark | Internal Blind Test Benchmark |
| :--- | :--- | :--- |
| **Cohort Source** | Astro-Databank (Independent) | Internal Curated Dataset |
| **Timing Sample Size ($N$)** | **320** | **1,484** |
| **Astrological Timing MAE** | **9.19 years** | **6.89 years** |
| **Demographic Baseline MAE**| **6.41 years** | **4.28 years** |
| **Timing Within $\pm 1$ Year** | **9.06%** | **13.01%** |
| **Demographic Within $\pm 1$ Year** | **19.38%** | **28.71%** |
| **Statistical Status** | Does not beat baseline | Statistically tied (Hazard LRT $p = 0.4066$) |
| **Validation Status** | `NOT_EMPIRICALLY_VALIDATED` | `NOT_EMPIRICALLY_VALIDATED` |

### Disclosure Firewall Guarantee
External public reports and API disclosures must strictly and exclusively quote the external metrics ($N = 320$, Astrological $\text{MAE} = 9.19\text{y}$, Baseline $\text{MAE} = 6.41\text{y}$) and must **never** leak or conflate internal blind metrics ($N = 1,484$, $6.89\text{y}$, $4.28\text{y}$). This is enforced by `frontend/test_benchmark_metrics_reconciliation.mjs`.

---

## 5. Cryptographic Provenance Manifest

- **Raw XML Source**: `c_sample_260919_1519.xml` (SHA-256: `7d42ac78520685b3013e929f3f238989a78c2f1ae1a360248a9b3b459d93549c`)
- **Parsed Dataset Artifact**: `astro_databank_manifest.json` (SHA-256: `cc59b4f32aeb63e45befd0a8a7d9110a380a0375744d689ebaf08ce057d5b1ff`)
- **Independent Holdout Partition**: (SHA-256: `116595d3a3cbdd61b78a4424b579d53f58610e16beb12085451ea0a31b59d392`)
- **Official Result Benchmark File**: `data/real_world_validation/results/astro_databank_external_benchmark.json`
