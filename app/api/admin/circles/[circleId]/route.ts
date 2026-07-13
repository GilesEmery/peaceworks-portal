import { updateAdminCircle } from "../../../../../lib/admin/userManagement";
import {
  adminErrorResponse,
  requireAdminFromRequest,
} from "../../../../../lib/admin/authorization";

export const dynamic = "force-dynamic";

type AdminCircleUpdateBody = {
  memberIds?: unknown;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ circleId: string }> }
) {
  const auth = await requireAdminFromRequest(request);

  if (!auth.ok) {
    return adminErrorResponse(auth);
  }

  const { circleId } = await context.params;

  if (!circleId) {
    return Response.json(
      {
        ok: false,
        message: "Circle id is required.",
      },
      { status: 400 }
    );
  }

  let body: AdminCircleUpdateBody;

  try {
    body = (await request.json()) as AdminCircleUpdateBody;
  } catch {
    return Response.json(
      {
        ok: false,
        message: "Request body must be valid JSON.",
      },
      { status: 400 }
    );
  }

  if (!Array.isArray(body.memberIds)) {
    return Response.json(
      {
        ok: false,
        message: "Circle members must be an array.",
      },
      { status: 400 }
    );
  }

  try {
    const result = await updateAdminCircle(circleId, {
      memberIds: body.memberIds.filter(isString),
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
    console.error("Circle roster update failed", error);

    return Response.json(
      {
        ok: false,
        message: "Circle roster could not be updated.",
      },
      { status: 503 }
    );
  }
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}
