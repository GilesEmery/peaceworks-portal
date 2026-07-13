import { fetchAdminMemberProfile } from "../../../../../lib/admin/memberProfile";
import {
  adminErrorResponse,
  requireAdminFromRequest,
} from "../../../../../lib/admin/authorization";

export const dynamic = "force-dynamic";

export async function GET(
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

  try {
    const payload = await fetchAdminMemberProfile(profileId, auth.user.id);

    if (!payload) {
      return Response.json(
        {
          ok: false,
          message: "Profile was not found.",
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
    console.error("Admin member profile load failed", error);

    return Response.json(
      {
        ok: false,
        message: "Admin member profile data is unavailable.",
      },
      { status: 503 }
    );
  }
}
