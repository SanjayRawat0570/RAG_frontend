"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import Icon, { BrandMark } from "@/components/Icon";
import { Typewriter } from "@/components/Effects";

// Light beams falling down the panel: [left %, duration s, delay s].
const BEAMS: [number, number, number][] = [
  [8, 7, 0], [22, 9, 2.5], [36, 6, 1.2], [50, 8, 4], [64, 7.5, 0.6], [78, 10, 3.2], [92, 6.5, 1.8],
];

/** Split-screen layout shared by the sign-in and sign-up pages. */
export default function AuthShell({
  panelTitle, panelBody, panelItems, children,
}: {
  panelTitle: string;
  panelBody: string;
  panelItems: { title: string; desc: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen gap-3 p-3">

      {/* ── Brand panel ───────────────────────────────────────────────── */}
      <aside className="brand-panel relative hidden w-[46%] max-w-[660px] flex-col overflow-hidden rounded-3xl p-12 lg:flex"
        style={{ boxShadow: "var(--shadow-lg)" }}>
        <div className="spotlight pointer-events-none" />
        <div className="pointer-events-none absolute inset-0">
          {BEAMS.map(([left, dur, delay]) => (
            <span key={left} className="beam" style={{ left: `${left}%`, "--dur": `${dur}s`, "--delay": `${delay}s` } as React.CSSProperties} />
          ))}
        </div>
        <div className="float pointer-events-none absolute -bottom-32 left-1/2 h-80 w-[120%] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: "radial-gradient(ellipse, rgba(246,247,237,0.16), transparent 65%)" }} />

        <Link href="/landing" className="relative flex items-center gap-2.5">
          <BrandMark size={34} />
          <span className="text-[15px] font-semibold text-white">Enterprise RAG</span>
          <span className="ml-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "var(--panel-muted)" }}>
            <span className="dot dot-live" style={{ color: "#5CC48A" }} />Live
          </span>
        </Link>

        <div className="relative mt-auto max-w-lg pt-10">
          <h1 className="shine-text rise text-[44px] font-semibold leading-[1.05] tracking-tight">{panelTitle}</h1>
          <p className="rise mt-4 text-base leading-relaxed" style={{ color: "var(--panel-muted)", "--d": "80ms" } as React.CSSProperties}>{panelBody}</p>
        </div>

        <div className="rise relative mt-8" style={{ "--d": "160ms" } as React.CSSProperties}>
          <LiveQuery />
        </div>

        <div className="relative mb-auto mt-6 space-y-3">
          <Marquee items={panelItems} speed={38} />
          <Marquee items={[...panelItems].reverse()} speed={46} reverse />
        </div>

        <div className="relative mt-10 flex items-center justify-between text-xs" style={{ color: "var(--panel-dim)" }}>
          <span>© {new Date().getFullYear()} Enterprise RAG</span>
          <span className="inline-flex items-center gap-1.5"><Icon name="lock" size={12} />Self-hosted · Encrypted</span>
        </div>
      </aside>

      {/* ── Form side ─────────────────────────────────────────────────── */}
      <main className="relative flex flex-1 flex-col overflow-hidden">
        <div className="auth-backdrop pointer-events-none absolute inset-0" />
        <div className="relative flex h-16 items-center justify-between px-6">
          <Link href="/landing" className="group inline-flex items-center gap-1.5 text-sm transition-colors hover:text-[var(--text)]" style={{ color: "var(--text-3)" }}>
            <Icon name="arrowLeft" size={14} className="transition-transform group-hover:-translate-x-1" />Back to home
          </Link>
          <ThemeToggle />
        </div>
        <div className="relative flex flex-1 items-center justify-center px-3 pb-16 sm:px-6">
          <div className="beam-border rise w-full max-w-[440px] rounded-[18px]">
            <div className="card p-8 sm:p-10" style={{ borderRadius: 18, boxShadow: "var(--shadow-lg)" }}>
              <div className="mb-8 flex items-center gap-2.5 lg:hidden">
                <BrandMark size={32} />
                <span className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>Enterprise RAG</span>
              </div>
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Illustrative questions for the panel demo — not live data.
const DEMO = [
  { q: "How is customer data encrypted?", a: "All data is encrypted at rest and in transit using AES-256 [1].", src: "Company Handbook › Security Policy", ms: 142 },
  { q: "When are invoices due?",          a: "Invoices are issued monthly and payment is due within 30 days [1].", src: "Company Handbook › Billing", ms: 98 },
  { q: "What is the P1 response time?",   a: "P1 incidents receive a first response in under one hour [1].", src: "Company Handbook › Support", ms: 117 },
];
const STAGES = ["Hybrid search", "Re-rank", "Generate"];

/** Cycles through example questions: retrieval stages light up, then the answer types out. */
function LiveQuery() {
  const [idx,   setIdx]   = useState(0);
  const [stage, setStage] = useState(0); // 0-2 running stages, 3 = answered

  useEffect(() => {
    setStage(0);
    const timers = [700, 1400, 2100].map((t, i) => setTimeout(() => setStage(i + 1), t));
    timers.push(setTimeout(() => setIdx(i => (i + 1) % DEMO.length), 7000));
    return () => timers.forEach(clearTimeout);
  }, [idx]);

  const demo = DEMO[idx];
  return (
    <div className="rounded-2xl p-4 backdrop-blur-md"
      style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.10)", boxShadow: "0 20px 50px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
      <div key={idx} className="rise flex items-center gap-2.5 text-sm text-white">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.10)" }}>
          <Icon name="search" size={12} />
        </span>
        {demo.q}
      </div>

      <div className="mt-3 flex gap-1.5">
        {STAGES.map((s, i) => (
          <span key={s} className="relative flex-1 overflow-hidden rounded-full px-2.5 py-1 text-center text-[10.5px] transition-colors duration-300"
            style={{
              background: stage > i ? "rgba(246,247,237,0.14)" : "rgba(255,255,255,0.04)",
              color: stage > i ? "#F6F7ED" : "var(--panel-dim)",
              border: `1px solid ${stage === i ? "rgba(246,247,237,0.35)" : "rgba(255,255,255,0.06)"}`,
            }}>
            {stage === i && <span className="scan" />}
            {stage > i && <Icon name="check" size={9} strokeWidth={3} className="mr-1 inline" />}{s}
          </span>
        ))}
      </div>

      <div className="mt-3 min-h-[44px] text-[13px] leading-relaxed" style={{ color: "var(--panel-text)" }}>
        {stage >= 3
          ? <Typewriter key={idx} text={demo.a} animate />
          : <span className="inline-flex gap-1 pt-2">{[0, 1, 2].map(i => <span key={i} className="typing-dot" style={{ animationDelay: `${i * 0.15}s` }} />)}</span>}
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] transition-opacity duration-500"
        style={{ color: "var(--panel-dim)", opacity: stage >= 3 ? 1 : 0 }}>
        <span className="inline-flex items-center gap-1.5"><Icon name="file" size={11} />[1] {demo.src}</span>
        <span className="inline-flex items-center gap-1.5"><span className="dot" style={{ color: "#5CC48A" }} />Grounded · {demo.ms} ms</span>
      </div>
    </div>
  );
}

function Marquee({ items, speed, reverse }: { items: { title: string; desc: string }[]; speed: number; reverse?: boolean }) {
  // Repeated so the -50% translate loops seamlessly with no gap.
  const loop = [...items, ...items, ...items, ...items];
  return (
    <div className="marquee">
      <div className={`marquee-track${reverse ? " reverse" : ""}`} style={{ "--speed": `${speed}s` } as React.CSSProperties}>
        {loop.map((it, i) => (
          <span key={i} className="inline-flex shrink-0 items-center gap-2.5 rounded-full py-2 pl-2 pr-4 text-[13px]"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "var(--panel-muted)" }}
            aria-hidden={i >= items.length}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: "#F6F7ED", color: "#1F1F1F" }}>
              <Icon name="check" size={11} strokeWidth={3} />
            </span>
            <span className="font-medium text-white">{it.title}</span>
            <span className="hidden xl:inline">{it.desc}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function AuthError({ msg }: { msg: string }) {
  return <div className="alert alert-danger" role="alert"><Icon name="alert" size={15} /><span>{msg}</span></div>;
}

export function AuthSpinner() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <span className="float"><BrandMark size={48} /></span>
      <span className="spinner" />
    </div>
  );
}
