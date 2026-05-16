# Looking Glass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pivot Cognition Lab into "Looking Glass" — a research-backed Big Five personality test with a deterministic self-vs-observed blind-spot result, presented 16Personalities-style.

**Architecture:** A new pure-function scoring authority (`lib/bigfive.ts`) computes Big Five percentiles, a 5-letter type code, and the self–observed blind-spot gap with **zero LLM**. The LLM (existing `lib/llm/client.ts`, Groq, mock-fallback) writes only the flattering narrative and the solo AI-observer estimate, both with deterministic template fallback. Supabase multiplayer and room codes are reused with **no schema migration** (responses stored as JSON in `submissions.decision_text`, mode in `rooms.state`). The 7-mode behavioral-OS is deleted.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind v4, shadcn/ui, Zustand, Supabase Realtime, Vercel AI SDK + `@ai-sdk/groq`, Zod.

**No test framework** (CLAUDE.md constraint). Verification = `npx tsc --noEmit` + `node` assertion scripts for pure logic + dev-server/curl smoke. Reference spec: `docs/superpowers/specs/2026-05-16-looking-glass-personality-pivot-design.md`.

**Parallelism for multi-agent orchestration:**
- Wave A (parallel, no deps): Task 1 (bigfive), Task 2 (citations).
- Wave B (after A): Task 3 (narrative agent), Task 4 (confederate re-task), Task 5 (mocks + API routes).
- Wave C (after B): Task 6 (room/store), then Task 7 (landing), Task 8 (room phase UI + components).
- Wave D (after all): Task 9 (delete behavioral-OS), Task 10 (final typecheck + smoke).

---

### Task 1: Big Five scoring authority

**Files:**
- Create: `lib/bigfive.ts`
- Verify: `scripts/check-bigfive.mjs` (temporary, deleted in Step 5)

- [ ] **Step 1: Create `lib/bigfive.ts` with items, norms, scoring, type code, blind-spot**

```typescript
// lib/bigfive.ts
// Deterministic Big Five authority. NO LLM. Pure, synchronous.
// Items: public-domain IPIP Big-Five markers (Goldberg, 1992; IPIP, Goldberg 1999).

export type Trait = "O" | "C" | "E" | "A" | "N";
export const TRAITS: Trait[] = ["O", "C", "E", "A", "N"];

export const TRAIT_LABEL: Record<Trait, string> = {
  O: "Openness",
  C: "Conscientiousness",
  E: "Extraversion",
  A: "Agreeableness",
  N: "Emotional Volatility",
};

export interface Item {
  id: string;
  trait: Trait;
  text: string;
  keyed: 1 | -1;
}

// 6 items per trait, 1-5 Likert. keyed -1 items are reverse-scored.
export const ITEMS: Item[] = [
  { id: "E1", trait: "E", keyed: 1, text: "I am the life of the party." },
  { id: "E2", trait: "E", keyed: -1, text: "I don't talk a lot." },
  { id: "E3", trait: "E", keyed: 1, text: "I feel comfortable around people." },
  { id: "E4", trait: "E", keyed: -1, text: "I keep in the background." },
  { id: "E5", trait: "E", keyed: 1, text: "I start conversations." },
  { id: "E6", trait: "E", keyed: -1, text: "I have little to say." },
  { id: "A1", trait: "A", keyed: -1, text: "I am not really interested in others." },
  { id: "A2", trait: "A", keyed: 1, text: "I sympathize with others' feelings." },
  { id: "A3", trait: "A", keyed: -1, text: "I am not interested in other people's problems." },
  { id: "A4", trait: "A", keyed: 1, text: "I feel others' emotions." },
  { id: "A5", trait: "A", keyed: 1, text: "I make people feel at ease." },
  { id: "A6", trait: "A", keyed: -1, text: "I insult people." },
  { id: "C1", trait: "C", keyed: 1, text: "I am always prepared." },
  { id: "C2", trait: "C", keyed: -1, text: "I leave my belongings around." },
  { id: "C3", trait: "C", keyed: 1, text: "I pay attention to details." },
  { id: "C4", trait: "C", keyed: -1, text: "I make a mess of things." },
  { id: "C5", trait: "C", keyed: 1, text: "I get chores done right away." },
  { id: "C6", trait: "C", keyed: -1, text: "I often forget to put things back in their proper place." },
  { id: "N1", trait: "N", keyed: 1, text: "I get stressed out easily." },
  { id: "N2", trait: "N", keyed: -1, text: "I am relaxed most of the time." },
  { id: "N3", trait: "N", keyed: 1, text: "I worry about things." },
  { id: "N4", trait: "N", keyed: 1, text: "I am easily disturbed." },
  { id: "N5", trait: "N", keyed: 1, text: "I change my mood a lot." },
  { id: "N6", trait: "N", keyed: -1, text: "I seldom feel blue." },
  { id: "O1", trait: "O", keyed: 1, text: "I have a rich vocabulary." },
  { id: "O2", trait: "O", keyed: -1, text: "I have difficulty understanding abstract ideas." },
  { id: "O3", trait: "O", keyed: 1, text: "I have a vivid imagination." },
  { id: "O4", trait: "O", keyed: -1, text: "I am not interested in abstract ideas." },
  { id: "O5", trait: "O", keyed: 1, text: "I have excellent ideas." },
  { id: "O6", trait: "O", keyed: 1, text: "I am quick to understand things." },
];

// Third-person observer items: same constructs, "they" phrasing.
export const OBSERVER_ITEMS: Item[] = ITEMS.map((i) => ({
  ...i,
  text: i.text
    .replace(/^I am\b/, "They are")
    .replace(/^I /, "They ")
    .replace(/\bI\b/g, "they")
    .replace(/\bmy\b/g, "their")
    .replace(/\bme\b/g, "them"),
}));

// Approx population norms for the 6-item (sum 6-30) IPIP markers.
// Documented approximation (Goldberg IPIP marker distributions); used only
// to map raw sums to "vs. most people" percentiles, never clinical claims.
const NORMS: Record<Trait, { mean: number; sd: number }> = {
  O: { mean: 23, sd: 4 },
  C: { mean: 21, sd: 4.5 },
  E: { mean: 19, sd: 5 },
  A: { mean: 24, sd: 4 },
  N: { mean: 18, sd: 5 },
};

export type Responses = Record<string, number>; // itemId -> 1..5
export type TraitScores = Record<Trait, number>; // 0..100 percentile

function normalCdf(z: number): number {
  // Abramowitz & Stegun 7.1.26 approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  let p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (z > 0) p = 1 - p;
  return p;
}

function rawSum(items: Item[], r: Responses): Record<Trait, number> {
  const sums: Record<Trait, number> = { O: 0, C: 0, E: 0, A: 0, N: 0 };
  for (const it of items) {
    const v = r[it.id] ?? 3;
    sums[it.trait] += it.keyed === 1 ? v : 6 - v;
  }
  return sums;
}

function toPercentiles(sums: Record<Trait, number>): TraitScores {
  const out = {} as TraitScores;
  for (const t of TRAITS) {
    const z = (sums[t] - NORMS[t].mean) / NORMS[t].sd;
    out[t] = Math.round(normalCdf(z) * 100);
  }
  return out;
}

export function scoreSelf(r: Responses): TraitScores {
  return toPercentiles(rawSum(ITEMS, r));
}

export function scoreObserver(r: Responses): TraitScores {
  return toPercentiles(rawSum(OBSERVER_ITEMS, r));
}

// 5-letter code from trait poles. Uppercase = high (>=50), lowercase = low.
const POLE: Record<Trait, [string, string]> = {
  O: ["O", "o"],
  C: ["C", "c"],
  E: ["E", "e"],
  A: ["A", "a"],
  N: ["N", "n"],
};
export function typeCode(s: TraitScores): string {
  return TRAITS.map((t) => (s[t] >= 50 ? POLE[t][0] : POLE[t][1])).join("");
}

export type GapBand = "HIGH" | "MED" | "LOW";
export function gapBand(gap: number): GapBand {
  if (gap >= 30) return "HIGH";
  if (gap >= 15) return "MED";
  return "LOW";
}

export interface BlindSpot {
  perTrait: { trait: Trait; predicted: number; observed: number; gap: number; band: GapBand }[];
  index: number; // 0..100 mean absolute gap
  headline: string;
}

export function blindSpot(
  predicted: TraitScores,
  observed: TraitScores
): BlindSpot {
  const perTrait = TRAITS.map((trait) => {
    const gap = Math.abs(predicted[trait] - observed[trait]);
    return { trait, predicted: predicted[trait], observed: observed[trait], gap, band: gapBand(gap) };
  }).sort((a, b) => b.gap - a.gap);
  const index = Math.round(
    perTrait.reduce((s, p) => s + p.gap, 0) / perTrait.length
  );
  const top = perTrait[0];
  const dir = top.observed > top.predicted ? "more" : "less";
  const headline =
    top.band === "LOW"
      ? "Your self-image and how you come across are closely aligned."
      : `You see yourself as ${dir === "more" ? "lower" : "higher"} in ${TRAIT_LABEL[top.trait]} than you actually come across.`;
  return { perTrait, index, headline };
}
```

- [ ] **Step 2: Write the verification script**

```javascript
// scripts/check-bigfive.mjs  (temporary)
import assert from "node:assert";
import { execSync } from "node:child_process";
import { writeFileSync, rmSync } from "node:fs";

// Compile the single module to JS to import it without a test runner.
execSync("npx tsc lib/bigfive.ts --outDir .tmp-check --module nodenext --moduleResolution nodenext --target es2022", { stdio: "inherit" });
const m = await import("../.tmp-check/lib/bigfive.js");

const allMid = Object.fromEntries(m.ITEMS.map((i) => [i.id, 3]));
const mid = m.scoreSelf(allMid);
for (const t of m.TRAITS) assert.ok(mid[t] >= 0 && mid[t] <= 100, `${t} in range`);

// All-agree should push positively-keyed-heavy traits up vs all-disagree.
const allHi = Object.fromEntries(m.ITEMS.map((i) => [i.id, 5]));
const allLo = Object.fromEntries(m.ITEMS.map((i) => [i.id, 1]));
const hi = m.scoreSelf(allHi), lo = m.scoreSelf(allLo);
assert.ok(hi.E > lo.E, "E responds to direction");
assert.ok(typeof m.typeCode(hi) === "string" && m.typeCode(hi).length === 5, "5-letter code");

const bs = m.blindSpot({O:80,C:50,E:50,A:50,N:50}, {O:20,C:50,E:50,A:50,N:50});
assert.equal(bs.perTrait[0].trait, "O", "largest gap first");
assert.equal(bs.perTrait[0].band, "HIGH", "60 gap is HIGH");
assert.ok(bs.index >= 0 && bs.index <= 100, "index in range");

rmSync(".tmp-check", { recursive: true, force: true });
console.log("bigfive OK");
```

- [ ] **Step 3: Run the verification script**

Run: `cd cognition-lab && node scripts/check-bigfive.mjs`
Expected: ends with `bigfive OK`, exit 0.

- [ ] **Step 4: Typecheck**

Run: `cd cognition-lab && npx tsc --noEmit`
Expected: no errors from `lib/bigfive.ts`.

- [ ] **Step 5: Delete the temp script and commit**

```bash
cd cognition-lab && rm scripts/check-bigfive.mjs && rmdir scripts 2>/dev/null; \
git add lib/bigfive.ts && git commit -m "feat: deterministic Big Five scoring authority"
```

---

### Task 2: Citations registry additions

**Files:**
- Modify: `lib/citations.ts`

- [ ] **Step 1: Inspect the existing CITATIONS object shape**

Run: `cd cognition-lab && sed -n '1,40p' lib/citations.ts`
Expected: see the typed `CITATIONS` object and its entry shape (`authors`, `year`, `paper`, optional `journal`, `finding`).

- [ ] **Step 2: Add five entries inside the `CITATIONS` object (before the closing `} as const;`)**

Match the EXACT key/field shape already used by neighboring entries. Insert:

```typescript
  big_five: {
    authors: "Goldberg",
    year: 1992,
    paper: "The Development of Markers for the Big-Five Factor Structure",
    journal: "Psychological Assessment",
    finding: "Five broad factors — Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism — robustly describe personality across cultures.",
  },
  five_factor_model: {
    authors: "Costa & McCrae",
    year: 1992,
    paper: "Revised NEO Personality Inventory (NEO-PI-R)",
    finding: "The Five-Factor Model shows strong cross-instrument and longitudinal validity.",
  },
  ipip: {
    authors: "Goldberg",
    year: 1999,
    paper: "A broad-bandwidth public-domain personality inventory (IPIP)",
    finding: "Public-domain personality items measure the Big Five with reliability comparable to proprietary inventories.",
  },
  self_other_asymmetry: {
    authors: "Vazire",
    year: 2010,
    paper: "Who Knows What About a Person? The Self-Other Knowledge Asymmetry (SOKA) Model",
    journal: "Journal of Personality and Social Psychology",
    finding: "Others judge our evaluative and visible traits more accurately than we judge them ourselves.",
  },
  johari_window: {
    authors: "Luft & Ingham",
    year: 1955,
    paper: "The Johari Window: A Graphic Model of Interpersonal Awareness",
    finding: "A 'blind' quadrant exists — traits others see in us that we cannot see in ourselves.",
  },
```

- [ ] **Step 3: Typecheck**

Run: `cd cognition-lab && npx tsc --noEmit`
Expected: no errors. If a field is rejected, remove only that field (e.g. `journal`) to match the existing interface — do not change the interface.

- [ ] **Step 4: Commit**

```bash
cd cognition-lab && git add lib/citations.ts && git commit -m "feat: add Big Five / SOKA / Johari citations"
```

---

### Task 3: Narrative agent

**Files:**
- Create: `lib/agents/narrative.ts` (exports `templateNarrative` for deterministic fallback — used internally by `writeNarrative`)

- [ ] **Step 1: Create `lib/agents/narrative.ts`**

```typescript
import { z } from "zod";
import { runStructured } from "../llm/client";
import { TRAITS, TRAIT_LABEL, type TraitScores } from "../bigfive";

export const NarrativeSchema = z.object({
  essence: z.string(),
  paragraphs: z.array(z.string()),
});
export type Narrative = z.infer<typeof NarrativeSchema>;

const SYSTEM = `You write a warm, sharp, 16Personalities-style personality read. Honest but flattering, second person, no jargon, no bias names, no numbers. Return one short "essence" line and 2-3 short paragraphs. Never invent scores — describe the trait pattern you are given.`;

function band(v: number): "high" | "moderate" | "low" {
  return v >= 66 ? "high" : v >= 34 ? "moderate" : "low";
}

// Deterministic fallback: a readable description, NOT a stub. Used whenever
// the LLM is unavailable so the demo never shows a placeholder.
export function templateNarrative(code: string, s: TraitScores): Narrative {
  const lines = TRAITS.map(
    (t) => `${band(s[t])} ${TRAIT_LABEL[t].toLowerCase()}`
  );
  return {
    essence: `Type ${code}: a distinctive ${lines[2]}, ${lines[3]} profile.`,
    paragraphs: [
      `You combine ${lines[0]} and ${lines[1]}, which shapes how you approach new ideas and follow through on them.`,
      `Socially you read as ${lines[2]} and ${lines[3]}.`,
      `Under pressure your ${lines[4]} tends to set the tone of how you respond.`,
    ],
  };
}

export async function writeNarrative(
  code: string,
  s: TraitScores
): Promise<Narrative> {
  const fallback = templateNarrative(code, s);
  const prompt = `Type code: ${code}\nTrait bands: ${TRAITS.map(
    (t) => `${TRAIT_LABEL[t]}=${band(s[t])}`
  ).join(", ")}\nWrite the personality read.`;
  return runStructured<Narrative>(prompt, NarrativeSchema, fallback, {
    systemPrompt: SYSTEM,
    temperature: 0.7,
    maxOutputTokens: 600,
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `cd cognition-lab && npx tsc --noEmit`
Expected: no new errors (existing pre-pivot errors from soon-to-be-deleted files are acceptable until Task 9).

- [ ] **Step 3: Commit**

```bash
cd cognition-lab && git add lib/agents/narrative.ts && git commit -m "feat: narrative agent with deterministic template fallback"
```

---

### Task 4: Re-task confederate as solo AI observer

**Files:**
- Modify: `lib/agents/confederate.ts` (full rewrite)

- [ ] **Step 1: Replace the entire contents of `lib/agents/confederate.ts`**

```typescript
import { z } from "zod";
import { runStructured } from "../llm/client";
import { TRAITS, type TraitScores, type Responses } from "../bigfive";
import { OBSERVER_MOCK } from "../mocks";

export const ObserverSchema = z.object({
  O: z.number(),
  C: z.number(),
  E: z.number(),
  A: z.number(),
  N: z.number(),
});

const SYSTEM = `You estimate how a person comes across to someone who has just observed them, on the Big Five. Output ONLY five integers 0-100 (O,C,E,A,N) as the percentile each trait would read at to an outside observer. Base it strictly on the evidence given. Be decisive.`;

// Solo path only. Clearly an AI estimate from the user's own words —
// the friend observer form is the real measurement.
export async function aiObserverEstimate(
  selfResponses: Responses,
  situation?: string
): Promise<TraitScores> {
  const fallback: TraitScores = OBSERVER_MOCK;
  const answered = Object.entries(selfResponses)
    .map(([k, v]) => `${k}:${v}`)
    .join(" ");
  const prompt = `Self-report answers (1-5): ${answered}\nRecent situation they described: ${
    situation || "(none given)"
  }\nEstimate observer-perceived percentiles.`;
  const r = await runStructured(prompt, ObserverSchema, fallback, {
    systemPrompt: SYSTEM,
    temperature: 0.4,
    maxOutputTokens: 200,
  });
  // Clamp to 0-100 ints; guarantees a valid TraitScores even on odd output.
  const out = {} as TraitScores;
  for (const t of TRAITS) out[t] = Math.max(0, Math.min(100, Math.round(r[t] ?? 50)));
  return out;
}
```

- [ ] **Step 2: Typecheck**

Run: `cd cognition-lab && npx tsc --noEmit`
Expected: no new errors except missing `OBSERVER_MOCK` (added in Task 5) and pre-pivot files.

- [ ] **Step 3: Commit**

```bash
cd cognition-lab && git add lib/agents/confederate.ts && git commit -m "feat: re-task confederate as solo AI observer estimator"
```

---

### Task 5: Mocks + API routes

**Files:**
- Modify: `lib/mocks.ts` (add `OBSERVER_MOCK`; keep existing exports referenced by not-yet-deleted files)
- Create: `app/api/narrative/route.ts`
- Create: `app/api/observer/route.ts`
- Delete: `app/api/confederate/route.ts`

- [ ] **Step 1: Add `OBSERVER_MOCK` to `lib/mocks.ts`**

Append at end of file:

```typescript
export const OBSERVER_MOCK = { O: 60, C: 55, E: 65, A: 70, N: 45 };
```

- [ ] **Step 2: Create `app/api/narrative/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { writeNarrative } from "@/lib/agents/narrative";
import type { TraitScores } from "@/lib/bigfive";

export async function POST(req: NextRequest) {
  const { code, scores } = (await req.json()) as {
    code: string;
    scores: TraitScores;
  };
  const narrative = await writeNarrative(code, scores);
  return NextResponse.json(narrative);
}
```

- [ ] **Step 3: Create `app/api/observer/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { aiObserverEstimate } from "@/lib/agents/confederate";
import type { Responses } from "@/lib/bigfive";

export async function POST(req: NextRequest) {
  const { responses, situation } = (await req.json()) as {
    responses: Responses;
    situation?: string;
  };
  const observed = await aiObserverEstimate(responses, situation);
  return NextResponse.json(observed);
}
```

- [ ] **Step 4: Delete the old confederate route**

```bash
cd cognition-lab && git rm app/api/confederate/route.ts
```

- [ ] **Step 5: Smoke test both routes**

Run (in one terminal): `cd cognition-lab && npm run dev`
Run (in another):
```bash
curl -s localhost:3000/api/narrative -H 'content-type: application/json' \
  -d '{"code":"OcEaN","scores":{"O":80,"C":40,"E":70,"A":30,"N":60}}'
curl -s localhost:3000/api/observer -H 'content-type: application/json' \
  -d '{"responses":{"E1":5},"situation":"led a tense meeting"}'
```
Expected: first returns JSON with `essence` + `paragraphs`; second returns JSON with numeric `O,C,E,A,N`. (Either real LLM or fallback — both are valid.) Stop the dev server after.

- [ ] **Step 6: Commit**

```bash
cd cognition-lab && git add lib/mocks.ts app/api/narrative/route.ts app/api/observer/route.ts && git commit -m "feat: narrative + observer API routes, observer mock"
```

---

### Task 6: Room state, phases, and store

**Files:**
- Modify: `lib/multiplayer/room.ts`
- Modify: `store/session-store.ts`

- [ ] **Step 1: Read both files**

Run: `cd cognition-lab && sed -n '1,200p' store/session-store.ts && echo '---' && sed -n '1,200p' lib/multiplayer/room.ts`
Expected: see the current phase union, `setPhase`, `createRoom`, submission helpers, and the `state.mode` usage.

- [ ] **Step 2: Set the phase union and mode**

In `store/session-store.ts` change the phase type to:
```typescript
type Phase = "intro" | "test" | "predict" | "result" | "await_observer" | "blindspot";
```
Set the initial phase to `"intro"`. Keep `solo`, `setSolo`, `setPhase`, and any reset helper; if a `softResetKeepingSolo` exists, keep it but ensure it resets phase to `"intro"`.

In `lib/multiplayer/room.ts` make `createRoom` write `state: { mode: "looking_glass", phase: "intro" }`. Keep the room-code generator and Realtime subscription untouched.

- [ ] **Step 3: Add a response-submission helper to `room.ts`**

Add (reusing the existing `submissions` table; `decision_text` carries JSON — no schema change):

```typescript
export async function submitResponseSet(
  roomCode: string,
  playerId: string,
  playerName: string,
  payload: {
    kind: "self" | "observer";
    subjectId: string;
    responses: Record<string, number>;
    prediction?: Record<string, number>;
    situation?: string;
  }
) {
  return submitDecision(
    roomCode,
    playerId,
    playerName,
    JSON.stringify(payload),
    null
  );
}
```
If `submitDecision`'s signature differs, adapt the call to match it exactly (inspect it in Step 1) — the requirement is: one `submissions` row whose text field is `JSON.stringify(payload)`.

- [ ] **Step 4: Typecheck**

Run: `cd cognition-lab && npx tsc --noEmit`
Expected: no new errors except files slated for deletion in Task 9.

- [ ] **Step 5: Commit**

```bash
cd cognition-lab && git add store/session-store.ts lib/multiplayer/room.ts && git commit -m "feat: looking_glass phases, mode, response submission helper"
```

---

### Task 7: Landing page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Read the current landing page**

Run: `cd cognition-lab && cat app/page.tsx`
Expected: identify `ModeShowcase` / `CitationModal` usage and the create/join handlers.

- [ ] **Step 2: Rewrite the hero for Looking Glass**

Remove the `ModeShowcase` import and usage. Keep `createRoom`/`joinRoom` wiring and `CitationModal` if present. The hero must contain, in a single centered column (max-w 720px), Inter body, clinical tokens:
- H1 (oversized, `clamp(2.5rem,8vw,5rem)`, tracking-tight, `#0A0A0A`): `Looking Glass`
- One sentence: `A research-backed personality test that shows you the part you can't see — the gap between how you see yourself and how you actually come across.`
- One primary button `Take the Test` → calls `createRoom()` then routes to `/room/[code]` with `setSolo(true)`.
- A secondary text link `Have a code?` revealing the existing join input.
- Italic JetBrains-Mono citation line: `Built on the Big Five (Goldberg, 1992) and the Self-Other Knowledge Asymmetry (Vazire, 2010).`
No emojis, no gradient, no shadow beyond a hairline border.

- [ ] **Step 3: Typecheck + visual smoke**

Run: `cd cognition-lab && npx tsc --noEmit && npm run dev`
Open `localhost:3000`. Expected: hero renders, "Take the Test" creates a room and navigates. Stop dev server.

- [ ] **Step 4: Commit**

```bash
cd cognition-lab && git add app/page.tsx && git commit -m "feat: Looking Glass landing page"
```

---

### Task 8: Room phase UI + components

**Files:**
- Create: `components/Questionnaire.tsx`
- Create: `components/SelfPrediction.tsx`
- Create: `components/ResultCard.tsx`
- Create: `components/BlindSpotCard.tsx`
- Create: `components/ObserverForm.tsx`
- Modify: `app/room/[code]/page.tsx`

- [ ] **Step 1: `components/Questionnaire.tsx`**

Props: `{ onDone: (responses: Record<string,number>) => void }`. Render `ITEMS` from `@/lib/bigfive` grouped 6 at a time (one trait per screen) with a progress bar (`current/5`). Each item: the text + a 1–5 radio group (labels `Disagree … Agree`), ≥44px targets, `cursor-pointer`, visible focus ring, keyboard operable. Back/Next buttons; Next disabled until all 6 on-screen answered. On final group, call `onDone(responses)`. Use shadcn `Button`; radios may be native `<input type=radio>` with accessible `<label htmlFor>`. Animate group change with fade-in only; respect `prefers-reduced-motion`.

- [ ] **Step 2: `components/SelfPrediction.tsx`**

Props: `{ onDone: (prediction: Record<string,number>) => void }`. Five sliders (native `<input type=range min=0 max=100>`), one per trait, plain-language anchors (e.g. Extraversion: `Reserved … Outgoing`), not trait jargon as the headline. Current value shown in JetBrains Mono. One `Continue` button → `onDone({O,C,E,A,N})`.

- [ ] **Step 3: `components/ResultCard.tsx`**

Props: `{ code: string; scores: TraitScores; narrative: Narrative }`. Layout: oversized `code` in JetBrains Mono (`clamp(2.5rem,8vw,6rem)`), `narrative.essence` below, then five **CSS-only horizontal bars** (a track `div` + a fill `div` whose width is `${scores[t]}%`, accent `#1E3A8A`, percentile label in mono), animated width transition on mount (skip if reduced-motion). Then `narrative.paragraphs` as `<p>`s, Inter, line-height 1.6, max 70ch.

- [ ] **Step 4: `components/BlindSpotCard.tsx`** (the screenshot artifact; replaces BlindSpotGap usage)

Props: `{ blindSpot: BlindSpot; source: "ai" | "friend" }`. For each `perTrait` entry (already sorted, largest gap first): a single horizontal track with two markers — predicted (hollow, `#0A0A0A`) and observed (filled, `#1E3A8A`) — and the gap segment between them shaded; if `band==="HIGH"` the segment is `#DC2626` AND a `HIGH` text tag (mono) is shown so colour is never the only signal. Top: `blindSpot.headline` (oversized). A large mono `Blind-Spot Index: NN`. A `source` line: `Observer: AI estimate from your own words` or `Observer: a friend who knows you`. Citation line (mono, italic): `Vazire, 2010 — Self-Other Knowledge Asymmetry`. The card has a fixed max-width that fits a portrait screenshot; `Copy result` and `Invite a friend` buttons render OUTSIDE this card element.

- [ ] **Step 5: `components/ObserverForm.tsx`**

Props: `{ subjectName: string; onDone: (responses: Record<string,number>) => void }`. Renders `OBSERVER_ITEMS` from `@/lib/bigfive` the same way as `Questionnaire` (grouped, 1–5), headed `How does ${subjectName} come across to you?`. On finish call `onDone(responses)`.

- [ ] **Step 6: Wire the phase machine in `app/room/[code]/page.tsx`**

Read it first (`cat app/room/[code]/page.tsx`). Remove `ModeTabs`, `diagnose`/`intervene`/`council`/`router` calls, mode-switching UI. Implement, rendering ONLY the current `state.phase`:

- `intro`: room code + `solo` shows `Begin`; non-solo shows lobby (reuse existing `RoomLobby`) → `Begin` sets phase `test`.
- `test`: `<Questionnaire onDone>` → store responses (Zustand), `submitResponseSet(code, playerId, name, {kind:"self",subjectId:playerId,responses})`, phase `predict`.
- `predict`: `<SelfPrediction onDone>` → store prediction, phase `result`.
- `result`: compute `scoreSelf(responses)` + `typeCode`; `POST /api/narrative`; render `<ResultCard>`. Button `See my blind spot` → if solo: `POST /api/observer` with responses → store observed → phase `blindspot`; if multiplayer and no friend observer yet → phase `await_observer`.
- `await_observer`: show shareable link `…/room/[code]?observe=1`; poll/subscribe submissions for an `observer` row whose `subjectId===playerId`; when found, `scoreObserver(its responses)` → phase `blindspot`. Provide `Use AI estimate instead` → same as solo observer path.
- `blindspot`: `blindSpot(predictionAsScores, observed)` → `<BlindSpotCard source=…>`. Buttons: `Copy result` (writes a text summary to clipboard), `Start over` (soft reset to `intro`).
- Observer guest entry: if URL has `?observe=1`, skip the phases and render `<ObserverForm subjectName onDone>` → `submitResponseSet(code, guestId, guestName, {kind:"observer",subjectId:<host playerId>,responses})` then a thank-you panel.

`predictionAsScores`: the prediction sliders already produce `{O..N}` 0–100, use directly as `TraitScores`.

- [ ] **Step 7: Typecheck**

Run: `cd cognition-lab && npx tsc --noEmit`
Expected: no errors except files deleted in Task 9.

- [ ] **Step 8: Full solo smoke**

Run: `cd cognition-lab && npm run dev`. In a browser: Take the Test → answer 30 items → 5 sliders → result card with code+bars+narrative → See my blind spot → blind-spot card with two-marker bars + index + `AI estimate`. Expected: no console errors, every screen renders, LLM-down still shows templated narrative + numeric gap. Stop dev server.

- [ ] **Step 9: Commit**

```bash
cd cognition-lab && git add components/Questionnaire.tsx components/SelfPrediction.tsx components/ResultCard.tsx components/BlindSpotCard.tsx components/ObserverForm.tsx "app/room/[code]/page.tsx" && git commit -m "feat: Looking Glass questionnaire, prediction, result, blind-spot, observer UI"
```

---

### Task 9: Delete the behavioral-OS

**Files:**
- Delete: `lib/modes.ts`, `lib/agents/diagnose.ts`, `lib/agents/intervene.ts`, `lib/agents/council.ts`, `lib/agents/router.ts`, `app/api/diagnose/route.ts`, `app/api/intervene/route.ts`, `app/api/council/route.ts`, `app/api/route/route.ts`, `components/ModeShowcase.tsx`, `components/ModeTabs.tsx`

- [ ] **Step 1: Find any remaining importers**

Run: `cd cognition-lab && grep -rln "lib/modes\|/agents/diagnose\|/agents/intervene\|/agents/council\|/agents/router\|ModeShowcase\|ModeTabs\|api/diagnose\|api/council\|api/intervene\|api/route" app components lib store 2>/dev/null`
Expected: only the files about to be deleted. If a kept file still imports one, remove that import/usage first (it is now dead per the new phase machine).

- [ ] **Step 2: Delete**

```bash
cd cognition-lab && git rm lib/modes.ts lib/agents/diagnose.ts lib/agents/intervene.ts lib/agents/council.ts lib/agents/router.ts app/api/diagnose/route.ts app/api/intervene/route.ts app/api/council/route.ts app/api/route/route.ts components/ModeShowcase.tsx components/ModeTabs.tsx
```

- [ ] **Step 3: Typecheck — must now be fully clean**

Run: `cd cognition-lab && npx tsc --noEmit`
Expected: ZERO errors.

- [ ] **Step 4: Commit**

```bash
cd cognition-lab && git commit -m "chore: remove obsolete 7-mode behavioral-OS"
```

---

### Task 10: Final verification

- [ ] **Step 1: Production build**

Run: `cd cognition-lab && npm run build`
Expected: build succeeds, no type or lint errors.

- [ ] **Step 2: End-to-end solo + friend smoke**

Run: `cd cognition-lab && npm run dev`.
Solo: full flow to blind-spot card (`AI estimate`).
Friend: in window A reach `await_observer`, copy the `?observe=1` link, open in window B (incognito), complete `ObserverForm`; window A advances to `blindspot` with `source: friend` and recomputed gap.
Expected: both paths complete with no console errors; clinical styling intact (white bg, mono scores, `#DC2626` only on HIGH-gap traits).

- [ ] **Step 3: Final commit**

```bash
cd cognition-lab && git add -A && git commit -m "chore: Looking Glass pivot complete" --allow-empty
```
