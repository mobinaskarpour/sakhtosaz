"use client";

import { motion } from "framer-motion";
import { Sun, Moon, Monitor } from "lucide-react";
import { spring } from "@/lib/motion";
import { useReducedMotion } from "@/components/motion";
import { uiLabels } from "@/config/labels";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/theme-store";
import type { ThemePreference } from "@/lib/theme";

const options: {
  value: ThemePreference;
  label: string;
  Icon: typeof Sun;
}[] = [
  { value: "light", label: uiLabels.themeLight, Icon: Sun },
  { value: "dark", label: uiLabels.themeDark, Icon: Moon },
  { value: "system", label: uiLabels.themeSystem, Icon: Monitor },
];

export function ThemeSwitcher() {
  const reduced = useReducedMotion();
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);

  return (
    <div
      role="radiogroup"
      aria-label={uiLabels.themeSwitcher}
      className="relative flex h-9 items-center rounded-[10px] border border-etch bg-slab p-0.5"
    >
      {options.map(({ value, label, Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setPreference(value)}
            className={cn(
              "relative z-[1] flex h-8 items-center justify-center gap-1 rounded-[8px] px-1.5 sm:px-2",
              "cursor-pointer transition-colors duration-[120ms]",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]",
              active ? "text-text-primary" : "text-text-tertiary hover:text-text-secondary"
            )}
          >
            {active && (
              <motion.span
                layoutId="theme-pill"
                className="absolute inset-0 rounded-[8px] bg-slab-raised border border-etch-strong shadow-[var(--shadow-sm)]"
                transition={reduced ? { duration: 0 } : spring.soft}
                aria-hidden
              />
            )}
            <Icon size={14} strokeWidth={1.7} className="relative z-[1] shrink-0" />
            <span className="relative z-[1] hidden md:inline text-[11px] font-medium whitespace-nowrap">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
