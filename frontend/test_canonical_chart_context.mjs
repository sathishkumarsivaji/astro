import assert from "node:assert/strict";
import { calculateChartBySystem } from "./src/astrology/index.js";
import {
  attachCanonicalChartContext,
  CANONICAL_CHART_CONTEXT_VERSION,
  getCanonicalChartStatus
} from "./src/services/canonicalChartContext.js";

const profile = {
  name: "Contract Test",
  birthDate: "1994-08-15",
  birthTime: "06:30",
  birthPlace: "Chennai, Tamil Nadu, India",
  latitude: 13.0827,
  longitude: 80.2707,
  timezoneId: "Asia/Kolkata",
  utcOffset: 5.5,
  system: "lahiri",
  birthTimePrecision: "MINUTE"
};

const chart = calculateChartBySystem("lahiri", profile);
const contextA = attachCanonicalChartContext(chart, profile, "2026-01-01T00:00:00.000Z");
const contextB = attachCanonicalChartContext(chart, { ...profile }, "2026-01-01T00:00:00.000Z");

assert.equal(contextA.canonicalContext.contextVersion, CANONICAL_CHART_CONTEXT_VERSION);
assert.equal(getCanonicalChartStatus(contextA), "READY");
assert.equal(contextA.canonicalContext.inputHash, contextB.canonicalContext.inputHash);
assert.equal(contextA.canonicalContext.chartHash, contextB.canonicalContext.chartHash);
assert.equal(contextA.profile.latitude, 13.0827);
assert.ok(contextA.calculationCertificate.conventionId);
assert.equal(
  contextA.canonicalContext.sensitivityAudit.status,
  contextB.canonicalContext.sensitivityAudit.status
);
assert.deepEqual(
  contextA.canonicalContext.sensitivityAudit.sensitivityMetrics,
  contextB.canonicalContext.sensitivityAudit.sensitivityMetrics
);
assert.ok(contextA.canonicalContext.sensitivityAudit.disclosure);

const invalid = attachCanonicalChartContext(chart, { ...profile, timezoneId: "Invalid/Zone" });
assert.equal(getCanonicalChartStatus(invalid), "INSUFFICIENT_DATA");
assert.equal(invalid.canonicalContext.dataQuality.inputValid, false);
assert.equal(invalid.canonicalContext.sensitivityAudit.status, "UNAVAILABLE");

console.log("Canonical chart context contract passed.");
