"use client";

import { useState } from "react";
import { useResumeStore, aiProviderHeader } from "@/lib/store";
import { resumeHasContent } from "@/lib/types";
import {
  Mail,
  MessageCircleQuestion,
  Loader2,
  Copy,
  Check,
  Download,
  ChevronDown,
  Target,
  AlertTriangle,
} from "lucide-react";

interface PrepQuestion {
  question: string;
  category: "likely" | "gap-probe";
  why: string;
  star: { situation: string; task: string; action: string; result: string };
}

function QuestionCard({ q }: { q: PrepQuestion }) {
  const [open, setOpen] = useState(false);
  const probe = q.category === "gap-probe";
  return (
    <div className="mb-3 rounded-xl border border-hairline bg-white">
      <button
        className="flex w-full items-start justify-between gap-3 p-4 text-left"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <div>
          <span
            className={`mb-1.5 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${
              probe ? "bg-coral/10 text-coral" : "bg-signal/10 text-signal"
            }`}
          >
            {probe ? <AlertTriangle size={11} /> : <Target size={11} />}
            {probe ? "Probes your gap" : "Likely question"}
          </span>
          <p className="text-sm font-semibold">{q.question}</p>
        </div>
        <ChevronDown
          size={16}
          className={`mt-1 shrink-0 text-slate2 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t border-hairline px-4 pb-4 pt-3">
          <p className="text-xs text-slate2">{q.why}</p>
          <h4 className="mt-3 font-display text-xs font-bold uppercase tracking-wide text-slate2">
            STAR answer skeleton (from your real experience)
          </h4>
          <div className="mt-2 space-y-2 text-sm">
            {(
              [
                ["Situation", q.star.situation],
                ["Task", q.star.task],
                ["Action", q.star.action],
                ["Result", q.star.result],
              ] as const
            ).map(([label, text]) => (
              <p key={label}>
                <span className="font-bold text-signal">{label}: </span>
                {text}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApplyPanel() {
  const { resume, jd } = useResumeStore();
  const ready = resumeHasContent(resume) && jd.trim().length >= 50;

  /* Cover letter */
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [tone, setTone] = useState<"professional" | "warm" | "direct">("professional");
  const [letter, setLetter] = useState("");
  const [letterBusy, setLetterBusy] = useState(false);
  const [letterErr, setLetterErr] = useState("");
  const [copied, setCopied] = useState(false);

  const generateLetter = async () => {
    setLetterBusy(true);
    setLetterErr("");
    try {
      const res = await fetch("/api/ai/letter", {
        method: "POST",
        headers: { "content-type": "application/json", ...aiProviderHeader() },
        body: JSON.stringify({ resume, jobDescription: jd, company, role, tone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLetter(data.letter ?? "");
    } catch (e: any) {
      setLetterErr(e.message ?? "Letter generation failed - try again.");
    } finally {
      setLetterBusy(false);
    }
  };

  const copyLetter = async () => {
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const downloadLetter = () => {
    const blob = new Blob([letter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cover-letter.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  /* Interview prep */
  const [questions, setQuestions] = useState<PrepQuestion[]>([]);
  const [prepBusy, setPrepBusy] = useState(false);
  const [prepErr, setPrepErr] = useState("");

  const generatePrep = async () => {
    setPrepBusy(true);
    setPrepErr("");
    try {
      const res = await fetch("/api/ai/interview", {
        method: "POST",
        headers: { "content-type": "application/json", ...aiProviderHeader() },
        body: JSON.stringify({ resume, jobDescription: jd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQuestions(data.questions ?? []);
    } catch (e: any) {
      setPrepErr(e.message ?? "Interview prep failed - try again.");
    } finally {
      setPrepBusy(false);
    }
  };

  return (
    <div className="p-5">
      <h2 className="font-display text-lg font-bold">Apply kit</h2>
      <p className="mt-1 text-sm text-slate2">
        A tailored cover letter and the interview questions this exact application will
        produce - both grounded only in what&apos;s actually on your resume.
      </p>

      {!ready && (
        <p className="mt-4 rounded-lg border border-hairline bg-paper px-3 py-2 text-xs text-slate2">
          Fill in your resume (Edit tab) and paste the job description (Tailor tab) first -
          both tools are built around that specific pairing.
        </p>
      )}

      {/* --- Cover letter --- */}
      <section className="mt-6">
        <h3 className="flex items-center gap-2 font-display text-sm font-bold">
          <Mail size={15} className="text-signal" /> Cover letter
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Company (optional)</label>
            <input className="field" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <div>
            <label className="label">Role (optional)</label>
            <input className="field" value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
        </div>
        <label className="label mt-3">Tone</label>
        <div className="flex rounded-lg border border-hairline bg-paper p-0.5">
          {(["professional", "warm", "direct"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTone(t)}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                tone === t ? "bg-white text-signal shadow-sm" : "text-slate2"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button className="btn-primary mt-3 text-sm" onClick={generateLetter} disabled={letterBusy || !ready}>
          {letterBusy ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
          {letterBusy ? "Writing…" : letter ? "Regenerate letter" : "Generate cover letter"}
        </button>
        {letterErr && (
          <p className="mt-2 text-xs text-coral">
            {letterErr}{" "}
            <button className="underline" onClick={generateLetter}>
              Retry
            </button>
          </p>
        )}
        {letter && (
          <div className="mt-4 rounded-xl border border-hairline bg-white p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{letter}</p>
            <div className="mt-3 flex gap-2 border-t border-hairline pt-3">
              <button className="btn-ghost text-xs" onClick={copyLetter}>
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button className="btn-ghost text-xs" onClick={downloadLetter}>
                <Download size={13} /> Download .txt
              </button>
            </div>
          </div>
        )}
      </section>

      {/* --- Interview prep --- */}
      <section className="mt-8">
        <h3 className="flex items-center gap-2 font-display text-sm font-bold">
          <MessageCircleQuestion size={15} className="text-signal" /> Interview prep
        </h3>
        <p className="mt-1 text-xs text-slate2">
          Predicted questions for this JD - including the ones that probe your weak spots -
          with STAR answer skeletons built from your actual experience.
        </p>
        <button className="btn-primary mt-3 text-sm" onClick={generatePrep} disabled={prepBusy || !ready}>
          {prepBusy ? <Loader2 size={15} className="animate-spin" /> : <MessageCircleQuestion size={15} />}
          {prepBusy ? "Analyzing…" : questions.length ? "Regenerate questions" : "Predict my interview questions"}
        </button>
        {prepErr && (
          <p className="mt-2 text-xs text-coral">
            {prepErr}{" "}
            <button className="underline" onClick={generatePrep}>
              Retry
            </button>
          </p>
        )}
        {questions.length > 0 && (
          <div className="mt-4">
            {questions.map((q, i) => (
              <QuestionCard key={i} q={q} />
            ))}
          </div>
        )}
      </section>
      <div className="h-16" />
    </div>
  );
}
