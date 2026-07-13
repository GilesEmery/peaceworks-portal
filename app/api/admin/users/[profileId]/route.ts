import {
  deleteAdminManagedUser,
  updateAdminManagedUser,
  type AdminProfileUpdate,
  type AdminRoleName,
} from "../../../../../lib/admin/userManagement";
import {
  adminErrorResponse,
  requireAdminFromRequest,
} from "../../../../../lib/admin/authorization";

export const dynamic = "force-dynamic";

type AdminUserUpdateBody = {
  profile?: unknown;
  roleNames?: unknown;
  circleIds?: unknown;
  coachIds?: unknown;
};

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

  let body: AdminUserUpdateBody;

  try {
    body = (await request.json()) as AdminUserUpdateBody;
  } catch (error) {
    console.error("Admin user access update failed", error);

    return Response.json(
      {
        ok: false,
        message: "Request body must be valid JSON.",
      },
      { status: 400 }
    );
  }

  if (
    !isProfileBody(body.profile) ||
    !Array.isArray(body.roleNames) ||
    !Array.isArray(body.circleIds) ||
    !Array.isArray(body.coachIds)
  ) {
    return Response.json(
      {
        ok: false,
        message: "Profile, roles, Circles, and coaches must be valid.",
      },
      { status: 400 }
    );
  }

  try {
    const result = await updateAdminManagedUser(profileId, {
      profile: body.profile,
      roleNames: body.roleNames.filter(isString) as AdminRoleName[],
      circleIds: body.circleIds.filter(isString),
      coachIds: body.coachIds.filter(isString),
    });

    if (!result.ok) {
      return Response.json(
        {
          ok: false,
          message: result.message,
        },
        { status: result.status }
      );
    }

    return Response.json(result);
  } catch {
    return Response.json(
      {
        ok: false,
        message: "User access could not be updated.",
      },
      { status: 503 }
    );
  }
}

export async function DELETE(
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
    const result = await deleteAdminManagedUser(profileId, auth.user.id);

    if (!result.ok) {
      return Response.json(
        {
          ok: false,
          message: result.message,
        },
        { status: result.status }
      );
    }

    return Response.json(result);
  } catch (error) {
    console.error("Admin user delete failed", error);

    return Response.json(
      {
        ok: false,
        message: "User account could not be permanently deleted.",
      },
      { status: 503 }
    );
  }
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isProfileBody(value: unknown): value is AdminProfileUpdate {
  if (!value || typeof value !== "object") return false;

  const profile = value as Record<string, unknown>;

  return (
    typeof profile.firstName === "string" &&
    typeof profile.lastName === "string" &&
    typeof profile.organization === "string" &&
    typeof profile.jobTitle === "string" &&
    typeof profile.timezone === "string"
  );
}
