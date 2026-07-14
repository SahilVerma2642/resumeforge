import { NextResponse } from "next/server";
import { z } from "zod";
import { callClaudeJSON, MODELS } from "@/lib/anthropic";
import type { Suggestion } from "@/lib/types";

export const maxDuration = 60;

const Body = z.object({
  resume: z.any(),
  jobDescription: z.string().min(50),
});

interface TailorResponse {
  matchScore: number;
  missingSkills: string[];
  keywordsToAdd: string[];
  suggestions: Suggestion[];
}

const SYSTEM = `You are a job-description alignment analyst for resumes. Compare the candidate's resume JSON to the job description and return JSON:

{
  "matchScore": number (0-100, honest assessment of current alignment),
  "missingSkills": string[] (top skills the JD wants that the resume lacks),
  "keywordsToAdd": string[] (JD vocabulary the resume should surface),
  "suggestions": [
    {
      "id": string (short random),
      "type": "rewrite_bullet" | "add_skill" | "add_keyword" | "rewrite_summary" | "new_bullet",
      "targetPath": string,
      "original": string | null,
      "proposed": string,
      "reason": string (ONE sentence tying this change to the JD),
      "status": "pending"
    }
  ]
}

targetPath format (must be exact - it is machine-applied):
- rewrite_summary          -> "summary"
- rewrite_bullet           -> "experience[I].bullets[J]" using zero-based indices from the resume JSON
- new_bullet               -> "experience[I].bullets"
- add_skill / add_keyword  -> "skills.languages" | "skills.frameworks" | "skills.databases" | "skills.tools"

Rules:
- Generate 6 to 12 suggestions, highest-impact first.
- NEVER fabricate experience, employers, titles, or metrics the candidate does not have. Only rephrase, reorder, and surface existing facts using the JD's vocabulary.
- add_skill only for skills plausibly implied by the candidate's existing experience or projects.
- Proposed bullets: strong action verb first, max ~28 words, quantified only with the candidate's real numbers.
- "original" is the exact current text for rewrites, null for additions.`;

export async function POST(req: Request) {
  try {
    const { resume, jobDescription } = Body.parse(await req.json());
    const out = await callClaudeJSON<TailorResponse>(
      SYSTEM,
      `resume:\n${JSON.stringify(resume)}\n\njob_description:\n${jobDescription}`,
      MODELS.smart,
      6000
    );
    out.suggestions = (out.suggestions ?? []).map((s) => ({ ...s, status: "pending" }));
    return NextResponse.json(out);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Tailoring failed" },
      { status: 500 }
    );
  }
}
