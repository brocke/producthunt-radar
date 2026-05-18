import { Newspaper, Star } from "lucide-react";
import Link from "next/link";

import { AboutDialog } from "@/components/about-dialog";
import { LensSelector } from "@/components/lens-selector";
import { PostCard } from "@/components/post-card";
import { RangeSelector } from "@/components/range-selector";
import { SortControl } from "@/components/sort-control";
import { TopicFilter } from "@/components/topic-filter";
import { Button } from "@/components/ui/button";
import { resolveLens } from "@/lib/lenses/defaults";
import { getScoresForLens, type LensScoreMap } from "@/lib/lenses/run";
import { getTodayPosts } from "@/lib/ph/posts";
import type { PHPost } from "@/lib/ph/types";
import { parseRangeKey, RANGE_HOURS, RANGE_INLINE } from "@/lib/range";
import {
  filterByTopics,
  parseSortKey,
  parseTopicSlugs,
  sortPosts,
  uniqueTopics,
} from "@/lib/scoring";
import { getWatchlistIds } from "@/lib/watchlist/queries";

function sortByLensScore(
  posts: PHPost[],
  scores: LensScoreMap,
): PHPost[] {
  return [...posts].sort((a, b) => {
    const sa = scores.get(a.id)?.score ?? 0;
    const sb = scores.get(b.id)?.score ?? 0;
    if (sa !== sb) return sb - sa;
    return b.votesCount - a.votesCount;
  });
}

// Refetch the PH feed at most every 10 minutes — see plan.md §8 (Caching).
export const revalidate = 600;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    sort?: string;
    topics?: string;
    lens?: string;
    q?: string;
    range?: string;
  }>;
}) {
  const params = await searchParams;
  const sort = parseSortKey(params.sort);
  const selectedTopicSlugs = parseTopicSlugs(params.topics);
  const lens = resolveLens(params.lens, params.q);
  const range = parseRangeKey(params.range);

  const allPosts = await getTodayPosts(RANGE_HOURS[range]);
  const watchedIds = getWatchlistIds();
  const filtered = filterByTopics(allPosts, selectedTopicSlugs);

  // When a lens is active, re-rank by Claude scores (and dim low-scorers
  // in PostCard via the `lens` prop). Otherwise fall back to the regular
  // sort dropdown.
  //
  // Lens scoring is capped at the LENS_CAP top posts by votes — beyond
  // that the signal-to-noise ratio drops fast (the tail is mostly
  // low-engagement launches), and the initial Sonnet pass would stretch
  // past the Caddy proxy timeout.
  const LENS_CAP = 200;
  let lensScores: LensScoreMap | null = null;
  let visible: PHPost[];
  let lensCappedFrom: number | null = null;
  if (lens) {
    const candidates =
      filtered.length > LENS_CAP
        ? [...filtered]
            .sort((a, b) => b.votesCount - a.votesCount)
            .slice(0, LENS_CAP)
        : filtered;
    if (filtered.length > LENS_CAP) {
      lensCappedFrom = filtered.length;
    }
    lensScores = await getScoresForLens(candidates, lens.key, lens.prompt);
    visible = sortByLensScore(candidates, lensScores);
  } else {
    visible = sortPosts(filtered, sort);
  }
  const topics = uniqueTopics(allPosts);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            ProductHunt Radar
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {lens
              ? lensCappedFrom
                ? `Top ${visible.length} von ${lensCappedFrom} Launches aus den ${RANGE_INLINE[range]}, neu sortiert durch Lens: ${lens.label}.`
                : `${visible.length} Launches aus den ${RANGE_INLINE[range]}, neu sortiert durch Lens: ${lens.label}.`
              : visible.length === allPosts.length
                ? `${allPosts.length} Launches aus den ${RANGE_INLINE[range]}.`
                : `${visible.length} von ${allPosts.length} Launches aus den ${RANGE_INLINE[range]} passen zu deinen Filtern.`}
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
              <span className="ml-1 rounded-full bg-brand px-1.5 text-xs font-medium text-brand-foreground">
                {watchedIds.size}
              </span>
            )}
          </Button>
          <AboutDialog />
        </div>
      </header>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <RangeSelector />
        <SortControl />
        <TopicFilter topics={topics} />
      </div>
      <div className="mb-6">
        <LensSelector />
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
              <PostCard
                post={post}
                inWatchlist={watchedIds.has(post.id)}
                lens={lensScores?.get(post.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
