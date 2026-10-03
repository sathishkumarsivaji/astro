/**
 * DEPRECATED AND DISABLED FOR EXTERNAL VALIDATION
 * 
 * Per Requirement 1:
 * "Delete or disable scripts/build_astro_databank_dataset.mjs for external validation.
 * Any synthetic benchmark generator must be classified SOURCE_SYNTHETIC_TEST and must
 * never be included in SOURCE_ASTRODATABANK, EXTERNAL_VALIDATION, EMPIRICAL_ACCURACY."
 * 
 * Genuine external validation uses:
 * scripts/ingest_astro_databank_export.mjs
 * which ingests the official Astrodienst public export c_sample_260919_1519.xml.
 */

export function buildSyntheticTestDataset() {
  throw new Error("PROHIBITED: buildAstroDatabankDataset is disabled. Genuine Astro-Databank data is ingested via scripts/ingest_astro_databank_export.mjs under SOURCE_ASTRODATABANK. Synthetic generators must use SOURCE_SYNTHETIC_TEST and are excluded from external validation.");
}

export default buildSyntheticTestDataset;
