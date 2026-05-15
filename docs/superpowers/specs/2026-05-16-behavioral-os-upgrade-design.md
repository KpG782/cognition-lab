# Cognition Lab — 7-Mode Behavioral OS Upgrade (Design)

Date: 2026-05-16
Status: Approved (fast-track)

## Context

The repo already contains a clean, working **single-mode (Spend) build**: Groq
provider wired (`@ai-sdk/groq`, real key in `.env`), Supabase live with the
original 3-table schema (`rooms`, `submissions`, `diagnoses`), 5-bias spend
diagnose/intervene/council agents, multiplayer room phase machine
(lobby → submit → diagnose → reveal → gap), and a clinical landing page.

This upgrade turns it into the **7-mode behavioral operating system** from the
expanded master prompt, **demo-critical core scope**: skip the longitudinal
fingerprint chart (explicit cut), keep everything else.

## Hard constraints carried over

- Groq provider only — keep the existing setup. One model change:
  `groq("openai/gpt-oss-120b")` → `groq("llama-3.3-70b-versatile")` (reliable
  `generateObject` structured output).
- One structured LLM call per agent. Never parallelize scanners.
- Every LLM call falls back to a mock — the demo never throws to UI.
- **No Supabase migration.** Live DB has the old schema. Mode is stored in
  `rooms.state.mode` (jsonb) — zero SQL changes required.
- Clinical aesthetic preserved: white bg, #0A0A0A text, #1E3A8A accent,
  #DC2626 only above 75% confidence, Inter + JetBrains Mono, no emojis/gradients.

## Live vs architected modes

Live (interactive): `spend`, `reply`, `mirror`.
Architected (render in UI, locked, citations visible): `choice`, `conflict`,
`influence`, `identity`.

## Components

### 1. `lib/modes.ts` (new)
The mode registry per master prompt: `MODES` object (7 modes, each with label,
tagline, description, scanners, interventions, primaryResearchers, status,
promptHint), `ModeKey`, `LIVE_MODES`. Single source of truth — every other
file imports from here.

### 2. `lib/citations.ts` (expand 10 → 32, additive)
Existing keys preserved untouched (`bias_blind_spot`, `loss_aversion`,
`hyperbolic_discounting`, `anchoring`, `sunk_cost`, `affect_heuristic`,
`implementation_intention`, `temporal_self_distancing`, `systems_1_and_2`,
`future_self`). Add ~22: Cialdini ×7, Frankl, Jung (projection/shadow),
Rosenberg (NVC), Wittgenstein, Ross (FAE), Brehm (reactance),
Samuelson & Zeckhauser (status quo), Kierkegaard, Klein (premortem),
Welch (10/10/10), Schwartz (IFS), Epictetus (stoic dichotomy), Clear,
Dweck, McAdams, Bem. `formatCitation` signature unchanged.

### 3. `lib/types.ts`
- `BiasResult.name`: `BiasName` union → `string` (scanners are mode-specific).
- Add `scannerLabel(name: string): string` — title-cases unknown scanners,
  uses `BIAS_LABELS` for known ones.
- Add `mode: ModeKey` to `Submission`.
- Keep `BiasName` union for the typed Spend intervention selector.

### 4. Agents
- `lib/agents/router.ts` + `app/api/route/route.ts` (new): one structured Groq
  call. Schema: `primaryMode` enum (6 non-mirror modes), `confidence` 0-100,
  optional `secondaryMode`, `reasoning`. Temp 0.2, ~200 tok, mock fallback.
- `lib/agents/diagnose.ts`: system prompt built dynamically from
  `MODES[mode].scanners` + citation definitions. Schema `name: z.string()`.
  Spend behavior preserved as the spend branch. `mode` param added; defaults
  to `spend` for backward-compat callers.
- `lib/agents/intervene.ts`: `SELECTOR` extended to cover spend + reply
  scanners; graceful default for unmapped scanners.
- `lib/agents/council.ts`: unchanged (mode-agnostic).

### 5. `lib/mocks.ts`
Add a Reply-mode mock scenario (reactance + affect + projection). Spend mock
untouched. Add a router mock. Every agent retains a mock fallback.

### 6. UI
- `components/ModeShowcase.tsx` (new): landing grid of 7 mode cards, LIVE /
  ARCHITECTED badges, live cards clickable, architected show researcher
  tooltip.
- `components/CitationModal.tsx` (new): scrollable full 32-citation list +
  text architecture diagram. Replaces the static list inside the current
  landing About modal.
- `components/ModeTabs.tsx` (new): room-top strip, all 7 modes, current
  highlighted, architected locked w/ tooltip, live switchable.
- `app/page.tsx`: keep hero + protocol; add ModeShowcase; add mode-aware
  session creation (Spend / Reply / Mirror); wire CitationModal.
- `app/room/[code]/page.tsx`: room carries `state.mode` (default `spend`);
  Submit uses mode `promptHint`; price input only in Spend; diagnose API
  called with mode; non-forcing router banner in Submit; existing `gap`
  phase + `BlindSpotGap` retained.
- `lib/multiplayer/room.ts`: `createRoom(mode)` writes `state.mode`;
  `getRoomState` surfaces mode; helpers thread mode through submissions.

## Risk management

The Spend happy path stays intact at every step (it is the proven demo path).
Reply and Mirror layer on top. Mocks guarantee no live failure. No schema
migration means the existing Supabase keeps working unchanged.

## Out of scope (explicit cuts)

- Longitudinal cognitive-fingerprint chart and `fingerprints` table wiring.
- Any Supabase schema migration.
- Tests, deploy, auth (per master constraints).
