import { z } from "zod";
import { runStructured } from "../llm/client";
import { TRAITS, TRAIT_LABEL, type TraitScores } from "../bigfive";

export const NarrativeSchema = z.object({
  essence: z.string(),
  paragraphs: z.array(z.string()),
});
export type Narrative = z.infer<typeof NarrativeSchema>;

const SYSTEM = `You write a warm, sharp, 16Personalities-style personality read. Honest but flattering, second person, no jargon, no bias names, no numbers. Return one short "essence" line and 2-3 short paragraphs. Never invent scores — describe the trait pattern you are given.`;

function band(v: number): "high" | "moderate" | "low" {
  return v >= 66 ? "high" : v >= 34 ? "moderate" : "low";
}

// Deterministic fallback: a readable description, NOT a stub. Used whenever
// the LLM is unavailable so the demo never shows a placeholder.
export function templateNarrative(code: string, s: TraitScores): Narrative {
  const lines = TRAITS.map(
    (t) => `${band(s[t])} ${TRAIT_LABEL[t].toLowerCase()}`
  );
  return {
    essence: `Type ${code}: a distinctive ${lines[2]}, ${lines[3]} profile.`,
    paragraphs: [
      `You combine ${lines[0]} and ${lines[1]}, which shapes how you approach new ideas and follow through on them.`,
      `Socially you read as ${lines[2]} and ${lines[3]}.`,
      `Under pressure your ${lines[4]} tends to set the tone of how you respond.`,
    ],
  };
}

export async function writeNarrative(
  code: string,
  s: TraitScores
): Promise<Narrative> {
  const fallback = templateNarrative(code, s);
  const prompt = `Type code: ${code}\nTrait bands: ${TRAITS.map(
    (t) => `${TRAIT_LABEL[t]}=${band(s[t])}`
  ).join(", ")}\nWrite the personality read.`;
  return runStructured<Narrative>(prompt, NarrativeSchema, fallback, {
    systemPrompt: SYSTEM,
    temperature: 0.7,
    maxOutputTokens: 600,
  });
}
