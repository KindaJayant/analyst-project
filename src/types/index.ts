// ============================================================
// Core types for the Autonomous Research Analyst Agent
// ============================================================

// --- Tool I/O Types ---

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface FinancialData {
  ticker: string;
  companyName: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  currency: string;
  marketCap: string | number | null;
  peRatio: number | null;
  dividendYield: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  revenue: string | number | null;
  profitMargin: number | null;
  analystRating: string | null;
  error?: string;
}

export interface NewsItem {
  title: string;
  date: string;
  source: string;
  url: string;
}

// --- Agent Types ---

export type ToolName = "search" | "financials" | "news";

export interface ToolCall {
  tool: ToolName;
  args: Record<string, string>;
  reasoning: string;
}

export interface ToolResult {
  tool: ToolName;
  success: boolean;
  data: SearchResult[] | FinancialData | NewsItem[] | null;
  error?: string;
}

export interface AgentStep {
  id: number;
  type: "plan" | "tool_call" | "tool_result" | "reflection" | "synthesis" | "error";
  content: string;
  toolCall?: ToolCall;
  toolResult?: ToolResult;
  timestamp: number;
}

// --- Report Types ---

export interface ReportSection {
  title: string;
  icon: string;
  content: string;
}

export interface ResearchReport {
  company: string;
  generatedAt: string;
  sections: ReportSection[];
  overallSentiment: "Bullish" | "Neutral" | "Bearish";
}

// --- Streaming Types ---

export type AgentMessageType =
  | "step"
  | "report"
  | "error"
  | "done";

export interface AgentMessage {
  type: AgentMessageType;
  step?: AgentStep;
  report?: ResearchReport;
  error?: string;
}
