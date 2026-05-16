import { runText } from "../llm/client";
import { CONFEDERATE_READS } from "../mocks";
import type { ModeKey } from "../modes";

// Deliberately NOT the diagnose engine: this must read as a blunt friend
// texting back, never a clinical scanner — that contrast is the whole point
// of keeping a human "friend" column distinct from the algorithm column.
const PEER_SYSTEM = `You are texting a close friend back about a decision they just told you. You are NOT a therapist, coach, or analyst. One or two sentences. Casual, second person ("you"), a little blunt, no jargon, no bias names, no bullet points, no preamble. Say what you think is *really* driving them — the thing they probably can't see in themselves.`;

function bankRead(mode: ModeKey): string {
  const bank = CONFEDERATE_READS[mode] ?? CONFEDERATE_READS.spend;
  return bank[Math.floor(Math.random() * bank.length)];
}

export async function confederateRead(
  decisionText: string,
  mode: ModeKey = "spend"
): Promise<string> {
  const fallback = bankRead(mode);
  const prompt = `Your friend just said: "${decisionText}"\n\nText back your honest read of what's really going on with them.`;
  // gpt-oss is a reasoning model — give it room or reasoning eats the budget
  // and returns empty. runText only falls back on throw, so guard empty too.
  const out = await runText(prompt, fallback, {
    systemPrompt: PEER_SYSTEM,
    temperature: 0.8,
    maxOutputTokens: 900,
  });
  return out.trim() || fallback;
}
