import { NextResponse } from "next/server";
import { z } from "zod";
import { extractResumeFromText } from "@/lib/extractResume";

export const maxDuration = 60;

const Body = z.object({ rawText: z.string().min(30) });

export async function POST(req: Request) {
  try {
    const { rawText } = Body.parse(await req.json());
    const resume = await extractResumeFromText(rawText);
    return NextResponse.json({ resume });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Extraction failed" },
      { status: 500 }
    );
  }
}
