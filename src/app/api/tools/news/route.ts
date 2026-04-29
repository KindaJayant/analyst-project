import { NextResponse } from "next/server";
import Parser from "rss-parser";
import { exaSearch } from "@/lib/exa";
import type { NewsItem } from "@/types";

const parser = new Parser();

export async function POST(request: Request) {
  try {
    const { company } = await request.json();

    if (!company || typeof company !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'company' parameter" },
        { status: 400 }
      );
    }

    if (process.env.EXA_API_KEY) {
      const exaResults = await exaSearch(company, {
        category: "news",
        numResults: 8,
      });

      if (exaResults.length > 0) {
        const newsItems: NewsItem[] = exaResults.map((result) => {
          let source = "Exa";

          try {
            source = new URL(result.url).hostname.replace(/^www\./, "");
          } catch {
            source = result.author || "Exa";
          }

          return {
            title: result.title,
            date: result.publishedDate || new Date().toISOString(),
            source,
            url: result.url,
          };
        });

        return NextResponse.json(newsItems);
      }
    }

    const encodedCompany = encodeURIComponent(company);
    const rssUrl = `https://news.google.com/rss/search?q=${encodedCompany}&hl=en-IN&gl=IN&ceid=IN:en`;

    const feed = await parser.parseURL(rssUrl);

    const newsItems: NewsItem[] = feed.items.slice(0, 8).map((item) => {
      // Google News RSS often includes the source in the title like "Title - Source"
      let source = "Google News";
      let title = item.title || "";
      const dashIndex = title.lastIndexOf(" - ");
      if (dashIndex > 0) {
        source = title.substring(dashIndex + 3);
        title = title.substring(0, dashIndex);
      }

      return {
        title,
        date: item.pubDate || item.isoDate || new Date().toISOString(),
        source,
        url: item.link || "",
      };
    });

    return NextResponse.json(newsItems);
  } catch (error) {
    console.error("News tool error:", error);
    return NextResponse.json(
      {
        error: `News fetch failed: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 }
    );
  }
}
