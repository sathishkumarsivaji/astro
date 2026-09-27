/**
 * ASTROVERSE — Privacy, Consent, Data Export & Right-to-be-Forgotten Service
 *
 * Implements:
 * 1. Complete User Data Export (`GET /api/user/export`)
 * 2. Permanent and Irreversible Account & Profile Deletion (`DELETE /api/user/delete`)
 * 3. GDPR Article 20 & DPDP Act 2023 oriented data governance
 */

import { db } from "../db/database.js";

export function saveUserChart(userId, chartProfile) {
  return db.saveChart(userId, chartProfile);
}

export function getUserSavedCharts(userId) {
  return db.getUserCharts(userId);
}

/**
 * Exports complete personal data dossier for the authenticated user
 */
export function exportUserData(userId, entitlements) {
  const charts = db.getUserCharts(userId);
  const user = db.getUser(userId);

  return {
    exportMetadata: {
      userId,
      exportedAt: new Date().toISOString(),
      format: "AstroVerse_Data_Dossier_v2.0",
      complianceStandards: ["GDPR Article 20", "Digital Personal Data Protection Act 2023 (Oriented)"]
    },
    profileEntitlements: entitlements || user || {},
    savedHoroscopes: charts,
    auditTrail: (entitlements?.transactionHistory || user?.transactionHistory || []),
    disclaimer: "This archive contains all personal birth parameters and transaction records associated with your AstroVerse account."
  };
}

/**
 * Permanently and irreversibly purges user records from durable database and active sessions
 */
export function eraseUserData(userId, activeSessions) {
  // 1. Purge from persistent database
  db.purgeUser(userId);

  // 2. Purge Active Sessions in memory
  if (activeSessions) {
    for (const [token, session] of activeSessions.entries()) {
      if (session.userId === userId) {
        activeSessions.delete(token);
      }
    }
  }

  return {
    success: true,
    userId,
    status: "purged",
    purgedAt: new Date().toISOString(),
    message: "Personal profile data, saved horoscope charts, and session tokens have been permanently deleted. Certain financial and audit records are retained in anonymized form where required for accounting, fraud prevention, or legal compliance."
  };
}
