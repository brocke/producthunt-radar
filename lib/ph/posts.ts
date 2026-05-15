// High-level functions to fetch ProductHunt posts.
// Server-side only — relies on PH_TOKEN being available in process.env.

import { phRequest } from "./client";
import {
  NEWEST_POSTS,
  POST_DETAILS,
  SNAPSHOT_POSTS,
  TODAY_POSTS,
} from "./queries";
import type {
  PHPost,
  PHPostDetails,
  PostDetailsResponse,
  TodayPostsResponse,
} from "./types";

/**
 * Fetch the today/yesterday feed.
 * PH's GraphQL API caps any single posts query at 20 results. Asking only
 * for `order: VOTES` returns the 20 most-upvoted posts of the window —
 * brand-new launches with few votes get cut off. Asking only for
 * `order: NEWEST` would drop the established hits. So we fire both queries
 * in parallel and merge by id, keeping each post's latest fields.
 */
export async function getTodayPosts(): Promise<PHPost[]> {
  const postedAfter = new Date(
    Date.now() - 36 * 60 * 60 * 1000,
  ).toISOString();

  const [byVotes, byNewest] = await Promise.all([
    phRequest<TodayPostsResponse>(TODAY_POSTS, { postedAfter }),
    phRequest<TodayPostsResponse>(NEWEST_POSTS, { postedAfter }),
  ]);

  const byId = new Map<string, PHPost>();
  for (const edge of byVotes.posts.edges) byId.set(edge.node.id, edge.node);
  // Second pass overwrites with the newer fetch — fields are identical except
  // votesCount/commentsCount, which we prefer from whichever fetch ran last.
  for (const edge of byNewest.posts.edges) byId.set(edge.node.id, edge.node);

  return Array.from(byId.values());
}

/**
 * Fetch full details for a single post by slug.
 * Returns null if the slug doesn't resolve to a post.
 */
export async function getPostDetails(
  slug: string,
): Promise<PHPostDetails | null> {
  const response = await phRequest<PostDetailsResponse>(POST_DETAILS, {
    slug,
  });
  return response.post;
}

/**
 * Wider snapshot fetch — top 50 posts from the last 48 hours.
 * Used by the cron job to build the time-series in `snapshots`.
 */
export async function getSnapshotPosts(): Promise<PHPost[]> {
  const postedAfter = new Date(
    Date.now() - 48 * 60 * 60 * 1000,
  ).toISOString();

  const response = await phRequest<TodayPostsResponse>(SNAPSHOT_POSTS, {
    postedAfter,
  });

  return response.posts.edges.map((edge) => edge.node);
}
