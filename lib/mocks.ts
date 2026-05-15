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
