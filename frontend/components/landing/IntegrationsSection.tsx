"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Github, 
  Database, 
  MessageSquare,
  Code,
  Link2,
  Briefcase,
  FileText,
  Globe
} from "lucide-react";

const integrations = [
  { name: "LinkedIn", icon: Link2, color: "#0077B5" },
  { name: "Indeed", icon: Briefcase, color: "#2164f3" },
  { name: "Glassdoor", icon: Globe, color: "#0CAA41" },
  { name: "PDF Resume", icon: FileText, color: "#FF4500" },
  { name: "PostgreSQL", icon: Database, color: "#336791" },
  { name: "GitHub", icon: Github, color: "#FFFFFF" },
  { name: "Support", icon: MessageSquare, color: "#FF4500" },
  { name: "API", icon: Code, color: "#007ACC" },
];

export function IntegrationsSection() {
  return (
    <section id="integrations" className="py-24 px-6 md:px-12 bg-transparent">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-white mb-4"
          >
            Connect to your ecosystem.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-white/60 text-lg max-w-2xl mx-auto"
          >
            CareerAgent AI seamlessly integrates with your professional profiles and top job boards.
          </motion.p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {integrations.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -5 }}
              className="flex flex-col items-center gap-4 group cursor-pointer"
            >
              <div 
                className="w-16 h-16 md:w-20 md:h-20 rounded-3xl flex items-center justify-center border border-white/10 bg-white/5 group-hover:border-white/20 transition-all duration-300 shadow-lg group-hover:shadow-primary/5"
              >
                <item.icon className="w-8 h-8 md:w-10 md:h-10 transition-transform group-hover:scale-110" style={{ color: item.color }} />
              </div>
              <span className="text-white/60 font-medium group-hover:text-white transition-colors">
                {item.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
