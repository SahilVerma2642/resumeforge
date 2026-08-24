"use client";

import { useEffect, useState } from "react";
import { useResumeStore } from "@/lib/store";

type Option = { value: "anthropic" | "groq" | "cli"; label: string; configured: boolean };

export default function ProviderSelect() {
  const aiProvider = useResumeStore((s) => s.aiProvider);
  const setAiProvider = useResumeStore((s) => s.setAiProvider);
  const [options, setOptions] = useState<Option[]>([]);
  const [defaultLabel, setDefaultLabel] = useState("");

  useEffect(() => {
    fetch("/api/ai/provider")
      .then((r) => r.json())
      .then((d) => {
        setOptions(d.options ?? []);
        setDefaultLabel(d.label ?? "");
      })
      .catch(() => {});
  }, []);

  if (options.length === 0) return null;

  return (
    <select
      className="rounded-full border border-hairline bg-paper px-2.5 py-1 text-[11px] font-medium text-slate2 outline-none"
      value={aiProvider}
      onChange={(e) => setAiProvider(e.target.value as typeof aiProvider)}
      title="Which AI provider handles your requests. Auto follows this deployment's configured default."
    >
      <option value="auto">Auto ({defaultLabel})</option>
      {options.map((o) => (
        <option key={o.value} value={o.value} disabled={!o.configured}>
          AI: {o.label}
          {o.configured ? "" : " (not configured)"}
        </option>
      ))}
    </select>
  );
}
