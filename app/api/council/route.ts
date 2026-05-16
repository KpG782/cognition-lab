import { NextRequest, NextResponse } from "next/server";
import { council } from "@/lib/agents/council";
import { MOCK_COUNCIL, MOCK_COUNCIL_GENERIC } from "@/lib/mocks";
import type { ModeKey } from "@/lib/modes";

export async function POST(req: NextRequest) {
  let mode = "spend";
  try {
    const body = await req.json();
    mode = body.mode ?? "spend";
    const result = await council(
      body.decisionText ?? "",
      body.summary ?? "",
      mode as ModeKey
    );
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      mode === "spend" ? MOCK_COUNCIL : MOCK_COUNCIL_GENERIC
    );
  }
}
