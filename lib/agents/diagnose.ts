import { z } from "zod";
import { runStructured } from "../llm/client";
import {
  MOCK_DIAGNOSE,
  MOCK_DIAGNOSE_REPLY,
  MOCK_DIAGNOSE_CHOICE,
  MOCK_DIAGNOSE_CONFLICT,
  MOCK_DIAGNOSE_INFLUENCE,
  MOCK_DIAGNOSE_IDENTITY,
} from "../mocks";
import type { DiagnoseResult } from "../types";
import { MODES, type ModeKey } from "../modes";
import { getScannerCitation } from "../citations";
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

function buildSystem(mode: ModeKey): string {
  if (mode === "spend" || mode === "mirror") return SPEND_SYSTEM;

  // spend/mirror already returned above; remaining modes have concrete scanners.
  const scanners = MODES[mode].scanners as readonly string[];
  const lines = scanners.map((s) => {
    const c = getScannerCitation(s);
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
  // Every mode has its own scanner-accurate mock so a free-tier hiccup
  // never shows the wrong bias cards on stage. mirror reuses the spend
  // engine + mock by design (it's the multiplayer cross-diagnosis path).
  const FALLBACKS: Record<ModeKey, DiagnoseResult> = {
    spend: MOCK_DIAGNOSE,
    reply: MOCK_DIAGNOSE_REPLY,
    mirror: MOCK_DIAGNOSE,
    choice: MOCK_DIAGNOSE_CHOICE,
    conflict: MOCK_DIAGNOSE_CONFLICT,
    influence: MOCK_DIAGNOSE_INFLUENCE,
    identity: MOCK_DIAGNOSE_IDENTITY,
  };
  const fallback = FALLBACKS[mode] ?? MOCK_DIAGNOSE;
  return runStructured<DiagnoseResult>(prompt, schema, fallback, {
    systemPrompt: buildSystem(mode),
    temperature: 0.3,
    maxOutputTokens: 2500,
  });
}
