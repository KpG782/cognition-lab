"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoomLobby } from "@/components/RoomLobby";
import { DecisionInput } from "@/components/DecisionInput";
import { BlindDiagnosisPanel } from "@/components/BlindDiagnosisPanel";
import { BiasCard } from "@/components/BiasCard";
import { CouncilVote } from "@/components/CouncilVote";
import { BlindSpotGap } from "@/components/BlindSpotGap";
import { ModeTabs } from "@/components/ModeTabs";
import {
  getPlayerId,
  getRoomState,
  addPlayer,
  setPhase,
  setRoomMode,
  resetRoom,
  submitDecision,
  submitHumanDiagnosis,
  submitAIDiagnosis,
  fetchSubmissions,
  fetchDiagnoses,
  subscribeToRoom,
} from "@/lib/multiplayer/room";
import { MODES, type ModeKey } from "@/lib/modes";
import { useSession } from "@/store/session-store";
import type {
  RoomStateData,
  Submission,
  Diagnosis,
  AIDiagnosisContent,
  HumanDiagnosisContent,
  DiagnoseResult,
} from "@/lib/types";

export default function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();

  const playerId = useRef<string>("");
  const { playerName, setPlayerName, reset } = useSession();
  const [nameDraft, setNameDraft] = useState("");
  const [joined, setJoined] = useState(false);

  const [state, setState] = useState<RoomStateData>({
    phase: "lobby",
    players: [],
  });
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [routerHint, setRouterHint] = useState<ModeKey | null>(null);
  const [hintDismissed, setHintDismissed] = useState(false);
  const aiRunning = useRef(false);
  const routerRan = useRef(false);

  if (!playerId.current && typeof window !== "undefined") {
    playerId.current = getPlayerId();
  }

  const refetch = useCallback(async () => {
    const s = await getRoomState(code);
    setState(s);
    const subs = await fetchSubmissions(code);
    setSubmissions(subs);
    const ds = await fetchDiagnoses(subs.map((x) => x.id));
    setDiagnoses(ds);
  }, [code]);

  // Join + subscribe
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
  const playerCount = state.players.length;
  const mode: ModeKey = state.mode ?? "spend";

  const mySubmission = submissions.find(
    (s) => s.player_id === playerId.current
  );

  // Non-forcing router check on the local player's submission.
  useEffect(() => {
    if (state.phase !== "submit" || mode === "mirror") return;
    if (!mySubmission || routerRan.current) return;
    routerRan.current = true;
    (async () => {
      try {
        const r = await fetch("/api/route", {
          method: "POST",
          body: JSON.stringify({ input: mySubmission.decision_text }),
        });
        const { primaryMode } = await r.json();
        if (primaryMode && primaryMode !== mode) {
          setRouterHint(primaryMode as ModeKey);
        }
      } catch {
        /* router is advisory only */
      }
    })();
  }, [state.phase, mode, mySubmission]);

  const humanDiagnoses = diagnoses.filter(
    (d) => d.diagnoser_type === "human"
  );
  const aiDiagnoses = diagnoses.filter((d) => d.diagnoser_type === "ai");

  // Host runs AI diagnosis once per submission when entering diagnose phase
  useEffect(() => {
    if (!isHost || state.phase !== "diagnose") return;
    if (aiRunning.current) return;
    const pending = submissions.filter(
      (s) => !aiDiagnoses.some((d) => d.submission_id === s.id)
    );
    if (pending.length === 0) return;
    aiRunning.current = true;
    (async () => {
      for (const s of pending) {
        try {
          const dRes = await fetch("/api/diagnose", {
            method: "POST",
            body: JSON.stringify({
              decisionText: s.decision_text,
              price: s.price,
              mode,
            }),
          });
          const diagnose: DiagnoseResult = await dRes.json();
          const [iRes, cRes] = await Promise.all([
            fetch("/api/intervene", {
              method: "POST",
              body: JSON.stringify({
                decisionText: s.decision_text,
                diagnose,
              }),
            }),
            fetch("/api/council", {
              method: "POST",
              body: JSON.stringify({
                decisionText: s.decision_text,
                summary: diagnose.summary,
              }),
            }),
          ]);
          await submitAIDiagnosis(s.id, {
            diagnose,
            intervention: await iRes.json(),
            council: await cRes.json(),
          });
        } catch {
          /* mock fallback already returned by routes */
        }
      }
      aiRunning.current = false;
      await refetch();
    })();
  }, [isHost, state.phase, submissions, aiDiagnoses, refetch, mode]);

  // Auto-advance logic (any client may push the phase forward; idempotent)
  useEffect(() => {
    if (playerCount < 1) return;
    if (
      state.phase === "submit" &&
      submissions.length >= playerCount &&
      playerCount >= 2
    ) {
      setPhase(code, "diagnose");
    }
    if (state.phase === "diagnose") {
      const expectedHuman = playerCount * (playerCount - 1);
      if (
        humanDiagnoses.length >= expectedHuman &&
        aiDiagnoses.length >= submissions.length &&
        submissions.length > 0
      ) {
        setPhase(code, "reveal");
      }
    }
  }, [
    state.phase,
    submissions.length,
    humanDiagnoses.length,
    aiDiagnoses.length,
    playerCount,
    code,
  ]);

  // ---- Name gate ----
  if (!joined || !playerName) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[720px] flex-col justify-center px-6">
        <h1 className="text-2xl font-semibold">
          Joining room <span className="font-mono">{code}</span>
        </h1>
        <p className="mt-2 text-sm text-neutral-500">Enter your name.</p>
        <div className="mt-4 flex gap-3">
          <Input
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            placeholder="Your name"
            className="max-w-60"
          />
          <Button
            disabled={nameDraft.trim().length === 0}
            onClick={() => {
              setPlayerName(nameDraft.trim());
              setJoined(true);
            }}
            className="bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90"
          >
            Enter
          </Button>
        </div>
      </main>
    );
  }

  const myReadsCount = (() => {
    const expected = playerCount * (playerCount - 1);
    return Math.min(humanDiagnoses.length, expected);
  })();
  const expectedHuman = playerCount * (playerCount - 1);

  return (
    <main className="mx-auto min-h-screen max-w-[720px] px-6 py-12 md:max-w-[960px]">
      <header className="mb-6 flex items-baseline justify-between border-b border-neutral-200 pb-4">
        <span className="text-lg font-semibold">Cognition Lab</span>
        <span className="font-mono text-sm text-neutral-500">
          {MODES[mode].label} · room {code} · {state.phase}
        </span>
      </header>

      <div className="mb-10">
        <ModeTabs
          current={mode}
          onSwitch={async (m) => {
            if (m === mode || state.phase !== "lobby") return;
            await setRoomMode(code, m);
            await refetch();
          }}
        />
        {state.phase !== "lobby" && (
          <p className="mt-2 font-mono text-[11px] text-neutral-400">
            Mode locks once the session starts.
          </p>
        )}
      </div>

      {routerHint && !hintDismissed && state.phase === "submit" && (
        <div className="mb-8 flex flex-wrap items-center gap-3 border border-[#1E3A8A]/30 bg-[#1E3A8A]/5 px-4 py-3 text-sm">
          <span className="text-neutral-700">
            Your input looks like{" "}
            <strong>{MODES[routerHint].label}</strong>. Continue in{" "}
            {MODES[mode].label} or switch?
          </span>
          <div className="flex gap-2">
            {isHost && (
              <Button
                className="h-8 cursor-pointer bg-[#1E3A8A] px-3 text-xs text-white hover:bg-[#1E3A8A]/90"
                onClick={async () => {
                  await setRoomMode(code, routerHint);
                  setRouterHint(null);
                  await refetch();
                }}
              >
                Switch to {MODES[routerHint].label}
              </Button>
            )}
            <Button
              variant="outline"
              className="h-8 cursor-pointer px-3 text-xs"
              onClick={() => setHintDismissed(true)}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {state.phase === "lobby" && (
        <RoomLobby
          code={code}
          players={state.players}
          onStart={() => setPhase(code, "submit")}
        />
      )}

      {state.phase === "submit" && (
        <DecisionInput
          lockedCount={submissions.length}
          totalCount={playerCount}
          promptHint={MODES[mode].promptHint}
          showPrice={mode === "spend"}
          onLock={(text, price) =>
            submitDecision(code, playerId.current, playerName, text, price)
          }
        />
      )}

      {state.phase === "diagnose" && (
        <BlindDiagnosisPanel
          others={submissions.filter(
            (s) => s.player_id !== playerId.current
          )}
          humanReadCount={myReadsCount}
          expected={expectedHuman}
          onSubmit={(preds) => {
            Object.entries(preds).forEach(([sid, text]) =>
              submitHumanDiagnosis(sid, playerId.current, text)
            );
          }}
        />
      )}

      {state.phase === "reveal" && (
        <Reveal submissions={submissions} diagnoses={diagnoses} />
      )}

      {state.phase === "gap" && (
        <div className="space-y-12">
          {submissions.map((s) => {
            const ai = aiDiagnoses.find((d) => d.submission_id === s.id)
              ?.content as AIDiagnosisContent | undefined;
            const friends = humanDiagnoses
              .filter((d) => d.submission_id === s.id)
              .map((d) => (d.content as HumanDiagnosisContent).prediction);
            const top = ai?.diagnose.biases
              .filter((b) => b.fired)
              .sort((a, b) => b.confidence - a.confidence)[0];
            const conf = top?.confidence ?? 0;
            const gap =
              conf >= 75 ? "HIGH" : conf >= 55 ? "MEDIUM" : "LOW";
            return (
              <div key={s.id}>
                <p className="mb-3 font-medium">{s.player_name}</p>
                <BlindSpotGap
                  selfMotive={s.decision_text}
                  aiBias={top?.name ?? null}
                  friendsTheme={friends[0] ?? ""}
                  gap={gap}
                />
              </div>
            );
          })}
          <Button
            variant="outline"
            onClick={async () => {
              reset();
              await resetRoom(code);
              router.push("/");
            }}
          >
            New session
          </Button>
        </div>
      )}

      {state.phase === "reveal" && (
        <div className="mt-10">
          <Button
            onClick={() => setPhase(code, "gap")}
            className="bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90"
          >
            See the blind spot gap
          </Button>
        </div>
      )}
    </main>
  );
}

function Reveal({
  submissions,
  diagnoses,
}: {
  submissions: Submission[];
  diagnoses: Diagnosis[];
}) {
  return (
    <div className="space-y-16">
      {submissions.map((s) => {
        const ai = diagnoses.find(
          (d) => d.submission_id === s.id && d.diagnoser_type === "ai"
        )?.content as AIDiagnosisContent | undefined;
        const friends = diagnoses
          .filter(
            (d) =>
              d.submission_id === s.id && d.diagnoser_type === "human"
          )
          .map((d) => (d.content as HumanDiagnosisContent).prediction);
        const topBiases = (ai?.diagnose.biases ?? [])
          .filter((b) => b.fired)
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 3);

        return (
          <section key={s.id}>
            <h2 className="mb-4 text-xl font-semibold">{s.player_name}</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <p className="font-mono text-xs uppercase text-neutral-500">
                  What you said
                </p>
                <p className="mt-2 text-sm text-neutral-700">
                  {s.decision_text}
                </p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase text-neutral-500">
                  What your friends saw
                </p>
                <ul className="mt-2 space-y-2">
                  {friends.length === 0 && (
                    <li className="text-sm text-neutral-400">—</li>
                  )}
                  {friends.map((f, i) => (
                    <li key={i} className="text-sm text-neutral-700">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-mono text-xs uppercase text-neutral-500">
                  What the algorithm saw
                </p>
                <div className="mt-2 space-y-3">
                  {topBiases.map((b) => (
                    <BiasCard key={b.name} bias={b} />
                  ))}
                </div>
              </div>
            </div>

            {ai && (
              <div className="mt-6 border border-neutral-200 p-5">
                <p className="font-mono text-xs uppercase text-neutral-500">
                  Intervention deployed
                </p>
                <p className="mt-2 font-medium">
                  {ai.intervention.interventionName}{" "}
                  <span className="font-mono text-xs text-neutral-500">
                    ({ai.intervention.citation})
                  </span>
                </p>
                <p className="mt-1 text-sm text-neutral-600">
                  {ai.intervention.mechanism}
                </p>
                <p className="mt-3 text-neutral-800">
                  {ai.intervention.message}
                </p>
              </div>
            )}

            {ai && (
              <div className="mt-6">
                <p className="mb-3 font-mono text-xs uppercase text-neutral-500">
                  The council
                </p>
                <CouncilVote council={ai.council} />
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <DecisionButton label="Buy now" />
              <DecisionButton label="Wait 24 hours" />
              <DecisionButton label="Skip" />
            </div>
          </section>
        );
      })}
    </div>
  );
}

function DecisionButton({ label }: { label: string }) {
  const [picked, setPicked] = useState(false);
  return (
    <Button
      variant={picked ? "default" : "outline"}
      onClick={() => setPicked(true)}
      className={picked ? "bg-[#1E3A8A] text-white" : ""}
    >
      {label}
    </Button>
  );
}
