"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AskResult, ExecutionStatus, IndexResult, ApiKeyRecord, AuditEvent,
  FeedbackRecord, FeedbackStats, BudgetEntry, CostSummary,
  askQuestion, indexDocument, pollExecution, uploadDocument, getHealth,
  getCostPricing, getCostBudgets, getCostSummary, getSecurityApiKeys,
  createSecurityApiKey, revokeSecurityApiKey, getAuditEvents, getFeedback,
  getFeedbackStats, submitFeedback, getProfile, upsertProfile, getTenantInfo,
} from "@/lib/api";
import { signOut, getSession, userFromSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";

type View = "dashboard" | "ask" | "docs" | "settings";
type SettingsTab = "tenants" | "cost" | "security" | "feedback" | "personalization";
interface ChatEntry { question: string; result: AskResult; ts: number }

const NAV: { id: View; label: string; icon: string; desc: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "▦",  desc: "System overview & health"    },
  { id: "ask",       label: "Ask",       icon: "◎",  desc: "Query your knowledge base"   },
  { id: "docs",      label: "Docs",      icon: "◫",  desc: "Upload & index documents"    },
  { id: "settings",  label: "Settings",  icon: "◈",  desc: "Tenants, cost, security & more" },
];

const SETTINGS_TABS: { id: SettingsTab; label: string }[] = [
  { id: "tenants",         label: "Tenants"         },
  { id: "cost",            label: "Cost & Usage"    },
  { id: "security",        label: "Security"        },
  { id: "feedback",        label: "Feedback"        },
  { id: "personalization", label: "Personalization" },
];

const PIPELINE_STEPS = [
  { id: "validate", label: "Validate" }, { id: "extract", label: "Extract" },
  { id: "chunk",    label: "Chunk"    }, { id: "embed",   label: "Embed"   },
  { id: "index",    label: "Index"    }, { id: "save",    label: "Save"    },
  { id: "done",     label: "Done"     },
];

const SAMPLE_DOC = `# Company Handbook\n\n## Security Policy\nAll data is encrypted at rest and in transit using AES-256.\nEmployees must use MFA for all critical systems.\n\n## Billing\nInvoices are issued monthly. Payment is due within 30 days.\nLate payments incur a 2% monthly interest charge.\n\n## Support\nContact support 24/7 via the help portal for any issues.\nResponse time: P1 < 1 hour, P2 < 4 hours, P3 < 24 hours.`;

// ── Design tokens ──────────────────────────────────────────────────────────────
const T = {
  bgBase:      "var(--bg-base)",
  bgSurface:   "var(--bg-surface)",
  bgCard:      "var(--bg-card)",
  bgInput:     "var(--bg-input)",
  border:      "var(--border)",
  borderMid:   "var(--border-mid)",
  royal:       "var(--royal)",
  royalHover:  "var(--royal-hover)",
  royalGlow:   "var(--royal-glow)",
  sky:         "var(--sky)",
  skyDim:      "var(--sky-dim)",
  skyBorder:   "var(--sky-border)",
  magenta:     "var(--magenta)",
  magentaDim:  "var(--magenta-dim)",
  magentaBorder: "var(--magenta-border)",
  textPri:     "var(--text-pri)",
  textSec:     "var(--text-sec)",
  textMuted:   "var(--text-muted)",
  textDim:     "var(--text-dim)",
  green:       "var(--green)",
  amber:       "var(--amber)",
  // claymorphism – soft puffy dual shadows (light highlight + dark depth)
  clayRaised:    "var(--clay-raised)",
  clayRaisedSm:  "var(--clay-raised-sm)",
  clayRaisedHov: "var(--clay-raised-hov)",
  clayPressed:   "var(--clay-pressed)",
  clayPressedSm: "var(--clay-pressed-sm)",
};

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

  if (!ready) return <Spinner />;

  const effectiveTenant = tenant.trim() || "acme";
  const currentNav = NAV.find(n => n.id === view)!;

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: T.bgBase, color: T.textPri }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="flex w-56 shrink-0 flex-col" style={{ backgroundColor: T.bgSurface, borderRight: `1px solid ${T.border}` }}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-3.5" style={{ borderBottom: `1px solid ${T.border}` }}>
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-xs font-black text-white"
            style={{ background: `linear-gradient(135deg, ${T.royal}, ${T.magenta}, ${T.sky})`, boxShadow: `0 2px 14px ${T.royalGlow}, ${T.clayRaisedSm}` }}
          >
            R
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold" style={{ color: T.textPri }}>Enterprise RAG</div>
            <div className="truncate text-xs" style={{ color: T.textMuted }}>ns: {effectiveTenant}</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className="group flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left transition-all"
              style={view === item.id
                ? { backgroundColor: T.skyDim, color: T.sky, boxShadow: T.clayRaisedSm }
                : { color: T.textMuted }}
              onMouseEnter={e => { if (view !== item.id) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(var(--royal-rgb),0.12)"; (e.currentTarget as HTMLElement).style.color = T.textPri; }}
              onMouseLeave={e => { if (view !== item.id) { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLElement).style.color = T.textMuted; } }}
            >
              <span className="shrink-0 text-lg leading-none transition-transform group-hover:scale-110">{item.icon}</span>
              <span className="truncate text-sm font-semibold">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-3" style={{ borderTop: `1px solid ${T.border}` }}>
          {userName && (
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{ backgroundColor: T.royal, color: "#fff" }}>
                {userName[0]?.toUpperCase()}
              </div>
              <span className="truncate text-xs" style={{ color: T.textMuted }}>{userName}</span>
            </div>
          )}
          <button
            onClick={async () => { await signOut(); router.replace("/login"); }}
            className="w-full rounded-2xl py-1.5 text-sm font-medium transition"
            style={{ backgroundColor: T.bgSurface, boxShadow: T.clayRaisedSm, color: T.textMuted }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = T.textPri; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T.textMuted; }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Content area ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Top bar */}
        <header className="flex shrink-0 items-center justify-between px-6 py-3 backdrop-blur"
          style={{ borderBottom: `1px solid ${T.border}`, backgroundColor: "rgba(var(--bg-base-rgb),0.90)" }}>
          <div>
            <h1 className="text-xl font-bold" style={{ color: T.textPri }}>{currentNav.label}</h1>
            <p className="text-sm" style={{ color: T.textMuted }}>{currentNav.desc}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full px-3.5 py-1.5"
              style={{ backgroundColor: T.bgCard, boxShadow: T.clayRaisedSm }}>
              <span className="h-2 w-2 rounded-full"
                style={{ backgroundColor: health?.status === "ok" ? T.green : health ? "#e74c3c" : T.textDim }} />
              <span className="text-sm font-medium"
                style={{ color: health?.status === "ok" ? T.green : health ? "#ff7675" : T.textMuted }}>
                {health === null ? "Connecting…" : health.status === "ok" ? "API Online" : "API Offline"}
              </span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          {view === "dashboard" && <DashboardView health={health} />}
          {view === "ask"       && <AskView tenant={effectiveTenant} />}
          {view === "docs"      && <KnowledgeView tenant={effectiveTenant} />}
          {view === "settings"  && (
            <SettingsView
              tab={settingsTab}
              onTab={setSettingsTab}
              tenant={effectiveTenant}
              onTenantChange={setTenant}
              userId={userId}
            />
          )}
        </main>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function DashboardView({ health }: { health: { status: string; version: string } | null }) {
  const features: [string, string, string][] = [
    ["Orchestration Engine",  "DAG execution, branching, streaming",     "F1–F8"],
    ["Document Ingestion",    "PDF, DOCX, TXT, MD, HTML, PPTX, XLSX",   "F9"   ],
    ["Smart Chunking",        "Heading, sentence, overlap strategies",    "F10"  ],
    ["Embeddings",            "Hash + Sentence Transformer (MiniLM)",     "F11"  ],
    ["Vector Storage",        "NumPy cosine FLAT index, CRUD",            "F12"  ],
    ["Hybrid Search",         "BM25 + vector + Reciprocal Rank Fusion",  "F13"  ],
    ["Re-Ranking",            "Cross-encoder quality scoring",            "F14"  ],
    ["Context Assembly",      "Citation extraction & augmentation",       "F15"  ],
    ["LLM Generation",        "Gemini (free) / offline extractive",       "F16"  ],
    ["Query Cache",           "Semantic dedup, 80%+ savings",             "F17"  ],
    ["Knowledge Graph",       "Entity & relationship extraction",         "F18"  ],
    ["Multi-Tenancy",         "Namespace isolation, RBAC",                "F19"  ],
    ["Monitoring",            "Prometheus metrics, OpenTelemetry traces", "F20"  ],
    ["Resilience",            "Circuit breaker, retry, timeout",          "F21"  ],
    ["Personalization",       "Interest/recency ranking boosts",          "F22"  ],
    ["Feedback Loop",         "1-5 star ratings, A/B testing",            "F23"  ],
    ["Cost Optimization",     "Budget guards, model recommender",         "F24"  ],
    ["Security & Compliance", "AES-256, GDPR rights, audit log",          "F25"  ],
  ];

  const online = health?.status === "ok";
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="API Status" value={health === null ? "…" : online ? "Online" : "Offline"} sub={health?.version ? `v${health.version}` : "connecting…"} accent={health === null ? T.textMuted : online ? T.green : "#e74c3c"} />
        <StatCard label="Features"   value="25"   sub="F1 – F25 complete"   accent={T.sky}   />
        <StatCard label="Test Suite" value="867"  sub="all tests passing"    accent={T.magenta} />
        <StatCard label="Paid APIs"  value="None" sub="offline-first design" accent={T.amber} />
      </div>

      <div>
        <SectionLabel>Active Features</SectionLabel>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {features.map(([name, desc, tag]) => (
            <div key={name} className="rounded-[22px] p-3 transition-all duration-200"
              style={{
                background: T.bgCard,
                boxShadow: T.clayRaisedSm,
                position: "relative", overflow: "hidden",
                cursor: "default",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(-2px)";
                el.style.boxShadow = `${T.clayRaisedHov}, 0 0 0 1px rgba(var(--sky-rgb),0.25)`;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(0)";
                el.style.boxShadow = T.clayRaisedSm;
              }}
            >
              <div style={{
                position: "absolute", left: 0, top: "18%", bottom: "18%", width: "2px",
                background: `linear-gradient(180deg, transparent, ${T.royal}, transparent)`,
                borderRadius: "1px",
              }} />
              <div className="min-w-0 pl-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-semibold" style={{ color: T.textPri }}>{name}</span>
                  <span className="rounded-full px-1.5 py-0.5 font-mono text-xs font-bold"
                    style={{ backgroundColor: T.skyDim, color: T.sky, border: `1px solid ${T.skyBorder}` }}>{tag}</span>
                </div>
                <div className="mt-1 text-xs leading-relaxed" style={{ color: T.textMuted }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] p-5" style={{
        background: "var(--quickstart-gradient)",
        boxShadow: `${T.clayRaised}, inset 0 1px 0 rgba(255,255,255,0.6)`,
      }}>
        <div className="mb-3 flex items-center gap-2">
          <span style={{ color: T.sky, fontSize: "16px" }}>◎</span>
          <span className="text-sm font-bold uppercase tracking-wider" style={{ color: T.sky }}>Quick Start</span>
        </div>
        <ol className="space-y-2.5" style={{ color: T.textMuted, listStyle: "none", padding: 0, margin: 0 }}>
          {[
            ["Docs",     "upload or paste a document to index it"],
            ["Ask",      "type a question and get a cited answer"],
            ["Settings", "track spend, manage API keys, view audit log"],
            ["Settings → Personalization", "rate answers, tune ranking preferences"],
          ].map(([title, desc], i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{ background: `linear-gradient(135deg, ${T.royal}, ${T.magenta})`, color: "white", boxShadow: T.clayRaisedSm }}>{i + 1}</span>
              <span><strong style={{ color: T.textPri }}>{title}</strong> — {desc}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// KNOWLEDGE
// ══════════════════════════════════════════════════════════════════════════════
function KnowledgeView({ tenant }: { tenant: string }) {
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
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold" style={{ color: T.textPri }}>Add Document</h2>
          <div className="flex rounded-2xl p-1" style={{ backgroundColor: T.bgInput, boxShadow: T.clayPressedSm }}>
            {(["file", "text"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} className="rounded-xl px-3 py-1 text-xs font-medium transition"
                style={mode === m ? { background: `linear-gradient(135deg, ${T.royal}, ${T.royalHover})`, color: "#fff", boxShadow: T.clayRaisedSm } : { color: T.textMuted }}>
                {m === "file" ? "Upload file" : "Paste text"}
              </button>
            ))}
          </div>
        </div>
        {error && <ErrorBanner msg={error} />}

        {mode === "file" ? (
          <div className="space-y-3">
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) { setFile(f); setExecution(null); } }}
              onClick={() => fileRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-10 text-center transition"
              style={{ borderColor: dragging ? T.sky : T.borderMid, backgroundColor: dragging ? T.skyDim : "transparent" }}
            >
              <input ref={fileRef} type="file" className="hidden"
                accept=".txt,.md,.pdf,.docx,.html,.json,.pptx,.xlsx"
                onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setExecution(null); } }} />
              <div className="text-4xl" style={{ color: T.textDim }}>↑</div>
              <p className="text-sm font-medium" style={{ color: T.textPri }}>Drop file or click to browse</p>
              <p className="text-xs" style={{ color: T.textMuted }}>PDF · DOCX · TXT · MD · HTML · JSON · PPTX · XLSX</p>
            </div>
            {file && (
              <div className="flex items-center justify-between rounded-lg px-3 py-2"
                style={{ backgroundColor: T.bgInput, boxShadow: T.clayPressedSm }}>
                <span className="truncate text-sm" style={{ color: T.textPri }}>{file.name}</span>
                <button onClick={() => { setFile(null); setExecution(null); }} className="ml-2 shrink-0 transition" style={{ color: T.textMuted }}>✕</button>
              </div>
            )}
            <BlueButton onClick={onUpload} disabled={!file || uploading}>{uploading ? "Processing…" : "Upload & Index"}</BlueButton>
          </div>
        ) : (
          <div className="space-y-3">
            <StyledInput value={filename} onChange={e => setFilename(e.target.value)} placeholder="filename (e.g. handbook.md)" />
            <textarea value={docText} onChange={e => setDocText(e.target.value)} rows={10}
              className="w-full resize-y rounded-lg px-3 py-2 font-mono text-xs outline-none transition"
              style={{ backgroundColor: T.bgInput, boxShadow: T.clayPressedSm, color: T.textSec }}
              onFocus={e => (e.currentTarget.style.boxShadow = `${T.clayPressedSm}, 0 0 0 2px ${T.skyBorder}`)}
              onBlur={e => (e.currentTarget.style.boxShadow = T.clayPressedSm)} />
            <BlueButton onClick={onIndex} disabled={indexing || !docText.trim()}>{indexing ? "Indexing…" : "Index document"}</BlueButton>
            {indexResult && <SuccessBanner msg={`${indexResult.upserted} chunks indexed into "${indexResult.namespace}"`} />}
          </div>
        )}
      </Panel>

      <Panel>
        <h2 className="mb-4 text-sm font-semibold" style={{ color: T.textPri }}>Pipeline Status</h2>
        {!execution && !done && (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-center" style={{ color: T.textDim }}>
            <div className="text-4xl">◫</div>
            <p className="text-sm">Upload or index a document to see the pipeline run.</p>
          </div>
        )}
        {execution && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs" style={{ color: T.textMuted }}>
                <span>{execution.message}</span><span>{execution.progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: T.border }}>
                <div className="h-2 rounded-full transition-all duration-500"
                  style={{ width: `${execution.progress}%`, backgroundColor: execution.status === "failed" ? "#e74c3c" : execution.status === "completed" ? T.green : T.royal }} />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {PIPELINE_STEPS.map((s, i) => {
                const cur = stepIdx(execution.step);
                const isDone = execution.status === "completed" || i < cur;
                const isActive = i === cur && execution.status === "running";
                return (
                  <div key={s.id} className="flex items-center gap-1">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-xs font-mono" style={{ color: isDone ? T.green : isActive ? T.sky : T.textDim }}>
                        {isDone ? "✓" : isActive ? "●" : "○"}
                      </span>
                      <span className="text-xs" style={{ color: isActive ? T.sky : isDone ? T.textMuted : T.textDim }}>{s.label}</span>
                    </div>
                    {i < PIPELINE_STEPS.length - 1 && (
                      <div className="mb-3 h-px w-3 shrink-0"
                        style={{ backgroundColor: (i < cur || execution.status === "completed") ? T.green : T.border }} />
                    )}
                  </div>
                );
              })}
            </div>
            {execution.status === "completed" && <SuccessBanner msg={`Done — ${execution.chunks_indexed ?? ""} chunks indexed into "${execution.tenant}".`} />}
            {execution.status === "failed"    && <ErrorBanner msg={execution.message} />}
          </div>
        )}
        {done && !execution && (
          <div className="rounded-lg p-4 text-xs" style={{ backgroundColor: T.bgInput, boxShadow: T.clayPressedSm }}>
            <div className="mb-1 font-semibold" style={{ color: T.textPri }}>Namespace:</div>
            <code style={{ color: T.sky }}>{tenant}</code>
            <div className="mt-2" style={{ color: T.textMuted }}>Switch to <strong>Ask AI</strong> to query this content.</div>
          </div>
        )}
      </Panel>
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

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-3">
        <Panel>
          <h2 className="mb-1 text-sm font-semibold" style={{ color: T.textPri }}>Ask a question</h2>
          <p className="mb-3 text-xs" style={{ color: T.textMuted }}>
            Namespace <span className="font-mono" style={{ color: T.sky }}>{tenant}</span> · press ⌘↵ to submit
          </p>
          {error && <ErrorBanner msg={error} />}
          <textarea value={question} onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onAsk(); }}
            rows={3} placeholder="Ask anything about your indexed documents…"
            className="w-full resize-y rounded-lg px-3 py-2 text-sm outline-none transition"
            style={{ backgroundColor: T.bgInput, boxShadow: T.clayPressedSm, color: T.textPri }}
            onFocus={e => (e.currentTarget.style.boxShadow = `${T.clayPressedSm}, 0 0 0 2px ${T.skyBorder}`)}
            onBlur={e => (e.currentTarget.style.boxShadow = T.clayPressedSm)} />
          <BlueButton onClick={onAsk} disabled={asking || !question.trim()} className="mt-3">
            {asking ? "Thinking…" : "Ask"}
          </BlueButton>
        </Panel>

        {latest && <AnswerCard entry={latest} />}

        {!latest && !asking && (
          <div className="flex flex-col items-center gap-3 rounded-xl py-14 text-center"
            style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
            <div className="text-4xl">◎</div>
            <p className="text-sm">Ask a question to see the AI response here.</p>
          </div>
        )}
      </div>

      <div className="rounded-[28px] p-4 lg:col-span-2" style={{ backgroundColor: T.bgCard, boxShadow: T.clayRaised }}>
        <SectionLabel>History</SectionLabel>
        {history.length === 0 ? (
          <p className="mt-6 text-center text-xs" style={{ color: T.textDim }}>No queries yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {history.map(entry => (
              <button key={entry.ts} onClick={() => setQuestion(entry.question)}
                className="w-full rounded-2xl p-3 text-left transition"
                style={{ backgroundColor: T.bgInput, boxShadow: T.clayPressedSm }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = `${T.clayPressedSm}, 0 0 0 2px ${T.skyBorder}`}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = T.clayPressedSm}
              >
                <p className="truncate text-xs font-medium" style={{ color: T.textPri }}>{entry.question}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded-full px-1.5 py-px text-xs font-medium"
                    style={entry.result.cache_hit ? { backgroundColor: T.skyDim, color: T.sky } : { backgroundColor: T.border, color: T.textMuted }}>
                    {entry.result.cache_hit ? "cached" : entry.result.provider}
                  </span>
                  <span className="text-xs" style={{ color: T.textDim }}>{entry.result.duration_ms.toFixed(0)} ms</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AnswerCard({ entry }: { entry: ChatEntry }) {
  const { result } = entry;
  return (
    <div className="space-y-3 rounded-[28px] p-5" style={{ backgroundColor: T.bgCard, boxShadow: T.clayRaised }}>
      <p className="text-xs italic" style={{ color: T.textMuted }}>"{entry.question}"</p>
      <div className="rounded-2xl p-4" style={{ backgroundColor: T.bgSurface, boxShadow: T.clayPressedSm }}>
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed" style={{ color: T.textPri }}>{result.answer}</pre>
      </div>
      {result.citations?.length > 0 && (
        <div className="text-xs" style={{ color: T.textMuted }}>
          <span className="font-semibold" style={{ color: T.textSec }}>Sources: </span>
          {result.citations.map(c => <span key={c.marker} className="mr-2" style={{ color: T.textSec }}>{c.marker} {c.heading ?? c.source ?? ""}</span>)}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        <Chip>{result.intent}</Chip>
        <Chip>{result.provider}</Chip>
        {result.cost_usd != null && <Chip>${result.cost_usd.toFixed(5)}</Chip>}
        <Chip accent={result.cache_hit}>{result.cache_hit ? "✓ cache hit" : "cache miss"}</Chip>
        <Chip>{result.duration_ms.toFixed(0)} ms</Chip>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TENANTS
// ══════════════════════════════════════════════════════════════════════════════
function TenantsView({ tenant, onChange }: { tenant: string; onChange: (t: string) => void }) {
  const [info,    setInfo]    = useState<{ namespace: string; doc_count: number; vector_count: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [draft,   setDraft]   = useState(tenant);

  async function load(ns: string) { setLoading(true); setInfo(await getTenantInfo(ns)); setLoading(false); }
  useEffect(() => { load(tenant); }, [tenant]);

  return (
    <div className="max-w-xl space-y-5">
      <Panel>
        <h2 className="mb-3 text-sm font-semibold" style={{ color: T.textPri }}>Active Namespace</h2>
        <div className="flex gap-2">
          <StyledInput value={draft} onChange={e => setDraft(e.target.value)} placeholder="namespace" className="flex-1" />
          <BlueButton onClick={() => { const ns = draft.trim() || "acme"; onChange(ns); load(ns); }} className="px-4 py-2">Switch</BlueButton>
        </div>
        {loading && <div className="mt-4 flex justify-center"><MiniSpinner /></div>}
        {info && !loading && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[{ val: info.namespace, label: "namespace", hi: true }, { val: info.doc_count ?? "—", label: "documents", hi: false }, { val: info.vector_count ?? "—", label: "vectors", hi: false }]
              .map(({ val, label, hi }) => (
                <div key={label} className="rounded-lg p-3 text-center" style={{ backgroundColor: T.bgInput, boxShadow: T.clayPressedSm }}>
                  <div className="text-base font-bold" style={{ color: hi ? T.sky : T.textPri }}>{val}</div>
                  <div className="text-xs" style={{ color: T.textMuted }}>{label}</div>
                </div>
              ))}
          </div>
        )}
        {!info && !loading && <p className="mt-3 text-xs" style={{ color: T.textDim }}>No info available — index a document first.</p>}
      </Panel>
      <Panel>
        <SectionLabel>About Tenants (F19)</SectionLabel>
        <ul className="mt-2 space-y-1.5 text-xs" style={{ color: T.textMuted }}>
          <li>• Each tenant maps to an isolated vector namespace in the index.</li>
          <li>• Queries only search within the active tenant's namespace.</li>
          <li>• Use different tenant IDs to separate project knowledge bases.</li>
          <li>• Row-level security is enforced at the backend layer.</li>
          <li>• The tenant selector at the top-right applies to all views.</li>
        </ul>
      </Panel>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COST
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

  if (loading) return <div className="flex justify-center py-20"><MiniSpinner /></div>;

  return (
    <div className="space-y-5">
      {error && <ErrorBanner msg={error} />}

      <Panel>
        <SectionLabel>Budget Usage (F24)</SectionLabel>
        {!budgets || Object.keys(budgets.budgets).length === 0
          ? <p className="mt-2 text-sm" style={{ color: T.textDim }}>No budgets configured. Use POST /cost/budgets to create one.</p>
          : <div className="mt-3 space-y-3">
              {Object.entries(budgets.budgets).map(([key, b]) => {
                const pct = b.limit > 0 ? Math.min(100, (b.spent / b.limit) * 100) : 0;
                return (
                  <div key={key}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-mono font-medium" style={{ color: T.textPri }}>{key}</span>
                      <span style={{ color: T.textMuted }}>${b.spent.toFixed(4)} / ${b.limit.toFixed(4)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: T.border }}>
                      <div className="h-2 rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: pct > 80 ? "#e74c3c" : pct > 50 ? T.amber : T.green }} />
                    </div>
                    <div className="mt-1 text-xs" style={{ color: T.textDim }}>{b.requests} requests · {b.rejected} rejected</div>
                  </div>
                );
              })}
            </div>
        }
      </Panel>

      <Panel>
        <SectionLabel>Usage Summary</SectionLabel>
        {!summary || summary.total_requests === 0
          ? <p className="mt-2 text-sm" style={{ color: T.textDim }}>No usage recorded yet — ask a question first.</p>
          : <div className="mt-3 space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="rounded-xl p-3 text-center" style={{ backgroundColor: T.bgInput, boxShadow: T.clayPressedSm }}>
                  <div className="text-2xl font-black" style={{ color: T.sky }}>{summary.total_requests}</div>
                  <div className="mt-1 text-xs" style={{ color: T.textMuted }}>Total Requests</div>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ backgroundColor: T.bgInput, boxShadow: T.clayPressedSm }}>
                  <div className="text-2xl font-black" style={{ color: T.green }}>${summary.total_cost.toFixed(5)}</div>
                  <div className="mt-1 text-xs" style={{ color: T.textMuted }}>Total Cost</div>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ backgroundColor: T.bgInput, boxShadow: T.clayPressedSm }}>
                  <div className="text-2xl font-black" style={{ color: T.amber }}>{summary.cached_requests}</div>
                  <div className="mt-1 text-xs" style={{ color: T.textMuted }}>Cache Hits</div>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ backgroundColor: T.bgInput, boxShadow: T.clayPressedSm }}>
                  <div className="text-2xl font-black" style={{ color: T.royal }}>{(summary.cache_hit_rate * 100).toFixed(0)}%</div>
                  <div className="mt-1 text-xs" style={{ color: T.textMuted }}>Hit Rate</div>
                </div>
              </div>
              {Object.keys(summary.by_model).length > 0 && (
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: T.textMuted }}>By Model</div>
                  <div className="space-y-1">
                    {Object.entries(summary.by_model).map(([model, cost]) => (
                      <div key={model} className="flex justify-between rounded px-3 py-2 text-sm" style={{ backgroundColor: T.bgInput }}>
                        <span className="font-mono" style={{ color: T.textPri }}>{model || "—"}</span>
                        <span style={{ color: T.green }}>${(cost as number).toFixed(5)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
        }
      </Panel>

      {pricing && (
        <Panel>
          <SectionLabel>Model Pricing (per 1 K tokens)</SectionLabel>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {Object.entries(pricing.pricing).map(([model, data]) => (
              <div key={model} className="rounded-lg p-3" style={{ backgroundColor: T.bgInput, boxShadow: T.clayPressedSm }}>
                <div className="truncate font-mono text-xs font-medium" style={{ color: T.textPri }}>{model}</div>
                <div className="mt-1.5 flex gap-3 text-xs" style={{ color: T.textMuted }}>
                  <span>in ${data.input_per_1k.toFixed(4)}</span>
                  <span>out ${data.output_per_1k.toFixed(4)}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
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
    <div className="space-y-5">
      <Panel>
        <SectionLabel>API Keys (F25)</SectionLabel>
        {created && (
          <div className="my-3 rounded-lg p-3" style={{ border: `1px solid ${T.skyBorder}`, backgroundColor: T.skyDim }}>
            <p className="text-xs font-semibold" style={{ color: T.sky }}>{created.warning}</p>
            <code className="mt-1 block break-all rounded px-2 py-1.5 text-xs select-all" style={{ backgroundColor: T.bgSurface, color: T.sky }}>{created.key}</code>
          </div>
        )}
        {error && <ErrorBanner msg={error} />}
        <div className="my-3 flex gap-2">
          <StyledInput value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
            placeholder="Key name (e.g. production-app)" className="flex-1"
            onKeyDown={e => { if (e.key === "Enter") onCreate(); }} />
          <BlueButton onClick={onCreate} disabled={creating || !newKeyName.trim()} className="px-4 py-2">
            {creating ? "…" : "Create"}
          </BlueButton>
        </div>
        {loading ? <div className="flex justify-center py-4"><MiniSpinner /></div>
          : keys.length === 0 ? <p className="text-xs" style={{ color: T.textDim }}>No API keys yet.</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {["Name","Prefix","Uses","Status","Created",""].map((h, i) => (
                      <th key={i} className="pb-2 pr-4 text-left font-medium last:pr-0" style={{ color: T.textMuted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {keys.map(k => (
                    <tr key={k.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td className="py-2 pr-4" style={{ color: T.textPri }}>{k.name}</td>
                      <td className="py-2 pr-4 font-mono" style={{ color: T.textMuted }}>{k.prefix}…</td>
                      <td className="py-2 pr-4" style={{ color: T.textMuted }}>{k.usage_count}</td>
                      <td className="py-2 pr-4">
                        <span className="rounded-full px-2 py-0.5 text-xs font-medium"
                          style={k.revoked
                            ? { backgroundColor: "rgba(231,76,60,0.15)", color: "#e74c3c" }
                            : { backgroundColor: "rgba(var(--green-rgb),0.15)", color: T.green }}>
                          {k.revoked ? "revoked" : "active"}
                        </span>
                      </td>
                      <td className="py-2 pr-4" style={{ color: T.textDim }}>{new Date(k.created_at).toLocaleDateString()}</td>
                      <td className="py-2">
                        {!k.revoked && (
                          <button onClick={() => onRevoke(k.id)} className="text-xs transition"
                            style={{ color: "#e74c3c" }}>Revoke</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </Panel>

      <Panel>
        <div className="mb-3 flex items-center justify-between">
          <SectionLabel>Audit Log</SectionLabel>
          <button onClick={load} className="text-xs transition" style={{ color: T.textMuted }}
            onMouseEnter={e => (e.currentTarget.style.color = T.sky)}
            onMouseLeave={e => (e.currentTarget.style.color = T.textMuted)}>↻ Refresh</button>
        </div>
        {events.length === 0 ? <p className="text-xs" style={{ color: T.textDim }}>No events yet — start using the API.</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {["When","User","Action","Resource"].map(h => (
                      <th key={h} className="pb-2 pr-4 text-left font-medium last:pr-0" style={{ color: T.textMuted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {events.map(e => (
                    <tr key={e.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td className="py-2 pr-4" style={{ color: T.textDim }}>{new Date(e.timestamp).toLocaleTimeString()}</td>
                      <td className="max-w-[80px] truncate py-2 pr-4 font-mono" style={{ color: T.textMuted }}>{e.user_id.slice(0, 12)}</td>
                      <td className="py-2 pr-4">
                        <span className="rounded px-1.5 py-0.5 font-mono text-xs"
                          style={{ backgroundColor: T.skyDim, color: T.sky }}>{e.action}</span>
                      </td>
                      <td className="max-w-[120px] truncate py-2" style={{ color: T.textMuted }}>{e.resource}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </Panel>
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
    <div className="grid gap-5 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-2">
        <Panel>
          <h2 className="mb-4 text-sm font-semibold" style={{ color: T.textPri }}>Submit Feedback (F23)</h2>
          {error     && <ErrorBanner msg={error} />}
          {submitted && <SuccessBanner msg="Feedback submitted — thank you!" />}
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: T.textMuted }}>Query (optional)</label>
              <StyledInput value={query} onChange={e => setQuery(e.target.value)} placeholder="What did you ask?" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: T.textMuted }}>Rating</label>
              <div className="flex gap-1.5">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setRating(n)} className="flex-1 rounded-2xl py-2 text-base transition"
                    style={rating >= n
                      ? { backgroundColor: T.skyDim, color: T.sky, boxShadow: T.clayRaisedSm }
                      : { backgroundColor: T.bgInput, color: T.textDim, boxShadow: T.clayPressedSm }}>★</button>
                ))}
              </div>
              <p className="mt-1 text-center text-xs" style={{ color: T.textMuted }}>{rating} / 5 stars</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: T.textMuted }}>Comment (optional)</label>
              <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
                className="w-full resize-y rounded-lg px-3 py-2 text-sm outline-none transition"
                style={{ backgroundColor: T.bgInput, boxShadow: T.clayPressedSm, color: T.textPri }}
                onFocus={e => (e.currentTarget.style.boxShadow = `${T.clayPressedSm}, 0 0 0 2px ${T.skyBorder}`)}
                onBlur={e => (e.currentTarget.style.boxShadow = T.clayPressedSm)} />
            </div>
            <BlueButton onClick={onSubmit} disabled={submitting}>{submitting ? "Submitting…" : "Submit Feedback"}</BlueButton>
          </div>
        </Panel>
        {stats && (
          <Panel>
            <SectionLabel>Summary</SectionLabel>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <StatCard label="Total" value={String(stats.count)} sub="responses" accent={T.royal} />
              <StatCard label="Avg Rating" value={stats.average_rating != null ? stats.average_rating.toFixed(1) : "—"} sub="out of 5"
                accent={stats.average_rating != null && stats.average_rating >= 4 ? T.green : T.amber} />
            </div>
          </Panel>
        )}
      </div>

      <div className="rounded-[28px] p-5 lg:col-span-3" style={{ backgroundColor: T.bgCard, boxShadow: T.clayRaised }}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold" style={{ color: T.textPri }}>Recent Feedback</h2>
          <button onClick={load} className="text-xs transition" style={{ color: T.textMuted }}
            onMouseEnter={e => (e.currentTarget.style.color = T.sky)}
            onMouseLeave={e => (e.currentTarget.style.color = T.textMuted)}>↻ Refresh</button>
        </div>
        {records.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-center" style={{ color: T.textDim }}>
            <div className="text-3xl">◇</div>
            <p className="text-sm">No feedback yet. Submit the first one!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map(r => (
              <div key={r.id} className="rounded-lg p-3" style={{ backgroundColor: T.bgInput, boxShadow: T.clayPressedSm }}>
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(n => <span key={n} className="text-sm" style={{ color: r.rating >= n ? T.sky : T.textDim }}>★</span>)}
                  </div>
                  <span className="text-xs" style={{ color: T.textDim }}>{new Date(r.timestamp).toLocaleDateString()}</span>
                </div>
                {r.query   && <p className="mt-1.5 text-xs italic" style={{ color: T.textMuted }}>"{r.query}"</p>}
                {r.comment && <p className="mt-1 text-xs" style={{ color: T.textPri }}>{r.comment}</p>}
              </div>
            ))}
          </div>
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
    <div className="max-w-xl space-y-5">
      <Panel>
        <h2 className="mb-4 text-sm font-semibold" style={{ color: T.textPri }}>Search Preferences (F22)</h2>
        {error && <ErrorBanner msg={error} />}
        {saved && <SuccessBanner msg="Preferences saved — they will affect ranking on your next query." />}
        <div className="space-y-4">
          {[
            { label: "Interests", sub: "comma-separated topics", val: interests, set: setInterests, ph: "technology, security, finance", hint: "Matching documents get a +0.15 score boost." },
            { label: "Disinterests", sub: "penalised topics", val: disinterests, set: setDisinterests, ph: "marketing, legal", hint: "Matching documents get a −0.40 score penalty." },
          ].map(({ label, sub, val, set, ph, hint }) => (
            <div key={label}>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: T.textMuted }}>
                {label} <span className="font-normal" style={{ color: T.textDim }}>({sub})</span>
              </label>
              <StyledInput value={val} onChange={e => set(e.target.value)} placeholder={ph} />
              <p className="mt-1 text-xs" style={{ color: T.textDim }}>{hint}</p>
            </div>
          ))}

          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: T.textMuted }}>Preferred document types</label>
            <div className="flex flex-wrap gap-2">
              {["pdf","docx","txt","md","html"].map(t => (
                <button key={t} onClick={() => setDocTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                  className="rounded-full px-3 py-1 text-xs font-medium transition"
                  style={docTypes.includes(t)
                    ? { backgroundColor: T.skyDim, color: T.sky, boxShadow: T.clayRaisedSm }
                    : { backgroundColor: T.bgInput, color: T.textMuted, boxShadow: T.clayPressedSm }}>
                  .{t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium" style={{ color: T.textPri }}>Prefer recent documents</p>
              <p className="text-xs" style={{ color: T.textDim }}>Score decays linearly over a 2-year window.</p>
            </div>
            <button onClick={() => setPreferRecent(p => !p)}
              className="relative h-5 w-9 rounded-full transition-colors"
              style={{
                background: preferRecent ? `linear-gradient(135deg, ${T.royal}, ${T.magenta})` : T.bgInput,
                boxShadow: preferRecent ? T.clayRaisedSm : T.clayPressedSm,
              }}>
              <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
                style={{ transform: preferRecent ? "translateX(16px)" : "translateX(2px)" }} />
            </button>
          </div>

          {preferRecent && (
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: T.textMuted }}>
                Recency weight: <span style={{ color: T.sky }}>{recencyWeight.toFixed(2)}</span>
              </label>
              <input type="range" min={0.05} max={0.5} step={0.05} value={recencyWeight}
                onChange={e => setRecencyWeight(parseFloat(e.target.value))}
                className="w-full" style={{ accentColor: T.royal }} />
              <div className="mt-1 flex justify-between text-xs" style={{ color: T.textDim }}>
                <span>subtle (0.05)</span><span>strong (0.50)</span>
              </div>
            </div>
          )}

          <BlueButton onClick={onSave} disabled={saving}>{saving ? "Saving…" : "Save Preferences"}</BlueButton>
        </div>
      </Panel>
      <Panel>
        <SectionLabel>How Personalization Works</SectionLabel>
        <ul className="mt-2 space-y-1.5 text-xs" style={{ color: T.textMuted }}>
          <li>• Applied after retrieval — results are re-ranked, not filtered out.</li>
          <li>• Interest boost: +0.15 per matching topic keyword in the document.</li>
          <li>• Disinterest penalty: −0.40 per matching disinterest keyword.</li>
          <li>• Recency: additive boost = recency_weight × (1 − age_days / 730).</li>
          <li>• Preferred doc types give an additional +0.10 to matching documents.</li>
        </ul>
      </Panel>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SETTINGS (sub-tabbed wrapper)
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
    <div className="flex gap-5">
      {/* Vertical tab list */}
      <aside className="flex w-44 shrink-0 flex-col gap-1 rounded-[26px] p-2" style={{ backgroundColor: T.bgCard, boxShadow: T.clayRaised, alignSelf: "flex-start" }}>
        {SETTINGS_TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onTab(id)}
            className="rounded-2xl px-3 py-2 text-left text-sm font-semibold transition"
            style={tab === id
              ? { background: `linear-gradient(135deg, ${T.royal}, ${T.royalHover})`, color: "#fff", boxShadow: T.clayRaisedSm }
              : { color: T.textMuted }}
            onMouseEnter={e => { if (tab !== id) { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(var(--royal-rgb),0.12)"; (e.currentTarget as HTMLElement).style.color = T.textPri; } }}
            onMouseLeave={e => { if (tab !== id) { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLElement).style.color = T.textMuted; } }}
          >
            {label}
          </button>
        ))}
      </aside>

      {/* Content */}
      <div className="min-w-0 flex-1">
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
function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[28px] p-5" style={{
      background: T.bgCard,
      boxShadow: T.clayRaised,
    }}>{children}</div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div className="rounded-[28px] p-5" style={{
      background: "var(--statcard-gradient)",
      boxShadow: T.clayRaised,
      position: "relative", overflow: "hidden",
    }}>
      {/* Top accent line */}
      <div style={{
        position: "absolute", top: 0, left: "15%", right: "15%", height: "2px",
        background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
        opacity: 0.85,
      }} />
      {/* Subtle corner glow */}
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: "100px", height: "100px",
        background: `radial-gradient(circle, color-mix(in srgb, ${accent} 13%, transparent) 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />
      <div className="text-sm font-medium" style={{ color: T.textMuted }}>{label}</div>
      <div className="mt-2 text-4xl font-black" style={{ color: accent, letterSpacing: "-1px" }}>{value}</div>
      <div className="text-sm mt-1.5" style={{ color: T.textDim }}>{sub}</div>
    </div>
  );
}

function BlueButton({ children, onClick, disabled = false, className = "" }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`rounded-2xl text-sm font-semibold text-white transition ${className}`}
      style={{
        background: disabled ? T.borderMid : `linear-gradient(135deg, ${T.royal}, ${T.royalHover})`,
        padding: className.includes("px-") ? undefined : "0.625rem 0",
        width: className.includes("px-") ? undefined : "100%",
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: disabled ? "none" : `0 2px 14px ${T.royalGlow}, ${T.clayRaisedSm}`,
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.boxShadow = `0 2px 20px ${T.royalGlow}, ${T.clayRaisedHov}`; }}
      onMouseLeave={e => { if (!disabled) (e.currentTarget as HTMLElement).style.boxShadow = `0 2px 14px ${T.royalGlow}, ${T.clayRaisedSm}`; }}
      onMouseDown={e => { if (!disabled) (e.currentTarget as HTMLElement).style.boxShadow = `0 1px 8px ${T.royalGlow}, ${T.clayPressedSm}`; }}
      onMouseUp={e => { if (!disabled) (e.currentTarget as HTMLElement).style.boxShadow = `0 2px 20px ${T.royalGlow}, ${T.clayRaisedHov}`; }}
    >
      {children}
    </button>
  );
}

function StyledInput({ value, onChange, placeholder, className = "", onKeyDown }: {
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; className?: string; onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <input value={value} onChange={onChange} placeholder={placeholder} onKeyDown={onKeyDown}
      className={`rounded-2xl px-3.5 py-2.5 text-sm outline-none transition ${className}`}
      style={{
        backgroundColor: T.bgInput, color: T.textPri, boxShadow: T.clayPressedSm,
        width: className.includes("flex-1") ? undefined : "100%",
      }}
      onFocus={e => (e.currentTarget.style.boxShadow = `${T.clayPressedSm}, 0 0 0 2px ${T.skyBorder}`)}
      onBlur={e => (e.currentTarget.style.boxShadow = T.clayPressedSm)}
    />
  );
}

function Chip({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span className="rounded-full px-2.5 py-1 text-xs"
      style={accent
        ? { backgroundColor: T.skyDim, color: T.sky, boxShadow: T.clayRaisedSm }
        : { backgroundColor: T.bgSurface, color: T.textMuted, boxShadow: T.clayRaisedSm }}>
      {children}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-bold uppercase tracking-widest" style={{
      background: `linear-gradient(90deg, ${T.sky}, ${T.magenta}, ${T.royal})`,
      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    }}>{children}</h3>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return <div className="mb-3 rounded-lg px-4 py-3 text-sm" style={{ border: "1px solid rgba(231,76,60,0.4)", backgroundColor: "rgba(231,76,60,0.10)", color: "#ff7675" }}>{msg}</div>;
}

function SuccessBanner({ msg }: { msg: string }) {
  return <div className="mb-3 rounded-lg px-4 py-3 text-sm" style={{ border: "1px solid rgba(var(--green-rgb),0.35)", backgroundColor: "rgba(var(--green-rgb),0.10)", color: T.green }}>✓ {msg}</div>;
}

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: T.bgBase }}>
      <div className="h-8 w-8 animate-spin rounded-full border-2" style={{ borderColor: T.border, borderTopColor: T.sky }} />
    </div>
  );
}

function MiniSpinner() {
  return <div className="h-5 w-5 animate-spin rounded-full border-2" style={{ borderColor: T.border, borderTopColor: T.sky }} />;
}
