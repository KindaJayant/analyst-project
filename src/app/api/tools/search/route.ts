import { NextResponse } from "next/server";
import { exaSearch } from "@/lib/exa";

export async function POST(request: Request) {
  const body = await request.json();
  const query: string = body?.query;

  if (!query || typeof query !== "string") {
    return NextResponse.json(
      { error: "Invalid search query parameter" },
      { status: 400 }
    );
  }

  try {
    if (process.env.EXA_API_KEY) {
      const exaResults = await exaSearch(query, { numResults: 5 });
      if (exaResults.length > 0) {
        return NextResponse.json(
          exaResults.map((result) => ({
            title: result.title,
            url: result.url,
            snippet: result.snippet,
          }))
        );
      }
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
    try {
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
      const response = await fetch(rssUrl);
      if (!response.ok) throw new Error("RSS fallback connection failed");
      
      const xml = await response.text();
      const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
      const fallbackResults = items.slice(0, 5).map(item => {
        const title = item.match(/<title>(.*?)<\/title>/)?.[1] || "";
        const link = item.match(/<link>(.*?)<\/link>/)?.[1] || "";
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
        return {
          title: title.replace(/ - .*/, ""), 
          url: link,
          snippet: `Record date: ${pubDate}. Market intelligence for ${query}.`
        };
      });

      return NextResponse.json(fallbackResults);
    } catch (fallbackError) {
      return NextResponse.json([], { 
        status: 200, 
        headers: { "X-Search-Status": "Service degradation; fallback failed" } 
      });
    }
  }
}
