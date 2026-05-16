import { NextRequest, NextResponse } from "next/server";
import { aiObserverEstimate } from "@/lib/agents/confederate";
import type { Responses } from "@/lib/bigfive";

export async function POST(req: NextRequest) {
  const { responses, situation } = (await req.json()) as {
    responses: Responses;
    situation?: string;
  };
  const observed = await aiObserverEstimate(responses, situation);
  return NextResponse.json(observed);
}
