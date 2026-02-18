"use client";

import React from "react";
import { motion } from "framer-motion";
import { Link2, Rocket, Settings } from "lucide-react";

const steps = [
  {
    title: "Profile Sync",
    description: "Link your experience and professional identity to our secure knowledge base.",
    icon: Link2,
    color: "#8B5CF6",
    badge: "3"
  },
  {
    title: "Agent Tuning",
    description: "Configure your target roles and let our swarm specialized for your niche.",
    icon: Settings,
    color: "#22D3EE",
    badge: "4"
  },
  {
    title: "Autonomous Launch",
    description: "Deploy your agents and watch your career growth happen 24/7.",
    icon: Rocket,
    color: "#10B981",
    badge: "2"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
    },
  },
};

const stepVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.8, ease: "easeOut" as any } 
  },
};

export function TimelineSteps() {
  return (
    <section id="how-it-works" className="py-24 px-6 md:px-12 bg-transparent overflow-hidden relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20 relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-white mb-4"
          >
            Three steps to production.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-white/60 text-lg max-w-2xl mx-auto"
          >
            Designed to fit your existing professional workflow and scale with your career goals.
          </motion.p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-12 relative"
        >
          {/* Dashed Sequential Flow Line */}
          <div className="hidden md:block absolute top-[48px] left-[15%] right-[15%] h-[2px] z-0">
            {/* Dashed Background Line */}
            <div className="absolute inset-0 border-t-2 border-dashed border-white/10" />
            
            {/* Animated Flow Overlay */}
            <motion.div 
              animate={{ 
                left: ["0%", "100%"],
                opacity: [0, 1, 1, 0]
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity, 
                ease: "linear"
              }}
              className="absolute top-0 bottom-0 w-32 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/30 to-transparent z-10"
            />
          </div>

          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              variants={stepVariants}
              className="relative flex flex-col items-center text-center group"
            >
              {/* Refined Circle Container */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="mb-8 relative z-10 w-24 h-24 rounded-full flex items-center justify-center border border-white/10 bg-zinc-950 shadow-[0_0_40px_rgba(0,0,0,0.8)]"
              >
                {/* Subtle Breathing Animation */}
                <motion.div 
                  animate={{ opacity: [0.05, 0.15, 0.05] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: idx * 0.5 }}
                  className="absolute inset-[-10px] rounded-full bg-white/10 blur-xl"
                />
                
                <step.icon className="w-10 h-10 transition-all duration-700 group-hover:text-white" style={{ color: step.color }} />
                
                {/* Elegant Badge with soft appearance */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1, ease: "easeOut", delay: 1 + (idx * 0.3) }}
                  viewport={{ once: true }}
                  className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-white flex items-center justify-center text-black text-lg font-black border-4 border-black shadow-xl z-20"
                >
                  {step.badge}
                </motion.div>
              </motion.div>
              <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">{step.title}</h3>
              <p className="text-white/40 leading-relaxed max-w-[280px] font-medium transition-colors group-hover:text-white/60">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
