"use client";

import { useEffect, useState } from "react";
import { TRAITS, TRAIT_LABEL, type TraitScores } from "@/lib/bigfive";
import type { Narrative } from "@/lib/agents/narrative";

export function ResultCard({
  code,
  scores,
  narrative,
}: {
  code: string;
  scores: TraitScores;
  narrative: Narrative;
}) {
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section className="cl-fade-in">
      <p
        className="font-mono font-semibold tracking-tighter text-[#0A0A0A]"
        style={{ fontSize: "clamp(2.5rem, 8vw, 6rem)", lineHeight: 1 }}
      >
        {code}
      </p>
      <p className="mt-4 max-w-[60ch] text-lg text-[#0A0A0A]">
        {narrative.essence}
      </p>

      <div className="mt-12 space-y-6">
        {TRAITS.map((t) => (
          <div key={t}>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-[#0A0A0A]">
                {TRAIT_LABEL[t]}
              </span>
              <span className="font-mono text-sm text-[#0A0A0A]">
                {scores[t]}
              </span>
            </div>
            <div className="mt-2 h-2 w-full bg-[#0A0A0A]/10">
              <div
                className="cl-bar h-2 bg-[#1E3A8A]"
                style={{ width: filled ? `${scores[t]}%` : "0%" }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 space-y-5">
        {narrative.paragraphs.map((p, i) => (
          <p
            key={i}
            className="max-w-[70ch] text-base leading-relaxed text-[#0A0A0A]"
          >
            {p}
          </p>
        ))}
      </div>
    </section>
  );
}
