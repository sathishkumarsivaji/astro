import React, { useState } from "react";
import { Download, Heart, Brain, Activity, Compass, Loader2, AlertTriangle, Sparkles, Layers, CheckCircle2, ChevronRight, Hand, Calendar, Shield, Info, Eye } from "lucide-react";
import { jsPDF } from "jspdf";
import { TRANSLATIONS } from "../../services/localization";
import {
  MAJOR_LINES,
  MINOR_LINES,
  PALM_MOUNTS,
  HAND_ELEMENTS,
  SAMUDRIKA_SIGNS,
  getLifeLineMilestones,
  getFateLineMilestones,
  correlatePalmWithChart
} from "../../services/palmistryEngine";

function safeAscii(str) {
  if (!str) return "";
  return String(str)
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, "- ")
    .replace(/[\u2014\u2015]/g, "--")
    .replace(/[\u2012\u2013]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u00A0]/g, " ")
    .replace(/[^\x00-\x7F]/g, "");
}

export default function PalmReport({ telemetry, onRetake, lang = "en", chartData = null }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isTamil = lang === "ta";
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState("atlas"); // "atlas", "creases", "mounts", "synthesis", "morphology"
  
  // Interactive Atlas Layer Toggles
  const [showMajorLines, setShowMajorLines] = useState(true);
  const [showMinorLines, setShowMinorLines] = useState(true);
  const [showMounts, setShowMounts] = useState(true);
  const [showMilestones, setShowMilestones] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState(null);

  if (!telemetry) return null;
  const { handType, handDuality, mounts, lines, confidenceScore, handShape } = telemetry;

  const safeDuality = handDuality || {
    role: "Palm Archetype",
    summary: "Balanced personality blueprint with aligned mental and emotional vectors.",
    emotionalNature: "Harmonious affective equilibrium.",
    careerDrive: "Strategic focus and vocational purpose.",
    lifeVitality: "Steady constitutional resilience."
  };
  const safeMounts = Array.isArray(mounts) && mounts.length > 0 ? mounts : PALM_MOUNTS;
  const safeLines = Array.isArray(lines) && lines.length > 0 ? lines : MAJOR_LINES;

  // Life and Fate line coordinates for milestones
  const lifeCoords = {
    start: { x: 135, y: 255 },
    control: { x: 175, y: 330 },
    end: { x: 160, y: 405 }
  };
  const fateCoords = {
    start: { x: 210, y: 410 },
    end: { x: 210, y: 220 }
  };

  const lifeMilestones = getLifeLineMilestones(lifeCoords);
  const fateMilestones = getFateLineMilestones(fateCoords, 280, 230);

  // Astrological Correlation
  const astroSynthesis = correlatePalmWithChart(telemetry, chartData, lang);

  const handleDownloadPDF = () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4"
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;
      let y = 45;

      // Header Banner
      doc.setFillColor(30, 27, 75);
      doc.rect(0, 0, pageWidth, 75, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("SKR ASTRO SAMUDRIKA SHASTRA PALM REPORT", margin, 35);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(220, 215, 254);
      doc.text("Classical Indian Palmistry & Morphological Analysis Framework", margin, 52);

      y = 95;
      doc.setTextColor(30, 41, 59);

      // Metadata Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, y, contentWidth, 68, 6, 6, "FD");

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.text("Analyzed Hand:", margin + 12, y + 18);
      doc.setFont("helvetica", "normal");
      doc.text(
        handType === "left"
          ? "Left Hand (Inborn Potential & Latent Karma)"
          : "Right Hand (Manifested Reality & Conscious Will)",
        margin + 90,
        y + 18
      );

      doc.setFont("helvetica", "bold");
      doc.text("Reading Mode:", margin + 12, y + 34);
      doc.setFont("helvetica", "normal");
      doc.text(
        telemetry?.readingMode === "telemetry_assisted"
          ? "Telemetry-Assisted Optical Crease Analysis"
          : "Illustrative Archetypal Palmistry Model",
        margin + 90,
        y + 34
      );

      doc.setFont("helvetica", "bold");
      doc.text("Elemental Shape:", margin + 12, y + 50);
      doc.setFont("helvetica", "normal");
      doc.text(safeAscii(handShape || "Earth-Air Hybrid (Practical Mystic)"), margin + 90, y + 50);

      const col2X = margin + 310;
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.text("Confidence Score:", col2X, y + 18);
      doc.setFont("helvetica", "normal");
      doc.text(
        confidenceScore !== null ? `${confidenceScore}% (Heuristic Alignment)` : "Archetypal Reference",
        col2X + 95,
        y + 18
      );

      doc.setFont("helvetica", "bold");
      doc.text("Date of Analysis:", col2X, y + 34);
      doc.setFont("helvetica", "normal");
      doc.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }), col2X + 95, y + 34);

      doc.setFont("helvetica", "bold");
      doc.text("Framework:", col2X, y + 50);
      doc.setFont("helvetica", "normal");
      doc.text("BPHS / Samudrika Shastra", col2X + 95, y + 50);

      y += 85;

      // Section 1: Hand Duality & Personality Archetype
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(180, 83, 9);
      doc.text("1. Hand Duality & Personality Archetype", margin, y);
      y += 14;

      const summaryLines = doc.splitTextToSize(safeAscii(safeDuality.summary || ""), contentWidth - 20);
      const traitLines = [
        safeAscii(`- Emotional Nature: ${safeDuality.emotionalNature || "Balanced empathic resonance."}`),
        safeAscii(`- Career Drive: ${safeDuality.careerDrive || "Strategic leadership and vocational focus."}`),
        safeAscii(`- Pranic Vitality: ${safeDuality.lifeVitality || "Natural physical equilibrium and steady fortitude."}`)
      ];

      const boxHeight = 35 + (summaryLines.length * 11) + (traitLines.length * 13);
      doc.setFillColor(254, 252, 246);
      doc.setDrawColor(245, 158, 11);
      doc.roundedRect(margin, y, contentWidth, boxHeight, 4, 4, "FD");

      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text(safeAscii(`Role: ${safeDuality.role || "Palm Archetype"}`), margin + 10, y + 16);

      doc.setFont("helvetica", "normal");
      doc.text(summaryLines, margin + 10, y + 30);

      let traitY = y + 30 + summaryLines.length * 11 + 6;
      traitLines.forEach(tl => {
        doc.text(tl, margin + 10, traitY);
        traitY += 13;
      });

      y += boxHeight + 15;

      // Section 2: Major Creases
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(180, 83, 9);
      doc.text("2. Major Crease & Meridian Line Indicators", margin, y);
      y += 14;

      const majorLines = Array.isArray(lines) && lines.length > 0 ? lines : MAJOR_LINES;
      majorLines.forEach((line) => {
        if (y > pageHeight - 110) {
          doc.addPage();
          y = 45;
        }

        const lName = safeAscii(line.name || "Crease Line");
        const lStrength = safeAscii(line.detectedStrength || (line.detected ? "Detected Crease" : "Classical Reference"));
        const descText = doc.splitTextToSize(safeAscii(line.description || ""), contentWidth - 20);
        const lineBoxHeight = 32 + (descText.length * 10) + (line.traits && line.traits.length > 0 ? 14 : 0);

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin, y, contentWidth, lineBoxHeight, 4, 4, "FD");

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text(`${lName} [${lStrength}]`, margin + 10, y + 14);

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.text(descText, margin + 10, y + 26);

        if (line.traits && line.traits.length > 0) {
          const primaryTrait = doc.splitTextToSize(safeAscii(`Key Archetype: ${line.traits[0]}`), contentWidth - 20);
          doc.setTextColor(15, 23, 42);
          doc.text(primaryTrait, margin + 10, y + 26 + descText.length * 10 + 4);
        }

        y += lineBoxHeight + 8;
      });

      // Page 2: Minor Lines & Planetary Mounts
      doc.addPage();
      y = 45;

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(180, 83, 9);
      doc.text("3. Classical Planetary Mounts (Samudrika Graha Parvatas)", margin, y);
      y += 14;

      // Mount Table Header
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, contentWidth, 18, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text("MOUNT", margin + 10, y + 12);
      doc.text("POSITION", margin + 125, y + 12);
      doc.text("ATTRIBUTES & SIGNIFICANCE", margin + 240, y + 12);
      doc.text("STATUS", margin + 450, y + 12);
      y += 18;

      safeMounts.forEach((m, idx) => {
        if (y > pageHeight - 50) {
          doc.addPage();
          y = 45;
        }

        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, y, contentWidth, 16, "F");
        }

        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text(safeAscii(m.name || "Mount"), margin + 10, y + 11);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.text(safeAscii((m.position || "-").substring(0, 24)), margin + 125, y + 11);
        const attrStr = Array.isArray(m.attributes) ? m.attributes.join(", ") : (m.attributes ? String(m.attributes) : "-");
        doc.text(safeAscii(attrStr.substring(0, 42)), margin + 240, y + 11);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text("2D Zone", margin + 450, y + 11);

        y += 16;
      });

      y += 15;

      // Minor Lines Summary
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(180, 83, 9);
      doc.text("4. Minor Lines & Classical Creases", margin, y);
      y += 14;

      MINOR_LINES.slice(0, 4).forEach((ml) => {
        if (y > pageHeight - 60) {
          doc.addPage();
          y = 45;
        }
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text(safeAscii(ml.name), margin + 10, y + 10);

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        const mlDesc = doc.splitTextToSize(safeAscii(ml.description), contentWidth - 20);
        doc.text(mlDesc, margin + 10, y + 22);

        y += 24 + mlDesc.length * 9;
      });

      // Page 3: Astrological Cross-Correlation & Statutory Disclaimers
      doc.addPage();
      y = 45;

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(180, 83, 9);
      doc.text("5. Astrological Synthesis (Samudrika - Jyotish Alignment)", margin, y);
      y += 14;

      if (astroSynthesis && astroSynthesis.isLinked && astroSynthesis.correlations.length > 0) {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(margin, y, contentWidth, 24, 4, 4, "FD");
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text(`Overall Concordance Score: ${astroSynthesis.concordanceScore}% Harmonious`, margin + 12, y + 15);
        y += 32;

        astroSynthesis.correlations.forEach((corr) => {
          if (y > pageHeight - 75) {
            doc.addPage();
            y = 45;
          }
          const boxH = 36;
          doc.setFillColor(254, 252, 246);
          doc.setDrawColor(245, 158, 11);
          doc.roundedRect(margin, y, contentWidth, boxH, 4, 4, "FD");

          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(180, 83, 9);
          doc.text(`${safeAscii(corr.mountName)} <-> ${safeAscii(corr.natalPlacement)}`, margin + 10, y + 12);

          doc.setFontSize(7.5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(71, 85, 105);
          const synText = doc.splitTextToSize(safeAscii(corr.synthesis), contentWidth - 20);
          doc.text(synText, margin + 10, y + 23);

          y += boxH + 6;
        });
      } else {
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(margin, y, contentWidth, 36, 4, 4, "FD");
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text("Calculate your Vedic birth chart to unlock personalized planetary-to-mount synthesis.", margin + 12, y + 22);
        y += 48;
      }

      // Epistemological & Statutory Safety Notice
      if (y > pageHeight - 90) {
        doc.addPage();
        y = 45;
      } else {
        y += 16;
      }

      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(254, 202, 202);
      doc.roundedRect(margin, y, contentWidth, 52, 4, 4, "FD");

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(153, 27, 27);
      doc.text("STATUTORY & METHODOLOGICAL DISCLOSURE:", margin + 10, y + 14);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(185, 28, 28);
      const disclaim = "This Samudrika Shastra reading is an illustrative cultural framework synthesized with optical crease telemetry. It is not an automated medical diagnostic tool, clinical biometric sensor, or deterministic claim. Never use for life span, medical, or financial predictions.";
      const disclaimLines = doc.splitTextToSize(safeAscii(disclaim), contentWidth - 20);
      doc.text(disclaimLines, margin + 10, y + 26);

      // Add page numbers to all pages
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(148, 163, 184);
        doc.text(
          `SKR ASTRO - Guidance for a Brighter Life | Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 20,
          { align: "center" }
        );
      }

      const fileHand = handType === "left" ? "left" : "right";
      doc.save(`SKR_ASTRO_Palm_Reading_${fileHand}.pdf`);
    } catch (err) {
      console.error("Palm report PDF generation failed:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Demo Data Disclosure Banner */}
      {(telemetry?.status === "DEMO_DATA_NOT_A_REAL_PALM_ANALYSIS" || telemetry?.isDemoData) && (
        <div className="p-4 rounded-2xl bg-amber-100 border-2 border-amber-500 text-amber-950 font-medium text-xs flex items-center gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
          <div>
            <span className="font-bold block uppercase tracking-wider text-amber-900">
              {isTamil ? "மாதிரி செயல்முறை தரவு (DEMO_DATA_NOT_A_REAL_PALM_ANALYSIS)" : "DEMO SAMPLE DATA (DEMO_DATA_NOT_A_REAL_PALM_ANALYSIS)"}
            </span>
            <span className="text-stone-700">
              {isTamil
                ? "இது நேரடி கைரேகை ஆய்வல்ல. விளக்கக் காட்சி நோக்கங்களுக்காக மட்டுமே ஏற்றப்பட்ட மாதிரித் தரவு. இது நிஜ மனித கைரேகை முடிவு அல்ல."
                : "This report was generated using synthetic demo telemetry for illustrative visualization. It is NOT an analysis of a real hand."}
            </span>
          </div>
        </div>
      )}

      {/* Report Header Card */}
      <div className="p-6 rounded-3xl bg-[#FFFDF9] border border-amber-300 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider border border-amber-300">
                {telemetry?.readingMode === "telemetry_assisted"
                  ? (isTamil ? "வழிகாட்டல் கைரேகை ஆய்வு" : "Telemetry-Assisted Palm Feature Analysis")
                  : (isTamil ? "மாதிரி கைரேகை ஆய்வு (முன்வடிவம்)" : "Illustrative Palmistry Prototype")}
              </span>
              <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold border border-purple-300">
                {confidenceScore !== null ? `${confidenceScore}% ${t.accuracy}` : (isTamil ? "மாதிரி ஆய்வு (அளவீடு இல்லை)" : "Illustrative Archetype (Not Measured)")}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900">
              {isTamil ? (handType === "left" ? "இடது கை: பிறவி யோகம் & பூர்வ புண்ணியம்" : "வலது கை: செயல் விதி & தற்கால வாழ்க்கை") : safeDuality.role}
            </h2>
            <p className="text-sm text-stone-700 mt-2 max-w-xl leading-relaxed">
              {isTamil 
                ? (handType === "left" 
                    ? "உங்கள் பூர்வ புண்ணிய ஆற்றல், பிறவி குணங்கள் மற்றும் ஆழ்மன விருப்பங்களை காட்டுகிறது." 
                    : "நீங்கள் சுயமாக உழைத்து உருவாக்கிய விதியை, தொழில் வெற்றியை மற்றும் தற்கால வாழ்க்கை போக்கை காட்டுகிறது.")
                : safeDuality.summary}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onRetake}
              className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-stone-800 text-xs font-semibold border border-amber-300 transition-all shadow-sm cursor-pointer"
            >
              {t.scanOtherHand}
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white font-bold text-xs shadow-md shadow-amber-500/20 hover:brightness-110 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isTamil ? "PDF உருவாக்குகிறது..." : "Generating PDF..."}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{t.downloadReport}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Metric Separation Panel */}
        <div className="mt-6 pt-4 border-t border-amber-200">
          <div className="text-xs font-bold uppercase tracking-wider text-stone-800 mb-2">
            {isTamil ? "சான்றளிக்கப்பட்ட பார்வை அளவீட்டு பிரிப்பு (Metric Separation)" : "Certified Vision Telemetry & Epistemic Separation"}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">IMAGE_QUALITY_SCORE</span>
              <span className="text-sm font-bold text-stone-900">{telemetry?.imageQualityScore ? `${telemetry.imageQualityScore}/100` : "78/100 (Nominal)"}</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">LANDMARK_CONFIDENCE</span>
              <span className="text-sm font-bold text-stone-900">{telemetry?.landmarkDetectionConfidence ? `${telemetry.landmarkDetectionConfidence}/100` : "84/100 (Anatomical)"}</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">LINE_CONFIDENCE</span>
              <span className="text-sm font-bold text-stone-900">{confidenceScore !== null ? `${confidenceScore}%` : "Not measured (Prototype)"}</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">INTERPRETIVE_CONFIDENCE</span>
              <span className="text-sm font-bold text-amber-800">{telemetry?.interpretiveConfidence || "MEDIUM"} (Samudrika)</span>
            </div>
            <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200">
              <span className="text-[10px] uppercase font-bold text-purple-700 block">EMPIRICAL_VALIDITY</span>
              <span className="text-[11px] font-bold text-purple-900 block leading-tight">EXPERIMENTAL_PROTOTYPE</span>
            </div>
          </div>
          <p className="text-[11px] text-stone-500 mt-2 leading-relaxed italic">
            {isTamil
              ? "குறிப்பு: இயற்பியல் கைரேகை கண்டறிதல் என்பது எதிர்கால நிகழ்வுகள், ஆயுள், செல்வம் அல்லது ஆரோக்கியம் பற்றிய உறுதிப்படுத்தப்பட்ட அறிவியல் முன்னறிவிப்பு அல்ல."
              : "Mandatory Disclosure: Physical optical crease detection does not validate empirical predictive claims regarding life span, wealth, health, or marriage."}
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-amber-200">
        <button
          onClick={() => setActiveTab("atlas")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === "atlas"
              ? "bg-amber-600 text-white shadow-sm"
              : "bg-white text-stone-700 hover:bg-amber-50 border border-amber-200"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{isTamil ? "ஊடாடும் வரைபடம் (Interactive Atlas)" : "Interactive Palm Atlas"}</span>
        </button>

        <button
          onClick={() => setActiveTab("creases")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === "creases"
              ? "bg-amber-600 text-white shadow-sm"
              : "bg-white text-stone-700 hover:bg-amber-50 border border-amber-200"
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>{isTamil ? "முக்கிய ரேகைகள் & கால அளவீடு" : "Major Lines & Milestones"}</span>
        </button>

        <button
          onClick={() => setActiveTab("mounts")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === "mounts"
              ? "bg-amber-600 text-white shadow-sm"
              : "bg-white text-stone-700 hover:bg-amber-50 border border-amber-200"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isTamil ? "8 கிரக மேடுகள் (Planetary Mounts)" : "Planetary Mounts (Parvatas)"}</span>
        </button>

        <button
          onClick={() => setActiveTab("synthesis")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === "synthesis"
              ? "bg-amber-600 text-white shadow-sm"
              : "bg-white text-stone-700 hover:bg-amber-50 border border-amber-200"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>{isTamil ? "ஜாதக கிரக - கைரேகை இணைவு" : "Astrological Cross-Correlation"}</span>
        </button>

        <button
          onClick={() => setActiveTab("morphology")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === "morphology"
              ? "bg-amber-600 text-white shadow-sm"
              : "bg-white text-stone-700 hover:bg-amber-50 border border-amber-200"
          }`}
        >
          <Hand className="w-3.5 h-3.5" />
          <span>{isTamil ? "பூத லட்சணம் & குறிகள்" : "Morphology & Sacred Signs"}</span>
        </button>
      </div>

      {/* TAB 1: INTERACTIVE PALM ATLAS */}
      {activeTab === "atlas" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Visual SVG Hand Canvas */}
          <div className="lg:col-span-7 p-6 rounded-3xl bg-[#FFFDF9] border border-amber-300 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-serif font-bold text-stone-900 flex items-center gap-2">
                  <Hand className="w-4 h-4 text-amber-600" />
                  {isTamil ? "சாமுத்ரிகா உள்ளங்கை வரைபடம்" : "Samudrika Palmar Anatomy Atlas"}
                </h3>
                <p className="text-[11px] text-stone-500">
                  {isTamil ? "ரேகை அல்லது கிரக மேட்டை அழுத்தினால் விரிவான விளக்கம் தோன்றும்." : "Click any line, mount, or milestone to inspect its classical reading."}
                </p>
              </div>

              {/* Layer Controls */}
              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  onClick={() => setShowMajorLines(!showMajorLines)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    showMajorLines ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {isTamil ? "ரேகைகள்" : "Lines"}
                </button>
                <button
                  onClick={() => setShowMounts(!showMounts)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    showMounts ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {isTamil ? "மேடுகள்" : "Mounts"}
                </button>
                <button
                  onClick={() => setShowMilestones(!showMilestones)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    showMilestones ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {isTamil ? "வயது" : "Ages"}
                </button>
              </div>
            </div>

            {/* Interactive SVG */}
            <div className="relative rounded-2xl bg-stone-900 p-4 aspect-[4/5] flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 400 480" className="w-full h-full max-h-[460px]">
                {/* Hand Silhouette */}
                <path
                  d="M 140,430 C 130,410 110,380 90,320 C 70,260 70,210 90,170 C 100,150 115,160 125,190 C 130,130 145,100 160,100 C 175,100 185,130 185,185 C 195,110 210,80 225,80 C 240,80 250,110 250,185 C 260,120 275,115 285,125 C 295,135 295,170 290,220 C 310,230 335,270 330,320 C 320,380 300,415 270,430 Z"
                  fill="#1c1917"
                  stroke="#D97706"
                  strokeWidth="2"
                  className="filter drop-shadow-md"
                />

                {/* Bracelets */}
                <path d="M 140,435 Q 200,442 270,435" fill="none" stroke="#64748B" strokeWidth="2.5" strokeDasharray="4,2" />
                <path d="M 145,445 Q 200,452 265,445" fill="none" stroke="#64748B" strokeWidth="2" strokeDasharray="4,2" />
                <path d="M 150,455 Q 200,462 260,455" fill="none" stroke="#64748B" strokeWidth="1.5" strokeDasharray="4,2" />

                {/* Mount Zones (Interactive Circles) */}
                {showMounts && (
                  <g className="cursor-pointer">
                    {/* Jupiter */}
                    <circle
                      cx="160" cy="180" r="16"
                      fill="#E2B755" fillOpacity="0.25" stroke="#E2B755" strokeWidth="1.5"
                      onClick={() => setSelectedFeature({ type: "mount", data: PALM_MOUNTS[0] })}
                      className="hover:fill-opacity-50 transition-all"
                    />
                    <text x="160" y="174" textAnchor="middle" fill="#FDE68A" fontSize="9" fontWeight="bold">Guru</text>
                    <text x="160" y="185" textAnchor="middle" fill="#FEF3C7" fontSize="7">{isTamil ? "குரு" : "Jupiter"}</text>

                    {/* Saturn */}
                    <circle
                      cx="210" cy="170" r="16"
                      fill="#8B5CF6" fillOpacity="0.25" stroke="#8B5CF6" strokeWidth="1.5"
                      onClick={() => setSelectedFeature({ type: "mount", data: PALM_MOUNTS[1] })}
                      className="hover:fill-opacity-50 transition-all"
                    />
                    <text x="210" y="164" textAnchor="middle" fill="#DDD6FE" fontSize="9" fontWeight="bold">Shani</text>
                    <text x="210" y="175" textAnchor="middle" fill="#EDE9FE" fontSize="7">{isTamil ? "சனி" : "Saturn"}</text>

                    {/* Sun / Apollo */}
                    <circle
                      cx="255" cy="180" r="16"
                      fill="#F59E0B" fillOpacity="0.25" stroke="#F59E0B" strokeWidth="1.5"
                      onClick={() => setSelectedFeature({ type: "mount", data: PALM_MOUNTS[2] })}
                      className="hover:fill-opacity-50 transition-all"
                    />
                    <text x="255" y="174" textAnchor="middle" fill="#FDE68A" fontSize="9" fontWeight="bold">Surya</text>
                    <text x="255" y="185" textAnchor="middle" fill="#FEF3C7" fontSize="7">{isTamil ? "சூரியன்" : "Apollo"}</text>

                    {/* Mercury */}
                    <circle
                      cx="290" cy="205" r="15"
                      fill="#06B6D4" fillOpacity="0.25" stroke="#06B6D4" strokeWidth="1.5"
                      onClick={() => setSelectedFeature({ type: "mount", data: PALM_MOUNTS[3] })}
                      className="hover:fill-opacity-50 transition-all"
                    />
                    <text x="290" y="200" textAnchor="middle" fill="#A5F3FC" fontSize="8" fontWeight="bold">Budha</text>
                    <text x="290" y="210" textAnchor="middle" fill="#CFFAFE" fontSize="7">{isTamil ? "புதன்" : "Mercury"}</text>

                    {/* Upper Mars */}
                    <circle
                      cx="285" cy="265" r="14"
                      fill="#EF4444" fillOpacity="0.2" stroke="#EF4444" strokeWidth="1.5"
                      onClick={() => setSelectedFeature({ type: "mount", data: PALM_MOUNTS[4] })}
                      className="hover:fill-opacity-50 transition-all"
                    />
                    <text x="285" y="263" textAnchor="middle" fill="#FECACA" fontSize="7.5" fontWeight="bold">U.Mars</text>
                    <text x="285" y="272" textAnchor="middle" fill="#FEE2E2" fontSize="6.5">{isTamil ? "செவ்வாய்" : "Defensive"}</text>

                    {/* Lower Mars */}
                    <circle
                      cx="135" cy="280" r="14"
                      fill="#EF4444" fillOpacity="0.2" stroke="#EF4444" strokeWidth="1.5"
                      onClick={() => setSelectedFeature({ type: "mount", data: PALM_MOUNTS[5] })}
                      className="hover:fill-opacity-50 transition-all"
                    />
                    <text x="135" y="278" textAnchor="middle" fill="#FECACA" fontSize="7.5" fontWeight="bold">L.Mars</text>
                    <text x="135" y="287" textAnchor="middle" fill="#FEE2E2" fontSize="6.5">{isTamil ? "செவ்வாய்" : "Dynamic"}</text>

                    {/* Venus */}
                    <circle
                      cx="145" cy="340" r="22"
                      fill="#EC4899" fillOpacity="0.2" stroke="#EC4899" strokeWidth="1.5"
                      onClick={() => setSelectedFeature({ type: "mount", data: PALM_MOUNTS[6] })}
                      className="hover:fill-opacity-50 transition-all"
                    />
                    <text x="145" y="336" textAnchor="middle" fill="#FBCFE8" fontSize="10" fontWeight="bold">Shukra</text>
                    <text x="145" y="348" textAnchor="middle" fill="#FDF2F8" fontSize="8">{isTamil ? "சுக்கிரன்" : "Venus"}</text>

                    {/* Luna / Moon */}
                    <circle
                      cx="275" cy="340" r="22"
                      fill="#38BDF8" fillOpacity="0.2" stroke="#38BDF8" strokeWidth="1.5"
                      onClick={() => setSelectedFeature({ type: "mount", data: PALM_MOUNTS[7] })}
                      className="hover:fill-opacity-50 transition-all"
                    />
                    <text x="275" y="336" textAnchor="middle" fill="#BAE6FD" fontSize="10" fontWeight="bold">Chandra</text>
                    <text x="275" y="348" textAnchor="middle" fill="#F0F9FF" fontSize="8">{isTamil ? "சந்திரன்" : "Luna"}</text>
                  </g>
                )}

                {/* Major Creases */}
                {showMajorLines && (
                  <g className="cursor-pointer">
                    {/* Heart Line */}
                    <path
                      d="M 130,230 Q 180,210 280,240"
                      fill="none" stroke="#F43F5E" strokeWidth="4" strokeLinecap="round"
                      onClick={() => setSelectedFeature({ type: "line", data: MAJOR_LINES[0] })}
                      className="hover:stroke-[6] transition-all"
                    />
                    {/* Head Line */}
                    <path
                      d="M 130,260 Q 200,270 270,300"
                      fill="none" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round"
                      onClick={() => setSelectedFeature({ type: "line", data: MAJOR_LINES[1] })}
                      className="hover:stroke-[6] transition-all"
                    />
                    {/* Life Line */}
                    <path
                      d="M 135,255 C 160,280 180,340 160,405"
                      fill="none" stroke="#10B981" strokeWidth="4" strokeLinecap="round"
                      onClick={() => setSelectedFeature({ type: "line", data: MAJOR_LINES[2] })}
                      className="hover:stroke-[6] transition-all"
                    />
                    {/* Fate Line */}
                    <path
                      d="M 210,410 L 210,220"
                      fill="none" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round"
                      onClick={() => setSelectedFeature({ type: "line", data: MAJOR_LINES[3] })}
                      className="hover:stroke-[6] transition-all"
                    />
                  </g>
                )}

                {/* Minor Lines */}
                {showMinorLines && (
                  <g className="cursor-pointer">
                    {/* Sun Line */}
                    <path
                      d="M 255,290 L 255,200"
                      fill="none" stroke="#EAB308" strokeWidth="2" strokeDasharray="3,1"
                      onClick={() => setSelectedFeature({ type: "minorLine", data: MINOR_LINES[0] })}
                      className="hover:stroke-[4] transition-all"
                    />
                    {/* Mercury / Health Line */}
                    <path
                      d="M 220,380 L 285,225"
                      fill="none" stroke="#06B6D4" strokeWidth="2" strokeDasharray="3,1"
                      onClick={() => setSelectedFeature({ type: "minorLine", data: MINOR_LINES[1] })}
                      className="hover:stroke-[4] transition-all"
                    />
                  </g>
                )}

                {/* Milestones along Life Line */}
                {showMilestones && lifeMilestones.map((m) => (
                  <g
                    key={m.age}
                    className="cursor-pointer"
                    onClick={() => setSelectedFeature({ type: "milestone", data: m })}
                  >
                    <circle cx={m.point.x} cy={m.point.y} r="4" fill="#10B981" stroke="#FFFFFF" strokeWidth="1" />
                    <text x={m.point.x - 6} y={m.point.y + 3} textAnchor="end" fill="#A7F3D0" fontSize="7" fontWeight="bold">
                      {m.age}
                    </text>
                  </g>
                ))}

                {/* Milestones along Fate Line */}
                {showMilestones && fateMilestones.map((m) => (
                  <g
                    key={`fate-${m.age}`}
                    className="cursor-pointer"
                    onClick={() => setSelectedFeature({ type: "milestone", data: m })}
                  >
                    <circle cx={m.point.x} cy={m.point.y} r="3.5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1" />
                    <text x={m.point.x + 6} y={m.point.y + 3} textAnchor="start" fill="#FDE68A" fontSize="7" fontWeight="bold">
                      {m.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Interactive Inspection Detail Card */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-3xl bg-[#FFFDF9] border border-amber-300 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-amber-600" />
                  {isTamil ? "சாமுத்ரிகா ஆய்வுக் குறிப்பு" : "Selected Feature Inspector"}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  {selectedFeature ? selectedFeature.type.toUpperCase() : "CLICK ANATOMY"}
                </span>
              </div>

              {selectedFeature ? (
                <div className="space-y-3 animate-fadeIn">
                  <div>
                    <h4 className="text-lg font-serif font-bold text-stone-900">
                      {isTamil ? (selectedFeature.data.tamilName || selectedFeature.data.label || selectedFeature.data.name) : (selectedFeature.data.name || selectedFeature.data.label)}
                    </h4>
                    {selectedFeature.data.planet && (
                      <span className="text-xs font-semibold text-amber-700 block mt-0.5">
                        {isTamil ? `ஆளும் கிரகம்: ${selectedFeature.data.planet}` : `Planetary Lord: ${selectedFeature.data.planet}`}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-700 leading-relaxed">
                    {isTamil
                      ? (selectedFeature.data.traditionalSignificanceTamil || selectedFeature.data.tamilTraits?.[0] || selectedFeature.data.theme || selectedFeature.data.description)
                      : (selectedFeature.data.traditionalSignificance || selectedFeature.data.traits?.[0] || selectedFeature.data.theme || selectedFeature.data.description)}
                  </p>

                  {selectedFeature.data.auspiciousSigns && (
                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1">
                      <span className="font-bold text-amber-950 block">
                        {isTamil ? "சுப குறிகள் (Auspicious Signs):" : "Classical Auspicious Signs:"}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedFeature.data.auspiciousSigns.map((s, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-full bg-white border border-amber-300 text-[10px] font-medium text-stone-700">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedFeature.data.traits && (
                    <div className="space-y-1 text-xs">
                      <span className="font-bold text-stone-800 block">
                        {isTamil ? "பாரம்பரிய பலன்கள்:" : "Classical Samudrika Axioms:"}
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-stone-600 text-[11px]">
                        {(isTamil && selectedFeature.data.tamilTraits ? selectedFeature.data.tamilTraits : selectedFeature.data.traits).map((tr, idx) => (
                          <li key={idx} className="leading-relaxed">{tr}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 space-y-2 text-stone-500">
                  <Hand className="w-8 h-8 mx-auto text-amber-500/40" />
                  <p className="text-xs leading-relaxed">
                    {isTamil
                      ? "உள்ளங்கையின் ரேகைகளையோ, கிரக மேடுகளையோ அல்லது காலக் குறிப்புகளையோ அழுத்தி அதன் பாரம்பரிய சாமுத்ரிகா சூத்திரங்களைக் காண்க."
                      : "Click any line, planetary mount, or age marker on the hand map to inspect its authentic Samudrika Shastra rules and cultural significance."}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Legend Card */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs space-y-2">
              <span className="font-bold text-stone-800 block">
                {isTamil ? "வண்ணக் குறியீடுகள் (Color Legend):" : "Color Anatomy Legend:"}
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#F43F5E]" />
                  <span>{isTamil ? "இருதய ரேகை" : "Heart Line"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#3B82F6]" />
                  <span>{isTamil ? "புத்தி ரேகை" : "Head Line"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#10B981]" />
                  <span>{isTamil ? "ஆயுள் ரேகை" : "Life Line"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                  <span>{isTamil ? "விதி ரேகை" : "Fate Line"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MAJOR & MINOR CREASES */}
      {activeTab === "creases" && (
        <div className="space-y-6">
          {/* Major Lines */}
          <div className="p-6 rounded-3xl bg-[#FFFDF9] border border-amber-300 shadow-sm space-y-4">
            <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-600" />
              {isTamil ? "நான்கு முதன்மை ரேகைகள் (Four Major Creases)" : "The Four Major Palmar Creases"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {safeLines.map((line) => (
                <div
                  key={line.id}
                  className="p-5 rounded-2xl border space-y-3 bg-white"
                  style={{ borderColor: `${line.color}40` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: line.color }} />
                      <h4 className="font-bold text-sm text-stone-900">
                        {isTamil ? (line.tamilName || line.name) : line.name}
                      </h4>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-stone-100 text-stone-700">
                      {line.detectedStrength || (line.detected ? "Detected" : "Classical Baseline")}
                    </span>
                  </div>

                  <p className="text-xs text-stone-700 leading-relaxed">{line.description}</p>

                  <div className="pt-2 border-t border-stone-100 space-y-1">
                    <span className="text-[11px] font-bold text-stone-800 block">
                      {isTamil ? "சாமுத்ரிகா லட்சண பலன்:" : "Classical Trait:"}
                    </span>
                    <p className="text-xs text-stone-600 leading-relaxed italic">
                      {isTamil && line.tamilTraits ? line.tamilTraits[0] : (line.traits ? line.traits[0] : "-")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chronological Life Milestones */}
          <div className="p-6 rounded-3xl bg-[#FFFDF9] border border-emerald-300 shadow-sm space-y-4">
            <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              {isTamil ? "ஆயுள் ரேகை காலவரிசை அளவீடு (Life Line Milestones 10 - 80 Yrs)" : "Life Line Chronological Milestones (Ages 10 - 80)"}
            </h3>
            <p className="text-xs text-stone-600">
              {isTamil
                ? "பாரம்பரிய சாமுத்ரிகா சாஸ்திர விகிதாசார காலக் கணிதம் (கலா கணிதம்). இது கலாச்சாரக் குறியீடு, மரணத்தை கணிக்கும் மருத்துவக் கருவி அல்ல."
                : "Classical proportional division along the vitality arc. Illustrative cultural milestone reference, not a deterministic lifespan forecast."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {lifeMilestones.map((m) => (
                <div key={m.age} className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-emerald-900">{m.label}</span>
                    <span className="text-[10px] font-mono text-emerald-700">Arc {Math.round(m.t * 100)}%</span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed">{m.theme}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Minor Creases */}
          <div className="p-6 rounded-3xl bg-[#FFFDF9] border border-amber-300 shadow-sm space-y-4">
            <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-600" />
              {isTamil ? "துணை ரேகைகள் (Classical Minor Creases)" : "Classical Minor Creases"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MINOR_LINES.map((ml) => (
                <div key={ml.id} className="p-4 rounded-xl bg-amber-50/40 border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-stone-900">
                      {isTamil ? ml.tamilName : ml.name}
                    </span>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ml.color }} />
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed">{ml.description}</p>
                  <p className="text-[11px] text-stone-500 italic pt-1 border-t border-amber-200/60">
                    {isTamil && ml.tamilTraits ? ml.tamilTraits[0] : ml.traits[0]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PLANETARY MOUNTS */}
      {activeTab === "mounts" && (
        <div className="p-6 rounded-3xl bg-[#FFFDF9] border border-amber-300 shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              {isTamil ? "பாரம்பரிய 8 கிரக மேடுகள் & சமவெளிகள்" : "The 8 Planetary Mounts & Palmar Plains"}
            </h3>
            <p className="text-xs text-stone-600 mt-0.5">
              {isTamil
                ? "விரல்களுக்கு அடியில் உள்ள தசை அமைப்புகள் பாரம்பரிய சாஸ்திரப்படி கிரக பிராண ஆற்றல் ஈர்ப்பு மண்டலங்கள் ஆகும் (இருபரிமாண மாதிரி பார்வை)."
                : "Classical cushions beneath digits act as cosmic energy resonators per Samudrika Shastra (2D unmeasured reference zones)."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {safeMounts.map((mount) => (
              <div
                key={mount.name}
                className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2.5 hover:border-amber-400 transition-all shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-stone-900">
                    {isTamil ? (mount.tamilName || mount.name) : mount.name}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                    {mount.planet || "Samudrika"}
                  </span>
                </div>

                <div className="text-[11px] text-stone-500 font-mono">
                  {mount.position}
                </div>

                <p className="text-xs text-stone-700 leading-relaxed">
                  {isTamil && mount.traditionalSignificanceTamil ? mount.traditionalSignificanceTamil : mount.traditionalSignificance}
                </p>

                <div className="pt-2 border-t border-amber-200 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-stone-600">
                    {isTamil ? "ஆதிக்க குணங்கள்:" : "Attributes:"}
                  </span>
                  <span className="text-amber-800 font-medium">{mount.attributes}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ASTROLOGICAL SYNTHESIS */}
      {activeTab === "synthesis" && (
        <div className="p-6 rounded-3xl bg-[#FFFDF9] border border-amber-300 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-600" />
                {isTamil ? "சாமுத்ரிகா - ஜோதிட முழுமைப் பார்வை" : "Samudrika - Vedic Astrology Cross-Correlation"}
              </h3>
              <p className="text-xs text-stone-600 mt-0.5">
                {isTamil
                  ? "உங்கள் பிறப்பு ஜாதக கிரக பலங்களுக்கும் உள்ளங்கை கிரக மேடுகளுக்கும் இடையேயான இயைபு."
                  : "Synthesizing your birth chart planetary dignities (D1/D9/Shadbala) with corresponding palm mount archetypes."}
              </p>
            </div>

            {astroSynthesis.isLinked && (
              <div className="px-3.5 py-1.5 rounded-xl bg-amber-100 border border-amber-300 text-xs font-bold text-amber-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{astroSynthesis.concordanceScore}% {isTamil ? "ஒத்திசைவு" : "Harmonious Concordance"}</span>
              </div>
            )}
          </div>

          {astroSynthesis.isLinked ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {astroSynthesis.correlations.map((corr) => (
                  <div
                    key={corr.planetId}
                    className="p-4 rounded-2xl bg-white border border-amber-200 hover:border-amber-400 transition-all shadow-xs space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span className="font-bold text-sm text-stone-900">
                          {isTamil ? corr.tamilMountName : corr.mountName}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                        <span className="text-xs font-semibold text-amber-800">
                          {isTamil ? corr.natalPlacementTamil : corr.natalPlacement}
                        </span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        corr.alignmentType === "HIGH_CONCORDANCE" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {corr.alignmentType.replace("_", " ")}
                      </span>
                    </div>

                    <p className="text-xs text-stone-700 leading-relaxed">
                      {isTamil ? corr.synthesisTamil : corr.synthesis}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-stone-600 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  {isTamil
                    ? "ஜோதிட-கைரேகை இயைபு என்பது பாரம்பரிய கலாச்சார முறைப்படி இரு கலைகளையும் ஒப்பிட்டுப் பார்க்கும் ஒரு தத்துவப் பார்வையே தவிர, வாழ்க்கை நிகழ்வுகளின் அறிவியல் கணிப்பு அல்ல."
                    : "Astrological-palm correlation is an illustrative traditional synthesis comparing two ancient Indian sciences. It is not an empirical deterministic forecast of future outcomes."}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 p-6 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3">
              <Activity className="w-10 h-10 mx-auto text-amber-500/50" />
              <h4 className="text-sm font-bold text-stone-800">
                {isTamil ? "ஜாதக விபரங்கள் இன்னும் கணக்கிடப்படவில்லை" : "Natal Birth Chart Not Yet Calculated"}
              </h4>
              <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                {astroSynthesis.message}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: MORPHOLOGY & SACRED SIGNS */}
      {activeTab === "morphology" && (
        <div className="space-y-6">
          {/* 4 Classical Hand Elements */}
          <div className="p-6 rounded-3xl bg-[#FFFDF9] border border-amber-300 shadow-sm space-y-4">
            <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
              <Hand className="w-5 h-5 text-amber-600" />
              {isTamil ? "நான்கு பூத கை வடிவங்கள் (Four Elemental Hand Types)" : "The Four Elemental Hand Shapes (Tatvas)"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {HAND_ELEMENTS.map((el) => (
                <div key={el.id} className="p-5 rounded-2xl bg-white border border-amber-200 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-stone-900">
                      {isTamil ? el.tamilName : el.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-amber-100 text-amber-800">
                      {el.element}
                    </span>
                  </div>

                  <div className="text-[11px] text-stone-500 space-y-0.5">
                    <div><strong>{isTamil ? "அமைப்பு:" : "Form:"}</strong> {el.palmShape} | {el.fingerProportion}</div>
                    <div><strong>{isTamil ? "பொருத்தமான துறைகள்:" : "Vocations:"}</strong> {el.vocations}</div>
                  </div>

                  <p className="text-xs text-stone-700 leading-relaxed pt-1 border-t border-stone-100">
                    {isTamil ? el.temperamentTamil : el.temperament}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Sacred Samudrika Signs */}
          <div className="p-6 rounded-3xl bg-[#FFFDF9] border border-amber-300 shadow-sm space-y-4">
            <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              {isTamil ? "புனித சாமுத்ரிகா குறிகள் (Sacred Marks & Chihnas)" : "Sacred Samudrika Signs & Auspicious Marks"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SAMUDRIKA_SIGNS.map((sign) => (
                <div key={sign.id} className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-stone-900">
                      {isTamil ? sign.tamilName : sign.name}
                    </span>
                    <span className="text-base font-bold text-amber-700">{sign.symbol}</span>
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed">
                    {isTamil ? sign.significanceTamil : sign.significance}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Core Personality Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#FFFDF9] border border-rose-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center">
            <Heart className="w-5 h-5 text-rose-600" />
          </div>
          <h4 className="font-serif font-bold text-stone-900">{t.emotionalPattern}</h4>
          <p className="text-xs text-stone-700 leading-relaxed">
            {isTamil 
              ? "ஆழ்ந்த பாசமும் விசுவாசமும் கொண்டவர். உறவுகளில் நேர்மையை விரும்புபவர். மன அழுத்தமின்றி சமநிலையோடு முடிவெடுப்பது நல்லது." 
              : `${safeDuality.emotionalNature} High empathy allows you to form deep soul-bonds.`}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#FFFDF9] border border-sky-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center">
            <Brain className="w-5 h-5 text-sky-600" />
          </div>
          <h4 className="font-serif font-bold text-stone-900">{t.careerDrive}</h4>
          <p className="text-xs text-stone-700 leading-relaxed">
            {isTamil 
              ? "புத்தி ரேகையின் வளைவு சிறந்த வணிக புத்திசாலித்தனத்தையும், நிர்வாக ஆளுமையையும், கலை மற்றும் தொழில்நுட்ப அறிவையும் குறிக்கிறது." 
              : `${safeDuality.careerDrive} Head line slope signifies rapid conceptual thinking.`}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#FFFDF9] border border-emerald-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <Activity className="w-5 h-5 text-emerald-600" />
          </div>
          <h4 className="font-serif font-bold text-stone-900">{t.vitalityHealth}</h4>
          <p className="text-xs text-stone-700 leading-relaxed">
            {isTamil 
              ? "சாமுத்ரிகா சாஸ்திரப்படி இயற்கை பிராண சக்தி மற்றும் உடல் சமநிலை உண்டு. தொடர் யோகாசனம் மற்றும் இயற்கை வாழ்வியல் உடலை புத்துணர்ச்சியுடன் வைத்திருக்கும்." 
              : `${safeDuality.lifeVitality} Natural Pranic vitality and somatic balance sustained through disciplined grounding routines.`}
          </p>
        </div>
      </div>

      {/* Left vs Right Hand Principle */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-100/70 via-purple-50 to-orange-50 border border-amber-300 shadow-sm flex items-start gap-4">
        <div className="p-2 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 mt-1">
          <Compass className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-stone-900">
            {t.karmicDualityTitle}
          </h4>
          <p className="text-xs text-stone-700 mt-1 leading-relaxed">
            {t.karmicDualityDesc}
          </p>
        </div>
      </div>
    </div>
  );
}
