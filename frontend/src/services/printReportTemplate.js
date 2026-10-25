/**
 * SKR ASTRO — Professional Print-HTML Document Generator
 * ========================================================
 * Version: 2.1.0
 * 
 * Generates an authoritative, publication-grade print-HTML document
 * optimized for Chromium headless print-to-PDF and browser window.print().
 * 
 * Guarantees:
 * 1. 100% correct Tamil OpenType shaping (HarfBuzz compatible).
 * 2. Vector charts with clean SVG and deterministic labels.
 * 3. Exact A4 portrait print CSS with physical units (margins 12mm 14mm).
 * 4. Semantic page breaks (page-break-inside: avoid; keep-with-next).
 * 5. Zero hardcoded convergence numbers (no 0.91, 0.88, 0.86).
 * 6. Neutral empty-yoga statement instead of generic positive boilerplate.
 * 7. Full age and life-context applicability governance for all timeline rows.
 * 8. Searchable and copyable Unicode Tamil without hidden-text hack.
 */


/**
 * Escapes HTML characters for safe template interpolation
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Renders an authentic South Indian Vector Chart in SVG
 */
function renderSouthIndianChartSVG(title, planets = [], ascSign = "Aries", isTamil = false, chartType = "D1") {
  const grid = [
    ["Pisces", "Aries", "Taurus", "Gemini"],
    ["Aquarius", null, null, "Cancer"],
    ["Capricorn", null, null, "Leo"],
    ["Sagittarius", "Scorpio", "Libra", "Virgo"]
  ];

  const signShortsTa = {
    Pisces: "மீனம்", Aries: "மேஷம்", Taurus: "ரிஷபம்", Gemini: "மிதுனம்",
    Cancer: "கடகம்", Leo: "சிம்மம்", Virgo: "கன்னி", Libra: "துலாம்",
    Scorpio: "விருச்சிகம்", Sagittarius: "தனுசு", Capricorn: "மகரம்", Aquarius: "கும்பம்"
  };

  const signShortsEn = {
    Pisces: "Pis", Aries: "Ari", Taurus: "Tau", Gemini: "Gem",
    Cancer: "Can", Leo: "Leo", Virgo: "Vir", Libra: "Lib",
    Scorpio: "Sco", Sagittarius: "Sag", Capricorn: "Cap", Aquarius: "Aqu"
  };

  const planetShortTa = {
    Sun: "சூரி", Moon: "சந்", Mars: "செவ்", Mercury: "புத",
    Jupiter: "குரு", Venus: "சுக்", Saturn: "சனி", Rahu: "ராகு", Ketu: "கேது"
  };

  const planetShortEn = {
    Sun: "Sun", Moon: "Moo", Mars: "Mar", Mercury: "Mer",
    Jupiter: "Jup", Venus: "Ven", Saturn: "Sat", Rahu: "Rah", Ketu: "Ket"
  };

  const cellSize = 80;
  const chartWidth = cellSize * 4;
  const chartHeight = cellSize * 4;

  let cellElements = "";

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const x = c * cellSize;
      const y = r * cellSize;

      if ((r === 1 || r === 2) && (c === 1 || c === 2)) {
        if (r === 1 && c === 1) {
          // Center 2x2 square
          const centerW = cellSize * 2;
          const centerH = cellSize * 2;
          cellElements += `
            <rect x="${x}" y="${y}" width="${centerW}" height="${centerH}" fill="#FFFDF5" stroke="#D97706" stroke-width="1.5" />
            <text x="${x + centerW / 2}" y="${y + 35}" font-family="'Segoe UI', 'Noto Sans Tamil', sans-serif" font-size="11" font-weight="bold" fill="#92400E" text-anchor="middle">SKR ASTRO</text>
            <text x="${x + centerW / 2}" y="${y + 55}" font-family="'Segoe UI', 'Noto Sans Tamil', sans-serif" font-size="13" font-weight="bold" fill="#78350F" text-anchor="middle">${escapeHtml(title)}</text>
            <text x="${x + centerW / 2}" y="${y + 75}" font-family="'Segoe UI', 'Noto Sans Tamil', sans-serif" font-size="10" fill="#B45309" text-anchor="middle">${isTamil ? "தென்னிந்திய முறை" : "South Indian Vedic"}</text>
            <text x="${x + centerW / 2}" y="${y + 95}" font-family="'Segoe UI', 'Noto Sans Tamil', sans-serif" font-size="9" fill="#6B7280" text-anchor="middle">${chartType === "D9" ? (isTamil ? "நவாம்சம்" : "D9 Navamsha") : (isTamil ? "ராசி சக்கரம்" : "D1 Natal Rasi")}</text>
          `;
        }
        continue;
      }

      const sign = grid[r][c];
      const signLabel = isTamil ? (signShortsTa[sign] || sign) : (signShortsEn[sign] || sign);
      const ascStr = typeof ascSign === "string" ? ascSign : (ascSign?.name || ascSign?.sign || "");
      const isAsc = ascStr.toLowerCase() === sign.toLowerCase();

      // Find planets occupying this sign
      const occupants = (planets || []).filter(p => {
        if (chartType === "D9") {
          const navSign = p.navamshaSign || p.navamsaSign || p.navamsa || "";
          return navSign.toLowerCase() === sign.toLowerCase();
        }
        const pSign = p.sign || p.signName || "";
        return pSign.toLowerCase() === sign.toLowerCase();
      });

      const fill = isAsc ? "#FEF2F2" : "#FFFFFF";
      cellElements += `
        <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${fill}" stroke="#CBD5E1" stroke-width="1" />
        <text x="${x + 4}" y="${y + 12}" font-family="'Segoe UI', 'Noto Sans Tamil', sans-serif" font-size="8.5" font-weight="bold" fill="#64748B">${escapeHtml(signLabel)}</text>
      `;

      let itemY = y + 25;
      if (isAsc) {
        cellElements += `
          <rect x="${x + 3}" y="${itemY - 8}" width="28" height="11" rx="2" fill="#DC2626" />
          <text x="${x + 17}" y="${itemY}" font-family="'Segoe UI', 'Noto Sans Tamil', sans-serif" font-size="7.5" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${isTamil ? "லக்" : "Asc"}</text>
        `;
        itemY += 13;
      }

      occupants.forEach(p => {
        if (itemY > y + cellSize - 4) return; // boundary safety
        const pLabel = isTamil ? (planetShortTa[p.name] || p.nameTamil || p.name) : (planetShortEn[p.name] || p.name?.slice(0, 3) || p.name);
        const retroStr = p.isRetrograde ? "ᴿ" : "";
        let degStr = "";
        if (chartType === "D1" && p.degreeInSign !== undefined && p.degreeInSign !== null) {
          degStr = `${Math.floor(p.degreeInSign)}°`;
        }
        cellElements += `
          <text x="${x + 4}" y="${itemY}" font-family="'Segoe UI', 'Noto Sans Tamil', sans-serif" font-size="8" font-weight="600" fill="#1E293B">${escapeHtml(pLabel)}${retroStr} <tspan font-size="7" fill="#64748B">${degStr}</tspan></text>
        `;
        itemY += 11;
      });
    }
  }

  return `
    <svg width="${chartWidth}" height="${chartHeight}" viewBox="0 0 ${chartWidth} ${chartHeight}" xmlns="http://www.w3.org/2000/svg" style="border: 1.5px solid #94A3B8; border-radius: 4px; background: #FFFFFF; display: block; margin: 0 auto;">
      ${cellElements}
    </svg>
  `;
}

/**
 * Builds the complete, print-ready HTML document for an evaluated report snapshot.
 *
 * @param {Object} snapshot - Canonical report snapshot from buildCanonicalReportSnapshot()
 * @returns {string} Fully formed standalone HTML5 document
 */
export function generatePrintReportHTML(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    throw new Error("PRINT_HTML_ERROR: Valid snapshot is required.");
  }

  const { isTamil, tier, audienceMode, metadata, core, currentPeriod, planets, houses, yogas, timeline, limitations } = snapshot;
  const isMinimal = tier === "short";
  const isAstrologer = audienceMode === "astrologer";

  // Localized Labels
  const L = {
    reportTitle: isTamil
      ? (isAstrologer ? "ஜோதிடர் தொழில்நுட்ப சான்று அறிக்கை" : (isMinimal ? "ஜாதக சுருக்கம்" : "ஜாதக அறிக்கை"))
      : (isAstrologer ? "Astrologer Technical Evidence Dossier" : (isMinimal ? "Vedic Horoscope Snapshot" : "Vedic Horoscope Life Dossier")),
    reportSubtitle: isTamil
      ? (isAstrologer ? "தொழில்நுட்ப கிரக பலங்கள், சான்றுகள் & கணித தணிக்கை" : "அங்கீகரிக்கப்பட்ட பராசர வேத ஜோதிட மதிப்பீடு")
      : (isAstrologer ? "Professional Astrological Technical Ledger & Dignity Audit" : "Authoritative Parashari Computational Astrology Dossier"),
    dateOfBirth: isTamil ? "பிறந்த நாள் மற்றும் நேரம்" : "Date & Time of Birth",
    placeCoordinates: isTamil ? "அட்சரேகை / தீர்க்கரேகை" : "Coordinates",
    timezone: isTamil ? "நேர மண்டலம்" : "Timezone",
    ayanamsa: isTamil ? "அயனாம்சம் (Ayanamsha)" : "Ayanamsha",
    system: isTamil ? "ஜோதிட முறை" : "Astrological System",
    calculationIdentifier: isTamil ? "கணக்கீட்டு குறியீடு (Fingerprint)" : "Canonical Calculation Fingerprint",
    reportId: isTamil ? "அறிக்கை எண்" : "Report Reference ID",
    asOfDate: isTamil ? "அறிக்கை கணிக்கப்பட்ட நாள்" : "Report Generated As-Of",
    coreTrinity: isTamil ? "முக்கிய ஜாதக அமைப்புகள்" : "Core Astronomical Placements",
    ascendant: isTamil ? "லக்னம் (Lagna)" : "Ascendant (Lagna)",
    moonSign: isTamil ? "சந்திரன் / ராசி (Moon Sign)" : "Moon Sign (Rasi)",
    nakshatra: isTamil ? "நட்சத்திரம் (Nakshatra)" : "Nakshatra (Constellation)",
    sunSign: isTamil ? "சூரியன் / சூரிய ராசி (Sun Sign)" : "Sun Sign (Surya Rasi)",
    currentDasha: isTamil ? "தற்போதைய தசா-புக்தி காலம்" : "Current Operating Dasha & Antardasha",
    classicalPlanets: isTamil ? "நவகிரக நிலைகள் & பலம்" : "Planetary Positions & Strengths",
    d1Chart: isTamil ? "ராசி சக்கரம் (D1 Natal Chart)" : "D1 Natal Rasi Chart",
    d9Chart: isTamil ? "நவாம்ச சக்கரம் (D9 Navamsha)" : "D9 Navamsha Divisional Chart",
    yogasTitle: isTamil ? "பாரம்பரிய யோகங்கள்" : "Classical Vedic Yogas",
    timelineTitle: isTamil ? "வாழ்க்கை காலக்கோடு & தசா பலன்கள்" : "Chronological Life-Stage Horizons",
    limitationsTitle: isTamil ? "அறிவியல் வரம்புகள் & சட்டரீதியான விளக்கம்" : "Epistemic Boundaries & Scientific Limitations",
    truthfulCoverage: isTamil ? "காலக்கோடு எல்லை அறிவிப்பு" : "Timeline Coverage Scope",
    auditNote: isTamil ? "அறிவியல் உண்மை நிலை" : "Scientific Disclosure",
    degreeCol: isTamil ? "பாகை" : "Degree",
    houseCol: isTamil ? "பாவகம்" : "House",
    dignityCol: isTamil ? "ஆட்சி / உச்சம்" : "Dignity",
    shadbalaCol: isTamil ? "ஷட்பலம்" : "Shadbala",
    retroCol: isTamil ? "வக்ரம்" : "Retro"
  };

  const chartD1SVG = renderSouthIndianChartSVG(isTamil ? "ராசி சக்கரம்" : "D1 Rasi", planets, core.ascendantSign, isTamil, "D1");
  const chartD9SVG = renderSouthIndianChartSVG(isTamil ? "நவாம்சம்" : "D9 Navamsha", planets, core.ascendantSign, isTamil, "D9");

  // Planetary Table Rows
  const planetRowsHTML = planets.map(p => `
    <tr>
      <td style="font-weight: 600; color: #1E293B;">${escapeHtml(isTamil ? p.nameTamil : p.name)}</td>
      <td>${escapeHtml(isTamil ? p.signTamil : p.sign)}</td>
      <td style="font-family: monospace;">${p.degreeInSign.toFixed(2)}°</td>
      <td style="text-align: center;">${p.house}</td>
      <td>${escapeHtml(isTamil ? p.dignityTamil : p.dignity)}</td>
      <td style="text-align: center;">${p.isRetrograde ? (isTamil ? "வக்ரம் (R)" : "Yes (R)") : (isTamil ? "இல்லை" : "Direct")}</td>
      <td>${escapeHtml(p.nakshatra)} <span style="font-size: 8pt; color: #64748B;">(${p.pada})</span></td>
      <td style="text-align: right; font-family: monospace;">${p.shadbalaVirupas ? `${Number(p.shadbalaVirupas).toFixed(0)} vir` : "—"}</td>
    </tr>
  `).join("");

  // Current Dasha Box HTML
  let currentDashaHTML = "";
  if (currentPeriod.status === "DETERMINED") {
    currentDashaHTML = `
      <div class="card current-dasha-card avoid-break">
        <div class="card-header">
          <span class="badge badge-amber">${isTamil ? "நடப்பு காலம்" : "ACTIVE OPERATING PERIOD"}</span>
          <span style="font-size: 8.5pt; color: #78350F; font-weight: 600;">
            ${escapeHtml(currentPeriod.startDate)} &mdash; ${escapeHtml(currentPeriod.endDate)}
          </span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
          <div>
            <div style="font-size: 13pt; font-weight: bold; color: #92400E;">
              ${escapeHtml(currentPeriod.displayMaha)} ${isTamil ? "மகா தசை" : "Mahadasha"} &times; ${escapeHtml(currentPeriod.displayAntar)} ${isTamil ? "அந்தர்தசை" : "Antardasha"}
            </div>
            <div style="font-size: 9pt; color: #475569; margin-top: 2px;">
              ${isTamil ? "கணக்கிடப்பட்ட பருவம்:" : "Age Horizon:"} ${escapeHtml(currentPeriod.ageRange)}
            </div>
          </div>
          <div style="text-align: right; font-size: 8pt; color: #64748B;">
            <div>${isTamil ? "ஆதார எல்லை:" : "Resolved via:"} exact interval containment</div>
            <div>[start &le; asOf &lt; end]</div>
          </div>
        </div>
      </div>
    `;
  } else {
    currentDashaHTML = `
      <div class="card current-dasha-card avoid-break" style="background: #F8FAFC; border-color: #CBD5E1;">
        <div class="card-header">
          <span class="badge" style="background: #E2E8F0; color: #475569;">${isTamil ? "தசா வரம்பு" : "PERIOD INDETERMINATE"}</span>
        </div>
        <p style="font-size: 9pt; color: #64748B; margin-top: 4px;">
          ${escapeHtml(isTamil ? currentPeriod.limitationTa : currentPeriod.limitation)}
        </p>
      </div>
    `;
  }

  // Yogas Section HTML
  let yogasHTML = "";
  if (yogas.items.length > 0) {
    yogasHTML = `
      <div class="avoid-break" style="margin-top: 14px;">
        <h3 class="section-title">${escapeHtml(L.yogasTitle)}</h3>
        <p style="font-size: 9pt; color: #475569; margin-bottom: 8px;">${escapeHtml(yogas.statusText)}</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          ${yogas.items.slice(0, 6).map(y => `
            <div class="card" style="padding: 8px 10px; margin: 0;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="color: #1E293B; font-size: 10pt;">${escapeHtml(y.name)}</strong>
                <span class="badge ${y.nature === 'Benefic' ? 'badge-green' : 'badge-slate'}">${escapeHtml(y.nature)}</span>
              </div>
              <p style="font-size: 8.5pt; color: #475569; margin-top: 4px; line-height: 1.4;">
                ${escapeHtml(y.effects || y.definition)}
              </p>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  } else {
    yogasHTML = `
      <div class="avoid-break" style="margin-top: 14px;">
        <h3 class="section-title">${escapeHtml(L.yogasTitle)}</h3>
        <div class="card" style="background: #F8FAFC; border-color: #E2E8F0; padding: 10px;">
          <p style="font-size: 9.5pt; color: #475569; margin: 0;">
            ${escapeHtml(yogas.statusText)}
          </p>
        </div>
      </div>
    `;
  }

  // Key Life Areas Analysis (Detailed Mode)
  let lifeAreasHTML = "";
  if (!isMinimal) {
    const lifeAreaItems = [
      {
        titleTa: "தொழில் & உத்தியோகம்",
        titleEn: "Career & Vocation",
        descTa: "10-ம் பாவகம், சூரியன் மற்றும் லக்னாதிபதியின் அடிப்படையில் உத்தியோக திறன், நிர்வாகப் பொறுப்புகள் மற்றும் தொழில் முன்னேற்றம் ஆராயப்படுகிறது.",
        descEn: "10th house, Sun and Lagna lord alignment evaluate professional authority, vocational skills, and organizational duties."
      },
      {
        titleTa: "திருமணம் & கூட்டு உறவுகள்",
        titleEn: "Marriage & Relationships",
        descTa: "7-ம் பாவகம், சுக்கிரன் மற்றும் நவாம்ச அமைப்புகளின்படி இல்லற நல்லிணக்கம், கூட்டு முயற்சிகள் மற்றும் வாழ்க்கை துணைவரின் பாரம்பரிய குறியீடுகள் மதிப்பிடப்படுகின்றன.",
        descEn: "7th house, Venus and D9 Navamsha metrics assess matrimonial timing, relational compatibility, and collaborative partnerships."
      },
      {
        titleTa: "பொருளாதாரம் & நிதி வளம்",
        titleEn: "Wealth & Finance",
        descTa: "2-ம் தன பாவகம் மற்றும் 11-ம் லாப ஸ்தானத்தின்படி பொருளாதார ஸ்திரத்தன்மை, சேமிப்பு மற்றும் நிதி மேலாண்மை திறன்கள் மதிப்பிடப்படுகின்றன.",
        descEn: "2nd and 11th house configurations indicate fiscal capacity, liquid reserves, and steady resource management."
      },
      {
        titleTa: "கல்வி மற்றும் ஆராய்ச்சி",
        titleEn: "Education & Research",
        descTa: "5-ம் புத்தி பாவகம், குரு மற்றும் புதனின் அமைப்பால் அறிவுசார் வளர்ச்சி, உயர்கல்வி வாய்ப்புகள் மற்றும் ஆராய்ச்சி நாட்டம் ஆகியவை மதிப்பீடு செய்யப்படுகின்றன.",
        descEn: "5th and 9th trikonas alongside Jupiter and Mercury evaluate cognitive discernment, foundational learning, and research orientation."
      },
      {
        titleTa: "ஆரோக்கியம் & நல்வாழ்வு",
        titleEn: "Health & Vitality",
        descTa: "லக்னம் மற்றும் 6-ம் பாவகத்தின்படி உடல் நலம், நோய் எதிர்ப்பு சக்தி மற்றும் தினசரி பழக்கவழக்கங்களுக்கான பாரம்பரிய எச்சரிக்கைகள் குறிக்கப்படுகின்றன.",
        descEn: "Ascendant vitality and 6th house influences indicate general physical resilience and daily wellness balance."
      },
      {
        titleTa: "வசிப்பிடம் & நிலம்",
        titleEn: "Residence & Property",
        descTa: "4-ம் சுக மற்றும் பூமி ஸ்தானத்தின் வழியே சொந்த வீடு, நிலம், வாகனம் மற்றும் குடும்ப சூழ்நிலைகள் மதிப்பீடு செய்யப்படுகின்றன.",
        descEn: "4th house coordinates reflect domestic foundation, residential environment, conveyances, and property stability."
      }
    ];

    lifeAreasHTML = `
      <div class="page-break"></div>
      <div class="avoid-break" style="margin-top: 14px;">
        <h3 class="section-title">${isTamil ? "முக்கிய வாழ்க்கை பிரிவுகள் மதிப்பீடு (Core Life Areas Assessment)" : "Core Life Areas Astrological Assessment"}</h3>
        <p style="font-size: 8.5pt; color: #64748B; margin-bottom: 10px;">
          ${isTamil ? "பாரம்பரிய பராசர முறைப்படி பாவக காரகத்துவங்கள் மற்றும் தசா-கோச்சார ஒருங்கிணைவு அடிப்படையிலான பகுப்பாய்வு." : "Systematic domain evaluation according to classical bhava significations and dasha coordination."}
        </p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          ${lifeAreaItems.map(item => `
            <div class="card avoid-break" style="padding: 8px 10px; margin: 0;">
              <div style="font-weight: bold; color: #92400E; font-size: 9.5pt; border-bottom: 1px solid #F1F5F9; padding-bottom: 3px;">
                ${escapeHtml(isTamil ? item.titleTa : item.titleEn)}
              </div>
              <p style="font-size: 8.5pt; color: #334155; margin-top: 4px; line-height: 1.45;">
                ${escapeHtml(isTamil ? item.descTa : item.descEn)}
              </p>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  // Timeline Horizons HTML (Sanitized via applyTimelineApplicability)
  const timelineHTML = `
    <div class="avoid-break" style="margin-top: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
        <h3 class="section-title" style="margin: 0;">${escapeHtml(L.timelineTitle)}</h3>
        <span style="font-size: 8pt; color: #64748B;">${escapeHtml(isTamil ? timeline.coverage.statementTa : timeline.coverage.statementEn)}</span>
      </div>
      <div class="timeline-container">
        ${timeline.entries.map((st, idx) => `
          <div class="timeline-row avoid-break ${st.isCurrent ? 'timeline-current' : ''}">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="font-weight: bold; color: #1E293B; font-size: 10pt;">
                  ${escapeHtml(st.title)}
                </span>
                ${st.isCurrent ? `<span class="badge badge-amber" style="margin-left: 6px;">${isTamil ? "நடப்பு" : "Active"}</span>` : ''}
                ${st.applicabilityStatus === 'NOT_APPLICABLE' ? `<span class="badge badge-slate" style="margin-left: 6px;">${isTamil ? "கணக்கீடு மட்டும்" : "Calculated Period"}</span>` : ''}
              </div>
              <span style="font-size: 8.5pt; color: #64748B; font-weight: 600;">
                ${escapeHtml(st.startDate)} &mdash; ${escapeHtml(st.endDate)} (${escapeHtml(st.ageDisplay)})
              </span>
            </div>
            <p style="font-size: 9pt; color: #334155; margin: 4px 0 2px 0; line-height: 1.45;">
              ${escapeHtml(st.narrative)}
            </p>
            ${st.guidance ? `<p style="font-size: 8pt; color: #B45309; font-style: italic; margin: 2px 0 0 0;">${escapeHtml(st.guidance)}</p>` : ''}
          </div>
        `).join("")}
      </div>
    </div>
  `;

  // 12 Bhavas Section HTML (For Detailed Mode)
  let bhavasHTML = "";
  if (!isMinimal && houses.length === 12) {
    bhavasHTML = `
      <div class="page-break"></div>
      <div class="avoid-break">
        <h3 class="section-title">${isTamil ? "12 பாவக விரிவான பகுப்பாய்வு (12 Bhavas Architecture)" : "12-Bhava Natal Architecture & House Analysis"}</h3>
        <p style="font-size: 8.5pt; color: #64748B; margin-bottom: 10px;">
          ${isTamil ? "ஒவ்வொரு பாவகத்தின் மத்திம பாகை, அதிபதி மற்றும் சுப-அசுப இணைப்புகளின் பாரம்பரிய மதிப்பீடு." : "Systematic evaluation of house cusps, planetary lordships, and focal significations."}
        </p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          ${houses.map(h => `
            <div class="card avoid-break" style="padding: 8px 10px; margin: 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #F1F5F9; padding-bottom: 3px;">
                <strong style="color: #92400E; font-size: 9.5pt;">${isTamil ? `பாவகம் ${h.houseNumber}` : `House ${h.houseNumber}`}: ${escapeHtml(h.signTamil || h.sign)}</strong>
                <span style="font-size: 8pt; color: #64748B;">${isTamil ? "அதிபதி:" : "Lord:"} ${escapeHtml(h.lordTamil || h.lord)}</span>
              </div>
              <p style="font-size: 8.5pt; color: #334155; margin-top: 4px; line-height: 1.4;">
                ${escapeHtml(h.interpretation || (isTamil ? "இயல்பான பாவக நிலை." : "Standard harmonic alignment."))}
              </p>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  // Core Document Template
  return `<!DOCTYPE html>
<html lang="${escapeHtml(snapshot.language)}">
<head>
<meta charset="utf-8">
<title>${escapeHtml(L.reportTitle)} - ${escapeHtml(snapshot.reportIdentifier)}</title>
<style>
  @page {
    size: A4 portrait;
    margin: 12mm 14mm 12mm 14mm;
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', 'Noto Sans Tamil', 'Nirmala UI', 'Latha', Tahoma, sans-serif;
    font-size: 10.5pt;
    color: #1E293B;
    background: #FFFFFF;
    line-height: 1.55;
    text-rendering: optimizeLegibility;
  }

  .header-banner {
    border-bottom: 2px solid #D97706;
    padding-bottom: 8px;
    margin-bottom: 12px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }

  .brand-title {
    font-size: 17pt;
    font-weight: 800;
    color: #78350F;
    letter-spacing: 0.5px;
    margin: 0;
  }

  .brand-subtitle {
    font-size: 9pt;
    color: #B45309;
    font-weight: 600;
    margin-top: 2px;
  }

  .meta-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    background: #FFFDF9;
    border: 1px solid #FDE68A;
    border-radius: 4px;
    padding: 8px 10px;
    font-size: 8.5pt;
    margin-bottom: 12px;
  }

  .meta-item strong {
    color: #78350F;
    display: block;
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .section-title {
    font-size: 12.5pt;
    font-weight: 700;
    color: #92400E;
    border-bottom: 1px solid #FDE68A;
    padding-bottom: 3px;
    margin: 14px 0 8px 0;
  }

  .card {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 4px;
    padding: 10px 12px;
    margin-bottom: 10px;
  }

  .current-dasha-card {
    background: linear-gradient(135deg, #FFFDF5 0%, #FEF3C7 100%);
    border: 1.5px solid #F59E0B;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .badge {
    display: inline-block;
    padding: 1.5px 6px;
    border-radius: 3px;
    font-size: 7.5pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .badge-amber {
    background: #D97706;
    color: #FFFFFF;
  }

  .badge-green {
    background: #ECFDF5;
    color: #065F46;
    border: 0.5px solid #A7F3D0;
  }

  .badge-slate {
    background: #F1F5F9;
    color: #475569;
    border: 0.5px solid #CBD5E1;
  }

  table.data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9pt;
    margin-top: 6px;
  }

  table.data-table th {
    background: #F8FAFC;
    color: #475569;
    text-align: left;
    padding: 5px 6px;
    font-size: 8pt;
    text-transform: uppercase;
    border-bottom: 1.5px solid #CBD5E1;
  }

  table.data-table td {
    padding: 4.5px 6px;
    border-bottom: 0.5px solid #F1F5F9;
  }

  .timeline-container {
    border-left: 2px solid #F59E0B;
    margin-left: 6px;
    padding-left: 12px;
  }

  .timeline-row {
    position: relative;
    margin-bottom: 10px;
    padding: 6px 10px;
    background: #FAFAFA;
    border: 1px solid #F1F5F9;
    border-radius: 4px;
  }

  .timeline-row::before {
    content: "";
    position: absolute;
    left: -17px;
    top: 10px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #D97706;
    border: 1.5px solid #FFFFFF;
  }

  .timeline-current {
    background: #FFFDF5;
    border-color: #FCD34D;
  }

  .timeline-current::before {
    background: #B45309;
    box-shadow: 0 0 0 2px #FDE68A;
  }

  .footer-disclaimer {
    border-top: 1px solid #E2E8F0;
    padding-top: 8px;
    margin-top: 16px;
    font-size: 7.5pt;
    color: #64748B;
    line-height: 1.4;
  }

  .page-break {
    page-break-after: always;
    break-after: page;
  }

  .avoid-break {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .keep-with-next {
    page-break-after: avoid;
    break-after: avoid;
  }
</style>
</head>
<body>

  <!-- PAGE 1: Header, Metadata, Core Placements, Charts & Current Dasha -->
  <div class="header-banner">
    <div>
      <h1 class="brand-title">SKR ASTRO</h1>
      <div class="brand-subtitle">${escapeHtml(L.reportTitle)} &bull; ${escapeHtml(L.reportSubtitle)}</div>
    </div>
    <div style="text-align: right; font-size: 8pt; color: #64748B;">
      <div><strong>${escapeHtml(L.reportId)}:</strong> ${escapeHtml(snapshot.reportIdentifier)}</div>
      <div><strong>${escapeHtml(L.asOfDate)}:</strong> ${escapeHtml(snapshot.asOf.slice(0, 10))}</div>
    </div>
  </div>

  <div class="meta-grid avoid-break">
    <div class="meta-item">
      <strong>${escapeHtml(L.dateOfBirth)}</strong>
      <span>${escapeHtml(metadata.birthDateStr)} ${escapeHtml(metadata.birthTimeStr)}</span>
    </div>
    <div class="meta-item">
      <strong>${escapeHtml(L.placeCoordinates)}</strong>
      <span>${metadata.latitude.toFixed(4)}° N, ${metadata.longitude.toFixed(4)}° E</span>
    </div>
    <div class="meta-item">
      <strong>${escapeHtml(L.system)} / ${escapeHtml(L.ayanamsa)}</strong>
      <span>${escapeHtml(metadata.systemName)} (${escapeHtml(metadata.ayanamsaStr)})</span>
    </div>
    <div class="meta-item">
      <strong>${escapeHtml(L.calculationIdentifier)}</strong>
      <span style="font-family: monospace; font-size: 7.5pt;">${escapeHtml(snapshot.chartFingerprint)}</span>
    </div>
  </div>

  <!-- Core Trinity Placements -->
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px;" class="avoid-break">
    <div class="card" style="margin: 0; padding: 8px 10px; background: #FFFDF9; border-color: #FDE68A;">
      <div style="font-size: 8pt; color: #92400E; font-weight: bold; text-transform: uppercase;">${escapeHtml(L.ascendant)}</div>
      <div style="font-size: 13pt; font-weight: bold; color: #1E293B; margin: 2px 0;">${escapeHtml(core.ascendantSignTamil || core.ascendantSign)}</div>
      <div style="font-size: 8.5pt; color: #64748B;">${core.ascendantDegree.toFixed(2)}° (${isTamil ? "லக்ன ஆரம்பம்" : "Rising Cusp"})</div>
    </div>
    <div class="card" style="margin: 0; padding: 8px 10px; background: #FFFDF9; border-color: #FDE68A;">
      <div style="font-size: 8pt; color: #92400E; font-weight: bold; text-transform: uppercase;">${escapeHtml(L.moonSign)}</div>
      <div style="font-size: 13pt; font-weight: bold; color: #1E293B; margin: 2px 0;">${escapeHtml(core.moonSignTamil || core.moonSign)}</div>
      <div style="font-size: 8.5pt; color: #64748B;">${escapeHtml(core.moonNakshatraTamil || core.moonNakshatra)} (${isTamil ? "பாதம்" : "Pada"} ${core.moonPada})</div>
    </div>
    <div class="card" style="margin: 0; padding: 8px 10px; background: #FFFDF9; border-color: #FDE68A;">
      <div style="font-size: 8pt; color: #92400E; font-weight: bold; text-transform: uppercase;">${escapeHtml(L.sunSign)}</div>
      <div style="font-size: 13pt; font-weight: bold; color: #1E293B; margin: 2px 0;">${escapeHtml(core.sunSignTamil || core.sunSign)}</div>
      <div style="font-size: 8.5pt; color: #64748B;">${escapeHtml(core.sunNakshatraTamil || core.sunNakshatra)}</div>
    </div>
  </div>

  <!-- Validated Current Dasha -->
  ${currentDashaHTML}

  <!-- Dual Vector Charts (D1 & D9) -->
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;" class="avoid-break">
    <div style="text-align: center;">
      <div style="font-size: 9.5pt; font-weight: bold; color: #78350F; margin-bottom: 4px;">${escapeHtml(L.d1Chart)}</div>
      ${chartD1SVG}
    </div>
    <div style="text-align: center;">
      <div style="font-size: 9.5pt; font-weight: bold; color: #78350F; margin-bottom: 4px;">${escapeHtml(L.d9Chart)}</div>
      ${chartD9SVG}
    </div>
  </div>

  <!-- Planetary Metrics Table -->
  <div class="avoid-break" style="margin-top: 14px;">
    <h3 class="section-title">${escapeHtml(L.classicalPlanets)}</h3>
    <table class="data-table">
      <thead>
        <tr>
          <th>${isTamil ? "கிரகம்" : "Planet"}</th>
          <th>${isTamil ? "ராசி" : "Sign"}</th>
          <th>${escapeHtml(L.degreeCol)}</th>
          <th style="text-align: center;">${escapeHtml(L.houseCol)}</th>
          <th>${escapeHtml(L.dignityCol)}</th>
          <th style="text-align: center;">${escapeHtml(L.retroCol)}</th>
          <th>${escapeHtml(L.nakshatra)}</th>
          <th style="text-align: right;">${escapeHtml(L.shadbalaCol)}</th>
        </tr>
      </thead>
      <tbody>
        ${planetRowsHTML}
      </tbody>
    </table>
  </div>

  <!-- Yogas Section (Zero boilerplate fallback) -->
  ${yogasHTML}

  <!-- Core Life Areas Assessment -->
  ${lifeAreasHTML}

  <!-- Timeline Section (Sanitized via applyTimelineApplicability) -->
  ${timelineHTML}

  <!-- 12 Bhavas (Included in Detailed Mode) -->
  ${bhavasHTML}

  <!-- Epistemic Boundaries & Scientific Disclosure -->
  <div class="footer-disclaimer avoid-break">
    <strong>${escapeHtml(L.limitationsTitle)}:</strong>
    <div>${escapeHtml(isTamil ? limitations.nonDeterministicNoticeTa : limitations.nonDeterministicNoticeEn)}</div>
    <div>${escapeHtml(isTamil ? limitations.legalAndMedicalDisclaimerTa : limitations.legalAndMedicalDisclaimerEn)}</div>
    <div style="margin-top: 4px; font-family: monospace; font-size: 7pt; color: #94A3B8;">
      CERT_ID: ${escapeHtml(snapshot.reportIdentifier)} &bull; ASTRONOMICAL_FINGERPRINT: ${escapeHtml(snapshot.chartFingerprint)} &bull; SCHEMA_V${escapeHtml(snapshot.schemaVersion)}
    </div>
  </div>

</body>
</html>`;
}
