/**
 * ASTROVERSE — Production Backend Infrastructure & Security Authority
 *
 * Provides:
 * 1. Server-side Gemini AI Gateway with atomic credit lock, debit & rollback
 * 2. Cryptographic HMAC session authority with HttpOnly cookies & forgery rejection
 * 3. Authoritative Geocoding Proxy with cache, rate throttling & global IANA timezone resolution
 * 4. Production Payment Orders & HMAC Webhook Processing with strict replay protection
 * 5. GDPR Article 20 / DPDP 2023 Data Governance: Durable Export & Permanent Erasure
 * 6. Secured System Observability & Metrics (Admin key protected)
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import crypto from 'crypto';
import webpush from 'web-push';

import { PRICING_PLANS, EXCHANGE_RATES, CURRENCY_SYMBOLS, getLiveExchangeRates, refreshExchangeRates } from './config/pricing.js';
import { geocodePlace } from './services/geocodeService.js';
import {
  getOrCreateEntitlements,
  createPaymentOrder,
  processPaymentWebhook
} from './services/entitlementService.js';
import {
  saveUserChart,
  getUserSavedCharts,
  exportUserData,
  eraseUserData
} from './services/privacyService.js';
import { db } from './db/database.js';

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 5000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Production Configuration Validator
export function validateProductionConfig(env = process.env) {
  if (env.NODE_ENV === 'production') {
    if (!env.DATABASE_URL) {
      throw new Error('FATAL: DATABASE_URL environment variable is required in production.');
    }
    if (!env.ADMIN_METRICS_KEY) {
      throw new Error('FATAL: ADMIN_METRICS_KEY environment variable is required in production.');
    }
    if (!env.WEBHOOK_SECRET) {
      throw new Error('FATAL: WEBHOOK_SECRET environment variable is required in production.');
    }
    if (!env.SESSION_SECRET) {
      throw new Error('FATAL: SESSION_SECRET environment variable is required in production.');
    }
    const custom = env.ALLOWED_ORIGINS 
      ? env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean) 
      : [];
    if (!env.ALLOWED_ORIGINS || custom.length === 0) {
      throw new Error('FATAL: ALLOWED_ORIGINS environment variable is required in production.');
    }
  }
}

// Run validation for current environment
validateProductionConfig(process.env);

// Strict Production Secrets Enforcement
let ADMIN_METRICS_KEY = process.env.ADMIN_METRICS_KEY;
if (!ADMIN_METRICS_KEY) {
  ADMIN_METRICS_KEY = crypto.randomBytes(32).toString('hex');
  console.warn('[SECURITY] Using ephemeral random secrets — set env vars for persistent dev sessions.');
}

let WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
if (!WEBHOOK_SECRET) {
  WEBHOOK_SECRET = crypto.randomBytes(32).toString('hex');
  console.warn('[SECURITY] Using ephemeral random secrets — set env vars for persistent dev sessions.');
}

let SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  SESSION_SECRET = crypto.randomBytes(32).toString('hex');
  console.warn('[SECURITY] Using ephemeral random secrets — set env vars for persistent dev sessions.');
}

// Environment-conditional CORS Policy Configuration
export const customOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean) 
  : [];

export const ALLOWED_ORIGINS = process.env.NODE_ENV === 'production'
  ? customOrigins
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'https://astroverse.app', 'https://www.astroverse.app', ...customOrigins];

app.use(helmet());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true
}));

export function getCookieValue(cookieHeader, name) {
  if (!cookieHeader || typeof cookieHeader !== 'string') return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// CSRF & Cross-Site Request Forgery Protection on state-changing methods
app.use((req, res, next) => {
  const method = req.method.toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return next();
  }

  // Exempt HMAC-authenticated payment webhooks
  if (req.path === '/api/payment/webhook' || req.path === '/api/payments/webhook' || req.path.startsWith('/api/webhooks/')) {
    return next();
  }

  const origin = req.headers.origin;
  const secFetchSite = req.headers['sec-fetch-site'];

  // Block cross-site browser requests
  if (secFetchSite === 'cross-site') {
    return res.status(403).json({ error: 'Cross-origin state-changing requests are forbidden.', code: 'FORBIDDEN_CROSS_SITE' });
  }

  // If origin header is present, ensure it is in ALLOWED_ORIGINS
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: `Origin '${origin}' is not authorized for state-changing requests.`, code: 'FORBIDDEN_ORIGIN' });
  }

  // For cookie-authenticated POST/PUT/PATCH/DELETE, require either an allowed Origin or Sec-Fetch-Site=same-origin; reject requests with neither
  const cookieHeader = req.headers.cookie;
  const hasAuthCookie = cookieHeader && getCookieValue(cookieHeader, 'astro_session_token');
  if (hasAuthCookie) {
    const isAllowedOrigin = Boolean(origin && ALLOWED_ORIGINS.includes(origin));
    const isSameOrigin = secFetchSite === 'same-origin';
    if (!isAllowedOrigin && !isSameOrigin) {
      return res.status(403).json({
        error: 'Cookie-authenticated state-changing requests require an authorized Origin or Sec-Fetch-Site=same-origin.',
        code: 'FORBIDDEN_CSRF'
      });
    }
  }

  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// Observability & Telemetry Metrics
// ---------------------------------------------------------------------------
const metrics = {
  totalRequests: 0,
  aiRequestsSuccess: 0,
  aiRequestsFailed: 0,
  geocodeRequests: 0,
  paymentsProcessed: 0,
  activeUsersCount: () => activeSessions.size, // Note: per-process in-memory count; resets on restart
  uptimeStarted: new Date().toISOString()
};

// ---------------------------------------------------------------------------
// Rate Limiting Middleware with Auto-Pruning Memory Leak Prevention
// ---------------------------------------------------------------------------
const requestHistory = new Map();
function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const history = requestHistory.get(ip) || [];
  const activeHistory = history.filter(t => now - t < windowMs);

  if (activeHistory.length >= 60) {
    requestHistory.set(ip, activeHistory);
    return res.status(429).json({
      error: 'Rate limit exceeded. Maximum 60 requests per 10 minutes.',
      retryAfterSeconds: Math.ceil((activeHistory[0] + windowMs - now) / 1000)
    });
  }

  activeHistory.push(now);
  requestHistory.set(ip, activeHistory);
  metrics.totalRequests++;
  next();
}

// Dedicated Rate Limiter for Session Creation (Prevents Credit Minting Loops)
const authRequestHistory = new Map();
function authRateLimiter(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const history = authRequestHistory.get(ip) || [];
  const activeHistory = history.filter(t => now - t < windowMs);

  if (activeHistory.length >= 20) {
    authRequestHistory.set(ip, activeHistory);
    return res.status(429).json({
      error: 'Too many session creations. Maximum 20 per 10 minutes.',
      retryAfterSeconds: Math.ceil((activeHistory[0] + windowMs - now) / 1000)
    });
  }

  activeHistory.push(now);
  authRequestHistory.set(ip, activeHistory);
  next();
}

// Periodic cleanup of stale rate limiter maps (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  for (const [ip, history] of requestHistory.entries()) {
    const active = history.filter(t => now - t < windowMs);
    if (active.length === 0) requestHistory.delete(ip);
    else requestHistory.set(ip, active);
  }
  for (const [ip, history] of authRequestHistory.entries()) {
    const active = history.filter(t => now - t < windowMs);
    if (active.length === 0) authRequestHistory.delete(ip);
    else authRequestHistory.set(ip, active);
  }
}, 5 * 60 * 1000).unref();

// ---------------------------------------------------------------------------
// Cryptographic Session Authority & Verification
// ---------------------------------------------------------------------------
const activeSessions = new Map();
console.info('[SESSION] In-memory session cache active. Stateless HMAC fallback ensures continuity across restarts. For multi-instance deployments, migrate to Redis or DB-backed sessions.');
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30-day session token

export function createSignedSessionToken(userId = null, accountSecret = null, isTrustedAuth = false) {
  let effectiveUserId = userId;
  let effectiveSecret = accountSecret;

  if (effectiveUserId) {
    if (db.getAccountSecret(effectiveUserId)) {
      if (!isTrustedAuth) {
        if (!effectiveSecret) {
          throw new Error("Account secret required to revive existing session.");
        }
        if (!db.verifyAccountSecret(effectiveUserId, effectiveSecret)) {
          throw new Error("Invalid account credentials for user.");
        }
      }
    } else {
      if (!effectiveSecret) {
        effectiveSecret = `sec_${crypto.randomBytes(16).toString('hex')}`;
      }
      db.setAccountSecret(effectiveUserId, effectiveSecret);
    }
  } else {
    effectiveUserId = `usr_${crypto.randomBytes(8).toString('hex')}`;
    effectiveSecret = `sec_${crypto.randomBytes(16).toString('hex')}`;
    db.setAccountSecret(effectiveUserId, effectiveSecret);
  }

  const payload = {
    userId: effectiveUserId,
    sessionId: `sess_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`,
    createdAt: Date.now()
  };
  const b64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(b64Payload).digest('base64url');
  const sessionToken = `${b64Payload}.${signature}`;

  const session = {
    sessionToken,
    userId: effectiveUserId,
    createdAt: new Date(payload.createdAt).toISOString()
  };
  activeSessions.set(sessionToken, session);
  getOrCreateEntitlements(effectiveUserId);
  return session;
}

export function verifySignedSessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  if (activeSessions.has(token)) {
    const session = activeSessions.get(token);
    const sessionAge = Date.now() - new Date(session.createdAt).getTime();
    if (sessionAge < SESSION_TTL_MS) {
      return session;
    }
    activeSessions.delete(token);
    return null;
  }

  // Stateless Verification
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [b64Payload, signature] = parts;

  try {
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(b64Payload).digest('base64url');
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(b64Payload, 'base64url').toString('utf8'));
    if (Date.now() - payload.createdAt > SESSION_TTL_MS) {
      return null;
    }

    const session = {
      sessionToken: token,
      userId: payload.userId,
      createdAt: new Date(payload.createdAt).toISOString()
    };
    activeSessions.set(token, session);
    return session;
  } catch (err) {
    return null;
  }
}

function authenticateSession(req, res, next) {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const headerToken = req.headers['x-session-token'];
  const cookieToken = getCookieValue(req.headers.cookie, 'astro_session_token');
  const token = bearerToken || headerToken || cookieToken;
  const session = verifySignedSessionToken(token);

  if (!session) {
    return res.status(401).json({
      error: 'Unauthorized. Invalid or expired session token.',
      code: 'AUTH_REQUIRED'
    });
  }

  req.user = session;
  next();
}

export function requireDatabaseReady(req, res, next) {
  if (process.env.NODE_ENV === 'production' && !db.isHealthy()) {
    return res.status(503).json({
      error: 'Service temporarily unavailable: PostgreSQL persistence store is offline in production mode.',
      code: 'DB_UNAVAILABLE'
    });
  }
  next();
}

// ---------------------------------------------------------------------------
// 1. Session Handshake & Token Issue (Audit Point 20)
// ---------------------------------------------------------------------------
app.post('/api/auth/session', authRateLimiter, (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const headerToken = req.headers['x-session-token'];
    const cookieToken = getCookieValue(req.headers.cookie, 'astro_session_token');
    const existingToken = bearerToken || headerToken || cookieToken;

    let session = null;
    if (existingToken && existingToken !== 'unauthenticated_session') {
      session = verifySignedSessionToken(existingToken);
    }

    if (!session) {
      const { existingUserId, accountSecret } = req.body || {};
      const secret = accountSecret || req.headers['x-account-secret'] || null;
      if (existingUserId && secret) {
        try {
          session = createSignedSessionToken(existingUserId, secret);
        } catch {
          session = createSignedSessionToken();
        }
      } else {
        session = createSignedSessionToken();
      }
    }
    const entitlements = getOrCreateEntitlements(session.userId);

    // Set HttpOnly Secure Cookie
    const isProd = process.env.NODE_ENV === 'production';
    const secureFlag = isProd ? '; Secure' : '';
    res.setHeader('Set-Cookie', `astro_session_token=${session.sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secureFlag}`);

    res.json({
      success: true,
      userId: session.userId,
      entitlements,
      user: entitlements
    });
  } catch (err) {
    res.status(403).json({
      error: err.message || 'Failed to authenticate session',
      code: 'AUTH_FORBIDDEN'
    });
  }
});

// Logout Endpoint — Invalidates server cache and clears HttpOnly cookie
app.post('/api/auth/logout', (req, res) => {
  const cookieToken = getCookieValue(req.headers.cookie, 'astro_session_token');
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const token = bearerToken || cookieToken;
  if (token && activeSessions.has(token)) {
    activeSessions.delete(token);
  }
  const isProd = process.env.NODE_ENV === 'production';
  const secureFlag = isProd ? '; Secure' : '';
  res.setHeader('Set-Cookie', `astro_session_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag}`);
  res.json({ success: true, message: 'Logged out successfully' });
});

// Guest Session Initialization (Unregistered / Minimal Access)
app.post('/api/auth/guest', authRateLimiter, requireDatabaseReady, (req, res) => {
  try {
    const session = createSignedSessionToken();
    const user = getOrCreateEntitlements(session.userId);
    user.isRegistered = false;
    user.subscriptionTier = 'unregistered';
    db.saveUser(session.userId, user);

    const isProd = process.env.NODE_ENV === 'production';
    const secureFlag = isProd ? '; Secure' : '';
    res.setHeader('Set-Cookie', `astro_session_token=${session.sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secureFlag}`);

    res.json({
      success: true,
      userId: session.userId,
      user
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to initialize guest session' });
  }
});

// User Registration Endpoint (Converts guest or creates registered account)
app.post('/api/auth/register', authRateLimiter, requireDatabaseReady, (req, res) => {
  try {
    const { name, email, password, existingUserId } = req.body || {};
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }
    if (!password || typeof password !== 'string' || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters.' });
    }

    const normEmail = email.trim().toLowerCase();
    const existing = db.getUserByEmail(normEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
    }

    // Reuse existingUserId if provided and valid, otherwise generate new
    const targetUserId = existingUserId || `usr_${crypto.randomBytes(8).toString('hex')}`;
    const user = getOrCreateEntitlements(targetUserId);
    user.email = normEmail;
    user.name = name?.trim() || 'Astrology Seeker';
    user.passwordHash = db.hashPassword(password);
    user.isRegistered = true;
    user.subscriptionTier = (user.subscriptionTier === 'unregistered' || !user.subscriptionTier) ? 'registered_free' : user.subscriptionTier;
    user.monthlyCredits = Math.max(user.monthlyCredits || 0, 5);
    user.availableCredits = Math.max(user.availableCredits || 0, 5);
    db.saveUser(targetUserId, user);

    const session = createSignedSessionToken(targetUserId, null, true);
    const isProd = process.env.NODE_ENV === 'production';
    const secureFlag = isProd ? '; Secure' : '';
    res.setHeader('Set-Cookie', `astro_session_token=${session.sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secureFlag}`);

    res.json({
      success: true,
      userId: targetUserId,
      user
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// User Login Endpoint
app.post('/api/auth/login', authRateLimiter, requireDatabaseReady, (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normEmail = email.trim().toLowerCase();
    const user = db.getUserByEmail(normEmail);
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const valid = db.verifyPassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const session = createSignedSessionToken(user.userId, null, true);
    const isProd = process.env.NODE_ENV === 'production';
    const secureFlag = isProd ? '; Secure' : '';
    res.setHeader('Set-Cookie', `astro_session_token=${session.sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secureFlag}`);

    res.json({
      success: true,
      userId: user.userId,
      user
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Current User Profile / Auth State
app.get('/api/auth/me', authenticateSession, (req, res) => {
  const user = getOrCreateEntitlements(req.user.userId);
  res.json({
    success: true,
    userId: req.user.userId,
    user
  });
});

// ---------------------------------------------------------------------------
// 2. Entitlement & Balance Query (Audit Point 21)
// ---------------------------------------------------------------------------
app.get('/api/user/entitlements', authenticateSession, (req, res) => {
  const entitlements = getOrCreateEntitlements(req.user.userId);
  res.json(entitlements);
});

// Alias for backwards/forwards compatibility
app.get('/api/user/credits', authenticateSession, (req, res) => {
  const entitlements = getOrCreateEntitlements(req.user.userId);
  res.json(entitlements);
});

// ---------------------------------------------------------------------------
// 3. Pricing Catalog & Available Currencies (Audit Point 21)
// ---------------------------------------------------------------------------
// Attempt non-blocking exchange rate refresh on boot & schedule every 12h
refreshExchangeRates().catch(() => {});
setInterval(() => { refreshExchangeRates().catch(() => {}); }, 12 * 60 * 60 * 1000).unref();

app.get('/api/pricing', (_req, res) => {
  res.json({
    plans: PRICING_PLANS,
    exchangeRates: getLiveExchangeRates(),
    currencySymbols: CURRENCY_SYMBOLS,
    availableCurrencies: ["INR", "USD", "EUR"],
    paymentProviders: ["razorpay", "stripe"]
  });
});

// ---------------------------------------------------------------------------
// 4. Saved Horoscopes Storage (Audit Point 22)
// ---------------------------------------------------------------------------
app.post('/api/horoscope/save', authenticateSession, requireDatabaseReady, (req, res) => {
  const { chartProfile } = req.body;
  if (!chartProfile || typeof chartProfile !== 'object') {
    return res.status(400).json({ error: 'Valid chartProfile object is required.' });
  }

  const savedRecord = saveUserChart(req.user.userId, chartProfile);
  res.json({
    success: true,
    chart: savedRecord
  });
});

app.get('/api/horoscope/list', authenticateSession, (req, res) => {
  const charts = getUserSavedCharts(req.user.userId);
  res.json({
    success: true,
    charts
  });
});

// ---------------------------------------------------------------------------
// 5. Authoritative Geocoding Proxy (Audit Point 24)
// ---------------------------------------------------------------------------
app.get('/api/geocode', rateLimiter, async (req, res) => {
  const { q, lang = 'en' } = req.query;
  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Query parameter "q" is required.' });
  }

  try {
    metrics.geocodeRequests++;
    const results = await geocodePlace(q, lang);
    res.json(results);
  } catch (err) {
    console.error('Geocoding error:', err);
    res.status(500).json({ error: 'Failed to geocode location.' });
  }
});

// ---------------------------------------------------------------------------
// 6. Payment Orders & Verified Webhooks with Replay Protection (Audit Point 21)
// ---------------------------------------------------------------------------
app.post('/api/payment/create-order', authenticateSession, requireDatabaseReady, (req, res) => {
  const { planId = 'premium', billingPeriod = 'yearly', currency = 'INR' } = req.body;
  const order = createPaymentOrder(req.user.userId, planId, billingPeriod, currency);
  res.json({
    success: true,
    order
  });
});

app.post('/api/payment/verify-order', authenticateSession, requireDatabaseReady, (req, res) => {
  const { orderId, paymentId, signature } = req.body || {};
  if (!orderId || !paymentId) {
    return res.status(400).json({ error: 'Missing orderId or paymentId parameter.' });
  }
  const order = db.getOrder(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }
  if (order.userId !== req.user.userId) {
    return res.status(403).json({ error: 'Unauthorized. Order belongs to a different user.' });
  }

  try {
    let effectiveSig = signature;
    if ((!effectiveSig || effectiveSig === 'simulated_sig') && process.env.NODE_ENV !== 'production') {
      effectiveSig = crypto.createHmac('sha256', WEBHOOK_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
    }

    const result = processPaymentWebhook({
      orderId,
      paymentId,
      signature: effectiveSig,
      secretKey: WEBHOOK_SECRET
    });
    metrics.paymentsProcessed++;
    res.json(result);
  } catch (err) {
    console.error('Payment verify error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/payment/webhook', requireDatabaseReady, (req, res) => {
  const { orderId, paymentId, signature, timestamp } = req.body;
  
  if (!orderId || !paymentId) {
    return res.status(400).json({ error: 'Missing orderId or paymentId parameter.' });
  }
  if (!signature) {
    return res.status(401).json({ error: 'Missing mandatory HMAC signature. Unsigned requests are strictly rejected.' });
  }

  try {
    const result = processPaymentWebhook({
      orderId,
      paymentId,
      signature,
      secretKey: WEBHOOK_SECRET,
      timestamp
    });
    metrics.paymentsProcessed++;
    res.json(result);
  } catch (err) {
    console.error('Payment webhook error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 7. Secure AI Generation with Atomic Credit Lock & Rollback (Audit Point 25)
// ---------------------------------------------------------------------------
async function handleGenerateAstrology(req, res) {
  const { prompt, lang = 'en' } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Valid astrological prompt string is required.' });
  }

  const effectiveApiKey = GEMINI_API_KEY;
  if (!effectiveApiKey) {
    return res.status(503).json({
      error: 'AI service unavailable: No server GEMINI_API_KEY configured.',
      code: 'API_KEY_MISSING'
    });
  }

  const entitlements = getOrCreateEntitlements(req.user.userId);
  const cost = 1;
  const available = entitlements.availableCredits - entitlements.lockedCredits;

  if (available < cost) {
    return res.status(402).json({
      error: 'Insufficient credits. Please recharge your reading balance.',
      availableCredits: available,
      requiredCredits: cost
    });
  }

  // Lock Credit — persist immediately for crash-safety
  entitlements.lockedCredits += cost;
  const txId = `tx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  db.saveUser(req.user.userId, entitlements); // Persist lock BEFORE external API call for crash-recovery durability

  try {
    const models = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash'
    ];

    let lastError = null;
    let generatedText = '';

    for (const model of models) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${effectiveApiKey}`;
        const sysInstruction = lang === 'ta'
          ? 'நீங்கள் ஒரு முதன்மை பாரம்பரிய வேத ஜோதிடர் மற்றும் வானியல் அறிஞர். வழங்கப்பட்ட எபிமெரிஸ் கணிதத்தை மட்டும் கொண்டு துல்லியமான, விரிவான ஜோதிட அறிக்கையை வழங்கவும்.'
          : 'You are a master classical Vedic astrologer and astronomical scholar. Synthesize the provided high-precision planetary ephemeris into an authentic, deeply personalized multi-page astrological dossier.';

        const body = {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: sysInstruction }] },
          generationConfig: {
            temperature: 0.2,
            topP: 0.95,
            maxOutputTokens: 8192
          }
        };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (response.ok) {
          const data = await response.json();
          const firstCandidate = data.candidates?.[0];
          const parts = firstCandidate?.content?.parts || [];
          generatedText = parts.filter(p => !p.thought && p.text).map(p => p.text).join('\n\n') || parts.map(p => p.text || '').join('\n\n');
          if (generatedText) break;
        } else {
          const errData = await response.json().catch(() => ({}));
          lastError = new Error(errData.error?.message || `HTTP ${response.status}`);
        }
      } catch (e) {
        lastError = e;
      }
    }

    if (!generatedText) {
      throw lastError || new Error('All AI model candidate attempts failed.');
    }

    // COMMIT TRANSACTION
    entitlements.lockedCredits -= cost;
    entitlements.availableCredits -= cost;
    entitlements.transactionHistory.push({
      txId,
      userId: req.user.userId,
      readingType: 'ai_astrology_report',
      type: 'debit',
      amount: cost,
      timestamp: new Date().toISOString(),
      status: 'committed'
    });
    db.saveUser(req.user.userId, entitlements);

    metrics.aiRequestsSuccess++;
    return res.json({
      success: true,
      text: generatedText,
      transactionId: txId,
      remainingCredits: entitlements.availableCredits - entitlements.lockedCredits
    });

  } catch (err) {
    // ROLLBACK TRANSACTION
    entitlements.lockedCredits -= cost;
    entitlements.transactionHistory.push({
      txId,
      userId: req.user.userId,
      type: 'failed_rollback',
      amount: cost,
      timestamp: new Date().toISOString(),
      status: 'rolled_back',
      error: err.message
    });
    db.saveUser(req.user.userId, entitlements);

    metrics.aiRequestsFailed++;
    console.error('AI Generation error (Transaction rolled back):', err.message);
    return res.status(502).json({
      error: 'Failed to generate report from AI provider. Credit was not deducted.',
      code: 'AI_PROVIDER_ERROR'
    });
  }
}

app.post('/api/generate-astrology', rateLimiter, authenticateSession, requireDatabaseReady, handleGenerateAstrology);
app.post('/api/astrology-report', rateLimiter, authenticateSession, requireDatabaseReady, handleGenerateAstrology);

// ---------------------------------------------------------------------------
// 8. Privacy & Data Governance (Audit Point 23)
// ---------------------------------------------------------------------------
app.get('/api/user/export', authenticateSession, (req, res) => {
  const entitlements = getOrCreateEntitlements(req.user.userId);
  const userDossier = exportUserData(req.user.userId, entitlements);
  res.json(userDossier);
});

app.delete('/api/user/delete', authenticateSession, requireDatabaseReady, (req, res) => {
  const result = eraseUserData(req.user.userId, activeSessions);
  res.json(result);
});

// ---------------------------------------------------------------------------
// 9. Protected System Metrics & Observability (Audit Point 48)
// ---------------------------------------------------------------------------
app.get('/api/system/metrics', (req, res) => {
  const adminKey = req.headers['x-admin-key'] || req.query.adminKey;
  if (!adminKey || typeof adminKey !== 'string') {
    return res.status(401).json({
      error: 'Unauthorized. Admin key required to view system metrics.',
      code: 'ADMIN_AUTH_REQUIRED'
    });
  }

  const keyBuf = Buffer.from(adminKey);
  const expBuf = Buffer.from(ADMIN_METRICS_KEY);
  if (keyBuf.length !== expBuf.length || !crypto.timingSafeEqual(keyBuf, expBuf)) {
    return res.status(401).json({
      error: 'Unauthorized. Invalid admin key.',
      code: 'ADMIN_AUTH_REQUIRED'
    });
  }

  res.json({
    status: 'healthy',
    totalRequests: metrics.totalRequests,
    aiSuccess: metrics.aiRequestsSuccess,
    aiFailed: metrics.aiRequestsFailed,
    aiRejectionRate: metrics.aiRequestsFailed > 0 ? (metrics.aiRequestsFailed / (metrics.aiRequestsSuccess + metrics.aiRequestsFailed)).toFixed(4) : 0,
    geocodeRequests: metrics.geocodeRequests,
    paymentsProcessed: metrics.paymentsProcessed,
    activeSessions: activeSessions.size,
    startedAt: metrics.uptimeStarted,
    uptimeSeconds: Math.floor(process.uptime())
  });
});

// ---------------------------------------------------------------------------
// 10. Web Push Notification Infrastructure (Durable DB Storage & VAPID Delivery)
// ---------------------------------------------------------------------------
let VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
let VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY environment variables are required in production.');
  }
  const ephemeralKeys = webpush.generateVAPIDKeys();
  VAPID_PUBLIC_KEY = VAPID_PUBLIC_KEY || ephemeralKeys.publicKey;
  VAPID_PRIVATE_KEY = VAPID_PRIVATE_KEY || ephemeralKeys.privateKey;
  console.warn('[SECURITY] Generated dynamic ephemeral VAPID keypair for development/test mode. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY env vars in production.');
}

const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@astroverse.app';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (vapidErr) {
  console.warn('[PUSH] VAPID configuration initialization notice:', vapidErr.message);
}

app.get('/api/notifications/vapid-public-key', (req, res) => {
  res.json({
    publicKey: VAPID_PUBLIC_KEY
  });
});

app.post('/api/notifications/subscribe', authenticateSession, (req, res) => {
  const userId = req.user.userId;
  const { subscription } = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Valid push subscription object with endpoint required.' });
  }

  const record = db.savePushSubscription(userId, subscription);

  res.json({
    success: true,
    message: 'Push subscription successfully registered and persisted.',
    endpoint: record.endpoint,
    registeredAt: record.createdAt
  });
});

app.post('/api/notifications/unsubscribe', authenticateSession, (req, res) => {
  const userId = req.user.userId;
  const { endpoint } = req.body || {};
  const result = db.deletePushSubscription(userId, endpoint);
  res.json({
    success: true,
    message: 'Push subscription removed.',
    removedCount: result.count
  });
});

app.get('/api/notifications/status', authenticateSession, (req, res) => {
  const userId = req.user.userId;
  const userSubs = db.getUserPushSubscriptions(userId);
  const allActive = db.getAllActivePushSubscriptions();
  res.json({
    active: userSubs.length > 0,
    subscriptionCount: userSubs.length,
    totalActiveSubscribers: allActive.length
  });
});

app.post('/api/notifications/send-test', authenticateSession, async (req, res) => {
  const userId = req.user.userId;
  const { title = 'AstroVerse Planetary Transit Alert', body = 'Benefic Jupiter-Venus alignment active.', url = '/' } = req.body;
  const subData = db.getPushSubscription(userId);
  if (!subData) {
    return res.status(404).json({ error: 'No active push subscription found for user.' });
  }

  const payloadString = JSON.stringify({
    title,
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: { url, timestamp: new Date().toISOString() }
  });

  try {
    const pushResult = await webpush.sendNotification(subData.subscription, payloadString);
    db.recordPushDelivery(subData.endpoint, true);
    res.json({
      success: true,
      delivered: true,
      statusCode: pushResult.statusCode || 201,
      message: 'Push notification dispatched and delivered via Web Push service.',
      subscriber: userId,
      payload: { title, body, url }
    });
  } catch (err) {
    // If subscription is expired/invalid (410 Gone / 404 Not Found), deactivate it
    if (err.statusCode === 410 || err.statusCode === 404) {
      db.recordPushDelivery(subData.endpoint, false, err.message, true);
      return res.status(410).json({
        success: false,
        delivered: false,
        expired: true,
        message: 'Push subscription is expired or inactive on push service. Deactivated in registry.',
        error: err.message
      });
    }

    db.recordPushDelivery(subData.endpoint, false, err.message, false);
    console.warn('[PUSH] Web Push delivery attempt failed:', err.message);
    return res.status(502).json({
      success: false,
      delivered: false,
      dispatched: false,
      errorCode: "PUSH_DELIVERY_FAILED",
      message: `Push notification delivery failed: ${err.message}`,
      subscriber: userId,
      payload: { title, body, url }
    });
  }
});

export let server = null;
if (process.env.NODE_ENV !== 'test' && !process.argv[1]?.endsWith('test_backend.mjs')) {
  Promise.resolve(db.readyPromise).catch(() => {}).then(() => {
    server = app.listen(PORT, () => {
      console.log(`[AstroVerse Production Backend] Running on http://localhost:${PORT}`);
    });
  });
}
