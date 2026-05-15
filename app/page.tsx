"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createRoom, joinRoom } from "@/lib/multiplayer/room";
import { CITATIONS } from "@/lib/citations";
import { ModeShowcase } from "@/components/ModeShowcase";
import { CitationModal } from "@/components/CitationModal";
import type { ModeKey } from "@/lib/modes";

const PROTOCOL = [
  {
    n: "01",
    title: "Submit a decision",
    body: "Each player logs one real purchase they're weighing — privately.",
  },
  {
    n: "02",
    title: "Diagnose a friend",
    body: "You never analyze your own choice. You scan someone else's reasoning for bias.",
  },
  {
    n: "03",
    title: "See the gap",
    body: "Your self-assessment is set against how others — and the model — read you.",
  },
];

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<"home" | "join">("home");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [about, setAbout] = useState(false);
  const [citations, setCitations] = useState(false);

  useEffect(() => {
    if (!about) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbout(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [about]);

  async function handleCreate() {
    setBusy(true);
    const c = await createRoom("spend");
    router.push(`/room/${c}`);
  }

  async function handleSelectMode(m: ModeKey) {
    setBusy(true);
    const c = await createRoom(m);
    router.push(`/room/${c}`);
  }

  async function handleJoin() {
    setError("");
    const c = code.trim().toUpperCase();
    if (c.length !== 4) {
      setError("Enter a 4-letter code.");
      return;
    }
    setBusy(true);
    const ok = await joinRoom(c);
    if (ok) {
      router.push(`/room/${c}`);
    } else {
      setError("Room not found.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[760px] flex-col px-6 py-16 sm:py-24">
      <div className="cl-fade-in">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-500">
          Behavioral Economics Diagnostic
        </p>

        <h1 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          You can&apos;t see your
          <br />
          own bias.
          <span className="text-[#1E3A8A]"> Your friends can.</span>
        </h1>

        <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-neutral-700">
          A multiplayer instrument for the bias blind spot. You diagnose the
          reasoning behind your friends&apos; decisions. They diagnose yours.
          Then you measure the distance between the two.
        </p>

        {/* Primary action */}
        <div className="mt-10">
          {mode === "home" ? (
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleCreate}
                disabled={busy}
                className="h-11 cursor-pointer bg-[#1E3A8A] px-6 text-white transition-colors duration-200 hover:bg-[#1E3A8A]/90"
              >
                {busy ? "Opening room…" : "Create a room"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setMode("join")}
                disabled={busy}
                className="h-11 cursor-pointer px-6"
              >
                Join with a code
              </Button>
            </div>
          ) : (
            <div className="flex w-full flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <label htmlFor="room-code" className="sr-only">
                  Four-letter room code
                </label>
                <Input
                  id="room-code"
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  maxLength={4}
                  placeholder="CODE"
                  aria-invalid={!!error}
                  className="h-11 max-w-40 text-center font-mono text-lg uppercase tracking-[0.4em]"
                />
                <Button
                  onClick={handleJoin}
                  disabled={busy}
                  className="h-11 cursor-pointer bg-[#1E3A8A] px-6 text-white transition-colors duration-200 hover:bg-[#1E3A8A]/90"
                >
                  Join
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setMode("home");
                    setError("");
                  }}
                  className="h-11 cursor-pointer"
                >
                  Back
                </Button>
              </div>
              {error && (
                <p role="alert" className="text-sm text-[#DC2626]">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <ModeShowcase onSelect={handleSelectMode} />

      {/* Protocol — operationalizes the moat */}
      <section
        className="cl-fade-in mt-20 border-t border-neutral-200 pt-12"
        aria-label="How the diagnostic works"
      >
        <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-500">
          The Protocol
        </h2>
        <ol className="mt-8 grid gap-10 sm:grid-cols-3 sm:gap-8">
          {PROTOCOL.map((step) => (
            <li key={step.n}>
              <p className="font-mono text-sm text-[#1E3A8A]">{step.n}</p>
              <h3 className="mt-3 text-base font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Research foundation — the visible research is a hard requirement */}
      <section
        className="cl-fade-in mt-16 border-t border-neutral-200 pt-12"
        aria-label="Research foundation"
      >
        <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-500">
          Grounded in the literature
        </h2>
        <p className="mt-4 max-w-[58ch] text-sm leading-relaxed text-neutral-600">
          Every diagnosis cites named, peer-reviewed findings — not vibes.
        </p>
        <div className="mt-6 space-y-1.5 font-mono text-xs text-neutral-500">
          {Object.values(CITATIONS)
            .slice(0, 4)
            .map((c) => (
              <p key={c.paper}>
                {c.authors} ({c.year}) — {c.paper}.
              </p>
            ))}
          <button
            onClick={() => setCitations(true)}
            className="cursor-pointer text-neutral-400 underline underline-offset-4 transition-colors duration-200 hover:text-[#0A0A0A]"
          >
            + {Object.values(CITATIONS).length - 4} more in the citation
            registry
          </button>
        </div>
      </section>

      <footer className="mt-auto flex items-center justify-between pt-20">
        <p className="font-mono text-xs italic text-neutral-400">
          Pronin, Lin &amp; Ross, 2002
        </p>
        <button
          onClick={() => setAbout(true)}
          className="cursor-pointer text-sm text-neutral-500 underline underline-offset-4 transition-colors duration-200 hover:text-[#0A0A0A]"
        >
          About this instrument
        </button>
      </footer>

      {about && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6"
          onClick={() => setAbout(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-title"
            className="cl-fade-in max-h-[80vh] max-w-[640px] overflow-y-auto border border-neutral-200 bg-white p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-500">
              About this instrument
            </p>
            <h2 id="about-title" className="mt-3 text-2xl font-semibold">
              Why diagnose each other?
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-neutral-700">
              Pronin, Lin &amp; Ross (2002) showed that people consistently rate
              themselves as less susceptible to cognitive biases than others —
              the bias blind spot — even when shown direct evidence to the
              contrary.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">
              Solo debiasing fails because the blind spot is recursive: you
              can&apos;t introspect your way out of a flaw in introspection.
              Multiplayer diagnosis works because other people — and an
              algorithm — observe your reasoning from the outside, where the
              bias is visible.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 border-t border-neutral-200 pt-6">
              <Button
                className="h-11 cursor-pointer bg-[#1E3A8A] px-6 text-white transition-colors duration-200 hover:bg-[#1E3A8A]/90"
                onClick={() => {
                  setAbout(false);
                  setCitations(true);
                }}
              >
                View all {Object.values(CITATIONS).length} citations
              </Button>
              <Button
                variant="outline"
                className="h-11 cursor-pointer px-6"
                onClick={() => setAbout(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      <CitationModal open={citations} onClose={() => setCitations(false)} />
    </main>
  );
}
