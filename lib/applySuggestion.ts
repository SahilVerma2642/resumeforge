import { Resume, Suggestion, uid } from "./types";

/**
 * Applies an accepted suggestion at its targetPath, immutably.
 * Supported paths:
 *   "summary" | "personal.name" | "experience[0].title" |
 *   "experience[0].bullets[2]"  (rewrites bullet text) |
 *   "experience[0].bullets"     (new_bullet: appends) |
 *   "skills.languages" etc.     (add_skill / add_keyword: appends)
 */
export function applySuggestion(resume: Resume, s: Suggestion): Resume {
  const next: Resume = JSON.parse(JSON.stringify(resume));
  const tokens = s.targetPath
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .filter(Boolean);

  try {
    let parent: any = next;
    for (let i = 0; i < tokens.length - 1; i++) {
      parent = parent[tokens[i]];
      if (parent == null) return resume;
    }
    const last = tokens[tokens.length - 1];
    const target = parent[last];

    if (Array.isArray(target)) {
      if (s.type === "new_bullet") {
        target.push({ id: uid(), text: s.proposed });
      } else if (!target.includes(s.proposed)) {
        target.push(s.proposed);
      }
    } else if (target != null && typeof target === "object" && "text" in target) {
      target.text = s.proposed;
    } else {
      parent[last] = s.proposed;
    }
    return next;
  } catch {
    return resume;
  }
}

/** Maps a targetPath to the preview section id, so the preview can pulse it. */
export function sectionOfPath(path: string): string {
  if (path.startsWith("personal")) return "personal";
  if (path.startsWith("experience")) return "experience";
  if (path.startsWith("skills")) return "skills";
  if (path.startsWith("education")) return "education";
  if (path.startsWith("projects")) return "projects";
  if (path.startsWith("certifications")) return "certifications";
  return "summary";
}
