"use client";

import { useState, useRef, ReactNode } from "react";
import { Resume, resumeHasContent } from "@/lib/types";
import { ConfirmModal } from "@/components/ui/Modal";
import {
  useResumeStore,
  newBullet,
  newExperience,
  newEducation,
  newProject,
} from "@/lib/store";
import {
  ChevronDown,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Import,
  Upload,
  Check,
  X,
  Undo2,
  Sparkles,
  Loader2,
} from "lucide-react";

/* ---------- Small primitives ---------- */

function Section({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-hairline">
      <button
        className="flex w-full items-center justify-between px-5 py-4 text-left"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="font-display text-sm font-bold uppercase tracking-wide">
          {title}
        </span>
        <ChevronDown
          size={16}
          className={`text-slate2 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="px-5 pb-6">{children}</div>}
    </section>
  );
}

function TagInput({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim().replace(/,$/, "");
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft("");
  };
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-hairline bg-white p-2">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-md bg-paper px-2 py-0.5 text-xs font-medium"
          >
            {v}
            <button
              onClick={() => onChange(values.filter((x) => x !== v))}
              aria-label={`Remove ${v}`}
              className="text-slate2 hover:text-coral"
            >
              ×
            </button>
          </span>
        ))}
        <input
          className="min-w-[110px] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-slate2/50"
          placeholder="Type + Enter"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
          }}
          onBlur={add}
        />
      </div>
    </div>
  );
}

/* ---------- Import / AI improve toolbar ---------- */

function AiToolbar() {
  const { resume, setResume, startReview, snapshot, revertSnapshot } = useResumeStore();
  const [importOpen, setImportOpen] = useState(false);
  const [rawText, setRawText] = useState("");
  const [busy, setBusy] = useState<"import" | "improve" | "file" | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [pending, setPending] = useState<{ resume: Resume; source: string } | null>(null);
  const [confirmImprove, setConfirmImprove] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const runFileImport = async (file: File) => {
    setBusy("file");
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/ai/extract-file", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPending({ resume: data.resume, source: file.name });
      setImportOpen(false);
    } catch (e: any) {
      setError(e.message ?? "File import failed - try again.");
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const runImport = async () => {
    setBusy("import");
    setError("");
    try {
      const res = await fetch("/api/ai/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rawText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPending({ resume: data.resume, source: "pasted text" });
      setImportOpen(false);
      setRawText("");
    } catch (e: any) {
      setError(e.message ?? "Import failed - try again.");
    } finally {
      setBusy(null);
    }
  };

  const ready = resumeHasContent(resume);

  const runImprove = async () => {
    setBusy("improve");
    setError("");
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resume, jdAnalysis: null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (JSON.stringify(data.resume) === JSON.stringify(resume)) {
        setInfo(
          "The AI reviewed your resume and found nothing it would change - it's already in good shape. Try the Tailor tab with a specific JD for targeted improvements."
        );
        return;
      }
      setInfo("");
      // Nothing is applied yet: the preview switches to a GitHub-style diff
      // with Apply / Discard controls.
      startReview(data.resume);
    } catch (e: any) {
      setError(e.message ?? "AI rewrite failed - try again.");
    } finally {
      setBusy(null);
    }
  };


  return (
    <div className="border-b border-hairline bg-paper/60 px-5 py-3">
      <div className="flex flex-wrap gap-2">
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) runFileImport(f);
          }}
        />
        <button
          className="btn-ghost text-xs"
          onClick={() => fileRef.current?.click()}
          disabled={busy !== null}
        >
          {busy === "file" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Upload size={14} />
          )}
          {busy === "file" ? "Reading file…" : "Upload PDF / DOCX"}
        </button>
        <button className="btn-ghost text-xs" onClick={() => setImportOpen(!importOpen)}>
          <Import size={14} /> Paste resume text
        </button>
        <button
          className="btn-ghost text-xs"
          onClick={() =>
            ready
              ? setConfirmImprove(true)
              : setError("Add a summary, an experience bullet, or some skills first - there is nothing to improve yet.")
          }
          disabled={busy !== null}
        >
          {busy === "improve" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Sparkles size={14} />
          )}
          Improve with AI
        </button>
        {snapshot && (
          <button className="btn-ghost text-xs" onClick={revertSnapshot}>
            <Undo2 size={14} /> Revert AI changes
          </button>
        )}
      </div>
      {importOpen && (
        <div className="mt-3">
          <textarea
            className="field min-h-[140px]"
            placeholder="Paste your existing resume text (or rough notes about your roles, skills, and education)…"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
          <button
            className="btn-primary mt-2 text-xs"
            onClick={runImport}
            disabled={busy !== null || rawText.trim().length < 30}
          >
            {busy === "import" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Import size={14} />
            )}
            Extract into the form
          </button>
        </div>
      )}
      {pending && (
        <div className="mt-3 rounded-xl border border-signal/30 bg-signal/5 p-4">
          <p className="font-display text-sm font-bold">
            Extracted from {pending.source} - review before applying
          </p>
          <p className="mt-1 text-xs text-slate2">
            {pending.resume.personal.name || "No name found"} ·{" "}
            {pending.resume.experience.length} role
            {pending.resume.experience.length === 1 ? "" : "s"} (
            {pending.resume.experience.reduce((n, e) => n + e.bullets.length, 0)} bullets) ·{" "}
            {pending.resume.skills.languages.length +
              pending.resume.skills.frameworks.length +
              pending.resume.skills.databases.length +
              pending.resume.skills.tools.length}{" "}
            skills · {pending.resume.education.length} education ·{" "}
            {pending.resume.projects.length} projects
          </p>
          <p className="mt-1 text-xs text-coral">
            Applying replaces everything currently in the form.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              className="btn-primary text-xs"
              onClick={() => {
                setResume(pending.resume);
                setPending(null);
              }}
            >
              <Check size={13} /> Apply to form
            </button>
            <button className="btn-ghost text-xs" onClick={() => setPending(null)}>
              <X size={13} /> Discard
            </button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-coral">{error}</p>}
      {info && (
        <p className="mt-2 rounded-lg border border-mint/40 bg-mint/5 px-3 py-2 text-xs">
          {info}
        </p>
      )}
      <ConfirmModal
        open={confirmImprove}
        onClose={() => setConfirmImprove(false)}
        onConfirm={runImprove}
        title="Improve with AI"
        body="The AI will rewrite your resume for stronger verbs and clearer impact, without inventing facts. You will see every change as a red/green diff in the preview panel and nothing is saved until you apply it."
        confirmLabel="Show me the changes"
      />
    </div>
  );
}

/* ---------- Main editor ---------- */

export default function EditorPanel() {
  const { resume, patch } = useResumeStore();
  const p = resume.personal;

  return (
    <div>
      <AiToolbar />

      <Section title="Personal details" defaultOpen>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["name", "Full name", "Ada Lovelace"],
              ["email", "Email", "ada@example.com"],
              ["phone", "Phone", "+91 98xxxxxx"],
              ["location", "Location", "Gurugram, India"],
              ["linkedin", "LinkedIn", "linkedin.com/in/ada"],
              ["website", "Website / GitHub", "github.com/ada"],
            ] as const
          ).map(([key, label, ph]) => (
            <div key={key}>
              <label className="label" htmlFor={`p-${key}`}>
                {label}
              </label>
              <input
                id={`p-${key}`}
                className="field"
                placeholder={ph}
                value={(p as any)[key] ?? ""}
                onChange={(e) =>
                  patch((d) => {
                    (d.personal as any)[key] = e.target.value;
                  }, "personal")
                }
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Professional summary" defaultOpen>
        <textarea
          className="field min-h-[96px]"
          placeholder="2-3 sentences: who you are, your strongest skills, and the impact you deliver."
          value={resume.summary}
          onChange={(e) =>
            patch((d) => {
              d.summary = e.target.value;
            }, "summary")
          }
        />
      </Section>

      <Section title="Work experience" defaultOpen>
        <div className="space-y-5">
          {resume.experience.map((exp, i) => (
            <div key={exp.id} className="rounded-xl border border-hairline p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate2">Role {i + 1}</span>
                <div className="flex gap-1">
                  <button
                    className="btn-ghost !px-2 !py-1"
                    aria-label="Move up"
                    disabled={i === 0}
                    onClick={() =>
                      patch((d) => {
                        [d.experience[i - 1], d.experience[i]] = [
                          d.experience[i],
                          d.experience[i - 1],
                        ];
                      }, "experience")
                    }
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    className="btn-ghost !px-2 !py-1"
                    aria-label="Move down"
                    disabled={i === resume.experience.length - 1}
                    onClick={() =>
                      patch((d) => {
                        [d.experience[i + 1], d.experience[i]] = [
                          d.experience[i],
                          d.experience[i + 1],
                        ];
                      }, "experience")
                    }
                  >
                    <ArrowDown size={13} />
                  </button>
                  <button
                    className="btn-danger !px-2 !py-1"
                    aria-label="Delete role"
                    onClick={() =>
                      patch((d) => {
                        d.experience.splice(i, 1);
                      }, "experience")
                    }
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["title", "Job title"],
                    ["company", "Company"],
                    ["location", "Location"],
                    ["startDate", "Start (e.g. Jun 2023)"],
                    ["endDate", "End (or Present)"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className={key === "title" ? "sm:col-span-2" : ""}>
                    <label className="label">{label}</label>
                    <input
                      className="field"
                      value={(exp as any)[key] ?? ""}
                      onChange={(e) =>
                        patch((d) => {
                          (d.experience[i] as any)[key] = e.target.value;
                        }, "experience")
                      }
                    />
                  </div>
                ))}
              </div>
              <label className="label mt-3">Achievement bullets</label>
              <div className="space-y-2">
                {exp.bullets.map((b, j) => (
                  <div key={b.id} className="flex items-start gap-2">
                    <textarea
                      className="field min-h-[52px]"
                      placeholder="Start with an action verb; quantify if you can."
                      value={b.text}
                      onChange={(e) =>
                        patch((d) => {
                          d.experience[i].bullets[j].text = e.target.value;
                        }, "experience")
                      }
                    />
                    <button
                      className="btn-danger !px-2 !py-2"
                      aria-label="Delete bullet"
                      onClick={() =>
                        patch((d) => {
                          d.experience[i].bullets.splice(j, 1);
                        }, "experience")
                      }
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                className="btn-ghost mt-2 text-xs"
                onClick={() =>
                  patch((d) => {
                    d.experience[i].bullets.push(newBullet());
                  }, "experience")
                }
              >
                <Plus size={13} /> Add bullet
              </button>
            </div>
          ))}
        </div>
        <button
          className="btn-primary mt-4 text-xs"
          onClick={() =>
            patch((d) => {
              d.experience.push(newExperience());
            }, "experience")
          }
        >
          <Plus size={14} /> Add role
        </button>
      </Section>

      <Section title="Technical skills">
        <div className="space-y-4">
          {(
            [
              ["languages", "Languages"],
              ["frameworks", "Frameworks"],
              ["databases", "Databases"],
              ["tools", "Tools & platforms"],
            ] as const
          ).map(([key, label]) => (
            <TagInput
              key={key}
              label={label}
              values={resume.skills[key]}
              onChange={(v) =>
                patch((d) => {
                  d.skills[key] = v;
                }, "skills")
              }
            />
          ))}
        </div>
      </Section>

      <Section title="Education">
        <div className="space-y-4">
          {resume.education.map((ed, i) => (
            <div key={ed.id} className="rounded-xl border border-hairline p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["degree", "Degree (B.Tech, M.S. …)"],
                    ["field", "Field of study"],
                    ["institution", "Institution"],
                    ["year", "Year"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <label className="label">{label}</label>
                    <input
                      className="field"
                      value={(ed as any)[key] ?? ""}
                      onChange={(e) =>
                        patch((d) => {
                          (d.education[i] as any)[key] = e.target.value;
                        }, "education")
                      }
                    />
                  </div>
                ))}
              </div>
              <button
                className="btn-danger mt-2 text-xs"
                onClick={() =>
                  patch((d) => {
                    d.education.splice(i, 1);
                  }, "education")
                }
              >
                <Trash2 size={13} /> Remove
              </button>
            </div>
          ))}
        </div>
        <button
          className="btn-ghost mt-3 text-xs"
          onClick={() =>
            patch((d) => {
              d.education.push(newEducation());
            }, "education")
          }
        >
          <Plus size={13} /> Add education
        </button>
      </Section>

      <Section title="Projects">
        <div className="space-y-4">
          {resume.projects.map((pr, i) => (
            <div key={pr.id} className="rounded-xl border border-hairline p-4">
              <label className="label">Project name</label>
              <input
                className="field"
                value={pr.name}
                onChange={(e) =>
                  patch((d) => {
                    d.projects[i].name = e.target.value;
                  }, "projects")
                }
              />
              <div className="mt-3">
                <TagInput
                  label="Tech stack"
                  values={pr.techStack}
                  onChange={(v) =>
                    patch((d) => {
                      d.projects[i].techStack = v;
                    }, "projects")
                  }
                />
              </div>
              <label className="label mt-3">Description</label>
              <textarea
                className="field min-h-[64px]"
                value={pr.description}
                onChange={(e) =>
                  patch((d) => {
                    d.projects[i].description = e.target.value;
                  }, "projects")
                }
              />
              <label className="label mt-3">Impact (optional)</label>
              <input
                className="field"
                placeholder="e.g. 1.2k GitHub stars, used by 3 teams"
                value={pr.impact ?? ""}
                onChange={(e) =>
                  patch((d) => {
                    d.projects[i].impact = e.target.value;
                  }, "projects")
                }
              />
              <button
                className="btn-danger mt-2 text-xs"
                onClick={() =>
                  patch((d) => {
                    d.projects.splice(i, 1);
                  }, "projects")
                }
              >
                <Trash2 size={13} /> Remove
              </button>
            </div>
          ))}
        </div>
        <button
          className="btn-ghost mt-3 text-xs"
          onClick={() =>
            patch((d) => {
              d.projects.push(newProject());
            }, "projects")
          }
        >
          <Plus size={13} /> Add project
        </button>
      </Section>

      <Section title="Certifications & awards">
        <TagInput
          label="One per entry"
          values={resume.certifications}
          onChange={(v) =>
            patch((d) => {
              d.certifications = v;
            }, "certifications")
          }
        />
      </Section>
      <div className="h-16" />
    </div>
  );
}
