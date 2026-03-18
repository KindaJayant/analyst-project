"use client";

import { AgentStep } from "@/types";
import { ToolCallBadge } from "@/components/ToolCallBadge";
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
    <div className="w-full max-w-3xl mx-auto">
      <div className="glass-card rounded-xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          {isRunning && (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[oklch(0.7_0.15_250)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[oklch(0.7_0.15_250)]"></span>
            </span>
          )}
          <h2 className="text-lg font-semibold text-foreground">
            {isRunning ? "Agent is researching..." : "Research complete"}
          </h2>
        </div>

        <div
          ref={scrollRef}
          className="space-y-3 max-h-[420px] overflow-y-auto pr-2"
        >
          {steps.map((step) => (
            <div
              key={step.id}
              className="animate-slide-up flex items-start gap-3 rounded-lg px-4 py-3 transition-colors bg-[oklch(0.13_0.015_270_/_50%)]"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                  {step.content}
                </p>
                {step.toolCall && (
                  <div className="mt-2">
                    <ToolCallBadge tool={step.toolCall.tool} />
                  </div>
                )}
              </div>
              <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                {new Date(step.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>
          ))}

          {isRunning && steps.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-3 animate-pulse-glow">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.7_0.15_250)]"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.7_0.15_250)] opacity-75"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.7_0.15_250)] opacity-50"></span>
              </div>
              <span className="text-xs text-muted-foreground">Thinking...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
