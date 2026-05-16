import { NextRequest, NextResponse } from "next/server";
import { confederateRead } from "@/lib/agents/confederate";
import { CONFEDERATE_READS } from "@/lib/mocks";

export async function POST(req: NextRequest) {
  try {
    const { decisionText, mode } = await req.json();
    const prediction = await confederateRead(
      decisionText ?? "",
      mode ?? "spend"
    );
    return NextResponse.json({ prediction });
  } catch {
    return NextResponse.json({ prediction: CONFEDERATE_READS.spend[0] });
  }
}
