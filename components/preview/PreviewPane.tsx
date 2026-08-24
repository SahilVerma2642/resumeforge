"use client";

import { useResumeStore } from "@/lib/store";
import { FontSize, TemplateId } from "@/lib/types";
import TemplateBody from "@/components/preview/TemplateBody";
import DiffSheet from "@/components/preview/DiffSheet";
import ExportMenu from "@/components/preview/ExportMenu";
import ShareButton from "@/components/preview/ShareModal";
import { Highlighter } from "lucide-react";
import { useState } from "react";

const SIZE: Record<FontSize, string> = {
  s: "text-[11px] leading-[1.45]",
  m: "text-[12.5px] leading-[1.5]",
  l: "text-[14px] leading-[1.55]",
};

export default function PreviewPane() {
  const { resume, template, fontSize, setTemplate, setFontSize, review, keywords } =
    useResumeStore();
  const [lens, setLens] = useState(false);

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
      <div className="sticky top-0 z-10 mb-5 w-full max-w-[820px] rounded-xl border border-hairline bg-white/90 px-4 py-2.5 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
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
                  fontSize === f ? "bg-signal text-white" : "text-slate2 hover:bg-hairline/60"
                }`}
                aria-pressed={fontSize === f}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {keywords && (
              <button
                className={`btn text-xs ${lens ? "bg-mint text-white" : "btn-ghost"}`}
                onClick={() => setLens(!lens)}
                title="Highlight JD keywords found in your resume"
                aria-pressed={lens}
              >
                <Highlighter size={14} /> Keywords
              </button>
            )}
            <ShareButton />
            <ExportMenu />
          </div>
        </div>
        {/* #3 keyword lens: missing keywords shown as chips */}
        {lens && keywords && keywords.missing.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-hairline pt-2">
            <span className="text-[11px] font-semibold text-slate2">Missing from resume:</span>
            {keywords.missing.slice(0, 12).map((k) => (
              <span
                key={k}
                className="rounded-md bg-[#E8A13A]/15 px-2 py-0.5 text-[11px] font-medium text-[#B87A17]"
              >
                {k}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Sheet (A4 aspect, mirrors the PDF) */}
      <div
        className={`sheet w-full max-w-[820px] px-8 py-10 sm:px-12 ${SIZE[fontSize]} text-black`}
        aria-label="Resume preview"
      >
        <TemplateBody
          r={resume}
          modern={template === "modern"}
          mark={lens && keywords ? keywords.matched : undefined}
        />
      </div>
      <p className="mt-4 text-center text-xs text-slate2">
        Single column · standard headings · exported as real selectable text - built to
        parse cleanly in applicant tracking systems.
      </p>
    </div>
  );
}
