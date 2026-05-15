"use client";

import type { CouncilResult } from "@/lib/types";
import { CITATIONS } from "@/lib/citations";

export function CouncilVote({ council }: { council: CouncilResult }) {
  const rows = [
    {
      label: "System 1",
      cite: `${CITATIONS.systems_1_and_2.authors}, ${CITATIONS.systems_1_and_2.year}`,
      text: council.system1,
    },
    {
      label: "System 2",
      cite: `${CITATIONS.systems_1_and_2.authors}, ${CITATIONS.systems_1_and_2.year}`,
      text: council.system2,
    },
    {
      label: "Future Self",
      cite: `${CITATIONS.future_self.authors}, ${CITATIONS.future_self.year}`,
      text: council.futureSelf,
    },
  ];
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.label} className="border-l-2 border-[#1E3A8A] pl-4">
          <p className="font-mono text-xs text-neutral-500">
            {r.label} · {r.cite}
          </p>
          <p className="mt-1">{r.text}</p>
        </div>
      ))}
    </div>
  );
}
