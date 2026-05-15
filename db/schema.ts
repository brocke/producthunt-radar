// Drizzle schema for ProductHunt Radar.
// See plan.md §7 for the intended scope.

import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Posts the user explicitly starred. We denormalize a few PH fields
 * (name, tagline, thumbnail) so the watchlist page can render without
 * hitting the PH API for every entry.
 */
export const watchlist = sqliteTable("watchlist", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  phPostId: text("ph_post_id").notNull().unique(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  tagline: text("tagline"),
  thumbnailUrl: text("thumbnail_url"),
  addedAt: integer("added_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  note: text("note"),
});

export type WatchlistRow = typeof watchlist.$inferSelect;
export type WatchlistInsert = typeof watchlist.$inferInsert;
