import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Resume, TemplateId, FontSize } from "@/lib/types";

const BASE: Record<FontSize, number> = { s: 9.5, m: 10.5, l: 11.5 };

function makeStyles(base: number, modern: boolean) {
  const serif = "Times-Roman";
  const serifBold = "Times-Bold";
  const sans = "Helvetica";
  const sansBold = "Helvetica-Bold";
  const body = modern ? sans : serif;
  const bold = modern ? sansBold : serifBold;

  return StyleSheet.create({
    page: {
      paddingVertical: 42,
      paddingHorizontal: 48,
      fontFamily: body,
      fontSize: base,
      lineHeight: 1.45,
      color: "#000000",
    },
    name: {
      fontFamily: bold,
      fontSize: base * 2,
      textAlign: modern ? "left" : "center",
    },
    contact: {
      fontSize: base * 0.92,
      color: "#444444",
      marginTop: 3,
      textAlign: modern ? "left" : "center",
    },
    heading: {
      fontFamily: bold,
      fontSize: base * 1.05,
      textTransform: "uppercase",
      letterSpacing: modern ? 1.2 : 0.6,
      color: modern ? "#2456F6" : "#000000",
      borderBottomWidth: 0.8,
      borderBottomColor: modern ? "#E4E8EF" : "#333333",
      paddingBottom: 2,
      marginTop: 12,
      marginBottom: 5,
    },
    rowBetween: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    bold: { fontFamily: bold },
    muted: { color: "#555555", fontSize: base * 0.9 },
    bulletRow: { flexDirection: "row", marginTop: 1.5 },
    bulletDot: { width: 10 },
    bulletText: { flex: 1 },
    block: { marginBottom: 6 },
  });
}

export function ResumePDF({
  resume: r,
  template,
  fontSize,
}: {
  resume: Resume;
  template: TemplateId;
  fontSize: FontSize;
}) {
  const modern = template === "modern";
  const s = makeStyles(BASE[fontSize], modern);

  const contact = [
    r.personal.email,
    r.personal.phone,
    r.personal.location,
    r.personal.linkedin,
    r.personal.website,
  ]
    .filter(Boolean)
    .join("  |  ");

  const skillRows = (
    [
      ["Languages", r.skills.languages],
      ["Frameworks", r.skills.frameworks],
      ["Databases", r.skills.databases],
      ["Tools", r.skills.tools],
    ] as const
  ).filter(([, v]) => v.length > 0);

  return (
    <Document
      title={`${r.personal.name || "Resume"} - Resume`}
      author={r.personal.name || "ResumeForge"}
    >
      <Page size="A4" style={s.page}>
        {/* Header */}
        <Text style={s.name}>{r.personal.name || "Your Name"}</Text>
        {contact ? <Text style={s.contact}>{contact}</Text> : null}

        {/* Summary */}
        {r.summary ? (
          <View>
            <Text style={s.heading}>Professional Summary</Text>
            <Text>{r.summary}</Text>
          </View>
        ) : null}

        {/* Experience */}
        {r.experience.length > 0 ? (
          <View>
            <Text style={s.heading}>Work Experience</Text>
            {r.experience.map((e) => (
              <View key={e.id} style={s.block} wrap={false}>
                <View style={s.rowBetween}>
                  <Text style={[s.bold, { flex: 1, paddingRight: 8 }]}>
                    {e.title}
                    {e.company ? ` - ${e.company}` : ""}
                  </Text>
                  <Text style={s.muted}>
                    {[e.startDate, e.endDate].filter(Boolean).join(" – ")}
                  </Text>
                </View>
                {e.location ? <Text style={s.muted}>{e.location}</Text> : null}
                {e.bullets
                  .filter((b) => b.text.trim())
                  .map((b) => (
                    <View key={b.id} style={s.bulletRow}>
                      <Text style={s.bulletDot}>•</Text>
                      <Text style={s.bulletText}>{b.text}</Text>
                    </View>
                  ))}
              </View>
            ))}
          </View>
        ) : null}

        {/* Skills */}
        {skillRows.length > 0 ? (
          <View>
            <Text style={s.heading}>Technical Skills</Text>
            {skillRows.map(([label, vals]) => (
              <Text key={label}>
                <Text style={s.bold}>{label}: </Text>
                {vals.join(", ")}
              </Text>
            ))}
          </View>
        ) : null}

        {/* Projects */}
        {r.projects.length > 0 ? (
          <View>
            <Text style={s.heading}>Projects</Text>
            {r.projects.map((p) => (
              <View key={p.id} style={s.block} wrap={false}>
                <Text>
                  <Text style={s.bold}>{p.name}</Text>
                  {p.techStack.length > 0 ? (
                    <Text style={s.muted}> | {p.techStack.join(", ")}</Text>
                  ) : null}
                </Text>
                <Text>
                  {p.description}
                  {p.impact ? ` - ${p.impact}` : ""}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Education */}
        {r.education.length > 0 ? (
          <View>
            <Text style={s.heading}>Education</Text>
            {r.education.map((ed) => (
              <Text key={ed.id}>
                <Text style={s.bold}>
                  {[ed.degree, ed.field].filter(Boolean).join(", ")}
                </Text>
                {ed.institution ? ` - ${ed.institution}` : ""}
                {ed.year ? ` (${ed.year})` : ""}
              </Text>
            ))}
          </View>
        ) : null}

        {/* Certifications */}
        {r.certifications.length > 0 ? (
          <View>
            <Text style={s.heading}>Certifications &amp; Awards</Text>
            {r.certifications.map((c) => (
              <View key={c} style={s.bulletRow}>
                <Text style={s.bulletDot}>•</Text>
                <Text style={s.bulletText}>{c}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

export default ResumePDF;
