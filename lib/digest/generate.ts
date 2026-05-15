// Generate yesterday's digest: top 10 by velocity with cached/fresh summaries.
// Server-only.

import { aiSummaries } from "@/db/schema";
import { db } from "@/lib/db";
import { summarizePost } from "@/lib/ai/summarize";
import { getCachedSummary } from "@/lib/ai/queries";
import { getPostDetails, getSnapshotPosts } from "@/lib/ph/posts";
import type { PHPost } from "@/lib/ph/types";
import { velocity } from "@/lib/scoring";

import { renderDigestMarkdown, type DigestEntry } from "./format";

const YESTERDAY_MIN_HOURS = 12;
const YESTERDAY_MAX_HOURS = 48;

export type DigestResult = {
  markdown: string;
  entries: DigestEntry[];
  generatedAt: Date;
  stats: {
    cachedSummaries: number;
    freshSummaries: number;
    missingSummaries: number;
  };
};

function isYesterdayWindow(post: PHPost, now: number): boolean {
  const launchedAt = post.featuredAt ?? post.createdAt;
  const hoursAgo = (now - new Date(launchedAt).getTime()) / 3_600_000;
  return hoursAgo >= YESTERDAY_MIN_HOURS && hoursAgo <= YESTERDAY_MAX_HOURS;
}

async function summarizeIfMissing(post: PHPost): Promise<string | null> {
  const cached = getCachedSummary(post.id);
  if (cached) return cached.summary;

  const details = await getPostDetails(post.slug);
  if (!details) return null;

  try {
    const result = await summarizePost(details);
    db.insert(aiSummaries)
      .values({
        phPostId: post.id,
        summary: result.summary,
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
      })
      .run();
    return result.summary;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[digest] summarize failed for ${post.slug}:`, message);
    return null;
  }
}

export async function generateDailyDigest(): Promise<DigestResult> {
  const now = Date.now();
  const candidates = await getSnapshotPosts();

  const ranked = candidates
    .filter((p) => isYesterdayWindow(p, now))
    .map((post) => ({ post, velocityScore: velocity(post, now) }))
    .sort((a, b) => b.velocityScore - a.velocityScore)
    .slice(0, 10);

  // Track which were cached vs freshly generated for cost transparency.
  const cachedIds = new Set(
    ranked.filter((r) => getCachedSummary(r.post.id)).map((r) => r.post.id),
  );

  const entries: DigestEntry[] = await Promise.all(
    ranked.map(async ({ post, velocityScore }) => {
      const summary = await summarizeIfMissing(post);
      return { post, summary, velocity: velocityScore };
    }),
  );

  const cachedSummaries = entries.filter((e) =>
    cachedIds.has(e.post.id),
  ).length;
  const missingSummaries = entries.filter((e) => e.summary === null).length;
  const freshSummaries = entries.length - cachedSummaries - missingSummaries;

  const generatedAt = new Date();
  const markdown = renderDigestMarkdown(entries, generatedAt);

  return {
    markdown,
    entries,
    generatedAt,
    stats: { cachedSummaries, freshSummaries, missingSummaries },
  };
}
