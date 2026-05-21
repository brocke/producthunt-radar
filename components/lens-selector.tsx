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
import {
  useAnyTransitionPending,
  useReportTransitionPending,
} from "@/lib/transition-pending-context";
import { useTransitionHeartbeat } from "@/lib/use-transition-heartbeat";
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
  useReportTransitionPending(isPending);
  // True while any selector's transition is in flight (Range/Sort/Topic/
  // Lens). When the lens is active, those all trigger fresh Sonnet
  // scoring on the server — so we show the "Claude bewertet…" banner in
  // all of those cases, not just our own Apply click.
  const anyPending = useAnyTransitionPending();
  const showScoringBanner = isPending || (!!lensParam && anyPending);

  const [optimisticActive, setOptimisticActive] = useOptimistic(activePrompt);

  const elapsedSeconds = useTransitionHeartbeat(showScoringBanner);

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
  // Which template (if any) matches the currently *active* prompt — i.e. the
  // one that actually filters the feed right now. Stays stable while the
  // user types a new draft, so the Active-Lens pill keeps its label.
  const activeMatchKey = findMatchingDefaultLens(optimisticActive);
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
            "w-full rounded-md border border-input bg-background px-3 py-2 pr-9 text-sm leading-relaxed placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 disabled:opacity-100",
            isPending && "border-foreground/40 ring-2 ring-foreground/15",
          )}
          rows={6}
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
        {draft.length > 0 && !showScoringBanner && (
          <button
            type="button"
            onClick={() => setDraft("")}
            aria-label="Textfeld leeren"
            title="Textfeld leeren"
            className="absolute right-2 top-2 inline-flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        )}
        {showScoringBanner && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md bg-background/60 backdrop-blur-[2px]">
            <div className="pointer-events-auto mx-4 flex max-w-md flex-col items-center gap-2 rounded-lg border border-foreground/10 bg-background px-5 py-4 text-center shadow-md">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Loader2 className="size-4 animate-spin text-brand" aria-hidden />
                Claude bewertet die Posts
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Sonnet 4.6 sortiert die Liste nach deiner Brille. Erst-Anwendung
                dauert typisch <span className="font-medium text-foreground">1–3 Minuten</span> je nach Zeitraum;
                bekannte Posts kommen aus dem Cache und sind schneller.
              </p>
              <p className="text-xs tabular-nums text-muted-foreground">
                läuft seit {elapsedSeconds}s
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
          {hasLens && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand px-2.5 py-0.5 text-xs font-medium text-brand-foreground">
              <Sparkles className="size-3" aria-hidden />
              Aktive Lens:{" "}
              {activeMatchKey
                ? DEFAULT_LENSES[activeMatchKey].label
                : "Eigener Prompt"}
            </span>
          )}
          {hasLens && isDirty && draft.trim().length >= 3 && (
            <span className="text-xs italic text-muted-foreground">
              „Anwenden" für neue Sortierung.
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
                Sortiere…{" "}
                <span className="tabular-nums">{elapsedSeconds}s</span>
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
