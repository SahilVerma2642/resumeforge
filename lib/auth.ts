// Runtime-agnostic auth helpers (Web Crypto: works in Edge middleware AND Node routes).
// Session token format: "<expiryMs>.<base64url HMAC-SHA256 of expiry, keyed by AUTH_SECRET>"

export const SESSION_COOKIE = "rf_session";
export const SESSION_MAX_AGE_SEC = 7 * 24 * 60 * 60; // 7 days

export function authEnabled(): boolean {
  return Boolean(process.env.AUTH_PASSWORD && process.env.AUTH_SECRET);
}

function b64url(buf: ArrayBuffer): string {
  let s = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return b64url(sig);
}

/** Constant-time string comparison (lengths leak, contents don't). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(): Promise<string> {
  const exp = String(Date.now() + SESSION_MAX_AGE_SEC * 1000);
  const sig = await hmac(exp, process.env.AUTH_SECRET!);
  return `${exp}.${sig}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token || !process.env.AUTH_SECRET) return false;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const exp = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  const expected = await hmac(exp, process.env.AUTH_SECRET);
  return safeEqual(sig, expected);
}

/** Timing-safe password check: compare SHA-256 digests, not raw strings. */
export async function verifyPassword(candidate: string): Promise<boolean> {
  const real = process.env.AUTH_PASSWORD ?? "";
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(candidate)),
    crypto.subtle.digest("SHA-256", enc.encode(real)),
  ]);
  return safeEqual(b64url(a), b64url(b));
}
