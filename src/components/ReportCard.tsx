"use client";

import { ResearchReport } from "@/types";
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

  const renderContent = (content: string) => {
    // Clean emojis and split by sentences/lines to create bullets
    const cleaned = content.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]|\uD83D[\uDE80-\uDEFF]|\uD83E[\uDD00-\uDDFF]/g, '');
    
    // Split by newlines or numbered items (1. , 2. ) or bullet points
    const items = cleaned.split(/\n|(?=\d+\.)|(?=•)/).filter(i => i.trim().length > 0);

    if (items.length <= 1) {
      // Fallback: try splitting by sentences
      const sentences = cleaned.split(/(?<=[.!?])\s+/);
      if (sentences.length > 1) return renderList(sentences);
      return <p className="text-sm text-white/50 leading-relaxed tracking-tight group-hover:text-white/80 transition-colors">{cleaned}</p>;
    }

    return renderList(items);
  };

  const renderList = (items: string[]) => (
    <ul className="space-y-4">
      {items.map((item, i) => {
        const cleanItem = item.replace(/^\d+\.\s*|^\u2022\s*|^-\s*/, '').trim();
        if (!cleanItem) return null;
        return (
          <li key={i} className="flex items-start gap-3 group/li">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5B22]/40 mt-1.5 flex-shrink-0 group-hover/li:bg-[#FF5B22] transition-colors" />
            <span className="text-sm text-white/50 leading-relaxed tracking-tight group-hover:text-white/80 transition-colors">
              {cleanItem}
            </span>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-12 animate-fade-in font-sans">
      {/* ── Header ────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-baseline justify-between gap-6 mb-12 border-b border-[#111] pb-10">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-[#FF5B22]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#FF5B22]">
              Market Insight
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter uppercase">
            {report.company}
          </h1>
        </div>

        <div className="flex items-center gap-8 border-l border-[#111] pl-0 md:pl-12">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#444] mb-1.5 text-right">Date</p>
            <p className="text-xs font-medium text-white/40 text-right">
              {new Date(report.generatedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="min-w-[120px]">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#444] mb-1.5 text-right">Outlook</p>
            <div className={`text-[10px] font-black uppercase tracking-[0.2em] border px-4 py-1.5 text-center ${sentimentStyles[report.overallSentiment] || sentimentStyles.Neutral}`}>
              {report.overallSentiment}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bulleted Grid ──────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-[#111] border border-[#111]">
        {report.sections.map((section, index) => (
          <div
            key={index}
            className="bg-black p-8 md:p-10 hover:bg-[#050505] transition-colors group"
          >
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#FF5B22]/60 mb-8 flex items-center gap-2">
              <span className="text-[#333] font-light">0{index + 1}</span> 
              {section.title.toUpperCase()}
            </p>
            {renderContent(section.content)}
          </div>
        ))}
      </div>

      {/* ── Action Strip ────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-20">
        <button
          onClick={handleCopy}
          className="w-full md:w-auto px-10 py-4 border border-[#222] text-[10px] font-bold uppercase tracking-[0.25em] hover:border-[#FF5B22] hover:text-[#FF5B22] transition-all"
        >
          {copied ? "DATA CLONED" : "CLONE TO CLIPBOARD"}
        </button>
        <button
          onClick={() => router.push("/")}
          className="w-full md:w-auto px-10 py-4 bg-[#FF5B22] text-white text-[10px] font-bold uppercase tracking-[0.25em] hover:bg-[#e44a16] transition-all"
        >
          RESET ANALYSIS
        </button>
      </div>

      <div className="mt-10 text-center">
        <p className="text-[8px] font-bold uppercase tracking-[0.5em] text-[#111]">
          RESEARCHAGENT INTELLIGENCE PIPELINE V3
        </p>
      </div>
    </div>
  );
}
