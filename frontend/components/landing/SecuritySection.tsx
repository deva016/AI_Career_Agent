"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Lock, 
  Key, 
  FileCheck, 
  UserPlus, 
  History, 
  Award,
  ShieldCheck
} from "lucide-react";

const securityFeatures = [
  { title: "End-to-End Encryption", icon: Lock },
  { title: "Zero Trust Architecture", icon: ShieldCheck },
  { title: "SOC 2 Type II", icon: Award },
  { title: "GDPR Compliant", icon: FileCheck },
  { title: "Role-Based Access", icon: UserPlus },
  { title: "Audit Logs", icon: History },
];

export function SecuritySection() {
  return (
    <section id="security" className="py-24 px-6 md:px-12 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-16 items-center">
          <div className="md:w-1/2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="mb-6 inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                <Key className="w-6 h-6 text-cyan-400" />
              </div>
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">Career privacy you can trust.</h2>
              <p className="text-white/60 text-xl leading-relaxed mb-8">
                Your professional journey is private. We've built a zero-trust infrastructure that ensures your resume data and job search activity are isolated and encrypted.
              </p>
              <div className="grid grid-cols-2 gap-y-6">
                {securityFeatures.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-cyan-400" />
                    <span className="text-white/80 font-medium">{item.title}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Visual Representation of Security */}
          <div className="md:w-1/2 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative p-12 rounded-[3rem] border border-white/5 bg-gradient-to-br from-white/[0.05] to-transparent"
            >
              <div className="absolute inset-0 bg-cyan-500/10 blur-[100px] rounded-full" />
              <div className="relative z-10 aspect-square flex items-center justify-center">
                <div className="w-full h-full border-[20px] border-white/5 rounded-full flex items-center justify-center animate-pulse">
                   <div className="w-3/4 h-3/4 border-[15px] border-white/5 rounded-full flex items-center justify-center">
                      <Lock className="w-24 h-24 text-white opacity-20" />
                   </div>
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block mb-2">Certified</span>
                <span className="text-3xl font-black text-white">ISO 27001</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
