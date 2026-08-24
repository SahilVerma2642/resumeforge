import { NextResponse } from "next/server";
import { z } from "zod";
import { kvAvailable, kvSet } from "@/lib/kv";

// Creates a short share link (auth-gated by the /api/* middleware matcher,
// so only the owner can publish). Returns 503 when no KV is configured, and
// the client falls back to the serverless hash-link format.
export const maxDuration = 15;

const TTL_DAYS = 180;
const Body = z.object({ resume: z.any() });

function shortId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  let s = "";
  bytes.forEach((b) => {
    s += chars[b % chars.length];
  });
  return s;
}

export async function POST(req: Request) {
  if (!kvAvailable()) {
    return NextResponse.json(
      { error: "Short links need KV storage (not configured)." },
      { status: 503 }
    );
  }
  try {
    const { resume } = Body.parse(await req.json());
    const id = shortId();
    await kvSet(`resume:${id}`, JSON.stringify(resume), TTL_DAYS * 24 * 60 * 60);
    return NextResponse.json({ id, ttlDays: TTL_DAYS });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Share failed" }, { status: 500 });
  }
}
