"use client";

// Shared read-only resume renderer for both /r (hash links) and /r/[id]
// (short links). Client component so "Import into builder" can hit the store.
import { Resume } from "@/lib/types";
import { useResumeStore } from "@/lib/store";
import TemplateBody from "@/components/preview/TemplateBody";
import { Import } from "lucide-react";

export default function PublicResumeView({ resume }: { resume: Resume }) {
  const importIntoBuilder = useResumeStore((s) => s.setResume);

  return (
    <div className="min-h-dvh bg-paper px-4 py-8">
      <div className="mx-auto max-w-[820px]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <span className="font-display text-sm font-bold">
            Resume<span className="text-signal">Forge</span>
            <span className="ml-2 rounded-full border border-hairline bg-white px-2 py-0.5 text-[10px] font-semibold text-slate2">
              READ-ONLY VIEW
            </span>
          </span>
          <button
            className="btn-ghost text-xs"
            onClick={() => {
              importIntoBuilder(resume);
              window.location.assign("/builder");
            }}
          >
            <Import size={13} /> Import into builder on this device
          </button>
        </div>
        <div className="sheet px-8 py-10 text-[12.5px] leading-[1.5] text-black sm:px-12">
          <TemplateBody r={resume} modern />
        </div>
      </div>
    </div>
  );
}
