import { PostCard } from "@/components/post-card";
import { SortControl } from "@/components/sort-control";
import { TopicFilter } from "@/components/topic-filter";
import { getTodayPosts } from "@/lib/ph/posts";
import {
  filterByTopics,
  parseSortKey,
  parseTopicSlugs,
  sortPosts,
  uniqueTopics,
} from "@/lib/scoring";

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
  const filtered = filterByTopics(allPosts, selectedTopicSlugs);
  const visible = sortPosts(filtered, sort);
  const topics = uniqueTopics(allPosts);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          ProductHunt Radar
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {visible.length === allPosts.length
            ? `${allPosts.length} launches from the last 36 hours.`
            : `${visible.length} of ${allPosts.length} launches match your filters.`}
        </p>
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
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
