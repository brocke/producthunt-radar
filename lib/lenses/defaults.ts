// Lens definitions — the three built-in "viewpoints" Filip + Torsten use
// to browse ProductHunt (workflow / replicate / discuss). Custom lenses
// extend this with an ad-hoc free-text prompt the user types into the
// "Custom..." modal.

export type DefaultLensKey = "workflow" | "replicate" | "signal";

export type LensDef = {
  key: DefaultLensKey;
  label: string;
  description: string;
  prompt: string;
};

export const DEFAULT_LENSES: Record<DefaultLensKey, LensDef> = {
  workflow: {
    key: "workflow",
    label: "Workflow",
    description: "Tools, die ich für meinen Arbeitsalltag (KI-Entwicklung, Workshops, Coaching, Beratung) einsetzen kann.",
    prompt:
      "Ich arbeite täglich mit KI-Tools im Berufsalltag (KI-Entwicklung, Workshops, Coaching). Bewerte, wie offensichtlich nützlich dieses Tool für meinen Workflow ist. Hoch: schnell zugänglich, klarer Mehrwert, hilft bei wiederkehrenden Aufgaben, „das würde ich sofort ausprobieren“. Niedrig: zu nischig, zu komplex zum Reinkommen, oder unklar, was es konkret bringt.",
  },
  replicate: {
    key: "replicate",
    label: "Nachbau",
    description: "Konzepte, die als Vorlage zum eigenen Nachbauen taugen.",
    prompt:
      "Ich baue mit Claude Code gerne eigene kleine Tools, wenn ich einen ähnlichen Use Case habe. Bewerte, wie gut sich das Konzept dieses Tools als Vorlage zum Selber-Bauen eignet. Hoch: überschaubare Idee, technisch greifbar, gutes Lehrbeispiel. Niedrig: nur mit großen Datenmengen, langem Modell-Training oder Spezialwissen sinnvoll replizierbar.",
  },
  signal: {
    key: "signal",
    label: "Signal",
    description: "Launches, die ein interessantes Signal senden — strategisch, kulturell oder technisch.",
    prompt:
      "Ich beobachte, wo sich die KI-Landschaft hinbewegt. Bewerte, wie stark dieses Tool ein interessantes Signal sendet — kontrovers, ungewöhnlich, technisch neuartig, strategisch relevant, zukunftsgerichtet. Hoch: hier passiert was Neues. Niedrig: x-tes Tool im selben Muster, reines Inkrement-Update, austauschbar.",
  },
};

export const DEFAULT_LENS_KEYS = Object.keys(DEFAULT_LENSES) as DefaultLensKey[];

export function isDefaultLensKey(key: string): key is DefaultLensKey {
  return key in DEFAULT_LENSES;
}

/**
 * Returns the default lens key whose prompt exactly matches the given
 * text (ignoring leading/trailing whitespace), or null. Used to keep
 * cache hits when the user applies an unmodified default prompt.
 */
export function findMatchingDefaultLens(
  prompt: string,
): DefaultLensKey | null {
  const trimmed = prompt.trim();
  if (!trimmed) return null;
  for (const key of DEFAULT_LENS_KEYS) {
    if (DEFAULT_LENSES[key].prompt.trim() === trimmed) return key;
  }
  return null;
}

/**
 * Small, stable hash for custom lens prompts so we can cache scores per
 * (post_id, lens_key) without storing the full prompt in the key.
 * djb2 — fast, no Buffer/crypto dependency (Edge-safe just in case).
 */
export function customLensKey(prompt: string): string {
  let hash = 5381;
  const trimmed = prompt.trim();
  for (let i = 0; i < trimmed.length; i++) {
    hash = ((hash << 5) + hash + trimmed.charCodeAt(i)) | 0;
  }
  return `custom:${(hash >>> 0).toString(36)}`;
}

/**
 * Resolve a (lensKey, customPrompt?) pair from URL params into a concrete
 * prompt and a cache key. Returns null if the inputs are invalid.
 *
 * Backwards-compat: the old "discuss" key is mapped to "signal" so any
 * bookmarked ?lens=discuss URLs keep working after the rename in KOE-357.
 */
export function resolveLens(
  lensParam: string | undefined,
  customPrompt: string | undefined,
): { key: string; prompt: string; label: string } | null {
  if (!lensParam) return null;
  const normalized = lensParam === "discuss" ? "signal" : lensParam;
  if (isDefaultLensKey(normalized)) {
    const def = DEFAULT_LENSES[normalized];
    return { key: def.key, prompt: def.prompt, label: def.label };
  }
  if (normalized === "custom" && customPrompt) {
    const cleaned = customPrompt.trim();
    if (cleaned.length < 3) return null;
    return {
      key: customLensKey(cleaned),
      prompt: cleaned,
      label: "Eigene Brille",
    };
  }
  return null;
}
