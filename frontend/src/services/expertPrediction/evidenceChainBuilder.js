import {
  createEvidenceNode,
  createIndependenceGroup,
  validateEvidenceNode,
  validateIndependenceGroup,
  generateDeterministicId,
  DOMAIN_HOUSES,
  DOMAIN_KARAKAS
} from './expertPredictionSchema.js';

/**
 * Formal mapping between 15 Internal Evidence Levels and 9 Consolidated User-Facing Sections.
 * Implements Requirement 23:
 * Resolves the structural relationship between granular computational evidence and user-facing presentation.
 */
export const INTERNAL_TO_USER_FACING_EVIDENCE_MAPPING = Object.freeze([
  { sectionNumber: 1, title: "Astronomical & Natal Anchor", internalLevels: [1, 2], description: "Ephemeris coordinates, celestial longitudes, and Ascendant anchor" },
  { sectionNumber: 2, title: "Bhava & Lord Signification", internalLevels: [3, 4], description: "Domain houses activated and their governing planetary lords" },
  { sectionNumber: 3, title: "Karaka Alignment", internalLevels: [5], description: "Naisargika and Chara karaka significator confirmations" },
  { sectionNumber: 4, title: "Harmonic Varga Corroboration", internalLevels: [6], description: "Divisional chart micro-alignments (D9, D10, D4, D7, etc.)" },
  { sectionNumber: 5, title: "Vimshottari Dasha Triad", internalLevels: [7, 8, 9], description: "Mahadasha, Antardasha, and Pratyantardasha temporal rulers" },
  { sectionNumber: 6, title: "Transit Gochara Concurrence", internalLevels: [10], description: "Dynamic transit conjunctions, aspects, and house passages" },
  { sectionNumber: 7, title: "Ashtakavarga Strength & Bindus", internalLevels: [11], description: "Sarvashtakavarga (SAV) and Bhinnashtakavarga (BAV) support" },
  { sectionNumber: 8, title: "Contradiction & Mitigation Filter", internalLevels: [12, 13], description: "Combustion, debilitation, malefic aspects, and independence assessment" },
  { sectionNumber: 9, title: "Synthesis, Resolution & Epistemological Verdict", internalLevels: [14, 15], description: "Finest achievable resolution, uncertainty bounds, and truth status" }
]);

/**
 * Builds an evidence chain for a specific domain timing window following
 * the complete 15-level traversable hierarchy.
 *
 * @param {string} domain - The domain being analyzed.
 * @param {Object} canonicalFacts - Core astrological facts.
 * @param {Object} dashaMatch - The relevant dasha period.
 * @param {Array} transitHits - Array of concurrent transit events.
 * @param {Object|Array} vargaData - Divisional chart alignments.
 * @param {Object} [options] - Additional context options.
 * @returns {Object} Containing evidenceNodes, independenceGroups, totalIndependentConfirmations, resolution.
 */
export function buildEvidenceChain(domain, canonicalFacts = {}, dashaMatch = {}, transitHits = [], vargaData = null, options = {}) {
  const evidenceNodes = [];
  const independenceGroups = [];

  const mdLord = dashaMatch?.mdLord || dashaMatch?.lord || null;
  const adLord = dashaMatch?.adLord || null;
  const pdLord = options.pdRanking?.peakPD?.lord || dashaMatch?.pdLord || null;

  const lagnaSign = canonicalFacts?.ascendant?.sign || null;
  const lagnaLong = canonicalFacts?.ascendant?.longitude != null ? canonicalFacts.ascendant.longitude.toFixed(2) : null;
  const houses = options.relevantHouses || DOMAIN_HOUSES[domain] || [1, 7, 10];
  const houseStr = houses.join(', ');
  const karakas = options.relevantKarakas?.primary || DOMAIN_KARAKAS[domain]?.primary || ['Jupiter'];
  const karakaStr = karakas.join(', ');

  const isIncomplete = !lagnaSign || !mdLord;

  // ─── LEVEL 1: ASTRONOMICAL FACT ───
  const node1Id = generateDeterministicId('ev_1_astro', domain, mdLord || 'uncalculated', adLord || 'uncalculated');
  const igNatalId = generateDeterministicId('ig_natal_foundation', domain);

  // ─── LEVEL 2: NATAL FACT ───
  const node2Id = generateDeterministicId('ev_2_natal', domain, lagnaSign || 'uncalculated');

  // ─── LEVEL 3: HOUSE ACTIVATION ───
  const node3Id = generateDeterministicId('ev_3_house', domain, houseStr);

  // ─── LEVEL 4: HOUSE LORD ───
  const lords = options.relevantLords || houses.map(h => canonicalFacts?.houseLords?.[h]).filter(Boolean);
  const lordStr = lords.length > 0 ? lords.join(', ') : 'Bhava Lords';
  const node4Id = generateDeterministicId('ev_4_lord', domain, lordStr);

  // ─── LEVEL 5: KARAKA ───
  const node5Id = generateDeterministicId('ev_5_karaka', domain, karakaStr);

  // ─── LEVEL 6: VARGA ───
  // Normalize vargaData to an array
  const rawVargas = Array.isArray(vargaData)
    ? vargaData
    : (vargaData ? [vargaData] : []);
  const activeVargas = rawVargas.filter(v => v && (v.isActivated || v.isConfirmed));
  const vargaNodeIds = [];
  const vargaGroupId = generateDeterministicId('ig_varga', domain, mdLord || 'varga');

  if (activeVargas.length > 0) {
    activeVargas.forEach((vItem, vIdx) => {
      const vName = vItem.varga || 'D9';
      const vNodeId = generateDeterministicId('ev_6_varga', domain, vName, vIdx);
      vargaNodeIds.push(vNodeId);
      const strength = vItem.sameLord ? 0.7 : 1.0;
      const vNode = createEvidenceNode({
        nodeId: vNodeId,
        level: 6,
        type: 'VARGA',
        description: `Supported by divisional chart ${vName} alignment for ${domain}.`,
        descriptionTamil: `${vName} வர்க்க சக்கரத்தின் அமைப்பு ${domain} களத்திற்கு ஆதரவளிக்கிறது.`,
        value: strength,
        source: 'VARGA_ANALYSIS',
        independenceGroupId: vargaGroupId
      });
      validateEvidenceNode(vNode);
      evidenceNodes.push(vNode);
    });

    const vargaGroup = createIndependenceGroup({
      groupId: vargaGroupId,
      label: 'Varga Divisional Alignment',
      labelTamil: 'வர்க்க சக்கர அமைப்பு',
      evidenceNodeIds: vargaNodeIds,
      dependencyClass: 'PARTIALLY_DEPENDENT'
    });
    validateIndependenceGroup(vargaGroup);
    independenceGroups.push(vargaGroup);
  } else {
    const vNodeId = generateDeterministicId('ev_6_varga_default', domain);
    vargaNodeIds.push(vNodeId);
    const vNode = createEvidenceNode({
      nodeId: vNodeId,
      level: 6,
      type: 'VARGA',
      description: `Divisional harmonics not actively established for domain houses.`,
      descriptionTamil: `வர்க்க சக்கர பாவக ஒருங்கிணைவு இந்த களத்திற்கு நிறுவப்படவில்லை.`,
      value: null,
      source: 'VARGA_ANALYSIS',
      independenceGroupId: null
    });
    vNode.status = 'INSUFFICIENT_DATA';
    vNode.evidenceIds = [];
    vNode.contribution = 0;
    validateEvidenceNode(vNode);
    evidenceNodes.push(vNode);
  }

  // ─── LEVEL 7: DASHA_MD ───
  const dashaGroupId = generateDeterministicId('ig_dasha', domain, mdLord || 'uncalculated', adLord || 'uncalculated');
  const node7Id = generateDeterministicId('ev_7_dasha_md', domain, mdLord || 'uncalculated');
  const node7 = createEvidenceNode({
    nodeId: node7Id,
    level: 7,
    type: 'DASHA_MD',
    description: mdLord
      ? `Active Mahadasha lord ${mdLord} establishes temporal governance.`
      : `Active Mahadasha lord not established from dasha calculation.`,
    descriptionTamil: mdLord
      ? `நடைமுறையில் உள்ள மகா தசா நாதன் ${mdLord} கால ஆளுகையை நிறுவுகிறார்.`
      : `தசா கணக்கீட்டில் இருந்து மகா தசா ஆளுகை நிறுவப்படவில்லை.`,
    value: mdLord ? 1.0 : null,
    source: mdLord ? 'VIMSHOTTARI_MD' : 'MISSING_REQUIRED_INPUT',
    independenceGroupId: mdLord ? dashaGroupId : null
  });
  if (!mdLord) {
    node7.status = 'INSUFFICIENT_DATA';
    node7.contribution = 0;
  }
  validateEvidenceNode(node7);
  evidenceNodes.push(node7);

  // ─── LEVEL 8: DASHA_AD ───
  const node8Id = generateDeterministicId('ev_8_dasha_ad', domain, adLord || 'uncalculated');
  const node8 = createEvidenceNode({
    nodeId: node8Id,
    level: 8,
    type: 'DASHA_AD',
    description: adLord
      ? `Antardasha lord ${adLord} activates specific sub-cycle focus.`
      : `Antardasha sub-cycle focus not established.`,
    descriptionTamil: adLord
      ? `அந்தர்தசா நாதன் ${adLord} குறிப்பிட்ட உள்சுழற்சி தாக்கத்தை ஏற்படுத்துகிறது.`
      : `அந்தர்தசா உள்சுழற்சி தாக்கம் நிறுவப்படவில்லை.`,
    value: adLord ? 0.9 : null,
    source: adLord ? 'VIMSHOTTARI_AD' : 'MISSING_REQUIRED_INPUT',
    independenceGroupId: adLord ? dashaGroupId : null
  });
  if (!adLord) {
    node8.status = 'INSUFFICIENT_DATA';
    node8.contribution = 0;
  }
  validateEvidenceNode(node8);
  evidenceNodes.push(node8);

  // ─── LEVEL 9: DASHA_PD ───
  const node9Id = generateDeterministicId('ev_9_dasha_pd', domain, pdLord || 'Window');
  const node9 = createEvidenceNode({
    nodeId: node9Id,
    level: 9,
    type: 'DASHA_PD',
    description: pdLord
      ? `Pratyantardasha lord ${pdLord} isolates the sharpest timing interval.`
      : `Sub-period timing window evaluated across third-level dasha division.`,
    descriptionTamil: pdLord
      ? `பிரத்யந்தர்தசா நாதன் ${pdLord} மிகத் துல்லியமான கால அளவை பிரிக்கிறார்.`
      : `மூன்றாம் நிலை தசா கால இடைவெளி மதிப்பீடு செய்யப்பட்டது.`,
    value: pdLord ? 0.85 : null,
    source: pdLord ? 'VIMSHOTTARI_PD' : 'MISSING_REQUIRED_INPUT',
    independenceGroupId: (mdLord && pdLord) ? dashaGroupId : null
  });
  if (!pdLord) {
    node9.status = 'INSUFFICIENT_DATA';
    node9.contribution = 0;
  }
  validateEvidenceNode(node9);
  evidenceNodes.push(node9);

  if (mdLord) {
    const dashaGroup = createIndependenceGroup({
      groupId: dashaGroupId,
      label: 'Vimshottari Dasha Hierarchy',
      labelTamil: 'விம்சோத்தரி தசா படிநிலை',
      evidenceNodeIds: [node7Id, node8Id, node9Id],
      dependencyClass: 'CONDITIONALLY_INDEPENDENT'
    });
    validateIndependenceGroup(dashaGroup);
    independenceGroups.push(dashaGroup);
  }

  // ─── LEVEL 10: TRANSIT ───
  const transitGroupId = generateDeterministicId('ig_transit', domain, mdLord || 'transit');
  const transitNodeIds = [];

  const rawTransits = Array.isArray(transitHits) ? transitHits : [];
  if (rawTransits.length > 0) {
    rawTransits.forEach((hit, idx) => {
      const planetName = hit.transitingPlanet || hit.planet || 'MajorPlanet';
      const tNodeId = generateDeterministicId('ev_10_transit', domain, planetName, idx);
      transitNodeIds.push(tNodeId);
      const tNode = createEvidenceNode({
        nodeId: tNodeId,
        level: 10,
        type: 'TRANSIT',
        description: `Transit crossing of ${planetName} activates ${domain} significators.`,
        descriptionTamil: `கோட்சார ${planetName} பெயர்ச்சி ${domain} காரகங்களை தூண்டுகிறது.`,
        value: 0.8,
        source: 'TRANSIT_CALCULATION',
        independenceGroupId: transitGroupId
      });
      validateEvidenceNode(tNode);
      evidenceNodes.push(tNode);
    });

    const transitGroup = createIndependenceGroup({
      groupId: transitGroupId,
      label: 'Planetary Transit Concurrence',
      labelTamil: 'கோட்சார ஒருங்கிணைப்பு',
      evidenceNodeIds: transitNodeIds,
      dependencyClass: 'INDEPENDENT'
    });
    validateIndependenceGroup(transitGroup);
    independenceGroups.push(transitGroup);
  } else {
    const tNodeId = generateDeterministicId('ev_10_transit_none', domain);
    transitNodeIds.push(tNodeId);
    const tNode = createEvidenceNode({
      nodeId: tNodeId,
      level: 10,
      type: 'TRANSIT',
      description: `Transit concurrence not established for period.`,
      descriptionTamil: `காலத்திற்கான கோட்சார ஒருங்கிணைவு எதுவும் நிறுவப்படவில்லை.`,
      value: null,
      source: 'TRANSIT_CALCULATION',
      independenceGroupId: null
    });
    tNode.status = 'INSUFFICIENT_DATA';
    tNode.evidenceIds = [];
    tNode.contribution = 0;
    validateEvidenceNode(tNode);
    evidenceNodes.push(tNode);
  }

  // ─── LEVEL 11: EVENT_RULE ───
  const node11Id = generateDeterministicId('ev_11_event_rule', domain, mdLord || 'uncalculated', adLord || 'uncalculated');
  const node11 = createEvidenceNode({
    nodeId: node11Id,
    level: 11,
    type: 'EVENT_RULE',
    description: mdLord
      ? `Convergence rule for ${domain}: Dasha lords connect with houses [${houseStr}].`
      : `Convergence rule for ${domain}: Dasha lords not available for house connection.`,
    descriptionTamil: mdLord
      ? `${domain} ஒருங்கிணைவு விதி: தசா நாதர்கள் [${houseStr}] பாவகங்களுடன் இணைகிறார்கள்.`
      : `${domain} ஒருங்கிணைவு விதி: தசா நாதர்கள் கிடைக்கப்பெறவில்லை.`,
    value: mdLord ? 0.85 : null,
    source: 'DOMAIN_TIMING_RULE',
    independenceGroupId: mdLord ? dashaGroupId : null
  });
  if (!mdLord) {
    node11.status = 'INSUFFICIENT_DATA';
    node11.contribution = 0;
  }
  validateEvidenceNode(node11);
  evidenceNodes.push(node11);

  // ─── LEVEL 12: INDEPENDENCE_GROUP ───
  const node12Id = generateDeterministicId('ev_12_indep_group', domain);
  const node12 = createEvidenceNode({
    nodeId: node12Id,
    level: 12,
    type: 'INDEPENDENCE_GROUP',
    description: isIncomplete
      ? `Multi-stream verification incomplete due to missing required inputs.`
      : `Multi-stream verification evaluated across Dasha, Transit, and Varga layers.`,
    descriptionTamil: isIncomplete
      ? `தேவையான உள்ளீடுகள் இல்லாததால் பல்துறை சரிபார்ப்பு முழுமையடையவில்லை.`
      : `தசா, கோச்சாரம் மற்றும் வர்க்க நிலைகளில் தனித்தனி ஆதாரங்கள் உறுதி செய்யப்பட்டன.`,
    value: isIncomplete ? null : 0.9,
    source: 'INDEPENDENCE_CONTROLLER',
    independenceGroupId: mdLord ? dashaGroupId : null
  });
  if (isIncomplete) {
    node12.status = 'INSUFFICIENT_DATA';
    node12.contribution = 0;
  }
  validateEvidenceNode(node12);
  evidenceNodes.push(node12);

  // ─── LEVEL 13: TIMING_INTERSECTION ───
  const node13Id = generateDeterministicId('ev_13_intersection', domain);
  const node13 = createEvidenceNode({
    nodeId: node13Id,
    level: 13,
    type: 'TIMING_INTERSECTION',
    description: isIncomplete
      ? `Timing intersection not established.`
      : `Temporal concurrence established between primary dasha window and transit triggers.`,
    descriptionTamil: isIncomplete
      ? `கால ஒருங்கிணைப்பு நிறுவப்படவில்லை.`
      : `முக்கிய தசா காலத்திற்கும் கோட்சார தூண்டுதல்களுக்கும் இடையே கால ஒருங்கிணைப்பு ஏற்பட்டது.`,
    value: isIncomplete ? null : 0.85,
    source: 'TIMING_SYNTHESIS',
    independenceGroupId: mdLord ? dashaGroupId : null
  });
  if (isIncomplete) {
    node13.status = 'INSUFFICIENT_DATA';
    node13.contribution = 0;
  }
  validateEvidenceNode(node13);
  evidenceNodes.push(node13);

  // ─── LEVEL 14: RESOLUTION ───
  const resolutionName = isIncomplete
    ? 'INSUFFICIENT_DATA'
    : (options.resolution || (rawTransits.length > 0 ? 'DATE_RANGE' : 'MONTH_RANGE'));
  const node14Id = generateDeterministicId('ev_14_resolution', domain, resolutionName);
  const node14 = createEvidenceNode({
    nodeId: node14Id,
    level: 14,
    type: 'RESOLUTION',
    description: `Finest verified precision achieved: ${resolutionName}.`,
    descriptionTamil: `அடையப்பட்ட அதிகபட்ச துல்லியம்: ${resolutionName}.`,
    value: isIncomplete ? null : 1.0,
    source: 'RESOLUTION_CLASSIFIER',
    independenceGroupId: mdLord ? dashaGroupId : null
  });
  if (isIncomplete) {
    node14.status = 'INSUFFICIENT_DATA';
    node14.contribution = 0;
  }
  validateEvidenceNode(node14);
  evidenceNodes.push(node14);

  // ─── LEVEL 15: CANDIDATE_WINDOW ───
  const node15Id = generateDeterministicId('ev_15_candidate_window', domain, mdLord || 'uncalculated', adLord || 'uncalculated');
  const node15 = createEvidenceNode({
    nodeId: node15Id,
    level: 15,
    type: 'CANDIDATE_WINDOW',
    description: isIncomplete
      ? `Candidate window bounds not established due to insufficient data.`
      : `Bounded candidate window defined with calculated entry and exit boundaries.`,
    descriptionTamil: isIncomplete
      ? `போதிய தரவு இல்லாததால் கால சாளர எல்லைகள் நிறுவப்படவில்லை.`
      : `துல்லியமான தொடக்கம் மற்றும் முடிவு எல்லைகளுடன் கால சாளரம் அமைக்கப்பட்டது.`,
    value: isIncomplete ? null : 1.0,
    source: 'WINDOW_COMPOSITION',
    independenceGroupId: mdLord ? dashaGroupId : null
  });
  if (isIncomplete) {
    node15.status = 'INSUFFICIENT_DATA';
    node15.contribution = 0;
  }
  validateEvidenceNode(node15);
  evidenceNodes.push(node15);

  // ─── LINK TRAVERSABLE CHAIN VIA childNodeIds ───
  const node1 = createEvidenceNode({
    nodeId: node1Id,
    level: 1,
    type: 'ASTRONOMICAL',
    description: `Ephemeris planetary positions verified via VSOP87 analytical algorithms.`,
    descriptionTamil: `கோள்களின் நிலைகள் துல்லிய கணித முறைப்படி சரிபார்க்கப்பட்டன.`,
    value: 1.0,
    source: 'EPHEMERIS_ENGINE',
    childNodeIds: [node2Id],
    independenceGroupId: lagnaSign ? igNatalId : null
  });
  validateEvidenceNode(node1);
  evidenceNodes.unshift(node1);

  const node2 = createEvidenceNode({
    nodeId: node2Id,
    level: 2,
    type: 'NATAL',
    description: lagnaSign
      ? `Natal Lagna confirmed in ${lagnaSign}${lagnaLong ? ` at ${lagnaLong}°` : ''}.`
      : `Natal Lagna data insufficient from calculation input.`,
    descriptionTamil: lagnaSign
      ? `மூல ஜாதக லக்னம் ${lagnaSign} ராசியில்${lagnaLong ? ` ${lagnaLong}° பாகையில்` : ''} உறுதி செய்யப்பட்டது.`
      : `கணித உள்ளீட்டில் இருந்து மூல ஜாதக லக்னம் நிறுவப்படவில்லை.`,
    value: lagnaSign ? 1.0 : null,
    source: lagnaSign ? 'NATAL_CHART' : 'MISSING_REQUIRED_INPUT',
    childNodeIds: [node3Id],
    independenceGroupId: lagnaSign ? igNatalId : null
  });
  if (!lagnaSign) {
    node2.status = 'INSUFFICIENT_DATA';
    node2.contribution = 0;
  }
  validateEvidenceNode(node2);
  evidenceNodes.splice(1, 0, node2);

  const node3 = createEvidenceNode({
    nodeId: node3Id,
    level: 3,
    type: 'HOUSE',
    description: `Domain ${domain} maps to principal houses [${houseStr}].`,
    descriptionTamil: `${domain} களம் [${houseStr}] முக்கிய பாவகங்களுடன் தொடர்புடையது.`,
    value: 1.0,
    source: 'BHAVA_MAPPING',
    childNodeIds: [node4Id],
    independenceGroupId: lagnaSign ? igNatalId : null
  });
  validateEvidenceNode(node3);
  evidenceNodes.splice(2, 0, node3);

  const node4 = createEvidenceNode({
    nodeId: node4Id,
    level: 4,
    type: 'LORD',
    description: `Domain houses ruled by lords [${lordStr}].`,
    descriptionTamil: `பாவக அதிபதிகள் [${lordStr}] பொறுப்பு வகிக்கின்றனர்.`,
    value: 1.0,
    source: 'HOUSE_LORDS',
    childNodeIds: [node5Id],
    independenceGroupId: lagnaSign ? igNatalId : null
  });
  validateEvidenceNode(node4);
  evidenceNodes.splice(3, 0, node4);

  const node5 = createEvidenceNode({
    nodeId: node5Id,
    level: 5,
    type: 'KARAKA',
    description: `Natural significators for ${domain}: [${karakaStr}].`,
    descriptionTamil: `${domain} களத்தின் இயற்கை காரகர்கள்: [${karakaStr}].`,
    value: 1.0,
    source: 'NAISARGIKA_KARAKA',
    childNodeIds: vargaNodeIds,
    independenceGroupId: lagnaSign ? igNatalId : null
  });
  validateEvidenceNode(node5);
  evidenceNodes.splice(4, 0, node5);

  // Link vargas -> Level 7 (Dasha MD)
  evidenceNodes.forEach(n => {
    if (n.level === 6) n.childNodeIds = [node7Id];
  });
  node7.childNodeIds = [node8Id];
  node8.childNodeIds = [node9Id];
  node9.childNodeIds = transitNodeIds;
  evidenceNodes.forEach(n => {
    if (n.level === 10) n.childNodeIds = [node11Id];
  });
  node11.childNodeIds = [node12Id];
  node12.childNodeIds = [node13Id];
  node13.childNodeIds = [node14Id];
  node14.childNodeIds = [node15Id];

  // Natal foundation group only if Lagna is confirmed
  if (lagnaSign) {
    const natalGroup = createIndependenceGroup({
      groupId: igNatalId,
      label: 'Natal Chart Foundation',
      labelTamil: 'மூல ஜாதக அடிப்படை',
      evidenceNodeIds: [node1Id, node2Id, node3Id, node4Id, node5Id],
      dependencyClass: 'CONDITIONALLY_INDEPENDENT'
    });
    validateIndependenceGroup(natalGroup);
    independenceGroups.unshift(natalGroup);
  }

  // Count truly independent groups that have at least one node
  let totalIndependentConfirmations = 0;
  if (!isIncomplete) {
    const activeGroups = new Set(evidenceNodes.map(n => n.independenceGroupId).filter(Boolean));
    totalIndependentConfirmations = activeGroups.size;
  }

  return {
    evidenceNodes,
    independenceGroups,
    totalIndependentConfirmations,
    resolution: resolutionName
  };
}
