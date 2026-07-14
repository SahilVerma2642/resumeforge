import { NextResponse } from "next/server";
import { z } from "zod";
import { callClaudeJSON, MODELS } from "@/lib/anthropic";
import type { ScoreReport } from "@/lib/types";

export const maxDuration = 60;

const Body = z.object({
  resume: z.any(),
  jobDescription: z.string().nullable().optional(),
});

const SYSTEM = `You are an ATS and recruiting evaluator. Score the resume and return JSON:

{
  "overallScore": number (0-100),
  "grade": "A" | "B" | "C" | "D",
  "subScores": {
    "keywordMatch": number (0-100, vs the JD if provided, else vs typical postings for this role),
    "impactStrength": number (0-100, quantification + verb strength),
    "formatting": number (0-100, structure completeness, bullet length discipline),
    "completeness": number (0-100, missing sections or thin content)
  },
  "fixes": [ { "priority": "critical" | "high" | "medium", "message": string } ],
  "strengths": string[],
  "verdict": string (one coaching sentence)
}

Rules:
- Fixes must be specific and actionable ("Add metrics to your 2nd bullet at Acme", not "improve bullets").
- Be honest; do not inflate scores. 3-6 fixes, 2-3 strengths.`;

export async function POST(req: Request) {
  try {
    const { resume, jobDescription } = Body.parse(await req.json());
    const out = await callClaudeJSON<ScoreReport>(
      SYSTEM,
      `resume:\n${JSON.stringify(resume)}\n\njob_description:\n${jobDescription ?? "none provided"}`,
      MODELS.fast,
      3000
    );
    return NextResponse.json(out);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Scoring failed" },
      { status: 500 }
    );
  }
}
