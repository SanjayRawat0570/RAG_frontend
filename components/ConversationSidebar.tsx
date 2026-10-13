"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { ConversationSummary, deleteConversation, listConversations } from "@/lib/api";

function ago(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(iso).toLocaleDateString();
}

/** Chat history for the active workspace: open a chat, start a new one, or delete one. */
export default function ConversationSidebar({
  tenant, activeId, refreshKey, onSelect, onNew,
}: {
  tenant: string;
  activeId: string | null;
  refreshKey: number;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  const [convs, setConvs] = useState<ConversationSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listConversations(tenant)
      .then(r => { setConvs(r.conversations); setError(null); })
      .catch(() => setError("Sign in to keep chat history."));
  }, [tenant, refreshKey]);

  async function onDelete(id: string) {
    await deleteConversation(tenant, id).catch(() => null);
    setConvs(c => c.filter(x => x.id !== id));
    if (id === activeId) onNew();
  }

  return (
    <div className="card self-start lg:sticky lg:top-0">
      <div className="card-header">
        <div className="card-title flex items-center gap-2"><Icon name="message" size={15} className="text-muted" />Conversations</div>
        <button onClick={onNew} className="btn btn-sm btn-secondary"><Icon name="plus" size={13} />New chat</button>
      </div>
      {error ? (
        <p className="px-5 py-8 text-center text-sm text-muted">{error}</p>
      ) : convs.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted">No conversations yet. Follow-up questions use the last 5 turns.</p>
      ) : (
        <ul className="p-2">
          {convs.map(c => (
            <li key={c.id} className="group flex items-center gap-1">
              <button onClick={() => onSelect(c.id)} aria-current={c.id === activeId}
                className="min-w-0 flex-1 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--primary-soft)]"
                style={c.id === activeId ? { background: "var(--primary-soft)" } : undefined}>
                <p className="truncate text-sm" style={{ color: c.id === activeId ? "var(--primary)" : "var(--text)" }}>{c.title}</p>
                <p className="mt-0.5 text-xs text-muted">{c.turns} turn{c.turns === 1 ? "" : "s"} · {ago(c.updated_at)}</p>
              </button>
              <button onClick={() => onDelete(c.id)} className="btn btn-sm btn-danger-ghost opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
                aria-label={`Delete conversation ${c.title}`} title="Delete conversation">
                <Icon name="x" size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
