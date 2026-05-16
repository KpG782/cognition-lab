import { NextRequest, NextResponse } from "next/server";
import { writeNarrative } from "@/lib/agents/narrative";
import type { TraitScores } from "@/lib/bigfive";

export async function POST(req: NextRequest) {
  const { code, scores } = (await req.json()) as {
    code: string;
    scores: TraitScores;
  };
  const narrative = await writeNarrative(code, scores);
  return NextResponse.json(narrative);
}
