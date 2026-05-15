// Claude-powered summaries for PH posts.
// Server-only — reads ANTHROPIC_API_KEY from process.env.
// See plan.md §5 → Phase 7 + §8 (AI-Kosten).

import Anthropic from "@anthropic-ai/sdk";

import { sanitizeRichText } from "@/lib/format/rich-text";
import type { PHPostDetails } from "@/lib/ph/types";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 500;

const SYSTEM_PROMPT = `Du bist ein präziser Tech-Analyst, der ProductHunt-Launches kompakt einschätzt.
Antworte ausschließlich auf Deutsch und ohne Marketing-Sprache.
Halte dich exakt an die Struktur aus der Nutzer-Anweisung.`;

export type SummaryResult = {
  summary: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
};

function stripHtml(html: string | null | undefined, maxLen: number): string {
  if (!html) return "";
  const sanitized = sanitizeRichText(html);
  const text = sanitized
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}

function buildUserPrompt(post: PHPostDetails): string {
  const topComments = post.comments.edges
    .slice(0, 5)
    .map((edge) => {
      const body = stripHtml(edge.node.body, 500);
      return `- @${edge.node.user.username} (${edge.node.votesCount} ↑): ${body}`;
    })
    .join("\n");

  const topics = post.topics.edges.map((e) => e.node.name).join(", ");

  return [
    `## Post`,
    `Name: ${post.name}`,
    `Tagline: ${post.tagline}`,
    `Topics: ${topics || "—"}`,
    `Votes: ${post.votesCount}`,
    ``,
    `## Beschreibung`,
    stripHtml(post.description, 2000) || "(keine Beschreibung)",
    ``,
    `## Top-Kommentare`,
    topComments || "(keine Kommentare)",
    ``,
    `## Aufgabe`,
    `Gib mir in 3 Sätzen, was dieses Produkt macht und warum es für jemanden interessant sein könnte, der KI-Tools für Workshops, Coaching oder Beratung einsetzt. Dann: 1 Satz Tonalitäts-Read der Kommentare (Begeisterung, Skepsis, technische Diskussion, …).`,
    `Keine Überschriften, keine Aufzählungszeichen, einfach 4 zusammenhängende Sätze.`,
  ].join("\n");
}

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local — see plan.md §9.",
    );
  }
  return new Anthropic();
}

export async function summarizePost(
  post: PHPostDetails,
): Promise<SummaryResult> {
  const client = getClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(post) }],
  });

  const textBlocks = response.content.filter(
    (block): block is Anthropic.TextBlock => block.type === "text",
  );
  const summary = textBlocks
    .map((b) => b.text)
    .join("\n")
    .trim();

  if (!summary) {
    throw new Error(
      `Empty summary from Claude (stop_reason=${response.stop_reason ?? "unknown"})`,
    );
  }

  return {
    summary,
    model: response.model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}
