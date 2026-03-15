"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  ArrowRight,
  Bot,
  Target,
  Zap,
  Users,
  ShieldCheck,
  CheckCircle2,
  BarChart,
} from "lucide-react";

const LandingPage = () => {
  const heroRef = useRef<any>(null);
  const textRefs = useRef<any>([]);
  const headerRef = useRef<any>(null);

  useGSAP(
    () => {
      gsap.from(headerRef.current, {
        y: -80,
        opacity: 0,
        duration: 1,
        ease: "power4.out",
      });

      gsap.from(textRefs.current, {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: "power4.out",
        delay: 0.2,
      });
    },
    { scope: heroRef },
  );

  const addToRefs = (el: any) => {
    if (el && !textRefs.current.includes(el)) {
      textRefs.current.push(el);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#ea580c] selection:text-white relative overflow-x-hidden">
      {/* Background linears & Grid */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-250 h-150 bg-[#ea580c] rounded-full blur-[250px] opacity-[0.12] pointer-events-none"></div>
      <div className="fixed inset-0 bg-[linear-linear(rgba(255,255,255,0.02)_1px,transparent_1px),linear-linear(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[64px_64px] pointer-events-none"></div>

      <nav
        ref={headerRef}
        className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-8 py-4 flex justify-between items-center z-50 shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
      >
        <div className="flex items-center gap-2 cursor-pointer">
          <Bot size={24} className="text-white" />
          <span className="text-xl font-medium tracking-wide text-white">
            Agent<span className="text-[#ea580c] font-bold">X</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-10 text-sm font-medium text-gray-400">
          <a href="#home" className="hover:text-white transition-colors">
            Home
          </a>
          <a href="#features" className="hover:text-white transition-colors">
            Features
          </a>
          <a href="#workflow" className="hover:text-white transition-colors">
            How it Works
          </a>
          <a href="#impact" className="hover:text-white transition-colors">
            Impact
          </a>
        </div>

        <button className="bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-6 py-2 rounded-full border border-white/10 transition-all">
          Sign In
        </button>
      </nav>

      <main
        ref={heroRef}
        id="home"
        className="relative pt-48 pb-24 flex flex-col items-center justify-center text-center px-4 z-10"
      >
        <p
          ref={addToRefs}
          className="text-[#ea580c] tracking-[0.2em] text-xs font-semibold mb-8 uppercase"
        >
          Automate. Connect. Get Hired.
        </p>

        <h1
          ref={addToRefs}
          className="text-5xl md:text-7xl lg:text-[80px] font-medium tracking-tight max-w-5xl leading-[1.18] mb-8 text-white"
        >
          Automate Your Network
          <br className="hidden md:block" />
          With AI-Powered{" "}
          <span className="border border-[#ea580c]/60 bg-[#ea580c]/10 text-white px-3 pb-1 rounded-lg">
            Precision!
          </span>
        </h1>

        <p
          ref={addToRefs}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 font-light"
        >
          Join a growing community of professionals preparing for real-world
          tech careers by automating their outreach.
        </p>

        <div
          ref={addToRefs}
          className="flex items-center gap-4 mb-12 bg-white/5 border border-white/10 px-6 py-3 rounded-full backdrop-blur-sm"
        >
          <div className="flex -space-x-3">
            <img
              className="w-8 h-8 rounded-full border-2 border-[#050505]"
              src="https://i.pravatar.cc/100?img=11"
              alt="User"
            />
            <img
              className="w-8 h-8 rounded-full border-2 border-[#050505]"
              src="https://i.pravatar.cc/100?img=12"
              alt="User"
            />
            <img
              className="w-8 h-8 rounded-full border-2 border-[#050505]"
              src="https://i.pravatar.cc/100?img=13"
              alt="User"
            />
          </div>
          <p className="text-sm text-gray-300 font-medium">
            <span className="text-[#ea580c] font-semibold">10,000+</span>{" "}
            Connections made
          </p>
        </div>

        <div ref={addToRefs}>
          <button className="flex items-center justify-center gap-2 bg-[#ea580c] hover:bg-[#f97316] text-white px-8 py-4 rounded-xl font-medium text-lg transition-all shadow-[0_0_20px_rgba(234,88,12,0.3)] hover:shadow-[0_0_30px_rgba(234,88,12,0.5)]">
            Start Journey <ArrowRight size={20} />
          </button>
        </div>
      </main>

      <section
        id="features"
        className="py-24 relative z-10 border-t border-white/5"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-medium mb-4">
              Built For <span className="text-[#ea580c]">Scale</span>
            </h2>
            <p className="text-gray-400">
              Everything you need to run automated outreach campaigns.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Target,
                title: "Smart Targeting",
                desc: "Find the exact HRs, Founders, or Students using deep data searches.",
              },
              {
                icon: Bot,
                title: "AI Categorization",
                desc: "Our LLM sorts your targets into specific buckets for tailored messaging.",
              },
              {
                icon: Zap,
                title: "Auto-Connect",
                desc: "Seamlessly dispatch requests and custom notes without lifting a finger.",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-[#111]/50 border border-white/10 p-8 rounded-2xl hover:border-[#ea580c]/50 transition-colors group"
              >
                <div className="bg-[#ea580c]/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6 border border-[#ea580c]/20 group-hover:scale-110 transition-transform">
                  <feature.icon size={28} className="text-[#ea580c]" />
                </div>
                <h3 className="text-xl font-medium text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed font-light">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SECTION 2: HOW IT WORKS --- */}
      <section id="workflow" className="py-24 relative z-10 bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-medium mb-16">
            How AgentX Works
          </h2>
          <div className="flex flex-col md:flex-row items-start justify-center gap-8 relative">
            <div className="hidden md:block absolute top-8 left-1/4 right-1/4 h-px bg-linear-to-r from-transparent via-[#ea580c]/50 to-transparent"></div>

            {[
              {
                step: "01",
                icon: ShieldCheck,
                title: "Auth & Sync",
                desc: "Securely connect your LinkedIn profile.",
              },
              {
                step: "02",
                icon: BarChart,
                title: "AI Analysis",
                desc: "Agent reads your profile to find ideal matches.",
              },
              {
                step: "03",
                icon: Users,
                title: "Engage",
                desc: "Sit back while we send targeted requests.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center relative z-10"
              >
                <div className="w-16 h-16 bg-[#111] border border-white/10 rounded-full flex items-center justify-center mb-6 text-[#ea580c] shadow-[0_0_15px_rgba(234,88,12,0.2)]">
                  <item.icon size={28} />
                </div>
                <div className="text-3xl font-bold text-white/5 mb-2">
                  {item.step}
                </div>
                <h4 className="text-lg font-medium text-white mb-2">
                  {item.title}
                </h4>
                <p className="text-sm text-gray-400 font-light max-w-50">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SECTION 3: COMPARISON --- */}
      <section className="py-24 relative z-10 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-medium mb-4">
              The Old Way vs <span className="text-[#ea580c]">AgentX</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-red-500/5 border border-red-500/10 p-8 rounded-2xl">
              <h3 className="text-xl font-medium text-red-400 mb-6">
                Manual Networking
              </h3>
              <ul className="space-y-4">
                {[
                  "Hours spent searching for HRs",
                  "Generic connection notes",
                  "Low acceptance rate",
                  "High risk of burnout",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-gray-400 font-light"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500/50"></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[#ea580c]/5 border border-[#ea580c]/20 p-8 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#ea580c] blur-[80px] opacity-20"></div>
              <h3 className="text-xl font-medium text-[#ea580c] mb-6">
                AgentX Automation
              </h3>
              <ul className="space-y-4 relative z-10">
                {[
                  "Instant AI-driven discovery",
                  "Hyper-personalized messaging",
                  "Maximum conversion rate",
                  "Runs while you sleep",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-white font-light"
                  >
                    <CheckCircle2 size={18} className="text-[#ea580c]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="impact" className="py-24 relative z-10 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/10">
            {[
              { label: "Connections Sent", value: "50K+" },
              { label: "Acceptance Rate", value: "48%" },
              { label: "Hours Saved", value: "2,000+" },
              { label: "Active Agents", value: "99.9%" },
            ].map((stat, idx) => (
              <div key={idx} className="text-center px-4">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-[#ea580c] uppercase tracking-wider font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pt-24 pb-8 relative z-10 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center mb-24">
          <div className="bg-linear-to-b from-[#111] to-[#050505] border border-white/10 p-12 rounded-3xl relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#ea580c] blur-[150px] opacity-10 pointer-events-none"></div>
            <h2 className="text-4xl font-medium text-white mb-6 relative z-10">
              Ready to scale your network?
            </h2>
            <p className="text-gray-400 mb-8 relative z-10">
              Join the elite group of professionals automating their success.
            </p>
            <button className="relative z-10 bg-[#ea580c] hover:bg-[#f97316] text-white px-10 py-4 rounded-xl font-medium text-lg transition-all">
              Connect LinkedIn Now
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="max-w-6xl mx-auto px-6 border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Bot size={18} />
            <span>© 2026 AgentX. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Contact
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
