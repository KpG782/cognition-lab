import { NextRequest, NextResponse } from "next/server";
import { classifyMode } from "@/lib/agents/router";
import { MOCK_ROUTER } from "@/lib/mocks";

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json();
    const result = await classifyMode(input ?? "");
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(MOCK_ROUTER);
  }
}
