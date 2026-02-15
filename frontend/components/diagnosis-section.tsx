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
    if (!videoError && cursorRef.current) {
      gsap.fromTo(
        cursorRef.current,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, ease: "power3.out" }
      );
    }
  };

  const handleMouseLeave = () => {
    if (cursorRef.current) {
      gsap.to(cursorRef.current, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
      });
    }
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

        {/* 🎬 Demo Video Section */}
        <ScrollReveal direction="up" distance={80} duration={1.1}>
          <div className="flex flex-col items-center mb-24 space-y-6">
            <h3 className="text-3xl md:text-4xl font-semibold text-gray-900 text-center">
              See ChickTech AI in Action
            </h3>

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

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(
                          "https://drive.google.com/file/d/1IKE59orfBnIVvB3lBTzLOPDp5w_xczP-/view?usp=sharing",
                          "_blank"
                        );
                      }}
                      className="bg-white text-black font-semibold px-5 py-2 shadow-lg hover:scale-105 transition"
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
          {isVideoOpen && !videoError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
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
                  <VideoPlayerControlBar className="absolute bottom-0 left-0 w-full flex items-center justify-center px-4 py-2 bg-gradient-to-t from-black/60 via-black/20 to-transparent backdrop-blur-sm text-white">
                    <VideoPlayerPlayButton />
                    <VideoPlayerTimeRange className="mx-3 flex-1" />
                    <VideoPlayerMuteButton />
                  </VideoPlayerControlBar>
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
      </div>
    </section>
  );
}
