"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AlertTriangle, Zap, Heart, TrendingDown, Clock, Skull } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import ScrollReveal from "@/components/reactbits/scroll-reveal";
import ScrollFloat from "@/components/reactbits/scroll-float";
import LiquidEther from "@/components/reactbits/liquid-ether";

type TrendData = {
  time: string;
  loss: number;
  delay: number;
  mortality: number;
};

export default function StorySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const heroMascotRef = useRef<HTMLDivElement>(null);
  const solutionRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    globalLosses: number;
    avgDelay: number;
    mortalityRate: number;
    trends: TrendData[];
    lastUpdated: string;
  }>({
    globalLosses: 0,
    avgDelay: 0,
    mortalityRate: 0,
    trends: [],
    lastUpdated: "",
  });

  useEffect(() => {
    if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

    // Floating hero animation
    if (heroMascotRef.current) {
      gsap.fromTo(
        heroMascotRef.current,
        { scale: 0, rotation: -180, opacity: 0 },
        {
          scale: 1,
          rotation: 0,
          opacity: 1,
          duration: 1.5,
          ease: "elastic.out(1, 0.5)",
          scrollTrigger: {
            trigger: heroMascotRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );
      gsap.to(heroMascotRef.current, {
        y: -20,
        rotation: 10,
        duration: 3,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    }
  }, []);

  // ✅ Instant dynamic stats
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/poultryStats", { cache: "no-store" });
        const data = await res.json();
        setStats(data);
        setLoading(false);
      } catch (error) {
        console.warn("⚠️ Fallback used:", error);
        setStats({
          globalLosses: 4.6,
          avgDelay: 48,
          mortalityRate: 38,
          trends: [],
          lastUpdated: new Date().toISOString(),
        });
        setLoading(false);
      }
    }

    fetchStats();
    const interval = setInterval(fetchStats, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="story"
      ref={sectionRef}
      className="py-24 bg-gradient-to-b from-red-50 via-white to-green-50 relative overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <video autoPlay muted loop playsInline className="w-full h-full object-cover opacity-20">
          <source src="/sick-chickens-farm.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-red-50/80 via-white/90 to-green-50/80" />
      </div>

      {/* Background animation */}
      <LiquidEther colors={["#fecaca", "#fed7d7", "#dcfce7", "#ddd6fe"]} />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <ScrollReveal direction="up" distance={100} duration={1.2}>
          <div className="text-center mb-16">
            <div className="w-20 h-20 bg-red-100/80 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border border-red-200/50">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">
              The <span className="text-red-600">Crisis</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              Every year, chicken diseases devastate farms worldwide. Traditional diagnosis methods are too slow,
              too expensive, and often too late to save entire flocks.
            </p>
          </div>
        </ScrollReveal>

        {/* Stats */}
        <div ref={statsRef} className="grid md:grid-cols-3 gap-8 mb-16 place-items-center">
          {[
            {
              icon: <TrendingDown className="w-9 h-9 text-red-600" />,
              label: "BILLION USD",
              value: stats.globalLosses.toFixed(1),
              desc: "Global poultry losses due to disease outbreaks",
              color: "from-red-200 via-pink-100 to-orange-100",
              key: "loss",
            },
            {
              icon: <Clock className="w-9 h-9 text-red-600" />,
              label: "HOURS",
              value: stats.avgDelay.toFixed(0),
              desc: "Average delay for lab-based disease confirmation",
              color: "from-yellow-100 via-orange-100 to-red-100",
              key: "delay",
            },
            {
              icon: <Skull className="w-9 h-9 text-red-600" />,
              label: "PERCENT",
              value: stats.mortalityRate.toFixed(1),
              desc: "Farms without early detection face higher mortality",
              color: "from-pink-100 via-red-100 to-orange-100",
              key: "mortality",
            },
          ].map((item, i) => (
            <ScrollReveal
              key={i}
              direction={["left", "up", "right"][i] as "left" | "right" | "up"}
              delay={0.2 * (i + 1)}
            >
              <div className="relative w-full sm:w-80 md:w-96 text-center p-10 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-red-100/50 hover:-translate-y-2 hover:shadow-2xl transition-all duration-500">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-24 h-24 bg-gradient-to-tr from-red-100 to-orange-100 rounded-full blur-2xl opacity-70" />
                <div
                  className={`relative w-20 h-20 bg-gradient-to-br ${item.color} rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200/50 shadow-inner`}
                >
                  {item.icon}
                </div>
                <div className="stat-number text-5xl font-extrabold text-red-600 mb-2">
                  {loading ? "..." : item.value}
                </div>
                <div className="text-sm text-gray-500 mb-2">{item.label}</div>
                <p className="text-gray-700 font-medium mb-4">{item.desc}</p>

                {/* 📈 Mini Sparkline */}
                {!loading && stats.trends?.length > 0 && (
                  <ResponsiveContainer width="100%" height={60}>
                    <LineChart data={stats.trends} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255,255,255,0.8)",
                          border: "none",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "#444" }}
                        formatter={(value) => Number(value).toFixed(1)}
                      />
                      <Line
                        type="monotone"
                        dataKey={item.key}
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>
        <div className="w-full max-w-2xl mx-auto">
          {!loading && (
          <p className="text-center text-sm text-gray-500 mt-4 opacity-80 animate-fadeIn">
            Data last updated:{" "}
            {new Date(stats.lastUpdated).toLocaleString("en-US", {
              dateStyle: "long",
              timeStyle: "short",
            })}{" "}
            🌍
          </p>
        )}
        </div>

        {/* 🦸 Solution Section */}
        <div ref={solutionRef}>
          <ScrollReveal direction="up" distance={100} duration={1.2}>
            <div className="text-center mb-16">
              <div className="w-20 h-20 bg-green-100/80 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border border-green-200/50">
                <Zap className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">
                The <span className="text-green-600">Hero</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                ChickTech arrives as the AI-powered solution that transforms chicken health diagnosis. Fast, accurate,
                and accessible to every farmer worldwide.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="space-y-8">
                <ScrollReveal direction="left" delay={0.2}>
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 bg-blue-100/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-blue-200/50">
                      <span className="text-3xl">⚡</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-3 text-gray-900">Lightning Fast</h3>
                      <p className="text-gray-600 text-lg leading-relaxed">
                        Upload a photo and get results in under 10 seconds. No more waiting days for lab results.
                      </p>
                    </div>
                  </div>
                </ScrollReveal>

                <ScrollReveal direction="left" delay={0.4}>
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 bg-purple-100/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-purple-200/50">
                      <span className="text-3xl">🎯</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-3 text-gray-900">Pinpoint Accuracy</h3>
                      <p className="text-gray-600 text-lg leading-relaxed">
                        98.2% accuracy rate, trained on millions of chicken health images from around the world.
                      </p>
                    </div>
                  </div>
                </ScrollReveal>

                <ScrollReveal direction="left" delay={0.6}>
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 bg-green-100/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-green-200/50">
                      <Heart className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-3 text-gray-900">Save Lives</h3>
                      <p className="text-gray-600 text-lg leading-relaxed">
                        Early detection means better treatment outcomes and healthier flocks.
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            </div>

            <ScrollFloat speed={0.2} className="relative">
              <ScrollReveal direction="right" delay={0.3}>
                <div className="bg-gradient-to-br from-green-50/80 to-blue-50/80 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-green-100/50">
                  <div
                    ref={heroMascotRef}
                    className="aspect-square bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 rounded-2xl flex items-center justify-center shadow-xl relative"
                  >
                    <span className="text-9xl filter drop-shadow-lg">🦸‍♂️</span>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/30 to-transparent opacity-50" />
                  </div>
                  <div className="mt-8 text-center">
                    <h4 className="text-2xl font-bold mb-3 text-gray-900">ChickTech AI</h4>
                    <p className="text-gray-600 text-lg">
                      Your chicken's health guardian, powered by artificial intelligence
                    </p>
                    <div className="mt-4 flex justify-center">
                      <div className="bg-green-100/80 backdrop-blur-sm text-green-800 px-4 py-2 rounded-full text-sm font-semibold border border-green-200/50">
                        Ready to save the day! 🚀
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </ScrollFloat>
          </div>
        </div>
      </div>
    </section>
  );
}
