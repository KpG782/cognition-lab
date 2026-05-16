import { NextRequest, NextResponse } from "next/server";
import { intervene } from "@/lib/agents/intervene";
import { MOCK_INTERVENTION, MOCK_INTERVENTION_GENERIC } from "@/lib/mocks";
import type { ModeKey } from "@/lib/modes";

export async function POST(req: NextRequest) {
  let mode = "spend";
  try {
    const body = await req.json();
    mode = body.mode ?? "spend";
    const result = await intervene(
      body.decisionText ?? "",
      body.diagnose,
      mode as ModeKey
    );
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      mode === "spend" || mode === "reply"
        ? MOCK_INTERVENTION
        : MOCK_INTERVENTION_GENERIC
    );
  }
}
