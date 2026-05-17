"use client";

import {
  Aperture,
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

// The big-ticket feature gets a hero row below; everything else lives in
// the two-column grid.
const lensFeature = {
  icon: Aperture,
  label: "Lenses — KI-Re-Ranking nach freiem Prompt",
  desc: "Beschreibe in ein, zwei Sätzen, wonach du im aktuellen Feed filtern willst — z.B. „Tools, die ich für KI-Workshops einsetzen kann“ oder „Konzepte, die ich in zwei Wochen nachbauen könnte“. Claude bewertet jeden Post auf einer Skala 0–10 und sortiert die Liste entsprechend um, mit 1-Satz-Begründung pro Treffer. Drei Vorlagen (Workflow, Nachbau, Diskussion) als Startpunkt, frei editierbar. Ergebnis pro Brille wird gecacht — eine bekannte Lens auf bekannte Posts kostet kein Token mehr.",
};

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
    label: "KI-Zusammenfassung pro Post",
    desc: "Auf der Detail-Seite: 3 Sätze zum Produkt aus Workshop-Perspektive plus Stimmungsbild der Kommentare.",
  },
  {
    icon: FileText,
    label: "Daily Digest als Markdown",
    desc: "Gestrige Top-10 nach Velocity, copy-paste-fertig für deinen Newsletter.",
  },
  {
    icon: Database,
    label: "Snapshots alle 6 Stunden",
    desc: "Datensammlung im Hintergrund. Basis für künftige Trend-Charts.",
  },
];

const phLimits = [
  "Keine transparente Velocity-Sortierung — nur Upvotes oder das interne Ranking",
  "Kein KI-Re-Ranking nach eigenem freien Prompt",
  "Keine personalisierte KI-Zusammenfassung mit deiner Brille",
  "Keine teilbaren Multi-Topic-Filter-URLs",
  "Keine private Merkliste außerhalb des PH-Accounts",
  "Kein Markdown-Export für eigene Newsletter",
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
            Ein persönliches Product-Hunt-Dashboard mit Velocity-Ranking,
            freiem KI-Filter (Lenses), eigener Watchlist und einem
            wachsenden Daten-Pool — Dinge, die die Product-Hunt-Website
            selbst nicht hergibt.
          </DialogDescription>
        </DialogHeader>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Was es kann
          </h3>

          {/* Hero row for the standout feature, with a soft brand accent. */}
          {(() => {
            const LensIcon = lensFeature.icon;
            return (
              <div className="rounded-lg border border-brand/30 bg-brand/5 px-4 py-3">
                <div className="flex gap-3">
                  <LensIcon
                    className="mt-0.5 size-5 shrink-0 text-brand"
                    aria-hidden
                  />
                  <div>
                    <div className="text-sm font-semibold leading-tight">
                      {lensFeature.label}
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      {lensFeature.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

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
