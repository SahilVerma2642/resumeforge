"use client";

import { useState } from "react";
import { useResumeStore } from "@/lib/store";
import { resumeHasContent, SkillGap } from "@/lib/types";
import {
  TrendingUp,
  Loader2,
  ChevronDown,
  Hammer,
  Clock,
  Lightbulb,
} from "lucide-react";

const DEMAND_STYLE: Record<SkillGap["demand"], string> = {
  "very high": "bg-coral/10 text-coral",
  high: "bg-[#E8A13A]/15 text-[#B87A17]",
  rising: "bg-signal/10 text-signal",
};

function GapCard({ gap }: { gap: SkillGap }) {
  const [open, setOpen] = useState(false);
  const totalWeeks = gap.roadmap.reduce((n, r) => n + (r.durationWeeks || 0), 0);

  return (
    <div className="mb-3 rounded-xl border border-hairline bg-white">
      <button
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display text-sm font-bold">{gap.skill}</span>
          <span
            className={`rounded-md px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${DEMAND_STYLE[gap.demand] ?? DEMAND_STYLE.high}`}
          >
            {gap.demand} demand
          </span>
          {totalWeeks > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-slate2">
              <Clock size={12} /> ~{totalWeeks} weeks
            </span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate2 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-hairline px-4 pb-4 pt-3">
          <p className="text-sm leading-relaxed">{gap.why}</p>
          <p className="mt-2 text-xs text-slate2">
            <span className="font-semibold">Builds on what you know: </span>
            {gap.adjacency}
          </p>

          <h4 className="mt-4 font-display text-xs font-bold uppercase tracking-wide text-slate2">
            Learning roadmap
          </h4>
          <ol className="mt-2 space-y-3">
            {gap.roadmap.map((r, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-signal/10 font-display text-xs font-bold text-signal">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold">
                    {r.step}
                    {r.durationWeeks ? (
                      <span className="ml-2 text-xs font-normal text-slate2">
                        {r.durationWeeks} wk{r.durationWeeks > 1 ? "s" : ""}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs leading-relaxed text-slate2">{r.detail}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-4 flex gap-2 rounded-lg bg-mint/5 p-3">
            <Hammer size={15} className="mt-0.5 shrink-0 text-mint" />
            <p className="text-xs leading-relaxed">
              <span className="font-bold text-mint">Prove it: </span>
              {gap.projectIdea}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EnhancePanel() {
  const { resume, jd, enhance, setEnhance } = useResumeStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ready = resumeHasContent(resume);

  const analyze = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resume, jobDescription: jd || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEnhance(data);
    } catch (e: any) {
      setError(e.message ?? "Skill-gap analysis failed - try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-5">
      <h2 className="font-display text-lg font-bold">Enhance your skills</h2>
      <p className="mt-1 text-sm text-slate2">
        Finds high-demand skills your resume lacks for your profile
        {jd.trim() ? " and your target JD" : ""}, with a learning roadmap and a
        portfolio project for each - so the next version of your resume scores higher
        and opens more doors.
      </p>

      {!ready && (
        <p className="mt-4 rounded-lg border border-hairline bg-paper px-3 py-2 text-xs text-slate2">
          Fill in your resume first (Edit tab) - the analysis is based on your actual
          experience and skills.
        </p>
      )}

      <button
        className="btn-primary mt-4 text-sm"
        onClick={analyze}
        disabled={busy || !ready}
      >
        {busy ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <TrendingUp size={15} />
        )}
        {busy ? "Analyzing gaps…" : enhance ? "Re-analyze skill gaps" : "Analyze skill gaps"}
      </button>
      {error && (
        <p className="mt-2 text-xs text-coral">
          {error}{" "}
          <button className="underline" onClick={analyze}>
            Retry
          </button>
        </p>
      )}

      {enhance && (
        <div className="mt-6">
          <div className="rounded-xl border border-hairline bg-paper p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate2">
              Detected profile
            </p>
            <p className="mt-1 text-sm font-medium">{enhance.profile}</p>
          </div>

          <div className="mt-4">
            {enhance.gaps.map((g) => (
              <GapCard key={g.skill} gap={g} />
            ))}
          </div>

          <div className="mt-4 flex gap-2 rounded-xl border border-signal/30 bg-signal/5 p-4">
            <Lightbulb size={16} className="mt-0.5 shrink-0 text-signal" />
            <p className="text-sm leading-relaxed">{enhance.summaryAdvice}</p>
          </div>

          <p className="mt-4 text-xs text-slate2">
            Demand labels reflect the AI&apos;s general knowledge of the job market -
            cross-check against current postings for your target roles. Only add a skill
            to your resume once you can genuinely back it up.
          </p>
        </div>
      )}
      <div className="h-16" />
    </div>
  );
}
