"use client";

import { Button } from "@/components/ui/button";
import type { Player } from "@/lib/types";

export function RoomLobby({
  code,
  players,
  solo,
  onToggleSolo,
  onStart,
}: {
  code: string;
  players: Player[];
  solo: boolean;
  onToggleSolo: (next: boolean) => void;
  onStart: () => void;
}) {
  const canStart = solo || players.length >= 2;
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-neutral-500">Share this code with friends</p>
        <p className="mt-1 font-mono text-5xl tracking-[0.3em]">{code}</p>
      </div>

      <div>
        <p className="text-sm text-neutral-500">
          Players in room ({players.length})
        </p>
        <ul className="mt-2 space-y-1">
          {players.map((p) => (
            <li key={p.id} className="font-mono text-sm">
              {p.name}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={solo}
          onClick={() => onToggleSolo(!solo)}
          className={`flex h-5 w-9 items-center rounded-full px-0.5 transition-colors ${
            solo ? "bg-[#1E3A8A]" : "bg-neutral-300"
          }`}
        >
          <span
            className={`h-4 w-4 rounded-full bg-white transition-transform ${
              solo ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-neutral-600">
          Solo {solo ? "on" : "off"}
        </span>
      </div>
      <p className="text-sm text-neutral-500">
        {solo
          ? `Solo: ${players.find((p) => p.id === "confederate")?.name ?? "a confederate"} fills the second seat and diagnoses you. Mode stays switchable mid-run.`
          : "Off: share the code; a real second player joins to diagnose you."}
      </p>

      <Button
        onClick={onStart}
        disabled={!canStart}
        className="bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90"
      >
        Start Session
      </Button>
      {!canStart && (
        <p className="text-sm text-neutral-500">
          Waiting for at least 2 players — or flip Solo on.
        </p>
      )}
    </div>
  );
}
