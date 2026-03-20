"use client";

import { useEffect, useState, useRef, use } from "react";
import { AgentThinking } from "@/components/AgentThinking";
import { ReportCard } from "@/components/ReportCard";
import { AgentStep, AgentMessage, ResearchReport } from "@/types";
import { useRouter } from "next/navigation";

interface ReportPageProps {
  params: Promise<{ company: string }>;
}

export default function ReportPage({ params }: ReportPageProps) {
  const { company } = use(params);
  const decodedCompany = decodeURIComponent(company);
  const router = useRouter();

  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const runAgent = async () => {
      try {
        const response = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company: decodedCompany }),
        });

        if (!response.ok) {
          throw new Error(`System returned status ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("Connection failed");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const message: AgentMessage = JSON.parse(line);

              if (message.type === "step" && message.step) {
                setSteps((prev) => [...prev, message.step!]);
              } else if (message.type === "report" && message.report) {
                setReport(message.report);
              } else if (message.type === "error") {
                setError(message.error || "Process interrupted");
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "System failure"
        );
      } finally {
        setIsRunning(false);
      }
    };

    runAgent();
  }, [decodedCompany]);

  return (
    <main className="h-screen bg-black text-white font-sans selection:bg-[#FF5B22] selection:text-white flex flex-col overflow-hidden">
      {/* ── Navigation ──────────────────────────────── */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-[#111] bg-black/80 backdrop-blur-md z-50">
        <button 
          onClick={() => router.push("/")}
          className="flex items-center gap-1 group"
        >
          <span className="font-bold text-xs tracking-tighter text-[#FF5B22] group-hover:text-white transition-colors">RESEARCH</span>
          <span className="font-light text-xs tracking-tighter text-[#888]">AGENT</span>
        </button>
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#444]">
          Live Intelligence Analysis
        </div>
      </nav>

      {/* ── Page Content (Internal Scrolling) ───────── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto h-full flex flex-col">
          {/* Error Handling */}
          {error && !report && (
            <div className="max-w-2xl mx-auto my-auto px-6 py-12 border border-[#333] bg-[#0A0A0A]">
              <p className="text-[#FF4444] text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Critical Error</p>
              <p className="text-xl font-bold tracking-tight text-white mb-8">{error}</p>
              <button
                onClick={() => router.push("/")}
                className="px-8 py-3 bg-[#FF4444] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#cc3333] transition-all"
              >
                Re-initialize
              </button>
            </div>
          )}

          {/* Status Logs */}
          {(isRunning || (!report && !error)) && (
            <div className="my-auto">
              <AgentThinking steps={steps} isRunning={isRunning} />
            </div>
          )}

          {/* Final Context */}
          {report && <ReportCard report={report} />}
        </div>
      </div>
    </main>
  );
}
