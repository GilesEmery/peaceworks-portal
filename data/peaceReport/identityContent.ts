import type { IdentityContent } from "./types";

export const identityContent: Record<
  "Performance" | "Prestige" | "Prosperity",
  IdentityContent
> = {
  Performance: {
    label: "Performance",

    coreQuestion: "Am I enough?",

    peaceAnchorDescription:
      "Performance seeks peace through effectiveness, responsibility, competence, and meaningful accomplishment. When this identity tension is active, peace often feels connected to whether things are being done well, whether progress is being made, and whether you are carrying your responsibilities faithfully.",

    seeksPeaceThrough: [
      "Achievement",
      "Competence",
      "Productivity",
      "Responsibility",
      "Excellence",
      "Follow-through",
    ],

    shadowSide: [
      "Measuring worth through results",
      "Over-identifying with productivity",
      "Self-criticism when things are unfinished",
      "Difficulty resting without guilt",
      "Carrying more responsibility than is yours to carry",
    ],

    losesPeaceWhen: [
      "You feel ineffective or behind",
      "You believe you have failed to meet expectations",
      "The work is not being done well",
      "You cannot produce at the level you expect of yourself",
      "Others question your competence or follow-through",
    ],

    protectsPeaceBy: [
      "Working harder",
      "Taking more responsibility",
      "Trying to fix what feels unfinished",
      "Increasing effort, structure, or control",
      "Holding yourself to higher standards",
    ],

    restoresPeaceThrough: [
      "Receiving worth apart from accomplishment",
      "Practicing rest without needing to earn it",
      "Sharing responsibility with others",
      "Naming what is enough for today",
      "Allowing progress to matter without becoming your identity",
    ],

    strengths: [
      "Reliable",
      "Responsible",
      "Productive",
      "Committed to excellence",
      "Willing to follow through",
      "Able to bring structure and momentum",
    ],

    growthEdges: [
      "Over-functioning under pressure",
      "Difficulty receiving help",
      "Impatience with slower processes",
      "Confusing faithfulness with constant productivity",
      "Believing peace will come when everything is finished",
    ],

    reflectionQuestion:
      "Where am I trying to earn peace through effort rather than practice peace through trust?",
  },

  Prestige: {
    label: "Prestige",

    coreQuestion: "Am I valued?",

    peaceAnchorDescription:
      "Prestige seeks peace through being valued, seen, accepted, and meaningfully connected to others. When this identity tension is active, peace often feels connected to whether people approve, recognize, include, or affirm you.",

    seeksPeaceThrough: [
      "Approval",
      "Recognition",
      "Influence",
      "Acceptance",
      "Belonging",
      "Being understood",
    ],

    shadowSide: [
      "Managing image to preserve acceptance",
      "Over-attending to how others perceive you",
      "Avoiding disappointment or rejection",
      "Seeking validation before acting freely",
      "Confusing being valued with being constantly affirmed",
    ],

    losesPeaceWhen: [
      "You feel misunderstood or overlooked",
      "Someone seems disappointed in you",
      "You are not sure where you stand relationally",
      "You fear others may think less of you",
      "Your contribution feels unseen or unappreciated",
    ],

    protectsPeaceBy: [
      "Managing impressions",
      "Seeking reassurance",
      "Adjusting yourself to maintain approval",
      "Avoiding actions that may disappoint others",
      "Trying to stay relationally acceptable",
    ],

    restoresPeaceThrough: [
      "Receiving belovedness apart from approval",
      "Telling the truth without over-managing perception",
      "Allowing others to have their reactions",
      "Practicing secure belonging",
      "Choosing integrity over image protection",
    ],

    strengths: [
      "Relationally aware",
      "Encouraging",
      "Sensitive to group dynamics",
      "Able to build connection",
      "Attentive to belonging and inclusion",
      "Often highly intuitive about people",
    ],

    growthEdges: [
      "Over-reading others' responses",
      "Avoiding necessary truth because it may threaten approval",
      "Depending too heavily on external affirmation",
      "Confusing harmony with acceptance",
      "Losing your own clarity in the desire to be valued",
    ],

    reflectionQuestion:
      "Where am I trying to secure peace by being valued instead of living from the truth that I already am?",
  },

  Prosperity: {
    label: "Prosperity",

    coreQuestion: "Am I secure?",

    peaceAnchorDescription:
      "Prosperity seeks peace through security, stability, preparation, and a sense that there is enough. When this identity tension is active, peace often feels connected to whether life feels predictable, resourced, protected, and manageable.",

    seeksPeaceThrough: [
      "Stability",
      "Predictability",
      "Safety",
      "Resources",
      "Preparation",
      "Enoughness",
    ],

    shadowSide: [
      "Fear of loss",
      "Overprotection",
      "Scarcity mindset",
      "Control through security",
      "Difficulty moving forward without certainty",
    ],

    losesPeaceWhen: [
      "The future feels uncertain",
      "You feel under-resourced or overextended",
      "Plans change unexpectedly",
      "You cannot predict what will happen next",
      "Your capacity, comfort, or stability feels threatened",
    ],

    protectsPeaceBy: [
      "Preparing for every possible outcome",
      "Avoiding unnecessary risk",
      "Holding tightly to control",
      "Seeking certainty before moving forward",
      "Creating buffers, plans, and safeguards",
    ],

    restoresPeaceThrough: [
      "Practicing trust in uncertainty",
      "Naming what is actually needed today",
      "Releasing the need to control every outcome",
      "Receiving provision without hoarding control",
      "Taking faithful steps before full certainty arrives",
    ],

    strengths: [
      "Prepared",
      "Steady",
      "Thoughtful",
      "Protective",
      "Aware of risk",
      "Able to create stability for others",
    ],

    growthEdges: [
      "Over-preparing instead of acting",
      "Mistaking safety for peace",
      "Difficulty staying open when uncertainty rises",
      "Assuming scarcity before testing reality",
      "Letting risk avoidance limit growth",
    ],

    reflectionQuestion:
      "Where am I trying to secure peace by controlling outcomes instead of practicing trust within uncertainty?",
  },
};