"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, getSession } from "@/lib/auth";

const T = {
  bg:        "#05080F",
  bgCard:    "rgba(8,18,36,0.88)",
  bgInput:   "rgba(11,26,48,0.92)",
  border:    "#132D5A",
  borderMid: "#1A3D7A",
  royal:     "#1359B9",
  sky:       "#9FE4FB",
  skyDim:    "rgba(159,228,251,0.08)",
  skyBorder: "rgba(159,228,251,0.22)",
  textPri:   "#EBF4FF",
  textSec:   "#9FE4FB",
  textMuted: "#4D82B8",
  green:     "#00C896",
  amber:     "#FFA94D",
};

const PILLS = [
  { icon: "◫", label: "Hybrid Search",   color: "#1359B9" },
  { icon: "◎", label: "LLM Generation",  color: "#9FE4FB" },
  { icon: "◈", label: "Cost Budgets",    color: "#00C896" },
  { icon: "◉", label: "Audit Log",       color: "#FFA94D" },
  { icon: "◐", label: "Multi-Tenancy",   color: "#9FE4FB" },
  { icon: "◇", label: "A/B Feedback",    color: "#1359B9" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [focusField, setFocusField] = useState<string | null>(null);

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

  if (loading) return (
    <div style={{ display:"flex", minHeight:"100vh", alignItems:"center", justifyContent:"center", background: T.bg }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:44, height:44, borderRadius:"50%", border:`2px solid ${T.border}`, borderTopColor: T.sky, animation:"spin 0.8s linear infinite" }} />
    </div>
  );

  return (
    <div style={{ display:"flex", minHeight:"100vh", background: T.bg }}>

      {/* ── Injected animations ─────────────────────────────────────────── */}
      <style>{`
        @keyframes spin   { to { transform:rotate(360deg) } }
        @keyframes drift1 { 0%,100%{transform:translate(0,0)scale(1)} 33%{transform:translate(24px,-28px)scale(1.07)} 66%{transform:translate(-16px,18px)scale(0.95)} }
        @keyframes drift2 { 0%,100%{transform:translate(0,0)scale(1)} 40%{transform:translate(-20px,24px)scale(1.05)} 70%{transform:translate(14px,-14px)scale(0.97)} }
        @keyframes fadeup { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes gtext  { 0%{background-position:0% center} 100%{background-position:200% center} }
        @keyframes pulseGreen { 0%,100%{box-shadow:0 0 0 0 rgba(0,200,150,0.5)} 50%{box-shadow:0 0 0 6px rgba(0,200,150,0)} }

        .hero-title {
          font-size: clamp(36px, 4.5vw, 58px);
          font-weight: 900;
          line-height: 1.08;
          letter-spacing: -1.5px;
          background: linear-gradient(135deg, #EBF4FF 0%, #9FE4FB 45%, #6BAED6 80%, #1359B9 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gtext 5s linear infinite;
        }
        .form-input {
          width: 100%;
          box-sizing: border-box;
          padding: 14px 18px;
          border-radius: 12px;
          font-size: 15px;
          border: 1px solid #1A3D7A;
          background: rgba(11,26,48,0.92);
          color: #EBF4FF;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .form-input:focus {
          border-color: #9FE4FB;
          box-shadow: 0 0 0 3px rgba(159,228,251,0.14), 0 0 20px rgba(19,89,185,0.20);
        }
        .form-input::placeholder { color: #1E3A5A; }
        .submit-btn {
          width: 100%;
          padding: 15px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          color: white;
          border: none;
          cursor: pointer;
          background: linear-gradient(135deg, #0E4A9A 0%, #1359B9 40%, #1A6ED9 70%, #2480F0 100%);
          background-size: 200% auto;
          box-shadow: 0 4px 24px rgba(19,89,185,0.45), inset 0 1px 0 rgba(255,255,255,0.15);
          transition: background-position 0.4s, box-shadow 0.3s, transform 0.15s;
        }
        .submit-btn:hover:not(:disabled) {
          background-position: right center;
          box-shadow: 0 0 40px rgba(19,89,185,0.65), 0 6px 20px rgba(19,89,185,0.40), inset 0 1px 0 rgba(255,255,255,0.15);
          transform: translateY(-2px);
        }
        .submit-btn:active { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .pill-item {
          display: flex; align-items: center; gap: 7px;
          padding: 8px 16px; border-radius: 999px;
          font-size: 13px; font-weight: 600; color: #EBF4FF;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .pill-item:hover { transform: translateY(-2px); }
        .stat-item { text-align: center; padding: 0 28px; }
        .stat-item + .stat-item { border-left: 1px solid rgba(19,89,185,0.28); }
      `}</style>

      {/* ══ LEFT PANEL ══════════════════════════════════════════════════════ */}
      <div style={{
        flex: "0 0 54%", position: "relative", overflow: "hidden",
        display: "flex", flexDirection: "column",
      }}>

        {/* Deep layered background */}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(150deg, #05080F 0%, #07111F 35%, #08152A 60%, #060D1A 100%)" }} />

        {/* Grid */}
        <div style={{
          position:"absolute", inset:0,
          backgroundImage: `linear-gradient(rgba(19,89,185,0.10) 1px,transparent 1px), linear-gradient(90deg,rgba(19,89,185,0.10) 1px,transparent 1px)`,
          backgroundSize: "54px 54px",
        }} />

        {/* Floating orbs */}
        <div style={{ position:"absolute", top:"-8%", left:"-10%", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle, rgba(19,89,185,0.30) 0%, transparent 60%)", animation:"drift1 13s ease-in-out infinite" }} />
        <div style={{ position:"absolute", bottom:"0%", right:"-8%", width:520, height:520, borderRadius:"50%", background:"radial-gradient(circle, rgba(159,228,251,0.15) 0%, transparent 60%)", animation:"drift2 16s ease-in-out infinite" }} />
        <div style={{ position:"absolute", top:"38%", left:"42%", width:320, height:320, borderRadius:"50%", background:"radial-gradient(circle, rgba(19,89,185,0.12) 0%, transparent 60%)", animation:"drift1 10s ease-in-out infinite reverse" }} />

        {/* Right edge glow border */}
        <div style={{ position:"absolute", top:0, right:0, bottom:0, width:"1px", background:"linear-gradient(180deg, transparent 0%, rgba(159,228,251,0.40) 35%, rgba(19,89,185,0.50) 65%, transparent 100%)" }} />

        {/* ── Content ── */}
        <div style={{ position:"relative", zIndex:2, display:"flex", flexDirection:"column", justifyContent:"space-between", height:"100%", padding:"44px 52px" }}>

          {/* Top: Logo */}
          <div>
            <Link href="/landing" style={{ display:"inline-flex", alignItems:"center", gap:12, textDecoration:"none" }}>
              <div style={{
                width:42, height:42, borderRadius:11, flexShrink:0,
                background:"linear-gradient(135deg, #1359B9, #9FE4FB)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:18, fontWeight:900, color:"white",
                boxShadow:"0 0 28px rgba(19,89,185,0.60)",
              }}>R</div>
              <span style={{ fontSize:17, fontWeight:700, color: T.textPri, letterSpacing:"-0.3px" }}>Enterprise RAG</span>
            </Link>
          </div>

          {/* Middle: Hero */}
          <div style={{ animation:"fadeup 0.7s ease both" }}>
            {/* Status badge */}
            <div style={{
              display:"inline-flex", alignItems:"center", gap:8,
              padding:"7px 18px", borderRadius:999, marginBottom:28,
              background:"rgba(0,200,150,0.10)", border:"1px solid rgba(0,200,150,0.28)",
            }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background: T.green, display:"inline-block", animation:"pulseGreen 2s ease infinite" }} />
              <span style={{ fontSize:13, fontWeight:600, color: T.green }}>All systems operational</span>
            </div>

            {/* Headline */}
            <h1 className="hero-title" style={{ margin:"0 0 20px" }}>
              Private AI<br />Knowledge Engine
            </h1>

            <p style={{ fontSize:16, color: T.textMuted, lineHeight:1.80, maxWidth:400, marginBottom:40 }}>
              Index any document, ask natural-language questions, get cited answers — running entirely in your own infrastructure with zero cloud dependencies.
            </p>

            {/* Pills */}
            <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
              {PILLS.map(p => (
                <div key={p.label} className="pill-item" style={{
                  background:`${p.color}16`, border:`1px solid ${p.color}38`,
                }}>
                  <span style={{ color:p.color, fontSize:14 }}>{p.icon}</span>
                  <span>{p.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom: Stats */}
          <div style={{ display:"flex" }}>
            {[["25","Features"],["867","Tests"],["0","Paid APIs"]].map(([v,l]) => (
              <div key={l} className="stat-item">
                <div style={{ fontSize:30, fontWeight:900, color: T.sky, lineHeight:1 }}>{v}</div>
                <div style={{ fontSize:12, color: T.textMuted, marginTop:5 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ RIGHT PANEL ═════════════════════════════════════════════════════ */}
      <div style={{
        flex:1, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        padding:"48px 32px", position:"relative", background: T.bg,
      }}>

        {/* Center glow */}
        <div style={{
          position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
          width:500, height:500, borderRadius:"50%",
          background:"radial-gradient(circle, rgba(19,89,185,0.10) 0%, transparent 65%)",
          pointerEvents:"none",
        }} />

        <div style={{ position:"relative", width:"100%", maxWidth:400 }}>

          {/* Card */}
          <div style={{
            padding:"40px 38px",
            borderRadius:24,
            border:"1px solid rgba(19,89,185,0.35)",
            background: T.bgCard,
            backdropFilter:"blur(20px)",
            WebkitBackdropFilter:"blur(20px)",
            boxShadow:"0 32px 100px rgba(5,8,15,0.75), 0 0 0 1px rgba(255,255,255,0.03) inset, 0 1px 0 rgba(255,255,255,0.06) inset",
            animation:"fadeup 0.65s 0.1s ease both",
          }}>

            {/* Card header */}
            <div style={{ marginBottom:32 }}>
              <div style={{
                display:"inline-flex", width:52, height:52, borderRadius:14, marginBottom:20,
                background:"linear-gradient(135deg, #1359B9, #9FE4FB)",
                alignItems:"center", justifyContent:"center",
                fontSize:22, fontWeight:900, color:"white",
                boxShadow:"0 4px 20px rgba(19,89,185,0.50)",
              }}>R</div>
              <h2 style={{ fontSize:26, fontWeight:800, color: T.textPri, margin:"0 0 8px", letterSpacing:"-0.5px" }}>
                Welcome back
              </h2>
              <p style={{ fontSize:15, color: T.textMuted, margin:0 }}>Sign in to continue to Enterprise RAG</p>
            </div>

            <form onSubmit={onSubmit} style={{ display:"flex", flexDirection:"column", gap:20 }}>

              {error && (
                <div style={{
                  padding:"12px 16px", borderRadius:10,
                  border:"1px solid rgba(231,76,60,0.40)", background:"rgba(231,76,60,0.10)",
                  fontSize:14, color:"#ff7675", lineHeight:1.5,
                }}>{error}</div>
              )}

              <div>
                <label style={{ display:"block", fontSize:14, fontWeight:600, color: T.textSec, marginBottom:8 }}>
                  Email address
                </label>
                <input
                  type="email" autoComplete="email" value={email}
                  onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                  className="form-input"
                />
              </div>

              <div>
                <label style={{ display:"block", fontSize:14, fontWeight:600, color: T.textSec, marginBottom:8 }}>
                  Password
                </label>
                <input
                  type="password" autoComplete="current-password" value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="Enter your password"
                  className="form-input"
                />
              </div>

              <div style={{ paddingTop:4 }}>
                <button type="submit" disabled={loading} className="submit-btn">
                  {loading ? "Signing in…" : "Sign in →"}
                </button>
              </div>

            </form>
          </div>

          {/* Below card */}
          <div style={{ textAlign:"center", marginTop:24 }}>
            <p style={{ fontSize:15, color: T.textMuted, margin:"0 0 10px" }}>
              Don&apos;t have an account?{" "}
              <Link href="/signup" style={{ color: T.sky, fontWeight:700, textDecoration:"none" }}>Create one</Link>
            </p>
            <Link href="/landing" style={{ fontSize:13, color: T.textMuted, textDecoration:"none", opacity:0.6 }}>
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
