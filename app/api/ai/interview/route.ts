import { NextResponse } from "next/server";
import { z } from "zod";
import { callClaudeJSON, MODELS, resolveProvider } from "@/lib/anthropic";

export const maxDuration = 60;

const Body = z.object({
  resume: z.any(),
  jobDescription: z.string().min(50),
});

const SYSTEM = `You are an interview coach. Given a resume and a target job description, predict the interview questions this specific application will produce. Return JSON:

{
  "questions": [
    {
      "question": string,
      "category": "likely" | "gap-probe",
      "why": string (one sentence: why this will be asked, referencing the JD or a resume gap),
      "star": {
        "situation": string,
        "task": string,
        "action": string,
        "result": string
      }
    }
  ]
}

Rules:
- 6-9 questions total. Mark 2-4 as "gap-probe": questions targeting requirements in the JD the resume is weakest on.
- STAR skeletons must be built ONLY from the candidate's real resume content - suggest which of their actual projects/roles to use. Where the resume has no material for an honest answer, say so in the skeleton and advise how to answer truthfully (e.g. adjacent experience + learning plan). NEVER invent experience.
- Questions must be specific to this JD and resume, not generic ("tell me about yourself" only if genuinely likely for this role level).
- Never use the em dash character.`;

export async function POST(req: Request) {
  try {
    const { resume, jobDescription } = Body.parse(await req.json());
    const provider = resolveProvider(req.headers.get("x-ai-provider"));
    const out = await callClaudeJSON<{ questions: any[] }>(
      SYSTEM,
      `resume:\n${JSON.stringify(resume)}\n\njob_description:\n${jobDescription}`,
      MODELS.smart,
      6000,
      provider
    );
    return NextResponse.json(out);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Interview prep failed" }, { status: 500 });
  }
}
