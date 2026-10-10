/**
 * ASTROVERSE — Production Backend Verification & Security Suite
 *
 * Validates:
 * 1. Cryptographic HMAC session generation & forgery rejection
 * 2. User Registration, Login, and Guest Auth Tiers
 * 3. Strict HMAC-SHA256 Payment Webhook verification with ₹20, ₹50, ₹100, ₹200 plans
 * 4. Payment Replay Attack Prevention (Idempotency)
 * 5. Authoritative Geocoding Proxy & International Coordinate Timezone Resolution
 * 6. Durable Database Persistence (PostgreSQL / Resilient store) & GDPR/DPDP Permanent Erasure
 * 7. Pricing Plans (₹20 Basic, ₹50 Moderate, ₹100 Full, ₹200 Complete / All Access)
 */

import crypto from "crypto";
import { createSignedSessionToken, verifySignedSessionToken, validateProductionConfig, app, ALLOWED_ORIGINS } from './src/server.js';
import { geocodePlace, resolveCoordinatesToTimezone } from './src/services/geocodeService.js';
import {
  getOrCreateEntitlements,
  createPaymentOrder,
  processPaymentWebhook
} from './src/services/entitlementService.js';
import {
  saveUserChart,
  getUserSavedCharts,
  exportUserData,
  eraseUserData
} from './src/services/privacyService.js';
import { PRICING_PLANS } from './src/config/pricing.js';
import { db } from './src/db/database.js';
import { validateAndSanitizeAIResponse } from './src/middleware/aiEvidenceGate.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    failed++;
  }
}

console.log("\n==============================================================");
console.log(" RUNNING ASTROVERSE PRODUCTION BACKEND & SECURITY SUITE");
console.log("==============================================================");

// 1. Session Token Tests
console.log("\n1. Testing Cryptographic HMAC Session Authority...");
const session = createSignedSessionToken();
assert(session && session.sessionToken, "Session token created successfully");
assert(session.sessionToken.includes("."), "Session token has valid signature separation");
assert(session.userId.startsWith("usr_"), "User ID has canonical prefix");

const verified = verifySignedSessionToken(session.sessionToken);
assert(verified && verified.userId === session.userId, "Session token successfully verified with matching userId");

const forgedToken = session.sessionToken.slice(0, -4) + "abcd";
const forgedResult = verifySignedSessionToken(forgedToken);
assert(forgedResult === null, "Forged session token is strictly rejected");

// 2. Registration & Authentication Tiers
console.log("\n2. Testing User Registration & Authentication Tiers...");
const testRegEmail = `seeker_${Date.now()}@astroverse.test`;
const testPassword = "AstroPassword#2026";
const registeredUser = getOrCreateEntitlements(`usr_${Date.now()}`);
registeredUser.email = testRegEmail;
registeredUser.name = "Test Astrologer";
registeredUser.passwordHash = db.hashPassword(testPassword);
registeredUser.isRegistered = true;
registeredUser.subscriptionTier = "registered_free";
registeredUser.availableCredits = 5;
db.saveUser(registeredUser.userId, registeredUser);

const foundUser = db.getUserByEmail(testRegEmail);
assert(foundUser && foundUser.userId === registeredUser.userId, "Registered user found by email");
assert(db.verifyPassword(testPassword, foundUser.passwordHash), "Password verification succeeds for correct password");
assert(!db.verifyPassword("WrongPassword", foundUser.passwordHash), "Password verification rejects incorrect password");

// Verify trusted login session token creation
const loginSession = createSignedSessionToken(foundUser.userId, null, true);
assert(loginSession && loginSession.userId === foundUser.userId, "Trusted login session token created successfully without accountSecret");
assert(verifySignedSessionToken(loginSession.sessionToken)?.userId === foundUser.userId, "Login session token verifies correctly");

// 3. Geocoding & Global Coordinate Timezone Tests
console.log("\n3. Testing Server-Side Authoritative Geocoding & Timezone Resolution...");
const chennaiResults = await geocodePlace("Chennai", "en");
assert(chennaiResults.length > 0, "Geocoding returned results for Chennai");
assert(chennaiResults[0].lat === 13.0827, "Chennai latitude matches certified coordinates");
assert(chennaiResults[0].timezoneId === "Asia/Kolkata", "Chennai has explicit Asia/Kolkata timezone");

const nyTz = resolveCoordinatesToTimezone(40.7128, -74.0060, "us");
assert(nyTz.timezoneId === "America/New_York" && nyTz.tz === -5, "New York coordinates resolve to America/New_York (-5)");

const londonTz = resolveCoordinatesToTimezone(51.5074, -0.1278, "gb");
assert(londonTz.timezoneId === "Europe/London" && londonTz.tz === 0, "London coordinates resolve to Europe/London (0)");

const singaporeTz = resolveCoordinatesToTimezone(1.3521, 103.8198, "sg");
assert(singaporeTz.timezoneId === "Asia/Singapore" && singaporeTz.tz === 8, "Singapore coordinates resolve to Asia/Singapore (+8)");

// 4. Payment Security & Webhook Replay Protection Tests (₹20, ₹50, ₹100, ₹200)
console.log("\n4. Testing Payment Webhook HMAC Verification & Tiers (₹20, ₹50, ₹100, ₹200)...");
const testUserId = session.userId;
const initialEntitlements = getOrCreateEntitlements(testUserId);
const initialCredits = initialEntitlements.availableCredits;

// Test Basic 20 Plan
const order20 = createPaymentOrder(testUserId, "basic_20", "one_time", "INR");
assert(order20 && order20.orderId.startsWith("ord_"), "₹20 Basic report order created");
assert(order20.amountINR === 20, "₹20 Basic report order amount is 20 INR");

// Test Moderate 50 Plan
const order50 = createPaymentOrder(testUserId, "moderate_50", "one_time", "INR");
assert(order50.amountINR === 50, "₹50 Moderate access order amount is 50 INR");

// Test Full 100 Plan
const order100 = createPaymentOrder(testUserId, "full_100", "one_time", "INR");
assert(order100.amountINR === 100, "₹100 Full report order amount is 100 INR");

// Test Complete 200 Plan
const order200 = createPaymentOrder(testUserId, "complete_200", "one_time", "INR");
assert(order200.amountINR === 200, "₹200 Complete report order amount is 200 INR");

const TEST_SECRET = "test_webhook_secret_key_849302198";
const validPaymentId = `pay_${Date.now()}_abc`;

// 4A. Missing signature test -> MUST throw
let unsignedBlocked = false;
try {
  processPaymentWebhook({
    orderId: order200.orderId,
    paymentId: validPaymentId,
    signature: null,
    secretKey: TEST_SECRET
  });
} catch (err) {
  unsignedBlocked = true;
}
assert(unsignedBlocked, "Unsigned webhook request is strictly rejected with error");

// 4B. Invalid/Forged signature test -> MUST throw
let forgedSigBlocked = false;
try {
  processPaymentWebhook({
    orderId: order200.orderId,
    paymentId: validPaymentId,
    signature: "forged_invalid_signature_hex_12345",
    secretKey: TEST_SECRET
  });
} catch (err) {
  forgedSigBlocked = true;
}
assert(forgedSigBlocked, "Forged HMAC signature is strictly rejected with error");

// 4C. Legitimate Signed Webhook -> MUST succeed
const validSignature = crypto
  .createHmac("sha256", TEST_SECRET)
  .update(`${order200.orderId}|${validPaymentId}`)
  .digest("hex");

const webhookResult = processPaymentWebhook({
  orderId: order200.orderId,
  paymentId: validPaymentId,
  signature: validSignature,
  secretKey: TEST_SECRET
});
assert(webhookResult.success === true && webhookResult.alreadyProcessed === false, "Legitimate signed payment webhook processed successfully");

const updatedEntitlements = getOrCreateEntitlements(testUserId);
assert(updatedEntitlements.subscriptionTier === "complete_200", "Subscription upgraded to complete_200 (All Access)");
assert(updatedEntitlements.isRegistered === true, "User marked as registered upon purchase");
const balanceAfterPayment = updatedEntitlements.availableCredits;
assert(balanceAfterPayment > initialCredits, "Credits added to user balance upon purchase");

// 4D. REPLAY ATTACK TEST: Same signed webhook replayed -> MUST NOT credit twice!
const replayResult = processPaymentWebhook({
  orderId: order200.orderId,
  paymentId: validPaymentId,
  signature: validSignature,
  secretKey: TEST_SECRET
});
assert(replayResult.success === true && replayResult.alreadyProcessed === true, "Replayed webhook recognized as already processed (Idempotent response)");

const entitlementsAfterReplay = getOrCreateEntitlements(testUserId);
assert(entitlementsAfterReplay.availableCredits === balanceAfterPayment, "Replay attack prevented: Zero duplicate credits added on replayed webhook");

// 5. Privacy & Durable Database Erasure Tests
console.log("\n5. Testing Privacy, Data Export & User Erasure...");
saveUserChart(testUserId, {
  name: "Test Native",
  birthDate: "1990-04-25",
  birthTime: "05:56",
  birthPlace: "Vellore, Tamil Nadu"
});

const exportedDossier = exportUserData(testUserId, updatedEntitlements);
assert(exportedDossier.savedHoroscopes.length === 1, "Saved chart exported in user dossier");
assert(exportedDossier.exportMetadata.complianceStandards.includes("GDPR Article 20"), "Dossier includes compliance metadata");

const eraseResult = eraseUserData(testUserId, null);
assert(eraseResult.success === true, "User erasure request processed");

const remainingCharts = getUserSavedCharts(testUserId);
assert(remainingCharts.length === 0, "All saved charts permanently purged from database");

// 6. Pricing Configuration Tests
console.log("\n6. Testing Pricing Plans (₹20, ₹50, ₹100, ₹200) Integrity...");
assert(PRICING_PLANS.length === 4, "All 4 pricing plans defined (Basic 20, Moderate 50, Full 100, Complete 200)");
const p20 = PRICING_PLANS.find(p => p.id === "basic_20");
const p50 = PRICING_PLANS.find(p => p.id === "moderate_50");
const p100 = PRICING_PLANS.find(p => p.id === "full_100");
const p200 = PRICING_PLANS.find(p => p.id === "complete_200");

assert(p20 && p20.priceINR === 20, "Basic report price is ₹20");
assert(p50 && p50.priceINR === 50, "Moderate access price is ₹50");
assert(p100 && p100.priceINR === 100, "Full report price is ₹100");
assert(p200 && p200.priceINR === 200, "Complete report price is ₹200");

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 7. Notification Authorization & Push Security
console.log("\n7. Testing Notification Authorization & Multi-tenant Isolation...");
const testUserA = createSignedSessionToken();
const testUserB = createSignedSessionToken();
assert(testUserA.userId !== testUserB.userId, "Independent user session tokens generated");

// 7A. Save push subscription for User A
const subA = {
  endpoint: `https://fcm.googleapis.com/fcm/send/test_endpoint_${Date.now()}_A`,
  keys: {
    p256dh: "BMc_test_p256dh_key_sample_A_1234567890",
    auth: "auth_sample_A_1234"
  }
};
const savedSubA = db.savePushSubscription(testUserA.userId, subA);
assert(savedSubA && savedSubA.endpoint === subA.endpoint, "Push subscription saved for User A");

// 7B. Save push subscription for User B
const subB = {
  endpoint: `https://fcm.googleapis.com/fcm/send/test_endpoint_${Date.now()}_B`,
  keys: {
    p256dh: "BMc_test_p256dh_key_sample_B_1234567890",
    auth: "auth_sample_B_1234"
  }
};
const savedSubB = db.savePushSubscription(testUserB.userId, subB);
assert(savedSubB && savedSubB.endpoint === subB.endpoint, "Push subscription saved for User B");

// 7C. Multi-tenant isolation: User A's subscription only matches User A
const userASub = db.getPushSubscription(testUserA.userId);
assert(userASub && userASub.endpoint === subA.endpoint && userASub.userId === testUserA.userId, "User A query returns strictly User A subscription");

const userBSub = db.getPushSubscription(testUserB.userId);
assert(userBSub && userBSub.endpoint === subB.endpoint && userBSub.userId === testUserB.userId, "User B query returns strictly User B subscription");
assert(userASub.endpoint !== userBSub.endpoint, "User A and User B subscriptions are strictly isolated");

// 7D. Persistence verification: Verify state is written to disk and persists
const dbFilePath = path.join(__dirname, "data/astroverse_store.json");
assert(fs.existsSync(dbFilePath), "Database JSON file exists on disk");
const diskData = JSON.parse(fs.readFileSync(dbFilePath, "utf8"));
assert(diskData.push_subscriptions && diskData.push_subscriptions[subA.endpoint], "User A push subscription persisted to disk");
assert(diskData.push_subscriptions[subB.endpoint], "User B push subscription persisted to disk");

// 7E. Push delivery status recording
db.recordPushDelivery(subA.endpoint, true);
assert(db.getPushSubscription(testUserA.userId).lastSuccessAt !== null, "Push delivery success recorded");

db.recordPushDelivery(subB.endpoint, false, "410 Gone", true);
assert(db.getPushSubscription(testUserB.userId) === null, "410 Gone deactivates subscription from active query");

// 7F. Unsubscribe/deletion isolation
db.deletePushSubscription(testUserA.userId);
assert(db.getPushSubscription(testUserA.userId) === null, "User A unsubscribed successfully");

// 8. Secret Scanning Security Verification
console.log("\n8. Testing Automated Secret Scanning (Zero Hardcoded Secrets in Source)...");
const serverSrcPath = path.join(__dirname, "src/server.js");
const serverSrc = fs.readFileSync(serverSrcPath, "utf8");

// Check for hardcoded fallback secret literals
const prohibitedTokens = [
  "astro_metrics_admin_key_sec",
  "astroverse_webhook_secret_dev_key",
  "ephemeral_dev_session_secret",
  "OIsfcrybKQtNF6aDJIbuXssLeKNgy93nGIMJiMPd7zg",
  "BBNLBC7fF0N92_s5Y3W--qNIzJP2oZ04mH7bg578sq7Um9Hiou9k-_mKy8aUufmMv6yGwQAHzY8y2PFOC03pvjw"
];

for (const prohibited of prohibitedTokens) {
  assert(!serverSrc.includes(prohibited), `Source code does not contain hardcoded secret token: '${prohibited.slice(0, 15)}...'`);
}

// Test database health check helper
assert(typeof db.isHealthy === "function", "Database has isHealthy() health check method");
assert(db.isHealthy() === true, "Database is healthy in test environment");

// 9. Expert Mode Privacy, CSRF & Security Hardening Tests
console.log("\n9. Testing Expert Mode Privacy, CSRF & Security Hardening...");

// 9A. Production startup validation throws without ALLOWED_ORIGINS
let allowedOriginsThrew = false;
try {
  validateProductionConfig({
    NODE_ENV: 'production',
    DATABASE_URL: 'postgres://localhost:5432/astro',
    ADMIN_METRICS_KEY: 'test_admin_key_32_bytes_valid_long',
    WEBHOOK_SECRET: 'test_webhook_sec_32_bytes_valid_long',
    SESSION_SECRET: 'test_session_sec_32_bytes_valid_long',
    ALLOWED_ORIGINS: ''
  });
} catch (e) {
  if (e.message.includes('FATAL: ALLOWED_ORIGINS')) {
    allowedOriginsThrew = true;
  }
}
assert(allowedOriginsThrew, "Startup throws without ALLOWED_ORIGINS in production mode");

// 9B. Ephemeral server tests: CSRF rejection and login response token leakage
const testServer = await new Promise(resolve => {
  const s = app.listen(0, '127.0.0.1', () => resolve(s));
});
const testPort = testServer.address().port;
const baseUrl = `http://127.0.0.1:${testPort}`;

try {
  // Test cross-origin state-changing POST rejected with 403
  const crossOriginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://malicious-site.example.com'
    },
    body: JSON.stringify({ email: testRegEmail, password: testPassword })
  });
  assert(crossOriginRes.status === 403, "Cross-origin state-changing POST is rejected with 403 Forbidden");

  // Test Sec-Fetch-Site: cross-site rejected with 403
  const secFetchRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Sec-Fetch-Site': 'cross-site'
    },
    body: JSON.stringify({ email: testRegEmail, password: testPassword })
  });
  assert(secFetchRes.status === 403, "Cross-site Sec-Fetch-Site request is rejected with 403 Forbidden");

  // Test Authorized Login: No sessionToken in JSON response body
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:5173'
    },
    body: JSON.stringify({ email: testRegEmail, password: testPassword })
  });
  assert(loginRes.status === 200, "Authorized login request succeeds with 200 OK");
  const loginJson = await loginRes.json();
  assert(loginJson.sessionToken === undefined, "Login response body does NOT leak sessionToken (HttpOnly cookie used)");
  assert(Boolean(loginJson.userId), "Login response returns userId");
  const setCookie = loginRes.headers.get('set-cookie');
  assert(setCookie && setCookie.includes('astro_session_token') && setCookie.includes('HttpOnly'), "Login issues HttpOnly astro_session_token cookie");

  // Test cookie-authenticated POST with neither allowed Origin nor Sec-Fetch-Site=same-origin rejected with 403 FORBIDDEN_CSRF
  const cookieMatch = setCookie.match(/astro_session_token=([^;]+)/);
  const sessionCookieVal = cookieMatch ? cookieMatch[1] : '';
  const noOriginCookiePost = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `astro_session_token=${sessionCookieVal}`
    }
  });
  assert(noOriginCookiePost.status === 403, "Cookie-authenticated POST with neither allowed Origin nor Sec-Fetch-Site=same-origin is rejected with 403 Forbidden");
  const noOriginJson = await noOriginCookiePost.json();
  assert(noOriginJson.code === 'FORBIDDEN_CSRF', "Rejection returns code FORBIDDEN_CSRF");

  // Test cookie-authenticated POST with Sec-Fetch-Site=same-origin succeeds
  const sameOriginCookiePost = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `astro_session_token=${sessionCookieVal}`,
      'Sec-Fetch-Site': 'same-origin'
    }
  });
  assert(sameOriginCookiePost.status === 200, "Cookie-authenticated POST with Sec-Fetch-Site=same-origin succeeds with 200 OK");
} finally {
  await new Promise(resolve => testServer.close(resolve));
  try {
    const testStoreFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "data/astroverse_store.json");
    if (fs.existsSync(testStoreFile)) {
      fs.unlinkSync(testStoreFile);
    }
  } catch (e) {}
}

// 10. AI Evidence Verification & Grounding Gate Tests
console.log("\n10. Testing AI Evidence Grounding, Safety & Fabrication Redaction Gate...");
const mockChartContext = {
  planets: [
    { name: "Sun", house: 1, sign: "Aries", longitude: 15.5 },
    { name: "Jupiter", house: 9, sign: "Sagittarius", longitude: 245.2 },
    { name: "Mars", house: 4, sign: "Cancer", longitude: 102.1 }
  ],
  dashaTable: [
    { lord: "Sun" },
    { lord: "Moon" },
    { lord: "Mars" },
    { lord: "Rahu" },
    { lord: "Jupiter" }
  ],
  evidenceNodes: [
    { nodeId: "EV_PLANET_SUN_H1", description: "Sun in 1st house" },
    { nodeId: "EV_PLANET_JUPITER_H9", description: "Jupiter in 9th house" }
  ]
};

// 10A. Grounded narrative matching chart facts
const validAiText = "Native has Sun placed in the 1st house and Jupiter in Sagittarius.";
const validGateRes = validateAndSanitizeAIResponse(validAiText, mockChartContext);
assert(validGateRes.isValid === true, "Valid grounded AI claims pass gate validation");
assert(validGateRes.verifiedClaims.length >= 2, "Both Sun house and Jupiter sign claims verified");
assert(validGateRes.contradictoryClaims.length === 0, "Zero contradictory claims detected");

// 10B. Contradictory placement assertion redaction
const contradictoryAiText = "Native has Mars in house 10 and Sun in House 1.";
const contradicRes = validateAndSanitizeAIResponse(contradictoryAiText, mockChartContext);
assert(contradicRes.isValid === false, "Contradictory AI placement fails isValid gate check");
assert(contradicRes.contradictoryClaims.length === 1, "Mars house contradiction detected");
assert(contradicRes.text.includes("[REMOVED: CONTRADICTORY CLAIM"), "Contradictory claim is removed/redacted from returned narrative");
assert(!contradicRes.text.includes("Mars in house 10"), "False astrological claim is purged from response text");

// 10C. Fabricated high-precision astronomical coordinate detection & redaction
const fabricatedAiText = "Sun is placed at exact degree 23° 45' 12.3\" and longitude: 123.45678.";
const fabRes = validateAndSanitizeAIResponse(fabricatedAiText, mockChartContext);
assert(fabRes.isValid === false, "Fabricated astronomical values fail gate check");
assert(fabRes.violations.some(v => v.includes("FABRICATED_ASTRONOMICAL_VALUE")), "Fabricated values flagged in violation ledger");
assert(fabRes.text.includes("[UNVERIFIED_COORDINATE_REDACTED]"), "Fabricated coordinates redacted in text");

// 10D. Statutory Legal, Health, and Financial Advisory Detection
const legalAiText = "You should file a lawsuit against your employer and court will rule in your favor.";
const legalRes = validateAndSanitizeAIResponse(legalAiText, mockChartContext);
assert(legalRes.isValid === false, "Legal advisory language fails safety validation");
assert(legalRes.disclaimersAdded === true, "Statutory disclaimer flag set");
assert(legalRes.text.includes("Statutory Notice: Traditional astrological interpretation only. This does NOT constitute legal advice"), "Statutory legal notice appended to output");

const healthAiText = "You will have Cancer disease and should take Medicine.";
const healthRes = validateAndSanitizeAIResponse(healthAiText, mockChartContext);
assert(healthRes.isValid === false, "Health diagnostic language fails safety validation");
assert(healthRes.text.includes("does NOT constitute medical diagnosis"), "Statutory medical notice appended to output");

// 10E. Multi-Sentence Loophole & Extreme Wealth Prediction Blocking
const multiSentenceWealthText = "Sun is placed in the 1st house. You will become a billionaire in 2027.";
const multiWealthRes = validateAndSanitizeAIResponse(multiSentenceWealthText, mockChartContext);
assert(multiWealthRes.isValid === false, "Multi-sentence billionaire prediction fails isValid gate check");
assert(multiWealthRes.verifiedClaims.length >= 1, "Legitimate placement verified in multi-sentence narrative");
assert(multiWealthRes.unsupportedClaims.some(c => c.failure === "UNSUPPORTED_FINANCIAL_CERTAINTY"), "Billionaire prediction flagged as unsupported financial certainty");

// 10F. Substantive Sentence Coverage Gate
const uncoveredSubstantiveText = "Sun is placed in the 1st house. An unknown miraculous fortune awaits around the corner.";
const uncoveredRes = validateAndSanitizeAIResponse(uncoveredSubstantiveText, mockChartContext);
assert(uncoveredRes.isValid === false, "Uncovered substantive sentence fails isValid gate check");
assert(uncoveredRes.failureReason === "UNCOVERED_SUBSTANTIVE_SENTENCES", "Uncovered sentence sets failureReason UNCOVERED_SUBSTANTIVE_SENTENCES");
assert(uncoveredRes.uncoveredSubstantiveSentenceIds.length >= 1, "Uncovered sentence ID recorded in dossier");

console.log("\n==============================================================");
if (failed === 0) {
  console.log(` ALL ${passed} PRODUCTION BACKEND & SECURITY CHECKS PASSED 100%!`);
  process.exit(0);
} else {
  console.error(` FAILED: ${failed} checks failed, ${passed} passed.`);
  process.exit(1);
}

