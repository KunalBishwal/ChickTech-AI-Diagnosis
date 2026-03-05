"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import {
  Upload,
  CheckCircle,
  XCircle,
  Loader2,
  Camera,
  Sparkles,
  X,
  Play,
  Clock,
  AlertTriangle,
  Stethoscope,
  Bug,
} from "lucide-react";

type DiseaseType = "coccidiosis" | "external-lesion";
import { motion, AnimatePresence } from "framer-motion";
import ScrollReveal from "@/components/reactbits/scroll-reveal";
import ScrollFloat from "@/components/reactbits/scroll-float";
import LiquidEther from "@/components/reactbits/liquid-ether";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import RollingText from "@/components/ui/rolling-text";
import VoiceSymptomLogger from "@/components/VoiceSymptomLogger";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import TTSButton from "@/components/TTSButton";

import {
  VideoPlayer,
  VideoPlayerContent,
  VideoPlayerControlBar,
  VideoPlayerPlayButton,
  VideoPlayerTimeRange,
  VideoPlayerMuteButton,
} from "@/components/ui/skiper-ui/skiper67";

export default function DiagnosisSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const toolRef = useRef<HTMLDivElement>(null);
  const scanningRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<"healthy" | "sick" | "inconclusive" | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [animatedConfidence, setAnimatedConfidence] = useState(0);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [diseaseType, setDiseaseType] = useState<DiseaseType>("coccidiosis");
  const [diseaseName, setDiseaseName] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<string | null>(null);

  // --- Sarvam AI: Voice + Global Translation ---
  const { t, tBatch, lang, isTranslating } = useLanguage();

  // Pre-warm translation cache when a diagnosis result arrives
  useEffect(() => {
    if (lang === "en-IN" || !diseaseName) return;
    const texts = [diseaseName, ...(recommendation ? [recommendation] : [])];
    tBatch(texts);
  }, [lang, diseaseName, recommendation, tBatch]);

  // Voice symptom handler
  const handleVoiceTranscript = useCallback((transcript: string, pipeline: "coccidiosis" | "external-lesion" | null) => {
    if (pipeline) {
      setDiseaseType(pipeline);
    }
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (sectionRef.current && toolRef.current) {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
            toggleActions: "play none none reverse",
          },
        });

        tl.fromTo(
          ".diagnosis-title",
          { opacity: 0, y: 60 },
          { opacity: 1, y: 0, duration: 1.2, ease: "power3.out" }
        ).fromTo(
          toolRef.current,
          { opacity: 0, y: 100, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1.5,
            ease: "power3.out",
          },
          "-=0.8"
        );
      });

      return () => ctx.revert();
    }
  }, []);

  // Animate confidence percentage
  useEffect(() => {
    if (confidence !== null) {
      let start = 0;
      const end = Math.round(confidence * 100);
      const timer = setInterval(() => {
        start += 2;
        if (start >= end) {
          start = end;
          clearInterval(timer);
        }
        setAnimatedConfidence(Math.round(start));
      }, 20);
      return () => clearInterval(timer);
    }
  }, [confidence]);

  const handleProtectedAction = (callback: () => void) => {
    const user = auth.currentUser;
    if (!user) {
      toast.warning("Please log in to diagnose 🐔");
      router.push("/login");
      return;
    }
    callback();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setUploadedImage(base64);
        startScanning(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const startScanning = async (imageBase64: string) => {
    setIsScanning(true);
    setResult(null);
    setConfidence(null);
    setAnimatedConfidence(0);
    setDiseaseName(null);
    setRecommendation(null);

    //   try {
    //     const base64Data = imageBase64.split(",")[1];
    //       // const response = await fetch("http://127.0.0.1:8080/predict", {
    //     //   method: "POST",
    //     //   headers: { "Content-Type": "application/json" },
    //     //   body: JSON.stringify({ image: base64Data }),
    //     // });
    //     const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/predict`, {
    //       method: "POST",
    //       headers: { "Content-Type": "application/json" },
    //       body: JSON.stringify({ image: base64Data }),
    //     });

    //     const data = await response.json();

    //     setTimeout(() => {
    //       setIsScanning(false);
    //       if (data && data.class && data.class.toLowerCase().includes("healthy")) {
    //         setResult("healthy");
    //       } else {
    //         setResult("sick");
    //       }
    //       if (data.confidence) setConfidence(data.confidence);
    //     }, 4000);
    //   } catch (error) {
    //     console.error("Prediction failed:", error);
    //     setIsScanning(false);
    //     setResult("sick");
    //     toast.error("Could not connect to Flask backend ❌");
    //   }
    // };

    try {
      const base64Data = imageBase64.split(",")[1];

      // Route to correct endpoint based on disease type selection
      const endpoint = diseaseType === "coccidiosis"
        ? "/predict"
        : "/predict/external-lesion";

      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`;
      console.log("🌐 Sending prediction request to:", apiUrl);

      const response = await fetch(
        apiUrl,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64Data }),
        }
      );

      // 🔥 Important fix
      if (!response.ok) {
        const errText = await response.text();
        console.error("❌ Server error response:", response.status, errText);
        throw new Error(`Server responded with ${response.status}: ${errText}`);
      }

      const data = await response.json();
      console.log("🔍 Backend response received:", data);

      // Background save to Firestore (don't await so UI stays fast)
      const user = auth.currentUser;
      if (user && (data?.class || data?.disease)) {
        const payload = {
          user_id: user.uid,
          disease: data.disease || data.class,
          confidence: data.confidence ?? 0,
          disease_type: diseaseType,
          recommendation: data.recommendation || "",
          created_at: serverTimestamp(),
        };
        console.log("💾 Attempting to save to Firestore:", payload);

        addDoc(collection(db, "predictions"), payload)
          .then(() => {
            console.log("✅ Prediction saved to Firestore successfully!");
          })
          .catch((dbErr) => {
            console.error("❌ Firestore Save Error:", dbErr);
          });
      } else {
        console.log("⚠️ Skip Firestore save:", { hasUser: !!user, hasClass: !!data?.class });
      }

      // Show result after the minimum scanning delay
      setTimeout(() => {
        setIsScanning(false);

        const diseaseResult = (data?.disease || data?.class || "").toLowerCase();
        setDiseaseName(data?.disease || data?.class || "Unknown");
        setRecommendation(data?.recommendation || null);

        if (diseaseResult.includes("healthy")) {
          setResult("healthy");
        } else if (diseaseResult.includes("inconclusive")) {
          setResult("inconclusive");
        } else {
          setResult("sick");
        }

        if (data?.confidence) {
          setConfidence(data.confidence);
        }
      }, 3000); // Reduced to 3s for better feel

    } catch (error: any) {
      console.error("❌ Prediction failed:", error?.message || error);
      setIsScanning(false);

      toast.error(
        `Analysis failed: ${error?.message || "Please check your connection and try again."}`
      );
    }
  };

  const resetTool = () => {
    setUploadedImage(null);
    setResult(null);
    setConfidence(null);
    setIsScanning(false);
    setAnimatedConfidence(0);
  };

  // ---------------- Cursor-following Play icon ----------------
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cursorRef.current) return;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    gsap.to(cursorRef.current, {
      x: x - 20,
      y: y - 20,
      duration: 0.25,
      ease: "power2.out",
    });
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (cursorRef.current) {
      gsap.fromTo(
        cursorRef.current,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, ease: "power3.out" }
      );
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (cursorRef.current) {
      gsap.to(cursorRef.current, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        ease: "power2.inOut",
      });
    }
  };

  // ----------------------------------------------------------

  return (
    <section
      id="diagnosis"
      ref={sectionRef}
      className="py-32 relative overflow-hidden bg-linear-to-b from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900"
    >
      <LiquidEther
        colors={["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981"]}
        autoSpeed={0.4}
        autoIntensity={2}
      />

      <div className="container mx-auto px-6 relative z-10">

        {/* 🎬 Demo Video Section */}
        <ScrollReveal direction="up" distance={80} duration={1.1}>
          <div className="flex flex-col items-center mb-24 space-y-6">

            <h3 className="text-3xl md:text-4xl font-semibold text-gray-900 text-center">
              See ChickTech AI in Action
            </h3>

            <p className="text-gray-600 text-center max-w-2xl">
              Watch how our intelligent system analyzes chicken health — real demo below.
            </p>

            {/* 🪄 Interactive Video Preview */}
            <div
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={() => {
                if (!videoError) setIsVideoOpen(true);
              }}
              className="relative group cursor-pointer rounded-2xl overflow-hidden border border-white/40 shadow-2xl w-[260px] h-[150px] md:w-[320px] md:h-[180px] bg-gradient-to-br from-white/80 to-white/30 backdrop-blur-md hover:scale-[1.03] transition-transform duration-500"
            >

              {!videoError ? (
                <VideoPlayer style={{ width: "100%", height: "100%" }}>
                  <VideoPlayerContent
                    src="/demo.mp4"
                    autoPlay
                    muted
                    loop
                    slot="media"
                    className="w-full h-full object-cover"
                    onError={() => setVideoError(true)}
                  />
                </VideoPlayer>
              ) : (
                <div className="relative w-full h-full">
                  <img
                    src="/cock-farm-village-chicken.jpg"
                    alt="Demo fallback"
                    className="w-full h-full object-cover"
                  />

                  {/* Hover Overlay Button */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(
                          "https://drive.google.com/file/d/1IKE59orfBnIVvB3lBTzLOPDp5w_xczP-/view?usp=sharing",
                          "_blank"
                        );
                      }}
                      className="bg-white text-black font-semibold px-4 py-2 shadow-lg hover:scale-105 transition"
                    >
                      🔗 Link to Demo Video
                    </Button>
                  </div>
                </div>
              )}

              {/* Floating Play Cursor */}
              {!videoError && (
                <div
                  ref={cursorRef}
                  className="absolute top-0 left-0 pointer-events-none opacity-0"
                >
                  <div className="flex items-center space-x-2 bg-white/80 text-gray-900 px-3 py-1 rounded-full shadow-md backdrop-blur-sm text-sm font-medium">
                    <Play className="w-4 h-4" />
                    <span>Play</span>
                  </div>
                </div>
              )}

            </div>
          </div>
        </ScrollReveal>

        {/* Fullscreen Video Modal */}
        <AnimatePresence>
          {isVideoOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 120, damping: 15 }}
                className="relative w-[90%] max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl"
              >
                <VideoPlayer style={{ width: "100%", height: "100%" }}>
                  <VideoPlayerContent
                    src="/demo.mp4"
                    autoPlay
                    slot="media"
                    className="w-full object-cover"
                  />
                  <VideoPlayerControlBar
                    className="absolute bottom-0 left-0 w-full flex items-center justify-center px-4 py-2
             bg-linear-to-t from-black/60 via-black/20 to-transparent
             backdrop-blur-sm text-white z-20"
                  >
                    <VideoPlayerPlayButton className="h-5 bg-transparent text-white" />
                    <VideoPlayerTimeRange className="mx-3 flex-1 bg-white/20 rounded-full overflow-hidden" />
                    <VideoPlayerMuteButton className="h-5 w-5 bg-transparent text-white" />
                  </VideoPlayerControlBar>

                  <VideoPlayerTimeRange className="bg-transparent" />
                  <VideoPlayerMuteButton className="size-4 bg-transparent" />

                </VideoPlayer>

                <button
                  onClick={() => setIsVideoOpen(false)}
                  className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---- Title Section ---- */}
        <ScrollReveal direction="up" distance={100} duration={1.2}>
          <div className="text-center mb-20 diagnosis-title">
            <div className="w-20 h-20 bg-linear-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <Camera className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900 dark:text-white">
              {t("Experience the")}{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600">
                {t("Magic")}
              </span>
            </h2>

            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-4xl mx-auto">
              {t("Upload a photo of your chicken and let our AI reveal its health status.")}
            </p>
          </div>
        </ScrollReveal>

        {/* ---- Diagnosis Tool ---- */}
        <ScrollFloat speed={0.1}>
          <div ref={toolRef} className="max-w-3xl mx-auto opacity-0">
            <div className="p-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-white/50 dark:border-gray-700/50 shadow-2xl rounded-3xl">
              {!uploadedImage ? (
                <ScrollReveal direction="up" delay={0.3}>
                  <div className="text-center">
                    {/* Disease Type Selector */}
                    <div className="mb-8">
                      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                        {t("Select Detection Type")}
                      </p>
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => setDiseaseType("coccidiosis")}
                          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 border-2 ${diseaseType === "coccidiosis"
                            ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent shadow-lg scale-105"
                            : "bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:scale-102"
                            }`}
                        >
                          <Bug className="w-4 h-4" />
                          {t("Coccidiosis")}
                        </button>
                        <button
                          onClick={() => setDiseaseType("external-lesion")}
                          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 border-2 ${diseaseType === "external-lesion"
                            ? "bg-gradient-to-r from-orange-500 to-red-500 text-white border-transparent shadow-lg scale-105"
                            : "bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500 hover:scale-102"
                            }`}
                        >
                          <Stethoscope className="w-4 h-4" />
                          {t("Bumblefoot & Fowlpox")}
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        {diseaseType === "coccidiosis"
                          ? t("Detects coccidiosis from fecal samples")
                          : t("Detects Fowlpox & Bumblefoot from skin/foot images")}
                      </p>
                    </div>

                    <div className="border-3 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-16 mb-8 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all duration-300 group">
                      <div className="w-24 h-24 bg-linear-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Upload className="w-12 h-12 text-blue-600" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                        {t("Upload Your Chicken Photo")}
                      </h3>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button
                          size="lg"
                          onClick={() =>
                            handleProtectedAction(() =>
                              fileInputRef.current?.click()
                            )
                          }
                          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 text-lg shadow-xl hover:scale-105"
                        >
                          <Sparkles className="w-5 h-5 mr-2" />
                          {t("Select Image")}
                        </Button>

                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => handleProtectedAction(() => router.push("/history"))}
                          className="px-8 py-4 text-lg border-2 hover:text-purple-500 hover:bg-purple-50 hover:scale-105 transition-all duration-300"
                        >
                          <Clock className="w-5 h-5 mr-2 text-purple-500" />
                          {t("View History")}
                        </Button>
                      </div>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                      {t("Supports JPG, PNG, and WebP formats • Max 10MB")}
                    </p>

                    {/* Voice Symptom Logger */}
                    <div className="pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                        {t("Or describe symptoms by voice")}
                      </p>
                      <VoiceSymptomLogger
                        onTranscriptReady={handleVoiceTranscript}
                      />
                    </div>
                  </div>
                </ScrollReveal>
              ) : (
                <div className="space-y-8 text-center">
                  <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                    <img
                      src={uploadedImage}
                      alt="Uploaded chicken"
                      className="w-full h-80 object-cover"
                    />
                    {isScanning && (
                      <div
                        ref={scanningRef}
                        className="absolute inset-0 bg-linear-to-b from-blue-500/20 to-purple-500/20 backdrop-blur-[1px]"
                      >
                        <div className="scan-line absolute inset-x-0 h-1 bg-linear-to-r from-transparent via-blue-400 to-transparent shadow-lg"></div>
                      </div>
                    )}
                  </div>

                  {isScanning ? (
                    <div className="text-center py-12">
                      <div className="inline-block mb-6 relative">
                        <div className="w-20 h-20 bg-linear-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-2xl">
                          <Loader2 className="w-10 h-10 text-white animate-spin" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold mb-4 text-gray-900">
                        {t("AI Analysis in Progress")}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-lg">
                        {t("Analyzing your image using deep learning...")}
                      </p>
                    </div>
                  ) : (
                    result && (
                      <div ref={resultRef} className="text-center py-8 fade-in">
                        {/* Language selector is now in the Navigation bar — no per-component selector */}

                        {result === "healthy" ? (
                          <>
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <div className="flex items-center justify-center gap-3 mb-1">
                              <h3 className="text-3xl font-bold text-green-600">
                                {t(diseaseName || "Healthy")} 🐔
                              </h3>
                              <TTSButton text={t(diseaseName || "Healthy")} compact={false} />
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 mt-3 text-lg">
                              {t("Great job! Your flock seems perfectly fine.")}
                            </p>
                            {recommendation && (
                              <p className="text-gray-500 dark:text-gray-400 mt-3 text-sm max-w-lg mx-auto italic">
                                💡 {t(recommendation)}
                              </p>
                            )}
                          </>
                        ) : result === "inconclusive" ? (
                          <>
                            <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                            <h3 className="text-3xl font-bold text-amber-600">
                              {t("Inconclusive Result")} ⚠️
                            </h3>
                            <p className="text-gray-700 dark:text-gray-300 mt-3 text-lg max-w-xl mx-auto">
                              {t("The AI confidence is too low to make a reliable diagnosis.")}
                            </p>
                            {recommendation && (
                              <p className="text-amber-600 dark:text-amber-400 mt-3 text-sm max-w-lg mx-auto font-medium">
                                📸 {recommendation}
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                            <div className="flex items-center justify-center gap-3 mb-1">
                              <h3 className="text-3xl font-bold text-red-600">
                                {t(diseaseName || "Disease")} {t("Detected")}
                              </h3>
                              <TTSButton text={t(diseaseName || "Disease")} compact={false} />
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 mt-3 text-lg max-w-xl mx-auto">
                              {t("Our AI has detected signs of")} {t(diseaseName?.toLowerCase() || "disease")} {t("in this image.")}
                            </p>
                            {recommendation && (
                              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl max-w-lg mx-auto">
                                <p className="text-red-700 dark:text-red-300 text-sm text-left">
                                  🩺 <span className="font-semibold">{t("Recommendation:")}</span>{" "}
                                  {t(recommendation)}
                                </p>
                              </div>
                            )}
                            <div className="mt-6">
                              <Button
                                size="lg"
                                className="bg-linear-to-r from-red-500 to-orange-500 text-white font-semibold shadow-lg hover:scale-105 transition-all duration-300 px-6 py-3"
                                onClick={() => {
                                  const cureSection =
                                    document.getElementById("cure-section");
                                  if (cureSection) {
                                    cureSection.scrollIntoView({
                                      behavior: "smooth",
                                    });
                                    cureSection.classList.add(
                                      "ring-4",
                                      "ring-orange-300/50"
                                    );
                                    setTimeout(
                                      () =>
                                        cureSection.classList.remove(
                                          "ring-4",
                                          "ring-orange-300/50"
                                        ),
                                      1500
                                    );
                                  }
                                }}
                              >
                                🩺 {t("View Cure & Next Steps")}
                              </Button>
                            </div>
                          </>
                        )}

                        {confidence !== null && (
                          <div className="mt-6 max-w-md mx-auto">
                            <p className="text-gray-700 dark:text-gray-300 mb-2 font-medium">
                              {t("Confidence:")} {animatedConfidence.toFixed(2)}%
                            </p>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                              <div
                                className={`h-3 rounded-full transition-all duration-700 ease-out ${result === "healthy"
                                  ? "bg-linear-to-r from-green-400 to-emerald-500"
                                  : "bg-linear-to-r from-red-400 to-orange-500"
                                  }`}
                                style={{ width: `${animatedConfidence}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  )}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                    <Button
                      variant="outline"
                      onClick={resetTool}
                      size="lg"
                      className="px-8 py-4 text-lg border-2 hover:text-blue-500 hover:bg-gray-100 hover:scale-105 transition-all duration-300"
                    >
                      {t("Analyze Another Image")}
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => handleProtectedAction(() => router.push("/history"))}
                      className="px-8 py-4 text-lg border-2 hover:text-purple-500 hover:bg-purple-50 hover:scale-105 transition-all duration-300"
                    >
                      <Clock className="w-5 h-5 mr-2 text-purple-500" />
                      {t("View Full History")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollFloat>
      </div>
    </section>
  );
}
