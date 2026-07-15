import { NextResponse } from "next/server";
import { activeProvider } from "@/lib/anthropic";

// Must be evaluated per-request: the provider depends on runtime env vars,
// and Next would otherwise pre-render this GET at build time and bake in
// whatever the build environment had (usually "cli").
export const dynamic = "force-dynamic";

const LABELS: Record<string, string> = {
  anthropic: "Anthropic API",
  groq: "Groq",
  cli: "Claude CLI (local)",
};

export async function GET() {
  const provider = activeProvider();
  return NextResponse.json({ provider, label: LABELS[provider] ?? provider });
}
