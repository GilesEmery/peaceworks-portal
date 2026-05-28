export type ScoreKey =
  | "Performance"
  | "Prestige"
  | "Prosperity"
  | "Push"
  | "Prove"
  | "Please"
  | "PullAway"
  | "Internal"
  | "External"
  | "PeaceCapacity";

export type QuestionOption = {
  id: string;
  text: string;
  scores: Partial<Record<ScoreKey, number>>;
};

export type PeaceAssessmentQuestion = {
  id: number;
  type: "single" | "choose2" | "truefalse" | "slider";
  section: string;
  scenario: string;
  prompt: string;
  options?: QuestionOption[];
  max?: number;
  tieBreaker?: boolean;
  left?: {
    title: string;
    text: string;
  };
  right?: {
    title: string;
    text: string;
  };
  capacity?: boolean;
};

export const peaceAssessmentQuestions: PeaceAssessmentQuestion[] = [
  {
    id: 1,
    type: "single",
    section: "What Steals Your Peace?",
    scenario:
      "A project you care about is falling behind. Deadlines are slipping, the plan feels unclear, and people are starting to notice.",
    prompt: "What would most likely steal your peace?",
    options: [
      { id: "q1a", text: "The work may not be done well.", scores: { Performance: 1 } },
      { id: "q1b", text: "People may think I dropped the ball.", scores: { Prestige: 1 } },
      { id: "q1c", text: "Things feel unstable or uncertain.", scores: { Prosperity: 1 } },
    ],
  },
  {
    id: 2,
    type: "single",
    section: "What Steals Your Peace?",
    scenario:
      "You made a decision you thought was best, but someone questions it in front of others.",
    prompt: "What bothers you most?",
    options: [
      { id: "q2a", text: "I may have made the wrong or ineffective decision.", scores: { Performance: 1 } },
      { id: "q2b", text: "Others may now see me differently.", scores: { Prestige: 1 } },
      { id: "q2c", text: "The situation now feels less secure or predictable.", scores: { Prosperity: 1 } },
    ],
  },
  {
    id: 3,
    type: "single",
    section: "What Steals Your Peace?",
    scenario:
      "Someone important to you seems disappointed in how you handled something.",
    prompt: "What gets under your skin first?",
    options: [
      { id: "q3a", text: "I did not handle it as well as I should have.", scores: { Performance: 1 } },
      { id: "q3b", text: "They may think less of me now.", scores: { Prestige: 1 } },
      { id: "q3c", text: "This could create tension, distance, or instability.", scores: { Prosperity: 1 } },
    ],
  },
  {
    id: 4,
    type: "single",
    section: "What Steals Your Peace?",
    scenario:
      "You had a clear plan for the day, but something unexpected changes everything.",
    prompt: "What most disrupts your peace?",
    options: [
      { id: "q4a", text: "Losing momentum and not getting things done.", scores: { Performance: 1 } },
      { id: "q4b", text: "How others may react to the change.", scores: { Prestige: 1 } },
      { id: "q4c", text: "Not knowing what will happen next.", scores: { Prosperity: 1 } },
    ],
  },
  {
    id: 5,
    type: "single",
    section: "What Steals Your Peace?",
    scenario:
      "Several people need something from you at the same time, and you are already stretched thin.",
    prompt: "What feels hardest in that moment?",
    options: [
      { id: "q5a", text: "Not being able to keep up or do everything well.", scores: { Performance: 1 } },
      { id: "q5b", text: "Possibly disappointing people who are counting on me.", scores: { Prestige: 1 } },
      { id: "q5c", text: "Feeling like I do not have enough time, space, or capacity.", scores: { Prosperity: 1 } },
    ],
  },
  {
    id: 6,
    type: "single",
    section: "What Steals Your Peace?",
    scenario:
      "Someone says, 'We need to talk about how things are going,' but they do not explain what they mean.",
    prompt: "What would most likely bother you?",
    options: [
      { id: "q6a", text: "Wondering what I did wrong or need to fix.", scores: { Performance: 1 } },
      { id: "q6b", text: "Wondering if they are upset with me or think poorly of me.", scores: { Prestige: 1 } },
      { id: "q6c", text: "Feeling uncertain because I do not know what is coming.", scores: { Prosperity: 1 } },
    ],
  },
  {
    id: 7,
    type: "single",
    section: "What Steals Your Peace?",
    scenario: "Someone you were counting on does not follow through.",
    prompt: "What most affects your peace?",
    options: [
      { id: "q7a", text: "The work may suffer because it was not done well.", scores: { Performance: 1 } },
      { id: "q7b", text: "I may look bad because I trusted them.", scores: { Prestige: 1 } },
      { id: "q7c", text: "I now feel like I cannot rely on the situation or the person.", scores: { Prosperity: 1 } },
    ],
  },
  {
    id: 8,
    type: "single",
    section: "What Steals Your Peace?",
    scenario:
      "An opportunity comes up, but it requires risk, uncertainty, and possible failure.",
    prompt: "What feels hardest?",
    options: [
      { id: "q8a", text: "I may not be able to execute it well.", scores: { Performance: 1 } },
      { id: "q8b", text: "People may see me fail.", scores: { Prestige: 1 } },
      { id: "q8c", text: "I may lose stability, comfort, or security.", scores: { Prosperity: 1 } },
    ],
  },
  {
    id: 9,
    type: "choose2",
    max: 2,
    section: "What Steals Your Peace?",
    scenario: "Think about a recent moment when you felt unsettled.",
    prompt: "Choose two things that would most likely make peace harder for you.",
    options: [
      { id: "q9a", text: "Feeling ineffective or behind.", scores: { Performance: 1 } },
      { id: "q9b", text: "Feeling responsible for too much.", scores: { Performance: 1 } },
      { id: "q9c", text: "Feeling unseen or unappreciated.", scores: { Prestige: 1 } },
      { id: "q9d", text: "Feeling misunderstood or judged.", scores: { Prestige: 1 } },
      { id: "q9e", text: "Feeling uncertain about what will happen.", scores: { Prosperity: 1 } },
      { id: "q9f", text: "Feeling like your stability or capacity is threatened.", scores: { Prosperity: 1 } },
    ],
  },
  {
    id: 10,
    type: "truefalse",
    section: "What Steals Your Peace?",
    scenario:
      "Sometimes peace breaks down because something deeper feels at stake.",
    prompt:
      "I often feel most unsettled when I cannot tell whether I am doing enough, valued enough, or secure enough.",
    options: [
      {
        id: "q10t",
        text: "True: that sounds like me.",
        scores: { Performance: 0.34, Prestige: 0.33, Prosperity: 0.33 },
      },
      { id: "q10f", text: "False: that does not usually describe me.", scores: {} },
    ],
  },
  {
    id: 11,
    type: "single",
    section: "What Steals Your Peace?",
    scenario:
      "You are tired, but there are still things to do and people depending on you.",
    prompt: "What feels hardest?",
    options: [
      { id: "q11a", text: "Not being able to keep producing at the level I expect.", scores: { Performance: 1 } },
      { id: "q11b", text: "Letting people down.", scores: { Prestige: 1 } },
      { id: "q11c", text: "Feeling like I do not have enough energy or margin.", scores: { Prosperity: 1 } },
    ],
  },
  {
    id: 12,
    type: "single",
    tieBreaker: true,
    section: "Identity Tie-Breaker",
    scenario: "If you had to choose one, the hardest thing for you to lose would be:",
    prompt: "Choose the one that feels most true.",
    options: [
      { id: "q12a", text: "A sense of effectiveness.", scores: { Performance: 2 } },
      { id: "q12b", text: "A sense of being valued.", scores: { Prestige: 2 } },
      { id: "q12c", text: "A sense of security.", scores: { Prosperity: 2 } },
    ],
  },
  {
    id: 13,
    type: "single",
    section: "What Do You Do Under Pressure?",
    scenario:
      "A conversation in a meeting becomes tense. Someone pushes back on your idea, and the room feels uncomfortable.",
    prompt: "What would you most naturally do?",
    options: [
      { id: "q13a", text: "Become more direct and try to take control of the conversation.", scores: { Push: 1 } },
      { id: "q13b", text: "Work harder to explain, fix, or prove the idea is still good.", scores: { Prove: 1 } },
      { id: "q13c", text: "Try to smooth things over and keep everyone okay.", scores: { Please: 1 } },
      { id: "q13d", text: "Pull back, get quiet, or process it later on your own.", scores: { PullAway: 1 } },
    ],
  },
  {
    id: 14,
    type: "single",
    section: "What Do You Do Under Pressure?",
    scenario: "Someone gives you feedback that feels critical.",
    prompt: "What is your first instinct?",
    options: [
      { id: "q14a", text: "Push back or defend your position.", scores: { Push: 1 } },
      { id: "q14b", text: "Work harder to show you can improve.", scores: { Prove: 1 } },
      { id: "q14c", text: "Try to make sure they are not upset with me.", scores: { Please: 1 } },
      { id: "q14d", text: "Withdraw and think about it privately.", scores: { PullAway: 1 } },
    ],
  },
  {
    id: 15,
    type: "single",
    section: "What Do You Do Under Pressure?",
    scenario: "A deadline is coming, and things are not where they need to be.",
    prompt: "What are you most likely to do?",
    options: [
      { id: "q15a", text: "Take charge and tell people what needs to happen.", scores: { Push: 1 } },
      { id: "q15b", text: "Carry more of the work myself.", scores: { Prove: 1 } },
      { id: "q15c", text: "Check in with people to keep everyone calm and cooperative.", scores: { Please: 1 } },
      { id: "q15d", text: "Delay engaging until I have more space or clarity.", scores: { PullAway: 1 } },
    ],
  },
  {
    id: 16,
    type: "single",
    section: "What Do You Do Under Pressure?",
    scenario: "You can tell someone is frustrated or disappointed with you.",
    prompt: "What do you most naturally do?",
    options: [
      { id: "q16a", text: "Address it directly and try to settle it quickly.", scores: { Push: 1 } },
      { id: "q16b", text: "Try to make up for it through effort or follow-through.", scores: { Prove: 1 } },
      { id: "q16c", text: "Apologize, explain, or try to restore their approval.", scores: { Please: 1 } },
      { id: "q16d", text: "Avoid the person or wait for things to cool down.", scores: { PullAway: 1 } },
    ],
  },
  {
    id: 17,
    type: "single",
    section: "What Do You Do Under Pressure?",
    scenario: "Something you were counting on does not work out.",
    prompt: "What do you usually do first?",
    options: [
      { id: "q17a", text: "Start making decisions quickly to regain control.", scores: { Push: 1 } },
      { id: "q17b", text: "Work harder to create a new solution.", scores: { Prove: 1 } },
      { id: "q17c", text: "Try to keep people from getting upset.", scores: { Please: 1 } },
      { id: "q17d", text: "Step back because it feels like too much.", scores: { PullAway: 1 } },
    ],
  },
  {
    id: 18,
    type: "choose2",
    max: 2,
    section: "What Do You Do Under Pressure?",
    scenario: "Pressure rises quickly and you do not have much time to think.",
    prompt: "Choose two responses that sound most like you.",
    options: [
      { id: "q18a", text: "Take control of what is happening.", scores: { Push: 1 } },
      { id: "q18b", text: "Become more direct or forceful.", scores: { Push: 1 } },
      { id: "q18c", text: "Work harder or carry more.", scores: { Prove: 1 } },
      { id: "q18d", text: "Try to fix or prove the solution.", scores: { Prove: 1 } },
      { id: "q18e", text: "Smooth things over or keep people okay.", scores: { Please: 1 } },
      { id: "q18f", text: "Pull back, delay, or retreat inwardly.", scores: { PullAway: 1 } },
    ],
  },
  {
    id: 19,
    type: "single",
    section: "What Do You Do Under Pressure?",
    scenario: "You sense distance or tension in an important relationship.",
    prompt: "What do you tend to do?",
    options: [
      { id: "q19a", text: "Bring it up directly.", scores: { Push: 1 } },
      { id: "q19b", text: "Try to improve things by doing more or being more useful.", scores: { Prove: 1 } },
      { id: "q19c", text: "Adjust myself to keep the relationship okay.", scores: { Please: 1 } },
      { id: "q19d", text: "Pull back and wait to see what happens.", scores: { PullAway: 1 } },
    ],
  },
  {
    id: 20,
    type: "single",
    section: "What Do You Do Under Pressure?",
    scenario: "You are carrying a lot internally.",
    prompt: "What is your most common response?",
    options: [
      { id: "q20a", text: "Become more intense or irritable.", scores: { Push: 1 } },
      { id: "q20b", text: "Stay busy and keep producing.", scores: { Prove: 1 } },
      { id: "q20c", text: "Focus on others so I do not have to feel it directly.", scores: { Please: 1 } },
      { id: "q20d", text: "Numb out, disconnect, or retreat.", scores: { PullAway: 1 } },
    ],
  },
  {
    id: 21,
    type: "truefalse",
    section: "What Do You Do Under Pressure?",
    scenario: "Think about your most automatic stress response.",
    prompt: "When I am unsettled, people around me can usually feel it.",
    options: [
      { id: "q21t", text: "True: my pressure usually becomes visible.", scores: { Push: 0.5, Prove: 0.5, External: 0.5 } },
      { id: "q21f", text: "False: I usually carry pressure privately.", scores: { PullAway: 0.5, Internal: 0.5 } },
    ],
  },
  {
    id: 22,
    type: "choose2",
    max: 2,
    section: "What Do You Do Under Pressure?",
    scenario:
      "When something feels off, different people try to restore peace in different ways.",
    prompt: "Choose two that sound most familiar.",
    options: [
      { id: "q22a", text: "I correct or challenge what feels wrong.", scores: { Push: 1 } },
      { id: "q22b", text: "I organize, solve, or produce my way through it.", scores: { Prove: 1 } },
      { id: "q22c", text: "I check on people and manage the relational temperature.", scores: { Please: 1 } },
      { id: "q22d", text: "I create space so I can think or recover.", scores: { PullAway: 1 } },
      { id: "q22e", text: "I get louder or clearer than usual.", scores: { Push: 1 } },
      { id: "q22f", text: "I quietly disappear into my own head.", scores: { PullAway: 1 } },
    ],
  },
  {
    id: 23,
    type: "single",
    section: "What Do You Do Under Pressure?",
    scenario: "Someone fails to meet your expectations.",
    prompt: "What do you usually do first?",
    options: [
      { id: "q23a", text: "Confront or correct them.", scores: { Push: 1 } },
      { id: "q23b", text: "Pick up the slack myself.", scores: { Prove: 1 } },
      { id: "q23c", text: "Keep things pleasant while feeling frustrated inside.", scores: { Please: 1 } },
      { id: "q23d", text: "Withdraw or lower my expectations without saying much.", scores: { PullAway: 1 } },
    ],
  },
  {
    id: 24,
    type: "single",
    tieBreaker: true,
    section: "Pressure Response Tie-Breaker",
    scenario: "Under pressure, my most automatic response is to:",
    prompt: "Choose the one that feels most true.",
    options: [
      { id: "q24a", text: "Take control.", scores: { Push: 2 } },
      { id: "q24b", text: "Work harder.", scores: { Prove: 2 } },
      { id: "q24c", text: "Keep people okay with me.", scores: { Please: 2 } },
      { id: "q24d", text: "Pull back.", scores: { PullAway: 2 } },
    ],
  },
    {
    id: 25,
    type: "single",
    section: "How Do You Process?",
    scenario:
      "You have a difficult decision to make and emotions are running high.",
    prompt: "What feels most natural to you?",
    options: [
      { id: "q25a", text: "I process internally before speaking.", scores: { Internal: 1 } },
      { id: "q25b", text: "I need to talk it out to process clearly.", scores: { External: 1 } },
    ],
  },
  {
    id: 26,
    type: "single",
    section: "How Do You Process?",
    scenario:
      "Someone asks what you are feeling during a stressful moment.",
    prompt: "What is your most natural response?",
    options: [
      { id: "q26a", text: "I usually need time before I can explain it.", scores: { Internal: 1 } },
      { id: "q26b", text: "Talking helps me understand what I feel.", scores: { External: 1 } },
    ],
  },
  {
    id: 27,
    type: "single",
    section: "How Do You Process?",
    scenario:
      "Conflict or tension happens unexpectedly.",
    prompt: "What do you most naturally do?",
    options: [
      { id: "q27a", text: "Retreat inwardly and think through it.", scores: { Internal: 1 } },
      { id: "q27b", text: "Process outwardly through conversation or reaction.", scores: { External: 1 } },
    ],
  },
  {
    id: 28,
    type: "single",
    section: "How Do You Process?",
    scenario:
      "A situation leaves you emotionally unsettled.",
    prompt: "What helps you most?",
    options: [
      { id: "q28a", text: "Solitude, reflection, or quiet processing.", scores: { Internal: 1 } },
      { id: "q28b", text: "Talking with someone or processing aloud.", scores: { External: 1 } },
    ],
  },
  {
    id: 29,
    type: "choose2",
    max: 2,
    section: "How Do You Process?",
    scenario:
      "People process stress and emotion differently.",
    prompt: "Choose two that sound most like you.",
    options: [
      { id: "q29a", text: "I think deeply before responding.", scores: { Internal: 1 } },
      { id: "q29b", text: "I often process internally without others knowing.", scores: { Internal: 1 } },
      { id: "q29c", text: "I need dialogue to clarify what I think.", scores: { External: 1 } },
      { id: "q29d", text: "People can usually tell what I am processing.", scores: { External: 1 } },
    ],
  },
  {
    id: 30,
    type: "single",
    tieBreaker: true,
    section: "Processing Tie-Breaker",
    scenario:
      "If you had to choose one, you would say:",
    prompt: "Choose the one that feels most true.",
    options: [
      { id: "q30a", text: "I process more internally.", scores: { Internal: 2 } },
      { id: "q30b", text: "I process more externally.", scores: { External: 2 } },
    ],
  },
  {
    id: 31,
    type: "slider",
    capacity: true,
    max: 10,
    section: "Peace Capacity",
    scenario:
      "Think about your current emotional, relational, and mental capacity.",
    prompt: "Right now, how emotionally present do you feel in daily life?",
    left: {
      title: "Low Presence",
      text: "Disconnected, numb, or overwhelmed",
    },
    right: {
      title: "High Presence",
      text: "Grounded, attentive, and emotionally available",
    },
  },
  {
    id: 32,
    type: "slider",
    capacity: true,
    max: 10,
    section: "Peace Capacity",
    scenario:
      "Think about your current internal stability.",
    prompt: "How much peace and steadiness do you currently feel inside?",
    left: {
      title: "Low Peace",
      text: "Anxious, reactive, or exhausted",
    },
    right: {
      title: "High Peace",
      text: "Calm, centered, and resilient",
    },
  },
  {
    id: 33,
    type: "slider",
    capacity: true,
    max: 10,
    section: "Peace Capacity",
    scenario:
      "Think about how you respond to stress right now.",
    prompt: "How able are you to stay grounded under pressure?",
    left: {
      title: "Low Capacity",
      text: "Quickly overwhelmed or reactive",
    },
    right: {
      title: "High Capacity",
      text: "Able to remain steady and thoughtful",
    },
  },
  {
    id: 34,
    type: "slider",
    capacity: true,
    max: 10,
    section: "Peace Capacity",
    scenario:
      "Think about your relationships recently.",
    prompt: "How emotionally connected do you feel to others right now?",
    left: {
      title: "Disconnected",
      text: "Withdrawn, guarded, or isolated",
    },
    right: {
      title: "Connected",
      text: "Open, relational, and engaged",
    },
  },
  {
    id: 35,
    type: "slider",
    capacity: true,
    max: 10,
    section: "Peace Capacity",
    scenario:
      "Think about your overall energy and margin.",
    prompt: "How much emotional and mental margin do you currently have?",
    left: {
      title: "Drained",
      text: "Little room for stress or relationships",
    },
    right: {
      title: "Healthy Margin",
      text: "Enough capacity to engage well",
    },
  },
  {
    id: 36,
    type: "slider",
    capacity: true,
    max: 10,
    section: "Peace Capacity",
    scenario:
      "Think about your awareness of yourself and others.",
    prompt: "How aware are you of your own emotions and reactions?",
    left: {
      title: "Low Awareness",
      text: "Often reactive without noticing why",
    },
    right: {
      title: "High Awareness",
      text: "Able to recognize and reflect on reactions",
    },
  },
  {
    id: 37,
    type: "slider",
    capacity: true,
    max: 10,
    section: "Peace Capacity",
    scenario:
      "Think about your ability to repair relationships.",
    prompt: "How able are you to move toward repair after conflict?",
    left: {
      title: "Avoiding Repair",
      text: "Difficult to engage or reconnect",
    },
    right: {
      title: "Repair Oriented",
      text: "Able to pursue understanding and reconciliation",
    },
  },
  {
    id: 38,
    type: "slider",
    capacity: true,
    max: 10,
    section: "Peace Capacity",
    scenario:
      "Think about your current rhythms of rest and reflection.",
    prompt: "How intentional are you about caring for your emotional health?",
    left: {
      title: "Neglected",
      text: "Running on fumes or surviving",
    },
    right: {
      title: "Intentional",
      text: "Practicing rhythms that restore peace",
    },
  },
  {
    id: 39,
    type: "slider",
    capacity: true,
    max: 10,
    section: "Peace Capacity",
    scenario:
      "Think about your ability to stay emotionally open.",
    prompt: "How safe do you feel being honest and vulnerable with others?",
    left: {
      title: "Guarded",
      text: "Protective or emotionally closed",
    },
    right: {
      title: "Open",
      text: "Able to share honestly and appropriately",
    },
  },
  {
    id: 40,
    type: "slider",
    capacity: true,
    max: 10,
    section: "Peace Capacity",
    scenario:
      "Think about your overall relational and emotional health.",
    prompt: "How would you describe your current peace capacity overall?",
    left: {
      title: "Low Capacity",
      text: "Running depleted and reactive",
    },
    right: {
      title: "High Capacity",
      text: "Living with healthy peace and resilience",
    },
  },
];