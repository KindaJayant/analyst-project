import { Badge } from "@/components/ui/badge";
import { ToolName } from "@/types";

interface ToolCallBadgeProps {
  tool: ToolName;
}

const toolConfig: Record<ToolName, { label: string; emoji: string; className: string }> = {
  search: {
    label: "Web Search",
    emoji: "🔍",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  financials: {
    label: "Financial Data",
    emoji: "📊",
    className: "bg-foreground/5 text-foreground border-foreground/10",
  },
  news: {
    label: "News Feed",
    emoji: "📰",
    className: "bg-paper/10 text-paper border-paper/20",
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
