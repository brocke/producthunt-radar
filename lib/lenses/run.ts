// Lens scoring orchestrator. Server-only.
//
// Given a set of posts and a resolved lens, returns score+reason per post:
// - Reads cached scores from lens_scores
// - Sends only the missing posts to Claude (Sonnet 4.6) in one batch
// - Persists new scores
// - Returns the merged map { post_id -> { score, reason } }

import Anthropic from "@anthropic-ai/sdk";
import { and, eq, inArray } from "drizzle-orm";

import { lensScores } from "@/db/schema";
import { db } from "@/lib/db";
import type { PHPost } from "@/lib/ph/types";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 6000;
// At ~35 output tokens per post (score + ~100-char reason), MAX_TOKENS
// comfortably fits ~150 posts in one Sonnet call. Beyond that we split
// into batches so the output cap doesn't truncate the JSON array.
const BATCH_SIZE = 120;

const SYSTEM_PROMPT = `Du bewertest ProductHunt-Launches durch eine bestimmte Brille (Filter-Perspektive).
Antworte ausschließlich als gültiges JSON-Array, ohne Markdown-Codefencing, ohne Einleitung.
Schema pro Eintrag: {"id": "<post_id>", "score": <integer 0-10>, "reason": "<ein deutscher Satz, max 100 Zeichen>"}.
Score 0 = passt überhaupt nicht zur Brille, 10 = perfekter Treffer.
Reason erklärt in einem Satz, warum der Score so ausfällt — konkret, ohne Marketing-Sprache.`;

export type LensScoreEntry = { score: number; reason: string };
export type LensScoreMap = Map<string, LensScoreEntry>;

function postsBlock(posts: PHPost[]): string {
  return posts
    .map((p) => {
      const topics = p.topics.edges.map((e) => e.node.name).join(", ");
      return [
        `id: ${p.id}`,
        `name: ${p.name}`,
        `tagline: ${p.tagline}`,
        `topics: ${topics || "—"}`,
      ].join("\n");
    })
    .join("\n---\n");
}

async function callClaude(
  posts: PHPost[],
  lensPrompt: string,
): Promise<{
  entries: Array<{ id: string; score: number; reason: string }>;
  model: string;
  inputTokens: number;
  outputTokens: number;
}> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set.");
  }
  const client = new Anthropic();
  const userPrompt = [
    `## Brille`,
    lensPrompt,
    ``,
    `## Posts`,
    postsBlock(posts),
    ``,
    `## Aufgabe`,
    `Bewerte jeden Post durch diese Brille. Antworte ausschließlich mit dem JSON-Array, in derselben Reihenfolge wie oben.`,
  ].join("\n");

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim()
    // strip ```json fencing just in case the model wraps the output
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(
      `Lens scoring: invalid JSON from Claude. First 200 chars: ${text.slice(0, 200)}`,
    );
  }
  if (!Array.isArray(parsed)) {
    throw new Error("Lens scoring: expected array, got something else.");
  }
  const entries = parsed
    .map((raw): { id: string; score: number; reason: string } | null => {
      if (!raw || typeof raw !== "object") return null;
      const obj = raw as Record<string, unknown>;
      const id = obj.id;
      const score = obj.score;
      const reason = obj.reason;
      if (typeof id !== "string" && typeof id !== "number") return null;
      if (typeof score !== "number") return null;
      if (typeof reason !== "string") return null;
      return {
        id: String(id),
        score: Math.max(0, Math.min(10, Math.round(score))),
        reason: reason.trim(),
      };
    })
    .filter((x): x is { id: string; score: number; reason: string } => !!x);

  return {
    entries,
    model: response.model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

async function callClaudeBatched(
  posts: PHPost[],
  lensPrompt: string,
): Promise<{
  entries: Array<{ id: string; score: number; reason: string }>;
  model: string;
  inputTokens: number;
  outputTokens: number;
}> {
  if (posts.length <= BATCH_SIZE) {
    return callClaude(posts, lensPrompt);
  }
  const allEntries: Array<{ id: string; score: number; reason: string }> = [];
  let totalIn = 0;
  let totalOut = 0;
  let model = "";
  // Sequential batches to stay well clear of Anthropic per-account rate
  // limits, even with the wider 14-day range. The total wait scales
  // linearly (~25 s per ~120-post batch with Sonnet).
  for (let i = 0; i < posts.length; i += BATCH_SIZE) {
    const chunk = posts.slice(i, i + BATCH_SIZE);
    const r = await callClaude(chunk, lensPrompt);
    allEntries.push(...r.entries);
    totalIn += r.inputTokens;
    totalOut += r.outputTokens;
    model = r.model;
  }
  return {
    entries: allEntries,
    model,
    inputTokens: totalIn,
    outputTokens: totalOut,
  };
}

export async function getScoresForLens(
  posts: PHPost[],
  lensKey: string,
  lensPrompt: string,
): Promise<LensScoreMap> {
  const result: LensScoreMap = new Map();
  if (posts.length === 0) return result;

  const postIds = posts.map((p) => p.id);

  // 1) Look up cached scores.
  const cached = db
    .select()
    .from(lensScores)
    .where(
      and(inArray(lensScores.phPostId, postIds), eq(lensScores.lensKey, lensKey)),
    )
    .all();
  for (const row of cached) {
    result.set(row.phPostId, { score: row.score, reason: row.reason });
  }

  // 2) Determine missing posts.
  const missing = posts.filter((p) => !result.has(p.id));
  if (missing.length === 0) return result;

  // 3) Batch the missing through Claude (splits into ~120-post chunks
  // automatically when the lookback window is wide).
  let aiResult;
  try {
    aiResult = await callClaudeBatched(missing, lensPrompt);
  } catch (err) {
    console.error("[lens] Claude scoring failed:", err);
    // Fall back to neutral score 5 with a placeholder reason — better than
    // crashing the whole page; the user can retry by re-applying the lens.
    for (const p of missing) {
      result.set(p.id, {
        score: 5,
        reason: "Bewertung nicht verfügbar (Fallback).",
      });
    }
    return result;
  }

  // 4) Merge AI entries into result.
  const byId = new Map(aiResult.entries.map((e) => [e.id, e]));
  for (const p of missing) {
    const entry = byId.get(p.id);
    if (entry) {
      result.set(p.id, { score: entry.score, reason: entry.reason });
    } else {
      // Claude omitted this post — neutral fallback.
      result.set(p.id, { score: 5, reason: "Keine Bewertung geliefert." });
    }
  }

  // 5) Persist new scores. Use a single insert.
  const rows = missing
    .map((p) => {
      const entry = result.get(p.id);
      if (!entry) return null;
      return {
        phPostId: p.id,
        lensKey,
        score: entry.score,
        reason: entry.reason,
        model: aiResult.model,
        inputTokens: aiResult.inputTokens,
        outputTokens: aiResult.outputTokens,
      };
    })
    .filter((r): r is NonNullable<typeof r> => !!r);
  if (rows.length > 0) {
    // onConflictDoNothing makes parallel Server Component renders safe —
    // both renders see an empty cache, both call Claude, but only the
    // first insert wins (UNIQUE on (ph_post_id, lens_key)).
    db.insert(lensScores).values(rows).onConflictDoNothing().run();
  }

  console.log(
    `[lens] ${lensKey}: ${cached.length} cached, ${rows.length} new, ${aiResult.inputTokens}in/${aiResult.outputTokens}out tokens`,
  );

  return result;
}
