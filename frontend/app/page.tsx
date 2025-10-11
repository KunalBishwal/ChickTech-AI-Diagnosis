"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import HeroSection from "@/components/hero-section"
import StorySection from "@/components/story-section"
import DiagnosisSection from "@/components/diagnosis-section"
import FeaturesSection from "@/components/features-section"
import Navigation from "@/components/navigation"
import CureSection from "@/components/CureSection";


if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

export default function HomePage() {
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    ScrollTrigger.refresh()

    gsap.registerPlugin(ScrollTrigger)


    gsap.to("body", {
      duration: 0.1,
      ease: "none",
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: true,
      },
    })

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  }, [])

  return (
    <main ref={mainRef} className="min-h-screen bg-background overflow-x-hidden">
      <Navigation />
      <div id="hero">
        <HeroSection />
      </div>
      <StorySection />
      <DiagnosisSection />
      <CureSection /> 
      <FeaturesSection />

      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <span className="text-2xl">🐔</span>
            </div>
            <h3 className="text-2xl font-bold mb-4">ChickTech</h3>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Revolutionizing poultry health with AI-powered diagnosis. Helping farmers worldwide keep their flocks
              healthy and profitable.
            </p>
            <div className="flex justify-center gap-8 text-sm text-gray-500">
              <span>© 2025 ChickTech</span>
              <span>•</span>
              <span>Privacy Policy</span>
              <span>•</span>
              <span>Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
