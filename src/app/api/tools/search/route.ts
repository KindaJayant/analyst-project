import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const query: string = body?.query;

  if (!query || typeof query !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid 'query' parameter" },
      { status: 400 }
    );
  }

  try {
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
    console.warn("DDG Search failed, trying Google News fallback:", error);
    try {
      // Fallback: Use Google News RSS as a search engine for headlines/snippets
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
      const response = await fetch(rssUrl);
      const xml = await response.text();
      
      // Minimal regex-based XML parsing to avoid large dependencies
      const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
      const fallbackResults = items.slice(0, 5).map(item => {
        const title = item.match(/<title>(.*?)<\/title>/)?.[1] || "";
        const link = item.match(/<link>(.*?)<\/link>/)?.[1] || "";
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
        return {
          title: title.replace(/ - .*/, ""), // Clean source from title
          url: link,
          snippet: `Published: ${pubDate}. Latest news finding for ${query}.`
        };
      });

      return NextResponse.json(fallbackResults);
    } catch (fallbackError) {
      console.error("All search methods failed:", fallbackError);
      return NextResponse.json([], { 
        status: 200, 
        headers: { "X-Search-Error": "Rate-limited and fallback failed" } 
      });
    }
  }
}
