"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const EXAMPLES = ["TCS", "Infosys", "Zomato", "HDFC Bank", "Reliance"];

export default function Home() {
  const [company, setCompany] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = company.trim();
    if (trimmed) router.push(`/report/${encodeURIComponent(trimmed)}`);
  };

  return (
    <main className="min-h-screen bg-black flex flex-col text-white font-sans">
      {/* ── Navigation ──────────────────────────────── */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-[#222]">
        <div className="flex items-center gap-1">
          <span className="font-bold text-lg tracking-tighter">TRADING</span>
          <span className="font-light text-lg tracking-tighter text-[#888]">SPACE</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-[#888]">
          <span className="hover:text-white cursor-pointer transition-colors">Products</span>
          <span className="hover:text-white cursor-pointer transition-colors">Solutions</span>
          <span className="hover:text-white cursor-pointer transition-colors">Intelligence</span>
          <button className="bg-[#FF5B22] text-white px-5 py-2 rounded-full hover:bg-[#e44a16] transition-colors">
            Contact
          </button>
        </div>
      </nav>

      {/* ── Hero Section ────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto px-6 py-20 text-center">
        <div className="inline-block px-3 py-1 mb-10 border border-[#333] rounded-full">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF5B22]">
            Autonomous Market Research
          </span>
        </div>

        <h1 className="text-5xl md:text-8xl font-bold leading-[1.05] tracking-tight mb-8">
          Passionate Market<br />
          <span className="text-[#FF5B22]">Intelligence</span>
        </h1>

        <p className="text-lg md:text-xl text-[#888] max-w-2xl leading-relaxed mb-16">
          Advanced autonomous systems developed for clean, proven and innovative 
          market data implementation. Research any company instantly with live 
          web searching and financial synthesis.
        </p>

        {/* ── Search Implementation ───────────────────── */}
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-xl group relative mb-20"
        >
          <div className="flex bg-[#111] border border-[#222] group-focus-within:border-[#FF5B22]/50 transition-all duration-300">
            <input
              type="text"
              placeholder="ENTER COMPANY NAME OR TICKER..."
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="flex-1 bg-transparent px-8 py-6 text-sm font-medium tracking-widest uppercase outline-none"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!company.trim()}
              className="bg-[#FF5B22] px-10 py-6 text-xs font-black uppercase tracking-[0.2em] hover:bg-[#e44a16] disabled:opacity-30 transition-all"
            >
              Analyze
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#555]">
              Popular queries
            </span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => router.push(`/report/${encodeURIComponent(ex)}`)}
                className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 border border-[#222] hover:border-[#FF5B22] hover:text-[#FF5B22] transition-all"
              >
                {ex}
              </button>
            ))}
          </div>
        </form>

        {/* ── Stats Strip ────────────────────────────── */}
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-8 pt-20 border-t border-[#111]">
          {[
            { label: "Live Sources", value: "20+" },
            { label: "Global Coverage", value: "100%" },
            { label: "Processing Speed", value: "< 60s" },
            { label: "Data Points", value: "2.5M" },
          ].map((stat) => (
            <div key={stat.label} className="text-left group">
              <div className="h-px w-0 bg-[#FF5B22] mb-4 group-hover:w-full transition-all duration-500" />
              <p className="text-3xl font-bold mb-1 tracking-tighter">{stat.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#555]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Branding Footer ─────────────────────────── */}
      <footer className="px-8 py-10 bg-[#080808] border-t border-[#111]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-1 opacity-40">
            <span className="font-bold text-xs tracking-tighter">TRADING</span>
            <span className="font-light text-xs tracking-tighter">SPACE</span>
            <span className="ml-2 text-[10px]">© 2026</span>
          </div>
          <div className="flex gap-10 text-[10px] font-bold uppercase tracking-widest text-[#444]">
            <span className="hover:text-white cursor-pointer">Privacy</span>
            <span className="hover:text-white cursor-pointer">Terms</span>
            <span className="hover:text-white cursor-pointer">Security</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
