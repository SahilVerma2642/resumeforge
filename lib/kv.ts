// SERVER-ONLY: minimal Upstash Redis REST client (works with Vercel KV env
// vars or plain Upstash ones). No SDK - two fetch calls.
import "server-only";

function creds(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

export const kvAvailable = () => creds() !== null;

async function command(cmd: (string | number)[]): Promise<any> {
  const c = creds();
  if (!c) throw new Error("KV is not configured");
  const res = await fetch(c.url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${c.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(cmd),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`KV error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const data = await res.json();
  return data.result;
}

export async function kvSet(key: string, value: string, ttlSeconds?: number): Promise<void> {
  const cmd: (string | number)[] = ["SET", key, value];
  if (ttlSeconds) cmd.push("EX", ttlSeconds);
  await command(cmd);
}

export async function kvGet(key: string): Promise<string | null> {
  return command(["GET", key]);
}
