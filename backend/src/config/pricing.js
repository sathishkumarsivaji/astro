/**
 * ASTROVERSE — Canonical Backend Pricing & Subscription Plans
 *
 * Authoritative Indian Rupee (₹) & Global Pricing Architecture:
 * - Basic Report: ₹20
 * - Moderate Access Plan: ₹50
 * - Full Report: ₹100
 * - Full Detailed & Complete Report (All Access): ₹200
 */

export const EXCHANGE_RATES = {
  USD: 1.0,
  INR: 83.5,
  EUR: 0.92,
  GBP: 0.79,
  SGD: 1.34,
  AED: 3.67
};

// Live exchange rates with scheduled / on-demand refresh capability
let _liveRates = { ...EXCHANGE_RATES };

export function getLiveExchangeRates() {
  return { ..._liveRates };
}

export async function refreshExchangeRates() {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    if (response.ok) {
      const data = await response.json();
      if (data && data.rates) {
        for (const curr of Object.keys(EXCHANGE_RATES)) {
          if (typeof data.rates[curr] === 'number') {
            _liveRates[curr] = parseFloat(data.rates[curr].toFixed(4));
          }
        }
        console.info('[PRICING] Live exchange rates refreshed successfully:', _liveRates);
        return true;
      }
    }
  } catch (err) {
    console.warn('[PRICING] Exchange rate refresh failed, maintaining cached rates:', err.message);
  }
  return false;
}

export const CURRENCY_SYMBOLS = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  SGD: "S$",
  AED: "AED "
};

export const PRICING_PLANS = [
  {
    id: "basic_20",
    name: "Basic Report",
    nameTa: "அடிப்படை ஜாதக அறிக்கை",
    priceINR: 20,
    priceUSD: 0.25,
    monthlyPriceUSD: 0.25,
    yearlyPriceUSD: 2.50,
    monthlyCredits: 2,
    yearlyCredits: 25,
    accessLevel: "basic_report",
    badge: "Essential",
    badgeTa: "அவசியம்",
    featuresEn: [
      "Authentic Rasi (D1) & Navamsha (D9) Chart Calculation",
      "Planetary Positions, Nakshatras, Padas & Dignities",
      "Vimshottari Mahadasha & Antardasha Overview",
      "Essential Dosha Check (Manglik / Rahu-Ketu)",
      "Standard PDF Horoscope Report Download"
    ],
    featuresTa: [
      "துல்லியமான ராசி (D1) & நவாம்சம் (D9) கட்டங்கள்",
      "கிரக நிலைகள், நட்சத்திர பாதங்கள் & ஆட்சி/உச்ச பலன்கள்",
      "விம்சோத்தரி மகா தசை & புக்தி சுருக்கம்",
      "அடிப்படை செவ்வாய் & ராகு-கேது தோஷ பரிசோதனை",
      "அடிப்படை PDF ஜாதக அறிக்கை பதிவிறக்கம்"
    ],
    pdfExport: true
  },
  {
    id: "moderate_50",
    name: "Moderate Access",
    nameTa: "மிதமான முழு அணுகல்",
    priceINR: 50,
    priceUSD: 0.60,
    monthlyPriceUSD: 0.60,
    yearlyPriceUSD: 6.00,
    monthlyCredits: 5,
    yearlyCredits: 60,
    accessLevel: "moderate",
    badge: "Popular",
    badgeTa: "பிரபலமானது",
    featuresEn: [
      "Everything in Basic Report",
      "Core Divisional Vargas (D1, D9, D10 Career, D7 Progeny, D3 Siblings)",
      "Ashtakavarga 337 Bindu Calculation & House Strengths",
      "Six-Fold Shadbala Summary & Planetary Strengths",
      "Complete 0–120 Year Life Timeline & Antardashas",
      "Daily Gochara (Transit) & Sade Sati Alerts",
      "Multi-Page Detailed PDF Report"
    ],
    featuresTa: [
      "அடிப்படை அறிக்கையின் அனைத்து வசதிகளும்",
      "முக்கிய வர்க்கக் கட்டங்கள் (D1, D9, D10 தொழில், D7 புத்திர, D3 திரேக்காணம்)",
      "அஷ்டகவர்க்க 337 பிந்து பரவல் & பாவ பலங்கள்",
      "அறுவகை ஷட்பல வலிமை சுருக்கம்",
      "முழுமையான 0-120 ஆண்டு தசா-புக்தி காலக்கோடு",
      "தினசரி கோச்சார கிரக பெயர்ச்சி & ஏழரை சனி எச்சரிக்கைகள்",
      "விரிவான பல பக்க PDF ஜாதக அறிக்கை"
    ],
    pdfExport: true
  },
  {
    id: "full_100",
    name: "Full Report",
    nameTa: "முழுமையான ஜாதக அறிக்கை",
    priceINR: 100,
    priceUSD: 1.20,
    monthlyPriceUSD: 1.20,
    yearlyPriceUSD: 12.00,
    monthlyCredits: 10,
    yearlyCredits: 120,
    recommended: true,
    accessLevel: "full_report",
    badge: "Recommended",
    badgeTa: "பரிந்துரைக்கப்பட்டது",
    featuresEn: [
      "Everything in Moderate Access",
      "Complete Shodashavarga (All 16 Vargas D1 to D60)",
      "Full Parashari 6-Fold Shadbala & Bhava Bala Matrix",
      "Jaimini Chara Dasha, Atmakaraka & 7 Karakas",
      "Dedicated Career & Marriage Deep-Dive Astrological Engine",
      "5 Conversational AI Astrologer Consultation Credits",
      "36-Guna Kundli Marriage Compatibility with Dosha Analysis",
      "Comprehensive High-Resolution Astrological PDF"
    ],
    featuresTa: [
      "மிதமான அணுகலின் அனைத்து வசதிகளும்",
      "முழு சோடசவர்க்கம் (D1 முதல் D60 வரையிலான 16 வர்க்கங்கள்)",
      "முழுமையான 6-மடங்கு ஷட்பலம் & பாவ பலன் அட்டவணை",
      "ஜைமினி சர தசை, ஆத்மகாரகன் & 7 காரகங்கள்",
      "தொழில் & திருமண பிரத்யேக ஜோதிட பகுப்பாய்வு",
      "5 AI ஜோதிட ஆலோசனை உரையாடல் கிரெடிட்கள்",
      "36 குண அஷ்டகூட திருமணப் பொருத்தம் & தோஷ தீர்வுகள்",
      "உயர் தெளிவுத்திறன் கொண்ட விரிவான PDF அறிக்கை"
    ],
    pdfExport: true
  },
  {
    id: "complete_200",
    name: "Full Detailed & Complete Report",
    nameTa: "முழுமையான விரிவான ஆலோசனை தொகுப்பு",
    priceINR: 200,
    priceUSD: 2.40,
    monthlyPriceUSD: 2.40,
    yearlyPriceUSD: 24.00,
    monthlyCredits: 25,
    yearlyCredits: 300,
    accessLevel: "all_access",
    badge: "Master Access",
    badgeTa: "முழுமையான மாஸ்டர்",
    featuresEn: [
      "All-Access Astrologer Consultation Engine",
      "18-Chapter Comprehensive Master Horoscope Dossier",
      "All 16 Divisional Vargas with Parashari Deities & Parity",
      "Birth Time Rectification & D60 Stability Boundary Analysis",
      "Classical Graha Yuddha (Planetary War) & Sripati Aspect Curvature",
      "Dedicated Event-Specific Timing Engine (Marriage, Wealth, Career, Property, Health)",
      "Astrologer's Master Sheet & High-Resolution Dossier PDF Export",
      "Full AI Astrologer Follow-Up Q&A & Retrospective Milestone Verification"
    ],
    featuresTa: [
      "அனைத்து வசதிகளும் திறக்கப்பட்ட மாஸ்டர் ஜோதிட தளம்",
      "18 அதிகாரங்கள் கொண்ட விரிவான மாஸ்டர் ஜாதக தொகுப்பு",
      "பராசர தேவதைகளுடன் கூடிய அனைத்து 16 வர்க்கக் கட்டங்கள்",
      "பிறந்த நேர துல்லிய திருத்தம் & D60 நிலைத்தன்மை ஆய்வு",
      "கிரக யுத்தம் (Planetary War) & ஸ்ரீபதி விசேஷ பார்வை கணிப்பு",
      "திருமணம், செல்வம், தொழில், வீடு, ஆரோக்கிய காலக்கணிப்பு",
      "ஜோதிடர் மாஸ்டர் பார்வை & முழுமையான மாஸ்டர் PDF பதிவிறக்கம்",
      "வரம்பற்ற AI ஜோதிட மறு-கேள்வி உரையாடல் & வாழ்க்கை மைல்கல் சரிபார்ப்பு"
    ],
    pdfExport: true
  }
];
