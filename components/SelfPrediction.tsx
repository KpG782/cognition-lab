"use client";

import { useState } from "react";
import { TRAITS, type Trait } from "@/lib/bigfive";

const QUESTION: Record<Trait, string> = {
  O: "How open to new ideas & experiences are you?",
  C: "How organized & disciplined are you?",
  E: "How outgoing & energized by people are you?",
  A: "How warm & cooperative are you?",
  N: "How emotionally reactive under stress are you?",
};

const ANCHORS: Record<Trait, [string, string]> = {
  O: ["Practical", "Curious"],
  C: ["Spontaneous", "Organized"],
  E: ["Reserved", "Outgoing"],
  A: ["Direct", "Warm"],
  N: ["Steady", "Reactive"],
};

export function SelfPrediction({
  onDone,
}: {
  onDone: (prediction: Record<string, number>) => void;
}) {
  const [values, setValues] = useState<Record<Trait, number>>({
    O: 50,
    C: 50,
    E: 50,
    A: 50,
    N: 50,
  });

  function set(t: Trait, v: number) {
    setValues((s) => ({ ...s, [t]: v }));
  }

  return (
    <section className="cl-fade-in">
      <h2 className="text-2xl font-semibold tracking-tight text-[#0A0A0A]">
        Before you see the result — guess yourself.
      </h2>
      <p className="mt-2 max-w-[60ch] text-sm text-[#0A0A0A]/60">
        Slide each to where you think you land versus most people. This is
        the prediction we measure your blind spot against.
      </p>

      <div className="mt-10 space-y-10">
        {TRAITS.map((t) => {
          const id = `pred-${t}`;
          return (
            <div key={t}>
              <label
                htmlFor={id}
                className="block text-base text-[#0A0A0A]"
              >
                {QUESTION[t]}
              </label>
              <div className="mt-4 flex items-center gap-4">
                <span className="w-20 text-xs text-[#0A0A0A]/55">
                  {ANCHORS[t][0]}
                </span>
                <input
                  id={id}
                  type="range"
                  min={0}
                  max={100}
                  value={values[t]}
                  onChange={(e) => set(t, Number(e.target.value))}
                  className="h-2 flex-1 cursor-pointer accent-[#1E3A8A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A] focus-visible:ring-offset-2"
                />
                <span className="w-20 text-right text-xs text-[#0A0A0A]/55">
                  {ANCHORS[t][1]}
                </span>
                <span className="w-10 text-right font-mono text-sm text-[#0A0A0A]">
                  {values[t]}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12">
        <button
          type="button"
          onClick={() => onDone({ ...values })}
          className="inline-flex h-11 cursor-pointer items-center rounded-md bg-[#1E3A8A] px-7 text-sm font-medium text-white transition-colors hover:bg-[#1E3A8A]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A] focus-visible:ring-offset-2"
        >
          Continue
        </button>
      </div>
    </section>
  );
}
