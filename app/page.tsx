"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createRoom, joinRoom } from "@/lib/multiplayer/room";
import { CITATIONS } from "@/lib/citations";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<"home" | "join">("home");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [about, setAbout] = useState(false);

  async function handleCreate() {
    setBusy(true);
    const c = await createRoom();
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
    <main className="mx-auto flex min-h-screen max-w-[720px] flex-col justify-center px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Cognition Lab</h1>
      <p className="mt-3 text-lg text-neutral-700">
        A multiplayer behavioral economics diagnostic. You diagnose your
        friends. They diagnose you.
      </p>

      <div className="mt-10 flex gap-3">
        {mode === "home" ? (
          <>
            <Button
              onClick={handleCreate}
              disabled={busy}
              className="bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90"
            >
              Create Room
            </Button>
            <Button
              variant="outline"
              onClick={() => setMode("join")}
              disabled={busy}
            >
              Join Room
            </Button>
          </>
        ) : (
          <div className="flex w-full flex-col gap-3">
            <div className="flex gap-3">
              <Input
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={4}
                placeholder="CODE"
                className="max-w-40 font-mono tracking-[0.3em] uppercase"
              />
              <Button
                onClick={handleJoin}
                disabled={busy}
                className="bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90"
              >
                Join
              </Button>
              <Button variant="ghost" onClick={() => setMode("home")}>
                Back
              </Button>
            </div>
            {error && <p className="text-sm text-[#DC2626]">{error}</p>}
          </div>
        )}
      </div>

      <p className="mt-12 text-sm italic text-neutral-500">
        Built on the bias blind spot (Pronin, Lin &amp; Ross, 2002).
      </p>

      <footer className="mt-auto pt-16">
        <button
          onClick={() => setAbout(true)}
          className="text-sm text-neutral-500 underline underline-offset-4"
        >
          About
        </button>
      </footer>

      {about && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6"
          onClick={() => setAbout(false)}
        >
          <div
            className="max-h-[80vh] max-w-[640px] overflow-y-auto bg-white p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-semibold">About Cognition Lab</h2>
            <p className="mt-4 text-sm leading-relaxed text-neutral-700">
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
            <div className="mt-6 space-y-2 font-mono text-xs text-neutral-500">
              {Object.values(CITATIONS).map((c) => (
                <p key={c.paper}>
                  {c.authors}, {c.year}. {c.paper}.
                </p>
              ))}
            </div>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => setAbout(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
