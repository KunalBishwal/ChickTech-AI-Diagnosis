"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

interface ScrollRevealProps {
  children: ReactNode
  direction?: "up" | "down" | "left" | "right"
  distance?: number
  duration?: number
  delay?: number
  className?: string
}

export default function ScrollReveal({
  children,
  direction = "up",
  distance = 50,
  duration = 1,
  delay = 0,
  className = "",
}: ScrollRevealProps) {
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      gsap.registerPlugin(ScrollTrigger)
    }

    const element = elementRef.current
    if (!element) return

    const getInitialTransform = () => {
      switch (direction) {
        case "up":
          return { y: distance, opacity: 0 }
        case "down":
          return { y: -distance, opacity: 0 }
        case "left":
          return { x: distance, opacity: 0 }
        case "right":
          return { x: -distance, opacity: 0 }
        default:
          return { y: distance, opacity: 0 }
      }
    }

    gsap.fromTo(element, getInitialTransform(), {
      x: 0,
      y: 0,
      opacity: 1,
      duration,
      delay,
      ease: "power2.out",
      scrollTrigger: {
        trigger: element,
        start: "top 80%",
        end: "bottom 20%",
        toggleActions: "play none none reverse",
      },
    })

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.trigger === element) {
          trigger.kill()
        }
      })
    }
  }, [direction, distance, duration, delay])

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  )
}
