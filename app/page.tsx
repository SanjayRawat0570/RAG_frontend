"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AskResult, ExecutionStatus, IndexResult, ApiKeyRecord, AuditEvent,
  FeedbackRecord, FeedbackStats, BudgetEntry, CostSummary,
  askQuestion, indexDocument, pollExecution, uploadDocument, getHealth,
  getCostPricing, getCostBudgets, getCostSummary, getSecurityApiKeys,
  createSecurityApiKey, revokeSecurityApiKey, getAuditEvents, getFeedback,
  getFeedbackStats, submitFeedback, getProfile, upsertProfile, getTenantInfo, TenantInfo,
} from "@/lib/api";
import { signOut, getSession, userFromSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";
import Icon, { BrandMark, IconName } from "@/components/Icon";
import CommandPalette, { Command } from "@/components/CommandPalette";
import { CountUp, Typewriter } from "@/components/Effects";

type View = "dashboard" | "ask" | "docs" | "settings";
type SettingsTab = "tenants" | "cost" | "security" | "feedback" | "personalization";
interface ChatEntry { question: string; result: AskResult; ts: number }

const NAV: { id: View; label: string; icon: IconName; desc: string }[] = [
  { id: "dashboard", label: "Overview",       icon: "dashboard", desc: "Platform status, capabilities and getting started" },
  { id: "ask",       label: "Ask",            icon: "message",   desc: "Query your knowledge base and receive cited answers" },
  { id: "docs",      label: "Knowledge Base", icon: "database",  desc: "Upload and index documents into the active workspace" },
];

const ADMIN_NAV: { id: View; label: string; icon: IconName; desc: string }[] = [
  { id: "settings",  label: "Settings",       icon: "settings",  desc: "Workspaces, usage, security, feedback and personalization" },
];

const SETTINGS_TABS: { id: SettingsTab; label: string; icon: IconName }[] = [
  { id: "tenants",         label: "Workspaces",      icon: "users"   },
  { id: "cost",            label: "Usage & Billing", icon: "dollar"  },
  { id: "security",        label: "Security",        icon: "shield"  },
  { id: "feedback",        label: "Feedback",        icon: "star"    },
  { id: "personalization", label: "Personalization", icon: "sliders" },
];

const PIPELINE_STEPS = [
  { id: "validate", label: "Validate" }, { id: "extract", label: "Extract" },
  { id: "chunk",    label: "Chunk"    }, { id: "embed",   label: "Embed"   },
  { id: "index",    label: "Index"    }, { id: "save",    label: "Save"    },
  { id: "done",     label: "Complete" },
];

const SUGGESTIONS = [
  "How is data encrypted?",
  "What are the support response times?",
  "When are invoices due?",
];

const SAMPLE_DOC =`# Company Handbook\n\n## Security Policy\nAll data is encrypted at rest and in transit using AES-256.\nEmployees must use MFA for all critical systems.\n\n## Billing\nInvoices are issued monthly. Payment is due within 30 days.\nLate payments incur a 2% monthly interest charge.\n\n## Support\nContact support 24/7 via the help portal for any issues.\nResponse time: P1 < 1 hour, P2 < 4 hours, P3 < 24 hours.`;

// ── Root ───────────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const [ready,    setReady]    = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId,   setUserId]   = useState<string>("anonymous");
  const [view,         setView]         = useState<View>("dashboard");
  const [settingsTab,  setSettingsTab]  = useState<SettingsTab>("tenants");
  const [tenant,       setTenant]       = useState("acme");
  const [health,   setHealth]   = useState<{ status: string; version: string } | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen(o => !o); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    getHealth().then(setHealth).catch(() => setHealth({ status: "offline", version: "" }));
    getSession().then((session) => {
      if (!session) { router.replace("/landing"); return; }
      const user = userFromSession(session);
      setUserName(user?.username ?? null);
      setUserId(user?.id ?? "anonymous");
      setReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (event: any, session: any) => { if (event === "SIGNED_OUT" || !session) router.replace("/login"); }
    );
    return () => subscription.unsubscribe();
  }, [router]);

  if (!ready) return <FullPageSpinner />;

  const effectiveTenant = tenant.trim() || "acme";
  const currentNav = [...NAV, ...ADMIN_NAV].find(n => n.id === view)!;
  const online = health?.status === "ok";

  function openSettings(tab: SettingsTab) { setSettingsTab(tab); setView("settings"); }

  const commands: Command[] = [
    ...[...NAV, ...ADMIN_NAV].map(n => ({ id: n.id, label: n.label, hint: n.desc, icon: n.icon, group: "Navigate", run: () => setView(n.id) })),
    ...SETTINGS_TABS.map(t => ({ id: `s-${t.id}`, label: t.label, hint: "Settings", icon: t.icon, group: "Settings", run: () => openSettings(t.id) })),
    { id: "arch", label: "Architecture", hint: "System diagram and data flow", icon: "gitBranch", group: "Navigate", run: () => router.push("/architecture") },
  ];

  return (
    <div className="flex min-h-screen">
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto px-5 py-7 lg:flex"
        style={{ background: "var(--surface-solid)", borderRight: "1px solid var(--border)" }}>
        <div className="px-2.5 text-lg font-semibold tracking-tight" style={{ color: "var(--text)" }}>Enterprise RAG</div>

        <nav className="mt-10 space-y-0.5">
          {[...NAV, ...ADMIN_NAV].map(item => (
            <button key={item.id} onClick={() => setView(item.id)} className={`nav-item${view === item.id ? " active" : ""}`}>
              <Icon name={item.icon} size={17} />{item.label}
            </button>
          ))}
          <Link href="/architecture" className="nav-item"><Icon name="gitBranch" size={17} />Architecture</Link>
        </nav>

        <div className="mb-2 mt-9 px-2.5 text-xs" style={{ color: "var(--text-4)" }}>Manage</div>
        <div className="space-y-0.5">
          {SETTINGS_TABS.map(t => (
            <button key={t.id} onClick={() => openSettings(t.id)}
              className={`nav-item${view === "settings" && settingsTab === t.id ? " active" : ""}`}>
              <Icon name={t.icon} size={17} />{t.label}
            </button>
          ))}
        </div>

        <div className="mb-2 mt-9 flex items-center justify-between px-2.5 text-xs" style={{ color: "var(--text-4)" }}>
          Workspace
          <button onClick={() => openSettings("tenants")} className="transition-colors hover:text-[var(--text)]" title="Change workspace" aria-label="Change workspace">
            <Icon name="plus" size={16} />
          </button>
        </div>
        <button onClick={() => openSettings("tenants")} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-[var(--mist)]">
          <Avatar letter={effectiveTenant[0]} online />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-medium" style={{ color: "var(--text)" }}>{effectiveTenant}</span>
            <span className="block text-[11px]" style={{ color: "var(--text-4)" }}>Active workspace</span>
          </span>
        </button>
        <div className="flex items-center gap-3 px-2.5 py-1.5">
          <Avatar letter="A" online={online} offline={health !== null && !online} />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-medium" style={{ color: "var(--text)" }}>API</span>
            <span className="block text-[11px]" style={{ color: "var(--text-4)" }}>
              {health === null ? "Connecting…" : online ? `Operational${health.version ? ` · v${health.version}` : ""}` : "Unavailable"}
            </span>
          </span>
        </div>

        <div className="mt-auto flex items-center gap-3 px-2.5 pt-8">
          <Avatar letter={userName?.[0] ?? "U"} />
          <span className="min-w-0 flex-1 truncate text-sm font-medium" style={{ color: "var(--text)" }}>{userName ?? "User"}</span>
          <button onClick={async () => { await signOut(); router.replace("/login"); }}
            className="transition-colors hover:text-[var(--text)]" style={{ color: "var(--text-2)" }} title="Sign out" aria-label="Sign out">
            <Icon name="logout" size={17} />
          </button>
        </div>
      </aside>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="min-w-0 flex-1">
        <div style={{ background: "var(--cream)" }}>
          <header className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-5 sm:px-8">
            <button onClick={() => setPaletteOpen(true)} className="flex min-w-0 flex-1 items-center gap-3 text-sm" style={{ color: "var(--text-4)" }}>
              <Icon name="search" size={18} style={{ color: "var(--text)" }} />
              <span className="truncate">Search or jump to…</span>
              <kbd className="kbd hidden sm:inline-flex">Ctrl K</kbd>
            </button>
            <div className="flex items-center gap-5 text-sm" style={{ color: "var(--text)" }}>
              <button onClick={() => openSettings("cost")} className="hidden items-center gap-2 hover:opacity-70 md:inline-flex">
                <Icon name="dollar" size={16} />Usage
              </button>
              <button onClick={() => openSettings("personalization")} className="hidden items-center gap-2 hover:opacity-70 md:inline-flex">
                <Icon name="user" size={16} />Me
              </button>
              <ThemeToggle />
              <button onClick={() => setView("ask")} className="btn btn-primary"><Icon name="plus" size={16} />Ask a question</button>
            </div>
          </header>

          {/* Compact navigation when the sidebar is hidden */}
          <nav className="pill-nav px-4 lg:hidden">
            {[...NAV, ...ADMIN_NAV].map(item => (
              <button key={item.id} onClick={() => setView(item.id)} className={`pill${view === item.id ? " active" : ""}`}>
                <Icon name={item.icon} size={14} />{item.label}
              </button>
            ))}
            <button onClick={async () => { await signOut(); router.replace("/login"); }} className="pill"><Icon name="logout" size={14} />Sign out</button>
          </nav>

          {view === "dashboard" ? (
            <OverviewStats tenant={effectiveTenant} onNavigate={setView} onSettings={openSettings} />
          ) : (
            <div key={view} className="rise px-5 pb-9 pt-6 sm:px-8">
              <h1 className="text-3xl font-medium tracking-tight" style={{ color: "var(--text)" }}>
                {view === "settings" ? SETTINGS_TABS.find(t => t.id === settingsTab)!.label : currentNav.label}
              </h1>
              <p className="mt-1.5 text-sm text-muted">{currentNav.desc}</p>
            </div>
          )}
        </div>

        <main className="px-5 py-8 sm:px-8">
          <div key={`v-${view}`} className="rise mx-auto max-w-7xl" style={{ "--d": "80ms" } as React.CSSProperties}>
            {view === "dashboard" && <DashboardView health={health} onNavigate={setView} onSettings={openSettings} />}
            {view === "ask"       && <AskView tenant={effectiveTenant} />}
            {view === "docs"      && <KnowledgeView tenant={effectiveTenant} onAsk={() => setView("ask")} />}
            {view === "settings"  && (
              <SettingsView
                tab={settingsTab}
                onTab={setSettingsTab}
                tenant={effectiveTenant}
                onTenantChange={setTenant}
                userId={userId}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function Avatar({ letter, online, offline }: { letter: string; online?: boolean; offline?: boolean }) {
  return (
    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
      style={{ background: "var(--mist)", color: "var(--text)", border: "1px solid var(--border)" }}>
      {letter.toUpperCase()}
      {(online || offline) && (
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full"
          style={{ background: online ? "var(--success)" : "var(--danger)", border: "2px solid var(--surface-solid)" }} />
      )}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// OVERVIEW
// ══════════════════════════════════════════════════════════════════════════════

/** Cream header band: rating chart, cache gauge and headline numbers, all from live endpoints. */
function OverviewStats({ tenant, onNavigate, onSettings }: {
  tenant: string;
  onNavigate: (v: View) => void;
  onSettings: (t: SettingsTab) => void;
}) {
  const [cost,     setCost]     = useState<CostSummary | null>(null);
  const [feedback, setFeedback] = useState<FeedbackStats | null>(null);
  const [info,     setInfo]     = useState<TenantInfo | null>(null);

  useEffect(() => {
    getCostSummary().then(setCost).catch(() => {});
    getFeedbackStats().then(setFeedback).catch(() => {});
    getTenantInfo(tenant).then(setInfo);
  }, [tenant]);

  const ratings = [1, 2, 3, 4, 5].map(r => feedback?.distribution?.[String(r)] ?? 0);
  const maxRating = Math.max(4, ...ratings);
  const hitPct = cost ? Math.round(cost.cache_hit_rate * 100) : null;

  return (
    <div className="rise grid items-end gap-x-10 gap-y-10 px-5 pb-10 pt-6 sm:grid-cols-2 sm:px-8 xl:grid-cols-[1.25fr_1fr_0.7fr_0.8fr]">
      {/* Ratings chart */}
      <div>
        <div className="mb-4 text-base font-medium" style={{ color: "var(--text)" }}>
          Answer ratings
          {feedback && feedback.count === 0 && <span className="ml-2 text-xs font-normal text-muted">No ratings yet</span>}
        </div>
        <div className="flex h-24 gap-3">
          <div className="flex flex-col justify-between pb-5 text-[10px]" style={{ color: "var(--text-3)" }}>
            <span>{maxRating}</span><span>{Math.round(maxRating / 2)}</span><span>0</span>
          </div>
          {ratings.map((n, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full flex-1 items-end justify-center gap-1">
                <span className="hatch block w-3 rounded-[3px]" style={{ height: `${Math.max(12, (n / maxRating) * 70)}%` }} />
                <span className="block w-3 rounded-[3px]"
                  style={{ height: n ? `${(n / maxRating) * 100}%` : "4%", background: "var(--ink)", opacity: n ? 1 : 0.15 }} />
              </div>
              <span className="text-[11px] font-medium" style={{ color: "var(--text)" }}>{i + 1}★</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cache gauge */}
      <div className="flex justify-center">
        <Gauge pct={hitPct} label="Cache hit rate" />
      </div>

      <HeadlineNumber value={info ? info.doc_count.toLocaleString() : "—"} label={<>Documents<br />indexed</>} onClick={() => onNavigate("docs")} />
      <HeadlineNumber
        value={cost ? `$ ${cost.total_cost.toFixed(cost.total_cost < 10 ? 4 : 2)}` : "—"}
        label={<>Model spend<br />across {cost?.total_requests.toLocaleString() ?? 0} queries</>}
        onClick={() => onSettings("cost")} />
    </div>
  );
}

function Gauge({ pct, label }: { pct: number | null; label: string }) {
  const ticks = 44;
  const lit = pct === null ? 0 : Math.round((pct / 100) * ticks);
  return (
    <div className="relative h-[110px] w-[200px]">
      <svg viewBox="0 0 200 110" className="absolute inset-0" aria-hidden="true">
        {Array.from({ length: ticks }, (_, i) => {
          const a = Math.PI - (i / (ticks - 1)) * Math.PI;
          const r1 = 78, r2 = i % 4 === 0 ? 98 : 92;
          return (
            <line key={i} x1={100 + r1 * Math.cos(a)} y1={102 - r1 * Math.sin(a)} x2={100 + r2 * Math.cos(a)} y2={102 - r2 * Math.sin(a)}
              stroke={i < lit ? "var(--ink)" : "var(--border-strong)"} strokeWidth={1.6} strokeLinecap="round" />
          );
        })}
      </svg>
      <div className="absolute inset-x-0 bottom-1 text-center">
        <div className="text-3xl font-medium tracking-tight tabular-nums" style={{ color: "var(--text)" }}>
          {pct === null ? "—" : <CountUp value={`${pct}%`} />}
        </div>
        <div className="text-xs" style={{ color: "var(--text-2)" }}>{label}</div>
      </div>
    </div>
  );
}

function HeadlineNumber({ value, label, onClick }: { value: string; label: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group flex h-full flex-col justify-between text-left">
      <span className="text-4xl font-medium tracking-tight tabular-nums" style={{ color: "var(--text)" }}>
        {value === "—" ? value : <CountUp value={value} />}
      </span>
      <span className="mt-8 flex items-end justify-between gap-4 text-xs" style={{ color: "var(--text-2)" }}>
        <span>{label}</span>
        <Icon name="arrowRight" size={18} className="shrink-0 transition-transform group-hover:translate-x-1" style={{ color: "var(--text)" }} />
      </span>
    </button>
  );
}

type BoardItem = { icon: IconName; name: string; desc: string; tag: string; go: () => void };

/** Platform modules laid out as a four-column board, grouped by pipeline stage. */
function DashboardView({ health, onNavigate, onSettings }: {
  health: { status: string; version: string } | null;
  onNavigate: (v: View) => void;
  onSettings: (t: SettingsTab) => void;
}) {
  const docs = () => onNavigate("docs");
  const ask  = () => onNavigate("ask");
  const columns: { title: string; tone?: "muted"; items: BoardItem[] }[] = [
    { title: "Ingestion", items: [
      { icon: "gitBranch", name: "Orchestration Engine", desc: "DAG execution, branching and streaming",      tag: "F1–F8", go: docs },
      { icon: "upload",    name: "Document Ingestion",   desc: "PDF, DOCX, TXT, MD, HTML, PPTX, XLSX",        tag: "F9",    go: docs },
      { icon: "scissors",  name: "Smart Chunking",       desc: "Heading, sentence and overlap strategies",    tag: "F10",   go: docs },
      { icon: "box",       name: "Embeddings",           desc: "Hash and Sentence Transformer (MiniLM)",      tag: "F11",   go: docs },
      { icon: "database",  name: "Vector Storage",       desc: "Cosine FLAT index with full CRUD",            tag: "F12",   go: docs },
    ] },
    { title: "Retrieval", items: [
      { icon: "merge",     name: "Hybrid Search",        desc: "BM25 + vector with Reciprocal Rank Fusion",   tag: "F13",   go: ask },
      { icon: "trending",  name: "Re-Ranking",           desc: "Cross-encoder relevance scoring",             tag: "F14",   go: ask },
      { icon: "book",      name: "Context Assembly",     desc: "Citation extraction and augmentation",        tag: "F15",   go: ask },
      { icon: "zap",       name: "Query Cache",          desc: "Semantic de-duplication of repeat queries",   tag: "F17",   go: () => onSettings("cost") },
      { icon: "share",     name: "Knowledge Graph",      desc: "Entity and relationship extraction",          tag: "F18",   go: ask },
    ] },
    { title: "Generation", items: [
      { icon: "cpu",       name: "LLM Generation",       desc: "Gemini free tier, with an offline extractive fallback", tag: "F16", go: ask },
      { icon: "activity",  name: "Monitoring",           desc: "Prometheus metrics, OpenTelemetry traces",    tag: "F20",   go: () => window.location.assign("/architecture") },
      { icon: "refresh",   name: "Resilience",           desc: "Circuit breaker, retry and timeout",          tag: "F21",   go: ask },
      { icon: "sliders",   name: "Personalization",      desc: "Interest and recency ranking boosts",         tag: "F22",   go: () => onSettings("personalization") },
    ] },
    { title: "Governance", tone: "muted", items: [
      { icon: "users",     name: "Multi-Tenancy",        desc: "Namespace isolation with RBAC",               tag: "F19",   go: () => onSettings("tenants") },
      { icon: "star",      name: "Feedback Loop",        desc: "Ratings and A/B experimentation",             tag: "F23",   go: () => onSettings("feedback") },
      { icon: "dollar",    name: "Cost Management",      desc: "Budget guards and model recommendations",     tag: "F24",   go: () => onSettings("cost") },
      { icon: "shield",    name: "Security & Compliance",desc: "AES-256, GDPR rights, audit logging",         tag: "F25",   go: () => onSettings("security") },
    ] },
  ];

  const online = health?.status === "ok";

  return (
    <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 xl:grid-cols-4">
      {columns.map((col, ci) => (
        <section key={col.title}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-medium tracking-tight" style={{ color: "var(--text)" }}>{col.title}</h2>
            <span className="count-chip">{col.items.length}<Icon name="sort" size={13} /></span>
          </div>
          <div className="space-y-3">
            {col.items.map((it, i) => {
              const featured = ci === 2 && i === 0;
              return (
                <button key={it.name} onClick={it.go}
                  className={`board-card rise${featured ? " inverse" : col.tone === "muted" ? " muted" : ""}`}
                  style={{ "--d": `${ci * 60 + i * 40}ms` } as React.CSSProperties}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[15px] font-medium">{it.name}</span>
                    <Icon name="more" size={16} className="mt-0.5 shrink-0 opacity-70" />
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed" style={{ color: featured ? "var(--panel-muted)" : "var(--text-2)" }}>{it.desc}</p>
                  {featured && (
                    <div className="mt-3 space-y-1.5 text-[11px]" style={{ color: "var(--panel-muted)" }}>
                      <div className="flex items-center gap-2"><Icon name="server" size={12} />
                        {health === null ? "Checking backend…" : online ? `Backend operational${health.version ? ` · v${health.version}` : ""}` : "Backend unavailable"}
                      </div>
                      <div className="flex items-center gap-2"><Icon name="lock" size={12} />No paid APIs · runs offline</div>
                    </div>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="meta-chip"><Icon name="layers" size={11} />{it.tag}</span>
                    <Icon name={it.icon} size={14} className="opacity-70" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// KNOWLEDGE BASE
// ══════════════════════════════════════════════════════════════════════════════
function KnowledgeView({ tenant, onAsk }: { tenant: string; onAsk: () => void }) {
  const [mode,        setMode]        = useState<"file" | "text">("file");
  const [dragging,    setDragging]    = useState(false);
  const [file,        setFile]        = useState<File | null>(null);
  const [execution,   setExecution]   = useState<ExecutionStatus | null>(null);
  const [uploading,   setUploading]   = useState(false);
  const [docText,     setDocText]     = useState(SAMPLE_DOC);
  const [filename,    setFilename]    = useState("handbook.md");
  const [indexResult, setIndexResult] = useState<IndexResult | null>(null);
  const [indexing,    setIndexing]    = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPoll = useCallback(() => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } }, []);
  useEffect(() => () => stopPoll(), [stopPoll]);

  function stepIdx(id: string) { const i = PIPELINE_STEPS.findIndex(s => s.id === id); return i === -1 ? 0 : i; }

  async function onUpload() {
    if (!file) return;
    setError(null); setExecution(null); setUploading(true);
    try {
      const { execution_id } = await uploadDocument(file, tenant);
      stopPoll();
      pollRef.current = setInterval(async () => {
        try {
          const s = await pollExecution(execution_id);
          setExecution(s);
          if (s.status === "completed" || s.status === "failed") { stopPoll(); setUploading(false); }
        } catch { stopPoll(); setUploading(false); }
      }, 600);
    } catch (e) { setError(String(e)); setUploading(false); }
  }

  async function onIndex() {
    setError(null); setIndexing(true); setIndexResult(null);
    try { setIndexResult(await indexDocument(tenant, docText, filename)); }
    catch (e) { setError(String(e)); }
    finally { setIndexing(false); }
  }

  const done = execution?.status === "completed" || !!indexResult;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="card lg:col-span-3">
        <div className="card-header">
          <div>
            <div className="card-title">Add document</div>
            <div className="card-subtitle">Content is indexed into workspace <span className="font-mono">{tenant}</span></div>
          </div>
          <div className="segmented">
            {(["file", "text"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} className={mode === m ? "active" : ""}>
                {m === "file" ? "Upload file" : "Paste text"}
              </button>
            ))}
          </div>
        </div>

        <div className="card-body">
          {error && <ErrorBanner msg={error} />}

          {mode === "file" ? (
            <div className="space-y-4">
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) { setFile(f); setExecution(null); } }}
                onClick={() => fileRef.current?.click()}
                className={`dropzone group flex cursor-pointer flex-col items-center justify-center gap-3 px-6 py-14 text-center${dragging ? " is-active" : ""}`}
              >
                <input ref={fileRef} type="file" className="hidden"
                  accept=".txt,.md,.pdf,.docx,.html,.json,.pptx,.xlsx"
                  onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setExecution(null); } }} />
                <span className={`grad-bg flex h-14 w-14 items-center justify-center rounded-2xl text-white transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105 ${dragging ? "-translate-y-1 scale-110" : ""}`}
                  style={{ boxShadow: "var(--glow)" }}>
                  <Icon name="upload" size={22} />
                </span>
                <p className="text-[15px]" style={{ color: "var(--text)" }}>
                  {dragging
                    ? <span className="font-semibold" style={{ color: "var(--primary)" }}>Drop to add it</span>
                    : <><span className="font-semibold" style={{ color: "var(--primary)" }}>Click to upload</span> or drag and drop</>}
                </p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {["PDF", "DOCX", "TXT", "MD", "HTML", "JSON", "PPTX", "XLSX"].map(t => (
                    <span key={t} className="badge badge-mono">{t}</span>
                  ))}
                </div>
              </div>

              {file && (
                <div className="rise flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ border: "1px solid var(--primary-border)", background: "var(--primary-soft)" }}>
                  <span className="icon-chip h-9 w-9"><Icon name="file" size={16} /></span>
                  <span className="min-w-0 flex-1 truncate text-sm" style={{ color: "var(--text)" }}>{file.name}</span>
                  <span className="text-xs text-muted">{(file.size / 1024).toFixed(1)} KB</span>
                  <button onClick={() => { setFile(null); setExecution(null); }} className="btn btn-ghost btn-icon btn-sm" aria-label="Remove file">
                    <Icon name="x" size={14} />
                  </button>
                </div>
              )}

              <div className="flex justify-end">
                <button onClick={onUpload} disabled={!file || uploading} className="btn btn-primary">
                  {uploading ? <><span className="spinner" style={{ width: 14, height: 14, borderTopColor: "#fff" }} />Processing…</> : <><Icon name="upload" size={15} />Upload and index</>}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="label">File name</label>
                <input className="input" value={filename} onChange={e => setFilename(e.target.value)} placeholder="handbook.md" />
              </div>
              <div>
                <label className="label">Content</label>
                <textarea className="input font-mono" style={{ fontSize: 12.5 }} value={docText} onChange={e => setDocText(e.target.value)} rows={12} />
              </div>
              {indexResult && <SuccessBanner msg={`${indexResult.upserted} chunks indexed into "${indexResult.namespace}".`} />}
              <div className="flex justify-end">
                <button onClick={onIndex} disabled={indexing || !docText.trim()} className="btn btn-primary">
                  {indexing ? "Indexing…" : "Index document"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card self-start lg:col-span-2">
        <div className="card-header">
          <div>
            <div className="card-title">Ingestion pipeline</div>
            <div className="card-subtitle">Live status of the current job</div>
          </div>
          {execution && (
            <span className={`badge ${execution.status === "completed" ? "badge-success" : execution.status === "failed" ? "badge-danger" : "badge-primary"}`}>
              {execution.status}
            </span>
          )}
        </div>
        <div className="card-body">
          {!execution && !done && (
            <EmptyState icon="activity" title="No active job" desc="Upload or index a document to follow the pipeline here." />
          )}

          {execution && (
            <div className="space-y-5">
              <div>
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-muted">{execution.message}</span>
                  <span className="font-medium" style={{ color: "var(--text)" }}>{execution.progress}%</span>
                </div>
                <div className="progress">
                  <div style={{
                    width: `${execution.progress}%`,
                    background: execution.status === "failed" ? "var(--danger)" : execution.status === "completed" ? "var(--success)" : "var(--primary)",
                  }} />
                </div>
              </div>

              <ol className="relative">
                <div className="timeline-line">
                  <div className="timeline-fill" style={{
                    height: `${execution.status === "completed" ? 100 : (stepIdx(execution.step) / (PIPELINE_STEPS.length - 1)) * 100}%`,
                  }} />
                </div>
                {PIPELINE_STEPS.map((s, i) => {
                  const cur = stepIdx(execution.step);
                  const isDone = execution.status === "completed" || i < cur;
                  const isActive = i === cur && execution.status === "running";
                  return (
                    <li key={s.id} className="relative flex items-center gap-3 py-2">
                      <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold transition-all duration-300"
                        style={isDone
                          ? { background: "var(--success)", color: "#fff", boxShadow: "0 0 0 4px var(--success-soft)" }
                          : isActive
                            ? { background: "var(--surface-solid)", color: "var(--primary)", border: "2px solid var(--primary)", boxShadow: "0 0 0 5px var(--primary-soft), var(--glow)" }
                            : { background: "var(--surface-solid)", color: "var(--text-4)", border: "1px solid var(--border-strong)" }}>
                        {isDone ? <Icon name="check" size={12} strokeWidth={3} /> : i + 1}
                      </span>
                      <span className="text-sm transition-colors" style={{ color: isDone || isActive ? "var(--text)" : "var(--text-4)", fontWeight: isActive ? 600 : 400 }}>
                        {s.label}
                      </span>
                      {isActive && <span className="badge badge-primary ml-auto"><span className="dot dot-live" />Running</span>}
                    </li>
                  );
                })}
              </ol>

              {execution.status === "completed" && <SuccessBanner msg={`${execution.chunks_indexed ?? ""} chunks indexed into "${execution.tenant}".`} />}
              {execution.status === "failed"    && <ErrorBanner msg={execution.message} />}
            </div>
          )}

          {done && !execution && (
            <div className="space-y-4">
              <SuccessBanner msg={`Document indexed into workspace "${tenant}".`} />
              <button onClick={onAsk} className="btn btn-secondary btn-block">
                <Icon name="message" size={15} />Query this content
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ASK
// ══════════════════════════════════════════════════════════════════════════════
function AskView({ tenant }: { tenant: string }) {
  const [question, setQuestion] = useState("How is data encrypted?");
  const [asking,   setAsking]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [history,  setHistory]  = useState<ChatEntry[]>([]);

  async function onAsk() {
    if (!question.trim()) return;
    setError(null); setAsking(true);
    try {
      const result = await askQuestion(tenant, question);
      setHistory(h => [{ question, result, ts: Date.now() }, ...h].slice(0, 15));
      setQuestion("");
    } catch (e) { setError(String(e)); }
    finally { setAsking(false); }
  }

  const latest = history[0] ?? null;
  const thread = [...history].reverse();
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [history.length, asking]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">

        {thread.length === 0 && !asking && (
          <div className="card overflow-hidden">
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <span className="grad-bg float flex h-16 w-16 items-center justify-center rounded-2xl text-white" style={{ boxShadow: "var(--glow)" }}>
                <Icon name="sparkles" size={28} />
              </span>
              <h3 className="mt-5 text-xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>What would you like to know?</h3>
              <p className="mt-1.5 max-w-sm text-sm text-muted">Answers are grounded in the <span className="font-mono">{tenant}</span> workspace and cite their sources.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => setQuestion(s)} className="chip"><Icon name="sparkles" size={12} />{s}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {thread.map(entry => (
          <div key={entry.ts} className="space-y-3">
            <div className="rise flex justify-end"><div className="bubble-user">{entry.question}</div></div>
            <div className="rise" style={{ "--d": "120ms" } as React.CSSProperties}>
              <AnswerCard entry={entry} animate={entry === latest} />
            </div>
          </div>
        ))}

        {asking && (
          <div className="space-y-3">
            <div className="rise flex justify-end"><div className="bubble-user">{question}</div></div>
            <div className="card rise flex items-center gap-3 px-5 py-4">
              <span className="grad-bg flex h-8 w-8 items-center justify-center rounded-xl text-white"><Icon name="bot" size={16} /></span>
              <span className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <span key={i} className="h-2 w-2 animate-bounce rounded-full" style={{ background: "var(--primary)", animationDelay: `${i * 120}ms` }} />
                ))}
              </span>
              <span className="text-sm text-muted">Searching and generating…</span>
            </div>
          </div>
        )}

        {/* Composer */}
        <div ref={endRef} className="card sticky bottom-0 z-10" style={{ boxShadow: "var(--shadow-lg)" }}>
          <div className="p-3">
            {error && <ErrorBanner msg={error} />}
            <label className="sr-only" htmlFor="question">Question</label>
            <textarea id="question" value={question} onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onAsk(); }}
              rows={3} placeholder="Ask anything about your indexed documents…"
              className="w-full resize-none bg-transparent px-2 py-1.5 text-[15px] leading-relaxed outline-none" style={{ color: "var(--text)" }} />
          </div>
          <div className="card-footer">
            <span className="flex items-center gap-1.5 text-xs text-muted">
              Searching <span className="badge badge-mono badge-primary">{tenant}</span>
              <span className="hidden sm:inline">· <kbd className="kbd">Ctrl</kbd> + <kbd className="kbd">Enter</kbd> to submit</span>
            </span>
            <button onClick={onAsk} disabled={asking || !question.trim()} className="btn btn-primary">
              {asking ? <><span className="spinner" style={{ width: 14, height: 14, borderTopColor: "#fff" }} />Generating…</> : <><Icon name="send" size={14} />Ask</>}
            </button>
          </div>
        </div>
      </div>

      <div className="card self-start lg:sticky lg:top-0">
        <div className="card-header">
          <div className="card-title flex items-center gap-2"><Icon name="clock" size={15} className="text-muted" />Recent queries</div>
          <span className="badge badge-mono">{history.length} / 15</span>
        </div>
        {history.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">No queries yet.</p>
        ) : (
          <ul className="p-2">
            {history.map(entry => (
              <li key={entry.ts}>
                <button onClick={() => setQuestion(entry.question)}
                  className="group w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--primary-soft)]">
                  <p className="truncate text-sm transition-colors group-hover:text-[var(--primary)]" style={{ color: "var(--text)" }}>{entry.question}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className={`badge ${entry.result.cache_hit ? "badge-primary" : ""}`}>
                      {entry.result.cache_hit ? "Cached" : entry.result.provider}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <Icon name="clock" size={11} />{entry.result.duration_ms.toFixed(0)} ms
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AnswerCard({ entry, animate = false }: { entry: ChatEntry; animate?: boolean }) {
  const { result } = entry;
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grad-bg flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white" style={{ boxShadow: "var(--glow)" }}>
            <Icon name="bot" size={16} />
          </span>
          <div className="min-w-0">
            <div className="card-title">Answer</div>
            <div className="card-subtitle truncate">{entry.question}</div>
          </div>
        </div>
        <span className={`badge ${result.cache_hit ? "badge-primary" : ""}`}>
          {result.cache_hit ? <><Icon name="zap" size={11} />Cache hit</> : "Cache miss"}
        </span>
      </div>
      <div className="card-body">
        <Typewriter text={result.answer} animate={animate}
          className="whitespace-pre-wrap text-[15px] leading-relaxed" style={{ color: "var(--text)" }} />

        {result.citations?.length > 0 && (
          <div className="mt-5">
            <div className="eyebrow mb-2">Sources</div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {result.citations.map(c => (
                <li key={c.marker} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors hover:border-[var(--primary-border)]"
                  style={{ border: "1px solid var(--border)", background: "var(--surface-2)" }}>
                  <span className="badge badge-mono badge-primary">{c.marker}</span>
                  <Icon name="file" size={13} className="shrink-0 text-muted" />
                  <span className="truncate" style={{ color: "var(--text-2)" }}>{c.heading ?? c.source ?? "Untitled section"}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="card-footer">
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
          <Meta label="Intent" value={result.intent} />
          <Meta label="Provider" value={result.provider} />
          {result.cost_usd != null && <Meta label="Cost" value={`$${result.cost_usd.toFixed(5)}`} />}
          <Meta label="Latency" value={`${result.duration_ms.toFixed(0)} ms`} />
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return <span>{label}: <span className="font-medium" style={{ color: "var(--text-2)" }}>{value}</span></span>;
}

// ══════════════════════════════════════════════════════════════════════════════
// WORKSPACES (tenants)
// ══════════════════════════════════════════════════════════════════════════════
function TenantsView({ tenant, onChange }: { tenant: string; onChange: (t: string) => void }) {
  const [info,    setInfo]    = useState<{ namespace: string; doc_count: number; vector_count: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [draft,   setDraft]   = useState(tenant);

  async function load(ns: string) { setLoading(true); setInfo(await getTenantInfo(ns)); setLoading(false); }
  useEffect(() => { load(tenant); }, [tenant]);

  function onSwitch() { const ns = draft.trim() || "acme"; onChange(ns); load(ns); }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="card lg:col-span-2">
        <div className="card-header">
          <div>
            <div className="card-title">Active workspace</div>
            <div className="card-subtitle">All queries and uploads are scoped to this namespace</div>
          </div>
        </div>
        <div className="card-body space-y-5">
          <div>
            <label className="label">Workspace ID</label>
            <div className="flex gap-2">
              <input className="input flex-1" value={draft} onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") onSwitch(); }} placeholder="namespace" />
              <button onClick={onSwitch} className="btn btn-primary">Switch</button>
            </div>
          </div>

          {loading && <div className="flex justify-center py-4"><span className="spinner" /></div>}
          {info && !loading && (
            <div className="grid grid-cols-3 overflow-hidden rounded-lg" style={{ border: "1px solid var(--border)" }}>
              {[
                { label: "Namespace", val: info.namespace },
                { label: "Documents", val: info.doc_count ?? "—" },
                { label: "Vectors",   val: info.vector_count ?? "—" },
              ].map(({ label, val }, i) => (
                <div key={label} className="px-4 py-4" style={{ borderLeft: i > 0 ? "1px solid var(--border)" : undefined, background: "var(--surface-2)" }}>
                  <div className="text-xs text-muted">{label}</div>
                  <div className="mt-1 truncate text-xl font-bold tracking-tight tabular-nums" style={{ color: "var(--text)" }}>{typeof val === "number" ? <CountUp value={String(val)} /> : val}</div>
                </div>
              ))}
            </div>
          )}
          {!info && !loading && <p className="text-sm text-muted">No information available — index a document first.</p>}
        </div>
      </div>

      <InfoCard title="About workspaces" items={[
        "Each workspace maps to an isolated vector namespace.",
        "Queries only search within the active workspace.",
        "Use separate workspaces to segregate business units or projects.",
        "Row-level security is enforced by the backend.",
      ]} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// USAGE & BILLING
// ══════════════════════════════════════════════════════════════════════════════
function CostView() {
  const [pricing, setPricing] = useState<{ pricing: Record<string, { input_per_1k: number; output_per_1k: number }> } | null>(null);
  const [budgets, setBudgets] = useState<{ budgets: Record<string, BudgetEntry> } | null>(null);
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    Promise.allSettled([getCostPricing(), getCostBudgets(), getCostSummary()])
      .then(([p, b, s]) => {
        if (p.status === "fulfilled") setPricing(p.value);
        if (b.status === "fulfilled") setBudgets(b.value);
        if (s.status === "fulfilled") setSummary(s.value);
        if (p.status === "rejected")  setError("Could not load cost data — is the backend running?");
      }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><span className="spinner spinner-lg" /></div>;

  const hasUsage = !!summary && summary.total_requests > 0;

  return (
    <div className="space-y-6">
      {error && <ErrorBanner msg={error} />}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon="activity" label="Total requests" value={hasUsage ? String(summary!.total_requests) : "0"} />
        <StatCard icon="dollar"   label="Total cost"     value={hasUsage ? `$${summary!.total_cost.toFixed(5)}` : "$0.00"} />
        <StatCard icon="zap"      label="Cache hits"     value={hasUsage ? String(summary!.cached_requests) : "0"} />
        <StatCard icon="barChart" label="Cache hit rate" value={hasUsage ? `${(summary!.cache_hit_rate * 100).toFixed(0)}%` : "—"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Budgets</div>
              <div className="card-subtitle">Spend against configured limits</div>
            </div>
          </div>
          <div className="card-body">
            {!budgets || Object.keys(budgets.budgets).length === 0
              ? <p className="text-sm text-muted">No budgets configured. Create one with <code className="text-xs">POST /cost/budgets</code>.</p>
              : <div className="space-y-5">
                  {Object.entries(budgets.budgets).map(([key, b]) => {
                    const pct = b.limit > 0 ? Math.min(100, (b.spent / b.limit) * 100) : 0;
                    return (
                      <div key={key}>
                        <div className="mb-1.5 flex justify-between text-sm">
                          <span className="font-mono font-medium" style={{ color: "var(--text)" }}>{key}</span>
                          <span className="text-muted">${b.spent.toFixed(4)} of ${b.limit.toFixed(4)}</span>
                        </div>
                        <div className="progress">
                          <div style={{ width: `${pct}%`, background: pct > 80 ? "var(--danger)" : pct > 50 ? "var(--warning)" : "var(--primary)" }} />
                        </div>
                        <div className="mt-1.5 text-xs text-muted">{b.requests} requests · {b.rejected} rejected</div>
                      </div>
                    );
                  })}
                </div>
            }
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Cost by model</div>
              <div className="card-subtitle">Accumulated spend per provider model</div>
            </div>
          </div>
          {!hasUsage || Object.keys(summary!.by_model).length === 0
            ? <p className="card-body text-sm text-muted">No usage recorded yet — ask a question first.</p>
            : (
              <table className="table">
                <thead><tr><th>Model</th><th style={{ textAlign: "right" }}>Cost</th></tr></thead>
                <tbody>
                  {Object.entries(summary!.by_model).map(([model, cost]) => (
                    <tr key={model}>
                      <td className="font-mono" style={{ color: "var(--text)" }}>{model || "—"}</td>
                      <td style={{ textAlign: "right" }}>${(cost as number).toFixed(5)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>

      {pricing && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Model pricing</div>
              <div className="card-subtitle">USD per 1,000 tokens</div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Model</th><th style={{ textAlign: "right" }}>Input</th><th style={{ textAlign: "right" }}>Output</th></tr></thead>
              <tbody>
                {Object.entries(pricing.pricing).map(([model, data]) => (
                  <tr key={model}>
                    <td className="font-mono" style={{ color: "var(--text)" }}>{model}</td>
                    <td style={{ textAlign: "right" }}>${data.input_per_1k.toFixed(4)}</td>
                    <td style={{ textAlign: "right" }}>${data.output_per_1k.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECURITY
// ══════════════════════════════════════════════════════════════════════════════
function SecurityView() {
  const [keys,       setKeys]       = useState<ApiKeyRecord[]>([]);
  const [events,     setEvents]     = useState<AuditEvent[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [created,    setCreated]    = useState<{ key: string; warning: string } | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [creating,   setCreating]   = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [k, e] = await Promise.allSettled([getSecurityApiKeys(), getAuditEvents()]);
    if (k.status === "fulfilled") setKeys(k.value.keys);
    if (e.status === "fulfilled") setEvents(e.value.events);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function onCreate() {
    if (!newKeyName.trim()) return;
    setCreating(true); setError(null); setCreated(null);
    try { const r = await createSecurityApiKey(newKeyName.trim()); setCreated({ key: r.key, warning: r.warning }); setNewKeyName(""); load(); }
    catch (e) { setError(String(e)); }
    finally { setCreating(false); }
  }

  async function onRevoke(id: string) { await revokeSecurityApiKey(id).catch(() => null); load(); }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">API keys</div>
            <div className="card-subtitle">Credentials for programmatic access to this deployment</div>
          </div>
        </div>
        <div className="card-body pb-4">
          {created && (
            <div className="alert alert-info flex-col">
              <span className="font-medium">{created.warning}</span>
              <code className="block w-full select-all break-all rounded px-2 py-1.5 text-xs"
                style={{ background: "var(--surface)", border: "1px solid var(--primary-border)", color: "var(--text)" }}>
                {created.key}
              </code>
            </div>
          )}
          {error && <ErrorBanner msg={error} />}
          <div className="flex gap-2">
            <input className="input flex-1" value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
              placeholder="Key name, e.g. production-app"
              onKeyDown={e => { if (e.key === "Enter") onCreate(); }} />
            <button onClick={onCreate} disabled={creating || !newKeyName.trim()} className="btn btn-primary">
              <Icon name="plus" size={15} />{creating ? "Creating…" : "Create key"}
            </button>
          </div>
        </div>
        {loading ? <div className="flex justify-center py-6"><span className="spinner" /></div>
          : keys.length === 0 ? <p className="px-5 pb-5 text-sm text-muted">No API keys have been created.</p>
          : (
            <div className="overflow-x-auto" style={{ borderTop: "1px solid var(--border)" }}>
              <table className="table">
                <thead>
                  <tr><th>Name</th><th>Prefix</th><th>Uses</th><th>Status</th><th>Created</th><th /></tr>
                </thead>
                <tbody>
                  {keys.map(k => (
                    <tr key={k.id}>
                      <td className="font-medium" style={{ color: "var(--text)" }}>{k.name}</td>
                      <td className="font-mono">{k.prefix}…</td>
                      <td>{k.usage_count}</td>
                      <td>
                        <span className={`badge ${k.revoked ? "badge-danger" : "badge-success"}`}>
                          <span className="dot" />{k.revoked ? "Revoked" : "Active"}
                        </span>
                      </td>
                      <td>{new Date(k.created_at).toLocaleDateString()}</td>
                      <td style={{ textAlign: "right" }}>
                        {!k.revoked && <button onClick={() => onRevoke(k.id)} className="btn btn-danger-ghost btn-sm">Revoke</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Audit log</div>
            <div className="card-subtitle">Security-relevant events recorded by the platform</div>
          </div>
          <button onClick={load} className="btn btn-secondary btn-sm"><Icon name="refresh" size={13} />Refresh</button>
        </div>
        {events.length === 0 ? <p className="card-body text-sm text-muted">No events recorded yet.</p>
          : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Resource</th></tr></thead>
                <tbody>
                  {events.map(e => (
                    <tr key={e.id}>
                      <td className="whitespace-nowrap">{new Date(e.timestamp).toLocaleTimeString()}</td>
                      <td className="max-w-[140px] truncate font-mono">{e.user_id.slice(0, 12)}</td>
                      <td><span className="badge badge-mono">{e.action}</span></td>
                      <td className="max-w-[220px] truncate">{e.resource}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FEEDBACK
// ══════════════════════════════════════════════════════════════════════════════
function FeedbackView() {
  const [records,    setRecords]    = useState<FeedbackRecord[]>([]);
  const [stats,      setStats]      = useState<FeedbackStats | null>(null);
  const [query,      setQuery]      = useState("");
  const [rating,     setRating]     = useState(5);
  const [comment,    setComment]    = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  async function load() {
    const [r, s] = await Promise.allSettled([getFeedback(), getFeedbackStats()]);
    if (r.status === "fulfilled") setRecords(r.value.feedback ?? []);
    if (s.status === "fulfilled") setStats(s.value);
  }
  useEffect(() => { load(); }, []);

  async function onSubmit() {
    setError(null); setSubmitting(true); setSubmitted(false);
    try {
      await submitFeedback({ query_id: `ui-${Date.now()}`, rating, comment: comment.trim(), query: query.trim() });
      setSubmitted(true); setQuery(""); setComment(""); setRating(5); load();
    } catch (e) { setError(String(e)); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-6 lg:col-span-2">
        {stats && (
          <div className="grid grid-cols-2 gap-4">
            <StatCard icon="message" label="Responses" value={String(stats.count)} />
            <StatCard icon="star" label="Average rating"
              value={stats.average_rating != null ? `${stats.average_rating.toFixed(1)} / 5` : "—"}
              tone={stats.average_rating != null ? (stats.average_rating >= 4 ? "success" : "warning") : undefined} />
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Submit feedback</div>
              <div className="card-subtitle">Ratings improve ranking and A/B experiments</div>
            </div>
          </div>
          <div className="card-body space-y-4">
            {error     && <ErrorBanner msg={error} />}
            {submitted && <SuccessBanner msg="Feedback submitted. Thank you." />}
            <div>
              <label className="label">Query <span className="font-normal text-muted">(optional)</span></label>
              <input className="input" value={query} onChange={e => setQuery(e.target.value)} placeholder="What did you ask?" />
            </div>
            <div>
              <label className="label">Rating</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    className="rounded-lg p-1 transition-all duration-200 hover:scale-125 hover:bg-[var(--surface-3)]"
                    style={{ color: rating >= n ? "#F59E0B" : "var(--border-strong)", filter: rating >= n ? "drop-shadow(0 0 6px rgba(245,158,11,0.55))" : undefined }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                ))}
                <span className="ml-2 text-sm text-muted">{rating} of 5</span>
              </div>
            </div>
            <div>
              <label className="label">Comment <span className="font-normal text-muted">(optional)</span></label>
              <textarea className="input" value={comment} onChange={e => setComment(e.target.value)} rows={3} />
            </div>
          </div>
          <div className="card-footer justify-end">
            <button onClick={onSubmit} disabled={submitting} className="btn btn-primary">{submitting ? "Submitting…" : "Submit feedback"}</button>
          </div>
        </div>
      </div>

      <div className="card self-start lg:col-span-3">
        <div className="card-header">
          <div>
            <div className="card-title">Recent feedback</div>
            <div className="card-subtitle">Latest ratings submitted by users</div>
          </div>
          <button onClick={load} className="btn btn-secondary btn-sm"><Icon name="refresh" size={13} />Refresh</button>
        </div>
        {records.length === 0 ? (
          <EmptyState icon="star" title="No feedback yet" desc="Submitted ratings will appear here." />
        ) : (
          <ul>
            {records.map((r, i) => (
              <li key={r.id} className="px-5 py-4" style={{ borderBottom: i < records.length - 1 ? "1px solid var(--border)" : undefined }}>
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <svg key={n} width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"
                        style={{ color: r.rating >= n ? "#F59E0B" : "var(--border-strong)" }}>
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs text-muted">{new Date(r.timestamp).toLocaleDateString()}</span>
                </div>
                {r.query   && <p className="mt-2 text-sm font-medium" style={{ color: "var(--text)" }}>{r.query}</p>}
                {r.comment && <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PERSONALIZATION
// ══════════════════════════════════════════════════════════════════════════════
function PersonalizationView({ userId }: { userId: string }) {
  const [interests,     setInterests]     = useState("");
  const [disinterests,  setDisinterests]  = useState("");
  const [docTypes,      setDocTypes]      = useState<string[]>([]);
  const [preferRecent,  setPreferRecent]  = useState(false);
  const [recencyWeight, setRecencyWeight] = useState(0.3);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  useEffect(() => {
    getProfile(userId).then(p => {
      setInterests(p.content.interests.join(", "));
      setDisinterests(p.content.disinterests.join(", "));
      setDocTypes(p.content.preferred_doc_types);
      setPreferRecent(p.content.prefer_recent);
      setRecencyWeight(p.content.recency_weight);
    }).catch(() => {});
  }, [userId]);

  async function onSave() {
    setError(null); setSaving(true); setSaved(false);
    try {
      await upsertProfile({
        user_id: userId,
        interests: interests.split(",").map(s => s.trim()).filter(Boolean),
        disinterests: disinterests.split(",").map(s => s.trim()).filter(Boolean),
        preferred_doc_types: docTypes, prefer_recent: preferRecent, recency_weight: recencyWeight,
      });
      setSaved(true);
    } catch (e) { setError(String(e)); }
    finally { setSaving(false); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="card lg:col-span-2">
        <div className="card-header">
          <div>
            <div className="card-title">Search preferences</div>
            <div className="card-subtitle">Tune how results are ranked for your account</div>
          </div>
        </div>
        <div className="card-body space-y-5">
          {error && <ErrorBanner msg={error} />}
          {saved && <SuccessBanner msg="Preferences saved. They will apply to your next query." />}

          {[
            { label: "Interests",    val: interests,    set: setInterests,    ph: "technology, security, finance", hint: "Matching documents receive a +0.15 score boost." },
            { label: "Disinterests", val: disinterests, set: setDisinterests, ph: "marketing, legal",              hint: "Matching documents receive a −0.40 score penalty." },
          ].map(({ label, val, set, ph, hint }) => (
            <div key={label}>
              <label className="label">{label} <span className="font-normal text-muted">(comma-separated)</span></label>
              <input className="input" value={val} onChange={e => set(e.target.value)} placeholder={ph} />
              <p className="help">{hint}</p>
            </div>
          ))}

          <div>
            <label className="label">Preferred document types</label>
            <div className="flex flex-wrap gap-2">
              {["pdf", "docx", "txt", "md", "html"].map(t => {
                const on = docTypes.includes(t);
                return (
                  <button key={t} onClick={() => setDocTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                    className={`btn btn-sm ${on ? "" : "btn-secondary"}`}
                    style={on ? { background: "var(--primary-soft)", color: "var(--primary)", borderColor: "var(--primary-border)" } : undefined}>
                    {on && <Icon name="check" size={12} strokeWidth={3} />}.{t}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg px-4 py-3" style={{ border: "1px solid var(--border)" }}>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Prefer recent documents</p>
              <p className="text-xs text-muted">Score decays linearly over a two-year window.</p>
            </div>
            <button role="switch" aria-checked={preferRecent} onClick={() => setPreferRecent(p => !p)} className="switch" aria-label="Prefer recent documents" />
          </div>

          {preferRecent && (
            <div>
              <label className="label">Recency weight: <span style={{ color: "var(--primary)" }}>{recencyWeight.toFixed(2)}</span></label>
              <input type="range" min={0.05} max={0.5} step={0.05} value={recencyWeight}
                onChange={e => setRecencyWeight(parseFloat(e.target.value))}
                className="w-full" style={{ accentColor: "var(--primary)" }} />
              <div className="mt-1 flex justify-between text-xs text-muted">
                <span>Subtle (0.05)</span><span>Strong (0.50)</span>
              </div>
            </div>
          )}
        </div>
        <div className="card-footer justify-end">
          <button onClick={onSave} disabled={saving} className="btn btn-primary">{saving ? "Saving…" : "Save preferences"}</button>
        </div>
      </div>

      <InfoCard title="How personalization works" items={[
        "Applied after retrieval — results are re-ranked, not filtered.",
        "Interest boost: +0.15 per matching topic keyword.",
        "Disinterest penalty: −0.40 per matching keyword.",
        "Recency boost: weight × (1 − age_days / 730).",
        "Preferred document types add +0.10.",
      ]} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════════════════════════════════════
function SettingsView({
  tab, onTab, tenant, onTenantChange, userId,
}: {
  tab: SettingsTab;
  onTab: (t: SettingsTab) => void;
  tenant: string;
  onTenantChange: (t: string) => void;
  userId: string;
}) {
  return (
    <div className="space-y-6">
      <div className="tabs">
        {SETTINGS_TABS.map(({ id, label, icon }) => (
          <button key={id} onClick={() => onTab(id)} className={`tab inline-flex items-center gap-2${tab === id ? " active" : ""}`}>
            <Icon name={icon} size={15} />{label}
          </button>
        ))}
      </div>

      <div key={tab} className="rise">
        {tab === "tenants"         && <TenantsView tenant={tenant} onChange={onTenantChange} />}
        {tab === "cost"            && <CostView />}
        {tab === "security"        && <SecurityView />}
        {tab === "feedback"        && <FeedbackView />}
        {tab === "personalization" && <PersonalizationView userId={userId} />}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════
type Tone = "success" | "warning" | "danger";
const TONE_COLOR: Record<Tone, string> = { success: "var(--success)", warning: "var(--warning)", danger: "var(--danger)" };

function StatCard({ icon, label, value, sub, tone, delay = 0 }: { icon: IconName; label: string; value: string; sub?: string; tone?: Tone; delay?: number }) {
  return (
    <div className="card lift rise overflow-hidden px-5 py-5" style={{ "--d": `${delay}ms` } as React.CSSProperties}>
      <div className="flex items-start justify-between">
        <span className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text)" }}>
          <Icon name={icon} size={15} style={{ color: "var(--text-3)" }} />{label}
        </span>
        <Icon name="arrowRight" size={14} className="-rotate-45 text-dim" />
      </div>
      <div className="my-4 text-4xl font-light tracking-tight tabular-nums" style={{ color: tone ? TONE_COLOR[tone] : "var(--text)" }}>
        <CountUp value={value} />
      </div>
      <div className={`hatch ${tone === "success" ? "hatch-success" : tone === "danger" ? "hatch-danger" : ""} h-7 rounded-lg`} />
      {sub && <div className="mt-2.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}

function InfoCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="card self-start overflow-hidden">
      <div className="card-header" style={{ background: "var(--grad-soft)" }}>
        <div className="card-title flex items-center gap-2"><span className="icon-chip h-7 w-7"><Icon name="info" size={14} /></span>{title}</div>
      </div>
      <ul className="card-body space-y-3">
        {items.map((t, i) => (
          <li key={t} className="rise flex gap-2.5 text-sm" style={{ color: "var(--text-2)", "--d": `${i * 60}ms` } as React.CSSProperties}>
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--success-soft)", color: "var(--success)" }}>
              <Icon name="check" size={11} strokeWidth={3} />
            </span>{t}
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyState({ icon, title, desc }: { icon: IconName; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <span className="icon-chip float mb-1 h-12 w-12 rounded-2xl">
        <Icon name={icon} size={20} />
      </span>
      <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{title}</p>
      <p className="max-w-xs text-sm text-muted">{desc}</p>
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return <div className="alert alert-danger" role="alert"><Icon name="alert" size={15} /><span>{msg}</span></div>;
}

function SuccessBanner({ msg }: { msg: string }) {
  return <div className="alert alert-success" role="status"><Icon name="checkCircle" size={15} /><span>{msg}</span></div>;
}

function FullPageSpinner() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <span className="float"><BrandMark size={48} /></span>
      <span className="spinner" />
    </div>
  );
}
