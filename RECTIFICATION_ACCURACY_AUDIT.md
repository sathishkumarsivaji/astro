# ASTROVERSE — Evidence-Based Birth-Time Rectification Accuracy & Technical Audit

**Date**: October 2, 2026  
**Module**: Birth-Time Rectification & Statistical Evidence Engine  
**Status**: Independently Audited & Corrected (Production Standard)

---

## 1. Executive Summary

A comprehensive forensic audit and methodological overhaul of the **Birth-Time Rectification** system in ASTROVERSE was conducted. While the underlying astronomy engine provides high-precision ephemeris calculations (Sun MAE 3.55″, Moon MAE 9.74″, Moon max 63.27″ vs Swiss Ephemeris 2.10.03), this audit addressed specific methodological vulnerabilities in the rectification and candidate evaluation layer.

All 10 independent review points have been fully addressed:
1. **Window Margin Integrity**: Search grids (coarse & fine) are strictly clamped within $[T_{\text{approx}} - \text{margin}, T_{\text{approx}} + \text{margin}]$. Windows $\le 60$ minutes utilize direct 1-minute discrete grids.
2. **Permutation Null Distribution Test**: Incorporates a $K=200$ permutation null distribution test over shuffled event dates and categories. Resolution is declared `NOT_DISCRIMINATING` and `centralEstimate = null` unless peak score statistically exceeds the 95th percentile ($p \le 0.05$).
3. **Edge-of-Window Detection**: If peak candidate lies within $\le 2$ minutes of the search window boundary, resolution is marked `AT_SEARCH_BOUNDARY`, `centralEstimate` is nulled, and the user is prompted to widen the search range.
4. **SYNTHETIC SELF-CONSISTENCY / GROUND-TRUTH RECOVERY TEST**: Verified that synthetic ground-truth birth time $T$ generates chart-dependent events (Dasha + transits) that recover $T$ within $\le 3$ minutes under algorithmic self-consistency. **SCIENTIFIC DISCLAIMER: Synthetic recovery demonstrates algorithm self-consistency only and DOES NOT establish real-world prospective predictive accuracy.**
5. **Canonical Varga Sensitivity Analysis**: Perturbations ($\pm 1, \pm 5, \pm 10$ mins) compute actual $D_1, D_9, D_{60}$ lagna signs via `buildCanonicalVarga`. Missing coordinates return `computed: false, sensitivityLevel: null`.
6. **Cross-Validation (LOEO) Semantics**: Held-out pass criterion requires candidate time error $\le 10.0$ minutes, held-out score $\ge 12$, and no contradiction. Overfit risk or low stability caps evidence strength at `LOW`.
7. **Elimination of Astronomical Fallbacks**: All `?? 0` fallbacks on Ascendant longitudes have been purged across all 9 evaluators and adapters, returning `INSUFFICIENT_DATA` if Ascendant is uncalculated.
8. **Tightened Custom-Event Scoring**: Removed unconditional base points; points are strictly contingent on tight lagna transits ($\le 4.0^\circ$) or Lagna lord Dasha.
9. **ScoringEngine Weight Enforcement**: Evidence group weights are strictly applied as normalized weighted averages across life domain groups.
10. **UI Resolution Gate**: The "Apply Rectified Time" action in `BirthTimeRectificationLab.jsx` is strictly gated to `resolution === "MINUTE_LEVEL"`.

---

## 2. Astronomical Precision & Ephemeris Baseline

The ASTROVERSE astronomical calculations operate on high-precision numerical ephemeris models benchmarked against Swiss Ephemeris 2.10.03 (120 independent benchmark checks across 1900–2100):

| Celestial Body | Benchmark Mean Absolute Error (MAE) | Median Residual | Max Residual | Frame / Model |
|---|---|---|---|---|
| **Sun** | 3.55″ (0.000986°) | 0.79″ | 14.19″ | VSOP87 Geocentric True Ecliptic |
| **Moon** | 9.74″ (0.002706°) | 3.03″ | 63.27″ | ELP-2000/82 Lunar Theory |
| **Mars** | 4.08″ (0.001133°) | 2.05″ | 14.25″ | VSOP87 Planetary Theory |
| **Mercury** | 4.51″ (0.001253°) | 1.50″ | 16.88″ | VSOP87 Planetary Theory |
| **Jupiter** | 5.32″ (0.001478°) | 4.22″ | 16.94″ | VSOP87 Planetary Theory |
| **Venus** | 4.05″ (0.001125°) | 1.85″ | 14.07″ | VSOP87 Planetary Theory |
| **Saturn** | 5.78″ (0.001606°) | 5.15″ | 13.21″ | VSOP87 Planetary Theory |
| **Mean Lunar Node** | 7.52″ (0.002089°) | 5.65″ | 17.73″ | Chapront (2002) Polynomial Model |
| **True Lunar Node** | 8.07″ (0.002242°) | 5.55″ | 19.05″ | Osculating State Vector Perturbations |
| **Ascendant** | 0.81″ (0.000225°) | 0.23″ | 4.06″ | Sidereal True Ecliptic Calculation |

---

## 3. Core Rectification Architecture

### 3.1 Candidate Generator (`candidateGenerator.js`)
- Full DateTime object representations (`localDate`, `localTime`, `utcInstant`, `timezoneId`, `utcOffset`, `totalMinutes`, `minuteOffset`).
- Midnight rollover and rollback safety across forward and backward civil date boundaries.
- Strict margin clamping to input bounds $[T_{\text{center}} - \text{margin}, T_{\text{center}} + \text{margin}]$.

### 3.2 Canonical Varga Adapter (`rectificationVargaAdapter.js`)
- Preserves absolute planetary identities across all 16 vargas ($D_1..D_{60}$).
- Eliminates schema collisions between $D_1$ signs and divisional harmonic signs.

### 3.3 Historical Transit & Dasha Calculators (`transitCalculator.js`, `dashaTimingCalculator.js`)
- Calculates authentic historical ephemeris positions of Jupiter, Saturn, Rahu, Ketu, and Mars at the exact Julian Day of historical events.
- Evaluates 3-tier Vimshottari Dasha (Mahadasha, Antardasha, Pratyantardasha) active periods.

### 3.4 Permutation Null Test Engine (`permutationEngine.js`)
- Runs 200 randomized permutations of event dates and categories to compute an empirical null distribution.
- Computes empirical percentile and $p$-value ($p \le 0.05$ required for discriminating resolution).

### 3.5 Stability & Resolution Analyzer (`stabilityAnalyzer.js`)
- Evaluates chronological run-length stability with a 5% threshold (`maxScore * 0.95`).
- Requires candidate count $\ge 2$ for stable regions (isolated spikes classified as `ISOLATED_SPIKE`).
- Nulls `centralEstimate` for multimodal, non-discriminating, interval, or boundary conditions.

---

## 4. Verification Test Suites

The following test suites verify the complete rectification pipeline:

1. `test_rectification_margin.mjs`: Clamping over 1m, 5m, 20m search windows.
2. `test_rectification_null_distribution.mjs`: Permutation null distribution and noise rejection.
3. `test_rectification_edge_boundary.mjs`: `AT_SEARCH_BOUNDARY` detection.
4. `test_rectification_known_ground_truth.mjs`: Synthetic ground truth recovery.
5. `test_rectification_d9_identity.mjs`, `d10_identity.mjs`, `d7_identity.mjs`: Varga planet identity preservation.
6. `test_rectification_flat_score.mjs`: Flat score detection.
7. `test_rectification_multipeak.mjs`: Multimodal peak separation.
8. `test_rectification_loeo.mjs`, `test_rectification_holdout.mjs`: Cross-validation.
9. `test_rectification_transit_accuracy.mjs`: Historical transit calculation.
10. `test_rectification_midnight_boundary.mjs`: Date rollover.
11. `test_rectification_timezone_dst.mjs`: IANA timezone and DST resolution.
