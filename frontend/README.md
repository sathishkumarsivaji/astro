# AstroVerse — Advanced Ephemeris & Vedic Astrology Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Tests](https://img.shields.io/badge/forensic%20tests-150%2F150%20passing-brightgreen.svg)]()
[![Engine](https://img.shields.io/badge/engine-AstroVerse%20v4.2.0-blue.svg)]()
[![Ephemeris](https://img.shields.io/badge/ephemeris-Astronomy%20Engine%20%2F%20VSOP87%20%2F%20Lahiri-orange.svg)]()

AstroVerse is an advanced Vedic Astrology (Jyotisha) platform engineered with rigorous astronomical calculations, classical Parashari & Jaimini synthesis, iterative numerical solvers, and an evidence-based multi-tier interpretation engine.

Designed for both beginners (via intuitive plain-language chapters and tooltips) and practicing astrologers (via complete mathematical evidence ledgers, 16 Shodashavargas, and structured planetary strength metrics).

---

## 🌟 Key Technical Pillars

### 1. Vedic Astronomical Calculation Engine (VSOP87/NOVAS-derived)
- **Ephemeris Standard**: Powered by Astronomy Engine (`astronomy-engine` by Don Cross implementing VSOP87 and NOVAS-compatible planetary models) combined with AstroVerse's declared sidereal conversion.
- **Sidereal Conversion**: Classical **Lahiri (Chitrapaksha)** Ayanamsha computed continuously using AstroVerse's declared precession polynomial convention ($23^\circ 51' 25.5''$ at J2000.0).
- **Calculated Solar Times**: Apparent geocentric sunrise, sunset, solar noon, and dynamic 1/8th daytime Muhurta slots computed using standard NOAA solar refraction models (90.833° zenith) with Equation of Time.
- **Timezone & DST Safety**: Native **IANA timezone identifier** resolution (`Intl.DateTimeFormat`) supporting historical daylight saving time transitions and ambiguous autumn fall-back folds (`fold: 0` vs `fold: 1`).

### 2. Numerical Panchanga & Muhurta Root Solvers
- **Bracketed Velocity Solving**: Replaces approximate fixed-rate formulas with a bracketed **Newton-Raphson iterative root solver** (with bisection fallback) to determine high-resolution transition times to configured numerical tolerance (`until`) for:
  - **Tithi** (12° Moon-Sun relative separation)
  - **Nakshatra** (13°20' Moon sidereal progression)
  - **Yoga** (13°20' Sun + Moon longitude sum)
  - **Karana** (6° half-tithi divisions)
- **Zero Local Machine Contamination**: All boundary timestamps format strictly in the target location's civil calendar date and IANA timezone.

### 3. Classical Parashari & Jaimini Synthesis
- **Shodashavarga (16 Harmonic Charts)**: Complete mathematical implementations from D1 (Rāśi) to D60 (Ṣaṣṭyāṁśa) with exact odd/even deity parity reversal and sub-minute birth-time sensitivity & nearest-boundary distance assessment.
- **Equal-House Bhava Chalit**: Centered on Ascendant Degree ($\text{Sandhi} = \pm 15^\circ$) mapping real house-cusp boundary transitions while retaining Rasi sign-lordships.
- **7-Karaka Jaimini System**: Jaimini 7-Graha Chara Karaka scheme (Sun to Saturn) with deterministic degree tie-breaking, Arudha Padas (A1–A12, AL, UL) with 1st/7th exceptions, and Rasi Drishti matrices.
- **Parashari Six-Fold Shadbala Framework**: Standard Sthana, Dig, Kala, Cheshta, Naisargika, and Drik Bala in classical Virupas under declared application conventions; Graha Yuddha reported separately.

### 4. Nine-Layer Domain Reasoning Chain & Reconciliation Model
- **Multi-Factor Convergence**: Domain predictions synthesize structured evidence layers:
  1. D1 Natal Promise & Primary Bhava Lordship
  2. Lagna-Specific Functional Lordship & Yogakarakas
  3. Six-Fold Shadbala Capacity & Virupa Thresholds
  4. Harmonic Divisional Varga Confirmation (D9, D10, D4, D24, D60)
  5. Operating Vimshottari Dasha & Antardasha Temporal Activation
  6. Real-Time Numerical Gochara Transits & 337-Bindu Sarvashtakavarga
  7. Jaimini Chara Karaka & Arudha Pada Alignment
  8. Mitigation, Cancellation & Affliction Filtering (Combustion, Retrograde, Neechabhanga)
  9. AstroVerse Qualitative Synthesis & Contradiction Reconciliation
- **Contradiction Reconciliation**: Opposing indications are balanced through an explicit classical tension-resolution matrix rather than flattened heuristics.

### 5. Dual Lens User Experience
- **Client View**: Beginner-friendly narrative chapters explaining the "Why?" behind every life domain (Wellness, Career, Assets, Governance, Relationships) with built-in glossary tooltips and non-fatalistic interpretations.
- **Astrologer View / Advanced Drawer**: Granular calculation tables, 16 harmonic wheels, Graha Yuddha diagnostics, and full evidence ledgers accessible on demand.

---

## 📂 Project Structure

```
d:/ASTRO/frontend/
├── src/
│   ├── components/
│   │   ├── Common/              # Navigation, Headers & Shared Modals
│   │   ├── Horoscope/           # Chart Viewer, Detailed Report, Panchang & Muhurta, Gochar
│   │   ├── BabyNames/           # Classical Nakshatra Syllable Baby Name Engine
│   │   ├── Numerology/          # Chaldean & Pythagorean Numerology
│   │   └── PalmReader/          # Symbolic Palmistry Interpretations
│   ├── services/
│   │   ├── astroEngine.js       # Core Astronomical & Vedic Calculation Engine (~11,600 LOC)
│   │   ├── aiAstrologyService.js# Evidence Ledger & AI Dossier Prompt Synthesizer
│   │   ├── babyNameEngine.js    # Vedic Name Harmonization
│   │   ├── geoService.js        # Global Coordinates & IANA Timezone Resolver
│   │   ├── localization.js      # Full English & Tamil Classical Dictionaries
│   │   └── nashtaJatakaEngine.js# Heuristic Rectification & Verification Framework
├── test_full_audit.mjs          # 150-Test Forensic Audit & Golden Chart Test Suite
├── package.json
└── vite.config.js
```

---

## 🧪 Verification & Audit Suite

AstroVerse includes a comprehensive automated test suite verifying classical correctness, mathematical precision, timezone resilience, and static codebase cleanliness.

### Running the Forensic Audit:
```bash
node test_full_audit.mjs
```

### Key Tested Benchmarks (150 automated regression tests defined & verified):
- **Astronomical Precision**: Meeus/VSOP87 planetary coordinates & Lahiri Ayanamsha validation.
- **Panchanga Root Solver**: Newton-Raphson convergence within $< 0.0001^\circ$ and target timezone formatting.
- **Jaimini 7-Karaka**: Deterministic degree tie-breaking and Arudha Pada exception logic across all 12 Lagnas.
- **Maraka & Functional Matrix**: Strict classical Maraka lord assignments across all 12 Ascendants.
- **Shashtiamsha (D60)**: Exhaustive 720-point sign $\times$ division mapping with 100% parity accuracy.
- **Ashtakoota Matrix**: All 729 (27x27) Nakshatra compatibility combinations.
- **Timezone Invariants**: Civil date stability across Indian, European, and US DST horizons.
- **Codebase Cleanliness**: Zero uncalibrated percentage claims or deterministic fate overclaims.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
cd d:/ASTRO/frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

### Production Build
```bash
npm run build
```

---

## 📜 Statutory Disclaimers & Ethics

- **Scientific Validation & Epistemic Boundary**: Astronomical calculations (planetary coordinates, solar times, lunar phases, and mathematical harmonic divisions) can be independently verified against astronomical observations; astrological interpretations are tradition-dependent symbolic frameworks and are not scientifically validated predictions of life events.
- **Non-Deterministic Philosophy**: In accordance with classical Vedic philosophical tradition, planetary placements signify karmic tendencies, potentials, and environmental rhythms rather than fatalistic decrees. Free will, conscious effort (Purushartha), and remedial actions are foundational.
- **Wellness & Financial Notice**: Health and asset indications represent traditional symbolic astrological correspondences and do **not** constitute medical diagnoses, clinical prognosis, or licensed financial planning. Always consult certified medical and legal professionals.
- **Harmonic & Symbolic Subsystems**: Divisional charts like D60 (0°30′ per division) are highly sensitive to birth time; D60 is traditionally given substantial importance in fine-grained Jyotisha, making accurate birth times essential. Additional modules such as Numerology (Chaldean/Pythagorean) and Palmistry are distinct symbolic disciplines presented for comparative cultural and illustrative reference.

---

## ⚖️ License
Commercial Enterprise License — AstroVerse Platform. All rights reserved.
