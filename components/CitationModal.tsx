"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CITATIONS } from "@/lib/citations";

const ARCH_DIAGRAM =
  "Input → Router → Mode Registry → Scanners → Interventions → Council";

export function CitationModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const entries = Object.entries(CITATIONS);
  const peerReviewed = entries.filter(
    ([, c]) => "peerReviewed" in c && c.peerReviewed
  ).length;
  const linked = entries.filter(([, c]) => "url" in c && c.url).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="citation-title"
        className="cl-fade-in max-h-[82vh] w-full max-w-[680px] overflow-y-auto border border-neutral-200 bg-white p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-500">
          Citation Registry
        </p>
        <h2 id="citation-title" className="mt-3 text-2xl font-semibold">
          {entries.length} sourced findings
        </h2>
        <p className="mt-2 text-sm text-neutral-500">
          {peerReviewed} peer-reviewed articles · {linked} linked to the
          original source. Remaining entries are foundational books and
          classical texts.
        </p>

        <pre className="mt-5 overflow-x-auto border border-neutral-200 bg-neutral-50 px-4 py-3 font-mono text-xs text-[#1E3A8A]">
          {ARCH_DIAGRAM}
        </pre>

        <div className="mt-6 space-y-3 border-t border-neutral-200 pt-6 font-mono text-xs leading-relaxed text-neutral-600">
          {entries.map(([key, c]) => {
            const url = "url" in c ? c.url : undefined;
            return (
              <p key={key}>
                <span className="text-[#0A0A0A]">
                  {c.authors}, {c.year}.
                </span>{" "}
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer text-[#1E3A8A] underline underline-offset-2 transition-colors duration-200 hover:text-[#0A0A0A]"
                  >
                    {c.paper}
                  </a>
                ) : (
                  c.paper
                )}
                {"journal" in c && c.journal ? ` — ${c.journal}` : ""}.{" "}
                {"peerReviewed" in c && c.peerReviewed && (
                  <span className="not-italic text-[#1E3A8A]">
                    [peer-reviewed]
                  </span>
                )}{" "}
                <span className="not-italic text-neutral-500">
                  {c.finding}
                </span>
              </p>
            );
          })}
        </div>

        <Button
          variant="outline"
          className="mt-6 h-11 cursor-pointer px-6"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  );
}
