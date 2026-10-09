"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import Icon, { BrandMark, IconName } from "@/components/Icon";

const PIPELINE: { label: string; tag: string; desc: string }[] = [
  { label: "Ingest",   tag: "F9",  desc: "Parse raw file into plain text" },
  { label: "Chunk",    tag: "F10", desc: "Split text into overlapping segments" },
  { label: "Embed",    tag: "F11", desc: "Convert chunks to dense vectors" },
  { label: "Index",    tag: "F12", desc: "Store vectors in cosine index" },
  { label: "Search",   tag: "F13", desc: "BM25 + vector hybrid with RRF" },
  { label: "Re-rank",  tag: "F14", desc: "Cross-encoder reordering" },
  { label: "Augment",  tag: "F15", desc: "Build prompt with cited context" },
  { label: "Generate", tag: "F16", desc: "LLM produces the final answer" },
];

const DATA_FLOW: { title: string; icon: IconName; steps: string[] }[] = [
  { title: "Document ingestion", icon: "upload", steps: [
    "User uploads a file from Knowledge Base",
    "Backend parses, cleans and chunks content",
    "Chunks are embedded and stored in the vector index",
    "Execution progress is tracked via polling",
  ] },
  { title: "Query & retrieval", icon: "search", steps: [
    "User submits a question from Ask",
    "Query is processed and expanded",
    "BM25 keyword and vector search run in parallel",
    "RRF fusion, then cross-encoder re-ranking",
  ] },
  { title: "Answer generation", icon: "cpu", steps: [
    "Top-k chunks are assembled as context",
    "Prompt is built with citation markers",
    "LLM generates the answer (Gemini or offline)",
    "Response is cached for repeat queries",
  ] },
];

const ENDPOINTS: { name: string; port: string; desc: string }[] = [
  { name: "Frontend",    port: ":3001",  desc: "Next.js console" },
  { name: "Backend API", port: ":8000",  desc: "FastAPI + RAG pipeline" },
  { name: "Jaeger",      port: ":16686", desc: "Distributed tracing" },
  { name: "Prometheus",  port: ":9090",  desc: "Metrics scraping" },
  { name: "Grafana",     port: ":3000",  desc: "Observability dashboards" },
];

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl font-bold tracking-tight"><span className="grad-text">{title}</span></h2>
      {desc && <p className="mt-1 text-sm text-muted">{desc}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function DownArrow() {
  return (
    <div className="flex flex-col items-center py-1.5" aria-hidden="true">
      <div className="grad-bg" style={{ width: 2, height: 18, borderRadius: 2 }} />
      <svg width="10" height="6" viewBox="0 0 10 6"><path d="M5 6L0 0h10z" fill="var(--primary)" /></svg>
    </div>
  );
}

function RightArrow() {
  return (
    <span className="flex shrink-0 items-center px-1 text-dim" aria-hidden="true">
      <Icon name="chevronRight" size={14} />
    </span>
  );
}

function LayerCard({ title, icon, port, items }: { title: string; icon: IconName; port?: string; items: string[] }) {
  return (
    <div className="card w-full p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="icon-chip h-8 w-8">
          <Icon name={icon} size={15} />
        </span>
        <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{title}</span>
        {port && <span className="badge badge-mono">{port}</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map(item => <span key={item} className="badge">{item}</span>)}
      </div>
    </div>
  );
}

function FlowNode({ label, tag, accent }: { label: string; tag: string; accent?: boolean }) {
  return (
    <div className="flex min-w-[76px] shrink-0 flex-col items-center rounded-xl px-2 py-2 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--glow)]"
      style={{ border: `1px solid ${accent ? "var(--primary-border)" : "var(--border)"}`, background: accent ? "var(--grad-soft)" : "var(--surface-2)" }}>
      <span className="badge badge-mono mb-1">{tag}</span>
      <span className="whitespace-pre-line text-xs font-medium leading-tight" style={{ color: "var(--text)" }}>{label}</span>
    </div>
  );
}

function RagBox() {
  const indexFlow = [
    { label: "Ingest", tag: "F9" }, { label: "Chunk", tag: "F10" },
    { label: "Embed",  tag: "F11" }, { label: "Upsert", tag: "F12" },
  ];
  const queryFlow = [
    { label: "Query\nProcess", tag: "F13" }, { label: "Vector\nSearch", tag: "F12" },
    { label: "BM25\nSearch",   tag: "F13" }, { label: "RRF\nFusion",    tag: "F13" },
    { label: "Rerank",         tag: "F14" }, { label: "Augment",        tag: "F15" },
    { label: "Generate",       tag: "F16", accent: true },
  ];

  return (
    <div className="card w-full p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="icon-chip h-8 w-8">
          <Icon name="layers" size={15} />
        </span>
        <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>RAG pipeline</span>
      </div>

      <div className="eyebrow mb-2">Indexing flow · document upload</div>
      <div className="flex flex-wrap items-center">
        {indexFlow.map((n, i) => (
          <div key={n.label} className="flex items-center">
            <FlowNode {...n} />
            {i < indexFlow.length - 1 && <RightArrow />}
          </div>
        ))}
      </div>

      <div className="my-4" style={{ height: 1, background: "var(--border)" }} />

      <div className="eyebrow mb-2">Query flow · user question</div>
      <div className="flex flex-wrap items-center gap-y-2">
        {queryFlow.map((n, i) => (
          <div key={n.label + i} className="flex items-center">
            <FlowNode {...n} />
            {i < queryFlow.length - 1 && <RightArrow />}
          </div>
        ))}
      </div>
    </div>
  );
}

function ObsSidebar() {
  const tools = [
    { name: "Jaeger",     port: ":16686", desc: "Distributed traces" },
    { name: "Prometheus", port: ":9090",  desc: "Metrics scraping" },
    { name: "Grafana",    port: ":3000",  desc: "Dashboards & alerts" },
  ];
  return (
    <div className="flex w-full shrink-0 flex-col gap-2 lg:w-52">
      <div className="eyebrow mb-1 flex items-center gap-1.5"><Icon name="activity" size={12} />Observability</div>
      {tools.map(t => (
        <div key={t.name} className="card p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{t.name}</span>
            <span className="badge badge-mono">{t.port}</span>
          </div>
          <div className="mt-1 text-xs text-muted">{t.desc}</div>
        </div>
      ))}
      <p className="mt-1 text-center text-xs text-muted">Instruments every layer</p>
    </div>
  );
}

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 px-3 pt-3">
        <div className="glass mx-auto flex h-16 max-w-6xl items-center justify-between rounded-2xl px-4 sm:px-5" style={{ boxShadow: "var(--shadow-md)" }}>
          <div className="flex items-center gap-3">
            <Link href="/landing"><BrandMark size={30} /></Link>
            <div className="leading-tight">
              <div className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>System architecture</div>
              <div className="text-xs text-muted">Enterprise RAG · modules F1 – F25</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="btn btn-secondary btn-sm hidden sm:inline-flex">Open console</Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6">

        <Section title="RAG pipeline" desc="The eight stages every document and query passes through.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PIPELINE.map((step, i) => (
              <div key={step.label} className="card lift rise p-4" style={{ "--d": `${i * 50}ms` } as React.CSSProperties}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted">Stage {i + 1}</span>
                  <span className="badge badge-mono">{step.tag}</span>
                </div>
                <div className="mt-2 text-sm font-semibold" style={{ color: "var(--text)" }}>{step.label}</div>
                <div className="mt-1 text-xs text-muted">{step.desc}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Data flow" desc="How requests move through the system end to end.">
          <div className="grid gap-4 md:grid-cols-3">
            {DATA_FLOW.map(({ title, icon, steps }) => (
              <div key={title} className="card">
                <div className="card-header">
                  <div className="card-title flex items-center gap-2"><Icon name={icon} size={15} className="text-muted" />{title}</div>
                </div>
                <ol className="card-body space-y-3">
                  {steps.map((s, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--text-2)" }}>
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                        style={{ background: "var(--grad)", color: "#fff" }}>{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Architecture" desc="Deployment layers from client to storage.">
          <div className="flex flex-col items-start gap-6 lg:flex-row">
            <div className="flex w-full flex-1 flex-col items-center">
              <LayerCard title="Browser / client" icon="eye" items={["HTTP requests", "SSE streams", "WebSocket"]} />
              <DownArrow />
              <LayerCard title="Frontend" icon="dashboard" port=":3001"
                items={["Next.js 14 (App Router)", "React 18", "TypeScript", "Tailwind CSS", "Supabase Auth"]} />
              <DownArrow />
              <LayerCard title="API gateway" icon="server" port=":8000"
                items={["FastAPI", "JWT auth middleware", "Rate limiting", "CORS", "OpenAPI / Swagger"]} />
              <DownArrow />
              <RagBox />
              <DownArrow />
              <LayerCard title="Platform services" icon="grid" items={[
                "Cache F17 — TTL/LRU + semantic dedup",
                "Multi-tenancy F19 — namespace + RBAC",
                "Cost guard F24 — budget enforcement",
                "Security F25 — AES-256, GDPR, audit log",
                "Feedback F23 — ratings + A/B testing",
                "Personalization F22 — recency boosts",
              ]} />
              <DownArrow />
              <div className="card grid w-full gap-3 p-5 sm:grid-cols-3">
                {[
                  { label: "Vector store", desc: "Cosine FLAT index (F12)" },
                  { label: "BM25 index",   desc: "Sparse keyword search (F13)" },
                  { label: "Supabase",     desc: "User accounts / auth (opt-in)" },
                ].map(s => (
                  <div key={s.label} className="flex items-start gap-2.5 rounded-md p-3" style={{ border: "1px solid var(--border)", background: "var(--surface-2)" }}>
                    <Icon name="database" size={15} style={{ color: "var(--primary)", marginTop: 2 }} />
                    <div>
                      <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{s.label}</div>
                      <div className="text-xs text-muted">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <ObsSidebar />
          </div>
        </Section>

        <Section title="Service endpoints" desc="Default ports in the Docker Compose deployment.">
          <div className="card overflow-x-auto">
            <table className="table">
              <thead><tr><th>Service</th><th>Port</th><th>Purpose</th></tr></thead>
              <tbody>
                {ENDPOINTS.map(e => (
                  <tr key={e.name}>
                    <td className="font-medium" style={{ color: "var(--text)" }}>{e.name}</td>
                    <td><span className="badge badge-mono">{e.port}</span></td>
                    <td>{e.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </main>
    </div>
  );
}
