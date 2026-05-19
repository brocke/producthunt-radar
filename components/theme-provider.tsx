"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

/**
 * Client-side wrapper for next-themes. Mounts in the root layout so the
 * `dark` class on <html> is set early (next-themes uses a small inline
 * script to avoid a flash of wrong theme).
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
