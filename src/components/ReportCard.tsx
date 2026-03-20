"use client";

import { ResearchReport } from "@/types";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ReportCardProps {
  report: ResearchReport;
}

export function ReportCard({ report }: ReportCardProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = report.sections
      .map((s) => `${s.title.toUpperCase()}\n\n${s.content}`)
      .join("\n\n---\n\n");
    const fullText = `MARKET RESEARCH REPORT: ${report.company.toUpperCase()}\nGenerated: ${new Date(
      report.generatedAt
    ).toLocaleDateString()}\nSentiment: ${report.overallSentiment}\n\n---\n\n${text}`;

    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sentimentStyles: Record<string, string> = {
    Bullish: "text-[#00FF88] border-[#00FF88]/30",
    Neutral: "text-[#FFCC00] border-[#FFCC00]/30",
    Bearish: "text-[#FF4444] border-[#FF4444]/30",
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-20 animate-fade-in font-sans">
      {/* ── Subtitle / Meta ─────────────────────────── */}
      <div className="flex flex-col md:flex-row items-baseline justify-between gap-6 mb-16 border-b border-[#111] pb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-[#FF5B22]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#FF5B22]">
              Market Intelligence
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase">
            {report.company}
          </h1>
        </div>

        <div className="flex items-center gap-8 border-l border-[#111] pl-0 md:pl-12">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#555] mb-2">Timestamp</p>
            <p className="text-xs font-medium text-white/60">
              {new Date(report.generatedAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#555] mb-2">Outlook</p>
            <div className={`text-xs font-bold uppercase tracking-widest border px-3 py-1 ${sentimentStyles[report.overallSentiment] || sentimentStyles.Neutral}`}>
              {report.overallSentiment}
            </div>
          </div>
        </div>
      </div>

      {/* ── Dynamic Grid ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-[#111] border border-[#111]">
        {report.sections.map((section, index) => (
          <div
            key={index}
            className="bg-black p-10 hover:bg-[#050505] transition-colors group"
          >
            <div className="h-px w-0 bg-[#FF5B22] mb-8 group-hover:w-full transition-all duration-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF5B22]/60 mb-6 flex items-center gap-2">
              <span className="text-[8px] opacity-40">0{index + 1}</span> 
              {section.title.toUpperCase()}
            </p>
            <div className="text-sm text-white/50 leading-relaxed whitespace-pre-wrap tracking-tight group-hover:text-white/80 transition-colors">
              {section.content.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]|\uD83D[\uDE80-\uDEFF]|\uD83E[\uDD00-\uDDFF]/g, '')}
            </div>
          </div>
        ))}
      </div>

      {/* ── Action Strip ────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-24">
        <button
          onClick={handleCopy}
          className="w-full md:w-auto px-10 py-4 border border-[#222] text-[10px] font-bold uppercase tracking-[0.2em] hover:border-[#FF5B22] hover:text-[#FF5B22] transition-all"
        >
          {copied ? "SUCCESS" : "GENERATE CLIPBOARD"}
        </button>
        <button
          onClick={() => router.push("/")}
          className="w-full md:w-auto px-10 py-4 bg-[#FF5B22] text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#e44a16] transition-all"
        >
          NEW ANALYSIS
        </button>
      </div>

      <div className="mt-12 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#222]">
          Trading Space Intelligence Pipeline
        </p>
      </div>
    </div>
  );
}
