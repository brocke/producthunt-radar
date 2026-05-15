"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

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
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <h2 className="text-lg font-semibold">Konnte den Feed nicht laden</h2>
        <p className="mt-2 text-sm break-words text-muted-foreground">
          {error.message}
        </p>
        <Button onClick={reset} variant="outline" className="mt-4">
          Erneut versuchen
        </Button>
      </div>
    </main>
  );
}
