import { NextResponse } from "next/server";

// #5 ATS X-ray: extract the literal text layer from the generated PDF so the
// user sees exactly what an ATS parser sees. No AI involved - and deliberately
// outside /api/ai/* so it doesn't consume the AI rate limit (it IS still
// behind the auth gate via the /api/:path* middleware matcher).
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }
    const buf = new Uint8Array(await file.arrayBuffer());
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(buf);
    const { text } = await extractText(pdf, { mergePages: true });
    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "X-ray failed" }, { status: 500 });
  }
}
