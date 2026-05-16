import { create } from "zustand";

type Phase =
  | "intro"
  | "test"
  | "predict"
  | "result"
  | "await_observer"
  | "blindspot";

interface SessionState {
  playerName: string;
  setPlayerName: (name: string) => void;
  phase: Phase;
  setPhase: (phase: Phase) => void;
  solo: boolean;
  setSolo: (v: boolean) => void;
  myDecisionLocked: boolean;
  setMyDecisionLocked: (v: boolean) => void;
  myReadsSubmitted: boolean;
  setMyReadsSubmitted: (v: boolean) => void;
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
  reset: () =>
    set({
      phase: "intro",
      myDecisionLocked: false,
      myReadsSubmitted: false,
    }),
}));
