"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * Three-state theme toggle: Light / Dark / System.
 * Uses next-themes; renders a tiny placeholder until mounted to avoid
 * hydration mismatches (resolvedTheme is undefined server-side).
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        aria-label="Theme wählen"
        disabled
      >
        <Sun className="size-4" aria-hidden />
      </Button>
    );
  }

  return (
    <Select
      value={theme ?? "system"}
      onValueChange={(value) => value && setTheme(value)}
    >
      <SelectTrigger
        className={cn(
          // Match Button variant="outline" size="icon" sizing exactly.
          "size-8 p-0 [&>span]:flex [&>span]:size-full [&>span]:items-center [&>span]:justify-center",
        )}
        aria-label="Theme wählen"
      >
        <span>
          {theme === "dark" ? (
            <Moon className="size-4" aria-hidden />
          ) : theme === "light" ? (
            <Sun className="size-4" aria-hidden />
          ) : (
            <Monitor className="size-4" aria-hidden />
          )}
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light">
          <Sun className="size-4" aria-hidden />
          Hell
        </SelectItem>
        <SelectItem value="dark">
          <Moon className="size-4" aria-hidden />
          Dunkel
        </SelectItem>
        <SelectItem value="system">
          <Monitor className="size-4" aria-hidden />
          System
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
