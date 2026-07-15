import {
  coachErrorResponse,
  fetchCoachCircle,
  requireCoachFromRequest,
} from "../../../../../lib/coach/dashboard";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ circleId: string }> }
) {
  try {
    const auth = await requireCoachFromRequest(request);

    if (!auth.ok) {
      return coachErrorResponse(auth);
    }

    const { circleId } = await context.params;

    if (!circleId) {
      return Response.json(
        {
          ok: false,
          error: "circle_id_required",
          code: "circle_id_required",
          message: "Circle id is required.",
        },
        { status: 400 }
      );
    }

    const payload = await fetchCoachCircle(auth, circleId);

    if (!payload) {
      return Response.json(
        {
          ok: false,
          error: "circle_unavailable",
          code: "circle_unavailable",
          message: "Circle is not available for this coach.",
        },
        { status: 404 }
      );
    }

    return Response.json(payload, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Coach Circle load failed", error);

    return Response.json(
      {
        ok: false,
        error: "coach_circle_unavailable",
        code: "coach_circle_unavailable",
        message: "Coach Circle data is unavailable.",
      },
      { status: 503 }
    );
  }
}
