const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatGeminiError(status: number, errorBody: string): string {
  if (status !== 429) {
    return `Gemini API error (${status}): ${errorBody}`;
  }

  let retrySeconds: string | null = null;

  try {
    const parsed = JSON.parse(errorBody);
    const retryDelay = parsed?.error?.details?.find(
      (detail: { ["@type"]?: string }) =>
        detail?.["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
    )?.retryDelay;

    if (typeof retryDelay === "string") {
      retrySeconds = retryDelay.replace("s", " seconds");
    }
  } catch {
    retrySeconds = null;
  }

  return retrySeconds
    ? `Gemini API quota exceeded. Please retry in about ${retrySeconds}, or switch to a Gemini project with available quota.`
    : "Gemini API quota exceeded. Please retry shortly, or switch to a Gemini project with available quota.";
}

export async function callGemini(
  systemPrompt: string,
  conversationHistory: { role: "user" | "model"; text: string }[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const contents = [
    ...conversationHistory.map((msg) => ({
      role: msg.role === "model" ? "model" : "user",
      parts: [{ text: msg.text }],
    })),
  ];

  const body = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 2048,
      topP: 0.9,
    },
  };

  const maxAttempts = 4;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const data = await response.json();
      const text =
        data?.candidates?.[0]?.content?.parts
          ?.map((part: { text?: string }) => part.text || "")
          .join("") || "";

      if (!text) {
        throw new Error("Gemini API returned an empty response");
      }

      return text;
    }

    const errorBody = await response.text();
    const shouldRetry =
      response.status === 429 || response.status === 500 || response.status === 503;

    if (!shouldRetry || attempt === maxAttempts) {
      throw new Error(formatGeminiError(response.status, errorBody));
    }

    const backoffMs = 1500 * attempt + Math.floor(Math.random() * 500);
    await sleep(backoffMs);
  }

  throw new Error("Gemini API failed after multiple retry attempts");
}
