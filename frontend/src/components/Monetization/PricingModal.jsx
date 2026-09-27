import React, { useState, useEffect } from "react";
import { Check, Crown, CreditCard, Smartphone, Globe, CheckCircle2, Shield, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { TRANSLATIONS } from "../../services/localization";
import { ensureSessionToken } from "../../services/aiAstrologyService";

export default function PricingModal({ isOpen, onClose, lang = "en", onPlanUpgraded = null }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isTamil = lang === "ta";

  const [billingPeriod, setBillingPeriod] = useState("yearly");
  const [currency, setCurrency] = useState("INR");
  const [selectedPlan, setSelectedPlan] = useState("premium");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [orderError, setOrderError] = useState(null);
  const [serverPricing, setServerPricing] = useState(null);
  const [paymentCompleted, setPaymentCompleted] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch authoritative pricing catalog from backend
      fetch("/api/pricing")
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
  }, [isOpen]);

  if (!isOpen) return null;

  const CURRENCY_SYMBOLS = serverPricing?.currencySymbols || {
    INR: "₹",
    USD: "$",
    EUR: "€"
  };

  const EXCHANGE_RATES = serverPricing?.exchangeRates || {
    INR: 83.5,
    USD: 1,
    EUR: 0.92
  };

  const plans = [
    {
      id: "basic",
      name: isTamil ? "அடிப்படை திட்டம் (Basic)" : "Basic Plan",
      monthlyPrice: 9,
      yearlyPrice: 79,
      reportsAllowance: isTamil ? "மாதம் 5 அறிக்கைகள் (ஆண்டுக்கு 60)" : "5 reports/mo (60/yr)",
      badge: isTamil ? "அவசியம்" : "Essential",
      features: isTamil ? [
        "தினசரி, வாராந்திர கிரக பெயர்ச்சி பலன்கள்",
        "சூரிய/சந்திர ராசி & லக்ன பலன்கள்",
        "அடிப்படை ஆயுள் எண் & தினசரி சுழற்சி",
        "குழந்தை பெயர்கள் அட்டவணை அணுகல்"
      ] : [
        "Daily, weekly, and monthly transit forecasts",
        "Essential Western & Vedic Sun/Moon signs",
        "Basic Numerology Life Path & Personal Day",
        "Standard Baby Names directory access"
      ]
    },
    {
      id: "premium",
      name: isTamil ? "பிரீமியம் புரோ (Premium Pro)" : "Premium Pro",
      monthlyPrice: 19,
      yearlyPrice: 149,
      reportsAllowance: isTamil ? "மாதம் 15 அறிக்கைகள் (ஆண்டுக்கு 200)" : "15 reports/mo (200/yr)",
      badge: t.recommended,
      features: isTamil ? [
        "அடிப்படை திட்டத்தின் அனைத்து வசதிகளும்",
        "முழு விம்சோத்தரி தசா-புக்தி & கோச்சார வாழ்க்கை காலக்கோடு",
        "36 குண அஷ்டகூட திருமணப் பொருத்தம்",
        "வரம்பற்ற முழுமையான PDF ஜாதக பதிவிறக்கம்",
        "நட்சத்திர பாத குழந்தை பெயர்கள் ஜெனரேட்டர்",
        "சாமுத்ரிக கைரேகை ஆய்வு குறிப்புகள் (முன்வடிவம்)"
      ] : [
        "Everything in Basic Plan",
        "Personalized Dasha & Transit Life Timeline",
        "36 Guna Kundli Marriage Compatibility",
        "Unlimited PDF Report Exports",
        "Deep Nakshatra pada newborn name generator",
        "Classical Samudrika Palmistry Reference & Mounts"
      ]
    },
    {
      id: "family",
      name: isTamil ? "குடும்ப திட்டம் (Family Plan)" : "Family Plan",
      monthlyPrice: 29,
      yearlyPrice: 219,
      reportsAllowance: isTamil ? "மாதம் 25 அறிக்கைகள் (ஆண்டுக்கு 360)" : "25 reports/mo (360/yr)",
      badge: isTamil ? "குடும்பத்திற்கானது" : "Best Value",
      features: isTamil ? [
        "குடும்ப உறுப்பினர்கள் கணக்குகள் (6 நபர்கள் வரை)",
        "குழந்தை பெயர் தேர்வு குடும்ப வாக்களிப்பு இணைப்பு",
        "முன்னுரிமை அதிவேக எபிமெரிஸ் கணிப்பு",
        "முழுமையான வாழ்நாள் ஜாதக அறிக்கைகள்",
        "இடது vs வலது கைரேகை ஒப்பீட்டு பலன்"
      ] : [
        "Multi-profile management (Up to 6 family members)",
        "Collaborative Baby Name voting & shareable links",
        "Priority Astro-algorithmic compute speed",
        "Full export rights for life-stage reports",
        "Palmistry comparison (Left vs Right hand duality)"
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
      let response;
      try {
        response = await fetch("/api/payment/create-order", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          credentials: "include",
          body: JSON.stringify({
            planId: selectedPlan,
            billingPeriod,
            currency,
            paymentMethod
          })
        });
      } catch {
        response = await fetch("http://localhost:5000/api/payment/create-order", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          credentials: "include",
          body: JSON.stringify({
            planId: selectedPlan,
            billingPeriod,
            currency,
            paymentMethod
          })
        });
      }

      if (response && response.ok) {
        const orderData = await response.json();
        const createdOrder = orderData.order || orderData;
        setOrderSuccess(createdOrder);

        // Auto-verify / Complete payment simulation
        const verifyRes = await fetch("/api/payment/verify-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          credentials: "include",
          body: JSON.stringify({
            orderId: createdOrder.orderId,
            paymentId: `pay_${Date.now()}_sim`,
            signature: "simulated_sig"
          })
        }).catch(() => null);

        if (verifyRes && verifyRes.ok) {
          const verifyData = await verifyRes.json();
          setPaymentCompleted(verifyData);
          if (typeof onPlanUpgraded === "function") {
            onPlanUpgraded(verifyData);
          }
        }
      } else {
        const errData = response ? await response.json().catch(() => ({})) : {};
        setOrderError(errData.error || (isTamil ? "கட்டண சேவை தற்போது கிடைக்கவில்லை. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்." : "Payment service temporarily unavailable. Please try again."));
      }
    } catch (err) {
      setOrderError(isTamil ? "கட்டண சேவையுடன் தொடர்பு கொள்ள முடியவில்லை. தயவுசெய்து உங்கள் இணைய இணைப்பை சரிபார்க்கவும்." : "Payment gateway temporarily unreachable. Please check connection and try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-4xl w-full my-8 p-6 md:p-8 rounded-3xl bg-[#FFFDF9] border border-amber-300 relative space-y-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-800 p-2 text-sm font-bold"
        >
          ✕
        </button>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold uppercase tracking-wider">
            <Crown className="w-3.5 h-3.5" /> {t.pricingTag}
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900">
            {t.pricingTitle}
          </h2>
          <p className="text-xs text-stone-600 max-w-lg mx-auto">
            {t.pricingDesc}
          </p>
        </div>

        {/* Period & Currency */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-2xl bg-amber-50/70 border border-amber-200">
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-amber-200 shadow-xs">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                billingPeriod === "monthly" ? "bg-amber-500 text-white shadow-xs" : "text-stone-600 hover:text-stone-900"
              }`}
            >
              {t.monthlyBilling}
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingPeriod === "yearly" ? "bg-amber-500 text-white shadow-xs" : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <span>{t.yearlyBilling}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-stone-600">
            <span className="font-semibold text-stone-800">{t.currencyLabel}</span>
            {["INR", "USD", "EUR"].map(c => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  currency === c
                    ? "bg-amber-200/80 text-amber-900 border border-amber-300"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map(plan => {
            const basePrice = billingPeriod === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
            const convertedPrice = Math.round(basePrice * EXCHANGE_RATES[currency]);
            const isSelected = selectedPlan === plan.id;

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`p-5 rounded-2xl cursor-pointer transition-all border relative flex flex-col justify-between ${
                  isSelected
                    ? "bg-gradient-to-b from-amber-50/90 to-orange-50/40 border-2 border-amber-500 shadow-lg shadow-amber-500/10"
                    : "bg-[#FFFDF9] border border-amber-200 hover:border-amber-400 shadow-sm"
                }`}
              >
                {plan.id === "premium" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-md">
                    {t.recommended}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-serif font-bold text-stone-900 text-base">{plan.name}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                      {plan.reportsAllowance}
                    </span>
                  </div>

                  <div className="mb-4">
                    <span className="text-3xl font-extrabold text-amber-700">
                      {CURRENCY_SYMBOLS[currency]}{convertedPrice}
                    </span>
                    <span className="text-xs text-stone-500">/{billingPeriod === "yearly" ? (isTamil ? "ஆண்டு" : "year") : (isTamil ? "மாதம்" : "mo")}</span>
                  </div>

                  <ul className="space-y-2 mb-6 text-xs text-stone-700">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={`w-full py-2 rounded-xl text-xs font-bold text-center transition-all ${
                  isSelected 
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs" 
                    : "bg-amber-100/80 hover:bg-amber-100 text-stone-800 border border-amber-300"
                }`}>
                  {isSelected ? t.selectedPlan : t.choosePlan}
                </div>
              </div>
            );
          })}
        </div>

        {/* Gateways */}
        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
            {t.selectPaymentMethod}
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: "upi", label: "UPI / QR / NetBanking", icon: Smartphone },
              { id: "card", label: "Credit / Debit Card", icon: CreditCard },
              { id: "wallet", label: "Google Pay / Apple Pay", icon: Globe }
            ].map(gateway => (
              <button
                key={gateway.id}
                onClick={() => setPaymentMethod(gateway.id)}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  paymentMethod === gateway.id
                    ? "bg-white border-2 border-amber-500 text-amber-800 shadow-xs"
                    : "bg-white/70 border border-amber-200 text-stone-600 hover:border-amber-400"
                }`}
              >
                <gateway.icon className="w-4 h-4" />
                <span className="text-[11px] font-semibold">{gateway.label}</span>
              </button>
            ))}
          </div>
        </div>

        {orderError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{orderError}</span>
          </div>
        )}

        {/* Checkout CTA */}
        <div className="space-y-3 pt-2">
          {paymentCompleted ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{isTamil ? "கட்டணம் வெற்றிகரமாக செலுத்தப்பட்டு கணக்கு புதுப்பிக்கப்பட்டது!" : "Payment Verified & Balance Credited!"}</span>
              </div>
              <p className="text-xs text-stone-700 font-medium">
                {isTamil
                  ? `திட்டம்: ${paymentCompleted.subscriptionTier?.toUpperCase()} | சேர்க்கப்பட்ட புள்ளிகள்: +${paymentCompleted.creditsAdded} | புதிய இருப்பு: ${paymentCompleted.newBalance}`
                  : `Plan: ${paymentCompleted.subscriptionTier?.toUpperCase()} | Added: +${paymentCompleted.creditsAdded} Credits | New Balance: ${paymentCompleted.newBalance} Credits`}
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-xs"
              >
                {isTamil ? "முடிந்தது (Done)" : "Done"}
              </button>
            </div>
          ) : orderSuccess ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-amber-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-amber-600" />
                <span>{isTamil ? "ஆர்டர் வெற்றிகரமாக உருவாக்கப்பட்டது" : "Order Created Successfully"}</span>
              </div>
              <p className="text-xs text-stone-600">
                {isTamil ? `ஆர்டர் எண்: ${orderSuccess.orderId} | நிலை: தயாராக உள்ளது` : `Order Ref: ${orderSuccess.orderId} | Status: Ready for Payment`}
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-all shadow-xs"
              >
                {isTamil ? "முடிந்தது (Close)" : "Done"}
              </button>
            </div>
          ) : (
            <button
              onClick={handleInitiateOrder}
              disabled={isProcessing}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white font-bold text-sm shadow-md shadow-amber-500/25 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{isTamil ? "ஆர்டர் துவங்குகிறது..." : "Initiating Order..."}</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>{t.authorizeUnlock}</span>
                </>
              )}
            </button>
          )}

          <p className="text-[11px] text-center text-stone-500">
            {t.securityNotice}
          </p>
        </div>
      </div>
    </div>
  );
}
