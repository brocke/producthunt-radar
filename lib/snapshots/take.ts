// Append-only snapshot recorder. Each call writes one row per post that
// PH returned at that moment in time. See plan.md §5 (Phase 6) and §8 (Gotchas).

import { snapshots, type SnapshotInsert } from "@/db/schema";
import { db } from "@/lib/db";
import { getSnapshotPosts } from "@/lib/ph/posts";

export type SnapshotResult = {
  count: number;
  durationMs: number;
};

export async function takeSnapshot(): Promise<SnapshotResult> {
  const start = Date.now();
  const posts = await getSnapshotPosts();

  if (posts.length === 0) {
    const durationMs = Date.now() - start;
    console.log(
      `[snapshot] no posts returned, nothing to write (${durationMs}ms)`,
    );
    return { count: 0, durationMs };
  }

  const now = new Date();
  const rows: SnapshotInsert[] = posts.map((p) => ({
    phPostId: p.id,
    slug: p.slug,
    name: p.name,
    tagline: p.tagline,
    votesCount: p.votesCount,
    commentsCount: p.commentsCount,
    topics: p.topics.edges.map((e) => ({
      slug: e.node.slug,
      name: e.node.name,
    })),
    snapshotAt: now,
    postedAt: p.featuredAt
      ? new Date(p.featuredAt)
      : p.createdAt
        ? new Date(p.createdAt)
        : null,
    thumbnailUrl: p.thumbnail?.url ?? null,
  }));

  db.insert(snapshots).values(rows).run();

  const durationMs = Date.now() - start;
  console.log(
    `[snapshot] OK / ${posts.length} Posts, ${(durationMs / 1000).toFixed(2)}s`,
  );
  return { count: posts.length, durationMs };
}
