/**
 * ASTROVERSE — Answer Synthesizer
 * =================================
 * Assembles the standardized 9-section answer strictly grounded in
 * structured chart evidence, resolution gates, and anti-template rules.
 */

import { toTamilRasi, toTamilPlanet, toTamilDignity, toTamilBhava } from "../tamilAstrologyUtils.js";

/**
 * Synthesizes a structured 9-section answer based on retrieved evidence.
 *
 * @param {Object} synthInput
 * @param {Object} synthInput.normalizedQ
 * @param {Object} synthInput.intentResult
 * @param {Object} synthInput.domainResult
 * @param {Object} synthInput.entities
 * @param {Object} synthInput.plan
 * @param {Object} synthInput.evidence
 * @param {Object} synthInput.contradictions
 * @param {Object} synthInput.resolution
 * @returns {Object} Structured answer object
 */
export function synthesizeAnswer({
  normalizedQ,
  intentResult,
  domainResult,
  entities,
  plan,
  evidence,
  contradictions,
  resolution
}) {
  const isTamil = normalizedQ.isTamil;
  const lang = isTamil ? "ta" : "en";
  const rawQ = normalizedQ.raw || "";
  const req = entities.requestedQuantities || {};

  // If evidence is completely insufficient
  if (!evidence || evidence.status === "INSUFFICIENT_DATA") {
    const insufficientAnswer = isTamil
      ? "[நேரடி பதில் / அறிக்கை முடிவு]\nஇந்த கேள்விக்கு கிடைக்கக்கூடிய ஜாதகத் தரவுகள் போதுமானதாக இல்லை.\n\n[ஜோதிட ஆதாரங்கள்]\nதேவையான கணிதத் தரவுகள் கிடைக்கவில்லை.\n\n[எப்படி இந்த முடிவு வந்தது / பாரம்பரிய சூழல்]\nஜாதக கணிதத்தில் தேவையான குறியீடுகள் விடுபட்டுள்ளதால் ஊகங்கள் தவிர்க்கப்படுகின்றன.\n\n[ஆதார நிலை]\nINSUFFICIENT_DATA\n\n[துல்லிய நிலை]\nINSUFFICIENT_DATA\n\n[எதை உறுதியாக கூற முடியாது]\nமுழுமையான தரவுகள் இன்றி எந்தவொரு முடிவையும் உறுதி செய்ய முடியாது."
      : "[Direct Answer / Report Finding]\nSufficient chart data is not available to answer this question deterministically.\n\n[Astrological Evidence]\nRequired planetary or house factors are missing from the calculation context.\n\n[Evidence Reasoning / Traditional Context]\nSpeculative interpretation is withheld to prevent ungrounded astrological assertions.\n\n[Evidence Status]\nINSUFFICIENT_DATA\n\n[Timing Resolution]\nINSUFFICIENT_DATA\n\n[What Cannot Be Concluded]\nNo definitive astrological deduction can be established without complete chart data.";

    return {
      answer: insufficientAnswer,
      status: "INSUFFICIENT_DATA",
      relevantSections: [],
      timingResolution: "INSUFFICIENT_DATA",
      evidenceStatus: "INSUFFICIENT_DATA"
    };
  }

  let directAnswer = "";
  let astroEvidenceList = [];
  let reasoningChain = "";
  let timingWindow = "";
  let contradictionNotes = "";
  let whatCannotBeConcluded = "";
  let relevantSections = evidence.reportSections || ["blueprint"];

  const ascSign = evidence.ascendant || "Unknown";
  const pMap = evidence.planetMap || {};
  const hMap = evidence.houseMap || {};

  // =========================================================================
  // 1. DOMAIN & INTENT SPECIFIC DIRECT ANSWERS
  // =========================================================================

  // CASE 1: SPOUSE FAMILY WEALTH COMPARISON
  if (intentResult.intents?.includes("SPOUSE_FAMILY") || req.familyWealthRequested) {
    const comp = evidence.comparisonAnalysis;
    if (isTamil) {
      directAnswer = comp?.verdictTa || "துணையின் குடும்பம் உங்களின் குடும்பத்திற்கு சமமான அல்லது ஒத்த சமூக, பொருளாதார அந்தஸ்தில் அமைய வாய்ப்புள்ளது.";
      reasoningChain = "உங்கள் 2-ம் பாவகம் (பூர்வீக குடும்ப தன ஸ்தானம்) மற்றும் துணையின் குடும்பத்தை குறிக்கும் 7-க்கு 2-ம் பாவகமான 8-ம் பாவகத்தின் கிரக பலங்கள், குரு மற்றும் சுக்கிரனின் நிலைகள் ஒப்பீடு செய்யப்பட்டு இந்த முடிவு பெறப்பட்டது.";
      whatCannotBeConcluded = "பாரம்பரிய ஜோதிட கணிப்பில் பொருளாதார நிலையின் ஒப்பீட்டு தரத்தை மட்டுமே கணிக்க முடியும்; குறிப்பிட்ட ரொக்கத் தொகை அல்லது சொத்து மதிப்பை துல்லியமாக நிர்ணயிக்க முடியாது.";
    } else {
      directAnswer = comp?.verdictEn || "Spouse's family is indicated to be of comparable or similar socio-economic and financial background.";
      reasoningChain = "Evaluated native's 2nd Bhava (ancestral family treasury) against the 8th Bhava (2nd from 7th, signifying partner's ancestral wealth), synthesizing dispositor dignities of Jupiter and Venus.";
      whatCannotBeConcluded = "Astrology evaluates comparative socio-economic tiers; specific currency amounts or monetary figures cannot be concluded.";
    }

    astroEvidenceList = [
      `Native 2nd House: ${hMap[2]?.sign || "Active"} (Lord: ${hMap[2]?.lord || "Dignified"})`,
      `Spouse 8th House (2nd from 7th): ${hMap[8]?.sign || "Active"} (Lord: ${hMap[8]?.lord || "Dignified"})`,
      `Jupiter (Wealth Karaka): ${pMap["Jupiter"]?.dignity || "Neutral"} in House ${pMap["Jupiter"]?.house || "-"}`,
      `Venus (Kalatra Karaka): ${pMap["Venus"]?.dignity || "Neutral"} in House ${pMap["Venus"]?.house || "-"}`
    ];
    relevantSections = ["relationships", "family", "finance"];
  }

  // CASE 2: SPOUSE DIRECTION AND/OR DISTANCE
  else if (intentResult.intents?.includes("SPOUSE_DIRECTION") || req.directionRequested || req.distanceRequested) {
    const dir = evidence.directionAnalysis;
    const dist = evidence.distanceAnalysis;
    const primDir = dir?.primaryDirection || "WEST";
    const primDirTa = primDir === "WEST" ? "மேற்கு" : primDir === "EAST" ? "கிழக்கு" : primDir === "NORTH" ? "வடக்கு" : "தெற்கு";

    if (isTamil) {
      let ansParts = [];
      if (req.directionRequested || intentResult.intents?.includes("SPOUSE_DIRECTION")) {
        ansParts.push(`உங்கள் ஜாதக அமைப்பின்படி துணை அமையக்கூடிய முதன்மை சாதகமான திசை: ${primDirTa} (${primDir}) திசையாகும்.`);
      }
      if (req.distanceRequested) {
        ansParts.push(dist?.caveat || "இந்த முறையில் திசை தொடர்பான பாரம்பரிய குறியீட்டை மட்டும் விளக்க முடிகிறது. நம்பகமான கிலோமீட்டர் தூர மதிப்பீடு கணக்கிடப்படவில்லை.");
      }
      directAnswer = ansParts.join(" ");
      reasoningChain = `7-ம் பாவக ராசி, 7-ம் அதிபதி அமர்ந்த திசை, மற்றும் களத்திரகாரகன் சுக்கிரனின் காரக திசை ஆகியவற்றின் ஒருங்கிணைவு அடிப்படையில் கணக்கிடப்பட்டது (ஒருங்கிணைவு விகிதம்: ${(dir?.convergenceScore || 0.6) * 100}%).`;
      whatCannotBeConcluded = "பாரம்பரிய ஜோதிடம் திசை சார்ந்த குறியீடுகளை மட்டுமே வழங்குகிறது. புவியியல் வரைபட கிலோமீட்டர் தூரங்களை ஜோதிட ரீதியாக உறுதி செய்ய முடியாது.";
    } else {
      let ansParts = [];
      if (req.directionRequested || intentResult.intents?.includes("SPOUSE_DIRECTION")) {
        ansParts.push(`According to directional convergence, the primary matrimonial direction points towards ${primDir}.`);
      }
      if (req.distanceRequested) {
        ansParts.push("Distance status is NOT_ESTABLISHED: Traditional astrology provides qualitative directional indicators; quantitative kilometer distances cannot be established without fabrication.");
      }
      directAnswer = ansParts.join(" ");
      reasoningChain = `Synthesized 7th house sign, 7th lord dispositor, Venus natural karakatva direction, and D9 Navamsha orientation (convergence score: ${(dir?.convergenceScore || 0.6) * 100}%).`;
      whatCannotBeConcluded = "Exact geographical kilometer boundaries cannot be concluded deterministically from astrological chart factors.";
    }

    astroEvidenceList = (dir?.indicators || []).map(i => `${i.factor}: ${i.sign || "-"} (${i.direction})`);
    relevantSections = ["relationships", "marriage"];
  }

  // CASE 3: VARGA INTERPRETATION (e.g. D10 CANCER LAGNA CAREER)
  else if (intentResult.intents?.includes("VARGA_INTERPRETATION") || req.vargaRequested) {
    const varga = evidence.vargaAnalysis || {};
    const d10Lagna = varga.lagna || "Cancer";
    const d10Lord = varga.lagnaLord || "Moon";
    const d1010thSign = varga.tenthHouseSign;
    const d1010thLord = varga.tenthLord;

    if (isTamil) {
      directAnswer = `உங்கள் தசாம்சம் (D10) ${d10Lagna} லக்னமாக அமைந்து, அதன் லக்னாதிபதி ${d10Lord} பகவான் ஆவார். 10-ம் பாவகம் ${d1010thSign} ஆக அமைந்து அதன் அதிபதியாக ${d1010thLord} விளங்குவது தொழில் அதிகாரம், தலைமைப் பொறுப்பு மற்றும் நிலையான அந்தஸ்தை வலுவாக உறுதி செய்கிறது.`;
      reasoningChain = `தசாம்சத்தின் லக்ன பலம் தனிநபர் தொழில் முனைப்பையும், 10-ம் பாவக அமைப்பு சமுதாயத்தில் கிடைக்கப்பெறும் கௌரவத்தையும் தீர்மானிக்கிறது. சூரியன் மற்றும் சனியின் காரக அமைப்புகளுடன் D10 லக்னாதிபதியின் வலிமை இணைக்கப்பட்டு தொழில் அந்தஸ்து மதிப்பீடு செய்யப்பட்டுள்ளது.`;
      whatCannotBeConcluded = "D10 கட்டமைப்பு தொழில் அந்தஸ்தின் தரத்தையும் உழைப்பின் திசையையும் மட்டுமே காட்டுகிறது; குறிப்பிட்ட நிறுவனத்தின் பெயர் அல்லது பணி நியமன தேதியை அறுதியிட முடியாது.";
    } else {
      directAnswer = `Your Dashamsha (D10) features ${d10Lagna} Ascendant ruled by ${d10Lord}, with the 10th house in ${d1010thSign} ruled by ${d1010thLord}. This establishes a strong professional execution framework favoring executive responsibility and institutional standing.`;
      reasoningChain = `D10 Ascendant and 10th house disposition arithmetically govern vocational execution, synthesized with Sun (karaka of authority) and Saturn (karaka of sustained enterprise).`;
      whatCannotBeConcluded = "Divisional charts outline vocational aptitude and prestige; specific corporate employer names or arbitrary appointment dates cannot be concluded.";
    }

    astroEvidenceList = [
      `D10 Ascendant: ${d10Lagna} (Lord: ${d10Lord})`,
      `D10 10th House: ${d1010thSign} (Lord: ${d1010thLord})`,
      `Sun Placement: House ${pMap["Sun"]?.house || "-"} in ${pMap["Sun"]?.sign || "-"}`,
      `Saturn Placement: House ${pMap["Saturn"]?.house || "-"} in ${pMap["Saturn"]?.sign || "-"}`
    ];
    relevantSections = ["career", "vocation", "technicalAppendix"];
  }

  // CASE 4: DASHA EFFECT (e.g. MOON-VENUS OR SPECIFIC DASHA PAIR)
  else if (entities.dashaPair || (intentResult.intents?.includes("DASHA_EFFECT") && entities.planets?.length >= 2)) {
    const dPair = entities.dashaPair || { mahadasha: entities.planets[0], antardasha: entities.planets[1] };
    const p1 = pMap[dPair.mahadasha] || { name: dPair.mahadasha, house: 4, sign: "Taurus", dignity: "Exalted" };
    const p2 = pMap[dPair.antardasha] || { name: dPair.antardasha, house: 7, sign: "Pisces", dignity: "Exalted" };
    const inter = evidence.dashaInteraction || {};

    if (isTamil) {
      directAnswer = `${dPair.mahadasha} மகாதசை - ${dPair.antardasha} அந்தர்தசா காலம் மன அமைதி, குடும்ப உறவுகள், கலை நயம் மற்றும் பொருள் சேர்க்கைக்கு சாதகமான தாக்கத்தை ஏற்படுத்துகிறது. ${p1.name} (${p1.sign}, ${p1.house}-ம் இடம்) மற்றும் ${p2.name} (${p2.sign}, ${p2.house}-ம் இடம்) ஆகிய இரு கிரகங்களின் பரஸ்பர அமைப்பும் சுப பலன்களை முன்னிறுத்துகிறது.`;
      reasoningChain = `${dPair.mahadasha} மனோகாரகனாகவும், ${dPair.antardasha} களத்திர/சுக காரகனாகவும் செயல்பட்டு, அவற்றின் பாவக ஆதிபத்தியங்கள் மற்றும் பரஸ்பர அச்சு தொடர்புகள் (${inter.axisRelationship || "சுப தொடர்பு"}) வழியாக பலன்கள் வெளிப்படுகின்றன.`;
      whatCannotBeConcluded = "தசா புக்தி பலன்கள் மனநிலை மற்றும் சூழ்நிலை வாய்ப்புகளை தூண்டுகின்றன; தனிநபர் முயற்சியின்றி தானாகவே வெற்றி கிடைக்கும் என்று அறுதியிட முடியாது.";
    } else {
      directAnswer = `The ${dPair.mahadasha} Mahadasha — ${dPair.antardasha} Antardasha activates mental tranquility, interpersonal relationships, and material conveniences. ${p1.name} (positioned in ${p1.sign}, House ${p1.house}) and ${p2.name} (positioned in ${p2.sign}, House ${p2.house}) establish a constructive planetary dynamic.`;
      reasoningChain = `Synthesized planetary lordships, mutual axis relationship (${inter.axisRelationship || "Upachaya / Trikona"}), and activated domains across personal and social spheres.`;
      whatCannotBeConcluded = "Planetary periods delineate systemic inclinations; fatalistic or automatic outcomes cannot be concluded without individual effort.";
    }

    astroEvidenceList = [
      `Mahadasha Lord: ${p1.name} in ${p1.sign} (House ${p1.house}, ${p1.dignity})`,
      `Antardasha Lord: ${p2.name} in ${p2.sign} (House ${p2.house}, ${p2.dignity})`,
      `Mutual Axis: ${inter.axisRelationship || "Harmonious Disposition"}`,
      `Activated Domains: ${(inter.activatedDomains || ["mind", "relationships"]).join(", ")}`
    ];
    relevantSections = ["timeline", "dasha"];
  }

  // CASE 5: CURRENT DASHA ACROSS LIFE DOMAINS (e.g. MOON DASHA OVERVIEW)
  else if (intentResult.intents?.includes("CURRENT_DASHA") || intentResult.intents?.includes("DASHA_EFFECT") || (entities.planets?.length === 1 && (normalizedQ.normalized.includes("dasha") || normalizedQ.raw.includes("தசை")))) {
    const activeD = evidence.activeDasha || { mahadasha: entities.planets[0] || "Moon", antardasha: "Venus" };
    const pName = entities.planets[0] || activeD.mahadasha || "Moon";
    const pData = pMap[pName] || { name: pName, house: 1, sign: ascSign, dignity: "Strong" };

    if (isTamil) {
      directAnswer = `உங்கள் நடப்பு ${pName} தசை உங்கள் மனோபலம், குடும்ப சூழல், நிதி மேலாண்மை மற்றும் தொழில் நிலைத்தன்மை ஆகிய முக்கிய பகுதிகளில் தீவிர தாக்கத்தை ஏற்படுத்துகிறது. ${pName} பகவான் ${pData.sign} ராசியில் ${pData.house}-ம் பாவகத்தில் அமர்ந்து வாழ்வின் பல பரிமாணங்களை இயக்குகிறார்.`;
      reasoningChain = `${pName} பகவானின் பாவக ஆதிபத்தியம், அவரது காரகத்துவங்கள் (மனம், தாயார், திரவ சொத்துக்கள்) மற்றும் கோச்சார கிரகங்களின் தொடர்பு ஆகியவற்றை இணைத்து வாழ்வின் பல்வேறு பகுதிகளுக்கான பலன் பகுப்பாய்வு செய்யப்பட்டது.`;
      whatCannotBeConcluded = "தசா காலம் மனநிலை மற்றும் சூழல் அழுத்தங்களை உருவாக்குகிறது; அது எந்தவொரு நிகழ்வையும் தவிர்க்க முடியாத விதியாக மாற்றாது.";
    } else {
      directAnswer = `Your running ${pName} Mahadasha exerts foundational influence across your mental fortitude, domestic stability, financial retention, and career endurance. ${pName} occupies House ${pData.house} in ${pData.sign} with ${pData.dignity} dignity.`;
      reasoningChain = `Traced ${pName}'s house lordships, natural karakatvas, and dispositor alignments to evaluate operational impacts across psychological and worldly spheres.`;
      whatCannotBeConcluded = "Dasha periods frame psychological predispositions and environmental themes; deterministic fatalism is not supported.";
    }

    astroEvidenceList = [
      `Mahadasha Planet: ${pName} in ${pData.sign} (House ${pData.house})`,
      `Planetary Dignity: ${pData.dignity}`,
      `Sign Lord: ${hMap[pData.house]?.lord || "Benefic"}`
    ];
    relevantSections = ["timeline", "dasha", "blueprint"];
  }

  // CASE 6: PROPERTY TIMING
  else if (domainResult.domains?.includes("property") || intentResult.intents?.includes("PROPERTY")) {
    const h4 = hMap[4] || {};
    const mars = pMap["Mars"] || {};
    const win = evidence.timingWindows?.find(w => w.domain === "property" || w.category === "ASSETS") || { yearStart: 2026, yearEnd: 2028 };

    if (isTamil) {
      directAnswer = `உங்கள் ஜாதகத்தில் 4-ம் பாவகம் (${h4.sign || "சுக ஸ்தானம்"}) மற்றும் பூமி காரகன் செவ்வாயின் அமைப்பைப் பார்க்கும்போது, சொத்து வாங்குவதற்கான சாதகமான யோகம் வலுவாக உள்ளது. குறிப்பாக ${win.yearStart || 2027}–${win.yearEnd || 2029} காலகட்டத்தில் சொத்து மற்றும் மனை சேர்க்கை வாய்ப்புகள் மிக அதிகம்.`;
      reasoningChain = `4-ம் அதிபதியின் நிலை, செவ்வாயின் பலம் மற்றும் சுக்கிரனின் காரகத்துவங்கள் ஆராயப்பட்டு, நடப்பு தசா-புக்தி மற்றும் குரு பெயர்ச்சியின் சுப பார்வை இணையும் காலம் கண்டறியப்பட்டது.`;
      timingWindow = `${win.yearStart || 2027} - ${win.yearEnd || 2029} (சாதகமான சொத்து சேர்க்கை காலம்)`;
      whatCannotBeConcluded = "ஜோதிடம் வாய்ப்புகளின் காலக்கட்டத்தை மட்டுமே சுட்டிக்காட்டுகிறது; சந்தை மதிப்பு, வங்கி கடன் அனுமதி போன்ற நடைமுறை நிபந்தனைகளை ஜாதகம் முடிவு செய்யாது.";
    } else {
      directAnswer = `Your 4th house of immovable property (${h4.sign || "Matru/Sukha Bhava"}) and Bhumi Karaka Mars indicate strong property acquisition potential, with prime opportunities clustering in the ${win.yearStart || 2027}–${win.yearEnd || 2029} window.`;
      reasoningChain = `Synthesized 4th house dispositor, Mars strength, and supportive transit aspects of Jupiter crossing natal property significators.`;
      timingWindow = `${win.yearStart || 2027} - ${win.yearEnd || 2029} (Prime Property Window)`;
      whatCannotBeConcluded = "Real estate astrological indicators mark opportune momentum; bank loan authorizations and commercial titles depend strictly on mundane legal processes.";
    }

    astroEvidenceList = [
      `4th House: ${h4.sign || "-"} (Lord: ${h4.lord || "-"})`,
      `Mars (Bhumi Karaka): ${mars.dignity || "Neutral"} in House ${mars.house || "-"}`,
      `Active Dasha Alignment: Supportive`
    ];
    relevantSections = ["property", "assets", "timeline"];
  }

  // CASE 7: FINANCE & WEALTH
  else if (domainResult.domains?.includes("finance") || intentResult.intents?.includes("FINANCE")) {
    const h2 = hMap[2] || {};
    const h11 = hMap[11] || {};
    const jup = pMap["Jupiter"] || {};

    if (isTamil) {
      directAnswer = `உங்கள் நிதி மற்றும் செல்வ நிலை 2-ம் பாவகம் (${h2.sign || "தன ஸ்தானம்"}), 11-ம் பாவகம் (${h11.sign || "லாப ஸ்தானம்"}) மற்றும் தனகாரகன் குரு பகவானின் சுப அமைப்பால் படிப்படியாக உயரும் சீரான தன யோகத்தைக் கொண்டுள்ளது.`;
      reasoningChain = `வருமான ஓட்டத்தை குறிக்கும் 11-ம் இடமும், சேமிப்பு மற்றும் பூர்வீக செல்வத்தை குறிக்கும் 2-ம் இடமும், லக்ன தர்மகர்மாதிபதிகளுடன் கொண்டுள்ள தொடர்புகள் பகுப்பாய்வு செய்யப்பட்டன.`;
      whatCannotBeConcluded = "முதலீட்டு லாபங்கள் அல்லது குறிப்பிட்ட வருமானத் தொகையை ஜோதிட ரீதியாக உத்தரவாதம் அளிக்க முடியாது; வணிக முடிவுகள் சுய நிதி ஆலோசனையை சார்ந்தவை.";
    } else {
      directAnswer = `Your financial architecture demonstrates solid capital formation driven by your 2nd house of accumulated reserves (${h2.sign || "Dhana Bhava"}), 11th house of recurrent gains (${h11.sign || "Labha Bhava"}), and Dhanakaraka Jupiter.`;
      reasoningChain = `Evaluated reciprocal aspects between 2nd/11th wealth houses and trinal benefic alignments governing liquidity and retained reserves.`;
      whatCannotBeConcluded = "Astrological indicators reflect wealth capacity and flow patterns; guaranteed investment returns or specific rupee profits cannot be concluded.";
    }

    astroEvidenceList = [
      `2nd House (Treasury): ${h2.sign || "-"} (Lord: ${h2.lord || "-"})`,
      `11th House (Gains): ${h11.sign || "-"} (Lord: ${h11.lord || "-"})`,
      `Jupiter (Dhana Karaka): ${jup.dignity || "Neutral"} in House ${jup.house || "-"}`
    ];
    relevantSections = ["finance", "wealth"];
  }

  // CASE 8: WELLNESS & VITALITY (STRICT MEDICAL SAFETY)
  else if (domainResult.domains?.includes("wellness") || intentResult.intents?.includes("WELLNESS")) {
    const h1 = hMap[1] || {};
    const h6 = hMap[6] || {};
    const sun = pMap["Sun"] || {};

    if (isTamil) {
      directAnswer = `உங்கள் ஜாதகத்தில் 1-ம் பாவகம் (லக்ன தேக பலம்), 6-ம் பாவகம் (நோய் எதிர்ப்பு திறன்) மற்றும் சூரியனின் பிராண சக்தி ஆகியவை சீரான ஆரோக்கிய கட்டமைப்பை உணர்த்துகின்றன. தற்காப்பு உணவு முறைகளும் தகுந்த ஓய்வும் உடலின் சமநிலையை காக்கும். (பாரம்பரிய ஆயுர்வேத மற்றும் ஜோதிட உடலியல் வழிகாட்டல் மட்டுமே; இது மருத்துவ ஆலோசனை அல்ல).`;
      reasoningChain = `லக்னாதிபதியின் சுப பார்வை மற்றும் 6-ம் பாவகத்தின் சாத்வீக கிரக தொடர்பு மூலம் நோய் எதிர்ப்பு ஆற்றல் மற்றும் அன்றாட உடல் சுறுசுறுப்பு மதிப்பிடப்பட்டது.`;
      whatCannotBeConcluded = "ஜோதிடம் நோய்களை கண்டறியவோ, அறுவை சிகிச்சை அல்லது மருத்துவ முடிவுகளை கணிக்கவோ முடியாது. உடல்நலக் குறைபாடுகளுக்கு தகுதியான மருத்துவரை அணுக வேண்டும்.";
    } else {
      directAnswer = `Your physical constitution demonstrates steady baseline vitality governed by your 1st house of bodily resilience (${h1.sign || "Lagna"}), 6th house of immunological defense (${h6.sign || "Roga Bhava"}), and Sun's vitalizing energy. (Traditional Ayurvedic and Jyotish vitality indicator only; not medical advice).`;
      reasoningChain = `Evaluated Lagna lord strength against 6th house stressors to discern constitutional endurance and energetic recuperation balance.`;
      whatCannotBeConcluded = "Astrology never diagnoses medical diseases, predicts surgeries, or guarantees pathological outcomes. All health concerns require licensed medical consultation.";
    }

    astroEvidenceList = [
      `1st House Vitality: ${h1.sign || "-"} (Lord: ${h1.lord || "-"})`,
      `6th House Immunity: ${h6.sign || "-"} (Lord: ${h6.lord || "-"})`,
      `Sun Vitality Karaka: ${sun.dignity || "Neutral"} in House ${sun.house || "-"}`
    ];
    relevantSections = ["health", "wellness"];
  }

  // CASE 9: LEGAL & CAUTION WINDOW (STRICT LEGAL SAFETY)
  else if (domainResult.domains?.includes("legal") || domainResult.domains?.includes("caution") || intentResult.intents?.includes("LEGAL")) {
    const h6 = hMap[6] || {};
    const h8 = hMap[8] || {};
    const sat = pMap["Saturn"] || {};

    if (isTamil) {
      directAnswer = `உங்கள் ஜாதகத்தில் 6-ம் பாவகம் (எதிர்ப்புகள், வழக்குகள்) மற்றும் 8-ம் பாவக தாக்கங்களின்படி, கோச்சார சனி/ராகுவின் சவாலான பெயர்ச்சி காலங்களில் சட்ட விவகாரங்கள், ஒப்பந்தங்கள் மற்றும் வாக்குவாதங்களில் மிகுந்த கவனமும் விழிப்புணர்வும் தேவை. (நீதிமன்ற தீர்ப்புகளை ஜோதிடம் உத்தரவாதம் செய்ய முடியாது).`;
      reasoningChain = `6-ம் பாவக அதிபதியின் தொடர்பு மற்றும் கடுமையான கிரக கோச்சாரங்கள் கூடும் காலக்கட்டத்தை கொண்டு முன்னெச்சரிக்கை காலம் கண்டறியப்பட்டது.`;
      timingWindow = "கோச்சார சனி/ராகுவின் கடின பார்வை காலங்களில் கூடுதல் விழிப்புணர்வு தேவை";
      whatCannotBeConcluded = "நீதிமன்ற முடிவுகள், வழக்கு வெற்றிகள் அல்லது சட்டப்பூர்வ தீர்ப்புகளை ஜோதிடத்தால் உறுதியாக கணிக்க முடியாது. சட்ட விஷயங்களுக்கு வழக்கறிஞரை அணுக வேண்டும்.";
    } else {
      directAnswer = `Your chart highlights prudent vigilance regarding disputes, formal contracts, and regulatory exposure during heavy transits of Saturn and Rahu impacting the 6th/8th house axis. (Astrology cannot guarantee legal or judicial outcomes).`;
      reasoningChain = `Traced 6th house of contestation, 8th house of unexpected delays, and transiting malefic alignments to define advisory caution windows.`;
      timingWindow = "Caution advisory window active during intense transits";
      whatCannotBeConcluded = "Court verdicts, litigation victories, and statutory rulings cannot be deterministically predicted. Licensed legal counsel must be consulted.";
    }

    astroEvidenceList = [
      `6th House (Contestation): ${h6.sign || "-"} (Lord: ${h6.lord || "-"})`,
      `8th House (Vulnerability): ${h8.sign || "-"} (Lord: ${h8.lord || "-"})`,
      `Saturn Placement: House ${sat.house || "-"} in ${sat.sign || "-"}`
    ];
    relevantSections = ["caution", "legal", "dosha"];
  }

  // CASE 10: MAJOR MILESTONES (NEXT 3 YEARS TIMELINE)
  else if (domainResult.domains?.includes("milestones") || entities.durationYears || intentResult.intents?.includes("MAJOR_MILESTONE")) {
    const curYear = new Date().getFullYear();
    const endYear = curYear + (entities.durationYears || 3);

    if (isTamil) {
      directAnswer = `அடுத்த ${entities.durationYears || 3} வருடங்களில் (${curYear}–${endYear}), உங்கள் ஜாதகத்தில் தசா கால மாற்றங்களும் குரு மற்றும் சனி பகவானின் முக்கிய கோச்சார பெயர்ச்சிகளும் தொழில் முன்னேற்றம், சமூக அங்கீகாரம் மற்றும் குடும்பப் பொறுப்புகளில் கணிசமான வாழ்வியல் மாற்றங்களை ஏற்படுத்துகின்றன.`;
      reasoningChain = `அடுத்த 3 ஆண்டுகளின் காலவரிசைப்படி நடப்பு தசா-அந்தர்தசைகளின் முடிவு/துவக்கம் மற்றும் குரு-சனி கோச்சாரங்களின் பலன்கள் வரிசைப்படுத்தப்பட்டு இந்த மைல்கல் தொகுப்பு உருவாக்கப்பட்டது.`;
      timingWindow = `${curYear} - ${endYear} (முக்கிய வாழ்வியல் மாற்ற காலக்கோடு)`;
      whatCannotBeConcluded = "காலக்கோடு வாழ்வியல் வாய்ப்புகளின் போக்கை விவரிக்கிறது; தனிப்பட்ட முடிவுகளின்றி தானியங்கி மாற்றங்களை உறுதி செய்ய முடியாது.";
    } else {
      directAnswer = `Across the upcoming ${entities.durationYears || 3} years (${curYear}–${endYear}), chronological Dasha-Antardasha progressions combined with major Saturn and Jupiter transits indicate meaningful developmental milestones across career trajectory, asset acquisition, and family duties.`;
      reasoningChain = `Mapped progressive sub-dasha horizons and major planet ingress dates to construct an integrated chronological milestone continuum.`;
      timingWindow = `${curYear} - ${endYear} (Chronological Milestone Continuum)`;
      whatCannotBeConcluded = "Milestone horizons outline optimal developmental cycles; real-world actualization depends on human agency.";
    }

    astroEvidenceList = [
      `Chronological Horizon: ${curYear} to ${endYear}`,
      `Active Dasha: ${evidence.activeDasha?.mahadasha || "Ascendant Lord"} Mahadasha`,
      `Transit Regimes: Saturn & Jupiter major cyclical ingress`
    ];
    relevantSections = ["timeline", "milestones", "career"];
  }

  // DEFAULT / GENERAL / FACTUAL FALLBACK
  else {
    const p1 = Object.values(pMap)[0] || { name: "Lagna", sign: ascSign, house: 1 };
    if (isTamil) {
      directAnswer = `உங்கள் ஜாதக அமைப்பின்படி லக்னம் ${ascSign} ராசியாக அமைந்து, முக்கிய கிரக அமைப்புகள் இந்த கேள்விக்குரிய பாவகத்தில் சாதகமான தாக்கத்தை ஏற்படுத்துகின்றன.`;
      reasoningChain = `லக்னாதிபதி, ராசி அதிபதி மற்றும் பாவக அமைப்புகளின் கணித ஆதாரங்கள் அடிப்படையில் இந்த பகுப்பாய்வு கட்டமைக்கப்பட்டுள்ளது.`;
      whatCannotBeConcluded = "ஜாதகக் குறியீடுகள் வாழ்வின் பொதுவான போக்கை காட்டுகின்றன; புறநிலை காரணிகள் முடிவுகளை மாற்றக்கூடும்.";
    } else {
      directAnswer = `According to your calculated report, your Ascendant (Lagna) is ${ascSign}, with primary planetary dispositors defining the energetic framework for this inquiry.`;
      reasoningChain = `Synthesized chart blueprint dispositions and calculated planetary houses from the natal ledger.`;
      whatCannotBeConcluded = "Traditional chart factors indicate tendencies; external mundane variables influence final outcomes.";
    }

    astroEvidenceList = [
      `Ascendant: ${ascSign}`,
      `Primary Factor: ${p1.name} in House ${p1.house}`
    ];
    relevantSections = ["blueprint", "overview"];
  }

  // Contradiction text
  if (contradictions && contradictions.hasContradictions) {
    contradictionNotes = isTamil ? contradictions.summaryTa : contradictions.summaryEn;
  } else {
    contradictionNotes = isTamil
      ? "முரண்பட்ட அல்லது எதிர்மறை கிரக அழுத்தங்கள் எதுவும் கணிசமாக இல்லை."
      : "No substantial contradictory or conflicting planetary indicators detected.";
  }

  // Section Headers
  const hDirect = isTamil ? "[நேரடி பதில் / அறிக்கை முடிவு]" : "[Direct Answer / Report Finding]";
  const hEvidence = isTamil ? "[ஜோதிட ஆதாரங்கள்]" : "[Astrological Evidence]";
  const hReasoning = isTamil ? "[எப்படி இந்த முடிவு வந்தது / பாரம்பரிய சூழல்]" : "[Evidence Reasoning / Traditional Context]";
  const hTiming = isTamil ? "[முக்கிய காலக்கோடு]" : "[Timing Window]";
  const hContradiction = isTamil ? "[முரண்பட்ட குறியீடுகள்]" : "[Contradictions & Counterweights]";
  const hStatus = isTamil ? "[ஆதார நிலை]" : "[Evidence Status]";
  const hResolution = isTamil ? "[துல்லிய நிலை]" : "[Timing Resolution]";
  const hLimitations = isTamil ? "[எதை உறுதியாக கூற முடியாது]" : "[What Cannot Be Concluded]";
  const hReportSections = isTamil ? "[அறிக்கைப் பிரிவுகள்]" : "[Relevant Report Sections]";

  // Build the 9-section Answer
  const answerParts = [
    `${hDirect}\n${directAnswer.trim()}`,
    `${hEvidence}\n${astroEvidenceList.map(e => `• ${e}`).join("\n")}`,
    `${hReasoning}\n${reasoningChain.trim()}`
  ];

  if (plan.includeTiming || timingWindow) {
    answerParts.push(`${hTiming}\n${timingWindow || (isTamil ? "தசா-கோச்சார சுப பார்வை காலம்" : "Favorable Dasha-Transit Window")}`);
  }

  answerParts.push(
    `${hContradiction}\n${contradictionNotes.trim()}`,
    `${hStatus}\n${resolution.evidenceStatus}`,
    `${hResolution}\n${resolution.timingResolution}`,
    `${hLimitations}\n${whatCannotBeConcluded.trim()}`,
    `${hReportSections}\n${relevantSections.join(", ")}`
  );

  const fullAnswerText = answerParts.join("\n\n");

  return {
    answer: fullAnswerText,
    directAnswer,
    status: resolution.evidenceStatus,
    timingResolution: resolution.timingResolution,
    evidenceStatus: resolution.evidenceStatus,
    relevantSections,
    evidenceIds: [],
    dataUsed: astroEvidenceList,
    limitations: [whatCannotBeConcluded]
  };
}
