import { notFound } from "next/navigation";
import { ArrowUp, ExternalLink, MessageSquare } from "lucide-react";

import { BackLink } from "@/components/back-link";
import { SummaryPanel } from "@/components/summary-panel";
import { WatchlistButton } from "@/components/watchlist-button";
import { Badge } from "@/components/ui/badge";
import { getCachedSummary } from "@/lib/ai/queries";
import { sanitizeRichText } from "@/lib/format/rich-text";
import { getPostDetails } from "@/lib/ph/posts";
import { getWatchlistIds } from "@/lib/watchlist/queries";

/**
 * Validates a PH username so we don't generate broken profile URLs for
 * anonymised accounts (e.g. PH returns "[REDACTED]" for some brand-new
 * launches before the maker reveals themselves). Real usernames are
 * alphanumeric plus optional dashes/underscores.
 */
function isValidPHUsername(username: string | null | undefined): boolean {
  if (!username) return false;
  return /^[a-zA-Z0-9_-]+$/.test(username);
}

// Detail pages change less often than the feed — cache for 30 minutes.
export const revalidate = 1800;

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 48) return `${Math.floor(hours / 24)}d ago`;
  if (hours >= 1) return `${hours}h ago`;
  const mins = Math.max(1, Math.floor(ms / 60_000));
  return `${mins}m ago`;
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostDetails(slug);

  if (!post) {
    notFound();
  }

  const topics = post.topics.edges.map((e) => e.node);
  const comments = post.comments.edges.map((e) => e.node);
  const launchedAt = post.featuredAt ?? post.createdAt;
  const cachedSummary = getCachedSummary(post.id);
  const watchedIds = getWatchlistIds();
  const inWatchlist = watchedIds.has(post.id);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <nav className="mb-8 flex items-center justify-between text-sm">
        <BackLink />
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          Open on ProductHunt
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </nav>

      <header className="flex gap-4 sm:gap-6">
        {post.thumbnail?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.thumbnail.url}
            alt=""
            className="size-20 flex-shrink-0 rounded-lg bg-muted object-cover sm:size-24"
          />
        ) : (
          <div className="size-20 flex-shrink-0 rounded-lg bg-muted sm:size-24" />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {post.name}
            </h1>
            <WatchlistButton
              post={{
                phPostId: post.id,
                slug: post.slug,
                name: post.name,
                tagline: post.tagline,
                thumbnailUrl: post.thumbnail?.url ?? null,
              }}
              initialActive={inWatchlist}
            />
          </div>
          <p className="text-base text-muted-foreground">{post.tagline}</p>
          {topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {topics.map((t) => (
                <Badge
                  key={t.id}
                  variant="secondary"
                  className="text-xs font-normal"
                >
                  {t.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1 text-foreground">
          <ArrowUp className="size-4 text-brand" aria-hidden />
          <span className="font-semibold tabular-nums">{post.votesCount}</span>
          <span className="text-muted-foreground">votes</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageSquare className="size-4" aria-hidden />
          <span className="tabular-nums">{post.commentsCount}</span>
          <span>comments</span>
        </span>
        <span>Launched {timeAgo(launchedAt)}</span>
        {post.website && (
          <a
            href={post.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
          >
            Website
            <ExternalLink className="size-3" aria-hidden />
          </a>
        )}
      </div>

      {post.makers.length > 0 && (
        <p className="mt-3 text-sm text-muted-foreground">
          By{" "}
          {post.makers.map((m, i) => (
            <span key={m.id}>
              {isValidPHUsername(m.username) ? (
                <a
                  href={`https://www.producthunt.com/@${m.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground transition-colors hover:underline"
                >
                  {m.name}
                </a>
              ) : (
                <span className="text-foreground">{m.name}</span>
              )}
              {i < post.makers.length - 1 ? ", " : ""}
            </span>
          ))}
        </p>
      )}

      <div className="mt-6">
        <SummaryPanel
          slug={post.slug}
          initialSummary={cachedSummary?.summary ?? null}
        />
      </div>

      {post.description && (
        <section className="mt-8 border-t pt-8">
          <h2 className="sr-only">About</h2>
          <div
            className="rich-text text-sm leading-relaxed text-foreground/90"
            dangerouslySetInnerHTML={{
              __html: sanitizeRichText(post.description),
            }}
          />
        </section>
      )}

      <section className="mt-8 border-t pt-8">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">
          Top comments
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {comments.length} of {post.commentsCount}
          </span>
        </h2>
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        ) : (
          <ul className="flex flex-col gap-5">
            {comments.map((c) => {
              const userValid = isValidPHUsername(c.user.username);
              return (
              <li key={c.id} className="flex flex-col gap-1.5">
                <div className="flex items-baseline gap-2 text-xs text-muted-foreground">
                  {userValid ? (
                    <a
                      href={`https://www.producthunt.com/@${c.user.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-foreground transition-colors hover:underline"
                    >
                      {c.user.name}
                    </a>
                  ) : (
                    <span className="text-sm font-medium text-foreground">
                      {c.user.name}
                    </span>
                  )}
                  {userValid && <span>@{c.user.username}</span>}
                  <span>·</span>
                  <span>{timeAgo(c.createdAt)}</span>
                  <span className="ml-auto inline-flex items-center gap-1">
                    <ArrowUp className="size-3" aria-hidden />
                    <span className="tabular-nums">{c.votesCount}</span>
                  </span>
                </div>
                <div
                  className="rich-text text-sm leading-relaxed text-foreground/90"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeRichText(c.body),
                  }}
                />
              </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
