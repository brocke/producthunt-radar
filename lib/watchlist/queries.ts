// Read-side helpers for the watchlist. Server-only.

import { desc } from "drizzle-orm";

import { watchlist, type WatchlistRow } from "@/db/schema";
import { db } from "@/lib/db";

export function getWatchlist(): WatchlistRow[] {
  return db.select().from(watchlist).orderBy(desc(watchlist.addedAt)).all();
}

/**
 * Set of phPostIds currently on the watchlist. Used to decorate the feed
 * with the right star-button state.
 */
export function getWatchlistIds(): Set<string> {
  const rows = db
    .select({ phPostId: watchlist.phPostId })
    .from(watchlist)
    .all();
  return new Set(rows.map((r) => r.phPostId));
}
