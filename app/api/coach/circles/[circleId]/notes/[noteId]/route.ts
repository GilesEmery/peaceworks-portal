import {
  coachErrorResponse,
  deleteCoachCircleNote,
  requireCoachFromRequest,
  updateCoachCircleNote,
  type CoachCircleNoteInput,
} from "../../../../../../../lib/coach/dashboard";

export const dynamic = "force-dynamic";

type NoteBody = Partial<Record<keyof CoachCircleNoteInput, unknown>>;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ circleId: string; noteId: string }> }
) {
  try {
    const auth = await requireCoachFromRequest(request);

    if (!auth.ok) return coachErrorResponse(auth);

    const { circleId, noteId } = await context.params;
    const body = (await request.json()) as NoteBody;
    const result = await updateCoachCircleNote(auth, circleId, noteId, {
      noteType: getString(body.noteType),
      body: getString(body.body),
      visibility: getString(body.visibility),
      audienceType: getString(body.audienceType),
      recipientIds: getStringArray(body.recipientIds),
      links: getLinks(body.links),
      meetingDate: getString(body.meetingDate),
      followUpAt: getString(body.followUpAt),
    });

    if (!result.ok) {
      return Response.json(
        {
          ok: false,
          error: "circle_note_update_failed",
          code: result.code,
          message: result.message,
          details: result.details,
          hint: result.hint,
        },
        { status: result.status }
      );
    }

    return Response.json(result);
  } catch (error) {
    console.error("Coach Circle note update failed", error);
    return Response.json(
      {
        ok: false,
        error: "circle_note_update_failed",
        code: "unexpected_error",
        message: "Circle note could not be updated.",
      },
      { status: 503 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ circleId: string; noteId: string }> }
) {
  try {
    const auth = await requireCoachFromRequest(request);

    if (!auth.ok) return coachErrorResponse(auth);

    const { circleId, noteId } = await context.params;
    const result = await deleteCoachCircleNote(auth, circleId, noteId);

    if (!result.ok) {
      return Response.json(
        {
          ok: false,
          error: "circle_note_delete_failed",
          code: result.code,
          message: result.message,
          details: result.details,
          hint: result.hint,
        },
        { status: result.status }
      );
    }

    return Response.json(result);
  } catch (error) {
    console.error("Coach Circle note delete failed", error);
    return Response.json(
      {
        ok: false,
        error: "circle_note_delete_failed",
        code: "unexpected_error",
        message: "Circle note could not be deleted.",
      },
      { status: 503 }
    );
  }
}

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function getStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function getLinks(value: unknown): CoachCircleNoteInput["links"] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      id: getString(item.id),
      label: getString(item.label),
      url: getString(item.url),
      sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : undefined,
    }));
}
