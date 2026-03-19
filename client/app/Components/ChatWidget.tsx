"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Send,
  X,
  MessageSquare,
  Link as LinkIcon,
  Sparkles,
  Server,
} from "lucide-react";
import AxiosInstance from "@/config/AxiosInstance";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "agent" | "user";
  text: string;
}

const LeadCard = ({
  lead,
}: {
  lead: { name: string; url: string; note: string };
}) => {
  return (
    <div className="bg-[#050505] border border-white/10 rounded-xl p-4 mb-3 last:mb-0 shadow-lg relative overflow-hidden group">
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-white font-semibold text-sm truncate pr-4">
          {lead.name}
        </h4>
        <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
          <Server size={10} /> Auto-Queued
        </span>
      </div>
      <div className="bg-[#111] p-3 rounded-lg border border-white/5">
        <p className="text-gray-400 text-xs italic">"{lead.note}"</p>
      </div>
    </div>
  );
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-msg",
      role: "agent",
      text: "AgentX online. Tell me who to find, and I will automatically queue them for background connection.",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const suggestions = [
    "Find Web Dev HRs",
    "List Tech Startups in BLR",
    "Optimize Bio",
  ];

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsgId = Date.now().toString();
    setMessages((prev) => [...prev, { id: userMsgId, role: "user", text }]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await AxiosInstance.post("/ai/agentx", { prompt: text });
      const aiText = response.data.response;

      // We parse the JSON immediately. If leads exist, we POST them to the backend silently.
      const codeBlockMarker = "```";
      const regex = new RegExp(
        codeBlockMarker + "(?:json)?\\s*([\\s\\S]*?)\\s*" + codeBlockMarker,
      );
      const jsonMatch = aiText.match(regex);

      if (jsonMatch) {
        try {
          const data = JSON.parse(jsonMatch[1]);
          if (data.leads && Array.isArray(data.leads)) {
            await Promise.all(
              data.leads.map((lead: any) =>
                AxiosInstance.post("/users/campaigns/queue", {
                  name: lead.name,
                  url: lead.url,
                  note: lead.note,
                }).catch((e) => console.error("Failed to auto-queue:", e)),
              ),
            );
          }
        } catch (e) {
          console.error("Zero-click parsing failed:", e);
        }
      }

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "agent", text: aiText },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "agent",
          text: "⚠️ Connection to AgentX lost. Please check network.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessageContent = (text: string) => {
    const codeBlockMarker = "```";
    const regex = new RegExp(
      codeBlockMarker + "(?:json)?\\s*([\\s\\S]*?)\\s*" + codeBlockMarker,
    );
    const jsonMatch = text.match(regex);

    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        if (data.leads && Array.isArray(data.leads)) {
          return (
            <div className="mt-1">
              <p className="text-emerald-500 text-xs font-bold mb-3 tracking-wider uppercase flex items-center gap-1.5">
                <Server size={12} /> Successfully Queued to Dashboard
              </p>
              {data.leads.map((lead: any, idx: number) => (
                <LeadCard key={idx} lead={lead} />
              ))}
            </div>
          );
        }
      } catch (e) {
      }
    }

    return (
      <ReactMarkdown
        components={{
          a: ({ node, ...props }) => (
            <a
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline font-medium flex items-center gap-1"
              {...props}
            >
              {props.children} <LinkIcon size={10} />
            </a>
          ),
          p: ({ node, ...props }) => (
            <p className="mb-2 last:mb-0" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul
              className="list-disc ml-4 mb-2 space-y-1 text-gray-300"
              {...props}
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              className="list-decimal ml-4 mb-2 space-y-1 text-gray-300"
              {...props}
            />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-semibold text-white" {...props} />
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-100 flex flex-col items-end scrollbar-small">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{
              opacity: 0,
              y: 40,
              scale: 0.9,
              transformOrigin: "bottom right",
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="bg-[#111]/95 backdrop-blur-3xl border border-white/10 w-100 h-150 sm:w-112.5 sm:h-162.5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] mb-6 flex flex-col overflow-hidden"
          >
            <div className="p-4 border-b border-white/10 bg-linear-to-r from-[#1a1a1a] to-[#ea580c]/15 flex justify-between items-center shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-linear-to-br from-[#ea580c] to-[#c2410c] rounded-full flex items-center justify-center shadow-inner">
                  <Bot size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    AgentX
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
                      Autonomous Mode
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white hover:bg-white/10 transition-all p-2 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5 flex flex-col scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-[14px] font-light leading-relaxed shadow-sm ${msg.role === "user" ? "bg-linear-to-br from-[#ea580c] to-[#c2410c] text-white rounded-tr-sm" : "bg-white/5 border border-white/10 text-gray-200 rounded-tl-sm w-full"}`}
                    >
                      {msg.role === "user"
                        ? msg.text
                        : renderMessageContent(msg.text)}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {isTyping && (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-5 py-4 flex gap-1.5 items-center w-fit">
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.6,
                        ease: "easeInOut",
                      }}
                      className="w-1.5 h-1.5 bg-[#ea580c] rounded-full"
                    />
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.6,
                        ease: "easeInOut",
                        delay: 0.2,
                      }}
                      className="w-1.5 h-1.5 bg-[#ea580c] rounded-full"
                    />
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.6,
                        ease: "easeInOut",
                        delay: 0.4,
                      }}
                      className="w-1.5 h-1.5 bg-[#ea580c] rounded-full"
                    />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-4 py-3 flex gap-2 overflow-x-auto border-t border-white/5 bg-[#0a0a0a]/50 scrollbar-hide">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(suggestion)}
                  disabled={isTyping}
                  className="whitespace-nowrap bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs px-4 py-2 rounded-full transition-all disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="p-4 border-t border-white/10 bg-[#0a0a0a]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(input);
                }}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isTyping}
                  placeholder="Command AgentX..."
                  className="w-full bg-[#111] border border-white/10 rounded-xl pl-4 pr-12 py-3.5 text-sm text-white focus:outline-none focus:border-[#ea580c] transition-colors disabled:opacity-50 shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="absolute right-2 p-2 bg-[#ea580c] hover:bg-[#f97316] disabled:bg-gray-700 disabled:text-gray-400 rounded-lg text-white transition-all shadow-md"
                >
                  <Send
                    size={16}
                    className={
                      input.trim() && !isTyping
                        ? "translate-x-0.5 -translate-y-0.5 transition-transform"
                        : ""
                    }
                  />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-linear-to-br from-[#ea580c] to-[#c2410c] rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(234,88,12,0.4)] hover:shadow-[0_0_35px_rgba(234,88,12,0.6)] transition-shadow relative z-50 border border-white/10"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={26} className="text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageSquare size={26} className="text-white" />
            </motion.div>
          )}
        </AnimatePresence>
        {!isOpen && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-[#050505] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
        )}
      </motion.button>
    </div>
  );
}
