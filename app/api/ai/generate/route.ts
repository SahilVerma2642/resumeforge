import { NextResponse } from "next/server";
import { z } from "zod";
import { callClaudeJSON, MODELS, RESUME_SCHEMA_DOC } from "@/lib/anthropic";
import type { Resume } from "@/lib/types";

/**
 * Weaker models sometimes regenerate the internal ids despite instructions,
 * which breaks the before/after diff (it matches bullets and roles by id).
 * Since the prompt forbids adding/removing jobs, we can safely restore the
 * original ids by position.
 */
function reconcileIds(original: Resume, rewritten: Resume): Resume {
  const out: Resume = JSON.parse(JSON.stringify(rewritten));
  out.experience?.forEach((exp, i) => {
    const orig = original.experience?.[i];
    if (!orig) return;
    exp.id = orig.id;
    exp.bullets?.forEach((b, j) => {
      if (orig.bullets?.[j]) b.id = orig.bullets[j].id;
    });
  });
  out.education?.forEach((ed, i) => {
    if (original.education?.[i]) ed.id = original.education[i].id;
  });
  out.projects?.forEach((pr, i) => {
    if (original.projects?.[i]) pr.id = original.projects[i].id;
  });
  return out;
}

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
    return NextResponse.json({ resume: reconcileIds(resume, out) });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Generation failed" },
      { status: 500 }
    );
  }
}
