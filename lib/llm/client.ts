import { generateObject, generateText } from "ai";
import { google } from "@ai-sdk/google";
import type { z } from "zod";

// Single config point. Swap providers here (e.g. anthropic('claude-...')) — nothing else changes.
const MODEL = google("gemini-2.5-flash");

interface GenOptions {
  systemPrompt?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

/**
 * Structured generation with guaranteed mock fallback.
 * Pass a `fallback` that is returned on ANY error — this function never throws.
 */
export async function runStructured<T>(
  prompt: string,
  schema: z.ZodType<T>,
  fallback: T,
  opts: GenOptions = {}
): Promise<T> {
  try {
    const { object } = await generateObject({
      model: MODEL,
      schema,
      prompt,
      system: opts.systemPrompt,
      temperature: opts.temperature ?? 0.3,
      maxOutputTokens: opts.maxOutputTokens ?? 600,
    });
    return object;
  } catch (err) {
    console.error("[llm] runStructured failed, using mock fallback:", err);
    return fallback;
  }
}

export async function runText(
  prompt: string,
  fallback: string,
  opts: GenOptions = {}
): Promise<string> {
  try {
    const { text } = await generateText({
      model: MODEL,
      prompt,
      system: opts.systemPrompt,
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxOutputTokens ?? 300,
    });
    return text;
  } catch (err) {
    console.error("[llm] runText failed, using mock fallback:", err);
    return fallback;
  }
}
