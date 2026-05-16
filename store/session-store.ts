import { create } from "zustand";
import type { RoomPhase } from "@/lib/types";
import type { TraitScores } from "@/lib/bigfive";

type NumMap = Record<string, number>;

interface Narrative {
  essence: string;
  paragraphs: string[];
}

interface SessionState {
  playerName: string;
  setPlayerName: (name: string) => void;
  phase: RoomPhase;
  setPhase: (phase: RoomPhase) => void;
  solo: boolean;
  setSolo: (v: boolean) => void;
  myDecisionLocked: boolean;
  setMyDecisionLocked: (v: boolean) => void;
  myReadsSubmitted: boolean;
  setMyReadsSubmitted: (v: boolean) => void;
  responses: NumMap | null;
  setResponses: (r: NumMap) => void;
  prediction: NumMap | null;
  setPrediction: (p: NumMap) => void;
  observed: TraitScores | null;
  setObserved: (o: TraitScores) => void;
  narrative: Narrative | null;
  setNarrative: (n: Narrative) => void;
  reset: () => void;
}

export const useSession = create<SessionState>((set) => ({
  playerName: "",
  setPlayerName: (name) => set({ playerName: name }),
  phase: "intro",
  setPhase: (phase) => set({ phase }),
  solo: false,
  setSolo: (v) => set({ solo: v }),
  myDecisionLocked: false,
  setMyDecisionLocked: (v) => set({ myDecisionLocked: v }),
  myReadsSubmitted: false,
  setMyReadsSubmitted: (v) => set({ myReadsSubmitted: v }),
  responses: null,
  setResponses: (r) => set({ responses: r }),
  prediction: null,
  setPrediction: (p) => set({ prediction: p }),
  observed: null,
  setObserved: (o) => set({ observed: o }),
  narrative: null,
  setNarrative: (n) => set({ narrative: n }),
  reset: () =>
    set({
      phase: "intro",
      myDecisionLocked: false,
      myReadsSubmitted: false,
      responses: null,
      prediction: null,
      observed: null,
      narrative: null,
    }),
}));
