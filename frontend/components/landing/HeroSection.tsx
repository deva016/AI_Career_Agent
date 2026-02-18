"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { HeroCanvas } from "./HeroCanvas";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.8, 
      ease: [0.21, 0.47, 0.32, 0.98] as any
    } 
  },
};

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 overflow-hidden bg-transparent">
      {/* WebGL Background */}
      <HeroCanvas />

      {/* Content */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-5xl mx-auto px-6 text-center"
      >
        <motion.div
          variants={itemVariants}
          className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm"
        >
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-sm font-medium text-white/80">80% Less Effort. 100% Autonomous.</span>
        </motion.div>

        <motion.h1 
          variants={itemVariants}
          className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter text-white mb-8 leading-[0.9]"
        >
          {Array.from("THE COMPLETE PLATFORM TO").map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.05, delay: i * 0.05 }}
            >
              {char}
            </motion.span>
          ))}
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-400 to-purple-500">
            {Array.from("BUILD YOUR CAREER.").map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.05, delay: 1.25 + i * 0.05 }}
              >
                {char}
              </motion.span>
            ))}
          </span>
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            className="inline-block w-[4px] h-[0.9em] bg-primary ml-1 translate-y-2"
          />
        </motion.h1>

        <motion.p 
          variants={itemVariants}
          className="text-white/60 text-lg md:text-2xl max-w-3xl mx-auto mb-12 leading-relaxed px-4 md:px-0"
        >
          Autonomous agents that discover jobs, tailor resumes, and manage your applications. 
          The smarter way to land your next elite industry role.
        </motion.p>

        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <Link href="/dashboard">
            <Button className="h-14 px-10 rounded-full text-lg font-bold bg-white text-black hover:bg-gray-200 transition-all scale-100 hover:scale-105 active:scale-95 shadow-2xl shadow-white/10">
              Start Building
            </Button>
          </Link>
          <Button variant="outline" className="h-14 px-10 rounded-full text-lg font-bold border-white/10 text-white hover:bg-white/5 transition-all gap-2">
            Read Documentation
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </motion.div>

      {/* Floating Elements / Decorative */}
    </section>
  );
}
