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

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12">
      <div className="bg-[#0A0A0A] border border-[#222] p-8 md:p-12">
        <div className="flex items-center justify-between mb-12 border-b border-[#1A1A1A] pb-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF5B22] animate-pulse" />
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF5B22]">
                {isRunning ? "System Active" : "Analysis Completed"}
              </h2>
            </div>
            <span className="h-px w-12 bg-[#222]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#555]">
              Real-time Intelligence Feed
            </span>
          </div>
          {isRunning && (
            <div className="flex gap-1 text-[10px] font-bold uppercase tracking-widest text-white/40">
              Processing...
            </div>
          )}
        </div>

        <div
          ref={scrollRef}
          className="space-y-6 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar"
        >
          {steps.map((step, idx) => (
            <div
              key={step.id || idx}
              className="animate-fade-in flex items-start gap-8 group"
            >
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#444] pt-1.5 min-w-[60px]">
                {new Date(step.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                })}
              </div>
              <div className="flex-1 border-l border-[#1A1A1A] pl-8 pb-6">
                <p className="text-sm text-[#AAA] group-hover:text-white transition-colors leading-relaxed tracking-tight">
                  {step.content.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]|\uD83D[\uDE80-\uDEFF]|\uD83E[\uDD00-\uDDFF]/g, '')}
                </p>
                {step.toolCall && (
                  <div className="mt-4 flex items-center gap-2">
                    <div className="h-px w-4 bg-[#FF5B22]/30" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#FF5B22]/80">
                      Querying {step.toolCall.tool.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isRunning && steps.length > 0 && (
            <div className="flex items-center gap-8 opacity-20">
              <div className="text-[10px] font-bold tracking-widest min-w-[60px]">--:--:--</div>
              <div className="flex-1 border-l border-white/5 pl-8">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-[#FF5B22] animate-ping" />
                  <span className="w-1.5 h-1.5 bg-[#FF5B22]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
