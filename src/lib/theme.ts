import { useSyncExternalStore } from "react";

export type Theme = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "essay-grader-theme";
const META_LIGHT = "#faf9f6";
const META_DARK = "#0f1117";

// Listener set for external store subscription
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

export function getTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // localStorage unavailable
  }
  return "system";
}

export function getResolvedTheme(): ResolvedTheme {
  const theme = getTheme();
  if (theme === "light") return "light";
  if (theme === "dark") return "dark";
  // system: check matchMedia
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

function applyTheme(): void {
  const resolved = getResolvedTheme();
  const root = document.documentElement;

  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  // Update meta theme-color
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute("content", resolved === "dark" ? META_DARK : META_LIGHT);
  }

  notifyListeners();
}

export function setTheme(theme: Theme): void {
  try {
    if (theme === "system") {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, theme);
    }
  } catch {
    // localStorage unavailable
  }
  applyTheme();
}

export function toggleTheme(): void {
  const resolved = getResolvedTheme();
  setTheme(resolved === "light" ? "dark" : "light");
}

// Listen for system theme changes and apply them
try {
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => applyTheme());
} catch {
  // matchMedia unavailable
}

// Apply theme on module load (syncs .dark class with current preference)
if (typeof document !== "undefined") {
  applyTheme();
}

export function onThemeChange(callback: (resolved: ResolvedTheme) => void): () => void {
  const listener = () => callback(getResolvedTheme());
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

// React hook using useSyncExternalStore
export function useTheme() {
  const resolvedTheme = useSyncExternalStore(
    (callback) => {
      const unsub = onThemeChange(() => callback());
      return unsub;
    },
    getResolvedTheme,
    () => "light" as ResolvedTheme // server snapshot
  );

  return {
    theme: getTheme(),
    resolvedTheme,
    setTheme,
    toggleTheme,
  };
}
