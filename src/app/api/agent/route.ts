import { runAgentLoop } from "@/lib/agentLoop";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { company } = await request.json();
    const origin = new URL(request.url).origin;

    if (!company || typeof company !== "string") {
      return new Response(
        JSON.stringify({ type: "error", error: "Missing or invalid 'company' parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const messages = [];

    try {
      for await (const message of runAgentLoop(company, origin)) {
        messages.push(message);
      }
    } catch (error) {
      messages.push({
        type: "error",
        error: `Agent error: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    return new Response(JSON.stringify({ messages }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        type: "error",
        error: `Failed to start agent: ${error instanceof Error ? error.message : String(error)}`,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
