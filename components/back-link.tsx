"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const FROM_LABELS: Record<string, string> = {
  watchlist: "Back to Watchlist",
  digest: "Back to Digest",
};

/**
 * "Back" navigation that preserves the previous page's URL state (sort,
 * lens, topic filters etc.) by going through browser history. Falls back
 * to a plain push if there's no history to return to (direct link, page
 * reload, etc.).
 *
 * Label resolution order:
 *   1. explicit `from` prop (best — set via ?from= URL param by the
 *      linking page, works with client-side Next.js navigation)
 *   2. document.referrer (only set on hard page loads, kept as a
 *      fallback for direct entries)
 *   3. fallbackLabel
 */
export function BackLink({
  fallback = "/",
  fallbackLabel = "Back to feed",
  from,
  className,
}: {
  fallback?: string;
  fallbackLabel?: string;
  from?: string;
  className?: string;
}) {
  const router = useRouter();
  const fromLabel = from ? FROM_LABELS[from] : undefined;
  const [label, setLabel] = useState(fromLabel ?? fallbackLabel);

  useEffect(() => {
    if (fromLabel) return;
    if (typeof window === "undefined") return;
    const ref = document.referrer;
    if (!ref) return;
    try {
      const url = new URL(ref);
      if (url.origin !== window.location.origin) return;
      const segment = url.pathname.replace(/^\//, "").split("/")[0];
      const matched = FROM_LABELS[segment];
      if (matched) setLabel(matched);
    } catch {
      // referrer not parseable — keep fallback label
    }
  }, [fromLabel]);

  function handleClick() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand",
        className,
      )}
    >
      <ArrowLeft className="size-4" aria-hidden />
      {label}
    </button>
  );
}
