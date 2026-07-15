import {
  coachErrorResponse,
  fetchCoachMember,
  requireCoachFromRequest,
} from "../../../../../lib/coach/dashboard";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ profileId: string }> }
) {
  try {
    const auth = await requireCoachFromRequest(request);

    if (!auth.ok) {
      return coachErrorResponse(auth);
    }

    const { profileId } = await context.params;

    if (!profileId) {
      return Response.json(
        {
          ok: false,
          error: "profile_id_required",
          code: "profile_id_required",
          message: "Profile id is required.",
        },
        { status: 400 }
      );
    }

    const payload = await fetchCoachMember(auth, profileId);

    if (!payload) {
      return Response.json(
        {
          ok: false,
          error: "member_unavailable",
          code: "member_unavailable",
          message: "Member is not available for this coach.",
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
    console.error("Coach member load failed", error);

    return Response.json(
      {
        ok: false,
        error: "coach_member_unavailable",
        code: "coach_member_unavailable",
        message: "Coach member data is unavailable.",
      },
      { status: 503 }
    );
  }
}
