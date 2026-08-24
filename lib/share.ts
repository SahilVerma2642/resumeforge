// #9 Public resume link: the resume travels INSIDE the URL hash (compressed),
// so no database is needed and the server never stores personal data.
//
// v2 encoding: browser-native deflate-raw (CompressionStream) + base64url,
// which compresses real resumes ~2-3x tighter than lz-string. Legacy v1
// (lz-string) links still decode.
import LZString from "lz-string";
import { Resume, emptyResume } from "./types";

/* ---------- helpers ---------- */

function b64urlEncode(buf: ArrayBuffer): string {
  let s = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** Drop empty strings/arrays/objects so they don't waste link space. */
function compact(value: any): any {
  if (Array.isArray(value)) {
    const arr = value.map(compact).filter((v) => v !== undefined);
    return arr.length ? arr : undefined;
  }
  if (value && typeof value === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(value)) {
      const c = compact(v);
      if (c !== undefined) out[k] = c;
    }
    return Object.keys(out).length ? out : undefined;
  }
  if (value === "" || value === null || value === undefined) return undefined;
  return value;
}

/** Re-hydrate a compacted resume against the empty shape. */
function hydrate(partial: any): Resume {
  const base: Resume = JSON.parse(JSON.stringify(emptyResume));
  const r = { ...base, ...partial };
  r.personal = { ...base.personal, ...(partial?.personal ?? {}) };
  r.skills = { ...base.skills, ...(partial?.skills ?? {}) };
  r.experience = (partial?.experience ?? []).map((e: any) => ({
    id: e.id ?? Math.random().toString(36).slice(2, 10),
    title: e.title ?? "",
    company: e.company ?? "",
    location: e.location ?? "",
    startDate: e.startDate ?? "",
    endDate: e.endDate ?? "",
    bullets: (e.bullets ?? []).map((b: any) => ({
      id: b.id ?? Math.random().toString(36).slice(2, 10),
      text: b.text ?? "",
    })),
  }));
  r.education = partial?.education ?? [];
  r.projects = (partial?.projects ?? []).map((p: any) => ({
    techStack: [],
    description: "",
    ...p,
  }));
  r.certifications = partial?.certifications ?? [];
  return r;
}

/* ---------- public API ---------- */

export async function encodeResumeLink(resume: Resume, origin: string): Promise<string> {
  const json = JSON.stringify({ v: 2, resume: compact(resume) ?? {} });
  const bytes = new TextEncoder().encode(json);
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  const buf = await new Response(stream).arrayBuffer();
  return `${origin}/r#z:${b64urlEncode(buf)}`;
}

export async function decodeResumeHash(hash: string): Promise<Resume | null> {
  const h = hash.replace(/^#/, "");
  try {
    if (h.startsWith("z:")) {
      const bytes = b64urlDecode(h.slice(2));
      const stream = new Blob([bytes as unknown as BlobPart])
        .stream()
        .pipeThrough(new DecompressionStream("deflate-raw"));
      const json = await new Response(stream).text();
      const parsed = JSON.parse(json);
      return parsed?.resume ? hydrate(parsed.resume) : null;
    }
    // Legacy v1 links (lz-string)
    const raw = LZString.decompressFromEncodedURIComponent(h);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.resume ? hydrate(parsed.resume) : null;
  } catch {
    return null;
  }
}
