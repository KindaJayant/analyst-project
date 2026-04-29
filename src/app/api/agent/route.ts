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

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const message of runAgentLoop(company, origin)) {
            const line = JSON.stringify(message) + "\n";
            controller.enqueue(encoder.encode(line));
          }
        } catch (error) {
          const errorMessage = JSON.stringify({
            type: "error",
            error: `Agent error: ${error instanceof Error ? error.message : String(error)}`,
          });
          controller.enqueue(encoder.encode(errorMessage + "\n"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
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
