"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "nft-sweep-depth-theme";

type ThemeMode = "dark" | "light";

function applyTheme(mode: ThemeMode) {
  document.documentElement.classList.toggle("theme-light", mode === "light");
  document.documentElement.style.colorScheme = mode;
}

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("dark");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      const initialMode: ThemeMode = saved === "light" ? "light" : "dark";

      setMode(initialMode);
      applyTheme(initialMode);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  function toggleTheme() {
    const nextMode: ThemeMode = mode === "dark" ? "light" : "dark";

    setMode(nextMode);
    applyTheme(nextMode);
    window.localStorage.setItem(STORAGE_KEY, nextMode);
  }

  return (
    <button
      aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-700 text-lg text-slate-200 transition hover:border-cyan-400/60 hover:text-cyan-100"
      onClick={toggleTheme}
      title={mode === "dark" ? "Light mode" : "Dark mode"}
      type="button"
    >
      {mode === "dark" ? "☀" : "☾"}
    </button>
  );
}
