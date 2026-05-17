// Range = how far back to fetch from ProductHunt. 14 days is the soft cap —
// beyond that the post count becomes unwieldy in the UI and the lens-scoring
// cost climbs linearly. For deeper history, use the snapshot archive (see
// plan.md §10 "Später").

export const RANGE_KEYS = ["24h", "3d", "7d", "14d"] as const;
export type RangeKey = (typeof RANGE_KEYS)[number];

export const DEFAULT_RANGE: RangeKey = "3d";

export const RANGE_LABELS: Record<RangeKey, string> = {
  "24h": "Letzte 24 h",
  "3d": "Letzte 3 Tage",
  "7d": "Letzte 7 Tage",
  "14d": "Letzte 14 Tage",
};

/**
 * Lowercase variants for inline use in sentences ("Launches aus den
 * letzten 3 Tagen.").
 */
export const RANGE_INLINE: Record<RangeKey, string> = {
  "24h": "letzten 24 Stunden",
  "3d": "letzten 3 Tagen",
  "7d": "letzten 7 Tagen",
  "14d": "letzten 14 Tagen",
};

export const RANGE_HOURS: Record<RangeKey, number> = {
  "24h": 24,
  "3d": 72,
  "7d": 168,
  "14d": 336,
};

export function parseRangeKey(raw: string | undefined): RangeKey {
  if (raw && (RANGE_KEYS as readonly string[]).includes(raw)) {
    return raw as RangeKey;
  }
  return DEFAULT_RANGE;
}
