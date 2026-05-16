import { z } from "zod";
import { runStructured } from "../llm/client";
import { MOCK_INTERVENTION, MOCK_INTERVENTION_GENERIC } from "../mocks";
import type { DiagnoseResult, InterventionResult } from "../types";
import type { ModeKey } from "../modes";

const schema = z.object({
  interventionName: z.string(),
  citation: z.string(),
  mechanism: z.string(),
  message: z.string(),
});

// Deterministic selector — NOT an LLM decision.
const DEFAULT_CHOICE = {
  name: "Temporal Self-Distancing",
  citation: "Kross & Ayduk, 2011",
};

const SELECTOR: Record<string, { name: string; citation: string }> = {
  hyperbolic_discounting: {
    name: "Implementation Intention",
    citation: "Gollwitzer, 1999",
  },
  loss_aversion: {
    name: "Gain Reframing",
    citation: "Tversky & Kahneman, 1981",
  },
  anchoring: {
    name: "Reference Class Reset",
    citation: "Tversky & Kahneman, 1974",
  },
  sunk_cost: {
    name: "Temporal Self-Distancing",
    citation: "Kross & Ayduk, 2011",
  },
  affect_heuristic: {
    name: "Temporal Self-Distancing",
    citation: "Kross & Ayduk, 2011",
  },
  reactance: {
    name: "Frankl Pause",
    citation: "Frankl, 1946",
  },
  projection: {
    name: "Jungian Shadow Mirror",
    citation: "Jung, 1951",
  },
  fundamental_attribution: {
    name: "Perspective-Taking",
    citation: "Ross, 1977",
  },
  // Choice
  status_quo_bias: { name: "Decision Pre-Mortem", citation: "Klein, 2007" },
  optionality_paralysis: {
    name: "Ten-Ten-Ten Rule",
    citation: "Welch, 2009",
  },
  projection_bias: { name: "Future-Self Letter", citation: "Hershfield, 2011" },
  narrow_framing: { name: "Decision Pre-Mortem", citation: "Klein, 2007" },
  // Conflict
  in_group_bias: {
    name: "Stoic Dichotomy of Control",
    citation: "Epictetus, c.108",
  },
  recency_anger: { name: "Frankl Pause", citation: "Frankl, 1946" },
  // Influence
  reciprocity: { name: "Name the Weapon", citation: "Cialdini, 1984" },
  commitment_consistency: {
    name: "Counter-Frame",
    citation: "Kahneman, 2011",
  },
  social_proof: { name: "Name the Weapon", citation: "Cialdini, 1984" },
  liking: { name: "Refusal Script", citation: "Cialdini, 1984" },
  authority: { name: "Name the Weapon", citation: "Cialdini, 1984" },
  scarcity: { name: "Counter-Frame", citation: "Brehm, 1966" },
  unity: { name: "Refusal Script", citation: "Cialdini, 1984" },
  // Identity
  identity_behavior_mismatch: {
    name: "Identity-First Reframe",
    citation: "Clear, 2018",
  },
  fixed_mindset_drift: {
    name: "Identity-First Reframe",
    citation: "Dweck, 2006",
  },
  exile_part_avoidance: {
    name: "IFS Parts Dialogue",
    citation: "Schwartz, 1995",
  },
  narrative_incoherence: {
    name: "Narrative Rewrite",
    citation: "McAdams, 2001",
  },
};

export function topBias(d: DiagnoseResult) {
  return d.biases
    .filter((b) => b.fired && b.confidence > 60)
    .sort((a, b) => b.confidence - a.confidence)[0];
}

export async function intervene(
  decisionText: string,
  d: DiagnoseResult,
  mode: ModeKey = "spend"
): Promise<InterventionResult> {
  // spend/reply have purpose-written mocks; every other mode falls back to
  // the decision-agnostic one so no purchase language leaks on stage.
  const fallback =
    mode === "spend" || mode === "reply"
      ? MOCK_INTERVENTION
      : MOCK_INTERVENTION_GENERIC;
  const top = topBias(d);
  if (!top) return fallback;

  const choice = SELECTOR[top.name] ?? DEFAULT_CHOICE;
  const prompt = `The person's decision: "${decisionText}"
Dominant bias: ${top.name} (confidence ${top.confidence}).
Evidence: ${top.evidence}
Counter-intervention to deploy: "${choice.name}" (${choice.citation}).
Write a personalized intervention for THIS person. Return interventionName="${choice.name}", citation="${choice.citation}", a one-sentence mechanism explaining why this counters ${top.name}, and a direct second-person message tailored to their specific decision.`;

  return runStructured<InterventionResult>(prompt, schema, fallback, {
    temperature: 0.7,
    maxOutputTokens: 1800,
  });
}
