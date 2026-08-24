"use client";

import { useState } from "react";
import { useResumeStore } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";
import { History, Save, Upload, Trash2 } from "lucide-react";

export default function VersionsButton() {
  const { versions, saveVersion, loadVersion, deleteVersion } = useResumeStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  return (
    <>
      <button className="btn-ghost text-xs" onClick={() => setOpen(true)}>
        <History size={14} /> Versions{versions.length > 0 ? ` (${versions.length})` : ""}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Resume versions">
        <p className="text-xs text-slate2">
          Snapshot the current resume before tailoring it to a job, so you always keep
          the exact version you sent - e.g. &quot;Backend role @ Acme&quot;.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            className="field"
            placeholder="Version name (e.g. Backend @ Acme)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                saveVersion(name);
                setName("");
              }
            }}
          />
          <button
            className="btn-primary shrink-0 text-xs"
            onClick={() => {
              saveVersion(name);
              setName("");
            }}
          >
            <Save size={13} /> Save current
          </button>
        </div>

        {versions.length === 0 ? (
          <p className="mt-4 text-center text-xs text-slate2">No versions saved yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {[...versions].reverse().map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-hairline px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{v.name}</p>
                  <p className="text-[11px] text-slate2">
                    {new Date(v.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    className="btn-ghost !px-2 !py-1.5 text-xs"
                    title="Load (replaces the current resume)"
                    onClick={() => {
                      loadVersion(v.id);
                      setOpen(false);
                    }}
                  >
                    <Upload size={13} /> Load
                  </button>
                  <button
                    className="btn-danger !px-2 !py-1.5"
                    aria-label={`Delete version ${v.name}`}
                    onClick={() => deleteVersion(v.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[11px] text-slate2">
          Loading a version replaces what&apos;s currently in the form - save the current
          state first if you want to keep it. Up to 20 versions are kept.
        </p>
      </Modal>
    </>
  );
}
