"use client";

import { useEffect, useState, useTransition } from "react";
import { Moon, Sun } from "lucide-react";
import { persistThemePreference } from "@/app/actions/theme";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);
    document.documentElement.classList.toggle("dark", nextIsDark);
    const nextTheme = nextIsDark ? "dark" : "light";
    document.cookie = `taraz-theme=${nextTheme}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => {
      void persistThemePreference(nextTheme);
    });
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "تغییر به حالت روشن" : "تغییر به حالت تاریک"}
      title={isDark ? "تغییر به حالت روشن" : "تغییر به حالت تاریک"}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-colors hover:text-brand"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
