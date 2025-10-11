// "use client"

// import { useEffect, useRef } from "react"
// import { gsap } from "gsap"

// interface LiquidEtherProps {
//   className?: string
//   colors?: string[]
//   intensity?: number
// }

// export default function LiquidEther({
//   className = "",
//   colors = ["#fbbf24", "#f97316", "#ef4444", "#8b5cf6"],
//   intensity = 1,
// }: LiquidEtherProps) {
//   const containerRef = useRef<HTMLDivElement>(null)

//   useEffect(() => {
//     const container = containerRef.current
//     if (!container) return

//     // Create multiple floating orbs
//     const orbs = Array.from({ length: 6 }, (_, i) => {
//       const orb = document.createElement("div")
//       orb.className = "absolute rounded-full mix-blend-multiply filter blur-xl opacity-70"

//       const size = Math.random() * 300 + 100
//       orb.style.width = `${size}px`
//       orb.style.height = `${size}px`
//       orb.style.background = `linear-gradient(45deg, ${colors[i % colors.length]}, ${colors[(i + 1) % colors.length]})`

//       container.appendChild(orb)
//       return orb
//     })

//     // Animate orbs
//     orbs.forEach((orb, i) => {
//       gsap.set(orb, {
//         x: Math.random() * window.innerWidth,
//         y: Math.random() * window.innerHeight,
//       })

//       gsap.to(orb, {
//         x: `random(0, ${window.innerWidth})`,
//         y: `random(0, ${window.innerHeight})`,
//         duration: `random(10, 20)`,
//         ease: "sine.inOut",
//         yoyo: true,
//         repeat: -1,
//         delay: i * 0.5,
//       })

//       gsap.to(orb, {
//         scale: `random(0.5, 1.5)`,
//         duration: `random(3, 6)`,
//         ease: "sine.inOut",
//         yoyo: true,
//         repeat: -1,
//         delay: i * 0.3,
//       })
//     })

//     return () => {
//       orbs.forEach((orb) => {
//         if (orb.parentNode) {
//           orb.parentNode.removeChild(orb)
//         }
//       })
//     }
//   }, [colors, intensity])

//   return (
//     <div
//       ref={containerRef}
//       className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
//       style={{
//         background: "radial-gradient(ellipse at center, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)",
//       }}
//     />
//   )
// }

"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export interface LiquidEtherProps {
  colors?: string[];
  style?: React.CSSProperties;
  className?: string;
  autoSpeed?: number;
  autoIntensity?: number;
}

const defaultColors = ["#5227FF", "#FF9FFC", "#B19EEF"];

export default function LiquidEther({
  colors = defaultColors,
  style = {},
  className = "",
  autoSpeed = 0.2,
  autoIntensity = 1.5,
}: LiquidEtherProps): React.ReactElement {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.Camera();

    // Create shader material
    const makePaletteTexture = (stops: string[]): THREE.DataTexture => {
      const arr = stops.length === 1 ? [stops[0], stops[0]] : stops;
      const w = arr.length;
      const data = new Uint8Array(w * 4);
      for (let i = 0; i < w; i++) {
        const c = new THREE.Color(arr[i]);
        data[i * 4] = Math.round(c.r * 255);
        data[i * 4 + 1] = Math.round(c.g * 255);
        data[i * 4 + 2] = Math.round(c.b * 255);
        data[i * 4 + 3] = 255;
      }
      const tex = new THREE.DataTexture(data, w, 1, THREE.RGBAFormat);
      tex.magFilter = THREE.LinearFilter;
      tex.minFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
      return tex;
    };

    const palette = makePaletteTexture(colors);

    const material = new THREE.RawShaderMaterial({
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uPalette: { value: palette },
        uSpeed: { value: autoSpeed },
        uIntensity: { value: autoIntensity },
      },
      vertexShader: `
        precision highp float;
        attribute vec3 position;
        varying vec2 vUv;
        void main() {
          vUv = 0.5 + position.xy * 0.5;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform sampler2D uPalette;
        uniform float uTime;
        uniform float uSpeed;
        uniform float uIntensity;
        varying vec2 vUv;

        void main() {
          vec2 uv = vUv;
          float waves = sin((uv.x + uTime * uSpeed) * 4.0) * cos((uv.y + uTime * uSpeed) * 4.0);
          float intensity = smoothstep(0.0, 1.0, 0.5 + waves * 0.5) * uIntensity;
          vec3 color = texture2D(uPalette, vec2(intensity, 0.5)).rgb;
          gl_FragColor = vec4(color, 0.4);
        }
      `,
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    // Animation loop
    const clock = new THREE.Clock();

    const animate = () => {
      material.uniforms.uTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement))
        container.removeChild(renderer.domElement);
    };
  }, [colors, autoSpeed, autoIntensity]);

  return (
    <div
      ref={mountRef}
      className={`absolute inset-0 w-full h-full pointer-events-none overflow-hidden ${className}`}
      style={style}
    />
  );
}
