import { ToolName, ToolResult, SearchResult, FinancialData, NewsItem } from "@/types";

export interface ToolDefinition {
  name: ToolName;
  description: string;
  parameters: {
    name: string;
    type: string;
    description: string;
  }[];
}

export const toolDefinitions: ToolDefinition[] = [
  {
    name: "search",
    description:
      "Search the web using DuckDuckGo. Use this for company overviews, competitor information, general research, or finding a stock ticker symbol.",
    parameters: [
      {
        name: "query",
        type: "string",
        description: "The search query to look up",
      },
    ],
  },
  {
    name: "financials",
    description:
      "Get financial data for a publicly traded company using its stock ticker symbol. Returns price, market cap, P/E ratio, 52-week range, revenue, profit margin, and analyst rating.",
    parameters: [
      {
        name: "ticker",
        type: "string",
        description:
          "The stock ticker symbol (e.g., AAPL for Apple, MSFT for Microsoft)",
      },
    ],
  },
  {
    name: "news",
    description:
      "Get the latest news headlines about a company from Google News RSS feed.",
    parameters: [
      {
        name: "company",
        type: "string",
        description: "The company name to search news for",
      },
    ],
  },
];

export function getToolDescriptionsForPrompt(): string {
  return toolDefinitions
    .map(
      (t) =>
        `- **${t.name}**: ${t.description}\n  Parameters: ${t.parameters
          .map((p) => `${p.name} (${p.type}): ${p.description}`)
          .join(", ")}`
    )
    .join("\n");
}

export async function callTool(
  tool: ToolName,
  args: Record<string, string>,
  baseUrl?: string
): Promise<ToolResult> {
  try {
    const resolvedBaseUrl =
      baseUrl || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const response = await fetch(`${resolvedBaseUrl}/api/tools/${tool}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });

    if (!response.ok) {
      return {
        tool,
        success: false,
        data: null,
        error: `Tool ${tool} returned status ${response.status}`,
      };
    }

    const data = await response.json();
    return { tool, success: true, data: data as SearchResult[] | FinancialData | NewsItem[] };
  } catch (error) {
    return {
      tool,
      success: false,
      data: null,
      error: `Tool ${tool} failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
