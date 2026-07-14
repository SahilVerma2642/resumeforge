import { NextResponse } from "next/server";
import { z } from "zod";
import {
  authEnabled,
  verifyPassword,
  createSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
} from "@/lib/auth";

const Body = z.object({ password: z.string().min(1).max(200) });

export async function POST(req: Request) {
  if (!authEnabled()) {
    return NextResponse.json(
      { error: "Auth is not configured on this deployment." },
      { status: 400 }
    );
  }
  try {
    const { password } = Body.parse(await req.json());
    const ok = await verifyPassword(password);
    if (!ok) {
      return NextResponse.json({ error: "Wrong password." }, { status: 401 });
    }
    const token = await createSessionToken();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SEC,
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
