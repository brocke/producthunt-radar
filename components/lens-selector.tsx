"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Wand2, X } from "lucide-react";

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
      router.push(qs ? `/?${qs}` : "/", { scroll: false });
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">Lens:</span>
      {DEFAULT_LENS_KEYS.map((key) => {
        const def = DEFAULT_LENSES[key];
        const active = currentLens === key;
        return (
          <Button
            key={key}
            variant={active ? "default" : "outline"}
            size="sm"
            onClick={() => applyLens(active ? null : key)}
            title={def.description}
            className={cn(
              isPending && active && "animate-pulse",
            )}
          >
            {def.label}
          </Button>
        );
      })}
      <CustomLensDialog
        active={currentLens === "custom"}
        currentPrompt={currentLens === "custom" ? currentCustomQ : ""}
        pending={isPending && currentLens === "custom"}
        onApply={(prompt) => applyLens("custom", prompt)}
      />
      {currentLens && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => applyLens(null)}
          aria-label="Lens entfernen"
          className="text-muted-foreground"
        >
          <X className="size-3.5" aria-hidden />
        </Button>
      )}
    </div>
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
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setText(currentPrompt); }}>
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
