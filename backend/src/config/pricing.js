/**
 * ASTROVERSE — Canonical Backend Pricing & Subscription Plans
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
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
  SGD: "S$",
  AED: "AED "
};

export const PRICING_PLANS = [
  {
    id: "basic",
    name: "Basic Plan",
    nameTa: "அடிப்படை திட்டம்",
    monthlyPriceUSD: 9,
    yearlyPriceUSD: 79,
    monthlyCredits: 4,
    yearlyCredits: 50,
    featuresEn: [
      "Daily, weekly, and monthly transit forecasts",
      "Essential Western & Vedic Sun/Moon signs",
      "Basic Numerology Life Path & Personal Day",
      "Standard Baby Names directory access"
    ],
    featuresTa: [
      "தினசரி, வாராந்திர கிரக பெயர்ச்சி பலன்கள்",
      "சூரிய/சந்திர ராசி & லக்ன பலன்கள்",
      "அடிப்படை ஆயுள் எண் & தினசரி சுழற்சி",
      "குழந்தை பெயர்கள் அட்டவணை அணுகல்"
    ],
    pdfExport: false
  },
  {
    id: "premium",
    name: "Premium Pro",
    nameTa: "பிரீமியம் புரோ",
    monthlyPriceUSD: 19,
    yearlyPriceUSD: 149,
    monthlyCredits: 15,
    yearlyCredits: 200,
    recommended: true,
    featuresEn: [
      "Everything in Basic Plan",
      "Personalized Dasha & Transit Life Timeline",
      "36 Guna Kundli Marriage Compatibility",
      "Unlimited High-Resolution PDF Report Exports",
      "Deep Nakshatra pada newborn name generator",
      "Conversational AI Copilot with 9-Level Evidence Trace"
    ],
    featuresTa: [
      "அடிப்படை திட்டத்தின் அனைத்து வசதிகளும்",
      "முழு விம்சோத்தரி தசா-புக்தி & கோச்சார வாழ்க்கை காலக்கோடு",
      "36 குண அஷ்டகூட திருமணப் பொருத்தம்",
      "வரம்பற்ற முழுமையான PDF ஜாதக பதிவிறக்கம்",
      "நட்சத்திர பாத குழந்தை பெயர்கள் ஜெனரேட்டர்",
      "ஆதார சங்கிலிகளுடன் கூடிய AI உரையாடல் வழிகாட்டி"
    ],
    pdfExport: true
  },
  {
    id: "family",
    name: "Family Plan",
    nameTa: "குடும்ப திட்டம்",
    monthlyPriceUSD: 29,
    yearlyPriceUSD: 219,
    monthlyCredits: 30,
    yearlyCredits: 360,
    profilesLimit: 6,
    featuresEn: [
      "Multi-profile management (Up to 6 family members)",
      "Collaborative Baby Name voting & shareable links",
      "Priority Astro-algorithmic compute speed",
      "Full export rights for life-stage reports",
      "Family Synastry & Compatibility Analysis"
    ],
    featuresTa: [
      "குடும்ப உறுப்பினர்கள் கணக்குகள் (6 நபர்கள் வரை)",
      "குழந்தை பெயர் தேர்வு குடும்ப வாக்களிப்பு இணைப்பு",
      "முன்னுரிமை அதிவேக எபிமெரிஸ் கணிப்பு",
      "முழுமையான வாழ்நாள் ஜாதக அறிக்கைகள்",
      "குடும்பப் பொருத்த ஒப்பீட்டு ஆய்வு"
    ],
    pdfExport: true
  }
];
