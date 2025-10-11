"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

interface ScrollFloatProps {
  children: ReactNode
  speed?: number
  direction?: "up" | "down"
  className?: string
}

export default function ScrollFloat({ children, speed = 0.5, direction = "up", className = "" }: ScrollFloatProps) {
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      gsap.registerPlugin(ScrollTrigger)
    }

    const element = elementRef.current
    if (!element) return

    const yMovement = direction === "up" ? -100 * speed : 100 * speed

    gsap.to(element, {
      yPercent: yMovement,
      ease: "none",
      scrollTrigger: {
        trigger: element,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    })

    // Add subtle floating animation
    gsap.to(element, {
      y: "random(-10, 10)",
      x: "random(-5, 5)",
      duration: "random(3, 6)",
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    })

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.trigger === element) {
          trigger.kill()
        }
      })
    }
  }, [speed, direction])

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  )
}
