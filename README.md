# ResumeForge

AI-powered, ATS-friendly resume builder with a live side-by-side preview, JD tailoring
with accept/reject suggestions, an ATS score dashboard, and text-layer PDF export.

Built with **Next.js 14 (App Router) · TypeScript · Tailwind CSS · GSAP · Zustand ·
@react-pdf/renderer · Anthropic API**.

## Run locally

```bash
npm install
npm run dev                  # http://localhost:3000
```

The editor, live preview, and PDF download always work with no setup.

### AI features - two providers, auto-selected

| Provider | When it's used | Setup |
|---|---|---|
| **Local Claude Code CLI** | No `ANTHROPIC_API_KEY` set (default for local dev) | `npm install -g @anthropic-ai/claude-code`, run `claude` once to log in. The app spawns `claude -p` headless for each AI call. |
| **Anthropic API** | `ANTHROPIC_API_KEY` is set | `cp .env.example .env.local` and add your key. |

The switch is automatic - `lib/anthropic.ts` uses the API if a key exists,
otherwise it spawns your local `claude` binary (`lib/localClaude.ts`).

> **Important:** the CLI provider only works where the `claude` binary exists -
> your machine (`npm run dev` / `npm start`) or a VPS/container you control.
> **Vercel serverless cannot spawn the CLI**, so for Vercel you must set
> `ANTHROPIC_API_KEY`. CLI calls also count against your Claude subscription's
> usage limits and are slower than direct API calls (expect 10-60s per action).

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. Import the repo at vercel.com - Next.js is auto-detected, no config needed.
3. Project → Settings → Environment Variables → add `ANTHROPIC_API_KEY`
   (Production + Preview). Required on Vercel - the local-CLI fallback does not
   exist in serverless functions.
4. Deploy. AI routes run as serverless functions with `maxDuration = 60`.

## Architecture

```
app/
  page.tsx                  Landing (GSAP hero + ScrollTrigger feature strip)
  builder/page.tsx          Workspace: Edit | Tailor | Score tabs + live preview
  api/ai/extract/route.ts   Stage 1 - raw text → structured resume JSON
  api/ai/tailor/route.ts    Stage 2 - resume + JD → match score + suggestions
  api/ai/generate/route.ts  Stage 3 - full AI rewrite (no fabricated facts)
  api/ai/score/route.ts     Stage 4 - ATS score report (fast/cheap model)
components/
  builder/EditorPanel.tsx   All form sections, reorder, tag inputs, AI toolbar
  tailor/TailorPanel.tsx    JD input, match ring, accept/reject cards (GSAP exits)
  score/ScorePanel.tsx      Animated dial, sub-score bars, fixes, strengths
  preview/PreviewPane.tsx   Toolbar + two ATS-safe templates + section pulse
  pdf/ResumePDF.tsx         @react-pdf/renderer doc mirroring the preview
lib/
  store.ts                  Zustand store (persisted to localStorage)
  types.ts                  Resume / Suggestion / ScoreReport types
  applySuggestion.ts        targetPath → immutable resume update
  anthropic.ts              Provider switch (API or local CLI) with JSON-retry
  localClaude.ts            Spawns `claude -p` headless (no API key needed)
```

## Key decisions

- **PDF is real text** (`@react-pdf/renderer`), never a screenshot - so ATS parsers
  can read it. Verify: open the PDF and select the text with your cursor.
- **API key never ships to the browser** - all Anthropic calls go through
  `app/api/ai/*` route handlers reading `process.env.ANTHROPIC_API_KEY`.
- **Suggestions are machine-applied** via a `targetPath` (e.g.
  `experience[0].bullets[2]`) so Accept mutates exactly one field and the preview
  pulses that section.
- **No fabrication rule** is baked into every prompt: the AI may rephrase and
  surface facts, never invent employers, titles, or metrics.
- **Accessibility floor**: keyboard focus rings, aria labels/roles, and every GSAP
  animation is skipped under `prefers-reduced-motion`.
- **Privacy**: resume data lives in localStorage; it is only sent to the server when
  the user triggers an AI action.
