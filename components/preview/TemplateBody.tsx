"use client";

import { useEffect, useRef } from "react";
import { useResumeStore } from "@/lib/store";
import { Resume } from "@/lib/types";

/* ---------- #3 keyword highlighting ---------- */

export function hiText(text: string, words?: string[]): React.ReactNode {
  if (!words?.length || !text) return text;
  const escaped = words
    .filter((w) => w && w.length > 1)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!escaped.length) return text;
  const re = new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
  const parts = text.split(re);
  if (parts.length === 1) return text;
  return parts.map((p, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="rounded-[3px] bg-mint/25 px-0.5">
        {p}
      </mark>
    ) : (
      p
    )
  );
}

/* ---------- Section wrapper with signature pulse ---------- */

function PulseSection({ id, children }: { id: string; children: React.ReactNode }) {
  const touched = useResumeStore((s) => s.touched);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (touched?.section === id && ref.current) {
      const el = ref.current;
      el.classList.remove("pulse");
      void el.offsetWidth;
      el.classList.add("pulse");
    }
  }, [touched, id]);

  return <div ref={ref}>{children}</div>;
}

/* ---------- Shared helpers ---------- */

export function contactLine(r: Resume) {
  return [
    r.personal.email,
    r.personal.phone,
    r.personal.location,
    r.personal.linkedin,
    r.personal.website,
  ]
    .filter(Boolean)
    .join("  ·  ");
}

export function skillRows(r: Resume) {
  return r.skills
    .filter((g) => g.items.length > 0)
    .map((g) => [g.label, g.items] as const);
}

/* ---------- Templates ---------- */

export default function TemplateBody({
  r,
  modern,
  mark,
}: {
  r: Resume;
  modern: boolean;
  mark?: string[];
}) {
  const heading = modern
    ? "font-sans text-[1.05em] font-bold uppercase tracking-[0.12em] text-signal border-b border-hairline pb-1 mb-2"
    : "font-serif text-[1.1em] font-bold uppercase tracking-wide border-b border-black/70 pb-1 mb-2";
  const face = modern ? "font-sans" : "font-serif";

  return (
    <div className={face}>
      {/* Header */}
      <PulseSection id="personal">
        <div className={modern ? "text-left" : "text-center"}>
          <h1 className="text-[2em] font-bold leading-tight">
            {r.personal.name || "Your Name"}
          </h1>
          <p className="mt-1 text-[0.92em] text-black/70">{contactLine(r)}</p>
        </div>
      </PulseSection>

      {/* Summary */}
      {r.summary && (
        <PulseSection id="summary">
          <div className="mt-4">
            <h2 className={heading}>Professional Summary</h2>
            <p>{hiText(r.summary, mark)}</p>
          </div>
        </PulseSection>
      )}

      {/* Experience */}
      {r.experience.length > 0 && (
        <PulseSection id="experience">
          <div className="mt-4">
            <h2 className={heading}>Work Experience</h2>
            <div className="space-y-3">
              {r.experience.map((e) => (
                <div key={e.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className="font-bold">
                      {e.title}
                      {e.company ? ` - ${e.company}` : ""}
                    </p>
                    <p className="text-[0.9em] text-black/60">
                      {[e.startDate, e.endDate].filter(Boolean).join(" - ")}
                      {e.location ? ` · ${e.location}` : ""}
                    </p>
                  </div>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5">
                    {e.bullets
                      .filter((b) => b.text.trim())
                      .map((b) => (
                        <li key={b.id}>{hiText(b.text, mark)}</li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </PulseSection>
      )}

      {/* Skills */}
      {skillRows(r).length > 0 && (
        <PulseSection id="skills">
          <div className="mt-4">
            <h2 className={heading}>Technical Skills</h2>
            {skillRows(r).map(([label, vals]) => (
              <p key={label}>
                <span className="font-bold">{label}: </span>
                {hiText(vals.join(", "), mark)}
              </p>
            ))}
          </div>
        </PulseSection>
      )}

      {/* Projects */}
      {r.projects.length > 0 && (
        <PulseSection id="projects">
          <div className="mt-4">
            <h2 className={heading}>Projects</h2>
            <div className="space-y-2">
              {r.projects.map((p) => (
                <div key={p.id}>
                  <p>
                    <span className="font-bold">{p.name}</span>
                    {p.techStack.length > 0 && (
                      <span className="text-black/60"> | {hiText(p.techStack.join(", "), mark)}</span>
                    )}
                  </p>
                  <p>
                    {hiText(`${p.description}${p.impact ? ` - ${p.impact}` : ""}`, mark)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </PulseSection>
      )}

      {/* Education */}
      {r.education.length > 0 && (
        <PulseSection id="education">
          <div className="mt-4">
            <h2 className={heading}>Education</h2>
            {r.education.map((ed) => (
              <p key={ed.id}>
                <span className="font-bold">
                  {[ed.degree, ed.field].filter(Boolean).join(", ")}
                </span>
                {ed.institution ? ` - ${ed.institution}` : ""}
                {ed.year ? ` (${ed.year})` : ""}
              </p>
            ))}
          </div>
        </PulseSection>
      )}

      {/* Certifications */}
      {r.certifications.length > 0 && (
        <PulseSection id="certifications">
          <div className="mt-4">
            <h2 className={heading}>Certifications &amp; Awards</h2>
            <ul className="list-disc pl-5">
              {r.certifications.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        </PulseSection>
      )}
    </div>
  );
}
