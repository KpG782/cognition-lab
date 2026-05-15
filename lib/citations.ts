export const CITATIONS = {
  bias_blind_spot: {
    authors: "Pronin, Lin & Ross",
    year: 2002,
    paper: "The Bias Blind Spot: Perceptions of Bias in Self Versus Others",
    journal: "Personality and Social Psychology Bulletin",
    finding:
      "People consistently rate themselves as less susceptible to cognitive biases than others, even when shown evidence to the contrary.",
  },
  loss_aversion: {
    authors: "Kahneman & Tversky",
    year: 1979,
    paper: "Prospect Theory: An Analysis of Decision under Risk",
    finding: "Losses are weighted roughly 2.5x more heavily than equivalent gains.",
  },
  hyperbolic_discounting: {
    authors: "Laibson",
    year: 1997,
    paper: "Golden Eggs and Hyperbolic Discounting",
    finding: "People disproportionately prefer immediate rewards over delayed ones.",
  },
  anchoring: {
    authors: "Tversky & Kahneman",
    year: 1974,
    paper: "Judgment under Uncertainty: Heuristics and Biases",
    finding: "An initial reference point distorts subsequent quantitative judgments.",
  },
  sunk_cost: {
    authors: "Arkes & Blumer",
    year: 1985,
    paper: "The Psychology of Sunk Cost",
    finding: "Past investments irrationally influence current decisions.",
  },
  affect_heuristic: {
    authors: "Slovic",
    year: 2007,
    paper: "The Affect Heuristic",
    finding: "Emotional states substitute for deliberate analysis in judgment.",
  },
  implementation_intention: {
    authors: "Gollwitzer",
    year: 1999,
    paper: "Implementation Intentions: Strong Effects of Simple Plans",
    finding: "If-then plans dramatically increase follow-through on intentions.",
  },
  temporal_self_distancing: {
    authors: "Kross & Ayduk",
    year: 2011,
    paper: "Making Meaning out of Negative Experiences by Self-Distancing",
    finding:
      "Third-person reframing reduces emotional reactivity and improves reasoning.",
  },
  systems_1_and_2: {
    authors: "Kahneman",
    year: 2011,
    paper: "Thinking, Fast and Slow",
    finding:
      "Two cognitive systems govern decisions: System 1 (fast, intuitive) and System 2 (slow, deliberate).",
  },
  future_self: {
    authors: "Hershfield",
    year: 2011,
    paper: "Future self-continuity",
    finding:
      "Greater psychological connection to one's future self increases prudent decision-making.",
  },
} as const;

export type CitationKey = keyof typeof CITATIONS;

export function formatCitation(key: CitationKey): string {
  const c = CITATIONS[key];
  return `${c.authors}, ${c.year}`;
}
