"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function FinalCTA() {
  return (
    <section className="py-32 px-6 md:px-12 bg-transparent text-center relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: "circOut" as any }}
        >
          <h2 className="text-4xl sm:text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter uppercase italic leading-[0.85]">
            Build your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-400 to-purple-500 italic">future, autonomously.</span>
          </h2>
          <p className="text-white/60 text-lg md:text-2xl mb-12 max-w-2xl mx-auto leading-relaxed px-4">
            Join the elite circle of job seekers using autonomous intelligence to win the modern market.
          </p>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Button className="h-16 px-12 rounded-full text-xl font-bold bg-white text-black hover:bg-gray-200 transition-all scale-100 hover:scale-105 active:scale-95 shadow-2xl">
              Get Started Now
            </Button>
            <Button variant="outline" className="h-16 px-12 rounded-full text-xl font-bold border-white/10 text-white hover:bg-white/5 transition-all">
              Contact Sales
            </Button>
          </motion.div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8, duration: 1 }}
        className="mt-32 text-center text-white/20 text-xs tracking-widest uppercase"
      >
        © 2026 CareerAgent AI. Built for the modern professional.
      </motion.div>
    </section>
  );
}
