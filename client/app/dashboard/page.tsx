"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Activity,
  X,
  Sparkles,
  Loader2,
  MapPin,
  Users,
  Edit2,
  Save,
  Clock,
  CheckCircle2,
} from "lucide-react";
import AxiosInstance, { setAccessToken } from "@/config/AxiosInstance";
import ChatWidget from "../Components/ChatWidget";

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [queue, setQueue] = useState<any[]>([]);

  // Edit Profile State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    headline: "",
    location: "",
    profileUrl: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const urlToken = searchParams.get("accessToken");
    if (urlToken) {
      setAccessToken(urlToken);
      window.history.replaceState({}, document.title, "/dashboard");
    }

    const fetchUserData = async () => {
      if (typeof window !== "undefined") {
        const storedToken = localStorage.getItem("accessToken");
        if (!storedToken && !urlToken) {
          router.push("/");
          return;
        }
      }

      try {
        const response = await AxiosInstance.get("/users/me");
        setUser(response.data.user);
        setEditForm({
          headline: response.data.user.headline || "",
          location: response.data.user.location || "",
          profileUrl: response.data.user.profileUrl || "",
        });
      } catch (error: any) {
        console.error("Failed to fetch user data", error);
        if (error.response?.status === 401) {
          router.push("/");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [searchParams, router]);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await AxiosInstance.get("/users/campaigns/queue/status");
        if (res.data && res.data.queue) {
          setQueue(res.data.queue);
        }
      } catch (error) {}
    };

    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await AxiosInstance.put("/users/me", editForm);
      setUser(response.data.user);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Failed to update profile", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#ea580c] animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#ea580c] relative overflow-hidden flex">
      <div className="absolute top-0 left-0 w-[200vw] h-[200vh] bg-[#ea580c] rounded-full blur-[250px] opacity-[0.05] pointer-events-none"></div>

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
            <div className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="absolute top-4 right-4 z-20 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full transition-colors border border-white/10"
              >
                <Edit2 size={14} className="text-gray-300" />
              </button>

              <div className="h-32 bg-linear-to-br from-[#1a1a1a] to-[#ea580c]/20 relative">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[20px_20px]"></div>
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
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?q=80&w=200&auto=format&fit=crop";
                    }}
                  />
                </div>

                <div className="pt-14">
                  <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    {user.name}
                  </h2>
                  <p className="text-gray-300 text-sm mt-2 leading-relaxed font-light">
                    {user.headline === "AgentX User"
                      ? "Click edit to add your headline."
                      : user.headline}
                  </p>

                  <div className="flex flex-col gap-3 mt-5 pb-5 border-b border-white/10">
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                      <MapPin size={14} className="text-[#ea580c]" />
                      <span>{user.location || "Not Specified"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                      <Users size={14} className="text-[#ea580c]" />
                      <span>
                        <span className="font-bold text-white">
                          {user.connections > 0
                            ? user.connections.toLocaleString()
                            : "0"}
                        </span>{" "}
                        Connections
                      </span>
                    </div>
                  </div>

                  <div className="mt-5">
                    <span className="inline-block bg-[#ea580c]/10 text-[#ea580c] px-3 py-1 rounded-full text-xs font-medium border border-[#ea580c]/20">
                      Agent Active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#111]/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
              <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                <Activity size={16} /> Automation Overview
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-400">Total Sent (Today)</span>
                    <span className="text-white font-medium">
                      {queue.filter((q) => q.status === "sent").length} / 50
                    </span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5">
                    <div
                      className="bg-[#ea580c] h-1.5 rounded-full transition-all duration-1000"
                      style={{
                        width: `${(queue.filter((q) => q.status === "sent").length / 50) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-400">AI Brain Requests</span>
                    <span className="text-white font-medium">
                      {user.dailyAiRequests || 0} / 50
                    </span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5">
                    <div
                      className="bg-[#ea580c] h-1.5 rounded-full transition-all duration-1000"
                      style={{
                        width: `${((user.dailyAiRequests || 0) / 50) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-[#111]/40 border border-white/5 rounded-3xl h-full max-h-190 flex flex-col p-8 overflow-hidden relative scrollbar-small">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Bot size={20} className="text-[#ea580c]" /> Live Execution Feed
              </h3>

              {queue.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <Sparkles size={48} className="text-[#ea580c]/40 mb-4" />
                  <h3 className="text-xl font-medium text-white mb-2">
                    Awaiting Commands
                  </h3>
                  <p className="text-gray-500 text-sm max-w-md font-light">
                    Ask AgentX to find leads. They will automatically queue here
                    and be executed by your Chrome Extension.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                  <AnimatePresence>
                    {queue.map((lead, idx) => (
                      <motion.div
                        key={lead._id || idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 flex justify-between items-center"
                      >
                        <div>
                          <h4 className="text-white text-sm font-medium">
                            {lead.name}
                          </h4>
                          <p className="text-xs text-gray-500 truncate max-w-75">
                            '{lead.note}'
                          </p>
                        </div>

                        {lead.status === "pending" ? (
                          <div className="flex items-center gap-1.5 bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full border border-yellow-500/20 text-xs font-medium">
                            <Clock size={12} className="animate-spin-slow" />{" "}
                            Pending Extension
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full border border-emerald-500/20 text-xs font-medium">
                            <CheckCircle2 size={12} /> Sent
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111] border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl relative"
            >
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Edit2 size={18} className="text-[#ea580c]" /> Complete Profile
              </h2>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Headline
                  </label>
                  <input
                    type="text"
                    value={editForm.headline}
                    onChange={(e) =>
                      setEditForm({ ...editForm, headline: e.target.value })
                    }
                    placeholder="Software Developer | AI Enthusiast"
                    className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ea580c] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) =>
                      setEditForm({ ...editForm, location: e.target.value })
                    }
                    placeholder="City, Country"
                    className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ea580c] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="text"
                    value={editForm.profileUrl}
                    onChange={(e) =>
                      setEditForm({ ...editForm, profileUrl: e.target.value })
                    }
                    placeholder="https://linkedin.com/in/your-custom-slug"
                    className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ea580c] transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-[#ea580c] hover:bg-[#f97316] text-white py-3 rounded-xl font-medium transition-colors flex justify-center items-center gap-2 mt-6"
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <Save size={18} /> Save Changes
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ChatWidget user={user} />
    </div>
  );
}

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
