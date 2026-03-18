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
  return `You are an autonomous research analyst agent. Your task is to research "${company}" thoroughly and produce a structured investment/competitive brief.

You have access to the following tools:
${tools}

## Your Process
1. PLAN: Create a research plan with 4-6 steps
2. ACT: For each step, call the appropriate tool
3. OBSERVE: Read the tool output carefully
4. REFLECT: Decide if the result is sufficient or if you need to retry with a different query
5. REPEAT: Until all research is complete
6. SYNTHESIZE: Compile everything into a final structured report

## Important Rules
- Always respond with valid JSON only — no markdown, no explanation outside JSON
- If a tool returns empty results, retry with a different query before giving up
- For financial data, first search for the company's stock ticker if you don't know it
- Research competitors by searching for them specifically
- Be thorough — gather real data, don't make things up

## Response Formats

When planning, respond with:
{"action":"plan","plan":["step 1 description","step 2 description",...]}

When calling a tool, respond with:
{"action":"tool_call","tool":"search|financials|news","args":{"paramName":"value"},"reasoning":"why this tool call"}

When reflecting on results, respond with:
{"action":"reflect","assessment":"your assessment","needsRetry":true|false,"retryStrategy":"what to try differently if needed"}

When ready to synthesize the final report, respond with:
{"action":"synthesize"}`;
}

const SYNTHESIS_PROMPT = `Based on all the research gathered, create a comprehensive structured report. Respond with ONLY valid JSON in this exact format:
{
  "company": "Company Name",
  "overallSentiment": "Bullish" | "Neutral" | "Bearish",
  "sections": [
    {"title": "Company Overview", "icon": "🏢", "content": "What the company does, industry, founded, headquarters..."},
    {"title": "Financial Snapshot", "icon": "📊", "content": "Key metrics: price, market cap, P/E, revenue, margins..."},
    {"title": "Recent News & Developments", "icon": "📰", "content": "Last 5 significant news items with dates..."},
    {"title": "Competitive Landscape", "icon": "⚔️", "content": "Top 3 competitors and comparison..."},
    {"title": "Risk Factors", "icon": "⚠️", "content": "3-5 identified risks (market, regulatory, operational)..."},
    {"title": "Investment/Opportunity Summary", "icon": "💡", "content": "Bull case, Bear case, Overall sentiment..."}
  ]
}

IMPORTANT: Respond with ONLY the JSON object, no markdown formatting, no code fences, no extra text.`;

function parseJSON(text: string): Record<string, unknown> | null {
  try {
    // Try direct parse first
    return JSON.parse(text);
  } catch {
    // Try extracting JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch {
        return null;
      }
    }
    // Try finding JSON object in the text
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch {
        return null;
      }
    }
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
    // --- PHASE 1: Planning ---
    yield emitStep("plan", `🧠 Starting research on "${company}"...`);

    conversationHistory.push({
      role: "user",
      text: `Research the company "${company}". Start by creating a research plan.`,
    });

    const planResponse = await callGemini(systemPrompt, conversationHistory);
    conversationHistory.push({ role: "model", text: planResponse });

    const planData = parseJSON(planResponse);
    if (planData && planData.action === "plan" && Array.isArray(planData.plan)) {
      const plan = planData.plan as string[];
      yield emitStep(
        "plan",
        `📋 Research plan created with ${plan.length} steps:\n${plan
          .map((s, i) => `  ${i + 1}. ${s}`)
          .join("\n")}`
      );
    } else {
      yield emitStep("plan", "📋 Research plan created. Executing...");
    }

    // --- PHASE 2: Execution Loop ---
    let iterations = 0;

    while (iterations < MAX_STEPS) {
      iterations++;

      conversationHistory.push({
        role: "user",
        text: "What is your next action? If you have gathered enough information for all sections of the report, respond with {\"action\":\"synthesize\"}. Otherwise, call the next tool.",
      });

      const actionResponse = await callGemini(
        systemPrompt,
        conversationHistory
      );
      conversationHistory.push({ role: "model", text: actionResponse });

      const actionData = parseJSON(actionResponse);
      if (!actionData) {
        yield emitStep(
          "error",
          "⚠️ Could not parse agent response. Retrying..."
        );
        conversationHistory.push({
          role: "user",
          text: "Your response was not valid JSON. Please respond with only valid JSON as specified in the instructions.",
        });
        continue;
      }

      // Check for synthesis
      if (actionData.action === "synthesize") {
        yield emitStep("synthesis", "✨ All research complete. Synthesizing final report...");
        break;
      }

      // Handle tool calls
      if (actionData.action === "tool_call") {
        const toolName = actionData.tool as string;
        const args = actionData.args as Record<string, string>;
        const reasoning = (actionData.reasoning as string) || "";

        if (!VALID_TOOLS.includes(toolName as ToolName)) {
          yield emitStep("error", `⚠️ Unknown tool: ${toolName}`);
          conversationHistory.push({
            role: "user",
            text: `Tool "${toolName}" is not available. Available tools: ${VALID_TOOLS.join(", ")}`,
          });
          continue;
        }

        const toolCall: ToolCall = {
          tool: toolName as ToolName,
          args,
          reasoning,
        };

        // Emit what we're doing
        const toolEmojis: Record<ToolName, string> = {
          search: "🔍",
          financials: "📊",
          news: "📰",
        };
        const emoji = toolEmojis[toolName as ToolName] || "🔧";
        yield emitStep(
          "tool_call",
          `${emoji} ${reasoning || `Calling ${toolName} tool...`}`,
          { toolCall }
        );

        // Call the tool
        const result = await callTool(toolName as ToolName, args);

        if (result.success) {
          yield emitStep("tool_result", `✅ ${toolName} returned results`, {
            toolResult: result,
          });
          conversationHistory.push({
            role: "user",
            text: `Tool "${toolName}" returned successfully:\n${JSON.stringify(result.data, null, 2)}\n\nReflect on these results. Are they sufficient? Do you need to retry or call another tool?`,
          });
        } else {
          yield emitStep(
            "tool_result",
            `❌ ${toolName} failed: ${result.error}`,
            { toolResult: result }
          );
          conversationHistory.push({
            role: "user",
            text: `Tool "${toolName}" failed with error: ${result.error}\n\nPlease decide: retry with different parameters, skip this step, or try a different approach.`,
          });
        }

        // Get reflection
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
            `🤔 ${assessment}${needsRetry ? " — will retry with a different approach" : ""}`
          );
        }

        continue;
      }

      // Handle reflection responses  
      if (actionData.action === "reflect") {
        const assessment = (actionData.assessment as string) || "";
        yield emitStep("reflection", `🤔 ${assessment}`);
        continue;
      }

      // Fallback
      yield emitStep("reflection", "🤔 Processing...");
    }

    // --- PHASE 3: Synthesis ---
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
      // If JSON parsing fails, try to use the raw text as a fallback
      yield {
        type: "report",
        report: {
          company,
          generatedAt: new Date().toISOString(),
          overallSentiment: "Neutral",
          sections: [
            {
              title: "Research Report",
              icon: "📄",
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
      error: `Agent encountered an error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}
