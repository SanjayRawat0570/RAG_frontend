"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { API_BASE, ApiKeyRecord, KeyRole, createSecurityApiKey, getSecurityApiKeys, revokeSecurityApiKey } from "@/lib/api";

const ROLES: { id: KeyRole; label: string; hint: string }[] = [
  { id: "viewer", label: "Viewer", hint: "search and ask" },
  { id: "member", label: "Member", hint: "also upload documents" },
];

function desktopConfig(key: string): string {
  return JSON.stringify({
    mcpServers: {
      "enterprise-rag": {
        command: "C:\\path\\to\\backend\\.venv\\Scripts\\python.exe",
        args: ["-m", "app.mcp_server"],
        cwd: "C:\\path\\to\\backend",
        env: { RAG_API_KEY: key, RAG_API_URL: API_BASE },
      },
    },
  }, null, 2);
}

/** API keys for MCP clients (Claude Desktop, Claude Code) scoped to one workspace. */
export default function McpAccess({ tenant }: { tenant: string }) {
  const [keys,     setKeys]     = useState<ApiKeyRecord[] | null>(null);
  const [name,     setName]     = useState("claude-desktop");
  const [role,     setRole]     = useState<KeyRole>("viewer");
  const [created,  setCreated]  = useState<string | null>(null);
  const [copied,   setCopied]   = useState(false);
  const [creating, setCreating] = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function load() {
    try { setKeys((await getSecurityApiKeys()).keys.filter(k => k.tenant === tenant)); }
    catch (e) { setError(`Could not load keys: ${e}`); setKeys([]); }
  }
  useEffect(() => { setCreated(null); setError(null); load(); }, [tenant]);

  async function onCreate() {
    setCreating(true); setError(null); setCreated(null); setCopied(false);
    try { setCreated((await createSecurityApiKey(name.trim(), { tenant, role })).key); load(); }
    catch (e) { setError(`Could not create the key: ${e}`); }
    finally { setCreating(false); }
  }

  async function onCopy(text: string) {
    try { await navigator.clipboard.writeText(text); setCopied(true); } catch { /* clipboard blocked: text stays selectable */ }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title flex items-center gap-2"><Icon name="key" size={15} className="text-muted" />MCP access</div>
          <div className="card-subtitle">
            Connect Claude Desktop or another MCP client to <span className="font-mono">{tenant}</span>. Tools: <span className="font-mono">search_knowledge_base</span>, <span className="font-mono">ask</span>
          </div>
        </div>
      </div>

      <div className="card-body space-y-4">
        {error && <div className="alert alert-danger" role="alert"><Icon name="alert" size={15} /><span>{error}</span></div>}

        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div>
            <label className="sr-only" htmlFor="mcp-name">Key name</label>
            <input id="mcp-name" className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Key name" />
          </div>
          <div>
            <label className="sr-only" htmlFor="mcp-role">Role</label>
            <select id="mcp-role" className="input" value={role} onChange={e => setRole(e.target.value as KeyRole)}>
              {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}: {r.hint}</option>)}
            </select>
          </div>
          <button onClick={onCreate} disabled={creating || !name.trim()} className="btn btn-primary">
            <Icon name="plus" size={14} />{creating ? "Generating…" : "Generate key"}
          </button>
        </div>

        {created && (
          <div className="alert alert-info flex-col items-stretch gap-2">
            <span className="font-medium">Copy this key now. It won&apos;t be shown again.</span>
            <code className="block select-all break-all rounded px-2 py-1.5 text-xs"
              style={{ background: "var(--surface)", border: "1px solid var(--primary-border)", color: "var(--text)" }}>{created}</code>
            <span className="text-xs">
              Add this to <span className="font-mono">claude_desktop_config.json</span> (Settings → Developer → Edit config), fix the two paths, then restart Claude Desktop. The API must be running.
            </span>
            <pre className="overflow-x-auto rounded p-3 text-xs"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>{desktopConfig(created)}</pre>
            <div>
              <button onClick={() => onCopy(desktopConfig(created))} className="btn btn-secondary btn-sm">
                <Icon name={copied ? "check" : "file"} size={13} />{copied ? "Copied" : "Copy config"}
              </button>
            </div>
          </div>
        )}
      </div>

      {keys === null ? <div className="flex justify-center py-6"><span className="spinner" /></div>
        : keys.length === 0 ? <p className="px-5 pb-5 text-sm text-muted">No keys for this workspace yet.</p>
        : (
          <div className="overflow-x-auto" style={{ borderTop: "1px solid var(--border)" }}>
            <table className="table">
              <thead><tr><th>Name</th><th>Prefix</th><th>Role</th><th>Uses</th><th>Status</th><th /></tr></thead>
              <tbody>
                {keys.map(k => (
                  <tr key={k.id}>
                    <td className="font-medium" style={{ color: "var(--text)" }}>{k.name}</td>
                    <td className="font-mono">{k.prefix}…</td>
                    <td><span className="badge">{k.role}</span></td>
                    <td>{k.usage_count}</td>
                    <td>
                      <span className={`badge ${k.revoked ? "badge-danger" : "badge-success"}`}>
                        <span className="dot" />{k.revoked ? "Revoked" : "Active"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {!k.revoked && (
                        <button onClick={async () => { await revokeSecurityApiKey(k.id).catch(() => null); load(); }}
                          className="btn btn-danger-ghost btn-sm">Revoke</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}
