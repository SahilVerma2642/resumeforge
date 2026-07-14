"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useResumeStore } from "@/lib/store";
import { Suggestion } from "@/lib/types";
import { Check, X, CheckCheck } from "lucide-react";

const TYPE_LABEL: Record<Suggestion["type"], string> = {
  rewrite_bullet: "Rewrite bullet",
  rewrite_summary: "Rewrite summary",
  new_bullet: "New bullet",
  add_skill: "Add skill",
  add_keyword: "Add keyword",
};

function SuggestionCard({
  s,
  onAccept,
  onReject,
}: {
  s: Suggestion;
  onAccept: () => void;
  onReject: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const exit = (accepted: boolean, done: () => void) => {
    const el = ref.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!el || reduced) return done();
    if (accepted) {
      gsap.to(el, {
        x: 60,
        opacity: 0,
        scale: 0.92,
        duration: 0.35,
        ease: "power2.in",
        onComplete: () =>
          gsap.to(el, { height: 0, marginBottom: 0, duration: 0.25, onComplete: done }),
      });
    } else {
      gsap.to(el, {
        opacity: 0,
        duration: 0.22,
        onComplete: () =>
          gsap.to(el, { height: 0, marginBottom: 0, duration: 0.25, onComplete: done }),
      });
    }
  };

  return (
    <div
      ref={ref}
      className="mb-3 overflow-hidden rounded-xl border border-hairline bg-white p-4"
    >
      <span className="rounded-md bg-signal/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-signal">
        {TYPE_LABEL[s.type]}
      </span>
      <p className="mt-2 text-xs text-slate2">{s.reason}</p>

      <div className="mt-3 space-y-2 text-sm">
        {s.original && (
          <p className="rounded-lg bg-coral/5 px-3 py-2 text-slate2 line-through decoration-coral/60">
            {s.original}
          </p>
        )}
        <p className="rounded-lg bg-mint/10 px-3 py-2 font-medium text-ink">{s.proposed}</p>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          className="btn text-xs bg-mint text-white hover:bg-[#0ea172]"
          onClick={() => exit(true, onAccept)}
        >
          <Check size={14} /> Accept
        </button>
        <button className="btn-ghost text-xs" onClick={() => exit(false, onReject)}>
          <X size={14} /> Reject
        </button>
      </div>
    </div>
  );
}

/**
 * Renders all pending suggestions from the store with accept/reject wiring.
 * `onAllResolved` fires once when the last pending suggestion is handled.
 */
export default function SuggestionList({
  onAllResolved,
}: {
  onAllResolved?: () => void;
}) {
  const { suggestions, acceptSuggestion, rejectSuggestion, acceptAll } = useResumeStore();
  const pending = suggestions.filter((s) => s.status === "pending");

  const handle = (id: string, accepted: boolean) => {
    accepted ? acceptSuggestion(id) : rejectSuggestion(id);
    const left = useResumeStore
      .getState()
      .suggestions.filter((s) => s.status === "pending").length;
    if (left === 0) onAllResolved?.();
  };

  if (pending.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-bold">
          {pending.length} suggestion{pending.length > 1 ? "s" : ""}
        </h3>
        <button
          className="btn-ghost text-xs"
          onClick={() => {
            acceptAll();
            onAllResolved?.();
          }}
        >
          <CheckCheck size={14} /> Accept all remaining
        </button>
      </div>
      {pending.map((s) => (
        <SuggestionCard
          key={s.id}
          s={s}
          onAccept={() => handle(s.id, true)}
          onReject={() => handle(s.id, false)}
        />
      ))}
    </div>
  );
}
