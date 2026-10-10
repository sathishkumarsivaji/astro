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
    dashaYearConvention: "Solar Tropical Year (365.24219878 days)",
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
    dashaYearConvention: "Solar Tropical Year (365.24219878 days)",
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
    ayanamshaJ2000: 22.412315,
    ayanamshaDmsJ2000: "22° 24' 44.333\"",
    precessionModel: "Linear (constant rate from Surya Siddhanta tradition: (Year - 397) * 50⅓\"/year)",
    precessionRate: "50.333333\"/year (50⅓\"/year)",
    nodeModel: "Mean Node (default) / True (Oscillating) Node selectable",
    houseSystem: "Whole Sign (primary)",
    dashaConvention: "Vimshottari 120-year cycle, Moon nakshatra base",
    dashaYearConvention: "Solar Tropical Year (365.24219878 days)",
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
    dashaYearConvention: "Not Applicable",
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
 * Pure JS SHA-256 Digest for deterministic hashes
 */
function sha256Hex(str) {
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 0x80) bytes.push(c);
    else if (c < 0x800) bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    else bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
  }
  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while ((bytes.length % 64) !== 56) bytes.push(0);
  bytes.push(0, 0, 0, 0);
  bytes.push((bitLen >>> 24) & 0xff, (bitLen >>> 16) & 0xff, (bitLen >>> 8) & 0xff, bitLen & 0xff);

  let H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const W = new Int32Array(64);

  for (let chunk = 0; chunk < bytes.length; chunk += 64) {
    for (let i = 0; i < 16; i++) {
      const idx = chunk + i * 4;
      W[i] = (bytes[idx] << 24) | (bytes[idx + 1] << 16) | (bytes[idx + 2] << 8) | bytes[idx + 3];
    }
    for (let i = 16; i < 64; i++) {
      const s0 = ((W[i - 15] >>> 7) | (W[i - 15] << 25)) ^ ((W[i - 15] >>> 18) | (W[i - 15] << 14)) ^ (W[i - 15] >>> 3);
      const s1 = ((W[i - 2] >>> 17) | (W[i - 2] << 15)) ^ ((W[i - 2] >>> 19) | (W[i - 2] << 13)) ^ (W[i - 2] >>> 10);
      W[i] = (((W[i - 16] + s0) | 0) + ((W[i - 7] + s1) | 0)) | 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const temp1 = (((((h + S1) | 0) + ch) | 0) + ((K[i] + W[i]) | 0)) | 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + temp1) | 0;
      d = c; c = b; b = a; a = (temp1 + temp2) | 0;
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
  }
  return H.map(v => (v >>> 0).toString(16).padStart(8, "0")).join("");
}

/**
 * Generates a complete calculation certificate for a chart result.
 * This should be included in every chart calculation output.
 */
export function generateCalculationCertificate(systemId, birthData, calculationTimestamp = null, chartData = null) {
  let actualTimestamp = calculationTimestamp;
  let actualChartData = chartData;

  // Flexible argument handling: (systemId, birthData, chartData, [timestamp])
  if (calculationTimestamp && typeof calculationTimestamp === "object") {
    actualChartData = calculationTimestamp;
    actualTimestamp = (typeof chartData === "string") ? chartData : null;
  }

  const normalizedId = systemId ? String(systemId).toLowerCase() : null;
  if (!normalizedId || !SYSTEM_CONVENTIONS[normalizedId]) {
    throw new Error(`INVALID_ASTROLOGY_SYSTEM: "${systemId}". generateCalculationCertificate requires an explicit valid system: lahiri, kp, raman, tropical.`);
  }
  const convention = SYSTEM_CONVENTIONS[normalizedId];
  const now = (typeof actualTimestamp === "string" ? actualTimestamp : null) || new Date().toISOString();

  const inputPayload = JSON.stringify({
    date: birthData.birthDate || birthData.date || null,
    time: birthData.birthTime || birthData.time || null,
    lat: birthData.latitude ?? birthData.lat ?? null,
    lng: birthData.longitude ?? birthData.lng ?? null,
    tz: birthData.utcOffset ?? birthData.tz ?? null,
    system: systemId || "lahiri"
  });
  const inputHash = sha256Hex(inputPayload);

  let chartHash = null;
  if (actualChartData) {
    const chartPayload = JSON.stringify({
      asc: actualChartData.ascendantLong ?? actualChartData.ascendant?.longitude ?? null,
      planets: (actualChartData.planets || []).map(p => ({ n: p.name, l: p.longitude ?? p.long })),
      ayanamsha: actualChartData.ayanamsa ?? actualChartData.ayanamsaValue ?? null
    });
    chartHash = sha256Hex(chartPayload);
  } else {
    chartHash = sha256Hex(inputHash + ":" + convention.conventionId);
  }

  const effectiveHouseSystem = actualChartData?.houseSystemEffective || actualChartData?.system?.houseSystem || birthData.houseSystemEffective || birthData.houseSystem || convention.houseSystem;
  const resolvedUtcDate = birthData.utcDate || actualChartData?.birthInstantUtc || actualChartData?.utcDate || null;
  let resolvedJd = birthData.jd ?? actualChartData?.jd ?? null;
  if (!resolvedJd && resolvedUtcDate) {
    const d = (resolvedUtcDate instanceof Date) ? resolvedUtcDate : new Date(resolvedUtcDate);
    if (!isNaN(d.getTime())) {
      resolvedJd = (d.getTime() / 86400000.0) + 2440587.5;
    }
  }
  
  return {
    certificate: {
      inputHash,
      chartHash,
      engineVersion: "2.1.19",
      ephemerisVersion: "VSOP87 / ELP-MPP02 (Astronomy Engine 2.1.19)",
      softwareVersion: convention.version,
      conventionId: convention.conventionId,
      version: convention.version,
      system: convention.system,
      
      // Birth data used
      birthDate: birthData.birthDate || birthData.date || null,
      birthTime: birthData.birthTime || birthData.time || null,
      birthLocation: birthData.birthPlace || null,
      latitude: birthData.latitude ?? birthData.lat ?? null,
      longitude: birthData.longitude ?? birthData.lng ?? null,
      timezone: birthData.timezoneId || (birthData.utcOffset !== null && birthData.utcOffset !== undefined ? `UTC${birthData.utcOffset >= 0 ? '+' : ''}${birthData.utcOffset}` : "UTC"),
      timezoneId: birthData.timezoneId || null,
      utcOffset: birthData.utcOffset ?? null,
      dst: birthData.isDst ? "Active" : "Standard",
      utcInstant: resolvedUtcDate ? (resolvedUtcDate instanceof Date ? resolvedUtcDate.toISOString() : String(resolvedUtcDate)) : null,
      julianDay: resolvedJd,
      deltaTSeconds: actualChartData?.deltaTSeconds ?? actualChartData?.DeltaT ?? birthData.deltaTSeconds ?? birthData.DeltaT ?? null,
      
      // Convention details
      ayanamsha: convention.ayanamshaModel,
      ayanamshaModel: convention.ayanamshaModel,
      houseSystem: effectiveHouseSystem,
      nodeModel: birthData.nodeModel || convention.nodeModel,
      coordinateFrame: convention.coordinateFrame,
      timeScale: "UTC converted to TT/UT1 via Delta-T (Meeus/IAU)",
      vargaConvention: convention.vargaConvention,
      dashaConvention: convention.dashaConvention,
      dashaYearConvention: convention.dashaYearConvention || "Solar Tropical Year (365.24219878 days)",
      ephemerisEngine: convention.ephemerisEngine,
      ephemerisLicense: convention.ephemerisLicense,
      calendarSystem: convention.calendarSystem,
      referenceFrame: convention.referenceFrame,
      accuracy: convention.accuracy,
      
      // Metadata
      calculationTimestamp: now,
      calculatedAt: now,
      chartVersion: 1,
      verifiable: true,
      
      // Disclaimer
      astronomicalDisclaimer: "Planetary positions are computed using VSOP87 theory via Astronomy Engine in the Geocentric True Ecliptic of Date frame. Numerical verification uses locked external astronomical reference fixtures. Astrological interpretations are tradition-dependent symbolic frameworks and should not be construed as empirically validated predictions.",
      calendarDisclaimer: "Dates use the Proleptic Gregorian calendar with full Julian calendar switch support. For historical dates before October 15, 1582, the Julian calendar algorithm is applied when requested.",
      d60SensitivityNotice: "Ṣaṣṭyāṁśa (D60) shifts by 1 division every ~2 minutes of civil time (0.5° of Lagna). High precision birth-time verification is recommended for divisional chart interpretations."
    }
  };
}

/**
 * Returns the convention for a given system
 */
export function getConvention(systemId) {
  if (!systemId) {
    throw new Error(`INVALID_ASTROLOGY_SYSTEM: System ID is required. Valid systems: lahiri, kp, raman, tropical.`);
  }
  const norm = String(systemId).toLowerCase();
  if (SYSTEM_CONVENTIONS[norm]) {
    return SYSTEM_CONVENTIONS[norm];
  }
  throw new Error(`Unknown astrology system convention: "${systemId}". Supported systems: lahiri, kp, raman, tropical.`);
}
