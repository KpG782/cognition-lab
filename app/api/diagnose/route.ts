import { NextRequest, NextResponse } from "next/server";
import { diagnose } from "@/lib/agents/diagnose";
import { MOCK_DIAGNOSE } from "@/lib/mocks";

export async function POST(req: NextRequest) {
  try {
    const { decisionText, price } = await req.json();
    const result = await diagnose(decisionText ?? "", price ?? null);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(MOCK_DIAGNOSE);
  }
}
