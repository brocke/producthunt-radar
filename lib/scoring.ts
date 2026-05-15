// Sorting + filtering helpers for the PH feed.
// The velocity formula is intentionally local and easy to swap — see plan.md §5.

import type { PHPost, PHTopic } from "@/lib/ph/types";

export type SortKey = "votes" | "velocity" | "time";

export const SORT_KEYS: SortKey[] = ["votes", "velocity", "time"];

export const SORT_LABELS: Record<SortKey, string> = {
  votes: "Votes",
  velocity: "Velocity",
  time: "Newest",
};

/**
 * Velocity = votes per hour since launch, with mild damping so very young
 * posts don't blow up the score. Default exponent 0.8 favors fresh posts
 * but still rewards sustained traction.
 *
 * Easy to retune: lower exponent (e.g. 0.6) = stronger young-post bonus;
 * exponent 1.0 = pure votes-per-hour.
 */
export function velocity(
  post: Pick<PHPost, "votesCount" | "createdAt" | "featuredAt">,
  now: number = Date.now(),
  exponent = 0.8,
): number {
  const launchedAt = post.featuredAt ?? post.createdAt;
  const hours = Math.max(1, (now - new Date(launchedAt).getTime()) / 3_600_000);
  return post.votesCount / Math.pow(hours, exponent);
}

export function sortPosts(posts: PHPost[], sort: SortKey): PHPost[] {
  if (sort === "velocity") {
    const now = Date.now();
    return [...posts].sort((a, b) => velocity(b, now) - velocity(a, now));
  }
  if (sort === "time") {
    return [...posts].sort((a, b) => {
      const at = new Date(a.featuredAt ?? a.createdAt).getTime();
      const bt = new Date(b.featuredAt ?? b.createdAt).getTime();
      return bt - at;
    });
  }
  // default: votes
  return [...posts].sort((a, b) => b.votesCount - a.votesCount);
}

export function filterByTopics(
  posts: PHPost[],
  topicSlugs: string[],
): PHPost[] {
  if (topicSlugs.length === 0) return posts;
  const selected = new Set(topicSlugs);
  return posts.filter((post) =>
    post.topics.edges.some((e) => selected.has(e.node.slug)),
  );
}

/**
 * Collect the unique set of topics appearing in the current post list,
 * sorted alphabetically by name. Used to populate the topic filter UI.
 */
export function uniqueTopics(posts: PHPost[]): PHTopic[] {
  const map = new Map<string, PHTopic>();
  for (const post of posts) {
    for (const edge of post.topics.edges) {
      if (!map.has(edge.node.slug)) {
        map.set(edge.node.slug, edge.node);
      }
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export function parseSortKey(raw: string | undefined): SortKey {
  if (raw === "velocity" || raw === "time" || raw === "votes") return raw;
  return "votes";
}

export function parseTopicSlugs(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}
