// High-level functions to fetch ProductHunt posts.
// Server-side only — relies on PH_TOKEN being available in process.env.

import { unstable_cache } from "next/cache";

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

// Page count scales with the lookback range, but stays well clear of
// PH's complexity-based rate limit (6250 / 15 min). Each `posts(...)`
// call with topics(first:5) costs ~100 points; we run TWO orders
// (VOTES + NEWEST) in parallel, so total cost = 2 × pages × 100. The
// caps below keep the worst case (14 d, both orders) at ~4000 points,
// leaving 35 %+ headroom for cron snapshots and lens-fetches that hit
// the same budget.
function maxPagesForRange(rangeHours: number): number {
  if (rangeHours <= 24) return 5; //   ~100 posts/order
  if (rangeHours <= 72) return 12; //  ~240 posts/order, ~3 days
  if (rangeHours <= 168) return 15; // ~300 posts/order, ~7 days
  return 20; //                       ~400 posts/order, up to 14 days
}

// Small inter-page delay to keep PH's Cloudflare layer from flagging
// rapid pagination bursts as bot traffic. 150 ms is invisible to the user
// but enough to spread the requests out.
const PAGE_DELAY_MS = 150;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Page through `posts(...)` until `hasNextPage` is false or the per-range
 * safety ceiling kicks in. PH caps any single posts query at 20 results.
 */
async function paginatePostsQuery(
  query: string,
  postedAfter: string,
  maxPages: number,
): Promise<PHPost[]> {
  const out: PHPost[] = [];
  let after: string | undefined;
  for (let page = 0; page < maxPages; page++) {
    if (page > 0) await sleep(PAGE_DELAY_MS);
    try {
      const r = await phRequest<TodayPostsResponse>(query, {
        postedAfter,
        after,
      });
      for (const edge of r.posts.edges) out.push(edge.node);
      const info = r.posts.pageInfo;
      if (!info?.hasNextPage || !info.endCursor) break;
      after = info.endCursor;
    } catch (err) {
      // If we already have *some* posts from earlier pages, log the
      // failure but return the partial result — better a partly-filled
      // feed than a hard error page. If this was the first page and we
      // have nothing, rethrow so the error boundary can show a useful
      // message.
      if (out.length > 0) {
        console.warn(
          `[ph] pagination stopped at page ${page} due to error; returning ${out.length} posts so far:`,
          err instanceof Error ? err.message : err,
        );
        break;
      }
      throw err;
    }
  }
  return out;
}

export type TodayPostsResult = {
  posts: PHPost[];
  /** Epoch ms at the moment this batch was fetched from PH. Used to
   * show users when the feed was last refreshed; cached together with
   * the posts so a cache hit returns the original fetch time. */
  fetchedAt: number;
};

async function fetchTodayPosts(
  rangeHours: number,
): Promise<TodayPostsResult> {
  const postedAfter = new Date(
    Date.now() - rangeHours * 60 * 60 * 1000,
  ).toISOString();
  const maxPages = maxPagesForRange(rangeHours);

  const [byVotes, byNewest] = await Promise.all([
    paginatePostsQuery(TODAY_POSTS, postedAfter, maxPages),
    paginatePostsQuery(NEWEST_POSTS, postedAfter, maxPages),
  ]);

  const byId = new Map<string, PHPost>();
  for (const node of byVotes) byId.set(node.id, node);
  // Second pass overwrites with the newer fetch — fields are identical except
  // votesCount/commentsCount, which we prefer from whichever fetch ran last.
  for (const node of byNewest) byId.set(node.id, node);

  return { posts: Array.from(byId.values()), fetchedAt: Date.now() };
}

/**
 * Fetch the feed for a given lookback window (hours).
 * PH's GraphQL API caps any single posts query at 20 results. Asking only
 * for `order: VOTES` returns the 20 most-upvoted posts of the window —
 * brand-new launches with few votes get cut off. Asking only for
 * `order: NEWEST` would drop the established hits. So we paginate both
 * orders in parallel and merge by id, keeping each post's latest fields.
 *
 * Wrapped in `unstable_cache` so topic-filter / sort / lens changes (which
 * all rebuild the page with a different URL signature) hit a shared cache
 * instead of triggering a fresh paginated fetch each time — that was
 * sending us straight into PH's 6250 / 15-min complexity-budget wall.
 *
 * Cache TTL is 30 min and keyed only by rangeHours, so independent users
 * (and the same user across topic/sort clicks) all share the same fetch.
 *
 * `rangeHours` defaults to 72 (3 days) — see `lib/range.ts`.
 */
export const getTodayPosts = unstable_cache(
  (rangeHours = 72) => fetchTodayPosts(rangeHours),
  ["ph-today-posts-v2"],
  { revalidate: 1800, tags: ["ph-today-posts"] },
);

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
