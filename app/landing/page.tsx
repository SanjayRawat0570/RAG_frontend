"use client";

import Link from "next/link";

const T = {
  bg:          "#05080F",
  bgCard:      "rgba(13,30,56,0.55)",
  border:      "rgba(19,89,185,0.28)",
  borderHover: "rgba(159,228,251,0.32)",
  royal:       "#1359B9",
  sky:         "#9FE4FB",
  skyDim:      "rgba(159,228,251,0.10)",
  skyBorder:   "rgba(159,228,251,0.22)",
  textPri:     "#EBF4FF",
  textMuted:   "#4D82B8",
  green:       "#00C896",
};

const FEATURES = [
  {
    icon: "◫", tag: "F1–F8", color: "#1359B9",
    title: "Orchestration Engine",
    desc: "DAG execution with branching, streaming, parallel steps and full tracing via OpenTelemetry.",
  },
  {
    icon: "◎", tag: "F9–F13", color: "#9FE4FB",
    title: "Ingest → Index → Search",
    desc: "PDF, DOCX, PPTX, HTML ingestion. Smart chunking, MiniLM embeddings, BM25 + vector hybrid search.",
  },
  {
    icon: "◈", tag: "F14–F16", color: "#00C896",
    title: "Re-Rank & Generate",
    desc: "Cross-encoder quality scoring, citation-aware context assembly, Gemini free LLM or offline extractive.",
  },
  {
    icon: "◉", tag: "F17–F25", color: "#FFA94D",
    title: "Enterprise Suite",
    desc: "Multi-tenancy, RBAC, query cache, knowledge graph, audit log, cost budgets, A/B feedback loop.",
  },
];

const STATS = [
  { value: "25",   label: "Features built",   color: "#9FE4FB" },
  { value: "867",  label: "Tests passing",     color: "#1359B9" },
  { value: "0",    label: "Paid APIs",         color: "#00C896" },
  { value: "100%", label: "Offline-first",     color: "#FFA94D" },
];

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: T.bg, minHeight: "100vh", position: "relative", overflowX: "hidden" }}>

      {/* ── Animated background ─────────────────────────────────────────── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        {/* Grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(rgba(19,89,185,0.07) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(19,89,185,0.07) 1px, transparent 1px)`,
          backgroundSize: "56px 56px",
        }} />
        {/* Orbs */}
        <div className="animate-orb-1" style={{
          position: "absolute", top: "-8%", left: "-6%",
          width: "640px", height: "640px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(19,89,185,0.22) 0%, transparent 65%)",
        }} />
        <div className="animate-orb-2" style={{
          position: "absolute", bottom: "5%", right: "-8%",
          width: "560px", height: "560px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(159,228,251,0.12) 0%, transparent 65%)",
        }} />
        <div className="animate-orb-3" style={{
          position: "absolute", top: "45%", left: "55%",
          width: "380px", height: "380px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(19,89,185,0.10) 0%, transparent 65%)",
        }} />
        {/* Vignette */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, transparent 60%, #05080F 100%)",
        }} />
      </div>

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav className="glass" style={{
        position: "sticky", top: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 48px", height: "64px",
        borderBottom: "1px solid rgba(19,89,185,0.22)",
        background: "rgba(5,8,15,0.70)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "38px", height: "38px", borderRadius: "9px", flexShrink: 0,
            background: "linear-gradient(135deg, #1359B9, #9FE4FB)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "17px", fontWeight: 900, color: "white",
            boxShadow: "0 0 22px rgba(19,89,185,0.50)",
          }}>R</div>
          <span style={{ fontSize: "17px", fontWeight: 700, color: T.textPri, letterSpacing: "-0.3px" }}>Enterprise RAG</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Link href="/login" style={{
            padding: "8px 20px", borderRadius: "8px", fontSize: "14px", fontWeight: 600,
            color: T.sky, border: "1px solid rgba(159,228,251,0.22)",
            textDecoration: "none", background: "transparent",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(159,228,251,0.08)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
            Sign In
          </Link>
          <Link href="/signup" className="btn-glow" style={{
            padding: "8px 24px", borderRadius: "8px", fontSize: "14px", fontWeight: 700,
            color: "white", textDecoration: "none",
          }}>
            Get Started →
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section style={{ position: "relative", zIndex: 5, textAlign: "center", padding: "96px 48px 72px" }}>

        {/* Status badge */}
        <div className="animate-fade-up" style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "6px 18px", borderRadius: "999px", marginBottom: "28px",
          background: "rgba(0,200,150,0.08)", border: "1px solid rgba(0,200,150,0.22)",
        }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: T.green, display: "inline-block", flexShrink: 0 }} />
          <span style={{ fontSize: "13px", fontWeight: 600, color: T.green }}>F1 – F25 Complete · All systems operational</span>
        </div>

        {/* Main headline */}
        <h1 className="animate-fade-up delay-100" style={{
          fontSize: "clamp(44px, 7vw, 88px)", fontWeight: 900, lineHeight: 1.05,
          letterSpacing: "-2px", margin: "0 0 24px",
        }}>
          <span className="gradient-text">Your Private AI</span>
          <br />
          <span style={{ color: T.textPri }}>Knowledge Engine</span>
        </h1>

        <p className="animate-fade-up delay-200" style={{
          fontSize: "18px", color: T.textMuted, maxWidth: "560px", margin: "0 auto 44px",
          lineHeight: 1.75,
        }}>
          Index any document, ask natural-language questions, get cited answers — running entirely in your own infrastructure with zero cloud dependencies.
        </p>

        {/* CTA row */}
        <div className="animate-fade-up delay-300" style={{ display: "flex", gap: "14px", justifyContent: "center", marginBottom: "72px" }}>
          <Link href="/signup" className="btn-glow" style={{
            padding: "15px 40px", borderRadius: "12px", fontSize: "16px", fontWeight: 700,
            color: "white", textDecoration: "none",
          }}>
            Get Started Free →
          </Link>
          <Link href="/login" className="glass" style={{
            padding: "15px 40px", borderRadius: "12px", fontSize: "16px", fontWeight: 600,
            color: T.sky, textDecoration: "none",
            border: "1px solid rgba(159,228,251,0.22)",
            background: "rgba(159,228,251,0.05)",
            transition: "background 0.2s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(159,228,251,0.10)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(159,228,251,0.05)"; }}>
            Sign In
          </Link>
        </div>

        {/* Stats */}
        <div className="animate-fade-up delay-400" style={{ display: "flex", gap: "0", justifyContent: "center" }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{
              textAlign: "center", padding: "0 40px",
              borderRight: i < STATS.length - 1 ? "1px solid rgba(19,89,185,0.25)" : "none",
            }}>
              <div style={{ fontSize: "38px", fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: "13px", color: T.textMuted, marginTop: "6px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature grid ────────────────────────────────────────────────── */}
      <section style={{ position: "relative", zIndex: 5, padding: "0 48px 80px", maxWidth: "1160px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ fontSize: "36px", fontWeight: 800, color: T.textPri, marginBottom: "14px", letterSpacing: "-0.8px" }}>
            Everything you need,{" "}
            <span style={{ color: T.sky }}>nothing you don't</span>
          </h2>
          <p style={{ fontSize: "16px", color: T.textMuted }}>25 production-grade features — zero paid APIs, zero cloud lock-in</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
          {FEATURES.map(f => (
            <div key={f.title} className="glass card-hover" style={{
              padding: "32px 32px 32px 28px",
              borderRadius: "18px",
              border: `1px solid ${T.border}`,
              background: T.bgCard,
              position: "relative", overflow: "hidden",
            }}>
              {/* Left accent stripe */}
              <div style={{
                position: "absolute", left: 0, top: "20%", bottom: "20%", width: "3px",
                background: `linear-gradient(180deg, transparent, ${f.color}, transparent)`,
                borderRadius: "2px",
              }} />
              {/* Top corner glow */}
              <div style={{
                position: "absolute", top: 0, right: 0, width: "140px", height: "140px",
                background: `radial-gradient(circle, ${f.color}18 0%, transparent 70%)`,
                pointerEvents: "none",
              }} />

              <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                <div style={{
                  width: "50px", height: "50px", borderRadius: "12px", flexShrink: 0,
                  background: `${f.color}18`, border: `1px solid ${f.color}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "22px", color: f.color,
                }}>{f.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <span style={{ fontSize: "17px", fontWeight: 700, color: T.textPri }}>{f.title}</span>
                    <span style={{
                      padding: "2px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700,
                      background: `${f.color}18`, border: `1px solid ${f.color}40`, color: f.color,
                    }}>{f.tag}</span>
                  </div>
                  <p style={{ fontSize: "14px", color: T.textMuted, lineHeight: 1.75 }}>{f.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ──────────────────────────────────────────────────── */}
      <section className="glass" style={{
        position: "relative", zIndex: 5, textAlign: "center",
        padding: "72px 48px 80px",
        borderTop: "1px solid rgba(19,89,185,0.22)",
        background: "rgba(19,89,185,0.05)",
      }}>
        {/* Glow ring */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "400px", height: "400px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(19,89,185,0.15) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative" }}>
          <h2 style={{ fontSize: "44px", fontWeight: 900, color: T.textPri, marginBottom: "16px", letterSpacing: "-1px" }}>
            Ready to build?
          </h2>
          <p style={{ fontSize: "17px", color: T.textMuted, marginBottom: "36px" }}>
            Deploy in minutes. No credit card, no cloud vendor lock-in.
          </p>
          <Link href="/signup" className="btn-glow" style={{
            padding: "16px 52px", borderRadius: "14px", fontSize: "17px", fontWeight: 700,
            color: "white", textDecoration: "none", display: "inline-block",
          }}>
            Start for Free →
          </Link>
          <div style={{ marginTop: "28px", display: "flex", gap: "32px", justifyContent: "center" }}>
            {["No credit card", "Open source", "Self-hosted"].map(t => (
              <span key={t} style={{ fontSize: "13px", color: T.textMuted }}>
                <span style={{ color: T.green, marginRight: "6px" }}>✓</span>{t}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
