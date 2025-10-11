"use client";

import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Leaf, Droplets, HeartPulse } from "lucide-react";
import LiquidEther from "@/components/reactbits/liquid-ether";


export default function CureSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);

        if (contentRef.current) {
            gsap.fromTo(
                contentRef.current,
                { opacity: 0, y: 120, scale: 0.95 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 1.5,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: contentRef.current,
                        start: "top 85%",
                        toggleActions: "play none none reverse",
                    },
                }
            );
        }
    }, []);

    const scrollToSection = (sectionId: string) => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
        setIsMobileMenuOpen(false);
    };

    return (
        <section
            id="cure-section"
            ref={sectionRef}
            className="relative py-32 overflow-hidden bg-gradient-to-b from-red-50 via-white to-orange-50"
        >
            <LiquidEther
                colors={["#f87171", "#fbbf24", "#fb923c", "#facc15"]}
                autoSpeed={0.3}
                autoIntensity={1.8}
            />

            <div
                ref={contentRef}
                className="container mx-auto px-6 text-center relative z-10"
            >
                <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
                    <HeartPulse className="w-10 h-10 text-white" />
                </div>

                <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">
                    Recovery &{" "}
                    <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                        Prevention
                    </span>
                </h2>
                <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-16">
                    Coccidiosis is common but treatable. Follow these expert-recommended
                    steps to restore your flock’s health and prevent recurrence.
                </p>

                {/* Cure Cards */}
                <div className="grid md:grid-cols-3 gap-8 text-left max-w-6xl mx-auto">
                    <div className="p-8 bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-red-100 hover:scale-[1.03] transition-all duration-300">
                        <Leaf className="w-10 h-10 text-green-500 mb-4" />
                        <h3 className="text-2xl font-bold mb-3 text-gray-900">
                            1️⃣ Isolate & Sanitize
                        </h3>
                        <p className="text-gray-700">
                            Move infected chickens away. Clean feeders, waterers, and litter
                            thoroughly using mild disinfectants.
                        </p>
                    </div>

                    <div className="p-8 bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-red-100 hover:scale-[1.03] transition-all duration-300">
                        <Droplets className="w-10 h-10 text-blue-500 mb-4" />
                        <h3 className="text-2xl font-bold mb-3 text-gray-900">
                            2️⃣ Provide Medication
                        </h3>
                        <p className="text-gray-700">
                            Administer coccidiostats (e.g., Amprolium or Toltrazuril) in
                            drinking water for 3–5 days as prescribed by a vet.
                        </p>
                    </div>

                    <div className="p-8 bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-red-100 hover:scale-[1.03] transition-all duration-300">
                        <HeartPulse className="w-10 h-10 text-pink-500 mb-4" />
                        <h3 className="text-2xl font-bold mb-3 text-gray-900">
                            3️⃣ Strengthen Immunity
                        </h3>
                        <p className="text-gray-700">
                            Add vitamins (A, D3, E, K) and probiotics to boost recovery.
                            Maintain dry bedding and regular cleaning.
                        </p>
                    </div>
                </div>

    
                <div className="mt-16">
                    {[
                        { label: "AI Diagnosis", id: "diagnosis" }
                    ].map(({ label, id }) => (
                        <button
                            key={id}
                            onClick={() => scrollToSection(id)}
                            className={`bg-gradient-to-r from-red-500 to-orange-500 text-white px-10 py-5 text-lg font-semibold shadow-xl hover:scale-105 transition-all rounded-md font-medium transition-all duration-300 hover:scale-105 ${isScrolled
                                ? "text-gray-600 hover:text-gray-900"
                                : "text-white/80 hover:text-white"
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}
