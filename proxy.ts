// HTTP Basic Auth for the whole app. See plan.md §5 → Phase 9.
//
// Filename + export name follow Next.js 16 convention (proxy.ts /
// `proxy`), which replaces the deprecated middleware.ts convention.
//
// - All paths require Basic Auth (browser prompts via WWW-Authenticate).
// - DISABLE_AUTH=true bypasses everything — intended for local dev.
// - /api/snapshot/* uses a static token header instead, so an external
//   scheduler (or a curl from the VPS) can hit it without Basic Auth.
//
// Runs on the Edge runtime, so no Node-only APIs (Buffer, crypto).

import { NextResponse, type NextRequest } from "next/server";

const BASIC_REALM = 'Basic realm="ProductHunt Radar", charset="UTF-8"';

function unauthorizedBasic(): NextResponse {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": BASIC_REALM },
  });
}

function unauthorizedJson(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}

function decodeBasic(header: string): { user: string; pass: string } | null {
  if (!header.startsWith("Basic ")) return null;
  try {
    const decoded = atob(header.slice(6).trim());
    const idx = decoded.indexOf(":");
    if (idx < 0) return null;
    return { user: decoded.slice(0, idx), pass: decoded.slice(idx + 1) };
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  // Local-dev escape hatch.
  if (process.env.DISABLE_AUTH === "true") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Token-based bypass for the snapshot trigger so external schedulers
  // (cron job from the VPS, GitHub Action, etc.) can reach it without
  // a browser session.
  if (pathname.startsWith("/api/snapshot")) {
    const expected = process.env.SNAPSHOT_TOKEN;
    if (!expected) {
      return unauthorizedJson(
        "Server misconfigured: SNAPSHOT_TOKEN not set.",
      );
    }
    const provided = request.headers.get("x-snapshot-token");
    if (provided !== expected) {
      return unauthorizedJson("Invalid or missing X-Snapshot-Token.");
    }
    return NextResponse.next();
  }

  // Everything else: Basic Auth.
  const expectedUser = process.env.AUTH_USER;
  const expectedPass = process.env.AUTH_PASS;
  if (!expectedUser || !expectedPass) {
    return new NextResponse(
      "Server misconfigured: AUTH_USER / AUTH_PASS not set.",
      { status: 500 },
    );
  }

  const header = request.headers.get("authorization");
  if (!header) return unauthorizedBasic();

  const creds = decodeBasic(header);
  if (!creds) return unauthorizedBasic();

  if (creds.user !== expectedUser || creds.pass !== expectedPass) {
    return unauthorizedBasic();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on every path except Next internals and static assets in /public.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
