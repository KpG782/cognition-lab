import type {
  DiagnoseResult,
  InterventionResult,
  CouncilResult,
} from "./types";

// Seeded demo scenario:
// "I want to buy ₱2,400 sneakers because I had a stressful week and they're 60% off today."
// Hits hyperbolic discounting + affect heuristic + anchoring strongly.

export const MOCK_DIAGNOSE: DiagnoseResult = {
  biases: [
    {
      name: "hyperbolic_discounting",
      fired: true,
      confidence: 84,
      evidence:
        "\"today\" and the urge to buy now signal a strong pull toward an immediate reward over the delayed cost.",
    },
    {
      name: "affect_heuristic",
      fired: true,
      confidence: 79,
      evidence:
        "\"I had a stressful week\" shows an emotional state, not the product's merits, driving the decision.",
    },
    {
      name: "anchoring",
      fired: true,
      confidence: 71,
      evidence:
        "\"60% off\" anchors the decision on the discount rather than the ₱2,400 actually being spent.",
    },
    {
      name: "loss_aversion",
      fired: false,
      confidence: 22,
      evidence: "No explicit fear of missing out beyond the time-limited framing.",
    },
    {
      name: "sunk_cost",
      fired: false,
      confidence: 8,
      evidence: "No past spending is referenced to justify this purchase.",
    },
  ],
  summary:
    "This purchase is driven primarily by stress relief and discount framing, not the item's standalone value.",
};

export const MOCK_INTERVENTION: InterventionResult = {
  interventionName: "Implementation Intention",
  citation: "Gollwitzer, 1999",
  mechanism:
    "An if-then plan converts a vague urge into a concrete future-conditional rule, defusing the pull of the immediate reward.",
  message:
    "If it's still tomorrow afternoon and you still want these sneakers at full mental price, then buy them — otherwise the stress, not the shoes, was doing the talking.",
};

export const MOCK_COUNCIL: CouncilResult = {
  system1: "I want these now — I earned this after the week I had.",
  system2:
    "The evidence is that the discount and my mood, not the shoes, are making this call.",
  futureSelf:
    "In 30 days I won't remember the stress, but I'll remember whether I spent ₱2,400 on it.",
};

// Seeded Reply-mode scenario:
// "My boss messaged me at 11pm asking why I haven't replied to his earlier message yet."
// Hits reactance + affect heuristic + projection strongly.

export const MOCK_DIAGNOSE_REPLY: DiagnoseResult = {
  biases: [
    {
      name: "reactance",
      fired: true,
      confidence: 82,
      evidence:
        '"why I haven\'t replied yet" is read as a freedom threat, pulling toward a defensive counter-reply.',
    },
    {
      name: "affect_heuristic",
      fired: true,
      confidence: 70,
      evidence:
        "An 11pm message provokes an emotional state that is driving the response, not the content itself.",
    },
    {
      name: "projection",
      fired: true,
      confidence: 58,
      evidence:
        "Assuming hostile intent behind the question projects your own irritation onto the boss.",
    },
    {
      name: "fundamental_attribution",
      fired: false,
      confidence: 31,
      evidence:
        "Some situational read is present; the dispositional leap is not yet dominant.",
    },
  ],
  summary:
    "This reply is being driven by autonomy threat and late-night affect, not by what the message actually asks.",
};

export const MOCK_INTERVENTION_REPLY: InterventionResult = {
  interventionName: "Frankl Pause",
  citation: "Frankl, 1946",
  mechanism:
    "Inserting a deliberate gap between the message and the response restores the freedom to choose a non-reactive reply.",
  message:
    "Draft the reply now, but don't send it until 8am. If it still reads as the right message in daylight, send it then — the hour, not the ask, is writing this one.",
};

// ---- Demo-safety mocks for the four previously-architected modes ----
// Scanner names MUST match lib/modes.ts exactly, or a free-tier hiccup
// shows the wrong cards on stage. Scenarios mirror each mode's promptHint.

// Choice: "Should I quit my job for a smaller startup that excites me more?"
export const MOCK_DIAGNOSE_CHOICE: DiagnoseResult = {
  biases: [
    {
      name: "status_quo_bias",
      fired: true,
      confidence: 76,
      evidence:
        "Framed as leaving the safe job rather than gaining a better fit — the default is doing the persuading.",
    },
    {
      name: "optionality_paralysis",
      fired: true,
      confidence: 63,
      evidence:
        "Keeping the current role \"just in case\" preserves options at the cost of actually deciding.",
    },
    {
      name: "projection_bias",
      fired: true,
      confidence: 58,
      evidence:
        "Assuming today's excitement about the startup will feel identical a year in.",
    },
    {
      name: "narrow_framing",
      fired: true,
      confidence: 69,
      evidence:
        "Posed as a binary quit-or-stay, ignoring negotiated, deferred, or hybrid paths.",
    },
  ],
  summary:
    "This is being weighed as the loss of a safe default rather than a fit decision, and the options are framed too narrowly.",
};

// Conflict: "My groupmate ghosted on the project again and I want to send something brutal."
export const MOCK_DIAGNOSE_CONFLICT: DiagnoseResult = {
  biases: [
    {
      name: "projection",
      fired: true,
      confidence: 73,
      evidence:
        "Reading deliberate disrespect into silence projects your own frustration onto them.",
    },
    {
      name: "fundamental_attribution",
      fired: true,
      confidence: 81,
      evidence:
        "\"Ghosted again\" attributes a fixed character flaw rather than any situational cause.",
    },
    {
      name: "in_group_bias",
      fired: false,
      confidence: 38,
      evidence:
        "Some us-versus-them framing is present but not yet driving the response.",
    },
    {
      name: "recency_anger",
      fired: true,
      confidence: 78,
      evidence:
        "The urge to \"send something brutal\" shows the latest incident, not the pattern, driving the reply.",
    },
  ],
  summary:
    "The brutal reply is powered by a dispositional read of one recent incident, not a sober look at the pattern.",
};

// Influence: "A 'recruiter' DM says I'm shortlisted for a high-paying role and need to act fast."
export const MOCK_DIAGNOSE_INFLUENCE: DiagnoseResult = {
  biases: [
    {
      name: "reciprocity",
      fired: false,
      confidence: 44,
      evidence: "Light flattery as a soft opening, not yet a real obligation hook.",
    },
    {
      name: "commitment_consistency",
      fired: true,
      confidence: 57,
      evidence:
        "\"Shortlisted\" invites you to act consistently with a status you never actually earned.",
    },
    {
      name: "social_proof",
      fired: false,
      confidence: 33,
      evidence: "No crowd or peer-behavior signal is used in the message.",
    },
    {
      name: "liking",
      fired: false,
      confidence: 41,
      evidence: "Friendly tone present but not a sustained rapport play.",
    },
    {
      name: "authority",
      fired: true,
      confidence: 72,
      evidence:
        "\"Recruiter\" borrows institutional authority with zero verification offered.",
    },
    {
      name: "scarcity",
      fired: true,
      confidence: 85,
      evidence:
        "\"Need to act fast\" manufactures urgency to short-circuit scrutiny.",
    },
    {
      name: "unity",
      fired: false,
      confidence: 29,
      evidence: "No shared-identity (\"one of us\") framing is invoked.",
    },
  ],
  summary:
    "This message runs an authority-plus-scarcity play engineered to rush a decision before it can be checked.",
};

// Identity: "I keep saying I'll stop scrolling at midnight but I'm still up."
export const MOCK_DIAGNOSE_IDENTITY: DiagnoseResult = {
  biases: [
    {
      name: "identity_behavior_mismatch",
      fired: true,
      confidence: 83,
      evidence:
        "\"I keep saying I'll stop\" against still being up names a stated-identity vs behavior gap.",
    },
    {
      name: "fixed_mindset_drift",
      fired: true,
      confidence: 61,
      evidence:
        "Repeated failed attempts are being absorbed into \"that's just how I am.\"",
    },
    {
      name: "exile_part_avoidance",
      fired: true,
      confidence: 66,
      evidence:
        "The late scroll functions to avoid an uncomfortable feeling, not for the content itself.",
    },
    {
      name: "narrative_incoherence",
      fired: true,
      confidence: 57,
      evidence:
        "The \"I'm a disciplined person\" story no longer matches the nightly evidence.",
    },
  ],
  summary:
    "The midnight scrolling persists because it's defended by a fixed self-story, not because the intention is missing.",
};

// Decision-agnostic fallbacks so a degraded intervene/council under ANY
// non-spend mode never leaks purchase language onto the stage.
export const MOCK_INTERVENTION_GENERIC: InterventionResult = {
  interventionName: "Temporal Self-Distancing",
  citation: "Kross & Ayduk, 2011",
  mechanism:
    "Viewing the choice from a third-person, future vantage strips the in-the-moment pull and exposes what you'd actually endorse.",
  message:
    "Describe this decision in the third person, as advice to someone you respect, dated a year from now — then do what that version says, not what the moment wants.",
};

export const MOCK_COUNCIL_GENERIC: CouncilResult = {
  system1: "I want to act on this now — waiting feels worse than just deciding.",
  system2:
    "The evidence is that the pressure I feel, not the situation itself, is making this call.",
  futureSelf:
    "In a month this is a footnote; what I'll judge is whether I chose deliberately or reactively.",
};

export const MOCK_ROUTER = {
  primaryMode: "spend" as const,
  confidence: 70,
  reasoning:
    "Mock fallback classification — input mentions a purchase decision.",
};

// ---- Solo mode confederate ----
// Fixed peer identity that fills the second seat when a player is alone.
// The confederate submits its own seeded decision AND reads the real
// player's — preserving the mutual diagnose mechanic and the three-column
// reveal (you / friend / algorithm). diagnoser_type stays "human".

export const CONFEDERATE_ID = "confederate";
export const CONFEDERATE_NAME = "Maya";

export const CONFEDERATE_DECISIONS: Record<
  string,
  { text: string; price: number | null }
> = {
  spend: {
    text: "I'm about to put ₱5,800 on a limited-edition mechanical keyboard. Mine works fine but the drop ends at midnight.",
    price: 5800,
  },
  reply: {
    text: "A friend left me on read for two days then just sent 'k'. I'm drafting something cold back so they feel it.",
    price: null,
  },
  mirror: {
    text: "I keep telling everyone I'll start the gym 'next Monday'. It's been about six next-Mondays.",
    price: null,
  },
};

// Peer-voiced fallback reads of the *other* person's decision, keyed to mode.
// The LLM enrichment personalizes these to the actual submission; this bank
// is the never-breaks floor.
export const CONFEDERATE_READS: Record<string, string[]> = {
  spend: [
    "You're not buying the thing, you're buying the relief of not missing the deadline. Kill the timer and see if you still want it tomorrow.",
    "This reads like the discount is making the call, not you. The price tag is the only argument in there.",
  ],
  reply: [
    "The cold reply is for you, not them — it's about not being the one who looks like they cared more.",
    "You're matching their energy to feel even. That's the hurt talking, not a decision.",
  ],
  mirror: [
    "You're not missing a plan, you're protecting yourself from failing at one by never starting on a real day.",
    "'Next Monday' is the polite version of 'never'. The date was never the problem.",
  ],
};
