import React, { useState } from "react";
import { Sparkles, Camera, Upload, CheckCircle2, ArrowRight, Clock, Calendar, HelpCircle, Shield, Award, ChevronRight, RefreshCw, Compass, AlertTriangle, Check, X, Star, Target, BookOpen, Briefcase, Heart, Home } from "lucide-react";
import { analyzeDualPalmsForBirthRecovery, generateVerificationQuestions, reverseCalculateBirthTimeAndDOB, MONTHS } from "../../services/nashtaJatakaEngine";
import { TRANSLATIONS } from "../../services/localization";
import PlaceAutocomplete from "../Common/PlaceAutocomplete";

export default function BirthRecoveryWizard({ onApplyEstimatedChart, lang = "en" }) {
  const isTamil = lang === "ta";
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // 3-Step Wizard: 1 = Dual Hand Upload, 2 = Event Calibration Questionnaire, 3 = Reverse Ephemeris Synthesis
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Step 1 State: Hand photos
  const [dominantHand, setDominantHand] = useState("right");
  const [dominantImg, setDominantImg] = useState(null);
  const [nonDominantImg, setNonDominantImg] = useState(null);
  const [analyzingPalms, setAnalyzingPalms] = useState(false);
  const [palmAnalysis, setPalmAnalysis] = useState(null);

  // Live Camera Capture Modal State
  const [activeCapturingSlot, setActiveCapturingSlot] = useState(null); // 'dominant' or 'nonDominant'
  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const dominantFileRef = React.useRef(null);
  const nonDominantFileRef = React.useRef(null);

  const openCameraForSlot = async (slot) => {
    setActiveCapturingSlot(slot);
    setCameraError("");
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(isTamil ? "கேமரா வசதி ஆதரிக்கப்படவில்லை." : "Camera API not supported.");
      }
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      } catch (e) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        setStreamActive(true);
        try { await videoRef.current.play(); } catch (err) {}
      }
    } catch (err) {
      setCameraError(isTamil ? "கேமரா துவங்கவில்லை. அனுமதியை சரிபார்க்கவும்." : "Camera could not be started. Please check permissions.");
    }
  };

  const stopCameraStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
    setActiveCapturingSlot(null);
  };

  const capturePhotoFromCamera = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg");
    if (activeCapturingSlot === "dominant") {
      setDominantImg(dataUrl);
    } else {
      setNonDominantImg(dataUrl);
    }
    stopCameraStream();
  };

  const handleFileUpload = (e, slot) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (slot === "dominant") setDominantImg(event.target.result);
      else setNonDominantImg(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  React.useEffect(() => {
    return () => stopCameraStream();
  }, []);

  // Step 2 State: 20 Verification Milestones
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({
    q1_year: "",
    q1_month: "",
    q2_year: "",
    q2_month: "",
    q3_year: "",
    q3_month: "",
    q4_year: "",
    q4_month: "",
    q5_year: "",
    q5_month: "",
    q6_year: "",
    q6_month: "",
    q7_year: "",
    q7_month: "",
    q8_year: "",
    q8_month: "",
    q9_year: "",
    q9_month: "",
    q10_year: "",
    q10_month: "",
    q11_year: "",
    q11_month: "",
    q12_year: "",
    q12_month: "",
    q13_year: "",
    q13_month: "",
    q14_year: "",
    q14_month: "",
    q15_year: "",
    q15_month: "",
    q16_year: "",
    q16_month: "",
    q17_year: "",
    q17_month: "",
    q18_year: "",
    q18_month: "",
    q19_year: "",
    q19_month: "",
    q20_year: "",
    q20_month: "",
    birthCity: ""
  });

  // Step 3 State: Calculation Results
  const [calculatingSynthesis, setCalculatingSynthesis] = useState(false);
  const [result, setResult] = useState(null);

  // Handler Step 1 -> Step 2
  const handleAnalyzeHands = () => {
    setAnalyzingPalms(true);
    setTimeout(() => {
      const analysis = analyzeDualPalmsForBirthRecovery({
        dominantHandImg: dominantImg,
        nonDominantHandImg: nonDominantImg,
        handDominance: dominantHand
      });
      const generatedQs = generateVerificationQuestions(analysis, lang);
      setPalmAnalysis(analysis);
      setQuestions(generatedQs);
      setAnalyzingPalms(false);
      setCurrentStep(2);
    }, 1500);
  };

  // Handler Step 2 -> Step 3
  const handleCalculateReverseBirth = () => {
    setCalculatingSynthesis(true);
    setTimeout(() => {
      const calculatedResult = reverseCalculateBirthTimeAndDOB({
        palmProfile: palmAnalysis,
        answers,
        lang
      });
      setResult(calculatedResult);
      setCalculatingSynthesis(false);
      setCurrentStep(3);
    }, 1800);
  };

  // Count answered questions and anchor count
  const answeredQuestions = questions.filter((q, idx) => {
    const yr = answers[`q${idx + 1}_year`];
    return yr && !isNaN(parseInt(yr, 10)) && parseInt(yr, 10) > 1900;
  });
  const answeredCount = answeredQuestions.length;
  const answeredAnchorCount = answeredQuestions.filter(q => q.isAnchor).length;

  // Filter questions by selected category tab
  const filteredQuestions = questions.filter(q => {
    if (selectedCategory === "all") return true;
    return q.section === selectedCategory;
  });

  // Calculate live dynamic precision error margin
  let liveErrorMarginMonths = 4.2;
  if (answeredAnchorCount >= 2) liveErrorMarginMonths = 2.4;
  else if (answeredAnchorCount === 1) liveErrorMarginMonths = 3.2;
  else if (answeredCount >= 6) liveErrorMarginMonths = 3.8;
  else if (answeredCount >= 3) liveErrorMarginMonths = 5.5;
  else liveErrorMarginMonths = 8.0;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Wizard Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#FFFDF9] border border-amber-300 space-y-4 text-center shadow-md">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          {isTamil ? "நஷ்ட ஜாதகம்: பிறந்த தேதி & நேர கணிப்பான்" : "Nashta Jataka: Reverse DOB & Birth Time Engine"}
        </div>
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900">
          {isTamil 
            ? "பிறந்த தேதி, நேரம் தெரியவில்லையா? சில மாதங்களுக்குள் துல்லியமாக கண்டறியுங்கள்" 
            : "Unknown Birth Time or Date? Calculate Within Few Months Precision via Life Events"}
        </h2>
        <p className="text-xs text-stone-600 max-w-2xl mx-auto leading-relaxed">
          {isTamil
            ? "சாமுத்ரிகா லட்சண மாதிரிகள் மற்றும் வேத நஷ்ட ஜாதக சூத்திரங்களின்படி, பள்ளி/கல்லூரி, தொழில், திருமணம் போன்ற முக்கிய வாழ்க்கை நிகழ்வுகளின் மாதம்/ஆண்டுகளைக் கொண்டு உத்தேச பிறந்த காலக்கட்டத்தை அறியலாம். (கைப்படங்கள் உருவக மாதிரியாக பயன்படுகின்றன; வரலாற்று மைல்கற்கள் கணித அடிப்படையை வழங்குகின்றன)."
            : "Using classical Samudrika chiromancy archetypes and Vedic Nashta Jataka algorithms, we calibrate life event milestones (education, career, marriage) to hypothesize a likely birth time window. (Note: Hand photos provide illustrative geometric guidance; historical milestones provide the mathematical basis)."}
        </p>

        {/* Accuracy Target Highlight Banner */}
        <div className="inline-flex flex-wrap items-center justify-center gap-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-100/80 via-purple-50 to-emerald-50 border border-amber-300 text-xs">
          <span className="flex items-center gap-1.5 font-bold text-amber-900">
            <Target className="w-4 h-4 text-amber-700" />
            {isTamil ? "துல்லிய இலக்கு: சில மாதங்கள் / 1 ஆண்டுக்குள்" : "Precision Target: Within Few Months / ~1 Year"}
          </span>
          <span className="text-stone-400 hidden sm:inline">•</span>
          <span className="text-emerald-800 font-semibold flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            {isTamil ? "10/12-ம் வகுப்பு, கல்லூரி தேதிகள் துல்லியத்தை மேலும் அதிகரிக்கும்" : "10th/12th Board & Degree dates maximize accuracy"}
          </span>
        </div>

        {/* 3 Step Indicator Tracker */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 pt-2">
          {[
            { num: 1, label: isTamil ? "படி 1: இரு கைரேகை ஸ்கேன்" : "Step 1: Dual Palm Scan" },
            { num: 2, label: isTamil ? "படி 2: வாழ்நாள் நிகழ்வு காலக்கோடு" : "Step 2: Month & Year Milestones" },
            { num: 3, label: isTamil ? "படி 3: பிறந்த நேரம் & லக்னம் கணிப்பு" : "Step 3: Birth Time Synthesis" }
          ].map(step => (
            <div
              key={step.num}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                currentStep === step.num
                  ? "bg-amber-500 text-white font-bold border-amber-500 shadow-md shadow-amber-500/20"
                  : currentStep > step.num
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold"
                  : "bg-amber-50/60 text-stone-500 border-amber-200"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === step.num ? "bg-white text-amber-700" : currentStep > step.num ? "bg-emerald-600 text-white" : "bg-amber-200/60 text-stone-600"
              }`}>
                {currentStep > step.num ? "✓" : step.num}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: Dual Palm Upload & Physical Extraction */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="p-6 md:p-8 rounded-3xl bg-[#FFFDF9] border border-amber-300 space-y-6 shadow-md">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-amber-200 pb-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-stone-900">
                  {isTamil ? "படி 1: உங்கள் இரு கைகளையும் பதிவேற்றவும்" : "Step 1: Upload Both Hands (Palms Flat & Fingers Straight)"}
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  {isTamil ? "செயல்படும் கை (Dominant) மற்றும் செயல்படாத கை (Non-dominant) இரண்டையும் ஒப்பிடுவது அவசியம்." : "Comparing both dominant and non-dominant palms is required for proportional millimeter age scaling."}
                </p>
              </div>

              {/* Hand Dominance Switch */}
              <div className="flex items-center bg-amber-100/70 p-1 rounded-xl border border-amber-200 text-xs">
                <span className="text-stone-700 px-2 font-medium">{isTamil ? "செயல்படும் கை:" : "Dominant Hand:"}</span>
                <button
                  onClick={() => setDominantHand("right")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    dominantHand === "right" ? "bg-amber-500 text-white shadow-xs" : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  {isTamil ? "வலது கை" : "Right Hand"}
                </button>
                <button
                  onClick={() => setDominantHand("left")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    dominantHand === "left" ? "bg-amber-500 text-white shadow-xs" : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  {isTamil ? "இடது கை" : "Left Hand"}
                </button>
              </div>
            </div>

            {/* Dual Upload Slots */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hand 1: Dominant */}
              <div className="p-5 rounded-2xl bg-amber-50/40 border border-amber-200 space-y-4 text-center shadow-xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-900">
                    {isTamil ? "1. செயல்படும் கை (Dominant Hand)" : "1. Dominant Hand (Active Destiny)"}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold border border-amber-300">
                    {isTamil ? "விதி ரேகை & செயல்" : "Fate & Life Lines"}
                  </span>
                </div>

                <div className="h-56 rounded-xl bg-[#FFFDF9] border-2 border-dashed border-amber-300 flex flex-col items-center justify-center p-3 hover:border-amber-500 transition-colors relative overflow-hidden">
                  {dominantImg && dominantImg !== "sample_dominant" ? (
                    <img src={dominantImg} alt="Dominant Palm" className="w-full h-full object-contain" />
                  ) : dominantImg === "sample_dominant" ? (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                      <span className="text-xs font-bold text-stone-800">{isTamil ? "ஹை-ரெஸ் கைரேகை மாதிரி தயார்" : "High-Res Palm Scan Ready"}</span>
                    </div>
                  ) : (
                    <>
                      <Camera className="w-10 h-10 text-stone-400 mb-2" />
                      <p className="text-xs text-stone-700 font-semibold">
                        {isTamil ? "வலது கை படம் பிடிக்கவும் / பதிவேற்றவும்" : "Capture / Upload Dominant Palm"}
                      </p>
                      <p className="text-[10px] text-stone-500 mt-1">
                        {isTamil ? "நல்ல வெளிச்சத்தில் விரல்களை நேராக வைக்கவும்" : "Open palm flat, fingers straight"}
                      </p>
                    </>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => openCameraForSlot("dominant")}
                      className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow-md hover:brightness-110 flex items-center justify-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{isTamil ? "கேமரா தொடங்கு" : "Live Camera"}</span>
                    </button>

                    <button
                      onClick={() => dominantFileRef.current?.click()}
                      className="py-2.5 px-3 rounded-xl bg-amber-100/80 hover:bg-amber-100 text-stone-800 font-semibold text-xs border border-amber-300 flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-700" />
                      <span>{isTamil ? "புகைப்படம்" : "Upload File"}</span>
                    </button>
                  </div>

                  <input
                    ref={dominantFileRef}
                    type="file"
                    accept="image/*"
                    onChange={e => handleFileUpload(e, "dominant")}
                    className="hidden"
                  />

                  <button
                    onClick={() => setDominantImg("sample_dominant")}
                    className="w-full py-1.5 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] border border-amber-200"
                  >
                    {isTamil ? "மாதிரி கைரேகையை பயன்படுத்து" : "Use High-Res Palm Scan"}
                  </button>
                </div>
              </div>

              {/* Hand 2: Non-Dominant */}
              <div className="p-5 rounded-2xl bg-amber-50/40 border border-amber-200 space-y-4 text-center shadow-xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-purple-900">
                    {isTamil ? "2. செயல்படாத கை (Non-Dominant)" : "2. Non-Dominant Hand (Natal Blueprint)"}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-semibold border border-purple-200">
                    {isTamil ? "பூர்வ புண்ணியம்" : "Innate Karma"}
                  </span>
                </div>

                <div className="h-56 rounded-xl bg-[#FFFDF9] border-2 border-dashed border-amber-300 flex flex-col items-center justify-center p-3 hover:border-amber-500 transition-colors relative overflow-hidden">
                  {nonDominantImg && nonDominantImg !== "sample_non_dominant" ? (
                    <img src={nonDominantImg} alt="Non-Dominant Palm" className="w-full h-full object-contain" />
                  ) : nonDominantImg === "sample_non_dominant" ? (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <CheckCircle2 className="w-12 h-12 text-purple-600" />
                      <span className="text-xs font-bold text-stone-800">{isTamil ? "ஹை-ரெஸ் கைரேகை மாதிரி தயார்" : "High-Res Palm Scan Ready"}</span>
                    </div>
                  ) : (
                    <>
                      <Camera className="w-10 h-10 text-stone-400 mb-2" />
                      <p className="text-xs text-stone-700 font-semibold">
                        {isTamil ? "இடது கை படம் பிடிக்கவும் / பதிவேற்றவும்" : "Capture / Upload Non-Dominant Palm"}
                      </p>
                      <p className="text-[10px] text-stone-500 mt-1">
                        {isTamil ? "பிறவி குணங்கள் மற்றும் ஆற்றலை அறிய" : "For inborn planetary potential extraction"}
                      </p>
                    </>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => openCameraForSlot("nonDominant")}
                      className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-md hover:brightness-110 flex items-center justify-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{isTamil ? "கேமரா தொடங்கு" : "Live Camera"}</span>
                    </button>

                    <button
                      onClick={() => nonDominantFileRef.current?.click()}
                      className="py-2.5 px-3 rounded-xl bg-amber-100/80 hover:bg-amber-100 text-stone-800 font-semibold text-xs border border-amber-300 flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-purple-700" />
                      <span>{isTamil ? "புகைப்படம்" : "Upload File"}</span>
                    </button>
                  </div>

                  <input
                    ref={nonDominantFileRef}
                    type="file"
                    accept="image/*"
                    onChange={e => handleFileUpload(e, "nonDominant")}
                    className="hidden"
                  />

                  <button
                    onClick={() => setNonDominantImg("sample_non_dominant")}
                    className="w-full py-1.5 px-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 text-[11px] border border-purple-200"
                  >
                    {isTamil ? "மாதிரி கைரேகையை பயன்படுத்து" : "Use High-Res Palm Scan"}
                  </button>
                </div>
              </div>
            </div>

            {/* Probable Birth City input for Local Sidereal Time and Sunrise calculation */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs text-stone-700 font-medium">
                {isTamil ? "பிறந்த தோராய ஊர் / நகரம் (தட்டச்சு செய்து தேர்வு செய்க)" : "Probable Birth City / Region (Type to Search & Autopopulate)"}
              </label>
              <PlaceAutocomplete
                value={answers.birthCity || ""}
                onChange={(val) => setAnswers(prev => ({ ...prev, birthCity: val, latitude: null, longitude: null, timezoneId: null, utcOffset: null }))}
                onSelect={(p) => setAnswers(prev => ({
                  ...prev,
                  birthCity: p.displayString || p.name,
                  latitude: p.lat,
                  longitude: p.lon ?? p.lng,
                  utcOffset: p.tz ?? null,
                  timezoneId: p.timezoneId || null
                }))}
                lang={lang}
                placeholder={isTamil ? "பிறந்த ஊரை தேடவும்..." : "Search probable birth city..."}
              />
            </div>

            <button
              onClick={handleAnalyzeHands}
              disabled={analyzingPalms}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white font-bold text-sm shadow-md shadow-amber-500/25 hover:brightness-110 flex items-center justify-center gap-2 transition-all"
            >
              {analyzingPalms ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isTamil ? "மில்லிமீட்டர் ரேகை விகிதங்கள் பிரித்தெடுக்கப்படுகிறது..." : "Extracting Millimeter Lines & Mount Radians..."}</span>
                </>
              ) : (
                <>
                  <span>{isTamil ? "இரு கைகளையும் ஆய்வு செய்து வாழ்நாள் நிகழ்வு கேள்விகளை பெறுக" : "Analyze Dual Palms & Load Month/Year Calibration Suite"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Expanded Automated Verification Questionnaire (Month & Year) */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="p-6 md:p-8 rounded-3xl bg-[#FFFDF9] border border-amber-300 space-y-6 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                  {isTamil ? "மாதம் & ஆண்டு காலக்கோடு அளவீடு" : "Month & Year Timeline Calibration"}
                </span>
                <h3 className="font-serif font-bold text-xl text-stone-900 mt-1">
                  {isTamil ? "படி 2: உங்கள் வாழ்க்கையின் உண்மை நிகழ்வுகளை உறுதிப்படுத்துங்கள்" : "Step 2: Confirm Life Incidents by Month & Year"}
                </h3>
                <p className="text-xs text-stone-600 mt-1">
                  {isTamil
                    ? "வயது தெரிய வேண்டியதில்லை! ஒவ்வொரு நிகழ்வும் உங்கள் நினைவில் உள்ள மாதம் மற்றும் ஆண்டை மட்டும் குறிப்பிட்டால் போதும். அதிக நிகழ்வுகளை உள்ளிட சில மாதங்களுக்குள் துல்லியம் உயரும்."
                    : "No age required! Simply enter the calendar Month & Year when each event occurred. Answering more milestones pins the date within a few months."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Live Error Margin Badge */}
                <div className="px-3 py-1 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-1.5 shrink-0">
                  <Target className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isTamil ? `துல்லிய இடைவெளி: ± ${liveErrorMarginMonths} மாதங்கள்` : `Current Margin: ± ${liveErrorMarginMonths} Months`}</span>
                </div>

                {/* Progress Counter */}
                <div className="px-3 py-1 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold shrink-0">
                  {isTamil ? `${answeredCount} / 20 நிகழ்வுகள்` : `${answeredCount} / 20 Milestones`}
                </div>

                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-xs text-stone-500 hover:text-stone-900 underline font-medium"
                >
                  {isTamil ? "திரும்பிச் செல்" : "Back to Scan"}
                </button>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-2 pt-1 border-b border-amber-200 pb-3">
              {[
                { id: "all", label: isTamil ? "அனைத்து நிகழ்வுகள் (20)" : "All Milestones (20)", icon: Sparkles },
                { id: "education", label: isTamil ? "🎓 பள்ளி & கல்லூரி கல்வி" : "🎓 Education (High Accuracy)", icon: BookOpen },
                { id: "career", label: isTamil ? "💼 தொழில் & வெளிநாடு" : "💼 Career & Travel", icon: Briefcase },
                { id: "family", label: isTamil ? "💍 திருமணம் & வாரிசு" : "💍 Marriage & Family", icon: Heart },
                { id: "assets", label: isTamil ? "🏡 சொத்து & ஆன்மீகம்" : "🏡 Assets & Spirituality", icon: Home }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    selectedCategory === tab.id
                      ? "bg-amber-500 text-white font-bold shadow-xs"
                      : "bg-amber-50 hover:bg-amber-100 text-stone-700 border border-amber-200"
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {filteredQuestions.map((q) => {
                const questionIndex = questions.findIndex(item => item.id === q.id);
                const yearKey = `q${questionIndex + 1}_year`;
                const monthKey = `q${questionIndex + 1}_month`;
                const isAnswered = answers[yearKey] && !isNaN(parseInt(answers[yearKey], 10)) && parseInt(answers[yearKey], 10) > 1900;

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      isAnswered
                        ? "bg-amber-50/50 border-amber-300 shadow-xs"
                        : "bg-[#FFFDF9] border-amber-200"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isAnswered ? "bg-amber-500 text-white" : "bg-amber-100 text-stone-700"
                        }`}>
                          {isAnswered ? "✓" : questionIndex + 1}
                        </span>
                        <span className="text-xs font-bold text-amber-900">
                          {q.category}
                        </span>
                        {q.isAnchor && (
                          <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-900 border border-yellow-300 text-[10px] font-bold flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                            {isTamil ? "உயர் துல்லியம்" : "High Anchor"}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200 font-medium">
                          {q.bhava}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-stone-700 border border-amber-200">
                          {q.lineCorrelated}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-stone-800 font-medium leading-relaxed">
                      {q.question}
                    </p>

                    {/* Milestone Type Chips */}
                    {q.suggestedTypes && (
                      <div className="flex flex-wrap gap-1.5">
                        {q.suggestedTypes.map((st, sIdx) => (
                          <span key={sIdx} className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-stone-600 border border-amber-200">
                            • {st}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Inputs: Month Dropdown + Year Input + Clear/Skip */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-amber-200">
                      {/* Month Dropdown */}
                      <div className="w-36">
                        <label className="text-[10px] text-stone-600 block mb-0.5 font-medium">
                          {isTamil ? "மாதம் (Month)" : "Month"}
                        </label>
                        <select
                          value={answers[monthKey] || "5"}
                          onChange={e => setAnswers(prev => ({ ...prev, [monthKey]: e.target.value }))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#FFFDF9] border border-amber-300 text-xs text-stone-900 focus:outline-none focus:border-amber-500 shadow-xs"
                        >
                          {MONTHS.map(m => (
                            <option key={m.value} value={m.value}>
                              {isTamil ? m.ta : m.en}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Year Input */}
                      <div className="w-32">
                        <label className="text-[10px] text-stone-600 block mb-0.5 font-medium">
                          {isTamil ? "ஆண்டு (Year)" : "Year"}
                        </label>
                        <input
                          type="number"
                          value={answers[yearKey] || ""}
                          onChange={e => setAnswers(prev => ({ ...prev, [yearKey]: e.target.value }))}
                          placeholder="e.g. 2012"
                          className="w-full px-3 py-1.5 rounded-lg bg-[#FFFDF9] border border-amber-300 text-xs text-stone-900 focus:outline-none focus:border-amber-500 shadow-xs"
                        />
                      </div>

                      {/* Skip / Clear Action */}
                      <div className="pt-4">
                        {isAnswered ? (
                          <button
                            onClick={() => setAnswers(prev => ({ ...prev, [yearKey]: "" }))}
                            className="text-[11px] text-stone-500 hover:text-rose-600 flex items-center gap-1 font-medium"
                          >
                            <X className="w-3 h-3" />
                            <span>{isTamil ? "அழிக்க" : "Clear"}</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-stone-500 italic">
                            {isTamil ? "நடக்கவில்லையெனில் விட்டுவிடலாம்" : "Leave blank if not applicable"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleCalculateReverseBirth}
              disabled={calculatingSynthesis}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white font-bold text-sm shadow-md shadow-amber-500/30 hover:brightness-110 flex items-center justify-center gap-2 transition-all"
            >
              {calculatingSynthesis ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isTamil ? "நஷ்ட ஜாதக எபிமெரிஸ் மற்றும் தசா புக்தி கணக்கிடப்படுகிறது..." : "Cross-Referencing Dasha & Gochar Ephemeris..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>{isTamil ? "நஷ்ட ஜாதக முறைப்படி பிறந்த தேதி & நேரத்தை கண்டறி" : "Synthesize Exact Birth Date, Lagna & Time Window"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Synthesis Results (Date, Time Window, Lagna, Proofs) */}
      {currentStep === 3 && result && (
        <div className="space-y-6">
          {/* Main Success Certificate */}
          <div className="p-6 md:p-8 rounded-3xl bg-[#FFFDF9] border border-amber-300 relative overflow-hidden shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-amber-200 pb-4">
              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider border border-emerald-300 inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  {isTamil ? "பாரம்பரிய உத்தேச நஷ்ட ஜாதக மறுகட்டமைப்பு" : "Heuristic Nashta Jataka Reconstruction"}
                </span>
                <h3 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 mt-2">
                  {isTamil ? "கண்டறியப்பட்ட பிறந்த தேதி & நேர எல்லை" : "Isolated Birth Date & Precision Time Window"}
                </h3>
                <p className="text-xs text-stone-600 mt-1">
                  {isTamil
                    ? "பாரம்பரிய உத்தேச மறுகட்டமைப்பு: முடிவுகள் கருதுகோள் அடிப்படையிலானவை; அறிவியல் ரீதியான துல்லிய உத்தரவாதம் இல்லை."
                    : "Traditional experimental reconstruction. Results are hypothesis-based and not empirically validated."}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-center sm:text-right">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold block mb-1">
                    {isTamil ? `உத்தேச தேடல் சாளரம்: ~${result.errorMarginMonths} மாதங்கள்` : `Heuristic Search Window: ~${result.errorMarginMonths} Mo`}
                  </span>
                  <span className="text-lg font-bold text-amber-800 block">
                    {result.hypothesisStrength || (result.heuristicEvidenceScore > 0 ? (isTamil ? "சோதனை முறை கருதுகோள்" : "Experimental Heuristic Hypothesis") : (isTamil ? "ஆரம்ப நிலை கருதுகோள்" : "Baseline Heuristic Candidate"))}
                  </span>
                  <span className="text-xs text-stone-500 block font-semibold">
                    {isTamil ? "சோதனை முறை கருதுகோள் வரிசை (கணக்கீட்டு ஜோதிட பலன் அல்ல)" : "Heuristic Candidate Ranking (Non-Deterministic)"}
                  </span>
                </div>
              </div>
            </div>

            {/* Highlighted Result Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Estimated DOB */}
              <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-300 space-y-2 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wider">
                  <Calendar className="w-4 h-4 text-amber-700" />
                  {isTamil ? "கணிக்கப்பட்ட பிறந்த தேதி" : "Estimated Birth Date Window"}
                </div>
                <h4 className="text-xl font-serif font-bold text-stone-900">
                  {result.candidateMonthWindow.formattedDate}
                </h4>
                <p className="text-[11px] text-stone-600">
                  {result.candidateMonthWindow.season}
                </p>
                <div className="text-[10px] text-emerald-700 font-semibold pt-1">
                  ✓ {isTamil ? `உத்தேச தேடல் சாளரம்: ~${result.errorMarginMonths} மாத இடைவெளிக்குள்` : `Heuristic Search Window: ~${result.errorMarginMonths} months span`}
                </div>
              </div>

              {/* Estimated Birth Time Window */}
              <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-2 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-800 uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-purple-700" />
                  {isTamil ? "துல்லிய பிறந்த நேர எல்லை" : "Narrowed Birth Time Range"}
                </div>
                <h4 className="text-xl font-serif font-bold text-purple-900">
                  {result.timeWindow.start} - {result.timeWindow.end}
                </h4>
                <p className="text-[11px] text-stone-600">
                  {isTamil ? `மிகவும் சாத்தியமான நேரம்: ${result.timeWindow.mostProbable}` : `Peak probability: ${result.timeWindow.mostProbable} (${result.timeWindow.span})`}
                </p>
              </div>

              {/* Probable Lagna / Ascendant */}
              <div className="p-5 rounded-2xl bg-sky-50/60 border border-sky-200 space-y-2 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-800 uppercase tracking-wider">
                  <Compass className="w-4 h-4 text-sky-700" />
                  {isTamil ? "கணிக்கப்பட்ட லக்னம்" : "Probable Lagna (Ascendant)"}
                </div>
                <h4 className="text-xl font-serif font-bold text-stone-900">
                  {result.probableLagna.sign}
                </h4>
                <p className="text-[11px] text-stone-600">
                  {result.probableLagna.reasoning}
                </p>
              </div>
            </div>

            {/* Cross-Verification Proofs Table */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-700" />
                  <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    {isTamil ? "நிகழ்வு தசா புக்தி சான்றுகள்" : "Dasha-Gochar Verification Proofs"}
                  </h4>
                </div>
                <span className="text-[11px] text-stone-500">
                  {isTamil ? `${result.answeredCount} நிகழ்வுகள் உறுதிப்படுத்தப்பட்டது` : `${result.answeredCount} Anchors Confirmed`}
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {result.verificationProofs.map((proof, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-amber-50/40 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-bold text-stone-900 block">{proof.milestone}</span>
                      <span className="text-[11px] text-stone-600">{proof.palmEvidence}</span>
                    </div>
                    <span className="text-indigo-800 font-medium text-[11px] bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 shrink-0">
                      {proof.dashaCorrelation}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar: Load Into Natal Chart Form */}
            <div className="pt-4 border-t border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-stone-600">
                {result.astronomicalNotes}
              </p>

              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-stone-800 text-xs font-semibold border border-amber-300 shadow-xs"
                >
                  {isTamil ? "மீண்டும் கணக்கிடு" : "Recalculate"}
                </button>
                <button
                  onClick={() => {
                    const lat = answers.latitude ?? result.latitude;
                    const lng = answers.longitude ?? result.longitude;
                    if (lat === null || lng === null || lat === undefined || lng === undefined) {
                      alert(isTamil ? "தயவுசெய்து உங்கள் பிறந்த இடத்தை தேர்ந்தெடுக்கவும்" : "Please select your birth location from the suggestions in Step 2.");
                      setCurrentStep(2);
                      return;
                    }
                    onApplyEstimatedChart({
                      birthDate: result.candidateMonthWindow.exactEstimatedDOB,
                      birthTime: result.timeWindow?.mostProbable ? result.timeWindow.mostProbable.replace(/\s*(AM|PM)/i, "") : "06:45",
                      name: isTamil ? "ஜாதகர்" : "Native",
                      birthPlace: answers.birthCity || result.birthPlace || "",
                      latitude: lat,
                      longitude: lng,
                      utcOffset: answers.utcOffset ?? result.utcOffset,
                      timezoneId: answers.timezoneId ?? result.timezoneId ?? null
                    });
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white font-bold text-xs shadow-md shadow-amber-500/20 hover:brightness-110 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isTamil ? "இந்த நேரத்தை கொண்டு ஜாதகம் கணக்கிடுக" : "Generate Natal Chart With This Time"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Camera Viewfinder Modal for Capturing Dominant / Non-Dominant Hands */}
      {activeCapturingSlot && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-2xl w-full p-6 rounded-3xl bg-[#FFFDF9] border border-amber-300 relative space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-600" />
                <h3 className="font-serif font-bold text-lg text-stone-900">
                  {isTamil 
                    ? `${activeCapturingSlot === "dominant" ? "செயல்படும் கை" : "செயல்படாத கை"} கேமரா ஸ்கேன்` 
                    : `Live Camera Scan: ${activeCapturingSlot === "dominant" ? "Dominant Hand" : "Non-Dominant Hand"}`}
                </h3>
              </div>

              <button
                onClick={stopCameraStream}
                className="p-2 rounded-full bg-amber-100 border border-amber-300 text-stone-700 hover:text-stone-900"
              >
                ✕
              </button>
            </div>

            {/* Error state if permission denied */}
            {cameraError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-300 text-xs text-red-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Video Preview with HUD Alignment */}
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] max-h-[380px] flex items-center justify-center border border-amber-400">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={`w-full h-full object-cover ${streamActive ? "block" : "hidden"}`}
              />

              {!streamActive && !cameraError && (
                <div className="text-center p-6 space-y-2">
                  <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                  <p className="text-xs text-stone-300">{isTamil ? "கேமரா இணைக்கப்படுகிறது..." : "Connecting camera..."}</p>
                </div>
              )}

              {/* Hand Silhouette Guide */}
              {streamActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <svg viewBox="0 0 300 360" className="w-3/4 h-3/4 opacity-40 stroke-amber-400 stroke-2 fill-none">
                    <path d="M 100,320 C 90,300 70,270 60,220 C 50,180 50,150 70,120 C 80,100 95,110 100,130 C 105,80 115,60 130,60 C 145,60 150,80 150,130 C 160,70 170,50 185,50 C 200,50 205,70 205,130 C 215,80 225,80 235,90 C 245,100 240,130 235,170 C 250,180 270,210 265,250 C 255,300 235,320 210,330 Z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Shutter Button */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={capturePhotoFromCamera}
                disabled={!streamActive}
                className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 p-1 shadow-xl shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
              >
                <div className="w-full h-full rounded-full border-2 border-stone-900 bg-white flex items-center justify-center">
                  <Camera className="w-7 h-7 text-amber-600" />
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
