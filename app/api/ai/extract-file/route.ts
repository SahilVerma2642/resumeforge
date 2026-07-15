import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { extractResumeFromText } from "@/lib/extractResume";

export const runtime = "nodejs"; // pdf-parse & mammoth need Node, not Edge
export const maxDuration = 60;

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

async function fileToText(file: File): Promise<string> {
  const buf = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    // unpdf: pdfjs packaged for serverless runtimes (no DOMMatrix/canvas needed)
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
  }
  if (
    name.endsWith(".docx") ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const { value } = await mammoth.extractRawText({ buffer: buf });
    return value;
  }
  if (name.endsWith(".txt") || file.type.startsWith("text/")) {
    return buf.toString("utf-8");
  }
  if (name.endsWith(".doc")) {
    throw new Error(
      "Legacy .doc files aren't supported - save it as .docx or PDF and retry."
    );
  }
  throw new Error("Unsupported file type. Upload a PDF, DOCX, or TXT file.");
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File is larger than 8 MB." },
        { status: 400 }
      );
    }

    const text = (await fileToText(file)).replace(/\u0000/g, "").trim();
    if (text.length < 30) {
      return NextResponse.json(
        {
          error:
            "Couldn't read text from this file. If it's a scanned/image PDF, there is no text layer to extract - paste the text instead.",
        },
        { status: 422 }
      );
    }

    const resume = await extractResumeFromText(text.slice(0, 40_000));
    return NextResponse.json({ resume });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "File import failed" },
      { status: 500 }
    );
  }
}
