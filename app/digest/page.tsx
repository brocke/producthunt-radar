import { ArrowLeft, ArrowUp, ExternalLink, MessageSquare } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { DigestActions } from "@/components/digest-actions";
import { generateDailyDigest } from "@/lib/digest/generate";

// The digest does the heavy lifting per request (fetch + summarize); keep it
// dynamic so the user always sees fresh "yesterday".
export const dynamic = "force-dynamic";

function formatYYYYMMDD(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default async function DigestPage() {
  const digest = await generateDailyDigest();
  const dateStr = formatYYYYMMDD(digest.generatedAt);
  const filename = `producthunt-digest-${dateStr}.md`;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to feed
      </Link>

      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Daily Digest
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Yesterday&apos;s top {digest.entries.length} launches by velocity, with
            Claude summaries.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {digest.stats.cachedSummaries} cached · {digest.stats.freshSummaries}{" "}
            freshly generated
            {digest.stats.missingSummaries > 0
              ? ` · ${digest.stats.missingSummaries} unavailable`
              : ""}
          </p>
        </div>
        {digest.entries.length > 0 && (
          <DigestActions markdown={digest.markdown} filename={filename} />
        )}
      </header>

      {digest.entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No qualifying posts in yesterday&apos;s 12-48h window yet. Try again
          tomorrow — the cron job will keep gathering data.
        </p>
      ) : (
        <ol className="flex flex-col gap-8">
          {digest.entries.map((entry, index) => {
            const topics = entry.post.topics.edges.map((e) => e.node);
            return (
              <li
                key={entry.post.id}
                className="border-l-2 border-foreground/10 pl-5"
              >
                <div className="mb-1 flex items-baseline gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold tabular-nums">
                    #{index + 1}
                  </span>
                  <span>velocity {entry.velocity.toFixed(1)}</span>
                </div>
                <h2 className="text-xl font-semibold tracking-tight">
                  <Link
                    href={`/post/${entry.post.slug}`}
                    className="hover:underline"
                  >
                    {entry.post.name}
                  </Link>
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {entry.post.tagline}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 text-foreground">
                    <ArrowUp className="size-3.5" aria-hidden />
                    <span className="font-semibold tabular-nums">
                      {entry.post.votesCount}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="size-3.5" aria-hidden />
                    <span className="tabular-nums">
                      {entry.post.commentsCount}
                    </span>
                  </span>
                  <a
                    href={`https://www.producthunt.com/posts/${entry.post.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    Open on PH
                    <ExternalLink className="size-3" aria-hidden />
                  </a>
                </div>
                {topics.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
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
                {entry.summary ? (
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                    {entry.summary}
                  </p>
                ) : (
                  <p className="mt-4 text-sm italic text-muted-foreground">
                    Summary not available.
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </main>
  );
}
