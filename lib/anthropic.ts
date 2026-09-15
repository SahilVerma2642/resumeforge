// SERVER-ONLY: never import this from a client component.
// AI provider hub with automatic selection:
//   1. ANTHROPIC_API_KEY set -> Anthropic API
//   2. GROQ_API_KEY set      -> Groq API (OpenAI-compatible; good free tier for Vercel)
//   3. neither               -> local Claude Code CLI (`claude -p`), for local dev
// Force one explicitly with AI_PROVIDER=anthropic | groq | cli.
import "server-only";
import { runLocalClaude } from "./localClaude";
import { callGroq } from "./groq";

const API_URL = "https://api.anthropic.com/v1/messages";

export const MODELS = {
  smart: "claude-sonnet-4-6", // extraction, tailoring, generation
  fast: "claude-haiku-4-5-20251001", // scoring
} as const;

export type Provider = "anthropic" | "groq" | "cli";

export const PROVIDER_LABELS: Record<Provider, string> = {
  anthropic: "Anthropic API",
  groq: "Groq",
  cli: "Claude CLI (local)",
};

export function activeProvider(): Provider {
  const forced = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (forced === "anthropic" || forced === "groq" || forced === "cli") return forced;
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.GROQ_API_KEY) return "groq";
  return "cli";
}

/**
 * Resolve a per-request override (e.g. the "x-ai-provider" header set by the
 * user's dropdown) against the deployment's env-based default. Falls back to
 * activeProvider() when the override is missing or not a recognized value.
 */
export function resolveProvider(override?: string | null): Provider {
  const v = override?.trim().toLowerCase();
  if (v === "anthropic" || v === "groq" || v === "cli") return v;
  return activeProvider();
}

async function callViaApi(
  system: string,
  user: string,
  model: string,
  maxTokens: number
): Promise<string> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  return (data.content ?? [])
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n");
}

async function callClaude(
  system: string,
  user: string,
  model: string,
  maxTokens = 4096,
  provider: Provider = activeProvider()
): Promise<string> {
  switch (provider) {
    case "anthropic":
      return callViaApi(system, user, model, maxTokens);
    case "groq":
      return callGroq(system, user, model, maxTokens);
    default:
      return runLocalClaude(system, user, model);
  }
}

function sanitize(text: string): string {
  // No em/en dashes in AI output - plain hyphens only
  const noDashes = text.replace(/\u2014/g, "-").replace(/\u2013/g, "-");
  // Providers sometimes emit raw control characters (literal newlines/tabs)
  // inside JSON string literals instead of escaping them, which JSON.parse
  // rejects. Escape control chars while inside a string (tracking quote
  // state and backslash escapes) so structural JSON whitespace is untouched.
  let out = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < noDashes.length; i++) {
    const ch = noDashes[i];
    const code = noDashes.charCodeAt(i);
    if (inString && !escaped && code < 0x20) {
      if (ch === "\n") out += "\\n";
      else if (ch === "\r") out += "\\r";
      else if (ch === "\t") out += "\\t";
      else out += "\\u" + code.toString(16).padStart(4, "0");
      continue;
    }
    out += ch;
    if (escaped) {
      escaped = false;
    } else if (ch === "\\" && inString) {
      escaped = true;
    } else if (ch === '"') {
      inString = !inString;
    }
  }
  return out;
}

function stripFences(text: string): string {
  // The CLI may add prose around the JSON despite instructions; grab the
  // outermost JSON object if plain parsing would fail.
  const t = text
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/, "")
    .trim();
  if (t.startsWith("{") || t.startsWith("[")) return t;
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start !== -1 && end > start) return t.slice(start, end + 1);
  return t;
}

/**
 * Calls the active provider expecting a pure-JSON response. Retries once with
 * an explicit reminder if the first response fails to parse.
 */
export async function callClaudeJSON<T>(
  system: string,
  user: string,
  model: string = MODELS.smart,
  maxTokens = 4096,
  provider: Provider = activeProvider()
): Promise<T> {
  const strictSystem =
    system +
    "\n\nReturn ONLY valid JSON. No markdown fences. No commentary before or after the JSON." +
    "\nNEVER use the em dash character (\u2014) in any generated text; use a comma or a plain hyphen instead.";

  let text = await callClaude(strictSystem, user, model, maxTokens, provider);
  try {
    return JSON.parse(sanitize(stripFences(text))) as T;
  } catch {
    text = await callClaude(
      strictSystem,
      user + "\n\nREMINDER: Return ONLY valid JSON. No markdown fences. No commentary.",
      model,
      maxTokens,
      provider
    );
    return JSON.parse(sanitize(stripFences(text))) as T;
  }
}

export const RESUME_SCHEMA_DOC = `{
  "personal": { "name": string, "email": string, "phone": string, "location": string, "linkedin": string|null, "website": string|null },
  "summary": string,
  "experience": [ { "id": string, "title": string, "company": string, "location": string|null, "startDate": string, "endDate": string ("Present" allowed), "bullets": [ { "id": string, "text": string } ] } ],
  "skills": [ { "id": string, "label": string, "items": string[] } ],
  "education": [ { "id": string, "degree": string, "field": string, "institution": string, "year": string } ],
  "projects": [ { "id": string, "name": string, "techStack": string[], "description": string, "impact": string|null } ],
  "certifications": string[]
}
For every "id" field generate a short random alphanumeric string.`;
