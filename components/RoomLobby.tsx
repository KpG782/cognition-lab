"use client";

import { Button } from "@/components/ui/button";
import type { Player } from "@/lib/types";

export function RoomLobby({
  code,
  players,
  onStart,
}: {
  code: string;
  players: Player[];
  onStart: () => void;
}) {
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

      <Button
        onClick={onStart}
        disabled={players.length < 2}
        className="bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90"
      >
        Start Session
      </Button>
      {players.length < 2 && (
        <p className="text-sm text-neutral-500">
          Waiting for at least 2 players.
        </p>
      )}
    </div>
  );
}
