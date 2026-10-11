# ASTROVERSE — Benchmark Provenance & Empirical Validation Report

**Release Candidate:** `v2.2.0-rc1` / `v3.0.0-audited`  
**Evaluation Standard:** Independent Historical Cohort Benchmark  
**Date:** October 2026  

---

## 1. Provenance Architecture & Dataset Partitions

ASTROVERSE empirical benchmarks are derived strictly from public historical cohorts with explicit Rodden Rating provenance:

1. **VedAstro Public Life Cohort:**
   - Total Raw Records: **15,807**
   - Valid Unique Persons: **15,710**
   - Quarantined / Excluded (Ambiguous time / duplicate): **87**
   - Documented Marriages: **16,797** (Exact-date marriages: **11,081**)
   - Partitions:
     - **TRAIN:** $N = 9,366$ (SHA-256: `7cdd3611bce0690e2ed21bbf53050bfc15382808c82c748765d1d8bfccbc6849`)
     - **VAL:** $N = 3,155$ (SHA-256: `9dc0eb5041f0bf52efd1ab973b02b6fed4e4f1bf5bc958c0b390c42322dac99a`)
     - **BLIND_TEST:** $N = 1,634$ (SHA-256: `dc3fbde4531282c862bf8665e9874ace4b4524879529b3341e0574ca270373b2`)
     - **INTERNAL_HOLDOUT:** $N = 1,555$ (SHA-256: `64abc012ebf5dce739e32cf633ab2473a94b05a37b2e19f46bf2c7ee15c8bdff`)

2. **Astro-Databank External Independent Holdout:**
   - Total Export: **6,036**
   - Overlap with VedAstro (Excluded): **1,238**
   - Independent Non-Overlapping Persons: **4,798**
   - Certified Rodden Rating A / AA: **3,751** (SHA-256: `116595d3a3cbdd61b78a4424b579d53f58610e16beb12085451ea0a31b59d392`)
   - Evaluated for Marriage: **313** records (302 events, 11 verified no-event negative controls)
   - Quarantined as `MISSING_OUTCOME`: **2,850** records lacking documented biographical marriage notes.
   - Quarantined as `RIGHT_CENSORED`: **556** records.

3. **Anti-Leakage Commitment Protocol:**
   - Every prediction is committed via SHA-256 pre-calculation hashing prior to outcome evaluation.
   - Training dataset fits baseline demographic hazards and Platt scaling parameters; validation and blind partitions remain strictly frozen.

---

## 2. Immutable Cryptographic Hash Ledger

| Provenance Dimension | Cryptographic SHA-256 Commitment Hash |
| :--- | :--- |
| **`astroEngine.js` Hash** | `f20db0ff723abf0303ddde815f7d0e786bf6412d7df4751ebfb97e7ed0f06c15` |
| **`empiricalEvaluationEngine.js` Hash** | `88307ad60eedf6bcfd5a9172ab59ef32c327c6008fb3d3b3e3c0259a7d9c7d31` |
| **`discreteHazardSurvivalEngine.js` Hash** | `e6e6549c3405d663cfcd88dc95c1c17db971960f17301759225ea9e986633481` |
| **Aggregate Prediction Engine Hash** | `0aba354759f94afc34f2140ef8fe3e2fb869080fc90405264f54f6a05750fbe1` |
| **Fitted Calibration Model Hash** | `029d3d5d6712d83989fd408ee86bdc30320bb0315eaddba4f04d61ece188adb3` |
| **Calibration Input Hash** | `58c1c3b7bb8defa0f7574bceb3bdf483bcf1489e511b068dae54a4340d87eb09` |
| **Training Dataset Hash** | `7cdd3611bce0690e2ed21bbf53050bfc15382808c82c748765d1d8bfccbc6849` |
| **Validation Dataset Hash** | `9dc0eb5041f0bf52efd1ab973b02b6fed4e4f1bf5bc958c0b390c42322dac99a` |
| **Blind Test Dataset Hash** | `dc3fbde4531282c862bf8665e9874ace4b4524879529b3341e0574ca270373b2` |
| **External Dataset Hash** | `116595d3a3cbdd61b78a4424b579d53f58610e16beb12085451ea0a31b59d392` |
| **Model Fit Hash** | `c13c1d9a0ea4c3c5269636a0e061c0e04f7579631230d419ec7854897661ac03` |
| **Model Coefficient Hash** | `ce15d202c56d9b2a56c3a25e76b46dcf9585f1e52c307054ef438ef1a8a9240f` |
| **Benchmark Code Hash** | `b00bca32c0a0cc147bb6c3726ea8845b06ad15aa6b370caa0ccdb95ce0289898` |
| **Cache Record Coverage** | **20,508 / 20,508 (100.0%)** cryptographically bound |

---

## 3. Empirical Results: Reconciled Canonical Metrics

### 3.1 Event Occurrence (Marriage Occurrence Target)
Because marriage prevalence in public celebrity registries is high (>90%), evaluating occurrence requires strict distinction between degenerate classifiers, non-discriminative classifiers, and genuine predictive performance:

| Cohort | N (eval) | Prev. | Applied Threshold | Accuracy | Specificity | Sensitivity | Balanced Acc | MCC | ROC-AUC | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Blind Test (Model 2: Astro)** | 1,584 | 91.2% | 0.91 | 33.40% | 74.82% | 29.41% | 52.12% | 0.0264 | 0.5569 | `NON_DISCRIMINATIVE` |
| **Holdout (Model 2: Astro)** | 1,509 | 91.6% | 0.91 | 34.66% | 77.17% | 30.75% | 53.96% | 0.0479 | 0.5419 | `NON_DISCRIMINATIVE` |
| **Astro-Databank (Model 2: Astro)** | 313 | 96.5% | 0.91 | 29.71% | 81.82% | 27.81% | 54.82% | 0.0397 | 0.5072 | `NON_DISCRIMINATIVE` |

*Finding: On the external Astro-Databank cohort, ROC-AUC is 0.5072 (95% CI [0.334, 0.680]), and MCC is 0.0109. The classifier does not statistically exceed chance performance out-of-sample.*

### 3.2 Event Timing: Astrological Peak Window vs Demographic Baseline
Timing metrics are rigorously segregated between the internal blind test and the independent external holdout:

| Cohort | Astrological MAE | Demographic Baseline MAE | Astrological Within ±1y | Demographic Within ±1y | Canonical Note |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Astro-Databank (External Independent)** | **9.19 years** | **6.41 years** | 9.06% | 19.38% | **Primary external benchmark** ($N=320$ timing cases) |
| **Blind Test (Internal)** | **6.89 years** | **4.28 years** | 13.01% | 28.71% | **Internal blind split** ($N=1,484$ timing cases) |

*Finding: On both internal and external cohorts, the actuarial demographic prior predicting median age at marriage ($\approx 26.0$ years) substantially outperforms raw astrological dasha timing windows.*

### 3.3 Discrete-Time Hazard Survival Model (V3)
The V3 hazard architecture models interval-specific hazard $\lambda(t)$ as:
$$\text{logit}(\lambda_i(t)) = \alpha(t) + \beta_{\text{demographic}} \cdot X_{\text{cohort}} + \beta_{\text{astro}} \cdot S_i(t)$$

- **Fitted TRAIN $\beta_{\text{astro}}$:** $+0.734$ (Optimization converged via Newton-Raphson).
- **Likelihood Ratio Test on External Holdout:**
  - Null log-likelihood: $-2,017.92$
  - Combined log-likelihood: $-2,017.70$
  - $\text{LRT Statistic} = 2 \cdot (\ell_{\text{comb}} - \ell_{\text{null}}) = 0.4375$
  - $p$-value ($df = 1$): **$0.50833$** (Not statistically significant).
- **Concordance Index (C-Index):** $0.5345$ (95% CI [$0.5038, 0.5653$]).

---

## 4. Reconciliation of Historical vs Canonical Benchmark Values

Prior preliminary working drafts reported intermediate figures from varying exploratory subset filters (e.g. MAE 6.89y vs 4.28y evaluated solely on an internal blind subset without external distinction).

**The Canonical Standard Enforced:**
1. **Canonical External Metric:** Astrological MAE is **9.19 years** vs Demographic Baseline **6.41 years** on the 320 evaluable Astro-Databank cases.
2. **Canonical Internal Metric:** Astrological MAE is **6.89 years** vs Demographic Baseline **4.28 years** on the 1,484 internal blind-test cases.
3. Older figures without cohort qualification are officially archived and retired. All UI dashboards (`RealWorldAccuracyDashboard.jsx`), release manifests, and documentation display both figures with explicit cohort attribution.

---

## 5. Summary Conclusion & Certification

- **Prediction Classification:** All astrological event occurrence and timing outputs remain strictly designated as `EXPERIMENTAL / NOT_EMPIRICALLY_VALIDATED`.
- **Epistemological Integrity:** AstroVerse establishes that astronomical calculation accuracy (sub-arcsecond ephemeris precision) must never be conflated with real-world predictive validity.
- **Release Status:** Complete mathematical, cryptographic, and software integrity verified across all 17 gates (`RELEASE_CERTIFIED = true`).
