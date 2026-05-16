"use client";

import { useMemo, useState } from "react";
import { ITEMS, TRAITS, TRAIT_LABEL, type Item } from "@/lib/bigfive";

const SCALE = [1, 2, 3, 4, 5] as const;

function groupItems(items: Item[]): Item[][] {
  return TRAITS.map((t) => items.filter((i) => i.trait === t));
}

export function Questionnaire({
  onDone,
}: {
  onDone: (responses: Record<string, number>) => void;
}) {
  const groups = useMemo(() => groupItems(ITEMS), []);
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});

  const group = groups[step];
  const total = groups.length;
  const allAnswered = group.every((i) => responses[i.id] != null);
  const isLast = step === total - 1;

  function pick(id: string, value: number) {
    setResponses((r) => ({ ...r, [id]: value }));
  }

  function next() {
    if (!allAnswered) return;
    if (isLast) {
      onDone(responses);
      return;
    }
    setStep((s) => s + 1);
  }

  return (
    <section className="cl-fade-in" key={step}>
      <div className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#0A0A0A]/55">
          Section {step + 1} / {total}
        </p>
        <div
          className="mt-3 h-1 w-full bg-[#0A0A0A]/10"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={step + 1}
        >
          <div
            className="cl-bar h-1 bg-[#1E3A8A]"
            style={{ width: `${((step + 1) / total) * 100}%` }}
          />
        </div>
        <h2 className="mt-6 text-2xl font-semibold tracking-tight text-[#0A0A0A]">
          {TRAIT_LABEL[group[0].trait]}
        </h2>
        <p className="mt-1 text-sm text-[#0A0A0A]/60">
          Rate how accurately each statement describes you.
        </p>
      </div>

      <ol className="space-y-8">
        {group.map((item) => (
          <li key={item.id}>
            <fieldset>
              <legend className="text-base text-[#0A0A0A]">
                {item.text}
              </legend>
              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="w-16 text-xs text-[#0A0A0A]/55">
                  Disagree
                </span>
                <div className="flex flex-1 items-center justify-center gap-2 sm:gap-4">
                  {SCALE.map((v) => {
                    const checked = responses[item.id] === v;
                    const inputId = `${item.id}-${v}`;
                    return (
                      <div
                        key={v}
                        className="flex flex-col items-center"
                      >
                        <input
                          type="radio"
                          id={inputId}
                          name={item.id}
                          className="peer sr-only"
                          checked={checked}
                          onChange={() => pick(item.id, v)}
                        />
                        <label
                          htmlFor={inputId}
                          className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border text-sm font-medium transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#1E3A8A] peer-focus-visible:ring-offset-2 ${
                            checked
                              ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                              : "border-[#0A0A0A]/20 text-[#0A0A0A]/70 hover:border-[#1E3A8A]"
                          }`}
                        >
                          <span className="sr-only">
                            {`Rating ${v} of 5 for: ${item.text}`}
                          </span>
                          <span aria-hidden="true">{v}</span>
                        </label>
                      </div>
                    );
                  })}
                </div>
                <span className="w-16 text-right text-xs text-[#0A0A0A]/55">
                  Agree
                </span>
              </div>
            </fieldset>
          </li>
        ))}
      </ol>

      <div className="mt-12 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="inline-flex h-11 cursor-pointer items-center rounded-md border border-[#0A0A0A]/20 px-5 text-sm font-medium text-[#0A0A0A] transition-colors hover:border-[#1E3A8A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          onClick={next}
          disabled={!allAnswered}
          className="inline-flex h-11 cursor-pointer items-center rounded-md bg-[#1E3A8A] px-7 text-sm font-medium text-white transition-colors hover:bg-[#1E3A8A]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLast ? "See my result" : "Next"}
        </button>
      </div>
    </section>
  );
}
