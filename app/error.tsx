"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

function friendlyMessage(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes("rate limit") || m.includes("429")) {
    return "ProductHunt drosselt uns gerade kurz (API-Rate-Limit). Versuch's in 1–2 Minuten nochmal.";
  }
  if (
    m.includes("network error") ||
    m.includes("fetch failed") ||
    m.includes("econnreset") ||
    m.includes("etimedout")
  ) {
    return "Die Verbindung zur ProductHunt-API wurde unterbrochen. Meistens nur ein kurzer Hickser — einfach erneut versuchen.";
  }
  if (/code: 5\d\d/.test(m)) {
    return "ProductHunt hat gerade ein Server-Problem. Versuch's gleich nochmal.";
  }
  return raw;
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[page] error:", error);
  }, [error]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <h2 className="text-lg font-semibold">Konnte den Feed nicht laden</h2>
        <p className="mt-2 text-sm break-words text-muted-foreground">
          {friendlyMessage(error.message)}
        </p>
        <Button onClick={reset} variant="outline" className="mt-4">
          Erneut versuchen
        </Button>
      </div>
    </main>
  );
}
