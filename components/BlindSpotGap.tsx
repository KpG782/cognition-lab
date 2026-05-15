"use client";

import { BIAS_LABELS } from "@/lib/types";
import type { BiasName } from "@/lib/types";

export function BlindSpotGap({
  selfMotive,
  aiBias,
  friendsTheme,
  gap,
}: {
  selfMotive: string;
  aiBias: BiasName | null;
  friendsTheme: string;
  gap: "HIGH" | "MEDIUM" | "LOW";
}) {
  const gapColor =
    gap === "HIGH" ? "#DC2626" : gap === "MEDIUM" ? "#1E3A8A" : "#0A0A0A";

  return (
    <div className="space-y-6">
      <div className="space-y-2 font-mono text-sm">
        <p>
          <span className="text-neutral-500">Your top self-attributed motive: </span>
          {selfMotive || "—"}
        </p>
        <p>
          <span className="text-neutral-500">AI saw: </span>
          {aiBias ? BIAS_LABELS[aiBias] : "no strong bias"}
        </p>
        <p>
          <span className="text-neutral-500">Friends saw: </span>
          {friendsTheme || "—"}
        </p>
      </div>

      <div>
        <p className="text-sm text-neutral-500">Blind spot gap</p>
        <p
          className="font-mono text-6xl font-semibold"
          style={{ color: gapColor }}
        >
          {gap}
        </p>
      </div>

      <p className="border-t border-neutral-200 pt-4 font-mono text-xs leading-relaxed text-neutral-500">
        Pronin, Lin &amp; Ross, 2002 — The Bias Blind Spot. The reason we
        can&apos;t fix our own thinking is we can&apos;t see it. Friends can. AI
        can. You can&apos;t.
      </p>
    </div>
  );
}
