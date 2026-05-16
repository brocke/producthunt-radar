"use client";

import {
  Database,
  FileText,
  Filter,
  Gauge,
  Info,
  Sparkles,
  Star,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const features = [
  {
    icon: Gauge,
    label: "Velocity-Ranking",
    desc: "votes / Stunden seit Launch — junge Wachstumssterne schlagen alte Schwergewichte.",
  },
  {
    icon: Filter,
    label: "Topic-Filter mit URL-State",
    desc: "Multi-Select; Filter sind teilbar und überleben den Refresh.",
  },
  {
    icon: Star,
    label: "Watchlist",
    desc: "Eigene Merkliste, persistent in lokaler SQLite — nicht im PH-Account.",
  },
  {
    icon: Sparkles,
    label: "AI-Summary auf Knopfdruck",
    desc: "3-Satz-Synthese aus KI-Workshop-Perspektive + Tonalitäts-Read der Kommentare.",
  },
  {
    icon: FileText,
    label: "Daily Digest als Markdown",
    desc: "Gestrige Top-10 by Velocity, copy-paste-fertig für Newsletter o.ä.",
  },
  {
    icon: Database,
    label: "Snapshots alle 6h",
    desc: "Append-only-Tabelle als Basis für künftige Trend-Charts und Sleeper-Hit-Erkennung.",
  },
];

const phLimits = [
  "Keine transparente Velocity-Sortierung — nur Total-Upvotes oder ihr internes Ranking",
  "Keine Wachstums-Historie pro Post (Sleeper-Hits bleiben unsichtbar)",
  "Keine personalisierte KI-Zusammenfassung mit deiner Brille",
  "Keine teilbaren Multi-Topic-Filter-URLs",
  "Keine private Merkliste mit eigenen Notizen",
  "Kein Markdown-Export, kein Daten-Zugriff für eigene Auswertungen",
];

export function AboutDialog() {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            aria-label="About ProductHunt Radar"
          >
            <Info className="size-4" aria-hidden />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Why this exists
          </DialogTitle>
          <DialogDescription>
            Ein persönliches PH-Dashboard mit Geschwindigkeits-Ranking,
            KI-Verdichtung und einem wachsenden Daten-Pool — Dinge, die die
            ProductHunt-Website selbst nicht hergibt.
          </DialogDescription>
        </DialogHeader>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What it does
          </h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {features.map(({ icon: Icon, label, desc }) => (
              <li key={label} className="flex gap-3">
                <Icon
                  className="mt-0.5 size-4 shrink-0 text-foreground/60"
                  aria-hidden
                />
                <div>
                  <div className="text-sm font-medium leading-tight">
                    {label}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {desc}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-2.5 rounded-md border bg-muted/40 px-4 py-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What ProductHunt itself doesn{"’"}t do
          </h3>
          <ul className="space-y-1.5">
            {phLimits.map((limit) => (
              <li
                key={limit}
                className="flex gap-2.5 text-sm text-muted-foreground"
              >
                <span
                  className="mt-2 size-1 shrink-0 rounded-full bg-foreground/50"
                  aria-hidden
                />
                <span className="leading-relaxed">{limit}</span>
              </li>
            ))}
          </ul>
        </section>
      </DialogContent>
    </Dialog>
  );
}
