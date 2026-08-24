import { NextResponse } from "next/server";
import { activeProvider, PROVIDER_LABELS, type Provider } from "@/lib/anthropic";

// Must be evaluated per-request: the provider depends on runtime env vars,
// and Next would otherwise pre-render this GET at build time and bake in
// whatever the build environment had (usually "cli").
export const dynamic = "force-dynamic";

const ALL_PROVIDERS: Provider[] = ["anthropic", "groq", "cli"];

export async function GET() {
  const provider = activeProvider();
  // "cli" has no env-var gate (it's the fallback when no key is set), so it's
  // always offered - it just fails at request time if the binary isn't installed.
  const configured = new Set<Provider>(
    [
      process.env.ANTHROPIC_API_KEY ? "anthropic" : null,
      process.env.GROQ_API_KEY ? "groq" : null,
      "cli",
    ].filter((p): p is Provider => p !== null)
  );
  return NextResponse.json({
    provider,
    label: PROVIDER_LABELS[provider] ?? provider,
    options: ALL_PROVIDERS.map((value) => ({
      value,
      label: PROVIDER_LABELS[value],
      configured: configured.has(value),
    })),
  });
}
