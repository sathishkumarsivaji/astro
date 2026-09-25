/**
 * Secure Commercial-Grade Backend Proxy & Transactional Credit Authority
 * Provides:
 * 1. Server-side Gemini API key isolation (keys never exposed to browser)
 * 2. ACID-style transactional credit ledger (lock, verify, deduct, rollback)
 * 3. Session-based authentication & server-resolved user identity (client cannot spoof userId)
 * 4. Rate limiting and payload size guards
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '256kb' }));

// Simple in-memory sliding-window rate limiter: max 20 requests per 10 minutes per IP
const requestHistory = new Map();
function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const history = requestHistory.get(ip) || [];
  const activeHistory = history.filter(t => now - t < windowMs);

  if (activeHistory.length >= 20) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Maximum 20 AI requests per 10 minutes.',
      retryAfterSeconds: Math.ceil((activeHistory[0] + windowMs - now) / 1000)
    });
  }

  activeHistory.push(now);
  requestHistory.set(ip, activeHistory);
  next();
}

// ---------------------------------------------------------------------------
// Transactional Credit Ledger & Authenticated User Authority
// ---------------------------------------------------------------------------
const userAccounts = new Map();
const activeSessions = new Map();

let SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: SESSION_SECRET environment variable is required in production.');
  }
  console.warn('[SECURITY WARNING] No SESSION_SECRET specified. Generating ephemeral cryptographic session secret.');
  SESSION_SECRET = crypto.randomBytes(32).toString('hex');
}

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24-hour token expiry

// Helper to get or create a user account
function getOrCreateUserAccount(userId) {
  if (!userAccounts.has(userId)) {
    userAccounts.set(userId, {
      userId,
      balance: 45, // Commercial default initial credits managed by server
      locked: 0,
      createdAt: new Date().toISOString(),
      transactions: []
    });
  }
  return userAccounts.get(userId);
}

// Generates a cryptographically signed HMAC session token
function createSignedSessionToken(userId = null) {
  const effectiveUserId = userId || `usr_${crypto.randomBytes(8).toString('hex')}`;
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
  getOrCreateUserAccount(effectiveUserId);
  return session;
}

// Verifies the HMAC signature, authenticity, and TTL of a session token
function verifySignedSessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  if (activeSessions.has(token)) {
    const session = activeSessions.get(token);
    const sessionAge = Date.now() - new Date(session.createdAt).getTime();
    if (sessionAge > SESSION_TTL_MS) {
      activeSessions.delete(token);
      return null;
    }
    return session;
  }
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [b64Payload, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(b64Payload).digest('base64url');
  if (signature !== expectedSig) return null;

  try {
    const payload = JSON.parse(Buffer.from(b64Payload, 'base64url').toString('utf8'));
    if (!payload.userId) return null;
    if (payload.createdAt && (Date.now() - payload.createdAt > SESSION_TTL_MS)) {
      return null; // Expired session token
    }
    const session = {
      sessionToken: token,
      userId: payload.userId,
      createdAt: new Date(payload.createdAt || Date.now()).toISOString()
    };
    activeSessions.set(token, session);
    getOrCreateUserAccount(payload.userId);
    return session;
  } catch (e) {
    return null;
  }
}

// Session authentication middleware: derives req.user from cryptographically verified session token
function authenticateSession(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const sessionHeader = req.headers['x-session-token'];
  const token = bearerToken || sessionHeader;

  const session = verifySignedSessionToken(token);
  if (!session) {
    return res.status(401).json({
      error: 'Unauthorized: Invalid or missing session token. Please authenticate via POST /api/auth/session.',
      code: 'UNAUTHORIZED_SESSION'
    });
  }

  req.user = session;
  next();
}

// 1. Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'AstroVerse Secure AI Proxy & Credit Authority',
    version: '1.2.0',
    serverKeyConfigured: Boolean(GEMINI_API_KEY)
  });
});

// 2. Session Initialization & Handshake Endpoint (Creates or refreshes signed token)
app.post('/api/auth/session', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const sessionHeader = req.headers['x-session-token'];
  const incomingToken = bearerToken || sessionHeader;

  let session = verifySignedSessionToken(incomingToken);
  if (!session) {
    session = createSignedSessionToken();
  }

  const user = getOrCreateUserAccount(session.userId);
  res.json({
    sessionToken: session.sessionToken,
    userId: session.userId,
    availableCredits: user.balance - user.locked,
    totalBalance: user.balance
  });
});

// 3. Authenticated User Credit Verification Endpoint
app.get('/api/user/credits', authenticateSession, (req, res) => {
  const user = getOrCreateUserAccount(req.user.userId);
  res.json({
    userId: req.user.userId,
    availableCredits: user.balance - user.locked,
    totalBalance: user.balance
  });
});

// Authenticated credit verification endpoint (strictly restricted to authenticated session owner)
app.get('/api/credits/:userId', authenticateSession, (req, res) => {
  if (req.user.userId !== req.params.userId) {
    return res.status(403).json({ error: 'Forbidden: Access to another user account is denied.', code: 'FORBIDDEN_USER' });
  }
  const user = getOrCreateUserAccount(req.user.userId);
  res.json({
    userId: req.user.userId,
    availableCredits: user.balance - user.locked,
    totalBalance: user.balance
  });
});

// 4. Secure AI Generation with Atomic Transactional Debit
app.post('/api/generate-astrology', rateLimiter, authenticateSession, async (req, res) => {
  const { prompt, lang = 'en' } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Valid astrological prompt is required.' });
  }

  const effectiveApiKey = GEMINI_API_KEY;
  if (!effectiveApiKey) {
    return res.status(503).json({
      error: 'AI service unavailable: No server GEMINI_API_KEY configured.',
      code: 'API_KEY_MISSING'
    });
  }

  // BEGIN ATOMIC TRANSACTION - strictly using server-resolved req.user.userId
  const user = getOrCreateUserAccount(req.user.userId);
  const cost = 1;
  const available = user.balance - user.locked;

  if (available < cost) {
    return res.status(402).json({
      error: 'Insufficient credits. Please recharge your reading balance.',
      availableCredits: available,
      requiredCredits: cost
    });
  }

  // Lock credit during generation
  user.locked += cost;
  const txId = `tx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

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
      throw lastError || new Error('All model attempts failed to generate content.');
    }

    // COMMIT TRANSACTION
    user.locked -= cost;
    user.balance -= cost;
    user.transactions.push({
      txId,
      userId: req.user.userId,
      readingType: 'ai_astrology_report',
      type: 'debit',
      amount: cost,
      timestamp: new Date().toISOString(),
      status: 'committed'
    });

    return res.json({
      success: true,
      text: generatedText,
      transactionId: txId,
      remainingCredits: user.balance - user.locked
    });

  } catch (err) {
    // ROLLBACK TRANSACTION
    user.locked -= cost;
    user.transactions.push({
      txId,
      userId: req.user.userId,
      type: 'failed_rollback',
      amount: cost,
      timestamp: new Date().toISOString(),
      status: 'rolled_back',
      error: err.message
    });

    console.error('AI Generation error (Transaction rolled back):', err);
    return res.status(502).json({
      error: 'Failed to generate report from AI provider. Credit was not deducted.',
      code: 'AI_PROVIDER_ERROR'
    });
  }
});

app.listen(PORT, () => {
  console.log(`[Astro Backend Proxy] Running on http://localhost:${PORT}`);
});
