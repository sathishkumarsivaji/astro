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
      user_sessions: {},
      credit_reservations: {},
      prediction_records: {},
      prediction_evidence: {},
      customer_feedback: {},
      observed_outcomes: {},
      outcome_verification: {},
      model_registry: {},
      training_runs: {},
      benchmark_runs: {},
      model_deployments: {},
      customer_ai_preferences: {},
      training_consent: {},
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
      if (!connectionString && !process.env.PGHOST && !process.env.PGDATABASE) {
        // No PostgreSQL database configured in environment - use resilient write-through store
        this.pgConnected = false;
        return;
      }
      const config = connectionString
        ? { connectionString, ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : false }
        : {
            user: process.env.PGUSER || "postgres",
            host: process.env.PGHOST || "localhost",
            database: process.env.PGDATABASE || "astroverse",
            password: typeof process.env.PGPASSWORD === "string" ? process.env.PGPASSWORD : "",
            port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
            connectionTimeoutMillis: 1000,
            idleTimeoutMillis: 10000
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
      if (this.pgPool) {
        try {
          await this.pgPool.end();
        } catch (_) {}
        this.pgPool = null;
      }
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

      CREATE TABLE IF NOT EXISTS user_sessions (
        session_token TEXT PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        token_hash VARCHAR(128) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL,
        revoked_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS credit_reservations (
        request_id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        credits_reserved INTEGER NOT NULL DEFAULT 1,
        status VARCHAR(32) NOT NULL DEFAULT 'reserved',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL,
        completed_at TIMESTAMPTZ
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_saved_charts_user ON saved_charts(user_id);
      CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders(user_id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_tx_payment_id ON payment_transactions(payment_id);
      CREATE INDEX IF NOT EXISTS idx_push_sub_user ON push_subscriptions(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);
      CREATE INDEX IF NOT EXISTS idx_credit_reservations_user ON credit_reservations(user_id);
      CREATE INDEX IF NOT EXISTS idx_credit_reservations_status ON credit_reservations(status);

      CREATE TABLE IF NOT EXISTS prediction_records (
        prediction_id VARCHAR(64) PRIMARY KEY,
        pseudonymous_customer_id VARCHAR(128) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        birth_data_hash VARCHAR(64) NOT NULL,
        calculation_config_json JSONB DEFAULT '{}'::jsonb,
        chart_features_json JSONB DEFAULT '{}'::jsonb,
        domain VARCHAR(64) NOT NULL,
        event_definition TEXT NOT NULL,
        predicted_outcome VARCHAR(128) NOT NULL,
        timing_interval_start TIMESTAMPTZ,
        timing_interval_end TIMESTAMPTZ,
        timing_resolution VARCHAR(32) NOT NULL,
        model_version VARCHAR(64) NOT NULL,
        rules_version VARCHAR(64) NOT NULL,
        raw_score NUMERIC(8, 4),
        calibrated_probability NUMERIC(8, 4),
        calibration_status VARCHAR(64) DEFAULT 'UNCALIBRATED',
        observation_deadline TIMESTAMPTZ,
        is_training_eligible BOOLEAN DEFAULT FALSE,
        metadata JSONB DEFAULT '{}'::jsonb
      );

      CREATE TABLE IF NOT EXISTS prediction_evidence (
        evidence_id VARCHAR(64) PRIMARY KEY,
        prediction_id VARCHAR(64) NOT NULL REFERENCES prediction_records(prediction_id) ON DELETE CASCADE,
        claim_type VARCHAR(64) NOT NULL,
        shastric_rule_id VARCHAR(128),
        astronomical_fact_keys JSONB DEFAULT '[]'::jsonb,
        evidence_status VARCHAR(32) NOT NULL DEFAULT 'SUPPORTED',
        weight NUMERIC(6, 4) DEFAULT 1.0,
        narrative_excerpt TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS customer_feedback (
        feedback_id VARCHAR(64) PRIMARY KEY,
        prediction_id VARCHAR(64) NOT NULL REFERENCES prediction_records(prediction_id) ON DELETE CASCADE,
        customer_id VARCHAR(128) NOT NULL,
        feedback_category VARCHAR(64) NOT NULL,
        relevance_score INTEGER,
        user_comments_redacted TEXT,
        submitted_at TIMESTAMPTZ DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'::jsonb
      );

      CREATE TABLE IF NOT EXISTS observed_outcomes (
        outcome_id VARCHAR(64) PRIMARY KEY,
        prediction_id VARCHAR(64) NOT NULL REFERENCES prediction_records(prediction_id) ON DELETE CASCADE,
        customer_id VARCHAR(128) NOT NULL,
        event_occurred BOOLEAN NOT NULL,
        reported_date DATE,
        date_precision VARCHAR(32) DEFAULT 'APPROX_YEAR',
        is_censored BOOLEAN DEFAULT FALSE,
        observation_ended_at DATE,
        reported_at TIMESTAMPTZ DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'::jsonb
      );

      CREATE TABLE IF NOT EXISTS outcome_verification (
        verification_id VARCHAR(64) PRIMARY KEY,
        outcome_id VARCHAR(64) NOT NULL REFERENCES observed_outcomes(outcome_id) ON DELETE CASCADE,
        verification_method VARCHAR(64) NOT NULL DEFAULT 'SELF_REPORTED_ONLY',
        verification_status VARCHAR(64) NOT NULL DEFAULT 'UNVERIFIED',
        verified_at TIMESTAMPTZ DEFAULT NOW(),
        verified_by VARCHAR(64),
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS model_registry (
        model_id VARCHAR(128) PRIMARY KEY,
        domain VARCHAR(64) NOT NULL,
        model_type VARCHAR(64) NOT NULL,
        model_artifact_path TEXT,
        artifact_sha256 VARCHAR(64) NOT NULL,
        training_dataset_hash VARCHAR(64),
        status VARCHAR(32) NOT NULL DEFAULT 'CANDIDATE',
        hyperparameters JSONB DEFAULT '{}'::jsonb,
        registered_at TIMESTAMPTZ DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'::jsonb
      );

      CREATE TABLE IF NOT EXISTS training_runs (
        run_id VARCHAR(64) PRIMARY KEY,
        model_id VARCHAR(128) NOT NULL REFERENCES model_registry(model_id) ON DELETE CASCADE,
        data_cut_timestamp TIMESTAMPTZ NOT NULL,
        eligible_records_count INTEGER NOT NULL,
        hyperparameters_json JSONB DEFAULT '{}'::jsonb,
        train_mae NUMERIC(8, 4),
        val_mae NUMERIC(8, 4),
        started_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        status VARCHAR(32) DEFAULT 'completed'
      );

      CREATE TABLE IF NOT EXISTS benchmark_runs (
        benchmark_id VARCHAR(64) PRIMARY KEY,
        model_id VARCHAR(128) NOT NULL REFERENCES model_registry(model_id) ON DELETE CASCADE,
        evaluated_cohort VARCHAR(64) NOT NULL,
        sample_size INTEGER NOT NULL,
        timing_mae NUMERIC(8, 4),
        median_ae NUMERIC(8, 4),
        within_1y_pct NUMERIC(6, 2),
        demographic_baseline_mae NUMERIC(8, 4),
        baseline_comparison_status VARCHAR(64) NOT NULL,
        concordance_index NUMERIC(6, 4),
        brier_score NUMERIC(6, 4),
        ece NUMERIC(6, 4),
        passed_release_gate BOOLEAN DEFAULT FALSE,
        evaluated_at TIMESTAMPTZ DEFAULT NOW(),
        evaluation_report_json JSONB DEFAULT '{}'::jsonb
      );

      CREATE TABLE IF NOT EXISTS model_deployments (
        deployment_id VARCHAR(64) PRIMARY KEY,
        model_id VARCHAR(128) NOT NULL REFERENCES model_registry(model_id) ON DELETE CASCADE,
        domain VARCHAR(64) NOT NULL,
        deployed_by VARCHAR(64) NOT NULL,
        deployed_at TIMESTAMPTZ DEFAULT NOW(),
        rollback_model_id VARCHAR(128),
        is_active BOOLEAN DEFAULT TRUE
      );

      CREATE TABLE IF NOT EXISTS customer_ai_preferences (
        customer_id VARCHAR(128) PRIMARY KEY,
        preferred_lang VARCHAR(8) DEFAULT 'en',
        explanation_depth VARCHAR(32) DEFAULT 'beginner',
        tone VARCHAR(32) DEFAULT 'evidence_focused',
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS training_consent (
        customer_id VARCHAR(128) PRIMARY KEY,
        consent_granted BOOLEAN DEFAULT FALSE,
        granted_at TIMESTAMPTZ,
        withdrawn_at TIMESTAMPTZ,
        consent_version VARCHAR(32) DEFAULT 'v1.0'
      );

      CREATE INDEX IF NOT EXISTS idx_prediction_records_customer ON prediction_records(pseudonymous_customer_id);
      CREATE INDEX IF NOT EXISTS idx_prediction_records_domain ON prediction_records(domain);
      CREATE INDEX IF NOT EXISTS idx_prediction_records_eligible ON prediction_records(is_training_eligible);
      CREATE INDEX IF NOT EXISTS idx_prediction_evidence_pred ON prediction_evidence(prediction_id);
      CREATE INDEX IF NOT EXISTS idx_customer_feedback_pred ON customer_feedback(prediction_id);
      CREATE INDEX IF NOT EXISTS idx_observed_outcomes_pred ON observed_outcomes(prediction_id);
      CREATE INDEX IF NOT EXISTS idx_model_registry_domain ON model_registry(domain);
      CREATE INDEX IF NOT EXISTS idx_model_registry_status ON model_registry(status);
      CREATE INDEX IF NOT EXISTS idx_model_deployments_active ON model_deployments(domain, is_active);
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
    const SEED_FILE = path.join(DATA_DIR, "astroverse_store.seed.json");
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
          user_sessions: parsed.user_sessions || {},
          credit_reservations: parsed.credit_reservations || {},
          prediction_records: parsed.prediction_records || {},
          prediction_evidence: parsed.prediction_evidence || {},
          customer_feedback: parsed.customer_feedback || {},
          observed_outcomes: parsed.observed_outcomes || {},
          outcome_verification: parsed.outcome_verification || {},
          model_registry: parsed.model_registry || {},
          training_runs: parsed.training_runs || {},
          benchmark_runs: parsed.benchmark_runs || {},
          model_deployments: parsed.model_deployments || {},
          customer_ai_preferences: parsed.customer_ai_preferences || {},
          training_consent: parsed.training_consent || {},
          audit_ledger: parsed.audit_ledger || []
        };
      } catch (err) {
        console.error("[DATABASE] Error loading db file, initializing clean state:", err.message);
      }
    } else if (fs.existsSync(SEED_FILE)) {
      try {
        const raw = fs.readFileSync(SEED_FILE, "utf8");
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
          user_sessions: parsed.user_sessions || {},
          credit_reservations: parsed.credit_reservations || {},
          prediction_records: parsed.prediction_records || {},
          prediction_evidence: parsed.prediction_evidence || {},
          customer_feedback: parsed.customer_feedback || {},
          observed_outcomes: parsed.observed_outcomes || {},
          outcome_verification: parsed.outcome_verification || {},
          model_registry: parsed.model_registry || {},
          training_runs: parsed.training_runs || {},
          benchmark_runs: parsed.benchmark_runs || {},
          model_deployments: parsed.model_deployments || {},
          customer_ai_preferences: parsed.customer_ai_preferences || {},
          training_consent: parsed.training_consent || {},
          audit_ledger: parsed.audit_ledger || []
        };
      } catch (err) {
        console.error("[DATABASE] Error loading seed file, initializing clean state:", err.message);
      }
      this.persist();
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

  // --- Durable Sessions Registry ---
  createSessionRecord(token, userId, expiresAtMs) {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const now = new Date().toISOString();
    const expiresAt = new Date(expiresAtMs).toISOString();
    const record = {
      sessionToken: token,
      userId,
      tokenHash,
      createdAt: now,
      expiresAt,
      revokedAt: null
    };
    this.state.user_sessions[token] = record;
    this.persist();

    if (this.pgConnected && this.pgPool) {
      this.pgPool.query(
        `INSERT INTO user_sessions (session_token, user_id, token_hash, created_at, expires_at, revoked_at)
         VALUES ($1, $2, $3, $4, $5, NULL)
         ON CONFLICT (session_token) DO UPDATE SET
          expires_at = EXCLUDED.expires_at,
          revoked_at = NULL`,
        [token, userId, tokenHash, now, expiresAt]
      ).catch(err => console.warn("[POSTGRESQL] Session insert warning:", err.message));
    }
    return record;
  }

  isSessionRevoked(token) {
    const session = this.state.user_sessions[token];
    if (session && session.revokedAt) {
      return true;
    }
    return false;
  }

  revokeSession(token) {
    const session = this.state.user_sessions[token];
    const now = new Date().toISOString();
    if (session) {
      session.revokedAt = now;
    } else {
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      this.state.user_sessions[token] = {
        sessionToken: token,
        tokenHash,
        revokedAt: now
      };
    }
    this.persist();

    if (this.pgConnected && this.pgPool) {
      this.pgPool.query(
        "UPDATE user_sessions SET revoked_at = NOW() WHERE session_token = $1",
        [token]
      ).catch(err => console.warn("[POSTGRESQL] Session revoke warning:", err.message));
    }
    return true;
  }

  revokeAllUserSessions(userId) {
    const now = new Date().toISOString();
    for (const s of Object.values(this.state.user_sessions)) {
      if (s.userId === userId) {
        s.revokedAt = now;
      }
    }
    this.persist();

    if (this.pgConnected && this.pgPool) {
      this.pgPool.query(
        "UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = $1",
        [userId]
      ).catch(err => console.warn("[POSTGRESQL] User sessions revoke warning:", err.message));
    }
    return true;
  }

  // --- Credit Reservation Ledger ---
  reserveCredits(requestId, userId, cost = 1, ttlSeconds = 300) {
    const user = this.getUser(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }
    const available = (user.availableCredits || 0) - (user.lockedCredits || 0);
    if (available < cost) {
      return { success: false, reason: "INSUFFICIENT_CREDITS", available, cost };
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000).toISOString();
    const reservation = {
      requestId,
      userId,
      creditsReserved: cost,
      status: "reserved",
      createdAt: now.toISOString(),
      expiresAt,
      completedAt: null
    };

    user.lockedCredits = (user.lockedCredits || 0) + cost;
    this.state.credit_reservations[requestId] = reservation;
    this.state.users[userId] = user;
    this.persist();

    if (this.pgConnected && this.pgPool) {
      this.pgPool.query(
        `INSERT INTO credit_reservations (request_id, user_id, credits_reserved, status, created_at, expires_at)
         VALUES ($1, $2, $3, 'reserved', $4, $5)
         ON CONFLICT (request_id) DO UPDATE SET status = 'reserved', expires_at = EXCLUDED.expires_at`,
        [requestId, userId, cost, reservation.createdAt, expiresAt]
      ).catch(err => console.warn("[POSTGRESQL] Credit reservation insert warning:", err.message));
    }

    return { success: true, reservation, user };
  }

  settleCreditReservation(requestId, userId) {
    const reservation = this.state.credit_reservations[requestId];
    const user = this.getUser(userId);
    if (!reservation || reservation.status !== "reserved") {
      return { success: false, reason: "RESERVATION_NOT_FOUND_OR_CLOSED" };
    }

    const cost = reservation.creditsReserved || 1;
    reservation.status = "settled";
    reservation.completedAt = new Date().toISOString();

    if (user) {
      user.lockedCredits = Math.max(0, (user.lockedCredits || 0) - cost);
      user.availableCredits = Math.max(0, (user.availableCredits || 0) - cost);
      this.state.users[userId] = user;
    }
    this.persist();

    if (this.pgConnected && this.pgPool) {
      this.pgPool.query(
        "UPDATE credit_reservations SET status = 'settled', completed_at = NOW() WHERE request_id = $1",
        [requestId]
      ).catch(err => console.warn("[POSTGRESQL] Credit reservation settle warning:", err.message));
    }

    return { success: true, reservation, user };
  }

  releaseCreditReservation(requestId, userId, errorReason = null) {
    const reservation = this.state.credit_reservations[requestId];
    const user = this.getUser(userId);
    if (!reservation || reservation.status !== "reserved") {
      return { success: false, reason: "RESERVATION_NOT_FOUND_OR_CLOSED" };
    }

    const cost = reservation.creditsReserved || 1;
    reservation.status = "released";
    reservation.completedAt = new Date().toISOString();
    reservation.errorReason = errorReason;

    if (user) {
      user.lockedCredits = Math.max(0, (user.lockedCredits || 0) - cost);
      this.state.users[userId] = user;
    }
    this.persist();

    if (this.pgConnected && this.pgPool) {
      this.pgPool.query(
        "UPDATE credit_reservations SET status = 'released', completed_at = NOW() WHERE request_id = $1",
        [requestId]
      ).catch(err => console.warn("[POSTGRESQL] Credit reservation release warning:", err.message));
    }

    return { success: true, reservation, user };
  }

  // --- Authoritative Transactional Payment Execution ---
  async executePaymentTransaction({ orderId, paymentId, userId, amountINR, currency, creditsAdded, planId, billingPeriod }) {
    // 1. If PostgreSQL is connected, execute within an ACID transaction
    if (this.pgConnected && this.pgPool) {
      const client = await this.pgPool.connect();
      try {
        await client.query("BEGIN");

        // Lock order row
        const orderRes = await client.query("SELECT * FROM payment_orders WHERE order_id = $1 FOR UPDATE", [orderId]);
        if (orderRes.rows.length === 0) {
          throw new Error(`Order ${orderId} not found in database for transaction commit.`);
        }

        // Insert unique payment transaction
        const txId = `tx_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
        const txInsertRes = await client.query(
          `INSERT INTO payment_transactions (
            tx_id, order_id, payment_id, user_id, type, amount_inr, currency,
            credits_added, plan_id, status, timestamp, details
          ) VALUES ($1, $2, $3, $4, 'report_access_payment', $5, $6, $7, $8, 'completed', NOW(), $9)
          ON CONFLICT (payment_id) DO NOTHING
          RETURNING tx_id`,
          [txId, orderId, paymentId, userId, amountINR, currency || 'INR', creditsAdded, planId, JSON.stringify({ billingPeriod })]
        );

        if (txInsertRes.rows.length === 0) {
          // Conflict: Already processed
          await client.query("ROLLBACK");
          return { alreadyProcessed: true, orderId, paymentId };
        }

        // Lock & update user
        await client.query(
          `UPDATE users SET
            subscription_tier = $1,
            is_registered = TRUE,
            available_credits = available_credits + $2,
            monthly_credits = monthly_credits + $2,
            pdf_export = TRUE,
            updated_at = NOW()
          WHERE user_id = $3`,
          [planId, creditsAdded, userId]
        );

        // Mark order paid
        await client.query(
          "UPDATE payment_orders SET status = 'paid', payment_id = $1, updated_at = NOW() WHERE order_id = $2",
          [paymentId, orderId]
        );

        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        client.release();
        throw err;
      }
      client.release();
    }

    // Update in-memory state & disk backup
    const txId = `tx_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const txRecord = {
      txId,
      orderId,
      paymentId,
      userId,
      type: "report_access_payment",
      amountINR,
      currency: currency || "INR",
      creditsAdded,
      planId,
      billingPeriod,
      status: "completed",
      timestamp: new Date().toISOString()
    };
    this.state.payment_transactions[txId] = txRecord;
    this.state.processed_payment_ids[paymentId] = txId;

    const order = this.state.payment_orders[orderId];
    if (order) {
      order.status = "paid";
      order.paymentId = paymentId;
      order.completedAt = txRecord.timestamp;
    }

    const user = this.state.users[userId];
    if (user) {
      user.subscriptionTier = planId;
      user.isRegistered = true;
      user.availableCredits = (user.availableCredits || 0) + creditsAdded;
      user.monthlyCredits = (user.monthlyCredits || 0) + creditsAdded;
      user.pdfExport = true;
      user.transactionHistory = user.transactionHistory || [];
      user.transactionHistory.push(txRecord);
    }

    this.persist();
    return { success: true, txRecord, order, user };
  }

  // =========================================================================
  // Layer 5 & 6: Prediction Intelligence, Evidence & Continuous Learning Store
  // =========================================================================

  savePredictionRecord(record) {
    if (!record || typeof record !== "object") {
      throw new Error("INVALID_RECORD: Prediction record must be a valid object.");
    }
    const { predictionId } = record;
    if (!predictionId) {
      throw new Error("MISSING_PREDICTION_ID: Prediction record must contain a unique predictionId.");
    }

    // IMMUTABILITY ENFORCEMENT: Existing prediction records cannot be overwritten.
    if (this.state.prediction_records && this.state.prediction_records[predictionId]) {
      const err = new Error(`IMMUTABLE_PREDICTION_RECORD_EXISTS: Prediction record '${predictionId}' already exists and is immutable.`);
      err.code = "IMMUTABLE_PREDICTION_RECORD_EXISTS";
      throw err;
    }

    const VALID_RESOLUTIONS = [
      "DATE_RANGE", "MONTH_RANGE", "SEASON", "YEAR", "AGE_RANGE", "NOT_DISCRIMINATING", "INSUFFICIENT_DATA"
    ];
    if (record.timingResolution && !VALID_RESOLUTIONS.includes(record.timingResolution)) {
      const err = new Error(`INVALID_TIMING_RESOLUTION: '${record.timingResolution}' is not a permitted resolution.`);
      err.code = "INVALID_TIMING_RESOLUTION";
      throw err;
    }

    const canonicalRecord = {
      predictionId,
      pseudonymousCustomerId: record.pseudonymousCustomerId,
      createdAt: record.createdAt || new Date().toISOString(),
      birthDataHash: record.birthDataHash,
      calculationConfigJson: record.calculationConfigJson || {},
      chartFeaturesJson: record.chartFeaturesJson || {},
      domain: (record.domain || "UNKNOWN").toUpperCase(),
      eventDefinition: record.eventDefinition || "",
      predictedOutcome: record.predictedOutcome || "",
      timingIntervalStart: record.timingIntervalStart || null,
      timingIntervalEnd: record.timingIntervalEnd || null,
      timingResolution: record.timingResolution || "NOT_DISCRIMINATING",
      modelVersion: record.modelVersion || "unversioned",
      rulesVersion: record.rulesVersion || "unversioned",
      rawScore: record.rawScore !== undefined ? record.rawScore : null,
      calibratedProbability: record.calibratedProbability !== undefined ? record.calibratedProbability : null,
      calibrationStatus: record.calibrationStatus || "UNCALIBRATED",
      observationDeadline: record.observationDeadline || null,
      isTrainingEligible: Boolean(record.isTrainingEligible),
      metadata: record.metadata || {}
    };

    this.state.prediction_records[predictionId] = canonicalRecord;
    this.persist();

    if (this.pgConnected && this.pgPool) {
      this.pgPool.query(
        `INSERT INTO prediction_records (
          prediction_id, pseudonymous_customer_id, created_at, birth_data_hash,
          calculation_config_json, chart_features_json, domain, event_definition,
          predicted_outcome, timing_interval_start, timing_interval_end, timing_resolution,
          model_version, rules_version, raw_score, calibrated_probability, calibration_status,
          observation_deadline, is_training_eligible, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        ON CONFLICT (prediction_id) DO NOTHING`,
        [
          canonicalRecord.predictionId,
          canonicalRecord.pseudonymousCustomerId,
          canonicalRecord.createdAt,
          canonicalRecord.birthDataHash,
          canonicalRecord.calculationConfigJson,
          canonicalRecord.chartFeaturesJson,
          canonicalRecord.domain,
          canonicalRecord.eventDefinition,
          canonicalRecord.predictedOutcome,
          canonicalRecord.timingIntervalStart,
          canonicalRecord.timingIntervalEnd,
          canonicalRecord.timingResolution,
          canonicalRecord.modelVersion,
          canonicalRecord.rulesVersion,
          canonicalRecord.rawScore,
          canonicalRecord.calibratedProbability,
          canonicalRecord.calibrationStatus,
          canonicalRecord.observationDeadline,
          canonicalRecord.isTrainingEligible,
          canonicalRecord.metadata
        ]
      ).catch(err => console.warn("[POSTGRESQL] savePredictionRecord notice:", err.message));
    }

    return canonicalRecord;
  }

  getPredictionRecord(predictionId) {
    return this.state.prediction_records[predictionId] || null;
  }

  listPredictionRecords(filter = {}) {
    let records = Object.values(this.state.prediction_records || {});
    if (filter.domain) {
      const d = filter.domain.toUpperCase();
      records = records.filter(r => r.domain === d);
    }
    if (filter.pseudonymousCustomerId) {
      records = records.filter(r => r.pseudonymousCustomerId === filter.pseudonymousCustomerId);
    }
    if (filter.trainingEligibleOnly) {
      records = records.filter(r => r.isTrainingEligible === true);
    }
    records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const offset = filter.offset || 0;
    const limit = filter.limit || 100;
    return records.slice(offset, offset + limit);
  }

  savePredictionEvidence(evidenceList) {
    if (!Array.isArray(evidenceList)) return [];
    const VALID_EVIDENCE_STATUSES = [
      "SUPPORTED", "PARTIALLY_SUPPORTED", "MIXED_EVIDENCE", "TRADITIONAL_ONLY", "INSUFFICIENT_DATA", "NOT_DISCRIMINATING", "UNASSESSED"
    ];
    const saved = [];
    for (const item of evidenceList) {
      if (!item.evidenceId || !item.predictionId) continue;
      const status = VALID_EVIDENCE_STATUSES.includes(item.evidenceStatus) ? item.evidenceStatus : "SUPPORTED";
      const record = {
        evidenceId: item.evidenceId,
        predictionId: item.predictionId,
        claimType: item.claimType || "FACT",
        shastricRuleId: item.shastricRuleId || null,
        astronomicalFactKeys: Array.isArray(item.astronomicalFactKeys) ? item.astronomicalFactKeys : [],
        evidenceStatus: status,
        weight: item.weight !== undefined ? Number(item.weight) : 1.0,
        narrativeExcerpt: item.narrativeExcerpt || "",
        createdAt: item.createdAt || new Date().toISOString()
      };
      this.state.prediction_evidence[item.evidenceId] = record;
      saved.push(record);

      if (this.pgConnected && this.pgPool) {
        this.pgPool.query(
          `INSERT INTO prediction_evidence (
            evidence_id, prediction_id, claim_type, shastric_rule_id,
            astronomical_fact_keys, evidence_status, weight, narrative_excerpt, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (evidence_id) DO UPDATE SET
            evidence_status = EXCLUDED.evidence_status,
            weight = EXCLUDED.weight`,
          [
            record.evidenceId,
            record.predictionId,
            record.claimType,
            record.shastricRuleId,
            JSON.stringify(record.astronomicalFactKeys),
            record.evidenceStatus,
            record.weight,
            record.narrativeExcerpt,
            record.createdAt
          ]
        ).catch(err => console.warn("[POSTGRESQL] savePredictionEvidence notice:", err.message));
      }
    }
    this.persist();
    return saved;
  }

  getPredictionEvidence(predictionId) {
    return Object.values(this.state.prediction_evidence || {})
      .filter(e => e.predictionId === predictionId);
  }

  saveCustomerFeedback(feedback) {
    if (!feedback || !feedback.feedbackId || !feedback.predictionId) {
      throw new Error("INVALID_FEEDBACK: feedbackId and predictionId are required.");
    }
    const VALID_CATEGORIES = [
      "BIRTH_CONFIRMED", "BIRTH_DISPUTED", "RELEVANCE_RATING", "INTERPRETATION_RELEVANCE", "PRESENT_CIRCUMSTANCE", "HISTORICAL_EVENT", "FUTURE_OUTCOME", "CORRECTION"
    ];
    if (feedback.feedbackCategory && !VALID_CATEGORIES.includes(feedback.feedbackCategory)) {
      throw new Error(`INVALID_FEEDBACK_CATEGORY: '${feedback.feedbackCategory}' is not permitted.`);
    }
    const record = {
      feedbackId: feedback.feedbackId,
      predictionId: feedback.predictionId,
      customerId: feedback.customerId || "ANONYMOUS",
      feedbackCategory: feedback.feedbackCategory || "RELEVANCE_RATING",
      relevanceScore: feedback.relevanceScore !== undefined ? Number(feedback.relevanceScore) : null,
      userCommentsRedacted: feedback.userCommentsRedacted || "",
      submittedAt: feedback.submittedAt || new Date().toISOString(),
      metadata: feedback.metadata || {}
    };
    this.state.customer_feedback[record.feedbackId] = record;
    this.persist();

    if (this.pgConnected && this.pgPool) {
      this.pgPool.query(
        `INSERT INTO customer_feedback (
          feedback_id, prediction_id, customer_id, feedback_category,
          relevance_score, user_comments_redacted, submitted_at, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (feedback_id) DO NOTHING`,
        [
          record.feedbackId,
          record.predictionId,
          record.customerId,
          record.feedbackCategory,
          record.relevanceScore,
          record.userCommentsRedacted,
          record.submittedAt,
          record.metadata
        ]
      ).catch(err => console.warn("[POSTGRESQL] saveCustomerFeedback notice:", err.message));
    }
    return record;
  }

  getCustomerFeedback(predictionId) {
    return Object.values(this.state.customer_feedback || {})
      .filter(f => f.predictionId === predictionId);
  }

  saveObservedOutcome(outcome) {
    if (!outcome || !outcome.outcomeId || !outcome.predictionId) {
      throw new Error("INVALID_OUTCOME: outcomeId and predictionId are required.");
    }
    const record = {
      outcomeId: outcome.outcomeId,
      predictionId: outcome.predictionId,
      customerId: outcome.customerId || "ANONYMOUS",
      eventOccurred: Boolean(outcome.eventOccurred),
      reportedDate: outcome.reportedDate || null,
      datePrecision: outcome.datePrecision || "APPROX_YEAR",
      isCensored: Boolean(outcome.isCensored),
      observationEndedAt: outcome.observationEndedAt || null,
      reportedAt: outcome.reportedAt || new Date().toISOString(),
      metadata: outcome.metadata || {}
    };
    this.state.observed_outcomes[record.outcomeId] = record;
    this.persist();

    if (this.pgConnected && this.pgPool) {
      this.pgPool.query(
        `INSERT INTO observed_outcomes (
          outcome_id, prediction_id, customer_id, event_occurred, reported_date,
          date_precision, is_censored, observation_ended_at, reported_at, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (outcome_id) DO NOTHING`,
        [
          record.outcomeId,
          record.predictionId,
          record.customerId,
          record.eventOccurred,
          record.reportedDate,
          record.datePrecision,
          record.isCensored,
          record.observationEndedAt,
          record.reportedAt,
          record.metadata
        ]
      ).catch(err => console.warn("[POSTGRESQL] saveObservedOutcome notice:", err.message));
    }
    return record;
  }

  getObservedOutcome(predictionId) {
    return Object.values(this.state.observed_outcomes || {})
      .find(o => o.predictionId === predictionId) || null;
  }

  saveOutcomeVerification(verification) {
    if (!verification || !verification.verificationId || !verification.outcomeId) {
      throw new Error("INVALID_VERIFICATION: verificationId and outcomeId are required.");
    }
    const VALID_STATUSES = ["UNVERIFIED", "CORROBORATED", "INDEPENDENTLY_VERIFIED", "REJECTED_CONTRADICTORY"];
    const status = VALID_STATUSES.includes(verification.verificationStatus) ? verification.verificationStatus : "UNVERIFIED";
    const record = {
      verificationId: verification.verificationId,
      outcomeId: verification.outcomeId,
      verificationMethod: verification.verificationMethod || "SELF_REPORTED_ONLY",
      verificationStatus: status,
      verifiedAt: verification.verifiedAt || new Date().toISOString(),
      verifiedBy: verification.verifiedBy || null,
      notes: verification.notes || ""
    };
    this.state.outcome_verification[record.verificationId] = record;
    this.persist();

    if (this.pgConnected && this.pgPool) {
      this.pgPool.query(
        `INSERT INTO outcome_verification (
          verification_id, outcome_id, verification_method, verification_status,
          verified_at, verified_by, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (verification_id) DO UPDATE SET
          verification_status = EXCLUDED.verification_status,
          verified_at = EXCLUDED.verified_at,
          notes = EXCLUDED.notes`,
        [
          record.verificationId,
          record.outcomeId,
          record.verificationMethod,
          record.verificationStatus,
          record.verifiedAt,
          record.verifiedBy,
          record.notes
        ]
      ).catch(err => console.warn("[POSTGRESQL] saveOutcomeVerification notice:", err.message));
    }
    return record;
  }

  getOutcomeVerification(outcomeId) {
    return Object.values(this.state.outcome_verification || {})
      .find(v => v.outcomeId === outcomeId) || null;
  }

  registerModel(modelEntry) {
    if (!modelEntry || !modelEntry.modelId || !modelEntry.artifactSha256) {
      throw new Error("INVALID_MODEL: modelId and artifactSha256 are required.");
    }
    const record = {
      modelId: modelEntry.modelId,
      domain: (modelEntry.domain || "GENERAL").toUpperCase(),
      modelType: modelEntry.modelType || "STATISTICAL",
      modelArtifactPath: modelEntry.modelArtifactPath || "",
      artifactSha256: modelEntry.artifactSha256,
      trainingDatasetHash: modelEntry.trainingDatasetHash || null,
      status: modelEntry.status || "CANDIDATE",
      hyperparameters: modelEntry.hyperparameters || {},
      registeredAt: modelEntry.registeredAt || new Date().toISOString(),
      metadata: modelEntry.metadata || {}
    };
    this.state.model_registry[record.modelId] = record;
    this.persist();

    if (this.pgConnected && this.pgPool) {
      this.pgPool.query(
        `INSERT INTO model_registry (
          model_id, domain, model_type, model_artifact_path, artifact_sha256,
          training_dataset_hash, status, hyperparameters, registered_at, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (model_id) DO UPDATE SET
          status = EXCLUDED.status,
          metadata = EXCLUDED.metadata`,
        [
          record.modelId,
          record.domain,
          record.modelType,
          record.modelArtifactPath,
          record.artifactSha256,
          record.trainingDatasetHash,
          record.status,
          record.hyperparameters,
          record.registeredAt,
          record.metadata
        ]
      ).catch(err => console.warn("[POSTGRESQL] registerModel notice:", err.message));
    }
    return record;
  }

  getModel(modelId) {
    return this.state.model_registry[modelId] || null;
  }

  listModels(filter = {}) {
    let models = Object.values(this.state.model_registry || {});
    if (filter.domain) {
      const d = filter.domain.toUpperCase();
      models = models.filter(m => m.domain === d);
    }
    if (filter.status) {
      models = models.filter(m => m.status === filter.status);
    }
    return models;
  }

  recordBenchmarkRun(benchmark) {
    if (!benchmark || !benchmark.benchmarkId || !benchmark.modelId) {
      throw new Error("INVALID_BENCHMARK: benchmarkId and modelId are required.");
    }
    const record = {
      benchmarkId: benchmark.benchmarkId,
      modelId: benchmark.modelId,
      evaluatedCohort: benchmark.evaluatedCohort || "BLIND_TEST_FROZEN",
      sampleSize: Number(benchmark.sampleSize) || 0,
      timingMae: benchmark.timingMae !== undefined ? Number(benchmark.timingMae) : null,
      medianAe: benchmark.medianAe !== undefined ? Number(benchmark.medianAe) : null,
      within1yPct: benchmark.within1yPct !== undefined ? Number(benchmark.within1yPct) : null,
      demographicBaselineMae: benchmark.demographicBaselineMae !== undefined ? Number(benchmark.demographicBaselineMae) : null,
      baselineComparisonStatus: benchmark.baselineComparisonStatus || "STATISTICALLY_TIED",
      concordanceIndex: benchmark.concordanceIndex !== undefined ? Number(benchmark.concordanceIndex) : null,
      brierScore: benchmark.brierScore !== undefined ? Number(benchmark.brierScore) : null,
      ece: benchmark.ece !== undefined ? Number(benchmark.ece) : null,
      passedReleaseGate: Boolean(benchmark.passedReleaseGate),
      evaluatedAt: benchmark.evaluatedAt || new Date().toISOString(),
      evaluationReportJson: benchmark.evaluationReportJson || {}
    };
    this.state.benchmark_runs[record.benchmarkId] = record;
    this.persist();

    if (this.pgConnected && this.pgPool) {
      this.pgPool.query(
        `INSERT INTO benchmark_runs (
          benchmark_id, model_id, evaluated_cohort, sample_size, timing_mae,
          median_ae, within_1y_pct, demographic_baseline_mae, baseline_comparison_status,
          concordance_index, brier_score, ece, passed_release_gate, evaluated_at, evaluation_report_json
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (benchmark_id) DO NOTHING`,
        [
          record.benchmarkId,
          record.modelId,
          record.evaluatedCohort,
          record.sampleSize,
          record.timingMae,
          record.medianAe,
          record.within1yPct,
          record.demographicBaselineMae,
          record.baselineComparisonStatus,
          record.concordanceIndex,
          record.brierScore,
          record.ece,
          record.passedReleaseGate,
          record.evaluatedAt,
          record.evaluationReportJson
        ]
      ).catch(err => console.warn("[POSTGRESQL] recordBenchmarkRun notice:", err.message));
    }
    return record;
  }

  deployModel(modelId, deployedBy = "admin", rollbackModelId = null) {
    const model = this.getModel(modelId);
    if (!model) throw new Error(`MODEL_NOT_FOUND: Model '${modelId}' is not registered.`);
    const deploymentId = `dep_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    for (const d of Object.values(this.state.model_deployments || {})) {
      if (d.domain === model.domain && d.isActive) {
        d.isActive = false;
      }
    }
    const deployment = {
      deploymentId,
      modelId,
      domain: model.domain,
      deployedBy,
      deployedAt: new Date().toISOString(),
      rollbackModelId,
      isActive: true
    };
    this.state.model_deployments[deploymentId] = deployment;
    model.status = "PRODUCTION";
    this.persist();

    if (this.pgConnected && this.pgPool) {
      this.pgPool.query(
        `UPDATE model_deployments SET is_active = FALSE WHERE domain = $1;
         INSERT INTO model_deployments (
          deployment_id, model_id, domain, deployed_by, deployed_at, rollback_model_id, is_active
         ) VALUES ($2, $3, $4, $5, $6, $7, TRUE);
         UPDATE model_registry SET status = 'PRODUCTION' WHERE model_id = $3;`,
        [model.domain, deploymentId, modelId, model.domain, deployedBy, deployment.deployedAt, rollbackModelId]
      ).catch(err => console.warn("[POSTGRESQL] deployModel notice:", err.message));
    }
    return deployment;
  }

  getActiveModel(domain) {
    const d = (domain || "").toUpperCase();
    const activeDep = Object.values(this.state.model_deployments || {})
      .find(dep => dep.domain === d && dep.isActive);
    if (!activeDep) return null;
    return this.getModel(activeDep.modelId);
  }

  rollbackModel(domain, rolledBackBy = "admin") {
    const d = (domain || "").toUpperCase();
    const activeDep = Object.values(this.state.model_deployments || {})
      .find(dep => dep.domain === d && dep.isActive);
    if (!activeDep) {
      throw new Error(`NO_ACTIVE_DEPLOYMENT: No active deployment found for domain '${d}'.`);
    }

    const previousDeployment = Object.values(this.state.model_deployments || {})
      .filter(dep => dep.domain === d && !dep.isActive && dep.deploymentId !== activeDep.deploymentId)
      .sort((a, b) => new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime())[0];

    if (!previousDeployment) {
      throw new Error(`NO_ROLLBACK_TARGET: No previous deployment found for domain '${d}' to rollback to.`);
    }

    activeDep.isActive = false;
    return this.deployModel(previousDeployment.modelId, rolledBackBy, activeDep.modelId);
  }

  saveCustomerAIPreferences(customerId, prefs = {}) {
    if (!customerId) throw new Error("MISSING_CUSTOMER_ID: customerId is required.");
    const record = {
      customerId,
      preferredLang: ["ta", "en"].includes(prefs.preferredLang) ? prefs.preferredLang : "en",
      explanationDepth: ["beginner", "astrologer_expert"].includes(prefs.explanationDepth) ? prefs.explanationDepth : "beginner",
      tone: ["traditional", "evidence_focused"].includes(prefs.tone) ? prefs.tone : "evidence_focused",
      updatedAt: new Date().toISOString()
    };
    this.state.customer_ai_preferences[customerId] = record;
    this.persist();

    if (this.pgConnected && this.pgPool) {
      this.pgPool.query(
        `INSERT INTO customer_ai_preferences (customer_id, preferred_lang, explanation_depth, tone, updated_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (customer_id) DO UPDATE SET
          preferred_lang = EXCLUDED.preferred_lang,
          explanation_depth = EXCLUDED.explanation_depth,
          tone = EXCLUDED.tone,
          updated_at = EXCLUDED.updated_at`,
        [record.customerId, record.preferredLang, record.explanationDepth, record.tone, record.updatedAt]
      ).catch(err => console.warn("[POSTGRESQL] saveCustomerAIPreferences notice:", err.message));
    }
    return record;
  }

  getCustomerAIPreferences(customerId) {
    return this.state.customer_ai_preferences[customerId] || {
      customerId,
      preferredLang: "en",
      explanationDepth: "beginner",
      tone: "evidence_focused",
      updatedAt: null
    };
  }

  setTrainingConsent(customerId, consentGranted, consentVersion = "v1.0") {
    if (!customerId) throw new Error("MISSING_CUSTOMER_ID: customerId is required.");
    const now = new Date().toISOString();
    const existing = this.state.training_consent[customerId];
    const record = {
      customerId,
      consentGranted: Boolean(consentGranted),
      grantedAt: consentGranted ? (existing?.grantedAt || now) : existing?.grantedAt || null,
      withdrawnAt: !consentGranted ? now : null,
      consentVersion: consentVersion || "v1.0"
    };
    this.state.training_consent[customerId] = record;
    this.persist();

    if (this.pgConnected && this.pgPool) {
      this.pgPool.query(
        `INSERT INTO training_consent (customer_id, consent_granted, granted_at, withdrawn_at, consent_version)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (customer_id) DO UPDATE SET
          consent_granted = EXCLUDED.consent_granted,
          granted_at = EXCLUDED.granted_at,
          withdrawn_at = EXCLUDED.withdrawn_at,
          consent_version = EXCLUDED.consent_version`,
        [record.customerId, record.consentGranted, record.grantedAt, record.withdrawnAt, record.consentVersion]
      ).catch(err => console.warn("[POSTGRESQL] setTrainingConsent notice:", err.message));
    }
    return record;
  }

  getTrainingConsent(customerId) {
    return this.state.training_consent[customerId] || {
      customerId,
      consentGranted: false,
      grantedAt: null,
      withdrawnAt: null,
      consentVersion: "v1.0"
    };
  }

  getPseudonymousCustomerId(userId, customSalt = "") {
    if (!userId) return "anon_guest";
    const secret = process.env.SESSION_SECRET || "skr_astro_provenance_secret";
    const hmac = crypto.createHmac("sha256", secret + customSalt);
    hmac.update(String(userId));
    return `anon_${hmac.digest("hex").slice(0, 32)}`;
  }

  // --- Privacy Erasure with Awaited DB Purge ---
  async purgeUser(userId) {
    // 1. Revoke all user sessions
    this.revokeAllUserSessions(userId);

    // 2. Delete user record & secret from state
    delete this.state.users[userId];
    delete this.state.user_secrets[userId];

    // 3. Delete charts
    for (const [id, c] of Object.entries(this.state.saved_charts)) {
      if (c.userId === userId) {
        delete this.state.saved_charts[id];
      }
    }

    // 4. Delete push subscriptions
    for (const [ep, s] of Object.entries(this.state.push_subscriptions)) {
      if (s.userId === userId) {
        delete this.state.push_subscriptions[ep];
      }
    }

    // 5. Delete credit reservations
    for (const [reqId, r] of Object.entries(this.state.credit_reservations)) {
      if (r.userId === userId) {
        delete this.state.credit_reservations[reqId];
      }
    }

    // 6. Anonymize transactions
    for (const tx of Object.values(this.state.payment_transactions)) {
      if (tx.userId === userId) {
        tx.userId = "ANONYMIZED_USER";
        tx.anonymizedAt = new Date().toISOString();
      }
    }

    // 7. Privacy & Continuous Learning Purge
    delete this.state.customer_ai_preferences[userId];
    if (this.state.training_consent[userId]) {
      this.state.training_consent[userId].consentGranted = false;
      this.state.training_consent[userId].withdrawnAt = new Date().toISOString();
    }
    const pseudoId = this.getPseudonymousCustomerId(userId);
    for (const pred of Object.values(this.state.prediction_records || {})) {
      if (pred.pseudonymousCustomerId === userId || pred.pseudonymousCustomerId === pseudoId || pred.metadata?.rawUserId === userId) {
        pred.pseudonymousCustomerId = "ANONYMIZED_CUSTOMER";
        pred.isTrainingEligible = false;
        if (pred.metadata && pred.metadata.rawUserId) {
          delete pred.metadata.rawUserId;
        }
      }
    }
    for (const fb of Object.values(this.state.customer_feedback || {})) {
      if (fb.customerId === userId || fb.customerId === pseudoId) {
        fb.customerId = "ANONYMIZED_CUSTOMER";
        fb.userCommentsRedacted = "[PURGED_UPON_USER_ERASURE_REQUEST]";
      }
    }
    for (const oc of Object.values(this.state.observed_outcomes || {})) {
      if (oc.customerId === userId || oc.customerId === pseudoId) {
        oc.customerId = "ANONYMIZED_CUSTOMER";
      }
    }

    this.state.audit_ledger.push({
      eventId: `aud_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      type: "USER_DATA_PURGED",
      userId,
      timestamp: new Date().toISOString()
    });

    this.persist();

    // 8. Awaited PostgreSQL Deletion Transaction
    if (this.pgConnected && this.pgPool) {
      const client = await this.pgPool.connect();
      try {
        await client.query("BEGIN");
        await client.query("DELETE FROM user_secrets WHERE user_id = $1", [userId]);
        await client.query("DELETE FROM saved_charts WHERE user_id = $1", [userId]);
        await client.query("DELETE FROM push_subscriptions WHERE user_id = $1", [userId]);
        await client.query("DELETE FROM credit_reservations WHERE user_id = $1", [userId]);
        await client.query("DELETE FROM customer_ai_preferences WHERE customer_id = $1", [userId]);
        await client.query("UPDATE training_consent SET consent_granted = FALSE, withdrawn_at = NOW() WHERE customer_id = $1", [userId]);
        await client.query("UPDATE prediction_records SET pseudonymous_customer_id = 'ANONYMIZED_CUSTOMER', is_training_eligible = FALSE WHERE pseudonymous_customer_id = $1 OR pseudonymous_customer_id = $2", [userId, pseudoId]);
        await client.query("UPDATE customer_feedback SET customer_id = 'ANONYMIZED_CUSTOMER', user_comments_redacted = '[PURGED_UPON_USER_ERASURE_REQUEST]' WHERE customer_id = $1 OR customer_id = $2", [userId, pseudoId]);
        await client.query("UPDATE observed_outcomes SET customer_id = 'ANONYMIZED_CUSTOMER' WHERE customer_id = $1 OR customer_id = $2", [userId, pseudoId]);
        await client.query("UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = $1", [userId]);
        await client.query("UPDATE payment_transactions SET user_id = 'ANONYMIZED_USER' WHERE user_id = $1", [userId]);
        await client.query("DELETE FROM users WHERE user_id = $1", [userId]);
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        client.release();
        console.error("[POSTGRESQL] Purge transaction failed:", err.message);
        throw err;
      }
      client.release();
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
