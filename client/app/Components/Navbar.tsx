import { Bot } from "lucide-react";

const Navbar = ({ headerRef }: { headerRef: any }) => {
  return (
    <>
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
    </>
  );
};

export default Navbar;
