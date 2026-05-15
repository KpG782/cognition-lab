import { NextRequest, NextResponse } from "next/server";
import { intervene } from "@/lib/agents/intervene";
import { MOCK_INTERVENTION } from "@/lib/mocks";

export async function POST(req: NextRequest) {
  try {
    const { decisionText, diagnose } = await req.json();
    const result = await intervene(decisionText ?? "", diagnose);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(MOCK_INTERVENTION);
  }
}
