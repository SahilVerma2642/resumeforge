"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Resume,
  Suggestion,
  ScoreReport,
  EnhanceReport,
  TemplateId,
  FontSize,
  emptyResume,
  uid,
  cleanDashes,
} from "./types";
import { applySuggestion, sectionOfPath } from "./applySuggestion";

interface ResumeState {
  resume: Resume;
  template: TemplateId;
  fontSize: FontSize;
  suggestions: Suggestion[];
  matchScore: number | null;
  score: ScoreReport | null;
  jd: string;
  enhance: EnhanceReport | null;
  /** section id + nonce; the preview pulses this section when it changes */
  touched: { section: string; nonce: number } | null;
  /** AI rewrite pending review: preview shows a GitHub-style diff of before vs after */
  review: { before: Resume; after: Resume } | null;
  /** snapshot taken when an AI rewrite is applied, so the user can revert */
  snapshot: Resume | null;

  setResume: (r: Resume) => void;
  patch: (fn: (draft: Resume) => void, section?: string) => void;
  setTemplate: (t: TemplateId) => void;
  setFontSize: (f: FontSize) => void;

  setSuggestions: (s: Suggestion[], matchScore: number | null) => void;
  acceptSuggestion: (id: string) => void;
  rejectSuggestion: (id: string) => void;
  acceptAll: () => void;

  setScore: (s: ScoreReport | null) => void;
  setJd: (jd: string) => void;
  setEnhance: (e: EnhanceReport | null) => void;
  startReview: (after: Resume) => void;
  applyReview: () => void;
  discardReview: () => void;
  revertSnapshot: () => void;
  reset: () => void;
}

export const useResumeStore = create<ResumeState>()(
  persist(
    (set, get) => ({
      resume: emptyResume,
      template: "modern",
      fontSize: "m",
      suggestions: [],
      matchScore: null,
      score: null,
      jd: "",
      enhance: null,
      touched: null,
      review: null,
      snapshot: null,

      setResume: (r) => set({ resume: cleanDashes(r) }),

      patch: (fn, section) =>
        set((state) => {
          const draft: Resume = JSON.parse(JSON.stringify(state.resume));
          fn(draft);
          return {
            resume: cleanDashes(draft),
            touched: section ? { section, nonce: Date.now() } : state.touched,
          };
        }),

      setTemplate: (template) => set({ template }),
      setFontSize: (fontSize) => set({ fontSize }),

      setSuggestions: (suggestions, matchScore) => set({ suggestions, matchScore }),

      acceptSuggestion: (id) =>
        set((state) => {
          const s = state.suggestions.find((x) => x.id === id);
          if (!s) return state;
          return {
            resume: cleanDashes(applySuggestion(state.resume, s)),
            suggestions: state.suggestions.map((x) =>
              x.id === id ? { ...x, status: "accepted" as const } : x
            ),
            touched: { section: sectionOfPath(s.targetPath), nonce: Date.now() },
          };
        }),

      rejectSuggestion: (id) =>
        set((state) => ({
          suggestions: state.suggestions.map((x) =>
            x.id === id ? { ...x, status: "rejected" as const } : x
          ),
        })),

      acceptAll: () => {
        const pending = get().suggestions.filter((s) => s.status === "pending");
        pending.forEach((s) => get().acceptSuggestion(s.id));
      },

      setScore: (score) => set({ score }),

      setJd: (jd) => set({ jd }),
      setEnhance: (enhance) => set({ enhance }),

      startReview: (after) =>
        set((state) => ({ review: { before: state.resume, after: cleanDashes(after) } })),

      applyReview: () =>
        set((state) =>
          state.review
            ? {
                resume: state.review.after,
                snapshot: state.review.before,
                review: null,
                touched: { section: "summary", nonce: Date.now() },
              }
            : state
        ),

      discardReview: () => set({ review: null }),

      revertSnapshot: () =>
        set((state) =>
          state.snapshot ? { resume: state.snapshot, snapshot: null } : state
        ),

      reset: () =>
        set({
          resume: emptyResume,
          suggestions: [],
          matchScore: null,
          score: null,
          jd: "",
          enhance: null,
          touched: null,
          review: null,
          snapshot: null,
        }),
    }),
    {
      name: "resumeforge-v1",
      partialize: (s) => ({
        resume: s.resume,
        template: s.template,
        fontSize: s.fontSize,
      }),
    }
  )
);

/** Convenience helpers used by editor forms */
export const newBullet = () => ({ id: uid(), text: "" });
export const newExperience = () => ({
  id: uid(),
  title: "",
  company: "",
  location: "",
  startDate: "",
  endDate: "",
  bullets: [newBullet()],
});
export const newEducation = () => ({
  id: uid(),
  degree: "",
  field: "",
  institution: "",
  year: "",
});
export const newProject = () => ({
  id: uid(),
  name: "",
  techStack: [],
  description: "",
  impact: "",
});
