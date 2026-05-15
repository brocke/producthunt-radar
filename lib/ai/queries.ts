// Read-side helpers for cached AI summaries. Server-only.

import { eq } from "drizzle-orm";

import { aiSummaries, type AiSummaryRow } from "@/db/schema";
import { db } from "@/lib/db";

export function getCachedSummary(
  phPostId: string,
): AiSummaryRow | undefined {
  return db
    .select()
    .from(aiSummaries)
    .where(eq(aiSummaries.phPostId, phPostId))
    .get();
}
