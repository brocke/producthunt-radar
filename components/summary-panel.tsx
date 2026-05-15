"use client";

import { Sparkles } from "lucide-react";
import { useState, useTransition } from "react";

import { generateOrFetchSummary } from "@/lib/ai/actions";
import { Button } from "@/components/ui/button";

type SummaryState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; text: string }
  | { status: "error"; message: string };

export function SummaryPanel({
  slug,
  initialSummary,
}: {
  slug: string;
  initialSummary: string | null;
}) {
  const [state, setState] = useState<SummaryState>(
    initialSummary
      ? { status: "ready", text: initialSummary }
      : { status: "idle" },
  );
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setState({ status: "loading" });
    startTransition(async () => {
      const result = await generateOrFetchSummary(slug);
      if (result.ok) {
        setState({ status: "ready", text: result.summary });
      } else {
        setState({ status: "error", message: result.error });
      }
    });
  }

  if (state.status === "ready") {
    return (
      <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-4 text-sm leading-relaxed text-foreground/90 dark:border-amber-500/20 dark:bg-amber-500/5">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
          <Sparkles className="size-3.5" aria-hidden />
          Claude-Zusammenfassung
        </div>
        <p className="whitespace-pre-wrap">{state.text}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-dashed p-4">
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        disabled={pending || state.status === "loading"}
        className="gap-1.5"
      >
        <Sparkles className="size-4" aria-hidden />
        {state.status === "loading" ? "Wird erstellt…" : "Mit Claude zusammenfassen"}
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">
        {state.status === "error"
          ? `Fehler: ${state.message}`
          : "Sonnet 4.6 fasst Produkt + Kommentar-Tonalität in vier Sätzen zusammen (~0.5 ct, einmal pro Post)."}
      </p>
    </div>
  );
}
