// lib/bigfive.ts
// Deterministic Big Five authority. NO LLM. Pure, synchronous.
// Items: public-domain IPIP Big-Five markers (Goldberg, 1992; IPIP, Goldberg 1999).

export type Trait = "O" | "C" | "E" | "A" | "N";
export const TRAITS: Trait[] = ["O", "C", "E", "A", "N"];

export const TRAIT_LABEL: Record<Trait, string> = {
  O: "Openness",
  C: "Conscientiousness",
  E: "Extraversion",
  A: "Agreeableness",
  N: "Emotional Volatility",
};

export interface Item {
  id: string;
  trait: Trait;
  text: string;
  keyed: 1 | -1;
}

// 6 items per trait, 1-5 Likert. keyed -1 items are reverse-scored.
export const ITEMS: Item[] = [
  { id: "E1", trait: "E", keyed: 1, text: "I am the life of the party." },
  { id: "E2", trait: "E", keyed: -1, text: "I don't talk a lot." },
  { id: "E3", trait: "E", keyed: 1, text: "I feel comfortable around people." },
  { id: "E4", trait: "E", keyed: -1, text: "I keep in the background." },
  { id: "E5", trait: "E", keyed: 1, text: "I start conversations." },
  { id: "E6", trait: "E", keyed: -1, text: "I have little to say." },
  { id: "A1", trait: "A", keyed: -1, text: "I am not really interested in others." },
  { id: "A2", trait: "A", keyed: 1, text: "I sympathize with others' feelings." },
  { id: "A3", trait: "A", keyed: -1, text: "I am not interested in other people's problems." },
  { id: "A4", trait: "A", keyed: 1, text: "I feel others' emotions." },
  { id: "A5", trait: "A", keyed: 1, text: "I make people feel at ease." },
  { id: "A6", trait: "A", keyed: -1, text: "I insult people." },
  { id: "C1", trait: "C", keyed: 1, text: "I am always prepared." },
  { id: "C2", trait: "C", keyed: -1, text: "I leave my belongings around." },
  { id: "C3", trait: "C", keyed: 1, text: "I pay attention to details." },
  { id: "C4", trait: "C", keyed: -1, text: "I make a mess of things." },
  { id: "C5", trait: "C", keyed: 1, text: "I get chores done right away." },
  { id: "C6", trait: "C", keyed: -1, text: "I often forget to put things back in their proper place." },
  { id: "N1", trait: "N", keyed: 1, text: "I get stressed out easily." },
  { id: "N2", trait: "N", keyed: -1, text: "I am relaxed most of the time." },
  { id: "N3", trait: "N", keyed: 1, text: "I worry about things." },
  { id: "N4", trait: "N", keyed: 1, text: "I am easily disturbed." },
  { id: "N5", trait: "N", keyed: 1, text: "I change my mood a lot." },
  { id: "N6", trait: "N", keyed: -1, text: "I seldom feel blue." },
  { id: "O1", trait: "O", keyed: 1, text: "I have a rich vocabulary." },
  { id: "O2", trait: "O", keyed: -1, text: "I have difficulty understanding abstract ideas." },
  { id: "O3", trait: "O", keyed: 1, text: "I have a vivid imagination." },
  { id: "O4", trait: "O", keyed: -1, text: "I am not interested in abstract ideas." },
  { id: "O5", trait: "O", keyed: 1, text: "I have excellent ideas." },
  { id: "O6", trait: "O", keyed: 1, text: "I am quick to understand things." },
];

// Third-person observer items: same constructs, "they" phrasing.
export const OBSERVER_ITEMS: Item[] = ITEMS.map((i) => ({
  ...i,
  text: i.text
    .replace(/^I am\b/, "They are")
    .replace(/^I /, "They ")
    .replace(/\bI\b/g, "they")
    .replace(/\bmy\b/g, "their")
    .replace(/\bme\b/g, "them"),
}));

// Approx population norms for the 6-item (sum 6-30) IPIP markers.
// Documented approximation (Goldberg IPIP marker distributions); used only
// to map raw sums to "vs. most people" percentiles, never clinical claims.
const NORMS: Record<Trait, { mean: number; sd: number }> = {
  O: { mean: 23, sd: 4 },
  C: { mean: 21, sd: 4.5 },
  E: { mean: 19, sd: 5 },
  A: { mean: 24, sd: 4 },
  N: { mean: 18, sd: 5 },
};

export type Responses = Record<string, number>; // itemId -> 1..5
export type TraitScores = Record<Trait, number>; // 0..100 percentile

function normalCdf(z: number): number {
  // Abramowitz & Stegun 7.1.26 approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  let p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (z > 0) p = 1 - p;
  return p;
}

function rawSum(items: Item[], r: Responses): Record<Trait, number> {
  const sums: Record<Trait, number> = { O: 0, C: 0, E: 0, A: 0, N: 0 };
  for (const it of items) {
    const v = r[it.id] ?? 3;
    sums[it.trait] += it.keyed === 1 ? v : 6 - v;
  }
  return sums;
}

function toPercentiles(sums: Record<Trait, number>): TraitScores {
  const out = {} as TraitScores;
  for (const t of TRAITS) {
    const z = (sums[t] - NORMS[t].mean) / NORMS[t].sd;
    out[t] = Math.round(normalCdf(z) * 100);
  }
  return out;
}

export function scoreSelf(r: Responses): TraitScores {
  return toPercentiles(rawSum(ITEMS, r));
}

export function scoreObserver(r: Responses): TraitScores {
  return toPercentiles(rawSum(OBSERVER_ITEMS, r));
}

// 5-letter code from trait poles. Uppercase = high (>=50), lowercase = low.
const POLE: Record<Trait, [string, string]> = {
  O: ["O", "o"],
  C: ["C", "c"],
  E: ["E", "e"],
  A: ["A", "a"],
  N: ["N", "n"],
};
export function typeCode(s: TraitScores): string {
  return TRAITS.map((t) => (s[t] >= 50 ? POLE[t][0] : POLE[t][1])).join("");
}

export type GapBand = "HIGH" | "MED" | "LOW";
export function gapBand(gap: number): GapBand {
  if (gap >= 30) return "HIGH";
  if (gap >= 15) return "MED";
  return "LOW";
}

export interface BlindSpot {
  perTrait: { trait: Trait; predicted: number; observed: number; gap: number; band: GapBand }[];
  index: number; // 0..100 mean absolute gap
  headline: string;
}

export function blindSpot(
  predicted: TraitScores,
  observed: TraitScores
): BlindSpot {
  const perTrait = TRAITS.map((trait) => {
    const gap = Math.abs(predicted[trait] - observed[trait]);
    return { trait, predicted: predicted[trait], observed: observed[trait], gap, band: gapBand(gap) };
  }).sort((a, b) => b.gap - a.gap);
  const index = Math.round(
    perTrait.reduce((s, p) => s + p.gap, 0) / perTrait.length
  );
  const top = perTrait[0];
  const dir = top.observed > top.predicted ? "more" : "less";
  const headline =
    top.band === "LOW"
      ? "Your self-image and how you come across are closely aligned."
      : `You see yourself as ${dir === "more" ? "lower" : "higher"} in ${TRAIT_LABEL[top.trait]} than you actually come across.`;
  return { perTrait, index, headline };
}
