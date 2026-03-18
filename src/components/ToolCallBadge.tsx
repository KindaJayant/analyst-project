import { Badge } from "@/components/ui/badge";
import { ToolName } from "@/types";

interface ToolCallBadgeProps {
  tool: ToolName;
}

const toolConfig: Record<ToolName, { label: string; emoji: string; className: string }> = {
  search: {
    label: "Web Search",
    emoji: "🔍",
    className: "bg-[oklch(0.7_0.15_250_/_15%)] text-[oklch(0.8_0.12_250)] border-[oklch(0.7_0.15_250_/_30%)]",
  },
  financials: {
    label: "Financial Data",
    emoji: "📊",
    className: "bg-[oklch(0.65_0.18_170_/_15%)] text-[oklch(0.75_0.15_170)] border-[oklch(0.65_0.18_170_/_30%)]",
  },
  news: {
    label: "News Feed",
    emoji: "📰",
    className: "bg-[oklch(0.75_0.15_60_/_15%)] text-[oklch(0.82_0.12_60)] border-[oklch(0.75_0.15_60_/_30%)]",
  },
};

export function ToolCallBadge({ tool }: ToolCallBadgeProps) {
  const config = toolConfig[tool];

  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium ${config.className}`}
    >
      {config.emoji} {config.label}
    </Badge>
  );
}
