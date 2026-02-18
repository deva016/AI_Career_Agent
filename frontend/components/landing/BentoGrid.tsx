"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Zap, 
  ShieldCheck, 
  BarChart3, 
  Globe, 
  Cpu, 
  Layers 
} from "lucide-react";
import { useMotionValue, useMotionTemplate } from "framer-motion";

const features = [
  {
    title: "Job Finder Agent",
    description: "Scrapes top portals and career pages daily to find the hidden gems that match your profile.",
    icon: Cpu,
    className: "md:col-span-2",
  },
  {
    title: "Resume Architect",
    description: "RAG-driven tailoring that adapts your experience to every JD in seconds.",
    icon: Zap,
    className: "md:col-span-1",
  },
  {
    title: "Application Pilot",
    description: "Automate repetitive job forms with zero-trust browser orchestration.",
    icon: Globe,
    className: "md:col-span-1",
  },
  {
    title: "LinkedIn Strategist",
    description: "Profile optimization and scheduled content delivery to build your personal brand.",
    icon: ShieldCheck,
    className: "md:col-span-2",
  },
  {
    title: "Skill Gap Analysis",
    description: "Discover exactly what skills the market is demanding and get tailored learning paths.",
    icon: BarChart3,
    className: "md:col-span-1",
  },
  {
    title: "Interview Prep",
    description: "JD-specific Q&A generation to ensure you're ready for the most technical questions.",
    icon: Layers,
    className: "md:col-span-1",
  }
];

function FeatureCard({ feature, idx }: { feature: any, idx: number }) {
  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);

  function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      key={idx}
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: idx * 0.1 }}
      onMouseMove={onMouseMove}
      className={`group relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.03] p-8 transition-colors hover:border-white/10 ${feature.className}`}
    >
      {/* Spotlight Effect */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(139, 92, 246, 0.15),
              transparent 80%
            )
          `,
        }}
      />
      
      <div className="relative z-10">
        <div className="mb-4 inline-flex p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:border-white/20 transition-colors">
          <feature.icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
        <p className="text-white/50 leading-relaxed">{feature.description}</p>
      </div>
    </motion.div>
  );
}

export function BentoGrid() {
  return (
    <section id="features" className="py-24 px-6 md:px-12 bg-transparent">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-white mb-4"
          >
            Everything you need to build at scale.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-white/60 text-lg max-w-2xl mx-auto"
          >
            A cohesive ecosystem of AI agents and automation tools designed to accelerate your career growth.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <FeatureCard key={idx} feature={feature} idx={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}
