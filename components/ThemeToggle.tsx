"use client";

import { useTheme } from "@/lib/theme";

export default function ThemeToggle() {
  const [theme, toggle] = useTheme();

  return (
    <button
      onClick={toggle}
      className="theme-toggle"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="theme-toggle__knob">{theme === "dark" ? "🌙" : "☀️"}</span>
    </button>
  );
}
