"use client";

import { useState, useTransition, useOptimistic, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DEFAULT_LENSES,
  DEFAULT_LENS_KEYS,
  findMatchingDefaultLens,
} from "@/lib/lenses/defaults";
import { cn } from "@/lib/utils";

/**
 * The lens UI: a free-text prompt field plus three template buttons that
 * pre-fill it. The active prompt is whatever sits in the URL right now —
 * either an empty state (no lens), one of the default prompts (templated)
 * or an arbitrary custom prompt. The textarea is the user's draft; nothing
 * is sent to Claude until "Anwenden" is clicked.
 */
export function LensSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lensParam = searchParams.get("lens");
  const customQ = searchParams.get("q") ?? "";

  // The "active" prompt that's currently filtering the feed (from URL).
  const activePrompt =
    lensParam && lensParam !== "custom"
      ? (DEFAULT_LENSES[lensParam as keyof typeof DEFAULT_LENSES]?.prompt ?? "")
      : lensParam === "custom"
        ? customQ
        : "";

  // Local textarea state — user's draft, may differ from activePrompt.
  const [draft, setDraft] = useState(activePrompt);
  const [isPending, startTransition] = useTransition();

  const [optimisticActive, setOptimisticActive] = useOptimistic(activePrompt);

  // When activePrompt changes (e.g. after Apply settles or external nav),
  // sync the draft so the field stays consistent with what's actually
  // filtering the feed.
  useEffect(() => {
    setDraft(activePrompt);
  }, [activePrompt]);

  function applyDraft() {
    const prompt = draft.trim();
    const params = new URLSearchParams(searchParams.toString());
    if (!prompt) {
      params.delete("lens");
      params.delete("q");
    } else {
      const matchKey = findMatchingDefaultLens(prompt);
      if (matchKey) {
        params.set("lens", matchKey);
        params.delete("q");
      } else {
        params.set("lens", "custom");
        params.set("q", prompt);
      }
    }
    const qs = params.toString();
    startTransition(() => {
      setOptimisticActive(prompt);
      router.push(qs ? `/?${qs}` : "/", { scroll: false });
    });
  }

  function clearLens() {
    setDraft("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("lens");
    params.delete("q");
    const qs = params.toString();
    startTransition(() => {
      setOptimisticActive("");
      router.push(qs ? `/?${qs}` : "/", { scroll: false });
    });
  }

  function fillFromTemplate(key: keyof typeof DEFAULT_LENSES) {
    setDraft(DEFAULT_LENSES[key].prompt);
  }

  // Which template (if any) matches the draft right now? Used to highlight
  // the template button.
  const draftMatchKey = findMatchingDefaultLens(draft);
  const isDirty = draft.trim() !== optimisticActive.trim();
  const hasLens = optimisticActive.trim().length > 0;

  return (
    <section className="rounded-lg border border-foreground/10 bg-muted/40 px-4 py-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
        <Sparkles className="size-3.5 text-foreground/70" aria-hidden />
        Lenses
        <span className="text-muted-foreground/80 normal-case font-normal tracking-normal">
          — KI-Re-Ranking nach freiem Prompt
        </span>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Vorlagen:</span>
        {DEFAULT_LENS_KEYS.map((key) => {
          const def = DEFAULT_LENSES[key];
          const isMatch = draftMatchKey === key;
          return (
            <Button
              key={key}
              variant={isMatch ? "default" : "outline"}
              size="sm"
              onClick={() => fillFromTemplate(key)}
              title={def.description}
              type="button"
            >
              {def.label}
            </Button>
          );
        })}
      </div>

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Beschreibe in ein, zwei Sätzen, wonach gefiltert werden soll — oder wähle eine Vorlage oben."
        className={cn(
          "w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
          isPending && "animate-pulse",
        )}
        rows={3}
        maxLength={800}
        onKeyDown={(e) => {
          // Cmd/Ctrl+Enter = Anwenden
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            if (draft.trim().length >= 3 && (isDirty || !hasLens)) {
              applyDraft();
            }
          }
        }}
      />

      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {hasLens && !isDirty && (
            <>
              Aktive Lens:{" "}
              <span className="font-medium text-foreground">
                {draftMatchKey
                  ? DEFAULT_LENSES[draftMatchKey].label
                  : "Eigener Prompt"}
              </span>
            </>
          )}
          {hasLens && isDirty && (
            <span className="italic">
              Geändert — „Anwenden" für neue Sortierung.
            </span>
          )}
          {!hasLens && draft.trim().length > 0 && (
            <span className="italic">
              Bereit zum Anwenden.
            </span>
          )}
        </p>
        <div className="flex items-center gap-1.5">
          {hasLens && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearLens}
              className="gap-1 text-muted-foreground"
              type="button"
            >
              <X className="size-3.5" aria-hidden />
              Aufheben
            </Button>
          )}
          <Button
            size="sm"
            onClick={applyDraft}
            disabled={
              isPending ||
              draft.trim().length < 3 ||
              (!isDirty && hasLens)
            }
            className={cn(isPending && "animate-pulse")}
            type="button"
          >
            Anwenden
          </Button>
        </div>
      </div>
    </section>
  );
}
