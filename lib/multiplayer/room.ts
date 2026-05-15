import { customAlphabet } from "nanoid";
import { supabase } from "./supabase";
import type {
  RoomStateData,
  Submission,
  Diagnosis,
  DiagnoseResult,
  InterventionResult,
  CouncilResult,
  RoomPhase,
  Player,
} from "../types";
import type { ModeKey } from "../modes";

const roomCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ", 4);
const idGen = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyz",
  12
);

const PLAYER_ID_KEY = "cognition_player_id";

export function getPlayerId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = idGen();
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

const EMPTY_STATE: RoomStateData = {
  phase: "lobby",
  players: [],
  mode: "spend",
};

export async function createRoom(mode: ModeKey = "spend"): Promise<string> {
  const code = roomCode();
  await supabase
    .from("rooms")
    .insert({ id: code, state: { ...EMPTY_STATE, mode } });
  return code;
}

export async function setRoomMode(
  code: string,
  mode: ModeKey
): Promise<void> {
  const state = await getRoomState(code);
  await supabase
    .from("rooms")
    .update({ state: { ...state, mode } })
    .eq("id", code);
}

export async function joinRoom(code: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("rooms")
    .select("id")
    .eq("id", code.toUpperCase())
    .maybeSingle();
  return Boolean(data) && !error;
}

export async function getRoomState(code: string): Promise<RoomStateData> {
  const { data } = await supabase
    .from("rooms")
    .select("state")
    .eq("id", code)
    .maybeSingle();
  return (data?.state as RoomStateData) ?? EMPTY_STATE;
}

export async function addPlayer(
  code: string,
  player: Player
): Promise<void> {
  const state = await getRoomState(code);
  if (state.players.some((p) => p.id === player.id)) return;
  const next: RoomStateData = {
    ...state,
    players: [...state.players, player],
  };
  await supabase.from("rooms").update({ state: next }).eq("id", code);
}

export async function setPhase(
  code: string,
  phase: RoomPhase
): Promise<void> {
  const state = await getRoomState(code);
  await supabase
    .from("rooms")
    .update({ state: { ...state, phase } })
    .eq("id", code);
}

export async function resetRoom(code: string): Promise<void> {
  const state = await getRoomState(code);
  await supabase
    .from("rooms")
    .update({ state: { ...EMPTY_STATE, mode: state.mode ?? "spend" } })
    .eq("id", code);
}

export async function submitDecision(
  roomCode: string,
  playerId: string,
  playerName: string,
  decisionText: string,
  price: number | null
): Promise<void> {
  await supabase.from("submissions").insert({
    room_id: roomCode,
    player_id: playerId,
    player_name: playerName,
    decision_text: decisionText,
    price,
  });
}

export async function submitHumanDiagnosis(
  submissionId: string,
  diagnoserId: string,
  predictionText: string
): Promise<void> {
  await supabase.from("diagnoses").insert({
    submission_id: submissionId,
    diagnoser_id: diagnoserId,
    diagnoser_type: "human",
    content: { prediction: predictionText },
  });
}

export async function submitAIDiagnosis(
  submissionId: string,
  result: {
    diagnose: DiagnoseResult;
    intervention: InterventionResult;
    council: CouncilResult;
  }
): Promise<void> {
  await supabase.from("diagnoses").insert({
    submission_id: submissionId,
    diagnoser_id: "ai",
    diagnoser_type: "ai",
    content: result,
  });
}

export async function fetchSubmissions(
  roomCode: string
): Promise<Submission[]> {
  const { data } = await supabase
    .from("submissions")
    .select("*")
    .eq("room_id", roomCode)
    .order("created_at", { ascending: true });
  return (data as Submission[]) ?? [];
}

export async function fetchDiagnoses(
  submissionIds: string[]
): Promise<Diagnosis[]> {
  if (submissionIds.length === 0) return [];
  const { data } = await supabase
    .from("diagnoses")
    .select("*")
    .in("submission_id", submissionIds);
  return (data as Diagnosis[]) ?? [];
}

/**
 * Subscribes to room state, submissions and diagnoses changes.
 * Fires `onChange` on any relevant insert/update so the caller can refetch.
 */
export function subscribeToRoom(
  roomCode: string,
  onChange: () => void
): () => void {
  const channel = supabase
    .channel(`room:${roomCode}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomCode}` },
      onChange
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "submissions",
        filter: `room_id=eq.${roomCode}`,
      },
      onChange
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "diagnoses" },
      onChange
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
