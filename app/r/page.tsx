"use client";

// #9 Public read-only resume view. The resume data lives inside the URL hash
// (compressed), so this page needs no database and is safe to keep public:
// it renders whatever the link carries, nothing more.
import { useEffect, useState } from "react";
import { decodeResumeHash } from "@/lib/share";
import { Resume } from "@/lib/types";
import PublicResumeView from "@/components/preview/PublicResumeView";
import { FileQuestion } from "lucide-react";

export default function PublicResumePage() {
  const [resume, setResume] = useState<Resume | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    decodeResumeHash(window.location.hash).then((r) => {
      setResume(r);
      setChecked(true);
    });
  }, []);

  if (!checked) return null;

  if (!resume) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-paper px-4 text-center">
        <FileQuestion size={32} className="text-slate2" />
        <p className="font-display font-bold">This link doesn&apos;t contain a resume.</p>
        <p className="max-w-sm text-sm text-slate2">
          The resume data travels inside the link itself - this one seems incomplete or
          truncated. Ask for the link to be shared again.
        </p>
      </div>
    );
  }

  return <PublicResumeView resume={resume} />;
}
