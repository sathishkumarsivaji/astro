/**
 * SKR ASTRO — Production Backend Infrastructure & Security Authority
 *
 * Provides:
 * 1. Server-side Gemini AI Gateway with atomic credit lock, debit & rollback
 * 2. Cryptographic HMAC session authority with HttpOnly cookies & forgery rejection
 * 3. Authoritative Geocoding Proxy with cache, rate throttling & global IANA timezone resolution
 * 4. Production Payment Orders & HMAC Webhook Processing with strict replay protection
 * 5. Privacy controls designed to support GDPR Article 20 / DPDP 2023 data-rights workflows: Durable Export & Permanent Erasure
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
import { validateAndSanitizeAIResponse } from './middleware/aiEvidenceGate.js';
import {
  recordPrediction,
  getPredictionById,
  listPredictionsForCustomer
} from './services/predictionRecordService.js';
import { replayPrediction } from './services/predictionReplayService.js';
import {
  getLocalAiConfig,
  checkLocalModelHealth,
  scanLocalModels,
  parseQuestionToSpecification,
  rephraseAnswerWithLocalLLM,
  LOCAL_MODEL_REGISTRY,
  LOCAL_INFERENCE_STATUS,
  invokeLocalLLM
} from './services/localAiService.js';
import { generateReportPdf, isChromiumAvailable } from './services/pdfExportService.js';

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
export let ADMIN_METRICS_KEY = process.env.ADMIN_METRICS_KEY;
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
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'https://skr-astro.app', 'https://www.skr-astro.app', 'https://skrastro.com', 'https://www.skrastro.com', 'https://astroverse.app', 'https://www.astroverse.app', ...customOrigins];

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
  const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
  activeSessions.set(tokenHash, session);
  db.createSessionRecord(sessionToken, effectiveUserId, payload.createdAt + SESSION_TTL_MS);
  getOrCreateEntitlements(effectiveUserId);
  return session;
}

export function verifySignedSessionToken(token) {
  if (!token || typeof token !== 'string') return null;

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // 1. Check if token has been revoked in database
    if (db.isSessionRevoked(token)) {
      activeSessions.delete(tokenHash);
      return null;
    }

    if (activeSessions.has(tokenHash)) {
      const session = activeSessions.get(tokenHash);
      const sessionAge = Date.now() - new Date(session.createdAt).getTime();
      if (sessionAge < SESSION_TTL_MS) {
        // Verify user still exists in database
        const user = db.getUser(session.userId);
        if (!user) {
          activeSessions.delete(tokenHash);
          return null;
        }
        return session;
      }
      activeSessions.delete(tokenHash);
      return null;
    }

    // Stateless Verification with DB Revocation Check
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [b64Payload, signature] = parts;

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

    // Verify user exists
    const user = db.getUser(payload.userId);
    if (!user) {
      return null;
    }

    const session = {
      sessionToken: token,
      userId: payload.userId,
      createdAt: new Date(payload.createdAt).toISOString()
    };
    activeSessions.set(tokenHash, session);
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

function optionalAuthenticateSession(req, res, next) {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const headerToken = req.headers['x-session-token'];
  const cookieToken = getCookieValue(req.headers.cookie, 'astro_session_token');
  const token = bearerToken || headerToken || cookieToken;
  if (token) {
    const session = verifySignedSessionToken(token);
    if (session) {
      req.user = session;
    }
  }
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
  if (token) {
    if (activeSessions.has(token)) {
      activeSessions.delete(token);
    }
    db.revokeSession(token);
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
app.post('/api/auth/register', authRateLimiter, requireDatabaseReady, async (req, res) => {
  try {
    const { name, email, password, existingUserId } = req.body || {};

    // 1. Strict Input Validation (Types and Formats)
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Valid email address is required.', code: 'INVALID_EMAIL' });
    }
    const normEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (normEmail.length < 5 || normEmail.length > 254 || !emailRegex.test(normEmail)) {
      return res.status(400).json({ error: 'Valid email address format is required.', code: 'INVALID_EMAIL_FORMAT' });
    }

    if (!password || typeof password !== 'string' || password.length < 12) {
      return res.status(400).json({ error: 'Password must be at least 12 characters long for security compliance.', code: 'PASSWORD_TOO_SHORT' });
    }
    if (password.length > 128) {
      return res.status(400).json({ error: 'Password exceeds maximum length limit of 128 characters.', code: 'PASSWORD_TOO_LONG' });
    }

    if (name !== undefined && (typeof name !== 'string' || name.length > 100)) {
      return res.status(400).json({ error: 'Name must be a valid string up to 100 characters.', code: 'INVALID_NAME' });
    }

    // 2. Verified Caller Session Derivation (Client-supplied ID is never proof of ownership)
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const headerToken = req.headers['x-session-token'];
    const cookieToken = getCookieValue(req.headers.cookie, 'astro_session_token');
    const token = bearerToken || headerToken || cookieToken;
    const callerSession = token ? verifySignedSessionToken(token) : null;

    let isGuestConversion = false;
    let callerSessionUserId = null;

    if (existingUserId) {
      // Conversion targeting existing user ID requires verified session proof of that exact ID
      if (!callerSession) {
        return res.status(401).json({
          error: 'Unauthenticated conversion attempt: Guest conversion requires an active, verified session.',
          code: 'UNAUTHENTICATED_CONVERSION'
        });
      }
      if (callerSession.userId !== existingUserId) {
        return res.status(403).json({
          error: 'Forbidden: Cannot convert or overwrite an account belonging to another user.',
          code: 'FORBIDDEN_USER_CONVERSION'
        });
      }
      isGuestConversion = true;
      callerSessionUserId = callerSession.userId;
    } else if (callerSession) {
      // Active session present without explicit existingUserId
      const existingUser = db.getUser(callerSession.userId);
      if (existingUser && (existingUser.isRegistered || existingUser.passwordHash)) {
        return res.status(409).json({
          error: 'An account is already associated with this session. Please log in.',
          code: 'ALREADY_REGISTERED'
        });
      }
      isGuestConversion = true;
      callerSessionUserId = callerSession.userId;
    }

    const passwordHash = db.hashPassword(password);
    const result = await db.atomicRegisterOrConvertUser({
      targetUserId: existingUserId || null,
      callerSessionUserId,
      email: normEmail,
      passwordHash,
      name: name ? name.trim() : 'Astrology Seeker',
      isGuestConversion
    });

    const session = createSignedSessionToken(result.userId, null, true);
    const isProd = process.env.NODE_ENV === 'production';
    const secureFlag = isProd ? '; Secure' : '';
    res.setHeader('Set-Cookie', `astro_session_token=${session.sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secureFlag}`);

    // Redact password hash from response
    const sanitizedUser = { ...result.user };
    delete sanitizedUser.passwordHash;

    res.json({
      success: true,
      userId: result.userId,
      user: sanitizedUser
    });
  } catch (err) {
    const status = err.status || (err.code === 'EMAIL_ALREADY_EXISTS' || err.code === 'ALREADY_REGISTERED' ? 409 : 500);
    res.status(status).json({
      error: err.message || 'Registration failed',
      code: err.code || 'REGISTRATION_ERROR'
    });
  }
});

// User Login Endpoint
app.post('/api/auth/login', authRateLimiter, requireDatabaseReady, (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Valid email and password strings are required.' });
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

    const sanitizedUser = { ...user };
    delete sanitizedUser.passwordHash;

    res.json({
      success: true,
      userId: user.userId,
      user: sanitizedUser
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Current User Profile / Auth State
app.get('/api/auth/me', authenticateSession, (req, res) => {
  const user = getOrCreateEntitlements(req.user.userId);
  const sanitizedUser = { ...user };
  delete sanitizedUser.passwordHash;
  res.json({
    success: true,
    userId: req.user.userId,
    user: sanitizedUser
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
// Attempt non-blocking exchange rate refresh on boot & schedule every 12h (skip in test mode)
if (process.env.NODE_ENV !== 'test' && !process.argv[1]?.includes('test')) {
  refreshExchangeRates().catch(() => {});
  setInterval(() => { refreshExchangeRates().catch(() => {}); }, 12 * 60 * 60 * 1000).unref();
}

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

app.post('/api/payment/verify-order', authenticateSession, requireDatabaseReady, async (req, res) => {
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

    const result = await processPaymentWebhook({
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

app.post('/api/payment/webhook', requireDatabaseReady, async (req, res) => {
  const { orderId, paymentId, signature, timestamp } = req.body;
  
  if (!orderId || !paymentId) {
    return res.status(400).json({ error: 'Missing orderId or paymentId parameter.' });
  }
  if (!signature) {
    return res.status(401).json({ error: 'Missing mandatory HMAC signature. Unsigned requests are strictly rejected.' });
  }

  try {
    const result = await processPaymentWebhook({
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
  const { prompt, lang = 'en', chartContext = null } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Valid astrological prompt string is required.' });
  }

  const effectiveApiKey = GEMINI_API_KEY;
  let useLocalModel = false;
  if (!effectiveApiKey) {
    const localCfg = getLocalAiConfig();
    if (localCfg.mode !== 'DETERMINISTIC_ONLY') {
      try {
        const localHealth = await checkLocalModelHealth(localCfg);
        if (localHealth && localHealth.healthy && localHealth.isModelInstalled) {
          useLocalModel = true;
        }
      } catch {
        useLocalModel = false;
      }
    }
    if (!useLocalModel) {
      return res.status(503).json({
        error: 'AI service unavailable: No server GEMINI_API_KEY configured and local model runtime has no supported model installed.',
        code: 'API_KEY_OR_LOCAL_MODEL_MISSING'
      });
    }
  }

  const cost = 1;
  const requestId = `req_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  const resResult = db.reserveCredits(requestId, req.user.userId, cost, 300);

  if (!resResult.success) {
    return res.status(402).json({
      error: 'Insufficient credits. Please recharge your reading balance.',
      availableCredits: resResult.available,
      requiredCredits: cost
    });
  }

  try {
    let generatedText = '';

    if (useLocalModel) {
      const sysInstruction = lang === 'ta'
        ? 'நீங்கள் ஒரு முதன்மை பாரம்பரிய வேத ஜோதிடர் மற்றும் வானியல் அறிஞர். வழங்கப்பட்ட எபிமெரிஸ் கணிதத்தை மட்டும் கொண்டு துல்லியமான, விரிவான ஜோதிட அறிக்கையை வழங்கவும்.'
        : 'You are a master classical Vedic astrologer and astronomical scholar. Synthesize the provided high-precision planetary ephemeris into an authentic, deeply personalized multi-page astrological dossier.';
      const localRes = await invokeLocalLLM({
        systemPrompt: sysInstruction,
        userPrompt: prompt,
        temperature: 0.2,
        maxTokens: 4096
      });
      generatedText = localRes.content;
    } else {
      const models = [
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash'
      ];

      let lastError = null;

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

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

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
    }

    // SETTLE RESERVATION ATOMICALLY
    const settleRes = db.settleCreditReservation(requestId, req.user.userId);
    const updatedUser = settleRes.user || db.getUser(req.user.userId);

    metrics.aiRequestsSuccess++;
    const gateResult = validateAndSanitizeAIResponse(generatedText, chartContext, { lang });
    return res.json({
      success: true,
      text: gateResult.text,
      transactionId: requestId,
      inferenceStatus: useLocalModel ? LOCAL_INFERENCE_STATUS.LOCAL_MODEL_SUCCESS : LOCAL_INFERENCE_STATUS.EXTERNAL_PROVIDER_SUCCESS,
      remainingCredits: updatedUser ? (updatedUser.availableCredits - (updatedUser.lockedCredits || 0)) : 0,
      _evidenceGate: {
        isValid: gateResult.isValid,
        sanitized: gateResult.sanitized,
        violationCount: gateResult.violations.length,
        verifiedCount: gateResult.verifiedClaims.length,
        unsupportedCount: gateResult.unsupportedClaims.length + gateResult.contradictoryClaims.length,
        disclaimersAdded: gateResult.disclaimersAdded
      }
    });

  } catch (err) {
    // RELEASE RESERVATION ATOMICALLY ON FAILURE
    db.releaseCreditReservation(requestId, req.user.userId, err.message);

    metrics.aiRequestsFailed++;
    console.error('AI Generation error (Reservation released):', err.message);
    return res.status(502).json({
      error: 'Failed to generate report from AI provider. Credit reservation was released.',
      code: 'AI_PROVIDER_ERROR'
    });
  }
}

app.post('/api/generate-astrology', rateLimiter, authenticateSession, requireDatabaseReady, handleGenerateAstrology);
app.post('/api/astrology-report', rateLimiter, authenticateSession, requireDatabaseReady, handleGenerateAstrology);

// ---------------------------------------------------------------------------
// 7b. Built-In Local AI Architecture & Question Understanding
// ---------------------------------------------------------------------------
app.get('/api/ai/local-status', async (req, res) => {
  const config = getLocalAiConfig();
  const health = await checkLocalModelHealth(config);
  const detectedModels = scanLocalModels();
  res.json({
    mode: config.mode,
    endpoint: config.endpoint,
    activeModel: config.modelName,
    health,
    detectedModels,
    supportedRegistry: LOCAL_MODEL_REGISTRY
  });
});

app.post('/api/ai/parse-question', rateLimiter, async (req, res) => {
  const { question, lang = 'en' } = req.body;
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Valid question string is required.' });
  }

  try {
    const parsed = await parseQuestionToSpecification(question, { lang });
    if (parsed) {
      return res.json({
        success: true,
        source: parsed.source,
        inferenceStatus: parsed.inferenceStatus || LOCAL_INFERENCE_STATUS.LOCAL_MODEL_SUCCESS,
        model: parsed.model || null,
        specification: parsed.specification
      });
    }

    // Deterministic fallback parser
    return res.json({
      success: true,
      source: 'DETERMINISTIC_FALLBACK',
      inferenceStatus: LOCAL_INFERENCE_STATUS.DETERMINISTIC_FALLBACK,
      specification: {
        rawQuestion: question,
        language: lang,
        domain: 'GENERAL',
        event: 'GENERAL_EVENT',
        task: 'INTERPRETATION',
        subject: 'ACTIVE_PROFILE',
        isCompound: false,
        confidence: 0.85
      }
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
      code: 'PARSE_FAILED',
      inferenceStatus: LOCAL_INFERENCE_STATUS.LOCAL_MODEL_ERROR
    });
  }
});

app.post('/api/ai/rephrase-answer', rateLimiter, authenticateSession, async (req, res) => {
  const { answerObject, lang = 'en', chartContext = null } = req.body;
  if (!answerObject || typeof answerObject !== 'object') {
    return res.status(400).json({ error: 'Valid answerObject is required.' });
  }

  try {
    const rephrased = await rephraseAnswerWithLocalLLM(answerObject, { lang });
    const textToGate = rephrased ? rephrased.rephrasedText : (answerObject.directAnswer || '');

    // Strictly enforce Evidence Gate & Claim Firewall on LLM wording
    const gateResult = validateAndSanitizeAIResponse(textToGate, chartContext, { lang });

    res.json({
      success: true,
      source: rephrased ? rephrased.source : 'DETERMINISTIC_FALLBACK',
      inferenceStatus: rephrased ? LOCAL_INFERENCE_STATUS.LOCAL_MODEL_SUCCESS : LOCAL_INFERENCE_STATUS.DETERMINISTIC_FALLBACK,
      model: rephrased ? rephrased.model : null,
      text: gateResult.text,
      _evidenceGate: {
        isValid: gateResult.isValid,
        sanitized: gateResult.sanitized,
        violations: gateResult.violations
      }
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
      code: 'REPHRASE_FAILED',
      inferenceStatus: LOCAL_INFERENCE_STATUS.LOCAL_MODEL_ERROR
    });
  }
});

app.post('/api/ai/validate-response', rateLimiter, async (req, res) => {
  const { text, chartContext = null, lang = 'en', modelCalibrated = false, timingResolution = 'YEAR' } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Valid text string is required.' });
  }

  try {
    const gateResult = validateAndSanitizeAIResponse(text, chartContext, {
      lang,
      modelCalibrated,
      timingResolution
    });

    res.json({
      success: true,
      text: gateResult.text,
      sanitized: gateResult.sanitized,
      isValid: gateResult.isValid,
      violations: gateResult.violations,
      verifiedClaims: gateResult.verifiedClaims,
      unsupportedClaims: gateResult.unsupportedClaims,
      contradictoryClaims: gateResult.contradictoryClaims,
      disclaimersAdded: gateResult.disclaimersAdded
    });
  } catch (err) {
    res.status(500).json({ error: err.message, code: 'VALIDATION_FAILED' });
  }
});

// ---------------------------------------------------------------------------
// 8. Privacy & Data Governance (Audit Point 23)
// ---------------------------------------------------------------------------
app.get('/api/user/export', authenticateSession, (req, res) => {
  const entitlements = getOrCreateEntitlements(req.user.userId);
  const userDossier = exportUserData(req.user.userId, entitlements);
  res.json(userDossier);
});

app.delete('/api/user/delete', authenticateSession, requireDatabaseReady, async (req, res) => {
  try {
    const result = await eraseUserData(req.user.userId, activeSessions);
    res.json(result);
  } catch (err) {
    console.error('User erasure error:', err.message);
    res.status(500).json({ error: 'Failed to complete user erasure transaction.', code: 'ERASURE_FAILED' });
  }
});

// ---------------------------------------------------------------------------
// 8b. PDF Report Export (Chromium-Powered True Unicode Print-to-PDF)
// ---------------------------------------------------------------------------
app.post('/api/export/pdf', rateLimiter, optionalAuthenticateSession, async (req, res) => {
  try {
    const { chartData, lang, tier, audienceMode, options } = req.body || {};
    if (!chartData || typeof chartData !== 'object') {
      return res.status(400).json({
        error: 'INVALID_REQUEST: chartData object is required for PDF export.',
        code: 'MISSING_CHART_DATA'
      });
    }

    if (!isChromiumAvailable()) {
      return res.status(503).json({
        error: 'Headless Chromium renderer is not installed on this server.',
        code: 'RENDERER_UNAVAILABLE'
      });
    }

    const exportOptions = {
      lang: lang || 'en',
      tier: tier || 'detailed',
      audienceMode: audienceMode || 'client',
      ...(options || {})
    };

    const { pdfBuffer, fileName } = await generateReportPdf(chartData, exportOptions);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    return res.end(pdfBuffer);
  } catch (err) {
    console.error('PDF export failed:', err);
    return res.status(500).json({
      error: 'Failed to generate PDF report: ' + err.message,
      code: 'PDF_EXPORT_FAILED'
    });
  }
});

// ---------------------------------------------------------------------------
// 9. Protected System Metrics & Observability (Audit Point 48)
// ---------------------------------------------------------------------------
app.get('/api/system/metrics', (req, res) => {
  const adminKey = req.headers['x-admin-key'];
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

const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@skr-astro.app';

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
  const { title = 'SKR ASTRO Planetary Transit Alert', body = 'Benefic Jupiter-Venus alignment active. Guidance for a Brighter Life.', url = '/' } = req.body;
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

// ---------------------------------------------------------------------------
// Layer 5 & 6: Prediction Intelligence, Consent & AI Preferences Endpoints
// ---------------------------------------------------------------------------

// Record an immutable prediction with evidence linkage
app.post('/api/predictions/record', authenticateSession, (req, res) => {
  try {
    const userId = req.user.userId;
    const { chartData, questionMeta, predictionResult, evidenceList, observationDeadline } = req.body || {};

    const result = recordPrediction({
      userId,
      chartData,
      questionMeta,
      predictionResult,
      evidenceList,
      observationDeadline
    });

    return res.status(201).json(result);
  } catch (err) {
    if (err.code === 'IMMUTABLE_PREDICTION_RECORD_EXISTS') {
      return res.status(409).json({ error: err.message, code: err.code });
    }
    if (err.code === 'INVALID_TIMING_RESOLUTION') {
      return res.status(400).json({ error: err.message, code: err.code });
    }
    console.error('[PREDICTION_RECORD_ERROR]', err);
    return res.status(500).json({ error: 'Failed to record prediction record.', details: err.message });
  }
});

// Retrieve an immutable prediction by ID
app.get('/api/predictions/:id', authenticateSession, (req, res) => {
  try {
    const record = getPredictionById(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Prediction record not found.', code: 'PREDICTION_NOT_FOUND' });
    }
    return res.json({ success: true, ...record });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve prediction.', details: err.message });
  }
});

// List predictions for the authenticated user
app.get('/api/predictions', authenticateSession, (req, res) => {
  try {
    const userId = req.user.userId;
    const predictions = listPredictionsForCustomer(userId, req.query);
    return res.json({ success: true, predictions, count: predictions.length });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to list predictions.', details: err.message });
  }
});

// Update customer training consent
app.post('/api/consent/update', authenticateSession, (req, res) => {
  try {
    const userId = req.user.userId;
    const { consentGranted, consentVersion } = req.body || {};
    const consent = db.setTrainingConsent(userId, consentGranted, consentVersion);
    return res.json({ success: true, consent });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update training consent.', details: err.message });
  }
});

// Get customer training consent status
app.get('/api/consent/status', authenticateSession, (req, res) => {
  try {
    const userId = req.user.userId;
    const consent = db.getTrainingConsent(userId);
    return res.json({ success: true, consent });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve consent status.', details: err.message });
  }
});

// Update customer AI preferences
app.post('/api/preferences/ai', authenticateSession, (req, res) => {
  try {
    const userId = req.user.userId;
    const prefs = db.saveCustomerAIPreferences(userId, req.body || {});
    return res.json({ success: true, preferences: prefs });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save customer AI preferences.', details: err.message });
  }
});

// Get customer AI preferences
app.get('/api/preferences/ai', authenticateSession, (req, res) => {
  try {
    const userId = req.user.userId;
    const prefs = db.getCustomerAIPreferences(userId);
    return res.json({ success: true, preferences: prefs });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve customer AI preferences.', details: err.message });
  }
});

// ---------------------------------------------------------------------------
// Prediction Feedback & Observed Outcomes Engine (Stage 3)
// ---------------------------------------------------------------------------

// Submit structured feedback on a prediction (Questions 1, 2, 3)
app.post('/api/feedback/submit', authenticateSession, (req, res) => {
  try {
    const userId = req.user.userId;
    const { predictionId, feedbackCategory, relevanceScore, comments, metadata } = req.body || {};

    if (!predictionId) {
      return res.status(400).json({ error: 'predictionId is required', code: 'MISSING_PREDICTION_ID' });
    }

    const feedbackId = `fb_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const feedbackRecord = db.saveCustomerFeedback({
      feedbackId,
      predictionId,
      customerId: userId,
      feedbackCategory: feedbackCategory || "INTERPRETATION_RELEVANCE",
      relevanceScore: typeof relevanceScore === 'number' ? relevanceScore : null,
      userCommentsRedacted: comments ? String(comments).trim().substring(0, 500) : "",
      metadata: metadata || {}
    });

    return res.status(201).json({ success: true, feedback: feedbackRecord });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to submit feedback.', details: err.message });
  }
});

// Report actual observed outcome subsequently (Question 4)
app.post('/api/outcomes/report', authenticateSession, (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      predictionId,
      eventOccurred,
      reportedDate,
      datePrecision,
      isCensored,
      outcomeCategory,
      observationEndedAt,
      metadata
    } = req.body || {};

    if (!predictionId || eventOccurred === undefined) {
      return res.status(400).json({ error: 'predictionId and eventOccurred boolean are required', code: 'MISSING_REQUIRED_FIELDS' });
    }

    const outcomeId = `out_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const outcomeRecord = db.saveObservedOutcome({
      outcomeId,
      predictionId,
      customerId: userId,
      eventOccurred: Boolean(eventOccurred),
      outcomeCategory: outcomeCategory || (Boolean(isCensored) ? "CENSORED" : "USER_REPORTED"),
      reportedDate: reportedDate || null,
      datePrecision: datePrecision || "APPROX_YEAR",
      isCensored: Boolean(isCensored),
      observationEndedAt: observationEndedAt || null,
      metadata: metadata || {}
    });

    return res.status(201).json({ success: true, outcome: outcomeRecord });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to report outcome.', details: err.message });
  }
});

// Verify observed outcome (Quality gate / Admin or verification system)
app.post('/api/outcomes/verify', authenticateSession, (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    const hasValidAdminKey = Boolean(adminKey && typeof adminKey === 'string' && ADMIN_METRICS_KEY &&
      adminKey.length === ADMIN_METRICS_KEY.length &&
      crypto.timingSafeEqual(Buffer.from(adminKey), Buffer.from(ADMIN_METRICS_KEY)));

    const user = db.getUser(req.user.userId);
    const userRole = (user && (user.role || user.subscriptionTier)) || req.user.role || '';
    const isAuthorizedRole = userRole === 'admin' || userRole === 'verifier' || userRole === 'auditor';

    if (!hasValidAdminKey && !isAuthorizedRole) {
      return res.status(403).json({
        error: 'Forbidden. Outcome verification requires admin or verifier authority.',
        code: 'FORBIDDEN_VERIFICATION_PERMISSION'
      });
    }

    const { outcomeId, verificationMethod, verificationStatus, notes, evidenceReference, changeReason } = req.body || {};
    if (!outcomeId) {
      return res.status(400).json({ error: 'outcomeId is required', code: 'MISSING_OUTCOME_ID' });
    }

    const verificationId = `ver_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const verificationRecord = db.saveOutcomeVerification({
      verificationId,
      outcomeId,
      verificationMethod: verificationMethod || "SELF_REPORTED_ONLY",
      verificationStatus: verificationStatus || "UNVERIFIED",
      verifiedBy: req.user.userId,
      evidenceReference: evidenceReference || null,
      notes: notes || "",
      changeReason: changeReason || notes || "Verification update"
    });

    return res.status(201).json({ success: true, verification: verificationRecord });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to verify outcome.', details: err.message });
  }
});

// Retrieve outcome verification history (Section 11) - Protected against IDOR
app.get('/api/outcomes/:id/verification-history', authenticateSession, (req, res) => {
  try {
    const outcomeId = req.params.id;
    const user = db.getUser(req.user.userId);
    const userRole = (user && (user.role || user.subscriptionTier)) || req.user.role || '';
    const isAuthorizedRole = userRole === 'admin' || userRole === 'verifier' || userRole === 'auditor';

    const outcome = db.getObservedOutcomeById(outcomeId);
    if (!outcome) {
      return res.status(404).json({ error: 'Outcome not found.', code: 'OUTCOME_NOT_FOUND' });
    }

    const pseudoId = db.getPseudonymousCustomerId(req.user.userId);
    const isOwner = outcome.customerId === req.user.userId || outcome.customerId === pseudoId;

    if (!isAuthorizedRole && !isOwner) {
      return res.status(403).json({
        error: 'Forbidden. You do not have permission to view verification history for this outcome.',
        code: 'FORBIDDEN_VERIFICATION_HISTORY'
      });
    }

    const history = db.getOutcomeVerificationHistory(outcomeId);
    return res.json({ success: true, outcomeId, history, count: history.length });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve verification history.', details: err.message });
  }
});

// Replay prediction against observed outcome (Phase 4 & Phase 5)
app.post('/api/predictions/:id/replay', authenticateSession, (req, res) => {
  try {
    const predictionId = req.params.id;
    const { observedOutcomeOverride, options } = req.body || {};
    const replayResult = replayPrediction(predictionId, observedOutcomeOverride, options);

    if (!replayResult.success) {
      return res.status(replayResult.code === 'NOT_FOUND' ? 404 : 400).json(replayResult);
    }

    return res.json(replayResult);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to replay prediction.', details: err.message });
  }
});

export let server = null;
import { fileURLToPath } from 'url';
const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (process.env.NODE_ENV !== 'test' && !process.argv[1]?.includes('test') && isDirectRun) {
  Promise.resolve(db.readyPromise).catch(() => {}).then(() => {
    server = app.listen(PORT, () => {
      console.log(`[SKR ASTRO Production Backend] Running on http://localhost:${PORT}`);
    });
  });
}
