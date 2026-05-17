"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const REFERRER_LABELS: Record<string, string> = {
  "/watchlist": "Back to Watchlist",
  "/digest": "Back to Digest",
};

/**
 * "Back" navigation that preserves the previous page's URL state (sort,
 * lens, topic filters etc.) by going through browser history. Falls back
 * to a plain push if there's no history to return to (direct link, page
 * reload, etc.). Adjusts its label based on document.referrer so it reads
 * "Back to Watchlist" when you came from /watchlist, etc.
 */
export function BackLink({
  fallback = "/",
  fallbackLabel = "Back to feed",
  className,
}: {
  fallback?: string;
  fallbackLabel?: string;
  className?: string;
}) {
  const router = useRouter();
  const [label, setLabel] = useState(fallbackLabel);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ref = document.referrer;
    if (!ref) return;
    try {
      const url = new URL(ref);
      if (url.origin !== window.location.origin) return;
      const matched = REFERRER_LABELS[url.pathname];
      if (matched) setLabel(matched);
    } catch {
      // referrer not parseable — keep fallback label
    }
  }, []);

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
