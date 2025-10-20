"use client"

import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Button } from "@/components/ui/button"
import { Play, ArrowDown, X } from "lucide-react"
import ScrollFloat from "@/components/reactbits/scroll-float"

export default function HeroSection() {
  const heroRef = useRef<HTMLElement>(null)
  const mascotRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const scrollIndicatorRef = useRef<HTMLDivElement>(null)
  const floatingTextRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.3 })

      // Floating ambient text fade-in
      if (floatingTextRef.current) {
        tl.fromTo(
          floatingTextRef.current.children,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 1.8, stagger: 0.25, ease: "power2.out" }
        )
        gsap.to(floatingTextRef.current.children, {
          y: "random(-15, 15)",
          duration: "random(3, 5)",
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          stagger: 0.5,
        })
      }

      // Mascot entry animation
      if (mascotRef.current) {
        tl.fromTo(
          mascotRef.current,
          { scale: 0, rotation: -180, opacity: 0, y: -100 },
          { scale: 1, rotation: 0, opacity: 1, y: 0, duration: 1.4, ease: "elastic.out(1, 0.5)" }
        )
        gsap.to(mascotRef.current, {
          y: -10,
          duration: 4,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        })
      }

      // Title + subtitle animations
      if (titleRef.current) {
        const chars = titleRef.current.querySelectorAll(".char")
        tl.fromTo(
          chars,
          { opacity: 0, y: 80, rotationX: 90, scale: 0.5 },
          {
            opacity: 1,
            y: 0,
            rotationX: 0,
            scale: 1,
            duration: 0.7,
            stagger: 0.05,
            ease: "back.out(1.7)",
          },
          "-=0.8"
        )
      }

      if (subtitleRef.current) {
        tl.fromTo(
          subtitleRef.current,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
          "-=0.3"
        )
      }

      // CTA button fade-in
      if (ctaRef.current) {
        tl.fromTo(
          ctaRef.current.children,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.2, ease: "back.out(1.7)" },
          "-=0.2"
        )
      }

      // Scroll Indicator animation
      if (scrollIndicatorRef.current) {
        tl.fromTo(
          scrollIndicatorRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
          "-=0.1"
        )
      }

      // Continuous parallax for depth effect
      const elements = [
        { target: heroRef, yPercent: -10, scrub: 1 },
        { target: titleRef, yPercent: -5, scrub: 1.2 },
        { target: subtitleRef, yPercent: -5, scrub: 1 },
      ]
      elements.forEach(({ target, yPercent, scrub }) => {
        if (target?.current) {
          gsap.to(target.current, {
            yPercent,
            ease: "none",
            scrollTrigger: {
              trigger: heroRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub,
            },
          })
        }
      })

      // Subtle zoom-in effect on background video
      if (videoRef.current) {
        gsap.to(videoRef.current, {
          scale: 1.05,
          duration: 15,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        })
      }

      // 🎯 Scroll-trigger heartbeat pulse on CTA
      const ctaButton = ctaRef.current?.querySelector(".pulse-btn")
      if (ctaButton) {
        ScrollTrigger.create({
          trigger: ctaButton,
          start: "top 80%",
          onEnter: () => {
            gsap.fromTo(
              ctaButton,
              { scale: 1 },
              {
                scale: 1.08,
                duration: 0.6,
                ease: "power1.inOut",
                yoyo: true,
                repeat: 3,
              }
            )
          },
        })
      }
    }, heroRef)

    return () => ctx.revert()
  }, [])

  const scrollToStory = () => {
    document.getElementById("story")?.scrollIntoView({ behavior: "smooth" })
  }

  // --- Video Player Handlers ---
  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };


  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 🎥 Chicken Farm Video Background */}
      <div className="absolute inset-0 -z-10">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover brightness-[0.9]"
        >
          <source src="/chicken-farm.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/70" />
      </div>

      {/* Floating Text */}
      <ScrollFloat speed={0.3} className="absolute inset-0 z-5 pointer-events-none">
        <div ref={floatingTextRef} className="absolute inset-0 text-white/50 font-light">
    
        </div>
      </ScrollFloat>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 text-center text-white">
        <div ref={mascotRef} className="mb-8">
          <div className="w-40 h-40 mx-auto bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/30 relative">
            <span className="text-7xl filter drop-shadow-lg">🐔</span>
          </div>
        </div>

        <h1 ref={titleRef} className="text-6xl md:text-8xl font-bold mb-6">
          <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
            {"CHICK".split("").map((char, i) => (
              <span key={i} className="char inline-block">
                {char}
              </span>
            ))}
          </span>
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent ml-2">
            {"TECH".split("").map((char, i) => (
              <span key={i} className="char inline-block">
                {char}
              </span>
            ))}
          </span>
        </h1>

        <p
          ref={subtitleRef}
          className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto font-medium text-white/90"
        >
          AI-powered chicken health diagnosis helping farmers detect diseases instantly.
          <br />
          <span className="text-yellow-300">Because every chicken deserves the best care.</span>
        </p>

        {/* CTA Buttons */}
        <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            size="lg"
            className="pulse-btn bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-8 py-4 text-lg font-semibold shadow-xl hover:scale-105 transition-all duration-300"
            onClick={() => document.getElementById("diagnosis")?.scrollIntoView({ behavior: "smooth" })}
          >
            Try Diagnosis Tool
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="px-8 py-4 text-lg group bg-white/10 border-white/40 text-white hover:bg-white/20 shadow-lg"
            onClick={() => setIsModalOpen(true)}
          >
            <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
            Watch Demo
          </Button>
        </div>
      </div>

      {/* Perfectly Centered Scroll Indicator */}
      <div
        ref={scrollIndicatorRef}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center gap-2 cursor-pointer group z-20"
        onClick={scrollToStory}
      >
        <div className="w-8 h-12 border-2 border-white/80 rounded-full flex justify-center items-start bg-white/10 group-hover:bg-white/20 transition-all duration-300 shadow-md">
          <ArrowDown className="w-4 h-4 text-white mt-2 animate-bounce" />
        </div>
        <p className="text-white/80 text-sm group-hover:text-white font-medium">Scroll to explore</p>
      </div>
      {/* 🎬 Modern Video Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black/60 border border-white/10 backdrop-blur-xl flex flex-col">
            {/* Close Button */}
            <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full p-2 text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Video */}
            <video
              ref={videoRef}
              src="/demo.mp4"
              autoPlay
              className="w-full h-full object-cover rounded-2xl"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
            />

            {/* Custom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={progress || 0}
                onChange={(e) => {
                  const newTime = (parseFloat(e.target.value) / 100) * duration;
                  if (videoRef.current) videoRef.current.currentTime = newTime;
                  setProgress(parseFloat(e.target.value));
                }}
                className="w-full accent-yellow-400"
              />

              <div className="flex items-center justify-between text-white/90 text-sm">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (videoRef.current) videoRef.current.currentTime -= 5;
                    }}
                    className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 transition"
                  >
                    ⏪ 5s
                  </button>

                  <button
                    onClick={handlePlayPause}
                    className="px-4 py-2 rounded-md bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold shadow-lg transition"
                  >
                    {isPlaying ? "⏸ Pause" : "▶️ Play"}
                  </button>

                  <button
                    onClick={() => {
                      if (videoRef.current) videoRef.current.currentTime += 5;
                    }}
                    className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 transition"
                  >
                    5s ⏩
                  </button>
                </div>

                <div className="text-white/70 font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}