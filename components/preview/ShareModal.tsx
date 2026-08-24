"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import { useResumeStore } from "@/lib/store";
import { encodeResumeLink } from "@/lib/share";
import { Share2, X, Copy, Check, Loader2 } from "lucide-react";

export default function ShareButton() {
  const resume = useResumeStore((s) => s.resume);
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState("");
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const [mode, setMode] = useState<"short" | "hash">("hash");
  const [ttlDays, setTtlDays] = useState(0);

  const openShare = async () => {
    setBusy(true);
    try {
      let url = "";
      // Preferred: KV-backed short link -> tiny URL -> sparse, easy-scan QR.
      try {
        const res = await fetch("/api/share", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ resume }),
        });
        if (res.ok) {
          const data = await res.json();
          url = `${window.location.origin}/r/${data.id}`;
          setTtlDays(data.ttlDays ?? 0);
          setMode("short");
        }
      } catch {
        /* fall through to hash link */
      }
      // Fallback: serverless hash link (resume travels inside the URL).
      if (!url) {
        url = await encodeResumeLink(resume, window.location.origin);
        setMode("hash");
      }
      setLink(url);
      try {
        setQr(
          await QRCode.toDataURL(url, {
            width: 280,
            margin: 1,
            errorCorrectionLevel: url.length < 200 ? "M" : "L",
          })
        );
      } catch {
        // Resume too large even after compression: the copy link always works.
        setQr("");
      }
      setOpen(true);
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      <button className="btn-ghost text-xs" onClick={openShare} disabled={busy}>
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
        Share
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px]"
            role="dialog"
            aria-label="Share resume"
            onClick={() => setOpen(false)}
          >
            <div
              className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-sheet"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-hairline px-5 py-3.5">
                <h2 className="font-display text-sm font-bold">Share this resume</h2>
                <button
                  className="rounded-md p-1 text-slate2 hover:bg-paper hover:text-ink"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-5 text-center">
                {qr ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qr} alt="QR code linking to a read-only view of this resume" className="mx-auto rounded-lg border border-hairline" />
                ) : (
                  <p className="rounded-lg border border-[#E8A13A]/40 bg-[#E8A13A]/5 px-3 py-2 text-xs text-[#B87A17]">
                    This resume is too large to fit in a QR code even after compression -
                    use the copy link below instead, it always works.
                  </p>
                )}
                <p className="mt-3 text-sm text-slate2">
                  {qr ? "Scan with any device to open a read-only view of this resume - it can also be imported into the builder there." : "The link opens a read-only view that can also be imported into the builder on the other device."}
                </p>
                <button className="btn-primary mt-4 w-full text-xs" onClick={copy}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy link"}
                </button>
                <p className="mt-3 text-[11px] leading-relaxed text-slate2">
                  {mode === "short"
                    ? `Privacy note: this resume is stored on the server under an unguessable id so the QR stays small, and the link expires after ${ttlDays || 180} days. Anyone who has the link can view it - share it only with people you intend to.`
                    : "Privacy note: the resume data travels inside the link itself (nothing is stored on any server), so anyone who has this link can view the resume. Share it only with people you intend to."}
                </p>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
