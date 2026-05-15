import { z } from "zod";
import { runStructured } from "../llm/client";
import { MOCK_INTERVENTION } from "../mocks";
import type { BiasName, DiagnoseResult, InterventionResult } from "../types";

const schema = z.object({
  interventionName: z.string(),
  citation: z.string(),
  mechanism: z.string(),
  message: z.string(),
});

// Deterministic selector — NOT an LLM decision.
const SELECTOR: Record<
  BiasName,
  { name: string; citation: string }
> = {
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
};

export function topBias(d: DiagnoseResult) {
  return d.biases
    .filter((b) => b.fired && b.confidence > 60)
    .sort((a, b) => b.confidence - a.confidence)[0];
}

export async function intervene(
  decisionText: string,
  d: DiagnoseResult
): Promise<InterventionResult> {
  const top = topBias(d);
  if (!top) return MOCK_INTERVENTION;

  const choice = SELECTOR[top.name];
  const prompt = `The person's decision: "${decisionText}"
Dominant bias: ${top.name} (confidence ${top.confidence}).
Evidence: ${top.evidence}
Counter-intervention to deploy: "${choice.name}" (${choice.citation}).
Write a personalized intervention for THIS person. Return interventionName="${choice.name}", citation="${choice.citation}", a one-sentence mechanism explaining why this counters ${top.name}, and a direct second-person message tailored to their specific decision.`;

  return runStructured<InterventionResult>(prompt, schema, MOCK_INTERVENTION, {
    temperature: 0.7,
    maxOutputTokens: 1800,
  });
}
