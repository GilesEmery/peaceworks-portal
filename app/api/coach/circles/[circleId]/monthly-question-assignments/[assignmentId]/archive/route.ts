import {
  coachErrorResponse,
  requireCoachFromRequest,
} from "../../../../../../../../lib/coach/dashboard";
import { archiveCoachMonthlyQuestionAssignment } from "../../../../../../../../lib/coach/monthlyQuestions";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ circleId: string; assignmentId: string }> }
) {
  try {
    const auth = await requireCoachFromRequest(request);

    if (!auth.ok) return coachErrorResponse(auth);

    const { circleId, assignmentId } = await context.params;
    const result = await archiveCoachMonthlyQuestionAssignment(
      auth,
      circleId,
      assignmentId
    );

    if (!result.ok) {
      return Response.json(
        {
          ok: false,
          error: "monthly_question_assignment_archive_failed",
          code: result.code,
          message: result.message,
        },
        { status: result.status }
      );
    }

    return Response.json(result);
  } catch (error) {
    console.error("monthly_question_assignment_archive_failed", error);
    return Response.json(
      {
        ok: false,
        error: "monthly_question_assignment_archive_failed",
        code: "monthly_question_assignment_archive_failed",
        message: "Monthly Question assignment could not be archived.",
      },
      { status: 503 }
    );
  }
}
