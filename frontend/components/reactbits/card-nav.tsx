"use client"

import { useState, useRef, useEffect } from "react"
import { gsap } from "gsap"

interface CardNavItem {
  id: string
  title: string
  description: string
  icon?: string
}

interface CardNavProps {
  items: CardNavItem[]
  onItemClick?: (item: CardNavItem) => void
  className?: string
}

export default function CardNav({ items, onItemClick, className = "" }: CardNavProps) {
  const [activeItem, setActiveItem] = useState<string>(items[0]?.id || "")
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    cardRefs.current.forEach((card, index) => {
      if (!card) return

      gsap.fromTo(
        card,
        { opacity: 0, y: 50, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          delay: index * 0.1,
          ease: "back.out(1.7)",
        },
      )
    })
  }, [])

  const handleItemClick = (item: CardNavItem) => {
    setActiveItem(item.id)
    onItemClick?.(item)
  }

  const handleMouseEnter = (index: number) => {
    const card = cardRefs.current[index]
    if (card) {
      gsap.to(card, {
        scale: 1.05,
        rotationY: 5,
        rotationX: 5,
        duration: 0.3,
        ease: "power2.out",
      })
    }
  }

  const handleMouseLeave = (index: number) => {
    const card = cardRefs.current[index]
    if (card) {
      gsap.to(card, {
        scale: 1,
        rotationY: 0,
        rotationX: 0,
        duration: 0.3,
        ease: "power2.out",
      })
    }
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {items.map((item, index) => (
        <div
          key={item.id}
          ref={(el) => (cardRefs.current[index] = el)}
          className={`relative p-6 rounded-2xl cursor-pointer transition-all duration-300 backdrop-blur-xl border ${
            activeItem === item.id
              ? "bg-white/20 border-white/30 shadow-2xl"
              : "bg-white/10 border-white/20 hover:bg-white/15"
          }`}
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
          }}
          onClick={() => handleItemClick(item)}
          onMouseEnter={() => handleMouseEnter(index)}
          onMouseLeave={() => handleMouseLeave(index)}
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent opacity-50" />

          {item.icon && <div className="text-4xl mb-4 relative z-10">{item.icon}</div>}

          <h3 className="text-xl font-bold text-white mb-2 relative z-10">{item.title}</h3>

          <p className="text-white/80 relative z-10">{item.description}</p>

          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400/10 to-orange-400/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
        </div>
      ))}
    </div>
  )
}
