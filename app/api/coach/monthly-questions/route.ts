import {
  coachErrorResponse,
  requireCoachFromRequest,
} from "../../../../lib/coach/dashboard";
import {
  assignCoachMonthlyQuestion,
  fetchCoachMonthlyQuestions,
  type CoachMonthlyQuestionAssignmentInput,
} from "../../../../lib/coach/monthlyQuestions";

export const dynamic = "force-dynamic";

type QuestionBody = Partial<Record<keyof CoachMonthlyQuestionAssignmentInput, unknown>>;

export async function GET(request: Request) {
  try {
    const auth = await requireCoachFromRequest(request);

    if (!auth.ok) return coachErrorResponse(auth);

    return Response.json(await fetchCoachMonthlyQuestions(auth), {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return monthlyQuestionRouteError("monthly_questions_unavailable", error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireCoachFromRequest(request);

    if (!auth.ok) return coachErrorResponse(auth);

    const body = (await request.json()) as QuestionBody;
    const result = await assignCoachMonthlyQuestion(auth, parseQuestionBody(body));

    if (!result.ok) {
      return Response.json(
        {
          ok: false,
          error: "monthly_question_assignment_failed",
          code: result.code,
          message: result.message,
        },
        { status: result.status }
      );
    }

    return Response.json(result);
  } catch (error) {
    return monthlyQuestionRouteError("monthly_question_assignment_failed", error);
  }
}

function parseQuestionBody(body: QuestionBody): CoachMonthlyQuestionAssignmentInput {
  return {
    questionId: getString(body.questionId),
    circleIds: getStringArray(body.circleIds),
    coachIntroduction: getString(body.coachIntroduction),
  };
}

function monthlyQuestionRouteError(code: string, error: unknown) {
  console.error(code, error);
  const errorCode = getErrorCode(error) || code;

  return Response.json(
    {
      ok: false,
      error: errorCode,
      code: errorCode,
      message: "Monthly questions are not available yet.",
      details:
        process.env.NODE_ENV === "production" ? undefined : getErrorDetail(error),
    },
    { status: 503 }
  );
}

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function getStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function getErrorDetail(error: unknown) {
  if (error instanceof Error) {
    const cause =
      error.cause && typeof error.cause === "object"
        ? (error.cause as Record<string, unknown>)
        : null;

    return [error.message, cause?.code, cause?.detail]
      .filter(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0
      )
      .join(" ");
  }

  return "";
}

function getErrorCode(error: unknown) {
  if (!(error instanceof Error)) return "";

  const cause =
    error.cause && typeof error.cause === "object"
      ? (error.cause as Record<string, unknown>)
      : null;

  return typeof cause?.code === "string" ? cause.code : "";
}
