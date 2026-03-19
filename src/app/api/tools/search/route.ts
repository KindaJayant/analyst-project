import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'query' parameter" },
        { status: 400 }
      );
    }

    const { search } = await import("duck-duck-scrape");
    let results;
    let retries = 0;
    const maxRetries = 2;

    while (retries <= maxRetries) {
      try {
        results = await search(query, { safeSearch: 0 });
        break;
      } catch (e) {
        retries++;
        if (retries > maxRetries) throw e;
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }

    if (!results || !results.results) {
      return NextResponse.json([]);
    }

    const topResults = results.results.slice(0, 5).map((r) => ({
      title: r.title || "",
      url: r.url || "",
      snippet: r.description || "",
    }));

    return NextResponse.json(topResults);
  } catch (error) {
    console.error("Search tool error:", error);
    // Return empty results instead of crashing, giving the agent a chance to retry or guess
    return NextResponse.json([], { 
      status: 200, 
      headers: { "X-Search-Error": error instanceof Error ? error.message : "Rate-limited" } 
    });
  }
}
