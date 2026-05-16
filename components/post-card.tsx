import Link from "next/link";
import { ArrowUp, MessageSquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { WatchlistButton } from "@/components/watchlist-button";
import type { PHPost } from "@/lib/ph/types";
import { cn } from "@/lib/utils";

export type LensHit = { score: number; reason: string };

export function PostCard({
  post,
  inWatchlist = false,
  lens,
}: {
  post: PHPost;
  inWatchlist?: boolean;
  lens?: LensHit;
}) {
  const topics = post.topics.edges.map((e) => e.node);
  const dimmed = lens != null && lens.score < 4;

  return (
    <article
      className={cn(
        "relative transition-opacity",
        dimmed && "opacity-50 hover:opacity-100",
      )}
    >
      {/* Invisible link overlay covers the card without nesting children inside <a>,
          which keeps room for the watchlist button in Phase 5. */}
      <Link
        href={`/post/${post.slug}`}
        className="absolute inset-0 z-10 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`${post.name}: ${post.tagline}`}
      />
      <Card className="transition-shadow hover:ring-foreground/25">
        <div className="flex gap-4 px-4">
          {post.thumbnail?.url ? (
            // ProductHunt CDN URLs change with query params; using a plain <img>
            // skips the Next.js image whitelist requirement for the MVP.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.thumbnail.url}
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
                {post.name}
              </h2>
              <div className="flex shrink-0 items-center gap-2">
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
                <div className="flex items-center gap-1 text-foreground/80">
                  <ArrowUp className="size-3.5" aria-hidden />
                  <span className="text-base font-semibold tabular-nums">
                    {post.votesCount}
                  </span>
                </div>
              </div>
            </div>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {post.tagline}
            </p>
            {lens && (
              <p className="mt-0.5 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground/90">
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                    lens.score >= 8 && "bg-foreground text-background",
                    lens.score >= 4 && lens.score < 8 && "bg-foreground/15 text-foreground/90",
                    lens.score < 4 && "bg-foreground/5 text-foreground/60",
                  )}
                >
                  {lens.score}/10
                </span>
                <span className="line-clamp-2 italic">{lens.reason}</span>
              </p>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {topics.slice(0, 4).map((t) => (
                <Badge
                  key={t.id}
                  variant="secondary"
                  className="text-xs font-normal"
                >
                  {t.name}
                </Badge>
              ))}
              <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                <MessageSquare className="size-3" aria-hidden />
                {post.commentsCount}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </article>
  );
}
