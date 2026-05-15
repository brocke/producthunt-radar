import { ArrowLeft, ExternalLink, Star } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { WatchlistButton } from "@/components/watchlist-button";
import { getWatchlist } from "@/lib/watchlist/queries";

// Always show the latest state — toggleWatchlist already revalidates this path,
// but force-dynamic ensures a star-toggle from elsewhere is picked up immediately.
export const dynamic = "force-dynamic";

function formatAddedAt(date: Date): string {
  const ms = Date.now() - date.getTime();
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 48) return `${Math.floor(hours / 24)}d ago`;
  if (hours >= 1) return `${hours}h ago`;
  const mins = Math.max(1, Math.floor(ms / 60_000));
  return `${mins}m ago`;
}

export default async function WatchlistPage() {
  const items = getWatchlist();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to feed
      </Link>

      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Watchlist</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {items.length === 0
            ? "Saved posts will appear here."
            : `${items.length} saved post${items.length === 1 ? "" : "s"}.`}
        </p>
      </header>

      {items.length === 0 ? (
        <Card className="p-8 text-center">
          <Star className="mx-auto size-8 text-muted-foreground/40" aria-hidden />
          <p className="mt-3 text-sm text-muted-foreground">
            No posts saved yet. Tap the star on any card in the feed.
          </p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.id}>
              <article className="relative">
                <Link
                  href={`/post/${item.slug}`}
                  className="absolute inset-0 z-10 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`${item.name}${item.tagline ? `: ${item.tagline}` : ""}`}
                />
                <Card className="transition-shadow hover:ring-foreground/25">
                  <div className="flex gap-4 px-4">
                    {item.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.thumbnailUrl}
                        alt=""
                        loading="lazy"
                        className="size-16 flex-shrink-0 rounded-md bg-muted object-cover sm:size-20"
                      />
                    ) : (
                      <div className="size-16 flex-shrink-0 rounded-md bg-muted sm:size-20" />
                    )}
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="text-lg font-semibold leading-tight tracking-tight">
                          {item.name}
                        </h2>
                        <WatchlistButton
                          post={{
                            phPostId: item.phPostId,
                            slug: item.slug,
                            name: item.name,
                            tagline: item.tagline,
                            thumbnailUrl: item.thumbnailUrl,
                          }}
                          initialActive
                        />
                      </div>
                      {item.tagline && (
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {item.tagline}
                        </p>
                      )}
                      <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>Saved {formatAddedAt(item.addedAt)}</span>
                        <a
                          href={`https://www.producthunt.com/posts/${item.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative z-20 inline-flex items-center gap-1 hover:text-foreground"
                        >
                          Open on PH
                          <ExternalLink className="size-3" aria-hidden />
                        </a>
                      </div>
                    </div>
                  </div>
                </Card>
              </article>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
