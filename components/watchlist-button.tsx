"use client";

import { Star } from "lucide-react";
import { useState, useTransition } from "react";

import { cn } from "@/lib/utils";
import {
  toggleWatchlist,
  type WatchlistItemInput,
} from "@/lib/watchlist/actions";

export function WatchlistButton({
  post,
  initialActive,
}: {
  post: WatchlistItemInput;
  initialActive: boolean;
}) {
  const [active, setActive] = useState(initialActive);
  const [pending, startTransition] = useTransition();

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    // The whole card is a link-overlay — stop the click before it bubbles
    // to the underlying <a>.
    event.preventDefault();
    event.stopPropagation();

    // Optimistic toggle; reconcile with the server result.
    setActive((prev) => !prev);
    startTransition(async () => {
      const result = await toggleWatchlist(post);
      setActive(result.inWatchlist);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={active ? "Remove from watchlist" : "Add to watchlist"}
      aria-pressed={active}
      className={cn(
        "relative z-20 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
        active && "text-amber-500 hover:text-amber-600",
        pending && "opacity-60",
      )}
    >
      <Star
        className={cn("size-4 transition-all", active && "fill-current")}
        aria-hidden
      />
    </button>
  );
}
