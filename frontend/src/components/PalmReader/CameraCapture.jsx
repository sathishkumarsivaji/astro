import React, { useState, useRef, useEffect } from "react";
import { Camera, RefreshCw, Eye, Sparkles, CheckCircle2, Sliders, AlertTriangle, Upload, X } from "lucide-react";
import { analyzePalmTelemetry, analyzePalmImage, MAJOR_LINES, PALM_MOUNTS } from "../../services/palmistryEngine";
import { TRANSLATIONS } from "../../services/localization";

export default function CameraCapture({ onScanComplete, lang = "en" }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isTamil = lang === "ta";

  const [streamActive, setStreamActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [handSide, setHandSide] = useState("right");
  const [cameraError, setCameraError] = useState("");
  const [insufficientEvidence, setInsufficientEvidence] = useState(null);
  const [userCorrections, setUserCorrections] = useState({});
  const [visionTelemetry, setVisionTelemetry] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [activeLineTab, setActiveLineTab] = useState("heart");
  const [showConsentModal, setShowConsentModal] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const requestCameraAccess = () => {
    setShowConsentModal(true);
  };

  const handleConfirmStartCamera = () => {
    setShowConsentModal(false);
    startCamera();
  };

  const startCamera = async () => {
    setCameraError("");
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(isTamil ? "இந்த உலாவியில் கேமரா வசதி ஆதரிக்கப்படவில்லை." : "Camera API is not supported on this browser.");
      }

      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
      } catch (envErr) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
      }

      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        setStreamActive(true);
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.log("Video auto-play handling:", playErr);
        }
      }
    } catch (err) {
      console.error("Camera access error:", err);
      let errMsg = isTamil ? "கேமராவை துவங்க முடியவில்லை." : "Camera could not be started.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errMsg = isTamil ? "கேமரா அனுமதி மறுக்கப்பட்டுள்ளது. அமைப்புகளில் அனுமதிக்கவும் அல்லது புகைப்படத்தை பதிவேற்றவும்." : "Camera permission denied. Please allow access or upload photo.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errMsg = isTamil ? "கேமரா சாதனம் கண்டறியப்படவில்லை. புகைப்படத்தை பதிவேற்றலாம்." : "No camera detected. You can upload photo.";
      }
      setCameraError(errMsg);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setStreamActive(false);
    }
  };

  const [opticalTelemetry, setOpticalTelemetry] = useState(null);

  const analyzeCanvasVision = (canvas) => {
    try {
      const vision = analyzePalmImage(canvas, handSide, userCorrections);
      if (vision.status === "INSUFFICIENT_VISUAL_EVIDENCE") {
        setInsufficientEvidence(vision);
        setVisionTelemetry(null);
        setOpticalTelemetry(null);
        return null;
      }
      setInsufficientEvidence(null);
      setVisionTelemetry(vision);
      const tele = {
        luminance: vision.qualityMetrics?.meanLuminance || 128,
        contrast: vision.qualityMetrics?.contrast || 40,
        edgeDensity: vision.candidateCreasesCount || 0,
        lineConfidence: vision.lineDetectionConfidence || {},
        imageQualityScore: vision.imageQualityScore,
        landmarkDetectionConfidence: vision.landmarkDetectionConfidence
      };
      setOpticalTelemetry(tele);
      return { vision, tele };
    } catch (e) {
      console.warn("Vision canvas analysis error:", e);
      return null;
    }
  };

  const loadSamplePalmImage = () => {
    setCapturedImage("sample");
    setInsufficientEvidence(null);
    const baselineTelemetry = {
      luminance: 128,
      contrast: 42,
      edgeDensity: 18,
      lineConfidence: { heart: 80, head: 82, life: 85, fate: null },
      imageQualityScore: 82,
      landmarkDetectionConfidence: 86
    };
    setOpticalTelemetry(baselineTelemetry);
    simulateScanning(baselineTelemetry, null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setCapturedImage(dataUrl);
      stopCamera();

      // Analyze vision properties from uploaded image using offscreen canvas
      const img = new Image();
      img.onload = () => {
        const offCanvas = document.createElement("canvas");
        offCanvas.width = img.width || 640;
        offCanvas.height = img.height || 480;
        const ctx = offCanvas.getContext("2d");
        ctx.drawImage(img, 0, 0, offCanvas.width, offCanvas.height);
        const data = analyzeCanvasVision(offCanvas);
        if (data) {
          simulateScanning(data.tele, data.vision);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg");
    setCapturedImage(dataUrl);
    stopCamera();

    const data = analyzeCanvasVision(canvas);
    if (data) {
      simulateScanning(data.tele, data.vision);
    }
  };

  const simulateScanning = (teleData = null, visionData = null) => {
    setScanning(true);
    setScanProgress(10);
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanning(false);
          const results = analyzePalmTelemetry(handSide, teleData?.lineConfidence || {}, {
            imageQualityScore: teleData?.imageQualityScore,
            landmarkDetectionConfidence: teleData?.landmarkDetectionConfidence
          });
          if (teleData) {
            results.opticalMeasurements = teleData;
          }
          if (visionData) {
            results.visionPipeline = visionData;
          } else {
            results.isDemoData = true;
            results.status = "DEMO_DATA_NOT_A_REAL_PALM_ANALYSIS";
            results.scientificDisclosure = "DEMO_DATA_NOT_A_REAL_PALM_ANALYSIS";
          }
          onScanComplete(results);
          return 100;
        }
        return prev + 15;
      });
    }, 250);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const LINE_NAMES_TAMIL = {
    heart: "இருதய ரேகை (Heart)",
    head: "புத்தி ரேகை (Head)",
    life: "ஆயுள் ரேகை (Life)",
    fate: "விதி / தொழில் ரேகை (Fate)"
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Archetypal Cultural Reference Disclosure */}
      <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300 text-xs text-stone-700 flex items-start gap-2.5 shadow-2xs">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-amber-950 block">
            {isTamil ? "சாமுத்ரிகா லட்சண மாதிரிக் குறிப்பு (Cultural Reference)" : "Samudrika Shastra Illustrative Framework"}
          </span>
          <p className="text-[11px] text-stone-600 leading-relaxed">
            {isTamil
              ? "கைரேகை பகுப்பாய்வு பாரம்பரிய சாமுத்ரிகா லட்சண சூத்திரங்கள் மற்றும் பட ஒளி அடர்த்தி (optical luminance / edge density) அடிப்படையில் அமைந்த மாதிரி விளக்கமாகும். இது மருத்துவ அல்லது பயோமெட்ரிக் கருவி அல்ல."
              : "Palmistry analysis is an educational/illustrative cultural model synthesizing classical Samudrika Shastra archetypes with real canvas optical luminance and crease edge density. It is not an automated medical diagnostic tool or clinical biometric sensor."}
          </p>
        </div>
      </div>

      {/* Optical Diagnostics Bar */}
      {opticalTelemetry && (
        <div className="px-4 py-2 rounded-xl bg-white border border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <span className="text-stone-500 font-sans font-semibold">Optical Diagnostics:</span>
          <span>Luminance: <strong>{opticalTelemetry.luminance}</strong></span>
          <span>Contrast: <strong>{opticalTelemetry.contrast}</strong></span>
          <span>Crease Edge Density: <strong>{opticalTelemetry.edgeDensity}</strong></span>
          <span className="text-emerald-700 font-bold">Telemetry: Active</span>
        </div>
      )}

      {/* Insufficient Evidence Warning Banner */}
      {insufficientEvidence && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-stone-800 text-xs space-y-2 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {isTamil
                ? "போதுமான காட்சி ஆதாரம் கிடைக்கவில்லை (INSUFFICIENT_VISUAL_EVIDENCE)"
                : "Insufficient Visual Evidence (INSUFFICIENT_VISUAL_EVIDENCE)"}
            </span>
          </div>
          <p className="text-stone-700 leading-relaxed">{insufficientEvidence.message}</p>
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-stone-600 bg-amber-100/60 px-3 py-1.5 rounded-lg border border-amber-200">
            <span>Status: <strong>{insufficientEvidence.failureReason}</strong></span>
            {insufficientEvidence.qualityMetrics && (
              <span>Quality Score: <strong>{insufficientEvidence.imageQualityScore}/100</strong></span>
            )}
          </div>
        </div>
      )}

      {/* Hand Duality Selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#FFFDF9] border border-amber-300 shadow-sm">
        <div>
          <h2 className="text-xl font-bold font-serif text-stone-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            {t.palmTitle}
          </h2>
          <p className="text-xs text-stone-600 mt-1">
            {t.palmDesc}
          </p>
        </div>

        <div className="flex items-center bg-amber-100/70 p-1.5 rounded-xl border border-amber-300">
          <button
            onClick={() => setHandSide("left")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              handSide === "left"
                ? "bg-purple-700 text-white shadow-md shadow-purple-600/30"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            {t.leftHand}
          </button>
          <button
            onClick={() => setHandSide("right")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              handSide === "right"
                ? "bg-amber-600 text-white shadow-md shadow-amber-500/30"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            {t.rightHand}
          </button>
        </div>
      </div>

      {/* Main Viewfinder */}
      <div className="relative rounded-3xl overflow-hidden bg-[#FFFDF9] border border-amber-300 shadow-md aspect-[4/3] max-h-[520px] flex items-center justify-center">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover ${streamActive ? "block" : "hidden"}`}
        />

        {capturedImage && !streamActive && (
          <div className="relative w-full h-full flex items-center justify-center bg-stone-900">
            {capturedImage !== "sample" && (
              <img
                src={capturedImage}
                alt="Captured Palm"
                className="w-full h-full object-contain opacity-70"
              />
            )}

            <svg
              viewBox="0 0 400 480"
              className="absolute inset-0 w-full h-full max-h-[440px] m-auto drop-shadow-2xl opacity-90 transition-all pointer-events-none"
            >
              {capturedImage === "sample" && (
                <path
                  d="M 140,430 C 130,410 110,380 90,320 C 70,260 70,210 90,170 C 100,150 115,160 125,190 C 130,130 145,100 160,100 C 175,100 185,130 185,185 C 195,110 210,80 225,80 C 240,80 250,110 250,185 C 260,120 275,115 285,125 C 295,135 295,170 290,220 C 310,230 335,270 330,320 C 320,380 300,415 270,430 Z"
                  fill="#1c1917"
                  stroke="#E2B755"
                  strokeWidth="2.5"
                  strokeDasharray={scanning ? "6,6" : "none"}
                  className={scanning ? "animate-pulse" : ""}
                />
              )}

              <path d="M 130,230 Q 180,210 280,240" fill="none" stroke="#F43F5E" strokeWidth={activeLineTab === "heart" ? "5" : "3"} strokeLinecap="round" />
              <path d="M 130,260 Q 200,270 270,300" fill="none" stroke="#38BDF8" strokeWidth={activeLineTab === "head" ? "5" : "3"} strokeLinecap="round" />
              <path d="M 135,255 C 160,280 180,340 160,400" fill="none" stroke="#10B981" strokeWidth={activeLineTab === "life" ? "5" : "3"} strokeLinecap="round" />
              <path d="M 210,410 L 210,230" fill="none" stroke="#F59E0B" strokeWidth={activeLineTab === "fate" ? "5" : "3"} strokeLinecap="round" />

              <circle cx="160" cy="180" r="10" fill="#E2B755" fillOpacity="0.25" stroke="#E2B755" />
              <text x="160" y="175" textAnchor="middle" fill="#FDE68A" fontSize="9" fontWeight="bold">{isTamil ? "குரு" : "Jupiter"}</text>

              <circle cx="210" cy="170" r="10" fill="#7A5AF8" fillOpacity="0.25" stroke="#7A5AF8" />
              <text x="210" y="165" textAnchor="middle" fill="#DDD6FE" fontSize="9" fontWeight="bold">{isTamil ? "சனி" : "Saturn"}</text>

              <circle cx="255" cy="180" r="10" fill="#E2B755" fillOpacity="0.25" stroke="#E2B755" />
              <text x="255" y="175" textAnchor="middle" fill="#FDE68A" fontSize="9" fontWeight="bold">{isTamil ? "சூரியன்" : "Apollo"}</text>

              <circle cx="140" cy="330" r="14" fill="#EE46BC" fillOpacity="0.2" stroke="#EE46BC" />
              <text x="140" y="333" textAnchor="middle" fill="#FBCFE8" fontSize="9" fontWeight="bold">{isTamil ? "சுக்கிரன்" : "Venus"}</text>
            </svg>
          </div>
        )}

        {!streamActive && !capturedImage && (
          <div className="text-center p-6 space-y-4 max-w-sm">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center">
              <Camera className="w-8 h-8 text-amber-700" />
            </div>

            <div>
              <h3 className="text-base font-serif font-bold text-stone-900">{t.readyToScan}</h3>
              <p className="text-xs text-stone-600 mt-1">{t.scanInstruction}</p>
            </div>

            {cameraError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-300 text-left text-xs text-red-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <span>{cameraError}</span>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={requestCameraAccess}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white font-bold text-xs shadow-md shadow-amber-500/25 hover:brightness-110 flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                {t.launchCamera}
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-stone-800 font-semibold text-xs border border-amber-300 flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <Upload className="w-3.5 h-3.5 text-amber-700" />
                {t.uploadPalm}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                onClick={loadSamplePalmImage}
                className="w-full py-2 px-4 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 font-semibold text-xs border border-purple-200 flex items-center justify-center gap-2 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                {t.demoScan}
              </button>
            </div>
          </div>
        )}

        {streamActive && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-6">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 bg-stone-900/80 px-3 py-1.5 rounded-full border border-amber-400 backdrop-blur-md">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[11px] font-semibold text-white">
                  {isTamil ? "கேமரா நேரலை இயங்குகிறது" : "Camera Feed Active"}
                </span>
              </div>

              <button
                onClick={stopCamera}
                className="pointer-events-auto p-2 rounded-full bg-stone-900/90 border border-stone-700 text-stone-200 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {scanning && <div className="scanner-laser" />}

            <div className="pointer-events-auto flex items-center gap-4">
              <button
                onClick={capturePhoto}
                disabled={scanning}
                className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 p-1 shadow-xl shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
              >
                <div className="w-full h-full rounded-full border-2 border-stone-900 bg-white flex items-center justify-center">
                  <Camera className="w-7 h-7 text-amber-600" />
                </div>
              </button>
            </div>
          </div>
        )}

        {scanning && (
          <div className="absolute inset-0 bg-stone-900/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 space-y-4">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="#44403c" strokeWidth="6" fill="transparent" />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#E2B755"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * scanProgress) / 100}
                  className="transition-all duration-300"
                />
              </svg>
              <span className="absolute text-sm font-bold text-amber-300">{scanProgress}%</span>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-stone-100">{isTamil ? "சாமுத்ரிக லட்சணம் பகுப்பாய்வு..." : "Classical Samudrika Pattern Analysis..."}</p>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {capturedImage && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider text-stone-800 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-600" />
              {t.detectedLineVectors}
            </h4>
            <span className="text-xs text-amber-700 flex items-center gap-1 font-semibold">
              {isTamil ? "மாதிரி முன்வடிவம்" : "Illustrative Prototype"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {MAJOR_LINES.map(line => {
              const isSelected = activeLineTab === line.id;
              return (
                <button
                  key={line.id}
                  onClick={() => setActiveLineTab(line.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "bg-amber-100/70 border-amber-400 shadow-sm"
                      : "bg-[#FFFDF9] border-amber-200 hover:border-amber-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-stone-900">
                      {isTamil ? (LINE_NAMES_TAMIL[line.id] || line.name) : `${line.name.split(" ")[0]} Line`}
                    </span>
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: line.color }}
                    />
                  </div>
                  <p className="text-[11px] text-stone-600 truncate">{line.description}</p>
                  <div className="mt-2 pt-2 border-t border-amber-200 flex items-center justify-between">
                    <span className="text-[10px] text-stone-500 font-mono">
                      {userCorrections[line.id]
                        ? "User Corrected"
                        : (visionTelemetry?.lines?.[line.id]?.detected ? "Detected" : "Unresolved")}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const isCurrent = userCorrections[line.id]?.detected ?? visionTelemetry?.lines?.[line.id]?.detected ?? true;
                        setUserCorrections(prev => ({
                          ...prev,
                          [line.id]: { detected: !isCurrent, confidence: !isCurrent ? 90 : null }
                        }));
                      }}
                      className="text-[10px] px-2 py-0.5 rounded bg-amber-200 hover:bg-amber-300 font-semibold text-amber-900 cursor-pointer"
                    >
                      {(userCorrections[line.id]?.detected ?? visionTelemetry?.lines?.[line.id]?.detected ?? true)
                        ? (isTamil ? "ரேகை இல்லை" : "Mark Absent")
                        : (isTamil ? "ரேகை உள்ளது" : "Mark Present")}
                    </button>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showConsentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-amber-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center">
              <Camera className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-stone-900">
                {isTamil ? "கேமரா அணுகல் & தனியுரிமை விளக்கம்" : "Camera Access & Privacy Notice"}
              </h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                {isTamil
                  ? "உங்கள் கைரேகைகளை திரையில் மேலடுக்கி சாமுத்ரிக லட்சணக் குறிப்புகளைக் காண கேமரா அணுகல் கோரப்படுகிறது. புகைப்படங்கள் உங்கள் சாதனத்தில் உள்ளூரிலேயே கையாளப்படும்; எந்தவொரு வெளிப்புற சேவையகத்திலும் பதிவேற்றப்படாது."
                  : "Camera access is requested to overlay palm contours and provide interactive Samudrika reference markers. Video stream is processed strictly locally inside your browser; no images are stored or uploaded."}
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowConsentModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold"
              >
                {isTamil ? "ரத்து செய்" : "Cancel"}
              </button>
              <button
                onClick={handleConfirmStartCamera}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-white text-xs font-bold shadow-md shadow-amber-500/25"
              >
                {isTamil ? "தொடரவும் & துவக்குக" : "Allow & Launch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
