// SERVER-ONLY: Groq provider (OpenAI-compatible chat completions API).
import "server-only";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Model mapping, configurable because Groq's lineup changes often:
 *   GROQ_MODEL_SMART - generation/tailoring/extraction (default: llama-3.3-70b-versatile)
 *   GROQ_MODEL_FAST  - scoring                          (default: same, unless overridden)
 */
function groqModel(anthropicModel: string): string {
  if (anthropicModel.includes("haiku")) {
    return (
      process.env.GROQ_MODEL_FAST?.trim() ||
      process.env.GROQ_MODEL_SMART?.trim() ||
      "llama-3.3-70b-versatile"
    );
  }
  return process.env.GROQ_MODEL_SMART?.trim() || "llama-3.3-70b-versatile";
}

export async function callGroq(
  system: string,
  user: string,
  anthropicModel: string,
  maxTokens: number
): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.GROQ_API_KEY ?? ""}`,
    },
    body: JSON.stringify({
      model: groqModel(anthropicModel),
      max_completion_tokens: maxTokens,
      temperature: 0.4,
      // Our prompts always demand JSON; json_object mode enforces it server-side
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq API ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Groq API returned an empty response");
  }
  return content;
}
