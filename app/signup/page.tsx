"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp, getSession } from "@/lib/auth";
import AuthShell, { AuthError, AuthSpinner } from "@/components/AuthShell";

const STEPS = [
  { title: "Create your account",  desc: "Register with your name and work email." },
  { title: "Choose a workspace",   desc: "Namespaces keep each team's documents isolated." },
  { title: "Upload a document",    desc: "PDF, DOCX, PPTX, spreadsheets or plain text." },
  { title: "Start asking",         desc: "Receive cited answers in seconds." },
];

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    getSession().then(s => { if (s) router.replace("/"); else setLoading(false); });
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    if (!username || !email || !password || !confirm) { setError("Please fill in all fields"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try { await signUp(username, email, password); router.replace("/"); }
    catch (err) { setError(err instanceof Error ? err.message : "Registration failed"); setLoading(false); }
  }

  if (loading) return <AuthSpinner />;

  const fields = [
    { id: "name",     label: "Full name",        type: "text",     auto: "name",         val: username, set: setUsername, ph: "Jane Smith" },
    { id: "email",    label: "Work email",       type: "email",    auto: "email",        val: email,    set: setEmail,    ph: "name@company.com" },
    { id: "password", label: "Password",         type: "password", auto: "new-password", val: password, set: setPassword, ph: "At least 6 characters" },
    { id: "confirm",  label: "Confirm password", type: "password", auto: "new-password", val: confirm,  set: setConfirm,  ph: "Re-enter your password" },
  ];

  return (
    <AuthShell
      panelTitle="Get up and running in minutes."
      panelBody="Create an account to start indexing documents and answering questions across your organisation."
      panelItems={STEPS}
    >
      <h2 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text)" }}>Create your <span className="grad-text">account</span></h2>
      <p className="mt-1.5 text-sm" style={{ color: "var(--text-3)" }}>Set up access to the Enterprise RAG console.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {error && <AuthError msg={error} />}

        {fields.map(({ id, label, type, auto, val, set, ph }) => (
          <div key={id}>
            <label className="label" htmlFor={id}>{label}</label>
            <input id={id} type={type} autoComplete={auto} value={val}
              onChange={e => set(e.target.value)} placeholder={ph} className="input input-lg" />
          </div>
        ))}

        <div className="pt-2">
          <button type="submit" disabled={loading} className="btn btn-primary btn-lg btn-block">
            {loading ? "Creating account…" : "Create account"}
          </button>
        </div>
      </form>

      <p className="mt-8 text-center text-sm" style={{ color: "var(--text-3)" }}>
        Already have an account? <Link href="/login" className="link">Sign in</Link>
      </p>
    </AuthShell>
  );
}
