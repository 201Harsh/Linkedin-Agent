"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Send,
  MapPin,
  Briefcase,
  Users,
  Activity,
  X,
  MessageSquare,
  Sparkles,
  Link as LinkIcon,
} from "lucide-react";

export default function DashboardPage() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "agent",
      text: "AgentX online. I have analyzed your profile. Ready to find targets or write connection notes?",
    },
  ]);

  const suggestions = [
    "Find Web Dev HRs",
    "List Tech Startups",
    "Optimize Bio",
  ];

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setChatInput("");

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text: "Searching Tavily for your targets now. I will line them up for connection.",
        },
      ]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#ea580c] relative overflow-hidden flex">
      {/* Ambient Background Glow */}
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-[#ea580c] rounded-full blur-[250px] opacity-[0.05] pointer-events-none"></div>

      <main className="flex-1 p-8 md:p-12 relative z-10 w-full max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-12 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#ea580c]/10 p-2.5 rounded-xl border border-[#ea580c]/20">
              <Bot size={24} className="text-[#ea580c]" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Command Center
              </h1>
              <p className="text-sm text-gray-400 font-light">
                Manage your automated networking
              </p>
            </div>
          </div>
          <button className="bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-2.5 rounded-full text-sm font-medium transition-all">
            Settings
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN: The Fixed Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              {/* Profile Banner */}
              <div className="h-32 bg-gradient-to-br from-[#1a1a1a] to-[#ea580c]/20 relative">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
              </div>

              <div className="relative px-8 pb-8">
                {/* Fixed Avatar Overlap */}
                <div className="absolute -top-12 left-8 w-24 h-24 bg-[#050505] border-4 border-[#111] rounded-full flex items-center justify-center overflow-hidden shadow-xl z-10">
                  <img
                    src="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?q=80&w=200&auto=format&fit=crop"
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Added pt-14 to push text below the absolute avatar */}
                <div className="pt-14">
                  <h2 className="text-2xl font-bold tracking-tight text-white">
                    Harsh Pandey
                  </h2>
                  <p className="text-gray-400 text-sm mt-2 leading-relaxed font-light">
                    Full Stack Developer across Web, Mobile & Desktop | Building
                    AI-Enhanced Apps & AI Agents
                  </p>

                  <div className="flex flex-col gap-3 mt-5 pb-5 border-b border-white/10">
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                      <MapPin size={14} className="text-[#ea580c]" />
                      <span>Nainital, Uttarakhand, India</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                      <Users size={14} className="text-[#ea580c]" />
                      <span>
                        <span className="font-bold text-white">2,013</span>{" "}
                        Followers
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                      <LinkIcon size={14} className="text-[#ea580c]" />
                      <a href="#" className="text-blue-400 hover:underline">
                        Contact Info
                      </a>
                    </div>
                  </div>

                  <div className="mt-5">
                    <span className="inline-block bg-[#ea580c]/10 text-[#ea580c] px-3 py-1 rounded-full text-xs font-medium border border-[#ea580c]/20">
                      Open to work
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Card */}
            <div className="bg-[#111]/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
              <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                <Activity size={16} /> Campaign Status
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-400">Requests Sent (Today)</span>
                    <span className="text-white font-medium">42 / 50</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5">
                    <div className="bg-[#ea580c] h-1.5 rounded-full w-[84%]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Campaign Feed */}
          <div className="lg:col-span-2">
            <div className="bg-[#111]/40 border border-white/5 border-dashed rounded-3xl h-full min-h-[500px] flex flex-col items-center justify-center text-center p-8">
              <Sparkles size={48} className="text-[#ea580c]/40 mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">
                No Active Campaigns
              </h3>
              <p className="text-gray-500 text-sm max-w-md font-light">
                Open the AgentX chatbot in the bottom right to start searching
                for targets and initiating your automated outreach.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* --- FLOATING CHATBOT WIDGET --- */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-[#111]/95 backdrop-blur-2xl border border-white/10 w-[450px] h-[650px] rounded-3xl shadow-2xl mb-4 flex flex-col overflow-hidden scrollbar-small"
            >
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 bg-gradient-to-r from-[#1a1a1a] to-[#ea580c]/10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#ea580c] rounded-full flex items-center justify-center">
                    <Bot size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">AgentX</h3>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                        Online
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors bg-white/5 p-1.5 rounded-full"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm font-light leading-relaxed ${
                        msg.role === "user"
                          ? "bg-[#ea580c] text-white rounded-tr-sm"
                          : "bg-white/5 border border-white/10 text-gray-200 rounded-tl-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Suggestions */}
              <div className="px-4 py-2 flex gap-2 overflow-x-auto border-t border-white/5 scrollbar-small">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(suggestion)}
                    className="whitespace-nowrap bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs px-3 py-1.5 rounded-full transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-white/10 bg-[#0a0a0a]">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage(chatInput);
                  }}
                  className="relative"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask AgentX to find HRs..."
                    className="w-full bg-[#111] border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-[#ea580c] transition-colors"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#ea580c] hover:bg-[#f97316] rounded-lg text-white transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-14 h-14 bg-[#ea580c] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(234,88,12,0.4)] hover:shadow-[0_0_30px_rgba(234,88,12,0.6)] transition-shadow relative z-50"
        >
          {isChatOpen ? (
            <X size={24} className="text-white" />
          ) : (
            <MessageSquare size={24} className="text-white" />
          )}
          {!isChatOpen && (
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-white border-2 border-[#050505] rounded-full"></span>
          )}
        </motion.button>
      </div>
    </div>
  );
}
