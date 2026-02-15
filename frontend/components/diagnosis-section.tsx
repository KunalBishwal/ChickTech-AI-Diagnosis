"use client";

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
  X,
  Play,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ScrollReveal from "@/components/reactbits/scroll-reveal";
import ScrollFloat from "@/components/reactbits/scroll-float";
import LiquidEther from "@/components/reactbits/liquid-ether";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

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
  const [result, setResult] = useState<"healthy" | "sick" | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [animatedConfidence, setAnimatedConfidence] = useState(0);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
  }, []);

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
        setAnimatedConfidence(start);
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
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setUploadedImage(base64);
      startScanning(base64);
    };
    reader.readAsDataURL(file);
  };

  const startScanning = async (imageBase64: string) => {
    setIsScanning(true);
    setResult(null);
    setConfidence(null);
    setAnimatedConfidence(0);

    try {
      const base64Data = imageBase64.split(",")[1];
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/predict`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64Data }),
        }
      );

      const data = await response.json();

      setTimeout(() => {
        setIsScanning(false);
        if (data.class?.toLowerCase().includes("healthy")) {
          setResult("healthy");
        } else {
          setResult("sick");
        }
        if (data.confidence) setConfidence(data.confidence);
      }, 3000);
    } catch (error) {
      console.error("Prediction failed:", error);
      setIsScanning(false);
      toast.error("Could not connect to backend ❌");
    }
  };

  const resetTool = () => {
    setUploadedImage(null);
    setResult(null);
    setConfidence(null);
    setIsScanning(false);
    setAnimatedConfidence(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cursorRef.current) return;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    gsap.to(cursorRef.current, {
      x: x - 20,
      y: y - 20,
      duration: 0.25,
    });
  };

  return (
    <section
      id="diagnosis"
      ref={sectionRef}
      className="py-32 relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-purple-50"
    >
      <LiquidEther
        colors={["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981"]}
        autoSpeed={0.4}
        autoIntensity={2}
      />

      <div className="container mx-auto px-6 relative z-10">

        {/* ================= DEMO SECTION ================= */}
        <ScrollReveal direction="up" distance={80}>
          <div className="flex flex-col items-center mb-24 space-y-6">
            <h3 className="text-3xl font-semibold text-gray-900 text-center">
              See ChickTech AI in Action
            </h3>

            <div
              onMouseMove={handleMouseMove}
              onClick={() => !videoError && setIsVideoOpen(true)}
              className="relative group cursor-pointer rounded-2xl overflow-hidden border shadow-2xl w-[320px] h-[180px]"
            >
              {!videoError ? (
                <VideoPlayer style={{ width: "100%", height: "100%" }}>
                  <VideoPlayerContent
                    src="/demo.mp4"
                    autoPlay
                    muted
                    loop
                    slot="media"
                    onError={() => setVideoError(true)}
                  />
                </VideoPlayer>
              ) : (
                <div className="relative w-full h-full">
                  <img
                    src="/cock-farm-village-chicken.jpg"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(
                          "https://drive.google.com/file/d/1IKE59orfBnIVvB3lBTzLOPDp5w_xczP-/view?usp=sharing",
                          "_blank"
                        );
                      }}
                      className="bg-white text-black"
                    >
                      🔗 Link to Demo Video
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollReveal>

        {/* ================= DIAGNOSIS TOOL ================= */}
        <ScrollFloat speed={0.1}>
          <div ref={toolRef} className="max-w-3xl mx-auto">
            <div className="p-12 bg-white/80 backdrop-blur shadow-2xl rounded-3xl">

              {!uploadedImage ? (
                <div className="text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() =>
                      handleProtectedAction(() =>
                        fileInputRef.current?.click()
                      )
                    }
                  >
                    <Upload className="mr-2 w-4 h-4" />
                    Upload Image
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-6">
                  <img
                    src={uploadedImage}
                    className="w-full h-80 object-cover rounded-xl"
                  />

                  {isScanning && (
                    <Loader2 className="animate-spin w-8 h-8 mx-auto" />
                  )}

                  {result && (
                    <>
                      <h3 className="text-2xl font-bold">
                        {result === "healthy"
                          ? "Healthy Chicken 🐔"
                          : "Coccidiosis Detected"}
                      </h3>

                      {confidence && (
                        <div>
                          Confidence: {animatedConfidence}%
                        </div>
                      )}
                    </>
                  )}

                  <Button onClick={resetTool}>Analyze Another</Button>
                </div>
              )}
            </div>
          </div>
        </ScrollFloat>
      </div>
    </section>
  );
}
