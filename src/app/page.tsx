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
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[160px] animate-pulse-glow"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-[200px]"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full bg-primary/15 blur-[140px] animate-pulse-glow" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="relative z-10 max-w-2xl w-full text-center space-y-8">
        {/* Logo / Title */}
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-4xl shadow-2xl shadow-primary/20 animate-slide-up">
              🔬
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <span className="gradient-text">Research</span>
            <span className="text-milk/90">Agent</span>
          </h1>
          <p className="text-lg md:text-xl text-paper/60 max-w-lg mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
            The autonomous engine for deep company intelligence. Fetch financials, news, and market insights in seconds.
          </p>
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto p-2 bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-2xl animate-slide-up"
          style={{ animationDelay: '0.3s' }}
        >
          <Input
            id="company-input"
            type="text"
            placeholder="Search Apple, Tesla, Infosys..."
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="flex-1 h-16 text-lg bg-transparent border-none focus-visible:ring-0 placeholder:text-paper/30 px-6"
          />
          <Button
            type="submit"
            disabled={!company.trim()}
            className="h-16 px-10 text-lg font-bold bg-primary hover:bg-primary/80 text-milk rounded-2xl transition-all disabled:opacity-40 shadow-xl shadow-primary/20"
          >
            Go 🚀
          </Button>
        </form>

        {/* Feature badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          {[
            { emoji: "🔍", label: "Web Intelligence" },
            { emoji: "📊", label: "Financial Core" },
            { emoji: "📰", label: "Real-time News" },
            { emoji: "🤖", label: "Neural Synthesis" },
          ].map((feature) => (
            <div
              key={feature.label}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold bg-white/5 text-paper/70 border border-white/5 hover:border-primary/30 transition-all cursor-default"
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
