# Looking Glass — Personality Pivot (Design)

Date: 2026-05-16
Status: Approved (brainstorming), pending spec review

## 1. Context & decision

The repo currently holds the **7-mode behavioral-OS** build (Groq provider,
Supabase multiplayer, `diagnose`/`intervene`/`council`/`router` agents,
`lib/modes.ts`, confederate agent, clinical UI). Audit finding: the product's
entire credibility — "the algorithm saw bias X at 87% confidence" — rests on a
**single LLM call roleplaying a behavioral scientist**. No reproducibility, no
explainability, the confidence number is invented by the model. That is the
core vulnerability ("model reliance") and the reason for the pivot.

**Decision:** pivot to a consumer, research-backed personality product. This
spec **supersedes** `2026-05-16-behavioral-os-upgrade-design.md`; the 7-mode
behavioral-OS becomes obsolete. What's reused vs. replaced is enumerated in §6.

## 2. Product in one line

A research-backed Big Five personality test, presented 16Personalities-style
(shareable type code + flattering narrative), whose differentiator is the one
thing 16Personalities structurally cannot do: **it measures and shows the
traits where how you see yourself and how you actually come across diverge
most — your blind spot, quantified.**

## 3. Why this satisfies every constraint

- **Kills model reliance:** the Big Five score is computed **100%
  deterministically** (reverse-key items → sum per trait → map to published
  IPIP percentile). No LLM touches the score, the type code, or the
  self–other gap. The LLM writes only (a) the flattering narrative and (b)
  the confederate observer-read — both with template/bank fallback. **LLM
  fully down → real type, templated description, real numeric gap still
  render.** Genuine graceful degradation, not canned mocks.
- **Research-defensible:** Big Five / Five-Factor Model (Goldberg 1992; Costa
  & McCrae 1992); items from the public-domain **IPIP** (Goldberg 1999); the
  twist grounded in **Self-Other Knowledge Asymmetry** (Vazire 2010), the
  **Johari window** (Luft & Ingham 1955), and the existing **bias blind
  spot** (Pronin, Lin & Ross 2002). MBTI letters are explicitly NOT used —
  they fail academic validity and contradict the research constraint.
- **Consumer / shareable:** one screenshot-first result card with a 5-letter
  type code and a blind-spot callout — the viral object.
- **Solo-complete, friend-amplified:** solo run is fully complete instantly
  via the confederate AI observer; inviting a friend upgrades the blind-spot
  panel from *AI estimate* to *measured by someone who knows you*. The invite
  link is simultaneously the growth loop and the rigor upgrade.

## 4. Core loop (one session, no accounts)

1. **Test** — 30 IPIP Big Five items (6 per trait: O, C, E, A, N), 1–5
   Likert. ~5–7 min. One item group per screen, progress bar.
2. **Self-prediction** — 5 sliders, one per trait: "Where do you think you
   land vs. most people?" This is the Pronin/Vazire predicted self-image and
   is captured *before* any result is shown.
3. **Result (instant, solo-complete)** — deterministic 5-letter type code +
   Big Five bars + LLM narrative + an **AI observer estimate** (confederate,
   re-tasked: given the item responses + one optional free-text "describe a
   recent situation", it estimates how the person comes across). Labeled
   "AI estimate."
4. **Blind-spot panel** — per-trait gap between *predicted self-image* and
   *observed* (AI now, friend later); one composite **Blind-Spot Index**
   (0–100); the 1–2 widest-gap traits called out with citations.
5. **Friend invite = rigor upgrade** — "Get your real blind spot" → shareable
   link reusing the room code as token. Friend fills a 2-min observer form
   (third-person IPIP items). On submit, the panel recomputes against the
   real observer rating and re-labels the source.

## 5. Architecture

Three boundaries preserved from the existing build:

1. **Scoring layer (`lib/bigfive.ts`, new) — the new authority.**
   - `ITEMS`: 30 IPIP items, each `{ id, trait, text, keyed: +1|-1 }`.
   - `OBSERVER_ITEMS`: same constructs, third-person phrasing.
   - `scoreSelf(responses): TraitScores` — reverse-key, sum, map to
     percentile via embedded `NORMS` table → `{ O,C,E,A,N: 0–100 }`.
   - `scoreObserver(responses): TraitScores` — same, observer norms.
   - `typeCode(scores): string` — 5-letter code from trait poles (e.g.
     high-O→`O`, low-O→`o`), deterministic, no LLM.
   - `blindSpot(predicted, observed): { perTrait: gap[], index, headline }`
     — pure function; `index` is mean absolute percentile gap; per-trait gap
     band HIGH ≥ 30 / MED 15–29 / LOW < 15.
   Pure, synchronous, fully unit-testable by inspection. Zero network.

2. **Narrative layer (LLM, optional).**
   - `lib/agents/narrative.ts` (new): one structured call. Input = trait
     scores + type code. Output = `{ essence: string, paragraphs: string[] }`
     in the flattering-but-honest 16P register. Temp 0.7. Mock = a
     template assembled deterministically from trait bands (so a "down LLM"
     still produces a readable description, not a canned stub).
   - `lib/agents/confederate.ts` (re-tasked): observer-estimate writer for
     the solo path. System prompt rewritten from "friend texting back" to
     "estimate how this person comes across to someone who just met them,"
     output mapped onto the 5 traits. Bank fallback retained.

3. **Multiplayer layer (`lib/multiplayer/`, reused).** Supabase Realtime
   unchanged. **No schema migration** — responses stored in existing tables:
   `submissions.decision_text` carries a JSON blob of the response set;
   `rooms.state.mode = "looking_glass"`. Room code = the friend-invite token.

### 6. Reused vs. replaced

**Keep:** `lib/llm/client.ts` + mock-fallback pattern; `lib/multiplayer/*` +
room codes; `lib/agents/confederate.ts` (re-tasked); `BlindSpotGap` component
(re-skinned to traits); citations infra (`lib/citations.ts`); clinical UI
tokens; the phase state machine in `app/room/[code]/page.tsx`; Zustand store.

**Replace / cut:** `lib/modes.ts`; `lib/agents/diagnose.ts`,
`intervene.ts`, `council.ts`, `router.ts` and their API routes;
`ModeShowcase`, `ModeTabs`. **New:** `lib/bigfive.ts`,
`lib/agents/narrative.ts`, observer instrument, result/share card,
self-prediction step.

### 7. Data model (no SQL changes)

- `rooms.state`: `{ mode: "looking_glass", phase }`. Phases: `intro →
  test → predict → result → (await_observer) → blindspot`.
- `submissions`: one row per participant. `decision_text` = JSON
  `{ kind: "self"|"observer", subjectId, responses: Record<itemId,1-5>,
  prediction?: Record<trait,0-100>, situation?: string }`.
- Scores are derived client-side from responses every render (deterministic)
  — never persisted, so there is no migration and no stale-score risk.

## 8. UI / UX system

Locked clinical constraints (override generic skill suggestions): white
background, text `#0A0A0A`, single accent `#1E3A8A`, `#DC2626` **only** on
HIGH-divergence traits, Inter (body), JetBrains Mono (scores/citations/type
code), no emojis, no gradients, no heavy shadows, animation = bar-fill +
fade-in only.

- **Pattern:** Minimal Single Column, mobile-first, max-width 720px mobile /
  960px desktop, generous whitespace, one primary CTA per screen.
- **Type scale (Exaggerated-Minimalism, applied sparingly):** the type code
  and the blind-spot headline are oversized (`clamp(2.5rem, 8vw, 6rem)`,
  tight letter-spacing, JetBrains Mono for the code). Everything else stays
  quiet and editorial — the contrast is the design.
- **Landing:** hero headline + one sentence + single "Take the Test" CTA +
  italic citation line. No nav clutter.
- **Questionnaire:** shadcn `Form` + react-hook-form; one trait group
  (6 items) per screen; Likert as an accessible radio group, ≥44px targets;
  progress bar; Back/Next; keyboard navigable; `prefers-reduced-motion`
  respected; color never the sole signal.
- **Self-prediction:** 5 labeled sliders, plain-language anchors (not trait
  jargon), value echoed in JetBrains Mono.
- **Result:** type code (oversized, mono) + one-line essence + five
  **CSS-only horizontal bars** (no chart library) with animated fill +
  percentile label; narrative paragraphs below.
- **Blind-spot / share card:** the screenshot artifact. Diverging horizontal
  bars per trait — a self marker and an observed marker on one track, the gap
  segment emphasized; HIGH-gap traits use `#DC2626` AND a text label
  (`HIGH`) so color is not the only indicator. Composite Blind-Spot Index in
  large mono. One citation line (`Vazire, 2010`). Fits a portrait
  screenshot; "Copy result" / "Invite a friend" actions sit outside the
  captured frame.
- **Observer form (friend link):** minimal — subject's first name, the
  third-person item set, submit. No login, no PII beyond a display name.
- shadcn `<Toaster />` in `app/layout.tsx`; rely on shadcn built-in ARIA.

Chart decision: diverging horizontal bars, **not** radar — radar is
accessibility-moderate (skill-flagged), screenshots poorly, and a 5-trait
self-vs-observed comparison reads clearest as paired bars with an explicit
gap segment.

## 9. Citations to add to `lib/citations.ts`

`big_five` (Goldberg 1992), `five_factor_model` (Costa & McCrae 1992),
`ipip` (Goldberg 1999), `self_other_asymmetry` (Vazire 2010), `johari_window`
(Luft & Ingham 1955). Existing keys (incl. `bias_blind_spot`) untouched;
`formatCitation` signature unchanged.

## 10. Out of scope (YAGNI — explicit cuts)

No accounts; no longitudinal/streak tracking (possible later phase, not
this build); no premium reports; no MBTI letters; no team assessments; no
deploy/auth/tests; no Supabase schema migration; no chart library; no new
provider work (single-config swap point in `client.ts` already exists).

## 11. Risks & mitigations

- *IPIP norms accuracy* → embed a documented public norm table; show
  percentiles as "vs. most people," never clinical claims.
- *Solo "AI observer" credibility* → labeled explicitly as an AI estimate
  from the user's own words; the friend path is presented as the real
  measurement, which also drives virality.
- *Pivot churn* → deletions are enumerated (§6); multiplayer/LLM-client/
  citation infra are reused unchanged, bounding the blast radius.
- *LLM outage on demo* → deterministic core (type, bars, gap) renders with
  zero LLM; narrative degrades to a templated description, not a stub.
