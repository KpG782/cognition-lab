import { NextRequest, NextResponse } from "next/server";
import { CONFEDERATE_READS } from "@/lib/mocks";

export async function POST(req: NextRequest) {
  try {
    const { mode } = await req.json();
    const bank = CONFEDERATE_READS[mode] ?? CONFEDERATE_READS.spend;
    const prediction = bank[Math.floor(Math.random() * bank.length)];
    return NextResponse.json({ prediction });
  } catch {
    return NextResponse.json({ prediction: CONFEDERATE_READS.spend[0] });
  }
}
