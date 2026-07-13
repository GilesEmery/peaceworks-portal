import { buildResultFromAssessmentRow } from "../../../../../lib/admin/assessmentAnalytics";
import { fetchAdminAssessmentById } from "../../../../../lib/admin/assessmentQueries";
import {
  adminErrorResponse,
  requireAdminFromRequest,
} from "../../../../../lib/admin/authorization";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ assessmentId: string }> }
) {
  const auth = await requireAdminFromRequest(request);

  if (!auth.ok) {
    return adminErrorResponse(auth);
  }

  const { assessmentId } = await context.params;

  try {
    const assessment = await fetchAdminAssessmentById(assessmentId);

    if (!assessment) {
      return Response.json(
        {
          ok: false,
          message: "Assessment result was not found.",
        },
        { status: 404 }
      );
    }

    const result = buildResultFromAssessmentRow(assessment);

    if (!result) {
      return Response.json(
        {
          ok: false,
          message: "Assessment result is incomplete.",
        },
        { status: 422 }
      );
    }

    return Response.json({
      ok: true,
      result,
    });
  } catch {
    return Response.json(
      {
        ok: false,
        message: "Assessment result is unavailable.",
      },
      { status: 503 }
    );
  }
}
