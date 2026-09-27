/**
 * ASTROVERSE — Chart Calculation Convention Registry
 *
 * Provides formal convention metadata for every calculation result,
 * enabling full auditability and reproducibility.
 *
 * Every chart output should include this convention block so that
 * any future change in ayanamsha, house system, node model, or
 * precession model is explicitly tracked.
 */

/**
 * Formal convention specification for each supported system
 */
export const SYSTEM_CONVENTIONS = {
  lahiri: {
    conventionId: "LAHIRI_CHITRAPAKSHA_V1",
    version: "4.2.0",
    system: "Lahiri / Chitrapaksha",
    ayanamshaModel: "NC Lahiri (Indian Astronomical Ephemeris)",
    ayanamshaJ2000: 23.857,
    precessionModel: "Linear approximation with quadratic correction",
    precessionRate: "~50.29\"/year (variable)",
    nodeModel: "Mean Node (default) / True (Oscillating) Node selectable",
    houseSystem: "Whole Sign (primary) + Sripati Bhava Chalit",
    dashaConvention: "Vimshottari 120-year cycle, Moon nakshatra base",
    vargaConvention: "Parashari Shodashavarga (D1–D60)",
    ephemerisEngine: "Astronomy Engine 2.1.19 (VSOP87 / ELP-MPP02)",
    ephemerisLicense: "MIT",
    calendarSystem: "Proleptic Gregorian (Julian switch supported)",
    coordinateFrame: "Geocentric True Ecliptic of Date (ECT), converted to sidereal frame via declared ayanamsha",
    referenceFrame: "True Ecliptic of Date (ECT) / J2000.0 epoch",
    accuracy: "±1 arcminute (planetary), ±2 arcminutes (lunar)",
    sources: [
      "Indian Astronomical Ephemeris (Government of India)",
      "Brihat Parasara Hora Shastra",
      "Astronomy Engine (Don Cross, MIT License)"
    ]
  },
  kp: {
    conventionId: "KP_ORIGINAL_V1",
    version: "4.2.0",
    system: "Krishnamurti Padhdhati (KP)",
    ayanamshaModel: "KP Original (50.2388475\"/year from Newcomb-derived model)",
    ayanamshaJ2000: 23.766,
    precessionModel: "Linear (constant rate)",
    precessionRate: "50.2388475\"/year",
    nodeModel: "Mean Node (default) / True (Oscillating) Node selectable",
    houseSystem: "Placidus (with circumpolar divergence detection & Equal fallback)",
    dashaConvention: "Vimshottari 120-year cycle, KP nakshatra base",
    vargaConvention: "Not Applicable (KP uses Sub-Lord analysis)",
    ephemerisEngine: "Astronomy Engine 2.1.19 (VSOP87 / ELP-MPP02)",
    ephemerisLicense: "MIT",
    calendarSystem: "Proleptic Gregorian (Julian switch supported)",
    coordinateFrame: "Geocentric True Ecliptic of Date (ECT), converted to sidereal frame via declared ayanamsha",
    referenceFrame: "True Ecliptic of Date (ECT) / J2000.0 epoch",
    accuracy: "±1 arcminute (planetary), ±2 arcminutes (lunar)",
    sources: [
      "Krishnamurti Padhdhati Reader (K.S. Krishnamurti)",
      "Astronomy Engine (Don Cross, MIT License)"
    ]
  },
  raman: {
    conventionId: "RAMAN_BV_397AD_V1",
    version: "4.2.0",
    system: "B.V. Raman Sidereal",
    ayanamshaModel: "B.V. Raman (397 AD zero-year, 50⅓\"/year linear)",
    ayanamshaJ2000: 22.414259,
    precessionModel: "Linear (constant rate from Surya Siddhanta tradition)",
    precessionRate: "50.333333\"/year (50⅓\"/year)",
    nodeModel: "Mean Node (default) / True (Oscillating) Node selectable",
    houseSystem: "Whole Sign (primary)",
    dashaConvention: "Vimshottari 120-year cycle, Moon nakshatra base",
    vargaConvention: "Parashari Shodashavarga (D1–D60)",
    ephemerisEngine: "Astronomy Engine 2.1.19 (VSOP87 / ELP-MPP02)",
    ephemerisLicense: "MIT",
    calendarSystem: "Proleptic Gregorian (Julian switch supported)",
    coordinateFrame: "Geocentric True Ecliptic of Date (ECT), converted to sidereal frame via declared ayanamsha",
    referenceFrame: "True Ecliptic of Date (ECT) / J2000.0 epoch",
    accuracy: "±1 arcminute (planetary), ±2 arcminutes (lunar)",
    sources: [
      "Hindu Predictive Astrology (B.V. Raman)",
      "Surya Siddhanta (traditional precession model)",
      "Astronomy Engine (Don Cross, MIT License)"
    ]
  },
  tropical: {
    conventionId: "TROPICAL_WESTERN_V1",
    version: "4.2.0",
    system: "Tropical / Sayana (Western)",
    ayanamshaModel: "None (0° Aries = Vernal Equinox)",
    ayanamshaJ2000: 0.0,
    precessionModel: "Not applicable (tropical reference frame)",
    precessionRate: "N/A",
    nodeModel: "Mean Node (default) / True (Oscillating) Node selectable",
    houseSystem: "Placidus (with circumpolar divergence detection & Equal fallback)",
    dashaConvention: "Not Applicable",
    vargaConvention: "Not Applicable",
    ephemerisEngine: "Astronomy Engine 2.1.19 (VSOP87 / ELP-MPP02)",
    ephemerisLicense: "MIT",
    calendarSystem: "Proleptic Gregorian (Julian switch supported)",
    coordinateFrame: "Geocentric True Ecliptic of Date (ECT)",
    referenceFrame: "True Ecliptic of Date (ECT) / J2000.0 epoch",
    accuracy: "±1 arcminute (planetary), ±2 arcminutes (lunar)",
    sources: [
      "Astronomy Engine (Don Cross, MIT License)",
      "Ptolemy's Tetrabiblos (aspect/dignity tradition)"
    ]
  }
};

/**
 * Generates a complete calculation certificate for a chart result.
 * This should be included in every chart calculation output.
 */
export function generateCalculationCertificate(systemId, birthData, calculationTimestamp = null) {
  const convention = SYSTEM_CONVENTIONS[systemId] || SYSTEM_CONVENTIONS.lahiri;
  const now = calculationTimestamp || new Date().toISOString();
  
  return {
    certificate: {
      conventionId: convention.conventionId,
      version: convention.version,
      system: convention.system,
      
      // Birth data used
      birthDate: birthData.birthDate || null,
      birthTime: birthData.birthTime || null,
      birthLocation: birthData.birthPlace || null,
      latitude: birthData.latitude ?? birthData.lat ?? null,
      longitude: birthData.longitude ?? birthData.lng ?? null,
      timezoneId: birthData.timezoneId || null,
      utcOffset: birthData.utcOffset ?? null,
      utcInstant: birthData.utcDate ? (birthData.utcDate instanceof Date ? birthData.utcDate.toISOString() : String(birthData.utcDate)) : null,
      julianDay: birthData.jd ?? null,
      
      // Convention details
      ayanamshaModel: convention.ayanamshaModel,
      houseSystem: convention.houseSystem,
      nodeModel: birthData.nodeModel || convention.nodeModel,
      dashaConvention: convention.dashaConvention,
      ephemerisEngine: convention.ephemerisEngine,
      ephemerisLicense: convention.ephemerisLicense,
      calendarSystem: convention.calendarSystem,
      coordinateFrame: convention.coordinateFrame,
      referenceFrame: convention.referenceFrame,
      accuracy: convention.accuracy,
      
      // Metadata
      calculatedAt: now,
      chartVersion: 1,
      verifiable: true,
      
      // Disclaimer
      astronomicalDisclaimer: "Planetary positions are computed using VSOP87 theory via Astronomy Engine (MIT License) in the Geocentric True Ecliptic of Date (ECT) frame. Accuracy is approximately ±1 arcminute for planets and ±2 arcminutes for the Moon. Astrological interpretations are tradition-dependent symbolic frameworks and should not be construed as empirical predictions.",
      calendarDisclaimer: "Dates use the Proleptic Gregorian calendar with full Julian calendar switch support. For historical dates before October 15, 1582, the Julian calendar algorithm is applied when requested.",
      d60SensitivityNotice: "Ṣaṣṭyāṁśa (D60) shifts by 1 division every ~2 minutes of civil time (0.5° of Lagna). High precision birth-time verification is recommended for divisional chart interpretations."
    }
  };
}

/**
 * Returns the convention for a given system
 */
export function getConvention(systemId) {
  const norm = (systemId || "lahiri").toLowerCase();
  return SYSTEM_CONVENTIONS[norm] || SYSTEM_CONVENTIONS.lahiri;
}
