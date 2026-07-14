import { NextResponse } from "next/server";
import { z } from "zod";
import { callClaudeJSON, MODELS, RESUME_SCHEMA_DOC } from "@/lib/anthropic";
import type { Resume } from "@/lib/types";

export const maxDuration = 60;

const Body = z.object({
  resume: z.any(),
  jdAnalysis: z.any().nullable().optional(),
});

const SYSTEM = `You are an expert resume writer. Rewrite the given resume JSON for maximum recruiter impact and return the SAME schema:

${RESUME_SCHEMA_DOC}

Rules:
- Strong action verbs; concise bullets (max ~28 words / 2 lines each).
- Quantify ONLY where the candidate's data already contains numbers. If a bullet has no numbers, use scope indicators (team size, system scale) - NEVER invented percentages.
- ATS-safe plain language; expand niche acronyms once.
- If jdAnalysis is provided, weave its keywords in naturally where truthful.
- Preserve all ids, dates, employers, and facts. Do not add or remove jobs.
- TENSE: keep past tense for completed roles; the current role may use past or present tense but must be consistent within the role. NEVER make a tense change the only edit to a bullet - if a bullet is already strong, leave it exactly as it is.`;

export async function POST(req: Request) {
  try {
    const { resume, jdAnalysis } = Body.parse(await req.json());
    const out = await callClaudeJSON<Resume>(
      SYSTEM,
      `resume:\n${JSON.stringify(resume)}\n\njdAnalysis:\n${JSON.stringify(jdAnalysis ?? null)}`,
      MODELS.smart,
      6000
    );
    return NextResponse.json({ resume: out });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Generation failed" },
      { status: 500 }
    );
  }
}
