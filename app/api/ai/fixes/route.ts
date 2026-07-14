import { NextResponse } from "next/server";
import { z } from "zod";
import { callClaudeJSON, MODELS } from "@/lib/anthropic";
import type { Suggestion } from "@/lib/types";

export const maxDuration = 60;

const Body = z.object({
  resume: z.any(),
  fixes: z.array(z.object({ priority: z.string(), message: z.string() })),
});

const SYSTEM = `You convert ATS-report fixes into concrete, machine-applicable resume edits. Return JSON:

{ "skipped": [
  {
    "fix": string (short paraphrase of the fix you could not apply),
    "reason": string (why: e.g. it needs a real metric or date only the candidate knows),
    "whatToAdd": string (exactly what the candidate should add manually, e.g. "your real P99 latency numbers before/after")
  }
],
"suggestions": [
  {
    "id": string (short random),
    "type": "rewrite_bullet" | "add_skill" | "add_keyword" | "rewrite_summary" | "new_bullet",
    "targetPath": string,
    "original": string | null,
    "proposed": string,
    "reason": string (one sentence naming which fix this addresses),
    "status": "pending"
  }
] }

targetPath format (must be exact - it is machine-applied):
- rewrite_summary          -> "summary"
- rewrite_bullet           -> "experience[I].bullets[J]" using zero-based indices from the resume JSON
- new_bullet               -> "experience[I].bullets"
- add_skill / add_keyword  -> "skills.languages" | "skills.frameworks" | "skills.databases" | "skills.tools"

Rules:
- Produce one or more suggestions per fix where an edit can express it WITHOUT inventing facts.
- Any fix that needs information only the candidate has (real metrics, dates, links, new jobs, degrees) goes into "skipped" with clear whatToAdd guidance - NEVER invent a number to satisfy a fix.
- NEVER fabricate experience, employers, titles, or metrics. Only rephrase, restructure, and surface existing facts.
- Proposed bullets: strong action verb first, max ~28 words, quantified only with the candidate's real numbers.
- "original" is the exact current text for rewrites, null for additions.
- 3 to 10 suggestions total, highest-impact first.`;

export async function POST(req: Request) {
  try {
    const { resume, fixes } = Body.parse(await req.json());
    const out = await callClaudeJSON<{
      suggestions: Suggestion[];
      skipped: { fix: string; reason: string; whatToAdd: string }[];
    }>(
      SYSTEM,
      `resume:\n${JSON.stringify(resume)}\n\nfixes to address:\n${JSON.stringify(fixes)}`,
      MODELS.smart,
      6000
    );
    const suggestions = (out.suggestions ?? []).map((s) => ({
      ...s,
      status: "pending" as const,
    }));
    return NextResponse.json({ suggestions, skipped: out.skipped ?? [] });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Fix generation failed" },
      { status: 500 }
    );
  }
}
