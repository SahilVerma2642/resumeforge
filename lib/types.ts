export interface Bullet {
  id: string;
  text: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate: string; // "Present" allowed
  bullets: Bullet[];
}

export interface Education {
  id: string;
  degree: string;
  field: string;
  institution: string;
  year: string;
}

export interface Project {
  id: string;
  name: string;
  techStack: string[];
  description: string;
  impact?: string;
}

export interface Resume {
  personal: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    website?: string;
  };
  summary: string;
  experience: Experience[];
  skills: {
    languages: string[];
    frameworks: string[];
    databases: string[];
    tools: string[];
  };
  education: Education[];
  projects: Project[];
  certifications: string[];
}

export type SuggestionType =
  | "rewrite_bullet"
  | "add_skill"
  | "add_keyword"
  | "rewrite_summary"
  | "new_bullet";

export interface Suggestion {
  id: string;
  type: SuggestionType;
  targetPath: string; // e.g. "experience[0].bullets[2]", "skills.languages", "summary"
  original: string | null;
  proposed: string;
  reason: string;
  status: "pending" | "accepted" | "rejected";
}

export interface ScoreReport {
  overallScore: number;
  grade: "A" | "B" | "C" | "D";
  subScores: {
    keywordMatch: number;
    impactStrength: number;
    formatting: number;
    completeness: number;
  };
  fixes: { priority: "critical" | "high" | "medium"; message: string }[];
  strengths: string[];
  verdict: string;
}

export type TemplateId = "classic" | "modern";
export type FontSize = "s" | "m" | "l";

export const uid = () => Math.random().toString(36).slice(2, 10);

export const emptyResume: Resume = {
  personal: { name: "", email: "", phone: "", location: "", linkedin: "", website: "" },
  summary: "",
  experience: [],
  skills: { languages: [], frameworks: [], databases: [], tools: [] },
  education: [],
  projects: [],
  certifications: [],
};

/** True when the resume has enough real content for AI actions to be meaningful. */
export function resumeHasContent(r: Resume): boolean {
  const hasBullets = r.experience.some((e) =>
    e.bullets.some((b) => b.text.trim().length > 10)
  );
  const hasSkills =
    r.skills.languages.length +
      r.skills.frameworks.length +
      r.skills.databases.length +
      r.skills.tools.length >
    0;
  return r.summary.trim().length > 30 || hasBullets || hasSkills;
}

/** Recursively replaces em dashes with plain hyphens in every string field. */
export function cleanDashes<T>(obj: T): T {
  if (typeof obj === "string") {
    return obj.replace(/\u2014/g, "-") as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((x) => cleanDashes(x)) as unknown as T;
  }
  if (obj && typeof obj === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(obj)) out[k] = cleanDashes(v);
    return out;
  }
  return obj;
}

export interface SkillGap {
  skill: string;
  demand: "very high" | "high" | "rising";
  why: string;
  adjacency: string;
  roadmap: { step: string; detail: string; durationWeeks: number }[];
  projectIdea: string;
}

export interface EnhanceReport {
  profile: string;
  gaps: SkillGap[];
  summaryAdvice: string;
}
