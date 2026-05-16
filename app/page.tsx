"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRoom, joinRoom } from "@/lib/multiplayer/room";
import { useSession } from "@/store/session-store";
import { CitationModal } from "@/components/CitationModal";

export default function Home() {
  const router = useRouter();
  const setSolo = useSession((s) => s.setSolo);

  const [starting, setStarting] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [citations, setCitations] = useState(false);

  async function handleStart() {
    if (starting) return;
    setStarting(true);
    setSolo(true);
    try {
      const c = await createRoom();
      router.push(`/room/${c}`);
    } catch {
      setStarting(false);
    }
  }

  async function handleJoin() {
    if (joining) return;
    setJoinError("");
    const c = code.trim().toUpperCase();
    if (c.length !== 4) {
      setJoinError("Enter the 4-letter code.");
      return;
    }
    setJoining(true);
    const ok = await joinRoom(c);
    if (ok) {
      router.push(`/room/${c}?observe=1`);
    } else {
      setJoinError("Room not found.");
      setJoining(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[720px] flex-col items-center justify-center px-6 py-20">
      <div className="cl-fade-in flex w-full flex-col items-center text-center">
        <h1
          className="font-semibold tracking-tight text-[#0A0A0A]"
          style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)", lineHeight: 1.05 }}
        >
          Looking Glass
        </h1>

        <p className="mt-8 max-w-[52ch] text-lg leading-relaxed text-[#0A0A0A]">
          A research-backed personality test that shows you the part you
          can&apos;t see — the gap between how you see yourself and how you
          actually come across.
        </p>

        <button
          type="button"
          onClick={handleStart}
          disabled={starting}
          className="mt-12 inline-flex h-12 cursor-pointer items-center justify-center rounded-md bg-[#1E3A8A] px-8 text-base font-medium text-white transition-colors duration-200 hover:bg-[#1E3A8A]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {starting ? "Opening…" : "Take the Test"}
        </button>

        <div className="mt-8">
          {!showJoin ? (
            <button
              type="button"
              onClick={() => setShowJoin(true)}
              className="cursor-pointer text-sm text-[#0A0A0A]/60 underline underline-offset-4 transition-colors duration-200 hover:text-[#0A0A0A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A] focus-visible:ring-offset-2"
            >
              Have a friend&apos;s code?
            </button>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-3">
                <label htmlFor="room-code" className="sr-only">
                  Friend&apos;s room code
                </label>
                <input
                  id="room-code"
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  maxLength={4}
                  placeholder="CODE"
                  aria-invalid={!!joinError}
                  className="h-11 w-32 rounded-md border border-[#0A0A0A]/15 bg-white text-center font-mono text-lg uppercase tracking-[0.4em] text-[#0A0A0A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A] focus-visible:ring-offset-2"
                />
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={joining}
                  className="inline-flex h-11 cursor-pointer items-center justify-center rounded-md bg-[#1E3A8A] px-6 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#1E3A8A]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {joining ? "Joining…" : "Continue"}
                </button>
              </div>
              {joinError && (
                <p role="alert" className="text-sm text-[#0A0A0A]/60">
                  {joinError}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-20 flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={() => setCitations(true)}
            className="cursor-pointer text-sm text-[#0A0A0A]/55 underline underline-offset-4 transition-colors duration-200 hover:text-[#0A0A0A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A] focus-visible:ring-offset-2"
          >
            About the research
          </button>
          <p className="max-w-[60ch] font-mono text-xs italic text-[#0A0A0A]/55">
            Built on the Big Five (Goldberg, 1992) and the Self-Other Knowledge
            Asymmetry (Vazire, 2010).
          </p>
        </div>
      </div>

      <CitationModal open={citations} onClose={() => setCitations(false)} />
    </main>
  );
}
