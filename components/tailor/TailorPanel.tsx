"use client";

import { useState } from "react";
import { useResumeStore } from "@/lib/store";
import { resumeHasContent } from "@/lib/types";
import SuggestionList from "@/components/shared/SuggestionList";
import { Wand2, Loader2, TrendingUp } from "lucide-react";

function MatchRing({ score }: { score: number }) {
  const R = 30;
  const C = 2 * Math.PI * R;
  const color = score >= 70 ? "#12B886" : score >= 45 ? "#E8A13A" : "#F0526A";
  return (
    <div className="flex items-center gap-3">
      <svg width="76" height="76" viewBox="0 0 76 76" role="img" aria-label={`Match score ${score} out of 100`}>
        <circle cx="38" cy="38" r={R} fill="none" strokeWidth="7" stroke="#edf0f5" />
        <circle cx="38" cy="38" r={R} fill="none" strokeWidth="7" stroke={color} strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C - (C * score) / 100} transform="rotate(-90 38 38)"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
        <text x="38" y="43" textAnchor="middle" className="font-display" fontSize="17" fontWeight="700" fill="#16181D">
          {score}
        </text>
      </svg>
      <div>
        <p className="font-display text-sm font-bold">JD match</p>
        <p className="text-xs text-slate2">before applying suggestions</p>
      </div>
    </div>
  );
}

export default function TailorPanel({ onEnhance }: { onEnhance?: () => void }) {
  const { resume, suggestions, matchScore, setSuggestions, setScore, jd, setJd } = useResumeStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ready = resumeHasContent(resume);

  const pending = suggestions.filter((s) => s.status === "pending");
  const resolved = suggestions.length > 0 && pending.length === 0;

  const analyze = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/ai/tailor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resume, jobDescription: jd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuggestions(data.suggestions ?? [], data.matchScore ?? null);
    } catch (e: any) {
      setError(e.message ?? "Analysis failed - try again.");
    } finally {
      setBusy(false);
    }
  };

  const rescore = async () => {
    try {
      const res = await fetch("/api/ai/score", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          resume: useResumeStore.getState().resume,
          jobDescription: jd || null,
        }),
      });
      if (res.ok) setScore(await res.json());
    } catch {
      /* silent - user can score manually from the Score tab */
    }
  };

  return (
    <div className="p-5">
      <h2 className="font-display text-lg font-bold">Tailor to a job description</h2>
      <p className="mt-1 text-sm text-slate2">
        Paste the JD. You&apos;ll get suggestions that only rephrase and surface what&apos;s
        already true - accept or reject each one.
      </p>

      <textarea
        className="field mt-4 min-h-[150px]"
        placeholder="Paste the full job description here…"
        value={jd}
        onChange={(e) => setJd(e.target.value)}
      />
      {!ready && (
        <p className="mt-3 rounded-lg border border-hairline bg-paper px-3 py-2 text-xs text-slate2">
          Fill in your resume first (Edit tab) - tailoring compares the JD against your
          actual experience and skills.
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="btn-primary text-sm"
          onClick={analyze}
          disabled={busy || !ready || jd.trim().length < 50}
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
          {busy ? "Analyzing…" : "Analyze & suggest"}
        </button>
        {onEnhance && (
          <button
            className="btn-ghost text-sm"
            onClick={onEnhance}
            title="Find high-demand skills your resume lacks, with learning roadmaps"
          >
            <TrendingUp size={15} /> Enhance skills
          </button>
        )}
      </div>
      {error && (
        <p className="mt-2 text-xs text-coral">
          {error}{" "}
          <button className="underline" onClick={analyze}>
            Retry
          </button>
        </p>
      )}

      {matchScore !== null && (
        <div className="mt-6 rounded-xl border border-hairline bg-paper p-4">
          <MatchRing score={matchScore} />
        </div>
      )}

      <SuggestionList onAllResolved={rescore} />

      {resolved && (
        <div className="mt-6 rounded-xl border border-mint/40 bg-mint/5 p-4 text-sm">
          <p className="font-bold text-mint">All suggestions resolved.</p>
          <p className="mt-1 text-slate2">
            Your resume was re-scored - check the{" "}
            <span className="font-semibold">Score</span> tab, or open{" "}
            <button className="font-semibold text-signal underline" onClick={onEnhance}>
              Enhance skills
            </button>{" "}
            to close the remaining gaps for this JD.
          </p>
        </div>
      )}
      <div className="h-16" />
    </div>
  );
}
