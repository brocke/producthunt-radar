import { Newspaper, Star } from "lucide-react";
import Link from "next/link";

import { PostCard } from "@/components/post-card";
import { SortControl } from "@/components/sort-control";
import { TopicFilter } from "@/components/topic-filter";
import { Button } from "@/components/ui/button";
import { getTodayPosts } from "@/lib/ph/posts";
import {
  filterByTopics,
  parseSortKey,
  parseTopicSlugs,
  sortPosts,
  uniqueTopics,
} from "@/lib/scoring";
import { getWatchlistIds } from "@/lib/watchlist/queries";

// Refetch the PH feed at most every 10 minutes — see plan.md §8 (Caching).
export const revalidate = 600;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; topics?: string }>;
}) {
  const params = await searchParams;
  const sort = parseSortKey(params.sort);
  const selectedTopicSlugs = parseTopicSlugs(params.topics);

  const allPosts = await getTodayPosts();
  const watchedIds = getWatchlistIds();
  const filtered = filterByTopics(allPosts, selectedTopicSlugs);
  const visible = sortPosts(filtered, sort);
  const topics = uniqueTopics(allPosts);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            ProductHunt Radar
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {visible.length === allPosts.length
              ? `${allPosts.length} launches from the last 36 hours.`
              : `${visible.length} of ${allPosts.length} launches match your filters.`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-1.5"
            render={<Link href="/digest" />}
          >
            <Newspaper className="size-4" aria-hidden />
            Digest
          </Button>
          <Button
            variant="outline"
            className="gap-1.5"
            render={<Link href="/watchlist" />}
          >
            <Star className="size-4" aria-hidden />
            Watchlist
            {watchedIds.size > 0 && (
              <span className="ml-1 rounded-full bg-foreground px-1.5 text-xs font-medium text-background">
                {watchedIds.size}
              </span>
            )}
          </Button>
        </div>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <SortControl />
        <TopicFilter topics={topics} />
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {selectedTopicSlugs.length > 0
            ? "No posts match the selected topics. Try clearing some filters."
            : "No posts found right now — the feed will refresh on next request."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((post) => (
            <li key={post.id}>
              <PostCard post={post} inWatchlist={watchedIds.has(post.id)} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
