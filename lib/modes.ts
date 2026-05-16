export type ModeStatus = "live" | "architected";

export const MODES = {
  spend: {
    label: "Spend Mode",
    tagline: "Should I buy this?",
    description:
      "Diagnoses purchase decisions for hyperbolic discounting, anchoring, aversion, and affect-driven impulse.",
    scanners: [
      "loss_aversion",
      "hyperbolic_discounting",
      "anchoring",
      "sunk_cost",
      "affect_heuristic",
    ],
    interventions: [
      "implementation_intention",
      "gain_reframing",
      "reference_class_reset",
      "temporal_self_distancing",
    ],
    primaryResearchers: ["Kahneman", "Tversky", "Laibson", "Slovic", "Gollwitzer"],
    status: "live" as ModeStatus,
    promptHint:
      "I want to buy ₱2,400 sneakers because I had a stressful week and they're 60% off today.",
  },
  reply: {
    label: "Reply Mode",
    tagline: "How should I respond to this?",
    description:
      "Diagnoses how you're about to respond to a message — reactance, projection, attribution errors, affect spillover.",
    scanners: [
      "reactance",
      "affect_heuristic",
      "projection",
      "fundamental_attribution",
    ],
    interventions: [
      "frankl_pause",
      "nvc_translation",
      "perspective_taking",
      "wittgenstein_word_audit",
    ],
    primaryResearchers: [
      "Frankl",
      "Jung",
      "Rosenberg",
      "Brehm",
      "Ross",
      "Wittgenstein",
    ],
    status: "live" as ModeStatus,
    promptHint:
      "My boss messaged me at 11pm asking why I haven't replied to his earlier message yet.",
  },
  mirror: {
    label: "Mirror Mode",
    tagline: "What do my friends see in me that I can't?",
    description:
      "Multiplayer cross-diagnosis. You diagnose your friends. They diagnose you. The algorithm diagnoses both. Operationalizes Pronin's bias blind spot (2002).",
    scanners: ["all"],
    interventions: ["all"],
    primaryResearchers: ["Pronin", "Lin", "Ross"],
    status: "live" as ModeStatus,
    promptHint: "Start a multiplayer session and compare diagnoses.",
  },
  choice: {
    label: "Choice Mode",
    tagline: "Should I take this offer / leave / move / commit?",
    description:
      "Diagnoses major life decisions for status quo bias, Kierkegaard's optionality paralysis, projection bias, narrow framing, future-self disconnection.",
    scanners: [
      "status_quo_bias",
      "optionality_paralysis",
      "projection_bias",
      "narrow_framing",
    ],
    interventions: [
      "future_self_letter",
      "decision_pre_mortem",
      "ten_ten_ten_rule",
      "ifs_council",
    ],
    primaryResearchers: [
      "Hershfield",
      "Klein",
      "Schwartz",
      "Kierkegaard",
      "Samuelson",
    ],
    status: "live" as ModeStatus,
    promptHint: "Should I quit my job for a smaller startup that excites me more?",
  },
  conflict: {
    label: "Conflict Mode",
    tagline: "Why am I so angry at this person?",
    description:
      "Diagnoses interpersonal conflict for projection, fundamental attribution error, in-group/out-group bias, recency anger, affect spillover.",
    scanners: [
      "projection",
      "fundamental_attribution",
      "in_group_bias",
      "recency_anger",
    ],
    interventions: [
      "jungian_shadow_mirror",
      "stoic_dichotomy",
      "nvc_translation",
      "frankl_pause",
    ],
    primaryResearchers: ["Jung", "Frankl", "Rosenberg", "Epictetus", "Ross"],
    status: "live" as ModeStatus,
    promptHint:
      "My groupmate ghosted on the project again and I want to send something brutal.",
  },
  influence: {
    label: "Influence Mode",
    tagline: "Is someone running a play on me?",
    description:
      "Scans incoming messages, offers, and pitches for Cialdini's seven weapons (reciprocity, commitment, social proof, liking, authority, scarcity, unity) and pre-suasion patterns.",
    scanners: [
      "reciprocity",
      "commitment_consistency",
      "social_proof",
      "liking",
      "authority",
      "scarcity",
      "unity",
    ],
    interventions: ["name_the_weapon", "counter_frame", "refusal_script"],
    primaryResearchers: ["Cialdini", "Kahneman", "Brehm"],
    status: "live" as ModeStatus,
    promptHint:
      "I got a DM from a 'recruiter' saying I'm shortlisted for a high-paying role and need to act fast.",
  },
  identity: {
    label: "Identity Mode",
    tagline: "Why do I keep doing this thing I said I'd stop?",
    description:
      "Diagnoses identity-behavior gaps using Clear's identity-first framing, Dweck's growth/fixed mindset, IFS parts dialogue, McAdams's narrative identity.",
    scanners: [
      "identity_behavior_mismatch",
      "fixed_mindset_drift",
      "exile_part_avoidance",
      "narrative_incoherence",
    ],
    interventions: [
      "identity_first_reframe",
      "ifs_parts_dialogue",
      "narrative_rewrite",
      "implementation_intention",
    ],
    primaryResearchers: ["Clear", "Dweck", "Schwartz", "McAdams", "Bem"],
    status: "live" as ModeStatus,
    promptHint: "I keep saying I'll stop scrolling at midnight but I'm still up.",
  },
} as const;

export type ModeKey = keyof typeof MODES;

export const LIVE_MODES: ModeKey[] = (Object.keys(MODES) as ModeKey[]).filter(
  (k) => MODES[k].status === "live"
);
