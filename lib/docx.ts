// #2 DOCX export - same ATS-safe structure as the PDF: single column,
// standard headings, plain bullets, real text.
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
} from "docx";
import type { Resume, TemplateId } from "./types";

const heading = (text: string, modern: boolean) =>
  new Paragraph({
    spacing: { before: 240, after: 80 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: modern ? "E4E8EF" : "333333" },
    },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: 22,
        color: modern ? "2456F6" : "000000",
      }),
    ],
  });

const line = (children: TextRun[], opts: object = {}) =>
  new Paragraph({ spacing: { after: 40 }, children, ...opts });

const bullet = (text: string) =>
  new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 40 },
    children: [new TextRun({ text, size: 21 })],
  });

export async function buildDocxBlob(r: Resume, template: TemplateId): Promise<Blob> {
  const modern = template === "modern";
  const contact = [r.personal.email, r.personal.phone, r.personal.location, r.personal.linkedin, r.personal.website]
    .filter(Boolean)
    .join("  |  ");
  const align = modern ? AlignmentType.LEFT : AlignmentType.CENTER;

  const children: Paragraph[] = [
    new Paragraph({
      alignment: align,
      children: [new TextRun({ text: r.personal.name || "Your Name", bold: true, size: 40 })],
    }),
    new Paragraph({
      alignment: align,
      spacing: { after: 120 },
      children: [new TextRun({ text: contact, size: 19, color: "444444" })],
    }),
  ];

  if (r.summary) {
    children.push(heading("Professional Summary", modern));
    children.push(line([new TextRun({ text: r.summary, size: 21 })]));
  }

  if (r.experience.length) {
    children.push(heading("Work Experience", modern));
    for (const e of r.experience) {
      children.push(
        line([
          new TextRun({ text: `${e.title}${e.company ? ` - ${e.company}` : ""}`, bold: true, size: 21 }),
          new TextRun({
            text: `   ${[e.startDate, e.endDate].filter(Boolean).join(" - ")}${e.location ? ` | ${e.location}` : ""}`,
            size: 19,
            color: "555555",
          }),
        ])
      );
      for (const b of e.bullets) if (b.text.trim()) children.push(bullet(b.text));
    }
  }

  const skillRows = r.skills
    .filter((g) => g.items.length > 0)
    .map((g) => [g.label, g.items] as const);
  if (skillRows.length) {
    children.push(heading("Technical Skills", modern));
    for (const [label, vals] of skillRows) {
      children.push(
        line([
          new TextRun({ text: `${label}: `, bold: true, size: 21 }),
          new TextRun({ text: vals.join(", "), size: 21 }),
        ])
      );
    }
  }

  if (r.projects.length) {
    children.push(heading("Projects", modern));
    for (const p of r.projects) {
      children.push(
        line([
          new TextRun({ text: p.name, bold: true, size: 21 }),
          ...(p.techStack.length
            ? [new TextRun({ text: ` | ${p.techStack.join(", ")}`, size: 19, color: "555555" })]
            : []),
        ])
      );
      children.push(
        line([new TextRun({ text: `${p.description}${p.impact ? ` - ${p.impact}` : ""}`, size: 21 })])
      );
    }
  }

  if (r.education.length) {
    children.push(heading("Education", modern));
    for (const ed of r.education) {
      children.push(
        line([
          new TextRun({
            text: `${[ed.degree, ed.field].filter(Boolean).join(", ")}${ed.institution ? ` - ${ed.institution}` : ""}${ed.year ? ` (${ed.year})` : ""}`,
            size: 21,
          }),
        ])
      );
    }
  }

  if (r.certifications.length) {
    children.push(heading("Certifications & Awards", modern));
    for (const c of r.certifications) children.push(bullet(c));
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: modern ? "Helvetica" : "Times New Roman" } } } },
    sections: [{ properties: { page: { margin: { top: 720, bottom: 720, left: 850, right: 850 } } }, children }],
  });
  return Packer.toBlob(doc);
}
