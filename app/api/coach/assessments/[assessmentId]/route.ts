import {
  coachErrorResponse,
  fetchCoachAssessmentResult,
  requireCoachFromRequest,
} from "../../../../../lib/coach/dashboard";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const auth = await requireCoachFromRequest(request);

    if (!auth.ok) {
      return coachErrorResponse(auth);
    }

    const { assessmentId } = await context.params;

    if (!assessmentId) {
      return Response.json(
        {
          ok: false,
          error: "assessment_id_required",
          code: "assessment_id_required",
          message: "Assessment id is required.",
        },
        { status: 400 }
      );
    }

    const result = await fetchCoachAssessmentResult(auth, assessmentId);

    if (!result) {
      return Response.json(
        {
          ok: false,
          error: "assessment_unavailable",
          code: "assessment_unavailable",
          message: "Assessment result is not available for this coach.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      ok: true,
      result,
    });
  } catch (error) {
    console.error("Coach assessment result load failed", error);

    return Response.json(
      {
        ok: false,
        error: "coach_assessment_unavailable",
        code: "coach_assessment_unavailable",
        message: "Assessment result is unavailable.",
      },
      { status: 503 }
    );
  }
}
