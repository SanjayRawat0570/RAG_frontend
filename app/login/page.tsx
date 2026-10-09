"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, getSession } from "@/lib/auth";
import AuthShell, { AuthError, AuthSpinner } from "@/components/AuthShell";

const PANEL_ITEMS = [
  { title: "Hybrid retrieval",       desc: "Keyword and semantic search, fused and re-ranked." },
  { title: "Answers with citations", desc: "Every response links back to its source passages." },
  { title: "Governed by design",     desc: "Workspaces, API keys, audit logs and cost budgets." },
];

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    getSession().then(s => { if (s) router.replace("/"); else setLoading(false); });
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    if (!email || !password) { setError("Please fill in all fields"); return; }
    setLoading(true);
    try { await signIn(email, password); router.replace("/"); }
    catch (err) { setError(err instanceof Error ? err.message : "Login failed"); setLoading(false); }
  }

  if (loading) return <AuthSpinner />;

  return (
    <AuthShell
      panelTitle="Your organisation's knowledge, answered."
      panelBody="Sign in to query indexed documents, manage workspaces and review platform activity."
      panelItems={PANEL_ITEMS}
    >
      <h2 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text)" }}>Welcome <span className="grad-text">back</span></h2>
      <p className="mt-1.5 text-sm" style={{ color: "var(--text-3)" }}>Enter your credentials to access the console.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        {error && <AuthError msg={error} />}

        <div>
          <label className="label" htmlFor="email">Work email</label>
          <input id="email" type="email" autoComplete="email" value={email}
            onChange={e => setEmail(e.target.value)} placeholder="name@company.com" className="input input-lg" />
        </div>

        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" value={password}
            onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input input-lg" />
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary btn-lg btn-block">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm" style={{ color: "var(--text-3)" }}>
        Don&apos;t have an account? <Link href="/signup" className="link">Create one</Link>
      </p>
    </AuthShell>
  );
}
