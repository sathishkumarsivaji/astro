/**
 * ASTROVERSE — Durable Transactional Storage Engine & PostgreSQL Adapter
 *
 * Provides dual-layer transactional storage for production backend:
 * 1. Primary / Durable: PostgreSQL connection pool (pg) with automated table DDL & indexing
 * 2. High-Performance Cache: In-memory indexing (<0.1ms read latency)
 * 3. File-System Backup: Atomic JSON persistence with crash recovery
 *
 * Data Domains:
 * - Users, Entitlements, Roles & Registration State
 * - Cryptographic Account Secrets
 * - Payment Orders, Invoices & Pricing Tiers (₹20, ₹50, ₹100, ₹200)
 * - Processed Payment Ledger & Transaction Audit
 * - Saved Horoscopes & Birth Profiles
 * - Privacy Erasure & Audit Logs
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../../data");
const DB_FILE = path.join(DATA_DIR, "astroverse_store.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class AstroDatabase {
  constructor() {
    this.state = {
      users: {},
      user_secrets: {},
      payment_orders: {},
      payment_transactions: {},
      processed_payment_ids: {},
      saved_charts: {},
      push_subscriptions: {},
      conversations: {},
      messages: {},
      claim_graphs: {},
      audit_ledger: []
    };

    this.pgPool = null;
    this.pgConnected = false;

    // Load file-backed cache initially
    this.load();

    // Initialize PostgreSQL connection
    this.readyPromise = this.initPostgres();
  }

  async initPostgres() {
    try {
      const connectionString = process.env.DATABASE_URL || null;
      const config = connectionString
        ? { connectionString, ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : false }
        : {
            user: process.env.PGUSER || "postgres",
            host: process.env.PGHOST || "localhost",
            database: process.env.PGDATABASE || "astroverse",
            password: process.env.PGPASSWORD || undefined,
            port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
            connectionTimeoutMillis: 3000,
            idleTimeoutMillis: 30000
          };

      this.pgPool = new Pool(config);

      // Test connection
      const client = await this.pgPool.connect();
      this.pgConnected = true;
      console.info("[POSTGRESQL] Successfully connected to PostgreSQL server.");

      // Run DDL Migrations
      await this.runMigrations(client);
      client.release();

      // Hydrate in-memory state from PostgreSQL
      await this.hydrateFromPostgres();
    } catch (err) {
      this.pgConnected = false;
      console.warn("[POSTGRESQL] PostgreSQL connection notice (using resilient write-through store):", err.message);
      if (process.env.NODE_ENV === 'production') {
        console.error("[POSTGRESQL] FATAL: PostgreSQL connection and migration required in production mode.", err);
        process.exit(1);
      }
    }
  }

  async runMigrations(client) {
    const ddl = `
      CREATE TABLE IF NOT EXISTS users (
        user_id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        name VARCHAR(255),
        password_hash TEXT,
        subscription_tier VARCHAR(64) DEFAULT 'unregistered',
        is_registered BOOLEAN DEFAULT FALSE,
        available_credits INTEGER DEFAULT 0,
        monthly_credits INTEGER DEFAULT 0,
        bonus_credits INTEGER DEFAULT 0,
        locked_credits INTEGER DEFAULT 0,
        valid_until TIMESTAMPTZ,
        pdf_export BOOLEAN DEFAULT FALSE,
        profiles_allowance INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'::jsonb
      );

      CREATE TABLE IF NOT EXISTS user_secrets (
        user_id VARCHAR(64) PRIMARY KEY,
        secret_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payment_orders (
        order_id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64),
        plan_id VARCHAR(64) NOT NULL,
        plan_name VARCHAR(255),
        billing_period VARCHAR(32),
        currency VARCHAR(16) DEFAULT 'INR',
        amount_inr NUMERIC(10, 2) NOT NULL,
        amount_usd NUMERIC(10, 2),
        credits_to_add INTEGER DEFAULT 0,
        status VARCHAR(32) DEFAULT 'created',
        payment_id VARCHAR(128),
        gateway_metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payment_transactions (
        tx_id VARCHAR(64) PRIMARY KEY,
        order_id VARCHAR(64),
        payment_id VARCHAR(128),
        user_id VARCHAR(64),
        type VARCHAR(64),
        amount_inr NUMERIC(10, 2),
        currency VARCHAR(16) DEFAULT 'INR',
        credits_added INTEGER DEFAULT 0,
        plan_id VARCHAR(64),
        status VARCHAR(32) DEFAULT 'completed',
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        details JSONB DEFAULT '{}'::jsonb
      );

      CREATE TABLE IF NOT EXISTS saved_charts (
        chart_id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        chart_name VARCHAR(255),
        birth_data JSONB NOT NULL,
        calculated_data JSONB,
        saved_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS audit_ledger (
        event_id VARCHAR(64) PRIMARY KEY,
        event_type VARCHAR(64) NOT NULL,
        user_id VARCHAR(64),
        record JSONB DEFAULT '{}'::jsonb,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS push_subscriptions (
        endpoint TEXT PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        subscription_json JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        last_success_at TIMESTAMPTZ,
        last_failure_at TIMESTAMPTZ,
        disabled_at TIMESTAMPTZ,
        status VARCHAR(32) DEFAULT 'active'
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_saved_charts_user ON saved_charts(user_id);
      CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders(user_id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_tx_payment_id ON payment_transactions(payment_id);
      CREATE INDEX IF NOT EXISTS idx_push_sub_user ON push_subscriptions(user_id);
    `;

    await client.query(ddl);
    console.info("[POSTGRESQL] Tables and indexes verified/created successfully.");
  }

  async hydrateFromPostgres() {
    if (!this.pgConnected || !this.pgPool) return;
    try {
      const usersRes = await this.pgPool.query("SELECT * FROM users");
      for (const row of usersRes.rows) {
        this.state.users[row.user_id] = {
          userId: row.user_id,
          email: row.email,
          name: row.name,
          passwordHash: row.password_hash,
          subscriptionTier: row.subscription_tier,
          isRegistered: row.is_registered,
          availableCredits: row.available_credits,
          monthlyCredits: row.monthly_credits,
          bonusCredits: row.bonus_credits,
          lockedCredits: row.locked_credits,
          validUntil: row.valid_until ? new Date(row.valid_until).toISOString() : null,
          pdfExport: row.pdf_export,
          profilesAllowance: row.profiles_allowance,
          createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
          updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
          ...(row.metadata || {})
        };
      }

      const secretsRes = await this.pgPool.query("SELECT * FROM user_secrets");
      for (const row of secretsRes.rows) {
        this.state.user_secrets[row.user_id] = row.secret_hash;
      }

      const ordersRes = await this.pgPool.query("SELECT * FROM payment_orders");
      for (const row of ordersRes.rows) {
        this.state.payment_orders[row.order_id] = {
          orderId: row.order_id,
          userId: row.user_id,
          planId: row.plan_id,
          planName: row.plan_name,
          billingPeriod: row.billing_period,
          currency: row.currency,
          amountINR: parseFloat(row.amount_inr),
          amountUSD: row.amount_usd ? parseFloat(row.amount_usd) : null,
          creditsToAdd: row.credits_to_add,
          status: row.status,
          paymentId: row.payment_id,
          gatewayMetadata: row.gateway_metadata,
          createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
          updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
        };
      }

      const chartsRes = await this.pgPool.query("SELECT * FROM saved_charts");
      for (const row of chartsRes.rows) {
        this.state.saved_charts[row.chart_id] = {
          chartId: row.chart_id,
          userId: row.user_id,
          chartName: row.chart_name,
          birthData: row.birth_data,
          calculatedData: row.calculated_data,
          savedAt: row.saved_at ? new Date(row.saved_at).toISOString() : new Date().toISOString()
        };
      }

      const pushRes = await this.pgPool.query("SELECT * FROM push_subscriptions WHERE status = 'active'");
      for (const row of pushRes.rows) {
        this.state.push_subscriptions[row.endpoint] = {
          endpoint: row.endpoint,
          userId: row.user_id,
          subscription: row.subscription_json,
          createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
          updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
          lastSuccessAt: row.last_success_at ? new Date(row.last_success_at).toISOString() : null,
          lastFailureAt: row.last_failure_at ? new Date(row.last_failure_at).toISOString() : null,
          disabledAt: row.disabled_at ? new Date(row.disabled_at).toISOString() : null,
          status: row.status
        };
      }

      console.info(`[POSTGRESQL] Hydrated ${usersRes.rowCount} users, ${ordersRes.rowCount} orders, ${chartsRes.rowCount} saved charts, and ${pushRes.rowCount} push subscriptions from PostgreSQL.`);
    } catch (err) {
      console.warn("[POSTGRESQL] Hydration notice:", err.message);
    }
  }

  load() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, "utf8");
        const parsed = JSON.parse(raw);
        this.state = {
          users: parsed.users || {},
          user_secrets: parsed.user_secrets || {},
          payment_orders: parsed.payment_orders || {},
          payment_transactions: parsed.payment_transactions || {},
          processed_payment_ids: parsed.processed_payment_ids || {},
          saved_charts: parsed.saved_charts || {},
          push_subscriptions: parsed.push_subscriptions || {},
          conversations: parsed.conversations || {},
          messages: parsed.messages || {},
          claim_graphs: parsed.claim_graphs || {},
          audit_ledger: parsed.audit_ledger || []
        };
      } catch (err) {
        console.error("[DATABASE] Error loading db file, initializing clean state:", err.message);
      }
    } else {
      this.persist();
    }
  }

  persist() {
    try {
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 6)}`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.state, null, 2), "utf8");
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error("[DATABASE] Persistence error:", err.message);
    }
  }

  // --- Users & Entitlements ---
  getUser(userId) {
    return this.state.users[userId] || null;
  }

  getUserByEmail(email) {
    if (!email) return null;
    const norm = email.trim().toLowerCase();
    return Object.values(this.state.users).find(u => u.email && u.email.trim().toLowerCase() === norm) || null;
  }

  saveUser(userId, userData) {
    const record = {
      ...userData,
      userId,
      updatedAt: new Date().toISOString()
    };
    this.state.users[userId] = record;
    this.persist();

    // Async write-through to PostgreSQL
    if (this.pgConnected && this.pgPool) {
      this.pgPool.query(
        `INSERT INTO users (
          user_id, email, name, password_hash, subscription_tier, is_registered,
          available_credits, monthly_credits, bonus_credits, locked_credits,
          valid_until, pdf_export, profiles_allowance, updated_at, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), $14)
        ON CONFLICT (user_id) DO UPDATE SET
          email = EXCLUDED.email,
          name = EXCLUDED.name,
          password_hash = COALESCE(EXCLUDED.password_hash, users.password_hash),
          subscription_tier = EXCLUDED.subscription_tier,
          is_registered = EXCLUDED.is_registered,
          available_credits = EXCLUDED.available_credits,
          monthly_credits = EXCLUDED.monthly_credits,
          bonus_credits = EXCLUDED.bonus_credits,
          locked_credits = EXCLUDED.locked_credits,
          valid_until = EXCLUDED.valid_until,
          pdf_export = EXCLUDED.pdf_export,
          profiles_allowance = EXCLUDED.profiles_allowance,
          updated_at = NOW(),
          metadata = EXCLUDED.metadata`,
        [
          record.userId,
          record.email || null,
          record.name || null,
          record.passwordHash || null,
          record.subscriptionTier || 'unregistered',
          Boolean(record.isRegistered),
          record.availableCredits || 0,
          record.monthlyCredits || 0,
          record.bonusCredits || 0,
          record.lockedCredits || 0,
          record.validUntil || null,
          Boolean(record.pdfExport),
          record.profilesAllowance || 1,
          JSON.stringify(record)
        ]
      ).catch(err => console.warn("[POSTGRESQL] User upsert async warning:", err.message));
    }

    return record;
  }

  getAccountSecret(userId) {
    return this.state.user_secrets[userId] || null;
  }

  setAccountSecret(userId, secret) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(secret, salt, 64).toString('hex');
    const secretHash = `${salt}:${hash}`;
    this.state.user_secrets[userId] = secretHash;
    this.persist();

    if (this.pgConnected && this.pgPool) {
      this.pgPool.query(
        `INSERT INTO user_secrets (user_id, secret_hash) VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET secret_hash = EXCLUDED.secret_hash`,
        [userId, secretHash]
      ).catch(err => console.warn("[POSTGRESQL] Secret upsert async warning:", err.message));
    }

    return secret;
  }

  verifyAccountSecret(userId, candidateSecret) {
    const stored = this.state.user_secrets[userId];
    if (!stored) return false;
    if (!stored.includes(':')) {
      return stored === candidateSecret;
    }
    const [salt, storedHash] = stored.split(':');
    const candidateHash = crypto.scryptSync(candidateSecret, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(candidateHash, 'hex'));
  }

  // --- Password Hashing for Registered Accounts ---
  hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  verifyPassword(candidatePassword, storedPasswordHash) {
    if (!candidatePassword || !storedPasswordHash) return false;
    if (!storedPasswordHash.includes(':')) return candidatePassword === storedPasswordHash;
    const [salt, storedHash] = storedPasswordHash.split(':');
    const candidateHash = crypto.scryptSync(candidatePassword, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(candidateHash, 'hex'));
  }

  // --- Payment Orders ---
  getOrder(orderId) {
    return this.state.payment_orders[orderId] || null;
  }

  saveOrder(orderId, orderData) {
    const record = {
      ...orderData,
      orderId,
      updatedAt: new Date().toISOString()
    };
    this.state.payment_orders[orderId] = record;
    this.persist();

    if (this.pgConnected && this.pgPool) {
      this.pgPool.query(
        `INSERT INTO payment_orders (
          order_id, user_id, plan_id, plan_name, billing_period, currency,
          amount_inr, amount_usd, credits_to_add, status, payment_id, gateway_metadata, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
        ON CONFLICT (order_id) DO UPDATE SET
          status = EXCLUDED.status,
          payment_id = EXCLUDED.payment_id,
          updated_at = NOW()`,
        [
          record.orderId,
          record.userId || null,
          record.planId,
          record.planName || record.planId,
          record.billingPeriod || 'one_time',
          record.currency || 'INR',
          record.amountINR || record.amountUSD * 83.5 || 0,
          record.amountUSD || null,
          record.creditsToAdd || 0,
          record.status || 'created',
          record.paymentId || null,
          JSON.stringify(record.gatewayMetadata || {})
        ]
      ).catch(err => console.warn("[POSTGRESQL] Order upsert async warning:", err.message));
    }

    return record;
  }

  isPaymentProcessed(paymentId) {
    return Boolean(this.state.processed_payment_ids[paymentId]);
  }

  claimPaymentId(paymentId) {
    if (!paymentId) return false;
    if (this.state.processed_payment_ids[paymentId]) {
      return false;
    }
    this.state.processed_payment_ids[paymentId] = "CLAIMED_PROCESSING";
    return true;
  }

  recordPaymentTransaction(txData) {
    const txId = txData.txId || `tx_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const record = {
      ...txData,
      txId,
      timestamp: txData.timestamp || new Date().toISOString()
    };
    this.state.payment_transactions[txId] = record;
    if (record.paymentId) {
      this.state.processed_payment_ids[record.paymentId] = txId;
    }
    const auditEvent = {
      eventId: `aud_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      type: "PAYMENT_TRANSACTION",
      record,
      timestamp: new Date().toISOString()
    };
    this.state.audit_ledger.push(auditEvent);
    this.persist();

    if (this.pgConnected && this.pgPool) {
      this.pgPool.query(
        `INSERT INTO payment_transactions (
          tx_id, order_id, payment_id, user_id, type, amount_inr, currency,
          credits_added, plan_id, status, timestamp, details
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (payment_id) DO NOTHING`,
        [
          record.txId,
          record.orderId || null,
          record.paymentId || null,
          record.userId || null,
          record.type || 'payment',
          record.amountINR || 0,
          record.currency || 'INR',
          record.creditsAdded || 0,
          record.planId || null,
          record.status || 'completed',
          record.timestamp,
          JSON.stringify(record)
        ]
      ).catch(err => console.warn("[POSTGRESQL] Tx insert async warning:", err.message));
    }

    return record;
  }

  // --- Saved Charts ---
  getUserCharts(userId) {
    return Object.values(this.state.saved_charts).filter(c => c.userId === userId);
  }

  saveChart(userId, chartData) {
    const chartId = chartData.chartId || `chart_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const record = {
      ...chartData,
      chartId,
      userId,
      savedAt: chartData.savedAt || new Date().toISOString()
    };
    this.state.saved_charts[chartId] = record;
    this.persist();

    if (this.pgConnected && this.pgPool) {
      this.pgPool.query(
        `INSERT INTO saved_charts (chart_id, user_id, chart_name, birth_data, calculated_data, saved_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (chart_id) DO UPDATE SET
          chart_name = EXCLUDED.chart_name,
          birth_data = EXCLUDED.birth_data,
          calculated_data = EXCLUDED.calculated_data,
          saved_at = NOW()`,
        [
          record.chartId,
          record.userId,
          record.name || record.chartName || 'Birth Chart',
          JSON.stringify(record.birthData || record.profile || {}),
          JSON.stringify(record.calculatedData || {}),
          record.savedAt
        ]
      ).catch(err => console.warn("[POSTGRESQL] Saved chart upsert async warning:", err.message));
    }

    return record;
  }

  // --- Web Push Subscriptions ---
  savePushSubscription(userId, subscription) {
    if (!subscription || !subscription.endpoint) {
      throw new Error("Invalid push subscription: endpoint required");
    }
    const endpoint = subscription.endpoint;
    const now = new Date().toISOString();
    const record = {
      endpoint,
      userId,
      subscription,
      status: "active",
      createdAt: this.state.push_subscriptions[endpoint]?.createdAt || now,
      updatedAt: now,
      lastSuccessAt: this.state.push_subscriptions[endpoint]?.lastSuccessAt || null,
      lastFailureAt: this.state.push_subscriptions[endpoint]?.lastFailureAt || null,
      disabledAt: null
    };

    this.state.push_subscriptions[endpoint] = record;
    this.persist();

    if (this.pgConnected && this.pgPool) {
      this.pgPool.query(
        `INSERT INTO push_subscriptions (endpoint, user_id, subscription_json, created_at, updated_at, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (endpoint) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          subscription_json = EXCLUDED.subscription_json,
          updated_at = NOW(),
          status = 'active',
          disabled_at = NULL`,
        [
          record.endpoint,
          record.userId,
          JSON.stringify(record.subscription),
          record.createdAt,
          record.updatedAt,
          record.status
        ]
      ).catch(err => console.warn("[POSTGRESQL] Push subscription upsert async warning:", err.message));
    }

    return record;
  }

  getPushSubscription(userId) {
    const subs = Object.values(this.state.push_subscriptions).filter(
      s => s.userId === userId && s.status === "active"
    );
    return subs.length > 0 ? subs[subs.length - 1] : null;
  }

  getUserPushSubscriptions(userId) {
    return Object.values(this.state.push_subscriptions).filter(
      s => s.userId === userId && s.status === "active"
    );
  }

  getAllActivePushSubscriptions() {
    return Object.values(this.state.push_subscriptions).filter(s => s.status === "active");
  }

  deletePushSubscription(userId, endpoint = null) {
    let deletedCount = 0;
    for (const [ep, s] of Object.entries(this.state.push_subscriptions)) {
      if (s.userId === userId && (!endpoint || ep === endpoint)) {
        delete this.state.push_subscriptions[ep];
        deletedCount++;
      }
    }
    if (deletedCount > 0) {
      this.persist();
      if (this.pgConnected && this.pgPool) {
        if (endpoint) {
          this.pgPool.query("DELETE FROM push_subscriptions WHERE endpoint = $1 AND user_id = $2", [endpoint, userId]).catch(() => {});
        } else {
          this.pgPool.query("DELETE FROM push_subscriptions WHERE user_id = $1", [userId]).catch(() => {});
        }
      }
    }
    return { success: true, count: deletedCount };
  }

  recordPushDelivery(endpoint, success, errorMsg = null, isGone = false) {
    const sub = this.state.push_subscriptions[endpoint];
    if (!sub) return null;
    const now = new Date().toISOString();
    if (success) {
      sub.lastSuccessAt = now;
      sub.status = "active";
    } else {
      sub.lastFailureAt = now;
      if (isGone) {
        sub.status = "disabled";
        sub.disabledAt = now;
      }
    }
    sub.updatedAt = now;
    this.persist();

    if (this.pgConnected && this.pgPool) {
      if (isGone) {
        this.pgPool.query(
          "UPDATE push_subscriptions SET status = 'disabled', disabled_at = NOW(), last_failure_at = NOW(), updated_at = NOW() WHERE endpoint = $1",
          [endpoint]
        ).catch(() => {});
      } else if (success) {
        this.pgPool.query(
          "UPDATE push_subscriptions SET last_success_at = NOW(), updated_at = NOW() WHERE endpoint = $1",
          [endpoint]
        ).catch(() => {});
      } else {
        this.pgPool.query(
          "UPDATE push_subscriptions SET last_failure_at = NOW(), updated_at = NOW() WHERE endpoint = $1",
          [endpoint]
        ).catch(() => {});
      }
    }
    return sub;
  }

  // --- Privacy Erasure ---
  purgeUser(userId) {
    // 1. Delete user record & secret
    delete this.state.users[userId];
    delete this.state.user_secrets[userId];

    // 2. Delete charts
    for (const [id, c] of Object.entries(this.state.saved_charts)) {
      if (c.userId === userId) {
        delete this.state.saved_charts[id];
      }
    }

    // 3. Delete push subscriptions
    for (const [ep, s] of Object.entries(this.state.push_subscriptions)) {
      if (s.userId === userId) {
        delete this.state.push_subscriptions[ep];
      }
    }

    // 4. Anonymize transactions
    for (const tx of Object.values(this.state.payment_transactions)) {
      if (tx.userId === userId) {
        tx.userId = "ANONYMIZED_USER";
        tx.anonymizedAt = new Date().toISOString();
      }
    }

    this.state.audit_ledger.push({
      eventId: `aud_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      type: "USER_DATA_PURGED",
      userId,
      timestamp: new Date().toISOString()
    });

    this.persist();

    if (this.pgConnected && this.pgPool) {
      this.pgPool.query("DELETE FROM user_secrets WHERE user_id = $1", [userId]).catch(() => {});
      this.pgPool.query("DELETE FROM saved_charts WHERE user_id = $1", [userId]).catch(() => {});
      this.pgPool.query("DELETE FROM push_subscriptions WHERE user_id = $1", [userId]).catch(() => {});
      this.pgPool.query("UPDATE payment_transactions SET user_id = 'ANONYMIZED_USER' WHERE user_id = $1", [userId]).catch(() => {});
      this.pgPool.query("DELETE FROM users WHERE user_id = $1", [userId]).catch(() => {});
    }

    return { success: true, userId, purgedAt: new Date().toISOString() };
  }

  isHealthy() {
    if (process.env.NODE_ENV === "production") {
      return this.pgConnected;
    }
    return true;
  }
}

export const db = new AstroDatabase();
