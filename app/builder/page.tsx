"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PenLine, Wand2, Gauge, TrendingUp, Eye, X, LogOut } from "lucide-react";
import EditorPanel from "@/components/builder/EditorPanel";
import TailorPanel from "@/components/tailor/TailorPanel";
import ScorePanel from "@/components/score/ScorePanel";
import EnhancePanel from "@/components/enhance/EnhancePanel";
import PreviewPane from "@/components/preview/PreviewPane";

type Tab = "edit" | "tailor" | "score" | "enhance";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "edit", label: "Edit", icon: PenLine },
  { id: "tailor", label: "Tailor", icon: Wand2 },
  { id: "score", label: "Score", icon: Gauge },
  { id: "enhance", label: "Enhance", icon: TrendingUp },
];

export default function BuilderPage() {
  const [tab, setTab] = useState<Tab>("edit");
  const [mobilePreview, setMobilePreview] = useState(false);
  const [provider, setProvider] = useState("");
  useEffect(() => {
    fetch("/api/ai/provider")
      .then((r) => r.json())
      .then((d) => setProvider(d.label ?? ""))
      .catch(() => {});
  }, []);
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    // Hard navigation: resets the client router cache so the authenticated
    // /builder page can't be served from cache after logging out.
    window.location.assign("/");
  };

  return (
    <div className="flex h-dvh flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-hairline bg-white px-4 py-3 sm:px-6">
        <Link href="/" className="font-display text-base font-bold tracking-tight">
          Resume<span className="text-signal">Forge</span>
        </Link>
        <nav
          className="flex rounded-lg border border-hairline bg-paper p-1"
          role="tablist"
          aria-label="Builder sections"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-white text-signal shadow-sm"
                  : "text-slate2 hover:text-ink"
              }`}
            >
              <t.icon size={15} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </nav>
        <button
          className="btn-ghost lg:hidden"
          onClick={() => setMobilePreview(true)}
          aria-label="Show resume preview"
        >
          <Eye size={16} /> Preview
        </button>
        <div className="hidden items-center gap-3 lg:flex">
          {provider && (
            <span
              className="rounded-full border border-hairline bg-paper px-2.5 py-1 text-[11px] font-medium text-slate2"
              title="Which AI provider this deployment is using"
            >
              AI: {provider}
            </span>
          )}
          <span className="text-xs text-slate2">Autosaved to your browser</span>
          <button
            className="btn-ghost !px-2.5 !py-1.5 text-xs"
            onClick={logout}
            title="Sign out (only relevant when auth is enabled)"
          >
            <LogOut size={13} /> Logout
          </button>
        </div>
      </header>

      {/* Workspace */}
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(380px,44%)_1fr]">
        {/* Left: active panel */}
        <div className="scroll-slim min-h-0 overflow-y-auto border-r border-hairline bg-white">
          {tab === "edit" && <EditorPanel />}
          {tab === "tailor" && <TailorPanel onEnhance={() => setTab("enhance")} />}
          {tab === "score" && <ScorePanel />}
          {tab === "enhance" && <EnhancePanel />}
        </div>

        {/* Right: preview (desktop) */}
        <div className="scroll-slim hidden min-h-0 overflow-y-auto bg-paper lg:block">
          <PreviewPane />
        </div>
      </div>

      {/* Mobile preview drawer */}
      {mobilePreview && (
        <div className="fixed inset-0 z-50 flex flex-col bg-paper lg:hidden">
          <div className="flex items-center justify-between border-b border-hairline bg-white px-4 py-3">
            <span className="font-display text-sm font-bold">Preview</span>
            <button
              className="btn-ghost"
              onClick={() => setMobilePreview(false)}
              aria-label="Close preview"
            >
              <X size={16} /> Close
            </button>
          </div>
          <div className="scroll-slim min-h-0 flex-1 overflow-y-auto">
            <PreviewPane />
          </div>
        </div>
      )}
    </div>
  );
}
