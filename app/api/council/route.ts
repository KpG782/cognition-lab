import { NextRequest, NextResponse } from "next/server";
import { council } from "@/lib/agents/council";
import { MOCK_COUNCIL } from "@/lib/mocks";

export async function POST(req: NextRequest) {
  try {
    const { decisionText, summary } = await req.json();
    const result = await council(decisionText ?? "", summary ?? "");
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(MOCK_COUNCIL);
  }
}
