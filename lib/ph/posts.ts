// High-level functions to fetch ProductHunt posts.
// Server-side only — relies on PH_TOKEN being available in process.env.

import { phRequest } from "./client";
import { TODAY_POSTS } from "./queries";
import type { PHPost, TodayPostsResponse } from "./types";

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
