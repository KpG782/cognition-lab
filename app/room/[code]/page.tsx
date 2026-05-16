"use client";

import {
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { RoomLobby } from "@/components/RoomLobby";
import { Questionnaire } from "@/components/Questionnaire";
import { SelfPrediction } from "@/components/SelfPrediction";
import { ResultCard } from "@/components/ResultCard";
import { BlindSpotCard } from "@/components/BlindSpotCard";
import { ObserverForm } from "@/components/ObserverForm";
import {
  getPlayerId,
  getRoomState,
  addPlayer,
  setPhase,
  setSolo,
  resetRoom,
  fetchSubmissions,
  subscribeToRoom,
  submitResponseSet,
} from "@/lib/multiplayer/room";
import { useSession } from "@/store/session-store";
import {
  scoreSelf,
  scoreObserver,
  typeCode,
  blindSpot,
  TRAITS,
  type TraitScores,
} from "@/lib/bigfive";
import { templateNarrative, type Narrative } from "@/lib/agents/narrative";
import type { RoomStateData, Submission } from "@/lib/types";

const ID_KEY = "cognition_player_id";

interface ResponsePayload {
  kind: "self" | "observer";
  subjectId: string;
  responses: Record<string, number>;
  prediction?: Record<string, number>;
  situation?: string;
}

function parsePayload(s: Submission): ResponsePayload | null {
  try {
    const p = JSON.parse(s.decision_text) as ResponsePayload;
    if (p && (p.kind === "self" || p.kind === "observer")) return p;
  } catch {
    /* not a response set */
  }
  return null;
}

function predictionToScores(p: Record<string, number>): TraitScores {
  const out = {} as TraitScores;
  for (const t of TRAITS) out[t] = p[t] ?? 50;
  return out;
}

export default function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);

  // ---- Observer guest branch (?observe=1) ---------------------------------
  const [isObserver, setIsObserver] = useState(false);
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setIsObserver(sp.get("observe") === "1");
  }, []);

  if (isObserver) {
    return <ObserverGuest code={code} />;
  }
  return <RoomHost code={code} />;
}

// =============================================================================
// Observer guest: skips all phases, fills the observer form.
// =============================================================================
function ObserverGuest({ code }: { code: string }) {
  const [name, setName] = useState("");
  const [nameLocked, setNameLocked] = useState(false);
  const [hostId, setHostId] = useState<string | null>(null);
  const [hostName, setHostName] = useState("your friend");
  const [done, setDone] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    (async () => {
      const state = await getRoomState(code);
      const subs = await fetchSubmissions(code);
      const selfSub = subs.find((s) => parsePayload(s)?.kind === "self");
      const resolved =
        state.hostPlayerId ?? selfSub?.player_id ?? null;
      setHostId(resolved);
      if (selfSub) setHostName(selfSub.player_name);
    })();
  }, [code]);

  function guestId(): string {
    let id = localStorage.getItem(ID_KEY);
    if (!id) {
      id =
        "g_" +
        Math.random().toString(36).slice(2, 10);
      localStorage.setItem(ID_KEY, id);
    }
    return id;
  }

  if (done) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[720px] flex-col justify-center px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[#0A0A0A]">
          Thank you.
        </h1>
        <p className="mt-3 max-w-[60ch] text-base text-[#0A0A0A]/70">
          Your read of {hostName} has been recorded. They&apos;ll see how it
          compares to how they see themselves. You can close this tab.
        </p>
      </main>
    );
  }

  if (!nameLocked) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[720px] flex-col justify-center px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[#0A0A0A]">
          You&apos;ve been asked for an honest read.
        </h1>
        <p className="mt-3 max-w-[60ch] text-base text-[#0A0A0A]/70">
          A friend wants to know how they actually come across. Enter your
          first name to begin.
        </p>
        <form
          className="mt-6 flex gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) setNameLocked(true);
          }}
        >
          <label htmlFor="guest-name" className="sr-only">
            Your first name
          </label>
          <input
            id="guest-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your first name"
            className="h-11 w-56 rounded-md border border-[#0A0A0A]/15 bg-white px-3 text-base text-[#0A0A0A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A] focus-visible:ring-offset-2"
          />
          <button
            type="submit"
            disabled={name.trim().length === 0}
            className="inline-flex h-11 cursor-pointer items-center rounded-md bg-[#1E3A8A] px-6 text-sm font-medium text-white transition-colors hover:bg-[#1E3A8A]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Begin
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-[720px] px-6 py-12">
      <ObserverForm
        subjectName={hostName}
        onDone={async (responses) => {
          if (submittingRef.current) return;
          submittingRef.current = true;
          try {
            await submitResponseSet(code, guestId(), name.trim(), {
              kind: "observer",
              subjectId: hostId ?? "host",
              responses,
            });
          } catch (err) {
            console.error("observer submit failed", err);
          }
          setDone(true);
        }}
      />
    </main>
  );
}

// =============================================================================
// Host: the 6-phase Looking Glass machine.
// =============================================================================
function RoomHost({ code }: { code: string }) {
  const playerId = useRef<string>("");
  if (!playerId.current && typeof window !== "undefined") {
    playerId.current = getPlayerId();
  }

  const {
    playerName,
    setPlayerName,
    phase,
    setPhase: setLocalPhase,
    solo,
    setSolo: setLocalSolo,
    responses,
    setResponses,
    prediction,
    setPrediction,
    observed,
    setObserved,
    narrative,
    setNarrative,
    reset,
  } = useSession();

  const [nameDraft, setNameDraft] = useState("");
  const [joined, setJoined] = useState(false);
  const [state, setState] = useState<RoomStateData>({
    phase: "intro",
    players: [],
  });
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [copied, setCopied] = useState(false);
  const narrativeRan = useRef(false);
  const observerRequested = useRef(false);
  const submittingRef = useRef(false);

  const refetch = useCallback(async () => {
    const s = await getRoomState(code);
    setState(s);
    setSubmissions(await fetchSubmissions(code));
  }, [code]);

  // Join + subscribe (non-solo realtime sync).
  useEffect(() => {
    if (!joined || !playerName) return;
    let cleanup = () => {};
    (async () => {
      await addPlayer(code, { id: playerId.current, name: playerName });
      await refetch();
      cleanup = subscribeToRoom(code, refetch);
    })();
    return () => cleanup();
  }, [joined, playerName, code, refetch]);

  const isHost = state.players[0]?.id === playerId.current;

  // ---- Name gate ----------------------------------------------------------
  if (!joined || !playerName) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[720px] flex-col justify-center px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[#0A0A0A]">
          Room <span className="font-mono">{code}</span>
        </h1>
        <p className="mt-2 text-sm text-[#0A0A0A]/60">Enter your name.</p>
        <form
          className="mt-4 flex gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (nameDraft.trim()) {
              setPlayerName(nameDraft.trim());
              setJoined(true);
            }
          }}
        >
          <label htmlFor="player-name" className="sr-only">
            Your name
          </label>
          <input
            id="player-name"
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            placeholder="Your name"
            className="h-11 w-56 rounded-md border border-[#0A0A0A]/15 bg-white px-3 text-base text-[#0A0A0A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A] focus-visible:ring-offset-2"
          />
          <button
            type="submit"
            disabled={nameDraft.trim().length === 0}
            className="inline-flex h-11 cursor-pointer items-center rounded-md bg-[#1E3A8A] px-6 text-sm font-medium text-white transition-colors hover:bg-[#1E3A8A]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Enter
          </button>
        </form>
      </main>
    );
  }

  const selfScores: TraitScores | null = responses
    ? scoreSelf(responses)
    : null;
  const code5 = selfScores ? typeCode(selfScores) : "";

  function shareUrl(): string {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/room/${code}?observe=1`;
  }

  async function runNarrative(s: TraitScores, c: string) {
    try {
      const r = await fetch("/api/narrative", {
        method: "POST",
        body: JSON.stringify({ code: c, scores: s }),
      });
      if (!r.ok) throw new Error("bad status");
      setNarrative((await r.json()) as Narrative);
    } catch {
      setNarrative(templateNarrative(c, s));
    }
  }

  async function useAiObserver() {
    if (!responses) return;
    try {
      const r = await fetch("/api/observer", {
        method: "POST",
        body: JSON.stringify({ responses }),
      });
      if (!r.ok) throw new Error("bad status");
      setObserved((await r.json()) as TraitScores);
    } catch {
      setObserved(scoreSelf(responses));
    }
    setLocalPhase("blindspot");
  }

  return (
    <main className="mx-auto min-h-screen max-w-[720px] px-6 py-12">
      <header className="mb-10 flex items-baseline justify-between border-b border-[#0A0A0A]/10 pb-4">
        <span className="text-lg font-semibold text-[#0A0A0A]">
          Looking Glass
        </span>
        <span className="font-mono text-xs text-[#0A0A0A]/45">
          room {code}
        </span>
      </header>

      {phase === "intro" && (
        <>
          {solo ? (
            <section className="cl-fade-in">
              <h1 className="text-3xl font-semibold tracking-tight text-[#0A0A0A]">
                30 statements. Then a guess.
              </h1>
              <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-[#0A0A0A]/75">
                You&apos;ll rate how well 30 statements describe you, then
                predict your own profile before seeing the result. The point
                isn&apos;t the score — it&apos;s the gap between how you see
                yourself and how you actually come across.
              </p>
              <button
                type="button"
                onClick={() => setLocalPhase("test")}
                className="mt-10 inline-flex h-12 cursor-pointer items-center rounded-md bg-[#1E3A8A] px-8 text-base font-medium text-white transition-colors hover:bg-[#1E3A8A]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A] focus-visible:ring-offset-2"
              >
                Begin
              </button>
            </section>
          ) : (
            <>
              <RoomLobby
                code={code}
                players={state.players}
                solo={state.solo ?? false}
                onToggleSolo={async (next) => {
                  await setSolo(code, next);
                  setLocalSolo(next);
                  await refetch();
                }}
                onStart={async () => {
                  await setPhase(code, "test");
                  setLocalPhase("test");
                }}
              />
              {!isHost && (
                <p className="mt-6 font-mono text-xs text-[#0A0A0A]/45">
                  Waiting for the host to begin.
                </p>
              )}
            </>
          )}
        </>
      )}

      {phase === "test" && (
        <Questionnaire
          onDone={async (r) => {
            if (submittingRef.current) return;
            submittingRef.current = true;
            setResponses(r);
            try {
              await submitResponseSet(code, playerId.current, playerName, {
                kind: "self",
                subjectId: playerId.current,
                responses: r,
              });
            } catch (err) {
              console.error("self submit failed", err);
            }
            submittingRef.current = false;
            setLocalPhase("predict");
          }}
        />
      )}

      {phase === "predict" && (
        <SelfPrediction
          onDone={(p) => {
            setPrediction(p);
            setLocalPhase("result");
          }}
        />
      )}

      {phase === "result" && selfScores && (
        <ResultPhase
          code={code5}
          scores={selfScores}
          narrative={narrative}
          ensureNarrative={() => {
            if (!narrativeRan.current) {
              narrativeRan.current = true;
              runNarrative(selfScores, code5);
            }
          }}
          onNext={async () => {
            if (solo) {
              await useAiObserver();
            } else {
              await setRoomHostId(code, playerId.current);
              await setPhase(code, "await_observer");
              setLocalPhase("await_observer");
            }
          }}
        />
      )}

      {phase === "await_observer" && (
        <AwaitObserver
          shareUrl={shareUrl()}
          copied={copied}
          onCopy={async () => {
            try {
              await navigator.clipboard.writeText(shareUrl());
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              /* clipboard unavailable */
            }
          }}
          onAi={useAiObserver}
          submissions={submissions}
          myId={playerId.current}
          onObserved={(o) => {
            setObserved(o);
            setLocalPhase("blindspot");
          }}
          requestedRef={observerRequested}
        />
      )}

      {phase === "blindspot" && prediction && observed && (
        <BlindSpotPhase
          prediction={prediction}
          observed={observed}
          solo={solo}
          code={code5}
          onRestart={async () => {
            reset();
            try {
              await resetRoom(code);
            } catch {
              /* solo room teardown is best-effort */
            }
            narrativeRan.current = false;
            observerRequested.current = false;
            submittingRef.current = false;
            setLocalPhase("intro");
          }}
        />
      )}
    </main>
  );
}

// Persist the host's player id into rooms.state so a guest arriving via
// ?observe=1 knows whose profile to rate. setPhase preserves this field.
async function setRoomHostId(code: string, hostId: string): Promise<void> {
  const fresh = await getRoomState(code);
  const { supabase } = await import("@/lib/multiplayer/supabase");
  await supabase
    .from("rooms")
    .update({ state: { ...fresh, hostPlayerId: hostId } })
    .eq("id", code);
}

function ResultPhase({
  code,
  scores,
  narrative,
  ensureNarrative,
  onNext,
}: {
  code: string;
  scores: TraitScores;
  narrative: Narrative | null;
  ensureNarrative: () => void;
  onNext: () => void;
}) {
  useEffect(() => {
    ensureNarrative();
  }, [ensureNarrative]);

  const n = narrative ?? templateNarrative(code, scores);

  return (
    <>
      <ResultCard code={code} scores={scores} narrative={n} />
      <div className="mt-12">
        <button
          type="button"
          onClick={onNext}
          className="inline-flex h-12 cursor-pointer items-center rounded-md bg-[#1E3A8A] px-8 text-base font-medium text-white transition-colors hover:bg-[#1E3A8A]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A] focus-visible:ring-offset-2"
        >
          See my blind spot
        </button>
      </div>
    </>
  );
}

function AwaitObserver({
  shareUrl,
  copied,
  onCopy,
  onAi,
  submissions,
  myId,
  onObserved,
  requestedRef,
}: {
  shareUrl: string;
  copied: boolean;
  onCopy: () => void;
  onAi: () => void;
  submissions: Submission[];
  myId: string;
  onObserved: (o: TraitScores) => void;
  requestedRef: React.RefObject<boolean>;
}) {
  useEffect(() => {
    if (requestedRef.current) return;
    const obs = submissions.find((s) => {
      const p = parsePayload(s);
      return p?.kind === "observer" && p.subjectId === myId;
    });
    if (obs) {
      const p = parsePayload(obs)!;
      requestedRef.current = true;
      onObserved(scoreObserver(p.responses));
    }
  }, [submissions, myId, onObserved, requestedRef]);

  return (
    <section className="cl-fade-in">
      <h1 className="text-2xl font-semibold tracking-tight text-[#0A0A0A]">
        Now the real measurement.
      </h1>
      <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-[#0A0A0A]/75">
        Send this link to one person who knows you. Their honest read is what
        we measure your blind spot against.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <code className="block w-full overflow-x-auto rounded-md border border-[#0A0A0A]/15 bg-[#0A0A0A]/3 px-3 py-2.5 font-mono text-sm text-[#0A0A0A]">
          {shareUrl}
        </code>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex h-11 shrink-0 cursor-pointer items-center rounded-md border border-[#0A0A0A]/20 px-5 text-sm font-medium text-[#0A0A0A] transition-colors hover:border-[#1E3A8A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A] focus-visible:ring-offset-2"
        >
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>

      <p className="mt-10 font-mono text-xs text-[#0A0A0A]/45">
        Waiting for a friend to respond…
      </p>

      <button
        type="button"
        onClick={onAi}
        className="mt-4 cursor-pointer text-sm text-[#0A0A0A]/60 underline underline-offset-4 transition-colors hover:text-[#0A0A0A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A] focus-visible:ring-offset-2"
      >
        Use AI estimate instead
      </button>
    </section>
  );
}

function BlindSpotPhase({
  prediction,
  observed,
  solo,
  code,
  onRestart,
}: {
  prediction: Record<string, number>;
  observed: TraitScores;
  solo: boolean;
  code: string;
  onRestart: () => void;
}) {
  const bs = useMemo(
    () => blindSpot(predictionToScores(prediction), observed),
    [prediction, observed]
  );
  const [copied, setCopied] = useState(false);

  async function copyResult() {
    const lines = [
      `Looking Glass — Type ${code || "—"}`,
      bs.headline,
      `Blind-Spot Index: ${bs.index}`,
      ...bs.perTrait.map(
        (p) =>
          `${p.trait}: predicted ${p.predicted}, observed ${p.observed} (gap ${p.gap}, ${p.band})`
      ),
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <>
      <BlindSpotCard blindSpot={bs} source={solo ? "ai" : "friend"} />
      <div className="mx-auto mt-8 flex max-w-[560px] gap-3">
        <button
          type="button"
          onClick={copyResult}
          className="inline-flex h-11 cursor-pointer items-center rounded-md bg-[#1E3A8A] px-6 text-sm font-medium text-white transition-colors hover:bg-[#1E3A8A]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A] focus-visible:ring-offset-2"
        >
          {copied ? "Copied" : "Copy result"}
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex h-11 cursor-pointer items-center rounded-md border border-[#0A0A0A]/20 px-6 text-sm font-medium text-[#0A0A0A] transition-colors hover:border-[#1E3A8A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A] focus-visible:ring-offset-2"
        >
          Start over
        </button>
      </div>
    </>
  );
}
