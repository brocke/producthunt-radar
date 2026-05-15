// Manual trigger for the snapshot job. Useful for testing and for external
// schedulers (e.g. GitHub Actions if we ever leave the VPS).
//
// In Phase 9 this route will sit outside Basic Auth but require its own token.

import { NextResponse } from "next/server";

import { takeSnapshot } from "@/lib/snapshots/take";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await takeSnapshot();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[snapshot] manual run failed:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

// GET for browser-convenience during development.
export const GET = POST;
