"use client";

import { Lock } from "lucide-react";
import { MODES, type ModeKey } from "@/lib/modes";

export function ModeTabs({
  current,
  onSwitch,
}: {
  current: ModeKey;
  onSwitch: (mode: ModeKey) => void;
}) {
  const entries = Object.entries(MODES) as [ModeKey, (typeof MODES)[ModeKey]][];

  return (
    <nav
      aria-label="Modes"
      className="flex flex-wrap gap-x-5 gap-y-2 border-b border-neutral-200 pb-3"
    >
      {entries.map(([key, m]) => {
        const active = key === current;
        const live = m.status === "live";
        return (
          <button
            key={key}
            type="button"
            disabled={!live}
            onClick={live ? () => onSwitch(key) : undefined}
            title={
              live
                ? m.tagline
                : `Architected — ${m.primaryResearchers.join(", ")}`
            }
            className={`flex items-center gap-1.5 pb-1 font-mono text-xs uppercase tracking-[0.14em] transition-colors duration-200 ${
              active
                ? "border-b-2 border-[#1E3A8A] text-[#1E3A8A]"
                : live
                  ? "cursor-pointer text-neutral-500 hover:text-[#0A0A0A]"
                  : "cursor-default text-neutral-300"
            }`}
          >
            {!live && <Lock className="h-3 w-3" aria-hidden />}
            {m.label.replace(" Mode", "")}
          </button>
        );
      })}
    </nav>
  );
}
