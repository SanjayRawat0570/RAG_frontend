"use client";

import ThemeToggle from "@/components/ThemeToggle";

const T = {
  bgBase:    "var(--bg-base)",
  bgSurface: "var(--bg-surface)",
  bgCard:    "var(--bg-card)",
  bgInput:   "var(--bg-input)",
  border:    "var(--border)",
  borderMid: "var(--border-mid)",
  royal:     "var(--royal)",
  royalGlow: "var(--royal-glow)",
  sky:       "var(--sky)",
  skyDim:    "var(--sky-dim)",
  skyBorder: "var(--sky-border)",
  textPri:   "var(--text-pri)",
  textSec:   "var(--text-sec)",
  textMuted: "var(--text-muted)",
  textDim:   "var(--text-dim)",
  green:     "var(--green)",
  amber:     "var(--amber)",
  purple:    "var(--purple)",
};

// T.xxx values are CSS var() references, so hex alpha-suffixes ("#rrggbb40")
// don't work on them — blend with color-mix() instead.
function alpha(color: string, pct: number) {
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
}

const PIPELINE: { label: string; tag: string; desc: string }[] = [
  { label: "Ingest",    tag: "F9",  desc: "Parse raw file into plain text" },
  { label: "Chunk",     tag: "F10", desc: "Split text into overlapping segments" },
  { label: "Embed",     tag: "F11", desc: "Convert chunks to dense vectors" },
  { label: "Index",     tag: "F12", desc: "Store vectors in NumPy cosine index" },
  { label: "Search",    tag: "F13", desc: "BM25 + vector hybrid + RRF fusion" },
  { label: "Re-rank",   tag: "F14", desc: "Cross-encoder quality reordering" },
  { label: "Augment",   tag: "F15", desc: "Build prompt with cited context" },
  { label: "Generate",  tag: "F16", desc: "LLM produces final answer" },
];

/* ── small helpers ───────────────────────────────────────────────── */

function DownArrow() {
  return (
    <div className="flex flex-col items-center py-1" style={{ zIndex: 1 }}>
      <div style={{ width: 2, height: 18, background: T.borderMid }} />
      <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
        <path d="M6 8L0 0h12z" fill={T.borderMid} />
      </svg>
    </div>
  );
}

function RightArrow({ color = T.borderMid }: { color?: string }) {
  return (
    <div className="flex items-center shrink-0 px-1">
      <div style={{ width: 14, height: 2, background: color }} />
      <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
        <path d="M6 5L0 0v10z" fill={color} />
      </svg>
    </div>
  );
}

function Tag({ text, color }: { text: string; color: string }) {
  return (
    <span className="rounded-full px-3 py-1 text-xs font-medium"
      style={{ backgroundColor: alpha(color, 9), border: `1px solid ${alpha(color, 25)}`, color }}>
      {text}
    </span>
  );
}

/* ── layer card ──────────────────────────────────────────────────── */

function LayerCard({
  title, color, port, items, wide,
}: {
  title: string; color: string; port?: string; items: string[]; wide?: boolean;
}) {
  return (
    <div className="w-full rounded-[26px] p-5" style={{
      backgroundColor: T.bgCard,
      boxShadow: `0 0 20px ${alpha(color, 6)}, var(--clay-raised-sm)`,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* top accent bar */}
      <div style={{
        position: "absolute", top: 0, left: "8%", right: "8%", height: 2,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
      }} />

      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm font-bold" style={{ color }}>{title}</span>
        {port && (
          <span className="font-mono text-xs rounded px-2 py-0.5"
            style={{ background: alpha(color, 13), color, border: `1px solid ${alpha(color, 25)}` }}>
            {port}
          </span>
        )}
      </div>

      <div className={`flex flex-wrap gap-2 ${wide ? "" : ""}`}>
        {items.map(item => (
          <Tag key={item} text={item} color={color} />
        ))}
      </div>
    </div>
  );
}

/* ── RAG pipeline box (2 rows: index + query) ────────────────────── */

function RagBox() {
  const indexFlow = [
    { label: "Ingest",  tag: "F9",  color: T.green },
    { label: "Chunk",   tag: "F10", color: T.green },
    { label: "Embed",   tag: "F11", color: T.green },
    { label: "Upsert",  tag: "F12", color: T.green },
  ];
  const queryFlow = [
    { label: "Query\nProcess",   tag: "F13", color: T.sky },
    { label: "Vector\nSearch",   tag: "F12", color: T.sky },
    { label: "BM25\nSearch",     tag: "F13", color: T.sky },
    { label: "RRF\nFusion",      tag: "F13", color: T.sky },
    { label: "Rerank",           tag: "F14", color: T.sky },
    { label: "Augment",          tag: "F15", color: T.sky },
    { label: "Generate",         tag: "F16", color: T.amber },
  ];

  function FlowNode({ label, tag, color }: { label: string; tag: string; color: string }) {
    return (
      <div className="flex flex-col items-center rounded-xl p-2 text-center shrink-0"
        style={{ border: `1px solid ${alpha(color, 25)}`, backgroundColor: T.bgInput, minWidth: 68 }}>
        <span className="rounded-full px-1.5 py-0.5 font-mono text-xs font-bold mb-1"
          style={{ background: alpha(color, 13), color, border: `1px solid ${alpha(color, 25)}` }}>
          {tag}
        </span>
        <span className="text-xs font-semibold leading-tight whitespace-pre-line" style={{ color: T.textPri }}>
          {label}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl p-5" style={{
      border: `1px solid ${alpha(T.green, 31)}`,
      backgroundColor: T.bgCard,
      boxShadow: `0 0 20px ${alpha(T.green, 6)}`,
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: "8%", right: "8%", height: 2,
        background: `linear-gradient(90deg, transparent, ${T.green}, transparent)`,
      }} />

      <span className="text-sm font-bold mb-4 block" style={{ color: T.green }}>RAG Pipeline</span>

      {/* Indexing row */}
      <div className="mb-3">
        <span className="text-xs font-semibold mb-2 block" style={{ color: T.textMuted }}>
          ▸ Indexing flow (document upload)
        </span>
        <div className="flex items-center flex-wrap gap-0">
          {indexFlow.map((node, i) => (
            <div key={node.label} className="flex items-center">
              <FlowNode {...node} />
              {i < indexFlow.length - 1 && <RightArrow color={alpha(T.green, 50)} />}
            </div>
          ))}
        </div>
      </div>

      {/* divider */}
      <div className="my-3" style={{ height: 1, background: T.border }} />

      {/* Query row */}
      <div>
        <span className="text-xs font-semibold mb-2 block" style={{ color: T.textMuted }}>
          ▸ Query flow (user question)
        </span>
        <div className="flex items-center flex-wrap gap-0">
          {queryFlow.map((node, i) => (
            <div key={node.label + i} className="flex items-center">
              <FlowNode {...node} />
              {i < queryFlow.length - 1 && <RightArrow color={alpha(T.sky, 50)} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── observability sidebar ───────────────────────────────────────── */

function ObsSidebar() {
  const tools = [
    { name: "Jaeger",      port: ":16686", desc: "Distributed traces",    color: T.purple },
    { name: "Prometheus",  port: ":9090",  desc: "Metrics scraping",      color: T.amber  },
    { name: "Grafana",     port: ":3000",  desc: "Dashboards & alerts",   color: T.amber  },
  ];

  return (
    <div className="flex flex-col gap-2 w-44 shrink-0">
      <span className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: T.purple }}>
        Observability
      </span>
      {tools.map(t => (
        <div key={t.name} className="rounded-xl p-3"
          style={{ border: `1px solid ${alpha(T.purple, 25)}`, backgroundColor: T.bgCard }}>
          <div className="font-mono text-xs font-bold mb-0.5" style={{ color: t.color }}>{t.port}</div>
          <div className="text-xs font-semibold" style={{ color: T.textPri }}>{t.name}</div>
          <div className="text-xs mt-0.5" style={{ color: T.textMuted }}>{t.desc}</div>
        </div>
      ))}
      {/* dashed line hinting at cross-cutting concern */}
      <div className="mx-auto mt-1 text-xs text-center" style={{ color: alpha(T.purple, 50) }}>
        ↑ taps every layer
      </div>
    </div>
  );
}

/* ── page ────────────────────────────────────────────────────────── */

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: T.bgBase, color: T.textPri }}>

      {/* Header */}
      <header className="border-b px-8 py-5 flex items-center justify-between" style={{ borderColor: T.border, backgroundColor: T.bgSurface }}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-black text-white"
            style={{ background: `linear-gradient(135deg, ${T.royal}, var(--magenta), ${T.sky})`, boxShadow: `0 2px 12px ${T.royalGlow}, var(--clay-raised-sm)` }}>
            R
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: T.textPri }}>Enterprise RAG — System Architecture</h1>
            <p className="text-sm" style={{ color: T.textMuted }}>F1 – F25 · offline-first · no paid APIs required</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-8 py-10">

        {/* RAG Pipeline flow */}
        <section>
          <SectionLabel>RAG Pipeline Flow</SectionLabel>
          <div className="mt-5 flex flex-wrap items-stretch gap-0">
            {PIPELINE.map((step, i) => (
              <div key={step.label} className="flex items-stretch">
                <div className="flex flex-col items-center rounded-xl p-4 text-center"
                  style={{ border: `1px solid ${T.border}`, backgroundColor: T.bgCard, minWidth: "110px" }}>
                  <span className="rounded-full px-2 py-0.5 font-mono text-xs font-bold"
                    style={{ backgroundColor: T.skyDim, color: T.sky, border: `1px solid ${T.skyBorder}` }}>
                    {step.tag}
                  </span>
                  <span className="mt-2 text-sm font-bold" style={{ color: T.textPri }}>{step.label}</span>
                  <span className="mt-1 text-xs leading-snug" style={{ color: T.textMuted }}>{step.desc}</span>
                </div>
                {i < PIPELINE.length - 1 && (
                  <div className="flex items-center px-1">
                    <span className="text-lg" style={{ color: T.borderMid }}>→</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Data flow diagram */}
        <section>
          <SectionLabel>Data Flow</SectionLabel>
          <div className="mt-5 grid grid-cols-3 gap-4">
            {[
              {
                title: "Document Ingestion",
                color: T.green,
                steps: [
                  "User uploads file via /docs",
                  "Backend parses → cleans → chunks",
                  "Chunks embedded → stored in vector index",
                  "Execution tracked via polling",
                ],
              },
              {
                title: "Query & Retrieval",
                color: T.sky,
                steps: [
                  "User asks question via /ask",
                  "Query processed + expanded",
                  "BM25 keyword + vector search",
                  "RRF fusion → cross-encoder re-rank",
                ],
              },
              {
                title: "Answer Generation",
                color: T.amber,
                steps: [
                  "Top-k chunks assembled as context",
                  "Prompt built with citations",
                  "LLM generates answer (Gemini / stub)",
                  "Response cached for future hits",
                ],
              },
            ].map(({ title, color, steps }) => (
              <div key={title} className="rounded-2xl p-5"
                style={{ border: `1px solid ${T.border}`, backgroundColor: T.bgCard, position: "relative", overflow: "hidden" }}>
                <div style={{
                  position: "absolute", top: 0, left: "10%", right: "10%", height: "2px",
                  background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                }} />
                <h3 className="mb-3 text-sm font-bold" style={{ color }}>{title}</h3>
                <ol className="space-y-2">
                  {steps.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs" style={{ color: T.textMuted }}>
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                        style={{ backgroundColor: alpha(color, 13), color }}>{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>

        {/* ── Architecture Flow (replaces System Layers) ───────────── */}
        <section>
          <SectionLabel>Architecture Flow</SectionLabel>
          <div className="mt-5 flex gap-6 items-start">

            {/* Main vertical flow */}
            <div className="flex-1 flex flex-col items-center">

              {/* 1 — Client */}
              <div className="w-full rounded-2xl p-4 flex items-center gap-4"
                style={{ border: `1px solid ${T.border}`, backgroundColor: T.bgCard }}>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: T.textMuted }}>
                    Browser / Client
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Tag text="HTTP Requests" color={T.textMuted} />
                    <Tag text="SSE Streams" color={T.textMuted} />
                    <Tag text="WebSocket" color={T.textMuted} />
                  </div>
                </div>
              </div>

              <DownArrow />

              {/* 2 — Frontend */}
              <LayerCard
                title="Frontend"
                color={T.sky}
                port=":3001"
                items={["Next.js 14 (App Router)", "React 18", "TypeScript", "Tailwind CSS", "Supabase Auth"]}
              />

              <DownArrow />

              {/* 3 — API Gateway */}
              <LayerCard
                title="API Gateway"
                color={T.royal}
                port=":8000"
                items={["FastAPI", "JWT Auth Middleware", "Rate Limiting", "CORS", "OpenAPI / Swagger"]}
              />

              <DownArrow />

              {/* 4 — RAG Pipeline */}
              <RagBox />

              <DownArrow />

              {/* 5 — Platform Services */}
              <LayerCard
                title="Platform Services"
                color={T.amber}
                items={[
                  "Cache F17 — TTL/LRU + semantic dedup",
                  "Multi-Tenancy F19 — namespace + RBAC",
                  "Cost Guard F24 — budget enforcement",
                  "Security F25 — AES-256, GDPR, audit log",
                  "Feedback F23 — ratings + A/B testing",
                  "Personalization F22 — recency boosts",
                ]}
                wide
              />

              <DownArrow />

              {/* 6 — Storage */}
              <div className="w-full rounded-2xl p-5 grid grid-cols-3 gap-3"
                style={{ border: `1px solid ${alpha(T.purple, 31)}`, backgroundColor: T.bgCard }}>
                {[
                  { label: "Vector Store", desc: "NumPy FLAT cosine (F12)", color: T.green },
                  { label: "BM25 Index",   desc: "Sparse keyword search (F13)", color: T.sky },
                  { label: "Supabase",     desc: "User accounts / auth (opt-in)", color: T.royal },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-3 text-center"
                    style={{ border: `1px solid ${alpha(s.color, 25)}`, backgroundColor: T.bgInput }}>
                    <div className="text-xs font-bold mb-1" style={{ color: s.color }}>{s.label}</div>
                    <div className="text-xs" style={{ color: T.textMuted }}>{s.desc}</div>
                  </div>
                ))}
              </div>

            </div>

            {/* Observability sidebar */}
            <ObsSidebar />

          </div>
        </section>

        {/* Port map */}
        <section>
          <SectionLabel>Service Endpoints</SectionLabel>
          <div className="mt-5 grid grid-cols-4 gap-3">
            {[
              { name: "Frontend",    port: ":3001",  desc: "Next.js UI",              color: T.sky    },
              { name: "Backend API", port: ":8000",  desc: "FastAPI + RAG pipeline",  color: T.royal  },
              { name: "Jaeger",      port: ":16686", desc: "Distributed tracing",     color: T.green  },
              { name: "Prometheus",  port: ":9090",  desc: "Metrics scraping",        color: T.amber  },
              { name: "Grafana",     port: ":3000",  desc: "Observability dashboards",color: T.purple },
            ].map(({ name, port, desc, color }) => (
              <div key={name} className="rounded-xl p-4"
                style={{ border: `1px solid ${T.border}`, backgroundColor: T.bgCard }}>
                <div className="font-mono text-lg font-black" style={{ color }}>{port}</div>
                <div className="mt-1 text-sm font-semibold" style={{ color: T.textPri }}>{name}</div>
                <div className="mt-0.5 text-xs" style={{ color: T.textMuted }}>{desc}</div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-bold uppercase tracking-widest" style={{
      background: `linear-gradient(90deg, ${T.sky}, ${T.royal})`,
      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
    }}>{children}</h2>
  );
}
