"use client";

import { ResearchReport } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
      .map((s) => `## ${s.icon} ${s.title}\n\n${s.content}`)
      .join("\n\n---\n\n");
    const fullText = `# Research Report: ${report.company}\n\nGenerated: ${new Date(
      report.generatedAt
    ).toLocaleDateString()}\nSentiment: ${report.overallSentiment}\n\n---\n\n${text}`;

    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = fullText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sentimentColor: Record<string, string> = {
    Bullish:
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Neutral:
      "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Bearish:
      "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">
          {report.company}
        </h1>
        <div className="flex items-center justify-center gap-3">
          <span className="text-sm text-muted-foreground">
            Generated {new Date(report.generatedAt).toLocaleDateString()}
          </span>
          <Badge
            variant="outline"
            className={`font-semibold ${
              sentimentColor[report.overallSentiment] || sentimentColor.Neutral
            }`}
          >
            {report.overallSentiment === "Bullish" && "📈 "}
            {report.overallSentiment === "Bearish" && "📉 "}
            {report.overallSentiment === "Neutral" && "➡️ "}
            {report.overallSentiment}
          </Badge>
        </div>
      </div>

      <Separator className="mb-8 bg-border/50" />

      {/* Report Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {report.sections.map((section, index) => (
          <Card
            key={index}
            className={`glass-card border-white/5 transition-all duration-500 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 group ${
              index === report.sections.length - 1 &&
              report.sections.length % 2 !== 0
                ? "md:col-span-2"
                : ""
            }`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="text-2xl">{section.icon}</span>
                {section.title}
              </CardTitle>
              <CardDescription className="sr-only">
                {section.title} for {report.company}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {section.content}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 mt-10">
        <Button
          onClick={handleCopy}
          variant="outline"
          className="border-white/10 hover:bg-white/5 hover:border-primary/40 transition-all duration-300"
        >
          {copied ? "✅ Copied!" : "📋 Copy Report"}
        </Button>
        <Button
          onClick={() => router.push("/")}
          className="bg-primary hover:bg-primary/80 text-milk font-bold px-8 transition-all duration-300 shadow-lg shadow-primary/20"
        >
          🔄 New Analysis
        </Button>
      </div>
    </div>
  );
}
