// Thin client for the backend RAG API.
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api/v1";

const BACKEND_ROOT = API_BASE.replace(/\/api\/v1$/, "");

async function _token(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const { supabase } = await import("./supabase");
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function _headers(json = false): Promise<Record<string, string>> {
  const token = await _token();
  const h: Record<string, string> = {};
  if (json) h["content-type"] = "application/json";
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method:  "POST",
    headers: await _headers(true),
    body:    JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`${res.status}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

async function get<T>(path: string, base = API_BASE): Promise<T> {
  const res = await fetch(`${base}${path}`, { headers: await _headers() });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<T>;
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method:  "DELETE",
    headers: await _headers(),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<T>;
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method:  "PUT",
    headers: await _headers(true),
    body:    JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<T>;
}

// ── System ────────────────────────────────────────────────────────────────────

export interface HealthResult { status: string; version: string }
export const getHealth = () =>
  fetch(`${BACKEND_ROOT}/health`).then(r => r.json() as Promise<HealthResult>);

// ── RAG ───────────────────────────────────────────────────────────────────────

export interface IndexResult {
  status:          string;
  store:           string;
  namespace:       string;
  upserted:        number;
  namespace_count: number;
}

export interface Citation {
  marker:  string;
  heading: string | null;
  source:  string | null;
}

export interface AskResult {
  intent:         string;
  answer:         string;
  citations:      Citation[];          // every source shown to the model
  cited_markers?: string[];            // the sources the answer actually uses
  confidence?:    "high" | "medium" | "low" | null;
  answerable?:    boolean | null;
  provider:    string;
  cost_usd:    number | null;
  cache_hit:   boolean;
  duration_ms: number;
}

export const indexDocument = (tenant: string, text: string, filename: string) =>
  post<IndexResult>("/rag/index", { tenant, text, filename });

export const askQuestion = (tenant: string, question: string, provider?: string) =>
  post<AskResult>("/rag/ask", { tenant, question, provider });

// ── Document upload (F1 pipeline) ─────────────────────────────────────────────

export interface ExecutionStatus {
  id:             string;
  status:         "running" | "completed" | "failed";
  progress:       number;
  step:           string;
  message:        string;
  filename:       string;
  tenant:         string;
  chunks_indexed: number | null;
}

export async function uploadDocument(file: File, tenant: string): Promise<{ execution_id: string }> {
  const token = await _token();
  const form  = new FormData();
  form.append("file", file);
  form.append("tenant", tenant);
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/documents/upload`, { method: "POST", headers, body: form });
  if (!res.ok) { const d = await res.text(); throw new Error(`${res.status}: ${d}`); }
  return res.json();
}

export const pollExecution = (execId: string) =>
  get<ExecutionStatus>(`/documents/executions/${execId}`);

// ── Cost (F24) ────────────────────────────────────────────────────────────────

export interface PricingEntry { model: string; input_per_1k: number; output_per_1k: number }
export interface BudgetEntry  { limit: number; spent: number; remaining: number; requests: number; rejected: number }
export interface CostSummary  { total_cost: number; total_requests: number; cached_requests: number; cache_hit_rate: number; by_model: Record<string, number>; by_operation: Record<string, number> }

export const getCostPricing  = () => get<{ pricing: Record<string, { input_per_1k: number; output_per_1k: number }> }>("/cost/pricing");
export const getCostBudgets  = () => get<{ budgets: Record<string, BudgetEntry> }>("/cost/budgets");
export const getCostSummary  = () => get<CostSummary>("/cost/summary");

// ── Security (F25) ────────────────────────────────────────────────────────────

export interface ApiKeyRecord { id: string; name: string; prefix: string; revoked: boolean; usage_count: number; created_at: string; last_used: string | null }
export interface AuditEvent   { id: string; user_id: string; action: string; resource: string; timestamp: string; ip_address: string }

export const getSecurityApiKeys     = () => get<{ total: number; keys: ApiKeyRecord[] }>("/security/api-keys");
export const createSecurityApiKey   = (name: string) => post<{ id: string; key: string; name: string; warning: string }>("/security/api-keys", { name });
export const revokeSecurityApiKey   = (id: string) => del<{ status: string }>(`/security/api-keys/${id}`);
export const getAuditEvents         = (limit = 20) => get<{ total: number; events: AuditEvent[] }>(`/security/audit/events?limit=${limit}`);
export const getComplianceReport    = () => get<Record<string, unknown>>("/security/compliance");

// ── Feedback (F23) ────────────────────────────────────────────────────────────

export interface FeedbackRecord { id: string; rating: number; comment: string; query: string; timestamp: string; tags: string[] }
export interface FeedbackStats  { count: number; average_rating: number; distribution: Record<string, number>; high_rated_count: number; low_rated_count: number }

export const getFeedback      = (limit = 20)  => get<{ total: number; feedback: FeedbackRecord[] }>(`/feedback?limit=${limit}`);
export const getFeedbackStats = ()            => get<FeedbackStats>("/feedback/stats");
export const submitFeedback   = (data: { query_id: string; rating: number; comment?: string; query?: string }) =>
  post<{ id: string }>("/feedback", data);

// ── Personalization (F22) ─────────────────────────────────────────────────────

export interface UserProfile {
  user_id: string;
  content: {
    interests:           string[];
    disinterests:        string[];
    preferred_doc_types: string[];
    prefer_recent:       boolean;
    recency_weight:      number;
  };
}

export const getProfile    = (userId: string) => get<UserProfile>(`/personalization/profile/${userId}`);
export const upsertProfile = (data: Partial<UserProfile["content"]> & { user_id: string }) =>
  post<UserProfile>("/personalization/profile", data);

// ── Tenants (F19) ─────────────────────────────────────────────────────────────

export interface TenantInfo { namespace: string; doc_count: number; vector_count: number }
export const getTenantInfo = (namespace: string) =>
  get<TenantInfo>(`/tenants/${namespace}`).catch(() => null);
