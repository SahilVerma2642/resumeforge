import { NextResponse } from "next/server";
import { z } from "zod";
import { callClaudeJSON, MODELS, resolveProvider } from "@/lib/anthropic";

export const maxDuration = 60;

const Body = z.object({
  resume: z.any(),
  jobDescription: z.string().min(50),
  company: z.string().max(120).optional(),
  role: z.string().max(120).optional(),
  tone: z.enum(["professional", "warm", "direct"]).default("professional"),
});

const SYSTEM = `You write short, effective cover letters. Return JSON: { "letter": string }.

Rules:
- 180-260 words, 3-4 paragraphs, no address block, start with "Dear Hiring Manager," (or the company's team if named).
- Ground EVERY claim in the resume - never invent experience, employers, or metrics. Use the candidate's real numbers.
- Mirror the job description's language naturally; name the company and role if provided.
- No cliches ("I am writing to express", "team player", "passionate"), no flattery padding. Specific and confident.
- Match the requested tone. Never use the em dash character; use commas or hyphens.
- End with a one-line call to action and "Sincerely," followed by the candidate's name.`;

export async function POST(req: Request) {
  try {
    const { resume, jobDescription, company, role, tone } = Body.parse(await req.json());
    const provider = resolveProvider(req.headers.get("x-ai-provider"));
    const out = await callClaudeJSON<{ letter: string }>(
      SYSTEM,
      `resume:\n${JSON.stringify(resume)}\n\njob_description:\n${jobDescription}\n\ncompany: ${company || "not specified"}\nrole: ${role || "not specified"}\ntone: ${tone}`,
      MODELS.smart,
      2000,
      provider
    );
    return NextResponse.json(out);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Letter generation failed" }, { status: 500 });
  }
}
