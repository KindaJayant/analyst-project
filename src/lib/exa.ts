type ExaSearchCategory = "news";

interface ExaSearchOptions {
  category?: ExaSearchCategory;
  numResults?: number;
}

interface ExaResult {
  title?: string;
  url?: string;
  publishedDate?: string;
  author?: string;
  highlights?: string[];
  summary?: string;
  text?: string;
}

interface ExaSearchResponse {
  results?: ExaResult[];
}

const EXA_API_URL = "https://api.exa.ai/search";
const exaApiKey = process.env.EXA_API_KEY;

function fallbackSnippet(result: ExaResult, query: string): string {
  if (result.summary) return result.summary;
  if (result.highlights?.length) return result.highlights.join(" ");
  if (result.text) return result.text.slice(0, 300);
  return `Exa result for ${query}`;
}

export async function exaSearch(
  query: string,
  options: ExaSearchOptions = {}
): Promise<
  Array<{
    title: string;
    url: string;
    snippet: string;
    publishedDate?: string;
    author?: string;
  }>
> {
  if (!exaApiKey) {
    throw new Error("EXA_API_KEY is not configured");
  }

  const body: Record<string, unknown> = {
    query,
    type: "auto",
    numResults: options.numResults ?? 5,
    contents: {
      highlights: {
        maxCharacters: 280,
      },
      summary: true,
    },
  };

  if (options.category) {
    body.category = options.category;
  }

  const response = await fetch(EXA_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": exaApiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Exa search failed (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as ExaSearchResponse;
  const results = data.results ?? [];

  return results
    .filter((result) => result.url)
    .map((result) => ({
      title: result.title || "",
      url: result.url || "",
      snippet: fallbackSnippet(result, query),
      publishedDate: result.publishedDate,
      author: result.author,
    }));
}
