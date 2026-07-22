"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

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
      const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
      const initialMode: ThemeMode = saved === "light" || (!saved && prefersLight) ? "light" : "dark";

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
      className="theme-toggle"
      onClick={toggleTheme}
      title={mode === "dark" ? "Light mode" : "Dark mode"}
      type="button"
    >
      {mode === "dark" ? <Sun aria-hidden="true" size={17} /> : <Moon aria-hidden="true" size={17} />}
    </button>
  );
}
