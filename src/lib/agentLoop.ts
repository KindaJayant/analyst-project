import { callGemini } from "@/lib/gemini";
import { getToolDescriptionsForPrompt, callTool } from "@/lib/tools";
import {
  AgentStep,
  AgentMessage,
  ToolCall,
  ToolName,
  ResearchReport,
  ReportSection,
} from "@/types";

const MAX_STEPS = 12;
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
    {"title": "Company Overview", "icon": "OVERVIEW", "content": "• Point 1: Business description...\\n• Point 2: Core industry position...\\n• Point 3: Operational scale..."},
    {"title": "Financial Snapshot", "icon": "FINANCIALS", "content": "• Point 1: Current valuation metrics...\\n• Point 2: Revenue and profitability analysis...\\n• Point 3: Debt levels and solvency..."},
    {"title": "Recent News & Developments", "icon": "NEWS", "content": "• Point 1: Key event (date)...\\n• Point 2: Corporate action (date)..."},
    {"title": "Competitive Landscape", "icon": "COMPETITION", "content": "• Point 1: Market share comparison...\\n• Point 2: Tier 1 rivals analysis..."},
    {"title": "Risk Factors", "icon": "RISK", "content": "• Point 1: Regulatory exposure...\\n• Point 2: Financial/Market risks..."},
    {"title": "Investment Summary", "icon": "SUMMARY", "content": "• Point 1: Consolidated Bull case...\\n• Point 2: Consolidated Bear case...\\n• Point 3: Definitive investment verdict..."}
  ]
}

CRITICAL: Use ONLY bullet points (•) for content. Be analytical and realistic. If a company is in distress (e.g., Vodafone Idea), reflect that clearly in the sentiment. No preamble, no code fences. Only the JSON object.`;

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

export async function* runAgentLoop(
  company: string
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

    conversationHistory.push({
      role: "user",
      text: `Analyze "${company}". Begin with a research plan.`,
    });

    const planResponse = await callGemini(systemPrompt, conversationHistory);
    conversationHistory.push({ role: "model", text: planResponse });

    const planData = parseJSON(planResponse);
    if (planData && planData.action === "plan" && Array.isArray(planData.plan)) {
      const plan = planData.plan as string[];
      yield emitStep(
        "plan",
        `Research plan established (${plan.length} steps):\n${plan
          .map((s, i) => `[0${i + 1}] ${s}`)
          .join("\n")}`
      );
    } else {
      yield emitStep("plan", "Research plan established. Commencing data acquisition.");
    }

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

        const result = await callTool(toolName as ToolName, args);

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

        const reflectionResponse = await callGemini(
          systemPrompt,
          conversationHistory
        );
        conversationHistory.push({ role: "model", text: reflectionResponse });

        const reflectionData = parseJSON(reflectionResponse);
        if (reflectionData && reflectionData.action === "reflect") {
          const assessment = (reflectionData.assessment as string) || "";
          const needsRetry = reflectionData.needsRetry as boolean;
          yield emitStep(
            "reflection",
            `${assessment}${needsRetry ? " - recalibrating approach." : ""}`
          );
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
    yield {
      type: "error",
      error: `Pipeline interruption: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}
