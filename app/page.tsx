import { PostCard } from "@/components/post-card";
import { getTodayPosts } from "@/lib/ph/posts";

// Refetch the PH feed at most every 10 minutes — see plan.md §8 (Caching).
export const revalidate = 600;

export default async function HomePage() {
  const posts = await getTodayPosts();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">
          ProductHunt Radar
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Top {posts.length} launches from the last 36 hours, sorted by votes.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No posts found right now — the feed will refresh on next request.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
