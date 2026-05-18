// Range = how far back to fetch from ProductHunt. Capped at 3 days because
// PH's complexity-based rate limit (6250 / 15 min) gets pressured fast with
// repeated user clicks + the cron snapshot job on the same budget, and the
// UX of waiting 20+ s per range switch was poor. For deeper history, switch
// the feed to read from the snapshots DB (see plan.md §10 "Später").

export const RANGE_KEYS = ["24h", "3d"] as const;
export type RangeKey = (typeof RANGE_KEYS)[number];

export const DEFAULT_RANGE: RangeKey = "24h";

export const RANGE_LABELS: Record<RangeKey, string> = {
  "24h": "24 h",
  "3d": "3 Tage",
};

/**
 * Lowercase variants for inline use in sentences ("Launches aus den
 * letzten 3 Tagen.").
 */
export const RANGE_INLINE: Record<RangeKey, string> = {
  "24h": "letzten 24 Stunden",
  "3d": "letzten 3 Tagen",
};

export const RANGE_HOURS: Record<RangeKey, number> = {
  "24h": 24,
  "3d": 72,
};

export function parseRangeKey(raw: string | undefined): RangeKey {
  if (raw && (RANGE_KEYS as readonly string[]).includes(raw)) {
    return raw as RangeKey;
  }
  return DEFAULT_RANGE;
}
