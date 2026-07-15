import {
  coachErrorResponse,
  fetchCoachOverview,
  requireCoachFromRequest,
} from "../../../../lib/coach/dashboard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireCoachFromRequest(request);

    if (!auth.ok) {
      return coachErrorResponse(auth);
    }

    const payload = await fetchCoachOverview(auth);

    return Response.json(payload, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Coach overview load failed", error);

    return Response.json(
      {
        ok: false,
        error: "coach_overview_unavailable",
        code: "coach_overview_unavailable",
        message: "Coach overview is unavailable.",
      },
      { status: 503 }
    );
  }
}
