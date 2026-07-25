export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "machine-theme";

export function getSystemDark(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveTheme(
  preference: ThemePreference,
  systemDark = getSystemDark()
): ResolvedTheme {
  if (preference === "system") return systemDark ? "dark" : "light";
  return preference;
}

export function applyThemeClass(resolved: ResolvedTheme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

/** Inline FOUC script — reads zustand persist JSON before paint. */
export const themeBootScript = `(function(){try{var k="${THEME_STORAGE_KEY}";var raw=localStorage.getItem(k);var pref="system";if(raw){var p=JSON.parse(raw);if(p&&p.state&&(p.state.preference==="light"||p.state.preference==="dark"||p.state.preference==="system"))pref=p.state.preference;}var dark=window.matchMedia("(prefers-color-scheme: dark)").matches;var resolved=pref==="system"?(dark?"dark":"light"):pref;var r=document.documentElement;r.classList.remove("dark","light");r.classList.add(resolved);r.style.colorScheme=resolved;}catch(e){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark";}})();`;
