import type { ResponseContent } from "./types";

export const responseContent: Record<
  "Push" | "Prove" | "Please" | "PullAway",
  ResponseContent
> = {
  Push: {
    label: "Push",

    displayLabel: "Push",

    pressureStrategy:
      "When things get difficult, I move toward the problem.",

    description:
      "Push restores peace by moving directly toward tension. When pressure rises, this response seeks clarity, action, resolution, and control through engagement. Push often believes peace comes from addressing the issue rather than avoiding it.",

    strengths: [
      "Direct",
      "Decisive",
      "Courageous",
      "Willing to confront issues",
      "Acts quickly when action is needed",
      "Can bring clarity during uncertainty",
    ],

    growthEdges: [
      "Can escalate tension unnecessarily",
      "May overwhelm others with intensity",
      "Can become controlling under pressure",
      "May prioritize resolution over understanding",
    ],

    typicalBehaviors: [
      "Addresses conflict quickly",
      "Challenges problems directly",
      "Pushes for decisions",
      "Becomes more assertive under stress",
      "Moves toward action rather than reflection",
    ],

    reflectionQuestion:
      "What would happen if understanding became as important as resolution?",
  },

  Prove: {
    label: "Prove",

    displayLabel: "Prove",

    pressureStrategy:
      "When things get difficult, I work harder.",

    description:
      "Prove restores peace through effort, responsibility, and accomplishment. When pressure rises, this response attempts to stabilize the situation by increasing productivity and carrying additional burdens.",

    strengths: [
      "Reliable",
      "Responsible",
      "Productive",
      "Committed",
      "Hard-working",
      "Dependable under pressure",
    ],

    growthEdges: [
      "Over-functioning",
      "Difficulty delegating",
      "Taking ownership of things that are not theirs",
      "Burnout through excessive responsibility",
    ],

    typicalBehaviors: [
      "Works longer or harder",
      "Carries more responsibility",
      "Attempts to solve problems personally",
      "Focuses on productivity",
      "Measures progress through accomplishment",
    ],

    reflectionQuestion:
      "What burden am I carrying that may not belong to me?",
  },

Please: {
  label: "Please",
  displayLabel: "Please",

  pressureStrategy:
    "When things get difficult, I preserve harmony.",

  description:
    "When pressure rises, your instinct is to protect relationships and reduce tension. You are highly aware of emotional atmospheres and often notice discomfort before others name it. You may sense when people are disappointed, disconnected, anxious, or uneasy, and you naturally move toward care, reassurance, and relational repair. This response allows you to bring warmth and steadiness into difficult moments. You often help people feel seen, considered, and less alone.\n\nThis is a meaningful gift, but it also carries a shadow. When harmony becomes the highest goal, honesty can be delayed. You may soften your words, minimize your own needs, or take responsibility for how everyone else feels. You may work hard to keep the room calm while quietly carrying tension inside. Over time, this can create a version of peace that looks stable on the outside but remains unsettled underneath. Your growth is learning that true peace does not require avoiding discomfort. True peace allows care and truth to exist together.",

  strengths: [
    "Empathetic",
    "Relationally aware",
    "Encouraging",
    "Attentive to people",
    "Able to lower tension",
    "Gifted at helping others feel seen",
  ],

  growthEdges: [
    "Avoiding difficult conversations",
    "Carrying responsibility for everyone's emotions",
    "Delaying necessary truth",
    "Suppressing personal needs",
    "Confusing calm with peace",
    "Protecting comfort over growth",
  ],

  typicalBehaviors: [
    "You notice tension quickly.",
    "You try to help people feel okay.",
    "You may soften truth to preserve connection.",
    "You may carry more emotional responsibility than is yours.",
    "You may avoid naming what needs to be addressed.",
  ],

  reflectionQuestion:
    "Where am I preserving comfort when peace may require honest engagement?",
},

  PullAway: {
    label: "PullAway",

    displayLabel: "Pull Away",

    pressureStrategy:
      "When things get difficult, I create distance.",

    description:
      "Pull Away restores peace through space, reflection, and perspective. When pressure rises, this response seeks clarity by stepping back from immediate demands and processing internally before re-engaging.",

    strengths: [
      "Reflective",
      "Thoughtful",
      "Self-aware",
      "Perspective-oriented",
      "Calm under pressure",
      "Able to see larger patterns",
    ],

    growthEdges: [
      "Isolation",
      "Emotional disengagement",
      "Delayed conflict resolution",
      "Withholding important thoughts or feelings",
    ],

    typicalBehaviors: [
      "Retreats to think",
      "Processes internally",
      "Creates emotional space",
      "Observes before acting",
      "Delays engagement until clarity emerges",
    ],

    reflectionQuestion:
      "What needs to be shared instead of carried alone?",
  },
};