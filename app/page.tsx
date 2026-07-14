"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  FileText,
  Wand2,
  Gauge,
  Download,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const STEPS = [
  {
    icon: FileText,
    title: "Build",
    body: "A guided editor with a live, pixel-accurate preview. Every keystroke lands on the page instantly.",
  },
  {
    icon: Wand2,
    title: "Tailor",
    body: "Paste any job description. Accept or reject each AI suggestion - nothing changes without your say-so.",
  },
  {
    icon: Gauge,
    title: "Score",
    body: "An honest ATS report: keyword match, impact strength, formatting, completeness - with specific fixes.",
  },
  {
    icon: Download,
    title: "Download",
    body: "Real text-layer PDF. Single column, standard headings - built to parse cleanly in every ATS.",
  },
];

const SKELETON_ROWS = [
  "w-2/5 h-4",
  "w-3/5 h-2",
  "w-full h-2",
  "w-11/12 h-2",
  "w-1/3 h-3 mt-3",
  "w-full h-2",
  "w-4/5 h-2",
  "w-1/3 h-3 mt-3",
  "w-full h-2",
  "w-2/3 h-2",
];

export default function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      // Hero: headline lines stagger in
      gsap.from(".hero-line", {
        yPercent: 110,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
      });
      gsap.from(".hero-sub", { opacity: 0, y: 16, delay: 0.5, duration: 0.7 });
      gsap.from(".hero-cta", { opacity: 0, y: 12, delay: 0.7, duration: 0.6 });

      // Mock resume assembles itself line by line
      gsap.from(".skel-row", {
        opacity: 0,
        x: -14,
        duration: 0.45,
        stagger: 0.09,
        delay: 0.5,
        ease: "power2.out",
      });
      gsap.from(".hero-sheet", {
        opacity: 0,
        y: 30,
        rotate: 1.5,
        duration: 0.9,
        delay: 0.3,
        ease: "power3.out",
      });

      // Feature strip: each card reveals on scroll
      gsap.utils.toArray<HTMLElement>(".step-card").forEach((card, i) => {
        gsap.from(card, {
          opacity: 0,
          y: 40,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: { trigger: card, start: "top 85%" },
          delay: (i % 4) * 0.08,
        });
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={heroRef} className="min-h-screen">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="font-display text-lg font-bold tracking-tight">
          Resume<span className="text-signal">Forge</span>
        </span>
        <Link href="/builder" className="btn-ghost text-sm">
          Open the builder
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-24 pt-10 md:grid-cols-2 md:pt-20">
        <div>
          <p className="hero-sub mb-4 inline-flex items-center gap-2 rounded-full border border-hairline bg-white px-3 py-1 text-xs font-medium text-slate2">
            <Sparkles size={13} className="text-signal" />
            AI tailoring you approve, line by line
          </p>
          <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            <span className="block overflow-hidden">
              <span className="hero-line block">One resume,</span>
            </span>
            <span className="block overflow-hidden">
              <span className="hero-line block">
                tailored to <span className="text-signal">every job.</span>
              </span>
            </span>
          </h1>
          <p className="hero-sub mt-5 max-w-md text-base leading-relaxed text-slate2">
            Build an ATS-friendly, recruiter-ready resume with a live side-by-side
            preview. Paste a job description, review each suggestion, and download a
            clean text-layer PDF.
          </p>
          <div className="hero-cta mt-8 flex flex-wrap items-center gap-4">
            <Link href="/builder" className="btn-primary px-6 py-3 text-base">
              Build my resume <ArrowRight size={18} />
            </Link>
            <span className="text-xs text-slate2">
              Free · No account · Stored in your browser
            </span>
          </div>
        </div>

        {/* Self-assembling mock sheet */}
        <div className="hero-sheet sheet mx-auto w-full max-w-sm p-8" aria-hidden>
          <div className="space-y-3">
            {SKELETON_ROWS.map((cls, i) => (
              <div
                key={i}
                className={`skel-row rounded-full ${cls} ${
                  i === 0 ? "bg-ink/80" : i % 5 === 4 ? "bg-signal/70" : "bg-hairline"
                }`}
              />
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between rounded-lg bg-paper px-3 py-2">
            <span className="text-xs font-semibold text-slate2">ATS score</span>
            <span className="font-display text-sm font-bold text-mint">92 · A</span>
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section ref={stripRef} className="border-t border-hairline bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Build → Tailor → Score → Download
          </h2>
          <p className="mt-2 max-w-lg text-sm text-slate2">
            A closed loop from blank page to application-ready PDF. The order matters -
            each step feeds the next.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                className="step-card rounded-xl border border-hairline bg-paper p-6"
              >
                <div className="flex items-center justify-between">
                  <s.icon className="text-signal" size={22} />
                  <span className="font-display text-xs font-bold text-slate2/60">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate2">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight">
          Your next application deserves a tailored resume.
        </h2>
        <Link href="/builder" className="btn-primary mt-8 inline-flex px-8 py-3 text-base">
          Start building - it&apos;s free <ArrowRight size={18} />
        </Link>
      </section>

      <footer className="border-t border-hairline py-8 text-center text-xs text-slate2">
        ResumeForge · Your resume is stored in your browser - nothing is uploaded until
        you run an AI action.
      </footer>
    </div>
  );
}
