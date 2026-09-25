# AstroVerse — Advanced Multi-System Ephemeris & Computational Astrology Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Forensic Audit](https://img.shields.io/badge/forensic%20tests-150%2F150%20passing-brightgreen.svg)]()
[![Ephemeris Reference](https://img.shields.io/badge/ephemeris%20tests-426%2F426%20passing-brightgreen.svg)]()
[![Engine](https://img.shields.io/badge/engine-AstroVerse%20v4.2.0-blue.svg)]()
[![Ephemeris](https://img.shields.io/badge/ephemeris-Astronomy%20Engine%202.1.19%20%2F%20VSOP87%20%2F%20ELP--MPP02-orange.svg)]()

AstroVerse is an advanced computational astrology platform engineered with rigorous astronomical calculations, full 4-system multi-framework support (Lahiri, KP, Raman, Tropical), classical Parashari & Jaimini synthesis, iterative numerical solvers, and an evidence-based multi-tier interpretation engine.

Designed for both seekers (via intuitive plain-language chapters and tooltips) and practicing astrologers/researchers (via complete mathematical evidence ledgers, 16 Shodashavargas, KP 249 Sub-lord tables, Western aspect grids, and structured planetary strength metrics).

---

## 🌟 Key Technical Pillars

### 1. Authoritative Astronomical Calculation Layer (Astronomy Engine 2.1.19 / VSOP87 & ELP/MPP02)
- **Ephemeris Standard**: Built on Astronomy Engine 2.1.19 implementing VSOP87 planetary models and ELP/MPP02 lunar ephemeris. All systems consume the identical, verified UTC instant calculated from civil time with exact seconds preservation (`HH:mm:ss`).
- **4 Astrological Calculation Systems**:
  - **Lahiri (Chitrapaksha Sidereal)**: Classical Chitrapaksha Ayanamsha ($23^\circ 51' 25.5''$ at J2000.0), Whole Sign / Sripati cusps, 16 Divisional Vargas, Parashari 6-fold Shadbala, 337-SAV, Jaimini Chara Karakas, and Vimshottari Dasha.
  - **KP System (Krishnamurti Padhdhati)**: KP Ayanamsha (precession rate 50.2388475"/year), Placidus Cusps (Siderealized), 249 Star/Sub/Sub-sub Lords for all 12 Cusps & 9 Planets, AstroVerse KP significator prioritization model (4-Tier significators), and Ruling Planets (RP).
  - **Raman Sidereal**: Independent recalculation from the 397 AD zero-point epoch ($21^\circ 04' 14.5''$ at J2000.0), Whole Sign houses, full Vedic harmonic suite.
  - **Tropical / Sayana (Western)**: 0° Aries tied strictly to the Vernal Equinox (Zero Ayanamsha), Tropical Placidus Cusps, Classical Ptolemaic Aspects with Orbs and Applying/Separating dynamics, and Essential Dignities.
- **Placidus House Cusps**: Iterative semi-diurnal arc trisection across latitudes with high-latitude polar fallbacks.
- **Calculated Solar Times**: Apparent geocentric sunrise, sunset, solar noon, and dynamic 1/8th daytime Muhurta slots computed using NOAA solar refraction models (90.833° zenith) with Equation of Time.
- **Timezone & DST Safety**: Native **IANA timezone identifier** resolution (`Intl.DateTimeFormat`) supporting historical daylight saving time transitions and ambiguous autumn fall-back folds.

### 2. Numerical Panchanga & Muhurta Root Solvers
- **Bracketed Velocity Solving**: High-resolution bracketed **Newton-Raphson iterative root solver** (with bisection fallback) to determine exact transition times within $< 0.0001^\circ$ tolerance for:
  - **Tithi** (12° Moon-Sun relative separation)
  - **Nakshatra** (13°20' Moon sidereal progression)
  - **Yoga** (13°20' Sun + Moon longitude sum)
  - **Karana** (6° half-tithi divisions)
- **Zero Local Machine Contamination**: All boundary timestamps format strictly in the target location's civil calendar date and IANA timezone.

### 3. Classical Parashari & Jaimini Synthesis
- **Shodashavarga (16 Harmonic Charts)**: Complete mathematical implementations from D1 (Rāśi) to D60 (Ṣaṣṭyāṁśa). All 720 declared sign $\times$ division test cases pass under the declared D60 convention: Occupied-Sign Forward Progression with Parity-Reversed Deity Order (matching JHora/Parasara default and DesiUtils).
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

### 5. Dual Lens User Experience & Canonical 20 Chapters
- **Client View**: Beginner-friendly narrative chapters explaining the "Why?" behind every life domain (Wellness, Career, Assets, Governance, Relationships) with built-in glossary tooltips and non-fatalistic interpretations.
- **Astrologer View / Advanced Dossier**: Granular calculation tables, 16 harmonic wheels, Graha Yuddha diagnostics, and full evidence ledgers accessible on demand.
- **System Chapter Filtering**: The 20 chapters (0 to 19) strictly filter based on the active astrological system to prevent cross-system leakage (e.g., Panchanga, Shadbala, Ashtakavarga, and Vargas are hidden in Tropical and KP modes).

---

## 📂 Project Structure

```
d:/ASTRO/frontend/
├── src/
│   ├── astrology/               # Modular Computational Astrology Architecture
│   │   ├── astronomy/           # Ephemeris, Coordinates, Time, House Systems
│   │   ├── comparison/          # 4-System Cross-Comparison Engine
│   │   ├── derived/             # Nakshatra, Pada, Sub-Lord Calculations
│   │   └── systems/             # Lahiri, KP, Raman, Tropical Independent Engines
│   ├── components/
│   │   ├── Common/              # Navigation, Headers & Shared Modals
│   │   ├── Horoscope/           # Chart Viewer, Detailed Report (20 Chapters), Panchang & Muhurta, Gochar
│   │   ├── BabyNames/           # Classical Nakshatra Syllable Baby Name Engine
│   │   ├── Numerology/          # Chaldean & Pythagorean Numerology
│   │   └── PalmReader/          # Classical Samudrika Palmistry Prototype
│   ├── services/
│   │   ├── astroEngine.js       # Core Astronomical & Vedic Calculation Engine
│   │   ├── aiAstrologyService.js# Evidence Ledger & AI Dossier Prompt Synthesizer
│   │   ├── babyNameEngine.js    # Vedic Name Harmonization
│   │   ├── geoService.js        # Global Coordinates & IANA Timezone Resolver
│   │   ├── localization.js      # Full English & Tamil Classical Dictionaries
│   │   └── nashtaJatakaEngine.js# Heuristic Rectification & Verification Framework
│   ├── config/
│   │   ├── astrologySystems.js  # 4-System Configurations & Capabilities
│   │   └── reportChapters.js    # Canonical 20-Chapter Architecture & System Mapping
│   └── types/
│       └── birthProfile.js      # Clean Birth Profile Schema (No silent defaults)
├── test_fixtures/
│   └── ephemeris_reference.json # Golden Astronomical Multi-Epoch Benchmarks
├── test_independent_ephemeris_reference.mjs # 426 Independent Ephemeris & System Tests
├── test_full_audit.mjs          # 150-Test Forensic Audit & Advanced Platform Tests
├── test_find_defaults.mjs       # Architectural Integrity & Silent-Default Linter
├── package.json
└── vite.config.js
```

---

## 🧪 Verification & Audit Suite

AstroVerse includes a comprehensive automated test suite with **576 total automated tests** verifying classical correctness, mathematical precision, multi-epoch stability, and static codebase cleanliness.

### Running the Test Suites:

```bash
# 1. Independent Ephemeris Reference & Multi-System Suite (426 tests)
node test_independent_ephemeris_reference.mjs

# 2. Comprehensive Forensic Audit & Advanced Platform Tests (150 tests)
node test_full_audit.mjs

# 3. Architectural Integrity & Silent-Default Linter
node test_find_defaults.mjs

# 4. Run All Tests
npm test
```

### Key Tested Benchmarks:
- **Astronomical Multi-Epoch Reference (1900–2050)**: Exact verification against Swiss Ephemeris / VSOP87 within $< 0.001^\circ$.
- **Placidus House Cusps Across Latitudes**: Tested across Equator (0°), Chennai (13°N), New York (40.7°N), London (51.5°N), Oslo (59.9°N).
- **Panchanga Root Solver**: Newton-Raphson convergence within $< 0.0001^\circ$ and target timezone formatting.
- **Jaimini 7-Karaka**: Deterministic degree tie-breaking and Arudha Pada exception logic across all 12 Lagnas.
- **Maraka & Functional Matrix**: Strict classical Maraka lord assignments across all 12 Ascendants.
- **Shashtiamsha (D60)**: All 720 declared sign $\times$ division test cases pass under the declared D60 convention.
- **Ashtakoota Matrix**: All 729 (27x27) Nakshatra compatibility combinations.
- **Timezone Invariants**: Civil date stability across Indian, European, and US DST horizons.
- **Architectural Isolation**: Zero cross-system contamination; zero silent timezone or coordinate fallbacks.

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

- **Scientific Validation & Epistemic Boundary**: Astronomical calculations (planetary coordinates, solar times, lunar phases, and mathematical harmonic divisions) are computed directly via Astronomy Engine 2.1.19 (VSOP87 & ELP/MPP02) and can be independently verified against astronomical ephemerides. Astrological interpretations are tradition-dependent symbolic frameworks and are not scientifically validated predictions of life events.
- **Non-Deterministic Philosophy**: In accordance with classical Vedic philosophical tradition, planetary placements signify karmic tendencies, potentials, and environmental rhythms rather than fatalistic decrees. Free will, conscious effort (Purushartha), and remedial actions are foundational.
- **Wellness & Financial Notice**: Health and asset indications represent traditional symbolic astrological correspondences and do **not** constitute medical diagnoses, clinical prognosis, or licensed financial planning. Always consult certified medical and legal professionals.
- **Harmonic & Symbolic Subsystems**: Divisional charts like D60 (0°30′ per division) are highly sensitive to birth time ($~2$ minutes per sign shift); accurate birth times are essential. Birth time recovery (Nashta Jataka) is a heuristic estimation tool without empirical guarantee. Additional modules such as Numerology (Chaldean/Pythagorean) and Palmistry are distinct symbolic disciplines presented for comparative cultural and illustrative reference.

---

## ⚖️ License
Commercial Enterprise License — AstroVerse Platform. All rights reserved.
