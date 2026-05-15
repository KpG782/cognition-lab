# 7-Mode Behavioral OS Upgrade Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax. **No test files** — project constraint is "no tests". Verification = `npx tsc --noEmit` + `npm run build` + manual two-browser smoke.

**Goal:** Upgrade the working single-mode Spend app into the 7-mode behavioral OS (demo-critical scope) without breaking the proven Spend path or requiring a Supabase migration.

**Architecture:** Additive. New `lib/modes.ts` registry is the single source of truth; citations expanded additively; diagnose made mode-aware; router added; landing + room get mode UI. Mode lives in `rooms.state.mode` (jsonb) — no SQL change. Groq stays; model switched to `llama-3.3-70b-versatile`.

**Tech Stack:** Next.js 16, React 19, Vercel AI SDK + `@ai-sdk/groq`, Zod, Zustand, Supabase Realtime, Tailwind v4.

---

### Task 1: Provider model switch

**Files:** Modify `lib/llm/client.ts`

- [ ] **Step 1:** Change `const MODEL = groq("openai/gpt-oss-120b");` → `const MODEL = groq("llama-3.3-70b-versatile");`
- [ ] **Step 2:** Verify: `npx tsc --noEmit` → no errors.
- [ ] **Step 3:** Commit: `git add -A && git commit -m "Switch Groq model to llama-3.3-70b-versatile"`

---

### Task 2: Mode registry — `lib/modes.ts` (new)

**Files:** Create `lib/modes.ts`

- [ ] **Step 1:** Create the file with the full `MODES` object (7 modes) from the master prompt: keys `spend, reply, mirror, choice, conflict, influence, identity`. Each: `label, tagline, description, scanners[], interventions[], primaryResearchers[], status ("live"|"architected"), promptHint`. `spend`/`reply`/`mirror` = `"live"`; rest `"architected"`. Export `type ModeStatus`, `type ModeKey = keyof typeof MODES`, `const LIVE_MODES: ModeKey[]` filtered by status.
- [ ] **Step 2:** Verify: `npx tsc --noEmit` → clean.
- [ ] **Step 3:** Commit: `git add lib/modes.ts && git commit -m "Add 7-mode registry"`

---

### Task 3: Expand citations 10 → 32

**Files:** Modify `lib/citations.ts`

- [ ] **Step 1:** Append ~22 entries to `CITATIONS` (do not edit existing keys). New keys with `{authors, year, paper, journal?, finding}`: `reactance` (Brehm,1966), `projection_shadow` (Jung,1951), `fundamental_attribution` (Ross,1977), `frankl_pause` (Frankl,1946 — Man's Search for Meaning), `nvc_framework` (Rosenberg,2003), `wittgenstein_language_games` (Wittgenstein,1953), `status_quo_bias` (Samuelson & Zeckhauser,1988), `optionality_paralysis` (Kierkegaard,1843 — Either/Or; note philosophical), `decision_premortem` (Klein,2007), `ten_ten_ten_rule` (Welch,2009), `ifs_parts` (Schwartz,1995), `stoic_dichotomy` (Epictetus, c.125 CE), `cialdini_reciprocity` `cialdini_commitment_consistency` `cialdini_social_proof` `cialdini_liking` `cialdini_authority` `cialdini_scarcity` (all Cialdini,1984), `cialdini_unity` (Cialdini,2016 — Pre-Suasion), `atomic_habits_identity` (Clear,2018), `growth_mindset` (Dweck,2006), `narrative_identity` (McAdams,2001), `self_perception` (Bem,1972). `formatCitation` unchanged.
- [ ] **Step 2:** Verify: `npx tsc --noEmit` → clean; confirm `Object.keys(CITATIONS).length >= 32`.
- [ ] **Step 3:** Commit: `git add lib/citations.ts && git commit -m "Expand citation registry to 32 entries"`

---

### Task 4: Types — widen scanner name, add mode

**Files:** Modify `lib/types.ts`

- [ ] **Step 1:** Keep `BiasName` union (used by Spend selector). Change `BiasResult.name` from `BiasName` to `string`. Add export `function scannerLabel(name: string): string` — returns `BIAS_LABELS[name]` if present else title-cases `name.replace(/_/g," ")`. Add `import type { ModeKey } from "./modes"` and add `mode: ModeKey` to `Submission`.
- [ ] **Step 2:** Verify: `npx tsc --noEmit`. Fix any `BiasName` narrowing errors at call sites by importing `scannerLabel`.
- [ ] **Step 3:** Commit: `git add -A && git commit -m "Widen scanner name to string; add mode to Submission"`

---

### Task 5: Mocks — add Reply scenario + router mock

**Files:** Modify `lib/mocks.ts`

- [ ] **Step 1:** Add `MOCK_DIAGNOSE_REPLY` (scanners `reactance`/`affect_heuristic`/`projection`/`fundamental_attribution`; reactance ~82, affect ~70, projection ~58 fired; FAE not fired), `MOCK_INTERVENTION_REPLY` (Frankl Pause, "Frankl, 1946"), reuse council mock. Add `MOCK_ROUTER = { primaryMode: "spend", confidence: 70, reasoning: "..." }`. Keep all existing exports.
- [ ] **Step 2:** Verify: `npx tsc --noEmit` → clean.
- [ ] **Step 3:** Commit: `git add lib/mocks.ts && git commit -m "Add Reply mock scenario and router mock"`

---

### Task 6: Router agent + API route

**Files:** Create `lib/agents/router.ts`, `app/api/route/route.ts`

- [ ] **Step 1:** `router.ts`: Zod `RouterSchema` = `{ primaryMode: enum(spend,reply,choice,conflict,influence,identity), confidence: number, secondaryMode: optional same enum, reasoning: string }`. `classifyMode(input)` calls `runStructured` with mode-signature system prompt (signatures from spec), temp 0.2, maxOutputTokens 200, fallback `MOCK_ROUTER`.
- [ ] **Step 2:** `app/api/route/route.ts`: `POST` reads `{ input }`, returns `classifyMode(input)` as JSON. Mirror the existing `app/api/diagnose/route.ts` shape.
- [ ] **Step 3:** Verify: `npx tsc --noEmit`; `npm run build` reaches route compilation without error.
- [ ] **Step 4:** Commit: `git add -A && git commit -m "Add mode router agent and /api/route"`

---

### Task 7: Mode-aware diagnose

**Files:** Modify `lib/agents/diagnose.ts`, `app/api/diagnose/route.ts`

- [ ] **Step 1:** Add `mode: ModeKey = "spend"` param. Build system prompt dynamically: for each scanner in `MODES[mode].scanners`, emit a line with its citation `finding` from `CITATIONS` when a matching key exists (best-effort name match), else the scanner name. Schema: `biases: array({ name: z.string(), fired: z.boolean(), confidence: z.number(), evidence: z.string() }), summary: z.string()`. Spend path = exact current prompt when `mode==="spend"` (preserve proven behavior). Fallback: `mode==="reply" ? MOCK_DIAGNOSE_REPLY : MOCK_DIAGNOSE`.
- [ ] **Step 2:** `app/api/diagnose/route.ts`: accept optional `mode` in body, pass through.
- [ ] **Step 3:** Verify: `npx tsc --noEmit`; manual: `curl` localhost diagnose with spend body still returns 5 biases.
- [ ] **Step 4:** Commit: `git add -A && git commit -m "Make diagnose agent mode-aware"`

---

### Task 8: Intervene selector coverage

**Files:** Modify `lib/agents/intervene.ts`

- [ ] **Step 1:** Change `SELECTOR` to `Record<string, {name,citation}>`; add reply scanners: `reactance→Frankl Pause (Frankl, 1946)`, `projection→Jungian Shadow Mirror (Jung, 1951)`, `fundamental_attribution→Perspective-Taking (Ross, 1977)`. Add `DEFAULT = { name: "Temporal Self-Distancing", citation: "Kross & Ayduk, 2011" }`; use `SELECTOR[top.name] ?? DEFAULT`.
- [ ] **Step 2:** Verify: `npx tsc --noEmit` → clean.
- [ ] **Step 3:** Commit: `git add lib/agents/intervene.ts && git commit -m "Extend intervention selector for reply scanners"`

---

### Task 9: Multiplayer — thread mode through room

**Files:** Modify `lib/multiplayer/room.ts`, `lib/types.ts` (RoomStateData)

- [ ] **Step 1:** Add `mode?: ModeKey` to `RoomStateData`. `createRoom(mode: ModeKey = "spend")` writes `state: { ...EMPTY_STATE, mode }`. `EMPTY_STATE.mode = "spend"`. `resetRoom` preserves existing `state.mode`. No new columns / no submissions schema change (mode read from room state).
- [ ] **Step 2:** Verify: `npx tsc --noEmit` → clean.
- [ ] **Step 3:** Commit: `git add -A && git commit -m "Thread mode through room state"`

---

### Task 10: CitationModal + ModeShowcase components

**Files:** Create `components/CitationModal.tsx`, `components/ModeShowcase.tsx`

- [ ] **Step 1:** `CitationModal.tsx`: client component, props `{ open, onClose }`. Scrollable list of all `CITATIONS` (mono, `authors, year. paper. journal?`) + a mono text architecture diagram line: `Input → Router → Mode Registry → Scanners → Interventions → Council`. Reuse the existing About-modal markup styling (white panel, `cl-fade-in`, Escape closes).
- [ ] **Step 2:** `ModeShowcase.tsx`: client component, grid of `Object.entries(MODES)`. Card: label (lg), tagline (md), description (sm italic), `primaryResearchers.join(" · ")` (mono sm), status badge `LIVE`(#1E3A8A) / `ARCHITECTED`(neutral). Live cards: `onSelect(modeKey)` prop; architected: `title` tooltip with researchers, not clickable.
- [ ] **Step 3:** Verify: `npx tsc --noEmit` → clean.
- [ ] **Step 4:** Commit: `git add -A && git commit -m "Add CitationModal and ModeShowcase components"`

---

### Task 11: Landing page integration

**Files:** Modify `app/page.tsx`

- [ ] **Step 1:** Replace inline About-modal citation list with `<CitationModal open={about} onClose={()=>setAbout(false)} />`. Insert `<ModeShowcase onSelect={...} />` section after the hero. `onSelect("spend"|"reply")` → create room with that mode and route; `onSelect("mirror")` → create mirror room. Keep "Create a room" default = spend, "Join with a code", protocol section. `createRoom` calls now pass a mode.
- [ ] **Step 2:** Verify: `npm run dev`, load `/` → 7 cards render, 3 LIVE, citation modal opens with 32 entries.
- [ ] **Step 3:** Commit: `git add app/page.tsx && git commit -m "Integrate ModeShowcase and CitationModal into landing"`

---

### Task 12: ModeTabs + room page mode-awareness

**Files:** Create `components/ModeTabs.tsx`; modify `app/room/[code]/page.tsx`

- [ ] **Step 1:** `ModeTabs.tsx`: strip of 7 modes, `current` highlighted (#1E3A8A underline), live switchable via `onSwitch`, architected show lock + `title` tooltip.
- [ ] **Step 2:** Room page: read `mode` from room state (default `spend`); render `<ModeTabs>` at top. Submit phase: textarea placeholder = `MODES[mode].promptHint`; price `<Input>` only when `mode==="spend"`. Diagnose calls `/api/diagnose` with `{ ...submission, mode }`. Add non-forcing router banner: after a submission, `POST /api/route`; if `primaryMode !== mode` show dismissible banner "Your input looks like {label}. Continue in {current} or switch?" (switch = update `state.mode`). Keep existing lobby/diagnose/reveal/gap phases and `BlindSpotGap`.
- [ ] **Step 3:** Verify: `npm run build` clean; two-browser smoke — create Spend room, full flow to gap; create Reply room, promptHint changes, no price field, diagnosis returns reply scanners (or mock).
- [ ] **Step 4:** Commit: `git add -A && git commit -m "Add ModeTabs and mode-aware room flow"`

---

### Task 13: Final smoke + spec coverage

- [ ] **Step 1:** `npm run build` → success, zero type errors.
- [ ] **Step 2:** Two-browser Mirror smoke: create → join → both submit → cross-diagnose → reveal (own/friends/AI columns + citations + confidence bars) → blind-spot gap.
- [ ] **Step 3:** Spend + Reply scenario each run end-to-end with the seeded prompts.
- [ ] **Step 4:** Commit any fixes: `git commit -am "Demo smoke fixes"`

---

## Self-Review

- Spec coverage: modes.ts (T2), citations 32 (T3), types (T4), router+API (T6), mode-aware diagnose (T7), intervene (T8), mocks/Reply (T5), room mode (T9), ModeShowcase/CitationModal (T10-11), ModeTabs/room (T12), Groq model (T1), no-migration (T9 uses state.mode) — all covered. Fingerprint chart correctly absent (out of scope).
- Placeholder scan: none — each task names exact files and concrete content.
- Type consistency: `ModeKey` from `lib/modes.ts` used consistently; `scannerLabel` defined T4 used in UI; `BiasResult.name: string` consistent across T4/T7/T10.
