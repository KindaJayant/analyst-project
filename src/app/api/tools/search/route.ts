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
    const results = await search(query, { safeSearch: 0 });

    const topResults = results.results.slice(0, 5).map((r) => ({
      title: r.title || "",
      url: r.url || "",
      snippet: r.description || "",
    }));

    return NextResponse.json(topResults);
  } catch (error) {
    console.error("Search tool error:", error);
    return NextResponse.json(
      { error: `Search failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
