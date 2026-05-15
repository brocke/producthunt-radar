"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { aiSummaries } from "@/db/schema";
import { db } from "@/lib/db";
import { summarizePost } from "@/lib/ai/summarize";
import { getPostDetails } from "@/lib/ph/posts";

export type SummarizeResult =
  | { ok: true; summary: string; cached: boolean }
  | { ok: false; error: string };

/**
 * Fetch (or generate + cache) the Claude summary for a post.
 * Returns the cached row on second+ calls — no further tokens spent.
 */
export async function generateOrFetchSummary(
  slug: string,
): Promise<SummarizeResult> {
  try {
    const post = await getPostDetails(slug);
    if (!post) {
      return { ok: false, error: `Post '${slug}' not found.` };
    }

    const existing = db
      .select()
      .from(aiSummaries)
      .where(eq(aiSummaries.phPostId, post.id))
      .get();
    if (existing) {
      return { ok: true, summary: existing.summary, cached: true };
    }

    const result = await summarizePost(post);
    db.insert(aiSummaries)
      .values({
        phPostId: post.id,
        summary: result.summary,
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
      })
      .run();

    revalidatePath(`/post/${slug}`);
    return { ok: true, summary: result.summary, cached: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[summary] generate failed:", message);
    return { ok: false, error: message };
  }
}
