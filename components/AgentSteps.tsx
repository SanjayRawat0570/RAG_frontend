import Icon from "@/components/Icon";
import type { AgentStep } from "@/lib/api";

const TOOL_LABEL: Record<string, string> = {
  search_docs:   "Searched documents",
  get_document:  "Read document",
  lookup_entity: "Looked up entity",
};

const STOP_LABEL: Record<string, string> = {
  sufficient_evidence: "enough evidence found",
  planner_done:        "planner finished",
  no_new_query:        "no better query to try",
  max_rounds:          "tool-round limit reached",
  timeout:             "time limit reached",
  token_budget:        "token budget reached",
  budget_exceeded:     "spend budget reached",
};

function argText(args: Record<string, unknown> | undefined): string {
  if (!args) return "";
  const main = args.query ?? args.name ?? args.doc_id;
  const rest = Object.entries(args).filter(([k]) => !["query", "name", "doc_id"].includes(k));
  return [main ? `“${String(main)}”` : "", ...rest.map(([k, v]) => `${k}=${JSON.stringify(v)}`)].filter(Boolean).join(" · ");
}

/** The agent's visible trace: query rewrites, tool calls and why it stopped. Reasoning stays internal. */
export default function AgentSteps({ steps, rewrittenQuery }: { steps?: AgentStep[] | null; rewrittenQuery?: string | null }) {
  const visible = (steps ?? []).filter(s => ["tool_call", "rewrite", "evaluate", "answer", "memory_rewrite", "planner_fallback"].includes(s.type));
  if (visible.length === 0) return null;
  const toolCalls = visible.filter(s => s.type === "tool_call").length;

  return (
    <details className="mt-5 rounded-xl" style={{ border: "1px solid var(--border)", background: "var(--surface-2)" }}>
      <summary className="flex cursor-pointer select-none items-center gap-2 px-3 py-2 text-sm" style={{ color: "var(--text-2)" }}>
        <Icon name="activity" size={14} className="text-muted" />
        <span className="font-medium">Agent steps</span>
        <span className="badge badge-mono">{toolCalls} tool call{toolCalls === 1 ? "" : "s"}</span>
        {rewrittenQuery && <span className="truncate text-xs text-muted">→ {rewrittenQuery}</span>}
      </summary>
      <ol className="space-y-2 px-3 pb-3 pt-1">
        {visible.map((s, i) => (
          <li key={i} className="flex gap-2.5 text-sm">
            <span className="badge badge-mono mt-0.5 shrink-0">{s.round ?? 0}</span>
            <div className="min-w-0">
              {s.type === "tool_call" && (
                <>
                  <span style={{ color: "var(--text)" }}>{TOOL_LABEL[s.tool ?? ""] ?? s.tool}</span>{" "}
                  <span className="font-mono text-xs text-muted">{argText(s.args)}</span>
                  <div className="text-xs text-muted">
                    {s.error ? <span style={{ color: "var(--danger)" }}>error: {s.error}</span>
                      : <>{s.results ?? 0} result{s.results === 1 ? "" : "s"}{s.sources?.length ? ` from ${s.sources.join(", ")}` : ""} · {s.duration_ms?.toFixed(0)} ms</>}
                    {s.dropped_args?.length ? <span style={{ color: "var(--warning)" }}> · ignored {s.dropped_args.join(", ")} (tenant is set by the server)</span> : null}
                  </div>
                </>
              )}
              {(s.type === "rewrite" || s.type === "memory_rewrite") && (
                <span style={{ color: "var(--text)" }}>
                  {s.type === "memory_rewrite" ? "Rewrote follow-up as" : "Rewrote query"}: <span className="font-medium" style={{ color: "var(--primary)" }}>{s.query}</span>
                </span>
              )}
              {s.type === "evaluate" && (
                <span className="text-muted">Evidence covers {Math.round((s.coverage ?? 0) * 100)}% of the question ({s.evidence} passages)</span>
              )}
              {s.type === "planner_fallback" && <span className="text-muted">Model unavailable — continued with the offline planner</span>}
              {s.type === "answer" && (
                <span className="text-muted">Answered — {STOP_LABEL[s.reason ?? ""] ?? s.reason}</span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </details>
  );
}
