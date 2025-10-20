"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function RollingText({
  text,
  speed = 1,
  direction = "up",
  className = "",
}: {
  text: string;
  speed?: number;
  direction?: "up" | "down";
  className?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const letters = wrapper.querySelectorAll("span.letter");
    if (!letters.length) return;

    letters.forEach((el, i) => {
      gsap.fromTo(
        el,
        {
          rotateX: direction === "up" ? 90 : -90,
          yPercent: direction === "up" ? 50 : -50,
          opacity: 0,
        },
        {
          rotateX: 0,
          yPercent: 0,
          opacity: 1,
          duration: 1.2 * speed,
          ease: "power3.out",
          delay: i * 0.05,
          scrollTrigger: {
            trigger: wrapper,
            start: "top 85%",
            end: "bottom 15%",
            scrub: true,
          },
        }
      );
    });

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, [text, speed, direction]);

  return (
    <div
      ref={wrapperRef}
      className={`inline-block text-5xl md:text-6xl font-bold tracking-tight ${className}`}
      style={{ perspective: 1000 }}
    >
      {text.split("").map((char, i) => (
        <span
          key={i}
          className="letter inline-block will-change-transform"
          style={{ transformOrigin: "center center" }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </div>
  );
}
