"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useResumeStore } from "@/lib/store";
import { resumeHasContent } from "@/lib/types";
import SuggestionList from "@/components/shared/SuggestionList";
import { Gauge, Loader2, AlertTriangle, AlertCircle, Info, ThumbsUp, Wrench } from "lucide-react";

/* ---------- Animated dial ---------- */

function ScoreDial({ score, grade }: { score: number; grade: string }) {
  const R = 54;
  const C = 2 * Math.PI * R;
  const arcRef = useRef<SVGCircleElement>(null);
  const numRef = useRef<SVGTextElement>(null);
  const color = score >= 80 ? "#12B886" : score >= 60 ? "#E8A13A" : "#F0526A";

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = C - (C * score) / 100;
    if (reduced) {
      if (arcRef.current) arcRef.current.style.strokeDashoffset = String(target);
      if (numRef.current) numRef.current.textContent = String(score);
      return;
    }
    if (arcRef.current) {
      gsap.fromTo(
        arcRef.current,
        { strokeDashoffset: C },
        { strokeDashoffset: target, duration: 1.2, ease: "power2.out" }
      );
    }
    const counter = { v: 0 };
    gsap.to(counter, {
      v: score,
      duration: 1.2,
      ease: "power2.out",
      onUpdate: () => {
        if (numRef.current) numRef.current.textContent = String(Math.round(counter.v));
      },
    });
  }, [score, C]);

  return (
    <svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label={`Overall ATS score ${score}, grade ${grade}`}>
      <circle cx="70" cy="70" r={R} fill="none" strokeWidth="11" stroke="#edf0f5" />
      <circle
        ref={arcRef}
        cx="70"
        cy="70"
        r={R}
        fill="none"
        strokeWidth="11"
        stroke={color}
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={C}
        transform="rotate(-90 70 70)"
      />
      <text ref={numRef} x="70" y="72" textAnchor="middle" fontSize="30" fontWeight="700" fill="#16181D" className="font-display">
        0
      </text>
      <text x="70" y="94" textAnchor="middle" fontSize="13" fontWeight="700" fill={color}>
        Grade {grade}
      </text>
    </svg>
  );
}

/* ---------- Sub-score bar ---------- */

function SubBar({ label, value }: { label: string; value: number }) {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!barRef.current) return;
    if (reduced) {
      barRef.current.style.width = `${value}%`;
      return;
    }
    gsap.fromTo(barRef.current, { width: "0%" }, { width: `${value}%`, duration: 1, ease: "power2.out" });
  }, [value]);
  const color = value >= 80 ? "bg-mint" : value >= 60 ? "bg-[#E8A13A]" : "bg-coral";
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-medium text-slate2">{label}</span>
        <span className="font-display font-bold">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-hairline/70">
        <div ref={barRef} className={`h-full rounded-full ${color}`} style={{ width: 0 }} />
      </div>
    </div>
  );
}

const PRIORITY_META = {
  critical: { icon: AlertTriangle, cls: "text-coral", label: "Critical" },
  high: { icon: AlertCircle, cls: "text-[#E8A13A]", label: "High" },
  medium: { icon: Info, cls: "text-slate2", label: "Medium" },
} as const;

/* ---------- Panel ---------- */

export default function ScorePanel() {
  const { resume, score, setScore, setSuggestions, suggestions } = useResumeStore();
  const [busy, setBusy] = useState(false);
  const [fixBusy, setFixBusy] = useState(false);
  const [skipped, setSkipped] = useState<{ fix: string; reason: string; whatToAdd: string }[]>([]);
  const [fixedReport, setFixedReport] = useState<object | null>(null);
  const [error, setError] = useState("");
  const ready = resumeHasContent(resume);
  const hasPending = suggestions.some((x) => x.status === "pending");

  const generateFixes = async () => {
    if (!score) return;
    setFixBusy(true);
    setError("");
    try {
      const res = await fetch("/api/ai/fixes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resume, fixes: score.fixes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuggestions(data.suggestions ?? [], null);
      setSkipped(data.skipped ?? []);
      setFixedReport(score); // this report has been handled; button stays off until a re-score
    } catch (e: any) {
      setError(e.message ?? "Fix generation failed - try again.");
    } finally {
      setFixBusy(false);
    }
  };

  const rescore = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/ai/score", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resume: useResumeStore.getState().resume, jobDescription: null }),
      });
      if (res.ok) setScore(await res.json());
    } finally {
      setBusy(false);
    }
  };

  const run = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/ai/score", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resume, jobDescription: null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setScore(data);
    } catch (e: any) {
      setError(e.message ?? "Scoring failed - try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-5">
      <h2 className="font-display text-lg font-bold">ATS score report</h2>
      <p className="mt-1 text-sm text-slate2">
        An honest evaluation of keyword coverage, impact, formatting, and completeness -
        with specific fixes.
      </p>

      {!ready && (
        <p className="mt-4 rounded-lg border border-hairline bg-paper px-3 py-2 text-xs text-slate2">
          Add some content first - a summary, at least one experience bullet, or a few
          skills - so the score means something. Scoring an empty resume just returns noise.
        </p>
      )}
      <button className="btn-primary mt-4 text-sm" onClick={run} disabled={busy || !ready}>
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Gauge size={15} />}
        {busy ? "Scoring…" : score ? "Re-score my resume" : "Score my resume"}
      </button>
      {error && (
        <p className="mt-2 text-xs text-coral">
          {error} <button className="underline" onClick={run}>Retry</button>
        </p>
      )}

      {score && (
        <div className="mt-6 space-y-6">
          {/* Dial + verdict */}
          <div className="flex flex-col items-center gap-4 rounded-xl border border-hairline bg-paper p-5 sm:flex-row">
            <ScoreDial score={score.overallScore} grade={score.grade} />
            <p className="text-sm leading-relaxed text-slate2">{score.verdict}</p>
          </div>

          {/* Sub-scores */}
          <div className="space-y-3 rounded-xl border border-hairline p-5">
            <SubBar label="Keyword match" value={score.subScores.keywordMatch} />
            <SubBar label="Impact strength" value={score.subScores.impactStrength} />
            <SubBar label="Formatting" value={score.subScores.formatting} />
            <SubBar label="Completeness" value={score.subScores.completeness} />
          </div>

          {/* Fixes */}
          {score.fixes.length > 0 && (
            <div className="rounded-xl border border-hairline p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold">Priority fixes</h3>
                <button
                  className="btn-primary !px-3 !py-1.5 text-xs"
                  onClick={generateFixes}
                  disabled={fixBusy || hasPending || fixedReport === score}
                >
                  {fixBusy ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Wrench size={13} />
                  )}
                  {fixBusy
                    ? "Preparing…"
                    : fixedReport === score && !hasPending
                      ? "Fixes applied"
                      : "Fix these with AI"}
                </button>
              </div>
              <ul className="mt-3 space-y-2.5">
                {score.fixes.map((f, i) => {
                  const meta = PRIORITY_META[f.priority] ?? PRIORITY_META.medium;
                  return (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <meta.icon size={16} className={`mt-0.5 shrink-0 ${meta.cls}`} />
                      <span>
                        <span className={`font-bold ${meta.cls}`}>{meta.label}: </span>
                        {f.message}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Strengths */}
          {score.strengths.length > 0 && (
            <div className="rounded-xl border border-mint/40 bg-mint/5 p-5">
              <h3 className="font-display text-sm font-bold text-mint">Strengths</h3>
              <ul className="mt-3 space-y-2">
                {score.strengths.map((st, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <ThumbsUp size={15} className="mt-0.5 shrink-0 text-mint" />
                    {st}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <SuggestionList onAllResolved={rescore} />

          {skipped.length > 0 && (
            <div className="rounded-xl border border-[#E8A13A]/40 bg-[#E8A13A]/5 p-5">
              <h3 className="font-display text-sm font-bold text-[#B87A17]">
                {skipped.length} fix{skipped.length > 1 ? "es" : ""} need info only you have
              </h3>
              <p className="mt-1 text-xs text-slate2">
                The AI won&apos;t invent numbers, dates, or links to satisfy a fix. Add
                these in the Edit tab, then re-score.
              </p>
              <ul className="mt-3 space-y-2.5">
                {skipped.map((k, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-semibold">{k.fix}</span>
                    <span className="block text-xs text-slate2">
                      {k.reason} - add: {k.whatToAdd}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      <div className="h-16" />
    </div>
  );
}
