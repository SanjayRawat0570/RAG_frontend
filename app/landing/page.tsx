"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import Icon, { BrandMark, IconName } from "@/components/Icon";
import { CountUp } from "@/components/Effects";

const CAPABILITIES: { icon: IconName; title: string; desc: string }[] = [
  { icon: "upload",    title: "Universal ingestion",       desc: "Parse PDF, DOCX, PPTX, XLSX, HTML and Markdown with structure-aware chunking." },
  { icon: "merge",     title: "Hybrid retrieval",          desc: "BM25 keyword and dense vector search fused with Reciprocal Rank Fusion, then re-ranked." },
  { icon: "book",      title: "Cited answers",             desc: "Every answer is grounded in your documents, with source references for verification." },
  { icon: "users",     title: "Multi-tenant isolation",    desc: "Namespace-level separation with role-based access control for each business unit." },
  { icon: "shield",    title: "Security & compliance",     desc: "AES-256 encryption, GDPR data-subject rights, API key management and a full audit trail." },
  { icon: "activity",  title: "Observability",             desc: "Prometheus metrics, OpenTelemetry tracing and cost budgets built in from day one." },
];

const STATS = [
  { value: "25",   label: "Platform modules" },
  { value: "867",  label: "Automated tests" },
  { value: "0",    label: "Paid API dependencies" },
  { value: "100%", label: "Self-hosted" },
];

const STEPS = [
  { icon: "upload"  as IconName, title: "Connect your content",  desc: "Upload documents or push them through the ingestion API. Content is parsed, chunked and embedded automatically." },
  { icon: "message" as IconName, title: "Ask in plain language", desc: "Users query the knowledge base conversationally. Hybrid search and re-ranking surface the most relevant passages." },
  { icon: "checkCircle" as IconName, title: "Act on cited answers",  desc: "Responses reference their sources, so teams can verify every claim before they rely on it." },
];

const d = (ms: number) => ({ "--d": `${ms}ms` } as React.CSSProperties);

export default function LandingPage() {
  return (
    <div className="min-h-screen">

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 -mb-20">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6"
          style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", maskImage: "linear-gradient(#000 80%, transparent)", WebkitMaskImage: "linear-gradient(#000 80%, transparent)" }}>
          <Link href="/landing" className="flex items-center gap-2.5">
            <BrandMark size={30} />
            <span className="text-[15px] font-semibold uppercase tracking-wide" style={{ color: "var(--text)" }}>Enterprise RAG</span>
          </Link>
          <nav className="hidden items-center gap-1.5 md:flex">
            {[["#platform", "Platform"], ["#how", "How it works"], ["#security", "Security"]].map(([href, label]) => (
              <a key={href} href={href} className="pill pill-outline">{label}</a>
            ))}
            <Link href="/architecture" className="pill pill-outline">Architecture</Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className="btn btn-secondary">Sign in</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px]"
          style={{ background: "radial-gradient(ellipse 60% 70% at 50% 0%, var(--aurora-2), transparent 70%)" }} />
        <div className="relative mx-auto max-w-6xl px-4 pt-14 text-center sm:px-6 lg:pt-20">
          <h1 className="rise mx-auto max-w-3xl text-5xl font-medium leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl" style={{ color: "var(--text)" }}>
            Answers you can<br />actually trust.
          </h1>
          <p className="rise mx-auto mt-6 max-w-lg text-base leading-relaxed sm:text-lg" style={{ color: "var(--text-3)", ...d(100) }}>
            Index your documents, ask in plain language, and get cited answers —
            all on your own infrastructure, in one console.
          </p>
          <div className="rise mt-9 flex flex-wrap items-center justify-center gap-5" style={d(200)}>
            <Link href="/signup" className="btn btn-primary btn-lg group">
              <Icon name="arrowRight" size={15} className="-rotate-45 transition-transform group-hover:rotate-0" />Get started free
            </Link>
            <Link href="/login" className="text-[15px] font-medium transition-colors hover:text-[var(--text)]" style={{ color: "var(--text-3)" }}>
              Sign in to console
            </Link>
          </div>

          <div className="rise relative mx-auto mt-16 max-w-5xl" style={d(320)}>
            <div className="pointer-events-none absolute -inset-x-10 -inset-y-6 rounded-[48px] blur-3xl" style={{ background: "var(--aurora-1)" }} />
            <div className="relative rounded-[28px] p-2" style={{ background: "rgba(var(--primary-rgb),0.18)", boxShadow: "var(--shadow-lg)" }}>
              <ProductPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        <div className="glass grid grid-cols-2 overflow-hidden rounded-2xl lg:grid-cols-4" style={{ boxShadow: "var(--shadow-sm)" }}>
          {STATS.map((s, i) => (
            <div key={s.label} className="px-6 py-8 text-center"
              style={{ borderLeft: i % 2 !== 0 || i >= 2 ? "1px solid var(--border)" : undefined }}>
              <div className="grad-text text-4xl font-bold tracking-tight tabular-nums"><CountUp value={s.value} duration={1400} /></div>
              <div className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Capabilities ────────────────────────────────────────────────── */}
      <section id="platform" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-6">
        <div className="max-w-2xl">
          <div className="eyebrow" style={{ color: "var(--primary)" }}>Platform</div>
          <h2 className="mt-2 text-4xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
            Everything required for <span className="grad-text">production retrieval</span>
          </h2>
          <p className="mt-3 text-base" style={{ color: "var(--text-3)" }}>
            A complete pipeline from ingestion to generation, with the governance controls enterprises expect.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map(c => (
            <div key={c.title} className="card lift p-7">
              <span className="icon-chip h-11 w-11 rounded-xl"><Icon name={c.icon} size={20} /></span>
              <h3 className="mt-5 text-base font-semibold" style={{ color: "var(--text)" }}>{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-3)" }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section id="how" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <div className="max-w-2xl">
            <div className="eyebrow" style={{ color: "var(--primary)" }}>How it works</div>
            <h2 className="mt-2 text-4xl font-bold tracking-tight" style={{ color: "var(--text)" }}>From documents to decisions in three steps</h2>
          </div>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="card lift relative p-7">
                <div className="flex items-center justify-between">
                  <span className="grad-bg flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ boxShadow: "var(--glow)" }}>
                    <Icon name={s.icon} size={20} />
                  </span>
                  <span className="font-mono text-4xl font-bold" style={{ color: "var(--border-strong)" }}>0{i + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold" style={{ color: "var(--text)" }}>{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-3)" }}>{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Security ────────────────────────────────────────────────────── */}
      <section id="security" className="mx-auto grid max-w-6xl scroll-mt-24 items-center gap-12 px-4 pb-24 sm:px-6 lg:grid-cols-2">
        <div>
          <div className="eyebrow" style={{ color: "var(--primary)" }}>Security</div>
          <h2 className="mt-2 text-4xl font-bold tracking-tight" style={{ color: "var(--text)" }}>Your data <span className="grad-text">never leaves</span> your environment</h2>
          <p className="mt-3 text-base leading-relaxed" style={{ color: "var(--text-3)" }}>
            Every component runs inside your own infrastructure. Embeddings, vector storage and generation all work
            offline by default, with optional providers you control.
          </p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            ["lock",     "Encryption at rest and in transit"],
            ["key",      "Scoped API keys with revocation"],
            ["eye",      "Immutable audit logging"],
            ["users",    "Tenant isolation and RBAC"],
            ["shield",   "GDPR export and erasure"],
            ["dollar",   "Budget guards on model spend"],
          ].map(([icon, label]) => (
            <li key={label} className="card lift flex items-center gap-3 px-4 py-3.5 text-sm" style={{ color: "var(--text-2)" }}>
              <span className="icon-chip h-8 w-8"><Icon name={icon as IconName} size={15} /></span>{label}
            </li>
          ))}
        </ul>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="brand-panel relative overflow-hidden rounded-3xl" style={{ boxShadow: "var(--shadow-lg)" }}>
          <div className="brand-grid pointer-events-none absolute inset-0" />
          <div className="relative flex flex-col items-start justify-between gap-6 px-8 py-14 md:flex-row md:items-center md:px-12">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to put your knowledge to work?</h2>
              <p className="mt-2 text-base" style={{ color: "var(--panel-muted)" }}>Create an account and index your first document in minutes.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/signup" className="btn btn-lg" style={{ background: "#fff", color: "#15120F" }}>Create account</Link>
              <Link href="/login" className="btn btn-lg" style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.06)" }}>Sign in</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid var(--border)" }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm sm:flex-row sm:px-6"
          style={{ color: "var(--text-3)" }}>
          <div className="flex items-center gap-2.5">
            <BrandMark size={22} />
            <span>© {new Date().getFullYear()} Enterprise RAG. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <Link href="/architecture" className="hover:text-[var(--text)]">Architecture</Link>
            <a href="#security" className="hover:text-[var(--text)]">Security</a>
            <Link href="/login" className="hover:text-[var(--text)]">Console</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Illustrative figures for the hero mockup only — not live data.
const PREVIEW_BARS = [9, 13, 11, 16, 14, 18, 17, 29, 22, 21, 19, 24];
const PREVIEW_TREND = [4, 6, 7, 9, 11, 12, 14, 17, 19, 21, 24, 28];
const PREVIEW_PEAK = 7;
const PREVIEW_MAX = 32;

/** Static mock of the console's analytics overview — illustrates the product. */
function ProductPreview() {
  return (
    <div className="overflow-hidden rounded-[22px] text-left" style={{ background: "var(--surface-solid)", border: "1px solid var(--border)" }}>
      {/* App bar */}
      <div className="flex items-center gap-4 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <BrandMark size={24} />
          <span className="hidden text-xs font-semibold uppercase tracking-wide sm:inline" style={{ color: "var(--text)" }}>Enterprise RAG</span>
        </div>
        <div className="pill-nav hidden rounded-full md:flex" style={{ background: "var(--surface-2)" }}>
          {["Overview", "Ask", "Knowledge", "Workspaces", "Usage"].map((t, i) => (
            <span key={t} className={`pill !h-7 !px-3 !text-xs${i === 0 ? " active" : ""}`}>{t}</span>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden h-8 w-36 items-center gap-2 rounded-full px-3 text-xs sm:flex" style={{ background: "var(--surface-2)", color: "var(--text-4)", border: "1px solid var(--border)" }}>
            <Icon name="search" size={12} />Search…
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}><Icon name="activity" size={14} /></span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-3)", border: "1px solid var(--border)" }}><Icon name="settings" size={14} /></span>
        </div>
      </div>

      <div className="px-5 pb-6 pt-4 sm:px-7">
        {/* Title row */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="text-2xl font-medium tracking-tight sm:text-3xl" style={{ color: "var(--text)" }}>Knowledge Overview</h3>
            <p className="mt-1 text-xs" style={{ color: "var(--text-3)" }}>Real-time insight into retrieval quality and spend.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 items-center gap-2 rounded-xl px-3 text-xs" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
              <Icon name="clock" size={12} />Last 30 days
            </span>
            <span className="btn btn-primary btn-sm !h-9 !rounded-xl"><Icon name="upload" size={12} className="rotate-180" />Export report</span>
          </div>
        </div>

        {/* Metrics */}
        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_1fr_2fr]">
          <PreviewMetric label="Grounded answers" value="+12.5%" tone="hatch-success" currentValue="94.2%" />
          <PreviewMetric label="Avg cost / query" value="-2.1%" tone="hatch-danger" currentValue="$0.0042" />

          <div className="rounded-2xl p-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-medium" style={{ color: "var(--text)" }}>Total queries</div>
                <div className="text-[10px]" style={{ color: "var(--text-4)" }}>During this year</div>
              </div>
              <Icon name="barChart" size={13} style={{ color: "var(--text-3)" }} />
            </div>
            <div className="relative mt-3 flex h-36 items-end gap-1.5 pl-6">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex flex-col justify-between text-[9px]" style={{ color: "var(--text-4)" }}>
                <span>32k</span><span>24k</span><span>16k</span><span>8k</span><span>0</span>
              </div>
              {PREVIEW_BARS.map((v, i) => (
                <div key={i} className={`relative flex-1 rounded-t-[5px] ${i === PREVIEW_PEAK ? "" : "hatch"}`}
                  style={{ height: `${(v / PREVIEW_MAX) * 100}%`, ...(i === PREVIEW_PEAK ? { background: "var(--grad)", boxShadow: "var(--glow)" } : {}) }}>
                  {i === PREVIEW_PEAK && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-1.5 py-1 text-[10px] font-semibold"
                      style={{ background: "var(--ink)", color: "var(--on-ink)" }}>
                      29k <span className="rounded px-1 text-[8px]" style={{ background: "var(--success)", color: "#fff" }}>+8%</span>
                    </span>
                  )}
                </div>
              ))}
              <svg className="pointer-events-none absolute inset-y-0 left-6 right-0 h-full w-[calc(100%-1.5rem)]" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <polyline fill="none" stroke="var(--primary)" strokeWidth="1.4" strokeDasharray="1.5 2.5" vectorEffect="non-scaling-stroke"
                  points={PREVIEW_TREND.map((v, i) => `${(i + 0.5) * (100 / PREVIEW_TREND.length)},${100 - (v / PREVIEW_MAX) * 100}`).join(" ")} />
              </svg>
            </div>
            <div className="mt-1.5 flex justify-between pl-6 text-[9px]" style={{ color: "var(--text-4)" }}>
              {["Jan", "Mar", "May", "Jul", "Sep", "Nov"].map(m => <span key={m}>{m}</span>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewMetric({ label, value, tone, currentValue }: { label: string; value: string; tone: string; currentValue: string }) {
  return (
    <div className="flex flex-col rounded-2xl p-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium" style={{ color: "var(--text)" }}>{label}</div>
          <div className="text-[10px]" style={{ color: "var(--text-4)" }}>This month</div>
        </div>
        <Icon name="arrowRight" size={12} className="-rotate-45" style={{ color: "var(--text-3)" }} />
      </div>
      <div className="my-5 text-4xl font-light tracking-tight" style={{ color: "var(--text)" }}>{value}</div>
      <div className="mt-auto grid grid-cols-2 gap-2 text-[10px]" style={{ color: "var(--text-4)" }}>
        <span>Current</span><span>Previous</span>
        <span className={`hatch ${tone} h-8 rounded-lg`} />
        <span className="hatch hatch-muted h-8 rounded-lg" />
      </div>
      <div className="mt-3 flex justify-between text-[10px]" style={{ color: "var(--text-3)" }}>
        <span>Current value</span><span className="font-medium" style={{ color: "var(--text)" }}>{currentValue}</span>
      </div>
    </div>
  );
}
