"use client";

import { MODES, type ModeKey } from "@/lib/modes";

export function ModeShowcase({
  onSelect,
}: {
  onSelect: (mode: ModeKey) => void;
}) {
  const entries = Object.entries(MODES) as [ModeKey, (typeof MODES)[ModeKey]][];

  return (
    <section
      className="cl-fade-in mt-20 border-t border-neutral-200 pt-12"
      aria-label="Behavioral modes"
    >
      <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-500">
        Seven modes. One engine.
      </h2>
      <div className="mt-8 grid gap-px border border-neutral-200 bg-neutral-200 sm:grid-cols-2">
        {entries.map(([key, m]) => {
          const live = m.status === "live";
          return (
            <div
              key={key}
              role={live ? "button" : undefined}
              tabIndex={live ? 0 : undefined}
              onClick={live ? () => onSelect(key) : undefined}
              onKeyDown={
                live
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") onSelect(key);
                    }
                  : undefined
              }
              title={
                live
                  ? `Start ${m.label}`
                  : `Architected — ${m.primaryResearchers.join(", ")}`
              }
              className={`flex flex-col bg-white p-6 ${
                live
                  ? "cursor-pointer transition-colors duration-200 hover:bg-neutral-50"
                  : "cursor-default"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold">{m.label}</h3>
                <span
                  className={`shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] ${
                    live ? "text-[#1E3A8A]" : "text-neutral-400"
                  }`}
                >
                  {live ? "Live" : "Architected"}
                </span>
              </div>
              <p className="mt-1 text-sm text-neutral-700">{m.tagline}</p>
              <p className="mt-3 text-sm italic leading-relaxed text-neutral-500">
                {m.description}
              </p>
              <p className="mt-4 font-mono text-[11px] text-neutral-500">
                {m.primaryResearchers.join(" · ")}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
