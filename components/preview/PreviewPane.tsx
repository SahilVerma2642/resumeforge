"use client";

import { useEffect, useRef, useState } from "react";
import { useResumeStore } from "@/lib/store";
import { Resume, FontSize, TemplateId } from "@/lib/types";
import { Download, FileSearch, Loader2, X } from "lucide-react";
import DiffSheet from "@/components/preview/DiffSheet";

/* ---------- PDF download (client-only, dynamic import) ---------- */

function PdfActions() {
  const { resume, template, fontSize } = useResumeStore();
  const [busy, setBusy] = useState<"download" | "preview" | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const makeBlob = async () => {
    const [{ pdf }, { ResumePDF }] = await Promise.all([
      import("@react-pdf/renderer"),
      import("@/components/pdf/ResumePDF"),
    ]);
    return pdf(
      <ResumePDF resume={resume} template={template} fontSize={fontSize} />
    ).toBlob();
  };

  const download = async () => {
    setBusy("download");
    try {
      const blob = await makeBlob();
      const name = (resume.personal.name || "Resume").trim().replace(/\s+/g, "-");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name}-Resume.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setNotice("PDF export failed - please try again.");
    } finally {
      setBusy(null);
    }
  };

  const preview = async () => {
    setBusy("preview");
    try {
      const blob = await makeBlob();
      setPreviewUrl(URL.createObjectURL(blob));
    } catch {
      setNotice("PDF preview failed - please try again.");
    } finally {
      setBusy(null);
    }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {notice && (
          <span className="text-xs text-coral" role="alert">
            {notice}
          </span>
        )}
        <button
          className="btn-ghost text-xs"
          onClick={preview}
          disabled={busy !== null}
          title="Renders the actual PDF file, including page breaks"
        >
          {busy === "preview" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <FileSearch size={14} />
          )}
          Page preview
        </button>
        <button className="btn-primary text-xs" onClick={download} disabled={busy !== null}>
          {busy === "download" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Download size={14} />
          )}
          Download PDF
        </button>
      </div>

      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-ink/60 p-3 sm:p-8"
          role="dialog"
          aria-label="PDF preview"
          onClick={closePreview}
        >
          <div
            className="mx-auto flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
              <span className="font-display text-sm font-bold">
                The actual PDF file - with real page breaks, exactly what you&apos;ll download
              </span>
              <div className="flex gap-2">
                <button className="btn-primary !px-3 !py-1.5 text-xs" onClick={download}>
                  <Download size={13} /> Download
                </button>
                <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={closePreview}>
                  <X size={13} /> Close
                </button>
              </div>
            </div>
            <iframe src={previewUrl} title="Resume PDF preview" className="min-h-0 w-full flex-1" />
          </div>
        </div>
      )}
    </>
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
      // restart the CSS animation
      void el.offsetWidth;
      el.classList.add("pulse");
    }
  }, [touched, id]);

  return <div ref={ref}>{children}</div>;
}

/* ---------- Shared bits ---------- */

const SIZE: Record<FontSize, string> = {
  s: "text-[11px] leading-[1.45]",
  m: "text-[12.5px] leading-[1.5]",
  l: "text-[14px] leading-[1.55]",
};

function contactLine(r: Resume) {
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

function skillRows(r: Resume) {
  return (
    [
      ["Languages", r.skills.languages],
      ["Frameworks", r.skills.frameworks],
      ["Databases", r.skills.databases],
      ["Tools", r.skills.tools],
    ] as const
  ).filter(([, v]) => v.length > 0);
}

/* ---------- Templates ---------- */

function TemplateBody({ r, modern }: { r: Resume; modern: boolean }) {
  const heading = modern
    ? "font-sans text-[1.05em] font-bold uppercase tracking-[0.12em] text-[#2456F6] border-b border-[#E4E8EF] pb-1 mb-2"
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
            <p>{r.summary}</p>
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
                      {[e.startDate, e.endDate].filter(Boolean).join(" – ")}
                      {e.location ? ` · ${e.location}` : ""}
                    </p>
                  </div>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5">
                    {e.bullets
                      .filter((b) => b.text.trim())
                      .map((b) => (
                        <li key={b.id}>{b.text}</li>
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
                {vals.join(", ")}
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
                      <span className="text-black/60"> | {p.techStack.join(", ")}</span>
                    )}
                  </p>
                  <p>
                    {p.description}
                    {p.impact ? ` - ${p.impact}` : ""}
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

/* ---------- Pane ---------- */

export default function PreviewPane() {
  const { resume, template, fontSize, setTemplate, setFontSize, review } = useResumeStore();

  if (review) {
    return (
      <div className="flex flex-col items-center px-4 py-6 sm:px-8">
        <DiffSheet before={review.before} after={review.after} />
        <p className="mt-4 text-center text-xs text-slate2">
          Red strikethrough = removed · green highlight = added. Apply keeps a snapshot
          so you can revert afterwards.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-4 py-6 sm:px-8">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 mb-5 flex w-full max-w-[820px] flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-white/90 px-4 py-2.5 backdrop-blur">
        <div className="flex rounded-lg border border-hairline bg-paper p-0.5">
          {(["modern", "classic"] as TemplateId[]).map((t) => (
            <button
              key={t}
              onClick={() => setTemplate(t)}
              className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                template === t ? "bg-white text-signal shadow-sm" : "text-slate2"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1" role="group" aria-label="Font size">
          {(["s", "m", "l"] as FontSize[]).map((f) => (
            <button
              key={f}
              onClick={() => setFontSize(f)}
              className={`h-7 w-7 rounded-md text-xs font-bold uppercase transition-colors ${
                fontSize === f
                  ? "bg-signal text-white"
                  : "text-slate2 hover:bg-hairline/60"
              }`}
              aria-pressed={fontSize === f}
            >
              {f}
            </button>
          ))}
        </div>
        <PdfActions />
      </div>

      {/* Sheet (A4 aspect, mirrors the PDF) */}
      <div
        className={`sheet w-full max-w-[820px] px-8 py-10 sm:px-12 ${SIZE[fontSize]} text-black`}
        aria-label="Resume preview"
      >
        <TemplateBody r={resume} modern={template === "modern"} />
      </div>
      <p className="mt-4 text-center text-xs text-slate2">
        Single column · standard headings · exported as real selectable text - built to
        parse cleanly in applicant tracking systems.
      </p>
    </div>
  );
}
