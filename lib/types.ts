export type BiasName =
  | "loss_aversion"
  | "hyperbolic_discounting"
  | "anchoring"
  | "sunk_cost"
  | "affect_heuristic";

export interface BiasResult {
  name: BiasName;
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
}

export interface Submission {
  id: string;
  room_id: string;
  player_id: string;
  player_name: string;
  decision_text: string;
  price: number | null;
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

export const BIAS_LABELS: Record<BiasName, string> = {
  loss_aversion: "Loss Aversion",
  hyperbolic_discounting: "Hyperbolic Discounting",
  anchoring: "Anchoring",
  sunk_cost: "Sunk Cost",
  affect_heuristic: "Affect Heuristic",
};
