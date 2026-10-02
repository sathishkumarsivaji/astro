/**
 * ASTROVERSE — Evidence Truth Status Registry
 *
 * Every evidence item must carry a specific truth status.
 * The generic "VERIFIED" is prohibited — use one of these specific statuses.
 *
 * NON-NEGOTIABLE: ASTRONOMICAL CALCULATION ≠ TRADITIONAL RULE ≠ EMPIRICAL VALIDATION
 */

export const TRUTH_STATUS = Object.freeze({
  /** Value originates from the calculation layer (ephemeris, chart computation) */
  CALCULATED: 'CALCULATED',
  
  /** Value has been tested against internal test suite */
  INTERNAL_TESTED: 'INTERNAL_TESTED',
  
  /** Value has been numerically validated against an external reference (SWE, JPL Horizons, etc.) */
  EXTERNAL_NUMERICALLY_VALIDATED: 'EXTERNAL_NUMERICALLY_VALIDATED',
  
  /** Interpretive rule from a traditional astrological system */
  TRADITIONAL_RULE: 'TRADITIONAL_RULE',
  
  /** Claim has a specific textual source citation */
  SOURCE_CITED: 'SOURCE_CITED',
  
  /** User has explicitly confirmed this data point */
  USER_CONFIRMED: 'USER_CONFIRMED',
  
  /** Data is synthetic, used for testing only, NOT from real observations */
  SYNTHETIC_TEST_ONLY: 'SYNTHETIC_TEST_ONLY',
  
  /** Prediction has been evaluated against independently sourced real-world outcome data */
  EMPIRICALLY_VALIDATED: 'EMPIRICALLY_VALIDATED',
  
  /** Status cannot be determined with current information */
  UNDETERMINED: 'UNDETERMINED'
});

/** Ordered from strongest to weakest evidence */
export const TRUTH_STATUS_STRENGTH_ORDER = [
  TRUTH_STATUS.EXTERNAL_NUMERICALLY_VALIDATED,
  TRUTH_STATUS.CALCULATED,
  TRUTH_STATUS.EMPIRICALLY_VALIDATED,
  TRUTH_STATUS.INTERNAL_TESTED,
  TRUTH_STATUS.USER_CONFIRMED,
  TRUTH_STATUS.SOURCE_CITED,
  TRUTH_STATUS.TRADITIONAL_RULE,
  TRUTH_STATUS.SYNTHETIC_TEST_ONLY,
  TRUTH_STATUS.UNDETERMINED
];

/**
 * Validates that a given truth status is a recognized value.
 * @param {string} status
 * @returns {boolean}
 */
export function isValidTruthStatus(status) {
  return Object.values(TRUTH_STATUS).includes(status);
}

/**
 * Returns the appropriate truth status for a given evidence source.
 * Throws if the deprecated generic "VERIFIED" status is used.
 */
export function resolveTruthStatus(status) {
  if (status === 'VERIFIED' || status === 'verified') {
    throw new Error(
      'PROHIBITED: Generic "VERIFIED" status is not allowed. ' +
      `Use one of: ${Object.values(TRUTH_STATUS).join(', ')}`
    );
  }
  if (!isValidTruthStatus(status)) {
    console.warn(`Unknown truth status: "${status}". Defaulting to UNDETERMINED.`);
    return TRUTH_STATUS.UNDETERMINED;
  }
  return status;
}
