import { z } from "zod";
import { runStructured } from "../llm/client";
import { MOCK_DIAGNOSE } from "../mocks";
import type { DiagnoseResult } from "../types";

const schema = z.object({
  biases: z.array(
    z.object({
      name: z.enum([
        "loss_aversion",
        "hyperbolic_discounting",
        "anchoring",
        "sunk_cost",
        "affect_heuristic",
      ]),
      fired: z.boolean(),
      confidence: z.number(),
      evidence: z.string(),
    })
  ),
  summary: z.string(),
});

const SYSTEM = `You are a behavioral economics diagnostic engine. Given a person's purchase or decision rationale, evaluate ALL FIVE biases below in a single pass. For each, decide whether it fired, give a 0-100 confidence, and cite one sentence of evidence referencing the person's own words.

- Loss Aversion (Kahneman & Tversky, 1979): overweighting the regret of NOT buying. Triggers: "miss out", "limited", "won't be available", FOMO language.
- Hyperbolic Discounting (Laibson, 1997): overvaluing immediate reward vs. delayed cost. Triggers: "right now", "today", "deserve", "treat myself", "had a hard day".
- Anchoring (Tversky & Kahneman, 1974): an original price or discount doing the persuading. Triggers: "was X now Y", "% off", price comparisons.
- Sunk Cost (Arkes & Blumer, 1985): past spending justifying current spending. Triggers: "already spent on", "to complete", "won't waste".
- Affect Heuristic (Slovic, 2007): emotional state driving cognition. Triggers: stress, mood, exhaustion signals.

Return exactly 5 bias entries. Be calibrated: only mark fired=true with confidence above 55 when the text genuinely supports it. Keep the summary to one sentence.`;

export async function diagnose(
  decisionText: string,
  price: number | null
): Promise<DiagnoseResult> {
  const prompt = `Decision: "${decisionText}"${
    price != null ? `\nStated price: ${price}` : ""
  }`;
  return runStructured<DiagnoseResult>(prompt, schema, MOCK_DIAGNOSE, {
    systemPrompt: SYSTEM,
    temperature: 0.3,
    maxOutputTokens: 2500,
  });
}
