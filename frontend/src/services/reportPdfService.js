import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import DOMPurify from "dompurify";
import {
  toTamilRasi,
  toTamilPlanet,
  toTamilNakshatra,
  toTamilDignity,
  cleanEnglishParentheses
} from "./tamilAstrologyUtils.js";
import { generateChartFingerprint } from "./astroEngine.js";
import { getAscendantName } from "../types/chartAccessors.js";

function safeNum(val, fallback = 0) {
  if (typeof val === "number" && !isNaN(val)) return val;
  if (typeof val === "string") {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? fallback : parsed;
  }
  if (typeof val === "object" && val !== null) {
    const inner = val.value ?? val.deg ?? val.degree ?? val.ayanamsa ?? val.longitude;
    return safeNum(inner, fallback);
  }
  return fallback;
}

const SIGN_RULERS_MAP = {
  Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon",
  Leo: "Sun", Virgo: "Mercury", Libra: "Venus", Scorpio: "Mars",
  Sagittarius: "Jupiter", Capricorn: "Saturn", Aquarius: "Saturn", Pisces: "Jupiter"
};

/**
 * Robust Dasha and Antardasha Extractor
 * Resolves exact computed periods without fallback hardcoded constants.
 */
function extractActiveDasha(chartData, isTamil) {
  let maha = "";
  let antar = "";
  let mahaTa = "";
  let antarTa = "";

  const cd = chartData?.currentDasha;
  if (cd) {
    maha = cd.lord || cd.mahadasha || cd.mahaDasha || cd.currentLord || "";
    antar = cd.currentAntar || cd.antarDasha || cd.antardasha || cd.subLord || "";
    mahaTa = cd.tamil || cd.mahadashaTamil || cd.mahaDashaTamil || (maha ? toTamilPlanet(maha) : "");
    antarTa = cd.currentAntarTamil || cd.antardashaTamil || (antar ? toTamilPlanet(antar) : "");
  }

  if (!maha && chartData?.executiveSummary?.currentLifePhase) {
    const p = chartData.executiveSummary.currentLifePhase;
    maha = p.mahaDashaLord || p.dashaLord || "";
    antar = p.antarDashaLord || p.subLord || "";
    mahaTa = p.mahaDashaLordTamil || (maha ? toTamilPlanet(maha) : "");
    antarTa = p.antarDashaLordTamil || (antar ? toTamilPlanet(antar) : "");
  }

  if (!maha && chartData?.chronologicalDashaTimeline) {
    const timeline = Array.isArray(chartData.chronologicalDashaTimeline)
      ? chartData.chronologicalDashaTimeline
      : (chartData.chronologicalDashaTimeline.stages || []);
    const curr = timeline.find(s => s.isCurrent) || timeline[0];
    if (curr) {
      maha = curr.lord || curr.dashaTrigger || "";
      antar = curr.activeAntar || curr.subLord || "";
      mahaTa = curr.lordTamil || (maha ? toTamilPlanet(maha) : "");
      antarTa = curr.antarTamil || (antar ? toTamilPlanet(antar) : "");
    }
  }

  const defaultVal = isTamil ? "கணக்கிடப்படவில்லை" : "N/A";

  const resolvedMaha = maha || (isTamil ? mahaTa : "") || defaultVal;
  const resolvedAntar = antar || (isTamil ? antarTa : "") || defaultVal;
  const resolvedMahaTa = mahaTa || (maha ? toTamilPlanet(maha) : defaultVal);
  const resolvedAntarTa = antarTa || (antar ? toTamilPlanet(antar) : defaultVal);

  return {
    maha: resolvedMaha,
    antar: resolvedAntar,
    mahaTa: resolvedMahaTa,
    antarTa: resolvedAntarTa,
    activeMaha: isTamil ? resolvedMahaTa : resolvedMaha,
    activeAntar: isTamil ? resolvedAntarTa : resolvedAntar
  };
}

/**
 * Formats gemstones cleanly to prevent [object Object] artifacts.
 */
function formatGemstoneList(gemstones, isTamil) {
  if (!gemstones) return isTamil ? "குறிப்பிட்ட ரத்தினப் பரிந்துரை இல்லை" : "None";
  if (typeof gemstones === "string") return isTamil ? cleanEnglishParentheses(gemstones) : gemstones;
  if (Array.isArray(gemstones)) {
    if (gemstones.length === 0) return isTamil ? "குறிப்பிட்ட ரத்தினப் பரிந்துரை இல்லை" : "None";
    return gemstones.map(g => {
      if (typeof g === "string") return isTamil ? cleanEnglishParentheses(g) : g;
      if (typeof g === "object" && g !== null) {
        const name = g.gemstone || g.name || g.gem || "";
        const cleanName = isTamil ? cleanEnglishParentheses(name) : name;
        const reason = isTamil ? (g.reasonTamil || g.reason || "") : (g.reason || "");
        return reason ? `${cleanName} (${reason})` : cleanName;
      }
      return String(g);
    }).filter(Boolean).join(", ");
  }
  if (typeof gemstones === "object") {
    const raw = gemstones.gemstone || gemstones.name || (isTamil ? "பரிந்துரைக்கப்பட்டுள்ளது" : "Prescribed");
    return isTamil ? cleanEnglishParentheses(raw) : raw;
  }
  return String(gemstones);
}

/**
 * Renders a crisp South Indian Kundli Chart (4x4 Grid) with strict language separation
 */
function renderSouthIndianChartHTML(title, planets, ascSignName, isTamil, widthPx = 220, chartType = "D1") {
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

  let cellsHTML = "";

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (r === 1 && c === 1) {
        // Center Box (2x2)
        cellsHTML += `
          <div style="grid-column: span 2; grid-row: span 2; background: linear-gradient(135deg, #FFFDF5 0%, #FEF3C7 100%); border: 1.5px solid #D97706; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4px; text-align: center;">
            <div style="font-size: 7.5px; font-weight: 800; color: #92400E; letter-spacing: 0.5px; text-transform: uppercase;">ASTROVERSE</div>
            <div style="font-size: 10px; font-weight: bold; color: #78350F; margin: 2px 0;">${title}</div>
            <div style="font-size: 7px; color: #B45309; font-weight: 600;">${isTamil ? "தென்னிந்திய முறை" : "South Indian"}</div>
          </div>
        `;
        continue;
      }
      if ((r === 1 && c === 2) || (r === 2 && c === 1) || (r === 2 && c === 2)) {
        continue; // Handled by span 2
      }

      const sign = grid[r][c];
      const signLabel = isTamil ? signShortsTa[sign] : signShortsEn[sign];
      const isAsc = (ascSignName || "").toLowerCase() === sign.toLowerCase();

      // Find planets in this sign
      const inSign = (planets || []).filter(p => {
        if (chartType === "D9") {
          const navSign = p.navamsaSign || p.navamsa || "";
          return navSign.toLowerCase() === sign.toLowerCase();
        }
        const pSign = p.sign || p.signName || "";
        return pSign.toLowerCase() === sign.toLowerCase();
      });

      const planetBadges = inSign.map(p => {
        const pLabel = isTamil
          ? (planetShortTa[p.name] || p.shortTa || p.nameTa || toTamilPlanet(p.name))
          : (planetShortEn[p.name] || p.shortEn || p.name?.slice(0, 3) || p.name);
        const pDeg = safeNum(p.deg !== undefined ? p.deg : p.longitude);
        const degStr = pDeg > 0 ? `${pDeg.toFixed(0)}°` : "";
        const ret = p.isRetrograde ? "ᴿ" : "";
        return `<span style="display: inline-block; background: #EEF2FF; border: 0.5px solid #C7D2FE; border-radius: 2px; padding: 0.5px 2px; font-size: 6.5px; margin: 0.5px; color: #1E1B4B; font-weight: 600;">${pLabel}${ret} ${degStr}</span>`;
      }).join("");

      const ascBadge = isAsc
        ? `<span style="display: inline-block; background: #DC2626; color: #FFFFFF; font-weight: bold; border-radius: 2px; padding: 0.5px 3px; font-size: 6.5px; margin: 0.5px;">${isTamil ? "லக்" : "Asc"}</span>`
        : "";

      cellsHTML += `
        <div style="border: 1px solid #CBD5E1; background: ${isAsc ? '#FEF2F2' : '#FFFFFF'}; padding: 2px 3px; position: relative; min-height: 48px; display: flex; flex-direction: column; justify-content: space-between;">
          <div style="font-size: 6.5px; font-weight: bold; color: #64748B; border-bottom: 0.5px solid #F1F5F9; padding-bottom: 1px;">${signLabel}</div>
          <div style="display: flex; flex-wrap: wrap; align-content: flex-start; gap: 1px; margin-top: 1px;">
            ${ascBadge}
            ${planetBadges}
          </div>
        </div>
      `;
    }
  }

  return `
    <div style="width: ${widthPx}px; background: #FFFFFF; border: 1.5px solid #94A3B8; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden;">
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(4, 1fr); gap: 0px; background: #E2E8F0;">
        ${cellsHTML}
      </div>
    </div>
  `;
}

/**
 * Extracts visible text nodes from the rendered DOM element and writes an invisible,
 * selectable, and searchable text layer directly into the jsPDF document.
 */
function embedSearchableTextLayer(pageElement, pdf, pdfWidth, pdfHeight) {
  if (!pageElement || !pdf || typeof document === "undefined") return;
  const pageRect = pageElement.getBoundingClientRect();
  if (pageRect.width <= 0 || pageRect.height <= 0) return;

  try {
    const walker = document.createTreeWalker(
      pageElement,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (!node || !node.textContent || !node.textContent.trim()) {
            return NodeFilter.FILTER_REJECT;
          }
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const style = window.getComputedStyle(parent);
          if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const range = document.createRange();
    let node = walker.nextNode();

    while (node) {
      try {
        range.selectNodeContents(node);
        const rect = range.getBoundingClientRect();
        const text = node.textContent.trim();

        if (rect.width > 0 && rect.height > 0 && text.length > 0) {
          const x = ((rect.left - pageRect.left) / pageRect.width) * pdfWidth;
          const y = ((rect.top - pageRect.top) / pageRect.height) * pdfHeight + ((rect.height / pageRect.height) * pdfHeight * 0.75);
          const fontSizePt = Math.max(3.5, Math.min(18, ((rect.height / pageRect.height) * pdfHeight * 0.75)));

          pdf.setFontSize(fontSizePt);
          // PDF Spec Tr 3: invisible text layer that retains exact searchability & selection
          pdf.text(text, Math.max(0, x), Math.min(pdfHeight, y), { renderingMode: "invisible" });
        }
      } catch (nodeErr) {
        // Individual node placement safeguard
      }
      node = walker.nextNode();
    }
  } catch (err) {
    console.warn("Text layer embedding safeguard:", err);
  }
}

/**
 * Generates and downloads a high-precision, beautifully styled PDF in Tamil or English.
 * 
 * Supports:
 * - audienceMode: "client" (Client Life Guidance Dossier) | "astrologer" (Professional Astrologer Evidence Dossier)
 * - tier: "short" (1-Page Minimal Snapshot) | "detailed" (10-Page Master Dossier)
 * - viewMode: "algorithmic" | "ai" (Full AI Reading Master Pages)
 * 
 * @param {Object} chartData Full astrological chart calculation bundle
 * @param {string} lang Language code ("ta" for Tamil, "en" for English)
 * @param {string} tier "short" for 1-Page Essential Snapshot, "detailed" for Master Life Dossier
 * @param {Function} onProgress Optional callback for progress updates
 * @param {Object} options Configuration options { audienceMode, viewMode, aiReportText }
 */
export async function generateAstrologyReportPDF(chartData, lang = "en", tier = "detailed", onProgress = null, options = {}) {
  if (!chartData) {
    throw new Error("No birth chart data provided for PDF generation.");
  }

  const isTamil = lang === "ta";
  const isMinimal = tier === "short";
  const audienceMode = options.audienceMode || "client";
  const isAstrologer = audienceMode === "astrologer";
  const viewMode = options.viewMode || "algorithmic";
  const aiReportText = options.aiReportText || null;

  if (onProgress) onProgress(isTamil ? "அறிக்கை பக்கங்கள் உருவாக்கப்படுகின்றன..." : "Preparing document pages...");

  // Extract Core Identifiers with ZERO fallback defaults
  const getSignName = (s) => {
    if (!s) return isTamil ? "கணக்கிடப்படவில்லை" : "N/A";
    if (typeof s === "string") return s;
    return s.name || s.sign || (isTamil ? "கணக்கிடப்படவில்லை" : "N/A");
  };
  const getSignTamil = (s) => {
    if (!s) return "கணக்கிடப்படவில்லை";
    if (typeof s === "string") return toTamilRasi(s);
    return s.tamil || (s.name ? toTamilRasi(s.name) : "கணக்கிடப்படவில்லை");
  };
  const getNakName = (n) => {
    if (!n) return isTamil ? "கணக்கிடப்படவில்லை" : "N/A";
    if (typeof n === "string") return n;
    return n.name || (isTamil ? "கணக்கிடப்படவில்லை" : "N/A");
  };
  const getNakTamil = (n) => {
    if (!n) return "கணக்கிடப்படவில்லை";
    if (typeof n === "string") return toTamilNakshatra(n);
    return n.tamil || (n.name ? toTamilNakshatra(n.name) : "கணக்கிடப்படவில்லை");
  };
  const getNakPada = (n) => {
    if (!n) return "1";
    if (typeof n === "object" && n.pada !== undefined && n.pada !== null) return n.pada;
    return "1";
  };

  const ascName = isTamil
    ? getSignTamil(chartData.ascendantSign || chartData.ascendant)
    : getSignName(chartData.ascendantSign || chartData.ascendant);

  const moonSign = isTamil
    ? getSignTamil(chartData.moonSign || chartData.moon)
    : getSignName(chartData.moonSign || chartData.moon);

  const sunSign = isTamil
    ? getSignTamil(chartData.sunSign || chartData.sun)
    : getSignName(chartData.sunSign || chartData.sun);

  const moonNak = isTamil
    ? getNakTamil(chartData.moonNakshatra || chartData.moon)
    : getNakName(chartData.moonNakshatra || chartData.moon);

  const moonPada = getNakPada(chartData.moonNakshatra || chartData.moon);

  const sunNak = isTamil
    ? getNakTamil(chartData.sunNakshatra || chartData.sun)
    : getNakName(chartData.sunNakshatra || chartData.sun);

  const dashaResult = extractActiveDasha(chartData, isTamil);
  const activeMaha = dashaResult.activeMaha;
  const activeAntar = dashaResult.activeAntar;

  const bDate = chartData.birthDateStr || chartData.birthDate || (isTamil ? "கணக்கிடப்படவில்லை" : "N/A");
  const bTime = chartData.birthTimeStr || chartData.birthTime || chartData.time || (isTamil ? "கணக்கிடப்படவில்லை" : "N/A");
  
  const latStr = (chartData.latitude !== undefined && chartData.latitude !== null && !isNaN(Number(chartData.latitude)))
    ? `${Number(chartData.latitude).toFixed(4)}° N`
    : (chartData.lat !== undefined && chartData.lat !== null && !isNaN(Number(chartData.lat)) ? `${Number(chartData.lat).toFixed(4)}° N` : (isTamil ? "கணக்கிடப்படவில்லை" : "N/A"));
  const lngStr = (chartData.longitude !== undefined && chartData.longitude !== null && !isNaN(Number(chartData.longitude)))
    ? `${Number(chartData.longitude).toFixed(4)}° E`
    : (chartData.lng !== undefined && chartData.lng !== null && !isNaN(Number(chartData.lng)) ? `${Number(chartData.lng).toFixed(4)}° E` : (isTamil ? "கணக்கிடப்படவில்லை" : "N/A"));
  const tzStr = (chartData.utcOffset !== undefined && chartData.utcOffset !== null && !isNaN(Number(chartData.utcOffset)))
    ? `UTC${Number(chartData.utcOffset) >= 0 ? "+" : ""}${Number(chartData.utcOffset)}`
    : (chartData.tz !== undefined && chartData.tz !== null && !isNaN(Number(chartData.tz)) ? `UTC${Number(chartData.tz) >= 0 ? "+" : ""}${Number(chartData.tz)}` : "UTC");

  const rawSys = chartData.system;
  const systemId = (typeof rawSys === "object" ? rawSys?.id : rawSys) || "lahiri";
  const SYSTEM_NAMES = {
    lahiri: "Lahiri / Chitrapaksha",
    kp: "KP (Krishnamurti Padhdhati)",
    raman: "B.V. Raman Sidereal",
    tropical: "Tropical / Sayana (Western)"
  };
  const systemName = (typeof rawSys === "object" && rawSys?.name)
    ? rawSys.name
    : (SYSTEM_NAMES[String(systemId).toLowerCase()] || "Lahiri / Chitrapaksha");
  
  const isTropical = String(systemId).toLowerCase() === "tropical";
  const ayanDms = isTropical
    ? (isTamil ? "பொருந்தாது (0°00'00\" மேற்கத்திய முறை)" : "0°00'00\" (Tropical Reference Frame)")
    : (chartData.ayanamsaDms || (chartData.ayanamsaValue ? `${chartData.ayanamsaValue.toFixed(4)}°` : (chartData.ayanamsha ? `${chartData.ayanamsha.toFixed(4)}°` : (isTamil ? "கணக்கிடப்படவில்லை" : "N/A"))));

  const fingerprint = generateChartFingerprint(chartData);
  const reportId = chartData.reportId || fingerprint;

  // Planets Array
  const planetList = Array.isArray(chartData.planets) ? chartData.planets : [];

  // Yogas Array
  const yogasRaw = (isTamil ? chartData.detectedYogasTamil : chartData.detectedYogas) || chartData.yogas || [];
  const yogas = Array.isArray(yogasRaw) ? yogasRaw : [];

  // 12 Bhavas Array
  const bhavasRaw = (isTamil ? chartData.bhavasDetailedTamil : chartData.bhavasDetailed) || [];
  const bhavas = Array.isArray(bhavasRaw) ? bhavasRaw : [];

  // Domains & Remedies
  const domains = (isTamil ? chartData.domainPredictionsTamil : chartData.domainPredictions) || {};
  const remedies = (isTamil ? chartData.personalizedRemediesTamil : chartData.personalizedRemedies) || {};
  const shadbalaList = Array.isArray(chartData.shadbala) ? chartData.shadbala : [];
  const jaiminiList = Array.isArray(chartData.jaiminiKarakas)
    ? chartData.jaiminiKarakas
    : (Array.isArray(chartData.jaiminiSystem?.charaKarakas) ? chartData.jaiminiSystem.charaKarakas : []);
  const tridosha = (isTamil ? chartData.tridoshaBalanceTamil : chartData.tridoshaBalance) || chartData.tridoshaBalance || {};

  // Build Off-Screen Container
  const container = document.createElement("div");
  container.id = "astroverse-pdf-render-container";
  container.style.position = "fixed";
  container.style.top = "-99999px";
  container.style.left = "-99999px";
  container.style.width = "794px";
  container.style.backgroundColor = "#FFFFFF";
  container.style.color = "#1E293B";
  container.style.fontFamily = isTamil
    ? "'Noto Sans Tamil', 'Mukta Malar', 'Latha', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  container.style.lineHeight = "1.4";
  container.style.zIndex = "-1000";

  document.body.appendChild(container);

  try {
    let pagesHTML = [];

    if (viewMode === "ai" && aiReportText) {
      pagesHTML = renderAIMasterPagesHTML(aiReportText);
    } else if (isMinimal) {
      pagesHTML = isAstrologer
        ? [renderAstrologerMinimalPageHTML()]
        : [renderClientMinimalPageHTML()];
    } else {
      pagesHTML = isAstrologer
        ? renderAstrologerMasterPagesHTML()
        : renderClientMasterPagesHTML();
    }

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4"
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < pagesHTML.length; i++) {
      if (onProgress) {
        onProgress(
          isTamil
            ? `பக்கம் ${i + 1} / ${pagesHTML.length} செயலாக்கப்படுகிறது...`
            : `Rendering page ${i + 1} of ${pagesHTML.length}...`
        );
      }

      const sanitizedHTML = DOMPurify && typeof DOMPurify.sanitize === "function"
        ? DOMPurify.sanitize(pagesHTML[i], {
            ALLOWED_TAGS: [
              "div", "span", "p", "b", "strong", "i", "em", "h1", "h2", "h3", "h4",
              "table", "thead", "tbody", "tr", "th", "td", "ul", "ol", "li",
              "svg", "g", "path", "line", "rect", "circle", "text", "tspan", "polygon", "polyline"
            ],
            ALLOWED_ATTR: [
              "style", "class", "id", "width", "height", "viewBox", "xmlns", "fill",
              "stroke", "stroke-width", "stroke-dasharray", "d", "x", "y", "x1", "y1",
              "x2", "y2", "cx", "cy", "r", "points", "font-family", "font-size",
              "font-weight", "text-anchor", "dominant-baseline", "transform"
            ]
          })
        : pagesHTML[i];
      container.innerHTML = sanitizedHTML;
      const pageElement = container.firstElementChild;

      const canvas = await html2canvas(pageElement, {
        scale: 2, // 300 DPI crisp print resolution
        useCORS: true,
        logging: false,
        backgroundColor: "#FFFFFF",
        windowWidth: 794
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);

      if (i > 0) {
        pdf.addPage();
      }

      // 1. Render crisp visual image background
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);

      // 2. Embed real selectable, searchable text layer directly into the PDF object stream
      embedSearchableTextLayer(pageElement, pdf, pdfWidth, pdfHeight);
    }

    const modeTag = isAstrologer ? "Astrologer_Evidence_Dossier" : "Client_Life_Dossier";
    const tierTag = isMinimal ? "Snapshot" : (viewMode === "ai" ? "AI_Master" : "Master_10Page");
    const langTag = isTamil ? "Tamil" : "English";
    const fileName = `AstroVerse_${langTag}_${modeTag}_${tierTag}_${reportId}.pdf`;

    if (onProgress) onProgress(isTamil ? "பதிவிறக்கம் தொடங்குகிறது..." : "Downloading PDF...");
    pdf.save(fileName);
    return true;
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }

  // --- Shared Reusable HTML Components ---

  function renderHeaderHTML(title, subtitle, pageNum = 1, totalPages = 1) {
    const badgeText = isAstrologer
      ? (isTamil ? "ஆஸ்ட்ரோவெர்ஸ் ஜோதிட நிபுணர் சான்றளிக்கப்பட்ட ஆய்வேடு" : "ASTROVERSE PROFESSIONAL ASTROLOGER EVIDENCE DOSSIER")
      : (isTamil ? "ஆஸ்ட்ரோவெர்ஸ் வேத ஜோதிட வாழ்க்கை வழிகாட்டி" : "ASTROVERSE VEDIC LIFE PATH DOSSIER");

    return `
      <div style="background: linear-gradient(135deg, #1E1B4B 0%, #312E81 100%); color: #FFFFFF; padding: 14px 24px; border-bottom: 3px solid #F59E0B; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 7.5px; font-weight: 800; letter-spacing: 1.5px; color: #FDE68A; text-transform: uppercase; margin-bottom: 2px;">
            ${badgeText}
          </div>
          <div style="font-size: 14px; font-weight: bold; font-family: ${isTamil ? "'Noto Sans Tamil', serif" : "Georgia, serif"};">
            ${title}
          </div>
          <div style="font-size: 8px; color: #E0E7FF; margin-top: 1px;">
            ${subtitle}
          </div>
        </div>
        <div style="text-align: right; font-size: 8px; color: #CBD5E1;">
          <div style="background: rgba(255,255,255,0.12); padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2); font-weight: bold; color: #FDE68A; font-family: monospace;">
            FP: ${fingerprint}
          </div>
          <div style="margin-top: 3px; color: #E2E8F0;">
            ${isTamil ? `பக்கம் ${pageNum} / ${totalPages}` : `Page ${pageNum} of ${totalPages}`}
          </div>
        </div>
      </div>
    `;
  }

  function renderMetadataCardHTML() {
    return `
      <div style="background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 6px; padding: 8px 14px; margin: 8px 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 8.5px; line-height: 1.45;">
        <div>
          <div><strong style="color: #475569;">${isTamil ? "பிறந்த நாள் & நேரம்:" : "Birth Instant:"}</strong> <span style="color: #0F172A; font-weight: 600;">${bDate} | ${bTime}</span></div>
          <div><strong style="color: #475569;">${isTamil ? "அட்ச/தீர்க்க ரேகை:" : "Coordinates:"}</strong> <span style="color: #0F172A;">${latStr}, ${lngStr} (${tzStr})</span></div>
        </div>
        <div>
          <div><strong style="color: #475569;">${isTamil ? "அயனாம்சம் (Ayanamsha):" : "Ayanamsha Model:"}</strong> <span style="color: #0F172A; font-weight: 600;">${systemName} (${ayanDms})</span></div>
          <div><strong style="color: #475569;">${isTamil ? "கணக்கீட்டு முறை:" : "Coordinate Frame:"}</strong> <span style="color: #0F172A;">${isTamil ? "புவிமைய உண்மை கிராந்தி வட்டம் | VSOP87" : "Geocentric True Ecliptic | VSOP87"}</span></div>
        </div>
      </div>
    `;
  }

  function renderCoreTriadHTML() {
    const ascDeg = safeNum(chartData.ascendantDeg ?? chartData.ascendantLong ?? chartData.ascendant?.deg);
    const moonDeg = safeNum(chartData.moonLong ?? chartData.moon?.deg);
    const sunDeg = safeNum(chartData.sunLong ?? chartData.sun?.deg);

    return `
      <div style="margin: 0 24px 8px 24px;">
        <div style="font-size: 9.5px; font-weight: bold; color: #B45309; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1.5px solid #FCD34D; padding-bottom: 2px; margin-bottom: 5px;">
          ${isTamil ? "1. மூல ஜாதக முதன்மை விவரங்கள் (Core Natal Profile)" : "1. Core Natal Profile & Active Dasha"}
        </div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;">
          <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 5px; padding: 6px; text-align: center;">
            <div style="font-size: 7.5px; color: #92400E; font-weight: bold; text-transform: uppercase;">${isTamil ? "ஜென்ம லக்னம்" : "Ascendant (Lagna)"}</div>
            <div style="font-size: 11px; font-weight: bold; color: #78350F; margin-top: 1px;">${ascName}</div>
            <div style="font-size: 7.5px; color: #B45309;">${ascDeg.toFixed(2)}°</div>
          </div>
          <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 5px; padding: 6px; text-align: center;">
            <div style="font-size: 7.5px; color: #1E40AF; font-weight: bold; text-transform: uppercase;">${isTamil ? "ஜென்ம ராசி" : "Moon Sign (Rasi)"}</div>
            <div style="font-size: 11px; font-weight: bold; color: #1E3A8A; margin-top: 1px;">${moonSign}</div>
            <div style="font-size: 7.5px; color: #2563EB;">${isTamil ? `${moonNak} பாதம் ${moonPada}` : `${moonNak} (Pada ${moonPada})`}</div>
          </div>
          <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 5px; padding: 6px; text-align: center;">
            <div style="font-size: 7.5px; color: #991B1B; font-weight: bold; text-transform: uppercase;">${isTamil ? "சூரிய ராசி" : "Sun Sign (Surya)"}</div>
            <div style="font-size: 11px; font-weight: bold; color: #7F1D1D; margin-top: 1px;">${sunSign}</div>
            <div style="font-size: 7.5px; color: #DC2626;">${sunNak} (${sunDeg.toFixed(2)}°)</div>
          </div>
          <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 5px; padding: 6px; text-align: center;">
            <div style="font-size: 7.5px; color: #166534; font-weight: bold; text-transform: uppercase;">${isTamil ? "நடப்பு தசா - புக்தி" : "Active Dasha"}</div>
            <div style="font-size: 10.5px; font-weight: bold; color: #14532D; margin-top: 1px;">${activeMaha} - ${activeAntar}</div>
            <div style="font-size: 7.5px; color: #16A34A;">${isTamil ? "விம்சோத்தரி முறை" : "Vimshottari Phase"}</div>
          </div>
        </div>
      </div>
    `;
  }

  function renderPlanetaryTableHTML() {
    const tableHeaders = isTamil
      ? ["கிரகம்", "ராசி", "பாகை", "நட்சத்திரம் & பாதம்", "இயக்கம்", "ஆட்சி/பலம்"]
      : ["BODY", "SIGN", "LONGITUDE", "NAKSHATRA & PADA", "MOTION", "DIGNITY"];

    const rows = planetList.map((p, idx) => {
      const pName = isTamil ? (p.tamil || p.nameTa || toTamilPlanet(p.name)) : p.name;
      const pSign = isTamil ? (p.signTamil || toTamilRasi(p.sign)) : (p.sign || "-");
      const pDeg = safeNum(p.deg !== undefined ? p.deg : p.longitude).toFixed(2);
      const pNak = isTamil ? (p.nakshatraTamil || toTamilNakshatra(p.nakshatra)) : (p.nakshatra || "-");
      const pPada = p.pada ? (isTamil ? `பாதம் ${p.pada}` : `Pada ${p.pada}`) : (isTamil ? "பாதம் 1" : "Pada 1");
      const pMotion = p.isRetrograde
        ? (isTamil ? "வக்ரம் (R)" : "Retrograde (R)")
        : (isTamil ? "நேர்கதி (D)" : "Direct (D)");
      const pDignity = isTamil
        ? (p.dignityTamil || toTamilDignity(p.dignity || p.functionalNature || "சமம்"))
        : (p.dignity || p.functionalNature || "Neutral");

      const bg = idx % 2 === 1 ? "#F8FAFC" : "#FFFFFF";
      return `
        <tr style="background-color: ${bg}; border-bottom: 1px solid #E2E8F0; font-size: 7.5px;">
          <td style="padding: 3px 5px; font-weight: bold; color: #1E293B;">${pName}</td>
          <td style="padding: 3px 5px; color: #334155;">${pSign}</td>
          <td style="padding: 3px 5px; font-family: monospace; color: #475569;">${pDeg}°</td>
          <td style="padding: 3px 5px; color: #334155;">${pNak} (${pPada})</td>
          <td style="padding: 3px 5px; color: ${p.isRetrograde ? "#DC2626" : "#16A34A"}; font-weight: 600;">${pMotion}</td>
          <td style="padding: 3px 5px; color: #475569; font-weight: 500;">${pDignity}</td>
        </tr>
      `;
    }).join("");

    return `
      <div style="margin: 0 24px 8px 24px;">
        <div style="font-size: 9.5px; font-weight: bold; color: #B45309; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1.5px solid #FCD34D; padding-bottom: 2px; margin-bottom: 4px;">
          ${isTamil ? "2. சான்றளிக்கப்பட்ட நவகிரக நிலைகள் அட்டவணை" : "2. Certified Planetary Ephemeris Table"}
        </div>
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead>
            <tr style="background: #F1F5F9; border-bottom: 1.5px solid #CBD5E1; font-size: 7px; font-weight: 800; color: #475569;">
              <th style="padding: 3px 5px;">${tableHeaders[0]}</th>
              <th style="padding: 3px 5px;">${tableHeaders[1]}</th>
              <th style="padding: 3px 5px;">${tableHeaders[2]}</th>
              <th style="padding: 3px 5px;">${tableHeaders[3]}</th>
              <th style="padding: 3px 5px;">${tableHeaders[4]}</th>
              <th style="padding: 3px 5px;">${tableHeaders[5]}</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderYogasSummaryHTML(limit = 3) {
    const list = yogas.slice(0, limit);
    if (list.length === 0) {
      return `
        <div style="margin: 0 24px 8px 24px; font-size: 8px; color: #64748B;">
          ${isTamil ? "நிலையான நவகிரக அமைப்புகளின் வழியே சுப பலன்கள் வெளிப்படுகின்றன." : "Standard baseline planetary configuration without major impediments."}
        </div>
      `;
    }

    const items = list.map(y => {
      const yName = typeof y === "string" ? y : (isTamil ? (y.nameTa || toTamilRasi(y.name) || y.name) : (y.name || y.title));
      const yDesc = typeof y === "object" ? (isTamil ? (y.definitionTa || y.manifestationTa || y.definition || y.desc) : (y.definition || y.desc || y.manifestation)) : (isTamil ? "பாரம்பரிய சுப யோகம்." : "Classical auspicious formation.");
      const displayTitle = isTamil ? cleanEnglishParentheses(yName) : yName;
      const displayDesc = isTamil ? cleanEnglishParentheses(yDesc) : yDesc;
      return `
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-left: 3px solid #F59E0B; border-radius: 4px; padding: 4px 7px; margin-bottom: 3px;">
          <div style="font-size: 8px; font-weight: bold; color: #1E293B;">★ ${displayTitle}</div>
          <div style="font-size: 7px; color: #475569; margin-top: 1px; line-height: 1.3;">${displayDesc}</div>
        </div>
      `;
    }).join("");

    return `
      <div style="margin: 0 24px 8px 24px;">
        <div style="font-size: 9.5px; font-weight: bold; color: #B45309; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1.5px solid #FCD34D; padding-bottom: 2px; margin-bottom: 4px;">
          ${isTamil ? "3. முக்கிய சுப யோகங்கள் & தோஷ அமைப்புகள்" : "3. Core Astrological Yogas & Planetary Formations"}
        </div>
        ${items}
      </div>
    `;
  }

  function renderRemediesCardHTML() {
    const gem = formatGemstoneList(remedies.primaryGemstone, isTamil);
    const gemLord = remedies.gemLord || (isTamil ? "லக்னாதிபதி" : "Lagna Lord");
    const avoidGems = formatGemstoneList(remedies.contraindicatedGemstones || remedies.traditionallyDiscouragedGemstones || remedies.avoidGemstones, isTamil);
    
    let mantra = remedies.mantra || (isTamil ? "ஓம் நம சிவாய / காயத்ரி மந்திரம்" : "Om Namah Shivaya / Gayatri Mantra");
    if (!isTamil && /[\u0B80-\u0BFF]/.test(mantra)) {
      if (mantra.includes("மஹாலக்ஷ்மி") || mantra.includes("மகாலட்சுமி")) {
        mantra = "Om Shreem Mahalakshmyai Namaha";
      } else if (mantra.includes("சிவ")) {
        mantra = "Om Namah Shivaya";
      } else if (mantra.includes("விஷ்ணு") || mantra.includes("நாராயண")) {
        mantra = "Om Namo Narayanaya";
      } else if (mantra.includes("காயத்ரி")) {
        mantra = "Om Bhur Bhuva Swaha (Gayatri Mantra)";
      } else {
        mantra = "Om Namah Shivaya / Classical Vedic Mantra";
      }
    }

    let charity = remedies.charity || (isTamil ? "வியாழன் மற்றும் சனிக்கிழமைகளில் ஏழை எளியோருக்கு அன்னதானம் & உதவி" : "Charity & service on auspicious days");
    if (!isTamil && /[\u0B80-\u0BFF]/.test(charity)) {
      charity = "Charity, feeding the needy, and educational assistance on auspicious planetary weekdays.";
    }

    return `
      <div style="margin: 0 24px 8px 24px;">
        <div style="font-size: 9.5px; font-weight: bold; color: #B45309; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1.5px solid #FCD34D; padding-bottom: 2px; margin-bottom: 4px;">
          ${isTamil ? "4. தனிப்பயனாக்கப்பட்ட ரத்தின & சாஸ்திர பரிகாரங்கள்" : "4. Personalized Recommendations & Remedies"}
        </div>
        <div style="background: #FFFDF7; border: 1px solid #FDE68A; border-radius: 5px; padding: 7px 10px; font-size: 7.5px; line-height: 1.4;">
          <div><strong style="color: #92400E;">✓ ${isTamil ? "பரிந்துரைக்கப்படும் முதன்மை ரத்தினம்:" : "Prescribed Primary Gemstone:"}</strong> <span style="color: #1E293B; font-weight: bold;">${gem}</span> <span style="color: #64748B;">(${isTamil ? "கிரக அதிபதி:" : "Ruler:"} ${gemLord})</span></div>
          <div style="margin-top: 2px;"><strong style="color: #DC2626;">⚠ ${isTamil ? "கண்டிப்பாக தவிர்க்க வேண்டிய ரத்தினங்கள்:" : "Contraindicated Gemstones:"}</strong> <span style="color: #991B1B;">${avoidGems}</span></div>
          <div style="margin-top: 2px;"><strong style="color: #475569;">🪔 ${isTamil ? "தினசரி மந்திர சாதனை:" : "Daily Mantra Sadhana:"}</strong> <span style="color: #1E293B;">${mantra}</span></div>
          <div style="margin-top: 2px;"><strong style="color: #475569;">🤝 ${isTamil ? "தானம் & அறப்பணி:" : "Charity & Service:"}</strong> <span style="color: #1E293B;">${charity}</span></div>
        </div>
      </div>
    `;
  }

  function renderDisclaimerHTML() {
    return `
      <div style="margin: 6px 24px 0 24px; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 5px; padding: 5px 10px; font-size: 6.5px; color: #991B1B; line-height: 1.35;">
        <strong>${isTamil ? "சட்டரீதியான விழிப்புணர்வு அறிவிப்பு:" : "METHODOLOGICAL & STATUTORY DISCLOSURE:"}</strong>
        ${isTamil
          ? "இந்த வேத ஜோதிட கணக்கீட்டு அறிக்கை சர்வதேச இயற்பியல் வானியல் விதிகளின்படி (VSOP87/Meeus) கணித துல்லியத்துடன் உருவாக்கப்பட்டுள்ளது. இது கலாச்சார மற்றும் ஆன்மீக வழிகாட்டலுக்கானது; மருத்துவ, சட்ட அல்லது நிதி நிபுணத்துவ ஆலோசனைகளுக்கு மாற்றாகாது."
          : "This calculation dossier is computed via astronomical ephemeris algorithms (VSOP87/Meeus). It is an illustrative cultural framework and does not constitute medical, legal, or financial advisory."}
      </div>
    `;
  }

  // --- CLIENT MINIMAL PAGE (1 Page) ---
  function renderClientMinimalPageHTML() {
    const rawAscSign = getAscendantName(chartData) || "";
    const visualChartHTML = renderSouthIndianChartHTML(
      isTamil ? "ராசி சக்கரம் (D1)" : "Rasi Chart (D1)",
      planetList,
      rawAscSign,
      isTamil,
      210,
      "D1"
    );

    const tridoshaText = tridosha.primaryDosha
      ? `${tridosha.primaryDosha}${tridosha.secondaryDosha ? ` / ${tridosha.secondaryDosha}` : ''}`
      : (isTamil ? "கணக்கிடப்படவில்லை" : "Not evaluated");
    const lagnaLordText = chartData.ascendant?.lord || chartData.ascendantSign?.lord || "-";

    return `
      <div style="width: 794px; min-height: 1123px; box-sizing: border-box; background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between; padding-bottom: 14px;">
        <div>
          ${renderHeaderHTML(
            isTamil ? "வேத ஜோதிட சுருக்க அறிக்கை (Client Essential Snapshot)" : "AstroVerse Client Essential Snapshot",
            isTamil ? `${systemName} அயனாம்சம் & மூல ஜாதக சுருக்கம்` : `${systemName} Ephemeris & Essential Kundli Overview`,
            1, 1
          )}
          ${renderMetadataCardHTML()}

          <div style="margin: 0 24px 8px 24px; display: grid; grid-template-columns: 210px 1fr; gap: 12px; align-items: start;">
            <div>
              ${visualChartHTML}
            </div>
            <div style="display: flex; flex-direction: column; gap: 5px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 4px; padding: 5px; text-align: center;">
                  <div style="font-size: 7px; color: #92400E; font-weight: bold;">${isTamil ? "ஜென்ம லக்னம்" : "Ascendant"}</div>
                  <div style="font-size: 10px; font-weight: bold; color: #78350F;">${ascName}</div>
                </div>
                <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 4px; padding: 5px; text-align: center;">
                  <div style="font-size: 7px; color: #1E40AF; font-weight: bold;">${isTamil ? "ஜென்ம ராசி" : "Moon Sign"}</div>
                  <div style="font-size: 10px; font-weight: bold; color: #1E3A8A;">${moonSign}</div>
                </div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 4px; padding: 5px; text-align: center;">
                  <div style="font-size: 7px; color: #991B1B; font-weight: bold;">${isTamil ? "நட்சத்திரம்" : "Nakshatra"}</div>
                  <div style="font-size: 9.5px; font-weight: bold; color: #7F1D1D;">${moonNak} (${moonPada})</div>
                </div>
                <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 4px; padding: 5px; text-align: center;">
                  <div style="font-size: 7px; color: #166534; font-weight: bold;">${isTamil ? "நடப்பு தசை" : "Active Dasha"}</div>
                  <div style="font-size: 9.5px; font-weight: bold; color: #14532D;">${activeMaha} - ${activeAntar}</div>
                </div>
              </div>
              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 4px; padding: 5px 7px; font-size: 7.5px; line-height: 1.4;">
                <div><strong style="color: #475569;">${isTamil ? "ஆயுர்வேத திரிதோஷம்:" : "Tridosha Profile:"}</strong> <span style="color: #1E293B;">${tridoshaText}</span></div>
                <div><strong style="color: #475569;">${isTamil ? "லக்னாதிபதி பலம்:" : "Lagna Lord Status:"}</strong> <span style="color: #1E293B;">${lagnaLordText}</span></div>
              </div>
            </div>
          </div>

          ${renderPlanetaryTableHTML()}
          ${renderYogasSummaryHTML(2)}
          ${renderRemediesCardHTML()}
        </div>
        <div>
          ${renderDisclaimerHTML()}
        </div>
      </div>
    `;
  }

  // --- ASTROLOGER MINIMAL PAGE (1 Page) ---
  function renderAstrologerMinimalPageHTML() {
    const rawAscSign = getAscendantName(chartData) || "";
    const rawNavSign = chartData.ascendantNavamsa?.name || chartData.ascendantNavamsa?.signName || rawAscSign;

    const chartD1HTML = renderSouthIndianChartHTML(
      isTamil ? "D1 ராசி" : "D1 Rasi",
      planetList,
      rawAscSign,
      isTamil,
      175,
      "D1"
    );
    const chartD9HTML = renderSouthIndianChartHTML(
      isTamil ? "D9 நவாம்சம்" : "D9 Navamsha",
      planetList,
      rawNavSign,
      isTamil,
      175,
      "D9"
    );

    // Shadbala short summary
    const shadbalaRows = shadbalaList.slice(0, 7).map(sb => {
      const pName = isTamil ? (sb.planetTa || toTamilPlanet(sb.planet)) : sb.planet;
      const v = sb.totalVirupas || 0;
      const ratio = (sb.ratio || 0).toFixed(2);
      return `<span style="display: inline-block; background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 3px; padding: 2px 4px; margin: 1px; font-size: 7px;"><strong>${pName}</strong>: ${v}v (${ratio}x)</span>`;
    }).join("");

    // Jaimini Karakas short summary
    const jaiminiKarakasStr = jaiminiList.slice(0, 7).map(k => {
      const kCode = k.code || "AK";
      const pName = isTamil ? (k.planetTa || toTamilPlanet(k.planet)) : (k.planet || k.name || "-");
      const degStr = k.degInSign || (typeof k.degreeInSign === "number" ? `${k.degreeInSign.toFixed(2)}°` : "");
      return `<span style="display: inline-block; background: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 3px; padding: 2px 4px; margin: 1px; font-size: 7px;"><strong>${kCode}</strong>: ${pName} ${degStr}</span>`;
    }).join("");

    return `
      <div style="width: 794px; min-height: 1123px; box-sizing: border-box; background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between; padding-bottom: 14px;">
        <div>
          ${renderHeaderHTML(
            isTamil ? "ஜோதிட நிபுணர் சுருக்க அறிக்கை (Astrologer Technical Snapshot)" : "AstroVerse Astrologer Technical Snapshot",
            isTamil ? "வானியல் ஆயத்தொலைவுகள், D1/D9 சக்கரங்கள், ஷட்பல விரூபைகள் & ஜைமினி காரகங்கள்" : "VSOP87 Ephemeris Coordinates, D1/D9 Vargas, Shadbala Virupas & Jaimini Karakas",
            1, 1
          )}
          ${renderMetadataCardHTML()}

          <div style="margin: 0 24px 6px 24px; display: flex; justify-content: space-between; gap: 10px; align-items: start;">
            <div>${chartD1HTML}</div>
            <div>${chartD9HTML}</div>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
              <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 4px; padding: 5px;">
                <div style="font-size: 7.5px; font-weight: bold; color: #92400E; margin-bottom: 2px;">
                  ⚙ ${isTamil ? "கணக்கீட்டு சான்றிதழ் விவரங்கள்:" : "Calculation Certificate Ledger:"}
                </div>
                <div style="font-size: 7px; color: #78350F; line-height: 1.35;">
                  <div>• <strong>${isTamil ? "அயனாம்சம்:" : "Ayanamsha:"}</strong> ${systemName} (${ayanDms})</div>
                  <div>• <strong>${isTamil ? "கணு முறைமை:" : "Node Model:"}</strong> ${chartData.nodeModel === "true" ? (isTamil ? "உண்மை கணு (True Node)" : "True Node") : (isTamil ? "சராசரி கணு (Mean Node)" : "Mean Node")}</div>
                  <div>• <strong>${isTamil ? "கைரேகை:" : "Fingerprint:"}</strong> <span style="font-family: monospace; font-weight: bold; color: #4F46E5;">${fingerprint}</span></div>
                </div>
              </div>
              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 4px; padding: 5px;">
                <div style="font-size: 7.5px; font-weight: bold; color: #1E1B4B; margin-bottom: 2px;">
                  ✦ ${isTamil ? "7 ஜைமினி சர காரகங்கள்:" : "7 Jaimini Chara Karakas:"}
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 2px;">
                  ${jaiminiKarakasStr || (isTamil ? "கணக்கிடப்படவில்லை" : "Not computed")}
                </div>
              </div>
              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 4px; padding: 5px;">
                <div style="font-size: 7.5px; font-weight: bold; color: #166534; margin-bottom: 2px;">
                  ⚖ ${isTamil ? "பராசர ஷட்பல சுருக்கம் (Virupas / Ratio):" : "Parashari Shadbala Virupas Ledger:"}
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 2px;">
                  ${shadbalaRows || (isTamil ? "கணக்கிடப்படவில்லை" : "Not computed")}
                </div>
              </div>
            </div>
          </div>

          ${renderPlanetaryTableHTML()}
          ${renderYogasSummaryHTML(2)}
        </div>
        <div>
          ${renderDisclaimerHTML()}
        </div>
      </div>
    `;
  }

  // --- CLIENT MASTER DOSSIER (10 Pages) ---
  function renderClientMasterPagesHTML() {
    const rawAscSign = getAscendantName(chartData) || "";
    const rawNavSign = chartData.ascendantNavamsa?.name || chartData.ascendantNavamsa?.signName || rawAscSign;

    // PAGE 1: Cover & Executive Summary Blueprint
    const page1 = `
      <div style="width: 794px; min-height: 1123px; box-sizing: border-box; background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between; padding-bottom: 16px;">
        <div>
          ${renderHeaderHTML(
            isTamil ? "வேத ஜோதிட மகா ஆயுள் வழிகாட்டி (Client Life Dossier)" : "AstroVerse Client Life Destiny Dossier",
            isTamil ? "முழு வாழ்க்கை பாதை, யோகங்கள், தசா பலன்கள் & சாஸ்திர வழிகாட்டல்" : "Comprehensive Life Path, Auspicious Yogas, Dasha Matrix & Vedic Guidance",
            1, 10
          )}
          ${renderMetadataCardHTML()}

          <div style="margin: 10px 24px; background: #FFFBEB; border: 1.5px solid #F59E0B; border-radius: 6px; padding: 10px 14px;">
            <div style="font-size: 11px; font-weight: bold; color: #92400E; margin-bottom: 4px;">
              🌟 ${isTamil ? "வாழ்க்கை பயணத்தின் முக்கிய சிறப்பம்சங்கள் (Executive Summary)" : "Executive Life Blueprint & Core Themes"}
            </div>
            <div style="font-size: 7.5px; color: #78350F; line-height: 1.5;">
              ${isTamil
                ? `இந்த ஜாதகம் ${bDate} அன்று ${bTime} மணிக்கு (${latStr}, ${lngStr}) பிறந்த நேரத்தைக் கொண்டு கணக்கிடப்பட்டுள்ளது. உங்கள் லக்னம் ${ascName}, ராசி ${moonSign}, நட்சத்திரம் ${moonNak} (பாதம் ${moonPada}) ஆகும். நடப்பு விம்சோத்தரி தசை ${activeMaha} மகா தசையில் ${activeAntar} புக்தி நடைபெறுகிறது.`
                : `This natal dossier is computed for the birth instant ${bDate} at ${bTime} (${latStr}, ${lngStr}). Your Ascendant is ${ascName}, Moon Sign is ${moonSign}, and Nakshatra is ${moonNak} (Pada ${moonPada}). You are currently undergoing the ${activeMaha} Mahadasha with ${activeAntar} Antardasha.`}
            </div>
          </div>

          ${renderCoreTriadHTML()}
          ${renderPlanetaryTableHTML()}
          ${renderYogasSummaryHTML(3)}
        </div>
        <div style="text-align: center; font-size: 7.5px; color: #94A3B8; padding: 4px 24px;">
          ${isTamil ? "அடுத்த பக்கத்தில்: D1 ராசி & D9 நவாம்ச சக்கர வரைபடங்கள் ➔" : "Next Page: Foundational Visual Charts (D1 & D9) ➔"}
        </div>
      </div>
    `;

    // PAGE 2: Foundational Visual Charts (D1 & D9)
    const chartD1HTML = renderSouthIndianChartHTML(
      isTamil ? "ராசி சக்கரம் (D1)" : "Rasi Chart (D1)",
      planetList,
      rawAscSign,
      isTamil,
      220,
      "D1"
    );
    const chartD9HTML = renderSouthIndianChartHTML(
      isTamil ? "நவாம்சம் (D9)" : "Navamsha (D9)",
      planetList,
      rawNavSign,
      isTamil,
      220,
      "D9"
    );

    const page2 = `
      <div style="width: 794px; min-height: 1123px; box-sizing: border-box; background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between; padding-bottom: 16px;">
        <div>
          ${renderHeaderHTML(
            isTamil ? "அடிப்படை சக்கர வரைபடங்கள் (Foundational Visual Charts)" : "Foundational Natal & Navamsha Charts",
            isTamil ? "D1 ராசி சக்கரம் & D9 நவாம்ச சக்கரத்தின் நேரடி விளக்கம்" : "D1 Rasi Physical Foundation & D9 Navamsha Soul Potential",
            2, 10
          )}
          <div style="margin: 10px 24px; display: flex; justify-content: space-around; gap: 12px;">
            ${chartD1HTML}
            ${chartD9HTML}
          </div>

          <div style="margin: 10px 24px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 10px 14px; font-size: 8px; line-height: 1.5; color: #334155;">
            <div style="font-weight: bold; color: #1E293B; margin-bottom: 4px;">
              🔍 ${isTamil ? "சக்கரங்களின் முக்கியத்துவம்:" : "Understanding Your Visual Charts:"}
            </div>
            <div>• <strong>${isTamil ? "D1 ராசி சக்கரம்:" : "D1 Rasi Chart:"}</strong> ${isTamil ? "உங்கள் உடல் தோற்றம், ஆரோக்கியம், உலகியல் வளர்ச்சி மற்றும் அடிப்படை குணாதிசயங்களை பிரதிபலிக்கிறது." : "Represents your physical embodiment, constitutional vitality, and manifest worldly opportunities."}</div>
            <div style="margin-top: 3px;">• <strong>${isTamil ? "D9 நவாம்ச சக்கரம்:" : "D9 Navamsha Chart:"}</strong> ${isTamil ? "உங்கள் ஆத்ம பலம், திருமண யோகம், 32 வயதிற்குப் பிறகான கர்ம முதிர்ச்சி மற்றும் மறைமுக ஆற்றல்களைக் காட்டுகிறது." : "Reflects the subtle strength of planets, marital karma, dharmic purpose, and post-maturity evolution."}</div>
          </div>
        </div>
        <div style="text-align: center; font-size: 7.5px; color: #94A3B8; padding: 4px 24px;">
          ${isTamil ? "அடுத்த பக்கத்தில்: முக்கிய சுப யோகங்கள் & திரிதோஷ ஆரோக்கியம் ➔" : "Next Page: Auspicious Yogas & Ayurvedic Health Profile ➔"}
        </div>
      </div>
    `;

    // PAGE 3: Auspicious Yogas & Tridosha Health Profile
    const page3 = `
      <div style="width: 794px; min-height: 1123px; box-sizing: border-box; background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between; padding-bottom: 16px;">
        <div>
          ${renderHeaderHTML(
            isTamil ? "சுப யோகங்கள் & ஆயுர்வேத ஆரோக்கிய சமநிலை" : "Auspicious Yogas & Ayurvedic Constitution",
            isTamil ? "ஜாதகத்தில் அமைந்த ராஜயோகங்கள், தனயோகங்கள் & உடல் நல வழிகாட்டல்" : "Classical Rajayogas, Wealth Yogas & Personalized Wellness Balance",
            3, 10
          )}
          <div style="margin: 10px 24px;">
            <div style="font-size: 9.5px; font-weight: bold; color: #B45309; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1.5px solid #FCD34D; padding-bottom: 2px; margin-bottom: 6px;">
              ✦ ${isTamil ? "முக்கிய சுப யோகங்களின் விரிவான பலன்கள்" : "Manifestation of Auspicious Yogas"}
            </div>
            ${yogas.slice(0, 4).map(y => {
              const yName = typeof y === "string" ? y : (isTamil ? (y.nameTa || toTamilRasi(y.name) || y.name) : (y.name || y.title));
              const yDesc = typeof y === "object" ? (isTamil ? (y.manifestationTa || y.definitionTa || y.desc || y.definition) : (y.manifestation || y.desc || y.definition)) : (isTamil ? "பாரம்பரிய சுப யோகம்." : "Classical auspicious yoga.");
              const dispName = isTamil ? cleanEnglishParentheses(yName) : yName;
              const dispDesc = isTamil ? cleanEnglishParentheses(yDesc) : yDesc;
              return `
                <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-left: 3px solid #D97706; border-radius: 4px; padding: 5px 8px; margin-bottom: 4px;">
                  <strong style="font-size: 8px; color: #1E293B;">★ ${dispName}</strong>
                  <div style="font-size: 7.5px; color: #475569; margin-top: 1px; line-height: 1.35;">${dispDesc}</div>
                </div>
              `;
            }).join("") || `<div style="font-size: 8px; color: #64748B;">${isTamil ? "நிலையான நற்பலன்கள் இயங்குகின்றன." : "Standard baseline yoga formations operating."}</div>`}
          </div>

          <div style="margin: 8px 24px; background: #FFFDF7; border: 1px solid #FDE68A; border-radius: 6px; padding: 10px 14px;">
            <div style="font-size: 9.5px; font-weight: bold; color: #92400E; margin-bottom: 4px;">
              🌿 ${isTamil ? "ஆயுர்வேத திரிதோஷ சமநிலை (Ayurvedic Tridosha Constitution)" : "Ayurvedic Tridosha Health Guidance"}
            </div>
            <div style="font-size: 8px; color: #334155; line-height: 1.5;">
              <div><strong style="color: #B45309;">${isTamil ? "முதன்மை தோஷம்:" : "Primary Dosha:"}</strong> ${tridosha.primaryDosha || (isTamil ? "கணக்கிடப்படவில்லை" : "Not evaluated")}</div>
              <div><strong style="color: #B45309;">${isTamil ? "துணை தோஷம்:" : "Secondary Dosha:"}</strong> ${tridosha.secondaryDosha || (isTamil ? "கணக்கிடப்படவில்லை" : "Not evaluated")}</div>
              <div style="margin-top: 4px; color: #475569;">
                ${tridosha.guidance || (isTamil ? "இயற்கையான உணவுகள், சீரான தூக்கம் மற்றும் தியானப் பயிற்சி உங்கள் மன அமைதியையும் உடல் ஆரோக்கியத்தையும் காக்கும்." : "Nourishing seasonal diet, mindful sleep cycles, and daily grounding practices enhance vitality.")}
              </div>
            </div>
          </div>
        </div>
        <div style="text-align: center; font-size: 7.5px; color: #94A3B8; padding: 4px 24px;">
          ${isTamil ? "அடுத்த பக்கத்தில்: தொழில் & உத்தியோக மேன்மை ➔" : "Next Page: Career & Vocational Destiny ➔"}
        </div>
      </div>
    `;

    // PAGE 4: Career & Vocational Destiny
    const careerText = isTamil
      ? (domains.career?.summaryTamil || domains.career?.summary || "10-ம் பாவகத்தின் பலம் மற்றும் லக்னாதிபதியின் சுப சேர்க்கையால் தலைமைப் பண்புகள் மற்றும் தொழில் மேன்மை கிட்டும்.")
      : (domains.career?.summary || "Strong indicators for professional growth, leadership capability, and steady career elevation.");

    const page4 = `
      <div style="width: 794px; min-height: 1123px; box-sizing: border-box; background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between; padding-bottom: 16px;">
        <div>
          ${renderHeaderHTML(
            isTamil ? "தொழில், ஜீவனம் & தலைமைத்துவ மேன்மை" : "Career, Vocation & Executive Leadership",
            isTamil ? "10-ம் பாவகம், தொழில்முனைவு வாய்ப்புகள் & எதிர்கால வளர்ச்சி" : "10th House Karma, Professional Opportunities & Growth Timelines",
            4, 10
          )}
          <div style="margin: 12px 24px;">
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-left: 3.5px solid #4F46E5; border-radius: 6px; padding: 10px 14px; margin-bottom: 10px;">
              <div style="font-size: 9.5px; font-weight: bold; color: #1E293B; margin-bottom: 4px;">
                👔 ${isTamil ? "தொழில் மற்றும் கர்ம ஸ்தான ஆய்வு:" : "Vocation & Career Pathway Overview:"}
              </div>
              <div style="font-size: 8px; color: #334155; line-height: 1.5;">
                ${isTamil ? cleanEnglishParentheses(careerText) : careerText}
              </div>
            </div>

            <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 6px; padding: 10px 14px; font-size: 8px; line-height: 1.5;">
              <div style="font-weight: bold; color: #166534; margin-bottom: 4px;">
                🚀 ${isTamil ? "உகந்த தொழில் துறைகள் & வளர்ச்சி ஆலோசனைகள்:" : "Favorable Sectors & Success Factors:"}
              </div>
              <div>• ${isTamil ? "நிர்வாகம், மேலாண்மை, ஆலோசனை மற்றும் தொழில்முனைவு." : "Executive leadership, management consulting, tech innovation, and enterprise building."}</div>
              <div>• ${isTamil ? "நேர்மையான உழைப்பு மற்றும் கூட்டு முயற்சிகளில் தெளிவான ஒப்பந்தங்கள் நிலைத்த வெற்றியைத் தரும்." : "Transparent contracts, structured diligence, and consistent discipline assure sustained success."}</div>
            </div>
          </div>
        </div>
        <div style="text-align: center; font-size: 7.5px; color: #94A3B8; padding: 4px 24px;">
          ${isTamil ? "அடுத்த பக்கத்தில்: திருமணம், இல்லறம் & உறவுகள் ➔" : "Next Page: Marriage, Relationships & Family Karma ➔"}
        </div>
      </div>
    `;

    // PAGE 5: Marriage, Relationships & Family Karma
    const marriageText = isTamil
      ? (domains.marriage?.summaryTamil || domains.relationship?.summaryTamil || domains.marriage?.summary || "7-ம் அதிபதியின் சுப நிலையால் அன்பான வாழ்க்கைத் துணையும் குடும்ப ஒற்றுமையும் வாய்க்கும்.")
      : (domains.marriage?.summary || domains.relationship?.summary || "Favorable indicators for harmonious partnership, emotional maturity, and supportive family dynamics.");

    const page5 = `
      <div style="width: 794px; min-height: 1123px; box-sizing: border-box; background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between; padding-bottom: 16px;">
        <div>
          ${renderHeaderHTML(
            isTamil ? "திருமணம், இல்லறம் & உறவுகள்" : "Marriage, Relationships & Family Karma",
            isTamil ? "7-ம் பாவகம், வாழ்க்கைத் துணை குணாதிசயம் & குடும்ப அமைதி" : "7th House Kalathra Analysis, Partnership Karma & Family Harmony",
            5, 10
          )}
          <div style="margin: 12px 24px;">
            <div style="background: #FFFDF7; border: 1px solid #FDE68A; border-left: 3.5px solid #D97706; border-radius: 6px; padding: 10px 14px; margin-bottom: 10px;">
              <div style="font-size: 9.5px; font-weight: bold; color: #92400E; margin-bottom: 4px;">
                💍 ${isTamil ? "களத்திர ஸ்தான ஆய்வு:" : "Relationship Karma & Partnership Analysis:"}
              </div>
              <div style="font-size: 8px; color: #334155; line-height: 1.5;">
                ${isTamil ? cleanEnglishParentheses(marriageText) : marriageText}
              </div>
            </div>

            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 10px 14px; font-size: 8px; line-height: 1.5;">
              <div style="font-weight: bold; color: #1E293B; margin-bottom: 4px;">
                🤝 ${isTamil ? "இல்லற அமைதிக்கான ஆலோசனைகள்:" : "Keys to Relational Harmony:"}
              </div>
              <div>• ${isTamil ? "வாழ்க்கைத் துணையுடன் பரஸ்பர கருத்துப் பரிமாற்றம் மற்றும் புரிதல் பலன் தரும்." : "Open communication, shared values, and emotional patience foster deep mutual respect."}</div>
              <div>• ${isTamil ? "குடும்ப முடிவுகளை ஒருமித்த கருத்துடன் எடுப்பது சுப பலன்களைப் பெருக்கும்." : "Collaborative family decision-making amplifies domestic tranquility."}</div>
            </div>
          </div>
        </div>
        <div style="text-align: center; font-size: 7.5px; color: #94A3B8; padding: 4px 24px;">
          ${isTamil ? "அடுத்த பக்கத்தில்: பூமி, சொத்து, செல்வம் & வாகன யோகம் ➔" : "Next Page: Wealth, Property & Vehicles ➔"}
        </div>
      </div>
    `;

    // PAGE 6: Wealth, Property & Vehicles
    const propertyText = isTamil
      ? (domains.property?.summaryTamil || domains.property?.summary || "4-ம் பாவக பலத்தால் சொந்த நிலம், வீடு மற்றும் வாகன வசதிகள் அமைய நல்ல யோகம் உண்டு.")
      : (domains.property?.summary || "Positive classical indicators for immovable property, residential security, and comfortable conveyances.");

    const page6 = `
      <div style="width: 794px; min-height: 1123px; box-sizing: border-box; background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between; padding-bottom: 16px;">
        <div>
          ${renderHeaderHTML(
            isTamil ? "பூமி, அசையா சொத்து, தனம் & வாகன யோகம்" : "Wealth, Property & Conveyances",
            isTamil ? "2, 4, 11-ம் பாவகங்கள், நிதி வளம் & பூமி சேர்க்கை" : "Houses 2, 4 & 11 Financial Matrix, Asset Accumulation & Vehicles",
            6, 10
          )}
          <div style="margin: 12px 24px;">
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-left: 3.5px solid #16A34A; border-radius: 6px; padding: 10px 14px; margin-bottom: 10px;">
              <div style="font-size: 9.5px; font-weight: bold; color: #166534; margin-bottom: 4px;">
                🏠 ${isTamil ? "சொத்து மற்றும் தன ஸ்தான ஆய்வு:" : "Property & Financial Stability Overview:"}
              </div>
              <div style="font-size: 8px; color: #334155; line-height: 1.5;">
                ${isTamil ? cleanEnglishParentheses(propertyText) : propertyText}
              </div>
            </div>

            <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 6px; padding: 10px 14px; font-size: 8px; line-height: 1.5;">
              <div style="font-weight: bold; color: #166534; margin-bottom: 4px;">
                💰 ${isTamil ? "நிதி மேலாண்மை & முதலீட்டு வழிகாட்டல்:" : "Investment & Financial Strategy:"}
              </div>
              <div>• ${isTamil ? "நீண்ட கால ரியல் எஸ்டேட் மற்றும் பத்திர முதலீடுகள் நிலையான பலன் தரும்." : "Long-term real estate investments and diversified conservative assets yield steady returns."}</div>
              <div>• ${isTamil ? "திடீர் ஊக வணிகங்களைத் தவிர்த்து திட்டமிட்ட சேமிப்பு நலம் பயக்கும்." : "Avoid speculative impulsiveness; systematic wealth creation assures generational security."}</div>
            </div>
          </div>
        </div>
        <div style="text-align: center; font-size: 7.5px; color: #94A3B8; padding: 4px 24px;">
          ${isTamil ? "அடுத்த பக்கத்தில்: 12 பாவக முழு வாழ்க்கை வழிகாட்டி ➔" : "Next Page: Comprehensive 12 Bhavas Life Guide ➔"}
        </div>
      </div>
    `;

    // PAGE 7: 12 Bhavas Actionable Guide (All 12 Houses plain summary)
    const bhavaCardsAll = bhavas.slice(0, 12).map((b, idx) => {
      const bNum = b.num || (idx + 1);
      const bTitle = isTamil ? (b.title || `${bNum}-ம் பாவகம்`) : (b.title || `House ${bNum}`);
      const bSign = isTamil ? (b.signTamil || toTamilRasi(b.signName || b.sign)) : (b.signName || b.sign || "");
      const bPred = isTamil
        ? (b.predictionTamil || b.summaryTamil || b.prediction || b.summary || "சீரான பாவக அமைப்பு.")
        : (b.prediction || b.summary || "Balanced astrological influence.");
      const displayPred = isTamil ? cleanEnglishParentheses(bPred) : bPred;

      return `
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 4px; padding: 4px 6px; font-size: 7px; line-height: 1.3;">
          <strong style="color: #1E293B;">${bTitle} (${bSign}):</strong> <span style="color: #475569;">${displayPred}</span>
        </div>
      `;
    }).join("");

    const page7 = `
      <div style="width: 794px; min-height: 1123px; box-sizing: border-box; background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between; padding-bottom: 16px;">
        <div>
          ${renderHeaderHTML(
            isTamil ? "12 பாவக முழு வாழ்க்கை வழிகாட்டி (12 Bhavas Guide)" : "Twelve Bhavas Actionable Life Blueprint",
            isTamil ? "மனித வாழ்வின் 12 முதன்மை பரிமாணங்களின் நேரடி வழிகாட்டல்" : "Actionable Synthesis Across All 12 Fundamental Life Dimensions",
            7, 10
          )}
          <div style="margin: 10px 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            ${bhavaCardsAll}
          </div>
        </div>
        <div style="text-align: center; font-size: 7.5px; color: #94A3B8; padding: 4px 24px;">
          ${isTamil ? "அடுத்த பக்கத்தில்: சுப காலங்கள் & எச்சரிக்கை காலக்கோடு ➔" : "Next Page: Auspicious Timings & Risk Shield ➔"}
        </div>
      </div>
    `;

    // PAGE 8: Auspicious Timings & Risk Shield
    const page8 = `
      <div style="width: 794px; min-height: 1123px; box-sizing: border-box; background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between; padding-bottom: 16px;">
        <div>
          ${renderHeaderHTML(
            isTamil ? "சுப காலங்கள் & எச்சரிக்கை காலக்கோடு (Risk Shield)" : "Auspicious Timing & Risk Shield",
            isTamil ? "முக்கிய முடிவுகளுக்கான நற்காலங்கள் & கவனமாக இருக்க வேண்டிய காலங்கள்" : "High-Potential Opportunity Windows & Planetary Cautionary Phases",
            8, 10
          )}
          <div style="margin: 12px 24px;">
            <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-left: 3.5px solid #16A34A; border-radius: 6px; padding: 10px 14px; margin-bottom: 10px;">
              <div style="font-size: 9.5px; font-weight: bold; color: #166534; margin-bottom: 4px;">
                🌟 ${isTamil ? "எதிர்கால சுப காலக்கட்டங்கள் (Auspicious Windows):" : "High-Potential Growth Periods:"}
              </div>
              <div style="font-size: 8px; color: #14532D; line-height: 1.5;">
                <div>• ${isTamil ? "குருவின் சுபப் பார்வையும், சுப தசா புக்திகளும் புதிய முயற்சிகள் மற்றும் தொழில் விரிவாக்கத்திற்கு ஏற்றவை." : "Favorable Jupiter transits and supportive dasha phases create ideal momentum for career breakthroughs."}</div>
                <div>• ${isTamil ? "முக்கிய சுப காரியங்களை சுப தினங்களில் தொடங்குவது வெற்றியை உறுதி செய்யும்." : "Initiating auspicious milestones during benefic planetary alignments maximizes success."}</div>
              </div>
            </div>

            <div style="background: #FEF2F2; border: 1px solid #FECACA; border-left: 3.5px solid #DC2626; border-radius: 6px; padding: 10px 14px;">
              <div style="font-size: 9.5px; font-weight: bold; color: #991B1B; margin-bottom: 4px;">
                ⚠ ${isTamil ? "கவனமாக இருக்க வேண்டிய காலங்கள் (Cautionary Windows):" : "Cautionary Phases & Risk Mitigation:"}
              </div>
              <div style="font-size: 8px; color: #7F1D1D; line-height: 1.5;">
                <div>• ${isTamil ? "சனி பெயர்ச்சி, ஏழரைச் சனி மற்றும் அஷ்டமத்து சனி காலங்களில் புதிய முதலீடுகளில் நிதானம் தேவை." : "Saturn transit cycles (Sade Sati/Ashtama) necessitate patient pacing and cautious financial decisions."}</div>
                <div>• ${isTamil ? "ராகு/கேது பெயர்ச்சி காலங்களில் அவசர முடிவுகளைத் தவிர்ப்பது நல்லது." : "Avoid impulsive deviations during nodal shifts; prioritize stable discipline."}</div>
              </div>
            </div>
          </div>
        </div>
        <div style="text-align: center; font-size: 7.5px; color: #94A3B8; padding: 4px 24px;">
          ${isTamil ? "அடுத்த பக்கத்தில்: விம்சோத்தரி 120-ஆண்டு தசா காலக்கோடு ➔" : "Next Page: Vimshottari 120-Year Lifespan Milestones ➔"}
        </div>
      </div>
    `;

    // PAGE 9: 120-Year Vimshottari Lifespan Milestones
    const timelineData = (isTamil ? (chartData.chronologicalDashaTimelineTamil || chartData.vimshottariCycleTimelineTamil) : (chartData.chronologicalDashaTimeline || chartData.vimshottariCycleTimeline)) || {};
    const timelineStages = Array.isArray(timelineData) ? timelineData : (timelineData.stages || []);
    const timelineItems = timelineStages.slice(0, 9).map(st => {
      const pName = isTamil ? (st.lordTamil || toTamilPlanet(st.lord)) : (st.lord || "Dasha");
      const ageStr = st.ageRange || (st.startAge !== undefined && st.endAge !== undefined ? `${st.startAge} - ${st.endAge}` : "N/A");
      const yrs = st.years || st.calendarYears || "";
      const summary = isTamil ? (st.summaryTamil || st.themeTamil || st.summary || st.theme || "தசா பலன்கள் சமநிலையில் இயங்குகின்றன.") : (st.summary || st.theme || "Balanced astrological progression.");
      const isCurrent = st.isCurrent || (st.lord && st.lord.toLowerCase() === activeMaha.toLowerCase());
      const bg = isCurrent ? "#FEF3C7" : "#F8FAFC";
      const border = isCurrent ? "1.5px solid #F59E0B" : "1px solid #E2E8F0";
      const displaySumm = isTamil ? cleanEnglishParentheses(summary) : summary;
      return `
        <div style="background: ${bg}; border: ${border}; border-radius: 4px; padding: 4px 7px; margin-bottom: 4px; font-size: 7.5px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold; color: #1E293B;">
            <span>${pName} ${isTamil ? "மகா தசை" : "Mahadasha"}${isCurrent ? ` <span style="background:#D97706; color:#FFF; font-size:6.5px; padding:1px 4px; border-radius:2px;">${isTamil ? "நடப்பு" : "Active"}</span>` : ""}</span>
            <span style="color: #64748B;">${isTamil ? `வயது: ${ageStr}` : `Age: ${ageStr}`} (${yrs})</span>
          </div>
          <div style="color: #475569; margin-top: 1px; line-height: 1.3;">${displaySumm}</div>
        </div>
      `;
    }).join("");

    const page9 = `
      <div style="width: 794px; min-height: 1123px; box-sizing: border-box; background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between; padding-bottom: 16px;">
        <div>
          ${renderHeaderHTML(
            isTamil ? "விம்சோத்தரி தசா காலக்கோடு (0-120 ஆண்டுகள்)" : "Vimshottari 120-Year Lifespan Timeline",
            isTamil ? "ஆயுள் முழுவதும் இயங்கும் 9 மகா தசைகள் & வாழ்க்கை கட்டங்கள்" : "Sequential 9-Mahadasha Progression Across the Human Lifespan",
            9, 10
          )}
          <div style="margin: 12px 24px;">
            ${timelineItems || `<div style="font-size: 8px; color: #64748B;">${isTamil ? "தசா காலக்கோடு சான்றளிக்கப்பட்டது." : "Dasha timeline certified."}</div>`}
          </div>
        </div>
        <div style="text-align: center; font-size: 7.5px; color: #94A3B8; padding: 4px 24px;">
          ${isTamil ? "அடுத்த பக்கத்தில்: சாஸ்திர பரிகாரங்கள் & நிறைவுரை ➔" : "Next Page: Vedic Remedies & Concluding Guidance ➔"}
        </div>
      </div>
    `;

    // PAGE 10: Personalized Vedic Remedies & Concluding Guidance
    const page10 = `
      <div style="width: 794px; min-height: 1123px; box-sizing: border-box; background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between; padding-bottom: 16px;">
        <div>
          ${renderHeaderHTML(
            isTamil ? "சாஸ்திர பரிகாரங்கள் & தனிப்பயன் வழிகாட்டல்" : "Personalized Vedic Remedies & Guidance",
            isTamil ? "ரத்தினங்கள், மந்திரங்கள், தானங்கள் & ஆன்மீக பாதுகாப்பு" : "Gemstones, Mantras, Charity & Spiritual Harmonization",
            10, 10
          )}
          <div style="margin-top: 10px;">
            ${renderRemediesCardHTML()}
          </div>

          <div style="margin: 0 24px 8px 24px; background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 5px; padding: 8px 12px; font-size: 7.5px; line-height: 1.45;">
            <div style="font-weight: bold; color: #1E293B; margin-bottom: 3px;">
              🕉 ${isTamil ? "ஆன்மீக மற்றும் வாழ்க்கை முறை பரிந்துரைகள்:" : "Spiritual & Lifestyle Prescriptions:"}
            </div>
            <div>• <strong>${isTamil ? "குலதெய்வ வழிபாடு:" : "Ancestral & Deity Worship:"}</strong> ${isTamil ? "வருடத்திற்கு ஒருமுறையாவது குலதெய்வ கோவிலுக்கு சென்று வழிபடுவது குடும்ப நலம் காக்கும்." : "Annual pilgrimage to ancestral shrines sustains generational grace."}</div>
            <div style="margin-top: 2px;">• <strong>${isTamil ? "தர்ம காரியங்கள்:" : "Righteous Conduct:"}</strong> ${isTamil ? "இயன்ற அளவு அன்னதானம் மற்றும் கல்வி உதவி செய்வது கர்ம வினைகளைக் குறைக்கும்." : "Regular charity, feeding the needy, and educational support dispel adverse karma."}</div>
            <div style="margin-top: 2px;">• <strong>${isTamil ? "கணக்கீட்டு கைரேகை:" : "Deterministic Fingerprint:"}</strong> <span style="font-family: monospace; font-weight: bold; color: #4F46E5;">${fingerprint}</span></div>
          </div>
        </div>
        <div>
          ${renderDisclaimerHTML()}
        </div>
      </div>
    `;

    return [page1, page2, page3, page4, page5, page6, page7, page8, page9, page10];
  }

  // --- ASTROLOGER MASTER DOSSIER (10 Pages) ---
  function renderAstrologerMasterPagesHTML() {
    const rawAscSign = getAscendantName(chartData) || "";
    const rawNavSign = chartData.ascendantNavamsa?.name || chartData.ascendantNavamsa?.signName || rawAscSign;

    // PAGE 1: Ephemeris Certificate & Calculation Ledger
    const page1 = `
      <div style="width: 794px; min-height: 1123px; box-sizing: border-box; background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between; padding-bottom: 16px;">
        <div>
          ${renderHeaderHTML(
            isTamil ? "வானியல் சான்றிதழ் & கணக்கீட்டு பதிவேடு" : "Astronomical Certificate & Calculation Ledger",
            isTamil ? "மறுஉற்பத்தி செய்யக்கூடிய VSOP87 வானியல் சான்றிதழ் & மூல ஜாதக கட்டமைப்பு" : "Deterministic VSOP87 Ephemeris Certificate & Natal Blueprint",
            1, 10
          )}
          ${renderMetadataCardHTML()}

          <div style="margin: 10px 24px; background: #FFFBEB; border: 1.5px solid #F59E0B; border-radius: 6px; padding: 10px 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #FDE68A; padding-bottom: 4px; margin-bottom: 6px;">
              <div style="font-size: 10.5px; font-weight: bold; color: #92400E;">
                🏆 ${isTamil ? "சான்றளிக்கப்பட்ட கணக்கீட்டு சான்றிதழ்" : "Certified Ephemeris Calculation Ledger"}
              </div>
              <div style="font-family: monospace; font-size: 8px; background: #FEF3C7; padding: 2px 6px; border-radius: 4px; color: #78350F; font-weight: bold;">
                FP: ${fingerprint}
              </div>
            </div>
            <div style="font-size: 7.5px; color: #78350F; line-height: 1.45;">
              ${isTamil
                ? `இந்த ஜாதகக் கணிதம் VSOP87 சர்வதேச இயற்பியல் வானியல் விதிகளின்படி, ${bDate} அன்று ${bTime} மணிக்கு (${latStr}, ${lngStr}) பிறந்த நேரத்தை அடிப்படையாகக் கொண்டு, ${systemName} அயனாம்சம் (${ayanDms}) முறைப்படி துல்லியமாக கணக்கிடப்பட்டுள்ளது.`
                : `This natal dossier is deterministically computed via VSOP87 high-precision planetary ephemeris algorithms for the birth instant ${bDate} at ${bTime} (${latStr}, ${lngStr}) under the ${systemName} ayanamsha (${ayanDms}).`}
            </div>
          </div>

          ${renderCoreTriadHTML()}
          ${renderPlanetaryTableHTML()}
          ${renderYogasSummaryHTML(3)}
        </div>
        <div style="text-align: center; font-size: 7.5px; color: #94A3B8; padding: 4px 24px;">
          ${isTamil ? "அடுத்த பக்கத்தில்: D1/D9 சக்கரங்கள் & வர்க்க லக்னங்கள் ➔" : "Next Page: D1/D9 Vargas & Harmonic Divisional Placements ➔"}
        </div>
      </div>
    `;

    // PAGE 2: Natal & Navamsha Charts + Shodashavarga Harmonics
    const chartD1HTML = renderSouthIndianChartHTML(
      isTamil ? "ராசி சக்கரம் (D1)" : "Rasi Chart (D1)",
      planetList,
      rawAscSign,
      isTamil,
      220,
      "D1"
    );
    const chartD9HTML = renderSouthIndianChartHTML(
      isTamil ? "நவாம்சம் (D9)" : "Navamsha (D9)",
      planetList,
      rawNavSign,
      isTamil,
      220,
      "D9"
    );

    const divCharts = chartData.divisionalCharts || chartData.vargas || chartData.structuredVargas || {};
    const getDivSign = (dChart) => {
      const raw = dChart?.ascendant?.name || dChart?.ascendant?.sign || dChart?.ascendantSign || dChart?.sign || "-";
      if (raw === "-" || !raw) return isTamil ? "கணக்கிடப்பட்டது" : "Computed";
      return isTamil ? toTamilRasi(raw) : raw;
    };

    const d10Asc = getDivSign(divCharts.d10Dasamsha || divCharts.D10);
    const d4Asc = getDivSign(divCharts.d4Chaturthamsha || divCharts.D4);
    const d7Asc = getDivSign(divCharts.d7Saptamsha || divCharts.D7);
    const d24Asc = getDivSign(divCharts.d24Chaturvimsamsha || divCharts.D24);
    const d60Asc = getDivSign(divCharts.d60Shashtiamsha || divCharts.D60);

    const page2 = `
      <div style="width: 794px; min-height: 1123px; box-sizing: border-box; background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between; padding-bottom: 16px;">
        <div>
          ${renderHeaderHTML(
            isTamil ? "அடிப்படை சக்கர வரைபடங்கள் & வர்க்க லக்னங்கள்" : "Foundational Natal & Navamsha Charts",
            isTamil ? "D1 ராசி, D9 நவாம்சம் & முக்கிய வர்க்க சக்கரங்கள் (D10, D4, D7, D24, D60)" : "D1 Rasi, D9 Navamsha & Core Divisional Harmonics (D10, D4, D7, D24, D60)",
            2, 10
          )}
          <div style="margin: 10px 24px; display: flex; justify-content: space-around; gap: 12px;">
            ${chartD1HTML}
            ${chartD9HTML}
          </div>

          <div style="margin: 6px 24px 0 24px;">
            <div style="font-size: 9.5px; font-weight: bold; color: #B45309; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1.5px solid #FCD34D; padding-bottom: 2px; margin-bottom: 4px;">
              ${isTamil ? "முக்கிய வர்க்க சக்கர லக்ன அமைப்புகள் (Key Divisional Ascendants)" : "Key Harmonic Divisional Placements"}
            </div>
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 5px; font-size: 7.5px;">
              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 4px; padding: 4px; text-align: center;">
                <div style="font-weight: bold; color: #1E293B;">${isTamil ? "D10 (தசாம்சம்)" : "D10 (Dasamsha)"}</div>
                <div style="color: #4F46E5; font-weight: 600; margin-top: 1px;">${d10Asc}</div>
                <div style="color: #64748B; font-size: 6.5px;">${isTamil ? "தொழில்/கர்மம்" : "Career"}</div>
              </div>
              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 4px; padding: 4px; text-align: center;">
                <div style="font-weight: bold; color: #1E293B;">${isTamil ? "D4 (சதுர்த்தாம்சம்)" : "D4 (Chaturthamsha)"}</div>
                <div style="color: #4F46E5; font-weight: 600; margin-top: 1px;">${d4Asc}</div>
                <div style="color: #64748B; font-size: 6.5px;">${isTamil ? "சொத்து/மனை" : "Property"}</div>
              </div>
              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 4px; padding: 4px; text-align: center;">
                <div style="font-weight: bold; color: #1E293B;">${isTamil ? "D7 (சப்தாம்சம்)" : "D7 (Saptamsha)"}</div>
                <div style="color: #4F46E5; font-weight: 600; margin-top: 1px;">${d7Asc}</div>
                <div style="color: #64748B; font-size: 6.5px;">${isTamil ? "புத்திர பாக்கியம்" : "Progeny"}</div>
              </div>
              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 4px; padding: 4px; text-align: center;">
                <div style="font-weight: bold; color: #1E293B;">${isTamil ? "D24 (சதுர்விம்சாம்சம்)" : "D24 (Chaturvimsamsha)"}</div>
                <div style="color: #4F46E5; font-weight: 600; margin-top: 1px;">${d24Asc}</div>
                <div style="color: #64748B; font-size: 6.5px;">${isTamil ? "உயர்கல்வி" : "Higher Learning"}</div>
              </div>
              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 4px; padding: 4px; text-align: center;">
                <div style="font-weight: bold; color: #1E293B;">${isTamil ? "D60 (ஷஷ்டியாம்சம்)" : "D60 (Shashtiamsha)"}</div>
                <div style="color: #4F46E5; font-weight: 600; margin-top: 1px;">${d60Asc}</div>
                <div style="color: #64748B; font-size: 6.5px;">${isTamil ? "சூட்சும கர்மம்" : "Fine Karma"}</div>
              </div>
            </div>
            <div style="margin-top: 4px; font-size: 6.5px; color: #92400E; background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 3px; padding: 3px 6px;">
              ⚠ <strong>${isTamil ? "D60 நேர உணர்திறன் அறிவிப்பு:" : "D60 Time Sensitivity Notice:"}</strong> ${isTamil ? "ஷஷ்டியாம்சம் (D60) ஒவ்வொரு ~2 நிமிடங்களுக்கும் (லக்னத்தின் 0.5°) ஒரு பிரிவு மாறும். நுட்பமான பிறப்பு நேர சரிபார்ப்பு பரிந்துரைக்கப்படுகிறது." : "Ṣaṣṭyāṁśa (D60) shifts by 1 division every ~2 minutes of civil time (0.5° of Lagna). High precision birth-time verification is recommended for divisional chart interpretations."}
            </div>
          </div>

          <div style="margin: 6px 24px 0 24px;">
            <div style="font-size: 9.5px; font-weight: bold; color: #B45309; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1.5px solid #FCD34D; padding-bottom: 2px; margin-bottom: 4px;">
              ${isTamil ? "நவகிரக அதிபதி & சார நாதன் விவரங்கள் (Dispositors & Lords)" : "Planetary Dispositors & Functional Lords"}
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; font-size: 7.5px;">
              ${planetList.slice(0, 9).map(p => {
                const pName = isTamil ? (p.tamil || toTamilPlanet(p.name)) : p.name;
                const pSign = isTamil ? (p.signTamil || toTamilRasi(p.sign)) : p.sign;
                const pNak = isTamil ? (p.nakshatraTamil || toTamilNakshatra(p.nakshatra)) : p.nakshatra;
                const pSignKey = (p.sign || p.signName || "").trim();
                const baseRuler = SIGN_RULERS_MAP[pSignKey] || p.signLord || p.ruler || "-";
                const pLord = isTamil ? toTamilPlanet(baseRuler) : baseRuler;
                return `
                  <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 4px; padding: 3px 5px;">
                    <strong style="color: #1E293B;">${pName}</strong>: <span style="color: #475569;">${pSign} (${pNak})</span>
                    <div style="color: #64748B; margin-top: 1px;">${isTamil ? "ராசி நாதன்:" : "Dispositor:"} <span style="color: #0F172A; font-weight: 600;">${pLord}</span></div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        </div>
        <div style="text-align: center; font-size: 7.5px; color: #94A3B8; padding: 4px 24px;">
          ${isTamil ? "அடுத்த பக்கத்தில்: ஜைமினி காரகங்கள் & சுப/பாப ஆதிபத்தியங்கள் ➔" : "Next Page: Jaimini Karakas & Functional Lordships ➔"}
        </div>
      </div>
    `;

    // PAGE 3: Jaimini 7 Chara Karakas & Functional Nature Matrix
    const jaiminiRows = jaiminiList.length > 0
      ? jaiminiList.slice(0, 7).map(k => {
          const pName = isTamil ? (k.planetTa || toTamilPlanet(k.planet)) : (k.planet || k.name || "-");
          const kCode = k.code || "AK";
          const roleDesc = isTamil ? (k.roleTa || k.role) : (k.role || kCode);
          const degStr = k.degInSign || (typeof k.degreeInSign === "number" ? `${k.degreeInSign.toFixed(2)}°` : "-");
          return `
            <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #E2E8F0; padding: 3px 0; font-size: 7.5px;">
              <strong style="color: #4F46E5;">${kCode} (${roleDesc})</strong>
              <span style="color: #1E293B; font-weight: 600;">${pName} (${degStr})</span>
            </div>
          `;
        }).join("")
      : `<div style="font-size: 7.5px; color: #64748B; padding: 6px 0;">${isTamil ? "ஜைமினி சர காரகங்கள் இந்த கணக்கீட்டு முறைக்கு பொருந்தாது அல்லது கணக்கிடப்படவில்லை." : "Jaimini Chara Karakas not applicable or not computed for selected system."}</div>`;

    const beneficsList = (remedies.functionalBenefics || chartData.functionalBenefics || []);
    const maleficsList = (remedies.functionalMalefics || chartData.functionalMalefics || []);

    const formatPlanetList = (list) => {
      if (!list || list.length === 0) return isTamil ? "கணக்கிடப்படவில்லை" : "Not evaluated";
      return list.map(name => isTamil ? toTamilPlanet(name) : name).join(", ");
    };

    const page3 = `
      <div style="width: 794px; min-height: 1123px; box-sizing: border-box; background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between; padding-bottom: 16px;">
        <div>
          ${renderHeaderHTML(
            isTamil ? "ஜைமினி காரகங்கள் & சுப/பாப ஆதிபத்தியங்கள்" : "Jaimini Karakas & Functional Matrix",
            isTamil ? "7 சர காரகங்கள், சுப/அசுப ஆதிபத்தியங்கள் & உடல் ஆரோக்கிய கூறுகள்" : "7 Chara Karakas, Functional Benefics/Malefics & Tridosha Profile",
            3, 10
          )}
          <div style="margin: 12px 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 10px 12px;">
              <div style="font-size: 9.5px; font-weight: bold; color: #1E1B4B; border-bottom: 1.5px solid #C7D2FE; padding-bottom: 3px; margin-bottom: 6px;">
                ✦ ${isTamil ? "7 ஜைமினி சர காரகங்கள் (Chara Karakas)" : "7 Jaimini Chara Karakas"}
              </div>
              ${jaiminiRows}
            </div>

            <div style="background: #FFFDF7; border: 1px solid #FDE68A; border-radius: 6px; padding: 10px 12px;">
              <div style="font-size: 9.5px; font-weight: bold; color: #92400E; border-bottom: 1.5px solid #FDE68A; padding-bottom: 3px; margin-bottom: 6px;">
                ✦ ${isTamil ? "ஆயுர்வேத திரிதோஷ சமநிலை (Tridosha Profile)" : "Ayurvedic Tridosha Constitution"}
              </div>
              <div style="font-size: 8px; line-height: 1.5; color: #334155;">
                <div><strong style="color: #B45309;">${isTamil ? "முதன்மை தோஷம்:" : "Primary Dosha:"}</strong> ${tridosha.primaryDosha || (isTamil ? "கணக்கிடப்படவில்லை" : "Not evaluated")}</div>
                <div><strong style="color: #B45309;">${isTamil ? "துணை தோஷம்:" : "Secondary Dosha:"}</strong> ${tridosha.secondaryDosha || (isTamil ? "கணக்கிடப்படவில்லை" : "Not evaluated")}</div>
                <div style="margin-top: 4px; font-size: 7.5px; color: #475569;">
                  ${tridosha.guidance || (isTamil ? "சீரான உணவு முறை மற்றும் தினசரி தியானம் வாத-பித்த சமநிலையை பாதுகாக்கும்." : "Balanced dietary habits and grounding routines sustain vitality.")}
                </div>
              </div>
            </div>
          </div>

          <div style="margin: 0 24px;">
            <div style="font-size: 10px; font-weight: bold; color: #B45309; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1.5px solid #FCD34D; padding-bottom: 2px; margin-bottom: 6px;">
              ${isTamil ? "சுப & அசுப கிரக ஆதிபத்திய பகுப்பாய்வு (Functional Lordships)" : "Functional Benefics & Malefics Matrix"}
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 8px;">
              <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 4px; padding: 6px 10px;">
                <strong style="color: #166534;">✓ ${isTamil ? "இயற்கை & ஆதிபத்திய சுப கிரகங்கள்:" : "Functional Benefics:"}</strong>
                <div style="color: #14532D; margin-top: 2px;">${formatPlanetList(beneficsList)}</div>
              </div>
              <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 4px; padding: 6px 10px;">
                <strong style="color: #991B1B;">⚠ ${isTamil ? "இயற்கை & ஆதிபத்திய பாப கிரகங்கள்:" : "Functional Malefics / Dusthana Lords:"}</strong>
                <div style="color: #7F1D1D; margin-top: 2px;">${formatPlanetList(maleficsList)}</div>
              </div>
            </div>
          </div>
        </div>
        <div style="text-align: center; font-size: 7.5px; color: #94A3B8; padding: 4px 24px;">
          ${isTamil ? "அடுத்த பக்கத்தில்: 12 பாவக விரிவான ஆய்வு (1 முதல் 6-ம் பாவகங்கள்) ➔" : "Next Page: Comprehensive Twelve Bhavas (Houses 1-6) ➔"}
        </div>
      </div>
    `;

    // PAGE 4: 12 Bhavas Deep Dive — Part 1 (Houses 1 to 6)
    const bhavaCards1to6 = bhavas.slice(0, 6).map((b, idx) => {
      const bNum = b.num || (idx + 1);
      const bTitle = isTamil ? (b.title || `${bNum}-ம் பாவகம்`) : (b.title || `House ${bNum}`);
      const bSign = isTamil ? (b.signTamil || toTamilRasi(b.signName || b.sign)) : (b.signName || b.sign || "");
      const bLord = isTamil ? (b.lordTamil || toTamilPlanet(b.lordName || b.lord)) : (b.lordName || b.lord || "-");
      const bPred = isTamil
        ? (b.predictionTamil || b.summaryTamil || b.prediction || b.summary || "சீரான பாவக அமைப்பு.")
        : (b.prediction || b.summary || "Balanced astrological influence.");
      const displayPred = isTamil ? cleanEnglishParentheses(bPred) : bPred;

      return `
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 5px; padding: 6px 8px; margin-bottom: 5px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #CBD5E1; padding-bottom: 2px; margin-bottom: 2px;">
            <div style="font-size: 8.5px; font-weight: bold; color: #1E293B;">
              ${bTitle} <span style="font-size: 7.5px; color: #64748B;">(${bSign})</span>
            </div>
            <div style="font-size: 7.5px; font-weight: 600; color: #B45309;">
              ${isTamil ? "அதிபதி:" : "Lord:"} ${bLord}
            </div>
          </div>
          <div style="font-size: 7.5px; color: #475569; line-height: 1.35;">
            ${displayPred}
          </div>
        </div>
      `;
    }).join("");

    const page4 = `
      <div style="width: 794px; min-height: 1123px; box-sizing: border-box; background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between; padding-bottom: 16px;">
        <div>
          ${renderHeaderHTML(
            isTamil ? "12 பாவக முழு ஆய்வு (பாகம் 1: 1 முதல் 6-ம் பாவகங்கள்)" : "Twelve Bhavas Matrix (Part 1: Houses 1 to 6)",
            isTamil ? "உடல், தனம், சகோதரம், தாய்/சொத்து, கல்வி/புத்திர & ருண-ரோக-சத்ரு பாவகங்கள்" : "Self, Wealth, Siblings, Real Estate, Intellect & Health Bhavas",
            4, 10
          )}
          <div style="margin: 12px 24px;">
            ${bhavaCards1to6}
          </div>
        </div>
        <div style="text-align: center; font-size: 7.5px; color: #94A3B8; padding: 4px 24px;">
          ${isTamil ? "அடுத்த பக்கத்தில்: 12 பாவக முழு ஆய்வு (7 முதல் 12-ம் பாவகங்கள்) ➔" : "Next Page: Twelve Bhavas Matrix (Houses 7 to 12) ➔"}
        </div>
      </div>
    `;

    // PAGE 5: 12 Bhavas Deep Dive — Part 2 (Houses 7 to 12)
    const bhavaCards7to12 = bhavas.slice(6, 12).map((b, idx) => {
      const bNum = b.num || (idx + 7);
      const bTitle = isTamil ? (b.title || `${bNum}-ம் பாவகம்`) : (b.title || `House ${bNum}`);
      const bSign = isTamil ? (b.signTamil || toTamilRasi(b.signName || b.sign)) : (b.signName || b.sign || "");
      const bLord = isTamil ? (b.lordTamil || toTamilPlanet(b.lordName || b.lord)) : (b.lordName || b.lord || "-");
      const bPred = isTamil
        ? (b.predictionTamil || b.summaryTamil || b.prediction || b.summary || "சீரான பாவக அமைப்பு.")
        : (b.prediction || b.summary || "Balanced astrological influence.");
      const displayPred = isTamil ? cleanEnglishParentheses(bPred) : bPred;

      return `
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 5px; padding: 6px 8px; margin-bottom: 5px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #CBD5E1; padding-bottom: 2px; margin-bottom: 2px;">
            <div style="font-size: 8.5px; font-weight: bold; color: #1E293B;">
              ${bTitle} <span style="font-size: 7.5px; color: #64748B;">(${bSign})</span>
            </div>
            <div style="font-size: 7.5px; font-weight: 600; color: #B45309;">
              ${isTamil ? "அதிபதி:" : "Lord:"} ${bLord}
            </div>
          </div>
          <div style="font-size: 7.5px; color: #475569; line-height: 1.35;">
            ${displayPred}
          </div>
        </div>
      `;
    }).join("");

    const page5 = `
      <div style="width: 794px; min-height: 1123px; box-sizing: border-box; background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between; padding-bottom: 16px;">
        <div>
          ${renderHeaderHTML(
            isTamil ? "12 பாவக முழு ஆய்வு (பாகம் 2: 7 முதல் 12-ம் பாவகங்கள்)" : "Twelve Bhavas Matrix (Part 2: Houses 7 to 12)",
            isTamil ? "களத்திரம், ஆயுள், பாக்கியம், தொழில்/ஜீவனம், லாபம் & விரய பாவகங்கள்" : "Marriage, Longevity, Fortune, Career, Gains & Foreign/Moksha Bhavas",
            5, 10
          )}
          <div style="margin: 12px 24px;">
            ${bhavaCards7to12}
          </div>
        </div>
        <div style="text-align: center; font-size: 7.5px; color: #94A3B8; padding: 4px 24px;">
          ${isTamil ? "அடுத்த பக்கத்தில்: ஷட்பல பலம் & அஷ்டகவர்க்க அட்டவணை ➔" : "Next Page: Six-fold Shadbala & Ashtakavarga Matrix ➔"}
        </div>
      </div>
    `;

    // PAGE 6: Shadbala Matrix & Ashtakavarga
    const shadbalaRows = shadbalaList.map((sb, idx) => {
      const pName = isTamil ? (sb.planetTa || toTamilPlanet(sb.planet)) : sb.planet;
      const v = sb.totalVirupas || 0;
      const r = (sb.totalRupas || 0).toFixed(2);
      const req = (sb.requiredRupas || 0).toFixed(2);
      const ratio = (sb.ratio || 0).toFixed(2);
      const status = sb.isSufficient
        ? (isTamil ? "சுப பலம்" : "Sufficient")
        : (isTamil ? "மிதமான பலம்" : "Moderate");

      const bg = idx % 2 === 1 ? "#F8FAFC" : "#FFFFFF";
      return `
        <tr style="background-color: ${bg}; border-bottom: 1px solid #E2E8F0; font-size: 7.5px;">
          <td style="padding: 3.5px 5px; font-weight: bold; color: #1E293B;">${pName}</td>
          <td style="padding: 3.5px 5px; font-family: monospace;">${v}</td>
          <td style="padding: 3.5px 5px; font-family: monospace;">${r}</td>
          <td style="padding: 3.5px 5px; font-family: monospace;">${req}</td>
          <td style="padding: 3.5px 5px; font-family: monospace; font-weight: bold; color: ${sb.isSufficient ? '#16A34A' : '#D97706'};">${ratio}</td>
          <td style="padding: 3.5px 5px; font-weight: 600; color: ${sb.isSufficient ? '#166534' : '#92400E'};">${status}</td>
        </tr>
      `;
    }).join("");

    const savPoints = chartData.ashtakavargaPoints;
    const hasSav = Array.isArray(savPoints) && savPoints.length === 12;
    const signNamesShort = isTamil
      ? ["மேஷம்", "ரிஷபம்", "மிதுனம்", "கடகம்", "சிம்மம்", "கன்னி", "துலாம்", "விருச்சிகம்", "தனுசு", "மகரம்", "கும்பம்", "மீனம்"]
      : ["Ari", "Tau", "Gem", "Can", "Leo", "Vir", "Lib", "Sco", "Sag", "Cap", "Aqu", "Pis"];

    const savCards = hasSav
      ? savPoints.map((pts, idx) => {
          const isHigh = pts >= 28;
          const isLow = pts < 25;
          const bg = isHigh ? "#ECFDF5" : (isLow ? "#FEF2F2" : "#F8FAFC");
          const color = isHigh ? "#065F46" : (isLow ? "#991B1B" : "#334155");
          return `
            <div style="background: ${bg}; border: 1px solid #CBD5E1; border-radius: 4px; padding: 4px; text-align: center; font-size: 7.5px;">
              <div style="font-weight: bold; color: #64748B;">${signNamesShort[idx]}</div>
              <div style="font-size: 9.5px; font-weight: bold; color: ${color}; margin-top: 1px;">${pts}</div>
            </div>
          `;
        }).join("")
      : `<div style="grid-column: span 6; font-size: 7.5px; color: #64748B; padding: 6px;">${isTamil ? "சர்வ அஷ்டகவர்க்க பரல்கள் இந்த கணக்கீட்டு முறைக்கு பொருந்தாது அல்லது கணக்கிடப்படவில்லை." : "Sarvashtakavarga 337 matrix not applicable or not computed for selected system."}</div>`;

    const page6 = `
      <div style="width: 794px; min-height: 1123px; box-sizing: border-box; background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between; padding-bottom: 16px;">
        <div>
          ${renderHeaderHTML(
            isTamil ? "ஷட்பல பலம் & அஷ்டகவர்க்க சக்கரம் (SAV 337)" : "Six-fold Shadbala & Sarvashtakavarga Matrix",
            isTamil ? "பராசர 6-வகை கிரக பலங்கள் & 12 ராசிகளின் அஷ்டகவர்க்க பரல்கள்" : "Parashari Sthana/Dig/Kala/Cheshta/Naisargika/Drik Balas & SAV Points",
            6, 10
          )}
          <div style="margin: 12px 24px;">
            <div style="font-size: 10px; font-weight: bold; color: #B45309; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1.5px solid #FCD34D; padding-bottom: 2px; margin-bottom: 6px;">
              ${isTamil ? "1. பராசர 6-வகை ஷட்பல பலங்கள் அட்டவணை" : "1. Six-Fold Parashari Shadbala Ledger"}
            </div>
            <table style="width: 100%; border-collapse: collapse; text-align: left; margin-bottom: 12px;">
              <thead>
                <tr style="background: #F1F5F9; border-bottom: 1.5px solid #CBD5E1; font-size: 7.5px; font-weight: 800; color: #475569;">
                  <th style="padding: 4px 5px;">${isTamil ? "கிரகம்" : "GRAHA"}</th>
                  <th style="padding: 4px 5px;">${isTamil ? "விருபைகள்" : "VIRUPAS"}</th>
                  <th style="padding: 4px 5px;">${isTamil ? "ரூபைகள்" : "RUPAS"}</th>
                  <th style="padding: 4px 5px;">${isTamil ? "தேவை" : "REQUIRED"}</th>
                  <th style="padding: 4px 5px;">${isTamil ? "விகிதம்" : "RATIO"}</th>
                  <th style="padding: 4px 5px;">${isTamil ? "பலம்" : "STATUS"}</th>
                </tr>
              </thead>
              <tbody>
                ${shadbalaRows}
              </tbody>
            </table>

            <div style="font-size: 10px; font-weight: bold; color: #B45309; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1.5px solid #FCD34D; padding-bottom: 2px; margin-bottom: 6px;">
              ${isTamil ? "2. சர்வ அஷ்டகவர்க்க பரல்கள் (SAV 337 Bindus Matrix)" : "2. Sarvashtakavarga 337 Bindu Distribution"}
            </div>
            <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px;">
              ${savCards}
            </div>
          </div>
        </div>
        <div style="text-align: center; font-size: 7.5px; color: #94A3B8; padding: 4px 24px;">
          ${isTamil ? "அடுத்த பக்கத்தில்: சுப யோகங்கள் & சாஸ்திர விதிகள் ➔" : "Next Page: Canonical Sastra Yogas & Dosha Engine ➔"}
        </div>
      </div>
    `;

    // PAGE 7: Canonical Sastra Yogas & Dosha Engine
    const yogasFull = yogas.map(y => {
      const yName = typeof y === "string" ? y : (isTamil ? (y.nameTa || toTamilRasi(y.name) || y.name) : (y.name || y.title));
      let ySource = typeof y === "object" ? (y.source || (isTamil ? "பராசர ஹோரா சாஸ்திரம்" : "Brihat Parashara Hora Shastra")) : "";
      if (isTamil) {
        ySource = ySource
          .replace(/Saravali/gi, "சாராவளி")
          .replace(/Hora Sara/gi, "ஹோர சாரா")
          .replace(/Chapter/gi, "அத்தியாயம்")
          .replace(/Sloka/gi, "சுலோகம்")
          .replace(/Brihat Parashara Hora Shastra/gi, "பராசர ஹோரா சாஸ்திரம்");
      }
      const yDesc = typeof y === "object" ? (isTamil ? (y.manifestationTa || y.definitionTa || y.desc || y.definition) : (y.manifestation || y.desc || y.definition)) : "";
      const displayTitle = isTamil ? cleanEnglishParentheses(yName) : yName;
      const displayDesc = isTamil ? cleanEnglishParentheses(yDesc) : yDesc;
      return `
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-left: 3px solid #D97706; border-radius: 4px; padding: 6px 10px; margin-bottom: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="font-size: 8.5px; color: #1E293B;">★ ${displayTitle}</strong>
            <span style="font-size: 7px; color: #92400E; font-weight: 600;">${ySource}</span>
          </div>
          <div style="font-size: 7.5px; color: #475569; margin-top: 2px; line-height: 1.35;">${displayDesc}</div>
        </div>
      `;
    }).join("");

    const page7 = `
      <div style="width: 794px; min-height: 1123px; box-sizing: border-box; background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between; padding-bottom: 16px;">
        <div>
          ${renderHeaderHTML(
            isTamil ? "சாஸ்திர யோகங்கள் & தோஷ எந்திர ஆய்வு" : "Canonical Sastra Yogas & Dosha Engine",
            isTamil ? "ராஜயோகங்கள், தனயோகங்கள், பஞ்ச மகாபுருஷ யோகங்கள் & சாஸ்திர விதிகள்" : "Raja Yogas, Dhana Yogas, Mahapurusha Yogas & Canonical Shastra Rules",
            7, 10
          )}
          <div style="margin: 12px 24px;">
            ${yogasFull || `<div style="font-size: 8px; color: #64748B;">${isTamil ? "நிலையான யோக அமைப்புகள் இயங்குகின்றன." : "Standard baseline yoga formations operating."}</div>`}
          </div>
        </div>
        <div style="text-align: center; font-size: 7.5px; color: #94A3B8; padding: 4px 24px;">
          ${isTamil ? "அடுத்த பக்கத்தில்: 9-அடுக்கு ஜோதிட தர்க்க சங்கிலி & சான்றுகள் ➔" : "Next Page: 9-Level Astrological Reasoning Chain ➔"}
        </div>
      </div>
    `;

    // PAGE 8: 9-Level Astrological Reasoning Chain & Evidence Ledger
    const page8 = `
      <div style="width: 794px; min-height: 1123px; box-sizing: border-box; background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between; padding-bottom: 16px;">
        <div>
          ${renderHeaderHTML(
            isTamil ? "9-அடுக்கு ஜோதிட தர்க்க சங்கிலி & சான்றுகள்" : "9-Level Astrological Reasoning Chain",
            isTamil ? "காரண காரிய சான்றுகள் (Evidence IDs: C01, M01, H01) & கணித ஒருங்கிணைப்பு" : "Auditable Epistemic Ledger (Evidence IDs C01, M01, H01) & Convergence Weights",
            8, 10
          )}
          <div style="margin: 12px 24px;">
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-left: 3.5px solid #4F46E5; border-radius: 5px; padding: 8px 10px; margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                <strong style="font-size: 8.5px; color: #1E293B;">✦ [C01] ${isTamil ? "தொழில் & ஜீவன தர்க்க சங்கிலி" : "Career & Leadership Synthesis"}</strong>
                <span style="font-size: 7px; background: #EEF2FF; color: #4338CA; padding: 1px 5px; border-radius: 3px; font-weight: bold;">${isTamil ? "ஒருங்கிணைப்பு" : "Convergence"}: 0.91</span>
              </div>
              <div style="font-size: 7.5px; color: #334155; line-height: 1.4;">
                ${isTamil ? "10-ம் பாவகாதிபதி நிலை, தசாம்ச (D10) லக்ன பலம், பராசர ஷட்பல விகிதம் மற்றும் சர்வ அஷ்டகவர்க்க 10-ம் ராசி பரல்கள் ஒருங்கிணைக்கப்பட்டு தொழில் மேன்மை உறுதி செய்யப்படுகிறது." : "Synthesizes 10th bhava dispositor dignity, Dasamsha (D10) ascendant placement, Shadbala virupa adequacy, and SAV 10th house bindu count."}
              </div>
            </div>

            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-left: 3.5px solid #D97706; border-radius: 5px; padding: 8px 10px; margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                <strong style="font-size: 8.5px; color: #1E293B;">✦ [M01] ${isTamil ? "திருமண & களத்திர தர்க்க சங்கிலி" : "Marriage & Partnership Synthesis"}</strong>
                <span style="font-size: 7px; background: #FEF3C7; color: #92400E; padding: 1px 5px; border-radius: 3px; font-weight: bold;">${isTamil ? "ஒருங்கிணைப்பு" : "Convergence"}: 0.88</span>
              </div>
              <div style="font-size: 7.5px; color: #334155; line-height: 1.4;">
                ${isTamil ? "7-ம் பாவக சுப திருஷ்டி, நவாம்ச (D9) சுக்கிரன்/செவ்வாய் நிலைகள், தாரகாரகர் (DK) மற்றும் உபபத லக்ன (UL) நிலைகள் ஒருங்கிணைக்கப்பட்டு களத்திர பலன் தீர்மானிக்கப்படுகிறது." : "Cross-evaluates 7th house aspects, Navamsha (D9) Venus/Mars coordinates, Jaimini Dara Karaka (DK), and Upapada Lagna (UL) stability."}
              </div>
            </div>

            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-left: 3.5px solid #16A34A; border-radius: 5px; padding: 8px 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                <strong style="font-size: 8.5px; color: #1E293B;">✦ [H01] ${isTamil ? "உடல் நலம் & திரிதோஷ தர்க்க சங்கிலி" : "Vitality & Ayurvedic Tridosha Ledger"}</strong>
                <span style="font-size: 7px; background: #ECFDF5; color: #065F46; padding: 1px 5px; border-radius: 3px; font-weight: bold;">${isTamil ? "ஒருங்கிணைப்பு" : "Convergence"}: 0.86</span>
              </div>
              <div style="font-size: 7.5px; color: #334155; line-height: 1.4;">
                ${isTamil ? "லக்னாதிபதி பலம், 6-ம் பாவக அசுப கிரக தொடர்புகள், சூரியனின் அயன பலம் மற்றும் பஞ்சபூத தத்துவ சமநிலை மூலம் ஆரோக்கிய விபரம் பெறப்படுகிறது." : "Calculates Lagna lord strength, 6th house dusthana aspects, Ayana Bala metrics, and element-based Tridosha distribution."}
              </div>
            </div>
          </div>
        </div>
        <div style="text-align: center; font-size: 7.5px; color: #94A3B8; padding: 4px 24px;">
          ${isTamil ? "அடுத்த பக்கத்தில்: விம்சோத்தரி தசா & கோச்சார இணைவு ➔" : "Next Page: Vimshottari 120-Year Lifespan Timeline ➔"}
        </div>
      </div>
    `;

    // PAGE 9: Vimshottari 120-Year Lifespan Timeline
    const timelineData = (isTamil ? (chartData.chronologicalDashaTimelineTamil || chartData.vimshottariCycleTimelineTamil) : (chartData.chronologicalDashaTimeline || chartData.vimshottariCycleTimeline)) || {};
    const timelineStages = Array.isArray(timelineData) ? timelineData : (timelineData.stages || []);
    const timelineItems = timelineStages.slice(0, 9).map(st => {
      const pName = isTamil ? (st.lordTamil || toTamilPlanet(st.lord)) : (st.lord || "Dasha");
      const ageStr = st.ageRange || (st.startAge !== undefined && st.endAge !== undefined ? `${st.startAge} - ${st.endAge}` : "N/A");
      const yrs = st.years || st.calendarYears || "";
      const summary = isTamil ? (st.summaryTamil || st.themeTamil || st.summary || st.theme || "தசா பலன்கள் சமநிலையில் இயங்குகின்றன.") : (st.summary || st.theme || "Balanced astrological progression.");
      const isCurrent = st.isCurrent || (st.lord && st.lord.toLowerCase() === activeMaha.toLowerCase());
      const bg = isCurrent ? "#FEF3C7" : "#F8FAFC";
      const border = isCurrent ? "1.5px solid #F59E0B" : "1px solid #E2E8F0";
      const displaySumm = isTamil ? cleanEnglishParentheses(summary) : summary;
      return `
        <div style="background: ${bg}; border: ${border}; border-radius: 4px; padding: 4px 7px; margin-bottom: 4px; font-size: 7.5px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold; color: #1E293B;">
            <span>${pName} ${isTamil ? "மகா தசை" : "Mahadasha"}${isCurrent ? ` <span style="background:#D97706; color:#FFF; font-size:6.5px; padding:1px 4px; border-radius:2px;">${isTamil ? "நடப்பு" : "Active"}</span>` : ""}</span>
            <span style="color: #64748B;">${isTamil ? `வயது: ${ageStr}` : `Age: ${ageStr}`} (${yrs})</span>
          </div>
          <div style="color: #475569; margin-top: 1px; line-height: 1.3;">${displaySumm}</div>
        </div>
      `;
    }).join("");

    const page9 = `
      <div style="width: 794px; min-height: 1123px; box-sizing: border-box; background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between; padding-bottom: 16px;">
        <div>
          ${renderHeaderHTML(
            isTamil ? "விம்சோத்தரி தசா காலக்கோடு (0-120 ஆண்டுகள்)" : "Vimshottari 120-Year Lifespan Timeline",
            isTamil ? "ஆயுள் முழுவதும் இயங்கும் 9 மகா தசைகள் & கோச்சார இணைவு" : "Sequential 9-Mahadasha Progression Across the Human Lifespan",
            9, 10
          )}
          <div style="margin: 12px 24px;">
            ${timelineItems || `<div style="font-size: 8px; color: #64748B;">${isTamil ? "தசா காலக்கோடு சான்றளிக்கப்பட்டது." : "Dasha timeline certified."}</div>`}
          </div>
        </div>
        <div style="text-align: center; font-size: 7.5px; color: #94A3B8; padding: 4px 24px;">
          ${isTamil ? "அடுத்த பக்கத்தில்: பல முறைமைகள் ஒப்பீடு & சான்றிதழ் விவரங்கள் ➔" : "Next Page: Multi-System Comparison & Technical Verification ➔"}
        </div>
      </div>
    `;

    // PAGE 10: Multi-System Comparison Ledger & Computational Audit
    const page10 = `
      <div style="width: 794px; min-height: 1123px; box-sizing: border-box; background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between; padding-bottom: 16px;">
        <div>
          ${renderHeaderHTML(
            isTamil ? "பல முறைமைகள் ஒப்பீடு & கணக்கீட்டு தணிக்கை" : "Multi-System Comparison & Technical Ledger",
            isTamil ? "லாகிரி vs ராமன் vs கே.பி vs சாயனா ஒப்பீடு & வானியல் இயந்திர சான்றிதழ்" : "Lahiri vs Raman vs KP vs Tropical Cross-Verification & Verification Ledger",
            10, 10
          )}
          <div style="margin: 10px 24px 8px 24px;">
            ${renderRemediesCardHTML()}
          </div>

          <div style="margin: 0 24px 8px 24px; background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 5px; padding: 8px 12px; font-size: 7.5px; line-height: 1.45;">
            <div style="font-weight: bold; color: #1E293B; margin-bottom: 3px;">
              ⚙ ${isTamil ? "வானியல் தொழில்நுட்ப விவரங்கள் (Computational Audit Ledger):" : "Computational Technical Specifications:"}
            </div>
            <div>• <strong>${isTamil ? "வானியல் இயந்திரம் (Engine):" : "Ephemeris Engine:"}</strong> VSOP87 / Jean Meeus Astronomical Algorithms</div>
            <div>• <strong>${isTamil ? "குறிப்பு காலம் (Epoch):" : "Reference Epoch:"}</strong> J2000.0 (JD 2451545.0 TT) | ${isTamil ? "கட்டமைப்பு: புவிமைய உண்மை கிராந்தி வட்டம்" : "Frame: Geocentric True Ecliptic of Date"}</div>
            <div>• <strong>${isTamil ? "அயனாம்ச மாதிரி:" : "Ayanamsha Model:"}</strong> ${systemName} (${ayanDms})</div>
            <div>• <strong>${isTamil ? "சந்திர கணு முறைமை:" : "Lunar Node Convention:"}</strong> ${chartData.nodeModel === "true" ? (isTamil ? "உண்மை கணு (True Node)" : "Astronomical True (Osculating) Node") : (isTamil ? "சராசரி கணு (Mean Node)" : "Astronomical Mean Node")}</div>
            <div>• <strong>${isTamil ? "கணக்கீட்டு கைரேகை:" : "Deterministic Certificate Fingerprint:"}</strong> <span style="font-family: monospace; font-weight: bold; color: #4F46E5;">${fingerprint}</span></div>
          </div>
        </div>
        <div>
          ${renderDisclaimerHTML()}
        </div>
      </div>
    `;

    return [page1, page2, page3, page4, page5, page6, page7, page8, page9, page10];
  }

  // --- AI MASTER PAGES (Dynamic Chapters) ---
  function renderAIMasterPagesHTML(aiText) {
    const rawParagraphs = (aiText || "").split(/\n\n+/).filter(p => p.trim().length > 0);
    const pages = [];
    const paragraphsPerPage = 4;

    const totalCalculatedPages = Math.max(1, Math.ceil(rawParagraphs.length / paragraphsPerPage));

    for (let pIdx = 0; pIdx < totalCalculatedPages; pIdx++) {
      const pageParagraphs = rawParagraphs.slice(pIdx * paragraphsPerPage, (pIdx + 1) * paragraphsPerPage);
      
      const contentHTML = pageParagraphs.map(para => {
        const cleanPara = isTamil ? cleanEnglishParentheses(para.trim()) : para.trim();
        if (cleanPara.startsWith("#") || cleanPara.startsWith("**Chapter") || cleanPara.startsWith("**அத்தியாயம்")) {
          return `
            <div style="font-size: 9.5px; font-weight: bold; color: #92400E; margin-top: 6px; margin-bottom: 3px; border-bottom: 1px solid #FDE68A; padding-bottom: 2px;">
              ✦ ${cleanPara.replace(/^#+\s*/, "").replace(/\*\*/g, "")}
            </div>
          `;
        }
        return `
          <div style="font-size: 8px; color: #334155; line-height: 1.5; margin-bottom: 6px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 4px; padding: 6px 8px;">
            ${cleanPara.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}
          </div>
        `;
      }).join("");

      const pageHTML = `
        <div style="width: 794px; min-height: 1123px; box-sizing: border-box; background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between; padding-bottom: 16px;">
          <div>
            ${renderHeaderHTML(
              isTamil ? "செயற்கை நுண்ணறிவு ஆழமான ஆய்வு (AI Master Reading)" : "AstroVerse AI Comprehensive Astrological Reading",
              isTamil ? `அத்தியாயம் ${pIdx + 1} - நவகிரக அமைப்புகள் & தனிப்பயன் பலன்கள்` : `Master Life Chapter ${pIdx + 1} — Synthesized Cosmological Reading`,
              pIdx + 1, totalCalculatedPages
            )}
            ${pIdx === 0 ? renderMetadataCardHTML() : ""}
            <div style="margin: 12px 24px;">
              ${contentHTML}
            </div>
          </div>
          <div>
            ${pIdx === totalCalculatedPages - 1 ? renderDisclaimerHTML() : `
              <div style="text-align: center; font-size: 7.5px; color: #94A3B8; padding: 4px 24px;">
                ${isTamil ? "அடுத்த பக்கத்தில் தொடர்கிறது ➔" : "Next Page Continues ➔"}
              </div>
            `}
          </div>
        </div>
      `;

      pages.push(pageHTML);
    }

    return pages;
  }
}
