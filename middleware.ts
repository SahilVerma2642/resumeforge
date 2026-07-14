import { NextRequest, NextResponse } from "next/server";
import { authEnabled, verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

/**
 * Rate limiting for all AI routes (/api/ai/*).
 *
 * In-memory fixed-window counters per client IP:
 *   - short window: protects against bursts / bots hammering the key
 *   - daily window: caps how much any one visitor can spend
 *
 * Honest limitation: memory is per serverless/edge instance, so counters reset
 * on cold starts and are not shared across instances. That still stops the
 * common abuse patterns; for hard multi-instance guarantees, swap the Map for
 * a shared store (e.g. Upstash Redis) - the interface below stays the same.
 * Always ALSO set a spend limit in the Anthropic console.
 */

const PER_MINUTE = Number(process.env.RATE_LIMIT_PER_MINUTE ?? 6);
const PER_DAY = Number(process.env.RATE_LIMIT_PER_DAY ?? 60);

const MINUTE = 60_000;
const DAY = 86_400_000;

type Window = { count: number; resetAt: number };
const minuteHits = new Map<string, Window>();
const dayHits = new Map<string, Window>();

function hit(map: Map<string, Window>, key: string, windowMs: number, limit: number) {
  const now = Date.now();
  const w = map.get(key);
  if (!w || now >= w.resetAt) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }
  w.count += 1;
  if (w.count > limit) {
    return { allowed: false, retryAfterSec: Math.ceil((w.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfterSec: 0 };
}

// Opportunistic cleanup so the maps don't grow unbounded on long-lived instances
function sweep(map: Map<string, Window>) {
  if (map.size < 5000) return;
  const now = Date.now();
  map.forEach((w, k) => {
    if (now >= w.resetAt) map.delete(k);
  });
}

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

const LOGIN_PER_MINUTE = Number(process.env.LOGIN_RATE_LIMIT_PER_MINUTE ?? 5);
const loginHits = new Map<string, Window>();

export async function middleware(req: NextRequest) {
  const ip = clientIp(req);
  const path = req.nextUrl.pathname;
  sweep(minuteHits);
  sweep(dayHits);
  sweep(loginHits);

  // --- Login endpoint: brute-force limiting only, no auth required ---
  if (path.startsWith("/api/auth/login")) {
    const attempt = hit(loginHits, ip, MINUTE, LOGIN_PER_MINUTE);
    if (!attempt.allowed) {
      return NextResponse.json(
        { error: `Too many attempts - try again in ${attempt.retryAfterSec}s.` },
        { status: 429, headers: { "Retry-After": String(attempt.retryAfterSec) } }
      );
    }
    return NextResponse.next();
  }
  if (path.startsWith("/api/auth/logout")) return NextResponse.next();

  // --- Auth gate (active only when AUTH_PASSWORD + AUTH_SECRET are set) ---
  if (authEnabled()) {
    const ok = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
    if (!ok) {
      if (path.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Not signed in - open the site and log in first." },
          { status: 401 }
        );
      }
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.search = `?next=${encodeURIComponent(path)}`;
      return NextResponse.redirect(url);
    }
  }

  // --- AI rate limiting (unchanged) ---
  if (!path.startsWith("/api/ai/")) return NextResponse.next();

  const day = hit(dayHits, ip, DAY, PER_DAY);
  if (!day.allowed) {
    return NextResponse.json(
      { error: "Daily AI limit reached for your connection - try again tomorrow." },
      { status: 429, headers: { "Retry-After": String(day.retryAfterSec) } }
    );
  }

  const minute = hit(minuteHits, ip, MINUTE, PER_MINUTE);
  if (!minute.allowed) {
    return NextResponse.json(
      {
        error: `Too many requests - try again in ${minute.retryAfterSec}s.`,
      },
      { status: 429, headers: { "Retry-After": String(minute.retryAfterSec) } }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/builder/:path*", "/builder"],
};
