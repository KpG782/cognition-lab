"use client";

import { TRAIT_LABEL, type BlindSpot } from "@/lib/bigfive";

export function BlindSpotCard({
  blindSpot,
  source,
}: {
  blindSpot: BlindSpot;
  source: "ai" | "friend";
}) {
  return (
    <article className="mx-auto w-full max-w-[560px] border border-[#0A0A0A]/15 bg-white p-8">
      <h2
        className="font-semibold tracking-tight text-[#0A0A0A]"
        style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)", lineHeight: 1.08 }}
      >
        {blindSpot.headline}
      </h2>

      <div className="mt-10 space-y-7">
        {blindSpot.perTrait.map((row) => {
          const lo = Math.min(row.predicted, row.observed);
          const hi = Math.max(row.predicted, row.observed);
          const isHigh = row.band === "HIGH";
          return (
            <div key={row.trait}>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-[#0A0A0A]">
                  {TRAIT_LABEL[row.trait]}
                </span>
                <span className="flex items-center gap-3">
                  <span
                    className={`font-mono text-[11px] uppercase tracking-[0.12em] ${
                      isHigh ? "text-[#DC2626]" : "text-[#0A0A0A]/55"
                    }`}
                  >
                    {row.band}
                  </span>
                  <span className="font-mono text-sm text-[#0A0A0A]">
                    {row.gap}
                  </span>
                </span>
              </div>
              <div className="relative mt-3 h-3 w-full bg-[#0A0A0A]/8">
                {/* divergence segment */}
                <div
                  className="absolute top-0 h-3"
                  style={{
                    left: `${lo}%`,
                    width: `${hi - lo}%`,
                    backgroundColor: isHigh ? "#DC2626" : "#1E3A8A",
                    opacity: isHigh ? 0.55 : 0.28,
                  }}
                />
                {/* predicted marker: hollow ring */}
                <span
                  className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0A0A0A] bg-white"
                  style={{ left: `${row.predicted}%` }}
                  aria-hidden="true"
                />
                {/* observed marker: filled dot */}
                <span
                  className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1E3A8A]"
                  style={{ left: `${row.observed}%` }}
                  aria-hidden="true"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 flex items-center gap-6 border-t border-[#0A0A0A]/10 pt-6 text-xs text-[#0A0A0A]/55">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full border-2 border-[#0A0A0A] bg-white" />
          You predicted
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#1E3A8A]" />
          Observed
        </span>
      </div>

      <p className="mt-8 font-mono text-2xl text-[#0A0A0A]">
        Blind-Spot Index: {blindSpot.index}
      </p>
      <p className="mt-3 text-sm text-[#0A0A0A]/70">
        {source === "ai"
          ? "Observer: AI estimate from your own words"
          : "Observer: a friend who knows you"}
      </p>
      <p className="mt-2 font-mono text-xs italic text-[#0A0A0A]/50">
        Vazire, 2010 — Self-Other Knowledge Asymmetry
      </p>
    </article>
  );
}
