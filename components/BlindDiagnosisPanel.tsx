"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Submission } from "@/lib/types";

export function BlindDiagnosisPanel({
  others,
  humanReadCount,
  expected,
  onSubmit,
}: {
  others: Submission[];
  humanReadCount: number;
  expected: number;
  onSubmit: (predictions: Record<string, string>) => void;
}) {
  const [preds, setPreds] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const allFilled =
    others.length > 0 &&
    others.every((s) => (preds[s.id] ?? "").trim().length > 0);

  if (done) {
    return (
      <div className="space-y-3">
        <p className="text-lg">Reads submitted. The algorithm is scanning too.</p>
        <p className="font-mono text-sm text-neutral-500">
          {humanReadCount} of {expected} reads in
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-neutral-500">
        You see everyone else&apos;s decision — not your own. What is really
        driving them?
      </p>
      {others.map((s) => (
        <div key={s.id} className="border border-neutral-200 p-4">
          <p className="font-medium">{s.player_name}</p>
          <p className="mt-1 text-neutral-700">{s.decision_text}</p>
          {s.price != null && (
            <p className="mt-1 font-mono text-xs text-neutral-500">
              price {s.price}
            </p>
          )}
          <Textarea
            value={preds[s.id] ?? ""}
            onChange={(e) =>
              setPreds((p) => ({ ...p, [s.id]: e.target.value }))
            }
            placeholder="What do you think is really driving this decision?"
            rows={2}
            className="mt-3"
          />
        </div>
      ))}
      <Button
        disabled={!allFilled}
        onClick={() => {
          setDone(true);
          onSubmit(preds);
        }}
        className="bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90"
      >
        Submit your reads
      </Button>
      <p className="font-mono text-sm text-neutral-500">
        {humanReadCount} of {expected} reads in
      </p>
    </div>
  );
}
