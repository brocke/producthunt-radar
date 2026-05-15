// High-level functions to fetch ProductHunt posts.
// Server-side only — relies on PH_TOKEN being available in process.env.

import { phRequest } from "./client";
import { POST_DETAILS, SNAPSHOT_POSTS, TODAY_POSTS } from "./queries";
import type {
  PHPost,
  PHPostDetails,
  PostDetailsResponse,
  TodayPostsResponse,
} from "./types";

/**
 * Fetch the current top 20 posts that were posted in the last ~36 hours.
 * The PH "today" feed includes both today's and yesterday's launches, so
 * we look back 36h to cover the overlap window safely.
 */
export async function getTodayPosts(): Promise<PHPost[]> {
  const postedAfter = new Date(
    Date.now() - 36 * 60 * 60 * 1000,
  ).toISOString();

  const response = await phRequest<TodayPostsResponse>(TODAY_POSTS, {
    postedAfter,
  });

  return response.posts.edges.map((edge) => edge.node);
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
