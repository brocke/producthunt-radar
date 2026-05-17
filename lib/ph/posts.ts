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

// Defensive ceiling on paginated fetches per order. At 20 posts/page and
// ~30 posts/day on PH, 30 pages covers ~20 days — comfortable headroom
// above our 14-day soft cap.
const MAX_PAGES_PER_ORDER = 30;

// Small inter-page delay to keep PH's Cloudflare layer from flagging
// rapid pagination bursts as bot traffic. 150 ms is invisible to the user
// but enough to spread the requests out.
const PAGE_DELAY_MS = 150;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Page through `posts(...)` until `hasNextPage` is false or the safety
 * ceiling kicks in. PH caps any single posts query at 20 results.
 */
async function paginatePostsQuery(
  query: string,
  postedAfter: string,
): Promise<PHPost[]> {
  const out: PHPost[] = [];
  let after: string | undefined;
  for (let page = 0; page < MAX_PAGES_PER_ORDER; page++) {
    if (page > 0) await sleep(PAGE_DELAY_MS);
    const r = await phRequest<TodayPostsResponse>(query, {
      postedAfter,
      after,
    });
    for (const edge of r.posts.edges) out.push(edge.node);
    const info = r.posts.pageInfo;
    if (!info?.hasNextPage || !info.endCursor) break;
    after = info.endCursor;
  }
  return out;
}

/**
 * Fetch the feed for a given lookback window (hours).
 * PH's GraphQL API caps any single posts query at 20 results. Asking only
 * for `order: VOTES` returns the 20 most-upvoted posts of the window —
 * brand-new launches with few votes get cut off. Asking only for
 * `order: NEWEST` would drop the established hits. So we paginate both
 * orders in parallel and merge by id, keeping each post's latest fields.
 *
 * `rangeHours` defaults to 72 (3 days) — see `lib/range.ts`.
 */
export async function getTodayPosts(rangeHours = 72): Promise<PHPost[]> {
  const postedAfter = new Date(
    Date.now() - rangeHours * 60 * 60 * 1000,
  ).toISOString();

  const [byVotes, byNewest] = await Promise.all([
    paginatePostsQuery(TODAY_POSTS, postedAfter),
    paginatePostsQuery(NEWEST_POSTS, postedAfter),
  ]);

  const byId = new Map<string, PHPost>();
  for (const node of byVotes) byId.set(node.id, node);
  // Second pass overwrites with the newer fetch — fields are identical except
  // votesCount/commentsCount, which we prefer from whichever fetch ran last.
  for (const node of byNewest) byId.set(node.id, node);

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
