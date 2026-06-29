import type { ProcessingContent, ProcessingStyle } from "./types";

export const processingContent: Record<ProcessingStyle, ProcessingContent> = {
  Internal: {
    label: "Internal",
    description:
      "Internal processing means pressure tends to move inward first. You often need space, quiet, and reflection before you can name what you think or feel. Peace is often restored as you sort through your inner world and gain clarity before responding outwardly.",
    characteristics: [
      "Private processing",
      "Reflection before response",
      "Internal dialogue",
      "Self-examination",
      "Thoughtful observation",
      "Needing time before speaking clearly",
    ],
    strengths: [
      "Insightful",
      "Reflective",
      "Discerning",
      "Self-aware",
      "Able to pause before reacting",
      "Often notices deeper patterns beneath the surface",
    ],
    growthEdges: [
      "Rumination",
      "Overthinking",
      "Isolation",
      "Delayed communication",
      "Carrying too much alone",
      "Assuming others know what has not been shared",
    ],
    reflectionQuestion: "What needs to be shared instead of carried alone?",
  },

  External: {
    label: "External",
    description:
      "External processing means pressure tends to move outward first. You often gain clarity through conversation, feedback, and relational engagement. Peace is often restored as you talk things through, receive input, and make sense of what is happening with others.",
    characteristics: [
      "Verbal processing",
      "Collaborative thinking",
      "Seeking input",
      "Relational engagement",
      "Clarifying through conversation",
      "Often thinking while speaking",
    ],
    strengths: [
      "Communicative",
      "Relationally engaged",
      "Collaborative",
      "Open to feedback",
      "Able to invite others into the process",
      "Often helps teams name what is happening",
    ],
    growthEdges: [
      "Reassurance dependence",
      "Avoiding silence",
      "Premature conversations",
      "Processing before fully reflecting",
      "Over-relying on others for clarity",
      "Making others responsible for settling what needs inner attention",
    ],
    reflectionQuestion:
      "What needs to be settled within before seeking outside confirmation?",
  },
};