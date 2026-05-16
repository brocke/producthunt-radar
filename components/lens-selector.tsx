"use client";

import { useState, useTransition, useOptimistic } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Wand2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DEFAULT_LENSES,
  DEFAULT_LENS_KEYS,
} from "@/lib/lenses/defaults";
import { cn } from "@/lib/utils";

export function LensSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentLens = searchParams.get("lens");
  const currentCustomQ = searchParams.get("q") ?? "";
  const [isPending, startTransition] = useTransition();
  // The optimistic lens reflects the user's click immediately so the
  // "active" highlight + pulsing indicator follow the new target, not
  // the previous one, during the Claude scoring round-trip.
  const [optimisticLens, setOptimisticLens] = useOptimistic(currentLens);
  const [optimisticCustomQ, setOptimisticCustomQ] =
    useOptimistic(currentCustomQ);

  function applyLens(key: string | null, customPrompt?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (key === null) {
      params.delete("lens");
      params.delete("q");
    } else {
      params.set("lens", key);
      if (key === "custom" && customPrompt) {
        params.set("q", customPrompt);
      } else {
        params.delete("q");
      }
    }
    const qs = params.toString();
    startTransition(() => {
      setOptimisticLens(key);
      setOptimisticCustomQ(key === "custom" ? (customPrompt ?? "") : "");
      router.push(qs ? `/?${qs}` : "/", { scroll: false });
    });
  }

  const activeLensLabel =
    optimisticLens && optimisticLens !== "custom"
      ? DEFAULT_LENSES[optimisticLens as keyof typeof DEFAULT_LENSES]?.label
      : optimisticLens === "custom"
        ? "Eigene Brille"
        : null;

  return (
    <section className="rounded-lg border border-foreground/10 bg-muted/40 px-4 py-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
        <Sparkles className="size-3.5 text-foreground/70" aria-hidden />
        Brillen
        <span className="text-muted-foreground/80 normal-case font-normal tracking-normal">
          — KI-gestützter Re-Ranking-Filter
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {DEFAULT_LENS_KEYS.map((key) => {
          const def = DEFAULT_LENSES[key];
          const active = optimisticLens === key;
          const pendingHere = isPending && active;
          return (
            <Button
              key={key}
              variant={active ? "default" : "outline"}
              size="sm"
              onClick={() => applyLens(active ? null : key)}
              title={def.description}
              className={cn(pendingHere && "animate-pulse")}
            >
              {def.label}
            </Button>
          );
        })}
        <CustomLensDialog
          active={optimisticLens === "custom"}
          currentPrompt={optimisticLens === "custom" ? optimisticCustomQ : ""}
          pending={isPending && optimisticLens === "custom"}
          onApply={(prompt) => applyLens("custom", prompt)}
        />
        {optimisticLens && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => applyLens(null)}
            aria-label="Brille entfernen"
            className="text-muted-foreground"
          >
            <X className="size-3.5" aria-hidden />
          </Button>
        )}
      </div>
      {optimisticLens === "custom" && optimisticCustomQ && (
        <div className="mt-2.5 flex items-start gap-2 rounded-md border border-foreground/10 bg-background/60 px-3 py-2 text-xs text-muted-foreground">
          <Wand2
            className="mt-0.5 size-3.5 shrink-0 text-foreground/60"
            aria-hidden
          />
          <p className="italic leading-relaxed">{optimisticCustomQ}</p>
        </div>
      )}
      {activeLensLabel && optimisticLens !== "custom" && (
        <p className="mt-2 text-xs text-muted-foreground">
          Aktive Brille: <span className="font-medium text-foreground">{activeLensLabel}</span>
        </p>
      )}
    </section>
  );
}

function CustomLensDialog({
  active,
  currentPrompt,
  pending,
  onApply,
}: {
  active: boolean;
  currentPrompt: string;
  pending: boolean;
  onApply: (prompt: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(currentPrompt);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed.length < 3) return;
    onApply(trimmed);
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setText(currentPrompt);
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant={active ? "default" : "outline"}
            size="sm"
            className={cn("gap-1", pending && "animate-pulse")}
          >
            <Wand2 className="size-3.5" aria-hidden />
            Eigene…
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-3">
          <DialogHeader>
            <DialogTitle>Eigene Brille</DialogTitle>
            <DialogDescription>
              Beschreibe in ein, zwei Sätzen, wonach gefiltert werden soll.
              Claude bewertet jeden Post auf einer Skala 0–10 und sortiert
              die Liste entsprechend um.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="z.B. 'Tools, die ich für Onboarding von Workshop-Teilnehmern einsetzen kann'"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            rows={3}
            autoFocus
            maxLength={500}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={text.trim().length < 3}>
              Anwenden
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
