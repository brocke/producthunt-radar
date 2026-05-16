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
    desc: "Upvotes pro Stunde seit Launch — junge Wachstumssterne schlagen alte Schwergewichte.",
  },
  {
    icon: Filter,
    label: "Topic-Filter mit URL-State",
    desc: "Mehrere Topics gleichzeitig. Filter überleben den Refresh und sind teilbar.",
  },
  {
    icon: Star,
    label: "Watchlist",
    desc: "Eigene Merkliste in lokaler Datenbank — unabhängig vom Product-Hunt-Account.",
  },
  {
    icon: Sparkles,
    label: "KI-Zusammenfassung auf Knopfdruck",
    desc: "3 Sätze zum Produkt aus deiner KI-Workshop-Brille — plus Stimmungsbild der Kommentare.",
  },
  {
    icon: FileText,
    label: "Daily Digest als Markdown",
    desc: "Gestrige Top-10 nach Velocity, copy-paste-fertig für deinen Newsletter.",
  },
  {
    icon: Database,
    label: "Snapshots alle 6 Stunden",
    desc: "Datensammlung im Hintergrund. Basis für Trend-Charts und Sleeper-Hit-Erkennung.",
  },
];

const phLimits = [
  "Keine transparente Velocity-Sortierung — nur Upvotes oder das interne Ranking",
  "Keine Wachstums-Historie pro Post (Sleeper-Hits bleiben unsichtbar)",
  "Keine personalisierte KI-Zusammenfassung mit deiner Brille",
  "Keine teilbaren Multi-Topic-Filter-URLs",
  "Keine private Merkliste mit eigenen Notizen",
  "Kein Markdown-Export, kein Datenzugriff für eigene Auswertungen",
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
            Warum es das gibt
          </DialogTitle>
          <DialogDescription>
            Ein persönliches Product-Hunt-Dashboard mit Geschwindigkeits-Ranking,
            KI-Verdichtung und einem wachsenden Daten-Pool — Dinge, die die
            Product-Hunt-Website selbst nicht hergibt.
          </DialogDescription>
        </DialogHeader>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Was es kann
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

        <section className="space-y-3 rounded-lg border border-foreground/10 bg-muted/60 px-5 py-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Was Product Hunt nicht bietet
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
