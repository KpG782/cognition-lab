"use client";

import { useEffect, useState } from "react";
import type { BiasResult } from "@/lib/types";
import { scannerLabel } from "@/lib/types";
import { getScannerCitation } from "@/lib/citations";

export function BiasCard({ bias }: { bias: BiasResult }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = requestAnimationFrame(() => setWidth(bias.confidence));
    return () => cancelAnimationFrame(t);
  }, [bias.confidence]);

  const c = getScannerCitation(bias.name);
  const high = bias.confidence >= 75;
  const accent = high ? "#DC2626" : "#1E3A8A";

  return (
    <div className="border border-neutral-200 p-4">
      <div className="flex items-baseline justify-between">
        <span className="font-medium">{scannerLabel(bias.name)}</span>
        <span
          className="font-mono text-sm"
          style={{ color: accent }}
        >
          {bias.confidence}
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full bg-neutral-100">
        <div
          className="h-full transition-[width] duration-700 ease-out"
          style={{ width: `${width}%`, backgroundColor: accent }}
        />
      </div>
      <p className="mt-3 text-sm text-neutral-700">{bias.evidence}</p>
      {c && (
        <p className="mt-2 font-mono text-xs text-neutral-500">
          {c.authors}, {c.year} — {c.finding}
        </p>
      )}
    </div>
  );
}
