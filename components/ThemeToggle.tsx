"use client";

import { useTheme } from "@/lib/theme";
import Icon from "@/components/Icon";

/** `onDark` restyles the button for placement on the navy brand panel. */
export default function ThemeToggle({ onDark = false }: { onDark?: boolean }) {
  const [theme, toggle] = useTheme();
  const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button onClick={toggle} className={`theme-toggle${onDark ? " on-dark" : ""}`} aria-label={label} title={label}>
      <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
    </button>
  );
}
