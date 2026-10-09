"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Icon, { IconName } from "@/components/Icon";

export interface Command { id: string; label: string; hint: string; icon: IconName; group: string; run: () => void }

/** Ctrl/⌘ + K quick switcher. Purely navigational — callers supply the actions. */
export default function CommandPalette({ open, onClose, commands }: {
  open: boolean; onClose: () => void; commands: Command[];
}) {
  const [query, setQuery] = useState("");
  const [sel,   setSel]   = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? commands.filter(c => `${c.label} ${c.hint} ${c.group}`.toLowerCase().includes(q)) : commands;
  }, [query, commands]);

  useEffect(() => {
    if (open) { setQuery(""); setSel(0); setTimeout(() => inputRef.current?.focus(), 0); }
  }, [open]);
  useEffect(() => { setSel(0); }, [query]);

  if (!open) return null;

  function run(c: Command | undefined) { if (!c) return; onClose(); c.run(); }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel(s => Math.min(results.length - 1, s + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel(s => Math.max(0, s - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); run(results[sel]); }
    else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  }

  let lastGroup = "";
  return (
    <>
      <div className="cmdk-backdrop" onClick={onClose} />
      <div className="cmdk" role="dialog" aria-label="Command palette" onKeyDown={onKey}>
        <div className="flex items-center gap-3 px-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <Icon name="search" size={17} className="text-muted" />
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Jump to a page or setting…"
            className="h-14 flex-1 bg-transparent text-[15px] outline-none" style={{ color: "var(--text)" }} />
          <kbd className="kbd">Esc</kbd>
        </div>
        <div className="max-h-[340px] overflow-y-auto p-2">
          {results.length === 0 && <p className="px-3 py-8 text-center text-sm text-muted">No matches for “{query}”.</p>}
          {results.map((c, i) => {
            const header = c.group !== lastGroup ? c.group : null;
            lastGroup = c.group;
            return (
              <div key={c.id}>
                {header && <div className="eyebrow px-3 pb-1.5 pt-3">{header}</div>}
                <button onMouseEnter={() => setSel(i)} onClick={() => run(c)}
                  className={`cmdk-item${i === sel ? " selected" : ""}`}>
                  <span className="icon-chip h-8 w-8"><Icon name={c.icon} size={15} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium" style={{ color: "var(--text)" }}>{c.label}</span>
                    <span className="block truncate text-xs text-muted">{c.hint}</span>
                  </span>
                  {i === sel && <Icon name="enter" size={14} className="text-muted" />}
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 px-4 py-2.5 text-xs text-muted" style={{ borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}>
          <span className="flex items-center gap-1.5"><kbd className="kbd">↑</kbd><kbd className="kbd">↓</kbd>navigate</span>
          <span className="flex items-center gap-1.5"><kbd className="kbd">↵</kbd>open</span>
        </div>
      </div>
    </>
  );
}
