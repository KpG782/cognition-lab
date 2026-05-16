import { z } from "zod";
import { runStructured } from "../llm/client";
import { TRAITS, type TraitScores, type Responses } from "../bigfive";
import { OBSERVER_MOCK } from "../mocks";

export const ObserverSchema = z.object({
  O: z.number(),
  C: z.number(),
  E: z.number(),
  A: z.number(),
  N: z.number(),
});

const SYSTEM = `You estimate how a person comes across to someone who has just observed them, on the Big Five. Output ONLY five integers 0-100 (O,C,E,A,N) as the percentile each trait would read at to an outside observer. Base it strictly on the evidence given. Be decisive.`;

// Solo path only. Clearly an AI estimate from the user's own words —
// the friend observer form is the real measurement.
export async function aiObserverEstimate(
  selfResponses: Responses,
  situation?: string
): Promise<TraitScores> {
  const fallback: TraitScores = OBSERVER_MOCK as TraitScores;
  const answered = Object.entries(selfResponses)
    .map(([k, v]) => `${k}:${v}`)
    .join(" ");
  const prompt = `Self-report answers (1-5): ${answered}\nRecent situation they described: ${
    situation || "(none given)"
  }\nEstimate observer-perceived percentiles.`;
  const r = await runStructured(prompt, ObserverSchema, fallback, {
    systemPrompt: SYSTEM,
    temperature: 0.4,
    maxOutputTokens: 200,
  });
  const out = {} as TraitScores;
  for (const t of TRAITS) out[t] = Math.max(0, Math.min(100, Math.round(r[t] ?? 50)));
  return out;
}
