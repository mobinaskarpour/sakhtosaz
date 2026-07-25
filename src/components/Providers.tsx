"use client";

import { useEffect } from "react";
import { MotionProvider } from "@/components/motion";
import { SessionGate } from "@/components/shell/SessionGate";
import { ToastStack } from "@/components/shell/ToastStack";
import { useDecisionStore } from "@/store/decision-store";
import { useThemeStore } from "@/store/theme-store";

export function Providers({ children }: { children: React.ReactNode }) {
  const ensureDefaults = useDecisionStore((s) => s.ensureDefaults);
  const hydrateTheme = useThemeStore((s) => s.hydrateTheme);
  const syncFromSystem = useThemeStore((s) => s.syncFromSystem);
  const preference = useThemeStore((s) => s.preference);

  useEffect(() => {
    hydrateTheme();
    ensureDefaults();
  }, [hydrateTheme, ensureDefaults]);

  useEffect(() => {
    if (preference !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => syncFromSystem();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [preference, syncFromSystem]);

  return (
    <MotionProvider>
      <SessionGate>
        {children}
        <ToastStack />
      </SessionGate>
    </MotionProvider>
  );
}
