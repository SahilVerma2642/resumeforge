"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useResumeStore } from "@/lib/store";
import {
  Download,
  FileText,
  FileSearch,
  ScanSearch,
  Loader2,
  X,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

function slugify(s: string) {
  return (
    s
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9-]/g, "")
      .toLowerCase() || "resume"
  );
}

function timestamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

const EXPECTED_HEADINGS = [
  "PROFESSIONAL SUMMARY",
  "WORK EXPERIENCE",
  "TECHNICAL SKILLS",
  "EDUCATION",
];

export default function ExportMenu() {
  const { resume, template, fontSize, fileBase, appendTimestamp, setFileBase, setAppendTimestamp } =
    useResumeStore();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"pdf" | "docx" | "preview" | "xray" | null>(null);
  const [notice, setNotice] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [xray, setXray] = useState<{ text: string; found: string[]; missing: string[] } | null>(null);

  const fileName = () => {
    const base = fileBase.trim() ? slugify(fileBase) : slugify(resume.personal.name || "resume");
    return appendTimestamp ? `${base}-${timestamp()}` : base;
  };

  const makePdfBlob = async () => {
    const [{ pdf }, { ResumePDF }] = await Promise.all([
      import("@react-pdf/renderer"),
      import("@/components/pdf/ResumePDF"),
    ]);
    return pdf(<ResumePDF resume={resume} template={template} fontSize={fontSize} />).toBlob();
  };

  const trigger = (blob: Blob, ext: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = async () => {
    setBusy("pdf");
    setNotice("");
    try {
      trigger(await makePdfBlob(), "pdf");
    } catch {
      setNotice("PDF export failed - please try again.");
    } finally {
      setBusy(null);
    }
  };

  const downloadDocx = async () => {
    setBusy("docx");
    setNotice("");
    try {
      const { buildDocxBlob } = await import("@/lib/docx");
      trigger(await buildDocxBlob(resume, template), "docx");
    } catch {
      setNotice("DOCX export failed - please try again.");
    } finally {
      setBusy(null);
    }
  };

  const pagePreview = async () => {
    setBusy("preview");
    setNotice("");
    try {
      setPreviewUrl(URL.createObjectURL(await makePdfBlob()));
      setOpen(false);
    } catch {
      setNotice("PDF preview failed - please try again.");
    } finally {
      setBusy(null);
    }
  };

  const runXray = async () => {
    setBusy("xray");
    setNotice("");
    try {
      const blob = await makePdfBlob();
      const form = new FormData();
      form.append("file", blob, "resume.pdf");
      const res = await fetch("/api/xray", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const squashed = (data.text as string).toUpperCase().replace(/\s+/g, "");
      const found = EXPECTED_HEADINGS.filter((h) => squashed.includes(h.replace(/\s+/g, "")));
      const missing = EXPECTED_HEADINGS.filter((h) => !squashed.includes(h.replace(/\s+/g, "")));
      setXray({ text: data.text, found, missing });
      setOpen(false);
    } catch (e: any) {
      setNotice(e.message ?? "X-ray failed - please try again.");
    } finally {
      setBusy(null);
    }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const item =
    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-paper transition-colors disabled:opacity-50";

  return (
    <div className="relative">
      <button className="btn-primary text-xs" onClick={() => setOpen(!open)} aria-expanded={open}>
        <Download size={14} /> Export <ChevronDown size={13} className={open ? "rotate-180" : ""} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-xl border border-hairline bg-white p-3 shadow-sheet">
          <label className="label">File name</label>
          <input
            className="field"
            placeholder={slugify(resume.personal.name || "resume")}
            value={fileBase}
            onChange={(e) => setFileBase(e.target.value)}
          />
          <label className="mt-2 flex items-center gap-2 text-xs text-slate2">
            <input
              type="checkbox"
              checked={appendTimestamp}
              onChange={(e) => setAppendTimestamp(e.target.checked)}
            />
            Append timestamp
          </label>
          <p className="mt-1 truncate text-[11px] text-slate2">
            → {fileName()}.pdf
          </p>

          <div className="mt-3 space-y-1 border-t border-hairline pt-3">
            <button className={item} onClick={downloadPdf} disabled={busy !== null}>
              {busy === "pdf" ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              Download PDF
            </button>
            <button className={item} onClick={downloadDocx} disabled={busy !== null}>
              {busy === "docx" ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
              Download DOCX
            </button>
            <button className={item} onClick={pagePreview} disabled={busy !== null}>
              {busy === "preview" ? <Loader2 size={15} className="animate-spin" /> : <FileSearch size={15} />}
              Page preview
              <span className="ml-auto text-[10px] text-slate2">page breaks</span>
            </button>
            <button className={item} onClick={runXray} disabled={busy !== null}>
              {busy === "xray" ? <Loader2 size={15} className="animate-spin" /> : <ScanSearch size={15} />}
              ATS X-ray
              <span className="ml-auto text-[10px] text-slate2">what an ATS sees</span>
            </button>
          </div>
          {notice && <p className="mt-2 text-xs text-coral">{notice}</p>}
        </div>
      )}

      {/* Page preview modal */}
      {previewUrl &&
        typeof document !== "undefined" &&
        createPortal(
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
                  The actual PDF file - with real page breaks
                </span>
                <div className="flex gap-2">
                  <button className="btn-primary !px-3 !py-1.5 text-xs" onClick={downloadPdf}>
                    <Download size={13} /> Download
                  </button>
                  <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={closePreview}>
                    <X size={13} /> Close
                  </button>
                </div>
              </div>
              <iframe src={previewUrl} title="Resume PDF preview" className="min-h-0 w-full flex-1" />
            </div>
          </div>,
          document.body
        )}

      {/* ATS X-ray modal */}
      {xray &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex flex-col bg-ink/60 p-3 sm:p-8"
            role="dialog"
            aria-label="ATS X-ray"
            onClick={() => setXray(null)}
          >
            <div
              className="mx-auto flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-sheet"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
                <span className="font-display text-sm font-bold">
                  ATS X-ray - the literal text a parser extracts from your PDF
                </span>
                <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => setXray(null)}>
                  <X size={13} /> Close
                </button>
              </div>
              <div className="border-b border-hairline bg-paper/60 px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {xray.found.map((h) => (
                    <span key={h} className="inline-flex items-center gap-1 rounded-md bg-mint/10 px-2 py-1 text-[11px] font-bold text-mint">
                      <CheckCircle2 size={12} /> {h}
                    </span>
                  ))}
                  {xray.missing.map((h) => (
                    <span key={h} className="inline-flex items-center gap-1 rounded-md bg-coral/10 px-2 py-1 text-[11px] font-bold text-coral">
                      <AlertTriangle size={12} /> {h} not detected
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate2">
                  Read the text below top-to-bottom: if it flows in the right order and every
                  section is present, an ATS will parse this resume cleanly.
                </p>
              </div>
              <pre className="scroll-slim min-h-0 flex-1 overflow-auto whitespace-pre-wrap bg-white p-4 font-mono text-[12px] leading-relaxed">
                {xray.text}
              </pre>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
