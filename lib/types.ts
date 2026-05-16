import type { ModeKey } from "./modes";

// Closed union retained for the typed Spend intervention selector.
export type BiasName =
  | "loss_aversion"
  | "hyperbolic_discounting"
  | "anchoring"
  | "sunk_cost"
  | "affect_heuristic";

export interface BiasResult {
  // Scanners vary per mode, so this is an open string keyed off the mode registry.
  name: string;
  fired: boolean;
  confidence: number; // 0-100
  evidence: string;
}

export interface DiagnoseResult {
  biases: BiasResult[];
  summary: string;
}

export interface InterventionResult {
  interventionName: string;
  citation: string;
  mechanism: string;
  message: string;
}

export interface CouncilResult {
  system1: string;
  system2: string;
  futureSelf: string;
}

export type RoomPhase = "lobby" | "submit" | "diagnose" | "reveal" | "gap";

export interface Player {
  id: string;
  name: string;
}

export interface RoomStateData {
  phase: RoomPhase;
  players: Player[];
  mode?: ModeKey;
  // Solo mode: a confederate fills the second seat; mode stays switchable past lobby.
  solo?: boolean;
}

export interface Submission {
  id: string;
  room_id: string;
  player_id: string;
  player_name: string;
  decision_text: string;
  price: number | null;
  // Not a DB column — mode is carried at room level (rooms.state.mode).
  mode?: ModeKey;
  created_at: string;
}

export type DiagnoserType = "human" | "ai";

export interface Diagnosis {
  id: string;
  submission_id: string;
  diagnoser_id: string;
  diagnoser_type: DiagnoserType;
  content: HumanDiagnosisContent | AIDiagnosisContent;
  created_at: string;
}

export interface HumanDiagnosisContent {
  prediction: string;
}

export interface AIDiagnosisContent {
  diagnose: DiagnoseResult;
  intervention: InterventionResult;
  council: CouncilResult;
}

export const BIAS_LABELS: Record<string, string> = {
  loss_aversion: "Loss Aversion",
  hyperbolic_discounting: "Hyperbolic Discounting",
  anchoring: "Anchoring",
  sunk_cost: "Sunk Cost",
  affect_heuristic: "Affect Heuristic",
};

/** Human label for any scanner name — known ones from BIAS_LABELS, else title-cased. */
export function scannerLabel(name: string): string {
  return (
    BIAS_LABELS[name] ??
    name
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
