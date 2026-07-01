"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp, getSession } from "@/lib/auth";
import ThemeToggle from "@/components/ThemeToggle";

const T = {
  bgBase:     "var(--bg-base)",
  bgPanel:    "var(--panel-bg)",
  bgCard:     "var(--bg-card)",
  bgInput:    "var(--bg-input)",
  border:     "var(--border)",
  borderMid:  "var(--border-mid)",
  royal:      "var(--royal)",
  royalHover: "var(--royal-hover)",
  royalGlow:  "var(--royal-glow)",
  sky:        "var(--sky)",
  skyDim:     "var(--sky-dim)",
  skyBorder:  "var(--sky-border)",
  textPri:    "var(--text-pri)",
  textSec:    "var(--text-sec)",
  textMuted:  "var(--text-muted)",
};

const STEPS = [
  { num: "01", title: "Create your account",    desc: "Sign up with your name and email" },
  { num: "02", title: "Set up your tenant",      desc: "Namespace isolates your documents" },
  { num: "03", title: "Upload your first doc",   desc: "PDF, DOCX, PPTX or plain text" },
  { num: "04", title: "Start asking questions",  desc: "Get cited AI answers in seconds" },
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

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: T.bgBase }}>
      <div className="h-10 w-10 animate-spin rounded-full border-2" style={{ borderColor: T.border, borderTopColor: T.sky }} />
    </div>
  );

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: T.bgBase }}>

      {/* ── Left panel — branding ── */}
      <div className="relative hidden lg:flex lg:w-[50%] flex-col justify-between overflow-hidden p-12"
        style={{ backgroundColor: T.bgPanel, borderRight: `1px solid ${T.border}` }}>

        {/* Grid dot background */}
        <div className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(${T.border} 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
            opacity: 0.5,
          }} />

        {/* Glow blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 top-0 h-[500px] w-[500px] rounded-full"
            style={{ backgroundColor: "rgba(var(--royal-rgb),0.12)", filter: "blur(100px)" }} />
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full"
            style={{ backgroundColor: "rgba(var(--sky-rgb),0.06)", filter: "blur(80px)" }} />
        </div>

        {/* Top logo */}
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-black text-white"
              style={{ background: `linear-gradient(135deg, ${T.royal}, var(--magenta), ${T.sky})`, boxShadow: `0 0 32px ${T.royalGlow}, var(--clay-raised-sm)` }}>
              R
            </div>
            <div>
              <div className="text-lg font-bold" style={{ color: T.textPri }}>Enterprise RAG</div>
              <div className="text-sm" style={{ color: T.textMuted }}>Get started in minutes</div>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Steps */}
        <div className="relative">
          <h2 className="mb-8 text-3xl font-bold leading-tight" style={{ color: T.textPri }}>
            Up and running<br />
            <span style={{ color: T.sky }}>in four steps</span>
          </h2>

          <div className="space-y-5">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold"
                  style={{ backgroundColor: T.skyDim, color: T.sky, boxShadow: "var(--clay-raised-sm)" }}>
                  {s.num}
                </div>
                <div className="pt-1">
                  <div className="text-base font-semibold" style={{ color: T.textPri }}>{s.title}</div>
                  <div className="mt-0.5 text-sm" style={{ color: T.textMuted }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative flex items-center gap-6">
          {["Free to run", "Open source", "Offline-first"].map(tag => (
            <div key={tag} className="flex items-center gap-1.5 text-sm" style={{ color: T.textMuted }}>
              <span style={{ color: T.sky }}>✓</span> {tag}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-12">

        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ backgroundColor: "rgba(var(--royal-rgb),0.07)", filter: "blur(80px)" }} />
        </div>

        <div className="relative w-full max-w-md">

          {/* Mobile logo */}
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-black text-white"
              style={{ background: `linear-gradient(135deg, ${T.royal}, var(--magenta), ${T.sky})`, boxShadow: `0 0 32px ${T.royalGlow}, var(--clay-raised-sm)` }}>
              R
            </div>
            <h1 className="text-2xl font-bold" style={{ color: T.textPri }}>Enterprise RAG</h1>
          </div>

          {/* Form card */}
          <div className="rounded-[32px] p-8" style={{ backgroundColor: T.bgCard, boxShadow: "var(--clay-raised-hov)" }}>
            <div className="mb-8">
              <h2 className="text-2xl font-bold" style={{ color: T.textPri }}>Create your account</h2>
              <p className="mt-1.5 text-base" style={{ color: T.textMuted }}>Join Enterprise RAG — free and open source</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl px-4 py-3 text-sm" style={{ border: "1px solid rgba(231,76,60,0.4)", backgroundColor: "rgba(231,76,60,0.10)", color: "#ff7675" }}>
                  {error}
                </div>
              )}

              {[
                { label: "Full name",        type: "text",     auto: "name",         val: username, set: setUsername, ph: "Jane Smith" },
                { label: "Email address",    type: "email",    auto: "email",        val: email,    set: setEmail,    ph: "you@example.com" },
                { label: "Password",         type: "password", auto: "new-password", val: password, set: setPassword, ph: "Min. 6 characters" },
                { label: "Confirm password", type: "password", auto: "new-password", val: confirm,  set: setConfirm,  ph: "Repeat your password" },
              ].map(({ label, type, auto, val, set, ph }) => (
                <div key={label}>
                  <label className="mb-2 block text-sm font-semibold" style={{ color: T.textSec }}>{label}</label>
                  <input type={type} autoComplete={auto} value={val}
                    onChange={e => set(e.target.value)} placeholder={ph}
                    className="w-full rounded-2xl px-4 py-3.5 text-base outline-none transition"
                    style={{ backgroundColor: T.bgInput, color: T.textPri, boxShadow: "var(--clay-pressed)" }}
                    onFocus={e => { e.currentTarget.style.boxShadow = "var(--clay-pressed), 0 0 0 3px rgba(var(--sky-rgb),0.14)"; }}
                    onBlur={e => { e.currentTarget.style.boxShadow = "var(--clay-pressed)"; }} />
                </div>
              ))}

              <div className="pt-2">
                <button type="submit" disabled={loading}
                  className="w-full rounded-2xl py-3.5 text-base font-semibold text-white transition-all duration-150"
                  style={{ background: `linear-gradient(135deg, ${T.royal}, var(--amber), ${T.sky})`, boxShadow: `0 4px 20px ${T.royalGlow}, var(--clay-raised)`, opacity: loading ? 0.6 : 1 }}
                  onMouseEnter={e => { if (!loading) { e.currentTarget.style.boxShadow = `0 4px 28px rgba(var(--royal-rgb),0.55), var(--clay-raised-hov)`; } }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 4px 20px ${T.royalGlow}, var(--clay-raised)`; }}>
                  {loading ? "Creating account…" : "Create account"}
                </button>
              </div>
            </form>
          </div>

          <p className="mt-6 text-center text-base" style={{ color: T.textMuted }}>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold transition-colors" style={{ color: T.sky }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
