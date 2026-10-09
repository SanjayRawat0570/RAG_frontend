"use client";

// Purely presentational effects — no data fetching or app state lives here.

import { useEffect, useRef, useState } from "react";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Feeds the pointer position into `--mx` / `--my` on whichever `.card` is
 * under the cursor, powering the CSS spotlight glow. One listener for the app.
 */
export function SpotlightProvider() {
  useEffect(() => {
    function onMove(e: PointerEvent) {
      const el = (e.target as Element | null)?.closest?.(".card") as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    }
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => document.removeEventListener("pointermove", onMove);
  }, []);
  return null;
}

/** Animates the first number found in `value`, keeping its prefix/suffix and decimals. */
export function CountUp({ value, duration = 900 }: { value: string; duration?: number }) {
  const match = value.match(/^([^\d-]*)(-?\d+(?:\.\d+)?)(.*)$/);
  const target = match ? parseFloat(match[2]) : NaN;
  const decimals = match?.[2].split(".")[1]?.length ?? 0;
  const [shown, setShown] = useState(isNaN(target) ? value : formatWith(0));

  function formatWith(n: number) {
    return `${match?.[1] ?? ""}${n.toFixed(decimals)}${match?.[3] ?? ""}`;
  }

  useEffect(() => {
    if (isNaN(target)) { setShown(value); return; }
    if (prefersReducedMotion()) { setShown(value); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(formatWith(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick); else setShown(value);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{shown}</>;
}

/** Reveals `text` progressively; click to skip. Renders instantly when `animate` is false. */
export function Typewriter({ text, animate, className, style }: {
  text: string; animate: boolean; className?: string; style?: React.CSSProperties;
}) {
  const [count, setCount] = useState(animate ? 0 : text.length);

  useEffect(() => {
    if (!animate || prefersReducedMotion()) { setCount(text.length); return; }
    setCount(0);
    const step = Math.max(1, Math.ceil(text.length / 90));
    const id = setInterval(() => {
      setCount(c => {
        if (c + step >= text.length) { clearInterval(id); return text.length; }
        return c + step;
      });
    }, 16);
    return () => clearInterval(id);
  }, [text, animate]);

  const typing = count < text.length;
  return (
    <div className={`${className ?? ""}${typing ? " caret" : ""}`} style={style}
      onClick={() => setCount(text.length)} title={typing ? "Click to show full answer" : undefined}>
      {text.slice(0, count)}
    </div>
  );
}

/** 3D tilt that follows the pointer. */
export function Tilt({ children, max = 8, className }: { children: React.ReactNode; max?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.PointerEvent) {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1000px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`;
  }
  function onLeave() { if (ref.current) ref.current.style.transform = ""; }

  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} className={className}
      style={{ transition: "transform .2s ease-out", transformStyle: "preserve-3d" }}>
      {children}
    </div>
  );
}
