import { z } from "zod";
import { runStructured } from "../llm/client";
import { MOCK_COUNCIL, MOCK_COUNCIL_GENERIC } from "../mocks";
import type { CouncilResult } from "../types";
import type { ModeKey } from "../modes";

const schema = z.object({
  system1: z.string(),
  system2: z.string(),
  futureSelf: z.string(),
});

const SYSTEM = `You are a council of three voices weighing one purchase decision. Each speaks ONE sentence, first person.
- system1: fast, emotional, present tense — the impulse talking.
- system2: slow, deliberate, evidence-weighted — the reasoning talking.
- futureSelf: the person 30 days from now looking back.`;

export async function council(
  decisionText: string,
  summary: string,
  mode: ModeKey = "spend"
): Promise<CouncilResult> {
  const fallback = mode === "spend" ? MOCK_COUNCIL : MOCK_COUNCIL_GENERIC;
  const prompt = `Decision: "${decisionText}"
Diagnostic summary: ${summary}
Give the three single-sentence verdicts.`;
  return runStructured<CouncilResult>(prompt, schema, fallback, {
    systemPrompt: SYSTEM,
    temperature: 0.7,
    maxOutputTokens: 1500,
  });
}
