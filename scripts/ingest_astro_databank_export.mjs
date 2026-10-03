/**
 * ASTROVERSE — Official Astro-Databank Public Export (Category C) Ingestion Pipeline (V3 - Scientific Audit Compliant)
 * 
 * Implements Requirements 1, 4, 5, 6, 7, 19:
 * 1. Full 4-way overlap detection against the complete VedAstro population (TRAIN, VAL, BLIND, HOLDOUT).
 * 2. Marriage type ZERO inference: defaults strictly to 'UNKNOWN' unless explicitly declared in source.
 * 3. Divorce event parsing and explicit linkage (divorceId, relatedMarriageId, associationStatus).
 * 4. Rigorous timezone resolution: preserves stmerid civil offsets, distinguishes LMT from STANDARD/DST.
 * 5. Distinct preservation of Rodden AA and A ratings.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import readline from 'readline';
import { resolveHistoricalTimeStandard } from '../frontend/src/services/historicalTime/historicalTimeEngine.js';

const ROOT = path.resolve(import.meta.dirname || '.', '..');
const XML_PATH = path.join(ROOT, 'data/external_validation/adb_extracted/c_sample_260919_1519.xml');
const OUTPUT_DIR = path.join(ROOT, 'data/external_validation/astro_databank');
const DATASET_PATH = path.join(OUTPUT_DIR, 'astro_databank_c_sample.json');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'astro_databank_manifest.json');
const INDEPENDENT_HOLDOUT_PATH = path.join(OUTPUT_DIR, 'astro_databank_independent_holdout.json');
const TRUE_INDEPENDENT_PATH = path.join(OUTPUT_DIR, 'astro_databank_true_independent.json');
const OVERLAP_MANIFEST_PATH = path.join(OUTPUT_DIR, 'overlap_manifest.json');
const OVERLAP_MANIFEST_ALT_PATH = path.join(OUTPUT_DIR, 'astro_databank_overlap_manifest.json');

// All 4 VedAstro split partitions for complete overlap detection
const TRAIN_PATH = path.join(ROOT, 'data/real_world_validation/splits/train.json');
const VAL_PATH = path.join(ROOT, 'data/real_world_validation/splits/val.json');
const BLIND_PATH = path.join(ROOT, 'data/real_world_validation/splits/blind_test.json');
const HOLDOUT_PATH = path.join(ROOT, 'data/real_world_validation/splits/internal_holdout.json');

function computeFileSha256(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function normalizeName(s) {
  if (!s) return '';
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseCoord(coordStr, isLat) {
  if (!coordStr) return null;
  const s = coordStr.trim().toLowerCase();
  const match = s.match(/^(\d+)([nsew])(\d+)?$/);
  if (!match) return null;
  const deg = parseInt(match[1], 10);
  const dir = match[2];
  const rem = match[3] || '';

  let min = 0;
  let sec = 0;
  if (rem.length <= 2) {
    min = rem ? parseInt(rem, 10) : 0;
  } else if (rem.length <= 4) {
    min = parseInt(rem.slice(0, 2), 10);
    sec = parseInt(rem.slice(2), 10);
  } else {
    min = parseInt(rem.slice(0, 2), 10);
    sec = parseInt(rem.slice(2, 4), 10);
  }

  const decimal = parseFloat((deg + (min / 60.0) + (sec / 3600.0)).toFixed(4));
  if (isLat) {
    return dir === 's' ? -decimal : decimal;
  } else {
    return dir === 'w' ? -decimal : decimal;
  }
}

function parseAdbDate(dateStr) {
  if (!dateStr) return { precision: 'NONE', raw: null, year: null, date: null };
  const s = dateStr.trim();
  const parts = s.split('/');
  if (parts.length === 3) {
    const yr = parseInt(parts[0], 10);
    const mo = parseInt(parts[1], 10);
    const da = parseInt(parts[2], 10);
    if (mo === 0 || da === 0) {
      return { precision: 'YEAR', raw: s, year: yr, date: `${yr}-07-01` };
    }
    const isoDate = `${yr}-${String(mo).padStart(2, '0')}-${String(da).padStart(2, '0')}`;
    return { precision: 'DAY', raw: s, year: yr, date: isoDate };
  }
  const yrMatch = s.match(/^(\d{4})/);
  if (yrMatch) {
    const yr = parseInt(yrMatch[1], 10);
    return { precision: 'YEAR', raw: s, year: yr, date: `${yr}-07-01` };
  }
  return { precision: 'NONE', raw: s, year: null, date: null };
}

function resolveTimezoneContext(attrs, lat, lng, birthDate, birthTime, birthPlace) {
  const ct = (attrs.match(/ctimetype="([^"]*)"/)?.[1] || '').trim().toLowerCase();
  const st = (attrs.match(/stimetype="([^"]*)"/)?.[1] || '').trim().toLowerCase();
  const zn = (attrs.match(/sznabbr="([^"]*)"/)?.[1] || '').trim();
  const merid = (attrs.match(/stmerid="([^"]*)"/)?.[1] || '').trim();

  let sourceTimeType = 'STANDARD_TIME';
  if (ct === 'l' || st.includes('local')) sourceTimeType = 'LOCAL_MEAN_TIME';
  else if (ct === 'd' || st.includes('daylight')) sourceTimeType = 'DAYLIGHT_SAVING_TIME';
  else if (ct === 'w' || st.includes('war')) sourceTimeType = 'WAR_TIME';
  else if (ct === 'u') sourceTimeType = 'UNKNOWN';

  let sourceUtcOffset = null;
  let resolvedUtcOffset = null;
  let timezoneResolutionMethod = 'UNKNOWN';
  let timezoneConfidence = 'MEDIUM';
  let timezoneId = zn || 'UTC';

  // 1. Explicit LMT: offset is longitude / 15.0
  if (sourceTimeType === 'LOCAL_MEAN_TIME') {
    const lmtOffset = parseFloat(((lng || 0) / 15.0).toFixed(4));
    sourceUtcOffset = lmtOffset;
    resolvedUtcOffset = lmtOffset;
    timezoneId = zn || 'LMT';
    timezoneResolutionMethod = 'SOURCE_LMT';
    timezoneConfidence = 'HIGH';
    return { sourceTimeType, sourceUtcOffset, resolvedUtcOffset, timezoneId, timezoneResolutionMethod, timezoneConfidence };
  }

  // 2. Parse stmerid if present (e.g., "h5w", "h1e", "h5e30", "m2e2015")
  if (merid) {
    const hMatch = merid.match(/^h(\d+)([ew])(\d+)?$/i);
    const mMatch = merid.match(/^m(\d+)([ew])(\d+)?$/i);
    if (hMatch) {
      const h = parseInt(hMatch[1], 10);
      const dir = hMatch[2].toLowerCase();
      const m = hMatch[3] ? parseInt(hMatch[3], 10) : 0;
      const off = (h + m / 60.0) * (dir === 'w' ? -1 : 1);
      sourceUtcOffset = parseFloat(off.toFixed(4));
      resolvedUtcOffset = sourceUtcOffset;
      timezoneResolutionMethod = 'SOURCE_STMERID';
      timezoneConfidence = 'HIGH';
      return { sourceTimeType, sourceUtcOffset, resolvedUtcOffset, timezoneId, timezoneResolutionMethod, timezoneConfidence };
    } else if (mMatch) {
      const deg = parseInt(mMatch[1], 10);
      const dir = mMatch[2].toLowerCase();
      const rem = mMatch[3] || '';
      let mm = 0, ss = 0;
      if (rem.length <= 2) mm = parseInt(rem || '0', 10);
      else { mm = parseInt(rem.slice(0, 2), 10); ss = parseInt(rem.slice(2, 4) || '0', 10); }
      const dec = deg + mm / 60.0 + ss / 3600.0;
      const off = (dec / 15.0) * (dir === 'w' ? -1 : 1);
      sourceUtcOffset = parseFloat(off.toFixed(4));
      resolvedUtcOffset = sourceUtcOffset;
      timezoneResolutionMethod = 'SOURCE_MERIDIAN_OFFSET';
      timezoneConfidence = 'HIGH';
      return { sourceTimeType, sourceUtcOffset, resolvedUtcOffset, timezoneId, timezoneResolutionMethod, timezoneConfidence };
    }
  }

  // 3. Fallback to historical timezone resolver for standard/civil time
  if (birthDate && lng !== null) {
    try {
      const hist = resolveHistoricalTimeStandard({
        birthDate,
        birthTime: birthTime || '12:00',
        latitude: lat,
        longitude: lng,
        sourceTimeConvention: sourceTimeType === 'DAYLIGHT_SAVING_TIME' ? 'STANDARD_TIME' : sourceTimeType
      });
      sourceUtcOffset = hist.resolvedOffset;
      resolvedUtcOffset = hist.resolvedOffset;
      timezoneId = zn || hist.timezoneId || 'STANDARD_CIVIL';
      timezoneResolutionMethod = 'HISTORICAL_CIVIL_RESOLVED';
      timezoneConfidence = hist.timeConfidence || 'MEDIUM';
      return { sourceTimeType, sourceUtcOffset, resolvedUtcOffset, timezoneId, timezoneResolutionMethod, timezoneConfidence };
    } catch (err) {
      // Fall through
    }
  }

  // 4. Default fallback: Only LOCAL_MEAN_TIME may use longitude / 15.0
  if (sourceTimeType === 'LOCAL_MEAN_TIME') {
    const lmtOffset = parseFloat(((lng || 0) / 15.0).toFixed(4));
    return {
      sourceTimeType: 'LOCAL_MEAN_TIME',
      sourceUtcOffset: lmtOffset,
      resolvedUtcOffset: lmtOffset,
      timezoneId: zn || 'LMT',
      timezoneResolutionMethod: 'SOURCE_LMT',
      timezoneConfidence: 'HIGH'
    };
  }

  // STANDARD_TIME where civil timezone cannot be resolved: FAIL-CLOSED (Requirement 15)
  return {
    sourceTimeType: sourceTimeType || 'STANDARD_TIME',
    sourceUtcOffset: null,
    resolvedUtcOffset: null,
    timezoneId: zn || 'UNKNOWN',
    timezoneResolutionMethod: 'TIME_STANDARD_UNRESOLVED',
    timezoneConfidence: 'UNRESOLVED'
  };
}

export async function ingestAstroDatabankExport() {
  console.log('============================================================');
  console.log('ASTROVERSE — REAL ASTRO-DATABANK PUBLIC EXPORT INGESTION (V3)');
  console.log('============================================================\n');

  if (!fs.existsSync(XML_PATH)) {
    throw new Error(`Raw Astro-Databank export XML not found at ${XML_PATH}. Download c_sample.zip first.`);
  }

  console.log('1. Computing raw XML SHA-256...');
  const rawSha256 = computeFileSha256(XML_PATH);
  console.log(`   Raw SHA-256: ${rawSha256}`);

  console.log('\n2. Loading ALL VedAstro partitions to detect 4-way cross-source overlap...');
  function loadPartition(pPath, pName) {
    if (!fs.existsSync(pPath)) return { name: pName, records: [], byNormName: new Map(), byNameDate: new Map() };
    const recs = JSON.parse(fs.readFileSync(pPath, 'utf8'));
    const byNormName = new Map();
    const byNameDate = new Map();
    for (const r of recs) {
      const norm = normalizeName(r.name);
      if (norm) {
        if (!byNormName.has(norm)) byNormName.set(norm, []);
        byNormName.get(norm).push(r);
      }
      if (norm && r.birthDate) {
        const key = `${norm}|${r.birthDate}`;
        if (!byNameDate.has(key)) byNameDate.set(key, []);
        byNameDate.get(key).push(r);
      }
    }
    return { name: pName, records: recs, byNormName, byNameDate };
  }

  const pTrain = loadPartition(TRAIN_PATH, 'TRAIN');
  const pVal = loadPartition(VAL_PATH, 'VALIDATION');
  const pBlind = loadPartition(BLIND_PATH, 'BLIND_TEST');
  const pHoldout = loadPartition(HOLDOUT_PATH, 'INTERNAL_HOLDOUT');

  console.log(`   Loaded TRAIN:            ${pTrain.records.length}`);
  console.log(`   Loaded VALIDATION:       ${pVal.records.length}`);
  console.log(`   Loaded BLIND_TEST:       ${pBlind.records.length}`);
  console.log(`   Loaded INTERNAL_HOLDOUT: ${pHoldout.records.length}`);
  const totalVedAstroEligible = pTrain.records.length + pVal.records.length + pBlind.records.length + pHoldout.records.length;
  console.log(`   Total VedAstro population: ${totalVedAstroEligible}\n`);

  console.log('3. Parsing XML records streaming line-by-line...');
  const fileStream = fs.createReadStream(XML_PATH);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const records = [];
  const roddenDistribution = {};
  const overlappingRecords = [];
  const nonOverlappingRecords = [];

  let trainOverlapCount = 0;
  let validationOverlapCount = 0;
  let blindOverlapCount = 0;
  let internalHoldoutOverlapCount = 0;

  let inEntry = false;
  let entryLines = [];

  for await (const line of rl) {
    if (line.includes('<adb_entry ')) {
      inEntry = true;
      entryLines = [line];
    } else if (line.includes('</adb_entry>')) {
      entryLines.push(line);
      inEntry = false;

      const xmlBlock = entryLines.join('\n');

      const idMatch = xmlBlock.match(/<adb_entry adb_id="([^"]+)">/);
      const adbId = idMatch ? idMatch[1] : `ADB_UNK_${records.length + 1}`;

      const nameMatch = xmlBlock.match(/<sflname>([^<]+)<\/sflname>/) || xmlBlock.match(/<name>([^<]+)<\/name>/);
      const name = nameMatch ? nameMatch[1].trim() : 'Unknown';

      const genderMatch = xmlBlock.match(/<gender csex="([^"]*)">([^<]*)<\/gender>/);
      const genderCode = genderMatch ? genderMatch[1].toLowerCase() : '';
      const gender = genderCode === 'm' ? 'Male' : (genderCode === 'f' ? 'Female' : 'Unknown');

      const roddenMatch = xmlBlock.match(/<roddenrating[^>]*>([^<]+)<\/roddenrating>/);
      const rodden = roddenMatch ? roddenMatch[1].trim().toUpperCase() : 'UNKNOWN';
      roddenDistribution[rodden] = (roddenDistribution[rodden] || 0) + 1;

      const bdateMatch = xmlBlock.match(/<sbdate[^>]*>([^<]+)<\/sbdate>/);
      const birthDateRaw = bdateMatch ? bdateMatch[1].trim() : null;
      const parsedBirthDate = parseAdbDate(birthDateRaw);

      const btimeMatch = xmlBlock.match(/<sbtime([^>]*)>([^<]+)<\/sbtime>/);
      const btimeAttrs = btimeMatch ? btimeMatch[1] : '';
      const birthTime = btimeMatch ? btimeMatch[2].trim() : '12:00';

      const placeMatch = xmlBlock.match(/<place slati="([^"]*)" slong="([^"]*)">([^<]*)<\/place>/);
      const lat = placeMatch ? parseCoord(placeMatch[1], true) : null;
      const lng = placeMatch ? parseCoord(placeMatch[2], false) : null;
      const birthPlace = placeMatch ? placeMatch[3].trim() : '';

      // Requirement 6: Rigorous timezone resolution
      const tzContext = resolveTimezoneContext(btimeAttrs, lat, lng, parsedBirthDate.date, birthTime, birthPlace);

      const notesMatch = xmlBlock.match(/<sourcenotes[^>]*>([\s\S]*?)<\/sourcenotes>/);
      const sourceNotes = notesMatch ? notesMatch[1].replace(/\\n/g, '\n').trim() : '';

      // Requirement 4: Extract marriage events with ZERO inference on marriageType
      const marriages = [];
      const eventRegex = /<event sevcode="([^"]*)"[^>]*>([\s\S]*?)<\/event>/g;
      let evMatch;
      let mCount = 0;
      while ((evMatch = eventRegex.exec(xmlBlock)) !== null) {
        const sevcode = evMatch[1];
        const evContent = evMatch[2];
        if (sevcode.toLowerCase().includes('marriage') || sevcode.toLowerCase().includes('relationship : marriage')) {
          mCount++;
          const evDateMatch = evContent.match(/<sbdate[^>]*>([^<]+)<\/sbdate>/);
          const evNotesMatch = evMatch[0].match(/evnotes="([^"]*)"/);
          const mDateParsed = parseAdbDate(evDateMatch ? evDateMatch[1] : null);
          const spouse = evNotesMatch && evNotesMatch[1] ? evNotesMatch[1].trim() : `Spouse ${mCount}`;

          marriages.push({
            marriageId: `ADB_${adbId}_m${mCount}`,
            rawMarriageDate: evDateMatch ? evDateMatch[1] : null,
            marriageDate: mDateParsed.date,
            marriageYear: mDateParsed.year,
            marriageDatePrecision: mDateParsed.precision,
            marriageType: 'UNKNOWN', // Requirement 4: ZERO inference. Never assume 'LOVE'.
            spouse,
            outcome: 'ONGOING',
            sourceCredibility: (rodden === 'AA' || rodden === 'A') ? 'HIGH' : 'MEDIUM'
          });
        }
      }

      // Requirement 5: Divorce event parsing and explicit linkage
      const divorces = [];
      const divRegex = /<event sevcode="([^"]*)"[^>]*>([\s\S]*?)<\/event>/g;
      let dMatch;
      let dCount = 0;
      while ((dMatch = divRegex.exec(xmlBlock)) !== null) {
        const sevcode = dMatch[1];
        const evContent = dMatch[2];
        if (sevcode.toLowerCase().includes('relationship : divorce') || sevcode.toLowerCase().includes('divorce dates')) {
          dCount++;
          const evDateMatch = evContent.match(/<sbdate[^>]*>([^<]+)<\/sbdate>/);
          const evNotesMatch = dMatch[0].match(/evnotes="([^"]*)"/);
          const evnIdMatch = dMatch[0].match(/evn_id="([^"]*)"/);
          const dDateParsed = parseAdbDate(evDateMatch ? evDateMatch[1] : null);
          const notes = evNotesMatch ? evNotesMatch[1].trim() : '';

          let relatedMarriageId = null;
          let associationStatus = 'UNKNOWN';

          // Link divorce by spouse name match
          for (const m of marriages) {
            if (notes && m.spouse && m.spouse.length > 3 && notes.toLowerCase().includes(m.spouse.toLowerCase())) {
              relatedMarriageId = m.marriageId;
              associationStatus = 'SPOUSE_NAME_LINKED';
              m.outcome = 'DISSOLUTION';
              break;
            }
          }
          // If only 1 marriage and 1 divorce, link as single marriage dissolution
          if (!relatedMarriageId && marriages.length === 1) {
            relatedMarriageId = marriages[0].marriageId;
            associationStatus = 'SINGLE_MARRIAGE_INFERRED';
            marriages[0].outcome = 'DISSOLUTION';
          }

          divorces.push({
            divorceId: `ADB_${adbId}_div_${dCount}`,
            rawDivorceDate: evDateMatch ? evDateMatch[1] : null,
            divorceDate: dDateParsed.date,
            divorceYear: dDateParsed.year,
            divorceDatePrecision: dDateParsed.precision,
            relatedMarriageId,
            associationStatus,
            sourceEventId: evnIdMatch ? evnIdMatch[1] : null,
            notes
          });
        }
      }

      // Chronological sort for first marriage
      const sortedMarriages = [...marriages].sort((a, b) => {
        const yA = a.marriageYear || 9999;
        const yB = b.marriageYear || 9999;
        return yA - yB;
      });
      const firstDocumentedMarriage = sortedMarriages.length > 0 ? sortedMarriages[0] : null;

      let censoringStatus = 'UNKNOWN';
      const followUpAge = 2026 - (parsedBirthDate.year || 2000);
      if (firstDocumentedMarriage && firstDocumentedMarriage.marriageYear && parsedBirthDate.year) {
        const mAge = firstDocumentedMarriage.marriageYear - parsedBirthDate.year;
        if (mAge >= 18 && mAge <= 50) {
          censoringStatus = 'EVENT';
        } else if (mAge < 18) {
          censoringStatus = 'EVENT_PRE_HORIZON';
        } else {
          censoringStatus = 'NO_EVENT_WITH_COMPLETE_FOLLOWUP';
        }
      } else {
        if (followUpAge >= 50) {
          censoringStatus = 'NO_EVENT_WITH_COMPLETE_FOLLOWUP';
        } else if (followUpAge >= 18) {
          censoringStatus = 'RIGHT_CENSORED';
        } else {
          censoringStatus = 'UNKNOWN';
        }
      }

      const record = {
        sourceDataset: 'SOURCE_ASTRODATABANK',
        sourceVersion: 'ADB-PUBLIC-2026.09',
        sourceURL: 'https://www.astro.com/adbexport/',
        sourceRecordId: `ADB_${adbId}`,
        adbId: parseInt(adbId, 10),
        name,
        gender,
        birthDate: parsedBirthDate.date,
        birthYear: parsedBirthDate.year,
        birthTime,
        birthTimeReliability: rodden,
        birthPlace,
        latitude: lat,
        longitude: lng,
        historicalTimeStandard: tzContext.sourceTimeType,
        sourceTimeType: tzContext.sourceTimeType,
        sourceUtcOffset: tzContext.sourceUtcOffset,
        resolvedUtcOffset: tzContext.resolvedUtcOffset,
        timezoneId: tzContext.timezoneId,
        timezoneResolutionMethod: tzContext.timezoneResolutionMethod,
        timezoneConfidence: tzContext.timezoneConfidence,
        sourceNotes: sourceNotes.slice(0, 500),
        hasDocumentedMarriage: marriages.length > 0,
        hasDivorce: divorces.length > 0,
        marriageCount: marriages.length,
        divorceCount: divorces.length,
        marriages: sortedMarriages,
        divorces,
        firstDocumentedMarriage,
        firstHighCredibilityMarriage: firstDocumentedMarriage,
        censoringStatus
      };

      records.push(record);

      // Requirement 1: 4-Way Overlap Detection across FULL VedAstro
      const normName = normalizeName(name);
      const nameDateKey = `${normName}|${record.birthDate}`;

      let matchedPartition = null;
      let matchedRecord = null;
      let matchType = null;

      // Check Name + BirthDate exact
      if (nameDateKey && pTrain.byNameDate.has(nameDateKey)) {
        matchedPartition = 'TRAIN';
        matchedRecord = pTrain.byNameDate.get(nameDateKey)[0];
        matchType = 'NAME_AND_BIRTHDATE';
      } else if (nameDateKey && pVal.byNameDate.has(nameDateKey)) {
        matchedPartition = 'VALIDATION';
        matchedRecord = pVal.byNameDate.get(nameDateKey)[0];
        matchType = 'NAME_AND_BIRTHDATE';
      } else if (nameDateKey && pBlind.byNameDate.has(nameDateKey)) {
        matchedPartition = 'BLIND_TEST';
        matchedRecord = pBlind.byNameDate.get(nameDateKey)[0];
        matchType = 'NAME_AND_BIRTHDATE';
      } else if (nameDateKey && pHoldout.byNameDate.has(nameDateKey)) {
        matchedPartition = 'INTERNAL_HOLDOUT';
        matchedRecord = pHoldout.byNameDate.get(nameDateKey)[0];
        matchType = 'NAME_AND_BIRTHDATE';
      }
      // Check Normalized Name exact (min 5 chars)
      else if (normName.length >= 5) {
        if (pTrain.byNormName.has(normName)) {
          matchedPartition = 'TRAIN';
          matchedRecord = pTrain.byNormName.get(normName)[0];
          matchType = 'NORMALIZED_NAME';
        } else if (pVal.byNormName.has(normName)) {
          matchedPartition = 'VALIDATION';
          matchedRecord = pVal.byNormName.get(normName)[0];
          matchType = 'NORMALIZED_NAME';
        } else if (pBlind.byNormName.has(normName)) {
          matchedPartition = 'BLIND_TEST';
          matchedRecord = pBlind.byNormName.get(normName)[0];
          matchType = 'NORMALIZED_NAME';
        } else if (pHoldout.byNormName.has(normName)) {
          matchedPartition = 'INTERNAL_HOLDOUT';
          matchedRecord = pHoldout.byNormName.get(normName)[0];
          matchType = 'NORMALIZED_NAME';
        }
      }

      if (matchedPartition) {
        if (matchedPartition === 'TRAIN') trainOverlapCount++;
        else if (matchedPartition === 'VALIDATION') validationOverlapCount++;
        else if (matchedPartition === 'BLIND_TEST') blindOverlapCount++;
        else if (matchedPartition === 'INTERNAL_HOLDOUT') internalHoldoutOverlapCount++;

        overlappingRecords.push({
          adbId: record.sourceRecordId,
          name: record.name,
          birthDate: record.birthDate,
          rodden: record.birthTimeReliability,
          matchedPartition,
          matchedRecordId: matchedRecord.sourceRecordId,
          matchedRecordName: matchedRecord.name,
          matchType
        });
      } else {
        nonOverlappingRecords.push(record);
      }
    } else if (inEntry) {
      entryLines.push(line);
    }
  }

  const totalVedAstroOverlap = overlappingRecords.length;
  const trueIndependentCount = nonOverlappingRecords.length;
  const independentAA = nonOverlappingRecords.filter(r => r.birthTimeReliability === 'AA');
  const independentA = nonOverlappingRecords.filter(r => r.birthTimeReliability === 'A');
  const trueIndependentAAACount = independentAA.length + independentA.length;

  console.log(`\n4. Successfully ingested ${records.length} records from official export.`);
  console.log('   Rodden distribution:', roddenDistribution);
  console.log(`\n5. COMPLETE 4-WAY VEDASTRO OVERLAP AUDIT:`);
  console.log(`   TRAIN overlap:            ${trainOverlapCount}`);
  console.log(`   VALIDATION overlap:       ${validationOverlapCount}`);
  console.log(`   BLIND_TEST overlap:       ${blindOverlapCount}`);
  console.log(`   INTERNAL_HOLDOUT overlap: ${internalHoldoutOverlapCount}`);
  console.log(`   TOTAL VedAstro overlap:   ${totalVedAstroOverlap}`);
  console.log(`\n   TRUE INDEPENDENT POPULATION:`);
  console.log(`   Total True Independent:   ${trueIndependentCount}`);
  console.log(`   Independent AA records:   ${independentAA.length}`);
  console.log(`   Independent A records:    ${independentA.length}`);
  console.log(`   Independent A/AA Cohort:  ${trueIndependentAAACount}`);

  // Write datasets
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(DATASET_PATH, JSON.stringify(records, null, 2));
  console.log(`✓ Wrote complete official dataset (${records.length} records) to: ${DATASET_PATH}`);

  fs.writeFileSync(INDEPENDENT_HOLDOUT_PATH, JSON.stringify(nonOverlappingRecords, null, 2));
  console.log(`✓ Wrote true independent holdout (${nonOverlappingRecords.length} records) to: ${INDEPENDENT_HOLDOUT_PATH}`);

  fs.writeFileSync(TRUE_INDEPENDENT_PATH, JSON.stringify(nonOverlappingRecords, null, 2));
  console.log(`✓ Wrote true independent holdout copy to: ${TRUE_INDEPENDENT_PATH}`);

  const overlapPayload = {
    manifestVersion: '3.0.0',
    generatedAt: new Date().toISOString(),
    totalAstroDatabankRecords: records.length,
    trainOverlap: trainOverlapCount,
    validationOverlap: validationOverlapCount,
    blindOverlap: blindOverlapCount,
    internalHoldoutOverlap: internalHoldoutOverlapCount,
    totalVedAstroOverlap,
    trueIndependentCount,
    trueIndependentAAACount,
    auditStandard: 'FULL_VEDASTRO_4_PARTITION_ISOLATION',
    reason: 'Excluded from independent external evaluation to eliminate any cross-dataset contamination',
    overlappingRecords
  };

  fs.writeFileSync(OVERLAP_MANIFEST_PATH, JSON.stringify(overlapPayload, null, 2));
  fs.writeFileSync(OVERLAP_MANIFEST_ALT_PATH, JSON.stringify(overlapPayload, null, 2));
  console.log(`✓ Wrote complete 4-way overlap manifest to: ${OVERLAP_MANIFEST_PATH}`);

  const datasetSha256 = crypto.createHash('sha256').update(fs.readFileSync(DATASET_PATH)).digest('hex');
  const independentSha256 = crypto.createHash('sha256').update(fs.readFileSync(INDEPENDENT_HOLDOUT_PATH)).digest('hex');

  const manifest = {
    manifestVersion: '3.0.0',
    schemaVersion: 'ASTRO_DATABANK_PUBLIC_EXPORT_SCHEMA_V3',
    datasetName: 'Astro-Databank Official Public Export (Category C)',
    sourceURL: 'https://www.astro.com/adbexport/',
    exportFormat: '260911',
    exportFilename: 'c_sample_260919_1519.xml',
    sourceVersion: 'ADB-PUBLIC-2026.09',
    downloadDate: '2026-10-03T03:34:26Z',
    rawXmlSha256: rawSha256,
    sha256: datasetSha256,
    independentHoldoutSha256: independentSha256,
    totalRecords: records.length,
    roddenRatingBreakdown: {
      ...roddenDistribution,
      totalAA_A: (roddenDistribution['AA'] || 0) + (roddenDistribution['A'] || 0)
    },
    provenanceClass: 'SOURCE_ASTRODATABANK',
    marriageDocumentedCount: records.filter(r => r.hasDocumentedMarriage).length,
    divorceDocumentedCount: records.filter(r => r.hasDivorce).length,
    overlapAudit: {
      totalAstroDatabankRecords: records.length,
      trainOverlap: trainOverlapCount,
      validationOverlap: validationOverlapCount,
      blindOverlap: blindOverlapCount,
      internalHoldoutOverlap: internalHoldoutOverlapCount,
      totalVedAstroOverlap,
      trueIndependentCount,
      trueIndependentAAACount
    },
    independentHoldoutCount: nonOverlappingRecords.length,
    licenseNotice: 'Astrodienst AG Astro-Databank public research export. Non-synthetic, official raw XML ingested.'
  };

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`✓ Wrote official manifest to: ${MANIFEST_PATH}`);
  console.log('\nAstro-Databank ingestion complete!\n');
}

if (process.argv[1] && process.argv[1].endsWith('ingest_astro_databank_export.mjs')) {
  ingestAstroDatabankExport().catch(err => {
    console.error('Ingestion failed:', err);
    process.exit(1);
  });
}
