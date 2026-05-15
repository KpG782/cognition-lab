import { z } from "zod";
import { runStructured } from "../llm/client";
import { MOCK_ROUTER } from "../mocks";

const MODE_ENUM = [
  "spend",
  "reply",
  "choice",
  "conflict",
  "influence",
  "identity",
] as const;

export const RouterSchema = z.object({
  primaryMode: z.enum(MODE_ENUM),
  confidence: z.number().min(0).max(100),
  secondaryMode: z.enum(MODE_ENUM).optional(),
  reasoning: z.string(),
});

export type RouterResult = z.infer<typeof RouterSchema>;

const SYSTEM = `You are a router for a behavioral-decision engine. Classify the user's input into exactly one primary mode by its signature. Return a 0-100 confidence and one-sentence reasoning. Optionally name a secondary mode if a second signature is clearly present.

Mode signatures:
- spend: buying, prices, products, discounts, "should I get/buy".
- reply: a message was received; how/whether to respond; "what should I say".
- choice: a major life fork — job, relationship, location, commit/leave.
- conflict: anger or frustration at a specific person; "I want to tell them".
- influence: an incoming offer/pitch/recruiter DM, urgency or pressure language, suspicious framing.
- identity: repeated self-discipline failures; "I keep doing X"; habit-vs-identity gap.

Be decisive. Never invent a mode outside the six.`;

export async function classifyMode(input: string): Promise<RouterResult> {
  return runStructured<RouterResult>(
    `Input: "${input}"`,
    RouterSchema,
    MOCK_ROUTER,
    { systemPrompt: SYSTEM, temperature: 0.2, maxOutputTokens: 200 }
  );
}
