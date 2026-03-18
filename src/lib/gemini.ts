const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "google/gemini-2.0-flash-001";

const apiKey = process.env.OPENROUTER_API_KEY;

if (!apiKey) {
  throw new Error("OPENROUTER_API_KEY environment variable is not set");
}

export async function callGemini(
  systemPrompt: string,
  conversationHistory: { role: "user" | "model"; text: string }[]
): Promise<string> {
  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...conversationHistory.map((msg) => ({
      role: (msg.role === "model" ? "assistant" : "user") as "user" | "assistant",
      content: msg.text,
    })),
  ];

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}
