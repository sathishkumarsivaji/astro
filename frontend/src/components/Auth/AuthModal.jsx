import React, { useState } from "react";
import { User, Mail, Lock, Sparkles, CheckCircle2, ArrowRight, Shield, AlertCircle, Loader2 } from "lucide-react";
import { registerUser, loginUser } from "../../services/aiAstrologyService";

export default function AuthModal({ isOpen, onClose, lang = "en", onAuthSuccess = null, initialMode = "register" }) {
  const isTamil = lang === "ta";
  const [mode, setMode] = useState(initialMode); // "register" or "login"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let data;
      if (mode === "register") {
        if (!email.trim() || !password.trim()) {
          throw new Error(isTamil ? "மின்னஞ்சல் மற்றும் கடவுச்சொல் தேவை." : "Email and password are required.");
        }
        data = await registerUser({ name, email, password });
      } else {
        if (!email.trim() || !password.trim()) {
          throw new Error(isTamil ? "மின்னஞ்சல் மற்றும் கடவுச்சொல் தேவை." : "Email and password are required.");
        }
        data = await loginUser({ email, password });
      }

      if (data && data.user) {
        if (onAuthSuccess) onAuthSuccess(data.user);
        onClose();
      }
    } catch (err) {
      setError(err.message || (isTamil ? "செயல்முறை தோல்வியடைந்தது." : "Authentication failed."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md p-6 bg-white rounded-3xl shadow-2xl border border-amber-200/80 overflow-hidden">
        {/* Decorative Background Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-amber-400/20 to-orange-400/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-300 flex items-center justify-center mx-auto text-amber-600">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-serif font-black text-stone-900">
            {mode === "register"
              ? (isTamil ? "இலவச கணக்கு தொடங்குக" : "Create Free Account")
              : (isTamil ? "உள்நுழைக" : "Sign In to AstroVerse")}
          </h2>
          <p className="text-xs text-stone-600">
            {mode === "register"
              ? (isTamil ? "அனைத்து முக்கிய மெனுக்கள் மற்றும் ஜாதகங்களை சேமிக்க பதிவு செய்யவும்" : "Unlock navigation menus, timeline explorer, and save charts")
              : (isTamil ? "உங்கள் சேமித்த ஜாதகங்கள் மற்றும் திட்டங்களை அணுக உள்நுழைக" : "Access your saved horoscopes and reports")}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-stone-100 p-1 mb-5">
          <button
            type="button"
            onClick={() => { setMode("register"); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === "register"
                ? "bg-white text-stone-900 shadow-xs"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            {isTamil ? "இலவச பதிவு" : "Register (Free)"}
          </button>
          <button
            type="button"
            onClick={() => { setMode("login"); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === "login"
                ? "bg-white text-stone-900 shadow-xs"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            {isTamil ? "உள்நுழைவு" : "Sign In"}
          </button>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === "register" && (
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                {isTamil ? "உங்கள் பெயர்" : "Full Name"}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isTamil ? "பெயர் (விருப்பம்)" : "e.g. Anand Sharma"}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-stone-900 outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
              {isTamil ? "மின்னஞ்சல் முகவரி" : "Email Address"} *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-stone-900 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
              {isTamil ? "கடவுச்சொல்" : "Password"} *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-stone-900 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>
                  {mode === "register"
                    ? (isTamil ? "இலவசமாக பதிவு செய்க" : "Complete Free Registration")
                    : (isTamil ? "உள்நுழைக" : "Sign In")}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Benefits List */}
        {mode === "register" && (
          <div className="mt-5 pt-4 border-t border-stone-200/80 space-y-1.5 text-[11px] text-stone-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{isTamil ? "அனைத்து முக்கிய மெனுக்கள் & பக்கங்கள் திறக்கப்படும்" : "Unlocks main navigation menus and features"}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{isTamil ? "ஜாதகங்களைச் சேமித்து எப்போது வேண்டுமானாலும் பார்க்கலாம்" : "Save birth charts to your account profile"}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{isTamil ? "₹20 முதல் விரிவான கட்டண அறிக்கைகள் அணுகல்" : "Access paid detailed reports starting from ₹20"}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
