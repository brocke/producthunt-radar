// Markdown rendering for the daily digest.
// Kept side-effect-free so the same data can drive both the .md export and
// the on-page JSX.

import type { PHPost } from "@/lib/ph/types";

export type DigestEntry = {
  post: PHPost;
  summary: string | null;
  velocity: number;
};

function formatYYYYMMDD(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatLaunchedAt(iso: string, now: Date): string {
  const ms = now.getTime() - new Date(iso).getTime();
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 48) return `${Math.floor(hours / 24)}d ago`;
  if (hours >= 1) return `${hours}h ago`;
  return "moments ago";
}

export function renderDigestMarkdown(
  entries: DigestEntry[],
  now: Date = new Date(),
): string {
  const date = formatYYYYMMDD(now);
  const lines: string[] = [];

  lines.push(`# ProductHunt Daily Digest — ${date}`);
  lines.push("");
  lines.push(
    `Top ${entries.length} yesterday's launches, ranked by velocity (votes / hours^0.8).`,
  );
  lines.push("");
  lines.push("---");
  lines.push("");

  entries.forEach((entry, index) => {
    const launchedAt = entry.post.featuredAt ?? entry.post.createdAt;
    const topics = entry.post.topics.edges
      .map((e) => e.node.name)
      .join(", ");

    lines.push(
      `## ${index + 1}. [${entry.post.name}](https://www.producthunt.com/posts/${entry.post.slug})`,
    );
    lines.push("");
    lines.push(`_${entry.post.tagline}_`);
    lines.push("");
    lines.push(
      `**${entry.post.votesCount} votes · ${entry.post.commentsCount} comments · launched ${formatLaunchedAt(launchedAt, now)} · velocity ${entry.velocity.toFixed(1)}**`,
    );
    if (topics) {
      lines.push("");
      lines.push(`Topics: ${topics}`);
    }
    lines.push("");
    if (entry.summary) {
      lines.push(entry.summary);
    } else {
      lines.push("_(Summary not available.)_");
    }
    lines.push("");
    lines.push("---");
    lines.push("");
  });

  return lines.join("\n");
}
