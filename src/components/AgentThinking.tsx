"use client";

import { AgentStep } from "@/types";
import { useEffect, useRef } from "react";

interface AgentThinkingProps {
  steps: AgentStep[];
  isRunning: boolean;
}

export function AgentThinking({ steps, isRunning }: AgentThinkingProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps]);

  const renderContent = (content: string) => {
    const cleaned = content.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]|\uD83D[\uDE80-\uDEFF]|\uD83E[\uDD00-\uDDFF]/g, '');
    
    // Check if it's a research plan (contains [01], [02]... or Plan established)
    if (cleaned.includes("[01]") || typeof cleaned === "string" && cleaned.toLowerCase().includes("plan established")) {
      const parts = cleaned.split(/(\[\d+\])/);
      if (parts.length > 2) {
        return (
          <div className="space-y-4 mt-4">
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-6">Strategic Research Plan</p>
            <div className="grid grid-cols-1 gap-2">
              {parts.map((part, i) => {
                if (part.match(/\[\d+\]/)) {
                  const stepNum = part.replace(/[\[\]]/g, '');
                  const task = parts[i + 1]?.split(/\[\d+\]/)[0]?.trim();
                  if (!task) return null;
                  return (
                    <div key={i} className="flex items-center gap-4 group/plan">
                      <span className="text-[10px] font-black text-[#FF5B22] w-6 opacity-40 group-hover/plan:opacity-100 transition-opacity">{stepNum}</span>
                      <span className="text-xs text-white/50 group-hover/plan:text-white/80 transition-colors uppercase tracking-tight">{task}</span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        );
      }
    }

    return <p className="text-sm text-[#AAA] group-hover:text-white transition-colors leading-relaxed tracking-tight">{cleaned}</p>;
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12 font-sans">
      <div className="bg-[#050505] border border-[#111] p-8 md:p-12">
        <div className="flex items-center justify-between mb-16 border-b border-[#111] pb-10">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${isRunning ? "bg-[#FF5B22] animate-pulse" : "bg-white/20"}`} />
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#FF5B22]">
                {isRunning ? "System Active" : "Stream Terminal"}
              </h2>
            </div>
            <span className="h-4 w-[1px] bg-[#222]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#444]">
              Real-time Intelligence Feed
            </span>
          </div>
          {isRunning && (
            <div className="text-[10px] font-black uppercase tracking-widest text-[#222] animate-pulse">
              Processing...
            </div>
          )}
        </div>

        <div
          ref={scrollRef}
          className="space-y-12 max-h-[70vh] overflow-y-auto pr-6 custom-scrollbar"
        >
          {steps.map((step, idx) => (
            <div
              key={step.id || idx}
              className="animate-fade-in flex items-start gap-10 group"
            >
              <div className="text-[10px] font-bold text-[#333] pt-1.5 min-w-[70px] tabular-nums tracking-widest">
                {new Date(step.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                })}
              </div>
              <div className="flex-1 border-l border-[#111] pl-10 pb-4 relative">
                {/* Active Indicator Dot on Timeline */}
                <div className="absolute -left-[4.5px] top-2 w-2 h-2 rounded-full border border-[#111] bg-black group-hover:border-[#FF5B22]/40 transition-colors" />
                
                <div className="max-w-2xl">
                  {renderContent(step.content)}
                </div>

                {step.toolCall && (
                  <div className="mt-8 flex items-center gap-4">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF5B22] bg-[#FF5B22]/10 px-3 py-1.5 rounded-sm">
                      {step.toolCall.tool} EXECUTION
                    </span>
                    <span className="text-[8px] font-bold text-[#333] uppercase tracking-widest">
                       Secure Terminal Handshake
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isRunning && (
            <div className="flex items-center gap-10 opacity-30">
              <div className="text-[10px] font-bold text-[#222] min-w-[70px] tabular-nums tracking-widest">--:--:--</div>
              <div className="flex-1 border-l border-[#111] pl-10 relative">
                 <div className="absolute -left-[4.5px] top-1 w-2 h-2 rounded-full bg-[#111]" />
                 <div className="flex gap-2">
                    <span className="w-1.5 h-1.5 bg-[#FF5B22] animate-ping" />
                    <span className="text-[9px] font-black text-[#333] uppercase tracking-[0.4em]">Listening for data...</span>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
