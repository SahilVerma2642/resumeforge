import { NextResponse } from "next/server";
import { z } from "zod";
import { callClaudeJSON, MODELS } from "@/lib/anthropic";
import type { EnhanceReport } from "@/lib/types";

export const maxDuration = 60;

const Body = z.object({
  resume: z.any(),
  jobDescription: z.string().nullable().optional(),
});

const SYSTEM = `You are a career-growth analyst for software professionals. Given a resume (and optionally a target job description), identify high-demand skills this candidate LACKS that would most improve their employability and ATS keyword coverage for their profile. Return JSON:

{
  "profile": string (one line: detected role, level, and stack, e.g. "Mid-level full-stack developer, MERN + fintech"),
  "gaps": [
    {
      "skill": string,
      "demand": "very high" | "high" | "rising",
      "why": string (1-2 sentences: why employers for THIS profile want it and how it lifts ATS keyword coverage),
      "adjacency": string (one sentence: how it builds on skills the candidate already has),
      "roadmap": [
        { "step": string (short title), "detail": string (1-2 sentences, concrete: what to learn/build), "durationWeeks": number }
      ],
      "projectIdea": string (one resume-worthy portfolio project that proves the skill, with a measurable outcome to aim for)
    }
  ],
  "summaryAdvice": string (2-3 sentences: which gap to attack first and why)
}

Rules:
- 4 to 6 gaps, ordered by impact for this specific candidate. Do NOT list skills the resume already contains.
- Prefer skills adjacent to the candidate's stack (faster to learn, credible on their resume) over trendy but unrelated ones.
- Each roadmap: 3-5 steps, realistic durations, progressing from fundamentals to a deployable artifact.
- If a job description is provided, weight its required skills heavily.
- Base demand labels on general market knowledge and say nothing you cannot support; no salary claims, no guarantees.`;

export async function POST(req: Request) {
  try {
    const { resume, jobDescription } = Body.parse(await req.json());
    const out = await callClaudeJSON<EnhanceReport>(
      SYSTEM,
      `resume:\n${JSON.stringify(resume)}\n\ntarget job description:\n${jobDescription || "none provided - use the candidate's general profile"}`,
      MODELS.smart,
      6000
    );
    return NextResponse.json(out);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Skill-gap analysis failed" },
      { status: 500 }
    );
  }
}
