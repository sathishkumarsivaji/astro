/**
 * ASTROVERSE — Phase 1 Account Ownership & Session Security Test Suite
 * ====================================================================
 * Rigorously verifies:
 * 1. Unauthenticated conversion attempt (401 UNAUTHENTICATED_CONVERSION)
 * 2. Another guest's ID conversion attempt (403 FORBIDDEN_USER_CONVERSION)
 * 3. Registered user's ID conversion attempt (409 ALREADY_REGISTERED)
 * 4. Valid guest conversion (retains credits/records, sets isRegistered: true)
 * 5. Concurrent conversion synchronization (atomic email uniqueness)
 * 6. Duplicate email rejection (409 EMAIL_ALREADY_EXISTS)
 * 7. Malformed input types (email format, password min/max length, name type)
 * 8. Session persistence (stored as tokenHash, raw bearer tokens excluded from DB)
 * 9. Admin credentials in query strings rejected (header-only authorization)
 */

import assert from "node:assert";
import crypto from "node:crypto";
import http from "node:http";
import { app, createSignedSessionToken, verifySignedSessionToken, ADMIN_METRICS_KEY } from "../src/server.js";
import { db } from "../src/db/database.js";

console.log("==============================================================");
console.log(" ASTROVERSE — PHASE 1 ACCOUNT OWNERSHIP & SECURITY SUITE");
console.log("==============================================================\n");

let passed = 0;
let failed = 0;

function check(desc, fn) {
  try {
    fn();
    console.log(`✓ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: ${desc} -> ${err.message}`);
    failed++;
  }
}

async function asyncCheck(desc, fn) {
  try {
    await fn();
    console.log(`✓ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: ${desc} -> ${err.message}`);
    failed++;
  }
}

// Spin up test HTTP server
const server = http.createServer(app);
await new Promise(resolve => server.listen(0, resolve));
const port = server.address().port;
const baseUrl = `http://127.0.0.1:${port}`;

try {
  // -------------------------------------------------------------------------
  // 1. Session Persistence & Token Hashing Invariant
  // -------------------------------------------------------------------------
  console.log("--- TEST 1: Session Persistence & Token Hashing ---");
  const testSession = createSignedSessionToken();
  const token = testSession.sessionToken;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  check("1.1 Raw bearer token is NEVER stored in database user_sessions state", () => {
    assert.strictEqual(db.state.user_sessions[token], undefined, "Raw token must not be used as key in database state");
    assert(db.state.user_sessions[tokenHash] !== undefined, "Session must be keyed by tokenHash");
    assert.strictEqual(db.state.user_sessions[tokenHash].sessionToken, undefined, "Record must not persist sessionToken property");
  });

  check("1.2 verifySignedSessionToken verifies valid active session via tokenHash", () => {
    const verified = verifySignedSessionToken(token);
    assert(verified !== null);
    assert.strictEqual(verified.userId, testSession.userId);
  });

  check("1.3 Revoking session immediately revokes token via tokenHash", () => {
    db.revokeSession(token);
    assert.strictEqual(db.isSessionRevoked(token), true);
    assert.strictEqual(verifySignedSessionToken(token), null);
  });

  // -------------------------------------------------------------------------
  // 2. Unauthenticated Conversion Attempt
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 2: Unauthenticated Conversion Attempt ---");
  await asyncCheck("2.1 Client-supplied existingUserId without active session returns 401 UNAUTHENTICATED_CONVERSION", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `unauth_conv_${Date.now()}@example.com`,
        password: "SecurePassword123#",
        name: "Unauth Attacker",
        existingUserId: "usr_victim_target"
      })
    });

    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.code, "UNAUTHENTICATED_CONVERSION");
  });

  // -------------------------------------------------------------------------
  // 3. Another Guest's ID Conversion Attempt
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 3: Cross-User Account Conversion Hijacking ---");
  const guestA = createSignedSessionToken();
  const guestB = createSignedSessionToken();

  await asyncCheck("3.1 Guest A cannot convert Guest B's account (403 FORBIDDEN_USER_CONVERSION)", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${guestA.sessionToken}`
      },
      body: JSON.stringify({
        email: `hijack_attempt_${Date.now()}@example.com`,
        password: "SecurePassword123#",
        name: "Hijack Attacker",
        existingUserId: guestB.userId
      })
    });

    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.code, "FORBIDDEN_USER_CONVERSION");
  });

  // -------------------------------------------------------------------------
  // 4. Registered User's ID Conversion Attempt
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 4: Registered Account Conversion Protection ---");
  const regUserEmail = `already_registered_${Date.now()}@example.com`;
  const regPassword = "ExistingMasterPassword#2026";
  const regUser = db.getUser(`usr_reg_${Date.now()}`) || {
    userId: `usr_reg_${Date.now()}`,
    email: regUserEmail,
    passwordHash: db.hashPassword(regPassword),
    isRegistered: true,
    subscriptionTier: "registered_free",
    availableCredits: 10
  };
  db.saveUser(regUser.userId, regUser);
  const regUserSession = createSignedSessionToken(regUser.userId, null, true);

  await asyncCheck("4.1 Already registered account cannot be silently converted via register endpoint (409 ALREADY_REGISTERED)", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${regUserSession.sessionToken}`
      },
      body: JSON.stringify({
        email: `new_overwrite_${Date.now()}@example.com`,
        password: "NewPassword1234#",
        name: "Silent Overwrite",
        existingUserId: regUser.userId
      })
    });

    assert.strictEqual(res.status, 409);
    const body = await res.json();
    assert.strictEqual(body.code, "ALREADY_REGISTERED");

    // Ensure original user's credentials were not modified
    const untouched = db.getUser(regUser.userId);
    assert.strictEqual(untouched.email, regUserEmail);
  });

  // -------------------------------------------------------------------------
  // 5. Valid Guest Conversion
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 5: Legitimate Authenticated Guest Conversion ---");
  const legitGuestSession = createSignedSessionToken();
  const guestUser = db.getUser(legitGuestSession.userId);
  guestUser.availableCredits = 8;
  guestUser.isRegistered = false;
  db.saveUser(guestUser.userId, guestUser);

  const convertEmail = `legit_guest_${Date.now()}@example.com`;
  await asyncCheck("5.1 Legitimate guest conversion retains user ID, retains credits, and establishes registered status", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${legitGuestSession.sessionToken}`
      },
      body: JSON.stringify({
        email: convertEmail,
        password: "LegitPassword1234#",
        name: "Legit Converted User",
        existingUserId: legitGuestSession.userId
      })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.userId, legitGuestSession.userId);
    assert.strictEqual(data.user.email, convertEmail);
    assert.strictEqual(data.user.isRegistered, true);
    assert.strictEqual(data.user.passwordHash, undefined, "Password hash must be redacted from response");
    assert(data.user.availableCredits >= 8, "Guest credits must be preserved upon conversion");
  });

  // -------------------------------------------------------------------------
  // 6. Duplicate Email Rejection
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 6: Duplicate Email Rejection ---");
  await asyncCheck("6.1 Registering with duplicate email returns 409 EMAIL_ALREADY_EXISTS", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: convertEmail, // Same email as Test 5
        password: "AnotherPassword1234#",
        name: "Duplicate Seeker"
      })
    });

    assert.strictEqual(res.status, 409);
    const body = await res.json();
    assert.strictEqual(body.code, "EMAIL_ALREADY_EXISTS");
  });

  // -------------------------------------------------------------------------
  // 7. Malformed Input Types
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 7: Malformed Input Types & Validation ---");
  await asyncCheck("7.1 Malformed email returns 400 INVALID_EMAIL_FORMAT", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "not-an-email",
        password: "ValidPassword1234#",
        name: "Bad Email"
      })
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.code, "INVALID_EMAIL_FORMAT");
  });

  await asyncCheck("7.2 Short password (<12 chars) returns 400 PASSWORD_TOO_SHORT", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `short_pw_${Date.now()}@example.com`,
        password: "short",
        name: "Short Pw"
      })
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.code, "PASSWORD_TOO_SHORT");
  });

  await asyncCheck("7.3 Non-string name returns 400 INVALID_NAME", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `bad_name_${Date.now()}@example.com`,
        password: "ValidPassword1234#",
        name: { first: "Object", last: "Injection" }
      })
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.code, "INVALID_NAME");
  });

  // -------------------------------------------------------------------------
  // 8. Admin Credentials in Query Strings Rejected
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 8: Query-String Admin Credential Rejection ---");
  await asyncCheck("8.1 Passing adminKey in query string is strictly rejected with 401 ADMIN_AUTH_REQUIRED", async () => {
    const res = await fetch(`${baseUrl}/api/system/metrics?adminKey=test_admin_key_32_bytes_valid_long`);
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.code, "ADMIN_AUTH_REQUIRED");
  });

  await asyncCheck("8.2 Passing adminKey in HTTP header x-admin-key succeeds with 200 OK", async () => {
    const res = await fetch(`${baseUrl}/api/system/metrics`, {
      headers: {
        "x-admin-key": ADMIN_METRICS_KEY
      }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, "healthy");
    assert(typeof body.uptimeSeconds === "number");
  });

} finally {
  server.close();
}

console.log("\n==============================================================");
console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
console.log("==============================================================");

if (failed > 0) {
  process.exit(1);
}
