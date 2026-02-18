"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import { Bot, LogIn, Settings as SettingsIcon, User } from "lucide-react";

export function NexusNavbar() {
  const { data: session } = useSession();

  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl rounded-full border border-white/10 bg-black/40 backdrop-blur-xl px-6 py-3 flex items-center justify-between shadow-[0_0_50px_rgba(0,0,0,0.5)]"
    >
      <div className="flex items-center gap-3 group cursor-pointer">
        <div className="relative">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg shadow-primary/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="absolute inset-0 rounded-xl bg-primary blur-md -z-10 opacity-50 group-hover:opacity-100 transition-opacity" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white transition-all group-hover:tracking-normal">
          AI Career Agent
        </span>
      </div>

      <nav className="hidden lg:flex items-center gap-10 text-[13px] font-semibold tracking-wide uppercase text-white/50">
        <Link href="#features" className="hover:text-white transition-all hover:scale-105">Features</Link>
        <Link href="#how-it-works" className="hover:text-white transition-all hover:scale-105">Workflow</Link>
        {session && (
          <Link href="/dashboard" className="hover:text-white transition-all hover:scale-105 text-primary">Dashboard</Link>
        )}
      </nav>

      <div className="flex items-center gap-3">
        {session ? (
          <>
            <Link href="/settings">
              <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/5 font-bold text-xs uppercase tracking-widest gap-2">
                <User className="w-3 h-3" />
                Profile
              </Button>
            </Link>
            <Button 
              onClick={() => signOut()}
              variant="outline" 
              className="border-white/10 text-white hover:bg-white/5 font-bold text-xs uppercase tracking-widest rounded-full px-6"
            >
              Sign Out
            </Button>
          </>
        ) : (
          <>
            <Link href="/auth/signin">
              <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/5 font-bold text-xs uppercase tracking-widest gap-2">
                <LogIn className="w-3 h-3" />
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button className="bg-white text-black hover:bg-zinc-200 font-bold text-xs uppercase tracking-widest rounded-full px-8 shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-transform hover:scale-105">
                Join Waitlist
              </Button>
            </Link>
          </>
        )}
      </div>
    </motion.header>
  );
}
