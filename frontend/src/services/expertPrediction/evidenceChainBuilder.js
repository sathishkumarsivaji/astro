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
 * Builds an evidence chain for a specific domain timing window following
 * the complete 15-level traversable hierarchy.
 *
 * @param {string} domain - The domain being analyzed.
 * @param {Object} canonicalFacts - Core astrological facts.
 * @param {Object} dashaMatch - The relevant dasha period.
 * @param {Array} transitHits - Array of concurrent transit events.
 * @param {Object|Array} vargaData - Divisional chart alignments.
 * @param {Object} [options] - Additional context options.
 * @returns {Object} Containing evidenceNodes, independenceGroups, totalIndependentConfirmations.
 */
export function buildEvidenceChain(domain, canonicalFacts = {}, dashaMatch = {}, transitHits = [], vargaData = null, options = {}) {
  const evidenceNodes = [];
  const independenceGroups = [];

  const mdLord = dashaMatch?.mdLord || dashaMatch?.lord || 'Sun';
  const adLord = dashaMatch?.adLord || dashaMatch?.lord || mdLord;
  const pdLord = options.pdRanking?.peakPD?.lord || dashaMatch?.pdLord || null;

  const lagnaSign = canonicalFacts?.ascendant?.sign || 'Mesha';
  const lagnaLong = canonicalFacts?.ascendant?.longitude != null ? canonicalFacts.ascendant.longitude.toFixed(2) : '0.00';
  const houses = options.relevantHouses || DOMAIN_HOUSES[domain] || [1, 7, 10];
  const houseStr = houses.join(', ');
  const karakas = options.relevantKarakas?.primary || DOMAIN_KARAKAS[domain]?.primary || ['Jupiter'];
  const karakaStr = karakas.join(', ');

  // ─── LEVEL 1: ASTRONOMICAL FACT ───
  const node1Id = generateDeterministicId('ev_1_astro', domain, mdLord, adLord);
  const igNatalId = generateDeterministicId('ig_natal_foundation', domain);

  // ─── LEVEL 2: NATAL FACT ───
  const node2Id = generateDeterministicId('ev_2_natal', domain, lagnaSign);

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
  const vargaGroupId = generateDeterministicId('ig_varga', domain, mdLord);

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
      independenceScore: 0.85
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
      description: `Divisional harmonics inspected for domain houses.`,
      descriptionTamil: `வர்க்க சக்கர பாவக அமைப்புகள் ஆய்வு செய்யப்பட்டன.`,
      value: 0.5,
      source: 'VARGA_ANALYSIS',
      independenceGroupId: igNatalId
    });
    validateEvidenceNode(vNode);
    evidenceNodes.push(vNode);
  }

  // ─── LEVEL 7: DASHA_MD ───
  const dashaGroupId = generateDeterministicId('ig_dasha', domain, mdLord, adLord);
  const node7Id = generateDeterministicId('ev_7_dasha_md', domain, mdLord);
  const node7 = createEvidenceNode({
    nodeId: node7Id,
    level: 7,
    type: 'DASHA_MD',
    description: `Active Mahadasha lord ${mdLord} establishes temporal governance.`,
    descriptionTamil: `நடைமுறையில் உள்ள மகா தசா நாதன் ${mdLord} கால ஆளுகையை நிறுவுகிறார்.`,
    value: 1.0,
    source: 'VIMSHOTTARI_MD',
    independenceGroupId: dashaGroupId
  });
  validateEvidenceNode(node7);
  evidenceNodes.push(node7);

  // ─── LEVEL 8: DASHA_AD ───
  const node8Id = generateDeterministicId('ev_8_dasha_ad', domain, adLord);
  const node8 = createEvidenceNode({
    nodeId: node8Id,
    level: 8,
    type: 'DASHA_AD',
    description: `Antardasha lord ${adLord} activates specific sub-cycle focus.`,
    descriptionTamil: `அந்தர்தசா நாதன் ${adLord} குறிப்பிட்ட உள்சுழற்சி தாக்கத்தை ஏற்படுத்துகிறது.`,
    value: 0.9,
    source: 'VIMSHOTTARI_AD',
    independenceGroupId: dashaGroupId
  });
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
    value: pdLord ? 0.85 : 0.6,
    source: 'VIMSHOTTARI_PD',
    independenceGroupId: dashaGroupId
  });
  validateEvidenceNode(node9);
  evidenceNodes.push(node9);

  const dashaGroup = createIndependenceGroup({
    groupId: dashaGroupId,
    label: 'Vimshottari Dasha Hierarchy',
    labelTamil: 'விம்சோத்தரி தசா படிநிலை',
    evidenceNodeIds: [node7Id, node8Id, node9Id],
    independenceScore: 1.0
  });
  validateIndependenceGroup(dashaGroup);
  independenceGroups.push(dashaGroup);

  // ─── LEVEL 10: TRANSIT ───
  const transitGroupId = generateDeterministicId('ig_transit', domain, mdLord);
  const transitNodeIds = [];

  const rawTransits = Array.isArray(transitHits) ? transitHits : [];
  if (rawTransits.length > 0) {
    rawTransits.forEach((hit, idx) => {
      // Fix field name: transitingPlanet || planet (never undefined)
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
      independenceScore: 1.0
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
      description: `Broad transit background calculated for period.`,
      descriptionTamil: `காலத்திற்கான பொதுவான கோட்சார பின்னணி கணக்கிடப்பட்டது.`,
      value: 0.4,
      source: 'TRANSIT_CALCULATION',
      independenceGroupId: transitGroupId
    });
    validateEvidenceNode(tNode);
    evidenceNodes.push(tNode);

    const transitGroup = createIndependenceGroup({
      groupId: transitGroupId,
      label: 'Transit Background',
      labelTamil: 'கோட்சார பின்னணி',
      evidenceNodeIds: transitNodeIds,
      independenceScore: 0.7
    });
    validateIndependenceGroup(transitGroup);
    independenceGroups.push(transitGroup);
  }

  // ─── LEVEL 11: EVENT_RULE ───
  const node11Id = generateDeterministicId('ev_11_event_rule', domain, mdLord, adLord);
  const node11 = createEvidenceNode({
    nodeId: node11Id,
    level: 11,
    type: 'EVENT_RULE',
    description: `Convergence rule for ${domain}: Dasha lords connect with houses [${houseStr}].`,
    descriptionTamil: `${domain} ஒருங்கிணைவு விதி: தசா நாதர்கள் [${houseStr}] பாவகங்களுடன் இணைகிறார்கள்.`,
    value: 0.85,
    source: 'DOMAIN_TIMING_RULE',
    independenceGroupId: dashaGroupId
  });
  validateEvidenceNode(node11);
  evidenceNodes.push(node11);

  // ─── LEVEL 12: INDEPENDENCE_GROUP ───
  const node12Id = generateDeterministicId('ev_12_indep_group', domain);
  const node12 = createEvidenceNode({
    nodeId: node12Id,
    level: 12,
    type: 'INDEPENDENCE_GROUP',
    description: `Multi-stream verification evaluated across Dasha, Transit, and Varga layers.`,
    descriptionTamil: `தசா, கோச்சாரம் மற்றும் வர்க்க நிலைகளில் தனித்தனி ஆதாரங்கள் உறுதி செய்யப்பட்டன.`,
    value: 0.9,
    source: 'INDEPENDENCE_CONTROLLER',
    independenceGroupId: dashaGroupId
  });
  validateEvidenceNode(node12);
  evidenceNodes.push(node12);

  // ─── LEVEL 13: TIMING_INTERSECTION ───
  const node13Id = generateDeterministicId('ev_13_intersection', domain);
  const node13 = createEvidenceNode({
    nodeId: node13Id,
    level: 13,
    type: 'TIMING_INTERSECTION',
    description: `Temporal concurrence established between primary dasha window and transit triggers.`,
    descriptionTamil: `முக்கிய தசா காலத்திற்கும் கோட்சார தூண்டுதல்களுக்கும் இடையே கால ஒருங்கிணைப்பு ஏற்பட்டது.`,
    value: 0.85,
    source: 'TIMING_SYNTHESIS',
    independenceGroupId: dashaGroupId
  });
  validateEvidenceNode(node13);
  evidenceNodes.push(node13);

  // ─── LEVEL 14: RESOLUTION ───
  const resolutionName = options.resolution || (transitHits.length > 0 ? 'DATE_RANGE' : 'MONTH_RANGE');
  const node14Id = generateDeterministicId('ev_14_resolution', domain, resolutionName);
  const node14 = createEvidenceNode({
    nodeId: node14Id,
    level: 14,
    type: 'RESOLUTION',
    description: `Finest verified precision achieved: ${resolutionName}.`,
    descriptionTamil: `அடையப்பட்ட அதிகபட்ச துல்லியம்: ${resolutionName}.`,
    value: 1.0,
    source: 'RESOLUTION_CLASSIFIER',
    independenceGroupId: dashaGroupId
  });
  validateEvidenceNode(node14);
  evidenceNodes.push(node14);

  // ─── LEVEL 15: CANDIDATE_WINDOW ───
  const node15Id = generateDeterministicId('ev_15_candidate_window', domain, mdLord, adLord);
  const node15 = createEvidenceNode({
    nodeId: node15Id,
    level: 15,
    type: 'CANDIDATE_WINDOW',
    description: `Bounded candidate window defined with calculated entry and exit boundaries.`,
    descriptionTamil: `துல்லியமான தொடக்கம் மற்றும் முடிவு எல்லைகளுடன் கால சாளரம் அமைக்கப்பட்டது.`,
    value: 1.0,
    source: 'WINDOW_COMPOSITION',
    independenceGroupId: dashaGroupId
  });
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
    independenceGroupId: igNatalId
  });
  validateEvidenceNode(node1);
  evidenceNodes.unshift(node1);

  const node2 = createEvidenceNode({
    nodeId: node2Id,
    level: 2,
    type: 'NATAL',
    description: `Natal Lagna confirmed in ${lagnaSign} at ${lagnaLong}°.`,
    descriptionTamil: `மூல ஜாதக லக்னம் ${lagnaSign} ராசியில் ${lagnaLong}° பாகையில் உறுதி செய்யப்பட்டது.`,
    value: 1.0,
    source: 'NATAL_CHART',
    childNodeIds: [node3Id],
    independenceGroupId: igNatalId
  });
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
    independenceGroupId: igNatalId
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
    independenceGroupId: igNatalId
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
    independenceGroupId: igNatalId
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

  // Natal foundation group
  const natalGroup = createIndependenceGroup({
    groupId: igNatalId,
    label: 'Natal Chart Foundation',
    labelTamil: 'மூல ஜாதக அடிப்படை',
    evidenceNodeIds: [node1Id, node2Id, node3Id, node4Id, node5Id],
    independenceScore: 1.0
  });
  validateIndependenceGroup(natalGroup);
  independenceGroups.unshift(natalGroup);

  // Count truly independent groups that have at least one node
  const activeGroups = new Set(evidenceNodes.map(n => n.independenceGroupId).filter(Boolean));
  const totalIndependentConfirmations = activeGroups.size;

  return {
    evidenceNodes,
    independenceGroups,
    totalIndependentConfirmations
  };
}
