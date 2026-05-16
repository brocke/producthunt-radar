// Lens definitions — the three built-in "viewpoints" Filip + Torsten use
// to browse ProductHunt (workflow / replicate / discuss). Custom lenses
// extend this with an ad-hoc free-text prompt the user types into the
// "Custom..." modal.

export type DefaultLensKey = "workshop" | "replicate" | "discuss";

export type LensDef = {
  key: DefaultLensKey;
  label: string;
  description: string;
  prompt: string;
};

export const DEFAULT_LENSES: Record<DefaultLensKey, LensDef> = {
  workshop: {
    key: "workshop",
    label: "Workshop",
    description: "Tools, die ich für KI-Workshops, Coaching oder eigene Produktivität einsetzen kann.",
    prompt:
      "Bewerte, wie nützlich dieses Tool für jemanden ist, der KI-Workshops, Coaching oder Beratung anbietet und nach Tools für den eigenen Arbeitsfluss sucht. Hoher Score (8–10) bei: direkter Workflow-Nutzen, sofort einsetzbar, klares Use Case für Kreativ- und Wissensarbeit. Mittlerer Score (4–7) bei: indirekt nützlich, gehört in den breiteren KI-Tool-Kosmos. Niedriger Score (0–3) bei: hochspezielle B2B-Nische, reines Entertainment, technische Spielereien ohne Anwendungsbezug.",
  },
  replicate: {
    key: "replicate",
    label: "Nachbau",
    description: "Konzepte, die als Vorlage zum eigenen Nachbauen taugen.",
    prompt:
      "Bewerte, wie gut sich das Konzept dieses Tools als Vorlage zum eigenen Nachbauen oder als Lern-/Inspirationsbeispiel eignet. Hoher Score (8–10) bei: klar umrissene Idee, überschaubarer technischer Stack, in 2 Wochen replizierbar, gute Lehrwirkung. Mittlerer Score (4–7) bei: interessantes Konzept, aber Aufwand oder spezielle Daten nötig. Niedriger Score (0–3) bei: massive proprietäre Datenmengen, jahrelanges Modell-Training, breite Branchen-Anpassung nötig.",
  },
  discuss: {
    key: "discuss",
    label: "Diskussion",
    description: "Strategisch oder kulturell interessante Launches mit Gesprächswert.",
    prompt:
      "Bewerte, wie interessant dieses Tool als Diskussions- oder Strategie-Anlass ist. Hoher Score (8–10) bei: kontroverse oder zukunftsrelevante Konzepte, ungewöhnliche Ansätze, kulturell auffällig, ethische Fragen, klares Branchen-Signal. Mittlerer Score (4–7) bei: leichter Twist, aber nicht überraschend. Niedriger Score (0–3) bei: x-tes Tool im selben Segment, reine Inkrement-Updates, kein neuer Gedanke.",
  },
};

export const DEFAULT_LENS_KEYS = Object.keys(DEFAULT_LENSES) as DefaultLensKey[];

export function isDefaultLensKey(key: string): key is DefaultLensKey {
  return key in DEFAULT_LENSES;
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
 */
export function resolveLens(
  lensParam: string | undefined,
  customPrompt: string | undefined,
): { key: string; prompt: string; label: string } | null {
  if (!lensParam) return null;
  if (isDefaultLensKey(lensParam)) {
    const def = DEFAULT_LENSES[lensParam];
    return { key: def.key, prompt: def.prompt, label: def.label };
  }
  if (lensParam === "custom" && customPrompt) {
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
