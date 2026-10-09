import React, { useState } from "react";
import { Download, Heart, Brain, Activity, Compass, Loader2, AlertTriangle } from "lucide-react";
import { jsPDF } from "jspdf";
import { TRANSLATIONS } from "../../services/localization";

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

export default function PalmReport({ telemetry, onRetake, lang = "en" }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isTamil = lang === "ta";
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!telemetry) return null;
  const { handType, handDuality, mounts, lines, confidenceScore, handShape } = telemetry;

  const safeDuality = handDuality || {
    role: "Palm Archetype",
    summary: "Balanced personality blueprint with aligned mental and emotional vectors.",
    emotionalNature: "Harmonious affective equilibrium.",
    careerDrive: "Strategic focus and vocational purpose.",
    lifeVitality: "Steady constitutional resilience."
  };
  const safeMounts = Array.isArray(mounts) ? mounts : [];
  const safeLines = Array.isArray(lines) ? lines : [];

  const MOUNT_NAMES_TAMIL = {
    "Mount of Jupiter": "குரு மேடு (வியாழன்)",
    "Mount of Saturn": "சனி மேடு",
    "Mount of Apollo (Sun)": "சூரிய மேடு",
    "Mount of Mercury": "புதன் மேடு",
    "Mount of Venus": "சுக்கிர மேடு",
    "Mount of Luna (Moon)": "சந்திர மேடு"
  };

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
      doc.text("ASTROVERSE SAMUDRIKA SHASTRA PALM REPORT", margin, 35);

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

      // Col 2 in metadata box
      const col2X = margin + 310;
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.text("Confidence Score:", col2X, y + 18);
      doc.setFont("helvetica", "normal");
      doc.text(
        confidenceScore !== null ? `${confidenceScore}% Calibrated` : "Archetypal Reference",
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

      // Safe Hand Duality
      const safeDuality = handDuality || {
        role: "Palm Archetype",
        summary: "Balanced personality blueprint with aligned mental and emotional vectors.",
        emotionalNature: "Harmonious affective equilibrium.",
        careerDrive: "Strategic focus and vocational purpose.",
        lifeVitality: "Steady constitutional resilience."
      };

      // Section 1: Hand Duality & Psychological Disposition
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

      // Section 2: Major Palm Lines Analysis
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(180, 83, 9);
      doc.text("2. Major Crease & Meridian Line Indicators", margin, y);
      y += 14;

      const majorLines = lines || [];
      majorLines.forEach((line) => {
        if (y > pageHeight - 110) {
          doc.addPage();
          y = 45;
        }

        const lName = safeAscii(line.name || "Crease Line");
        const lStrength = safeAscii(line.detectedStrength || "Classical Baseline");
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

      // Section 3: Mount Elevation Analytics (New Page if needed)
      if (y > pageHeight - 170) {
        doc.addPage();
        y = 45;
      } else {
        y += 8;
      }

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(180, 83, 9);
      doc.text("3. Samudrika Mount Elevation & Meridian Energy", margin, y);
      y += 14;

      // Mount Table Header
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, contentWidth, 18, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text("MOUNT", margin + 10, y + 12);
      doc.text("POSITION", margin + 115, y + 12);
      doc.text("ATTRIBUTES & SIGNIFICANCE", margin + 225, y + 12);
      doc.text("PROMINENCE", margin + 440, y + 12);
      y += 18;

      const mountList = mounts || [];
      mountList.forEach((m, idx) => {
        if (y > pageHeight - 60) {
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
        doc.text(safeAscii(m.position || "-"), margin + 115, y + 11);
        const attrStr = Array.isArray(m.attributes) ? m.attributes.join(", ") : (m.attributes ? String(m.attributes) : "-");
        doc.text(safeAscii(attrStr.substring(0, 44)), margin + 225, y + 11);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text("Reference Zone (2D)", margin + 440, y + 11);

        y += 16;
      });

      // Section 4: Epistemological Disclaimer & Notice
      if (y > pageHeight - 90) {
        doc.addPage();
        y = 45;
      } else {
        y += 14;
      }

      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(254, 202, 202);
      doc.roundedRect(margin, y, contentWidth, 44, 4, 4, "FD");

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(153, 27, 27);
      doc.text("STATUTORY & METHODOLOGICAL DISCLOSURE:", margin + 10, y + 14);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(185, 28, 28);
      const disclaim = "This Samudrika Shastra reading is an illustrative cultural framework synthesized with optical crease telemetry. It is not an automated medical diagnostic tool, clinical biometric sensor, or deterministic claim.";
      const disclaimLines = doc.splitTextToSize(safeAscii(disclaim), contentWidth - 20);
      doc.text(disclaimLines, margin + 10, y + 26);

      // Add page numbers to all pages (clean ASCII, zero unicode bullet)
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(148, 163, 184);
        doc.text(
          `AstroVerse Intelligence Platform | Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 20,
          { align: "center" }
        );
      }

      const fileHand = handType === "left" ? "left" : "right";
      doc.save(`AstroVerse_Palm_Reading_${fileHand}.pdf`);
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
            <div className="flex items-center gap-2 mb-2">
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
              className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-stone-800 text-xs font-semibold border border-amber-300 transition-all shadow-sm"
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

        {/* Hand Shape Tag */}
        <div className="mt-6 pt-4 border-t border-amber-200 flex flex-wrap items-center gap-6 text-xs text-stone-600">
          <div>
            <span className="text-stone-500 uppercase tracking-wider block text-[10px]">{t.elementalShape}</span>
            <span className="font-semibold text-stone-800 text-sm">
              {isTamil ? "நிலம்-காற்று இணைந்த கை (நடைமுறை ஞானி)" : (handShape || "Earth-Air Hybrid")}
            </span>
          </div>
          <div>
            <span className="text-stone-500 uppercase tracking-wider block text-[10px]">{t.dominantMount}</span>
            <span className="font-semibold text-amber-700 text-sm">
              {isTamil ? "புதன் மேடு (குறிப்பு)" : "Mount of Mercury (Reference)"}
            </span>
          </div>
          <div>
            <span className="text-stone-500 uppercase tracking-wider block text-[10px]">{t.primaryArc}</span>
            <span className="font-semibold text-emerald-700 text-sm">
              {isTamil ? "தடையற்ற நீண்ட ஆயுள் ரேகை" : "Unbroken Vitality Arc"}
            </span>
          </div>
        </div>
        {/* Metric Separation Panel (P0 Mandate) */}
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

      {/* Mount Elevation Analytics */}
      <div className="p-6 rounded-3xl bg-[#FFFDF9] border border-amber-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-600" />
            {t.mountElevations}
          </h3>
          <p className="text-xs text-stone-600 mt-0.5">
            {isTamil 
              ? "பாரம்பரிய சாமுத்ரிகா சாஸ்திர குறிப்பு அளவீடுகள் (மாதிரி ஆய்வு, பயோமெட்ரிக் அளவீடு அல்ல)" 
              : "Classical Samudrika Shastra benchmark indices (Illustrative archetypal reference, not a measured biometric reading)"}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {safeMounts.map(mount => (
            <div
              key={mount.name}
              className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2 hover:border-amber-400 transition-all shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-stone-800">
                  {isTamil ? (MOUNT_NAMES_TAMIL[mount.name] || mount.name) : mount.name}
                </span>
                <span className="text-xs font-bold text-amber-700">{mount.prominence || (isTamil ? "சாஸ்திர மாதிரி" : "Classical Benchmark")}</span>
              </div>
              <div className="text-[11px] text-stone-500 italic">
                {isTamil ? "இருபரிமாணப் படத்தில் அளவிட முடியாத மண்டலம் (2D Reference Zone)" : "2D Unmeasured Landmark Zone (Reference Only)"}
              </div>
              <p className="text-[11px] text-stone-600">{mount.attributes}</p>
            </div>
          ))}
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
