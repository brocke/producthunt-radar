// Phase 1 smoke-test endpoint.
// GET /api/smoke → fetches today's posts from PH, logs to server console,
// and returns a compact JSON view for quick verification via curl.

import { NextResponse } from "next/server";
import { getTodayPosts } from "@/lib/ph/posts";

export const dynamic = "force-dynamic"; // always hit PH, no caching for smoke test

export async function GET() {
  try {
    const { posts } = await getTodayPosts();

    console.log(`\n[smoke] ${posts.length} posts from ProductHunt:\n`);
    for (const post of posts) {
      console.log(
        `  ${String(post.votesCount).padStart(4)} votes  ${post.name} — ${post.tagline}`,
      );
    }
    console.log("");

    return NextResponse.json({
      count: posts.length,
      posts: posts.map((p) => ({
        name: p.name,
        slug: p.slug,
        tagline: p.tagline,
        votes: p.votesCount,
        comments: p.commentsCount,
        topics: p.topics.edges.map((e) => e.node.name),
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[smoke] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
