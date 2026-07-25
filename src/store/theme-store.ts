"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  applyThemeClass,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme";

interface ThemeState {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
  syncFromSystem: () => void;
  hydrateTheme: () => void;
}

function resolveFromPreference(preference: ThemePreference): ResolvedTheme {
  return resolveTheme(preference);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      preference: "system",
      resolved: "dark",
      setPreference: (preference) => {
        const resolved = resolveFromPreference(preference);
        applyThemeClass(resolved);
        set({ preference, resolved });
      },
      syncFromSystem: () => {
        const { preference } = get();
        if (preference !== "system") return;
        const resolved = resolveFromPreference("system");
        applyThemeClass(resolved);
        set({ resolved });
      },
      hydrateTheme: () => {
        const { preference } = get();
        const resolved = resolveFromPreference(preference);
        applyThemeClass(resolved);
        set({ resolved });
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      partialize: (s) => ({ preference: s.preference }),
      onRehydrateStorage: () => (state) => {
        state?.hydrateTheme();
      },
    }
  )
);
