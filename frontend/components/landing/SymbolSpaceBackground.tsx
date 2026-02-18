"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

const symbols = [".", "*", ",", "?", "+", "%", "#"];

export function SymbolSpaceBackground() {
  const particles = useMemo(() => {
    return Array.from({ length: 100 }).map((_, i) => ({
      id: i,
      char: symbols[Math.floor(Math.random() * symbols.length)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 24 + 12,
      opacity: Math.random() * 0.4 + 0.2, // Bright but not heavy
      duration: Math.random() * 40 + 20,
      delay: Math.random() * -40,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: `${p.x}vw`, y: `${p.y}vh`, opacity: 0 }}
          animate={{ 
            y: [`${p.y}vh`, `${p.y - 10}vh`, `${p.y}vh`],
            x: [`${p.x}vw`, `${p.x + 5}vw`, `${p.x}vw`],
            opacity: [p.opacity, p.opacity * 0.5, p.opacity],
            rotate: [0, 180, 0]
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
          className="absolute text-white/40 font-mono select-none"
          style={{
            fontSize: `${p.size}px`,
            left: 0,
            top: 0,
            opacity: p.opacity
          }}
        >
          {p.char}
        </motion.div>
      ))}
      
      {/* Soft radial gradients for extra "space" feel */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.05)_0%,transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(34,211,238,0.03)_0%,transparent_50%)]" />
    </div>
  );
}
