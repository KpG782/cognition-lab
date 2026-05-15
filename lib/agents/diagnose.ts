import { z } from "zod";
import { runStructured } from "../llm/client";
import { MOCK_DIAGNOSE, MOCK_DIAGNOSE_REPLY } from "../mocks";
import type { DiagnoseResult } from "../types";
import { MODES, type ModeKey } from "../modes";
import { CITATIONS } from "../citations";
import { scannerLabel } from "../types";

const schema = z.object({
  biases: z.array(
    z.object({
      name: z.string(),
      fired: z.boolean(),
      confidence: z.number(),
      evidence: z.string(),
    })
  ),
  summary: z.string(),
});

// Exact, proven Spend prompt — do not change; it drives the primary demo path.
const SPEND_SYSTEM = `You are a behavioral economics diagnostic engine. Given a person's purchase or decision rationale, evaluate ALL FIVE biases below in a single pass. For each, decide whether it fired, give a 0-100 confidence, and cite one sentence of evidence referencing the person's own words.

- Loss Aversion (Kahneman & Tversky, 1979): overweighting the regret of NOT buying. Triggers: "miss out", "limited", "won't be available", FOMO language.
- Hyperbolic Discounting (Laibson, 1997): overvaluing immediate reward vs. delayed cost. Triggers: "right now", "today", "deserve", "treat myself", "had a hard day".
- Anchoring (Tversky & Kahneman, 1974): an original price or discount doing the persuading. Triggers: "was X now Y", "% off", price comparisons.
- Sunk Cost (Arkes & Blumer, 1985): past spending justifying current spending. Triggers: "already spent on", "to complete", "won't waste".
- Affect Heuristic (Slovic, 2007): emotional state driving cognition. Triggers: stress, mood, exhaustion signals.

Return exactly 5 bias entries. Be calibrated: only mark fired=true with confidence above 55 when the text genuinely supports it. Keep the summary to one sentence.`;

// Best-effort scanner name -> citation key resolution for dynamic prompts.
const CITATION_ALIASES: Record<string, string> = {
  projection: "projection_shadow",
  reactance: "reactance",
  fundamental_attribution: "fundamental_attribution",
  affect_heuristic: "affect_heuristic",
  loss_aversion: "loss_aversion",
  hyperbolic_discounting: "hyperbolic_discounting",
  anchoring: "anchoring",
  sunk_cost: "sunk_cost",
  status_quo_bias: "status_quo_bias",
  optionality_paralysis: "optionality_paralysis",
  reciprocity: "cialdini_reciprocity",
  commitment_consistency: "cialdini_commitment_consistency",
  social_proof: "cialdini_social_proof",
  liking: "cialdini_liking",
  authority: "cialdini_authority",
  scarcity: "cialdini_scarcity",
  unity: "cialdini_unity",
  identity_behavior_mismatch: "atomic_habits_identity",
  fixed_mindset_drift: "growth_mindset",
  narrative_incoherence: "narrative_identity",
};

function buildSystem(mode: ModeKey): string {
  if (mode === "spend" || mode === "mirror") return SPEND_SYSTEM;

  const scanners = MODES[mode].scanners.filter((s) => s !== "all");
  const lines = scanners.map((s) => {
    const key = CITATION_ALIASES[s] as keyof typeof CITATIONS | undefined;
    const c = key ? CITATIONS[key] : undefined;
    const def = c
      ? `${c.authors}, ${c.year}: ${c.finding}`
      : "evaluate from context.";
    return `- ${s} — ${scannerLabel(s)} (${def})`;
  });

  return `You are a behavioral diagnostic engine operating in ${MODES[mode].label}. Given the person's input, evaluate ALL ${scanners.length} scanners below in a single pass. For each, decide whether it fired, give a 0-100 confidence, and cite one sentence of evidence referencing the person's own words. Use the exact scanner key (snake_case, the part before the em dash) as the "name".

${lines.join("\n")}

Return exactly ${scanners.length} entries. Be calibrated: only mark fired=true with confidence above 55 when the text genuinely supports it. Keep the summary to one sentence.`;
}

export async function diagnose(
  decisionText: string,
  price: number | null,
  mode: ModeKey = "spend"
): Promise<DiagnoseResult> {
  const prompt = `Decision: "${decisionText}"${
    price != null ? `\nStated price: ${price}` : ""
  }`;
  const fallback = mode === "reply" ? MOCK_DIAGNOSE_REPLY : MOCK_DIAGNOSE;
  return runStructured<DiagnoseResult>(prompt, schema, fallback, {
    systemPrompt: buildSystem(mode),
    temperature: 0.3,
    maxOutputTokens: 2500,
  });
}
