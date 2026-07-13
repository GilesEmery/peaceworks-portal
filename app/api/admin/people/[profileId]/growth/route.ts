import {
  updateAdminGrowthStatus,
  type AdminGrowthStatusUpdate,
} from "../../../../../../lib/admin/memberProfile";
import {
  adminErrorResponse,
  requireAdminFromRequest,
} from "../../../../../../lib/admin/authorization";

export const dynamic = "force-dynamic";

type GrowthBody = Partial<Record<keyof AdminGrowthStatusUpdate, unknown>>;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ profileId: string }> }
) {
  const auth = await requireAdminFromRequest(request);

  if (!auth.ok) {
    return adminErrorResponse(auth);
  }

  const { profileId } = await context.params;

  if (!profileId) {
    return Response.json(
      {
        ok: false,
        message: "Profile id is required.",
      },
      { status: 400 }
    );
  }

  let body: GrowthBody;

  try {
    body = (await request.json()) as GrowthBody;
  } catch (error) {
    console.error("Admin growth status update failed", error);

    return Response.json(
      {
        ok: false,
        message: "Request body must be valid JSON.",
      },
      { status: 400 }
    );
  }

  try {
    const result = await updateAdminGrowthStatus(profileId, auth.user.id, {
      processStage: getString(body.processStage),
      engagementStatus: getString(body.engagementStatus),
      currentFocus: getString(body.currentFocus),
      nextStep: getString(body.nextStep),
      lastContactAt: getString(body.lastContactAt),
      nextFollowUpAt: getString(body.nextFollowUpAt),
      growthSummary: getString(body.growthSummary),
      supportNeeds: getString(body.supportNeeds),
    });

    return Response.json(result);
  } catch (error) {
    console.error("Admin growth status update failed", error);

    return Response.json(
      {
        ok: false,
        message: "Growth status could not be saved.",
      },
      { status: 503 }
    );
  }
}

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}
