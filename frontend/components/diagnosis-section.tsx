"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
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
} from "lucide-react";
import ScrollReveal from "@/components/reactbits/scroll-reveal";
import ScrollFloat from "@/components/reactbits/scroll-float";
import LiquidEther from "@/components/reactbits/liquid-ether";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function DiagnosisSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const toolRef = useRef<HTMLDivElement>(null);
  const scanningRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<"healthy" | "sick" | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [animatedConfidence, setAnimatedConfidence] = useState(0);

  // 🎞 Scroll-triggered cinematic reveal
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (sectionRef.current && toolRef.current) {
      const ctx = gsap.context(() => {
        // Timeline for entering viewport (fade + lift)
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",  // triggers earlier
            toggleActions: "play none none reverse", // fades in, reverses cleanly on scroll up
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

        // Light parallax movement (no fading)
        gsap.to(toolRef.current, {
          y: -20,
          ease: "none",
          scrollTrigger: {
            trigger: toolRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.8, // subtle parallax, no opacity change
          },
        });
      });

      return () => ctx.revert();
    }
  }, []);

  // 🧠 Scanning animation + progress
  useEffect(() => {
    if (isScanning && scanningRef.current) {
      const tl = gsap.timeline({ repeat: -1 });
      tl.fromTo(
        scanningRef.current.querySelector(".scan-line"),
        { y: "-100%", opacity: 0 },
        { y: "100%", opacity: 1, duration: 2, ease: "power2.inOut" }
      ).to(scanningRef.current.querySelector(".scan-line"), {
        opacity: 0,
        duration: 0.5,
      });

      const progressInterval = setInterval(() => {
        setScanProgress((prev) => (prev >= 100 ? 100 : prev + Math.random() * 15));
      }, 200);

      return () => {
        tl.kill();
        clearInterval(progressInterval);
      };
    }
  }, [isScanning]);

  // 💡 Fade in result
  useEffect(() => {
    if (result && resultRef.current) {
      gsap.fromTo(
        resultRef.current,
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.8, ease: "power2.out" }
      );
    }
  }, [result]);

  // 📈 Animate confidence percentage
  useEffect(() => {
    if (confidence !== null) {
      let start = 0;
      const end = Math.round(confidence * 100);
      const duration = 1000;
      const increment = end / (duration / 20);
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          start = end;
          clearInterval(timer);
        }
        setAnimatedConfidence(Math.round(start));
      }, 20);
      return () => clearInterval(timer);
    }
  }, [confidence]);

  // 🔒 Protected Action
  const handleProtectedAction = (callback: () => void) => {
    const user = auth.currentUser;
    if (!user) {
      toast.warning("Please log in to diagnose 🐔");
      router.push("/login");
      return;
    }
    callback();
  };

  // 📤 File Upload
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

  // 🔮 Flask Prediction
  const startScanning = async (imageBase64: string) => {
    setIsScanning(true);
    setResult(null);
    setConfidence(null);
    setScanProgress(0);
    setAnimatedConfidence(0);

    try {
      const base64Data = imageBase64.split(",")[1];
      const response = await fetch("http://127.0.0.1:8080/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Data }),
      });

      const data = await response.json();

      setTimeout(() => {
        setIsScanning(false);
        if (data && data.class && data.class.toLowerCase().includes("healthy")) {
          setResult("healthy");
        } else {
          setResult("sick");
        }
        if (data.confidence) setConfidence(data.confidence);
      }, 4000);
    } catch (error) {
      console.error("Prediction failed:", error);
      setIsScanning(false);
      setResult("sick");
      toast.error("Could not connect to Flask backend ❌");
    }
  };

  const resetTool = () => {
    setUploadedImage(null);
    setResult(null);
    setConfidence(null);
    setIsScanning(false);
    setScanProgress(0);
    setAnimatedConfidence(0);
  };

  return (
    <section
      id="diagnosis"
      ref={sectionRef}
      className="py-32 relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-purple-50"
    >
      {/* 💧 Liquid Ether Background */}
      <LiquidEther
        colors={["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981"]}
        autoSpeed={0.4}
        autoIntensity={2}
      />

      <div className="container mx-auto px-6 relative z-10">
        {/* Title Section */}
        <ScrollReveal direction="up" distance={100} duration={1.2}>
          <div className="text-center mb-20 diagnosis-title">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <Camera className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">
              Experience the{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Magic
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              Upload a photo of your chicken and let our AI reveal its health
              status.
            </p>
          </div>
        </ScrollReveal>

        {/* Tool Section */}
        <ScrollFloat speed={0.1}>
          <div ref={toolRef} className="max-w-3xl mx-auto opacity-0">
            <div className="p-12 bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-2xl rounded-3xl">
              {!uploadedImage ? (
                <ScrollReveal direction="up" delay={0.3}>
                  <div className="text-center">
                    <div className="border-3 border-dashed border-gray-300 rounded-2xl p-16 mb-8 hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300 group">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Upload className="w-12 h-12 text-blue-600" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4 text-gray-900">
                        Upload Your Chicken Photo
                      </h3>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
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
                        Select Image
                      </Button>
                    </div>
                    <p className="text-gray-500 text-sm">
                      Supports JPG, PNG, and WebP formats • Max 10MB
                    </p>
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
                        className="absolute inset-0 bg-gradient-to-b from-blue-500/20 to-purple-500/20 backdrop-blur-[1px]"
                      >
                        <div className="scan-line absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-lg"></div>
                      </div>
                    )}
                  </div>

                  {/* Scanning or Result */}
                  {isScanning ? (
                    <div className="text-center py-12">
                      <div className="inline-block mb-6 relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-2xl">
                          <Loader2 className="w-10 h-10 text-white animate-spin" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold mb-4 text-gray-900">
                        AI Analysis in Progress
                      </h3>
                      <p className="text-gray-600 text-lg">
                        Analyzing your image using deep learning...
                      </p>
                    </div>
                  ) : (
                    result && (
                      <div ref={resultRef} className="text-center py-8 fade-in">
                        {result === "healthy" ? (
                          <>
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h3 className="text-3xl font-bold text-green-600">
                              Healthy Chicken 🐔
                            </h3>
                            <p className="text-gray-700 mt-3 text-lg">
                              Great job! Your flock seems perfectly fine.
                            </p>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                            <h3 className="text-3xl font-bold text-red-600">
                              Coccidiosis Detected
                            </h3>
                            <p className="text-gray-700 mt-3 text-lg max-w-xl mx-auto">
                              Our AI suspects possible infection symptoms in this chicken image.
                            </p>

                            {/* Cure & Next Step CTA */}
                            <div className="mt-6">
                              <Button
                                size="lg"
                                className="bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold shadow-lg hover:scale-105 transition-all duration-300 px-6 py-3"
                                onClick={() => {
                                  const cureSection = document.getElementById("cure-section");
                                  if (cureSection) {
                                    cureSection.scrollIntoView({
                                      behavior: "smooth",
                                      block: "start",
                                    });

                                    // Optional: add a glow pulse for visual continuity
                                    cureSection.classList.add("ring-4", "ring-orange-300/50");
                                    setTimeout(
                                      () => cureSection.classList.remove("ring-4", "ring-orange-300/50"),
                                      1500
                                    );
                                  }
                                }}
                              >
                                🩺 View Cure & Next Steps
                              </Button>
                            </div>
                          </>
                        )}

                        {confidence !== null && (
                          <div className="mt-6 max-w-md mx-auto">
                            <p className="text-gray-700 mb-2 font-medium">
                              Confidence: {animatedConfidence.toFixed(2)}%
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                              <div
                                className={`h-3 rounded-full transition-all duration-700 ease-out ${result === "healthy"
                                    ? "bg-gradient-to-r from-green-400 to-emerald-500"
                                    : "bg-gradient-to-r from-red-400 to-orange-500"
                                  }`}
                                style={{ width: `${animatedConfidence}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  )}

                  {/* Reset Button */}
                  <Button
                    variant="outline"
                    onClick={resetTool}
                    size="lg"
                    className="px-8 py-4 text-lg border-2 hover:text-blue-500 hover:bg-gray-100 hover:scale-105 transition-all duration-300 mt-6"
                  >
                    Analyze Another Image
                  </Button>

                </div>
              )}
            </div>
          </div>
        </ScrollFloat>
      </div>
    </section>
  );
}
