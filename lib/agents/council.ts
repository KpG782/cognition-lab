import { z } from "zod";
import { runStructured } from "../llm/client";
import { MOCK_COUNCIL } from "../mocks";
import type { CouncilResult } from "../types";

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
  summary: string
): Promise<CouncilResult> {
  const prompt = `Decision: "${decisionText}"
Diagnostic summary: ${summary}
Give the three single-sentence verdicts.`;
  return runStructured<CouncilResult>(prompt, schema, MOCK_COUNCIL, {
    systemPrompt: SYSTEM,
    temperature: 0.7,
    maxOutputTokens: 1500,
  });
}
