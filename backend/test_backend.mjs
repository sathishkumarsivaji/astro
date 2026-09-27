/**
 * ASTROVERSE — Production Backend Verification & Security Suite
 *
 * Validates:
 * 1. Cryptographic HMAC session generation & forgery rejection
 * 2. Strict HMAC-SHA256 Payment Webhook verification
 * 3. Payment Replay Attack Prevention (Idempotency)
 * 4. Authoritative Geocoding Proxy & International Coordinate Timezone Resolution
 * 5. Durable ACID Database Persistence & GDPR/DPDP Permanent Erasure
 * 6. Pricing Plans & Exchange Rates Integrity
 */

import crypto from "crypto";
import { createSignedSessionToken, verifySignedSessionToken } from './src/server.js';
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

// 2. Geocoding & Global Coordinate Timezone Tests
console.log("\n2. Testing Server-Side Authoritative Geocoding & Timezone Resolution...");
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

// 3. Payment Security & Webhook Replay Protection Tests
console.log("\n3. Testing Payment Webhook HMAC Verification & Replay Protection...");
const testUserId = session.userId;
const initialEntitlements = getOrCreateEntitlements(testUserId);
const initialCredits = initialEntitlements.availableCredits;
assert(initialCredits >= 15, "Free tier default credits assigned (15 credits)");

const order = createPaymentOrder(testUserId, "premium", "yearly", "INR");
assert(order && order.orderId.startsWith("ord_"), "Payment order created with unique ID");
assert(order.creditsToAdd === 200, "Yearly Premium plan allocates 200 credits");

const TEST_SECRET = "test_webhook_secret_key_849302198";
const validPaymentId = `pay_${Date.now()}_abc`;

// 3A. Missing signature test -> MUST throw
let unsignedBlocked = false;
try {
  processPaymentWebhook({
    orderId: order.orderId,
    paymentId: validPaymentId,
    signature: null,
    secretKey: TEST_SECRET
  });
} catch (err) {
  unsignedBlocked = true;
}
assert(unsignedBlocked, "Unsigned webhook request is strictly rejected with error");

// 3B. Invalid/Forged signature test -> MUST throw
let forgedSigBlocked = false;
try {
  processPaymentWebhook({
    orderId: order.orderId,
    paymentId: validPaymentId,
    signature: "forged_invalid_signature_hex_12345",
    secretKey: TEST_SECRET
  });
} catch (err) {
  forgedSigBlocked = true;
}
assert(forgedSigBlocked, "Forged HMAC signature is strictly rejected with error");

// 3C. Legitimate Signed Webhook -> MUST succeed
const validSignature = crypto
  .createHmac("sha256", TEST_SECRET)
  .update(`${order.orderId}|${validPaymentId}`)
  .digest("hex");

const webhookResult = processPaymentWebhook({
  orderId: order.orderId,
  paymentId: validPaymentId,
  signature: validSignature,
  secretKey: TEST_SECRET
});
assert(webhookResult.success === true && webhookResult.alreadyProcessed === false, "Legitimate signed payment webhook processed successfully");

const updatedEntitlements = getOrCreateEntitlements(testUserId);
assert(updatedEntitlements.subscriptionTier === "premium", "Subscription upgraded to premium tier");
const balanceAfterPayment = updatedEntitlements.availableCredits;
assert(balanceAfterPayment === initialCredits + 200, "Exactly 200 credits credited to user balance");

// 3D. REPLAY ATTACK TEST: Same signed webhook replayed -> MUST NOT credit twice!
const replayResult = processPaymentWebhook({
  orderId: order.orderId,
  paymentId: validPaymentId,
  signature: validSignature,
  secretKey: TEST_SECRET
});
assert(replayResult.success === true && replayResult.alreadyProcessed === true, "Replayed webhook recognized as already processed (Idempotent response)");

const entitlementsAfterReplay = getOrCreateEntitlements(testUserId);
assert(entitlementsAfterReplay.availableCredits === balanceAfterPayment, "Replay attack prevented: Zero duplicate credits added on replayed webhook");

// 4. Privacy & Durable Database Erasure Tests
console.log("\n4. Testing Privacy, Data Export & User Erasure...");
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

// 5. Pricing Configuration Tests
console.log("\n5. Testing Pricing Plans & Exchange Rates Integrity...");
assert(PRICING_PLANS.length === 3, "All 3 pricing plans defined (Basic, Premium, Family)");
const premPlan = PRICING_PLANS.find(p => p.id === "premium");
assert(premPlan.monthlyCredits === 15, "Premium monthly credits count confirmed");
assert(premPlan.yearlyCredits === 200, "Premium yearly credits count confirmed");

console.log("\n==============================================================");
if (failed === 0) {
  console.log(` ALL ${passed} PRODUCTION BACKEND & SECURITY CHECKS PASSED 100%!`);
  process.exitCode = 0;
} else {
  console.error(` FAILED: ${failed} checks failed, ${passed} passed.`);
  process.exitCode = 1;
}
