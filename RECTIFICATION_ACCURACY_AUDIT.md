# ASTROVERSE — Birth-Time Rectification (Nashta Jataka) Accuracy & Abstention Audit

**Audit Date:** October 12, 2026  
**Release Version:** 3.0.0  
**Model Version:** 2.2.0  
**Auditor:** Senior Software Verification Engineer, Statistical Validation Specialist & Astronomy-Engine Auditor  
**Epistemic Certification:** `EXPERIMENTAL / NOT_EMPIRICALLY_VALIDATED`

---

## 1. Executive Summary & Epistemic Verdict

Birth-time reconstruction (*Nashta Jataka*) is an inverse estimation problem: attempting to recover unknown birth dates, times, and rising signs (*Lagna*) from reported milestone events (education, marriage, employment, relocation) and physical palm characteristics.

### Critical Verdict:
1. **Synthetic Unit Tests Do Not Prove Real-World Predictive Validity**: The automated test suites demonstrate numerical convergence, fail-closed abstention, and schema contract conformance. However, **the repository contains zero annotated real human palm photographs linked to verified civil hospital birth certificates**. Passing synthetic tests confirms software implementation stability, **not** real-world birth-time estimation accuracy.
2. **Abstention & Nullification of Unconfirmed Birth Dates**:
   - A critical defect in prior releases was that when candidate evaluation returned `status: "NOT_DISCRIMINATING"` or `INSUFFICIENT_DATA`, the return object still exposed `estimatedBirthYear`, `candidateBirthMonthNum`, and `candidateBirthDayNum`.
   - **Remediation**: When candidate evaluation does not yield `status: "PLAUSIBLE_CANDIDATE_FOUND"`, the engine strictly returns `estimatedBirthYear: null`, `candidateBirthMonthNum: null`, `candidateBirthDayNum: null`, `candidateMonthWindow: null`, `timeWindow: null`, `probableLagna: null`, and `probableMoonRashi: null`. Unconfirmed diagnostic hypothesis numbers are sequestered under `diagnosticEstimatedDateHypothesis` with clear warnings.
3. **Decoupling of Palm Analysis**: Because consumer 2D smartphone photographs cannot physically measure 3D palmar mount elevation, the static palm profile and placeholder image analysis have been **completely decoupled from candidate Lagna scoring** (`candidateScoringApplicable: false`). Palm analysis is presented solely as an illustrative reference (`isIllustrativeReferenceOnly: true`).
4. **Elimination of Unsupported Precision & Error Margins**: Fabricated error margins ($\pm 3$, $\pm 4$, $\pm 5$ months) and the UI counter (`liveErrorMarginMonths`) have been completely eliminated. All reconstructed birth windows are labeled as `UNCALIBRATED_HEURISTIC_ESTIMATE` with `errorMarginStatus: "UNCALIBRATED"`.
5. **User Agency & Confirmation Gate**: The wizard UI strictly disables the "Generate Natal Chart With This Time" button unless `result.status === "PLAUSIBLE_CANDIDATE_FOUND"`. Even then, it enforces an un-bypassable modal confirmation prompt (`window.confirm`) with statutory disclosures before applying the estimated chart to the active session.

---

## 2. Forensic Analysis of Past Deficiencies & Remediations

### 2.1 The Premature Date Exposure Defect
- **Original Defect:** In `nashtaJatakaEngine.js`, when candidate scores were flat or weakly separated ($\Delta < 3.0$), the engine marked `status = "NOT_DISCRIMINATING"`, yet returned `estimatedBirthYear: candidateBirthYear, candidateBirthMonthNum, candidateBirthDayNum`. UI consumers or API callers could therefore misinterpret this as a confirmed estimated birth date.
- **Remediation:**
  ```javascript
  // In nashtaJatakaEngine.js (fail-closed return for NOT_DISCRIMINATING / INSUFFICIENT_DATA):
  estimatedBirthYear: null,
  candidateBirthMonthNum: null,
  candidateBirthDayNum: null,
  diagnosticEstimatedDateHypothesis: {
    unconfirmedBirthYear: candidateBirthYear,
    unconfirmedBirthMonthNum: candidateBirthMonthNum,
    unconfirmedBirthDayNum: candidateBirthDayNum,
    note: "Diagnostic hypothesis only; unconfirmed and unusable as estimated birth date due to non-discriminating or insufficient astrological candidate separation."
  },
  candidateMonthWindow: null,
  timeWindow: null,
  probableLagna: null,
  probableMoonRashi: null
  ```

### 2.2 UI Consumer Audit (`BirthRecoveryWizard.jsx`)
- **Banner Added:** An explicit high-visibility warning banner is rendered for `NOT_DISCRIMINATING`:
  *"Non-Discriminating Candidate Separation (NOT_DISCRIMINATING): The evaluated astrological candidates do not exhibit sufficient score separation (< 3.0 points). Reconstructed birth date and birth time are withheld to prevent applying ambiguous results."*
- **Action Guard:** The action button is strictly disabled:
  ```jsx
  disabled={result.status !== "PLAUSIBLE_CANDIDATE_FOUND" || !result.timeWindow?.mostProbable || !result.candidateMonthWindow?.exactEstimatedDOB}
  ```
  Attempting to apply an unresolved chart triggers an immediate alert and aborts.

### 2.3 The Hardcoded Palm Profile Problem
- Disabled palm mount score contribution in `reverseCalculateBirthTimeAndDOB`. Palm features add exactly **0 points** to candidate Lagna rankings.
- In `analyzeDualPalmsForBirthRecovery`, returned metadata explicitly sets:
  ```json
  {
    "isIllustrativeReferenceOnly": true,
    "imageFeaturesExtracted": false,
    "isPersonalizedAnalysis": false,
    "mountElevationMeasured": false,
    "candidateScoringApplicable": false,
    "biometricStatus": "UNCALIBRATED_REFERENCE_TEMPLATE"
  }
  ```
- Neutralized medical claims: surgical and health references were excised from palm analysis outputs.

### 2.4 Chronological Inconsistencies & Weak Score Separation
- Contradictory event dates (e.g., 12th board in 2008, 10th board in 2010) immediately return `status: "INSUFFICIENT_DATA"` and `candidateStability: "CONTRADICTORY_DATES"`, with all birth date and time fields null.
- Weak score separation between candidate rising signs ($\Delta < 3.0$) returns `status: "NOT_DISCRIMINATING"`.
- Dates outside $1900 \le \text{year} \le 2100$ fail closed.

---

## 3. Automated Validation Suite Verification (16/16 Passed)

The validation suite `frontend/test_birth_reconstruction_validation.mjs` executes 16 automated test checks with 100% pass rate:

| Test Case | Description | Result |
| :--- | :--- | :---: |
| **Check 1A** | Zero life events returns `INSUFFICIENT_DATA` and `null` chart fields | **PASS** |
| **Check 1B** | Missing location coordinates returns `INSUFFICIENT_DATA` | **PASS** |
| **Check 2A** | Answer with year only sets `month: null` and $T = \text{year} + 0.5$ | **PASS** |
| **Check 2B** | Answer with explicit month preserves exact fractional month | **PASS** |
| **Check 3A** | `analyzeDualPalmsForBirthRecovery` discloses unmeasured 2D elevation | **PASS** |
| **Check 3B** | Palm mounts do not influence candidate scores in `reverseCalculateBirthTimeAndDOB` | **PASS** |
| **Check 4A** | Question registry matches authoritative question IDs | **PASS** |
| **Check 4B** | Career (`q6_first_job`) and Marriage (`q13_marriage`) activate Dasha alignment scoring | **PASS** |
| **Check 5A** | Single event produces `INSUFFICIENT_DATA`, `AMBIGUOUS_MULTI_CANDIDATE`, and null date fields | **PASS** |
| **Check 5B** | Multiple consistent anchors yield `PLAUSIBLE_CANDIDATE_FOUND` with honest notices | **PASS** |
| **Check 5C** | Chronologically contradictory dates produce `INSUFFICIENT_DATA`, `CONTRADICTORY_DATES`, and null date fields | **PASS** |
| **Check 5D** | Invalid dates (out of range years) fail closed with `INSUFFICIENT_DATA` and null date fields | **PASS** |
| **Check 5E** | Timezone boundaries (-12 to +14) compute safely without crashing | **PASS** |
| **Check 5F** | Weak candidate score separation returns `NOT_DISCRIMINATING` and null birth date/time | **PASS** |
| **Check 5G** | Synthetic placeholder palm images produce illustrative non-personal profile | **PASS** |
| **Check 5H** | Tied candidates and unresolvable dates cannot expose usable estimated birth date | **PASS** |

---

## 4. Required Real-World Validation Protocol

Before claiming real-world birth-time rectification accuracy, the following empirical validation protocol must be executed:
1. **IRB-Compliant Consented Cohort**: A prospective sample of at least $N = 500$ subjects with official hospital-issued birth certificates with recorded minute-precision delivery times.
2. **Standardized Photographic Protocol**: Calibrated high-resolution stereoscopic 3D imagery of palmar surfaces under controlled lighting with millimeter scale references.
3. **Double-Blind Event Collection**: Blinded recording of major chronological life events (education, marriage, surgery, career promotions, relocations) with documentary verification.
4. **Independent Holdout Evaluation**: Strict partitioning into training, tuning, and blind holdout cohorts.
5. **Comparative Baselines**: Comparison against non-astrological demographic median baselines.

Until such a protocol is independently conducted and peer-reviewed, ASTROVERSE strictly designates all birth reconstruction outputs as **EXPERIMENTAL HEURISTIC HYPOTHESES**.
