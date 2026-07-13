import {
  updateAdminUserLifecycle,
  type AdminLifecycleAction,
} from "../../../../../../lib/admin/userManagement";
import {
  adminErrorResponse,
  requireAdminFromRequest,
} from "../../../../../../lib/admin/authorization";

export const dynamic = "force-dynamic";

type LifecycleBody = {
  action?: unknown;
  reason?: unknown;
};

const lifecycleActions: AdminLifecycleAction[] = [
  "deactivate",
  "reactivate",
  "archive",
  "restore",
];

export async function POST(
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

  let body: LifecycleBody;

  try {
    body = (await request.json()) as LifecycleBody;
  } catch (error) {
    console.error("Admin lifecycle update failed", error);

    return Response.json(
      {
        ok: false,
        message: "Request body must be valid JSON.",
      },
      { status: 400 }
    );
  }

  if (!isLifecycleAction(body.action)) {
    return Response.json(
      {
        ok: false,
        message: "Lifecycle action is not available.",
      },
      { status: 400 }
    );
  }

  try {
    const result = await updateAdminUserLifecycle(profileId, auth.user.id, {
      action: body.action,
      reason: typeof body.reason === "string" ? body.reason : "",
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
  } catch (error) {
    console.error("Admin lifecycle update failed", error);

    return Response.json(
      {
        ok: false,
        message: "User lifecycle action could not be completed.",
      },
      { status: 503 }
    );
  }
}

function isLifecycleAction(value: unknown): value is AdminLifecycleAction {
  return (
    typeof value === "string" &&
    lifecycleActions.includes(value as AdminLifecycleAction)
  );
}
