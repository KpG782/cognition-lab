"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export function DecisionInput({
  lockedCount,
  totalCount,
  onLock,
  promptHint,
  showPrice = true,
}: {
  lockedCount: number;
  totalCount: number;
  onLock: (text: string, price: number | null) => void;
  promptHint: string;
  showPrice?: boolean;
}) {
  const [text, setText] = useState("");
  const [price, setPrice] = useState("");
  const [locked, setLocked] = useState(false);

  if (locked) {
    return (
      <div className="space-y-4">
        <p className="text-lg">Locked in. Waiting for the others.</p>
        <p className="font-mono text-sm text-neutral-500">
          {lockedCount} of {totalCount} players locked in
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm text-neutral-500">
          What are you about to decide? Be honest about why.
        </label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={promptHint}
          rows={4}
          className="mt-2"
        />
      </div>
      {showPrice && (
        <div>
          <label className="text-sm text-neutral-500">Price (optional)</label>
          <Input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            placeholder="2400"
            className="mt-2 max-w-40"
          />
        </div>
      )}
      <Button
        disabled={text.trim().length === 0}
        onClick={() => {
          setLocked(true);
          onLock(text.trim(), price ? Number(price) : null);
        }}
        className="bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90"
      >
        Lock in
      </Button>
      <p className="font-mono text-sm text-neutral-500">
        {lockedCount} of {totalCount} players locked in
      </p>
    </div>
  );
}
