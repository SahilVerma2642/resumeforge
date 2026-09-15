// SERVER-ONLY: shared Stage-1 extraction used by both the paste-text route
// and the file-upload route.
import "server-only";
import { callClaudeJSON, MODELS, RESUME_SCHEMA_DOC, type Provider } from "./anthropic";
import type { Resume } from "./types";

const SYSTEM = `You are a precise resume parser. Extract the user's raw resume text (or notes about their career) into this exact JSON schema:

${RESUME_SCHEMA_DOC}

Rules:
- NEVER invent information. Missing fields are "" for strings, [] for arrays, null where allowed.
- Preserve the user's real metrics and numbers exactly.
- Preserve the resume's own skill category labels exactly as written (e.g. "Backend & Architecture", "Cloud & Security"). Do not force items into a fixed set of categories. If the resume lists skills with no categories at all, put them under one group labeled "Skills".
- Keep bullets as-is at this stage; do not rewrite them.`;

export async function extractResumeFromText(rawText: string, provider?: Provider): Promise<Resume> {
  return callClaudeJSON<Resume>(SYSTEM, rawText, MODELS.smart, 4096, provider);
}
