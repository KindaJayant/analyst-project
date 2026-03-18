"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Home() {
  const [company, setCompany] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = company.trim();
    if (trimmed) {
      router.push(`/report/${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[oklch(0.7_0.15_250_/_6%)] blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[oklch(0.7_0.18_320_/_5%)] blur-[100px]"></div>
      </div>

      <div className="relative z-10 max-w-2xl w-full text-center space-y-8">
        {/* Logo / Title */}
        <div className="space-y-4">
          <div className="text-5xl mb-2">🔬</div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            <span className="gradient-text">ResearchAgent</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            Enter any company name and let our AI agent research it autonomously
            — pulling financial data, news, and competitive intelligence.
          </p>
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
        >
          <Input
            id="company-input"
            type="text"
            placeholder="e.g. Apple, Tesla, Infosys..."
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="flex-1 h-12 text-base bg-[oklch(0.17_0.015_270_/_80%)] border-border/50 placeholder:text-muted-foreground/50 focus:border-[oklch(0.7_0.15_250_/_60%)] focus:ring-[oklch(0.7_0.15_250_/_20%)] transition-all"
          />
          <Button
            type="submit"
            disabled={!company.trim()}
            className="h-12 px-8 text-base font-semibold bg-[oklch(0.7_0.15_250)] hover:bg-[oklch(0.65_0.17_250)] text-[oklch(0.13_0.015_270)] transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            🚀 Analyze
          </Button>
        </form>

        {/* Feature badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          {[
            { emoji: "🔍", label: "Web Research" },
            { emoji: "📊", label: "Financial Data" },
            { emoji: "📰", label: "Live News" },
            { emoji: "🤖", label: "AI Analysis" },
          ].map((feature) => (
            <div
              key={feature.label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[oklch(0.22_0.02_270_/_60%)] text-muted-foreground border border-border/30"
            >
              <span>{feature.emoji}</span>
              {feature.label}
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground/50 pt-8">
          Powered by Gemini AI • All data fetched live • Zero paid APIs
        </p>
      </div>
    </main>
  );
}
