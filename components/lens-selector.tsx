"use client";

import { useState, useTransition, useOptimistic, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Sparkles, X } from "lucide-react";

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

      <div className="relative">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Beschreibe in ein, zwei Sätzen, wonach gefiltert werden soll — oder wähle eine Vorlage oben."
          disabled={isPending}
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 disabled:opacity-100",
            isPending &&
              "border-foreground/40 ring-2 ring-foreground/15 [animation:pulse_1.4s_ease-in-out_infinite]",
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
        {isPending && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md bg-background/40 backdrop-blur-[1px]">
            <span className="flex items-center gap-2 rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background shadow-sm">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              Claude sortiert die Liste neu…
            </span>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          {hasLens && !isDirty && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-2.5 py-0.5 text-xs font-medium text-background">
              <Sparkles className="size-3" aria-hidden />
              Aktive Lens:{" "}
              {draftMatchKey
                ? DEFAULT_LENSES[draftMatchKey].label
                : "Eigener Prompt"}
            </span>
          )}
          {hasLens && isDirty && (
            <span className="text-xs italic text-muted-foreground">
              Geändert — „Anwenden" für neue Sortierung.
            </span>
          )}
          {!hasLens && draft.trim().length > 0 && (
            <span className="text-xs italic text-muted-foreground">
              Bereit zum Anwenden.
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {hasLens && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearLens}
              className="gap-1 text-muted-foreground"
              type="button"
              disabled={isPending}
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
            className="gap-1.5"
            type="button"
          >
            {isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                Wird sortiert…
              </>
            ) : (
              "Anwenden"
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}
