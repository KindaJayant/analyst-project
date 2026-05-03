const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "google/gemini-2.0-flash-001";

type ConversationMessage = {
  role: "user" | "model";
  text: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryDelayMs(errorBody: string): number | null {
  try {
    const parsed = JSON.parse(errorBody);
    const retryDelay = parsed?.error?.details?.find(
      (detail: { ["@type"]?: string }) =>
        detail?.["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
    )?.retryDelay;

    if (typeof retryDelay !== "string") {
      return null;
    }

    const seconds = Number.parseFloat(retryDelay.replace("s", ""));
    return Number.isFinite(seconds) ? Math.ceil(seconds * 1000) : null;
  } catch {
    return null;
  }
}

function formatGeminiError(status: number, errorBody: string): string {
  if (status !== 429) {
    return `Gemini API error (${status}): ${errorBody}`;
  }

  let retrySeconds: string | null = null;
  const retryDelayMs = parseRetryDelayMs(errorBody);
  if (retryDelayMs !== null) {
    retrySeconds = `${Math.ceil(retryDelayMs / 1000)} seconds`;
  }

  return retrySeconds
    ? `Gemini API quota exceeded. Please retry in about ${retrySeconds}, or switch to a Gemini project with available quota.`
    : "Gemini API quota exceeded. Please retry shortly, or switch to a Gemini project with available quota.";
}

function formatOpenRouterError(status: number, errorBody: string): string {
  if (status !== 429) {
    return `OpenRouter API error (${status}): ${errorBody}`;
  }

  return "OpenRouter rate limit reached. Please retry shortly.";
}

function shouldFallbackFromOpenRouter(errorMessage: string): boolean {
  const normalized = errorMessage.toLowerCase();

  return (
    normalized.includes("openrouter_api_key environment variable is not set") ||
    normalized.includes("user not found") ||
    normalized.includes("invalid api key") ||
    normalized.includes("unauthorized") ||
    normalized.includes("401")
  );
}

function shouldFallbackFromGemini(status: number): boolean {
  return status === 429 || status === 500 || status === 503;
}

async function callOpenRouter(
  systemPrompt: string,
  conversationHistory: ConversationMessage[]
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationHistory.map((msg) => ({
          role: msg.role === "model" ? "assistant" : "user",
          content: msg.text,
        })),
      ],
      temperature: 0.4,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    throw new Error(
      formatOpenRouterError(response.status, await response.text())
    );
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content?.trim();

  if (!text) {
    throw new Error("OpenRouter returned an empty response");
  }

  return text;
}

async function callDirectGemini(
  systemPrompt: string,
  conversationHistory: ConversationMessage[]
): Promise<string> {
  const apiKey =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing LLM credentials. Set OPENROUTER_API_KEY or GEMINI_API_KEY."
    );
  }

  const contents = conversationHistory.map((msg) => ({
    role: msg.role === "model" ? "model" : "user",
    parts: [{ text: msg.text }],
  }));

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

  const maxAttempts = 3;

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
          .join("")
          .trim() || "";

      if (!text) {
        throw new Error("Gemini API returned an empty response");
      }

      return text;
    }

    const errorBody = await response.text();
    const shouldRetry = shouldFallbackFromGemini(response.status);

    if (!shouldRetry || attempt === maxAttempts) {
      throw new Error(formatGeminiError(response.status, errorBody));
    }

    const retryDelayMs = parseRetryDelayMs(errorBody);
    const backoffMs =
      retryDelayMs ?? 2500 * attempt + Math.floor(Math.random() * 750);
    await sleep(backoffMs);
  }

  throw new Error("Gemini API failed after multiple retry attempts");
}

export async function callGemini(
  systemPrompt: string,
  conversationHistory: ConversationMessage[]
): Promise<string> {
  try {
    return await callDirectGemini(systemPrompt, conversationHistory);
  } catch (error) {
    if (!process.env.OPENROUTER_API_KEY) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    const normalized = message.toLowerCase();

    const canUseBackup =
      normalized.includes("missing llm credentials") ||
      normalized.includes("quota exceeded") ||
      normalized.includes("api error (429)") ||
      normalized.includes("api error (500)") ||
      normalized.includes("api error (503)");

    if (!canUseBackup) {
      throw error;
    }
  }

  if (process.env.OPENROUTER_API_KEY) {
    try {
      return await callOpenRouter(systemPrompt, conversationHistory);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (!shouldFallbackFromOpenRouter(message)) {
        throw error;
      }
    }
  }

  return callDirectGemini(systemPrompt, conversationHistory);
}
