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
      "bg-[oklch(0.65_0.18_170_/_15%)] text-[oklch(0.75_0.15_170)] border-[oklch(0.65_0.18_170_/_30%)]",
    Neutral:
      "bg-[oklch(0.75_0.15_60_/_15%)] text-[oklch(0.82_0.12_60)] border-[oklch(0.75_0.15_60_/_30%)]",
    Bearish:
      "bg-[oklch(0.65_0.2_25_/_15%)] text-[oklch(0.75_0.17_25)] border-[oklch(0.65_0.2_25_/_30%)]",
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
            className={`glass-card border-border/30 transition-all duration-300 hover:border-[oklch(0.7_0.15_250_/_40%)] hover:shadow-lg hover:shadow-[oklch(0.7_0.15_250_/_5%)] ${
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
          className="border-border/50 hover:bg-accent/80 hover:border-[oklch(0.7_0.15_250_/_40%)] transition-all"
        >
          {copied ? "✅ Copied!" : "📋 Copy Report"}
        </Button>
        <Button
          onClick={() => router.push("/")}
          className="bg-[oklch(0.7_0.15_250)] hover:bg-[oklch(0.65_0.17_250)] text-[oklch(0.13_0.015_270)] font-semibold transition-all"
        >
          🔄 New Analysis
        </Button>
      </div>
    </div>
  );
}
