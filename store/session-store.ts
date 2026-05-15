import { create } from "zustand";

interface SessionState {
  playerName: string;
  setPlayerName: (name: string) => void;
  // submission id -> human prediction text the local player wrote
  myDecisionLocked: boolean;
  setMyDecisionLocked: (v: boolean) => void;
  myReadsSubmitted: boolean;
  setMyReadsSubmitted: (v: boolean) => void;
  reset: () => void;
}

export const useSession = create<SessionState>((set) => ({
  playerName: "",
  setPlayerName: (name) => set({ playerName: name }),
  myDecisionLocked: false,
  setMyDecisionLocked: (v) => set({ myDecisionLocked: v }),
  myReadsSubmitted: false,
  setMyReadsSubmitted: (v) => set({ myReadsSubmitted: v }),
  reset: () =>
    set({ myDecisionLocked: false, myReadsSubmitted: false }),
}));
