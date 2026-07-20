export const monthlyQuestionReflectionMaxLength = 20000;

export type MonthlyQuestionReflectionRow = {
  id: string;
  profile_id: string;
  content_assignment_id: string;
  monthly_question_id: string;
  reflection_body: string;
  created_at: string;
  updated_at: string;
};

export type MonthlyQuestionReflectionResponse = {
  ok: true;
  reflection: {
    id: string | null;
    assignmentId: string;
    monthlyQuestionId: string;
    body: string;
    createdAt: string | null;
    updatedAt: string | null;
  };
};

export type MonthlyQuestionReflectionSavePayload = {
  reflectionBody: string;
};

export type CoachMonthlyQuestionReflection = {
  id: string;
  assignmentId: string;
  monthlyQuestionId: string;
  question: string;
  title: string;
  theme: string;
  category: string;
  questionMonth: number | null;
  questionYear: number | null;
  circle: { id: string; name: string } | null;
  audienceType: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};
