import {
  coachErrorResponse,
  requireCoachFromRequest,
} from "../../../../../../lib/coach/dashboard";
import {
  assignCoachResourceToCircle,
  fetchCoachResourcesForCircle,
  unassignCoachResourceFromCircle,
  type CoachResourceAssignmentInput,
} from "../../../../../../lib/coach/resources";

export const dynamic = "force-dynamic";

type ResourceAssignmentBody = {
  resourceId?: unknown;
  audienceType?: unknown;
  memberIds?: unknown;
};

export async function GET(
  request: Request,
  context: { params: Promise<{ circleId: string }> }
) {
  try {
    const auth = await requireCoachFromRequest(request);

    if (!auth.ok) return coachErrorResponse(auth);

    const { circleId } = await context.params;
    const payload = await fetchCoachResourcesForCircle(auth, circleId);

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
    return resourceRouteError("coach_resources_unavailable", error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ circleId: string }> }
) {
  try {
    const auth = await requireCoachFromRequest(request);

    if (!auth.ok) return coachErrorResponse(auth);

    const { circleId } = await context.params;
    const body = (await request.json()) as ResourceAssignmentBody;
    const result = await assignCoachResourceToCircle(
      auth,
      circleId,
      parseResourceAssignmentBody(body)
    );

    if (!result.ok) {
      return Response.json(
        {
          ok: false,
          error: result.code,
          code: result.code,
          message: result.message,
          details: "details" in result ? result.details : undefined,
        },
        { status: result.status }
      );
    }

    return Response.json(result);
  } catch (error) {
    return resourceRouteError("coach_resource_assignment_failed", error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ circleId: string }> }
) {
  try {
    const auth = await requireCoachFromRequest(request);
    if (!auth.ok) return coachErrorResponse(auth);

    const { circleId } = await context.params;
    const body = (await request.json()) as { assignmentId?: unknown };
    const result = await unassignCoachResourceFromCircle(
      auth,
      circleId,
      getString(body.assignmentId)
    );
    if (!result.ok) {
      return Response.json(
        { ok: false, error: result.code, code: result.code, message: result.message },
        { status: result.status }
      );
    }
    return Response.json(result);
  } catch (error) {
    return resourceRouteError("coach_resource_unassign_failed", error);
  }
}

function parseResourceAssignmentBody(
  body: ResourceAssignmentBody
): CoachResourceAssignmentInput {
  return {
    resourceId: getString(body.resourceId),
    audienceType: body.audienceType === "members" ? "members" : "circle",
    memberIds: getStringArray(body.memberIds),
  };
}

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function getStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function resourceRouteError(code: string, error: unknown) {
  console.error(code, error);
  const errorCode = getErrorCode(error) || code;

  return Response.json(
    {
      ok: false,
      error: errorCode,
      code: errorCode,
      message: "Resources are not available yet.",
      details:
        process.env.NODE_ENV === "production" ? undefined : getErrorDetail(error),
    },
    { status: 503 }
  );
}

function getErrorCode(error: unknown) {
  if (!(error instanceof Error)) return "";

  const cause =
    error.cause && typeof error.cause === "object"
      ? (error.cause as Record<string, unknown>)
      : null;

  return typeof cause?.code === "string" ? cause.code : "";
}

function getErrorDetail(error: unknown) {
  if (error instanceof Error) {
    const cause =
      error.cause && typeof error.cause === "object"
        ? (error.cause as Record<string, unknown>)
        : null;

    return [error.message, cause?.code, cause?.detail]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .join(" ");
  }

  return "";
}
