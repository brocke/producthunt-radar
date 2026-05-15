"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { watchlist } from "@/db/schema";
import { db } from "@/lib/db";

export type WatchlistItemInput = {
  phPostId: string;
  slug: string;
  name: string;
  tagline?: string | null;
  thumbnailUrl?: string | null;
};

export type ToggleResult = { inWatchlist: boolean };

/**
 * Star or un-star a post. Returns the new state so the optimistic
 * client-side toggle can reconcile if it differs.
 */
export async function toggleWatchlist(
  item: WatchlistItemInput,
): Promise<ToggleResult> {
  const existing = db
    .select({ id: watchlist.id })
    .from(watchlist)
    .where(eq(watchlist.phPostId, item.phPostId))
    .get();

  if (existing) {
    db.delete(watchlist).where(eq(watchlist.phPostId, item.phPostId)).run();
    revalidatePath("/");
    revalidatePath("/watchlist");
    return { inWatchlist: false };
  }

  db.insert(watchlist)
    .values({
      phPostId: item.phPostId,
      slug: item.slug,
      name: item.name,
      tagline: item.tagline ?? null,
      thumbnailUrl: item.thumbnailUrl ?? null,
    })
    .run();
  revalidatePath("/");
  revalidatePath("/watchlist");
  return { inWatchlist: true };
}
