// Public short-link resume view: /r/aB3xK9. Not matched by the auth
// middleware (only /builder and /api/* are), so recruiters can open it.
import { kvAvailable, kvGet } from "@/lib/kv";
import { cleanDashes, Resume } from "@/lib/types";
import PublicResumeView from "@/components/preview/PublicResumeView";
import { FileQuestion } from "lucide-react";

export const dynamic = "force-dynamic";

function Missing({ text }: { text: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-paper px-4 text-center">
      <FileQuestion size={32} className="text-slate2" />
      <p className="font-display font-bold">Resume not found</p>
      <p className="max-w-sm text-sm text-slate2">{text}</p>
    </div>
  );
}

export default async function ShortLinkPage({ params }: { params: { id: string } }) {
  if (!kvAvailable()) {
    return <Missing text="Short links are not enabled on this deployment." />;
  }
  const raw = await kvGet(`resume:${params.id}`).catch(() => null);
  if (!raw) {
    return (
      <Missing text="This share link has expired or was never created. Ask for the resume to be shared again." />
    );
  }
  let resume: Resume;
  try {
    resume = cleanDashes(JSON.parse(raw)) as Resume;
  } catch {
    return <Missing text="This share link is corrupted. Ask for the resume to be shared again." />;
  }
  return <PublicResumeView resume={resume} />;
}
