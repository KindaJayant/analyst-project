import { callGemini } from "@/lib/gemini";
import { getToolDescriptionsForPrompt, callTool } from "@/lib/tools";
import {
  AgentStep,
  AgentMessage,
  ToolCall,
  ToolName,
  ResearchReport,
  ReportSection,
  SearchResult,
  FinancialData,
  NewsItem,
} from "@/types";

const MAX_STEPS = 8;
const VALID_TOOLS: ToolName[] = ["search", "financials", "news"];

function createSystemPrompt(company: string): string {
  const tools = getToolDescriptionsForPrompt();
  return `You are a professional autonomous research analyst. Your objective is to research "${company}" and produce a structured, high-fidelity investment brief.

## Tools
${tools}

## Protocol
1. Initialize research plan (4-6 steps).
2. Execute tool calls sequentially.
3. Observe results and verify data integrity.
4. Reflect on findings; retry with alternate queries if results are insufficient.
5. Finalize synthesis into a structured report.

## Critical Instructions
- Response must be VALID JSON only. No explanations, no markdown outside JSON.
- If a tool returns no data, adjust parameters and retry.
- For Indian assets, prioritize NSE/BSE data (use .NS or .BO suffixes).
- Use professional financial terminology. No emojis or informal language.
- BE OPINIONATED: Do not default to "Neutral" if the data shows extreme distress, high debt, or poor growth. Provide a realistic sentiment (Bearish/Bullish) based on data.
- FORMATTING: Every report section content MUST be written as a bulleted list of 4-6 distinct analytical points. 
- Ensure all figures are attributed to tools and not hallucinated.

## Operational JSON Formats

Research Plan:
{"action":"plan","plan":["step 1","step 2",...]}

Tool Execution:
{"action":"tool_call","tool":"search|financials|news","args":{"param":"value"},"reasoning":"professional justification"}

Assessment:
{"action":"reflect","assessment":"analytical assessment","needsRetry":true|false,"retryStrategy":"alternative approach if needed"}

Synthesis:
{"action":"synthesize"}`;
}

const SYNTHESIS_PROMPT = `Generate a formal investment report based on the gathered data.
Respond with ONLY valid JSON in this exact structure:
{
  "company": "Official Company Name",
  "overallSentiment": "Bullish" | "Neutral" | "Bearish",
  "sections": [
    {"title": "Company Overview", "icon": "OVERVIEW", "content": "- Business description and scale...\\n- Core industry position...\\n- Strategic focus..."},
    {"title": "Financial Snapshot", "icon": "FINANCIALS", "content": "- Price and valuation context...\\n- Revenue/Profitability trends...\\n- Balance sheet health (debt/cash)..."},
    {"title": "Recent News & Developments", "icon": "NEWS", "content": "- Key event 1 (date)...\\n- Key event 2 (date)..."},
    {"title": "Competitive Landscape", "icon": "COMPETITION", "content": "- Market share vs peers...\\n- Peer 1 comparison...\\n- Peer 2 comparison..."},
    {"title": "Risk Factors", "icon": "RISK", "content": "- Primary risk 1...\\n- Primary risk 2...\\n- Primary risk 3..."},
    {"title": "Investment Summary", "icon": "SUMMARY", "content": "- Consolidated Bull case...\\n- Consolidated Bear case...\\n- Final investment verdict..."}
  ]
}

CRITICAL FORMATTING:
1. Use ONLY bullet points prefixed with "- " for content.
2. DO NOT use newlines inside a single bullet point.
3. Use exactly one bullet point per line.
4. If a company is in distress (high debt, negative growth, regulatory issues), the sentiment MUST be BEARISH. Do not be overly neutral.
No preamble, no code fences. Only the JSON object.`;

function parseJSON(text: string): Record<string, unknown> | null {
  try {
    const cleaned = text.trim();
    // Try extraction if code fences exist
    const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    const toParse = jsonMatch ? jsonMatch[1].trim() : cleaned.match(/\{[\s\S]*\}/)?.[0] || cleaned;
    return JSON.parse(toParse);
  } catch {
    return null;
  }
}

function formatBullets(items: string[]): string {
  return items.filter(Boolean).map((item) => `- ${item}`).join("\n");
}

function toDisplayNumber(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "Not available";
  }

  return String(value);
}

function inferSentiment(financials: FinancialData | null): "Bullish" | "Neutral" | "Bearish" {
  if (!financials) {
    return "Neutral";
  }

  let score = 0;

  if ((financials.changePercent ?? 0) > 1.5) score += 1;
  if ((financials.changePercent ?? 0) < -1.5) score -= 1;
  if ((financials.profitMargin ?? 0) > 15) score += 1;
  if ((financials.profitMargin ?? 0) < 0) score -= 2;
  if ((financials.peRatio ?? 0) > 45) score -= 1;
  if ((financials.peRatio ?? 0) > 0 && (financials.peRatio ?? 0) < 25) score += 1;

  if (typeof financials.analystRating === "string") {
    const rating = financials.analystRating.toLowerCase();
    if (rating.includes("buy")) score += 1;
    if (rating.includes("sell")) score -= 1;
  }

  if (score >= 2) return "Bullish";
  if (score <= -2) return "Bearish";
  return "Neutral";
}

function buildFallbackSections(
  company: string,
  searchResults: SearchResult[],
  financials: FinancialData | null,
  news: NewsItem[]
): ReportSection[] {
  const companyName = financials?.companyName || company;
  const overviewPoints = [
    `${companyName} is being analysed using a deterministic fallback workflow built on live search, financial, and news tools.`,
    searchResults[0]?.snippet || `${companyName} appears in current web results, indicating active public coverage and accessible market context.`,
    searchResults[1]?.title
      ? `Recent web context highlights ${searchResults[1].title}.`
      : `Ticker resolution currently points to ${financials?.ticker || company}, which is used for downstream financial lookups.`,
    news[0]?.title
      ? `News flow remains active, with the latest headline suggesting: ${news[0].title}.`
      : `No fresh headline feed was available during this run, so qualitative context is lighter than normal.`,
  ];

  const financialPoints = [
    `Ticker tracked: ${financials?.ticker || company}.`,
    `Price: ${toDisplayNumber(financials?.price)} ${financials?.currency || ""}`.trim(),
    `Day move: ${toDisplayNumber(financials?.change)} (${toDisplayNumber(financials?.changePercent)}%).`,
    `Market cap / P-E: ${toDisplayNumber(financials?.marketCap)} / ${toDisplayNumber(financials?.peRatio)}.`,
    `Revenue / Dividend yield: ${toDisplayNumber(financials?.revenue)} / ${toDisplayNumber(financials?.dividendYield)}.`,
  ];

  const newsPoints =
    news.slice(0, 5).map((item) => `${item.date.slice(0, 16)} | ${item.source}: ${item.title}`) || [];

  const competitionPoints = [
    searchResults[0]?.title
      ? `Search positioning references ${searchResults[0].title}, which helps anchor current market narrative.`
      : `${companyName} remains identifiable in public search results, but peer coverage was limited in this run.`,
    searchResults[1]?.snippet
      ? `Secondary context suggests: ${searchResults[1].snippet}`
      : `A fuller peer benchmark would benefit from an additional sector-specific comparison pass.`,
    `The toolchain currently prioritises company discovery, live pricing, and recent developments over exhaustive peer-modeling.`,
    `Use this section as directional positioning rather than a full market-share study when the fallback mode is active.`,
  ];

  const riskPoints = [
    `Fallback mode was triggered because the primary LLM provider was unavailable, so narrative synthesis is less nuanced than the standard agent path.`,
    financials?.peRatio && financials.peRatio > 45
      ? `Valuation appears elevated relative to a conservative baseline, which raises downside sensitivity if growth slows.`
      : `Valuation does not appear obviously stretched from the available quick-look metrics alone.`,
    (financials?.changePercent ?? 0) < -2
      ? `Recent price weakness suggests the market may already be discounting near-term execution or sentiment risks.`
      : `Short-term price action does not currently signal an acute stress event from the limited snapshot.`,
    news.length === 0
      ? `Missing fresh news flow reduces confidence in event-driven conclusions for this run.`
      : `Headline-based inputs can skew toward recent noise, so major conclusions should still be cross-checked.`,
  ];

  const sentiment = inferSentiment(financials);
  const summaryPoints = [
    sentiment === "Bullish"
      ? `Bull case: available price, valuation, and rating signals lean constructive for ${companyName}.`
      : `Bull case: the company still has enough visible market presence and data availability to support deeper diligence.`,
    sentiment === "Bearish"
      ? `Bear case: current momentum, valuation, or profitability signals are weak enough to justify a cautious stance.`
      : `Bear case: this fallback report is structurally thinner than the full autonomous synthesis path, so conviction should stay moderate.`,
    `Final stance: ${sentiment}. Re-run with a healthy LLM credential to restore the full planning and synthesis loop.`,
  ];

  return [
    { title: "Company Overview", icon: "OVERVIEW", content: formatBullets(overviewPoints) },
    { title: "Financial Snapshot", icon: "FINANCIALS", content: formatBullets(financialPoints) },
    {
      title: "Recent News & Developments",
      icon: "NEWS",
      content: formatBullets(newsPoints.length > 0 ? newsPoints : [`No recent headlines were returned for ${companyName} during this run.`]),
    },
    { title: "Competitive Landscape", icon: "COMPETITION", content: formatBullets(competitionPoints) },
    { title: "Risk Factors", icon: "RISK", content: formatBullets(riskPoints) },
    { title: "Investment Summary", icon: "SUMMARY", content: formatBullets(summaryPoints) },
  ];
}

async function* runDeterministicFallback(
  company: string,
  emitStep: (
    type: AgentStep["type"],
    content: string,
    extra?: Partial<AgentStep>
  ) => AgentMessage,
  baseUrl?: string
): AsyncGenerator<AgentMessage> {
  yield emitStep(
    "reflection",
    "Primary LLM path unavailable. Switching to deterministic research mode."
  );

  const searchCall: ToolCall = {
    tool: "search",
    args: { query: `${company} company overview stock` },
    reasoning: "Gather baseline company context from public web results.",
  };
  yield emitStep("tool_call", searchCall.reasoning, { toolCall: searchCall });
  const searchResult = await callTool("search", searchCall.args, baseUrl);
  yield emitStep(
    "tool_result",
    searchResult.success ? "SEARCH data acquired." : `SEARCH error: ${searchResult.error}`,
    { toolResult: searchResult }
  );

  const financialCall: ToolCall = {
    tool: "financials",
    args: { ticker: company },
    reasoning: "Resolve live financial context for the requested company or ticker.",
  };
  yield emitStep("tool_call", financialCall.reasoning, { toolCall: financialCall });
  const financialResult = await callTool("financials", financialCall.args, baseUrl);
  yield emitStep(
    "tool_result",
    financialResult.success
      ? "FINANCIALS data acquired."
      : `FINANCIALS error: ${financialResult.error}`,
    { toolResult: financialResult }
  );

  const newsCall: ToolCall = {
    tool: "news",
    args: { company },
    reasoning: "Pull the most recent company-specific headlines.",
  };
  yield emitStep("tool_call", newsCall.reasoning, { toolCall: newsCall });
  const newsResult = await callTool("news", newsCall.args, baseUrl);
  yield emitStep(
    "tool_result",
    newsResult.success ? "NEWS data acquired." : `NEWS error: ${newsResult.error}`,
    { toolResult: newsResult }
  );

  const searchResults = searchResult.success && Array.isArray(searchResult.data)
    ? (searchResult.data as SearchResult[])
    : [];
  const financials =
    financialResult.success &&
    financialResult.data &&
    !Array.isArray(financialResult.data)
      ? (financialResult.data as FinancialData)
      : null;
  const newsItems = newsResult.success && Array.isArray(newsResult.data)
    ? (newsResult.data as NewsItem[])
    : [];

  const report: ResearchReport = {
    company: financials?.companyName || company,
    generatedAt: new Date().toISOString(),
    overallSentiment: inferSentiment(financials),
    sections: buildFallbackSections(company, searchResults, financials, newsItems),
  };

  yield emitStep(
    "synthesis",
    "Deterministic synthesis complete. Delivering structured fallback report."
  );
  yield { type: "report", report };
  yield { type: "done" };
}

export async function* runAgentLoop(
  company: string,
  baseUrl?: string
): AsyncGenerator<AgentMessage> {
  let stepId = 0;
  const conversationHistory: { role: "user" | "model"; text: string }[] = [];
  const systemPrompt = createSystemPrompt(company);

  const emitStep = (
    type: AgentStep["type"],
    content: string,
    extra?: Partial<AgentStep>
  ): AgentMessage => {
    stepId++;
    return {
      type: "step",
      step: {
        id: stepId,
        type,
        content,
        timestamp: Date.now(),
        ...extra,
      },
    };
  };

  try {
    yield emitStep("plan", `Initializing research pipeline for ${company}...`);

    const initialPrompt = `RESEARCH CONTEXT: The user wants a professional investment brief for "${company}".
Identify the correct stock ticker if not provided (e.g., for Indian companies use .NS/.BO).
Begin with the highest-confidence next action immediately. Prefer gathering ticker, financials, and news efficiently before synthesis.`;

    conversationHistory.push({ role: "user", text: initialPrompt });
    yield emitStep(
      "plan",
      "Research plan established. Beginning direct data acquisition to stay within free-tier rate limits."
    );

    let iterations = 0;
    while (iterations < MAX_STEPS) {
      iterations++;

      conversationHistory.push({
        role: "user",
        text: "Proceed to next action. If data is sufficient for all report sections, respond with {\"action\":\"synthesize\"}. Otherwise, execute next tool call.",
      });

      const actionResponse = await callGemini(
        systemPrompt,
        conversationHistory
      );
      conversationHistory.push({ role: "model", text: actionResponse });

      const actionData = parseJSON(actionResponse);
      if (!actionData) {
        yield emitStep("error", "Failed to parse system response. Re-evaluating...");
        conversationHistory.push({
          role: "user",
          text: "Invalid response format. Adhere to the specified JSON schema.",
        });
        continue;
      }

      if (actionData.action === "synthesize") {
        yield emitStep("synthesis", "Information gathering complete. Synthesizing final investment brief.");
        break;
      }

      if (actionData.action === "tool_call") {
        const toolName = actionData.tool as string;
        const args = actionData.args as Record<string, string>;
        const reasoning = (actionData.reasoning as string) || "";

        if (!VALID_TOOLS.includes(toolName as ToolName)) {
          yield emitStep("error", `Configuration error: invalid tool ${toolName}`);
          conversationHistory.push({
            role: "user",
            text: `Tool "${toolName}" is not categorized. Categorized tools: ${VALID_TOOLS.join(", ")}`,
          });
          continue;
        }

        const toolCall: ToolCall = {
          tool: toolName as ToolName,
          args,
          reasoning,
        };

        yield emitStep(
          "tool_call",
          reasoning || `Executing ${toolName} acquisition...`,
          { toolCall }
        );

        const result = await callTool(toolName as ToolName, args, baseUrl);

        if (result.success) {
          yield emitStep("tool_result", `${toolName.toUpperCase()} data acquired.`, {
            toolResult: result,
          });
          conversationHistory.push({
            role: "user",
            text: `Tool result: ${JSON.stringify(result.data, null, 2).substring(0, 3000)}\n\nAssess sufficiency and determine next operation.`,
          });
        } else {
          yield emitStep(
            "tool_result",
            `${toolName.toUpperCase()} error: ${result.error}`,
            { toolResult: result }
          );
          conversationHistory.push({
            role: "user",
            text: `Tool result error: ${result.error}\n\nAdjust query parameters or switch tool.`,
          });
        }

        continue;
      }

      if (actionData.action === "reflect") {
        yield emitStep("reflection", (actionData.assessment as string) || "Reflecting on acquired data.");
        continue;
      }

      yield emitStep("reflection", "Processing...");
    }

    conversationHistory.push({
      role: "user",
      text: SYNTHESIS_PROMPT,
    });

    const synthesisResponse = await callGemini(
      systemPrompt,
      conversationHistory
    );

    const reportData = parseJSON(synthesisResponse);
    if (reportData && reportData.sections) {
      const report: ResearchReport = {
        company: (reportData.company as string) || company,
        generatedAt: new Date().toISOString(),
        sections: reportData.sections as ReportSection[],
        overallSentiment:
          (reportData.overallSentiment as "Bullish" | "Neutral" | "Bearish") ||
          "Neutral",
      };
      yield { type: "report", report };
    } else {
      yield {
        type: "report",
        report: {
          company,
          generatedAt: new Date().toISOString(),
          overallSentiment: "Neutral",
          sections: [
            {
              title: "Analysis Report",
              icon: "REPORT",
              content: synthesisResponse,
            },
          ],
        },
      };
    }

    yield { type: "done" };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    try {
      yield* runDeterministicFallback(company, emitStep, baseUrl);
    } catch (fallbackError) {
      yield {
        type: "error",
        error: `Pipeline interruption: ${errorMessage}. Fallback failure: ${
          fallbackError instanceof Error
            ? fallbackError.message
            : String(fallbackError)
        }`,
      };
    }
  }
}
