"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Chrome, Linkedin } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-pink-900 relative overflow-hidden">
      {/* Animated background glows */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>

      {/* Sign-in card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md p-8 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl"
      >
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI Career Agent
          </h1>
          <p className="text-gray-300">
            Your automated job application assistant
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full h-12 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-lg flex items-center justify-center gap-3 transition-all"
          >
            <Chrome className="w-5 h-5" />
            Continue with Google
          </Button>

          <Button
            onClick={() => signIn("linkedin", { callbackUrl: "/dashboard" })}
            className="w-full h-12 bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold rounded-lg flex items-center justify-center gap-3 transition-all"
          >
            <Linkedin className="w-5 h-5" />
            Continue with LinkedIn
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-400">
          By signing in, you agree to our Terms of Service
        </p>
      </motion.div>
    </div>
  );
}
