import {
  coachErrorResponse,
  fetchCoachMember,
  requireCoachFromRequest,
  updateCoachGrowthStatus,
  type CoachGrowthStatusInput,
} from "../../../../../../lib/coach/dashboard";

export const dynamic = "force-dynamic";

type GrowthBody = Partial<Record<keyof CoachGrowthStatusInput, unknown>>;

export async function GET(
  request: Request,
  context: { params: Promise<{ profileId: string }> }
) {
  try {
    const auth = await requireCoachFromRequest(request);

    if (!auth.ok) return coachErrorResponse(auth);

    const { profileId } = await context.params;
    const payload = profileId ? await fetchCoachMember(auth, profileId) : null;

    if (!payload) {
      return Response.json(
        { ok: false, code: "member_unavailable", message: "Member is not available." },
        { status: 404 }
      );
    }

    return Response.json({ ok: true, growthStatus: payload.growthStatus });
  } catch (error) {
    console.error("Coach growth status load failed", error);
    return Response.json(
      { ok: false, code: "growth_unavailable", message: "Growth status is unavailable." },
      { status: 503 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ profileId: string }> }
) {
  try {
    const auth = await requireCoachFromRequest(request);

    if (!auth.ok) return coachErrorResponse(auth);

    const { profileId } = await context.params;
    const body = (await request.json()) as GrowthBody;
    const result = await updateCoachGrowthStatus(auth, profileId, {
      processStage: getString(body.processStage),
      engagementStatus: getString(body.engagementStatus),
      currentFocus: getString(body.currentFocus),
      nextStep: getString(body.nextStep),
      lastContactAt: getString(body.lastContactAt),
      nextFollowUpAt: getString(body.nextFollowUpAt),
      followUpStatus: getString(body.followUpStatus),
      followUpCompletedAt: getString(body.followUpCompletedAt),
      growthSummary: getString(body.growthSummary),
      supportNeeds: getString(body.supportNeeds),
    });

    if (!result.ok) {
      return Response.json(
        { ok: false, code: "growth_invalid", message: result.message },
        { status: result.status }
      );
    }

    return Response.json(result);
  } catch (error) {
    console.error("Coach growth status update failed", error);
    return Response.json(
      { ok: false, code: "growth_save_failed", message: "Growth status could not be saved." },
      { status: 503 }
    );
  }
}

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}
