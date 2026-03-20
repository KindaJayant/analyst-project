"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const EXAMPLES = ["TCS", "INFY.NS", "ZOMATO.NS", "AAPL", "RELIANCE.NS"];

export default function Home() {
  const [company, setCompany] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = company.trim();
    if (trimmed) router.push(`/report/${encodeURIComponent(trimmed)}`);
  };

  return (
    <main className="h-screen bg-black flex flex-col text-white font-sans overflow-hidden">
      {/* ── Navigation ──────────────────────────────── */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-[#111]">
        <div className="flex items-center gap-1">
          <span className="font-bold text-lg tracking-tighter text-[#FF5B22]">RESEARCH</span>
          <span className="font-light text-lg tracking-tighter text-[#888]">AGENT</span>
        </div>
        <div className="flex items-center gap-6">
          <button className="bg-[#FF5B22] text-white text-[10px] font-bold uppercase tracking-widest px-6 py-2 rounded-full hover:bg-[#e44a16] transition-colors">
            Contact
          </button>
        </div>
      </nav>

      {/* ── Hero Section (One Page Center) ──────────── */}
      <section className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto px-6 text-center">
        <div className="inline-block px-3 py-1 mb-8 border border-[#222] rounded-full">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#FF5B22]">
            Autonomous Pipeline
          </span>
        </div>

        <h1 className="text-5xl md:text-8xl font-bold leading-[1] tracking-tighter mb-8">
          Enterprise Grade<br />
          <span className="text-[#FF5B22]">Data Synthesis</span>
        </h1>

        <p className="text-sm md:text-base text-[#666] max-w-xl leading-relaxed mb-12">
          High-performance autonomous research systems. Analyze any global asset 
          instantly with live web intelligence and financial logic.
        </p>

        {/* ── Search Implementation ───────────────────── */}
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-xl group relative z-10"
        >
          <div className="flex bg-[#0A0A0A] border border-[#222] group-focus-within:border-[#FF5B22]/50 transition-all duration-300">
            <input
              type="text"
              placeholder="ENTER COMPANY NAME OR TICKER..."
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="flex-1 bg-transparent px-8 py-5 text-xs font-medium tracking-widest uppercase outline-none"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!company.trim()}
              className="bg-[#FF5B22] px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#e44a16] disabled:opacity-30 transition-all"
            >
              Analyze
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#444]">
              Top Queries
            </span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => router.push(`/report/${encodeURIComponent(ex)}`)}
                className="text-[9px] font-bold uppercase tracking-widest px-3 py-1 border border-[#111] hover:border-[#FF5B22] hover:text-[#FF5B22] transition-all"
              >
                {ex}
              </button>
            ))}
          </div>
        </form>
      </section>

      {/* ── Stats Strip ────────────────────────────── */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 px-8 py-10 border-t border-[#111] bg-[#050505]">
        {[
          { label: "Live Sources", value: "20+" },
          { label: "Global Coverage", value: "100%" },
          { label: "Latency", value: "< 60s" },
          { label: "Data Quality", value: "High" },
        ].map((stat) => (
          <div key={stat.label} className="text-left">
            <p className="text-xl font-bold mb-0.5 tracking-tighter">{stat.value}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#444]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Minimal Footer ──────────────────────────── */}
      <footer className="px-8 py-6 border-t border-[#111] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 opacity-30">
          <span className="font-bold text-[9px] tracking-tighter">RESEARCHAGENT</span>
          <span className="text-[9px]">© 2026</span>
        </div>
        <div className="flex gap-8 text-[9px] font-bold uppercase tracking-widest text-[#333]">
          <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
          <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
          <span className="hover:text-white cursor-pointer transition-colors">Infrastructure</span>
        </div>
      </footer>
    </main>
  );
}
