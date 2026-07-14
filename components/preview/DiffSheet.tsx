"use client";

import { useResumeStore } from "@/lib/store";
import { Resume, Bullet } from "@/lib/types";
import { Check, X, GitCompare } from "lucide-react";

/* GitHub-style inline diff primitives */
function Del({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-[3px] bg-coral/10 px-0.5 text-coral line-through decoration-coral/60">
      {children}
    </span>
  );
}
function Ins({ children }: { children: React.ReactNode }) {
  return <span className="rounded-[3px] bg-mint/15 px-0.5">{children}</span>;
}

/** Renders a string field: unchanged -> plain; changed -> old struck + new highlighted */
function DiffText({ before, after }: { before?: string; after?: string }) {
  const b = (before ?? "").trim();
  const a = (after ?? "").trim();
  if (b === a) return <>{a}</>;
  return (
    <>
      {b && (
        <>
          <Del>{b}</Del>{" "}
        </>
      )}
      {a && <Ins>{a}</Ins>}
    </>
  );
}

function DiffStringList({ before, after }: { before: string[]; after: string[] }) {
  const removed = before.filter((x) => !after.includes(x));
  const parts: React.ReactNode[] = [];
  after.forEach((x, i) => {
    parts.push(
      before.includes(x) ? <span key={`k${i}`}>{x}</span> : <Ins key={`a${i}`}>{x}</Ins>
    );
  });
  removed.forEach((x, i) => parts.push(<Del key={`r${i}`}>{x}</Del>));
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 && ", "}
          {p}
        </span>
      ))}
    </>
  );
}

function DiffBullets({ before, after }: { before: Bullet[]; after: Bullet[] }) {
  const beforeById = new Map(before.map((b) => [b.id, b.text]));
  const afterIds = new Set(after.map((b) => b.id));
  const removed = before.filter((b) => !afterIds.has(b.id) && b.text.trim());
  return (
    <ul className="mt-1 list-disc space-y-0.5 pl-5">
      {after
        .filter((b) => b.text.trim())
        .map((b) => (
          <li key={b.id}>
            <DiffText before={beforeById.get(b.id) ?? ""} after={b.text} />
          </li>
        ))}
      {removed.map((b) => (
        <li key={b.id}>
          <Del>{b.text}</Del>
        </li>
      ))}
    </ul>
  );
}

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mb-2 mt-4 border-b border-hairline pb-1 font-sans text-[1.05em] font-bold uppercase tracking-[0.12em] text-signal">
    {children}
  </h2>
);

export default function DiffSheet({
  before,
  after,
}: {
  before: Resume;
  after: Resume;
}) {
  const { applyReview, discardReview } = useResumeStore();
  const expBefore = new Map(before.experience.map((e) => [e.id, e]));

  const skillRows = (
    [
      ["Languages", before.skills.languages, after.skills.languages],
      ["Frameworks", before.skills.frameworks, after.skills.frameworks],
      ["Databases", before.skills.databases, after.skills.databases],
      ["Tools", before.skills.tools, after.skills.tools],
    ] as const
  ).filter(([, b, a]) => b.length + a.length > 0);

  return (
    <div className="w-full max-w-[820px]">
      {/* Review action bar */}
      <div className="sticky top-0 z-20 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-signal/40 bg-white px-4 py-3 shadow-sheet">
        <div className="flex items-center gap-2 text-sm">
          <GitCompare size={16} className="text-signal" />
          <span className="font-display font-bold">Reviewing AI changes</span>
          <span className="hidden text-xs text-slate2 sm:inline">
            <Del>removed</Del> · <Ins>added</Ins> - nothing is saved until you apply
          </span>
        </div>
        <div className="flex gap-2">
          <button className="btn text-xs bg-mint text-white hover:bg-[#0ea172]" onClick={applyReview}>
            <Check size={14} /> Apply changes
          </button>
          <button className="btn-ghost text-xs" onClick={discardReview}>
            <X size={14} /> Discard
          </button>
        </div>
      </div>

      {/* Diffed sheet */}
      <div className="sheet w-full px-8 py-10 font-sans text-[12.5px] leading-[1.5] text-black sm:px-12">
        <h1 className="text-[2em] font-bold leading-tight">
          <DiffText before={before.personal.name} after={after.personal.name} />
        </h1>

        {(before.summary || after.summary) && (
          <div>
            <H>Professional Summary</H>
            <p>
              <DiffText before={before.summary} after={after.summary} />
            </p>
          </div>
        )}

        {after.experience.length > 0 && (
          <div>
            <H>Work Experience</H>
            <div className="space-y-3">
              {after.experience.map((e) => {
                const prev = expBefore.get(e.id);
                return (
                  <div key={e.id}>
                    <p className="font-bold">
                      <DiffText
                        before={prev ? `${prev.title}${prev.company ? ` - ${prev.company}` : ""}` : ""}
                        after={`${e.title}${e.company ? ` - ${e.company}` : ""}`}
                      />
                      <span className="ml-2 font-normal text-black/60">
                        {[e.startDate, e.endDate].filter(Boolean).join(" - ")}
                      </span>
                    </p>
                    <DiffBullets before={prev?.bullets ?? []} after={e.bullets} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {skillRows.length > 0 && (
          <div>
            <H>Technical Skills</H>
            {skillRows.map(([label, b, a]) => (
              <p key={label}>
                <span className="font-bold">{label}: </span>
                <DiffStringList before={b} after={a} />
              </p>
            ))}
          </div>
        )}

        {after.projects.length > 0 && (
          <div>
            <H>Projects</H>
            {after.projects.map((p) => {
              const prev = before.projects.find((x) => x.id === p.id);
              return (
                <p key={p.id}>
                  <span className="font-bold">{p.name}</span>
                  {p.techStack.length > 0 && (
                    <span className="text-black/60"> | {p.techStack.join(", ")}</span>
                  )}
                  <br />
                  <DiffText
                    before={prev ? `${prev.description}${prev.impact ? ` - ${prev.impact}` : ""}` : ""}
                    after={`${p.description}${p.impact ? ` - ${p.impact}` : ""}`}
                  />
                </p>
              );
            })}
          </div>
        )}

        {(before.certifications.length > 0 || after.certifications.length > 0) && (
          <div>
            <H>Certifications & Awards</H>
            <p>
              <DiffStringList before={before.certifications} after={after.certifications} />
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
