// Server-only GraphQL client for the ProductHunt API.
// Reads rate-limit headers, logs them, and refuses requests when budget is exhausted.

import { GraphQLClient } from "graphql-request";

const PH_ENDPOINT = "https://api.producthunt.com/v2/api/graphql";

function getToken(): string {
  const token = process.env.PH_TOKEN;
  if (!token) {
    throw new Error(
      "PH_TOKEN is not set. Add it to .env.local (see plan.md §3).",
    );
  }
  return token;
}

let _client: GraphQLClient | null = null;

function getClient(): GraphQLClient {
  if (!_client) {
    _client = new GraphQLClient(PH_ENDPOINT, {
      headers: () => ({
        Authorization: `Bearer ${getToken()}`,
        // Identify ourselves clearly — anonymous default UAs from
        // graphql-request occasionally trip PH's Cloudflare bot
        // protection, especially with paginated bursts.
        "User-Agent": "ProductHunt-Radar/1.0 (+https://ph-radar.filbro.de)",
      }),
    });
  }
  return _client;
}

export type RateLimit = {
  limit: number | null;
  remaining: number | null;
  resetSeconds: number | null;
};

function parseRateLimit(headers: Headers): RateLimit {
  const num = (h: string) => {
    const v = headers.get(h);
    return v === null ? null : Number(v);
  };
  return {
    limit: num("x-rate-limit-limit"),
    remaining: num("x-rate-limit-remaining"),
    resetSeconds: num("x-rate-limit-reset"),
  };
}

function logRateLimit(info: RateLimit) {
  const { remaining, limit, resetSeconds } = info;
  if (remaining === null) {
    console.log("[ph] rate-limit headers missing in response");
    return;
  }
  const tag = remaining < 10 ? "CRITICAL" : remaining < 50 ? "low" : "ok";
  console.log(
    `[ph] rate-limit ${tag}: ${remaining}/${limit ?? "?"} remaining, resets in ${resetSeconds ?? "?"}s`,
  );
}

// Module-level cache of the last known remaining budget, so we can refuse
// new requests pre-flight when the previous response said we were at 0.
let lastKnownRemaining: number | null = null;
let lastKnownResetSeconds: number | null = null;

export async function phRequest<TData>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<TData> {
  if (lastKnownRemaining !== null && lastKnownRemaining <= 0) {
    throw new Error(
      `[ph] Rate limit exhausted on previous call. Resets in ${lastKnownResetSeconds ?? "?"}s — wait before retrying.`,
    );
  }

  const client = getClient();
  const { data, headers, errors } = await client.rawRequest<TData>(
    query,
    variables,
  );

  const rl = parseRateLimit(headers);
  lastKnownRemaining = rl.remaining;
  lastKnownResetSeconds = rl.resetSeconds;
  logRateLimit(rl);

  if (errors && errors.length > 0) {
    throw new Error(`[ph] GraphQL errors: ${JSON.stringify(errors)}`);
  }

  return data;
}
