import React, { useState, useEffect } from "react";
import { Check, Crown, CreditCard, Smartphone, Globe, CheckCircle2, Shield, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { TRANSLATIONS } from "../../services/localization";
import { ensureSessionToken } from "../../services/aiAstrologyService";
import { apiFetch } from "../../services/apiClient";

export default function PricingModal({ isOpen, onClose, lang = "en", onPlanUpgraded = null, defaultPlan = "full_100" }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isTamil = lang === "ta";

  const [currency, setCurrency] = useState("INR");
  const [selectedPlan, setSelectedPlan] = useState(defaultPlan);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [orderError, setOrderError] = useState(null);
  const [serverPricing, setServerPricing] = useState(null);
  const [paymentCompleted, setPaymentCompleted] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (defaultPlan) setSelectedPlan(defaultPlan);
      // Fetch authoritative pricing catalog from backend
      apiFetch("/api/pricing")
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) setServerPricing(data);
        })
        .catch(() => {});
    } else {
      setIsProcessing(false);
      setOrderSuccess(null);
      setOrderError(null);
      setPaymentCompleted(null);
    }
  }, [isOpen, defaultPlan]);

  if (!isOpen) return null;

  const CURRENCY_SYMBOLS = {
    INR: "₹",
    USD: "$",
    EUR: "€"
  };

  const plans = [
    {
      id: "basic_20",
      name: isTamil ? "அடிப்படை ஜாதக அறிக்கை" : "Basic Report",
      priceINR: 20,
      priceUSD: 0.25,
      badge: isTamil ? "அடிப்படை" : "Basic",
      features: isTamil ? [
        "துல்லியமான ராசி (D1) & நவாம்சம் (D9) கட்டங்கள்",
        "கிரக நிலைகள், பாகைகள், நட்சத்திர பாதங்கள் & ஆட்சி/உச்ச பலன்",
        "விம்சோத்தரி மகா தசை & புக்தி கால சுருக்கம்",
        "அடிப்படை செவ்வாய் & ராகு-கேது தோஷ பரிசோதனை",
        "அடிப்படை PDF ஜாதக அறிக்கை பதிவிறக்கம்"
      ] : [
        "Rasi (D1) & Navamsha (D9) Chart Calculation",
        "Planetary Coordinates, Nakshatras, Padas & Dignities",
        "Vimshottari Mahadasha & Antardasha Summary",
        "Essential Dosha Check (Manglik / Rahu-Ketu)",
        "Standard PDF Horoscope Report Download"
      ]
    },
    {
      id: "moderate_50",
      name: isTamil ? "மிதமான முழு அணுகல்" : "Moderate Access",
      priceINR: 50,
      priceUSD: 0.60,
      badge: isTamil ? "பிரபலமானது" : "Popular",
      features: isTamil ? [
        "அடிப்படை அறிக்கையின் அனைத்து வசதிகளும்",
        "முக்கிய வர்க்கக் கட்டங்கள் (D1, D9, D10 தொழில், D7 புத்திர, D3 திரேக்காணம்)",
        "அஷ்டகவர்க்க 337 பிந்து பரவல் & பாவ பலங்கள்",
        "அறுவகை ஷட்பல வலிமை சுருக்கம்",
        "முழுமையான 0-120 ஆண்டு தசா-புக்தி காலக்கோடு",
        "தினசரி கோச்சார கிரக பெயர்ச்சி எச்சரிக்கைகள்",
        "விரிவான பல பக்க PDF ஜாதக அறிக்கை"
      ] : [
        "Everything in Basic Report",
        "Core Divisional Vargas (D1, D9, D10 Career, D7, D3)",
        "Ashtakavarga 337 Bindu Calculation & House Strengths",
        "Six-Fold Shadbala Summary & Planetary Strengths",
        "Complete 0–120 Year Life Timeline & Antardashas",
        "Daily Transit / Gochar Alerts",
        "Multi-Page Detailed PDF Report"
      ]
    },
    {
      id: "full_100",
      name: isTamil ? "முழுமையான ஜாதக அறிக்கை" : "Full Report",
      priceINR: 100,
      priceUSD: 1.20,
      recommended: true,
      badge: isTamil ? "பரிந்துரைக்கப்பட்டது" : "Recommended",
      features: isTamil ? [
        "மிதமான அணுகலின் அனைத்து வசதிகளும்",
        "முழு சோடசவர்க்கம் (D1 முதல் D60 வரையிலான 16 வர்க்கங்கள்)",
        "முழுமையான 6-மடங்கு ஷட்பலம் & பாவ பலன் அட்டவணை",
        "ஜைமினி சர தசை, ஆத்மகாரகன் & 7 காரகங்கள்",
        "தொழில் & திருமண பிரத்யேக ஜோதிட பகுப்பாய்வு",
        "5 AI ஜோதிட ஆலோசனை உரையாடல் கிரெடிட்கள்",
        "36 குண அஷ்டகூட திருமணப் பொருத்தம்",
        "உயர் தெளிவுத்திறன் கொண்ட விரிவான PDF அறிக்கை"
      ] : [
        "Everything in Moderate Access",
        "Complete Shodashavarga (All 16 Vargas D1 to D60)",
        "Full Parashari 6-Fold Shadbala & Bhava Bala Matrix",
        "Jaimini Chara Dasha, Atmakaraka & 7 Karakas",
        "Dedicated Career & Marriage Deep-Dive Astrological Engine",
        "5 Conversational AI Astrologer Consultation Credits",
        "36-Guna Kundli Marriage Compatibility",
        "Comprehensive High-Resolution Astrological PDF"
      ]
    },
    {
      id: "complete_200",
      name: isTamil ? "முழுமையான மாஸ்டர் ஆலோசனை" : "Complete Report & All Access",
      priceINR: 200,
      priceUSD: 2.40,
      badge: isTamil ? "முழுமையான மாஸ்டர்" : "Master All-Access",
      features: isTamil ? [
        "அனைத்து வசதிகளும் திறக்கப்பட்ட மாஸ்டர் ஜோதிட தளம்",
        "18 அதிகாரங்கள் கொண்ட விரிவான மாஸ்டர் ஜாதக தொகுப்பு",
        "பராசர தேவதைகளுடன் கூடிய அனைத்து 16 வர்க்கக் கட்டங்கள்",
        "பிறந்த நேர துல்லிய திருத்தம் & D60 நிலைத்தன்மை ஆய்வு",
        "கிரக யுத்தம் (Planetary War) & ஸ்ரீபதி விசேஷ பார்வை கணிப்பு",
        "திருமணம், செல்வம், தொழில், வீடு, ஆரோக்கிய காலக்கணிப்பு",
        "ஜோதிடர் மாஸ்டர் பார்வை & முழுமையான மாஸ்டர் PDF பதிவிறக்கம்",
        "வரம்பற்ற AI ஜோதிட மறு-கேள்வி உரையாடல் & வாழ்க்கை மைல்கல் சரிபார்ப்பு"
      ] : [
        "All-Access Astrologer Consultation Engine",
        "18-Chapter Comprehensive Master Horoscope Dossier",
        "All 16 Divisional Vargas with Parashari Deities & Parity",
        "Birth Time Rectification & D60 Stability Boundary Analysis",
        "Classical Graha Yuddha (Planetary War) & Sripati Aspect Curvature",
        "Dedicated Event-Specific Timing Engine (Marriage, Wealth, Career, Property, Health)",
        "Astrologer's Master Sheet & High-Resolution Dossier PDF Export",
        "Full AI Astrologer Follow-Up Q&A & Retrospective Milestone Verification"
      ]
    }
  ];

  const handleInitiateOrder = async () => {
    setIsProcessing(true);
    setOrderError(null);
    setOrderSuccess(null);
    setPaymentCompleted(null);

    try {
      const token = await ensureSessionToken();
      const payload = {
        planId: selectedPlan,
        billingPeriod: "one_time",
        currency: currency.toUpperCase(),
        paymentMethod
      };

      const response = await apiFetch("/api/payment/create-order", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      if (response && response.ok) {
        const orderData = await response.json();
        const createdOrder = orderData.order || orderData;
        setOrderSuccess(createdOrder);

        // Wire real gateway checkout using provider client SDK
        if (typeof window !== "undefined" && window.Razorpay) {
          const rzp = new window.Razorpay({
            key: createdOrder.gatewayKey || "rzp_checkout_key",
            amount: createdOrder.amountInCents || Math.round(createdOrder.amount * 100),
            currency: createdOrder.currency || "INR",
            name: "ASTROVERSE",
            description: `${selectedPlan.toUpperCase()} Subscription`,
            order_id: createdOrder.gatewayOrderId || createdOrder.orderId,
            handler: async (gatewayResponse) => {
              try {
                const verifyRes = await apiFetch("/api/payment/verify-order", {
                  method: "POST",
                  headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                  },
                  credentials: "include",
                  body: JSON.stringify({
                    orderId: createdOrder.orderId,
                    paymentId: gatewayResponse.razorpay_payment_id,
                    signature: gatewayResponse.razorpay_signature
                  })
                });

                if (verifyRes && verifyRes.ok) {
                  const verifyData = await verifyRes.json();
                  setPaymentCompleted(verifyData);
                  if (onPlanUpgraded) onPlanUpgraded(verifyData);
                } else {
                  const errData = await verifyRes.json().catch(() => ({}));
                  setOrderError(errData.error || "Payment verification failed.");
                }
              } catch (verifyErr) {
                setOrderError(verifyErr.message || "Payment verification encountered an issue.");
              }
            },
            modal: {
              ondismiss: () => {
                setIsProcessing(false);
              }
            }
          });
          rzp.open();
        } else {
          setOrderError(isTamil 
            ? "கட்டண நுழைவாயில் SDK தயாராக இல்லை. கட்டண நுழைவாயில் இணைப்பை உறுதிப்படுத்தவும்." 
            : "Payment gateway checkout SDK is not initialized. Please verify checkout gateway connectivity.");
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create payment order");
      }
    } catch (err) {
      console.error("Payment initiation error:", err);
      setOrderError(err.message || "Payment gateway processing encountered an issue. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-amber-200/80 overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-b border-amber-200/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-black text-stone-900">
                {isTamil ? "ஜாதக அறிக்கைகள் & கட்டணத் திட்டங்கள்" : "Horoscope Reports & Pricing Plans"}
              </h2>
              <p className="text-xs text-stone-600">
                {isTamil ? "ரூ.20 முதல் தொடங்கும் துல்லியமான முழுமையான ஜோதிட அறிக்கைகள்" : "Authentic ephemeris-calculated astrology reports starting from ₹20"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-white/60 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Payment Success State */}
          {paymentCompleted ? (
            <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-300 text-center space-y-4 animate-scaleUp">
              <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-serif font-bold text-stone-900">
                {isTamil ? "கட்டணம் வெற்றிகரமாக செலுத்தப்பட்டது!" : "Payment Successfully Verified!"}
              </h3>
              <p className="text-xs text-stone-600 max-w-md mx-auto">
                {isTamil
                  ? `உங்கள் திட்டம் வெற்றிகரமாக புதுப்பிக்கப்பட்டு முழு அறிக்கைகள் மற்றும் வசதிகள் திறக்கப்பட்டுள்ளன.`
                  : `Your chosen plan has been activated. Full report access and consultation features are now unlocked.`}
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>{isTamil ? "அனைத்து அம்சங்களும் உடனே தயார்" : "All Features Immediately Accessible"}</span>
              </div>
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all"
                >
                  {isTamil ? "அறிக்கையைக் காண்க" : "View My Report"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Plans Grid (4 Plans: ₹20, ₹50, ₹100, ₹200) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {plans.map(p => {
                  const isSelected = selectedPlan === p.id;
                  const priceStr = currency === "INR" ? `₹${p.priceINR}` : `$${p.priceUSD}`;

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlan(p.id)}
                      className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "border-amber-500 bg-amber-500/5 ring-2 ring-amber-400/50 shadow-md scale-[1.02]"
                          : "border-stone-200 bg-white hover:border-amber-300 hover:shadow-xs"
                      }`}
                    >
                      {p.recommended && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                          {p.badge}
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider text-amber-700">
                            {p.badge}
                          </span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                        </div>

                        <div>
                          <h4 className="text-sm font-serif font-black text-stone-900 leading-snug">
                            {p.name}
                          </h4>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className="text-2xl font-black text-stone-900">{priceStr}</span>
                            <span className="text-[10px] text-stone-500 font-semibold">{isTamil ? "/ ஒரு முறை" : "/ one-time"}</span>
                          </div>
                        </div>

                        <ul className="space-y-1.5 pt-2 border-t border-stone-100 text-[11px] text-stone-600">
                          {p.features.map((feat, fIdx) => (
                            <li key={fIdx} className="flex items-start gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="leading-tight">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-4 pt-3 border-t border-stone-100">
                        <button
                          type="button"
                          className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                            isSelected
                              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs"
                              : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                          }`}
                        >
                          {isSelected ? (isTamil ? "தேர்வு செய்யப்பட்டது" : "Selected") : (isTamil ? "தேர்ந்தெடு" : "Select Plan")}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Payment Methods */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3">
                <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  {isTamil ? "பணம் செலுத்தும் முறை (Payment Method)" : "Select Payment Method"}
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "upi", name: "UPI / GPay / PhonePe", icon: Smartphone },
                    { id: "card", name: isTamil ? "டெபிட் / கிரெடிட் கார்டு" : "Cards / NetBanking", icon: CreditCard },
                    { id: "stripe", name: "International / Stripe", icon: Globe }
                  ].map(pm => {
                    const Icon = pm.icon;
                    const isPmSelected = paymentMethod === pm.id;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id)}
                        className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                          isPmSelected
                            ? "bg-white border-amber-500 text-amber-900 shadow-xs ring-1 ring-amber-400"
                            : "bg-white/60 border-stone-200 text-stone-600 hover:bg-white"
                        }`}
                      >
                        <Icon className="w-4 h-4 text-amber-600" />
                        <span>{pm.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error Notice */}
              {orderError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{orderError}</span>
                </div>
              )}
            </>
          )}

        </div>

        {/* Modal Footer */}
        {!paymentCompleted && (
          <div className="p-5 bg-stone-50 border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-stone-600 font-medium">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>{isTamil ? "100% பாதுகாப்பான SSL குறியாக்கம் & உடனடி அறிக்கை" : "100% Secure SSL Payment & Instant Delivery"}</span>
            </div>

            <button
              onClick={handleInitiateOrder}
              disabled={isProcessing}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isTamil ? "செயலாக்கப்படுகிறது..." : "Processing Order..."}</span>
                </>
              ) : (
                <>
                  <span>
                    {isTamil
                      ? `இப்போது பெறுக (${currency === "INR" ? `₹${plans.find(p => p.id === selectedPlan)?.priceINR}` : `$${plans.find(p => p.id === selectedPlan)?.priceUSD}`})`
                      : `Unlock Now (${currency === "INR" ? `₹${plans.find(p => p.id === selectedPlan)?.priceINR}` : `$${plans.find(p => p.id === selectedPlan)?.priceUSD}`})`}
                  </span>
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
