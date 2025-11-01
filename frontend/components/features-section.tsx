"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Smartphone,
  Shield,
  Brain,
  Globe,
  FlaskConical,
  Wrench,
} from "lucide-react";
import LiquidEther from "@/components/reactbits/liquid-ether";

export default function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // ✨ Feature cards scroll reveal
    if (cardsRef.current) {
      const cards = cardsRef.current.querySelectorAll(".feature-card");
      cards.forEach((card) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 80, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            ease: "back.out(1.7)",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });
    }

    // 🚀 CTA (Project Development) scroll reveal animation
    if (ctaRef.current) {
      gsap.fromTo(
        ctaRef.current.querySelector(".cta-card"),
        { opacity: 0, y: 120, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ctaRef.current,
            start: "top 85%",
            end: "bottom 50%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }
  }, []);

  // 🎯 Shared tilt/transform handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    gsap.to(card, {
      rotationY: x / 60, // reduced tilt
      rotationX: -y / 60,
      scale: 1.03,
      transformPerspective: 900,
      transformOrigin: "center",
      ease: "power2.out",
      duration: 0.4,
    });
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    gsap.to(card, {
      rotationY: 0,
      rotationX: 0,
      scale: 1,
      ease: "power3.out",
      duration: 0.6,
    });
  };

  return (
    <section
      id="features"
      ref={sectionRef}
      className="relative overflow-hidden py-32 bg-gradient-to-b from-gray-50 to-white"
    >
      <LiquidEther
        colors={["#8b5cf6", "#3b82f6", "#06b6d4", "#10b981"]}
        autoSpeed={0.35}
        autoIntensity={2.2}
      />

      {/* Header */}
      <div className="text-center mb-24 px-6 relative z-10">
        <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">
          Project{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
            Highlights
          </span>
        </h2>
        <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
          A cinematic walkthrough of our student-built AI system — blending
          technology, learning, and design. Scroll to explore the journey. ✨
        </p>
      </div>

      {/* Feature Cards */}
      <div
        ref={cardsRef}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto px-6 relative z-10"
      >
        {[
          {
            icon: <Brain className="w-8 h-8 text-purple-500" />,
            title: "AI Vision Model",
            desc: "Our CNN model identifies Coccidiosis with 98.2% accuracy. Future versions will support multi-disease recognition and cloud retraining.",
            gradient: "from-purple-200/30 to-pink-200/20",
          },
          {
            icon: <Zap className="w-8 h-8 text-yellow-500" />,
            title: "Instant Prediction",
            desc: "Delivers predictions in under 5 seconds using TensorFlow’s optimized inference engine.",
            gradient: "from-yellow-200/30 to-orange-200/20",
          },
          {
            icon: <Shield className="w-8 h-8 text-green-500" />,
            title: "98.2% Accuracy",
            desc: "Validated on multiple datasets showing strong precision and recall metrics.",
            gradient: "from-green-200/30 to-emerald-200/20",
          },
          {
            icon: <Smartphone className="w-8 h-8 text-blue-500" />,
            title: "Mobile Integration",
            desc: "TensorFlow Lite port in progress — bringing real-time detection to Android devices.",
            gradient: "from-blue-200/30 to-cyan-200/20",
          },
          {
            icon: <Globe className="w-8 h-8 text-indigo-500" />,
            title: "Open Source Collaboration",
            desc: "Hosted on GitHub for contributions from students and researchers worldwide.",
            gradient: "from-indigo-200/30 to-purple-200/20",
          },
          {
            icon: <FlaskConical className="w-8 h-8 text-amber-500" />,
            title: "Research Stage",
            desc: "Currently optimizing hyperparameters and experimenting with image augmentations.",
            gradient: "from-amber-200/30 to-yellow-200/20",
          },
          {
            icon: <Wrench className="w-8 h-8 text-teal-500" />,
            title: "Work in Progress",
            desc: "Upcoming goals: dataset expansion and cloud deployment.",
            gradient: "from-teal-200/30 to-green-200/20",
          },
        ].map((feature, i) => (
          <div
            key={i}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`feature-card group relative p-8 rounded-3xl backdrop-blur-xl border border-white/40 shadow-xl transition-all duration-500 bg-gradient-to-br ${feature.gradient}
              hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-200/40 transform-gpu will-change-transform`}
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="flex flex-col items-start space-y-4">
              <div className="p-3 rounded-2xl bg-white/50 shadow-inner backdrop-blur-md transform transition-transform duration-300 group-hover:rotate-[4deg]">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {feature.title}
              </h3>
              <p className="text-gray-700 text-base leading-relaxed">
                {feature.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 🚀 Project Development CTA */}
      <div
        ref={ctaRef}
        className="text-center mt-32 px-6 relative z-10"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className="cta-card bg-gradient-to-r from-gray-900 via-purple-900 to-blue-900 rounded-3xl p-14 max-w-4xl mx-auto text-white shadow-2xl backdrop-blur-lg border border-transparent transition-all duration-500 hover:scale-[1.02] hover:shadow-purple-500/40 hover:border-gradient"
          style={{
            transformStyle: "preserve-3d",
            willChange: "transform",
            boxShadow:
              "0 0 25px rgba(139, 92, 246, 0.2), inset 0 0 10px rgba(255, 255, 255, 0.1)",
          }}
        >
          <div className="relative z-10">
            <h3 className="text-4xl md:text-5xl font-bold mb-6">
              🚀 Project in Development
            </h3>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              This AI project is being built by students passionate about
              Machine Learning and UI Design. The next step — making it
              production-ready.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-4 text-lg font-semibold shadow-xl hover:scale-105 transition-all"
                onClick={() =>
                  window.open(
                    "https://github.com/KunalBishwal/ChickTech-AI-Diagnosis",
                    "_blank"
                  )
                }
              >
                View on GitHub
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-white/30 text-white hover:scale-105 transition-all bg-white/10 px-8 py-4 text-lg font-semibold"
                onClick={() =>
                  window.open("https://linkedin.com/in/KunalBishwal", "_blank")
                }
              >
                Connect on LinkedIn
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
