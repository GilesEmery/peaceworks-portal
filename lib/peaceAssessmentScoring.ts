import type {
  PeaceAssessmentQuestion,
  ScoreKey,
} from "../data/peaceAssessmentQuestions";

import {
  peaceAssessmentProfiles,
  type PeaceProfileContent,
} from "../data/peaceAssessmentProfiles";

export type AssessmentAnswers = Record<number, any>;

export type PeaceAssessmentScores = Record<ScoreKey, number>;

export type IdentityType = "Performance" | "Prestige" | "Prosperity";
export type ResponseType = "Push" | "Prove" | "Please" | "PullAway";
export type ProcessingStyle = "Internal" | "External";
export type CapacityStage = "Emerging" | "Developing" | "Strengthening";

export type PeaceAssessmentResult = {
  scores: PeaceAssessmentScores;
  identityType: IdentityType;
  responseType: ResponseType;
  processingStyle: ProcessingStyle;
  capacityStage: CapacityStage;
  peaceProfile: string;
  basePattern: string;
  profileContent: PeaceProfileContent;
};

export function calculatePeaceAssessmentResult(
  answers: AssessmentAnswers,
  questions: PeaceAssessmentQuestion[]
): PeaceAssessmentResult {
  const scores: PeaceAssessmentScores = {
    Performance: 0,
    Prestige: 0,
    Prosperity: 0,
    Push: 0,
    Prove: 0,
    Please: 0,
    PullAway: 0,
    Internal: 0,
    External: 0,
    PeaceCapacity: 0,
  };

  Object.entries(answers).forEach(([questionId, answer]) => {
    const question = questions.find((q) => q.id === Number(questionId));

    if (!question || !answer) return;

    if (answer.selected) {
      answer.selected.forEach((selectedAnswer: any) => {
        applyScores(scores, selectedAnswer.scores);
      });

      return;
    }

    if (answer.value !== undefined) {
      const value = Number(answer.value);

      if (question.capacity || answer.capacity) {
        scores.PeaceCapacity += 1 + (value / 100) * 3;
      } else {
        scores.Internal += (100 - value) / 20;
        scores.External += value / 20;
      }

      return;
    }

    applyScores(scores, answer.scores);
  });

  const identityType = pickTop(
    scores,
    ["Performance", "Prestige", "Prosperity"],
    answers[12]
  ) as IdentityType;

  const responseType = pickTop(
    scores,
    ["Push", "Prove", "Please", "PullAway"],
    answers[24]
  ) as ResponseType;

  const processingStyle: ProcessingStyle =
    scores.External >= scores.Internal ? "External" : "Internal";

  const capacityStage = getCapacityStage(scores.PeaceCapacity);

  const profileKey = `${identityType}|${responseType}|${processingStyle}`;

  const fallbackKey = "Performance|Prove|Internal";

  const profileContent =
    peaceAssessmentProfiles[profileKey] ?? peaceAssessmentProfiles[fallbackKey];

  return {
    scores,
    identityType,
    responseType,
    processingStyle,
    capacityStage,
    peaceProfile: profileContent.profileName,
    basePattern: profileContent.baseName,
    profileContent,
  };
}

function applyScores(
  scores: PeaceAssessmentScores,
  scoreObj: Partial<Record<ScoreKey, number>> = {}
) {
  Object.entries(scoreObj).forEach(([key, value]) => {
    scores[key as ScoreKey] += Number(value);
  });
}

function pickTop<T extends ScoreKey>(
  scores: PeaceAssessmentScores,
  keys: T[],
  tieBreakerAnswer?: any
): T {
  const values = keys.map((key) => ({
    key,
    value: scores[key],
  }));

  const max = Math.max(...values.map((item) => item.value));

  const tied = values
    .filter((item) => item.value === max)
    .map((item) => item.key);

  if (tied.length === 1) return tied[0];

  if (tieBreakerAnswer?.scores) {
    const tieBreakerKey = Object.keys(tieBreakerAnswer.scores).find((key) =>
      tied.includes(key as T)
    );

    if (tieBreakerKey) return tieBreakerKey as T;
  }

  return tied[0];
}

function getCapacityStage(score: number): CapacityStage {
  if (score <= 13) return "Emerging";
  if (score <= 21) return "Developing";
  return "Strengthening";
}