"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Send,
  Activity,
  X,
  MessageSquare,
  Sparkles,
  Loader2,
} from "lucide-react";
import AxiosInstance, { setAccessToken } from "@/config/AxiosInstance";

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    // 1. Check URL for token (first-time login)
    const urlToken = searchParams.get("accessToken");

    if (urlToken) {
      setAccessToken(urlToken);
      // Clean the URL silently so the user doesn't see the token
      window.history.replaceState({}, document.title, "/dashboard");
    }

    // 2. Fetch User Data (Axios interceptor handles refresh automatically if needed)
    const fetchUserData = async () => {
      try {
        const response = await AxiosInstance.get("/users/me");
        setUser(response.data.user);
      } catch (error) {
        console.error("Failed to fetch user data", error);
        // Error handling is managed by Axios Interceptor (redirects to login)
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [searchParams]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#ea580c] animate-spin" />
      </div>
    );
  }

  // Fallback if user somehow bypasses loading without data
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#ea580c] relative overflow-hidden flex">
      {/* Ambient Background Glow */}
      <div className="absolute top-0 left-0 w-200 h-200 bg-[#ea580c] rounded-full blur-[250px] opacity-[0.05] pointer-events-none"></div>

      <main className="flex-1 p-8 md:p-12 relative z-10 w-full max-w-7xl mx-auto">
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
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <div className="h-32 bg-linear-to-br from-[#1a1a1a] to-[#ea580c]/20 relative">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
              </div>

              <div className="relative px-8 pb-8">
                <div className="absolute -top-12 left-8 w-24 h-24 bg-[#050505] border-4 border-[#111] rounded-full flex items-center justify-center overflow-hidden shadow-xl z-10">
                  <img
                    src={
                      user.avatar ||
                      "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?q=80&w=200&auto=format&fit=crop"
                    }
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="pt-14">
                  <h2 className="text-2xl font-bold tracking-tight text-white">
                    {user.name}
                  </h2>
                  <p className="text-gray-400 text-sm mt-2 leading-relaxed font-light">
                    {user.email}
                  </p>

                  <div className="mt-5">
                    <span className="inline-block bg-[#ea580c]/10 text-[#ea580c] px-3 py-1 rounded-full text-xs font-medium border border-[#ea580c]/20">
                      Agent Active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign Status Widget */}
            <div className="bg-[#111]/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
              <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                <Activity size={16} /> Campaign Status
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-400">Requests Sent (Today)</span>
                    <span className="text-white font-medium">0 / 50</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5">
                    <div className="bg-[#ea580c] h-1.5 rounded-full w-[0%]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
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

      {/* FLOATING CHATBOT WIDGET (Kept identical to your design) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-[#111]/95 backdrop-blur-2xl border border-white/10 w-[450px] h-[650px] rounded-3xl shadow-2xl mb-4 flex flex-col overflow-hidden"
            >
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

              <div className="px-4 py-2 flex gap-2 overflow-x-auto border-t border-white/5">
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

// 2. Wrap the entire page in a Suspense boundary for Next.js build compliance
export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#ea580c] animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
