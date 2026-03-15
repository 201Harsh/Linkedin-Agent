"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bot, Linkedin, ShieldCheck, Zap } from "lucide-react";

export default function LoginPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center relative overflow-hidden font-sans selection:bg-[#ea580c]">
      {/* Ambient Glow - Mixing Agency Orange with LinkedIn Blue */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-[#ea580c] rounded-full blur-[200px] opacity-[0.12] pointer-events-none"></div>
      <div className="absolute top-1/4 right-1/4 w-100 h-100 bg-[#0a66c2] rounded-full blur-[180px] opacity-[0.08] pointer-events-none"></div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md p-8 relative z-10"
      >
        <motion.div
          variants={itemVariants}
          className="flex justify-center mb-10"
        >
          <Link href="/" className="flex items-center gap-2 group">
            <Bot
              size={32}
              className="text-white group-hover:text-[#ea580c] transition-colors duration-300"
            />
            <span className="text-3xl font-medium tracking-wide text-white">
              Agent<span className="text-[#ea580c] font-bold">X</span>
            </span>
          </Link>
        </motion.div>

        <motion.div variants={itemVariants} className="relative group">
          {/* Animated Highlight Border */}
          <div className="absolute -inset-0.5 bg-linear-to-r from-[#ea580c] to-[#0a66c2] rounded-3xl blur opacity-30 group-hover:opacity-70 transition duration-1000 group-hover:duration-300"></div>

          <div className="relative bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 p-10 rounded-3xl shadow-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-[#111] border border-white/5 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
              <Linkedin size={32} className="text-[#0a66c2]" />
            </div>

            <h1 className="text-3xl font-semibold mb-3 text-white tracking-tight">
              Welcome Back
            </h1>
            <p className="text-sm text-gray-400 font-light mb-10">
              Authenticate securely with LinkedIn to access your automated AI
              campaigns.
            </p>

            {/* The Big LinkedIn Button with Framer Physics */}
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-3 bg-[#0a66c2] hover:bg-[#004182] text-white py-4 rounded-xl font-medium transition-colors shadow-[0_0_20px_rgba(10,102,194,0.3)] hover:shadow-[0_0_40px_rgba(10,102,194,0.6)] border border-[#0a66c2]/50"
            >
              <Linkedin size={22} />
              <span className="text-lg tracking-wide">
                Sign in with LinkedIn
              </span>
            </motion.button>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-6 mt-10 text-xs text-gray-500 font-medium">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-[#ea580c]" />
                <span>Secure Auth</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap size={16} className="text-[#ea580c]" />
                <span>1-Click Sync</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-8 text-center">
          <p className="text-sm text-gray-400 font-light">
            New to AgentX?{" "}
            <Link
              href="/register"
              className="text-[#ea580c] font-medium hover:text-white transition-colors duration-300"
            >
              Create an account
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
