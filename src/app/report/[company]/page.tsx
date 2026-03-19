"use client";

import { useEffect, useState, useRef, use } from "react";
import { AgentThinking } from "@/components/AgentThinking";
import { ReportCard } from "@/components/ReportCard";
import { AgentStep, AgentMessage, ResearchReport } from "@/types";
import { Button } from "@/components/ui/button";
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
          throw new Error(`Agent returned status ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

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
                setError(message.error || "Unknown error");
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to run analysis"
        );
      } finally {
        setIsRunning(false);
      }
    };

    runAgent();
  }, [decodedCompany]);

  return (
    <main className="min-h-screen px-4 py-12 relative">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-96 h-96 rounded-full bg-[oklch(0.7_0.15_250_/_4%)] blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[oklch(0.7_0.18_320_/_3%)] blur-[100px]"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            ← Back to home
          </button>
          <h1 className="text-2xl md:text-3xl font-bold">
            Researching{" "}
            <span className="gradient-text">{decodedCompany}</span>
          </h1>
        </div>

        {/* Agent Thinking Panel */}
        {(isRunning || (!report && !error)) && (
          <AgentThinking steps={steps} isRunning={isRunning} />
        )}

        {/* Error */}
        {error && !report && (
          <div className="max-w-3xl mx-auto glass-card rounded-2xl p-8 border-rose-500/20 shadow-2xl shadow-rose-500/5">
            <p className="text-rose-400 font-bold text-lg mb-2 flex items-center gap-2">
              <span>⚠️</span> Analysis Failed
            </p>
            <p className="text-foreground/70 leading-relaxed">{error}</p>
            <Button
              onClick={() => router.push("/")}
              className="mt-6 bg-rose-500 hover:bg-rose-600 text-white font-bold"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Report */}
        {report && <ReportCard report={report} />}
      </div>
    </main>
  );
}
